import { describe, it, expect } from "vitest";
import {
  inputs,
  solve,
} from "@/lib/problems/classical-mechanics/motion-in-a-straight-line/motion-in-a-straight-line-easy-distance-from-velocity-time";

describe("motion-in-a-straight-line-easy-distance-from-velocity-time", () => {
  const result = solve();

  it("inputs have expected canonical values", () => {
    expect(inputs.v.value).toBe(25);
    expect(inputs.t.value).toBe(8);
  });

  it("step: d = v * t", () => {
    // 25 * 8 = 200
    expect(result.d).toBeCloseTo(200.0, 4);
  });

  it("finalAnswerStepId value: d", () => {
    expect(result.d).toBeCloseTo(200.0, 4);
  });
});
