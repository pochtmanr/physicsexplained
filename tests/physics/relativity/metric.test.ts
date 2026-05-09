/**
 * §07 THE METRIC TENSOR — unit tests.
 *
 * Tests cover lineElement, sphericalMetric2D, polarMetric2D,
 * minkowskiMetric4D, det2, inverse2, magnitudeSquared, and metricDot.
 */

import { describe, expect, it } from "vitest";
import {
  lineElement,
  sphericalMetric2D,
  polarMetric2D,
  minkowskiMetric4D,
  det2,
  inverse2,
  magnitudeSquared,
  metricDot,
} from "@/lib/physics/relativity/metric";

// ─── lineElement ──────────────────────────────────────────────────────────────

describe("lineElement", () => {
  it("Euclidean identity metric with dx=(1,0) returns 1", () => {
    const g = [
      [1, 0],
      [0, 1],
    ] as const;
    expect(lineElement(g, [1, 0])).toBeCloseTo(1, 12);
  });

  it("Euclidean identity metric with dx=(3,4) returns 25 (Pythagorean)", () => {
    const g = [
      [1, 0],
      [0, 1],
    ] as const;
    expect(lineElement(g, [3, 4])).toBeCloseTo(25, 10);
  });

  it("spherical metric at θ=π/2 and dθ=1, dφ=1 gives R²(1 + 1)", () => {
    const R = 2;
    const g = sphericalMetric2D(R, Math.PI / 2);
    // sin(π/2) = 1 so g = diag(4, 4), ds² = 4·1 + 4·1 = 8
    expect(lineElement(g, [1, 1])).toBeCloseTo(8, 10);
  });

  it("spherical metric at θ=0 (north pole) — dφ term vanishes", () => {
    const R = 3;
    const g = sphericalMetric2D(R, 0);
    // sin(0) = 0 so g = diag(9, 0), ds² = 9·dθ² + 0·dφ²
    expect(lineElement(g, [0, 1])).toBeCloseTo(0, 12);
    expect(lineElement(g, [1, 0])).toBeCloseTo(9, 10);
  });
});

// ─── polarMetric2D ────────────────────────────────────────────────────────────

describe("polarMetric2D", () => {
  it("at r=1 reduces to the identity matrix", () => {
    const g = polarMetric2D(1);
    expect(g[0][0]).toBeCloseTo(1, 12);
    expect(g[0][1]).toBeCloseTo(0, 12);
    expect(g[1][0]).toBeCloseTo(0, 12);
    expect(g[1][1]).toBeCloseTo(1, 12);
  });

  it("at r=2 off-diagonal elements are 0 and (1,1) component is 4", () => {
    const g = polarMetric2D(2);
    expect(g[0][0]).toBeCloseTo(1, 12);
    expect(g[0][1]).toBeCloseTo(0, 12);
    expect(g[1][0]).toBeCloseTo(0, 12);
    expect(g[1][1]).toBeCloseTo(4, 12);
  });

  it("polar line element at r=3 and dφ=1, dr=0 gives r²=9", () => {
    const g = polarMetric2D(3);
    // ds² = 0² + 3²·1² = 9
    expect(lineElement(g, [0, 1])).toBeCloseTo(9, 10);
  });
});

// ─── minkowskiMetric4D ────────────────────────────────────────────────────────

describe("minkowskiMetric4D", () => {
  it("returns diag(1, -1, -1, -1) — all components verified", () => {
    const eta = minkowskiMetric4D();
    // Diagonal
    expect(eta[0][0]).toBe(1);
    expect(eta[1][1]).toBe(-1);
    expect(eta[2][2]).toBe(-1);
    expect(eta[3][3]).toBe(-1);
    // Off-diagonal (all zero)
    expect(eta[0][1]).toBe(0);
    expect(eta[0][2]).toBe(0);
    expect(eta[0][3]).toBe(0);
    expect(eta[1][0]).toBe(0);
    expect(eta[1][2]).toBe(0);
    expect(eta[1][3]).toBe(0);
    expect(eta[2][0]).toBe(0);
    expect(eta[2][1]).toBe(0);
    expect(eta[2][3]).toBe(0);
    expect(eta[3][0]).toBe(0);
    expect(eta[3][1]).toBe(0);
    expect(eta[3][2]).toBe(0);
  });
});

// ─── det2 ─────────────────────────────────────────────────────────────────────

describe("det2", () => {
  it("det of identity matrix is 1", () => {
    const id = [
      [1, 0],
      [0, 1],
    ] as const;
    expect(det2(id)).toBeCloseTo(1, 12);
  });

  it("det of singular matrix (two identical rows) is 0", () => {
    const sing = [
      [2, 3],
      [2, 3],
    ] as const;
    expect(det2(sing)).toBeCloseTo(0, 12);
  });

  it("det of spherical metric at θ=π/2 is R⁴ sin²(π/2) = R⁴", () => {
    const R = 2;
    const g = sphericalMetric2D(R, Math.PI / 2);
    // g = diag(4, 4), det = 16 = R^4
    expect(det2(g)).toBeCloseTo(R * R * R * R, 8);
  });
});

