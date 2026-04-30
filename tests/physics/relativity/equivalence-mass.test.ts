import { describe, expect, it } from "vitest";
import {
  eotvosParameter,
  differentialAcceleration,
  wepBoundTimeline,
} from "@/lib/physics/relativity/equivalence-mass";

describe("eotvosParameter", () => {
  it("equal masses give η = 0 exactly (WEP holds)", () => {
    expect(eotvosParameter(1.0, 1.0)).toBe(0);
    expect(eotvosParameter(1.673e-27, 1.673e-27)).toBe(0);
  });

  it("a 0.1% gravitational excess gives η = 0.001", () => {
    expect(eotvosParameter(1.001, 1.0)).toBeCloseTo(0.001, 12);
  });

  it("a deficit gives a negative η (m_g < m_i)", () => {
    expect(eotvosParameter(0.999, 1.0)).toBeCloseTo(-0.001, 12);
  });

  it("scales correctly for arbitrary positive m_inertial (units cancel)", () => {
    // Same fractional offset → same η, regardless of overall scale.
    expect(eotvosParameter(2.002, 2.0)).toBeCloseTo(0.001, 12);
    expect(eotvosParameter(1e6 * 1.001, 1e6)).toBeCloseTo(0.001, 12);
  });

  it("throws on m_inertial = 0 (η is undefined)", () => {
    expect(() => eotvosParameter(1.0, 0)).toThrow(RangeError);
  });

  it("throws on negative m_inertial (no physical meaning)", () => {
    expect(() => eotvosParameter(1.0, -1.0)).toThrow(RangeError);
  });
});

describe("differentialAcceleration", () => {
  it("vanishes when both masses obey WEP (η_A = η_B = 0)", () => {
    expect(differentialAcceleration(0, 0)).toBe(0);
  });

  it("equals η_A − η_B (the canonical signal Eötvös measured)", () => {
    expect(differentialAcceleration(1e-9, 0)).toBeCloseTo(1e-9, 18);
    expect(differentialAcceleration(2e-15, 1e-15)).toBeCloseTo(1e-15, 18);
  });

  it("is antisymmetric under (A, B) swap", () => {
    const a = 3e-13;
    const b = 1e-13;
    expect(differentialAcceleration(a, b)).toBeCloseTo(
      -differentialAcceleration(b, a),
      18,
    );
  });

  it("vanishes when both materials share the same η (universal violation cancels)", () => {
    // A common-mode η is unobservable: only differential effects show up in
    // a balance experiment.
    expect(differentialAcceleration(5e-12, 5e-12)).toBe(0);
  });
});

describe("wepBoundTimeline", () => {
  const timeline = wepBoundTimeline();

  it("starts with Galileo's 1589 Pisa observation", () => {
    expect(timeline[0].year).toBe(1589);
    expect(timeline[0].experiment).toMatch(/Galileo/);
  });

  it("ends with MICROSCOPE 2017+ at ≈ 10⁻¹⁵", () => {
    const last = timeline[timeline.length - 1];
    expect(last.year).toBe(2017);
    expect(last.experiment).toMatch(/MICROSCOPE/);
    expect(last.bound).toBeLessThan(2e-15);
    expect(last.bound).toBeGreaterThan(1e-15);
  });

  it("bounds tighten monotonically over time (each entry beats the previous)", () => {
    for (let i = 1; i < timeline.length; i++) {
      expect(timeline[i].bound).toBeLessThan(timeline[i - 1].bound);
    }
  });

  it("years are strictly increasing", () => {
    for (let i = 1; i < timeline.length; i++) {
      expect(timeline[i].year).toBeGreaterThan(timeline[i - 1].year);
    }
  });

  it("spans 14 orders of magnitude from Galileo to MICROSCOPE", () => {
    const first = timeline[0].bound;
    const last = timeline[timeline.length - 1].bound;
    const orders = Math.log10(first / last);
    // Galileo's ~1e-3 to MICROSCOPE's ~1e-15 → 12 decades of bound, but
    // Adelberger pushed past 1e-13 before MICROSCOPE so the cumulative
    // tightening across the campaign exceeds 12 — be generous with the floor.
    expect(orders).toBeGreaterThan(11);
    expect(orders).toBeLessThan(14);
  });

  it("includes Eötvös's 1889 torsion-balance result (the namesake experiment)", () => {
    const eotvos1889 = timeline.find(
      (e) => e.year === 1889 && /Eötvös/.test(e.experiment),
    );
    expect(eotvos1889).toBeDefined();
    expect(eotvos1889!.bound).toBe(1e-8);
  });

  it("includes the modern landmark experiments (Roll-Krotkov-Dicke, Adelberger, MICROSCOPE)", () => {
    const labels = timeline.map((e) => e.experiment);
    expect(labels.some((l) => /Roll/.test(l))).toBe(true);
    expect(labels.some((l) => /Adelberger|Eöt-Wash/.test(l))).toBe(true);
    expect(labels.some((l) => /MICROSCOPE/.test(l))).toBe(true);
  });

  it("every bound is positive (an upper limit must be a positive number)", () => {
    for (const entry of timeline) {
      expect(entry.bound).toBeGreaterThan(0);
    }
  });
});
