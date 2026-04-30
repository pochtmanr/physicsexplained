import { describe, it, expect } from "vitest";
import {
  inputs,
  solve,
} from "@/lib/problems/classical-mechanics/friction-and-drag/friction-and-drag-easy-friction-force-on-flat-surface";

describe("friction-and-drag-easy-friction-force-on-flat-surface", () => {
  const result = solve();

  it("inputs have expected canonical values", () => {
    expect(inputs.m.value).toBe(8);
    expect(inputs.mu_k.value).toBe(0.4);
    expect(inputs.g.value).toBeCloseTo(9.80665, 4);
  });

  it("step 1: F_N = m * g", () => {
    // 8 * 9.80665 = 78.4532
    expect(result.F_N).toBeCloseTo(78.4532, 4);
  });

  it("step 2: F_friction = mu_k * F_N", () => {
    // 0.4 * 78.4532 = 31.3813
    expect(result.F_friction).toBeCloseTo(31.3813, 4);
  });

  it("a_net: constant velocity means net acceleration is zero", () => {
    expect(result.a_net).toBeCloseTo(0, 6);
  });

  it("finalAnswerStepId value: F_friction", () => {
    expect(result.F_friction).toBeCloseTo(31.3813, 4);
  });
});
