import { type Color, Hsv, LabToHcl } from './colors';
import { getDefaultGlobalRand, type RandInterface } from './rand';
import { SoftPaletteExWithRand } from './soft_palettegen';

// Uses the HSV color space to generate colors with similar S,V but distributed
// evenly along their Hue. This is fast but not always pretty.
// If you've got time to spare, use Lab (the non-fast below).
export function FastHappyPaletteWithRand(colorsCount: number, rand: RandInterface): Color[] {
  const colors: Color[] = new Array(colorsCount);

  for (let i = 0; i < colorsCount; i++) {
    colors[i] = Hsv(
      i * (360.0 / colorsCount),
      0.8 + rand.float64() * 0.2,
      0.65 + rand.float64() * 0.2
    );
  }
  return colors;
}

export function FastHappyPalette(colorsCount: number): Color[] {
  return FastHappyPaletteWithRand(colorsCount, getDefaultGlobalRand());
}

export function HappyPaletteWithRand(
  colorsCount: number,
  rand: RandInterface
): [Color[], Error | null] {
  const pimpy = (l: number, a: number, b: number): boolean => {
    const [, c] = LabToHcl(l, a, b);
    return 0.3 <= c && 0.4 <= l && l <= 0.8;
  };
  return SoftPaletteExWithRand(
    colorsCount,
    { CheckColor: pimpy, Iterations: 50, ManySamples: true },
    rand
  );
}

export function HappyPalette(colorsCount: number): [Color[], Error | null] {
  return HappyPaletteWithRand(colorsCount, getDefaultGlobalRand());
}
