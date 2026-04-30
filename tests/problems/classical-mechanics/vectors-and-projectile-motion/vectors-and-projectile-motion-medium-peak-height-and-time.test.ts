import { describe, it, expect } from "vitest";
import {
  inputs,
  solve,
} from "@/lib/problems/classical-mechanics/vectors-and-projectile-motion/vectors-and-projectile-motion-medium-peak-height-and-time";
import { G_EARTH, peakHeight, timeToPeak } from "@/lib/physics/projectile";

describe("medium — peak height and time to peak", () => {
  const result = solve();

  const v_0   = inputs.v_0.value;
  const theta = inputs.theta.value;
  const g     = inputs.g.value;

  it("inputs are sane (v_0=35, theta≈50°, g=G_EARTH)", () => {
    expect(v_0).toBe(35);
    expect(theta).toBeCloseTo((50 * Math.PI) / 180, 10);
    expect(g).toBe(G_EARTH);
  });

  it("vy = v_0 * sin(theta)", () => {
    expect(result.vy).toBeCloseTo(v_0 * Math.sin(theta), 10);
  });

  it("t_peak = v_0 * sin(theta) / g", () => {
    expect(result.t_peak).toBeCloseTo(timeToPeak(v_0, theta, g), 10);
  });

  it("H = (v_0 * sin(theta))^2 / (2 * g)", () => {
    expect(result.H).toBeCloseTo(peakHeight(v_0, theta, g), 10);
  });

  it("H = vy * t_peak / 2 (area-under-v-t-triangle)", () => {
    // At peak, v_y = 0, starts at vy — average vertical velocity = vy/2
    expect(result.H).toBeCloseTo((result.vy * result.t_peak) / 2, 10);
  });

  it("t_peak = vy / g", () => {
    expect(result.t_peak).toBeCloseTo(result.vy / g, 10);
  });

  it("all outputs are finite positive numbers", () => {
    for (const [, v] of Object.entries(result)) {
      expect(isFinite(v)).toBe(true);
      expect(v).toBeGreaterThan(0);
    }
  });
});
