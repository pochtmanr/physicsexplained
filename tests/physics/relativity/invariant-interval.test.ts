import { describe, expect, it } from "vitest";
import { SPEED_OF_LIGHT } from "@/lib/physics/constants";
import {
  applyMatrix,
  boostX,
  pointToVec4,
  vec4ToPoint,
  intervalSquared,
  type MinkowskiPoint,
} from "@/lib/physics/relativity/types";
import {
  intervalReport,
  properTimeStraightWorldline,
} from "@/lib/physics/relativity/invariant-interval";

const C = SPEED_OF_LIGHT;

/**
 * Apply a Lorentz boost along x at velocity βc to a Minkowski event.
 * Convenience wrapper for the invariance tests.
 */
function lorentzBoostEvent(p: MinkowskiPoint, beta: number, c: number): MinkowskiPoint {
  return vec4ToPoint(applyMatrix(boostX(beta), pointToVec4(p, c)), c);
}

describe("intervalReport", () => {
  it("classifies a timelike pair (origin → future event inside the light cone)", () => {
    const p1: MinkowskiPoint = { t: 0, x: 0, y: 0, z: 0 };
    // Δct = c · 2 s, Δx = c · 1 s ⇒ s² = c²(4 − 1) > 0
    const p2: MinkowskiPoint = { t: 2, x: C * 1, y: 0, z: 0 };
    const r = intervalReport(p1, p2, C);
    expect(r.s2).toBeGreaterThan(0);
    expect(r.quadrant).toBe("timelike-future");
  });

  it("classifies a spacelike pair (Δx > c·Δt) as spacelike", () => {
    const p1: MinkowskiPoint = { t: 0, x: 0, y: 0, z: 0 };
    const p2: MinkowskiPoint = { t: 0.5, x: C * 1.5, y: 0, z: 0 };
    const r = intervalReport(p1, p2, C);
    expect(r.s2).toBeLessThan(0);
    expect(r.quadrant).toBe("spacelike");
  });

  it("classifies a null pair (Δx = c·Δt) as null-future", () => {
    const p1: MinkowskiPoint = { t: 0, x: 0, y: 0, z: 0 };
    const p2: MinkowskiPoint = { t: 1, x: C * 1, y: 0, z: 0 };
    const r = intervalReport(p1, p2, C);
    // (cT)² ≈ 9e16, so use scale-relative tolerance (FP noise dominates absolute).
    expect(Math.abs(r.s2) / (C * C)).toBeLessThan(1e-12);
    expect(r.quadrant).toBe("null-future");
  });
});

describe("Lorentz invariance of s² (the headline fact)", () => {
  // The plan's required invariant check: s² is preserved under boostX(β)
  // for any β. We sweep a representative range of β and confirm.
  const events: [MinkowskiPoint, MinkowskiPoint, string][] = [
    [
      { t: 0, x: 0, y: 0, z: 0 },
      { t: 2, x: C * 1, y: 0, z: 0 },
      "timelike",
    ],
    [
      { t: 0, x: 0, y: 0, z: 0 },
      { t: 0.5, x: C * 1.5, y: 0, z: 0 },
      "spacelike",
    ],
    [
      { t: 0, x: 0, y: 0, z: 0 },
      { t: 1, x: C * 1, y: 0, z: 0 },
      "null",
    ],
  ];

  it.each(events)(
    "%s interval is invariant under boostX for β ∈ {-0.9, -0.5, 0, 0.3, 0.7, 0.9}",
    (p1, p2) => {
      const s2Lab = intervalSquared(p1, p2, C);
      // Reference scale for relative-error comparison is (c·t_max)², the
      // largest individual term contributing to s². With c ≈ 3e8 and t ≈ 2 s
      // this is ≈ 4e17, so 64-bit FP noise is at most ≈ 1e-15 · 4e17 ≈ 0.5
      // — relative tolerance 1e-12 is generous and still proves invariance.
      const refScale = (C * Math.max(Math.abs(p1.t), Math.abs(p2.t), 1)) ** 2;
      for (const beta of [-0.9, -0.5, 0, 0.3, 0.7, 0.9]) {
        const p1b = lorentzBoostEvent(p1, beta, C);
        const p2b = lorentzBoostEvent(p2, beta, C);
        const s2Boosted = intervalSquared(p1b, p2b, C);
        expect(Math.abs(s2Lab - s2Boosted) / refScale).toBeLessThan(1e-12);
      }
    },
  );

  it("s² = 0 on the light cone for any (Δt, Δx) with Δx = c·Δt, in any boosted frame", () => {
    // A photon worldline event: (Δt = T, Δx = c·T) for any T > 0.
    for (const T of [0.1, 1, 5, 100]) {
      const p1: MinkowskiPoint = { t: 0, x: 0, y: 0, z: 0 };
      const p2: MinkowskiPoint = { t: T, x: C * T, y: 0, z: 0 };
      // Tolerance relative to (c·T)² scale to absorb FP error from boost.
      const scale = (C * T) * (C * T);
      expect(Math.abs(intervalSquared(p1, p2, C)) / scale).toBeLessThan(1e-12);
      // Boost it — still null.
      for (const beta of [-0.8, -0.3, 0.4, 0.95]) {
        const p1b = lorentzBoostEvent(p1, beta, C);
        const p2b = lorentzBoostEvent(p2, beta, C);
        const s2 = intervalSquared(p1b, p2b, C);
        expect(Math.abs(s2) / scale).toBeLessThan(1e-12);
      }
    }
  });
});

