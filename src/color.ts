/**
 * The core Color class representing an sRGB color
 */

import { D65, Delta, HSLuvD65 } from './constants';
import {
  clamp01,
  cub,
  delinearize,
  delinearizeFast,
  interpAngle,
  linearize,
  linearizeFast,
  sq,
} from './utils';

// Mathematical constants for angle conversions
const RAD_TO_DEG = 57.29577951308232; // 180/Math.PI with JS precision
const DEG_TO_RAD = 0.017453292519943295; // Math.PI/180 with JS precision

// A color is stored internally using sRGB (standard RGB) values in the range 0-1
export class Color {
  constructor(
    public r: number,
    public g: number,
    public b: number
  ) {}

  // Implement compatibility with standard color interfaces
  rgba(): [number, number, number, number] {
    const r = Math.floor(this.r * 65535.0 + 0.5);
    const g = Math.floor(this.g * 65535.0 + 0.5);
    const b = Math.floor(this.b * 65535.0 + 0.5);
    return [r, g, b, 0xffff];
  }

  // Get RGB values as 8-bit integers
  rgb255(): [number, number, number] {
    const r = Math.floor(this.r * 255.0 + 0.5);
    const g = Math.floor(this.g * 255.0 + 0.5);
    const b = Math.floor(this.b * 255.0 + 0.5);
    return [r, g, b];
  }

  // Used to simplify HSLuv testing
  values(): [number, number, number] {
    return [this.r, this.g, this.b];
  }

  // Checks whether the color exists in RGB space, i.e. all values are in [0..1]
  isValid(): boolean {
    return (
      0.0 <= this.r &&
      this.r <= 1.0 &&
      0.0 <= this.g &&
      this.g <= 1.0 &&
      0.0 <= this.b &&
      this.b <= 1.0
    );
  }

  // Returns clamped color with each value in [0..1]
  clamped(): Color {
    return new Color(clamp01(this.r), clamp01(this.g), clamp01(this.b));
  }

  /// Distance Functions ///

  // DistanceRgb computes the distance between two colors in RGB space.
  // This is not a good measure! Rather do it in Lab space.
  distanceRgb(c2: Color): number {
    return Math.sqrt(sq(this.r - c2.r) + sq(this.g - c2.g) + sq(this.b - c2.b));
  }

  // DistanceLinearRgb computes the distance between two colors in linear RGB space.
  distanceLinearRgb(c2: Color): number {
    const [r1, g1, b1] = this.linearRgb();
    const [r2, g2, b2] = c2.linearRgb();
    return Math.sqrt(sq(r1 - r2) + sq(g1 - g2) + sq(b1 - b2));
  }

  // DistanceRiemersma is a color distance algorithm developed by Thiadmer Riemersma.
  distanceRiemersma(c2: Color): number {
    const rAvg = (this.r + c2.r) / 2.0;
    const dR = this.r - c2.r;
    const dG = this.g - c2.g;
    const dB = this.b - c2.b;
    return Math.sqrt((2 + rAvg) * dR * dR + 4 * dG * dG + (2 + (1 - rAvg)) * dB * dB);
  }

  // Check for equality between colors within the tolerance Delta (1/255).
  almostEqualRgb(c2: Color): boolean {
    return (
      Math.abs(this.r - c2.r) + Math.abs(this.g - c2.g) + Math.abs(this.b - c2.b) < 3.0 * Delta
    );
  }

  /// Color Space Conversions ///

  // HSV color space conversion
  hsv(): [number, number, number] {
    const min = Math.min(Math.min(this.r, this.g), this.b);
    const v = Math.max(Math.max(this.r, this.g), this.b);
    const C = v - min;

    let s = 0.0;
    if (v !== 0.0) {
      s = C / v;
    }

    let h = 0.0; // We use 0 instead of undefined
    if (min !== v) {
      if (v === this.r) {
        h = ((this.g - this.b) / C) % 6.0;
      } else if (v === this.g) {
        h = (this.b - this.r) / C + 2.0;
      } else if (v === this.b) {
        h = (this.r - this.g) / C + 4.0;
      }
      h *= 60.0;
      if (h < 0.0) {
        h += 360.0;
      }
    }
    return [h, s, v];
  }

  // HSL color space conversion
  hsl(): [number, number, number] {
    const min = Math.min(Math.min(this.r, this.g), this.b);
    const max = Math.max(Math.max(this.r, this.g), this.b);

    const l = (max + min) / 2;

    let s = 0;
    let h = 0;

    if (min !== max) {
      if (l < 0.5) {
        s = (max - min) / (max + min);
      } else {
        s = (max - min) / (2.0 - max - min);
      }

      if (max === this.r) {
        h = (this.g - this.b) / (max - min);
      } else if (max === this.g) {
        h = 2.0 + (this.b - this.r) / (max - min);
      } else {
        h = 4.0 + (this.r - this.g) / (max - min);
      }

      h *= 60;

      if (h < 0) {
        h += 360;
      }
    }

    return [h, s, l];
  }

