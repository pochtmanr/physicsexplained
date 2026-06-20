/**
 * §56 HUBBLE AND COSMOLOGICAL REDSHIFT — unit tests.
 *
 * Covers the local Hubble law (v = H₀d, Hubble time/radius), the exact
 * cosmological redshift ↔ scale-factor inversion, the Doppler contrast, the
 * Friedmann expansion rate E(z), and the lookback / age integrals against
 * known concordance numbers.
 */

import { describe, expect, it } from "vitest";
import {
  hubbleVelocity,
  hubbleDistance,
  hubbleTimeGyr,
  hubbleRadiusMpc,
  redshiftFromScaleFactor,
  scaleFactorFromRedshift,
  stretchFactor,
  redshiftVelocity,
  dopplerRedshift,
  expansionRate,
  hubbleAtRedshift,
  lookbackTimeGyr,
  ageAtRedshiftGyr,
  ageNowGyr,
  simpson,
  CONCORDANCE,
  C_KM_S,
} from "@/lib/physics/relativity/hubble-and-cosmological-redshift";

// ─── local Hubble law ────────────────────────────────────────────────────────

describe("hubbleVelocity / hubbleDistance", () => {
  it("v = H₀ d", () => {
    expect(hubbleVelocity(70, 10)).toBeCloseTo(700, 9);
  });
  it("round-trips through hubbleDistance", () => {
    const d = 12.5;
    expect(hubbleDistance(70, hubbleVelocity(70, d))).toBeCloseTo(d, 9);
  });
  it("hubbleDistance is safe at H₀ = 0", () => {
    expect(hubbleDistance(0, 100)).toBe(Infinity);
  });
});

describe("hubbleTimeGyr", () => {
  it("1/H₀ ≈ 14.5 Gyr for H₀ = 67.4", () => {
    // 1/H0 with H0=67.4 km/s/Mpc is about 14.5 Gyr
    expect(hubbleTimeGyr(67.4)).toBeGreaterThan(14);
    expect(hubbleTimeGyr(67.4)).toBeLessThan(15);
  });
  it("scales inversely with H₀", () => {
    expect(hubbleTimeGyr(70) * 70).toBeCloseTo(hubbleTimeGyr(140) * 140, 6);
  });
});

describe("hubbleRadiusMpc", () => {
  it("c/H₀ ≈ 4450 Mpc for H₀ = 67.4", () => {
    const r = hubbleRadiusMpc(67.4);
    expect(r).toBeGreaterThan(4000);
    expect(r).toBeLessThan(4600);
  });
  it("velocity at the Hubble radius equals c", () => {
    const H0 = 70;
    expect(hubbleVelocity(H0, hubbleRadiusMpc(H0))).toBeCloseTo(C_KM_S, 3);
  });
});

// ─── cosmological redshift ↔ scale factor ────────────────────────────────────

describe("redshift ↔ scale factor", () => {
  it("1 + z = a_now / a_emit", () => {
    expect(redshiftFromScaleFactor(0.5)).toBeCloseTo(1, 12);
    expect(redshiftFromScaleFactor(0.25)).toBeCloseTo(3, 12);
  });
  it("no shift today", () => {
    expect(redshiftFromScaleFactor(1)).toBeCloseTo(0, 12);
  });
  it("Big-Bang limit a_emit → 0 gives infinite z", () => {
    expect(redshiftFromScaleFactor(0)).toBe(Infinity);
  });
  it("inverts cleanly at CMB redshift z ≈ 1100", () => {
    const a = scaleFactorFromRedshift(1100);
    expect(a).toBeCloseTo(1 / 1101, 12);
    expect(redshiftFromScaleFactor(a)).toBeCloseTo(1100, 6);
  });
  it("stretchFactor = 1 + z", () => {
    expect(stretchFactor(2)).toBe(3);
  });
});

describe("redshiftVelocity", () => {
  it("cz for small z is the naive recession velocity", () => {
    expect(redshiftVelocity(0.01)).toBeCloseTo(C_KM_S * 0.01, 6);
  });
  it("exceeds c for z > 1 — cosmological redshift is not Doppler", () => {
    expect(redshiftVelocity(2)).toBeGreaterThan(C_KM_S);
  });
});

// ─── Doppler contrast ────────────────────────────────────────────────────────

