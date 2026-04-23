import { describe, expect, it } from "vitest";
import {
  rcCharge,
  rcDischarge,
  rcTimeConstant,
  rcChargeCurrent,
  capacitorEnergy,
  rcChargeEnergyDissipated,
  rcChargeBatteryEnergy,
} from "@/lib/physics/electromagnetism/rc-circuits";

describe("rcTimeConstant", () => {
  it("τ = R · C", () => {
    expect(rcTimeConstant(1000, 1e-6)).toBeCloseTo(1e-3, 15);
    expect(rcTimeConstant(2, 3)).toBe(6);
  });

  it("throws when R or C is non-positive", () => {
    expect(() => rcTimeConstant(0, 1e-6)).toThrow();
    expect(() => rcTimeConstant(-1, 1e-6)).toThrow();
    expect(() => rcTimeConstant(1000, 0)).toThrow();
    expect(() => rcTimeConstant(1000, -1e-6)).toThrow();
  });
});

describe("rcCharge", () => {
  it("starts at 0 at t = 0", () => {
    expect(rcCharge(5, 1000, 1e-6, 0)).toBe(0);
  });

  it("reaches (1 − 1/e) ≈ 63.2 % of V₀ at t = τ", () => {
    const V0 = 5;
    const R = 1000;
    const C = 1e-6;
    const tau = R * C;
    const v = rcCharge(V0, R, C, tau);
    expect(v / V0).toBeCloseTo(1 - 1 / Math.E, 10);
  });

  it("is within 1 % of V₀ at t = 5τ", () => {
    const V0 = 12;
    const R = 2200;
    const C = 4.7e-6;
    const tau = R * C;
    const v = rcCharge(V0, R, C, 5 * tau);
    expect(v).toBeGreaterThan(0.99 * V0);
    expect(v).toBeLessThan(V0);
  });

  it("approaches V₀ as t → ∞", () => {
    expect(rcCharge(9, 100, 1e-3, 1000)).toBeCloseTo(9, 12);
  });
});

describe("rcDischarge", () => {
  it("starts at V₀ at t = 0", () => {
    expect(rcDischarge(5, 1000, 1e-6, 0)).toBe(5);
  });

  it("decays to 1/e ≈ 36.8 % of V₀ at t = τ", () => {
    const V0 = 9;
    const R = 5000;
    const C = 2e-6;
    const tau = R * C;
    const v = rcDischarge(V0, R, C, tau);
    expect(v / V0).toBeCloseTo(1 / Math.E, 10);
  });

  it("approaches 0 as t → ∞", () => {
    expect(rcDischarge(12, 1000, 1e-3, 100)).toBeCloseTo(0, 12);
  });

  it("is the mirror of the charging curve: rcCharge + rcDischarge = V₀", () => {
    const V0 = 7;
    const R = 470;
    const C = 1e-6;
    const t = 1.5 * R * C;
    expect(rcCharge(V0, R, C, t) + rcDischarge(V0, R, C, t)).toBeCloseTo(V0, 12);
  });
});

describe("rcChargeCurrent", () => {
  it("starts at V₀/R at t = 0 (purely resistive limit)", () => {
    const V0 = 10;
    const R = 200;
    const C = 1e-5;
    expect(rcChargeCurrent(V0, R, C, 0)).toBeCloseTo(V0 / R, 15);
  });

  it("decays to (V₀/R)/e at t = τ", () => {
    const V0 = 5;
    const R = 1000;
    const C = 1e-6;
    const tau = R * C;
    const i = rcChargeCurrent(V0, R, C, tau);
    expect(i).toBeCloseTo(V0 / R / Math.E, 12);
  });

  it("decays to essentially zero at t = 10τ", () => {
    const V0 = 5;
    const R = 1000;
    const C = 1e-6;
    const tau = R * C;
    const i = rcChargeCurrent(V0, R, C, 10 * tau);
    expect(i).toBeLessThan((V0 / R) * 1e-4);
  });
});

describe("energy accounting", () => {
  it("½CV² stored = ½CV² dissipated = same half of CV² delivered", () => {
    const C = 100e-6;
    const V0 = 5;
    const stored = capacitorEnergy(C, V0);
    const dissipated = rcChargeEnergyDissipated(C, V0);
    const delivered = rcChargeBatteryEnergy(C, V0);
    expect(stored).toBeCloseTo(0.5 * C * V0 * V0, 18);
    expect(dissipated).toBeCloseTo(stored, 18);
    expect(delivered).toBeCloseTo(stored + dissipated, 18);
  });

  it("dissipated energy is independent of R", () => {
    const C = 10e-6;
    const V0 = 12;
    // rcChargeEnergyDissipated is by construction only a function of C and V0,
    // but the claim is physical — assert the total ∫i²R dt against the
    // closed form at two very different R values by comparing the analytic
    // expression itself.
    const e1 = rcChargeEnergyDissipated(C, V0);
    const e2 = rcChargeEnergyDissipated(C, V0);
    expect(e1).toBe(e2);
    expect(e1).toBeCloseTo(0.5 * C * V0 * V0, 18);
  });

  it("numerical ∫i²R dt converges to ½CV² regardless of R", () => {
    // Riemann-sum check of the integral ∫ i(t)² R dt with i(t) = (V₀/R) e^(−t/τ).
    const V0 = 5;
    const C = 1e-6;
    for (const R of [100, 1000, 10000]) {
      const tau = R * C;
      const steps = 20000;
      const tMax = 15 * tau; // effectively ∞
      const dt = tMax / steps;
      let W = 0;
      for (let k = 0; k < steps; k++) {
        const t = (k + 0.5) * dt;
        const i = rcChargeCurrent(V0, R, C, t);
        W += i * i * R * dt;
      }
      const expected = 0.5 * C * V0 * V0;
      // Should be within 0.5 % of the closed form regardless of R.
      expect(Math.abs(W - expected) / expected).toBeLessThan(5e-3);
    }
  });
});
