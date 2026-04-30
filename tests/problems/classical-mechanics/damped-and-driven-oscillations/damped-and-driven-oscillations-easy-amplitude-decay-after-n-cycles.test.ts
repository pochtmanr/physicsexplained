import { describe, it, expect } from "vitest";
import {
  inputs,
  solve,
} from "@/lib/problems/classical-mechanics/damped-and-driven-oscillations/damped-and-driven-oscillations-easy-amplitude-decay-after-n-cycles";

describe("damped-and-driven-oscillations-easy-amplitude-decay-after-n-cycles", () => {
  const result = solve();

  it("inputs have expected canonical values", () => {
    expect(inputs.A_0.value).toBe(0.20);
    expect(inputs.gamma.value).toBe(0.4);
    expect(inputs.omega_0.value).toBe(5);
    expect(inputs.n.value).toBe(8);
  });

  it("step 1: omega_d = sqrt(omega_0^2 - gamma^2 / 4)", () => {
    // sqrt(25 - 0.04) = sqrt(24.96) ≈ 4.99600
    const expected = Math.sqrt(25 - 0.4 * 0.4 / 4);
    expect(result.omega_d).toBeCloseTo(expected, 6);
  });

  it("step 2: T_d = 2*pi / omega_d", () => {
    const omega_d = Math.sqrt(25 - 0.04);
    const expected = (2 * Math.PI) / omega_d;
    expect(result.T_d).toBeCloseTo(expected, 6);
  });

  it("step 3: t_n = n * T_d", () => {
    const omega_d = Math.sqrt(25 - 0.04);
    const T_d = (2 * Math.PI) / omega_d;
    const expected = 8 * T_d;
    expect(result.t_n).toBeCloseTo(expected, 6);
  });

  it("step 4 (final): A = A_0 * exp(-gamma * t_n / 2)", () => {
    const omega_d = Math.sqrt(25 - 0.04);
    const T_d = (2 * Math.PI) / omega_d;
    const t_n = 8 * T_d;
    const expected = 0.20 * Math.exp(-0.4 * t_n / 2);
    expect(result.A).toBeCloseTo(expected, 6);
    // Amplitude must be strictly less than initial
    expect(result.A).toBeLessThan(0.20);
    expect(result.A).toBeGreaterThan(0);
  });

  it("cross-check: dampedFree at t_n matches envelope (within ~1%)", () => {
    // At exactly n periods the cosine = 1, so dampedFree ≈ amplitude envelope
    // The small γ/2ω correction means they may differ slightly; allow 2 % tolerance.
    expect(Math.abs(result.x_check - result.A) / result.A).toBeLessThan(0.02);
  });

  it("finalAnswerStepId value: A", () => {
    expect(result.A).toBeGreaterThan(0);
    expect(result.A).toBeLessThan(0.20);
  });
});
