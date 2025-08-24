/**
 * Complete Go-style API tests - systematic coverage of all wrapper functions
 * This covers all the missing functions from go-style.ts without slow operations
 */

import { expect, test } from 'bun:test';
import * as GoStyle from '../src/go-style';
import * as TSStyle from '../src';

test('Go-style Color class complete methods', () => {
  const c1 = new GoStyle.Color(0.8, 0.4, 0.6);
  const c2 = new GoStyle.Color(0.2, 0.7, 0.3);
  
  // Test all distance methods
  expect(typeof c1.DistanceLinearRgb(c2)).toBe('number');
  expect(typeof c1.DistanceLinearRGB(c2)).toBe('number'); // Alias
  expect(typeof c1.DistanceRiemersma(c2)).toBe('number');
  expect(typeof c1.DistanceLab(c2)).toBe('number');
  expect(typeof c1.DistanceCIE76(c2)).toBe('number');
  expect(typeof c1.DistanceLuv(c2)).toBe('number');
  expect(typeof c1.DistanceHSLuv(c2)).toBe('number');
  expect(typeof c1.DistanceHPLuv(c2)).toBe('number');
  expect(typeof c1.DistanceCIE94(c2)).toBe('number');
  expect(typeof c1.DistanceCIEDE2000(c2)).toBe('number');
  expect(typeof c1.DistanceCIEDE2000klch(c2, 1, 1, 1)).toBe('number');
  
  // Test AlmostEqualRgb
  expect(typeof c1.AlmostEqualRgb(c2)).toBe('boolean');
  
  // Verify results make sense
  expect(c1.DistanceRgb(c2)).toBeGreaterThan(0);
  expect(c1.DistanceLinearRgb(c2)).toBeGreaterThan(0);
  expect(c1.DistanceLinearRGB(c2)).toBe(c1.DistanceLinearRgb(c2)); // Alias test
});

test('Go-style Color blending methods', () => {
  const red = new GoStyle.Color(1, 0, 0);
  const blue = new GoStyle.Color(0, 0, 1);
  
  // Test all blending methods with t=0.5
  const blendRgb = red.BlendRgb(blue, 0.5);
  const blendLinearRgb = red.BlendLinearRgb(blue, 0.5);
  const blendHsv = red.BlendHsv(blue, 0.5);
  const blendLab = red.BlendLab(blue, 0.5);
  const blendLuv = red.BlendLuv(blue, 0.5);
  const blendHcl = red.BlendHcl(blue, 0.5);
  const blendLuvLCh = red.BlendLuvLCh(blue, 0.5);
  const blendOkLab = red.BlendOkLab(blue, 0.5);
  const blendOkLch = red.BlendOkLch(blue, 0.5);
  
  // All should return Color objects
  expect(blendRgb instanceof GoStyle.Color).toBe(true);
  expect(blendLinearRgb instanceof GoStyle.Color).toBe(true);
  expect(blendHsv instanceof GoStyle.Color).toBe(true);
  expect(blendLab instanceof GoStyle.Color).toBe(true);
  expect(blendLuv instanceof GoStyle.Color).toBe(true);
  expect(blendHcl instanceof GoStyle.Color).toBe(true);
  expect(blendLuvLCh instanceof GoStyle.Color).toBe(true);
  expect(blendOkLab instanceof GoStyle.Color).toBe(true);
  expect(blendOkLch instanceof GoStyle.Color).toBe(true);
  
  // Test t=0 returns first color
  expect(red.BlendRgb(blue, 0).R).toBeCloseTo(1, 5);
  expect(red.BlendRgb(blue, 0).G).toBeCloseTo(0, 5);
  expect(red.BlendRgb(blue, 0).B).toBeCloseTo(0, 5);
});

