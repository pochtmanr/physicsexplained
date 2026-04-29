import { describe, expect, it } from "vitest";
import {
  fourVelocity,
  minkowskiNormSquared,
  properTimeAlongWorldline,
  rapidityFromBeta,
  betaFromRapidity,
} from "@/lib/physics/relativity/four-vectors";
import { boostX, gamma } from "@/lib/physics/relativity/types";
import { SPEED_OF_LIGHT } from "@/lib/physics/constants";
import type { MinkowskiPoint, Vec4 } from "@/lib/physics/relativity/types";

const c = SPEED_OF_LIGHT;

describe("fourVelocity", () => {
  it("at rest is (c, 0, 0, 0)", () => {
    const u = fourVelocity({ x: 0, y: 0, z: 0 });
    expect(u[0]).toBeCloseTo(c, 6);
    expect(u[1]).toBe(0);
    expect(u[2]).toBe(0);
    expect(u[3]).toBe(0);
  });

  it("scales as γ(c, v) for any sub-luminal collinear velocity", () => {
    for (const beta of [0.1, 0.3, 0.5, 0.8, 0.99]) {
      const v = beta * c;
      const u = fourVelocity({ x: v, y: 0, z: 0 });
      const g = gamma(beta);
      expect(u[0]).toBeCloseTo(g * c, 4);
      expect(u[1]).toBeCloseTo(g * v, 4);
      expect(u[2]).toBe(0);
      expect(u[3]).toBe(0);
    }
  });

  it("Minkowski norm-squared equals c² exactly for every four-velocity", () => {
    // u^μ u_μ = γ²(c² − |v|²) = c², for every β ∈ (−1, 1) and every direction.
    const cases: { x: number; y: number; z: number }[] = [
      { x: 0, y: 0, z: 0 },
      { x: 0.3 * c, y: 0, z: 0 },
      { x: 0, y: 0.5 * c, z: 0 },
      { x: 0, y: 0, z: 0.7 * c },
      { x: 0.4 * c, y: 0.4 * c, z: 0.4 * c }, // |v|/c = √0.48 ≈ 0.693
      { x: -0.6 * c, y: 0.2 * c, z: -0.1 * c },
      { x: 0.99 * c, y: 0, z: 0 },
    ];
    for (const v of cases) {
      const u = fourVelocity(v);
      const norm = minkowskiNormSquared(u);
      // Relative tolerance scaled to c² magnitude (~9e16).
      expect(norm / (c * c)).toBeCloseTo(1, 6);
    }
  });

  it("transforms covariantly: a Lorentz boost of u^μ matches the four-velocity in the boosted frame", () => {
    // Particle moving at u' = 0.3 c along +x in frame S.
    // Boost into a frame S' moving at β = 0.5 c along +x relative to S.
    // The particle's velocity in S' (by relativistic velocity-subtraction)
    // is u_in_Sprime = (u' − v) / (1 − u'v/c²).
    const uInS = 0.3 * c;
    const beta = 0.5;
    const v = beta * c;
    const uInSprime = (uInS - v) / (1 - (uInS * v) / (c * c));
    const fourVelInS = fourVelocity({ x: uInS, y: 0, z: 0 });
    const fourVelInSprime = fourVelocity({ x: uInSprime, y: 0, z: 0 });

    // Apply the boost matrix to the four-velocity in S; should equal the
    // four-velocity computed directly in S'.
    const M = boostX(beta);
    const transformed: Vec4 = [
      M[0][0] * fourVelInS[0] + M[0][1] * fourVelInS[1],
      M[1][0] * fourVelInS[0] + M[1][1] * fourVelInS[1],
      0,
      0,
    ];
    expect(transformed[0]).toBeCloseTo(fourVelInSprime[0], 0);
    expect(transformed[1]).toBeCloseTo(fourVelInSprime[1], 0);
  });

  it("throws via gamma when |v| ≥ c (no four-velocity for light in this normalisation)", () => {
    expect(() => fourVelocity({ x: c, y: 0, z: 0 })).toThrow(RangeError);
    expect(() => fourVelocity({ x: 1.01 * c, y: 0, z: 0 })).toThrow(RangeError);
  });
});

