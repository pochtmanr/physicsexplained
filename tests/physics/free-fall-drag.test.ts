import { describe, expect, it } from "vitest";
import {
  FEATHER_TAU,
  G,
  HAMMER_TAU,
  fallDistance,
  fallSpeed,
  fallTime,
  tauAtAir,
  terminalSpeed,
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
