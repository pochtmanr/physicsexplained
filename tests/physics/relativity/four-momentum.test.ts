import { describe, expect, it } from "vitest";
import {
  fourMomentum,
  photonFourMomentum,
  energyFromFourMomentum,
  minkowskiNormSquared,
  boostFourMomentum,
} from "@/lib/physics/relativity/four-momentum";
import { ELECTRON_MASS, SPEED_OF_LIGHT } from "@/lib/physics/constants";
import { gamma } from "@/lib/physics/relativity/types";
import type { FourMomentum } from "@/lib/physics/relativity/types";

describe("fourMomentum", () => {
  it("stationary particle has p^μ = (mc, 0, 0, 0)", () => {
    const c = 1;
    const m = 2.5;
    const p = fourMomentum(m, { x: 0, y: 0, z: 0 }, c);
    expect(p[0]).toBeCloseTo(m * c, 12);
    expect(p[1]).toBeCloseTo(0, 12);
    expect(p[2]).toBeCloseTo(0, 12);
    expect(p[3]).toBeCloseTo(0, 12);
  });

  it("norm-squared equals m²c² for any v < c (natural units)", () => {
    const c = 1;
    const m = 1.7;
    for (const beta of [0, 0.1, 0.3, 0.6, 0.9, 0.99]) {
      const p = fourMomentum(m, { x: beta * c, y: 0, z: 0 }, c);
      expect(minkowskiNormSquared(p)).toBeCloseTo(m * m * c * c, 8);
    }
  });

  it("γ-scaling: at β = 0.6, p^0 = γmc and p^1 = γmβc", () => {
    const c = 1;
    const m = 1;
    const v = 0.6;
    const p = fourMomentum(m, { x: v, y: 0, z: 0 }, c);
    const g = gamma(v); // β = v/c = 0.6 in natural units
    expect(p[0]).toBeCloseTo(g * m * c, 10);
    expect(p[1]).toBeCloseTo(g * m * v, 10);
  });

  it("throws for v ≥ c (gamma blows up)", () => {
    expect(() => fourMomentum(1, { x: SPEED_OF_LIGHT, y: 0, z: 0 })).toThrow(
      RangeError,
    );
  });
});

describe("photonFourMomentum", () => {
  it("photon norm-squared is exactly zero (null four-momentum)", () => {
    const c = 1;
    const p = photonFourMomentum(2.5, { x: 1, y: 0, z: 0 }, c);
    expect(minkowskiNormSquared(p)).toBeCloseTo(0, 12);
  });

  it("E = pc for a photon: |p| equals E/c", () => {
    const c = 1;
    const E = 3.7;
    const p = photonFourMomentum(E, { x: 0, y: 1, z: 0 }, c);
    const pMag = Math.sqrt(p[1] * p[1] + p[2] * p[2] + p[3] * p[3]);
    expect(pMag).toBeCloseTo(E / c, 12);
    expect(p[0]).toBeCloseTo(E / c, 12);
  });

  it("throws on non-unit direction", () => {
    expect(() =>
      photonFourMomentum(1, { x: 1, y: 1, z: 0 }),
    ).toThrow(RangeError);
  });
});

describe("energyFromFourMomentum", () => {
  it("recovers E from p^0 · c", () => {
    const c = 2.99792458e8;
    const m = ELECTRON_MASS;
    const p = fourMomentum(m, { x: 0, y: 0, z: 0 }, c);
    const E = energyFromFourMomentum(p, c);
    // At rest, E = mc²
    expect(E).toBeCloseTo(m * c * c, 25); // ~8e-14 J, plenty of double precision
  });
});

describe("boostFourMomentum invariance", () => {
  it("preserves the Minkowski norm m²c² for any β (massive)", () => {
    const c = 1;
    const m = 1.3;
    const p = fourMomentum(m, { x: 0.4, y: 0.2, z: 0 }, c);
    const norm0 = minkowskiNormSquared(p);
    for (const beta of [-0.95, -0.5, -0.1, 0, 0.1, 0.5, 0.95]) {
      const pBoosted = boostFourMomentum(p, beta);
      expect(minkowskiNormSquared(pBoosted)).toBeCloseTo(norm0, 8);
      expect(minkowskiNormSquared(pBoosted)).toBeCloseTo(m * m * c * c, 8);
    }
  });

  it("preserves the null condition for a photon under any boost", () => {
    const c = 1;
    const photon = photonFourMomentum(5.0, { x: 1, y: 0, z: 0 }, c);
    for (const beta of [-0.7, -0.2, 0.1, 0.5, 0.9]) {
      const boosted = boostFourMomentum(photon, beta);
      expect(minkowskiNormSquared(boosted)).toBeCloseTo(0, 8);
    }
  });

  it("perpendicular components untouched by +x boost", () => {
    const p: FourMomentum = [3, 0, 1.5, -0.7];
    const boosted = boostFourMomentum(p, 0.6);
    expect(boosted[2]).toBeCloseTo(p[2], 10);
    expect(boosted[3]).toBeCloseTo(p[3], 10);
  });
});

describe("energy-momentum-mass triangle E² = (pc)² + (mc²)²", () => {
  it("checks for a 1 GeV electron", () => {
    const c = SPEED_OF_LIGHT;
    const m = ELECTRON_MASS;
    const E = 1.602176634e-10; // 1 GeV in joules
    // Solve for |p| from the triangle: (pc)² = E² − (mc²)²
    const mc2 = m * c * c;
    const pcSq = E * E - mc2 * mc2;
    const pMag = Math.sqrt(pcSq) / c;
    // Build a four-momentum directly with that p along +x.
    const p4: FourMomentum = [E / c, pMag, 0, 0];
    // Norm-squared should equal m²c²
    expect(minkowskiNormSquared(p4)).toBeCloseTo(m * m * c * c, 25);
    // And E recovered from p^0
    expect(energyFromFourMomentum(p4, c)).toBeCloseTo(E, 18);
  });

  it("agrees between fourMomentum() construction and the triangle for β=0.8", () => {
    const c = 1;
    const m = 1;
    const beta = 0.8;
    const g = gamma(beta);
    const p = fourMomentum(m, { x: beta, y: 0, z: 0 }, c);
    const E = energyFromFourMomentum(p, c);
    const pMag = Math.sqrt(p[1] * p[1] + p[2] * p[2] + p[3] * p[3]);
    const lhs = E * E;
    const rhs = pMag * pMag * c * c + m * m * c * c * c * c;
    expect(lhs).toBeCloseTo(rhs, 10);
    // Sanity: γm matches the energy
    expect(E).toBeCloseTo(g * m * c * c, 10);
  });
});
