import { describe, it, expect } from "vitest";
import {
  inputs,
  solve,
} from "@/lib/problems/classical-mechanics/damped-and-driven-oscillations/damped-and-driven-oscillations-hard-resonant-amplitude-with-q";

describe("damped-and-driven-oscillations-hard-resonant-amplitude-with-q", () => {
  const result = solve();

  const omega_0 = 10;
  const Q_given = 8;
  const F_0     = 4;
  const m       = 0.5;

  const gamma   = omega_0 / Q_given;   // 1.25
  const F_per_m = F_0 / m;            // 8

  it("inputs have expected canonical values", () => {
    expect(inputs.omega_0.value).toBe(10);
    expect(inputs.Q_given.value).toBe(8);
    expect(inputs.F_0.value).toBe(4);
    expect(inputs.m.value).toBe(0.5);
    expect(inputs.omega_d_off.value).toBe(6);
  });

  it("step 1: gamma = omega_0 / Q_given", () => {
    // 10 / 8 = 1.25
    expect(result.gamma).toBeCloseTo(1.25, 6);
  });

  it("Q round-trip", () => {
    expect(result.Q_check).toBeCloseTo(Q_given, 6);
  });

  it("step 2: F_per_m = F_0 / m", () => {
    expect(result.F_per_m).toBeCloseTo(8, 6);
  });

  it("step 3: A_res = F_per_m / (gamma * omega_0)", () => {
    // 8 / (1.25 * 10) = 8 / 12.5 = 0.64 m
    const expected = F_per_m / (gamma * omega_0);
    expect(result.A_res).toBeCloseTo(expected, 6);
    expect(result.A_res).toBeCloseTo(0.64, 4);
  });

  it("A_res_lib matches analytical A_res", () => {
    expect(result.A_res_lib).toBeCloseTo(result.A_res, 6);
  });

  it("step 4: A_off at omega_d = 6 rad/s", () => {
    const diff = omega_0 * omega_0 - 6 * 6; // 100 - 36 = 64
    const expected = F_per_m / Math.sqrt(diff * diff + gamma * gamma * 36);
    expect(result.A_off).toBeCloseTo(expected, 6);
  });

  it("step 5 (final): ratio = A_res / A_off", () => {
    const diff = omega_0 * omega_0 - 6 * 6;
    const A_off_exp = F_per_m / Math.sqrt(diff * diff + gamma * gamma * 36);
    const expected = (F_per_m / (gamma * omega_0)) / A_off_exp;
    expect(result.ratio).toBeCloseTo(expected, 4);
    // Resonant amplitude should be much larger than off-resonance
    expect(result.ratio).toBeGreaterThan(1);
  });

  it("finalAnswerStepId value: ratio", () => {
    expect(result.ratio).toBeGreaterThan(1);
  });
});
