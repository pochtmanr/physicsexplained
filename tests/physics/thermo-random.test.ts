import { describe, it, expect } from "vitest";
import {
  createRng,
  randomInt,
  randomRange,
  gaussian,
  shuffled,
} from "@/lib/physics/thermodynamics/random";

describe("seeded RNG", () => {
  it("is deterministic for a given seed", () => {
    const a = createRng(42);
    const b = createRng(42);
    for (let i = 0; i < 100; i++) expect(a()).toBe(b());
  });

  it("diverges for different seeds", () => {
    const a = createRng(1);
    const b = createRng(2);
    const sa = Array.from({ length: 10 }, () => a());
    const sb = Array.from({ length: 10 }, () => b());
    expect(sa).not.toEqual(sb);
  });

  it("stays within [0, 1)", () => {
    const r = createRng(123);
    for (let i = 0; i < 1000; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("is roughly uniform in mean", () => {
    const r = createRng(99);
    let sum = 0;
    const n = 20000;
    for (let i = 0; i < n; i++) sum += r();
    expect(sum / n).toBeCloseTo(0.5, 2);
  });

  it("randomInt covers [0, max)", () => {
    const r = createRng(5);
    for (let i = 0; i < 500; i++) {
      const k = randomInt(r, 7);
      expect(k).toBeGreaterThanOrEqual(0);
      expect(k).toBeLessThan(7);
      expect(Number.isInteger(k)).toBe(true);
    }
  });

  it("randomRange respects bounds", () => {
    const r = createRng(8);
    for (let i = 0; i < 500; i++) {
      const v = randomRange(r, -3, 3);
      expect(v).toBeGreaterThanOrEqual(-3);
      expect(v).toBeLessThan(3);
    }
  });

  it("gaussian has ~unit variance about its mean", () => {
    const r = createRng(2024);
    const n = 20000;
    let sum = 0;
    let sumSq = 0;
    for (let i = 0; i < n; i++) {
      const g = gaussian(r, 0, 1);
      sum += g;
      sumSq += g * g;
    }
    const mean = sum / n;
    const variance = sumSq / n - mean * mean;
    expect(mean).toBeCloseTo(0, 1);
    expect(variance).toBeCloseTo(1, 1);
  });

  it("shuffled is a permutation and leaves the input intact", () => {
    const r = createRng(11);
    const input = [1, 2, 3, 4, 5, 6];
    const out = shuffled(r, input);
    expect(out.slice().sort()).toEqual(input);
    expect(input).toEqual([1, 2, 3, 4, 5, 6]);
  });
});
