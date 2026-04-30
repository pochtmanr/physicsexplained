import { describe, it, expect } from "vitest";
import {
  inputs,
  solve,
} from "@/lib/problems/classical-mechanics/motion-in-a-straight-line/motion-in-a-straight-line-exam-overtaking-with-acceleration";

describe("motion-in-a-straight-line-exam-overtaking-with-acceleration", () => {
  const result = solve();

  it("inputs have expected canonical values", () => {
    expect(inputs.d_0.value).toBe(50);
    expect(inputs.v_B.value).toBe(15);
    expect(inputs.a_A.value).toBe(3);
  });

  it("step: discriminant = v_B² + 2*a_A*d_0", () => {
    // 15² + 2*3*50 = 225 + 300 = 525
    expect(result.discriminant).toBeCloseTo(525.0, 4);
  });

  it("step: t_equal = (v_B + sqrt(discriminant)) / a_A", () => {
    // (15 + sqrt(525)) / 3 = (15 + 22.9129) / 3 ≈ 12.9710
    const expected = (15 + Math.sqrt(525)) / 3;
    expect(result.t_equal).toBeCloseTo(expected, 4);
  });

  it("step: x_overtake = 0.5 * a_A * t_equal²", () => {
    const t = (15 + Math.sqrt(525)) / 3;
    const expected = 0.5 * 3 * t * t;
    expect(result.x_overtake).toBeCloseTo(expected, 4);
  });

  it("step: v_A_at_overtake = a_A * t_equal", () => {
    const t = (15 + Math.sqrt(525)) / 3;
    const expected = 3 * t;
    expect(result.v_A_at_overtake).toBeCloseTo(expected, 4);
  });

  it("cross-check: x_B_at_t matches x_overtake", () => {
    // x_B = d_0 + v_B * t_equal = x_overtake
    expect(result.x_B_at_t).toBeCloseTo(result.x_overtake, 4);
  });

  it("finalAnswerStepId value: v_A_at_overtake", () => {
    const t = (15 + Math.sqrt(525)) / 3;
    expect(result.v_A_at_overtake).toBeCloseTo(3 * t, 4);
  });
});
