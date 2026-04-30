import { describe, it, expect } from "vitest";
import {
  inputs,
  solve,
} from "@/lib/problems/classical-mechanics/friction-and-drag/friction-and-drag-medium-acceleration-on-rough-ramp";

describe("friction-and-drag-medium-acceleration-on-rough-ramp", () => {
  const result = solve();

  it("inputs have expected canonical values", () => {
    expect(inputs.m.value).toBe(5);
    expect(inputs.theta.value).toBeCloseTo(Math.PI / 6, 6);
    expect(inputs.mu_k.value).toBe(0.25);
    expect(inputs.g.value).toBeCloseTo(9.80665, 4);
  });

  it("step 1: F_N = m * g * cos(theta)", () => {
    // 5 * 9.80665 * cos(π/6) = 5 * 9.80665 * 0.866025 = 42.4640
    expect(result.F_N).toBeCloseTo(42.4640, 4);
  });

  it("step 2: F_friction = mu_k * F_N", () => {
    // 0.25 * 42.4640 = 10.6160
    expect(result.F_friction).toBeCloseTo(10.6160, 4);
  });

  it("step 3: F_net = m * g * sin(theta) - F_friction", () => {
    // 5 * 9.80665 * 0.5 - 10.6160 = 24.5166 - 10.6160 = 13.9006
    expect(result.F_net).toBeCloseTo(13.9006, 4);
  });

  it("step 4: a = F_net / m", () => {
    // 13.9006 / 5 = 2.7801
    expect(result.a).toBeCloseTo(2.7801, 4);
  });

  it("cross-check: a_slide matches a from Newton", () => {
    expect(result.a_slide).toBeCloseTo(result.a, 6);
  });

  it("finalAnswerStepId value: a", () => {
    expect(result.a).toBeCloseTo(2.7801, 4);
  });
});
