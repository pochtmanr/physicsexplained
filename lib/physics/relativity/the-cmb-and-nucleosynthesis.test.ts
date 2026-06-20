/**
 * §57 THE CMB AND BIG BANG NUCLEOSYNTHESIS — unit tests.
 *
 * Covers the Planck spectrum (peak location, positivity, monotone tail),
 * Wien displacement, CMB redshift scaling, and the BBN helium fraction
 * (the canonical Y_p ≈ 0.25 estimate and the weak baryon dependence).
 */

import { describe, expect, it } from "vitest";
import {
  planckByFrequency,
  planckByWavelength,
  peakFrequency,
  peakWavelength,
  cmbTemperatureAtRedshift,
  redshiftFromTemperatures,
  neutronProtonRatio,
  neutronProtonAfterDecay,
  heliumMassFraction,
  heliumFractionFromBaryon,
  T_CMB,
} from "@/lib/physics/relativity/the-cmb-and-nucleosynthesis";

// ─── Planck spectrum ─────────────────────────────────────────────────────────

describe("planckByFrequency", () => {
  it("is zero at zero frequency and for nonpositive T", () => {
    expect(planckByFrequency(0)).toBe(0);
    expect(planckByFrequency(1e11, 0)).toBe(0);
    expect(planckByFrequency(-1)).toBe(0);
  });

  it("is positive and finite in the CMB band", () => {
    const b = planckByFrequency(1.6e11, T_CMB);
    expect(b).toBeGreaterThan(0);
    expect(Number.isFinite(b)).toBe(true);
  });

  it("peaks at the Wien frequency: B is maximal at peakFrequency", () => {
    const nuPeak = peakFrequency(T_CMB);
    const bPeak = planckByFrequency(nuPeak, T_CMB);
    expect(planckByFrequency(nuPeak * 0.6, T_CMB)).toBeLessThan(bPeak);
    expect(planckByFrequency(nuPeak * 1.6, T_CMB)).toBeLessThan(bPeak);
  });
});

describe("planckByWavelength", () => {
  it("is zero at nonpositive wavelength", () => {
    expect(planckByWavelength(0)).toBe(0);
    expect(planckByWavelength(-1e-3)).toBe(0);
  });

  it("peaks near peakWavelength", () => {
    const lp = peakWavelength(T_CMB);
    const bPeak = planckByWavelength(lp, T_CMB);
    expect(planckByWavelength(lp * 0.5, T_CMB)).toBeLessThan(bPeak);
    expect(planckByWavelength(lp * 2.0, T_CMB)).toBeLessThan(bPeak);
  });
});

// ─── Wien displacement ───────────────────────────────────────────────────────

describe("Wien displacement", () => {
  it("CMB peaks at ~160 GHz in frequency", () => {
    expect(peakFrequency(T_CMB)).toBeCloseTo(1.6e11, -9.4);
    expect(peakFrequency(T_CMB) / 1e9).toBeGreaterThan(150);
    expect(peakFrequency(T_CMB) / 1e9).toBeLessThan(170);
  });

  it("CMB peaks at ~1.06 mm in wavelength", () => {
    const lp_mm = peakWavelength(T_CMB) * 1e3;
    expect(lp_mm).toBeGreaterThan(1.0);
    expect(lp_mm).toBeLessThan(1.1);
  });

  it("peak wavelength scales inversely with temperature", () => {
    expect(peakWavelength(2 * T_CMB)).toBeCloseTo(peakWavelength(T_CMB) / 2, 12);
  });
});

// ─── CMB redshift scaling ────────────────────────────────────────────────────

describe("cmbTemperatureAtRedshift", () => {
  it("is today's temperature at z = 0", () => {
    expect(cmbTemperatureAtRedshift(0)).toBeCloseTo(T_CMB, 12);
  });

  it("gives ~3000 K near recombination (z ≈ 1100)", () => {
    const T = cmbTemperatureAtRedshift(1100);
    expect(T).toBeGreaterThan(2900);
    expect(T).toBeLessThan(3100);
  });

  it("round-trips through redshiftFromTemperatures", () => {
    const z = 1089;
    const T = cmbTemperatureAtRedshift(z);
    expect(redshiftFromTemperatures(T)).toBeCloseTo(z, 9);
  });
});

// ─── BBN helium fraction ─────────────────────────────────────────────────────

describe("neutron-proton ratio and helium fraction", () => {
  it("equilibrium n/p at freeze-out (~0.7 MeV) is about 1/6", () => {
    const r = neutronProtonRatio(0.7);
    expect(r).toBeGreaterThan(0.12);
    expect(r).toBeLessThan(0.22);
  });

  it("neutron decay lowers the ratio over the ~3-minute wait", () => {
    const r0 = neutronProtonRatio(0.7);
    const r3min = neutronProtonAfterDecay(r0, 180);
    expect(r3min).toBeLessThan(r0);
    expect(r3min).toBeGreaterThan(0);
  });

  it("the canonical chain gives Y_p ≈ 0.25", () => {
    const r0 = neutronProtonRatio(0.72);
    const r = neutronProtonAfterDecay(r0, 200);
    const Yp = heliumMassFraction(r);
    expect(Yp).toBeGreaterThan(0.22);
    expect(Yp).toBeLessThan(0.27);
  });

  it("heliumMassFraction maps r = 1/7 to 0.25", () => {
    expect(heliumMassFraction(1 / 7)).toBeCloseTo(0.25, 6);
  });
});

describe("heliumFractionFromBaryon", () => {
  it("matches the observed Y_p ≈ 0.247 at η₁₀ ≈ 6.1", () => {
    expect(heliumFractionFromBaryon(6.1)).toBeCloseTo(0.2484, 4);
  });

  it("depends only weakly (logarithmically) on the baryon density", () => {
    const low = heliumFractionFromBaryon(3);
    const high = heliumFractionFromBaryon(12);
    // A factor-of-4 change in η moves Y_p by less than 0.005.
    expect(Math.abs(high - low)).toBeLessThan(0.005);
  });

  it("increases monotonically with the baryon-to-photon ratio", () => {
    expect(heliumFractionFromBaryon(8)).toBeGreaterThan(heliumFractionFromBaryon(4));
  });

  it("clamps to a physical band", () => {
    expect(heliumFractionFromBaryon(1e6)).toBeLessThanOrEqual(0.27);
    expect(heliumFractionFromBaryon(1e-6)).toBeGreaterThanOrEqual(0.21);
  });
});
