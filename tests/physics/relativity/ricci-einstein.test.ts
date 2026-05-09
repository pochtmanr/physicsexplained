/**
 * §08 RICCI TENSOR, RICCI SCALAR, AND EINSTEIN TENSOR — unit tests.
 *
 * Tests cover ricciTensor, ricciScalar, and einsteinTensor against known
 * analytic results on flat 2D Euclidean, polar Euclidean, unit sphere, and
 * 3-sphere geometries.
 */

import { describe, expect, it } from "vitest";
import {
  ricciTensor,
  ricciScalar,
  einsteinTensor,
} from "@/lib/physics/relativity/ricci-einstein";
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

/** 3-sphere metric of radius 1: g = diag(1, sin²χ, sin²χ sin²θ).
 *  x = [χ, θ, φ] with χ ∈ (0,π), θ ∈ (0,π), φ ∈ (0,2π). */
function threeSphereMetric(x: readonly number[]): readonly (readonly number[])[] {
  const chi = x[0];
  const theta = x[1];
  const s2 = Math.sin(chi) * Math.sin(chi);
  const s2t = Math.sin(theta) * Math.sin(theta);
  return [
    [1, 0, 0],
    [0, s2, 0],
    [0, 0, s2 * s2t],
  ];
}

// ─── ricciTensor — flat 2D Euclidean ─────────────────────────────────────────

describe("ricciTensor — flat 2D Euclidean metric", () => {
  it("all components are approximately zero for flat Cartesian metric", () => {
    const x = [1.2, 0.8];
    const Ric = ricciTensor(flatMetric2D, x);
    for (let mu = 0; mu < 2; mu++) {
      for (let nu = 0; nu < 2; nu++) {
        expect(Math.abs(Ric[mu][nu])).toBeLessThan(1e-2);
      }
    }
  });
});

// ─── ricciScalar — flat and polar Euclidean ───────────────────────────────────

describe("ricciScalar — flat and polar Euclidean metrics", () => {
  it("Ricci scalar is approximately zero for flat Cartesian metric", () => {
    const x = [0.5, 1.0];
    expect(Math.abs(ricciScalar(flatMetric2D, x))).toBeLessThan(1e-2);
  });

  it("Ricci scalar is approximately zero for polar Euclidean metric (flat in disguise)", () => {
    // Polar coordinates are a curvilinear re-expression of flat 2D Euclidean space.
    // The intrinsic curvature is still zero — only the coordinates are curved.
    const r = 1.5;
    const phi = Math.PI / 3;
    const x = [r, phi];
    expect(Math.abs(ricciScalar(polarMetric2D, x))).toBeLessThan(5e-2);
  });
});

// ─── ricciScalar — unit sphere ────────────────────────────────────────────────

describe("ricciScalar — unit sphere metric (R=1)", () => {
  it("Ricci scalar ≈ 2 at θ=π/4 (analytic value for unit sphere: 2/R² = 2)", () => {
    // For a 2-sphere of radius 1: R = 2/R² = 2 everywhere (constant curvature).
    const x = [Math.PI / 4, 0.5];
    const R = ricciScalar(sphericalMetric(1), x);
    expect(R).toBeCloseTo(2, 0);
    expect(R).toBeGreaterThan(1.5);
    expect(R).toBeLessThan(2.5);
  });

  it("Ricci scalar ≈ 2 at θ=π/2 (equator)", () => {
    const x = [Math.PI / 2, 1.0];
    const R = ricciScalar(sphericalMetric(1), x);
    expect(R).toBeCloseTo(2, 0);
  });

  it("Ricci scalar scales as 2/R² for sphere of radius R=2: R scalar ≈ 0.5", () => {
    const x = [Math.PI / 3, 0.7];
    const R = ricciScalar(sphericalMetric(2), x);
    expect(R).toBeCloseTo(0.5, 0);
    expect(R).toBeGreaterThan(0.3);
    expect(R).toBeLessThan(0.7);
  });
});

// ─── ricciTensor — unit sphere ────────────────────────────────────────────────

