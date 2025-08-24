/**
 * Palette generation functions
 */

import { type Color, hsv, lab, labToHcl } from './color';
import { getDefaultGlobalRand, type RandInterface } from './rand';
import { sq } from './utils';

// Fast palette generation using HSV

// Uses the HSV color space to generate colors with similar S,V but distributed
// evenly along their Hue. This is fast but not always pretty.
export const FastHappyPaletteWithRand = (colorsCount: number, rand: RandInterface): Color[] => {
  const colors: Color[] = [];
  for (let i = 0; i < colorsCount; i++) {
    colors.push(
      hsv(i * (360.0 / colorsCount), 0.8 + rand.float64() * 0.2, 0.65 + rand.float64() * 0.2)
    );
  }
  return colors;
};

export const FastHappyPalette = (colorsCount: number): Color[] => {
  return FastHappyPaletteWithRand(colorsCount, getDefaultGlobalRand());
};

export const HappyPaletteWithRand = (
  colorsCount: number,
  rand: RandInterface
): [Color[], Error | null] => {
  const pimpy = (l: number, a: number, b: number): boolean => {
    const [, c] = labToHcl(l, a, b);
    return 0.3 <= c && 0.4 <= l && l <= 0.8;
  };
  return SoftPaletteExWithRand(
    colorsCount,
    { checkColor: pimpy, iterations: 50, manySamples: true },
    rand
  );
};

export const HappyPalette = (colorsCount: number): [Color[], Error | null] => {
  return HappyPaletteWithRand(colorsCount, getDefaultGlobalRand());
};

// Uses the HSV color space to generate colors with similar S,V but distributed
// evenly along their Hue. This is fast but not always pretty.
export const FastWarmPaletteWithRand = (colorsCount: number, rand: RandInterface): Color[] => {
  const colors: Color[] = [];
  for (let i = 0; i < colorsCount; i++) {
    colors.push(
      hsv(i * (360.0 / colorsCount), 0.55 + rand.float64() * 0.2, 0.35 + rand.float64() * 0.2)
    );
  }
  return colors;
};

export const FastWarmPalette = (colorsCount: number): Color[] => {
  return FastWarmPaletteWithRand(colorsCount, getDefaultGlobalRand());
};

export const WarmPaletteWithRand = (
  colorsCount: number,
  rand: RandInterface
): [Color[], Error | null] => {
  const warmy = (l: number, a: number, b: number): boolean => {
    const [, c] = labToHcl(l, a, b);
    return 0.1 <= c && c <= 0.4 && 0.2 <= l && l <= 0.5;
  };
  return SoftPaletteExWithRand(
    colorsCount,
    { checkColor: warmy, iterations: 50, manySamples: true },
    rand
  );
};

export const WarmPalette = (colorsCount: number): [Color[], Error | null] => {
  return WarmPaletteWithRand(colorsCount, getDefaultGlobalRand());
};

// Soft palette generation using K-means

// The algorithm works in L*a*b* color space and converts to RGB in the end.
class LabT {
  constructor(
    public L: number,
    public A: number,
    public B: number
  ) {}
}

export interface SoftPaletteSettings {
  // A function which can be used to restrict the allowed color-space.
  checkColor?: (l: number, a: number, b: number) => boolean;

  // The higher, the better quality but the slower. Usually two figures.
  iterations: number;

  // Use up to 160000 or 8000 samples of the L*a*b* space (and thus calls to CheckColor).
  // Set this to true only if your CheckColor shapes the Lab space weirdly.
  manySamples: boolean;
}

