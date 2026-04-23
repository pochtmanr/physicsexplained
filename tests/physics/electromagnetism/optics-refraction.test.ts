import { describe, expect, it } from "vitest";
import {
  cauchyFit,
  dispersionCoefficient,
  indexFromPermittivityMu,
  phaseVelocity,
} from "@/lib/physics/electromagnetism/optics-refraction";
import { SPEED_OF_LIGHT } from "@/lib/physics/constants";

describe("phaseVelocity", () => {
  it("returns c for n = 1 (vacuum, sanity)", () => {
    expect(phaseVelocity(1)).toBe(SPEED_OF_LIGHT);
  });

  it("returns ≈ 2×10⁸ m/s for n = 1.5 (crown glass)", () => {
    const v = phaseVelocity(1.5);
    // c / 1.5 = 1.99861638…×10⁸
    expect(v).toBeCloseTo(SPEED_OF_LIGHT / 1.5, 6);
    expect(v).toBeGreaterThan(1.99e8);
    expect(v).toBeLessThan(2.01e8);
  });

  it("allows n < 1 (X-ray regime): phase velocity exceeds c", () => {
    // For X-rays in glass, n ≈ 1 − 1e-5. Phase velocity > c is fine — the
    // signal velocity (information front) is still ≤ c.
    const v = phaseVelocity(1 - 1e-5);
    expect(v).toBeGreaterThan(SPEED_OF_LIGHT);
  });

  it("throws on non-positive or non-finite n", () => {
    expect(() => phaseVelocity(0)).toThrow();
    expect(() => phaseVelocity(-1)).toThrow();
    expect(() => phaseVelocity(Number.NaN)).toThrow();
    expect(() => phaseVelocity(Number.POSITIVE_INFINITY)).toThrow();
  });
});

describe("indexFromPermittivityMu", () => {
  it("reproduces n = 1.5 for the water-like case ε_r = 2.25, μ_r = 1", () => {
    expect(indexFromPermittivityMu(2.25, 1)).toBeCloseTo(1.5, 12);
  });

  it("returns 1 for vacuum (ε_r = μ_r = 1)", () => {
    expect(indexFromPermittivityMu(1, 1)).toBe(1);
  });

  it("matches n ≈ 1.33 for optical-frequency water (ε_r ≈ 1.77)", () => {
    const n = indexFromPermittivityMu(1.77, 1);
    expect(n).toBeCloseTo(1.33, 2);
  });

  it("throws on non-positive or non-finite arguments", () => {
    expect(() => indexFromPermittivityMu(0, 1)).toThrow();
    expect(() => indexFromPermittivityMu(1, 0)).toThrow();
    expect(() => indexFromPermittivityMu(-1, 1)).toThrow();
    expect(() => indexFromPermittivityMu(Number.NaN, 1)).toThrow();
  });
});

describe("cauchyFit", () => {
  it("reproduces BK7 crown glass n ≈ 1.517 at λ = 0.589 µm", () => {
    // Schott BK7 two-term Cauchy: A = 1.5046, B = 4.2×10⁻³ µm².
    // At sodium D line 589 nm the handbook value is n_d = 1.5168.
    const n = cauchyFit(0.589, 1.5046, 4.2e-3);
    expect(n).toBeCloseTo(1.517, 2);
  });

  it("reduces to A at infinite wavelength", () => {
    // Limit λ → ∞ ⇒ B/λ² and C/λ⁴ vanish.
    const n = cauchyFit(1e6, 1.5046, 4.2e-3);
    expect(n).toBeCloseTo(1.5046, 10);
  });

  it("four-term form matches two-term when C = 0", () => {
    const twoTerm = cauchyFit(0.589, 1.5046, 4.2e-3);
    const fourTerm = cauchyFit(0.589, 1.5046, 4.2e-3, 0);
    expect(fourTerm).toBe(twoTerm);
  });

  it("throws on non-positive or non-finite wavelength", () => {
    expect(() => cauchyFit(0, 1.5, 4e-3)).toThrow();
    expect(() => cauchyFit(-1, 1.5, 4e-3)).toThrow();
    expect(() => cauchyFit(Number.NaN, 1.5, 4e-3)).toThrow();
  });
});

describe("dispersionCoefficient", () => {
  it("is negative for normal dispersion (Cauchy fit, BK7)", () => {
    const A = 1.5046;
    const B = 4.2e-3;
    const nFn = (l: number) => cauchyFit(l, A, B);
    const dnDl = dispersionCoefficient(nFn, 0.589);
    // Analytic dn/dλ = -2B/λ³ for two-term Cauchy, always < 0.
    expect(dnDl).toBeLessThan(0);
    // And should agree with the closed form to many digits.
    const analytic = -2 * B / Math.pow(0.589, 3);
    expect(dnDl).toBeCloseTo(analytic, 6);
  });

  it("returns 0 for a constant n(λ)", () => {
    const flat = () => 1.5;
    expect(dispersionCoefficient(flat, 0.589)).toBe(0);
  });

  it("throws on non-positive or non-finite lambda", () => {
    const nFn = (l: number) => cauchyFit(l, 1.5, 4e-3);
    expect(() => dispersionCoefficient(nFn, 0)).toThrow();
    expect(() => dispersionCoefficient(nFn, -1)).toThrow();
  });
});
