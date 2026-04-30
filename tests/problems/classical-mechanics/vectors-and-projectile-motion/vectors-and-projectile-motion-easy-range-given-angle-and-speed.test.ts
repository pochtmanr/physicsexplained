import { describe, it, expect } from "vitest";
import {
  inputs,
  solve,
} from "@/lib/problems/classical-mechanics/vectors-and-projectile-motion/vectors-and-projectile-motion-easy-range-given-angle-and-speed";
import { G_EARTH, range, timeOfFlight } from "@/lib/physics/projectile";

describe("easy — range given angle and speed", () => {
  const result = solve();

  const v_0   = inputs.v_0.value;
  const theta = inputs.theta.value;
  const g     = inputs.g.value;

  it("inputs are sane (v_0=20, theta=π/6, g≈9.807)", () => {
    expect(v_0).toBe(20);
    expect(theta).toBeCloseTo(Math.PI / 6, 10);
    expect(g).toBe(G_EARTH);
  });

  it("vx = v_0 * cos(theta)", () => {
    expect(result.vx).toBeCloseTo(v_0 * Math.cos(theta), 10);
  });

  it("vy = v_0 * sin(theta)", () => {
    expect(result.vy).toBeCloseTo(v_0 * Math.sin(theta), 10);
  });

  it("t_flight = 2*v_0*sin(theta)/g", () => {
    expect(result.t_flight).toBeCloseTo(timeOfFlight(v_0, theta, g), 10);
  });

  it("R = v_0^2 * sin(2*theta) / g", () => {
    expect(result.R).toBeCloseTo(range(v_0, theta, g), 10);
  });

  it("range matches manual formula", () => {
    const expected = (v_0 * v_0 * Math.sin(2 * theta)) / g;
    expect(result.R).toBeCloseTo(expected, 6);
  });

  it("vx^2 + vy^2 = v_0^2  (Pythagoras)", () => {
    expect(result.vx ** 2 + result.vy ** 2).toBeCloseTo(v_0 * v_0, 10);
  });

  it("all outputs are finite positive numbers", () => {
    for (const [, v] of Object.entries(result)) {
      expect(isFinite(v)).toBe(true);
      expect(v).toBeGreaterThan(0);
    }
  });
});
