import { describe, it, expect } from "vitest";
import {
  inputs,
  solve,
} from "@/lib/problems/classical-mechanics/oscillators-everywhere/oscillators-everywhere-medium-energy-of-shm";

describe("oscillators-everywhere-medium-energy-of-shm", () => {
  const result = solve();
  const k = 80;
  const A = 0.15;
  const m = 2.0;

  it("inputs have expected canonical values", () => {
    expect(inputs.k.value).toBe(80);
    expect(inputs.A.value).toBe(0.15);
    expect(inputs.m.value).toBe(2.0);
  });

  it("step: E = (1/2)*k*A^2", () => {
    // 0.5 * 80 * 0.15^2 = 0.5 * 80 * 0.0225 = 0.9
    expect(result.E).toBeCloseTo(0.9, 6);
  });

  it("step: v_max = sqrt(2*E/m)", () => {
    // sqrt(2 * 0.9 / 2) = sqrt(0.9) ≈ 0.9487
    expect(result.v_max).toBeCloseTo(Math.sqrt((2 * 0.5 * k * A * A) / m), 6);
  });

  it("step: omega = sqrt(k/m)", () => {
    // sqrt(80/2) = sqrt(40) ≈ 6.3246
    expect(result.omega).toBeCloseTo(Math.sqrt(k / m), 6);
  });

  it("energy consistency: E = (1/2)*m*v_max^2", () => {
    const E_kinetic = 0.5 * m * result.v_max * result.v_max;
    expect(E_kinetic).toBeCloseTo(result.E, 6);
  });

  it("finalAnswerStepId value: E", () => {
    expect(result.E).toBeCloseTo(0.9, 6);
  });
});
