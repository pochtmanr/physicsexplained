/**
 * §08 THE RIEMANN TENSOR — unit tests.
 *
 * Tests cover riemannTensor, riemannIndependentComponentCount, and lowerRiemann
 * against known analytic results on flat and spherical geometries.
 */

import { describe, expect, it } from "vitest";
import {
  riemannTensor,
  riemannIndependentComponentCount,
  lowerRiemann,
} from "@/lib/physics/relativity/riemann";
import { sphericalMetric } from "@/lib/physics/relativity/christoffel";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Euclidean 2D metric (flat Cartesian): g = diag(1, 1). */
function flatMetric2D(x: readonly number[]): readonly (readonly number[])[] {
  void x;
  return [
    [1, 0],
    [0, 1],
  ];
}

/** Polar Euclidean metric: g = diag(1, r²). x = [r, φ]. */
function polarMetric2D(x: readonly number[]): readonly (readonly number[])[] {
  const r = x[0];
  return [
    [1, 0],
    [0, r * r],
  ];
}

// ─── riemannIndependentComponentCount ─────────────────────────────────────────

describe("riemannIndependentComponentCount", () => {
  it("returns 0 in n=1 (1D line is always flat)", () => {
    expect(riemannIndependentComponentCount(1)).toBe(0);
  });

  it("returns 1 in n=2 (one independent Gaussian curvature)", () => {
    expect(riemannIndependentComponentCount(2)).toBe(1);
  });

  it("returns 6 in n=3 (three spatial dimensions)", () => {
    expect(riemannIndependentComponentCount(3)).toBe(6);
  });

  it("returns 20 in n=4 (four-dimensional spacetime)", () => {
    expect(riemannIndependentComponentCount(4)).toBe(20);
  });

  it("throws on n=0 (non-positive)", () => {
    expect(() => riemannIndependentComponentCount(0)).toThrow(RangeError);
  });

  it("throws on negative n", () => {
    expect(() => riemannIndependentComponentCount(-2)).toThrow(RangeError);
  });

  it("throws on non-integer n", () => {
    expect(() => riemannIndependentComponentCount(2.5)).toThrow(RangeError);
  });
});

// ─── riemannTensor — flat Euclidean 2D ────────────────────────────────────────

describe("riemannTensor — flat 2D Cartesian metric", () => {
  it("all components are approximately zero on flat Euclidean metric", () => {
    const x = [1.0, 0.5];
    const R = riemannTensor(flatMetric2D, x);
    for (let rho = 0; rho < 2; rho++) {
      for (let sigma = 0; sigma < 2; sigma++) {
        for (let mu = 0; mu < 2; mu++) {
          for (let nu = 0; nu < 2; nu++) {
            expect(Math.abs(R[rho][sigma][mu][nu])).toBeLessThan(1e-2);
          }
        }
      }
    }
  });
});

// ─── riemannTensor — polar Euclidean (flat in disguise) ────────────────────────

describe("riemannTensor — polar Euclidean metric (flat in disguise)", () => {
  it("all components vanish for polar coordinates (intrinsically flat)", () => {
    const r = 1.5;
    const phi = Math.PI / 3;
    const x = [r, phi];
    const R = riemannTensor(polarMetric2D, x);
    for (let rho = 0; rho < 2; rho++) {
      for (let sigma = 0; sigma < 2; sigma++) {
        for (let mu = 0; mu < 2; mu++) {
          for (let nu = 0; nu < 2; nu++) {
            expect(Math.abs(R[rho][sigma][mu][nu])).toBeLessThan(1e-2);
          }
        }
      }
    }
  });
});

// ─── riemannTensor — unit sphere ──────────────────────────────────────────────

describe("riemannTensor — unit sphere metric (R=1)", () => {
  const theta = Math.PI / 4;
  const phi = 0.5;
  const x = [theta, phi];
  const metric = sphericalMetric(1);

  it("R^θ_{φθφ} is nonzero (positive) at θ=π/4", () => {
    // For unit sphere, R^θ_{φθφ} = sin²θ at θ=π/4 → 0.5
    const R = riemannTensor(metric, x);
    // rho=0 (θ), sigma=1 (φ), mu=0 (θ), nu=1 (φ)
    expect(R[0][1][0][1]).toBeGreaterThan(0.3);
    expect(R[0][1][0][1]).toBeLessThan(0.7);
  });

  it("R^ρ_{σμν} is antisymmetric in (μ, ν): R^ρ_{σμν} ≈ -R^ρ_{σνμ}", () => {
    const R = riemannTensor(metric, x);
    for (let rho = 0; rho < 2; rho++) {
      for (let sigma = 0; sigma < 2; sigma++) {
        for (let mu = 0; mu < 2; mu++) {
          for (let nu = 0; nu < 2; nu++) {
            // R^ρ_{σμν} + R^ρ_{σνμ} ≈ 0
            expect(R[rho][sigma][mu][nu] + R[rho][sigma][nu][mu]).toBeCloseTo(0, 1);
          }
        }
      }
    }
  });

  it("diagonal (μ=ν) components are approximately zero (antisymmetry requires it)", () => {
    const R = riemannTensor(metric, x);
    for (let rho = 0; rho < 2; rho++) {
      for (let sigma = 0; sigma < 2; sigma++) {
        for (let idx = 0; idx < 2; idx++) {
          expect(Math.abs(R[rho][sigma][idx][idx])).toBeLessThan(1e-2);
        }
      }
    }
  });
});

// ─── lowerRiemann ─────────────────────────────────────────────────────────────

describe("lowerRiemann — flat Cartesian metric", () => {
  it("with the identity metric, lowering leaves components unchanged", () => {
    const x = [0.8, 0.6];
    const R = riemannTensor(flatMetric2D, x);
    const g = flatMetric2D(x) as number[][];
    const Rl = lowerRiemann(g, R);
    // For identity metric, R_{ρσμν} = R^ρ_{σμν} (since g_{ρλ} = δ_{ρλ})
    for (let rho = 0; rho < 2; rho++) {
      for (let sigma = 0; sigma < 2; sigma++) {
        for (let mu = 0; mu < 2; mu++) {
          for (let nu = 0; nu < 2; nu++) {
            expect(Math.abs(Rl[rho][sigma][mu][nu])).toBeLessThan(1e-2);
          }
        }
      }
    }
  });
});

describe("lowerRiemann — unit sphere", () => {
  it("fully lowered R_{ρσμν} is antisymmetric in (ρ, σ): R_{ρσμν} ≈ -R_{σρμν}", () => {
    const theta = Math.PI / 4;
    const x = [theta, 0.5];
    const metric = sphericalMetric(1);
    const R = riemannTensor(metric, x);
    const g = metric(x) as number[][];
    const Rl = lowerRiemann(g, R);

    for (let rho = 0; rho < 2; rho++) {
      for (let sigma = 0; sigma < 2; sigma++) {
        for (let mu = 0; mu < 2; mu++) {
          for (let nu = 0; nu < 2; nu++) {
            // R_{ρσμν} + R_{σρμν} ≈ 0
            expect(Rl[rho][sigma][mu][nu] + Rl[sigma][rho][mu][nu]).toBeCloseTo(0, 1);
          }
        }
      }
    }
  });
});
