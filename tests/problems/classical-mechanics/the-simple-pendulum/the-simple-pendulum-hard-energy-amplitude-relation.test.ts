import { describe, it, expect } from "vitest";
import {
  inputs,
  solve,
} from "@/lib/problems/classical-mechanics/the-simple-pendulum/the-simple-pendulum-hard-energy-amplitude-relation";

describe("the-simple-pendulum-hard-energy-amplitude-relation", () => {
  const result = solve();

  it("inputs have expected canonical values", () => {
    expect(inputs.m.value).toBe(0.5);
    expect(inputs.L.value).toBe(0.8);
    expect(inputs.g.value).toBe(9.80665);
    expect(inputs.theta_0.value).toBe(0.15);
  });

  it("step 1: h = L*(1 - cos(theta_0))", () => {
    // 0.8 * (1 - cos(0.15)) = 0.00898314...
    expect(result.h).toBeCloseTo(0.0090, 4);
  });

  it("step 2: PE_max = m * g * h", () => {
    // 0.5 * 9.80665 * 0.00898314 = 0.04404724...
    expect(result.PE_max).toBeCloseTo(0.0440, 4);
  });

  it("step 3: KE_max = PE_max (energy conservation)", () => {
    expect(result.KE_max).toBeCloseTo(result.PE_max, 6);
  });

  it("step 4: v_max = sqrt(2 * KE_max / m)", () => {
    // sqrt(2 * 0.04404724 / 0.5) = 0.41974870...
    expect(result.v_max).toBeCloseTo(0.4197, 4);
  });

  it("period T (small-angle reference)", () => {
    // 2*PI*sqrt(0.8/9.80665) = 1.79458703...
    expect(result.T).toBeCloseTo(1.7946, 4);
  });

  it("finalAnswerStepId value: v_max", () => {
    expect(result.v_max).toBeCloseTo(0.4197, 4);
  });
});
