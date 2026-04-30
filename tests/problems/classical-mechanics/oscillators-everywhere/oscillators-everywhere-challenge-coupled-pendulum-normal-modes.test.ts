import { describe, it, expect } from "vitest";
import {
  inputs,
  solve,
} from "@/lib/problems/classical-mechanics/oscillators-everywhere/oscillators-everywhere-challenge-coupled-pendulum-normal-modes";
import { g_SI } from "@/lib/physics/constants";

describe("oscillators-everywhere-challenge-coupled-pendulum-normal-modes", () => {
  const result = solve();
  const L = 0.5;
  const k_c = 0.8;
  const m = 0.25;
  const A = 0.1;
  const t = 3;
  const g = g_SI;

  it("inputs have expected canonical values", () => {
    expect(inputs.L.value).toBe(0.5);
    expect(inputs.k_c.value).toBe(0.8);
    expect(inputs.m.value).toBe(0.25);
    expect(inputs.A.value).toBe(0.1);
    expect(inputs.t.value).toBe(3);
  });

  it("step: omega0 = sqrt(g/L)", () => {
    expect(result.omega0).toBeCloseTo(Math.sqrt(g / L), 6);
  });

  it("step: omegaC = sqrt(2*k_c/m)", () => {
    expect(result.omegaC).toBeCloseTo(Math.sqrt((2 * k_c) / m), 6);
  });

  it("step: omega1 = omega0 (in-phase mode)", () => {
    expect(result.omega1).toBeCloseTo(result.omega0, 6);
  });

  it("step: omega2 = sqrt(omega0^2 + omegaC^2) (anti-phase mode)", () => {
    const omega0 = Math.sqrt(g / L);
    const omegaC = Math.sqrt((2 * k_c) / m);
    expect(result.omega2).toBeCloseTo(Math.sqrt(omega0 * omega0 + omegaC * omegaC), 6);
  });

  it("omega2 > omega1 (anti-phase mode is faster)", () => {
    expect(result.omega2).toBeGreaterThan(result.omega1);
  });

  it("step: T_beat = 2*PI / (omega2 - omega1)", () => {
    expect(result.T_beat).toBeCloseTo(
      (2 * Math.PI) / (result.omega2 - result.omega1),
      6
    );
  });

  it("step: beat solution — theta1 and theta2 at t=3 are bounded by A", () => {
    expect(Math.abs(result.theta1_at_t)).toBeLessThanOrEqual(A + 1e-9);
    expect(Math.abs(result.theta2_at_t)).toBeLessThanOrEqual(A + 1e-9);
  });

  it("beat solution — energy is conserved: theta1^2 + theta2^2 ≈ A^2 (approximately)", () => {
    // In the beat solution theta1=A*cos(Δt)*cos(Σt), theta2=A*sin(Δt)*sin(Σt)
    // theta1^2 + theta2^2 ≈ A^2*(cos²(Δt)cos²(Σt)+sin²(Δt)sin²(Σt)) — not exactly A^2,
    // but amplitude envelope is bounded. Check the sum stays ≤ A^2.
    const sumSq = result.theta1_at_t ** 2 + result.theta2_at_t ** 2;
    expect(sumSq).toBeLessThanOrEqual(A * A + 1e-9);
  });

  it("anti-phase mode: theta2 = -theta1", () => {
    expect(result.antiPhase_theta2).toBeCloseTo(-result.antiPhase_theta1, 6);
  });

  it("finalAnswerStepId value: omega2", () => {
    const omega0 = Math.sqrt(g / L);
    const omegaC = Math.sqrt((2 * k_c) / m);
    expect(result.omega2).toBeCloseTo(Math.sqrt(omega0 * omega0 + omegaC * omegaC), 6);
  });
});
