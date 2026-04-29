import { describe, expect, it } from "vitest";
import {
  galileanBoost,
  galileanBoost4,
  galileanBoostCompose,
  galileanBoostInverse,
  galileanVelocityAdd,
  galileanWaveSpeed,
  galileanAccelerationTransform,
  boatOnRiverShoreSpeed,
} from "@/lib/physics/relativity/galilean";
import { SPEED_OF_LIGHT } from "@/lib/physics/constants";

describe("galileanBoost", () => {
  it("is the identity at v = 0", () => {
    const out = galileanBoost(1.5, 7.0, 0);
    expect(out.t).toBeCloseTo(1.5, 12);
    expect(out.x).toBeCloseTo(7.0, 12);
  });

  it("leaves t unchanged for any v (Newtonian absolute time)", () => {
    const out = galileanBoost(2.5, 0, 100);
    expect(out.t).toBe(2.5);
  });

  it("subtracts v·t from x — a body at rest in the moving frame retreats backward in the lab frame", () => {
    // body at x' = 0 in moving frame is at x = v t in lab frame; here we
    // are doing the inverse direction: lab event (t, x) seen from a frame
    // moving at +v has x' = x − v t. Take t = 1 s, x = 0 m, v = 5 m/s:
    // x' = -5.
    const out = galileanBoost(1.0, 0.0, 5.0);
    expect(out.x).toBeCloseTo(-5.0, 12);
  });
});

describe("galileanBoost4", () => {
  it("preserves ct exactly (time is absolute)", () => {
    const out = galileanBoost4([42.0, 7.0, 1.0, -3.0], 100, SPEED_OF_LIGHT);
    expect(out[0]).toBe(42.0);
  });

  it("shifts x by −v t for a 4-event", () => {
    // ct = c · 1 ⇒ t = 1 s; v = 10 m/s, x = 100 m ⇒ x' = 90 m.
    const ct = SPEED_OF_LIGHT * 1.0;
    const out = galileanBoost4([ct, 100, 0, 0], 10, SPEED_OF_LIGHT);
    expect(out[1]).toBeCloseTo(90, 8);
  });

  it("leaves y and z untouched", () => {
    const out = galileanBoost4([1.0, 0, 7.0, -11.0], 100, SPEED_OF_LIGHT);
    expect(out[2]).toBe(7.0);
    expect(out[3]).toBe(-11.0);
  });
});

describe("galileanVelocityAdd", () => {
  it("adds linearly: 5 + 3 = 8", () => {
    expect(galileanVelocityAdd(5, 3)).toBe(8);
  });

  it("supports the upstream-boat case (5 m/s engine, −3 m/s current)", () => {
    expect(boatOnRiverShoreSpeed(5, -3)).toBe(2);
  });

  it("is commutative", () => {
    expect(galileanVelocityAdd(11, 7)).toBe(galileanVelocityAdd(7, 11));
  });
});

describe("galileanWaveSpeed (the prediction that fails for light)", () => {
  it("returns c − v: a frame moving alongside the wave sees it slower by v", () => {
    expect(galileanWaveSpeed(SPEED_OF_LIGHT, 1e6)).toBeCloseTo(
      SPEED_OF_LIGHT - 1e6,
      6,
    );
  });

  it("would predict a stationary light wave at v = c — the very paradox Einstein refused", () => {
    const speed = galileanWaveSpeed(SPEED_OF_LIGHT, SPEED_OF_LIGHT);
    expect(speed).toBe(0);
  });

  it("returns c at v = 0 (lab frame agrees with itself)", () => {
    expect(galileanWaveSpeed(SPEED_OF_LIGHT, 0)).toBe(SPEED_OF_LIGHT);
  });
});

describe("galileanBoostInverse / galileanBoostCompose", () => {
  it("forward boost composed with inverse boost is the identity", () => {
    const t = 2.5;
    const x = 100;
    const v = 17.0;
    const fwd = galileanBoost(t, x, v);
    const back = galileanBoostInverse(fwd.t, fwd.x, v);
    expect(back.t).toBeCloseTo(t, 12);
    expect(back.x).toBeCloseTo(x, 12);
  });

  it("composing two Galilean boosts = adding their velocities", () => {
    expect(galileanBoostCompose(3, 5)).toBe(8);
    expect(galileanBoostCompose(-3, 5)).toBe(2);
  });
});

describe("galileanAccelerationTransform", () => {
  it("is the identity — accelerations are Galilean-invariant", () => {
    expect(galileanAccelerationTransform(9.81)).toBe(9.81);
    expect(galileanAccelerationTransform(-3.5)).toBe(-3.5);
    expect(galileanAccelerationTransform(0)).toBe(0);
  });
});