  // Convert to hex string
  hex(): string {
    // Add 0.5 for rounding - same as Go implementation
    const r = Math.floor(this.r * 255.0 + 0.5);
    const g = Math.floor(this.g * 255.0 + 0.5);
    const b = Math.floor(this.b * 255.0 + 0.5);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  // LinearRgb converts the color into the linear RGB space
  linearRgb(): [number, number, number] {
    return [linearize(this.r), linearize(this.g), linearize(this.b)];
  }

  // FastLinearRgb is much faster than and almost as accurate as LinearRgb
  fastLinearRgb(): [number, number, number] {
    return [linearizeFast(this.r), linearizeFast(this.g), linearizeFast(this.b)];
  }

  // XYZ color space conversion
  xyz(): [number, number, number] {
    const [r, g, b] = this.linearRgb();
    return linearRgbToXyz(r, g, b);
  }

  // xyY color space conversion using D65 as reference white
  xyy(): [number, number, number] {
    return xyzToXyy(...this.xyz());
  }

  // xyY color space conversion with custom reference white
  xyyWhiteRef(wref: [number, number, number]): [number, number, number] {
    const [X, Y, Z] = this.xyz();
    return xyzToXyyWhiteRef(X, Y, Z, wref);
  }

  // L*a*b* color space conversion using D65 as reference white
  lab(): [number, number, number] {
    return xyzToLab(...this.xyz());
  }

  // L*a*b* color space conversion with custom reference white
  labWhiteRef(wref: [number, number, number]): [number, number, number] {
    const [x, y, z] = this.xyz();
    return xyzToLabWhiteRef(x, y, z, wref);
  }

  // L*u*v* color space conversion using D65 as reference white
  luv(): [number, number, number] {
    return xyzToLuv(...this.xyz());
  }

  // L*u*v* color space conversion with custom reference white
  luvWhiteRef(wref: [number, number, number]): [number, number, number] {
    const [x, y, z] = this.xyz();
    return xyzToLuvWhiteRef(x, y, z, wref);
  }

  // HCL color space conversion using D65 as reference white
  hcl(): [number, number, number] {
    return this.hclWhiteRef(D65);
  }

  // HCL color space conversion with custom reference white
  hclWhiteRef(wref: [number, number, number]): [number, number, number] {
    const [L, a, b] = this.labWhiteRef(wref);
    return labToHcl(L, a, b);
  }

  // LuvLCh color space conversion using D65 as reference white
  luvLCh(): [number, number, number] {
    return this.luvLChWhiteRef(D65);
  }

  // LuvLCh color space conversion with custom reference white
  luvLChWhiteRef(wref: [number, number, number]): [number, number, number] {
    return luvToLuvLCh(...this.luvWhiteRef(wref));
  }

  // OkLab color space conversion
  okLab(): [number, number, number] {
    return xyzToOkLab(...this.xyz());
  }

  // OkLch color space conversion
  okLch(): [number, number, number] {
    return okLabToOkLch(...this.okLab());
  }

  // HSLuv color space conversion
  hsLuv(): [number, number, number] {
    return luvLChToHSLuv(...this.luvLChWhiteRef(HSLuvD65));
  }

  // HPLuv color space conversion
  hpLuv(): [number, number, number] {
    return luvLChToHPLuv(...this.luvLChWhiteRef(HSLuvD65));
  }

  /// Distance Functions in Perceptual Color Spaces ///

  // DistanceLab is a good measure of visual similarity between two colors!
  distanceLab(c2: Color): number {
    const [l1, a1, b1] = this.lab();
    const [l2, a2, b2] = c2.lab();
    return Math.sqrt(sq(l1 - l2) + sq(a1 - a2) + sq(b1 - b2));
  }

  // DistanceCIE76 is the same as DistanceLab
  distanceCIE76(c2: Color): number {
    return this.distanceLab(c2);
  }

  // DistanceLuv is another good measure of visual similarity
  distanceLuv(c2: Color): number {
    const [l1, u1, v1] = this.luv();
    const [l2, u2, v2] = c2.luv();
    return Math.sqrt(sq(l1 - l2) + sq(u1 - u2) + sq(v1 - v2));
  }

  // DistanceHSLuv calculates Euclidean distance in the HSLuv colorspace
  distanceHSLuv(c2: Color): number {
    const [h1, s1, l1] = this.hsLuv();
    const [h2, s2, l2] = c2.hsLuv();
    return Math.sqrt(sq((h1 - h2) / 100.0) + sq(s1 - s2) + sq(l1 - l2));
  }

  // DistanceHPLuv calculates Euclidean distance in the HPLuv colorspace
  distanceHPLuv(c2: Color): number {
    const [h1, s1, l1] = this.hpLuv();
    const [h2, s2, l2] = c2.hpLuv();
    return Math.sqrt(sq((h1 - h2) / 100.0) + sq(s1 - s2) + sq(l1 - l2));
  }

  // Uses the CIE94 formula to calculate color distance
  distanceCIE94(cr: Color): number {
    let [l1, a1, b1] = this.lab();
    let [l2, a2, b2] = cr.lab();

    // Scale up the ranges for the formula
    l1 *= 100.0;
    a1 *= 100.0;
    b1 *= 100.0;
    l2 *= 100.0;
    a2 *= 100.0;
    b2 *= 100.0;

    const kl = 1.0;
    const kc = 1.0;
    const kh = 1.0;
    const k1 = 0.045;
    const k2 = 0.015;

    const deltaL = l1 - l2;
    const c1 = Math.sqrt(sq(a1) + sq(b1));
    const c2 = Math.sqrt(sq(a2) + sq(b2));
    const deltaCab = c1 - c2;

    const deltaHab2 = sq(a1 - a2) + sq(b1 - b2) - sq(deltaCab);
    const sl = 1.0;
    const sc = 1.0 + k1 * c1;
    const sh = 1.0 + k2 * c1;

    const vL2 = sq(deltaL / (kl * sl));
    const vC2 = sq(deltaCab / (kc * sc));
    const vH2 = deltaHab2 / sq(kh * sh);

    return Math.sqrt(vL2 + vC2 + vH2) * 0.01;
  }

  // DistanceCIEDE2000 uses the Delta E 2000 formula
  distanceCIEDE2000(cr: Color): number {
    return this.distanceCIEDE2000klch(cr, 1.0, 1.0, 1.0);
  }

  // DistanceCIEDE2000klch uses the Delta E 2000 formula with custom weighting factors
  distanceCIEDE2000klch(cr: Color, kl: number, kc: number, kh: number): number {
    let [l1, a1, b1] = this.lab();
    let [l2, a2, b2] = cr.lab();

    // Scale up the ranges
    l1 *= 100.0;
    a1 *= 100.0;
    b1 *= 100.0;
    l2 *= 100.0;
    a2 *= 100.0;
    b2 *= 100.0;

    const cab1 = Math.sqrt(sq(a1) + sq(b1));
    const cab2 = Math.sqrt(sq(a2) + sq(b2));
    const cabmean = (cab1 + cab2) / 2;

    const g = 0.5 * (1 - Math.sqrt(cabmean ** 7 / (cabmean ** 7 + 25 ** 7)));
    const ap1 = (1 + g) * a1;
    const ap2 = (1 + g) * a2;
    const cp1 = Math.sqrt(sq(ap1) + sq(b1));
    const cp2 = Math.sqrt(sq(ap2) + sq(b2));

    let hp1 = 0.0;
    if (b1 !== ap1 || ap1 !== 0) {
      hp1 = Math.atan2(b1, ap1);
      if (hp1 < 0) {
        hp1 += Math.PI * 2;
      }
      hp1 *= 180 / Math.PI;
    }

    let hp2 = 0.0;
    if (b2 !== ap2 || ap2 !== 0) {
      hp2 = Math.atan2(b2, ap2);
      if (hp2 < 0) {
        hp2 += Math.PI * 2;
      }
      hp2 *= 180 / Math.PI;
    }

    const deltaLp = l2 - l1;
    const deltaCp = cp2 - cp1;
    let dhp = 0.0;
    const cpProduct = cp1 * cp2;
    if (cpProduct !== 0) {
      dhp = hp2 - hp1;
      if (dhp > 180) {
        dhp -= 360;
      } else if (dhp < -180) {
        dhp += 360;
      }
    }
    const deltaHp = 2 * Math.sqrt(cpProduct) * Math.sin(((dhp / 2) * Math.PI) / 180);

    const lpmean = (l1 + l2) / 2;
    const cpmean = (cp1 + cp2) / 2;
    let hpmean = hp1 + hp2;
    if (cpProduct !== 0) {
      hpmean /= 2;
      if (Math.abs(hp1 - hp2) > 180) {
        if (hp1 + hp2 < 360) {
          hpmean += 180;
        } else {
          hpmean -= 180;
        }
      }
    }

    const t =
      1 -
      0.17 * Math.cos(((hpmean - 30) * Math.PI) / 180) +
      0.24 * Math.cos((2 * hpmean * Math.PI) / 180) +
      0.32 * Math.cos(((3 * hpmean + 6) * Math.PI) / 180) -
      0.2 * Math.cos(((4 * hpmean - 63) * Math.PI) / 180);
    const deltaTheta = 30 * Math.exp(-sq((hpmean - 275) / 25));
    const rc = 2 * Math.sqrt(cpmean ** 7 / (cpmean ** 7 + 25 ** 7));
    const sl = 1 + (0.015 * sq(lpmean - 50)) / Math.sqrt(20 + sq(lpmean - 50));
    const sc = 1 + 0.045 * cpmean;
    const sh = 1 + 0.015 * cpmean * t;
    const rt = -Math.sin((2 * deltaTheta * Math.PI) / 180) * rc;

    return (
      Math.sqrt(
        sq(deltaLp / (kl * sl)) +
          sq(deltaCp / (kc * sc)) +
          sq(deltaHp / (kh * sh)) +
          rt * (deltaCp / (kc * sc)) * (deltaHp / (kh * sh))
      ) * 0.01
    );
  }

  /// Color Blending ///

  // BlendRgb blends two colors in RGB space (not recommended)
  blendRgb(c2: Color, t: number): Color {
    return new Color(
      this.r + t * (c2.r - this.r),
      this.g + t * (c2.g - this.g),
      this.b + t * (c2.b - this.b)
    );
  }

  // BlendLinearRgb blends two colors in Linear RGB space
  blendLinearRgb(c2: Color, t: number): Color {
    const [r1, g1, b1] = this.linearRgb();
    const [r2, g2, b2] = c2.linearRgb();
    return linearRgb(r1 + t * (r2 - r1), g1 + t * (g2 - g1), b1 + t * (b2 - b1));
  }

  // BlendHsv blends two colors in HSV space
  blendHsv(c2: Color, t: number): Color {
    let [h1, s1, v1] = this.hsv();
    let [h2, s2, v2] = c2.hsv();

    // Handle achromatic colors
    if (s1 === 0 && s2 !== 0) {
      h1 = h2;
    } else if (s2 === 0 && s1 !== 0) {
      h2 = h1;
    }

    return hsv(interpAngle(h1, h2, t), s1 + t * (s2 - s1), v1 + t * (v2 - v1));
  }

  // BlendLab blends two colors in L*a*b* space
  blendLab(c2: Color, t: number): Color {
    const [l1, a1, b1] = this.lab();
    const [l2, a2, b2] = c2.lab();
    return lab(l1 + t * (l2 - l1), a1 + t * (a2 - a1), b1 + t * (b2 - b1));
  }

  // BlendLuv blends two colors in L*u*v* space
  blendLuv(c2: Color, t: number): Color {
    const [l1, u1, v1] = this.luv();
    const [l2, u2, v2] = c2.luv();
    return luv(l1 + t * (l2 - l1), u1 + t * (u2 - u1), v1 + t * (v2 - v1));
  }

  // BlendHcl blends two colors in HCL space
  blendHcl(col2: Color, t: number): Color {
    let [h1, c1, l1] = this.hcl();
    let [h2, c2, l2] = col2.hcl();

    // Handle achromatic colors
    if (c1 <= 0.00015 && c2 >= 0.00015) {
      h1 = h2;
    } else if (c2 <= 0.00015 && c1 >= 0.00015) {
      h2 = h1;
    }

    return hcl(interpAngle(h1, h2, t), c1 + t * (c2 - c1), l1 + t * (l2 - l1)).clamped();
  }

  // BlendLuvLCh blends two colors in the cylindrical CIELUV color space
  blendLuvLCh(col2: Color, t: number): Color {
    const [l1, c1, h1] = this.luvLCh();
    const [l2, c2, h2] = col2.luvLCh();
    return luvLCh(l1 + t * (l2 - l1), c1 + t * (c2 - c1), interpAngle(h1, h2, t));
  }

  // BlendOkLab blends two colors in OkLab space
  blendOkLab(c2: Color, t: number): Color {
    const [l1, a1, b1] = this.okLab();
    const [l2, a2, b2] = c2.okLab();
    return okLab(l1 + t * (l2 - l1), a1 + t * (a2 - a1), b1 + t * (b2 - b1));
  }

  // BlendOkLch blends two colors in OkLch space
  blendOkLch(col2: Color, t: number): Color {
    let [l1, c1, h1] = this.okLch();
    let [l2, c2, h2] = col2.okLch();

    // Handle achromatic colors
    if (c1 <= 0.00015 && c2 >= 0.00015) {
      h1 = h2;
    } else if (c2 <= 0.00015 && c1 >= 0.00015) {
      h2 = h1;
    }

    return okLch(l1 + t * (l2 - l1), c1 + t * (c2 - c1), interpAngle(h1, h2, t)).clamped();
  }
}

/// Helper Functions ///

// XYZ to Linear RGB transformation matrix constants
const XYZ_TO_RGB_MATRIX = {
  r: [3.2409699419045213, -1.5373831775700935, -0.4986107602930033] as const,
  g: [-0.9692436362808798, 1.8759675015077206, 0.04155505740717561] as const,
  b: [0.05563007969699361, -0.20397695888897657, 1.0569715142428786] as const,
} as const;

// XyzToLinearRgb converts from CIE XYZ-space to Linear RGB space
export const xyzToLinearRgb = (x: number, y: number, z: number): [number, number, number] => {
  const r = XYZ_TO_RGB_MATRIX.r[0] * x + XYZ_TO_RGB_MATRIX.r[1] * y + XYZ_TO_RGB_MATRIX.r[2] * z;
  const g = XYZ_TO_RGB_MATRIX.g[0] * x + XYZ_TO_RGB_MATRIX.g[1] * y + XYZ_TO_RGB_MATRIX.g[2] * z;
  const b = XYZ_TO_RGB_MATRIX.b[0] * x + XYZ_TO_RGB_MATRIX.b[1] * y + XYZ_TO_RGB_MATRIX.b[2] * z;
  return [r, g, b];
};

// RGB to XYZ transformation matrix constants
const RGB_TO_XYZ_MATRIX = {
  x: [0.4123907992659595, 0.35758433938387796, 0.18048078840183429] as const,
  y: [0.21263900587151036, 0.7151686787677559, 0.07219231536073371] as const,
  z: [0.01933081871559185, 0.11919477979462599, 0.9505321522496606] as const,
} as const;

export const linearRgbToXyz = (r: number, g: number, b: number): [number, number, number] => {
  const x = RGB_TO_XYZ_MATRIX.x[0] * r + RGB_TO_XYZ_MATRIX.x[1] * g + RGB_TO_XYZ_MATRIX.x[2] * b;
  const y = RGB_TO_XYZ_MATRIX.y[0] * r + RGB_TO_XYZ_MATRIX.y[1] * g + RGB_TO_XYZ_MATRIX.y[2] * b;
  const z = RGB_TO_XYZ_MATRIX.z[0] * r + RGB_TO_XYZ_MATRIX.z[1] * g + RGB_TO_XYZ_MATRIX.z[2] * b;
  return [x, y, z];
};

// Lab helper functions
const labF = (t: number): number => {
  if (t > ((((6.0 / 29.0) * 6.0) / 29.0) * 6.0) / 29.0) {
    return Math.cbrt(t);
  }
  return ((((t / 3.0) * 29.0) / 6.0) * 29.0) / 6.0 + 4.0 / 29.0;
};

const labFInv = (t: number): number => {
  if (t > 6.0 / 29.0) {
    return t * t * t;
  }
  return ((((3.0 * 6.0) / 29.0) * 6.0) / 29.0) * (t - 4.0 / 29.0);
};

export const xyzToLab = (x: number, y: number, z: number): [number, number, number] => {
  return xyzToLabWhiteRef(x, y, z, D65);
};

export const xyzToLabWhiteRef = (
  x: number,
  y: number,
  z: number,
  wref: [number, number, number]
): [number, number, number] => {
  const fy = labF(y / wref[1]);
  const l = 1.16 * fy - 0.16;
  const a = 5.0 * (labF(x / wref[0]) - fy);
  const b = 2.0 * (fy - labF(z / wref[2]));
  return [l, a, b];
};

export const labToXyz = (l: number, a: number, b: number): [number, number, number] => {
  return labToXyzWhiteRef(l, a, b, D65);
};

export const labToXyzWhiteRef = (
  l: number,
  a: number,
  b: number,
  wref: [number, number, number]
): [number, number, number] => {
  const l2 = (l + 0.16) / 1.16;
  const x = wref[0] * labFInv(l2 + a / 5.0);
  const y = wref[1] * labFInv(l2);
  const z = wref[2] * labFInv(l2 - b / 2.0);
  return [x, y, z];
};

// Luv helper functions
const xyzToUv = (x: number, y: number, z: number): [number, number] => {
  const denom = x + 15.0 * y + 3.0 * z;
  if (denom === 0.0) {
    return [0.0, 0.0];
  }
  return [(4.0 * x) / denom, (9.0 * y) / denom];
};

export const xyzToLuv = (x: number, y: number, z: number): [number, number, number] => {
  return xyzToLuvWhiteRef(x, y, z, D65);
};

export const xyzToLuvWhiteRef = (
  x: number,
  y: number,
  z: number,
  wref: [number, number, number]
): [number, number, number] => {
  let l: number;
  if (y / wref[1] <= ((((6.0 / 29.0) * 6.0) / 29.0) * 6.0) / 29.0) {
    l = ((y / wref[1]) * (((((29.0 / 3.0) * 29.0) / 3.0) * 29.0) / 3.0)) / 100.0;
  } else {
    l = 1.16 * Math.cbrt(y / wref[1]) - 0.16;
  }
  const [ubis, vbis] = xyzToUv(x, y, z);
  const [un, vn] = xyzToUv(wref[0], wref[1], wref[2]);
  const u = 13.0 * l * (ubis - un);
  const v = 13.0 * l * (vbis - vn);
  return [l, u, v];
};

export const luvToXyz = (l: number, u: number, v: number): [number, number, number] => {
  return luvToXyzWhiteRef(l, u, v, D65);
};

export const luvToXyzWhiteRef = (
  l: number,
  u: number,
  v: number,
  wref: [number, number, number]
): [number, number, number] => {
  let y: number;
  if (l <= 0.08) {
    y = (((((wref[1] * l * 100.0 * 3.0) / 29.0) * 3.0) / 29.0) * 3.0) / 29.0;
  } else {
    y = wref[1] * cub((l + 0.16) / 1.16);
  }
  const [un, vn] = xyzToUv(wref[0], wref[1], wref[2]);
  let x = 0,
    z = 0;
  if (l !== 0.0) {
    const ubis = u / (13.0 * l) + un;
    const vbis = v / (13.0 * l) + vn;
    x = (y * 9.0 * ubis) / (4.0 * vbis);
    z = (y * (12.0 - 3.0 * ubis - 20.0 * vbis)) / (4.0 * vbis);
  }
  return [x, y, z];
};

// xyY color space functions
export const xyzToXyy = (X: number, Y: number, Z: number): [number, number, number] => {
  return xyzToXyyWhiteRef(X, Y, Z, D65);
};

export const xyzToXyyWhiteRef = (
  X: number,
  Y: number,
  Z: number,
  wref: [number, number, number]
): [number, number, number] => {
  const Yout = Y;
  const N = X + Y + Z;
  let x: number, y: number;
  if (Math.abs(N) < 1e-14) {
    // When we have black, use the reference white's chromacity
    x = wref[0] / (wref[0] + wref[1] + wref[2]);
    y = wref[1] / (wref[0] + wref[1] + wref[2]);
  } else {
    x = X / N;
    y = Y / N;
  }
  return [x, y, Yout];
};

export const xyyToXyz = (x: number, y: number, Y: number): [number, number, number] => {
  const Yout = Y;
  let X: number, Z: number;
  if (-1e-14 < y && y < 1e-14) {
    X = 0.0;
    Z = 0.0;
  } else {
    X = (Y / y) * x;
    Z = (Y / y) * (1.0 - x - y);
  }
  return [X, Yout, Z];
};

// HCL helper functions
export const labToHcl = (L: number, a: number, b: number): [number, number, number] => {
  let h: number;
  if (Math.abs(b - a) > 1e-4 && Math.abs(a) > 1e-4) {
    h = (RAD_TO_DEG * Math.atan2(b, a) + 360.0) % 360.0;
  } else {
    h = 0.0;
  }
  const c = Math.sqrt(sq(a) + sq(b));
  return [h, c, L];
};

export const hclToLab = (h: number, c: number, l: number): [number, number, number] => {
  const H = DEG_TO_RAD * h;
  const a = c * Math.cos(H);
  const b = c * Math.sin(H);
  return [l, a, b];
};

// LuvLCh helper functions
export const luvToLuvLCh = (L: number, u: number, v: number): [number, number, number] => {
  let h: number;
  if (Math.abs(v - u) > 1e-4 && Math.abs(u) > 1e-4) {
    h = (RAD_TO_DEG * Math.atan2(v, u) + 360.0) % 360.0;
  } else {
    h = 0.0;
  }
  const c = Math.sqrt(sq(u) + sq(v));
  return [L, c, h];
};

export const luvLChToLuv = (l: number, c: number, h: number): [number, number, number] => {
  const H = DEG_TO_RAD * h;
  const u = c * Math.cos(H);
  const v = c * Math.sin(H);
  return [l, u, v];
};

// OkLab functions
export const xyzToOkLab = (x: number, y: number, z: number): [number, number, number] => {
  const l_ = Math.cbrt(0.8189330101 * x + 0.3618667424 * y - 0.1288597137 * z);
  const m_ = Math.cbrt(0.0329845436 * x + 0.9293118715 * y + 0.0361456387 * z);
  const s_ = Math.cbrt(0.0482003018 * x + 0.2643662691 * y + 0.633851707 * z);
  const l = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const b = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;
  return [l, a, b];
};

export const okLabToXyz = (l: number, a: number, b: number): [number, number, number] => {
  const l_ = 0.9999999984505196 * l + 0.39633779217376774 * a + 0.2158037580607588 * b;
  const m_ = 1.0000000088817607 * l - 0.10556134232365633 * a - 0.0638541747717059 * b;
  const s_ = 1.0000000546724108 * l - 0.08948418209496574 * a - 1.2914855378640917 * b;

  const ll = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;

  const x = 1.2268798733741557 * ll - 0.5578149965554813 * m + 0.28139105017721594 * s;
  const y = -0.04057576262431372 * ll + 1.1122868293970594 * m - 0.07171106666151696 * s;
  const z = -0.07637294974672142 * ll - 0.4214933239627916 * m + 1.5869240244272422 * s;

  return [x, y, z];
};

// OkLch functions
export const okLabToOkLch = (l: number, a: number, b: number): [number, number, number] => {
  const c = Math.sqrt(a * a + b * b);
  let h = Math.atan2(b, a);
  if (h < 0) {
    h += 2 * Math.PI;
  }
  return [l, c, (h * 180) / Math.PI];
};

export const okLchToOkLab = (l: number, c: number, h: number): [number, number, number] => {
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);
  return [l, a, b];
};

