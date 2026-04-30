import { describe, it, expect } from "vitest";
import {
  inputs,
  solve,
} from "@/lib/problems/classical-mechanics/friction-and-drag/friction-and-drag-hard-terminal-velocity-stokes-sphere";

describe("friction-and-drag-hard-terminal-velocity-stokes-sphere", () => {
  const result = solve();

  it("inputs have expected canonical values", () => {
    expect(inputs.r.value).toBe(0.003);
    expect(inputs.eta.value).toBe(0.001);
    expect(inputs.m.value).toBe(1.5e-4);
    expect(inputs.g.value).toBeCloseTo(9.80665, 4);
  });

  it("step 1: b = 6 * pi * eta * r (Stokes drag coefficient)", () => {
    // 6 * π * 0.001 * 0.003 = 5.6549e-5
    expect(result.b).toBeCloseTo(5.6549e-5, 8);
  });

  it("step 2: v_t = m * g / b (linear-drag terminal velocity)", () => {
    // 1.5e-4 * 9.80665 / 5.6549e-5 = 26.0129
    expect(result.v_t).toBeCloseTo(26.0129, 4);
  });

  it("step 3: tau = m / b (exponential time constant)", () => {
    // 1.5e-4 / 5.6549e-5 = 2.6526
    expect(result.tau).toBeCloseTo(2.6526, 4);
  });

  it("finalAnswerStepId value: v_t", () => {
    expect(result.v_t).toBeCloseTo(26.0129, 4);
  });
});
