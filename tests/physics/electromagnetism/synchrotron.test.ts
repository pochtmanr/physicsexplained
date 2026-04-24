import { describe, expect, it } from "vitest";
import {
  criticalFrequency,
  emissionConeHalfAngleRad,
  relativisticDopplerBoost,
  syncSpectrumShape,
  synchrotronPower,
} from "@/lib/physics/electromagnetism/synchrotron";
import {
  ELEMENTARY_CHARGE,
  EPSILON_0,
  SPEED_OF_LIGHT,
} from "@/lib/physics/constants";

describe("emissionConeHalfAngleRad", () => {
  it("γ = 10⁴ → cone half-angle exactly 1e-4 rad (100 μrad)", () => {
    expect(emissionConeHalfAngleRad(1e4)).toBe(1e-4);
  });

  it("γ = 1 → cone half-angle 1 rad (non-relativistic limit; no collimation)", () => {
    expect(emissionConeHalfAngleRad(1)).toBe(1);
  });

  it("is strictly decreasing in γ (higher energy → sharper beam)", () => {
    expect(emissionConeHalfAngleRad(10)).toBeGreaterThan(
      emissionConeHalfAngleRad(100),
    );
    expect(emissionConeHalfAngleRad(100)).toBeGreaterThan(
      emissionConeHalfAngleRad(1000),
    );
  });

  it("throws on γ < 1 (unphysical Lorentz factor)", () => {
    expect(() => emissionConeHalfAngleRad(0.5)).toThrow();
    expect(() => emissionConeHalfAngleRad(Number.NaN)).toThrow();
  });
});

describe("criticalFrequency", () => {
  it("matches the closed form ω_c = (3/2) γ³ c / R", () => {
    // γ = 10⁴, R = 10 m  →  ω_c = 1.5 · 1e12 · 2.998e8 / 10 ≈ 4.497e19 rad/s.
    const gamma = 1e4;
    const R = 10;
    const expected = (1.5 * gamma * gamma * gamma * SPEED_OF_LIGHT) / R;
    expect(criticalFrequency(gamma, R)).toBeCloseTo(expected, -10);
    // The computed value lives in the hard X-ray / γ regime (≳ 10¹⁹ rad/s).
    expect(criticalFrequency(gamma, R)).toBeGreaterThan(1e19);
  });

  it("scales as γ³ at fixed R", () => {
    const R = 5;
    const wcLow = criticalFrequency(10, R);
    const wcHigh = criticalFrequency(100, R);
    expect(wcHigh / wcLow).toBeCloseTo(1000, 5);
  });

  it("scales as 1/R at fixed γ", () => {
    const gamma = 1000;
    const wc1 = criticalFrequency(gamma, 1);
    const wc10 = criticalFrequency(gamma, 10);
    expect(wc1 / wc10).toBeCloseTo(10, 10);
  });
});

describe("syncSpectrumShape", () => {
  it("low-x asymptote: F(10⁻³) ≈ 2.15 · (10⁻³)^(1/3) (within 5%)", () => {
    const x = 1e-3;
    const asymptote = 2.15 * Math.cbrt(x);
    const F = syncSpectrumShape(x);
    expect(Math.abs(F - asymptote) / asymptote).toBeLessThan(0.05);
  });

  it("high-x asymptote: F(10) ≈ 1.25 · √10 · e^(−10) (within 5%)", () => {
    const x = 10;
    const asymptote = 1.25 * Math.sqrt(x) * Math.exp(-x);
    const F = syncSpectrumShape(x);
    expect(Math.abs(F - asymptote) / asymptote).toBeLessThan(0.05);
  });

  it("returns 0 at x = 0 (no DC component in this model)", () => {
    expect(syncSpectrumShape(0)).toBe(0);
    expect(syncSpectrumShape(-1)).toBe(0);
  });

  it("is strictly decreasing in the far tail (exponential cutoff dominates)", () => {
    const F5 = syncSpectrumShape(5);
    const F10 = syncSpectrumShape(10);
    const F20 = syncSpectrumShape(20);
    expect(F5).toBeGreaterThan(F10);
    expect(F10).toBeGreaterThan(F20);
  });
});

describe("relativisticDopplerBoost", () => {
  it("on-axis at γ = 10 → boost = 100 exactly (γ²)", () => {
    expect(relativisticDopplerBoost(10, 0)).toBe(100);
  });

  it("falls off once θ exceeds the 1/γ cone: D(γ, 1/γ) = γ²/4", () => {
    const gamma = 50;
    const D0 = relativisticDopplerBoost(gamma, 0);
    const Dedge = relativisticDopplerBoost(gamma, 1 / gamma);
    // At θ = 1/γ, u = 1, (1 + 1)² = 4, so D_edge = γ²/4 = D0/4.
    expect(Dedge).toBeCloseTo(D0 / 4, 10);
  });

  it("is symmetric in θ (even function)", () => {
    const gamma = 20;
    expect(relativisticDopplerBoost(gamma, 0.01)).toBeCloseTo(
      relativisticDopplerBoost(gamma, -0.01),
      12,
    );
  });
});

describe("synchrotronPower", () => {
  it("reduces to the non-relativistic Larmor formula P = q²a²/(6πε₀c³) at v ≪ c", () => {
    // Pick a very non-relativistic speed. a = v²/R.
    const q = ELEMENTARY_CHARGE;
    const v = 1e3; // β ≈ 3.3e-6 — deeply non-relativistic
    const R = 1;
    const a = (v * v) / R;
    const pLarmor =
      (q * q * a * a) /
      (6 *
        Math.PI *
        EPSILON_0 *
        SPEED_OF_LIGHT *
        SPEED_OF_LIGHT *
        SPEED_OF_LIGHT);
    const pSync = synchrotronPower(q, v, R);
    expect(Math.abs(pSync - pLarmor) / pLarmor).toBeLessThan(1e-6);
  });

  it("scales as γ⁴ at fixed radius for highly relativistic motion", () => {
    // At fixed R and β close to 1, β⁴ ≈ 1, so the ratio is γ₁⁴/γ₂⁴.
    const q = ELEMENTARY_CHARGE;
    const R = 10;
    // γ ≈ 100  →  β = √(1 − 1/γ²) ≈ 1 − 5e-5
    const gamma1 = 100;
    const gamma2 = 1000;
    const v1 = SPEED_OF_LIGHT * Math.sqrt(1 - 1 / (gamma1 * gamma1));
    const v2 = SPEED_OF_LIGHT * Math.sqrt(1 - 1 / (gamma2 * gamma2));
    const p1 = synchrotronPower(q, v1, R);
    const p2 = synchrotronPower(q, v2, R);
    const ratio = p2 / p1;
    const expected = (gamma2 / gamma1) ** 4;
    expect(Math.abs(ratio - expected) / expected).toBeLessThan(1e-3);
  });

  it("throws on |v| ≥ c and on non-positive radius", () => {
    expect(() =>
      synchrotronPower(ELEMENTARY_CHARGE, SPEED_OF_LIGHT, 1),
    ).toThrow();
    expect(() => synchrotronPower(ELEMENTARY_CHARGE, 1e6, 0)).toThrow();
    expect(() => synchrotronPower(ELEMENTARY_CHARGE, 1e6, -1)).toThrow();
  });
});
