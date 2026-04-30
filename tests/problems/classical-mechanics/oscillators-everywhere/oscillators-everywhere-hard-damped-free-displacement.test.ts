import { describe, it, expect } from "vitest";
import {
  inputs,
  solve,
} from "@/lib/problems/classical-mechanics/oscillators-everywhere/oscillators-everywhere-hard-damped-free-displacement";

describe("oscillators-everywhere-hard-damped-free-displacement", () => {
  const result = solve();
  const k = 25;
  const m = 1;
  const b = 2;
  const x0 = 0.3;
  const t = 1.5;

  it("inputs have expected canonical values", () => {
    expect(inputs.k.value).toBe(25);
    expect(inputs.m.value).toBe(1);
    expect(inputs.b.value).toBe(2);
    expect(inputs.x0.value).toBe(0.3);
    expect(inputs.t.value).toBe(1.5);
  });

  it("step: omega0 = sqrt(k/m)", () => {
    // sqrt(25/1) = 5
    expect(result.omega0).toBeCloseTo(5.0, 6);
  });

  it("step: gamma = b/m", () => {
    // 2/1 = 2
    expect(result.gamma).toBeCloseTo(2.0, 6);
  });

  it("step: system is underdamped (omega0^2 > gamma^2/4)", () => {
    // 25 > 1 — true
    expect(result.omega0 * result.omega0).toBeGreaterThan(
      (result.gamma * result.gamma) / 4
    );
  });

  it("step: omegaD = sqrt(omega0^2 - gamma^2/4)", () => {
    // sqrt(25 - 1) = sqrt(24) ≈ 4.8990
    expect(result.omegaD).toBeCloseTo(Math.sqrt(25 - 1), 6);
  });

  it("step: x_at_t is computed by dampedFree", () => {
    const omega0 = 5;
    const gamma = 2;
    const omegaD = Math.sqrt(25 - 1);
    const expected =
      x0 *
      Math.exp((-gamma * t) / 2) *
      (Math.cos(omegaD * t) + (gamma / (2 * omegaD)) * Math.sin(omegaD * t));
    expect(result.x_at_t).toBeCloseTo(expected, 6);
  });

  it("step: tau = 2/gamma", () => {
    // 2/2 = 1
    expect(result.tau).toBeCloseTo(1.0, 6);
  });

  it("x_at_t amplitude < x0 (energy has decayed)", () => {
    expect(Math.abs(result.x_at_t)).toBeLessThan(x0);
  });

  it("finalAnswerStepId value: x_at_t", () => {
    const omega0 = 5;
    const gamma = 2;
    const omegaD = Math.sqrt(24);
    const expected =
      x0 *
      Math.exp((-gamma * t) / 2) *
      (Math.cos(omegaD * t) + (gamma / (2 * omegaD)) * Math.sin(omegaD * t));
    expect(result.x_at_t).toBeCloseTo(expected, 6);
  });
});
