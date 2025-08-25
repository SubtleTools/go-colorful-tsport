// Largely inspired by the descriptions in http://lab.medialab.sciences-po.fr/iwanthue/
// but written from scratch.

import { type Color, Lab } from './colors';
import type { RandInterface } from './rand';

// The algorithm works in L*a*b* color space and converts to RGB in the end.
// L* in [0..1], a* and b* in [-1..1]
class lab_t {
  L: number;
  A: number;
  B: number;

  constructor(L: number, A: number, B: number) {
    this.L = L;
    this.A = A;
    this.B = B;
  }
}

export interface SoftPaletteSettings {
  // A function which can be used to restrict the allowed color-space.
  CheckColor?: (l: number, a: number, b: number) => boolean;

  // The higher, the better quality but the slower. Usually two figures.
  Iterations: number;

  // Use up to 160000 or 8000 samples of the L*a*b* space (and thus calls to CheckColor).
  // Set this to true only if your CheckColor shapes the Lab space weirdly.
  ManySamples: boolean;
}

// Yeah, windows-stype Foo, FooEx, screw you golang...
// Uses K-means to cluster the color-space and return the means of the clusters
// as a new palette of distinctive colors. Falls back to K-medoid if the mean
// happens to fall outside of the color-space, which can only happen if you
// specify a CheckColor function.
export function SoftPaletteExWithRand(
  colorsCount: number,
  settings: SoftPaletteSettings,
  rand: RandInterface
): [Color[], Error | null] {
  // Checks whether it's a valid RGB and also fulfills the potentially provided constraint.
  const check = (col: lab_t): boolean => {
    const c = Lab(col.L, col.A, col.B);
    return (
      c.IsValid() && (settings.CheckColor === undefined || settings.CheckColor(col.L, col.A, col.B))
    );
  };

  // Sample the color space. These will be the points k-means is run on.
  let dl = 0.05;
  let dab = 0.1;
  if (settings.ManySamples) {
    dl = 0.01;
    dab = 0.05;
  }

  const samples: lab_t[] = [];

  for (let l = 0.0; l <= 1.0; l += dl) {
    for (let a = -1.0; a <= 1.0; a += dab) {
      for (let b = -1.0; b <= 1.0; b += dab) {
        const labColor = new lab_t(l, a, b);
        if (check(labColor)) {
          samples.push(labColor);
        }
      }
    }
  }

  // That would cause some infinite loops down there...
  if (samples.length < colorsCount) {
    return [
      [],
      new Error(
        `palettegen: more colors requested (${colorsCount}) than samples available (${samples.length}). Your requested color count may be wrong, you might want to use many samples or your constraint function makes the valid color space too small`
      ),
    ];
  } else if (samples.length === colorsCount) {
    return [labs2cols(samples), null]; // Oops?
  }

  // We take the initial means out of the samples, so they are in fact medoids.
  // This helps us avoid infinite loops or arbitrary cutoffs with too restrictive constraints.
  const means: lab_t[] = new Array(colorsCount);
  for (let i = 0; i < colorsCount; i++) {
    do {
      means[i] = samples[rand.intn(samples.length)];
    } while (inArray(means, i, means[i]));
  }

  const clusters: number[] = new Array(samples.length);
  const samples_used: boolean[] = new Array(samples.length);

  // The actual k-means/medoid iterations
  for (let i = 0; i < settings.Iterations; i++) {
    // Reassigning the samples to clusters, i.e. to their closest mean.
    // By the way, also check if any sample is used as a medoid and if so, mark that.
    for (let isample = 0; isample < samples.length; isample++) {
      const sample = samples[isample];
      samples_used[isample] = false;
      let mindist = Number.POSITIVE_INFINITY;
      for (let imean = 0; imean < means.length; imean++) {
        const mean = means[imean];
        const dist = lab_dist(sample, mean);
        if (dist < mindist) {
          mindist = dist;
          clusters[isample] = imean;
        }

        // Mark samples which are used as a medoid.
        if (lab_eq(sample, mean)) {
          samples_used[isample] = true;
        }
      }
    }

    // Compute new means according to the samples.
    for (let imean = 0; imean < means.length; imean++) {
      // The new mean is the average of all samples belonging to it.
      let nsamples = 0;
      let newmean = new lab_t(0.0, 0.0, 0.0);
      for (let isample = 0; isample < samples.length; isample++) {
        const sample = samples[isample];
        if (clusters[isample] === imean) {
          nsamples++;
          newmean.L += sample.L;
          newmean.A += sample.A;
          newmean.B += sample.B;
        }
      }
      if (nsamples > 0) {
        newmean.L /= nsamples;
        newmean.A /= nsamples;
        newmean.B /= nsamples;
      } else {
        // That mean doesn't have any samples? Get a new mean from the sample list!
        let inewmean: number;
        do {
          inewmean = rand.intn(samples_used.length);
        } while (samples_used[inewmean]);
        newmean = samples[inewmean];
        samples_used[inewmean] = true;
      }

      // But now we still need to check whether the new mean is an allowed color.
      if (nsamples > 0 && check(newmean)) {
        // It does, life's good (TM)
        means[imean] = newmean;
      } else {
        // New mean isn't an allowed color or doesn't have any samples!
        // Switch to medoid mode and pick the closest (unused) sample.
        // This should always find something thanks to len(samples) >= colorsCount
        let mindist = Number.POSITIVE_INFINITY;
        for (let isample = 0; isample < samples.length; isample++) {
          const sample = samples[isample];
          if (!samples_used[isample]) {
            const dist = lab_dist(sample, newmean);
            if (dist < mindist) {
              mindist = dist;
              newmean = sample;
            }
          }
        }
        means[imean] = newmean;
      }
    }
  }
  return [labs2cols(means), null];
}

