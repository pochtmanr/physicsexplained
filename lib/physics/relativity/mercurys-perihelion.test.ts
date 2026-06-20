/**
 * §40 MERCURY'S PERIHELION — unit tests.
 *
 * Covers the relativistic precession formula (per orbit, per century), the
 * Mercury convenience wrapper landing on ~43″/cy, the precession budget, and
 * the visualization helpers.
 */

import { describe, expect, it } from "vitest";
import {
  RAD_TO_ARCSEC,
  MERCURY,
  precessionPerOrbitRad,
  precessionArcsecPerCentury,
  mercuryPrecessionArcsecPerCentury,
  precessionBudget,
  precessingEllipsePoint,
  exaggeratedAdvancePerOrbit,
  earthPrecessionArcsecPerCentury,
  NEWTONIAN_PERTURBERS,
} from "@/lib/physics/relativity/mercurys-perihelion";
import { GM_SUN_SI } from "@/lib/physics/constants";

// ─── precessionPerOrbitRad ──────────────────────────────────────────────────

describe("precessionPerOrbitRad", () => {
  it("Mercury advances ≈ 5.0 × 10⁻⁷ rad per orbit", () => {
    const d = precessionPerOrbitRad(
      GM_SUN_SI,
      MERCURY.semiMajorAxis_m,
      MERCURY.eccentricity,
    );
    expect(d).toBeGreaterThan(4.9e-7);
    expect(d).toBeLessThan(5.1e-7);
  });

  it("is positive — the apsides advance, never regress", () => {
    expect(
      precessionPerOrbitRad(GM_SUN_SI, MERCURY.semiMajorAxis_m, 0.2),
    ).toBeGreaterThan(0);
  });

  it("grows as the semi-latus rectum shrinks: tighter orbit precesses more", () => {
    const tight = precessionPerOrbitRad(GM_SUN_SI, 0.3 * 1.496e11, 0.2);
    const wide = precessionPerOrbitRad(GM_SUN_SI, 1.0 * 1.496e11, 0.2);
    expect(tight).toBeGreaterThan(wide);
  });

  it("scales linearly with central mass", () => {
    const a = MERCURY.semiMajorAxis_m;
    const e = MERCURY.eccentricity;
    const single = precessionPerOrbitRad(GM_SUN_SI, a, e);
    const double = precessionPerOrbitRad(2 * GM_SUN_SI, a, e);
    expect(double).toBeCloseTo(2 * single, 18);
  });

  it("higher eccentricity (fixed a) increases the advance via (1−e²)", () => {
    const a = MERCURY.semiMajorAxis_m;
    const low = precessionPerOrbitRad(GM_SUN_SI, a, 0.05);
    const high = precessionPerOrbitRad(GM_SUN_SI, a, 0.4);
    expect(high).toBeGreaterThan(low);
  });

  it("returns 0 for degenerate geometry (a ≤ 0 or e ≥ 1)", () => {
    expect(precessionPerOrbitRad(GM_SUN_SI, 0, 0.2)).toBe(0);
    expect(precessionPerOrbitRad(GM_SUN_SI, 1e11, 1.0)).toBe(0);
  });
});

// ─── precessionArcsecPerCentury / Mercury wrapper ───────────────────────────

describe("mercuryPrecessionArcsecPerCentury", () => {
  it("lands on the historic 43″/century (42–44 window)", () => {
    const v = mercuryPrecessionArcsecPerCentury();
    expect(v).toBeGreaterThan(42);
    expect(v).toBeLessThan(44);
  });

  it("matches the explicit element call", () => {
    const explicit = precessionArcsecPerCentury(
      GM_SUN_SI,
      MERCURY.semiMajorAxis_m,
      MERCURY.eccentricity,
      MERCURY.period_days,
    );
    expect(mercuryPrecessionArcsecPerCentury()).toBeCloseTo(explicit, 9);
  });
});

