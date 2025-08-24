/**
 * A TypeScript port of the go-colorful package for working with colors.
 *
 * Provides all kinds of functions for working with colors, including:
 * - Color space conversions (RGB, HSL, HSV, Lab, Luv, HCL, XYZ, etc.)
 * - Color distance calculations
 * - Color blending in various spaces
 * - Color generation (warm, happy colors)
 * - Palette generation
 * - Color sorting
 * - HSLuv color space support
 */

import { Color } from './color';
import {
  FastLinearRgb,
  HCL,
  HclWhiteRef,
  Hex,
  HPLuv,
  HSL,
  HSLuv,
  HSV,
  Lab,
  LabWhiteRef,
  LinearRgb,
  Luv,
  LuvLCh,
  LuvLChWhiteRef,
  LuvWhiteRef,
  OkLab,
  OkLch,
  XYY,
  XYZ,
} from './constructors';

// Constants
export { D50, D65, Delta } from './constants';
// Color generation
export {
  FastHappyColor,
  FastHappyColorWithRand,
  FastWarmColor,
  FastWarmColorWithRand,
  HappyColor,
  HappyColorWithRand,
  WarmColor,
  WarmColorWithRand,
} from './generators';
export { HexColor, ErrUnsupportedType } from './hexcolor';
export type { SoftPaletteSettings } from './palettes';
// Palette generation
export {
  FastHappyPalette,
  FastHappyPaletteWithRand,
  FastWarmPalette,
  FastWarmPaletteWithRand,
  HappyPalette,
  HappyPaletteWithRand,
  SoftPalette,
  SoftPaletteEx,
  SoftPaletteExWithRand,
  SoftPaletteWithRand,
  WarmPalette,
  WarmPaletteWithRand,
} from './palettes';
// Types and interfaces
export type { RandInterface } from './rand';
// Color sorting
export { Sorted } from './sort';

// Main Color class and constructors
export {
  Color,
  Hex,
  HSL,
  HSV,
  Lab,
  LabWhiteRef,
  Luv,
  LuvWhiteRef,
  HCL,
  HclWhiteRef,
  LuvLCh,
  LuvLChWhiteRef,
  XYZ,
  XYY,
  LinearRgb,
  FastLinearRgb,
  OkLab,
  OkLch,
  HSLuv,
  HPLuv,
};

// Helper functions
export { MakeColor } from './color';

// Go-style API (optional import for Go-like syntax)
export * as GoStyle from './go-style';
