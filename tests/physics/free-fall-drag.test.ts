import { describe, expect, it } from "vitest";
import {
  FEATHER_TAU,
  G,
  HAMMER_TAU,
  fallDistance,
  fallSpeed,
  fallTime,
  stepFall,
  stepFallToFloor,
  tauAtAir,
  terminalSpeed,
  timeToFloor,
} from "@/lib/physics/free-fall-drag";

const H = 2.2;

describe("free fall with linear drag", () => {
  it("reduces to ½·g·t² and g·t in vacuum", () => {
    expect(fallDistance(0.5, Infinity)).toBeCloseTo(0.5 * G * 0.25, 12);
    expect(fallSpeed(0.5, Infinity)).toBeCloseTo(G * 0.5, 12);
    expect(fallTime(H, Infinity)).toBeCloseTo(Math.sqrt((2 * H) / G), 12);
  });

  it("drops hammer and feather together when there is no air", () => {
    const hammer = fallTime(H, tauAtAir(HAMMER_TAU, 0));
    const feather = fallTime(H, tauAtAir(FEATHER_TAU, 0));
    expect(feather).toBe(hammer);
  });

  it("keeps the feather's original behaviour in normal air", () => {
    // Closed form used by the scene before the slider existed.
    const t = 1.2;
    const vt = G * FEATHER_TAU;
    const expected = vt * (t - FEATHER_TAU * (1 - Math.exp(-t / FEATHER_TAU)));
    expect(fallDistance(t, tauAtAir(FEATHER_TAU, 1))).toBeCloseTo(expected, 12);
  });

  it("makes the feather fall later as air density rises", () => {
    let previous = fallTime(H, tauAtAir(FEATHER_TAU, 0));
    for (let pct = 5; pct <= 100; pct += 5) {
      const time = fallTime(H, tauAtAir(FEATHER_TAU, pct / 100));
      expect(time).toBeGreaterThan(previous);
      previous = time;
    }
  });

  it("barely slows the hammer even in normal air", () => {
    const vacuum = fallTime(H, Infinity);
    const air = fallTime(H, tauAtAir(HAMMER_TAU, 1));
    expect(air).toBeGreaterThan(vacuum);
    expect(air / vacuum).toBeLessThan(1.01);
  });

  it("returns a fall time that actually covers the height", () => {
    for (const tau of [0.05, FEATHER_TAU, 1, HAMMER_TAU, 1e4]) {
      expect(fallDistance(fallTime(H, tau), tau)).toBeCloseTo(H, 6);
    }
  });

  it("is continuous where the small-x series takes over", () => {
    const tau = 1000;
    const below = fallDistance(0.999, tau); // x just under 1e-3
    const above = fallDistance(1.001, tau); // x just over 1e-3
    expect(above - below).toBeCloseTo(G * 1 * 0.002, 4);
  });

  it("approaches terminal speed and never exceeds it", () => {
    const tau = FEATHER_TAU;
    expect(fallSpeed(10 * tau, tau)).toBeCloseTo(terminalSpeed(tau), 3);
    expect(fallSpeed(0.3, tau)).toBeLessThan(terminalSpeed(tau));
  });
});

describe("stepping a fall frame by frame", () => {
  const REST = { x: 0, v: 0 };

  it("matches the closed form at constant drag, whatever the frame length", () => {
    for (const tau of [FEATHER_TAU, 1, HAMMER_TAU, 600, Infinity]) {
      for (const dt of [1 / 240, 1 / 60, 0.1]) {
        let state = REST;
        const steps = Math.round(0.6 / dt);
        for (let i = 0; i < steps; i++) state = stepFall(state, dt, tau);
        const t = steps * dt;
        expect(state.x).toBeCloseTo(fallDistance(t, tau), 9);
        expect(state.v).toBeCloseTo(fallSpeed(t, tau), 9);
      }
    }
  });

  it("carries position and speed across a change of drag", () => {
    // Fall in vacuum, then switch the air on: nothing jumps at the switch.
    const before = stepFall(REST, 0.3, Infinity);
    const justAfter = stepFall(before, 1e-9, FEATHER_TAU);
    expect(justAfter.x).toBeCloseTo(before.x, 6);
    expect(justAfter.v).toBeCloseTo(before.v, 6);
  });

  it("slows an object that is above the new terminal speed", () => {
    const fast = stepFall(REST, 0.4, Infinity);
    expect(fast.v).toBeGreaterThan(terminalSpeed(FEATHER_TAU));
    const later = stepFall(fast, 0.05, FEATHER_TAU);
    expect(later.v).toBeLessThan(fast.v);
    expect(later.v).toBeGreaterThan(terminalSpeed(FEATHER_TAU));
    expect(later.x).toBeGreaterThan(fast.x);
    // Long after the switch it has settled at the terminal speed.
    expect(stepFall(fast, 5, FEATHER_TAU).v).toBeCloseTo(terminalSpeed(FEATHER_TAU), 9);
  });

  it("speeds an object up again when the air is removed", () => {
    const slow = stepFall(REST, 1, FEATHER_TAU);
    const later = stepFall(slow, 0.1, Infinity);
    expect(later.v).toBeCloseTo(slow.v + G * 0.1, 12);
  });

  it("predicts the landing time from rest and from mid-fall", () => {
    for (const tau of [FEATHER_TAU, HAMMER_TAU, Infinity]) {
      expect(timeToFloor(REST, H, tau)).toBeCloseTo(fallTime(H, tau), 9);
      const mid = stepFall(REST, 0.2, tau);
      expect(0.2 + timeToFloor(mid, H, tau)).toBeCloseTo(fallTime(H, tau), 9);
    }
    expect(timeToFloor({ x: H, v: 3 }, H, FEATHER_TAU)).toBe(0);
  });

  it("finds the landing time from above terminal speed and when moving upward", () => {
    // Faster than the new terminal speed: decelerating all the way down.
    const fast = { x: 0.5, v: 8 };
    const tFast = timeToFloor(fast, H, FEATHER_TAU);
    expect(stepFall(fast, tFast, FEATHER_TAU).x).toBeCloseTo(H, 9);
    // Thrown upward: outside the scene's range, but the answer must still land.
    const up = { x: 0, v: -30 };
    const tUp = timeToFloor(up, H, 0.5);
    expect(stepFall(up, tUp, 0.5).x).toBeCloseTo(H, 6);
  });

  it("stops on the floor and reports when it touched down", () => {
    let state = REST;
    let elapsed = 0;
    let landedAt: number | null = null;
    const dt = 1 / 60;
    while (landedAt === null && elapsed < 5) {
      const result = stepFallToFloor(state, dt, FEATHER_TAU, H);
      if (result.landedAfter !== null) landedAt = elapsed + result.landedAfter;
      state = result.state;
      elapsed += dt;
    }
    expect(state).toEqual({ x: H, v: 0 });
    expect(landedAt).toBeCloseTo(fallTime(H, FEATHER_TAU), 9);
    // Already down: stays down.
    expect(stepFallToFloor(state, dt, FEATHER_TAU, H)).toEqual({
      state: { x: H, v: 0 },
      landedAfter: 0,
    });
  });
});
