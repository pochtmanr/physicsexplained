import { describe, expect, it } from "vitest";
import { SPEED_OF_LIGHT, g_SI } from "@/lib/physics/constants";
import {
  gravitationalRedshiftFractional,
  compensatingDopplerVelocity,
  POUND_REBKA_PREDICTED,
  POUND_REBKA_MEASURED,
  POUND_REBKA_MEASUREMENT_ERROR,
  POUND_SNIDER_RATIO,
  POUND_SNIDER_RATIO_ERROR,
} from "@/lib/physics/relativity/gravitational-redshift";

describe("gravitationalRedshiftFractional", () => {
  it("Pound-Rebka 1960: 22.5 m tower predicts Δν/ν ≈ 2.46 × 10⁻¹⁵", () => {
    // g h / c² = 9.80665 × 22.5 / (2.99792458e8)² ≈ 2.4538e-15
    const predicted = gravitationalRedshiftFractional(22.5);
    expect(predicted).toBeGreaterThan(2.45e-15);
    expect(predicted).toBeLessThan(2.46e-15);
  });

  it("scales linearly in h (twice as tall → twice the shift)", () => {
    const a = gravitationalRedshiftFractional(10);
    const b = gravitationalRedshiftFractional(20);
    expect(b).toBeCloseTo(2 * a, 25);
  });

  it("at h = 0 the redshift is exactly 0 (no climb, no shift)", () => {
    expect(gravitationalRedshiftFractional(0)).toBe(0);
  });

  it("scales as 1/c² — doubling c quarters the shift", () => {
    const a = gravitationalRedshiftFractional(22.5, g_SI, SPEED_OF_LIGHT);
    const b = gravitationalRedshiftFractional(22.5, g_SI, 2 * SPEED_OF_LIGHT);
    expect(b).toBeCloseTo(a / 4, 25);
  });

  it("scales linearly in g — Moon's surface (g ≈ 1.62) gives ~6× smaller shift than Earth", () => {
    const earth = gravitationalRedshiftFractional(22.5, 9.80665);
    const moon = gravitationalRedshiftFractional(22.5, 1.62);
    expect(earth / moon).toBeCloseTo(9.80665 / 1.62, 5);
  });

  it("matches the exported POUND_REBKA_PREDICTED constant", () => {
    expect(gravitationalRedshiftFractional(22.5)).toBe(POUND_REBKA_PREDICTED);
  });
});

describe("compensatingDopplerVelocity", () => {
  it("Pound-Rebka 1960: 22.5 m tower needs v ≈ 7.36 × 10⁻⁷ m/s ≈ 0.74 μm/s to recover resonance", () => {
    // g h / c = 9.80665 × 22.5 / 2.99792458e8 ≈ 7.358e-7 m/s
    const v = compensatingDopplerVelocity(22.5);
    expect(v).toBeGreaterThan(7.35e-7);
    expect(v).toBeLessThan(7.37e-7);
  });

  it("scales linearly in h", () => {
    expect(compensatingDopplerVelocity(45)).toBeCloseTo(
      2 * compensatingDopplerVelocity(22.5),
      15,
    );
  });

  it("equals c × (Δν/ν) — the Doppler shift that exactly cancels the gravitational shift", () => {
    const h = 22.5;
    const v = compensatingDopplerVelocity(h);
    const shift = gravitationalRedshiftFractional(h);
    expect(v).toBeCloseTo(shift * SPEED_OF_LIGHT, 18);
  });
});

describe("Pound-Rebka experimental constants", () => {
  it("measured value (2.57 ± 0.26) × 10⁻¹⁵ is consistent with the predicted ≈ 2.45 × 10⁻¹⁵", () => {
    // Predicted is within the 1σ error bar of the measured value.
    const lower = POUND_REBKA_MEASURED - POUND_REBKA_MEASUREMENT_ERROR;
    const upper = POUND_REBKA_MEASURED + POUND_REBKA_MEASUREMENT_ERROR;
    expect(POUND_REBKA_PREDICTED).toBeGreaterThan(lower);
    expect(POUND_REBKA_PREDICTED).toBeLessThan(upper);
  });

  it("measurement is in units of 10⁻¹⁵ — the parts-per-quadrillion regime Mössbauer made accessible", () => {
    expect(POUND_REBKA_MEASURED).toBeGreaterThan(1e-15);
    expect(POUND_REBKA_MEASURED).toBeLessThan(1e-14);
  });

  it("Pound-Snider 1965 ratio is consistent with unity at the 1% level (0.999 ± 0.008)", () => {
    expect(POUND_SNIDER_RATIO).toBeGreaterThan(0.99);
    expect(POUND_SNIDER_RATIO).toBeLessThan(1.01);
    // Unity (1.0) lies within the 1σ error.
    expect(Math.abs(1 - POUND_SNIDER_RATIO)).toBeLessThan(POUND_SNIDER_RATIO_ERROR);
  });
});
