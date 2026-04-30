import { describe, it, expect } from "vitest";
import {
  inputs,
  solve,
} from "@/lib/problems/classical-mechanics/oscillators-everywhere/oscillators-everywhere-exam-shm-position-velocity-acceleration";

describe("oscillators-everywhere-exam-shm-position-velocity-acceleration", () => {
  const result = solve();
  const A = 0.2;
  const omega = 4;
  const phi = Math.PI / 3;
  const m = 0.5;
  const t = 0.8;
  const k = m * omega * omega; // 0.5 * 16 = 8

  it("inputs have expected canonical values", () => {
    expect(inputs.A.value).toBe(0.2);
    expect(inputs.omega.value).toBe(4);
    expect(inputs.phi.value).toBeCloseTo(Math.PI / 3, 6);
    expect(inputs.m.value).toBe(0.5);
    expect(inputs.t.value).toBe(0.8);
  });

  it("derived: k = m * omega^2", () => {
    // 0.5 * 16 = 8
    expect(result.k).toBeCloseTo(8.0, 6);
  });

  it("step: x = A*cos(omega*t + phi)", () => {
    const expected = A * Math.cos(omega * t + phi);
    expect(result.x).toBeCloseTo(expected, 6);
  });

  it("step: v = -A*omega*sin(omega*t + phi)", () => {
    const expected = -A * omega * Math.sin(omega * t + phi);
    expect(result.v).toBeCloseTo(expected, 6);
  });

  it("step: a_accel = -A*omega^2*cos(omega*t + phi)", () => {
    const expected = -A * omega * omega * Math.cos(omega * t + phi);
    expect(result.a_accel).toBeCloseTo(expected, 6);
  });

  it("a_accel = -omega^2 * x (Newton's second law for SHM)", () => {
    expect(result.a_accel).toBeCloseTo(-omega * omega * result.x, 6);
  });

  it("step: KE = (1/2)*m*v^2", () => {
    const expected = 0.5 * m * result.v * result.v;
    expect(result.KE).toBeCloseTo(expected, 6);
  });

  it("step: PE = (1/2)*k*x^2", () => {
    const expected = 0.5 * k * result.x * result.x;
    expect(result.PE).toBeCloseTo(expected, 6);
  });

  it("step: E_total = (1/2)*k*A^2", () => {
    // 0.5 * 8 * 0.04 = 0.16
    expect(result.E_total).toBeCloseTo(0.16, 6);
  });

  it("energy conservation: KE + PE = E_total", () => {
    expect(result.check).toBeCloseTo(result.E_total, 6);
  });

  it("pendulum and damped lib cross-checks are consistent for phi=0 analogue", () => {
    // Both libraries should give same result for same params
    expect(result.x_phi0_check).toBeCloseTo(result.x_pendulum_check, 5);
  });

  it("finalAnswerStepId value: x", () => {
    const expected = A * Math.cos(omega * t + phi);
    expect(result.x).toBeCloseTo(expected, 6);
  });
});
