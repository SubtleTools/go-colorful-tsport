export interface RandInterface {
  float64(): number;
  intn(n: number): number;
}

class DefaultGlobalRand implements RandInterface {
  float64(): number {
    return Math.random();
  }

  intn(n: number): number {
    return Math.floor(Math.random() * n);
  }
}

export function getDefaultGlobalRand(): RandInterface {
  return new DefaultGlobalRand();
}
