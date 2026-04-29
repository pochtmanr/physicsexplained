import { describe, expect, it } from "vitest";
import {
  predictedFringeShift,
  predictedFringeShiftAtAngle,
  expectedNullThreshold,
  isPredictionAboveNoise,
  EARTH_ORBITAL_SPEED,
  SODIUM_D_WAVELENGTH,
  MICHELSON_1887_ARM_LENGTH,
} from "@/lib/physics/relativity/michelson-morley";
import { SPEED_OF_LIGHT } from "@/lib/physics/constants";

describe("predictedFringeShift", () => {
  it("matches the 1887 canonical figure (L=11 m, λ=589 nm, v=30 km/s) ≈ 0.37 fringes", () => {
    const dn = predictedFringeShift(
      MICHELSON_1887_ARM_LENGTH,
      SODIUM_D_WAVELENGTH,
      EARTH_ORBITAL_SPEED,
      SPEED_OF_LIGHT,
    );
    // Closed-form: 2·11/5.89e-7 · (2.978e4)² / c²
    expect(dn).toBeGreaterThan(0.36);
    expect(dn).toBeLessThan(0.38);
  });

  it("scales linearly in L", () => {
    const dn1 = predictedFringeShift(11, 5.89e-7, 3e4);
    const dn2 = predictedFringeShift(22, 5.89e-7, 3e4);
    expect(dn2 / dn1).toBeCloseTo(2, 12);
  });

  it("scales inversely in λ", () => {
    const dn1 = predictedFringeShift(11, 5.89e-7, 3e4);
    const dn2 = predictedFringeShift(11, 2 * 5.89e-7, 3e4);
    expect(dn1 / dn2).toBeCloseTo(2, 12);
  });

  it("scales quadratically in v", () => {
    const dn1 = predictedFringeShift(11, 5.89e-7, 3e4);
    const dn2 = predictedFringeShift(11, 6e4, 5.89e-7);
    // Reuse same scenario with double v — the cleaner check:
    const dnHalf = predictedFringeShift(11, 5.89e-7, 1.5e4);
    expect(dn1 / dnHalf).toBeCloseTo(4, 12);
  });

  it("vanishes at v = 0 (no aether wind = no shift)", () => {
    expect(predictedFringeShift(11, 5.89e-7, 0)).toBe(0);
  });

  it("throws on non-positive L, λ, or c", () => {
    expect(() => predictedFringeShift(0, 5.89e-7, 3e4)).toThrow(RangeError);
    expect(() => predictedFringeShift(11, 0, 3e4)).toThrow(RangeError);
    expect(() => predictedFringeShift(11, 5.89e-7, 3e4, 0)).toThrow(RangeError);
  });
});

describe("predictedFringeShiftAtAngle", () => {
  it("equals peak prediction at θ = 0 (cos 0 = 1)", () => {
    const peak = predictedFringeShift(11, 5.89e-7, 3e4);
    const at0 = predictedFringeShiftAtAngle(11, 5.89e-7, 3e4, 0);
    expect(at0).toBeCloseTo(peak, 12);
  });

  it("vanishes at θ = π/4 (cos(π/2) = 0) — arms equivalent under 45° rotation", () => {
    const at45 = predictedFringeShiftAtAngle(11, 5.89e-7, 3e4, Math.PI / 4);
    expect(Math.abs(at45)).toBeLessThan(1e-15);
  });

  it("flips sign at θ = π/2 (the two arms exchange roles)", () => {
    const peak = predictedFringeShift(11, 5.89e-7, 3e4);
    const at90 = predictedFringeShiftAtAngle(11, 5.89e-7, 3e4, Math.PI / 2);
    expect(at90).toBeCloseTo(-peak, 10);
  });

  it("is π-periodic (Δn(θ + π) = Δn(θ))", () => {
    const a = predictedFringeShiftAtAngle(11, 5.89e-7, 3e4, 0.37);
    const b = predictedFringeShiftAtAngle(11, 5.89e-7, 3e4, 0.37 + Math.PI);
    expect(a).toBeCloseTo(b, 10);
  });
});

describe("expectedNullThreshold", () => {
  it("returns the 1887 historical 0.01-fringe noise floor by default", () => {
    expect(expectedNullThreshold()).toBe(0.01);
  });

  it("accepts a caller-supplied bound (modern cavity repeats push much lower)", () => {
    expect(expectedNullThreshold(1e-17)).toBe(1e-17);
  });

  it("throws on negative threshold", () => {
    expect(() => expectedNullThreshold(-0.001)).toThrow(RangeError);
  });
});

describe("isPredictionAboveNoise — the rupture", () => {
  it("predicted shift is ~37× the noise floor for the 1887 setup", () => {
    const dn = predictedFringeShift(
      MICHELSON_1887_ARM_LENGTH,
      SODIUM_D_WAVELENGTH,
      EARTH_ORBITAL_SPEED,
    );
    // The aether prediction was an order-of-magnitude clear of the noise.
    expect(isPredictionAboveNoise(dn)).toBe(true);
    expect(dn / expectedNullThreshold()).toBeGreaterThan(30);
  });

  it("a hypothetical observed shift of zero falls below the threshold", () => {
    expect(isPredictionAboveNoise(0)).toBe(false);
  });
});