describe("properTimeStraightWorldline", () => {
  it("equals the lab time for a stationary clock (Δx = 0)", () => {
    const p1: MinkowskiPoint = { t: 0, x: 0, y: 0, z: 0 };
    const p2: MinkowskiPoint = { t: 7, x: 0, y: 0, z: 0 };
    expect(properTimeStraightWorldline(p1, p2, C)).toBeCloseTo(7, 12);
  });

  it("is shorter than the lab time for a moving clock (the time-dilation fact)", () => {
    // Clock moving at β = 0.6: γ = 1.25, so proper time = lab time / γ = 0.8 · Δt.
    const beta = 0.6;
    const dt = 5;
    const p1: MinkowskiPoint = { t: 0, x: 0, y: 0, z: 0 };
    const p2: MinkowskiPoint = { t: dt, x: beta * C * dt, y: 0, z: 0 };
    const tau = properTimeStraightWorldline(p1, p2, C);
    expect(tau).toBeCloseTo(dt * Math.sqrt(1 - beta * beta), 10);
    expect(tau).toBeCloseTo(dt * 0.8, 10);
  });

  it("is invariant under boostX (proper time depends on s² alone)", () => {
    const beta0 = 0.6;
    const dt = 5;
    const p1: MinkowskiPoint = { t: 0, x: 0, y: 0, z: 0 };
    const p2: MinkowskiPoint = { t: dt, x: beta0 * C * dt, y: 0, z: 0 };
    const tauLab = properTimeStraightWorldline(p1, p2, C);
    for (const beta of [-0.7, -0.2, 0.4, 0.85]) {
      const p1b = lorentzBoostEvent(p1, beta, C);
      const p2b = lorentzBoostEvent(p2, beta, C);
      expect(properTimeStraightWorldline(p1b, p2b, C)).toBeCloseTo(tauLab, 10);
    }
  });

  it("returns 0 on a null interval (a photon ages zero along its worldline)", () => {
    const p1: MinkowskiPoint = { t: 0, x: 0, y: 0, z: 0 };
    const p2: MinkowskiPoint = { t: 3, x: C * 3, y: 0, z: 0 };
    expect(properTimeStraightWorldline(p1, p2, C)).toBeCloseTo(0, 10);
  });

  it("throws RangeError on a spacelike interval", () => {
    const p1: MinkowskiPoint = { t: 0, x: 0, y: 0, z: 0 };
    const p2: MinkowskiPoint = { t: 0.5, x: C * 1.5, y: 0, z: 0 };
    expect(() => properTimeStraightWorldline(p1, p2, C)).toThrow(RangeError);
    expect(() => properTimeStraightWorldline(p1, p2, C)).toThrow(/spacelike/);
  });
});
