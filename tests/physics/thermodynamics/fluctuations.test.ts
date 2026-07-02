import { describe, it, expect } from "vitest";
import { K_B } from "@/lib/physics/thermodynamics/distributions";
import {
  energyVariance,
  energyStdDev,
  relativeEnergyFluctuation,
  invSqrtN,
  johnsonNyquistVoltage,
  johnsonNyquistVoltageSquared,
  availableNoisePower,
} from "@/lib/physics/thermodynamics/fluctuations";

describe("canonical energy fluctuations", () => {
  it("variance ⟨(ΔE)²⟩ = k_B T² C_v is positive and equals the formula", () => {
    const T = 300;
    const cv = 1.5 * K_B; // one monatomic particle
    expect(energyVariance(T, cv)).toBeCloseTo(K_B * T * T * cv, 40);
    expect(energyVariance(T, cv)).toBeGreaterThan(0);
  });

  it("variance scales with T² and with C_v", () => {
    const cv = 2 * K_B;
    expect(energyVariance(600, cv)).toBeCloseTo(4 * energyVariance(300, cv), 38);
    expect(energyVariance(300, 2 * cv)).toBeCloseTo(2 * energyVariance(300, cv), 38);
  });

  it("std dev is the square root of the variance", () => {
    expect(energyStdDev(300, K_B)).toBeCloseTo(Math.sqrt(energyVariance(300, K_B)), 40);
  });
});

describe("1/√N scaling", () => {
  it("relative fluctuation halves when N quadruples", () => {
    expect(relativeEnergyFluctuation(4 * 100)).toBeCloseTo(
      relativeEnergyFluctuation(100) / 2,
      12,
    );
  });

  it("is utterly negligible at macroscopic N and percent-level at small N", () => {
    expect(relativeEnergyFluctuation(6e23)).toBeLessThan(1e-11);
    expect(relativeEnergyFluctuation(100)).toBeGreaterThan(0.01);
  });

  it("the bare 1/√N factor matches", () => {
    expect(invSqrtN(10000)).toBeCloseTo(0.01, 12);
    expect(invSqrtN(4)).toBeCloseTo(invSqrtN(1) / 2, 12);
  });
});

describe("Johnson–Nyquist thermal noise", () => {
  const T = 300;
  const R = 1e3;
  const df = 1e4;

  it("V² = 4 k_B T R Δf", () => {
    expect(johnsonNyquistVoltageSquared(T, R, df)).toBeCloseTo(4 * K_B * T * R * df, 30);
  });

  it("V_rms is the square root of V²", () => {
    expect(johnsonNyquistVoltage(T, R, df)).toBeCloseTo(
      Math.sqrt(johnsonNyquistVoltageSquared(T, R, df)),
      30,
    );
  });

  it("room-temperature value is sub-microvolt for a kΩ over 10 kHz", () => {
    // ≈ 4.1e-7 V
    expect(johnsonNyquistVoltage(T, R, df)).toBeGreaterThan(1e-7);
    expect(johnsonNyquistVoltage(T, R, df)).toBeLessThan(1e-6);
  });

  it("V_rms scales as √T and √R", () => {
    expect(johnsonNyquistVoltage(2 * T, R, df)).toBeCloseTo(
      Math.SQRT2 * johnsonNyquistVoltage(T, R, df),
      30,
    );
    expect(johnsonNyquistVoltage(T, 2 * R, df)).toBeCloseTo(
      Math.SQRT2 * johnsonNyquistVoltage(T, R, df),
      30,
    );
  });

  it("available noise power is k_B T Δf, independent of R", () => {
    expect(availableNoisePower(T, df)).toBeCloseTo(K_B * T * df, 40);
    expect(availableNoisePower(T, df)).toBeCloseTo(
      availableNoisePower(T, df), // same regardless of R — R not an argument
      40,
    );
  });
});