// Uses K-means to cluster the color-space and return the means of the clusters
// as a new palette of distinctive colors. Falls back to K-medoid if the mean
// happens to fall outside of the color-space, which can only happen if you
// specify a CheckColor function.
export const SoftPaletteExWithRand = (
  colorsCount: number,
  settings: SoftPaletteSettings,
  rand: RandInterface
): [Color[], Error | null] => {
  // Checks whether it's a valid RGB and also fulfills the potentially provided constraint.
  const check = (col: LabT): boolean => {
    const c = lab(col.L, col.A, col.B);
    return (
      c.isValid() && (settings.checkColor === undefined || settings.checkColor(col.L, col.A, col.B))
    );
  };

  // Sample the color space. These will be the points k-means is run on.
  let dl = 0.05;
  let dab = 0.1;
  if (settings.manySamples) {
    dl = 0.01;
    dab = 0.05;
  }

  const samples: LabT[] = [];
  for (let l = 0.0; l <= 1.0; l += dl) {
    for (let a = -1.0; a <= 1.0; a += dab) {
      for (let b = -1.0; b <= 1.0; b += dab) {
        const labColor = new LabT(l, a, b);
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
  const means: LabT[] = [];
  for (let i = 0; i < colorsCount; i++) {
    let newMean: LabT;
    do {
      newMean = samples[rand.intn(samples.length)];
    } while (inArray(means, i, newMean));
    means.push(newMean);
  }

  const clusters: number[] = new Array(samples.length);
  const samplesUsed: boolean[] = new Array(samples.length);

  // The actual k-means/medoid iterations
  for (let i = 0; i < settings.iterations; i++) {
    // Reassigning the samples to clusters, i.e. to their closest mean.
    // By the way, also check if any sample is used as a medoid and if so, mark that.
    for (let isample = 0; isample < samples.length; isample++) {
      const sample = samples[isample];
      samplesUsed[isample] = false;
      let mindist = Number.POSITIVE_INFINITY;
      for (let imean = 0; imean < means.length; imean++) {
        const mean = means[imean];
        const dist = labDist(sample, mean);
        if (dist < mindist) {
          mindist = dist;
          clusters[isample] = imean;
        }

        // Mark samples which are used as a medoid.
        if (labEq(sample, mean)) {
          samplesUsed[isample] = true;
        }
      }
    }

    // Compute new means according to the samples.
    for (let imean = 0; imean < means.length; imean++) {
      // The new mean is the average of all samples belonging to it.
      let nsamples = 0;
      let newmean = new LabT(0.0, 0.0, 0.0);
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
          inewmean = rand.intn(samplesUsed.length);
        } while (samplesUsed[inewmean]);
        newmean = samples[inewmean];
        samplesUsed[inewmean] = true;
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
          if (!samplesUsed[isample]) {
            const dist = labDist(sample, newmean);
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
};

export const SoftPaletteEx = (
  colorsCount: number,
  settings: SoftPaletteSettings
): [Color[], Error | null] => {
  return SoftPaletteExWithRand(colorsCount, settings, getDefaultGlobalRand());
};

// A wrapper which uses common parameters.
export const SoftPaletteWithRand = (
  colorsCount: number,
  rand: RandInterface
): [Color[], Error | null] => {
  return SoftPaletteExWithRand(colorsCount, { iterations: 50, manySamples: false }, rand);
};

export const SoftPalette = (colorsCount: number): [Color[], Error | null] => {
  return SoftPaletteWithRand(colorsCount, getDefaultGlobalRand());
};

// Helper functions

const inArray = (haystack: LabT[], upto: number, needle: LabT): boolean => {
  for (let i = 0; i < upto && i < haystack.length; i++) {
    if (labEq(haystack[i], needle)) {
      return true;
    }
  }
  return false;
};

const LAB_DELTA = 1e-6;

const labEq = (lab1: LabT, lab2: LabT): boolean => {
  return (
    Math.abs(lab1.L - lab2.L) < LAB_DELTA &&
    Math.abs(lab1.A - lab2.A) < LAB_DELTA &&
    Math.abs(lab1.B - lab2.B) < LAB_DELTA
  );
};

// That's faster than using colorful's DistanceLab since we would have to
// convert back and forth for that. Here is no conversion.
const labDist = (lab1: LabT, lab2: LabT): number => {
  return Math.sqrt(sq(lab1.L - lab2.L) + sq(lab1.A - lab2.A) + sq(lab1.B - lab2.B));
};

const labs2cols = (labs: LabT[]): Color[] => {
  return labs.map((v) => lab(v.L, v.A, v.B));
};
