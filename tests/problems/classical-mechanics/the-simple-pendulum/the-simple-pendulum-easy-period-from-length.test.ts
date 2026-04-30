import { describe, it, expect } from "vitest";
import {
  inputs,
  solve,
} from "@/lib/problems/classical-mechanics/the-simple-pendulum/the-simple-pendulum-easy-period-from-length";

describe("the-simple-pendulum-easy-period-from-length", () => {
  const result = solve();

  it("inputs have expected canonical values", () => {
    expect(inputs.L.value).toBe(1.2);
    expect(inputs.g.value).toBe(9.80665);
  });

  it("step 1: omega = sqrt(g / L)", () => {
    // sqrt(9.80665 / 1.2) = 2.85870746...
    expect(result.omega).toBeCloseTo(2.8587, 4);
  });

  it("step 2: T = 2 * PI / omega", () => {
    // 2 * PI * sqrt(1.2 / 9.80665) = 2.19791126...
    expect(result.T).toBeCloseTo(2.1979, 4);
  });

  it("finalAnswerStepId value: T", () => {
    expect(result.T).toBeCloseTo(2.1979, 4);
  });
});
