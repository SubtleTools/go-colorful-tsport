// The colorful package provides all kinds of functions for working with colors.

// A color is stored internally using sRGB (standard RGB) values in the range 0-1
export class Color {
  R: number;
  G: number; 
  B: number;

  constructor(R: number, G: number, B: number) {
    this.R = R;
    this.G = G;
    this.B = B;
  }

  // Implement the Go color.Color interface.
  RGBA(): [number, number, number, number] {
    const r = Math.floor(this.R * 65535.0 + 0.5);
    const g = Math.floor(this.G * 65535.0 + 0.5);
    const b = Math.floor(this.B * 65535.0 + 0.5);
    const a = 0xFFFF;
    return [r, g, b, a];
  }

  // Might come in handy sometimes to reduce boilerplate code.
  RGB255(): [number, number, number] {
    const r = Math.floor(this.R * 255.0 + 0.5);
    const g = Math.floor(this.G * 255.0 + 0.5);
    const b = Math.floor(this.B * 255.0 + 0.5);
    return [r, g, b];
  }

  // Used to simplify HSLuv testing.
  values(): [number, number, number] {
    return [this.R, this.G, this.B];
  }

  // Checks whether the color exists in RGB space, i.e. all values are in [0..1]
  IsValid(): boolean {
    return 0.0 <= this.R && this.R <= 1.0 &&
           0.0 <= this.G && this.G <= 1.0 &&
           0.0 <= this.B && this.B <= 1.0;
  }

  // Returns Clamps the color into valid range, clamping each value to [0..1]
  // If the color is valid already, this is a no-op.
  Clamped(): Color {
    return new Color(clamp01(this.R), clamp01(this.G), clamp01(this.B));
  }

  // DistanceRgb computes the distance between two colors in RGB space.
  // This is not a good measure! Rather do it in Lab space.
  DistanceRgb(c2: Color): number {
    return Math.sqrt(sq(this.R - c2.R) + sq(this.G - c2.G) + sq(this.B - c2.B));
  }

  // DistanceLinearRgb computes the distance between two colors in linear RGB
  // space. This is not useful for measuring how humans perceive color, but
  // might be useful for other things, like dithering.
  DistanceLinearRgb(c2: Color): number {
    const [r1, g1, b1] = this.LinearRgb();
    const [r2, g2, b2] = c2.LinearRgb();
    return Math.sqrt(sq(r1 - r2) + sq(g1 - g2) + sq(b1 - b2));
  }

  // Check for equality between colors within the tolerance Delta (1/255).
  AlmostEqualRgb(c2: Color): boolean {
    return Math.abs(this.R - c2.R) + Math.abs(this.G - c2.G) + Math.abs(this.B - c2.B) < 3.0*Delta;
  }

  // You don't really want to use this, do you? Go for BlendLab, BlendLuv or BlendHcl.
  BlendRgb(c2: Color, t: number): Color {
    return new Color(this.R + t*(c2.R - this.R), this.G + t*(c2.G - this.G), this.B + t*(c2.B - this.B));
  }

  // Blends two colors in the L*a*b* color-space, which should result in a smoother blend.
  // t == 0 results in c1, t == 1 results in c2
  BlendLab(c2: Color, t: number): Color {
    const [l1, a1, b1] = this.Lab();
    const [l2, a2, b2] = c2.Lab();
    return Lab(l1 + t*(l2 - l1), a1 + t*(a2 - a1), b1 + t*(b2 - b1));
  }

  // Blends two colors in the L*u*v* color-space, which should result in a smoother blend.
  // t == 0 results in c1, t == 1 results in c2
  BlendLuv(c2: Color, t: number): Color {
    const [l1, u1, v1] = this.Luv();
    const [l2, u2, v2] = c2.Luv();
    return Luv(l1 + t*(l2 - l1), u1 + t*(u2 - u1), v1 + t*(v2 - v1));
  }

  // Blends two colors in the CIE-L*C*h° color-space, which should result in a smoother blend.
  // t == 0 results in c1, t == 1 results in c2
  BlendHcl(c2: Color, t: number): Color {
    const [h1, c1_val, l1] = this.Hcl();
    const [h2, c2_val, l2] = c2.Hcl();
    
    // We know that h are both in [0..360]
    return Hcl(interp_angle(h1, h2, t), c1_val + t*(c2_val - c1_val), l1 + t*(l2 - l1));
  }

