/**
 * §46 PENROSE DIAGRAMS — unit tests for the conformal-compactification helpers.
 *
 * Covers minkowskiCompactify, conformalInfinities, causalRelation, canReach,
 * schwarzschildRegion, beyondSingularity, singularityProperLimit, sampleNullRay,
 * and blendCompactify.
 */

import { describe, expect, it } from "vitest";
import {
  HALF_PI,
  minkowskiCompactify,
  conformalInfinities,
  causalRelation,
  canReach,
  schwarzschildRegion,
  beyondSingularity,
  singularityProperLimit,
  sampleNullRay,
  blendCompactify,
} from "@/lib/physics/relativity/penrose-diagrams";

// ─── minkowskiCompactify ───────────────────────────────────────────────────

describe("minkowskiCompactify", () => {
  it("maps the origin (t=0, r=0) to the diagram origin", () => {
    const p = minkowskiCompactify(0, 0);
    expect(p.X).toBeCloseTo(0, 12);
    expect(p.T).toBeCloseTo(0, 12);
  });

  it("keeps r ≥ 0 events in the right half-diamond (X ≥ 0)", () => {
    for (const [t, r] of [
      [0, 1],
      [3, 2],
      [-5, 4],
      [10, 0.1],
    ] as const) {
      expect(minkowskiCompactify(t, r).X).toBeGreaterThanOrEqual(0);
    }
  });

  it("sends large t with finite r toward future timelike infinity (T → π)", () => {
    const p = minkowskiCompactify(1e6, 1);
    expect(p.T).toBeCloseTo(Math.PI, 3);
    expect(p.X).toBeCloseTo(0, 3);
  });

  it("sends large r with finite t toward spatial infinity (X → π, T → 0)", () => {
    const p = minkowskiCompactify(0, 1e6);
    expect(p.X).toBeCloseTo(Math.PI, 3);
    expect(p.T).toBeCloseTo(0, 3);
  });

  it("respects the diamond bound |T| + X ≤ π for finite events", () => {
    for (const [t, r] of [
      [2, 5],
      [-8, 3],
      [100, 100],
    ] as const) {
      const p = minkowskiCompactify(t, r);
      expect(Math.abs(p.T) + p.X).toBeLessThanOrEqual(Math.PI + 1e-9);
    }
  });
});

// ─── conformalInfinities ───────────────────────────────────────────────────

describe("conformalInfinities", () => {
  it("places i⁺ and i⁻ at the top and bottom of the diamond", () => {
    const inf = conformalInfinities();
    expect(inf.iPlus).toEqual({ X: 0, T: Math.PI });
    expect(inf.iMinus).toEqual({ X: 0, T: -Math.PI });
  });

  it("places spatial infinity i⁰ at the right corner", () => {
    expect(conformalInfinities().iZero).toEqual({ X: Math.PI, T: 0 });
  });

  it("ℐ⁺ is the null edge from i⁺ down to i⁰ (slope −1)", () => {
    const [from, to] = conformalInfinities().scriPlus;
    const slope = (to.T - from.T) / (to.X - from.X);
    expect(slope).toBeCloseTo(-1, 12);
  });
});

// ─── causalRelation / canReach ─────────────────────────────────────────────

describe("causalRelation", () => {
  it("classifies a purely time separation as timelike", () => {
    expect(causalRelation({ X: 0, T: 0 }, { X: 0, T: 1 })).toBe("timelike");
  });

  it("classifies a purely space separation as spacelike", () => {
    expect(causalRelation({ X: 0, T: 0 }, { X: 1, T: 0 })).toBe("spacelike");
  });

  it("classifies a 45° separation as null", () => {
    expect(causalRelation({ X: 0, T: 0 }, { X: 1, T: 1 })).toBe("null");
    expect(causalRelation({ X: 0, T: 0 }, { X: 2, T: -2 })).toBe("null");
  });
});

describe("canReach", () => {
  it("reaches an event in the future light cone", () => {
    expect(canReach({ X: 0, T: 0 }, { X: 0.5, T: 2 })).toBe(true);
  });

  it("cannot reach a spacelike-separated event", () => {
    expect(canReach({ X: 0, T: 0 }, { X: 3, T: 1 })).toBe(false);
  });

  it("cannot reach into its own past", () => {
    expect(canReach({ X: 0, T: 0 }, { X: 0, T: -1 })).toBe(false);
  });

  it("reaches a null-separated future event (light signal)", () => {
    expect(canReach({ X: 0, T: 0 }, { X: 1, T: 1 })).toBe(true);
  });
});

