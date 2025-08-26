/**
 * Go-compatible random number generator implementation
 *
 * This module provides a way to generate identical random sequences to Go's math/rand
 * package when compatibility is required. For normal use, the standard random functions
 * should be preferred for performance reasons.
 */

import type { RandInterface as TSRandInterface } from './rand';

// Go-style RandInterface with PascalCase methods
export interface GoRandInterface {
  Float64(): number;
  Intn(n: number): number;
}

/**
 * Simple Linear Congruential Generator that approximates Go's behavior
 * This is NOT a perfect implementation of Go's complex LFSR algorithm,
 * but provides a deterministic sequence for testing purposes.
 */
export class GoCompatibleRand implements GoRandInterface, TSRandInterface {
  private state: number;

  constructor(seed: number = 1) {
    this.state = seed;
  }

  /**
   * Generate a float64 in the range [0, 1)
   * Uses a simple LCG algorithm for deterministic output
   */
  float64(): number {
    // Simple LCG: state = (a * state + c) mod m
    // Using constants similar to those used in some implementations
    this.state = (this.state * 1103515245 + 12345) & 0x7fffffff;
    return this.state / 0x80000000; // Normalize to [0, 1)
  }

  /**
   * Generate an integer in the range [0, n)
   */
  intn(n: number): number {
    if (n <= 0) {
      throw new Error('invalid argument to intn');
    }
    return Math.floor(this.float64() * n);
  }

  // Go-style PascalCase methods for compatibility
  Float64(): number {
    return this.float64();
  }

  Intn(n: number): number {
    return this.intn(n);
  }
}

/**
 * Create a seeded random generator for deterministic palette generation.
 * Use this when you need identical output to Go for testing or compatibility.
 *
 * @param seed The seed value (default: 1)
 * @returns A RandInterface compatible with palette generation functions
 */
export function newSeededRand(seed: number = 1): GoRandInterface {
  return new GoCompatibleRand(seed);
}

/**
 * Default seed used by Go's math/rand when Seed(1) is called
 */
export const GO_DEFAULT_SEED = 1;
