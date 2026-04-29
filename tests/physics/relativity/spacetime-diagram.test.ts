import { describe, expect, it } from "vitest";
import { SPEED_OF_LIGHT } from "@/lib/physics/constants";
import {
  stationaryWorldline,
  uniformWorldline,
  worldlineSlope,
} from "@/lib/physics/relativity/spacetime-diagram";

const C = SPEED_OF_LIGHT;

describe("stationaryWorldline", () => {
  it("produces n+1 events sampled across [tMin, tMax]", () => {
    const wl = stationaryWorldline(0.5, 0, 4, 8);
    expect(wl.events.length).toBe(9);
    expect(wl.events[0].t).toBe(0);
    expect(wl.events[wl.events.length - 1].t).toBe(4);
  });

  it("every event has the same x coordinate (vertical worldline)", () => {
    const wl = stationaryWorldline(1.25, 0, 5, 10);
    for (const ev of wl.events) {
      expect(ev.x).toBe(1.25);
      expect(ev.y).toBe(0);
      expect(ev.z).toBe(0);
    }
  });

  it("slope between any two events is exactly 0 (β = 0)", () => {
    const wl = stationaryWorldline(0, 0, 4, 16);
    const events = [...wl.events];
    for (let i = 0; i < events.length - 1; i++) {
      expect(worldlineSlope(events[i], events[i + 1])).toBe(0);
    }
  });

  it("rejects non-positive n", () => {
    expect(() => stationaryWorldline(0, 0, 1, 0)).toThrow(RangeError);
    expect(() => stationaryWorldline(0, 0, 1, -3)).toThrow(RangeError);
  });

  it("rejects tMax <= tMin", () => {
    expect(() => stationaryWorldline(0, 1, 1, 8)).toThrow(RangeError);
    expect(() => stationaryWorldline(0, 2, 1, 8)).toThrow(RangeError);
  });
});

describe("uniformWorldline", () => {
  it("produces n+1 events", () => {
    const wl = uniformWorldline(0, 0.5 * C, 0, 4, 12);
    expect(wl.events.length).toBe(13);
  });

  it("event count matches n+1 for arbitrary n", () => {
    for (const n of [1, 2, 7, 33, 100]) {
      const wl = uniformWorldline(0, 0.3 * C, 0, 1, n);
      expect(wl.events.length).toBe(n + 1);
    }
  });

  it("events are monotonic in t", () => {
    const wl = uniformWorldline(0, 0.7 * C, 0, 5, 32);
    for (let i = 0; i < wl.events.length - 1; i++) {
      expect(wl.events[i + 1].t).toBeGreaterThan(wl.events[i].t);
    }
  });

  it("slope between adjacent events equals v/c (β) for any uniform speed", () => {
    for (const beta of [0.1, 0.3, 0.5, 0.8, 0.99]) {
      const wl = uniformWorldline(0, beta * C, 0, 4, 16);
      const events = [...wl.events];
      const slope = worldlineSlope(events[0], events[events.length - 1]);
      expect(slope).toBeCloseTo(beta, 12);
    }
  });

  it("slope is invariant under choice of segment endpoints (linearity)", () => {
    const wl = uniformWorldline(0, 0.6 * C, 0, 10, 50);
    const events = [...wl.events];
    const slope_0_10 = worldlineSlope(events[0], events[10]);
    const slope_5_30 = worldlineSlope(events[5], events[30]);
    const slope_2_47 = worldlineSlope(events[2], events[47]);
    expect(slope_5_30).toBeCloseTo(slope_0_10, 12);
    expect(slope_2_47).toBeCloseTo(slope_0_10, 12);
  });
});

describe("worldlineSlope", () => {
  it("returns 0 for two events that share the same x (stationary)", () => {
    const p1 = { t: 0, x: 2, y: 0, z: 0 };
    const p2 = { t: 5, x: 2, y: 0, z: 0 };
    expect(worldlineSlope(p1, p2)).toBe(0);
  });

  it("returns 1 for a light-speed worldline (v = c)", () => {
    const wl = uniformWorldline(0, C, 0, 4, 8);
    const events = [...wl.events];
    expect(worldlineSlope(events[0], events[events.length - 1])).toBeCloseTo(1, 12);
  });

  it("returns -1 for a leftward light-speed worldline (v = -c)", () => {
    const wl = uniformWorldline(0, -C, 0, 4, 8);
    const events = [...wl.events];
    expect(worldlineSlope(events[0], events[events.length - 1])).toBeCloseTo(-1, 12);
  });

  it("returns +Infinity for a horizontal segment (Δt = 0, instantaneous spatial jump)", () => {
    const p1 = { t: 1, x: 0, y: 0, z: 0 };
    const p2 = { t: 1, x: 1, y: 0, z: 0 };
    expect(worldlineSlope(p1, p2)).toBe(Number.POSITIVE_INFINITY);
  });

  it("light worldline has |slope| = 1 — the universal speed limit, drawn", () => {
    // Forward and backward light-cone rays both sit on slope ±1.
    const right = uniformWorldline(0, C, 0, 1, 4);
    const left = uniformWorldline(0, -C, 0, 1, 4);
    const re = [...right.events];
    const le = [...left.events];
    expect(Math.abs(worldlineSlope(re[0], re[3]))).toBeCloseTo(1, 12);
    expect(Math.abs(worldlineSlope(le[0], le[3]))).toBeCloseTo(1, 12);
  });
});
