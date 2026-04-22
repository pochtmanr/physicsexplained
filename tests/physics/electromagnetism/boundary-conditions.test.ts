import { describe, it, expect } from "vitest";
import {
  tangentialEContinuity,
  normalEJump,
  tangentialDJump,
  normalDContinuity,
  dielectricRefraction,
} from "@/lib/physics/electromagnetism/boundary-conditions";
import { EPSILON_0 } from "@/lib/physics/constants";

describe("tangentialEContinuity", () => {
  it("returns the input unchanged (identity — pedagogical)", () => {
    expect(tangentialEContinuity(0)).toBe(0);
    expect(tangentialEContinuity(123.456)).toBe(123.456);
    expect(tangentialEContinuity(-7e3)).toBe(-7e3);
  });
});

describe("normalEJump", () => {
  it("with σ_free = 0 and equal κ, normal E is unchanged", () => {
    expect(normalEJump(500, 0, 4, 4)).toBeCloseTo(500, 9);
  });

  it("with σ_free = 0, normal E scales by κ₁/κ₂", () => {
    // Going from κ₁ = 1 (vacuum) into κ₂ = 4 should reduce normal E by 4×.
    expect(normalEJump(800, 0, 1, 4)).toBeCloseTo(200, 9);

    // Going the other way: κ₁ = 4 → κ₂ = 1 multiplies normal E by 4.
    expect(normalEJump(200, 0, 4, 1)).toBeCloseTo(800, 9);
  });

  it("σ_free contributes a +σ/ε₀ jump (with the right sign convention)", () => {
    // With κ₁ = κ₂ = 1 and E₁_n = 0, the jump should give E₂_n = -σ/ε₀.
    const sigma = 2 * EPSILON_0; // chosen so σ/ε₀ = 2 V/m
    expect(normalEJump(0, sigma, 1, 1)).toBeCloseTo(-2, 9);
  });

  it("recovers the conductor surface case (κ₁ → 0 inside the conductor, σ on surface)", () => {
    // Inside a conductor E = 0, so κ₁·E₁_n = 0. Outside is vacuum (κ₂ = 1).
    // Then E₂_n = -σ_free / ε₀. (Sign because our normal points 2→1; flipping
    // the convention gives the textbook +σ/ε₀.)
    const sigma = 5 * EPSILON_0;
    expect(normalEJump(0, sigma, 0, 1)).toBeCloseTo(-5, 9);
  });
});

describe("tangentialDJump", () => {
  it("with equal κ, D_t is unchanged", () => {
    expect(tangentialDJump(1e-9, 3, 3)).toBeCloseTo(1e-9, 18);
  });

  it("scales by the κ-ratio", () => {
    // Doubling κ on side 2 doubles D_t (because E_t was held constant).
    expect(tangentialDJump(1e-9, 1, 2)).toBeCloseTo(2e-9, 18);
    expect(tangentialDJump(4e-9, 4, 1)).toBeCloseTo(1e-9, 18);
  });
});

describe("normalDContinuity", () => {
  it("with no free surface charge, D_n is identical on both sides", () => {
    expect(normalDContinuity(7e-9)).toBeCloseTo(7e-9, 18);
    expect(normalDContinuity(7e-9, 0)).toBeCloseTo(7e-9, 18);
  });

  it("free surface charge produces an exact jump of σ_free", () => {
    expect(normalDContinuity(1e-6, 4e-7)).toBeCloseTo(6e-7, 18);
  });
});

describe("dielectricRefraction", () => {
  it("normal incidence stays normal", () => {
    expect(dielectricRefraction(0, 1, 5)).toBe(0);
  });

  it("equal κ — no bending", () => {
    const t = 0.7; // arbitrary angle in radians
    expect(dielectricRefraction(t, 4, 4)).toBeCloseTo(t, 12);
  });

  it("obeys tan θ₂ / tan θ₁ = κ₂ / κ₁", () => {
    const t1 = Math.PI / 4; // 45°
    const k1 = 1;
    const k2 = 3;
    const t2 = dielectricRefraction(t1, k1, k2);
    expect(Math.tan(t2) / Math.tan(t1)).toBeCloseTo(k2 / k1, 12);
  });

  it("bending is symmetric in sign (a left-tilted line bends like a right one)", () => {
    const a = Math.PI / 6;
    expect(dielectricRefraction(a, 1, 4)).toBeCloseTo(
      -dielectricRefraction(-a, 1, 4),
      12,
    );
  });

  it("going into a denser medium tilts the line further from the normal", () => {
    const t1 = Math.PI / 6; // 30°
    const t2 = dielectricRefraction(t1, 1, 5);
    expect(t2).toBeGreaterThan(t1);
  });

  it("going into a less dense medium pulls the line toward the normal", () => {
    const t1 = Math.PI / 3; // 60°
    const t2 = dielectricRefraction(t1, 5, 1);
    expect(t2).toBeLessThan(t1);
  });

  it("inverse pair: refracting back through the inverse κ-ratio recovers θ₁", () => {
    const t1 = 0.4;
    const t2 = dielectricRefraction(t1, 1, 4);
    const t3 = dielectricRefraction(t2, 4, 1);
    expect(t3).toBeCloseTo(t1, 12);
  });
});
