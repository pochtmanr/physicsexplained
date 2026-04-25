import { describe, expect, it } from "vitest";
import {
  magneticForcePerLength,
  electricForcePerLength,
  equivalenceCheck,
} from "@/lib/physics/electromagnetism/relativistic-magnetism";
import {
  ELEMENTARY_CHARGE,
  EPSILON_0,
  MU_0,
  SPEED_OF_LIGHT,
} from "@/lib/physics/constants";

describe("magneticForcePerLength", () => {
  it("returns the closed form μ₀ I₁ I₂ / (2π d)", () => {
    const I1 = 3;
    const I2 = 5;
    const d = 0.02;
    const expected = (MU_0 * I1 * I2) / (2 * Math.PI * d);
    expect(magneticForcePerLength(I1, I2, d)).toBeCloseTo(expected, 30);
  });

  it("scales linearly with each current and inversely with separation", () => {
    const F0 = magneticForcePerLength(1, 1, 0.01);
    expect(magneticForcePerLength(2, 1, 0.01) / F0).toBeCloseTo(2, 12);
    expect(magneticForcePerLength(1, 3, 0.01) / F0).toBeCloseTo(3, 12);
    expect(magneticForcePerLength(1, 1, 0.02) / F0).toBeCloseTo(0.5, 12);
  });

  it("throws on non-positive separation", () => {
    expect(() => magneticForcePerLength(1, 1, 0)).toThrow();
    expect(() => magneticForcePerLength(1, 1, -0.01)).toThrow();
  });
});

describe("electricForcePerLength", () => {
  it("returns the closed form ρ² / (2π ε₀ d) for parallel charged lines", () => {
    const rho = 1e-9;
    const d = 0.01;
    const expected = (rho * rho) / (2 * Math.PI * EPSILON_0 * d);
    expect(electricForcePerLength(rho, d)).toBeCloseTo(expected, 30);
  });

  it("is quadratic in line density", () => {
    const F0 = electricForcePerLength(1e-9, 0.01);
    expect(electricForcePerLength(2e-9, 0.01) / F0).toBeCloseTo(4, 12);
    expect(electricForcePerLength(3e-9, 0.01) / F0).toBeCloseTo(9, 12);
  });

  it("is invariant under the sign of the line density (force magnitude)", () => {
    const Fp = electricForcePerLength(1e-9, 0.01);
    const Fn = electricForcePerLength(-1e-9, 0.01);
    expect(Fn).toBeCloseTo(Fp, 30);
  });

  it("throws on non-positive separation", () => {
    expect(() => electricForcePerLength(1e-9, 0)).toThrow();
  });
});

describe("equivalenceCheck — Purcell's two-wire identity F_mag = F_elec", () => {
  // Baseline copper-like wire: lattice ~10²⁹ atoms/m, drift in mm/s for ~1 A,
  // separation 1 cm. The lib's most important property is that the ratio
  // equals 1 at every β; we sweep many orders of magnitude in vDrift.
  const n0 = 1e29; // charges per metre
  const d = 0.01; // 1 cm separation

  function runRatioCheck(vDrift: number, label: string) {
    const I = n0 * ELEMENTARY_CHARGE * vDrift;
    const { fMag, fElec, ratio } = equivalenceCheck(I, n0, vDrift, d);
    expect(Number.isFinite(fMag), `fMag finite (${label})`).toBe(true);
    expect(Number.isFinite(fElec), `fElec finite (${label})`).toBe(true);
    // ratio MUST equal 1 exactly to numerical tolerance — this is the
    // canonical Purcell equivalence and the lib's load-bearing property.
    expect(Math.abs(ratio - 1)).toBeLessThan(1e-10);
  }

  it("ratio === 1 at vDrift = 1 mm/s (β ≈ 3 × 10⁻¹², copper realistic)", () => {
    runRatioCheck(1e-3, "1 mm/s");
  });

  it("ratio === 1 at vDrift = 1 m/s", () => {
    runRatioCheck(1, "1 m/s");
  });

  it("ratio === 1 at vDrift = 1 km/s", () => {
    runRatioCheck(1e3, "1 km/s");
  });

  it("ratio === 1 at vDrift = 10⁶ m/s (β ≈ 0.0033)", () => {
    runRatioCheck(1e6, "1e6 m/s");
  });

  it("ratio === 1 at vDrift = 10⁷ m/s (β ≈ 0.033)", () => {
    runRatioCheck(1e7, "1e7 m/s");
  });

  it("ratio === 1 at vDrift = 10⁸ m/s (β ≈ 0.33, mildly relativistic)", () => {
    runRatioCheck(1e8, "1e8 m/s");
  });

  it("ratio === 1 at vDrift = 0.5 c (β = 0.5)", () => {
    runRatioCheck(0.5 * SPEED_OF_LIGHT, "0.5 c");
  });

  it("ratio === 1 at vDrift = 0.9 c (β = 0.9, ultrarelativistic)", () => {
    runRatioCheck(0.9 * SPEED_OF_LIGHT, "0.9 c");
  });

  it("ratio === 1 across orders of magnitude in n0 and d (lattice & geometry)", () => {
    const sweep: { n0: number; d: number; v: number }[] = [
      { n0: 1e25, d: 1e-3, v: 1e6 },
      { n0: 1e30, d: 0.05, v: 1e7 },
      { n0: 5e28, d: 0.001, v: 0.1 * SPEED_OF_LIGHT },
      { n0: 1e29, d: 0.1, v: 0.7 * SPEED_OF_LIGHT },
    ];
    for (const { n0: n, d: dd, v } of sweep) {
      const I = n * ELEMENTARY_CHARGE * v;
      const { ratio } = equivalenceCheck(I, n, v, dd);
      expect(Math.abs(ratio - 1)).toBeLessThan(1e-10);
    }
  });

  it("fMag and fElec individually scale as β² at low β (Purcell's leading-order check)", () => {
    // At low β, both forces scale as β² · (e² n0² / (2π ε₀ d)). Doubling
    // vDrift should quadruple both numbers, with the ratio still pinned at 1.
    const I1 = n0 * ELEMENTARY_CHARGE * 1e6;
    const I2 = n0 * ELEMENTARY_CHARGE * 2e6;
    const r1 = equivalenceCheck(I1, n0, 1e6, d);
    const r2 = equivalenceCheck(I2, n0, 2e6, d);
    expect(r2.fMag / r1.fMag).toBeCloseTo(4, 8);
    expect(r2.fElec / r1.fElec).toBeCloseTo(4, 8);
    expect(Math.abs(r1.ratio - 1)).toBeLessThan(1e-10);
    expect(Math.abs(r2.ratio - 1)).toBeLessThan(1e-10);
  });

  it("throws on invalid inputs", () => {
    expect(() => equivalenceCheck(1, n0, 1e6, 0)).toThrow();
    expect(() => equivalenceCheck(1, 0, 1e6, d)).toThrow();
    expect(() => equivalenceCheck(1, n0, -1, d)).toThrow();
    expect(() => equivalenceCheck(1, n0, SPEED_OF_LIGHT, d)).toThrow();
  });
});