// HSLuv functions
export const luvLChToHSLuv = (l: number, c: number, h: number): [number, number, number] => {
  // [-1..1] but the code expects it to be [-100..100]
  c *= 100.0;
  l *= 100.0;

  let s: number;
  if (l > 99.9999999 || l < 0.00000001) {
    s = 0.0;
  } else {
    const max = maxChromaForLH(l, h);
    s = (c / max) * 100.0;
  }
  return [h, clamp01(s / 100.0), clamp01(l / 100.0)];
};

export const hsLuvToLuvLCh = (h: number, s: number, l: number): [number, number, number] => {
  l *= 100.0;
  s *= 100.0;

  let c: number;
  if (l > 99.9999999 || l < 0.00000001) {
    c = 0.0;
  } else {
    const max = maxChromaForLH(l, h);
    c = (max / 100.0) * s;
  }

  return [clamp01(l / 100.0), c / 100.0, h];
};

export const luvLChToHPLuv = (l: number, c: number, h: number): [number, number, number] => {
  // [-1..1] but the code expects it to be [-100..100]
  c *= 100.0;
  l *= 100.0;

  let s: number;
  if (l > 99.9999999 || l < 0.00000001) {
    s = 0.0;
  } else {
    const max = maxSafeChromaForL(l);
    s = (c / max) * 100.0;
  }
  return [h, s / 100.0, l / 100.0];
};