  // Blends two colors in the HSV color-space. This is fast but doesn't result in a
  // good-looking blend.
  // t == 0 results in c1, t == 1 results in c2
  BlendHsv(c2: Color, t: number): Color {
    const [h1, s1, v1] = this.Hsv();
    const [h2, s2, v2] = c2.Hsv();

    // We know that h are both in [0..360]
    return Hsv(interp_angle(h1, h2, t), s1 + t*(s2 - s1), v1 + t*(v2 - v1));
  }

  // Blends two colors linearly in RGB space.
  // This is different to BlendRgb, which does it in sRGB.
  // t == 0 results in c1, t == 1 results in c2
  BlendLinearRgb(c2: Color, t: number): Color {
    const [r1, g1, b1] = this.LinearRgb();
    const [r2, g2, b2] = c2.LinearRgb();
    return LinearRgb(r1 + t*(r2 - r1), g1 + t*(g2 - g1), b1 + t*(b2 - b1));
  }

  // HSV returns the Hue [0..360], Saturation and Value [0..1] of the color.
  Hsv(): [number, number, number] {
    const min = Math.min(Math.min(this.R, this.G), this.B);
    const v = Math.max(Math.max(this.R, this.G), this.B);
    const C = v - min;

    let s = 0.0;
    if (v !== 0.0) {
      s = C / v;
    }

    let h = 0.0; // We use 0 instead of undefined as in wp.
    if (min !== v) {
      if (v === this.R) {
        h = Math.fmod((this.G - this.B) / C, 6.0);
      }
      if (v === this.G) {
        h = (this.B - this.R) / C + 2.0;
      }
      if (v === this.B) {
        h = (this.R - this.G) / C + 4.0;
      }
      h *= 60.0;
      if (h < 0.0) {
        h += 360.0;
      }
    }
    return [h, s, v];
  }

  // HSL returns the Hue [0..360], Saturation [0..1], and Luminance (lightness) [0..1] of the color.
  Hsl(): [number, number, number] {
    const min = Math.min(Math.min(this.R, this.G), this.B);
    const max = Math.max(Math.max(this.R, this.G), this.B);

    const l = (max + min) / 2;

    if (min === max) {
      return [0, 0, l];
    }

    const s = l < 0.5 ? (max - min) / (max + min) : (max - min) / (2.0 - max - min);

    let h: number;
    if (max === this.R) {
      h = (this.G - this.B) / (max - min);
    } else if (max === this.G) {
      h = 2.0 + (this.B - this.R) / (max - min);
    } else {
      h = 4.0 + (this.R - this.G) / (max - min);
    }

    h *= 60;

    if (h < 0) {
      h += 360;
    }

    return [h, s, l];
  }

