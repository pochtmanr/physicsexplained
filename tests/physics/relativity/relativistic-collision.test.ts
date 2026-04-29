import { describe, expect, it } from "vitest";
import {
  totalFourMomentum,
  fourMomentaEqual,
  inelasticMergerMass,
} from "@/lib/physics/relativity/relativistic-collision";
import {
  fourMomentum,
  boostFourMomentum,
} from "@/lib/physics/relativity/four-momentum";
import { gamma } from "@/lib/physics/relativity/types";
import { SPEED_OF_LIGHT } from "@/lib/physics/constants";

describe("totalFourMomentum", () => {
  it("sums componentwise and returns the zero 4-vector for empty input", () => {
    expect(totalFourMomentum([])).toEqual([0, 0, 0, 0]);
  });

  it("is the algebraic sum of its inputs", () => {
    const a = [1, 2, 3, 4] as const;
    const b = [10, 20, 30, 40] as const;
    const c = [-5, -6, -7, -8] as const;
    expect(totalFourMomentum([a, b, c])).toEqual([6, 16, 26, 36]);
  });

  it("is order-independent (Σ p^μ is invariant under permutation)", () => {
    const c = SPEED_OF_LIGHT;
    const p1 = fourMomentum(1, { x: 0.3 * c, y: 0, z: 0 });
    const p2 = fourMomentum(2, { x: 0, y: 0.4 * c, z: 0 });
    const p3 = fourMomentum(3, { x: 0.1 * c, y: 0.1 * c, z: 0.1 * c });
    const sumA = totalFourMomentum([p1, p2, p3]);
    const sumB = totalFourMomentum([p3, p1, p2]);
    expect(fourMomentaEqual(sumA, sumB)).toBe(true);
  });
});

describe("fourMomentaEqual", () => {
  it("returns true for exactly equal vectors", () => {
    expect(fourMomentaEqual([1, 2, 3, 4], [1, 2, 3, 4])).toBe(true);
  });

  it("returns false when any one component differs by more than eps", () => {
    expect(fourMomentaEqual([1, 2, 3, 4], [1, 2, 3, 5])).toBe(false);
    expect(fourMomentaEqual([1, 2, 3, 4], [1.1, 2, 3, 4])).toBe(false);
  });

  it("respects the eps tolerance for float-noise comparisons", () => {
    const a = [1, 2, 3, 4] as const;
    const b = [1 + 1e-13, 2 - 1e-13, 3, 4] as const;
    expect(fourMomentaEqual(a, b)).toBe(true);
    expect(fourMomentaEqual(a, b, 1e-15)).toBe(false);
  });
});

describe("conservation of four-momentum in 1D elastic head-on collision", () => {
  // Two equal-mass particles approaching each other along ±x at ±β.
  // In the elastic case both rest masses are preserved AND total p^μ is
  // preserved. After a 1D elastic collision the lab-frame outcome is a
  // simple velocity swap (relativistic billiard balls) — but more strongly,
  // the easier check is that totalP_in equals totalP_out for any valid
  // outgoing pair that elastically conserves both p and KE.
  it("for symmetric head-on β = ±0.4 the total spatial momentum is zero", () => {
    const c = SPEED_OF_LIGHT;
    const m = 1; // kg
    const p1 = fourMomentum(m, { x: 0.4 * c, y: 0, z: 0 });
    const p2 = fourMomentum(m, { x: -0.4 * c, y: 0, z: 0 });
    const tot = totalFourMomentum([p1, p2]);
    expect(Math.abs(tot[1])).toBeLessThan(1e-9);
    expect(Math.abs(tot[2])).toBeLessThan(1e-9);
    expect(Math.abs(tot[3])).toBeLessThan(1e-9);
    // Time component is 2γm c > 2mc since both particles are moving.
    const g = gamma(0.4);
    expect(tot[0]).toBeCloseTo(2 * g * m * c, 6);
  });

  it("for an asymmetric elastic 'velocity swap' the totals match before/after to numerical precision", () => {
    const c = SPEED_OF_LIGHT;
    const m = 1;
    // Before: p1 at +0.5c, p2 at rest. Newtonian outcome (equal masses):
    // p1' at rest, p2' at +0.5c. The relativistic answer happens to be
    // the same for equal masses in 1D elastic, since total p^μ is unique
    // and the |p|=fixed, m=fixed pair is the "swap".
    const p1 = fourMomentum(m, { x: 0.5 * c, y: 0, z: 0 });
    const p2 = fourMomentum(m, { x: 0, y: 0, z: 0 });
    const totalIn = totalFourMomentum([p1, p2]);

    const p1prime = fourMomentum(m, { x: 0, y: 0, z: 0 });
    const p2prime = fourMomentum(m, { x: 0.5 * c, y: 0, z: 0 });
    const totalOut = totalFourMomentum([p1prime, p2prime]);

    expect(fourMomentaEqual(totalIn, totalOut, 1e-6)).toBe(true);
  });
});

