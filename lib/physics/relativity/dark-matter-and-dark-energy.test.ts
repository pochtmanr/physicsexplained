/**
 * §58 DARK MATTER AND DARK ENERGY — unit tests.
 *
 * Covers the rotation-curve toy (disk falls, halo flattens), the cosmic budget
 * fractions and their crossover redshifts, and the supernova distance modulus /
 * residual that encodes the 1998 acceleration discovery.
 */

import { describe, expect, it } from "vitest";
import {
  circularSpeed,
  diskEnclosedMass,
  haloEnclosedMass,
  diskRotationSpeed,
  totalRotationSpeed,
  componentDensities,
  budgetFractions,
  matterRadiationEquality,
  matterLambdaEquality,
  dimensionlessHubble,
  comovingDistanceDimensionless,
  luminosityDistanceDimensionless,
  distanceModulus,
  distanceModulusResidual,
  cosmologicalConstant,
  vacuumEnergyDiscrepancyLog10,
  CONCORDANCE,
  COSMOLOGIES,
} from "@/lib/physics/relativity/dark-matter-and-dark-energy";

// ─── rotation curves ─────────────────────────────────────────────────────────

describe("circularSpeed", () => {
  it("is v = sqrt(GM/r)", () => {
    expect(circularSpeed(4, 1, 1)).toBeCloseTo(2, 12);
    expect(circularSpeed(0, 5, 1)).toBe(0);
  });
  it("guards r = 0", () => {
    expect(circularSpeed(10, 0)).toBe(0);
  });
});

describe("diskEnclosedMass", () => {
  it("saturates to the total disk mass at large r", () => {
    const m = diskEnclosedMass(100, 1, 1);
    expect(m).toBeGreaterThan(0.99);
    expect(m).toBeLessThanOrEqual(1);
  });
  it("is zero at the centre and monotone increasing", () => {
    expect(diskEnclosedMass(0, 1, 1)).toBe(0);
    expect(diskEnclosedMass(2, 1, 1)).toBeGreaterThan(diskEnclosedMass(1, 1, 1));
  });
});

describe("disk vs total rotation curve", () => {
  it("disk-only curve falls off past the luminous edge", () => {
    // far past the disk, enclosed mass is ~constant, so v ∝ 1/√r and falls.
    const vNear = diskRotationSpeed(4, 1, 1);
    const vFar = diskRotationSpeed(12, 1, 1);
    expect(vFar).toBeLessThan(vNear);
  });

  it("adding a halo lifts and flattens the outer curve", () => {
    const vDisk = diskRotationSpeed(12, 1, 1);
    const vTotal = totalRotationSpeed(12, 1, 1, 0.5, 2);
    expect(vTotal).toBeGreaterThan(vDisk);
  });

  it("halo enclosed mass grows ~linearly at large r (flat-curve source)", () => {
    const m1 = haloEnclosedMass(20, 1, 1);
    const m2 = haloEnclosedMass(40, 1, 1);
    // doubling r roughly doubles M for r >> rc → v² ∝ M/r ≈ const.
    expect(m2 / m1).toBeGreaterThan(1.7);
    expect(m2 / m1).toBeLessThan(2.1);
  });
});

// ─── cosmic budget ───────────────────────────────────────────────────────────

describe("componentDensities scaling", () => {
  it("radiation scales as (1+z)^4 relative to matter (1+z)^3", () => {
    const d0 = componentDensities(0);
    const d1 = componentDensities(1);
    expect(d1.r / d0.r).toBeCloseTo(16, 6); // 2^4
    expect(d1.m / d0.m).toBeCloseTo(8, 6); // 2^3
    expect(d1.lambda).toBeCloseTo(d0.lambda, 12); // Λ constant
  });
});

describe("budgetFractions", () => {
  it("sums to one at every redshift", () => {
    for (const z of [0, 0.5, 3, 1100]) {
      const f = budgetFractions(z);
      expect(f.r + f.m + f.lambda).toBeCloseTo(1, 10);
    }
  });
  it("is Λ-dominated today and radiation-dominated very early", () => {
    expect(budgetFractions(0).lambda).toBeGreaterThan(0.6);
    expect(budgetFractions(1e5).r).toBeGreaterThan(0.9);
  });
});

describe("equality redshifts", () => {
  it("matter–radiation equality is a few thousand", () => {
    const zeq = matterRadiationEquality();
    expect(zeq).toBeGreaterThan(2500);
    expect(zeq).toBeLessThan(4500);
  });
  it("matter–Λ equality is below redshift 1 (recent acceleration)", () => {
    const z = matterLambdaEquality();
    expect(z).toBeGreaterThan(0.2);
    expect(z).toBeLessThan(0.5);
  });
});

// ─── supernova distance modulus ──────────────────────────────────────────────

describe("dimensionlessHubble", () => {
  it("equals 1 at z = 0 for a flat concordance universe", () => {
    expect(dimensionlessHubble(0, CONCORDANCE)).toBeCloseTo(1, 6);
  });
  it("increases with redshift", () => {
    expect(dimensionlessHubble(1)).toBeGreaterThan(dimensionlessHubble(0));
  });
});

describe("comoving / luminosity distance", () => {
  it("comoving distance is zero at z = 0 and increasing", () => {
    expect(comovingDistanceDimensionless(0)).toBe(0);
    expect(comovingDistanceDimensionless(1)).toBeGreaterThan(
      comovingDistanceDimensionless(0.5),
    );
  });
  it("luminosity distance = (1+z) × comoving distance", () => {
    const z = 0.8;
    expect(luminosityDistanceDimensionless(z)).toBeCloseTo(
      (1 + z) * comovingDistanceDimensionless(z),
      10,
    );
  });
});

describe("distanceModulus & residual (the 1998 discovery)", () => {
  it("distance modulus increases monotonically with redshift", () => {
    expect(distanceModulus(0.5)).toBeLessThan(distanceModulus(1.0));
  });

  it("at fixed z, an accelerating universe puts SNe fainter than a decelerating one", () => {
    const z = 0.6;
    const muAcc = distanceModulus(z, COSMOLOGIES.accelerating);
    const muDec = distanceModulus(z, COSMOLOGIES.decelerating);
    expect(muAcc).toBeGreaterThan(muDec);
  });

  it("residual of the accelerating model is positive, decelerating negative", () => {
    const z = 0.6;
    expect(distanceModulusResidual(z, COSMOLOGIES.accelerating)).toBeGreaterThan(0);
    expect(distanceModulusResidual(z, COSMOLOGIES.decelerating)).toBeLessThan(0);
  });
});

// ─── cosmological constant & vacuum energy ───────────────────────────────────

describe("cosmologicalConstant", () => {
  it("is of order 1e-52 m^-2", () => {
    const lambda = cosmologicalConstant();
    expect(lambda).toBeGreaterThan(1e-52);
    expect(lambda).toBeLessThan(2e-52);
  });
});

describe("vacuumEnergyDiscrepancyLog10", () => {
  it("is roughly 120 orders of magnitude with default densities", () => {
    const log = vacuumEnergyDiscrepancyLog10();
    expect(log).toBeGreaterThan(115);
    expect(log).toBeLessThan(125);
  });
});
