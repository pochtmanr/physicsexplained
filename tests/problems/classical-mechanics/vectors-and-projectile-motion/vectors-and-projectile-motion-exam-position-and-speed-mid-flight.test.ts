import { describe, it, expect } from "vitest";
import {
  inputs,
  solve,
} from "@/lib/problems/classical-mechanics/vectors-and-projectile-motion/vectors-and-projectile-motion-exam-position-and-speed-mid-flight";
import { G_EARTH, timeOfFlight, peakHeight, position, velocity, mag } from "@/lib/physics/projectile";

describe("exam — full state vector at mid-flight (the peak)", () => {
  const result = solve();

  const v_0   = inputs.v_0.value;
  const theta = inputs.theta.value;
  const g     = inputs.g.value;

  it("inputs are sane (v_0=45, theta≈37°, g=G_EARTH)", () => {
    expect(v_0).toBe(45);
    expect(theta).toBeCloseTo((37 * Math.PI) / 180, 10);
    expect(g).toBe(G_EARTH);
  });

  it("T = 2*v_0*sin(theta)/g", () => {
    expect(result.T).toBeCloseTo(timeOfFlight(v_0, theta, g), 10);
  });

  it("t_mid = T / 2", () => {
    expect(result.t_mid).toBeCloseTo(result.T / 2, 10);
  });

  it("x_mid = vx * t_mid", () => {
    const pos = position(result.t_mid, v_0, theta, g);
    expect(result.x_mid).toBeCloseTo(pos.x, 10);
  });

  it("y_mid = H (mid-flight is the peak)", () => {
    const H = peakHeight(v_0, theta, g);
    expect(result.y_mid).toBeCloseTo(H, 8);
  });

  it("y_mid ≈ H from solver", () => {
    expect(result.y_mid).toBeCloseTo(result.H, 8);
  });

  it("vy_mid ≈ 0 (vertical velocity vanishes at peak)", () => {
    expect(result.vy_mid).toBeCloseTo(0, 8);
  });

  it("speed_mid = vx (only horizontal component at peak)", () => {
    expect(result.speed_mid).toBeCloseTo(result.vx, 8);
  });

  it("speed_mid < v_0 (some v_y has been exchanged for height)", () => {
    expect(result.speed_mid).toBeLessThan(v_0);
    expect(result.speed_mid).toBeGreaterThan(0);
  });

  it("speed_mid matches mag(velocity at t_mid)", () => {
    const vel = velocity(result.t_mid, v_0, theta, g);
    expect(result.speed_mid).toBeCloseTo(mag(vel), 8);
  });

  it("vx^2 + vy0^2 = v_0^2 (Pythagoras at launch)", () => {
    expect(result.vx ** 2 + result.vy0 ** 2).toBeCloseTo(v_0 * v_0, 8);
  });

  it("all outputs are finite", () => {
    for (const [, v] of Object.entries(result)) {
      expect(isFinite(v)).toBe(true);
    }
  });
});
