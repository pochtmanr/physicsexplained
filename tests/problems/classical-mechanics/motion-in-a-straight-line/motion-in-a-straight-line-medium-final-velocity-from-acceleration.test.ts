import { describe, it, expect } from "vitest";
import {
  inputs,
  solve,
} from "@/lib/problems/classical-mechanics/motion-in-a-straight-line/motion-in-a-straight-line-medium-final-velocity-from-acceleration";

describe("motion-in-a-straight-line-medium-final-velocity-from-acceleration", () => {
  const result = solve();

  it("inputs have expected canonical values", () => {
    expect(inputs.v_0.value).toBe(5);
    expect(inputs.a.value).toBe(2);
    expect(inputs.t.value).toBe(12);
  });

  it("step: v_f = v_0 + a * t", () => {
    // 5 + 2*12 = 29
    expect(result.v_f).toBeCloseTo(29.0, 4);
  });

  it("step: d = v_0 * t + 0.5 * a * t^2", () => {
    // 5*12 + 0.5*2*144 = 60 + 144 = 204
    expect(result.d).toBeCloseTo(204.0, 4);
  });

  it("accel_check equals a input", () => {
    expect(result.accel_check).toBeCloseTo(2.0, 4);
  });

  it("finalAnswerStepId value: v_f", () => {
    expect(result.v_f).toBeCloseTo(29.0, 4);
  });
});