describe("properTimeAlongWorldline", () => {
  it("returns 0 for fewer than 2 events", () => {
    expect(properTimeAlongWorldline([])).toBe(0);
    expect(
      properTimeAlongWorldline([{ t: 0, x: 0, y: 0, z: 0 }]),
    ).toBe(0);
  });

  it("equals lab time for a stationary worldline (β = 0 ⇒ τ = t)", () => {
    const events: MinkowskiPoint[] = [];
    for (let i = 0; i <= 10; i++) {
      events.push({ t: i, x: 0, y: 0, z: 0 });
    }
    const tau = properTimeAlongWorldline(events);
    expect(tau).toBeCloseTo(10, 12);
  });

  it("equals lab_time / γ for a uniform-velocity worldline (the §02.1 time-dilation result, recovered)", () => {
    for (const beta of [0.1, 0.5, 0.9, 0.99]) {
      const v = beta * c;
      const labTime = 10;
      const events: MinkowskiPoint[] = [];
      for (let i = 0; i <= 100; i++) {
        const t = (i / 100) * labTime;
        events.push({ t, x: v * t, y: 0, z: 0 });
      }
      const tau = properTimeAlongWorldline(events);
      expect(tau).toBeCloseTo(labTime / gamma(beta), 8);
    }
  });

  it("kinked worldline (twin-paradox geometry) accumulates less proper time than the straight one", () => {
    // Home twin: stationary at x = 0 from t = 0 to t = 10.
    const home: MinkowskiPoint[] = [
      { t: 0, x: 0, y: 0, z: 0 },
      { t: 10, x: 0, y: 0, z: 0 },
    ];
    // Traveling twin: moves at +0.6c outbound for half the time, then −0.6c back.
    // Use enough sample points that trapezoidal integration is accurate.
    const v = 0.6 * c;
    const traveler: MinkowskiPoint[] = [];
    for (let i = 0; i <= 100; i++) {
      const t = (i / 100) * 10;
      const x = t < 5 ? v * t : v * 5 - v * (t - 5);
      traveler.push({ t, x, y: 0, z: 0 });
    }
    const tauHome = properTimeAlongWorldline(home);
    const tauTraveler = properTimeAlongWorldline(traveler);
    expect(tauHome).toBeCloseTo(10, 12);
    // Each segment has |β| = 0.6, γ = 1.25, so τ_traveler = 10 / 1.25 = 8.
    expect(tauTraveler).toBeCloseTo(8, 4);
    expect(tauTraveler).toBeLessThan(tauHome);
  });

  it("skips lightlike segments (β = 1) and superluminal segments without throwing", () => {
    const events: MinkowskiPoint[] = [
      { t: 0, x: 0, y: 0, z: 0 },
      { t: 1, x: c, y: 0, z: 0 }, // lightlike: β = 1 — skipped
      { t: 2, x: c, y: 0, z: 0 }, // stationary segment — τ contribution 1
    ];
    const tau = properTimeAlongWorldline(events);
    expect(tau).toBeCloseTo(1, 12);
  });
});

describe("rapidity ↔ beta", () => {
  it("β = 0 ⇔ η = 0", () => {
    expect(rapidityFromBeta(0)).toBe(0);
    expect(betaFromRapidity(0)).toBe(0);
  });

  it("rapidity is additive where velocity is not — η₁ + η₂ corresponds to relativistic velocity-addition", () => {
    // Two collinear boosts at β₁ = 0.6 and β₂ = 0.6 compose to β = 1.2/1.36 ≈ 0.882.
    const eta1 = rapidityFromBeta(0.6);
    const eta2 = rapidityFromBeta(0.6);
    const composed = betaFromRapidity(eta1 + eta2);
    expect(composed).toBeCloseTo(1.2 / 1.36, 12);
  });

  it("round-trip identity: betaFromRapidity(rapidityFromBeta(β)) = β", () => {
    for (const beta of [-0.99, -0.5, -0.1, 0.1, 0.5, 0.99]) {
      expect(betaFromRapidity(rapidityFromBeta(beta))).toBeCloseTo(beta, 12);
    }
  });

  it("throws on |β| ≥ 1 — light is the η → ∞ asymptote, never reached", () => {
    expect(() => rapidityFromBeta(1)).toThrow(RangeError);
    expect(() => rapidityFromBeta(1.01)).toThrow(RangeError);
    expect(() => rapidityFromBeta(-1)).toThrow(RangeError);
  });
});