// ─── inverse2 ────────────────────────────────────────────────────────────────

describe("inverse2", () => {
  it("inverse of identity is identity", () => {
    const id = [
      [1, 0],
      [0, 1],
    ] as const;
    const inv = inverse2(id);
    expect(inv[0][0]).toBeCloseTo(1, 10);
    expect(inv[0][1]).toBeCloseTo(0, 10);
    expect(inv[1][0]).toBeCloseTo(0, 10);
    expect(inv[1][1]).toBeCloseTo(1, 10);
  });

  it("inverse of diag(a, b) is diag(1/a, 1/b)", () => {
    const a = 3;
    const b = 7;
    const g = [
      [a, 0],
      [0, b],
    ] as const;
    const inv = inverse2(g);
    expect(inv[0][0]).toBeCloseTo(1 / a, 10);
    expect(inv[1][1]).toBeCloseTo(1 / b, 10);
    expect(inv[0][1]).toBeCloseTo(0, 10);
    expect(inv[1][0]).toBeCloseTo(0, 10);
  });

  it("g^{μν} g_{νρ} = δ^μ_ρ (round-trip gives identity)", () => {
    const g = sphericalMetric2D(2, 1.2);
    const gInv = inverse2(g);
    // Compute g_inv · g
    const prod00 = gInv[0][0] * g[0][0] + gInv[0][1] * g[1][0];
    const prod01 = gInv[0][0] * g[0][1] + gInv[0][1] * g[1][1];
    const prod10 = gInv[1][0] * g[0][0] + gInv[1][1] * g[1][0];
    const prod11 = gInv[1][0] * g[0][1] + gInv[1][1] * g[1][1];
    expect(prod00).toBeCloseTo(1, 8);
    expect(prod01).toBeCloseTo(0, 8);
    expect(prod10).toBeCloseTo(0, 8);
    expect(prod11).toBeCloseTo(1, 8);
  });

  it("throws RangeError on a singular metric", () => {
    const sing = [
      [1, 2],
      [2, 4],
    ] as const;
    expect(() => inverse2(sing)).toThrow(RangeError);
  });
});

// ─── magnitudeSquared ─────────────────────────────────────────────────────────

describe("magnitudeSquared", () => {
  it("null vector (1,1,0,0) under Minkowski metric returns 0", () => {
    // η(1,1,0,0) = 1² - 1² - 0 - 0 = 0
    const eta = minkowskiMetric4D();
    expect(magnitudeSquared(eta, [1, 1, 0, 0])).toBeCloseTo(0, 12);
  });

  it("timelike vector (1, 0.5, 0, 0) under Minkowski metric returns positive value", () => {
    // η = 1 - 0.25 = 0.75 > 0  (timelike in mostly-minus convention)
    const eta = minkowskiMetric4D();
    expect(magnitudeSquared(eta, [1, 0.5, 0, 0])).toBeCloseTo(0.75, 10);
  });

  it("spacelike vector (0,1,0,0) under Minkowski returns -1", () => {
    const eta = minkowskiMetric4D();
    expect(magnitudeSquared(eta, [0, 1, 0, 0])).toBeCloseTo(-1, 12);
  });
});

// ─── metricDot ────────────────────────────────────────────────────────────────

describe("metricDot", () => {
  it("is symmetric: metricDot(g, U, V) = metricDot(g, V, U) for symmetric g", () => {
    const g = sphericalMetric2D(1.5, Math.PI / 3);
    const U = [1.2, 0.7];
    const V = [0.3, 2.1];
    expect(metricDot(g, U, V)).toBeCloseTo(metricDot(g, V, U), 10);
  });

  it("metricDot(g, V, V) equals magnitudeSquared(g, V) for any V", () => {
    const g = polarMetric2D(2);
    const V = [1.5, 0.8];
    expect(metricDot(g, V, V)).toBeCloseTo(magnitudeSquared(g, V), 10);
  });

  it("orthogonal vectors have zero inner product under polar metric", () => {
    // In polar coordinates at r=1, dr and dφ basis vectors are orthogonal
    const g = polarMetric2D(1);
    // (1, 0) is ∂_r direction, (0, 1) is ∂_φ direction
    expect(metricDot(g, [1, 0], [0, 1])).toBeCloseTo(0, 12);
  });

  it("Minkowski inner product of two null vectors (1,1,0,0) is 0", () => {
    const eta = minkowskiMetric4D();
    const null1 = [1, 1, 0, 0];
    expect(metricDot(eta, null1, null1)).toBeCloseTo(0, 12);
  });
});
