import { describe, it, expect } from "vitest";
import {
  inputs,
  solve,
} from "@/lib/problems/classical-mechanics/damped-and-driven-oscillations/damped-and-driven-oscillations-medium-q-factor-from-bandwidth";

describe("damped-and-driven-oscillations-medium-q-factor-from-bandwidth", () => {
  const result = solve();

  const omega_0 = 2 * Math.PI * 440;
  const gamma   = 8.796;

  it("inputs have expected canonical values", () => {
    expect(inputs.omega_0.value).toBeCloseTo(2 * Math.PI * 440, 4);
    expect(inputs.gamma.value).toBe(8.796);
  });

  it("step 1: Q = omega_0 / gamma", () => {
    const expected = omega_0 / gamma;
    expect(result.Q).toBeCloseTo(expected, 4);
    // For a A4 tuning fork Q should be around 313
    expect(result.Q).toBeGreaterThan(300);
  });

  it("step 2: omega_d = sqrt(omega_0^2 - gamma^2/4)", () => {
    const expected = Math.sqrt(omega_0 * omega_0 - gamma * gamma / 4);
    expect(result.omega_d).toBeCloseTo(expected, 4);
  });

  it("step 3: t_e = 2 / gamma", () => {
    const expected = 2 / gamma;
    expect(result.t_e).toBeCloseTo(expected, 6);
  });

  it("step 4: n_e = t_e * omega_d / (2*pi)", () => {
    const omega_d = Math.sqrt(omega_0 * omega_0 - gamma * gamma / 4);
    const t_e = 2 / gamma;
    const expected = (t_e * omega_d) / (2 * Math.PI);
    expect(result.n_e).toBeCloseTo(expected, 4);
    // Should be around Q/pi ≈ 99 cycles
    expect(result.n_e).toBeGreaterThan(80);
  });

  it("step 5 (final): delta_omega = gamma", () => {
    expect(result.delta_omega).toBeCloseTo(gamma, 6);
  });

  it("finalAnswerStepId value: delta_omega", () => {
    expect(result.delta_omega).toBeCloseTo(8.796, 6);
  });
});
