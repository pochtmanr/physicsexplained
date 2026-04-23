import { describe, expect, it } from "vitest";
import {
  ampereMaxwellLineIntegral,
  capacitorCurrentContinuity,
  displacementCurrent,
  displacementCurrentDensity,
  speedOfLightFromFundamentals,
} from "@/lib/physics/electromagnetism/displacement-current";
import { EPSILON_0, MU_0, SPEED_OF_LIGHT } from "@/lib/physics/constants";

describe("displacementCurrentDensity", () => {
  it("returns zero when the field is static", () => {
    expect(displacementCurrentDensity(0)).toBe(0);
  });

  it("returns ε₀·dE/dt for an arbitrary rate", () => {
    const dEdt = 1e9; // V/(m·s) — a fast-rising field
    expect(displacementCurrentDensity(dEdt)).toBeCloseTo(EPSILON_0 * dEdt, 24);
  });

  it("is linear in dE/dt", () => {
    const a = displacementCurrentDensity(1);
    const b = displacementCurrentDensity(17);
    expect(b / a).toBeCloseTo(17, 12);
  });
});

describe("displacementCurrent", () => {
  it("matches ε₀·A·dE/dt for a textbook case", () => {
    // 1 cm² = 1e-4 m², dE/dt = 1e10 V/(m·s) → I_d ≈ 8.85e-6 A.
    const I = displacementCurrent(1e-4, 1e10);
    expect(I).toBeCloseTo(EPSILON_0 * 1e-4 * 1e10, 20);
    expect(I).toBeCloseTo(8.854e-6, 8);
  });

  it("scales linearly with area at fixed dE/dt", () => {
    const I1 = displacementCurrent(1e-4, 1e9);
    const I2 = displacementCurrent(3e-4, 1e9);
    expect(I2 / I1).toBeCloseTo(3, 12);
  });
});

describe("capacitorCurrentContinuity", () => {
  it("conduction equals displacement for a range of dQ/dt", () => {
    const A = 0.01; // m², a 10 cm × 10 cm plate
    const d = 1e-3; // m, 1 mm gap
    for (const dQdt of [1e-6, 1e-3, 1.0, 42, 1e3]) {
      const { Iconduction, Idisplacement } = capacitorCurrentContinuity(
        A,
        d,
        dQdt,
      );
      expect(Iconduction).toBe(dQdt);
      // The two must agree to full numerical precision — this is the
      // exact-continuity reveal.
      expect(Idisplacement).toBeCloseTo(Iconduction, 20);
    }
  });

  it("is independent of plate gap d (E depends on σ, not on d)", () => {
    const A = 0.01;
    const dQdt = 0.5;
    const thin = capacitorCurrentContinuity(A, 1e-4, dQdt);
    const thick = capacitorCurrentContinuity(A, 1e-2, dQdt);
    expect(thin.Idisplacement).toBeCloseTo(thick.Idisplacement, 20);
  });

  it("throws on non-positive geometry", () => {
    expect(() => capacitorCurrentContinuity(0, 1e-3, 1)).toThrow();
    expect(() => capacitorCurrentContinuity(1e-2, 0, 1)).toThrow();
    expect(() => capacitorCurrentContinuity(-1, 1e-3, 1)).toThrow();
  });
});

describe("speedOfLightFromFundamentals", () => {
  it("reproduces c to within 1 part in 1e6", () => {
    const c = speedOfLightFromFundamentals();
    const rel = Math.abs(c - SPEED_OF_LIGHT) / SPEED_OF_LIGHT;
    // With CODATA 2018 values of μ₀ and ε₀ and the exact c from the 2019 SI
    // redefinition, the agreement is at the 1e-10 level. The 1e-6 bar is
    // loose on purpose: it survives any future constant refresh.
    expect(rel).toBeLessThan(1e-6);
  });

  it("equals 1/√(μ₀·ε₀) exactly", () => {
    expect(speedOfLightFromFundamentals()).toBe(1 / Math.sqrt(MU_0 * EPSILON_0));
  });
});

describe("ampereMaxwellLineIntegral", () => {
  it("collapses to μ₀·I_enc when ∂Φ_E/∂t is zero (static case)", () => {
    const I = 5;
    expect(ampereMaxwellLineIntegral(I, 0)).toBeCloseTo(MU_0 * I, 20);
  });

  it("collapses to μ₀·ε₀·∂Φ_E/∂t when no conduction current crosses", () => {
    // Through-the-gap surface between capacitor plates: I_enc = 0, but
    // ∂Φ_E/∂t is nonzero. This is the displacement-only regime.
    const dPhiEdt = 1e8;
    const lhs = ampereMaxwellLineIntegral(0, dPhiEdt);
    expect(lhs).toBeCloseTo(MU_0 * EPSILON_0 * dPhiEdt, 20);
  });

  it("agrees between the two surfaces when the capacitor-continuity identity holds", () => {
    // Charging at I = 1 A through a capacitor with plate area A. The
    // through-the-wire surface sees I_enc = 1, ∂Φ_E/∂t = 0.
    // The through-the-gap surface sees I_enc = 0, ε₀·∂Φ_E/∂t = 1.
    // Both evaluations of ∮B·dℓ must be identical — the paradox collapses.
    const I = 1;
    const A = 0.02;
    const dQdt = I;
    const { Idisplacement } = capacitorCurrentContinuity(A, 1e-3, dQdt);
    const dPhiEdt = Idisplacement / EPSILON_0;

    const throughWire = ampereMaxwellLineIntegral(I, 0);
    const throughGap = ampereMaxwellLineIntegral(0, dPhiEdt);

    expect(throughGap).toBeCloseTo(throughWire, 20);
  });
});
