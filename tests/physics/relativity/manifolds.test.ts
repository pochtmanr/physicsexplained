/**
 * §07 MANIFOLDS AND TANGENT SPACES — unit tests.
 *
 * Tests cover sphereEmbedding, pushforwardJacobian, and pushforward
 * against known analytic results on the sphere and on a flat plane.
 */

import { describe, expect, it } from "vitest";
import {
  sphereEmbedding,
  pushforwardJacobian,
  pushforward,
  type Embedding3D,
} from "@/lib/physics/relativity/manifolds";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dot3(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function norm3(v: readonly [number, number, number]): number {
  return Math.sqrt(dot3(v, v));
}

// ─── sphereEmbedding ──────────────────────────────────────────────────────────

describe("sphereEmbedding", () => {
  it("at (π/2, 0) the point lies on the positive-x axis at radius R", () => {
    const R = 2.5;
    const embed = sphereEmbedding(R);
    const [x, y, z] = embed(Math.PI / 2, 0);
    expect(x).toBeCloseTo(R, 6);
    expect(y).toBeCloseTo(0, 6);
    expect(z).toBeCloseTo(0, 6);
  });

  it("at the north pole (u = 0) the point is (0, 0, R) for any v", () => {
    const R = 1;
    const embed = sphereEmbedding(R);
    // v should not matter at u = 0 because sin(0) = 0
    for (const v of [0, 1.1, 2.3, Math.PI]) {
      const [x, y, z] = embed(0, v);
      expect(x).toBeCloseTo(0, 6);
      expect(y).toBeCloseTo(0, 6);
      expect(z).toBeCloseTo(R, 6);
    }
  });

  it("at the south pole (u = π) the point is (0, 0, -R)", () => {
    const R = 3;
    const embed = sphereEmbedding(R);
    const [x, y, z] = embed(Math.PI, 0);
    expect(x).toBeCloseTo(0, 5);
    expect(y).toBeCloseTo(0, 5);
    expect(z).toBeCloseTo(-R, 5);
  });

  it("every point on the sphere has magnitude R (point is on the surface)", () => {
    const R = 1.7;
    const embed = sphereEmbedding(R);
    const samples = [
      [0.3, 0.5],
      [Math.PI / 2, 1.2],
      [2.1, 4.7],
      [Math.PI / 4, Math.PI],
    ] as [number, number][];
    for (const [u, v] of samples) {
      const p = embed(u, v);
      expect(norm3(p)).toBeCloseTo(R, 5);
    }
  });
});

// ─── pushforwardJacobian ──────────────────────────────────────────────────────

describe("pushforwardJacobian", () => {
  it("columns at the equator (u = π/2) of a unit sphere are orthogonal: ∂_u · ∂_v ≈ 0", () => {
    const embed = sphereEmbedding(1);
    const [eu, ev] = pushforwardJacobian(embed, Math.PI / 2, 0.5);
    expect(dot3(eu, ev)).toBeCloseTo(0, 3);
  });

  it("|∂_u| ≈ R on a sphere of radius R (Lamé coefficient h_u = R)", () => {
    const R = 2;
    const embed = sphereEmbedding(R);
    // At any (u, v) the meridional tangent vector has magnitude R
    const [eu] = pushforwardJacobian(embed, Math.PI / 3, 1.0);
    expect(norm3(eu)).toBeCloseTo(R, 2);
  });

  it("|∂_v| ≈ R sin u (Lamé coefficient h_φ = R sin θ)", () => {
    const R = 1;
    const embed = sphereEmbedding(R);
    const u = Math.PI / 4;
    const [, ev] = pushforwardJacobian(embed, u, 0.8);
    expect(norm3(ev)).toBeCloseTo(R * Math.sin(u), 2);
  });
});

// ─── pushforward ──────────────────────────────────────────────────────────────

describe("pushforward", () => {
  it("(du=1, dv=0) at u=π/2 on a unit sphere points in the z-direction (north)", () => {
    // ∂_u at the equator (u=π/2, v=0) should be approximately (cos u cos v, cos u sin v, -sin u)
    // At u=π/2, v=0: (0, 0, -1) — pointing south along the sphere surface.
    const embed = sphereEmbedding(1);
    const pf = pushforward(embed, Math.PI / 2, 0, 1, 0);
    // The pushforward of ∂_u at the equator lies along the z-axis.
    expect(Math.abs(pf[0])).toBeLessThan(0.01);
    expect(Math.abs(pf[1])).toBeLessThan(0.01);
    expect(Math.abs(pf[2])).toBeCloseTo(1, 2);
  });

  it("is linear: pushforward(2 du, 3 dv) = 2·pushforward(du,0) + 3·pushforward(0,dv)", () => {
    const embed = sphereEmbedding(1);
    const u = 1.2;
    const v = 0.7;
    const combined = pushforward(embed, u, v, 2, 3);
    const pU = pushforward(embed, u, v, 1, 0);
    const pV = pushforward(embed, u, v, 0, 1);
    const expected = [
      2 * pU[0] + 3 * pV[0],
      2 * pU[1] + 3 * pV[1],
      2 * pU[2] + 3 * pV[2],
    ] as const;
    expect(combined[0]).toBeCloseTo(expected[0], 5);
    expect(combined[1]).toBeCloseTo(expected[1], 5);
    expect(combined[2]).toBeCloseTo(expected[2], 5);
  });

  it("on a flat z=0 plane embedding (u,v) → (u,v,0) the pushforward of (1,0) is (1,0,0)", () => {
    const flatPlane: Embedding3D = (u, v) => [u, v, 0] as const;
    const pf = pushforward(flatPlane, 1.5, 2.3, 1, 0);
    expect(pf[0]).toBeCloseTo(1, 5);
    expect(pf[1]).toBeCloseTo(0, 5);
    expect(pf[2]).toBeCloseTo(0, 5);
  });

  it("on a flat z=0 plane embedding, pushforward of (0,1) is (0,1,0)", () => {
    const flatPlane: Embedding3D = (u, v) => [u, v, 0] as const;
    const pf = pushforward(flatPlane, 0.5, 0.5, 0, 1);
    expect(pf[0]).toBeCloseTo(0, 5);
    expect(pf[1]).toBeCloseTo(1, 5);
    expect(pf[2]).toBeCloseTo(0, 5);
  });

  it("on a flat plane, scaling the vector scales the pushforward proportionally", () => {
    const flatPlane: Embedding3D = (u, v) => [u, v, 0] as const;
    const s = 5.3;
    const base = pushforward(flatPlane, 1, 1, 1, 0);
    const scaled = pushforward(flatPlane, 1, 1, s, 0);
    expect(scaled[0]).toBeCloseTo(s * base[0], 5);
    expect(scaled[1]).toBeCloseTo(s * base[1], 5);
    expect(scaled[2]).toBeCloseTo(s * base[2], 5);
  });

  it("on a cylinder embedding (u,v) → (cos v, sin v, u) the ∂_u column is (0, 0, 1)", () => {
    const cylinder: Embedding3D = (u, v) => [Math.cos(v), Math.sin(v), u] as const;
    const pf = pushforward(cylinder, 1.0, 0.4, 1, 0);
    expect(pf[0]).toBeCloseTo(0, 3);
    expect(pf[1]).toBeCloseTo(0, 3);
    expect(pf[2]).toBeCloseTo(1, 3);
  });

  it("on a cylinder embedding the ∂_v column at v=0 is (0, 1, 0)", () => {
    const cylinder: Embedding3D = (u, v) => [Math.cos(v), Math.sin(v), u] as const;
    const pf = pushforward(cylinder, 0.5, 0, 0, 1);
    // d/dv (cos v, sin v, u) at v=0 = (-sin 0, cos 0, 0) = (0, 1, 0)
    expect(pf[0]).toBeCloseTo(0, 3);
    expect(pf[1]).toBeCloseTo(1, 3);
    expect(pf[2]).toBeCloseTo(0, 3);
  });

  it("pushforward at the north pole reduces to the xy-plane (∂_u points along -z axis)", () => {
    // Near the north pole (u≈0), ∂_u = (cos u cos v, cos u sin v, -sin u) → (cos v, sin v, 0)
    // For a unit sphere at (u = 0.01, v = 0): ∂_u ≈ (1, 0, 0) pointing in x-y plane
    const embed = sphereEmbedding(1);
    const pf = pushforward(embed, 0.01, 0, 1, 0);
    // z-component should be very small (≈ -sin(0.01) ≈ -0.01)
    expect(Math.abs(pf[2])).toBeLessThan(0.02);
  });
});
