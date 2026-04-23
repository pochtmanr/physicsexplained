import { describe, expect, it } from "vitest";
import {
  abbeNumber,
  cauchyDispersion,
  isNormalDispersion,
  rainbowPrimaryAngle,
  rainbowSecondaryAngle,
} from "@/lib/physics/electromagnetism/optical-dispersion";

describe("cauchyDispersion — two-term Cauchy fit in the visible", () => {
  // Schott N-BK7 crown glass, A = 1.5046, B = 4.2e-3 µm² (λ in micrometres).
  // At the sodium D line (0.589 µm) this yields n ≈ 1.517 — matches the
  // handbook value 1.5168 to three decimals.
  it("gives n ≈ 1.517 for BK7 crown at λ = 589 nm", () => {
    const n = cauchyDispersion(0.589, 1.5046, 4.2e-3);
    expect(n).toBeCloseTo(1.517, 2);
  });

  it("is monotonically decreasing in λ inside the visible (normal dispersion)", () => {
    // Fluorite-like fit: A = 1.432, B = 3.2e-3.
    const n400 = cauchyDispersion(0.400, 1.432, 3.2e-3);
    const n700 = cauchyDispersion(0.700, 1.432, 3.2e-3);
    expect(n400).toBeGreaterThan(n700);
  });

  it("throws on non-positive λ", () => {
    expect(() => cauchyDispersion(0, 1.5, 4e-3)).toThrow();
    expect(() => cauchyDispersion(-0.5, 1.5, 4e-3)).toThrow();
  });
});

describe("abbeNumber V_d", () => {
  // Schott N-BK7 (crown): n_d = 1.5168, n_F = 1.5224, n_C = 1.5143.
  // V_d = (1.5168 − 1) / (1.5224 − 1.5143) = 0.5168 / 0.0081 ≈ 63.8.
  // Catalogue value 64.17 within 0.5.
  it("gives ≈ 64.17 for N-BK7 within 0.5", () => {
    const V = abbeNumber(1.5168, 1.5224, 1.5143);
    expect(V).toBeGreaterThan(63);
    expect(V).toBeLessThan(65);
    expect(Math.abs(V - 64.17)).toBeLessThan(0.5);
  });

  // Schott SF11 dense flint: n_d = 1.78472, n_F = 1.80645, n_C = 1.77599.
  // V_d = 0.78472 / 0.03046 ≈ 25.76 — catalogue gives ~25.5.
  it("gives ≈ 25.5 for SF11 dense flint within 0.5", () => {
    const V = abbeNumber(1.78472, 1.80645, 1.77599);
    expect(V).toBeGreaterThan(25);
    expect(V).toBeLessThan(26.5);
  });

  it("throws on zero dispersion", () => {
    expect(() => abbeNumber(1.5, 1.5, 1.5)).toThrow();
  });
});

describe("isNormalDispersion", () => {
  // BK7 Cauchy fit at 550 nm: dn/dλ should be negative (normal dispersion).
  it("reports normal dispersion for crown Cauchy fit at 550 nm", () => {
    const nFn = (lam: number) => cauchyDispersion(lam, 1.5046, 4.2e-3);
    expect(isNormalDispersion(nFn, 0.550)).toBe(true);
  });

  it("reports anomalous dispersion (dn/dλ > 0) when the fit is inverted", () => {
    // A toy model where n increases with λ — physically only happens near a
    // resonance, but here we just verify the sign detector.
    const nFn = (lam: number) => 1.3 + 0.02 * lam;
    expect(isNormalDispersion(nFn, 0.550)).toBe(false);
  });
});

describe("rainbow geometry — Descartes's formula", () => {
  it("primary rainbow for water (n = 1.333) sits near 42°", () => {
    const a = rainbowPrimaryAngle(1.333);
    expect(a).toBeGreaterThan(41.5);
    expect(a).toBeLessThan(42.5);
  });

  it("secondary rainbow for water sits near 51° — ≈ 9° above the primary", () => {
    const primary = rainbowPrimaryAngle(1.333);
    const secondary = rainbowSecondaryAngle(1.333);
    expect(secondary).toBeGreaterThan(50);
    expect(secondary).toBeLessThan(52);
    expect(secondary - primary).toBeGreaterThan(8);
    expect(secondary - primary).toBeLessThan(10);
  });

  it("red (n=1.331) sits at a larger primary angle than violet (n=1.344)", () => {
    // For the primary bow, larger n (shorter λ) → smaller rainbow angle.
    // So violet is on the inside of the bow, red on the outside — exactly the
    // observed order.
    const aRed = rainbowPrimaryAngle(1.331);
    const aViolet = rainbowPrimaryAngle(1.344);
    expect(aRed).toBeGreaterThan(aViolet);
  });
});
