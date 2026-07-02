import { describe, it, expect } from "vitest";
import {
  binomial,
  lnBinomial,
  lnFactorial,
  macrostateProbability,
  occupancyMean,
  occupancyStdDev,
  relativeFluctuation,
  gaussianProbability,
} from "@/lib/physics/thermodynamics/multiplicity";

describe("binomial multiplicity", () => {
  it("reproduces the FIG.11 hook: ten coins", () => {
    expect(binomial(10, 5)).toBe(252);
    expect(binomial(10, 10)).toBe(1);
    expect(binomial(10, 0)).toBe(1);
  });

  it("is symmetric and obeys Pascal's rule", () => {
    expect(binomial(20, 7)).toBe(binomial(20, 13));
    expect(binomial(20, 7)).toBe(binomial(19, 6) + binomial(19, 7));
  });

  it("returns 0 outside [0, N]", () => {
    expect(binomial(10, -1)).toBe(0);
    expect(binomial(10, 11)).toBe(0);
    expect(lnBinomial(10, 11)).toBe(-Infinity);
  });

  it("lnFactorial matches exact small factorials", () => {
    expect(Math.exp(lnFactorial(0))).toBeCloseTo(1, 9);
    expect(Math.exp(lnFactorial(5))).toBeCloseTo(120, 6);
    expect(Math.exp(lnFactorial(10))).toBeCloseTo(3628800, 2);
  });

  it("lnBinomial stays finite where the raw coefficient overflows", () => {
    const v = lnBinomial(1_000_000, 500_000);
    expect(Number.isFinite(v)).toBe(true);
    expect(v).toBeGreaterThan(0);
  });
});

describe("macrostate probability", () => {
  it("matches C(N,k)/2^N for ten coins", () => {
    expect(macrostateProbability(10, 5)).toBeCloseTo(252 / 1024, 12);
    expect(macrostateProbability(10, 10)).toBeCloseTo(1 / 1024, 12);
  });

  it("is a normalised distribution", () => {
    const n = 40;
    let sum = 0;
    for (let k = 0; k <= n; k++) sum += macrostateProbability(n, k);
    expect(sum).toBeCloseTo(1, 10);
  });
});

describe("occupancy statistics", () => {
  it("peaks at N/2 with width sqrt(N)/2", () => {
    expect(occupancyMean(100)).toBe(50);
    expect(occupancyStdDev(100)).toBeCloseTo(5, 12); // sqrt(100/4)
    expect(occupancyStdDev(100)).toBeCloseTo(Math.sqrt(100) / 2, 12);
  });

  it("relative fluctuation vanishes like 1/sqrt(N)", () => {
    expect(relativeFluctuation(100)).toBeCloseTo(0.1, 12);
    expect(relativeFluctuation(1e22)).toBeLessThan(1e-10);
  });
});

describe("gaussian limit", () => {
  it("tracks the exact binomial near the peak for moderate N", () => {
    const n = 200;
    for (const k of [90, 100, 110]) {
      const approx = gaussianProbability(n, k);
      const exact = macrostateProbability(n, k);
      // de Moivre–Laplace: relative error is O(1/N), ~1% at N = 200.
      expect(Math.abs(approx - exact) / exact).toBeLessThan(0.02);
    }
  });
});