export const hpLuvToLuvLCh = (h: number, s: number, l: number): [number, number, number] => {
  // [-1..1] but the code expects it to be [-100..100]
  l *= 100.0;
  s *= 100.0;

  let c: number;
  if (l > 99.9999999 || l < 0.00000001) {
    c = 0.0;
  } else {
    const max = maxSafeChromaForL(l);
    c = (max / 100.0) * s;
  }
  return [l / 100.0, c / 100.0, h];
};

// HSLuv helper functions - reuse the same transformation matrix
const m = [XYZ_TO_RGB_MATRIX.r, XYZ_TO_RGB_MATRIX.g, XYZ_TO_RGB_MATRIX.b];

const kappa = 903.2962962962963;
const epsilon = 0.008856451679035631;

const maxChromaForLH = (l: number, h: number): number => {
  const hRad = (h / 360.0) * Math.PI * 2.0;
  let minLength = Number.MAX_VALUE;
  const bounds = getBounds(l);
  for (const line of bounds) {
    const length = lengthOfRayUntilIntersect(hRad, line[0], line[1]);
    if (length > 0.0 && length < minLength) {
      minLength = length;
    }
  }
  return minLength;
};

const getBounds = (l: number): number[][] => {
  const ret: number[][] = [];
  const sub1 = (l + 16.0) ** 3.0 / 1560896.0;
  const sub2 = sub1 > epsilon ? sub1 : l / kappa;

  for (let i = 0; i < m.length; i++) {
    for (let k = 0; k < 2; k++) {
      const top1 = (284517.0 * m[i][0] - 94839.0 * m[i][2]) * sub2;
      const top2 =
        (838422.0 * m[i][2] + 769860.0 * m[i][1] + 731718.0 * m[i][0]) * l * sub2 -
        769860.0 * k * l;
      const bottom = (632260.0 * m[i][2] - 126452.0 * m[i][1]) * sub2 + 126452.0 * k;
      ret.push([top1 / bottom, top2 / bottom]);
    }
  }
  return ret;
};

