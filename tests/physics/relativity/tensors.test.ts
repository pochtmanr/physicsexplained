import { describe, expect, it } from "vitest";
import {
  tensorComponentCount,
  transformContravariant,
  transformCovariant,
  lowerIndex,
  raiseIndex,
  invertMatrix2,
} from "@/lib/physics/relativity/tensors";

// ─── tensorComponentCount ───────────────────────────────────────────────────

describe("tensorComponentCount", () => {
  it("vector in 4D: (1,0,4) = 4", () => {
    expect(tensorComponentCount(1, 0, 4)).toBe(4);
  });

  it("covector in 4D: (0,1,4) = 4", () => {
    expect(tensorComponentCount(0, 1, 4)).toBe(4);
  });

  it("scalar: (0,0,4) = 1", () => {
    expect(tensorComponentCount(0, 0, 4)).toBe(1);
  });

  it("(2,2,4) = 256 — Riemann-class rank", () => {
    expect(tensorComponentCount(2, 2, 4)).toBe(256);
  });

  it("metric (0,2,4) = 16", () => {
    expect(tensorComponentCount(0, 2, 4)).toBe(16);
  });

  it("throws on negative p", () => {
    expect(() => tensorComponentCount(-1, 0, 4)).toThrow(RangeError);
  });

  it("throws on negative q", () => {
    expect(() => tensorComponentCount(0, -1, 4)).toThrow(RangeError);
  });

  it("throws on non-positive n", () => {
    expect(() => tensorComponentCount(1, 0, 0)).toThrow(RangeError);
    expect(() => tensorComponentCount(1, 0, -3)).toThrow(RangeError);
  });

  it("throws on non-integer p", () => {
    expect(() => tensorComponentCount(1.5, 0, 4)).toThrow(RangeError);
  });
});

// ─── transformContravariant ─────────────────────────────────────────────────

describe("transformContravariant", () => {
  it("identity Jacobian: vector is unchanged", () => {
    const I = [
      [1, 0],
      [0, 1],
    ] as const;
    const V = [3, 7] as const;
    const result = transformContravariant(I, V);
    expect(result[0]).toBeCloseTo(3, 10);
    expect(result[1]).toBeCloseTo(7, 10);
  });

  it("2D rotation by 90° rotates (1,0) → (0,1)", () => {
    const theta = Math.PI / 2;
    const J = [
      [Math.cos(theta), -Math.sin(theta)],
      [Math.sin(theta), Math.cos(theta)],
    ] as const;
    const V = [1, 0] as const;
    const result = transformContravariant(J, V);
    expect(result[0]).toBeCloseTo(0, 10);
    expect(result[1]).toBeCloseTo(1, 10);
  });

  it("2D rotation by 45° rotates (1,0) → (√2/2, √2/2)", () => {
    const theta = Math.PI / 4;
    const J = [
      [Math.cos(theta), -Math.sin(theta)],
      [Math.sin(theta), Math.cos(theta)],
    ] as const;
    const V = [1, 0] as const;
    const result = transformContravariant(J, V);
    expect(result[0]).toBeCloseTo(Math.SQRT2 / 2, 10);
    expect(result[1]).toBeCloseTo(Math.SQRT2 / 2, 10);
  });

  it("throws when Jacobian row count doesn't match vector length", () => {
    const J = [[1, 0, 0]] as const;
    const V = [1, 2] as const;
    expect(() => transformContravariant(J, V)).toThrow();
  });
});

// ─── transformCovariant ──────────────────────────────────────────────────────

describe("transformCovariant", () => {
  it("identity inverse-Jacobian: covector is unchanged", () => {
    const I = [
      [1, 0],
      [0, 1],
    ] as const;
    const omega = [5, -3] as const;
    const result = transformCovariant(I, omega);
    expect(result[0]).toBeCloseTo(5, 10);
    expect(result[1]).toBeCloseTo(-3, 10);
  });

  it("scalar contraction is invariant: V'^a ω'_a = V^a ω_a", () => {
    const theta = 0.7;
    // Rotation Jacobian
    const J = [
      [Math.cos(theta), -Math.sin(theta)],
      [Math.sin(theta), Math.cos(theta)],
    ] as const;
    // Inverse (transpose for rotation)
    const Jinv = [
      [Math.cos(theta), Math.sin(theta)],
      [-Math.sin(theta), Math.cos(theta)],
    ] as const;
    const V = [3, 4] as const;
    const omega = [1, -2] as const;
    const Vprime = transformContravariant(J, V);
    const omegaPrime = transformCovariant(Jinv, omega);
    // Contraction before and after must match
    const before = V[0] * omega[0] + V[1] * omega[1];
    const after = Vprime[0] * omegaPrime[0] + Vprime[1] * omegaPrime[1];
    expect(after).toBeCloseTo(before, 10);
  });
});

// ─── lowerIndex ──────────────────────────────────────────────────────────────