describe("inelasticMergerMass — when kinetic energy becomes rest mass", () => {
  it("two equal-mass particles at β = 0 merge into 2m (Newtonian limit)", () => {
    // Both at rest: γ = 1, m_final = 2m exactly. (Edge case: total p is
    // [2mc, 0, 0, 0], invariant mass = 2m.)
    const m = 3.5; // arbitrary
    const mFinal = inelasticMergerMass(m, 0, m, 0);
    expect(mFinal).toBeCloseTo(2 * m, 12);
  });

  it("two equal-mass particles at β = ±0.5 merge into 2γm = 2.30940m", () => {
    const m = 1.0;
    const mFinal = inelasticMergerMass(m, 0.5, m, -0.5);
    const expected = 2 * gamma(0.5) * m; // 2 / sqrt(1 − 0.25) = 2/sqrt(0.75) ≈ 2.3094011
    expect(mFinal).toBeCloseTo(expected, 9);
    // And it's strictly greater than the Newtonian 2m — this is the
    // dramatic relativistic result.
    expect(mFinal).toBeGreaterThan(2 * m);
    // Numerical check against the closed form 2/√0.75:
    expect(mFinal).toBeCloseTo(2.3094010767585034, 9);
  });

  it("at β small the excess mass scales as β² (Newtonian limit smoothly recovered)", () => {
    const m = 1.0;
    const beta = 0.01;
    const mFinal = inelasticMergerMass(m, beta, m, -beta);
    // 2γ ≈ 2(1 + β²/2) = 2 + β². Excess ≈ β² m.
    const excess = mFinal - 2 * m;
    const predicted = beta * beta * m; // leading order in β
    // Allow 5% relative slop because the next term is O(β⁴).
    expect(excess).toBeGreaterThan(0);
    expect(excess / predicted).toBeGreaterThan(0.99);
    expect(excess / predicted).toBeLessThan(1.02);
  });

  it("merger of unequal masses at zero velocity is just m1 + m2 (no kinetic energy)", () => {
    const mFinal = inelasticMergerMass(2, 0, 5, 0);
    expect(mFinal).toBeCloseTo(7, 12);
  });

  it("invariant mass is unchanged by an overall Lorentz boost (Lorentz invariance check)", () => {
    // Compute the merger's invariant mass directly, then transform both
    // input four-momenta to a different inertial frame, sum, and recover
    // the same invariant mass. (m²c² = p^μ p_μ is the Lorentz scalar.)
    const c = SPEED_OF_LIGHT;
    const m = 1.0;
    const beta = 0.5;
    const mFinalLab = inelasticMergerMass(m, beta, m, -beta);

    // Boost both inputs by 0.3c along +x and recompute invariant mass.
    const p1Lab = fourMomentum(m, { x: beta * c, y: 0, z: 0 });
    const p2Lab = fourMomentum(m, { x: -beta * c, y: 0, z: 0 });
    const p1Boosted = boostFourMomentum(p1Lab, 0.3);
    const p2Boosted = boostFourMomentum(p2Lab, 0.3);
    const totalBoosted = totalFourMomentum([p1Boosted, p2Boosted]);
    // m²c² = (p^0)² − |p|²
    const m2c2 =
      totalBoosted[0] * totalBoosted[0] -
      totalBoosted[1] * totalBoosted[1] -
      totalBoosted[2] * totalBoosted[2] -
      totalBoosted[3] * totalBoosted[3];
    const mFinalBoosted = Math.sqrt(m2c2) / c;
    expect(mFinalBoosted).toBeCloseTo(mFinalLab, 6);
  });
});