const lengthOfRayUntilIntersect = (theta: number, x: number, y: number): number => {
  return y / (Math.sin(theta) - x * Math.cos(theta));
};

const maxSafeChromaForL = (l: number): number => {
  let minLength = Number.MAX_VALUE;
  const bounds = getBounds(l);
  for (const line of bounds) {
    const m1 = line[0];
    const b1 = line[1];
    const x = intersectLineLine(m1, b1, -1.0 / m1, 0.0);
    const dist = distanceFromPole(x, b1 + x * m1);
    if (dist < minLength) {
      minLength = dist;
    }
  }
  return minLength;
};

const intersectLineLine = (x1: number, y1: number, x2: number, y2: number): number => {
  return (y1 - y2) / (x2 - x1);
};

const distanceFromPole = (x: number, y: number): number => {
  return Math.sqrt(x ** 2.0 + y ** 2.0);
};

// Color constructors

// Creates a colorful.Color from something implementing a color interface
export const MakeColor = (
  col: { r: number; g: number; b: number; a?: number } | [number, number, number, number]
): [Color, boolean] => {
  let r: number, g: number, b: number, a: number;

  if (Array.isArray(col)) {
    [r, g, b, a] = col;
  } else {
    r = col.r;
    g = col.g;
    b = col.b;
    a = col.a ?? 1.0;
  }

  if (a === 0) {
    return [new Color(0, 0, 0), false];
  }

  // Assume values are already in [0..1] range
  return [new Color(r, g, b), true];
};

