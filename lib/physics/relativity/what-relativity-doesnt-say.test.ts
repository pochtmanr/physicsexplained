/**
 * §61 WHAT RELATIVITY DOESN'T SAY — unit tests.
 *
 * Pins the Planck-unit helpers to their textbook values, checks the two
 * boundary curves cross at the Planck point, and verifies the domain-regime
 * classifier and the invariance scoreboard.
 */

import { describe, expect, it } from "vitest";
import {
  planckMass,
  planckLength,
  planckTime,
  planckEnergy,
  schwarzschildRadius,
  comptonWavelength,
  domainRegime,
  invariantCount,
  INVARIANCE_TABLE,
  planckGapDecades,
} from "@/lib/physics/relativity/what-relativity-doesnt-say";

// ─── Planck units ────────────────────────────────────────────────────────────

describe("planck units", () => {
  it("gives the textbook Planck mass ≈ 2.176 × 10⁻⁸ kg", () => {
    expect(planckMass() / 1e-8).toBeCloseTo(2.176, 2);
  });

  it("gives the textbook Planck length ≈ 1.616 × 10⁻³⁵ m", () => {
    expect(planckLength() / 1e-35).toBeCloseTo(1.616, 2);
  });

  it("gives the textbook Planck time ≈ 5.39 × 10⁻⁴⁴ s", () => {
    expect(planckTime() / 1e-44).toBeCloseTo(5.39, 1);
  });

  it("gives the Planck energy ≈ 1.96 × 10⁹ J", () => {
    expect(planckEnergy() / 1e9).toBeCloseTo(1.96, 1);
  });
});

// ─── Boundary curves cross at the Planck point ──────────────────────────────

describe("boundary curves", () => {
  it("Schwarzschild radius scales linearly with mass", () => {
    const a = schwarzschildRadius(1);
    const b = schwarzschildRadius(2);
    expect(b / a).toBeCloseTo(2, 6);
  });

  it("Compton wavelength scales inversely with mass", () => {
    const a = comptonWavelength(1);
    const b = comptonWavelength(2);
    expect(b / a).toBeCloseTo(0.5, 6);
  });

  it("r_s and λ_C are equal (within an O(1) factor) at the Planck mass", () => {
    const mP = planckMass();
    const rs = schwarzschildRadius(mP);
    const lc = comptonWavelength(mP);
    // r_s = 2 ℓ_P and λ_C = ℓ_P, so their ratio is exactly 2.
    expect(rs / lc).toBeCloseTo(2, 6);
  });
});

// ─── Domain regime classifier ───────────────────────────────────────────────

describe("domainRegime", () => {
  it("classifies a human-scale object as classical", () => {
    expect(domainRegime(70, 1.8)).toBe("classical");
  });

  it("classifies a stellar-mass object compressed below r_s as a black hole", () => {
    const M = 2e30; // ~1 solar mass
    const insideHorizon = schwarzschildRadius(M) * 0.5;
    expect(domainRegime(M, insideHorizon)).toBe("black-hole");
  });

  it("classifies an electron probed below its Compton wavelength as quantum", () => {
    const Me = 9.109e-31;
    const tiny = comptonWavelength(Me) * 0.5;
    expect(domainRegime(Me, tiny)).toBe("quantum");
  });

  it("classifies a sub-Planck-length probe of the Planck mass as quantum-gravity", () => {
    const mP = planckMass();
    expect(domainRegime(mP, planckLength() * 0.5)).toBe("quantum-gravity");
  });
});

// ─── Invariance scoreboard ──────────────────────────────────────────────────

describe("invariance table", () => {
  it("has both frame-dependent and invariant entries", () => {
    expect(invariantCount()).toBeGreaterThan(0);
    expect(invariantCount()).toBeLessThan(INVARIANCE_TABLE.length);
  });

  it("marks the speed of light as invariant", () => {
    const c = INVARIANCE_TABLE.find((q) => q.name.includes("speed of light"));
    expect(c?.invariant).toBe(true);
  });

  it("marks the time interval as frame-dependent", () => {
    const dt = INVARIANCE_TABLE.find((q) => q.name.includes("Time interval"));
    expect(dt?.invariant).toBe(false);
  });
});

// ─── Planck gap ──────────────────────────────────────────────────────────────

describe("planckGapDecades", () => {
  it("puts the LHC (~14 TeV ≈ 2.2 × 10⁻⁶ J) about 15 decades below Planck", () => {
    const E_LHC = 2.2e-6;
    expect(planckGapDecades(E_LHC)).toBeCloseTo(15, 0);
  });
});
