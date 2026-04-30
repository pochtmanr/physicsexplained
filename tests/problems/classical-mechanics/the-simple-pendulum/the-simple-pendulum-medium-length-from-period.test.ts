import { describe, it, expect } from "vitest";
import {
  inputs,
  solve,
} from "@/lib/problems/classical-mechanics/the-simple-pendulum/the-simple-pendulum-medium-length-from-period";

describe("the-simple-pendulum-medium-length-from-period", () => {
  const result = solve();

  it("inputs have expected canonical values", () => {
    expect(inputs.T.value).toBe(3.0);
    expect(inputs.g.value).toBe(9.80665);
  });

  it("step 1: tau = T / (2 * PI)", () => {
    // 3.0 / (2 * PI) = 0.47746483...
    expect(result.tau).toBeCloseTo(0.4775, 4);
  });

  it("step 2: L = g * tau²", () => {
    // 9.80665 * (3/(2*PI))² = 2.23564812...
    expect(result.L).toBeCloseTo(2.2356, 4);
  });

  it("verification: T_check round-trips back to T = 3.0 s", () => {
    expect(result.T_check).toBeCloseTo(3.0, 4);
  });

  it("finalAnswerStepId value: L", () => {
    expect(result.L).toBeCloseTo(2.2356, 4);
  });
});
