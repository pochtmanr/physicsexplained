import { describe, expect, it } from "vitest";
import {
  isCausallyConnected,
  lightConeBoundary,
  quadrant,
} from "@/lib/physics/relativity/light-cone";
import {
  applyMatrix,
  boostX,
  intervalSquared,
  pointToVec4,
  vec4ToPoint,
} from "@/lib/physics/relativity/types";
import type { MinkowskiPoint } from "@/lib/physics/relativity/types";
import { SPEED_OF_LIGHT } from "@/lib/physics/constants";

const C = SPEED_OF_LIGHT;

const origin: MinkowskiPoint = { t: 0, x: 0, y: 0, z: 0 };

/** Apply a +x Lorentz boost of velocity βc to a MinkowskiPoint. */
function boost(p: MinkowskiPoint, beta: number): MinkowskiPoint {
  return vec4ToPoint(applyMatrix(boostX(beta), pointToVec4(p, C)), C);
}

describe("quadrant — light-cone classification of (origin, p2)", () => {
  it("classifies a forward timelike event as 'timelike-future'", () => {
    // ct = 2 m, x = 1 m  ⇒  s² = 4 − 1 = 3 m² > 0, Δt > 0
    const p2: MinkowskiPoint = { t: 2 / C, x: 1, y: 0, z: 0 };
    expect(quadrant(origin, p2)).toBe("timelike-future");
    expect(intervalSquared(origin, p2, C)).toBeGreaterThan(0);
  });

  it("classifies a past timelike event as 'timelike-past'", () => {
    const p2: MinkowskiPoint = { t: -2 / C, x: 0.5, y: 0, z: 0 };
    expect(quadrant(origin, p2)).toBe("timelike-past");
  });

  it("classifies a future null event (|x| = c|t|) as 'null-future'", () => {
    // Pick t = 1 s exactly so c²t² − (ct)² is bit-exact zero.
    const t = 1;
    const p2: MinkowskiPoint = { t, x: C * t, y: 0, z: 0 };
    expect(intervalSquared(origin, p2, C)).toBe(0);
    expect(quadrant(origin, p2)).toBe("null-future");
  });

  it("classifies a spatially-separated event as 'spacelike'", () => {
    // ct = 0.5 m, x = 2 m  ⇒  s² = 0.25 − 4 < 0
    const p2: MinkowskiPoint = { t: 0.5 / C, x: 2, y: 0, z: 0 };
    expect(quadrant(origin, p2)).toBe("spacelike");
    expect(intervalSquared(origin, p2, C)).toBeLessThan(0);
  });
});

describe("isCausallyConnected — only signals at v ≤ c may pass", () => {
  it("connects events inside the future light cone", () => {
    const p2: MinkowskiPoint = { t: 2 / C, x: 1, y: 0, z: 0 };
    expect(isCausallyConnected(origin, p2)).toBe(true);
  });

  it("rejects spacelike-separated events (no signal at v ≤ c)", () => {
    const p2: MinkowskiPoint = { t: 0.5 / C, x: 2, y: 0, z: 0 };
    expect(isCausallyConnected(origin, p2)).toBe(false);
  });

  it("rejects past-directed timelike events (signal cannot run backward)", () => {
    const p2: MinkowskiPoint = { t: -2 / C, x: 0.5, y: 0, z: 0 };
    expect(isCausallyConnected(origin, p2)).toBe(false);
  });

  it("includes null-future events on the light cone itself", () => {
    const t = 1;
    const p2: MinkowskiPoint = { t, x: C * t, y: 0, z: 0 };
    expect(isCausallyConnected(origin, p2)).toBe(true);
  });
});

describe("isCausallyConnected — Lorentz-invariance of causal ordering", () => {
  it("a timelike-future pair stays causally connected under every boost", () => {
    // Pick a generic timelike pair away from the origin so the test is
    // not trivial under a boost.
    const p1: MinkowskiPoint = { t: 1 / C, x: 0.2, y: 0, z: 0 };
    const p2: MinkowskiPoint = { t: 5 / C, x: 1.5, y: 0, z: 0 };
    expect(isCausallyConnected(p1, p2)).toBe(true);
    for (const beta of [-0.95, -0.6, -0.3, 0.3, 0.6, 0.95]) {
      const q1 = boost(p1, beta);
      const q2 = boost(p2, beta);
      expect(isCausallyConnected(q1, q2)).toBe(true);
    }
  });

  it("a spacelike pair has a boost frame in which Δt' = 0 (no causal order)", () => {
    // Two events with Δt > 0 but spacelike. There exists a boost
    // βc = c²Δt/Δx that makes them simultaneous. (See Griffiths §12.1.)
    const p1: MinkowskiPoint = { t: 0, x: 0, y: 0, z: 0 };
    const p2: MinkowskiPoint = { t: 0.5 / C, x: 2, y: 0, z: 0 }; // ct = 0.5, x = 2 ⇒ spacelike
    expect(quadrant(p1, p2)).toBe("spacelike");
    const beta = (C * (p2.t - p1.t)) / (p2.x - p1.x); // = 0.25
    expect(Math.abs(beta)).toBeLessThan(1);
    const q1 = boost(p1, beta);
    const q2 = boost(p2, beta);
    expect(q2.t - q1.t).toBeCloseTo(0, 12);
    // No causal order in this frame: a "tiny" sign perturbation would flip Δt'.
    expect(isCausallyConnected(q1, q2)).toBe(false);
  });
});

describe("lightConeBoundary — signed distance to the 45° envelope", () => {
  it("is positive inside a light cone, negative outside, zero on the cone", () => {
    expect(lightConeBoundary(2 / C, 1)).toBeCloseTo(2 - 1, 12); // inside
    expect(lightConeBoundary(0.5 / C, 2)).toBeCloseTo(0.5 - 2, 12); // outside
    const t = 1;
    expect(lightConeBoundary(t, C * t)).toBe(0); // exactly on the cone
  });

  it("is symmetric in the sign of t (future and past cones are congruent)", () => {
    expect(lightConeBoundary(+1 / C, 0.5)).toBeCloseTo(
      lightConeBoundary(-1 / C, 0.5),
      12,
    );
  });
});
