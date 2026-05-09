/**
 * §07 CHRISTOFFEL SYMBOLS AND PARALLEL TRANSPORT — unit tests.
 *
 * Tests cover christoffelSymbols, invertMetric, parallelTransportStep,
 * sphericalHolonomyAngle, and sphericalMetric against known analytic results.
 */

import { describe, expect, it } from "vitest";
import {
  christoffelSymbols,
  invertMetric,
  parallelTransportStep,
  sphericalHolonomyAngle,
  sphericalMetric,
} from "@/lib/physics/relativity/christoffel";

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

function norm2(v: readonly number[]): number {
  return Math.sqrt(v[0] * v[0] + v[1] * v[1]);
}

// ─── invertMetric ─────────────────────────────────────────────────────────────

describe("invertMetric", () => {
  it("inverse of the 2×2 identity is the identity", () => {
    const g = [
      [1, 0],
      [0, 1],
    ];
    const inv = invertMetric(g);
    expect(inv[0][0]).toBeCloseTo(1, 10);
    expect(inv[0][1]).toBeCloseTo(0, 10);
    expect(inv[1][0]).toBeCloseTo(0, 10);
    expect(inv[1][1]).toBeCloseTo(1, 10);
  });

  it("inverse of diag(2, 3) is diag(0.5, 1/3)", () => {
    const g = [
      [2, 0],
      [0, 3],
    ];
    const inv = invertMetric(g);
    expect(inv[0][0]).toBeCloseTo(0.5, 10);
    expect(inv[0][1]).toBeCloseTo(0, 10);
    expect(inv[1][0]).toBeCloseTo(0, 10);
    expect(inv[1][1]).toBeCloseTo(1 / 3, 10);
  });

  it("inverse of a 3×3 diagonal matrix", () => {
    const g = [
      [4, 0, 0],
      [0, 5, 0],
      [0, 0, 2],
    ];
    const inv = invertMetric(g);
    expect(inv[0][0]).toBeCloseTo(0.25, 10);
    expect(inv[1][1]).toBeCloseTo(0.2, 10);
    expect(inv[2][2]).toBeCloseTo(0.5, 10);
  });

  it("throws on a singular (zero determinant) matrix", () => {
    const g = [
      [1, 2],
      [2, 4],
    ];
    expect(() => invertMetric(g)).toThrow();
  });

  it("inverse of a non-diagonal symmetric 2×2 gives A·A⁻¹ ≈ I", () => {
    const g = [
      [3, 1],
      [1, 2],
    ];
    const inv = invertMetric(g);
    // Verify A · A⁻¹ = I
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        let sum = 0;
        for (let k = 0; k < 2; k++) sum += g[i][k] * inv[k][j];
        expect(sum).toBeCloseTo(i === j ? 1 : 0, 9);
      }
    }
  });
});

// ─── christoffelSymbols — flat Cartesian ─────────────────────────────────────

describe("christoffelSymbols — flat Cartesian metric", () => {
  it("all Christoffel symbols vanish for the flat 2D Euclidean metric", () => {
    const x = [1.2, 0.8];
    const Gamma = christoffelSymbols(flatMetric2D, x);
    for (let rho = 0; rho < 2; rho++) {
      for (let mu = 0; mu < 2; mu++) {
        for (let nu = 0; nu < 2; nu++) {
          expect(Math.abs(Gamma[rho][mu][nu])).toBeLessThan(1e-4);
        }
      }
    }
  });
});

// ─── christoffelSymbols — polar Euclidean metric ─────────────────────────────

describe("christoffelSymbols — polar Euclidean metric at r=1", () => {
  const x = [1, Math.PI / 4]; // r=1, φ=π/4

  it("Γ^r_{φφ} = -r = -1 at r=1", () => {
    const Gamma = christoffelSymbols(polarMetric2D, x);
    // rho=0 (r), mu=1 (φ), nu=1 (φ)
    expect(Gamma[0][1][1]).toBeCloseTo(-1, 3);
  });

  it("Γ^φ_{rφ} = 1/r = 1 at r=1", () => {
    const Gamma = christoffelSymbols(polarMetric2D, x);
    // rho=1 (φ), mu=0 (r), nu=1 (φ)
    expect(Gamma[1][0][1]).toBeCloseTo(1, 3);
  });

  it("Γ^φ_{φr} = 1/r = 1 at r=1 (symmetry in lower indices)", () => {
    const Gamma = christoffelSymbols(polarMetric2D, x);
    // rho=1 (φ), mu=1 (φ), nu=0 (r)
    expect(Gamma[1][1][0]).toBeCloseTo(1, 3);
  });

  it("Γ^r_{rr}, Γ^r_{rφ}, Γ^φ_{rr}, Γ^φ_{φφ} all vanish at r=1", () => {
    const Gamma = christoffelSymbols(polarMetric2D, x);
    expect(Math.abs(Gamma[0][0][0])).toBeLessThan(1e-3); // Γ^r_{rr}
    expect(Math.abs(Gamma[0][0][1])).toBeLessThan(1e-3); // Γ^r_{rφ}
    expect(Math.abs(Gamma[1][0][0])).toBeLessThan(1e-3); // Γ^φ_{rr}
    expect(Math.abs(Gamma[1][1][1])).toBeLessThan(1e-3); // Γ^φ_{φφ}
  });
});

// ─── christoffelSymbols — spherical metric ────────────────────────────────────

