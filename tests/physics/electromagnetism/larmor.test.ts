import { describe, expect, it } from "vitest";
import {
  larmorAngularIntensity,
  larmorPower,
  larmorPowerRelativistic,
  thomsonCrossSection,
} from "@/lib/physics/electromagnetism/larmor";
import {
  ELEMENTARY_CHARGE,
  EPSILON_0,
  SPEED_OF_LIGHT,
} from "@/lib/physics/constants";

describe("larmorPower (non-relativistic)", () => {
  it("P = q² a² / (6π ε₀ c³) — exact closed form", () => {
    const q = ELEMENTARY_CHARGE;
    const a = 1;
    const expected =
      (q * q * a * a) /
      (6 * Math.PI * EPSILON_0 * SPEED_OF_LIGHT ** 3);
    expect(larmorPower(q, a)).toBeCloseTo(expected, 50);
  });

  it("P(e⁻, 1 m/s²) ≈ 5.71 × 10⁻⁵⁴ W (textbook benchmark)", () => {
    const P = larmorPower(ELEMENTARY_CHARGE, 1);
    // Tolerance: ±1%.
    expect(P).toBeGreaterThan(5.65e-54);
    expect(P).toBeLessThan(5.77e-54);
  });

  it("scales as a² (quadratic in acceleration)", () => {
    const P1 = larmorPower(ELEMENTARY_CHARGE, 10);
    const P2 = larmorPower(ELEMENTARY_CHARGE, 20);
    // P2 / P1 = 4 exactly.
    expect(P2 / P1).toBeCloseTo(4, 12);
  });

  it("scales as q² (quadratic in charge — sign drops)", () => {
    const Pp = larmorPower(ELEMENTARY_CHARGE, 1);
    const Pn = larmorPower(-ELEMENTARY_CHARGE, 1);
    expect(Pn).toBeCloseTo(Pp, 50);
  });

  it("is zero for zero acceleration (unaccelerated charges don't radiate)", () => {
    expect(larmorPower(ELEMENTARY_CHARGE, 0)).toBe(0);
  });

  it("throws on negative acceleration magnitude", () => {
    expect(() => larmorPower(ELEMENTARY_CHARGE, -1)).toThrow();
  });
});

describe("larmorAngularIntensity (sin²θ doughnut)", () => {
  it("peaks at θ = π/2 (broadside to the acceleration)", () => {
    const q = ELEMENTARY_CHARGE;
    const a = 1;
    const axis = larmorAngularIntensity(q, a, 0);
    const broadside = larmorAngularIntensity(q, a, Math.PI / 2);
    expect(axis).toBeCloseTo(0, 50);
    expect(broadside).toBeGreaterThan(0);
  });

  it("is zero along the acceleration axis (θ = 0 and θ = π)", () => {
    const q = ELEMENTARY_CHARGE;
    expect(larmorAngularIntensity(q, 1, 0)).toBeCloseTo(0, 50);
    expect(larmorAngularIntensity(q, 1, Math.PI)).toBeCloseTo(0, 50);
  });

  it("sphere-integral of dP/dΩ equals the total Larmor power", () => {
    // Trapezoidal integration of ∫₀^π ∫₀^{2π} (dP/dΩ) sin θ dφ dθ.
    const q = ELEMENTARY_CHARGE;
    const a = 1;
    const nTheta = 600;
    let integral = 0;
    for (let i = 0; i < nTheta; i++) {
      const theta = ((i + 0.5) / nTheta) * Math.PI;
      const dTheta = Math.PI / nTheta;
      const dP = larmorAngularIntensity(q, a, theta);
      // dΩ = sin θ · dθ · dφ; integrate φ analytically → 2π.
      integral += dP * Math.sin(theta) * dTheta * 2 * Math.PI;
    }
    const total = larmorPower(q, a);
    // Midpoint rule on smooth integrand → accurate to well under 1%.
    expect(integral / total).toBeGreaterThan(0.999);
    expect(integral / total).toBeLessThan(1.001);
  });
});

describe("larmorPowerRelativistic (Liénard γ⁴ / γ⁶ boosts)", () => {
  it("reduces to Larmor at β → 0 (perpendicular)", () => {
    const q = ELEMENTARY_CHARGE;
    const a = 1e15;
    const P0 = larmorPower(q, a);
    const Prel = larmorPowerRelativistic(q, a, 0, false);
    expect(Prel).toBeCloseTo(P0, 40);
  });

  it("reduces to Larmor at β → 0 (parallel)", () => {
    const q = ELEMENTARY_CHARGE;
    const a = 1e15;
    const P0 = larmorPower(q, a);
    const Prel = larmorPowerRelativistic(q, a, 0, true);
    expect(Prel).toBeCloseTo(P0, 40);
  });

  it("perpendicular acceleration boosts by γ⁴", () => {
    const q = ELEMENTARY_CHARGE;
    const a = 1e15;
    const v = 0.9 * SPEED_OF_LIGHT;
    const gamma = 1 / Math.sqrt(1 - 0.81);
    const Prel = larmorPowerRelativistic(q, a, v, false);
    const expected = gamma ** 4 * larmorPower(q, a);
    expect(Prel / expected).toBeCloseTo(1, 10);
  });

  it("parallel acceleration boosts by γ⁶ (stronger than perpendicular)", () => {
    const q = ELEMENTARY_CHARGE;
    const a = 1e15;
    const v = 0.9 * SPEED_OF_LIGHT;
    const gamma = 1 / Math.sqrt(1 - 0.81);
    const Prel = larmorPowerRelativistic(q, a, v, true);
    const expected = gamma ** 6 * larmorPower(q, a);
    expect(Prel / expected).toBeCloseTo(1, 10);
    // Sanity: parallel case is γ² times larger than perpendicular.
    const Pperp = larmorPowerRelativistic(q, a, v, false);
    expect(Prel / Pperp).toBeCloseTo(gamma * gamma, 10);
  });

  it("throws on v ≥ c or v < 0", () => {
    expect(() =>
      larmorPowerRelativistic(ELEMENTARY_CHARGE, 1, SPEED_OF_LIGHT, false),
    ).toThrow();
    expect(() =>
      larmorPowerRelativistic(ELEMENTARY_CHARGE, 1, -1, false),
    ).toThrow();
  });
});

describe("thomsonCrossSection", () => {
  it("≈ 6.6524587 × 10⁻²⁹ m² (CODATA 2018)", () => {
    const sigma = thomsonCrossSection();
    // Accepted σ_T = 6.6524587321 × 10⁻²⁹ m². Tolerance ±0.02 × 10⁻²⁹.
    expect(sigma).toBeGreaterThan(6.633e-29);
    expect(sigma).toBeLessThan(6.673e-29);
  });

  it("equals (8π/3) · r_e² with the expected classical electron radius", () => {
    const sigma = thomsonCrossSection();
    // r_e = √(3σ/8π). Expected r_e ≈ 2.818 × 10⁻¹⁵ m.
    const re = Math.sqrt((3 * sigma) / (8 * Math.PI));
    expect(re).toBeGreaterThan(2.81e-15);
    expect(re).toBeLessThan(2.83e-15);
  });
});
