import { describe, it, expect } from "vitest";
import {
  inputs,
  solve,
} from "@/lib/problems/classical-mechanics/friction-and-drag/friction-and-drag-challenge-stopping-distance-on-rough-floor";

describe("friction-and-drag-challenge-stopping-distance-on-rough-floor", () => {
  const result = solve();

  it("inputs have expected canonical values", () => {
    expect(inputs.v_0.value).toBe(20);
    expect(inputs.mu_k.value).toBe(0.5);
    expect(inputs.g.value).toBeCloseTo(9.80665, 4);
  });

  it("step 1: a_decel = mu_k * g", () => {
    // 0.5 * 9.80665 = 4.9033
    expect(result.a_decel).toBeCloseTo(4.9033, 4);
  });

  it("step 2: t_stop = v_0 / a_decel", () => {
    // 20 / 4.9033 = 4.0789
    expect(result.t_stop).toBeCloseTo(4.0789, 4);
  });

  it("step 3: d_stop = v_0² / (2 * a_decel)", () => {
    // 400 / (2 * 4.9033) = 40.7886
    expect(result.d_stop).toBeCloseTo(40.7886, 4);
  });

  it("finalAnswerStepId value: d_stop", () => {
    expect(result.d_stop).toBeCloseTo(40.7886, 4);
  });
});