describe("earthPrecessionArcsecPerCentury", () => {
  it("is small (~3.8″/cy) — far below Mercury's", () => {
    const v = earthPrecessionArcsecPerCentury();
    expect(v).toBeGreaterThan(3);
    expect(v).toBeLessThan(5);
    expect(v).toBeLessThan(mercuryPrecessionArcsecPerCentury());
  });
});

// ─── RAD_TO_ARCSEC ──────────────────────────────────────────────────────────

describe("RAD_TO_ARCSEC", () => {
  it("equals 206264.8″ per radian", () => {
    expect(RAD_TO_ARCSEC).toBeCloseTo(206264.806, 2);
  });
});

// ─── precessionBudget ───────────────────────────────────────────────────────

describe("precessionBudget", () => {
  it("Newtonian perturbers sum to ≈ 531″/cy", () => {
    const sum = NEWTONIAN_PERTURBERS.reduce((s, p) => s + p.arcsec, 0);
    expect(sum).toBeGreaterThan(528);
    expect(sum).toBeLessThan(534);
  });

  it("Newtonian + GR closes the gap to the observed 574″ within 2″", () => {
    const b = precessionBudget();
    expect(Math.abs(b.modelTotal_arcsec - b.observed_arcsec)).toBeLessThan(2);
  });

  it("the pre-GR shortfall is ≈ 43″", () => {
    const b = precessionBudget();
    expect(b.shortfall_arcsec).toBeGreaterThan(41);
    expect(b.shortfall_arcsec).toBeLessThan(45);
  });

  it("accepts an override GR term", () => {
    const b = precessionBudget(50);
    expect(b.generalRelativity_arcsec).toBe(50);
    expect(b.modelTotal_arcsec).toBeCloseTo(
      b.newtonianPlanetary_arcsec + 50,
      6,
    );
  });
});

// ─── precessingEllipsePoint ─────────────────────────────────────────────────

describe("precessingEllipsePoint", () => {
  it("perihelion (θ=0, apside=0) sits at r = a(1−e) on +x", () => {
    const a = 1;
    const e = 0.2;
    const p = precessingEllipsePoint(a, e, 0, 0);
    expect(p.r).toBeCloseTo(a * (1 - e), 12);
    expect(p.x).toBeCloseTo(a * (1 - e), 12);
    expect(p.y).toBeCloseTo(0, 12);
  });

  it("aphelion (θ=π) sits at r = a(1+e)", () => {
    const p = precessingEllipsePoint(1, 0.2, Math.PI, 0);
    expect(p.r).toBeCloseTo(1.2, 12);
  });

  it("rotating the apside line rotates the whole orbit by that angle", () => {
    const base = precessingEllipsePoint(1, 0.2, 0, 0);
    const rot = precessingEllipsePoint(1, 0.2, 0, Math.PI / 2);
    expect(rot.r).toBeCloseTo(base.r, 12);
    expect(rot.x).toBeCloseTo(0, 12);
    expect(rot.y).toBeCloseTo(base.r, 12);
  });
});

// ─── exaggeratedAdvancePerOrbit ─────────────────────────────────────────────

describe("exaggeratedAdvancePerOrbit", () => {
  it("at exaggeration 1 equals the true per-orbit advance", () => {
    const a = MERCURY.semiMajorAxis_m;
    const e = MERCURY.eccentricity;
    expect(exaggeratedAdvancePerOrbit(GM_SUN_SI, a, e, 1)).toBeCloseTo(
      precessionPerOrbitRad(GM_SUN_SI, a, e),
      18,
    );
  });

  it("scales linearly with the exaggeration factor", () => {
    const a = MERCURY.semiMajorAxis_m;
    const e = MERCURY.eccentricity;
    const one = exaggeratedAdvancePerOrbit(GM_SUN_SI, a, e, 1);
    const big = exaggeratedAdvancePerOrbit(GM_SUN_SI, a, e, 1e6);
    expect(big).toBeCloseTo(one * 1e6, 6);
  });

  it("clamps negative exaggeration to 0", () => {
    expect(
      exaggeratedAdvancePerOrbit(GM_SUN_SI, 1e11, 0.2, -5),
    ).toBe(0);
  });
});
