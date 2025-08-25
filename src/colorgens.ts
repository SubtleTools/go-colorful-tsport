// Various ways to generate single random colors

import { type Color, Hcl, Hsv } from './colors';
import { getDefaultGlobalRand, type RandInterface } from './rand';

// Creates a random dark, "warm" color through a restricted HSV space.
export function FastWarmColorWithRand(rand: RandInterface): Color {
  return Hsv(rand.float64() * 360.0, 0.5 + rand.float64() * 0.3, 0.3 + rand.float64() * 0.3);
}

export function FastWarmColor(): Color {
  return FastWarmColorWithRand(getDefaultGlobalRand());
}

// Creates a random dark, "warm" color through restricted HCL space.
// This is slower than FastWarmColor but will likely give you colors which have
// the same "warmness" if you run it many times.
export function WarmColorWithRand(rand: RandInterface): Color {
  let c: Color;
  do {
    c = randomWarmWithRand(rand);
  } while (!c.IsValid());
  return c;
}

export function WarmColor(): Color {
  return WarmColorWithRand(getDefaultGlobalRand());
}

function randomWarmWithRand(rand: RandInterface): Color {
  return Hcl(rand.float64() * 360.0, 0.1 + rand.float64() * 0.3, 0.2 + rand.float64() * 0.3);
}

// Creates a random bright, "pimpy" color through a restricted HSV space.
export function FastHappyColorWithRand(rand: RandInterface): Color {
  return Hsv(rand.float64() * 360.0, 0.7 + rand.float64() * 0.3, 0.6 + rand.float64() * 0.3);
}

export function FastHappyColor(): Color {
  return FastHappyColorWithRand(getDefaultGlobalRand());
}

// Creates a random bright, "pimpy" color through restricted HCL space.
// This is slower than FastHappyColor but will likely give you colors which
// have the same "brightness" if you run it many times.
export function HappyColorWithRand(rand: RandInterface): Color {
  let c: Color;
  do {
    c = randomPimpWithRand(rand);
  } while (!c.IsValid());
  return c;
}

export function HappyColor(): Color {
  return HappyColorWithRand(getDefaultGlobalRand());
}

function randomPimpWithRand(rand: RandInterface): Color {
  return Hcl(rand.float64() * 360.0, 0.5 + rand.float64() * 0.3, 0.5 + rand.float64() * 0.3);
}