  // Hex returns a hex "html" representation of the color, as in #ff0080.
  Hex(): string {
    // Add 0.5 for rounding
    const r = Math.floor(this.R * 255.0 + 0.5);
    const g = Math.floor(this.G * 255.0 + 0.5);
    const b = Math.floor(this.B * 255.0 + 0.5);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  // LinearRgb converts the color into the linear RGB space (see http://www.sjbrown.co.uk/2004/05/14/gamma-correct-rendering/).
  // This is most often used for gamma-correct blending and interpolation.
  LinearRgb(): [number, number, number] {
    return [linearize(this.R), linearize(this.G), linearize(this.B)];
  }

  // FastLinearRgb is much faster than and almost as accurate as LinearRgb.
  // BUT it is important to NOTE that they only produce good results for valid colors r,g,b in [0,1].
  FastLinearRgb(): [number, number, number] {
    return [linearizeFast(this.R), linearizeFast(this.G), linearizeFast(this.B)];
  }

  // XYZ returns the CIE XYZ color space coordinates with illuminant D65.
  Xyz(): [number, number, number] {
    return this.XyzWhiteRef(D65);
  }

  // XyzWhiteRef returns the CIE XYZ color space coordinates with given reference white point.
  XyzWhiteRef(wref: [number, number, number]): [number, number, number] {
    const [r, g, b] = this.LinearRgb();
    
    const x = 0.41239079926595948*r + 0.35758433938387796*g + 0.18048078840183429*b;
    const y = 0.21263900587151036*r + 0.71516867876775593*g + 0.07219231536073371*b;
    const z = 0.01933081871559185*r + 0.11919477979462599*g + 0.95053215224966058*b;
    
    return [x, y, z];
  }

  // Xyy returns the CIE xyY color space coordinates with illuminant D65.
  Xyy(): [number, number, number] {
    return this.XyyWhiteRef(D65);
  }

  // XyyWhiteRef returns the CIE xyY color space coordinates with given reference white point.
  XyyWhiteRef(wref: [number, number, number]): [number, number, number] {
    const [X, Y, Z] = this.XyzWhiteRef(wref);
    return XyzToXyy(X, Y, Z);
  }

  // L*a*b* color space coordinates. D65 white point.
  Lab(): [number, number, number] {
    return this.LabWhiteRef(D65);
  }

  // L*a*b* color space coordinates with given reference white point.
  LabWhiteRef(wref: [number, number, number]): [number, number, number] {
    const [X, Y, Z] = this.XyzWhiteRef(wref);
    return XyzToLab(X, Y, Z, wref);
  }

  // L*u*v* color space coordinates. D65 white point.
  Luv(): [number, number, number] {
    return this.LuvWhiteRef(D65);
  }

  // L*u*v* color space coordinates with given reference white point.
  LuvWhiteRef(wref: [number, number, number]): [number, number, number] {
    const [X, Y, Z] = this.XyzWhiteRef(wref);
    return XyzToLuv(X, Y, Z, wref);
  }

  // CIE-L*C*h° color space coordinates. D65 white point.
  Hcl(): [number, number, number] {
    return this.HclWhiteRef(D65);
  }

  // CIE-L*C*h° color space coordinates with given reference white point.
  HclWhiteRef(wref: [number, number, number]): [number, number, number] {
    const [L, a, b] = this.LabWhiteRef(wref);
    return LabToHcl(L, a, b);
  }
}

// This is the tolerance used when comparing colors using AlmostEqualRgb.
export const Delta = 1.0 / 255.0;

// This is the default reference white point.
export const D65: [number, number, number] = [0.95047, 1.00000, 1.08883];

// And another one.
export const D50: [number, number, number] = [0.96422, 1.00000, 0.82521];

// Constructs a colorful.Color from something implementing color.Color
export function MakeColor(col: { RGBA(): [number, number, number, number] }): [Color, boolean] {
  const [r, g, b, a] = col.RGBA();
  if (a === 0) {
    return [new Color(0, 0, 0), false];
  }

  // Since color.Color is alpha pre-multiplied, we need to divide the
  // RGB values by alpha again in order to get back the original RGB.
  const r2 = (r * 0xffff) / a;
  const g2 = (g * 0xffff) / a;  
  const b2 = (b * 0xffff) / a;

  return [new Color(r2 / 65535.0, g2 / 65535.0, b2 / 65535.0), true];
}

// Parses a "html" hex color-string, either in the 3 "#f0c" or 6 "#ff1034" digit form.
export function Hex(scol: string): Color {
  const format = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
  if (!format.test(scol)) {
    return new Color(0, 0, 0);
  }

  const color = scol.substring(1);
  
  if (color.length === 3) {
    const r = parseInt(color[0] + color[0], 16) / 255.0;
    const g = parseInt(color[1] + color[1], 16) / 255.0;
    const b = parseInt(color[2] + color[2], 16) / 255.0;
    return new Color(r, g, b);
  }

  const r = parseInt(color.substring(0, 2), 16) / 255.0;
  const g = parseInt(color.substring(2, 4), 16) / 255.0;
  const b = parseInt(color.substring(4, 6), 16) / 255.0;
  return new Color(r, g, b);
}

// Creates a Color from the given values in the HSV space.
// Hue in [0..360], Saturation and Value in [0..1]
export function Hsv(H: number, S: number, V: number): Color {
  let Hp = H / 60.0;
  const C = V * S;
  const X = C * (1.0 - Math.abs(Math.fmod(Hp, 2.0) - 1.0));

  let m = V - C;
  let r = 0.0, g = 0.0, b = 0.0;

  if (0.0 <= Hp && Hp < 1.0) {
    r = C; g = X;
  } else if (1.0 <= Hp && Hp < 2.0) {
    r = X; g = C;
  } else if (2.0 <= Hp && Hp < 3.0) {
    g = C; b = X;
  } else if (3.0 <= Hp && Hp < 4.0) {
    g = X; b = C;
  } else if (4.0 <= Hp && Hp < 5.0) {
    r = X; b = C;
  } else if (5.0 <= Hp && Hp < 6.0) {
    r = C; b = X;
  }

  return new Color(m+r, m+g, m+b);
}

// Creates a Color from the given values in the HSL space.
// Hue in [0..360], Saturation and Luminance in [0..1]
export function Hsl(h: number, s: number, l: number): Color {
  if (s === 0) {
    return new Color(l, l, l);
  }

  const hue2rgb = (p: number, q: number, t: number): number => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  const r = hue2rgb(p, q, (h / 360 + 1/3) % 1);
  const g = hue2rgb(p, q, h / 360);
  const b = hue2rgb(p, q, (h / 360 - 1/3 + 1) % 1);

  return new Color(r, g, b);
}

// Creates a Color from the given values in the CIE L*a*b* space (D65).
export function Lab(L: number, a: number, b: number): Color {
  return LabWhiteRef(L, a, b, D65);
}

// Creates a Color from the given values in the CIE L*a*b* space, taking
// into account a given reference white. (i.e. the monitor's white)
export function LabWhiteRef(L: number, a: number, b: number, wref: [number, number, number]): Color {
  const [X, Y, Z] = LabToXyz(L, a, b, wref);
  return XyzToRgb(X, Y, Z);
}

// Creates a Color from the given values in the CIE L*u*v* space (D65).
export function Luv(L: number, u: number, v: number): Color {
  return LuvWhiteRef(L, u, v, D65);
}

// Creates a Color from the given values in the CIE L*u*v* space, taking
// into account a given reference white. (i.e. the monitor's white)
export function LuvWhiteRef(L: number, u: number, v: number, wref: [number, number, number]): Color {
  const [X, Y, Z] = LuvToXyz(L, u, v, wref);
  return XyzToRgb(X, Y, Z);
}

// Creates a Color from the given values in the CIE-L*C*h° space (D65).
export function Hcl(h: number, c: number, l: number): Color {
  return HclWhiteRef(h, c, l, D65);
}

// Creates a Color from the given values in the CIE-L*C*h° space, taking
// into account a given reference white. (i.e. the monitor's white)
export function HclWhiteRef(h: number, c: number, l: number, wref: [number, number, number]): Color {
  const [L, a, b] = HclToLab(h, c, l);
  return LabWhiteRef(L, a, b, wref);
}

// Creates a Color from the given values in the CIE XYZ space (D65).
export function Xyz(x: number, y: number, z: number): Color {
  return XyzToRgb(x, y, z);
}

// Creates a Color from the given values in the CIE xyY space (D65).
export function Xyy(x: number, y: number, Y: number): Color {
  const [X, Y2, Z] = XyyToXyz(x, y, Y);
  return XyzToRgb(X, Y2, Z);
}

// Creates a Color from the given values in the linear RGB space.
export function LinearRgb(r: number, g: number, b: number): Color {
  return new Color(delinearize(r), delinearize(g), delinearize(b));
}

// FastLinearRgb is much faster than and almost as accurate as LinearRgb.
// BUT it is important to NOTE that they only produce good results for valid inputs r,g,b in [0,1].
export function FastLinearRgb(r: number, g: number, b: number): Color {
  return new Color(delinearizeFast(r), delinearizeFast(g), delinearizeFast(b));
}

// Helper functions

function clamp01(v: number): number {
  return Math.max(0.0, Math.min(v, 1.0));
}

function sq(v: number): number {
  return v * v;
}

// Math.fmod equivalent for JavaScript
Math.fmod = function(a: number, b: number): number {
  return a % b;
};

// Angle interpolation
function interp_angle(a0: number, a1: number, t: number): number {
  // We want to interpolate angles in a way that they wrapp around correctly.
  const da = Math.fmod(a1 - a0, 360.0);
  return a0 + Math.fmod(2.0*da, 360.0) - da*t;
}

// Linear and delinear functions
function linearize(v: number): number {
  if (v <= 0.04045) {
    return v / 12.92;
  }
  return Math.pow((v + 0.055) / 1.055, 2.4);
}

function delinearize(v: number): number {
  if (v <= 0.0031308) {
    return 12.92 * v;
  }
  return 1.055 * Math.pow(v, 1.0 / 2.4) - 0.055;
}

function linearizeFast(v: number): number {
  return v * v;
}

function delinearizeFast(v: number): number {
  return Math.sqrt(v);
}

// Color space conversion functions
function XyzToXyy(X: number, Y: number, Z: number): [number, number, number] {
  const sum = X + Y + Z;
  if (sum === 0) {
    // Use D65 white point when sum is zero
    return [D65[0] / (D65[0] + D65[1] + D65[2]), D65[1] / (D65[0] + D65[1] + D65[2]), Y];
  }
  return [X / sum, Y / sum, Y];
}

function XyyToXyz(x: number, y: number, Y: number): [number, number, number] {
  if (y === 0) {
    return [0, 0, 0];
  }
  const X = Y * x / y;
  const Z = Y * (1 - x - y) / y;
  return [X, Y, Z];
}

function lab_f(t: number): number {
  if (t > 6.0/29.0 * 6.0/29.0 * 6.0/29.0) {
    return Math.pow(t, 1.0/3.0);
  }
  return t / (3.0 * 6.0/29.0 * 6.0/29.0) + 4.0/29.0;
}

function lab_finv(t: number): number {
  if (t > 6.0/29.0) {
    return t * t * t;
  }
  return 3.0 * 6.0/29.0 * 6.0/29.0 * (t - 4.0/29.0);
}

function XyzToLab(x: number, y: number, z: number, wref: [number, number, number]): [number, number, number] {
  const fy = lab_f(y / wref[1]);
  const L = 1.16 * fy - 0.16;
  const a = 5.0 * (lab_f(x / wref[0]) - fy);
  const b = 2.0 * (fy - lab_f(z / wref[2]));
  return [L, a, b];
}

function LabToXyz(L: number, a: number, b: number, wref: [number, number, number]): [number, number, number] {
  const l2 = (L + 0.16) / 1.16;
  const x = wref[0] * lab_finv(l2 + a/5.0);
  const y = wref[1] * lab_finv(l2);
  const z = wref[2] * lab_finv(l2 - b/2.0);
  return [x, y, z];
}

function XyzToLuv(x: number, y: number, z: number, wref: [number, number, number]): [number, number, number] {
  const denom = x + 15.0*y + 3.0*z;
  const denomr = wref[0] + 15.0*wref[1] + 3.0*wref[2];
  
  let up, vp, upr, vpr: number;
  
  if (denom === 0.0) {
    up = 0.0;
    vp = 0.0;
  } else {
    up = 4.0 * x / denom;
    vp = 9.0 * y / denom;
  }
  
  if (denomr === 0.0) {
    upr = 0.0;
    vpr = 0.0;
  } else {
    upr = 4.0 * wref[0] / denomr;
    vpr = 9.0 * wref[1] / denomr;
  }
  
  const yr = y / wref[1];
  let L: number;
  if (yr > 6.0/29.0 * 6.0/29.0 * 6.0/29.0) {
    L = 1.16 * Math.pow(yr, 1.0/3.0) - 0.16;
  } else {
    L = (29.0/3.0 * 29.0/3.0 * 29.0/3.0) / (6.0*6.0*6.0) * yr;
  }
  
  const u = 13.0 * L * (up - upr);
  const v = 13.0 * L * (vp - vpr);
  
  return [L, u, v];
}

function LuvToXyz(L: number, u: number, v: number, wref: [number, number, number]): [number, number, number] {
  const denom = wref[0] + 15.0*wref[1] + 3.0*wref[2];
  let upr, vpr: number;
  
  if (denom === 0.0) {
    upr = 0.0;
    vpr = 0.0;
  } else {
    upr = 4.0 * wref[0] / denom;
    vpr = 9.0 * wref[1] / denom;
  }
  
  let y: number;
  if (L > 8.0) {
    y = wref[1] * Math.pow((L + 0.16)/1.16, 3.0);
  } else {
    y = wref[1] * L * (3.0/29.0) * (3.0/29.0) * (3.0/29.0);
  }
  
  let x, z: number;
  if (L === 0.0) {
    x = 0.0;
    z = 0.0;
  } else {
    const up = u / (13.0 * L) + upr;
    const vp = v / (13.0 * L) + vpr;
    
    x = y * 9.0 * up / (4.0 * vp);
    z = y * (12.0 - 3.0*up - 20.0*vp) / (4.0 * vp);
  }
  
  return [x, y, z];
}

export function LabToHcl(L: number, a: number, b: number): [number, number, number] {
  const c = Math.sqrt(a*a + b*b);
  let h = Math.atan2(b, a) * 180.0 / Math.PI;
  
  // We want to fix h to be in [0, 360)
  if (h < 0.0) {
    h += 360.0;
  }
  
  return [h, c, L];
}

function HclToLab(h: number, c: number, l: number): [number, number, number] {
  const H = h * Math.PI / 180.0;
  const a = c * Math.cos(H);
  const b = c * Math.sin(H);
  return [l, a, b];
}

function XyzToRgb(x: number, y: number, z: number): Color {
  const r = 3.2409699419045214*x - 1.5373831775700935*y - 0.49861076029300328*z;
  const g = -0.96924363628087983*x + 1.8759675015077207*y + 0.041555057407175613*z;
  const b = 0.055630079696993609*x - 0.20397695888897657*y + 1.0569715142428786*z;
  
  return new Color(delinearize(r), delinearize(g), delinearize(b));
}