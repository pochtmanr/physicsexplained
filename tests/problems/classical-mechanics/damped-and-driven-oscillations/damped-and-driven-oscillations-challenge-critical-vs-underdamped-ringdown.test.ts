import { describe, it, expect } from "vitest";
import {
  inputs,
  solve,
} from "@/lib/problems/classical-mechanics/damped-and-driven-oscillations/damped-and-driven-oscillations-challenge-critical-vs-underdamped-ringdown";
import { dampedFree } from "@/lib/physics/damped-oscillator";

describe("damped-and-driven-oscillations-challenge-critical-vs-underdamped-ringdown", () => {
  const result = solve();

  const k           = 16;
  const m_val       = 1;
  const x_0         = 0.25;
  const gamma_under = 1;
  const t_eval      = 2;

  const omega_0   = Math.sqrt(k / m_val); // 4
  const gamma_crit = 2 * omega_0;         // 8

  it("inputs have expected canonical values", () => {
    expect(inputs.k.value).toBe(16);
    expect(inputs.m.value).toBe(1);
    expect(inputs.x_0.value).toBe(0.25);
    expect(inputs.gamma_under.value).toBe(1);
    expect(inputs.t_eval.value).toBe(2);
  });

  it("step 1: omega_0 = sqrt(k/m) = 4", () => {
    expect(result.omega_0).toBeCloseTo(4, 6);
  });

  it("step 2: gamma_crit = 2 * omega_0 = 8", () => {
    expect(result.gamma_crit).toBeCloseTo(8, 6);
  });

  it("step 3: x_under_2 = dampedFree(2, x0, underdamped params)", () => {
    const expected = dampedFree(t_eval, x_0, { omega0: omega_0, gamma: gamma_under });
    expect(result.x_under_2).toBeCloseTo(expected, 8);
  });

  it("step 4: energy_frac uses amplitude envelope at t_eval", () => {
    const A_t = x_0 * Math.exp((-gamma_under * t_eval) / 2);
    const expected = (A_t / x_0) ** 2;
    expect(result.energy_frac).toBeCloseTo(expected, 6);
    // Energy fraction must be between 0 and 1
    expect(result.energy_frac).toBeGreaterThan(0);
    expect(result.energy_frac).toBeLessThan(1);
  });

  it("step 5: x_crit_2 = dampedFree(2, x0, critically damped params)", () => {
    const expected = dampedFree(t_eval, x_0, { omega0: omega_0, gamma: gamma_crit });
    expect(result.x_crit_2).toBeCloseTo(expected, 8);
    // Critically damped returns to near zero without oscillating
    expect(result.x_crit_2).toBeGreaterThan(0);
    expect(result.x_crit_2).toBeLessThan(x_0);
  });

  it("step 6 (final): t_star where critically-damped solution = 1% of x_0", () => {
    // Verify that at t_star the critically-damped position is ≈ 0.01 * x_0
    const val = dampedFree(result.t_star, x_0, { omega0: omega_0, gamma: gamma_crit });
    expect(Math.abs(val - 0.01 * x_0)).toBeLessThan(1e-6);
  });

  it("critically damped settles faster than overdamped boundary check", () => {
    // t_star should be a positive finite time
    expect(result.t_star).toBeGreaterThan(0);
    expect(result.t_star).toBeLessThan(5);
  });

  it("finalAnswerStepId value: t_star", () => {
    expect(result.t_star).toBeGreaterThan(0);
  });
});
