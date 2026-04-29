import { describe, expect, it } from "vitest";
import {
  tPrimeDifference,
  tPrime,
  xPrime,
  ordering,
} from "@/lib/physics/relativity/simultaneity";
import { SPEED_OF_LIGHT } from "@/lib/physics/constants";
import { gamma } from "@/lib/physics/relativity/types";

const C = SPEED_OF_LIGHT;

describe("tPrimeDifference — events simultaneous and coincident in lab", () => {
  it("stays simultaneous in any boosted frame (Δx = 0, Δt = 0)", () => {
    // Two events at the same place and same time in the lab → they're the
    // same event. A boost can't pry them apart.
    for (const beta of [-0.9, -0.5, 0, 0.3, 0.6, 0.99]) {
      expect(tPrimeDifference(7, 5, 7, 5, beta)).toBeCloseTo(0, 18);
    }
  });
});

describe("tPrimeDifference — events simultaneous BUT spatially separated", () => {
  it("become non-simultaneous under a non-zero boost (the gut punch)", () => {
    // Two events simultaneous in lab (t1 = t2 = 0), separated by 100 m along x.
    const dx = 100;
    const beta = 0.6;
    const dtPrime = tPrimeDifference(0, 0, 0, dx, beta);
    // t' = γ ( 0 − β·(0 − dx)/c ) = γ β dx / c, > 0
    const expected = gamma(beta) * (beta * dx) / C;
    expect(dtPrime).toBeCloseTo(expected, 12);
    expect(dtPrime).toBeGreaterThan(0);
  });

  it("flips sign when the boost flips sign", () => {
    const dx = 100;
    const plus = tPrimeDifference(0, 0, 0, dx, 0.6);
    const minus = tPrimeDifference(0, 0, 0, dx, -0.6);
    expect(plus).toBeCloseTo(-minus, 12);
  });

  it("vanishes at β = 0 (lab observer agrees with itself)", () => {
    expect(tPrimeDifference(0, 0, 0, 1e6, 0)).toBeCloseTo(0, 18);
  });
});

describe("tPrimeDifference — sign convention (train and platform)", () => {
  it("observer moving toward the smaller-x event sees that event later", () => {
    // Events: A at x = 0, B at x = +L = 100 m, both at t = 0.
    // Boost β = +0.5 means the new frame moves in +x relative to lab,
    // i.e. toward event B. From that frame, B is the "rear" event, A is "front".
    // Algebra: t_A' − t_B' = γ β (L − 0) / c > 0  ⇒  A is LATER (B is EARLIER).
    // i.e. the observer moving toward A (β < 0) would see A first; the
    // observer moving toward B (β > 0) sees B first.
    const dtPrime = tPrimeDifference(0, 0, 0, 100, 0.5);
    expect(dtPrime).toBeGreaterThan(0); // t_A' > t_B', so B happens first in the +x boost
    expect(ordering(0, 0, 0, 100, 0.5)).toBe(1);
    expect(ordering(0, 0, 0, 100, -0.5)).toBe(-1);
    expect(ordering(0, 0, 0, 100, 0)).toBe(0);
  });
});

describe("tPrime — round-trip at a single event", () => {
  it("equals lab time at β = 0", () => {
    expect(tPrime(2.5, 100, 0)).toBeCloseTo(2.5, 12);
  });

  it("matches tPrimeDifference applied with the second event at the origin", () => {
    const t = 1.234e-6;
    const x = 50;
    const beta = 0.4;
    const direct = tPrime(t, x, beta);
    const viaDiff = tPrimeDifference(t, x, 0, 0, beta);
    expect(direct).toBeCloseTo(viaDiff, 18);
  });
});

describe("xPrime — paired Lorentz transform", () => {
  it("equals lab x at β = 0", () => {
    expect(xPrime(7, 42, 0)).toBeCloseTo(42, 12);
  });

  it("preserves invariant interval (ct)² − x² with tPrime", () => {
    const t = 3e-7;
    const x = 50;
    const beta = 0.7;
    const tp = tPrime(t, x, beta);
    const xp = xPrime(t, x, beta);
    const sLab = (C * t) * (C * t) - x * x;
    const sBoost = (C * tp) * (C * tp) - xp * xp;
    expect(sBoost).toBeCloseTo(sLab, 6);
  });
});

describe("ordering — edge cases", () => {
  it("returns 0 within tolerance for exactly-zero time gaps", () => {
    expect(ordering(1, 1, 1, 1, 0.5)).toBe(0);
  });

  it("classifies a non-simultaneous pair correctly", () => {
    // t1 = 1 ns later than t2, same x
    expect(ordering(1e-9, 0, 0, 0, 0)).toBe(1);
    expect(ordering(0, 0, 1e-9, 0, 0)).toBe(-1);
  });
});