// Constructor functions for various color spaces

export const hsv = (H: number, S: number, V: number): Color => {
  const Hp = H / 60.0;
  const C = V * S;
  const X = C * (1.0 - Math.abs((Hp % 2.0) - 1.0));

  const m = V - C;
  let r = 0.0,
    g = 0.0,
    b = 0.0;

  if (0.0 <= Hp && Hp < 1.0) {
    r = C;
    g = X;
  } else if (1.0 <= Hp && Hp < 2.0) {
    r = X;
    g = C;
  } else if (2.0 <= Hp && Hp < 3.0) {
    g = C;
    b = X;
  } else if (3.0 <= Hp && Hp < 4.0) {
    g = X;
    b = C;
  } else if (4.0 <= Hp && Hp < 5.0) {
    r = X;
    b = C;
  } else if (5.0 <= Hp && Hp < 6.0) {
    r = C;
    b = X;
  }

  return new Color(m + r, m + g, m + b);
};

export const hsl = (h: number, s: number, l: number): Color => {
  if (s === 0) {
    return new Color(l, l, l);
  }

  let t1: number;
  if (l < 0.5) {
    t1 = l * (1.0 + s);
  } else {
    t1 = l + s - l * s;
  }

  const t2 = 2 * l - t1;
  const hNorm = h / 360;
  let tr = hNorm + 1.0 / 3.0;
  let tg = hNorm;
  let tb = hNorm - 1.0 / 3.0;

  if (tr < 0) tr++;
  if (tr > 1) tr--;
  if (tg < 0) tg++;
  if (tg > 1) tg--;
  if (tb < 0) tb++;
  if (tb > 1) tb--;

  const getComponent = (t: number): number => {
    if (6 * t < 1) {
      return t2 + (t1 - t2) * 6 * t;
    } else if (2 * t < 1) {
      return t1;
    } else if (3 * t < 2) {
      return t2 + (t1 - t2) * (2.0 / 3.0 - t) * 6;
    } else {
      return t2;
    }
  };

  return new Color(getComponent(tr), getComponent(tg), getComponent(tb));
};