test('Go-style Color conversion methods', () => {
  const color = new GoStyle.Color(0.6, 0.5, 0.8);
  
  // Test all conversion methods return arrays of length 3
  expect(color.Hsv()).toHaveLength(3);
  expect(color.Hsl()).toHaveLength(3);
  expect(color.LinearRgb()).toHaveLength(3);
  expect(color.FastLinearRgb()).toHaveLength(3);
  expect(color.Xyz()).toHaveLength(3);
  expect(color.Xyy()).toHaveLength(3);
  expect(color.Lab()).toHaveLength(3);
  expect(color.Luv()).toHaveLength(3);
  expect(color.Hcl()).toHaveLength(3);
  expect(color.LuvLCh()).toHaveLength(3);
  expect(color.OkLab()).toHaveLength(3);
  expect(color.OkLch()).toHaveLength(3);
  expect(color.HSLuv()).toHaveLength(3);
  expect(color.HPLuv()).toHaveLength(3);
  
  // Test white reference versions
  expect(color.XyyWhiteRef(GoStyle.D50)).toHaveLength(3);
  expect(color.LabWhiteRef(GoStyle.D50)).toHaveLength(3);
  expect(color.LuvWhiteRef(GoStyle.D50)).toHaveLength(3);
  expect(color.HclWhiteRef(GoStyle.D50)).toHaveLength(3);
  expect(color.LuvLChWhiteRef(GoStyle.D50)).toHaveLength(3);
  
  // Test hex conversion returns string
  expect(typeof color.Hex()).toBe('string');
  expect(color.Hex()).toMatch(/^#[0-9a-f]{6}$/);
});

test('Go-style constructor functions', () => {
  // Test all constructor functions return valid Color objects
  expect(GoStyle.Hex('#ff8040') instanceof GoStyle.Color).toBe(true);
  expect(GoStyle.Hsv(120, 0.7, 0.8) instanceof GoStyle.Color).toBe(true);
  expect(GoStyle.Hsl(240, 0.6, 0.5) instanceof GoStyle.Color).toBe(true);
  expect(GoStyle.Lab(0.6, 0.1, -0.1) instanceof GoStyle.Color).toBe(true);
  expect(GoStyle.Luv(0.5, 0.05, 0.1) instanceof GoStyle.Color).toBe(true);
  expect(GoStyle.Hcl(180, 0.4, 0.6) instanceof GoStyle.Color).toBe(true);
  expect(GoStyle.LuvLCh(0.7, 0.3, 45) instanceof GoStyle.Color).toBe(true);
  expect(GoStyle.Xyz(0.4, 0.5, 0.3) instanceof GoStyle.Color).toBe(true);
  expect(GoStyle.Xyy(0.3, 0.35, 0.4) instanceof GoStyle.Color).toBe(true);
  expect(GoStyle.LinearRgb(0.2, 0.7, 0.5) instanceof GoStyle.Color).toBe(true);
  expect(GoStyle.FastLinearRgb(0.3, 0.6, 0.8) instanceof GoStyle.Color).toBe(true);
  expect(GoStyle.OkLab(0.7, 0.05, 0.1) instanceof GoStyle.Color).toBe(true);
  expect(GoStyle.OkLch(0.6, 0.1, 90) instanceof GoStyle.Color).toBe(true);
  expect(GoStyle.HSLuv(200, 0.7, 0.6) instanceof GoStyle.Color).toBe(true);
  expect(GoStyle.HPLuv(160, 0.5, 0.7) instanceof GoStyle.Color).toBe(true);
  
  // Test white reference versions
  expect(GoStyle.LabWhiteRef(0.6, 0.1, -0.1, GoStyle.D50) instanceof GoStyle.Color).toBe(true);
  expect(GoStyle.LuvWhiteRef(0.5, 0.05, 0.1, GoStyle.D50) instanceof GoStyle.Color).toBe(true);
  expect(GoStyle.HclWhiteRef(180, 0.3, 0.6, GoStyle.D50) instanceof GoStyle.Color).toBe(true);
  expect(GoStyle.LuvLChWhiteRef(0.7, 0.2, 45, GoStyle.D50) instanceof GoStyle.Color).toBe(true);
  
  // Verify they create valid colors
  expect(GoStyle.Hex('#ff8040').IsValid()).toBe(true);
  expect(GoStyle.Hsv(120, 0.7, 0.8).IsValid()).toBe(true);
  expect(GoStyle.Lab(0.6, 0.1, -0.1).IsValid()).toBe(true);
});

test('Go-style basic color generation', () => {
  // Test basic color generation functions (fast versions)
  expect(GoStyle.FastWarmColor() instanceof GoStyle.Color).toBe(true);
  expect(GoStyle.WarmColor() instanceof GoStyle.Color).toBe(true);
  expect(GoStyle.FastHappyColor() instanceof GoStyle.Color).toBe(true);
  expect(GoStyle.HappyColor() instanceof GoStyle.Color).toBe(true);
  
  expect(GoStyle.FastWarmColor().IsValid()).toBe(true);
  expect(GoStyle.WarmColor().IsValid()).toBe(true);
  expect(GoStyle.FastHappyColor().IsValid()).toBe(true);
  expect(GoStyle.HappyColor().IsValid()).toBe(true);
  
  // Test with mock random (Go-style)
  const mockRand = { 
    Float64: () => 0.5,
    Intn: (n: number) => Math.floor(n / 2)
  };
  expect(GoStyle.FastWarmColorWithRand(mockRand).IsValid()).toBe(true);
  expect(GoStyle.WarmColorWithRand(mockRand).IsValid()).toBe(true);
  expect(GoStyle.FastHappyColorWithRand(mockRand).IsValid()).toBe(true);
  expect(GoStyle.HappyColorWithRand(mockRand).IsValid()).toBe(true);
});

test('Go-style basic palette generation', () => {
  // Test fast palette functions (these should be quick)
  const warmPalette = GoStyle.FastWarmPalette(3);
  expect(Array.isArray(warmPalette)).toBe(true);
  expect(warmPalette).toHaveLength(3);
  warmPalette.forEach(c => expect(c.IsValid()).toBe(true));
  
  const happyPalette = GoStyle.FastHappyPalette(2);
  expect(Array.isArray(happyPalette)).toBe(true);
  expect(happyPalette).toHaveLength(2);
  happyPalette.forEach(c => expect(c.IsValid()).toBe(true));
  
  // Test with mock random (Go-style)
  const mockRand = { 
    Float64: () => 0.5,
    Intn: (n: number) => Math.floor(n / 2)
  };
  const warmRandPalette = GoStyle.FastWarmPaletteWithRand(2, mockRand);
  expect(warmRandPalette).toHaveLength(2);
  
  const happyRandPalette = GoStyle.FastHappyPaletteWithRand(2, mockRand);
  expect(happyRandPalette).toHaveLength(2);
});

test('Go-style MakeColor function', () => {
  const mockColor = {
    RGBA: () => [32768, 16384, 49152, 65535] as [number, number, number, number]
  };
  
  const [color, ok] = GoStyle.MakeColor(mockColor);
  expect(ok).toBe(true);
  expect(color instanceof GoStyle.Color).toBe(true);
  expect(color.IsValid()).toBe(true);
});

test('Go-style constants', () => {
  expect(typeof GoStyle.Delta).toBe('number');
  expect(Array.isArray(GoStyle.D65)).toBe(true);
  expect(Array.isArray(GoStyle.D50)).toBe(true);
  expect(GoStyle.D65).toHaveLength(3);
  expect(GoStyle.D50).toHaveLength(3);
});

test('Go-style Sorted function', () => {
  const colors = [
    new GoStyle.Color(1, 0, 0),
    new GoStyle.Color(0, 1, 0), 
    new GoStyle.Color(0, 0, 1)
  ];
  
  const sorted = GoStyle.Sorted(colors);
  expect(Array.isArray(sorted)).toBe(true);
  expect(sorted).toHaveLength(3);
  sorted.forEach(c => expect(c instanceof GoStyle.Color).toBe(true));
});

test('Go-style HexColor class', () => {
  const color = new GoStyle.Color(0.8, 0.4, 0.6);
  const hexColor = new GoStyle.HexColor(color);
  
  expect(hexColor instanceof GoStyle.HexColor).toBe(true);
  expect(hexColor.toColor() instanceof GoStyle.Color).toBe(true);
  expect(hexColor.toColor().R).toBe(0.8);
  expect(hexColor.toColor().G).toBe(0.4);
  expect(hexColor.toColor().B).toBe(0.6);
  
  const hexColor2 = GoStyle.HexColor.fromColor(color);
  expect(hexColor2.toColor().R).toBe(color.R);
  expect(hexColor2.toColor().G).toBe(color.G);
  expect(hexColor2.toColor().B).toBe(color.B);
});