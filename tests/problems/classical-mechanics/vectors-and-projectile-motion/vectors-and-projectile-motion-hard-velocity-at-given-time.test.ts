import { describe, it, expect } from "vitest";
import {
  inputs,
  solve,
} from "@/lib/problems/classical-mechanics/vectors-and-projectile-motion/vectors-and-projectile-motion-hard-velocity-at-given-time";
import { G_EARTH, velocity, mag, angleOf } from "@/lib/physics/projectile";

describe("hard — velocity vector at a given time", () => {
  const result = solve();

  const v_0   = inputs.v_0.value;
  const theta = inputs.theta.value;
  const t     = inputs.t.value;
  const g     = inputs.g.value;

  it("inputs are sane (v_0=40, theta≈60°, t=2, g=G_EARTH)", () => {
    expect(v_0).toBe(40);
    expect(theta).toBeCloseTo((60 * Math.PI) / 180, 10);
    expect(t).toBe(2);
    expect(g).toBe(G_EARTH);
  });

  it("vx = v_0 * cos(theta) (horizontal, constant)", () => {
    expect(result.vx).toBeCloseTo(v_0 * Math.cos(theta), 10);
  });

  it("vy_t = v_0 * sin(theta) - g * t", () => {
    expect(result.vy_t).toBeCloseTo(v_0 * Math.sin(theta) - g * t, 10);
  });

  it("speed_t = sqrt(vx^2 + vy_t^2)", () => {
    const vel = velocity(t, v_0, theta, g);
    expect(result.speed_t).toBeCloseTo(mag(vel), 10);
  });

  it("angle_t = atan2(vy_t, vx)", () => {
    const vel = velocity(t, v_0, theta, g);
    expect(result.angle_t).toBeCloseTo(angleOf(vel), 10);
  });

  it("speed is less than launch speed (energy conservation check: no air drag)", () => {
    // At t=2s the ball is still rising (60° launch, peak at ~v_0 sin60/g ≈3.53s)
    // so speed should be less than v_0 due to partial loss of v_y
    expect(result.speed_t).toBeLessThan(v_0);
    expect(result.speed_t).toBeGreaterThan(0);
  });

  it("vy_t is positive at t=2 (still ascending at 60° launch)", () => {
    // Peak time ≈ 40*sin(60°)/9.807 ≈ 3.53 s, so at t=2 s still going up
    expect(result.vy_t).toBeGreaterThan(0);
  });

  it("angle_t > 0 (velocity still pointing above horizontal)", () => {
    expect(result.angle_t).toBeGreaterThan(0);
  });

  it("all outputs are finite", () => {
    for (const [, v] of Object.entries(result)) {
      expect(isFinite(v)).toBe(true);
    }
  });
});
