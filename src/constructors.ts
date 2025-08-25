/**
 * Constructor functions for creating colors from various color spaces
 */

import {
  Color,
  fastLinearRgb,
  hcl,
  hclWhiteRef,
  hpLuv,
  hsLuv,
  hsl,
  hsv,
  lab,
  labWhiteRef,
  linearRgb,
  luv,
  luvLCh,
  luvLChWhiteRef,
  luvWhiteRef,
  okLab,
  okLch,
  xyy,
  xyz,
} from './color';

// Hex parses a "html" hex color-string, either in the 3 "#f0c" or 6 "#ff1034" digits form.
export const Hex = (scol: string): Color => {
  let factor: number;
  let r: number, g: number, b: number;

  if (scol.length === 4) {
    // 3-digit format: "#123" -> each digit represents 4 bits
    factor = 1.0 / 15.0;
    const hex = scol.slice(1);
    r = parseInt(hex[0], 16);
    g = parseInt(hex[1], 16);
    b = parseInt(hex[2], 16);
  } else if (scol.length === 6) {
    // 5-digit format after #: "#12345" -> RGB(0x12, 0x34, 0x05) to match Go behavior
    const hex = scol.slice(1);
    r = parseInt(hex.slice(0, 2), 16); // "12" -> 18
    g = parseInt(hex.slice(2, 4), 16); // "34" -> 52
    b = parseInt(hex.slice(4, 5), 16); // "5" -> 5 (to match Go: RGB(18,52,5))
    factor = 1.0 / 255.0;
  } else if (scol.length === 7) {
    // 6-digit format: "#123456" -> RGB(0x12, 0x34, 0x56)
    factor = 1.0 / 255.0;
    const hex = scol.slice(1);
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
  } else if (scol.length >= 8) {
    // 7+ digit format after #: "#1234567+" -> RGB(0x12, 0x34, 0x56) (truncate to match Go)
    factor = 1.0 / 255.0;
    const hex = scol.slice(1, 7); // Take only first 6 chars after #
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
  } else {
    // Unsupported formats
    throw new Error(`color: ${scol} is not a hex-color`);
  }

  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
    throw new Error(`color: ${scol} is not a hex-color`);
  }

  return new Color(r * factor, g * factor, b * factor);
};

// HSL creates a new Color given a Hue in [0..359], a Saturation [0..1], and a Luminance (lightness) in [0..1]
export const HSL = hsl;

// HSV creates a new Color given a Hue in [0..359], a Saturation and a Value in [0..1]
export const HSV = hsv;

// Lab generates a color by using data given in CIE L*a*b* space using D65 as reference white.
export const Lab = lab;

// LabWhiteRef generates a color by using data given in CIE L*a*b* space with custom reference white.
export const LabWhiteRef = labWhiteRef;

// Luv generates a color by using data given in CIE L*u*v* space using D65 as reference white.
export const Luv = luv;

// LuvWhiteRef generates a color by using data given in CIE L*u*v* space with custom reference white.
export const LuvWhiteRef = luvWhiteRef;

// HCL generates a color by using data given in HCL space using D65 as reference white.
export const HCL = hcl;

// HclWhiteRef generates a color by using data given in HCL space with custom reference white.
export const HclWhiteRef = hclWhiteRef;

// LuvLCh generates a color by using data given in LuvLCh space using D65 as reference white.
export const LuvLCh = luvLCh;

// LuvLChWhiteRef generates a color by using data given in LuvLCh space with custom reference white.
export const LuvLChWhiteRef = luvLChWhiteRef;

// XYZ generates a color by using data given in CIE XYZ space.
export const XYZ = xyz;

// XYY generates a color by using data given in CIE xyY space.
export const XYY = xyy;

// LinearRgb creates an sRGB color out of the given linear RGB color.
export const LinearRgb = linearRgb;

// FastLinearRgb is much faster than and almost as accurate as LinearRgb.
export const FastLinearRgb = fastLinearRgb;

// OkLab generates a color by using data given in OkLab space.
export const OkLab = okLab;

// OkLch generates a color by using data given in OkLch space.
export const OkLch = okLch;

// HSLuv creates a new Color from values in the HSLuv color space.
export const HSLuv = hsLuv;

// HPLuv creates a new Color from values in the HPLuv color space.
export const HPLuv = hpLuv;
