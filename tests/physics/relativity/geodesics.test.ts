/**
 * §07 GEODESICS — unit tests.
 *
 * Tests cover integrateGeodesic, greatCircle, and conservedEnergy.
 */

import { describe, expect, it } from "vitest";
import {
  integrateGeodesic,
  greatCircle,
  conservedEnergy,
} from "@/lib/physics/relativity/geodesics";
import { sphericalMetric } from "@/lib/physics/relativity/christoffel";

// ─── Flat Euclidean metric helpers ─────────────────────────────────────────

/** Flat 2D Euclidean metric: diag(1, 1). */
function flatMetric2D(_x: readonly number[]): readonly (readonly number[])[] {
  return [
    [1, 0],
    [0, 1],
  ] as const;
}

/** Flat 1D "metric": [[1]]. */
function flatMetric1D(_x: readonly number[]): readonly (readonly number[])[] {
  return [[1]] as const;
}

// ─── integrateGeodesic ───────────────────────────────────────────────────────

describe("integrateGeodesic — flat 2D metric", () => {
  it("straight line: x0=(0,0), v0=(1,0) → after T=1 x≈(1,0)", () => {
    const path = integrateGeodesic(flatMetric2D, [0, 0], [1, 0], 1, 0.01);
    const last = path[path.length - 1];
    expect(last.x[0]).toBeCloseTo(1, 4);
    expect(last.x[1]).toBeCloseTo(0, 4);
  });

  it("straight line: x0=(0,0), v0=(1,1) → after T=2 x≈(2,2)", () => {
    const path = integrateGeodesic(flatMetric2D, [0, 0], [1, 1], 2, 0.01);
    const last = path[path.length - 1];
    expect(last.x[0]).toBeCloseTo(2, 3);
    expect(last.x[1]).toBeCloseTo(2, 3);
  });

  it("velocity is preserved: v should remain (1,0) throughout a flat geodesic", () => {
    const path = integrateGeodesic(flatMetric2D, [0, 0], [1, 0], 1, 0.1);
    for (const step of path) {
      expect(step.v[0]).toBeCloseTo(1, 8);
      expect(step.v[1]).toBeCloseTo(0, 8);
    }
  });

  it("produces exactly (steps + 1) entries when T = steps × h", () => {
    const steps = 50;
    const h = 0.04;
    const T = steps * h;
    const path = integrateGeodesic(flatMetric2D, [0, 0], [1, 0], T, h);
    expect(path.length).toBe(steps + 1);
  });
});

describe("integrateGeodesic — flat 1D metric", () => {
  it("straight line: x0=(0), v0=(3) → after T=2 x≈(6)", () => {
    const path = integrateGeodesic(flatMetric1D, [0], [3], 2, 0.01);
    const last = path[path.length - 1];
    expect(last.x[0]).toBeCloseTo(6, 3);
  });
});

describe("integrateGeodesic — sphere (θ, φ)", () => {
  const sphereMetric = sphericalMetric(1);

  it("equatorial geodesic stays on equator: starting at θ=π/2 heading east, θ remains π/2", () => {
    // v0 = (dθ/dλ, dφ/dλ) = (0, 1) → heading east along equator.
    const path = integrateGeodesic(
      sphereMetric,
      [Math.PI / 2, 0],
      [0, 1],
      2 * Math.PI,
      0.02,
    );
    for (const step of path) {
      // θ should stay close to π/2 throughout.
      expect(step.x[0]).toBeCloseTo(Math.PI / 2, 1);
    }
  });

  it("norm |v|² = g_{μν} v^μ v^ν is approximately preserved (±1%) along a sphere geodesic", () => {
    const x0 = [Math.PI / 3, 0];
    const v0 = [0.7, 0.3];
    const g0 = sphereMetric(x0);
    const norm0 = g0[0][0] * v0[0] * v0[0] + g0[1][1] * v0[1] * v0[1];

    const path = integrateGeodesic(sphereMetric, x0, v0, 1, 0.005);
    for (const step of path) {
      const g = sphereMetric(step.x);
      const norm = g[0][0] * step.v[0] * step.v[0] + g[1][1] * step.v[1] * step.v[1];
      // Relative error stays within 1%.
      expect(Math.abs(norm - norm0) / (Math.abs(norm0) + 1e-12)).toBeLessThan(0.01);
    }
  });
});

// ─── greatCircle ─────────────────────────────────────────────────────────────

describe("greatCircle", () => {
  it("starting at equator heading north reaches the north pole at s ≈ π/2 (step nearest quarter arc)", () => {
    // θ₀ = π/2 (equator), φ₀ = 0, heading north (azimuth = 0).
    // At s = π/2 along the great circle we expect the north pole: θ ≈ 0.
    const steps = 64;
    const gc = greatCircle(1, Math.PI / 2, 0, 0, steps);
    // s = π/2 corresponds to step index steps/4
    const quarterIdx = Math.round(steps / 4);
    expect(gc[quarterIdx].theta).toBeCloseTo(0, 1);
  });

  it("great circle from any point with any azimuth is a closed loop of angular length 2π", () => {
    // The first and last sample should coincide (θ and φ, mod wrapping).
    const gc = greatCircle(1, Math.PI / 3, Math.PI / 4, 1.1, 128);
    const first = gc[0];
    const last = gc[gc.length - 1];
    // Same θ
    expect(first.theta).toBeCloseTo(last.theta, 4);
    // Same φ (mod 2π)
    const dphi = Math.abs(first.phi - last.phi) % (2 * Math.PI);
    expect(Math.min(dphi, 2 * Math.PI - dphi)).toBeCloseTo(0, 4);
  });

  it("produces steps + 1 samples", () => {
    const gc = greatCircle(2, 1, 0, 0, 50);
    expect(gc.length).toBe(51);
  });

  it("great circle starting at north pole with any azimuth has θ=0 for first sample", () => {
    // North pole: θ₀ = 0 (but use a small value to avoid pole degeneracy in eNorth).
    // At s=0 we should be back at the start.
    const gc = greatCircle(1, 0.01, 0, Math.PI / 4, 64);
    expect(gc[0].theta).toBeCloseTo(0.01, 3);
  });
});

// ─── conservedEnergy ─────────────────────────────────────────────────────────

describe("conservedEnergy", () => {
  it("flat metric [[1,0],[0,1]] with v=(2,3) returns g_{tt}·v^t = 1·2 = 2", () => {
    const g = [
      [1, 0],
      [0, 1],
    ] as const;
    expect(conservedEnergy(g, [2, 3])).toBeCloseTo(2, 12);
  });

  it("metric with g_{tt}=−(1+2Φ) ≈ −0.9 and v^t=1 returns −0.9", () => {
    const g = [
      [-0.9, 0],
      [0, 1],
    ] as const;
    expect(conservedEnergy(g, [1, 0])).toBeCloseTo(-0.9, 12);
  });

  it("conserved energy is constant along a flat geodesic (Killing conservation)", () => {
    const path = integrateGeodesic(flatMetric2D, [0, 0], [1.5, 0.5], 2, 0.02);
    const E0 = conservedEnergy(flatMetric2D(path[0].x), path[0].v);
    for (const step of path) {
      const E = conservedEnergy(flatMetric2D(step.x), step.v);
      expect(E).toBeCloseTo(E0, 8);
    }
  });
});