describe("christoffelSymbols — spherical metric (R=1)", () => {
  it("Γ^θ_{φφ} = -sin θ cos θ at θ=π/4", () => {
    const theta = Math.PI / 4;
    const x = [theta, 0.5];
    const Gamma = christoffelSymbols(sphericalMetric(1), x);
    // rho=0 (θ), mu=1 (φ), nu=1 (φ)
    const expected = -Math.sin(theta) * Math.cos(theta);
    expect(Gamma[0][1][1]).toBeCloseTo(expected, 3);
  });

  it("Γ^φ_{θφ} = cos θ / sin θ = cot θ at θ=π/4 for R=1", () => {
    const theta = Math.PI / 4;
    const x = [theta, 0.5];
    const Gamma = christoffelSymbols(sphericalMetric(1), x);
    // rho=1 (φ), mu=0 (θ), nu=1 (φ)
    const expected = Math.cos(theta) / Math.sin(theta);
    expect(Gamma[1][0][1]).toBeCloseTo(expected, 3);
  });
});

// ─── parallelTransportStep ────────────────────────────────────────────────────

describe("parallelTransportStep", () => {
  it("on a flat manifold (Γ=0) the vector is unchanged", () => {
    const V = [1, 0.5];
    const Gamma = [
      [
        [0, 0],
        [0, 0],
      ],
      [
        [0, 0],
        [0, 0],
      ],
    ];
    const dxdlambda = [1, 0];
    const result = parallelTransportStep(V, Gamma, dxdlambda, 0.1);
    expect(result[0]).toBeCloseTo(V[0], 12);
    expect(result[1]).toBeCloseTo(V[1], 12);
  });

  it("norm is preserved after many steps along equator of unit sphere", () => {
    // Transport V = [1, 0] (∂/∂θ direction) along the equator (θ = π/2, φ increasing).
    // Equator: x(λ) = (π/2, λ), dx/dλ = (0, 1).
    // Spherical metric at θ=π/2: g = diag(1, 1), so |V|² = 1 throughout.
    const metric = sphericalMetric(1);
    let V: readonly number[] = [1, 0];
    const steps = 400;
    const dPhi = (2 * Math.PI) / steps;

    // Compute initial metric norm at θ=π/2
    const theta = Math.PI / 2;
    const g0 = metric([theta, 0]);
    const initialNormSq = g0[0][0] * V[0] * V[0] + g0[1][1] * V[1] * V[1];

    for (let i = 0; i < steps; i++) {
      const phi = i * dPhi;
      const x = [theta, phi] as const;
      const Gamma = christoffelSymbols(metric, x);
      V = parallelTransportStep(V, Gamma, [0, 1], dPhi);
    }

    // Check metric norm at the end point (same θ=π/2)
    const gFinal = metric([theta, 0]);
    const finalNormSq = gFinal[0][0] * V[0] * V[0] + gFinal[1][1] * V[1] * V[1];
    // The Euler scheme accumulates some error; check within 10% for 400 steps.
    expect(Math.abs(Math.sqrt(finalNormSq) - Math.sqrt(initialNormSq)) / Math.sqrt(initialNormSq)).toBeLessThan(0.1);
  });
});

// ─── sphericalHolonomyAngle ───────────────────────────────────────────────────

describe("sphericalHolonomyAngle", () => {
  it("an octant (area = π/2) on R=1 gives holonomy angle π/2", () => {
    // A spherical right-angle triangle with all three angles = π/2 encloses 1/8 of a unit sphere.
    // Area of unit sphere = 4π; one octant = 4π/8 = π/2.
    const angle = sphericalHolonomyAngle(Math.PI / 2, 1);
    expect(angle).toBeCloseTo(Math.PI / 2, 10);
  });

  it("enclosed area = π on R=1 returns π", () => {
    const angle = sphericalHolonomyAngle(Math.PI, 1);
    expect(angle).toBeCloseTo(Math.PI, 10);
  });

  it("scales correctly with R: same area A, holonomy = A/R²", () => {
    const A = 1.5;
    const R = 2;
    const angle = sphericalHolonomyAngle(A, R);
    expect(angle).toBeCloseTo(A / (R * R), 10);
  });

  it("zero area gives zero holonomy (flat loop)", () => {
    expect(sphericalHolonomyAngle(0, 1)).toBeCloseTo(0, 12);
  });

  it("parallel transport along a closed loop on a flat manifold returns original vector (zero holonomy)", () => {
    // A rectangle in flat 2D Cartesian coordinates — holonomy = 0.
    const metric = flatMetric2D;
    let V: readonly number[] = [1, 0];
    const steps = 50;

    // Side 1: move along x from (0,0) to (1,0)
    for (let i = 0; i < steps; i++) {
      const x = [(i / steps) * 1, 0] as const;
      const Gamma = christoffelSymbols(metric, x);
      V = parallelTransportStep(V, Gamma, [1, 0], 1 / steps);
    }
    // Side 2: move along y from (1,0) to (1,1)
    for (let i = 0; i < steps; i++) {
      const x = [1, (i / steps) * 1] as const;
      const Gamma = christoffelSymbols(metric, x);
      V = parallelTransportStep(V, Gamma, [0, 1], 1 / steps);
    }
    // Side 3: move along x from (1,1) to (0,1)
    for (let i = 0; i < steps; i++) {
      const x = [1 - (i / steps) * 1, 1] as const;
      const Gamma = christoffelSymbols(metric, x);
      V = parallelTransportStep(V, Gamma, [-1, 0], 1 / steps);
    }
    // Side 4: move along y from (0,1) to (0,0)
    for (let i = 0; i < steps; i++) {
      const x = [0, 1 - (i / steps) * 1] as const;
      const Gamma = christoffelSymbols(metric, x);
      V = parallelTransportStep(V, Gamma, [0, -1], 1 / steps);
    }

    // After the full loop in flat space, V should return to [1, 0].
    expect(V[0]).toBeCloseTo(1, 4);
    expect(V[1]).toBeCloseTo(0, 4);
  });
});
