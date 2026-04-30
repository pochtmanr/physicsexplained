import { describe, it, expect } from "vitest";
import {
  inputs,
  solve,
} from "@/lib/problems/classical-mechanics/friction-and-drag/friction-and-drag-exam-terminal-velocity-quadratic-drag";

describe("friction-and-drag-exam-terminal-velocity-quadratic-drag", () => {
  const result = solve();

  it("inputs have expected canonical values", () => {
    expect(inputs.m.value).toBe(75);
    expect(inputs.rho.value).toBe(1.225);
    expect(inputs.C_d.value).toBe(1.0);
    expect(inputs.A.value).toBe(0.7);
    expect(inputs.g.value).toBeCloseTo(9.80665, 4);
  });

  it("step 1: k = 0.5 * rho * C_d * A", () => {
    // 0.5 * 1.225 * 1.0 * 0.7 = 0.4288
    expect(result.k).toBeCloseTo(0.4288, 4);
  });

  it("step 2: F_grav = m * g", () => {
    // 75 * 9.80665 = 735.4988
    expect(result.F_grav).toBeCloseTo(735.4988, 4);
  });

  it("step 3: v_t = sqrt(F_grav / k)", () => {
    // sqrt(735.4988 / 0.4288) = sqrt(1714.97...) = 41.4180
    expect(result.v_t).toBeCloseTo(41.4180, 4);
  });

  it("finalAnswerStepId value: v_t", () => {
    expect(result.v_t).toBeCloseTo(41.4180, 4);
  });
});
