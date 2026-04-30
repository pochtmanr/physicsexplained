import { describe, it, expect } from "vitest";
import {
  inputs,
  solve,
} from "@/lib/problems/classical-mechanics/damped-and-driven-oscillations/damped-and-driven-oscillations-exam-driven-amplitude-vs-frequency";
import { drivenAmplitude } from "@/lib/physics/damped-oscillator";

describe("damped-and-driven-oscillations-exam-driven-amplitude-vs-frequency", () => {
  const result = solve();

  const m       = 2;
  const omega_0 = 8;
  const gamma   = 2;
  const F_0     = 20;
  const F_per_m = F_0 / m;  // 10
  const params  = { omega0: omega_0, gamma };

  it("inputs have expected canonical values", () => {
    expect(inputs.m.value).toBe(2);
    expect(inputs.omega_0.value).toBe(8);
    expect(inputs.gamma.value).toBe(2);
    expect(inputs.F_0.value).toBe(20);
    expect(inputs.omega_d_low.value).toBe(2);
    expect(inputs.omega_d_high.value).toBe(14);
  });

  it("step 1: Q = omega_0 / gamma = 4", () => {
    expect(result.Q).toBeCloseTo(4, 6);
  });

  it("step 2: F_per_m = F_0 / m = 10", () => {
    expect(result.F_per_m).toBeCloseTo(10, 6);
  });

  it("step 3: A_low at omega_d = 2", () => {
    const expected = drivenAmplitude(2, F_per_m, params);
    expect(result.A_low).toBeCloseTo(expected, 6);
    expect(result.A_low).toBeGreaterThan(0);
  });

  it("step 4: A_res at omega_d = omega_0", () => {
    // A_res = F_per_m / (gamma * omega_0) = 10 / (2*8) = 0.625
    const expected = F_per_m / (gamma * omega_0);
    expect(result.A_res).toBeCloseTo(expected, 6);
    expect(result.A_res).toBeCloseTo(0.625, 4);
  });

  it("A_res > A_low and A_res > A_high (resonance peak)", () => {
    expect(result.A_res).toBeGreaterThan(result.A_low);
    expect(result.A_res).toBeGreaterThan(result.A_high);
  });

  it("step 5: A_high at omega_d = 14", () => {
    const expected = drivenAmplitude(14, F_per_m, params);
    expect(result.A_high).toBeCloseTo(expected, 6);
  });

  it("step 6: phi_low = atan2(gamma*2, omega_0^2 - 4) (small, nearly in-phase)", () => {
    const expected = Math.atan2(gamma * 2, omega_0 * omega_0 - 4);
    expect(result.phi_low).toBeCloseTo(expected, 6);
    // Low frequency → phase close to 0 (in-phase)
    expect(result.phi_low).toBeGreaterThanOrEqual(0);
    expect(result.phi_low).toBeLessThan(Math.PI / 2);
  });

  it("step 7: phi_res = pi/2 at resonance", () => {
    expect(result.phi_res).toBeCloseTo(Math.PI / 2, 6);
  });

  it("step 8: phi_high beyond omega_0 (phase > pi/2, approaching pi)", () => {
    const expected = Math.atan2(gamma * 14, omega_0 * omega_0 - 14 * 14);
    expect(result.phi_high).toBeCloseTo(expected, 6);
    // High frequency → numerator positive, denominator negative → angle in (pi/2, pi)
    // atan2 can return negative — take absolute
    expect(Math.abs(result.phi_high)).toBeGreaterThan(Math.PI / 2);
  });

  it("step 9: A_static = F_per_m / omega_0^2", () => {
    const expected = F_per_m / (omega_0 * omega_0);
    expect(result.A_static).toBeCloseTo(expected, 6);
    // 10/64 ≈ 0.15625
    expect(result.A_static).toBeCloseTo(0.15625, 4);
  });

  it("step 10 (final): Q_factor_ratio = A_res / A_static ≈ Q", () => {
    // For Q=4 this should be close to Q
    expect(result.Q_factor_ratio).toBeCloseTo(result.Q, 1);
    expect(result.Q_factor_ratio).toBeCloseTo(4, 1);
  });

  it("finalAnswerStepId value: Q_factor_ratio", () => {
    expect(result.Q_factor_ratio).toBeGreaterThan(3);
  });
});
