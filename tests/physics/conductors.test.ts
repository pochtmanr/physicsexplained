import { describe, it, expect } from "vitest";
import {
  surfaceFieldFromSigma,
  induceChargeOnPlane,
} from "@/lib/physics/conductors";
import { EPSILON_0 } from "@/lib/physics/constants";

describe("surfaceFieldFromSigma", () => {
  it("σ = ε₀ → E = 1 V/m (the unit-test of σ/ε₀)", () => {
    expect(surfaceFieldFromSigma(EPSILON_0)).toBeCloseTo(1, 12);
  });

  it("σ = 0 → E = 0 (no charge on the surface, no field outside)", () => {
    expect(surfaceFieldFromSigma(0)).toBe(0);
  });

  it("flips sign with σ — a negative surface charge points the field inward", () => {
    const sigma = 4.2e-9;
    expect(surfaceFieldFromSigma(-sigma)).toBeCloseTo(
      -surfaceFieldFromSigma(sigma),
      18,
    );
  });

  it("scales linearly: 3× the charge density gives 3× the field", () => {
    const base = surfaceFieldFromSigma(1e-9);
    expect(surfaceFieldFromSigma(3e-9)).toBeCloseTo(3 * base, 18);
  });
});

describe("induceChargeOnPlane", () => {
  it("E_ext = 1 V/m on A = 1 m² → Q_ind = ε₀ C", () => {
    expect(induceChargeOnPlane(1, 1)).toBeCloseTo(EPSILON_0, 24);
  });

  it("zero field induces zero charge", () => {
    expect(induceChargeOnPlane(0, 5)).toBe(0);
    expect(induceChargeOnPlane(1000, 0)).toBe(0);
  });

  it("induced charge is linear in both field and area", () => {
    const base = induceChargeOnPlane(1, 1);
    expect(induceChargeOnPlane(2, 3)).toBeCloseTo(6 * base, 24);
  });

  it("round-trip: σ from induceChargeOnPlane reproduces E via surfaceFieldFromSigma", () => {
    // Apply E_ext = 5 V/m to a 2 m² plane. Induced σ = Q/A should be such
    // that surfaceFieldFromSigma(σ) = 5 V/m — the induced sheet exactly
    // cancels the applied field inside the conductor.
    const E = 5;
    const A = 2;
    const sigma = induceChargeOnPlane(E, A) / A;
    expect(surfaceFieldFromSigma(sigma)).toBeCloseTo(E, 12);
  });
});