// ─── schwarzschildRegion ───────────────────────────────────────────────────

describe("schwarzschildRegion", () => {
  it("our exterior universe is region I (V>0, U<0)", () => {
    expect(schwarzschildRegion(-0.5, 0.5)).toBe("I");
  });

  it("the black-hole interior is region II (V>0, U>0)", () => {
    expect(schwarzschildRegion(0.5, 0.5)).toBe("II");
  });

  it("the mirror universe is region III (V<0, U>0)", () => {
    expect(schwarzschildRegion(0.5, -0.5)).toBe("III");
  });

  it("the white hole is region IV (V<0, U<0)", () => {
    expect(schwarzschildRegion(-0.5, -0.5)).toBe("IV");
  });
});

// ─── beyondSingularity / singularityProperLimit ────────────────────────────

describe("beyondSingularity", () => {
  it("is false inside the diagram (U·V < 1)", () => {
    expect(beyondSingularity(0.5, 0.5)).toBe(false);
  });

  it("is true at or past the singularity hyperbola (U·V ≥ 1)", () => {
    expect(beyondSingularity(1, 1)).toBe(true);
    expect(beyondSingularity(2, 0.6)).toBe(true);
  });
});

describe("singularityProperLimit", () => {
  it("is unbounded outside the horizon (U ≤ 0)", () => {
    expect(singularityProperLimit(-1)).toBe(Infinity);
    expect(singularityProperLimit(0)).toBe(Infinity);
  });

  it("shrinks as the infaller pushes deeper (larger U)", () => {
    expect(singularityProperLimit(0.5)).toBeCloseTo(2, 12);
    expect(singularityProperLimit(2)).toBeCloseTo(0.5, 12);
    expect(singularityProperLimit(4)).toBeLessThan(singularityProperLimit(2));
  });
});

// ─── sampleNullRay ─────────────────────────────────────────────────────────

describe("sampleNullRay", () => {
  it("produces a straight 45° line in diagram space (outgoing)", () => {
    const pts = sampleNullRay("outgoing", 0, 16, 8);
    // For u = const, ũ is fixed, so T = ṽ + ũ and X = ṽ − ũ both move with ṽ;
    // T − X = 2ũ is constant ⇒ slope of T vs X is +1.
    const tMinusX = pts.map((p) => p.T - p.X);
    for (const d of tMinusX) expect(d).toBeCloseTo(tMinusX[0], 9);
  });

  it("ingoing rays keep T + X constant (slope −1)", () => {
    const pts = sampleNullRay("ingoing", 4, 16, 8);
    const tPlusX = pts.map((p) => p.T + p.X);
    for (const d of tPlusX) expect(d).toBeCloseTo(tPlusX[0], 9);
  });

  it("returns samples+1 points", () => {
    expect(sampleNullRay("outgoing", 1, 10).length).toBe(11);
  });
});

// ─── blendCompactify ───────────────────────────────────────────────────────

describe("blendCompactify", () => {
  it("at s=1 equals the full compactification", () => {
    const full = minkowskiCompactify(3, 2);
    const blended = blendCompactify(3, 2, 1);
    expect(blended.X).toBeCloseTo(full.X, 12);
    expect(blended.T).toBeCloseTo(full.T, 12);
  });

  it("at s=0 returns the rescaled raw (linear) coordinates", () => {
    const scale = HALF_PI / 12;
    const blended = blendCompactify(3, 2, 0, scale);
    const rawU = (3 - 2) * scale;
    const rawV = (3 + 2) * scale;
    expect(blended.X).toBeCloseTo(rawV - rawU, 12);
    expect(blended.T).toBeCloseTo(rawV + rawU, 12);
  });

  it("interpolates monotonically between raw and full for the time axis", () => {
    const t = 5;
    const r = 1;
    const t0 = blendCompactify(t, r, 0).T;
    const t05 = blendCompactify(t, r, 0.5).T;
    const t1 = blendCompactify(t, r, 1).T;
    const lo = Math.min(t0, t1);
    const hi = Math.max(t0, t1);
    expect(t05).toBeGreaterThanOrEqual(lo - 1e-9);
    expect(t05).toBeLessThanOrEqual(hi + 1e-9);
  });
});
