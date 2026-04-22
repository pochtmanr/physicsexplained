import { describe, expect, it } from "vitest";
import {
  curieSusceptibility,
  langevin,
  paramagneticM,
  diamagneticSusceptibility,
} from "@/lib/physics/electromagnetism/magnetic-materials";
import { MU_0 } from "@/lib/physics/constants";

describe("curieSusceptibility", () => {
  it("returns a positive χ for positive T and positive C", () => {
    expect(curieSusceptibility(1.5e-3, 300)).toBeCloseTo(5e-6, 12);
  });

  it("scales as 1/T — halving T doubles χ", () => {
    const chiHot = curieSusceptibility(1e-3, 600);
    const chiCold = curieSusceptibility(1e-3, 300);
    expect(chiCold / chiHot).toBeCloseTo(2, 12);
  });

  it("throws for T = 0 (undefined at absolute zero)", () => {
    expect(() => curieSusceptibility(1e-3, 0)).toThrow();
  });

  it("throws for negative T", () => {
    expect(() => curieSusceptibility(1e-3, -10)).toThrow();
  });
});

describe("langevin", () => {
  it("L(x) ≈ x/3 in the small-x limit (Curie-law regime)", () => {
    expect(langevin(0.001)).toBeCloseTo(0.001 / 3, 8);
  });

  it("L(0) = 0 (series expansion branch is smooth at the origin)", () => {
    expect(langevin(0)).toBeCloseTo(0, 15);
  });

  it("L(x) → 1 at very large x (full alignment / saturation)", () => {
    // L(x) = coth(x) − 1/x → 1 as x → ∞.
    // For x = 50, 1/x = 0.02 so L ≈ 0.98; for x = 200, 1/x = 0.005; need big x.
    expect(langevin(1e6)).toBeCloseTo(1, 5);
  });

  it("L(−x) = −L(x) (odd function)", () => {
    expect(langevin(-2)).toBeCloseTo(-langevin(2), 12);
  });

  it("L(x) is bounded in (−1, 1) for any real x", () => {
    expect(Math.abs(langevin(3.7))).toBeLessThan(1);
  });
});

describe("paramagneticM", () => {
  it("scales linearly with B at small μB/kT (Curie-law regime)", () => {
    const n = 1e28;
    const moment = 9.274e-24; // Bohr magneton-ish
    const kT = 1.38e-23 * 300; // ~room temperature
    // Small field: B = 1 mT, so μB/kT ≈ 2.2e-6 — firmly in the linear regime.
    const M1 = paramagneticM(n, moment, 1e-3, kT);
    const M2 = paramagneticM(n, moment, 2e-3, kT);
    expect(M2 / M1).toBeCloseTo(2, 3);
  });

  it("saturates at n·μ for very large B (full alignment)", () => {
    const n = 1e28;
    const moment = 9.274e-24;
    const kT = 1.38e-23 * 1; // very cold — 1 K
    // Huge B: μB/kT ~ 6.7e4 → L → 1.
    const Msat = paramagneticM(n, moment, 100, kT);
    expect(Msat).toBeCloseTo(n * moment, -8); // match to 1 part in 10⁸
  });

  it("is zero at B = 0 (no preferred direction, no net M)", () => {
    const n = 1e28;
    const moment = 9.274e-24;
    const kT = 1.38e-23 * 300;
    expect(paramagneticM(n, moment, 0, kT)).toBeCloseTo(0, 15);
  });

  it("throws for kT ≤ 0", () => {
    expect(() => paramagneticM(1e28, 9.274e-24, 1, 0)).toThrow();
    expect(() => paramagneticM(1e28, 9.274e-24, 1, -1)).toThrow();
  });
});

describe("diamagneticSusceptibility", () => {
  it("is negative for physical (positive) inputs — Lenz-law signature", () => {
    // Rough numbers for a classical-electron estimate on a solid.
    const n = 8.4e28; // copper-ish electron density, m⁻³
    const rSq = (5.3e-11) ** 2; // Bohr-radius-squared, m²
    const e2OverMe = (1.602e-19 ** 2) / 9.109e-31; // C² / kg
    const chi = diamagneticSusceptibility(n, rSq, e2OverMe, MU_0);
    expect(chi).toBeLessThan(0);
  });

  it("vanishes when the electron density is zero (no carriers, no response)", () => {
    const rSq = 1e-20;
    const e2OverMe = (1.602e-19 ** 2) / 9.109e-31;
    expect(diamagneticSusceptibility(0, rSq, e2OverMe, MU_0)).toBeCloseTo(
      0,
      15,
    );
  });

  it("scales linearly with n (doubling the density doubles |χ|)", () => {
    const rSq = 1e-20;
    const e2OverMe = 2.8e-8;
    const chi1 = diamagneticSusceptibility(1e28, rSq, e2OverMe, MU_0);
    const chi2 = diamagneticSusceptibility(2e28, rSq, e2OverMe, MU_0);
    expect(chi2 / chi1).toBeCloseTo(2, 12);
  });
});