export const linearRgb = (r: number, g: number, b: number): Color => {
  return new Color(delinearize(r), delinearize(g), delinearize(b));
};

export const fastLinearRgb = (r: number, g: number, b: number): Color => {
  return new Color(delinearizeFast(r), delinearizeFast(g), delinearizeFast(b));
};

export const xyz = (x: number, y: number, z: number): Color => {
  return linearRgb(...xyzToLinearRgb(x, y, z));
};

export const xyy = (x: number, y: number, Y: number): Color => {
  return xyz(...xyyToXyz(x, y, Y));
};

export const lab = (l: number, a: number, b: number): Color => {
  return xyz(...labToXyz(l, a, b));
};

export const labWhiteRef = (
  l: number,
  a: number,
  b: number,
  wref: [number, number, number]
): Color => {
  return xyz(...labToXyzWhiteRef(l, a, b, wref));
};

export const luv = (l: number, u: number, v: number): Color => {
  return xyz(...luvToXyz(l, u, v));
};

export const luvWhiteRef = (
  l: number,
  u: number,
  v: number,
  wref: [number, number, number]
): Color => {
  return xyz(...luvToXyzWhiteRef(l, u, v, wref));
};

export const hcl = (h: number, c: number, l: number): Color => {
  return hclWhiteRef(h, c, l, D65);
};