describe("dopplerRedshift", () => {
  it("agrees with cz to first order in β", () => {
    const beta = 1e-4;
    expect(dopplerRedshift(beta)).toBeCloseTo(beta, 7);
  });
  it("saturates: z → ∞ only as β → 1", () => {
    expect(dopplerRedshift(0.999999)).toBeGreaterThan(1000);
    expect(dopplerRedshift(1)).toBe(Infinity);
  });
  it("blueshift for approach (β < 0)", () => {
    expect(dopplerRedshift(-0.5)).toBeLessThan(0);
  });
});

// ─── Friedmann expansion rate ────────────────────────────────────────────────

describe("expansionRate", () => {
  it("E(0) = 1 for a flat model", () => {
    expect(expansionRate(0, CONCORDANCE)).toBeCloseTo(1, 6);
  });
  it("grows monotonically with z", () => {
    const e1 = expansionRate(1, CONCORDANCE);
    const e2 = expansionRate(2, CONCORDANCE);
    expect(e2).toBeGreaterThan(e1);
    expect(e1).toBeGreaterThan(1);
  });
  it("matter dominates the high-z growth (≈ (1+z)^1.5)", () => {
    // deep in matter era E(z) ≈ sqrt(Ω_m) (1+z)^1.5
    const z = 50;
    const approx = Math.sqrt(CONCORDANCE.Om) * (1 + z) ** 1.5;
    expect(expansionRate(z, CONCORDANCE) / approx).toBeCloseTo(1, 1);
  });
});

describe("hubbleAtRedshift", () => {
  it("H(0) = H₀", () => {
    expect(hubbleAtRedshift(0, CONCORDANCE)).toBeCloseTo(CONCORDANCE.H0, 4);
  });
});

// ─── lookback time and age integrals ─────────────────────────────────────────

describe("lookbackTimeGyr", () => {
  it("zero at z = 0", () => {
    expect(lookbackTimeGyr(0, CONCORDANCE)).toBe(0);
  });
  it("increases with z", () => {
    expect(lookbackTimeGyr(1, CONCORDANCE)).toBeGreaterThan(
      lookbackTimeGyr(0.5, CONCORDANCE),
    );
  });
  it("z = 1 lookback is ≈ 7.9 Gyr in the concordance model", () => {
    const t = lookbackTimeGyr(1, CONCORDANCE);
    expect(t).toBeGreaterThan(7);
    expect(t).toBeLessThan(8.5);
  });
});

describe("ageNowGyr / ageAtRedshiftGyr", () => {
  it("present age ≈ 13.8 Gyr for the concordance model", () => {
    const age = ageNowGyr(CONCORDANCE);
    expect(age).toBeGreaterThan(13.4);
    expect(age).toBeLessThan(14.2);
  });
  it("age at emission decreases with z", () => {
    const a0 = ageNowGyr(CONCORDANCE);
    const a1 = ageAtRedshiftGyr(1, CONCORDANCE);
    expect(a1).toBeLessThan(a0);
    expect(a1).toBeGreaterThan(0);
  });
  it("age(z) + lookback(z) ≈ age now (consistency)", () => {
    const z = 1;
    const sum = ageAtRedshiftGyr(z, CONCORDANCE) + lookbackTimeGyr(z, CONCORDANCE);
    expect(sum).toBeCloseTo(ageNowGyr(CONCORDANCE), 0);
  });
  it("universe at recombination (z ≈ 1100) was ≈ 380 kyr old", () => {
    const ageGyr = ageAtRedshiftGyr(1100, CONCORDANCE);
    const ageKyr = ageGyr * 1e6;
    // order-of-magnitude check: a few hundred kyr
    expect(ageKyr).toBeGreaterThan(100);
    expect(ageKyr).toBeLessThan(900);
  });
});

// ─── numeric utility ─────────────────────────────────────────────────────────

describe("simpson", () => {
  it("integrates x² on [0,1] to 1/3", () => {
    expect(simpson((x) => x * x, 0, 1, 100)).toBeCloseTo(1 / 3, 9);
  });
  it("integrates sin on [0,π] to 2", () => {
    expect(simpson(Math.sin, 0, Math.PI, 100)).toBeCloseTo(2, 6);
  });
  it("forces an even interval count", () => {
    expect(simpson((x) => x, 0, 2, 3)).toBeCloseTo(2, 9);
  });
});