export function SoftPaletteEx(
  colorsCount: number,
  settings: SoftPaletteSettings
): [Color[], Error | null] {
  return SoftPaletteExWithRand(colorsCount, settings, getDefaultGlobalRand());
}

// A wrapper which uses common parameters.
export function SoftPaletteWithRand(
  colorsCount: number,
  rand: RandInterface
): [Color[], Error | null] {
  return SoftPaletteExWithRand(colorsCount, { Iterations: 50, ManySamples: false }, rand);
}

export function SoftPalette(colorsCount: number): [Color[], Error | null] {
  return SoftPaletteWithRand(colorsCount, getDefaultGlobalRand());
}

function inArray(haystack: lab_t[], upto: number, needle: lab_t): boolean {
  for (let i = 0; i < upto && i < haystack.length; i++) {
    if (lab_eq(haystack[i], needle)) {
      return true;
    }
  }
  return false;
}

const LAB_DELTA = 1e-6;

function lab_eq(lab1: lab_t, lab2: lab_t): boolean {
  return (
    Math.abs(lab1.L - lab2.L) < LAB_DELTA &&
    Math.abs(lab1.A - lab2.A) < LAB_DELTA &&
    Math.abs(lab1.B - lab2.B) < LAB_DELTA
  );
}

// That's faster than using colorful's DistanceLab since we would have to
// convert back and forth for that. Here is no conversion.
function lab_dist(lab1: lab_t, lab2: lab_t): number {
  return Math.sqrt(sq(lab1.L - lab2.L) + sq(lab1.A - lab2.A) + sq(lab1.B - lab2.B));
}

function labs2cols(labs: lab_t[]): Color[] {
  const cols: Color[] = new Array(labs.length);
  for (let k = 0; k < labs.length; k++) {
    const v = labs[k];
    cols[k] = Lab(v.L, v.A, v.B);
  }
  return cols;
}

function sq(v: number): number {
  return v * v;
}

// Need to import this function
import { getDefaultGlobalRand } from './rand';
