import { Color } from './colors';
import { Hsv, LabToHcl } from './colors';
import { getDefaultGlobalRand, RandInterface } from './rand';
import { SoftPaletteExWithRand, SoftPaletteSettings } from './soft_palettegen';

// Uses the HSV color space to generate colors with similar S,V but distributed
// evenly along their Hue. This is fast but not always pretty.
// If you've got time to spare, use Lab (the non-fast below).
export function FastWarmPaletteWithRand(colorsCount: number, rand: RandInterface): Color[] {
  const colors: Color[] = new Array(colorsCount);

  for (let i = 0; i < colorsCount; i++) {
    colors[i] = Hsv(i * (360.0 / colorsCount), 0.55 + rand.float64() * 0.2, 0.35 + rand.float64() * 0.2);
  }
  return colors;
}

export function FastWarmPalette(colorsCount: number): Color[] {
  return FastWarmPaletteWithRand(colorsCount, getDefaultGlobalRand());
}

export function WarmPaletteWithRand(colorsCount: number, rand: RandInterface): [Color[], Error | null] {
  const warmy = (l: number, a: number, b: number): boolean => {
    const [, c] = LabToHcl(l, a, b);
    return 0.1 <= c && c <= 0.4 && 0.2 <= l && l <= 0.5;
  };
  return SoftPaletteExWithRand(colorsCount, { CheckColor: warmy, Iterations: 50, ManySamples: true }, rand);
}

export function WarmPalette(colorsCount: number): [Color[], Error | null] {
  return WarmPaletteWithRand(colorsCount, getDefaultGlobalRand());
}