describe("lowerIndex", () => {
  it("Minkowski metric lowers (E/c, p_x, 0, 0) → (E/c, -p_x, 0, 0)", () => {
    // η = diag(1,-1,-1,-1)
    const eta = [
      [1, 0, 0, 0],
      [0, -1, 0, 0],
      [0, 0, -1, 0],
      [0, 0, 0, -1],
    ] as const;
    const E_over_c = 5;
    const px = 3;
    const V = [E_over_c, px, 0, 0] as const;
    const lowered = lowerIndex(eta, V);
    expect(lowered[0]).toBeCloseTo(E_over_c, 10);
    expect(lowered[1]).toBeCloseTo(-px, 10);
    expect(lowered[2]).toBeCloseTo(0, 10);
    expect(lowered[3]).toBeCloseTo(0, 10);
  });

  it("flat Euclidean metric (identity) leaves components unchanged", () => {
    const I = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ] as const;
    const V = [1, 2, 3] as const;
    const lowered = lowerIndex(I, V);
    expect(lowered[0]).toBeCloseTo(1, 10);
    expect(lowered[1]).toBeCloseTo(2, 10);
    expect(lowered[2]).toBeCloseTo(3, 10);
  });
});

// ─── raiseIndex ──────────────────────────────────────────────────────────────

describe("raiseIndex", () => {
  it("raiseIndex(lowerIndex(V)) = V when gInv·g = I  (Minkowski)", () => {
    const eta = [
      [1, 0, 0, 0],
      [0, -1, 0, 0],
      [0, 0, -1, 0],
      [0, 0, 0, -1],
    ] as const;
    // η^{-1} = η for the Minkowski metric
    const etaInv = eta;
    const V = [2, 3, -1, 4] as const;
    const lowered = lowerIndex(eta, V);
    const raised = raiseIndex(etaInv, lowered);
    for (let i = 0; i < 4; i++) {
      expect(raised[i]).toBeCloseTo(V[i], 10);
    }
  });

  it("spherical metric: g^{φφ} = 1/(r² sin²θ) amplifies the φ-component", () => {
    const r = 2;
    const theta = Math.PI / 4; // 45°
    const sin2 = Math.sin(theta) ** 2;
    // g_{μν} = diag(1, r², r² sin²θ) for (r, θ, φ) coordinates on a sphere
    const gDiag = [1, r * r, r * r * sin2];
    const gInvDiag = gDiag.map((d) => 1 / d);
    const gInv = [
      [gInvDiag[0], 0, 0],
      [0, gInvDiag[1], 0],
      [0, 0, gInvDiag[2]],
    ] as const;
    // Unit covector ω_μ = (0, 0, 1) — purely in the φ direction
    const omega = [0, 0, 1] as const;
    const raised = raiseIndex(gInv, omega);
    // raised[2] should be g^{φφ} = 1/(r² sin²θ)
    const expected = 1 / (r * r * sin2);
    expect(raised[0]).toBeCloseTo(0, 10);
    expect(raised[1]).toBeCloseTo(0, 10);
    expect(raised[2]).toBeCloseTo(expected, 8);
  });
});

// ─── invertMatrix2 ───────────────────────────────────────────────────────────

describe("invertMatrix2", () => {
  it("identity inverts to identity", () => {
    const I = [
      [1, 0],
      [0, 1],
    ] as const;
    const inv = invertMatrix2(I);
    expect(inv[0][0]).toBeCloseTo(1, 10);
    expect(inv[0][1]).toBeCloseTo(0, 10);
    expect(inv[1][0]).toBeCloseTo(0, 10);
    expect(inv[1][1]).toBeCloseTo(1, 10);
  });

  it("[[2,0],[0,3]] inverts to [[0.5,0],[0,1/3]]", () => {
    const M = [
      [2, 0],
      [0, 3],
    ] as const;
    const inv = invertMatrix2(M);
    expect(inv[0][0]).toBeCloseTo(0.5, 10);
    expect(inv[0][1]).toBeCloseTo(0, 10);
    expect(inv[1][0]).toBeCloseTo(0, 10);
    expect(inv[1][1]).toBeCloseTo(1 / 3, 10);
  });

  it("M · M⁻¹ = I for a general matrix", () => {
    const M = [
      [3, 1],
      [2, 4],
    ] as const;
    const inv = invertMatrix2(M);
    // (M · inv)[0][0] = 1, [0][1] = 0, [1][0] = 0, [1][1] = 1
    const r00 = M[0][0] * inv[0][0] + M[0][1] * inv[1][0];
    const r01 = M[0][0] * inv[0][1] + M[0][1] * inv[1][1];
    const r10 = M[1][0] * inv[0][0] + M[1][1] * inv[1][0];
    const r11 = M[1][0] * inv[0][1] + M[1][1] * inv[1][1];
    expect(r00).toBeCloseTo(1, 10);
    expect(r01).toBeCloseTo(0, 10);
    expect(r10).toBeCloseTo(0, 10);
    expect(r11).toBeCloseTo(1, 10);
  });

  it("throws on singular matrix [[1,2],[2,4]]", () => {
    const singular = [
      [1, 2],
      [2, 4],
    ] as const;
    expect(() => invertMatrix2(singular)).toThrow(RangeError);
  });

  it("throws on zero matrix", () => {
    const zero = [
      [0, 0],
      [0, 0],
    ] as const;
    expect(() => invertMatrix2(zero)).toThrow(RangeError);
  });
});
