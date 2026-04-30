import { describe, it, expect } from "vitest";
import {
  inputs,
  solve,
} from "@/lib/problems/classical-mechanics/motion-in-a-straight-line/motion-in-a-straight-line-hard-stopping-distance-with-reaction-time";

const G = 9.80665;

describe("motion-in-a-straight-line-hard-stopping-distance-with-reaction-time", () => {
  const result = solve();

  it("inputs have expected canonical values", () => {
    expect(inputs.v_0.value).toBe(30);
    expect(inputs.t_r.value).toBe(0.8);
    expect(inputs.a_brake.value).toBe(6);
  });

  it("step: d_react = v_0 * t_r", () => {
    // 30 * 0.8 = 24
    expect(result.d_react).toBeCloseTo(24.0, 4);
  });

  it("step: t_brake = v_0 / a_brake", () => {
    // 30 / 6 = 5
    expect(result.t_brake).toBeCloseTo(5.0, 4);
  });

  it("step: d_brake = v_0² / (2 * a_brake)", () => {
    // 30² / (2*6) = 900/12 = 75
    expect(result.d_brake).toBeCloseTo(75.0, 4);
  });

  it("step: d_total = d_react + d_brake", () => {
    // 24 + 75 = 99
    expect(result.d_total).toBeCloseTo(99.0, 4);
  });

  it("mu is consistent with a_brake / g", () => {
    expect(result.mu).toBeCloseTo(6 / G, 6);
  });

  it("finalAnswerStepId value: d_total", () => {
    expect(result.d_total).toBeCloseTo(99.0, 4);
  });
});
