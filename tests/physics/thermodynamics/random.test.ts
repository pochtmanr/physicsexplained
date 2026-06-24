import { describe, it, expect } from "vitest";
import {
  mulberry32,
  uniform,
  gaussian,
  gaussianWith,
  randomUnitVector2D,
  maxwellVelocity2D,
} from "@/lib/physics/thermodynamics/random";

describe("mulberry32", () => {
  it("is deterministic for a given seed", () => {
    const a = mulberry32(12345);
    const b = mulberry32(12345);
    for (let i = 0; i < 100; i++) expect(a()).toBe(b());
  });

  it("produces variates in [0, 1)", () => {
    const rng = mulberry32(1);
    for (let i = 0; i < 1000; i++) {
      const x = rng();
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });

  it("is roughly uniform on average", () => {
    const rng = mulberry32(7);
    let sum = 0;
    const N = 200000;
    for (let i = 0; i < N; i++) sum += rng();
    expect(sum / N).toBeCloseTo(0.5, 2);
  });
});

describe("uniform", () => {
  it("stays within [min, max)", () => {
    const rng = mulberry32(99);
    for (let i = 0; i < 1000; i++) {
      const x = uniform(rng, -3, 5);
      expect(x).toBeGreaterThanOrEqual(-3);
      expect(x).toBeLessThan(5);
    }
  });
});

describe("gaussian", () => {
  it("has mean ≈ 0 and variance ≈ 1", () => {
    const rng = mulberry32(42);
    const N = 200000;
    let sum = 0;
    let sumSq = 0;
    for (let i = 0; i < N; i++) {
      const x = gaussian(rng);
      sum += x;
      sumSq += x * x;
    }
    const mean = sum / N;
    const variance = sumSq / N - mean * mean;
    expect(mean).toBeCloseTo(0, 1);
    expect(variance).toBeCloseTo(1, 1);
  });

  it("gaussianWith shifts and scales", () => {
    const rng = mulberry32(3);
    const N = 200000;
    let sum = 0;
    let sumSq = 0;
    for (let i = 0; i < N; i++) {
      const x = gaussianWith(rng, 10, 2);
      sum += x;
      sumSq += x * x;
    }
    const mean = sum / N;
    const variance = sumSq / N - mean * mean;
    expect(mean).toBeCloseTo(10, 1);
    expect(variance).toBeCloseTo(4, 0);
  });
});

describe("randomUnitVector2D", () => {
  it("always has unit length", () => {
    const rng = mulberry32(5);
    for (let i = 0; i < 1000; i++) {
      const v = randomUnitVector2D(rng);
      expect(Math.hypot(v.x, v.y)).toBeCloseTo(1, 10);
    }
  });
});

describe("maxwellVelocity2D", () => {
  it("each component has the prescribed variance σ²", () => {
    const rng = mulberry32(8);
    const sigma = 3;
    const N = 200000;
    let sumSq = 0;
    for (let i = 0; i < N; i++) {
      const v = maxwellVelocity2D(rng, sigma);
      sumSq += v.x * v.x;
    }
    expect(sumSq / N).toBeCloseTo(sigma * sigma, 0);
  });
});