export const hclWhiteRef = (
  h: number,
  c: number,
  l: number,
  wref: [number, number, number]
): Color => {
  const [L, a, b] = hclToLab(h, c, l);
  return labWhiteRef(L, a, b, wref);
};

export const luvLCh = (l: number, c: number, h: number): Color => {
  return luvLChWhiteRef(l, c, h, D65);
};

export const luvLChWhiteRef = (
  l: number,
  c: number,
  h: number,
  wref: [number, number, number]
): Color => {
  const [L, u, v] = luvLChToLuv(l, c, h);
  return luvWhiteRef(L, u, v, wref);
};

export const okLab = (l: number, a: number, b: number): Color => {
  return xyz(...okLabToXyz(l, a, b));
};

export const okLch = (l: number, c: number, h: number): Color => {
  return xyz(...okLabToXyz(...okLchToOkLab(l, c, h)));
};

export const hsLuv = (h: number, s: number, l: number): Color => {
  const [luvL, u, v] = luvLChToLuv(...hsLuvToLuvLCh(h, s, l));
  return linearRgb(...xyzToLinearRgb(...luvToXyzWhiteRef(luvL, u, v, HSLuvD65))).clamped();
};

export const hpLuv = (h: number, s: number, l: number): Color => {
  const [luvL, u, v] = luvLChToLuv(...hpLuvToLuvLCh(h, s, l));
  return linearRgb(...xyzToLinearRgb(...luvToXyzWhiteRef(luvL, u, v, HSLuvD65))).clamped();
};
