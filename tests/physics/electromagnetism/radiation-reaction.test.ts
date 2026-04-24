import { describe, expect, it } from "vitest";
import {
  abrahamLorentzForce,
  classicalElectronRadius,
  landauLifshitzForce,
  radiationReactionTimescale,
  runawaySolution,
} from "@/lib/physics/electromagnetism/radiation-reaction";
import {
  ELEMENTARY_CHARGE,
  EPSILON_0,
  MU_0,
  SPEED_OF_LIGHT,
} from "@/lib/physics/constants";

/** Electron rest mass, kg (CODATA 2018) — matches the module-private
 *  constant in `radiation-reaction.ts`. */
const ELECTRON_MASS = 9.1093837015e-31;

describe("radiationReactionTimescale", () => {
  it("τ₀(electron) ≈ 6.27 × 10⁻²⁴ s (classical benchmark)", () => {
    const tau0 = radiationReactionTimescale(ELEMENTARY_CHARGE, ELECTRON_MASS);
    // Accepted value 6.2662 × 10⁻²⁴ s. Tolerance ±1%.
    expect(tau0).toBeGreaterThan(6.2e-24);
    expect(tau0).toBeLessThan(6.34e-24);
  });

  it("matches closed-form q² / (6π ε₀ m c³) exactly", () => {
    const q = ELEMENTARY_CHARGE;
    const m = ELECTRON_MASS;
    const expected =
      (q * q) /
      (6 * Math.PI * EPSILON_0 * m * SPEED_OF_LIGHT ** 3);
    expect(radiationReactionTimescale(q, m)).toBeCloseTo(expected, 40);
  });

  it("throws on non-positive mass", () => {
    expect(() =>
      radiationReactionTimescale(ELEMENTARY_CHARGE, 0),
    ).toThrow();
    expect(() =>
      radiationReactionTimescale(ELEMENTARY_CHARGE, -1e-30),
    ).toThrow();
  });
});

describe("abrahamLorentzForce", () => {
  it("F_rad = (μ₀ q² / 6π c) · ȧ — exact coefficient", () => {
    const q = ELEMENTARY_CHARGE;
    const jerk = 1e20;
    const expected =
      ((MU_0 * q * q) / (6 * Math.PI * SPEED_OF_LIGHT)) * jerk;
    expect(abrahamLorentzForce(q, jerk)).toBeCloseTo(expected, 40);
  });

  it("is zero when the jerk is zero (pure uniform acceleration does not react on itself)", () => {
    expect(abrahamLorentzForce(ELEMENTARY_CHARGE, 0)).toBe(0);
  });

  it("is linear in the jerk and quadratic in the charge", () => {
    const F1 = abrahamLorentzForce(ELEMENTARY_CHARGE, 1e15);
    const F2 = abrahamLorentzForce(ELEMENTARY_CHARGE, 2e15);
    expect(F2 / F1).toBeCloseTo(2, 12);

    const Fe = abrahamLorentzForce(ELEMENTARY_CHARGE, 1e15);
    const F2e = abrahamLorentzForce(2 * ELEMENTARY_CHARGE, 1e15);
    expect(F2e / Fe).toBeCloseTo(4, 12);
  });
});

describe("runawaySolution (the pathology)", () => {
  it("a(10 τ₀) = a₀ · e¹⁰ — exponential growth without external force", () => {
    const tau0 = 6.27e-24;
    const a0 = 1;
    const a = runawaySolution(10 * tau0, a0, tau0);
    expect(a / Math.exp(10)).toBeCloseTo(1, 10);
  });

  it("a(0) = a₀ (initial condition passes through)", () => {
    expect(runawaySolution(0, 7, 6.27e-24)).toBe(7);
  });

  it("negative time produces the decaying branch (t < 0 → a → 0)", () => {
    const tau0 = 6.27e-24;
    const a = runawaySolution(-10 * tau0, 1, tau0);
    expect(a).toBeLessThan(1e-4);
    expect(a).toBeGreaterThan(0);
  });

  it("throws on non-positive τ₀", () => {
    expect(() => runawaySolution(1, 1, 0)).toThrow();
    expect(() => runawaySolution(1, 1, -1)).toThrow();
  });
});

describe("landauLifshitzForce", () => {
  it("vanishes when the external force is constant (Ḟ_ext = 0)", () => {
    const F = landauLifshitzForce(
      ELEMENTARY_CHARGE,
      ELECTRON_MASS,
      1e-10,
      0,
    );
    expect(F).toBe(0);
  });

  it("equals (τ₀/m) · Ḟ_ext for nonzero Ḟ_ext", () => {
    const tau0 = radiationReactionTimescale(
      ELEMENTARY_CHARGE,
      ELECTRON_MASS,
    );
    const FextDot = 1e-5;
    const expected = (tau0 / ELECTRON_MASS) * FextDot;
    const got = landauLifshitzForce(
      ELEMENTARY_CHARGE,
      ELECTRON_MASS,
      0,
      FextDot,
    );
    expect(got).toBeCloseTo(expected, 40);
  });

  it("is independent of F_ext at this order (the |F_ext|² correction drops at β = 0)", () => {
    const a = landauLifshitzForce(
      ELEMENTARY_CHARGE,
      ELECTRON_MASS,
      1e-10,
      1e-5,
    );
    const b = landauLifshitzForce(
      ELEMENTARY_CHARGE,
      ELECTRON_MASS,
      1e-8,
      1e-5,
    );
    expect(a).toBe(b);
  });

  it("throws on non-positive mass", () => {
    expect(() =>
      landauLifshitzForce(ELEMENTARY_CHARGE, 0, 0, 1),
    ).toThrow();
  });
});

describe("classicalElectronRadius", () => {
  it("≈ 2.818 × 10⁻¹⁵ m (classical benchmark)", () => {
    const re = classicalElectronRadius();
    // Accepted r_e = 2.8179403262 × 10⁻¹⁵ m. Tolerance ±0.1%.
    expect(re).toBeGreaterThan(2.815e-15);
    expect(re).toBeLessThan(2.821e-15);
  });

  it("matches the closed form q² / (4π ε₀ mₑ c²)", () => {
    const expected =
      (ELEMENTARY_CHARGE * ELEMENTARY_CHARGE) /
      (4 * Math.PI * EPSILON_0 * ELECTRON_MASS * SPEED_OF_LIGHT ** 2);
    expect(classicalElectronRadius()).toBeCloseTo(expected, 40);
  });

  it("r_e / c is (2/3) · τ₀ — the light-crossing-time identity", () => {
    const re = classicalElectronRadius();
    const tau0 = radiationReactionTimescale(
      ELEMENTARY_CHARGE,
      ELECTRON_MASS,
    );
    const ratio = re / SPEED_OF_LIGHT / tau0;
    // Algebra: r_e / c = q²/(4πε₀ m c³); τ₀ = q²/(6πε₀ m c³); ratio = 6π/4π = 3/2.
    expect(ratio).toBeCloseTo(1.5, 10);
  });
});
