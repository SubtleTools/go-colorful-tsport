import * as GoStyle from '../../../../src/go-style';

// Seeded PRNG class to match Go's behavior
class SeededRand {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  // Linear Congruential Generator (similar to Go's math/rand default)
  float64(): number {
    this.seed = (this.seed * 1103515245 + 12345) % 2 ** 31;
    return this.seed / 2 ** 31;
  }

  intn(n: number): number {
    return Math.floor(this.float64() * n);
  }
}

console.log('=== Test 1: Default random (should be different each run) ===');
const colors1 = GoStyle.FastWarmPalette(3);
for (let i = 0; i < colors1.length; i++) {
  const c = colors1[i];
  console.log(
    `Color ${i}: R=${c.R.toFixed(6)} G=${c.G.toFixed(6)} B=${c.B.toFixed(6)} Hex=${c.Hex()}`
  );
}

console.log("\n=== Test 2: Attempting to match Go's seeded output ===");
// Try various seed approaches to match Go's seed=1 output:
// Expected from Go: Color 0: R=0.538102 G=0.177072 B=0.177072 Hex=#892d2d

console.log('Attempt with seed 1:');
const seeded1 = new SeededRand(1);
for (let i = 0; i < 3; i++) {
  const c = GoStyle.Hsv(
    i * (360.0 / 3),
    0.55 + seeded1.float64() * 0.2,
    0.35 + seeded1.float64() * 0.2
  );
  console.log(
    `Color ${i}: R=${c.R.toFixed(6)} G=${c.G.toFixed(6)} B=${c.B.toFixed(6)} Hex=${c.Hex()}`
  );
}

console.log('\nCurrent time nano equivalent:', Date.now() * 1000000);
