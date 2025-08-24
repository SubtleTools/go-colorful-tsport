// Isolate the specific issue causing timeout
import * as GoStyle from './src/go-style';

console.log('Testing Go-style color creation...');
const red = new GoStyle.Color(1, 0, 0);
const blue = new GoStyle.Color(0, 0, 1);
console.log('Colors created successfully');

console.log('Testing basic blending...');
const blendRgb = red.BlendRgb(blue, 0.5);
console.log('RGB blend:', blendRgb);

console.log('Testing Lab blending...');
const blendLab = red.BlendLab(blue, 0.5);
console.log('Lab blend:', blendLab);

console.log('Testing OkLab blending...');
try {
  const blendOkLab = red.BlendOkLab(blue, 0.5);
  console.log('OkLab blend:', blendOkLab);
} catch (e) {
  console.error('OkLab blend failed:', e);
}

console.log('All tests completed');