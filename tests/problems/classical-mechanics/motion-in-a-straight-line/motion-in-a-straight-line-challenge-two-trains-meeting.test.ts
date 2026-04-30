import { describe, it, expect } from "vitest";
import {
  inputs,
  solve,
} from "@/lib/problems/classical-mechanics/motion-in-a-straight-line/motion-in-a-straight-line-challenge-two-trains-meeting";

describe("motion-in-a-straight-line-challenge-two-trains-meeting", () => {
  const result = solve();

  it("inputs have expected canonical values", () => {
    expect(inputs.v_A.value).toBe(20);
    expect(inputs.v_B.value).toBe(10);
    expect(inputs.L.value).toBe(1200);
  });

  it("step: closing_speed = v_A + v_B", () => {
    // 20 + 10 = 30
    expect(result.closing_speed).toBeCloseTo(30.0, 4);
  });

  it("step: t_meet = L / closing_speed", () => {
    // 1200 / 30 = 40
    expect(result.t_meet).toBeCloseTo(40.0, 4);
  });

  it("step: x_meet = v_A * t_meet", () => {
    // 20 * 40 = 800
    expect(result.x_meet).toBeCloseTo(800.0, 4);
  });

  it("cross-check: x_A and x_B agree at t_meet", () => {
    // x_A_check = 800, x_B_check = 1200 - 10*40 = 800
    expect(result.x_A_check).toBeCloseTo(800.0, 4);
    expect(result.x_B_check).toBeCloseTo(800.0, 4);
  });

  it("finalAnswerStepId value: x_meet", () => {
    expect(result.x_meet).toBeCloseTo(800.0, 4);
  });
});
