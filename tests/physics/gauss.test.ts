import { describe, expect, it } from "vitest";
import {
  fluxThroughSphere,
  fieldFromSphericalSymmetry,
  fieldFromLineSymmetry,
  fieldFromPlaneSymmetry,
} from "@/lib/physics/gauss";
import { EPSILON_0, K_COULOMB } from "@/lib/physics/constants";

describe("fluxThroughSphere", () => {
  it("equals q / ε₀ at r = 1 m", () => {
    expect(fluxThroughSphere(1, 1)).toBeCloseTo(1 / EPSILON_0, 5);
  });

  it("is r-independent — same flux at r = 0.5, 2, and 100 m", () => {
    const q = 3.2e-9;
    const expected = q / EPSILON_0;
    expect(fluxThroughSphere(q, 0.5)).toBeCloseTo(expected, 8);
    expect(fluxThroughSphere(q, 2)).toBeCloseTo(expected, 8);
    expect(fluxThroughSphere(q, 100)).toBeCloseTo(expected, 8);
  });

  it("flips sign with the charge", () => {
    expect(fluxThroughSphere(-2, 1)).toBeCloseTo(-2 / EPSILON_0, 5);
  });
});

describe("fieldFromSphericalSymmetry", () => {
  it("recovers Coulomb's law at r = 1 m, q = 1 C", () => {
    // E = q / (4π ε₀ r²) = k_e · q / r² → k_e for unit q, unit r
    const E = fieldFromSphericalSymmetry(1, 1);
    expect(E).toBeCloseTo(K_COULOMB, -3); // k_e ≈ 8.99e9
    expect(E).toBeCloseTo(8.9875517873681764e9, -3);
  });

  it("falls as 1/r²", () => {
    const near = fieldFromSphericalSymmetry(1, 1);
    const far = fieldFromSphericalSymmetry(1, 2);
    expect(far / near).toBeCloseTo(0.25, 8);
  });

  it("throws for r ≤ 0", () => {
    expect(() => fieldFromSphericalSymmetry(1, 0)).toThrow();
    expect(() => fieldFromSphericalSymmetry(1, -1)).toThrow();
  });
});

describe("fieldFromLineSymmetry", () => {
  it("equals λ / (2π ε₀) at s = 1 m, λ = 1 C/m", () => {
    const E = fieldFromLineSymmetry(1, 1);
    expect(E).toBeCloseTo(1 / (2 * Math.PI * EPSILON_0), 5);
  });

  it("falls as 1/s — doubling distance halves the field", () => {
    const near = fieldFromLineSymmetry(1, 1);
    const far = fieldFromLineSymmetry(1, 2);
    expect(far / near).toBeCloseTo(0.5, 8);
  });

  it("throws for s ≤ 0", () => {
    expect(() => fieldFromLineSymmetry(1, 0)).toThrow();
  });
});

describe("fieldFromPlaneSymmetry", () => {
  it("equals σ / (2 ε₀) at σ = 1 C/m²", () => {
    expect(fieldFromPlaneSymmetry(1)).toBeCloseTo(1 / (2 * EPSILON_0), 5);
  });

  it("is distance-independent (no second argument needed)", () => {
    // Sanity: the function takes only sigma; same input → same output.
    expect(fieldFromPlaneSymmetry(2.5)).toBeCloseTo(2.5 / (2 * EPSILON_0), 5);
  });

  it("flips sign with σ", () => {
    expect(fieldFromPlaneSymmetry(-1)).toBeCloseTo(-1 / (2 * EPSILON_0), 5);
  });
});