describe("ricciTensor — unit sphere at θ=π/4", () => {
  const theta = Math.PI / 4;
  const x = [theta, 0.5];
  const metric = sphericalMetric(1);

  it("R_{θθ} ≈ 1 at θ=π/4 (analytic: g_{θθ} × R/2 = 1×1 = 1)", () => {
    // For a 2-sphere, R_{μν} = (R/2) g_{μν} = 1 × g_{μν}.
    // g_{θθ} = R² = 1 for unit sphere, so R_{θθ} = 1.
    const Ric = ricciTensor(metric, x);
    expect(Ric[0][0]).toBeCloseTo(1, 0);
    expect(Ric[0][0]).toBeGreaterThan(0.7);
    expect(Ric[0][0]).toBeLessThan(1.3);
  });

  it("R_{φφ} ≈ sin²θ at θ=π/4 (analytic: g_{φφ} = sin²θ ≈ 0.5)", () => {
    const Ric = ricciTensor(metric, x);
    const expected = Math.sin(theta) * Math.sin(theta); // ≈ 0.5
    expect(Ric[1][1]).toBeCloseTo(expected, 0);
    expect(Ric[1][1]).toBeGreaterThan(0.3);
    expect(Ric[1][1]).toBeLessThan(0.7);
  });

  it("off-diagonal R_{θφ} ≈ 0 (symmetry of the sphere)", () => {
    const Ric = ricciTensor(metric, x);
    expect(Math.abs(Ric[0][1])).toBeLessThan(0.1);
    expect(Math.abs(Ric[1][0])).toBeLessThan(0.1);
  });
});

// ─── einsteinTensor — 2D (must vanish) ───────────────────────────────────────

describe("einsteinTensor — 2D (must vanish identically)", () => {
  it("G_{μν} = 0 for unit sphere in 2D (in 2D: R_{μν} = (R/2) g_{μν} ⇒ G = 0)", () => {
    // In 2 dimensions R_{μν} = (R/2) g_{μν} is an exact algebraic identity,
    // so G_{μν} = R_{μν} − (1/2) R g_{μν} = 0 exactly (numerically near-zero).
    const theta = Math.PI / 4;
    const x = [theta, 0.5];
    const G = einsteinTensor(sphericalMetric(1), x);
    for (let mu = 0; mu < 2; mu++) {
      for (let nu = 0; nu < 2; nu++) {
        expect(Math.abs(G[mu][nu])).toBeLessThan(0.2);
      }
    }
  });

  it("G_{μν} ≈ 0 for flat Cartesian metric in 2D", () => {
    const x = [1.0, 0.5];
    const G = einsteinTensor(flatMetric2D, x);
    for (let mu = 0; mu < 2; mu++) {
      for (let nu = 0; nu < 2; nu++) {
        expect(Math.abs(G[mu][nu])).toBeLessThan(1e-2);
      }
    }
  });
});

// ─── einsteinTensor — symmetry ───────────────────────────────────────────────

describe("einsteinTensor — symmetry G_{μν} = G_{νμ}", () => {
  it("Einstein tensor is symmetric on the unit sphere", () => {
    const theta = Math.PI / 3;
    const x = [theta, 0.8];
    const G = einsteinTensor(sphericalMetric(1), x);
    for (let mu = 0; mu < 2; mu++) {
      for (let nu = 0; nu < 2; nu++) {
        // G_{μν} - G_{νμ} ≈ 0 (within numerical noise)
        expect(Math.abs(G[mu][nu] - G[nu][mu])).toBeLessThan(0.05);
      }
    }
  });
});

// ─── 3-sphere — non-trivial 3D case ──────────────────────────────────────────

describe("ricciTensor and einsteinTensor on 3-sphere of radius 1", () => {
  const x = [Math.PI / 3, Math.PI / 3, 0.5];

  it("ricciTensor returns a non-trivial 3×3 symmetric matrix", () => {
    const Ric = ricciTensor(threeSphereMetric, x);
    // The 3-sphere has constant positive curvature; Ricci tensor should have
    // large positive entries proportional to the metric components.
    expect(Ric.length).toBe(3);
    expect(Ric[0].length).toBe(3);
    // Diagonal entries should be non-zero (sphere has real curvature)
    const diagMax = Math.max(Math.abs(Ric[0][0]), Math.abs(Ric[1][1]), Math.abs(Ric[2][2]));
    expect(diagMax).toBeGreaterThan(0.1);
  });

  it("ricciTensor on 3-sphere is symmetric", () => {
    const Ric = ricciTensor(threeSphereMetric, x);
    for (let mu = 0; mu < 3; mu++) {
      for (let nu = 0; nu < 3; nu++) {
        expect(Math.abs(Ric[mu][nu] - Ric[nu][mu])).toBeLessThan(0.1);
      }
    }
  });

  it("einsteinTensor returns a 3×3 matrix and is symmetric on 3-sphere", () => {
    const G = einsteinTensor(threeSphereMetric, x);
    expect(G.length).toBe(3);
    for (let mu = 0; mu < 3; mu++) {
      for (let nu = 0; nu < 3; nu++) {
        expect(Math.abs(G[mu][nu] - G[nu][mu])).toBeLessThan(0.1);
      }
    }
  });
});
