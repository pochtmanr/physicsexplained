import { describe, expect, it } from "vitest";
import {
  numericalAperture,
  acceptanceConeDeg,
  rectangularCutoff,
  fiberAttenuation,
} from "@/lib/physics/electromagnetism/waveguides";

describe("numericalAperture", () => {
  it("step-index fiber n_core=1.48, n_clad=1.46 ≈ 0.243", () => {
    const na = numericalAperture(1.48, 1.46);
    // √(1.48² − 1.46²) = √(2.1904 − 2.1316) = √0.0588 ≈ 0.2425
    expect(na).toBeCloseTo(0.2425, 4);
  });

  it("returns 0 when n_core ≤ n_cladding (no TIR guiding possible)", () => {
    expect(numericalAperture(1.45, 1.46)).toBe(0);
    expect(numericalAperture(1.46, 1.46)).toBe(0);
  });

  it("is monotone increasing in (n_core − n_clad) at fixed n_clad", () => {
    const na_small = numericalAperture(1.462, 1.46);
    const na_mid = numericalAperture(1.48, 1.46);
    const na_large = numericalAperture(1.55, 1.46);
    expect(na_small).toBeLessThan(na_mid);
    expect(na_mid).toBeLessThan(na_large);
  });

  it("throws on non-finite inputs", () => {
    expect(() => numericalAperture(Number.NaN, 1.46)).toThrow();
    expect(() => numericalAperture(1.48, Number.POSITIVE_INFINITY)).toThrow();
  });
});

describe("acceptanceConeDeg", () => {
  it("n_core=1.48, n_clad=1.46 → half-angle ≈ 14.04°", () => {
    const na = numericalAperture(1.48, 1.46);
    const cone = acceptanceConeDeg(na);
    // arcsin(0.2425) = 14.036°; the §09.10 spec quotes 14.07° which is within 0.05°
    expect(cone).toBeCloseTo(14.036, 2);
    expect(Math.abs(cone - 14.07)).toBeLessThan(0.05);
  });

  it("NA = 0 → cone = 0°", () => {
    expect(acceptanceConeDeg(0)).toBe(0);
  });

  it("NA ≥ 1 → cone capped at 90°", () => {
    expect(acceptanceConeDeg(1)).toBe(90);
    expect(acceptanceConeDeg(1.2)).toBe(90);
  });
});

describe("rectangularCutoff", () => {
  it("WR-90 (a = 22.86 mm, b = 10.16 mm) TE₁₀ cutoff ≈ 6.56 GHz", () => {
    // f_c(1,0) = c/(2a) = 2.998e8 / (2 · 0.02286) ≈ 6.557 GHz
    const fcHz = rectangularCutoff(1, 0, 0.02286, 0.01016);
    const fcGHz = fcHz / 1e9;
    expect(fcGHz).toBeCloseTo(6.557, 2);
    expect(Math.abs(fcGHz - 6.56)).toBeLessThan(0.02);
  });

  it("TE₂₀ cutoff is exactly 2× TE₁₀ (same a, n=0)", () => {
    const f10 = rectangularCutoff(1, 0, 0.02286, 0.01016);
    const f20 = rectangularCutoff(2, 0, 0.02286, 0.01016);
    expect(f20 / f10).toBeCloseTo(2, 10);
  });

  it("TE₀₁ cutoff > TE₁₀ cutoff when b < a (higher spatial frequency along the short side)", () => {
    const f10 = rectangularCutoff(1, 0, 0.02286, 0.01016);
    const f01 = rectangularCutoff(0, 1, 0.02286, 0.01016);
    expect(f01).toBeGreaterThan(f10);
  });

  it("throws on non-positive guide dimensions", () => {
    expect(() => rectangularCutoff(1, 0, 0, 0.01)).toThrow();
    expect(() => rectangularCutoff(1, 0, 0.02, -0.01)).toThrow();
  });
});

describe("fiberAttenuation", () => {
  it("is lower at 1550 nm (its own window) than at 850 nm (far from 1550-nm minimum)", () => {
    // Using the 1550-nm window: floor 0.17 dB/km, bandwidth 60 nm.
    const α_1550 = fiberAttenuation(1550, 1550, 0.17, 60);
    const α_850 = fiberAttenuation(850, 1550, 0.17, 60);
    expect(α_1550).toBeLessThan(α_850);
    // At the centre the model hits exactly α_min.
    expect(α_1550).toBeCloseTo(0.17, 6);
  });

  it("850-nm window floor (~2 dB/km) is higher than 1550-nm window floor (~0.17 dB/km)", () => {
    // Standard datasheet values: 850 nm ≈ 2 dB/km, 1310 nm ≈ 0.35 dB/km,
    // 1550 nm ≈ 0.17 dB/km — the monotonic drop from short to long telecom λ.
    const α_850 = fiberAttenuation(850, 850, 2.0, 40);
    const α_1310 = fiberAttenuation(1310, 1310, 0.35, 50);
    const α_1550 = fiberAttenuation(1550, 1550, 0.17, 60);
    expect(α_850).toBeGreaterThan(α_1310);
    expect(α_1310).toBeGreaterThan(α_1550);
  });

  it("is symmetric around the window centre (Gaussian in (λ − λ₀))", () => {
    const below = fiberAttenuation(1550 - 30, 1550, 0.17, 60);
    const above = fiberAttenuation(1550 + 30, 1550, 0.17, 60);
    expect(below).toBeCloseTo(above, 10);
  });

  it("throws on invalid inputs (zero wavelength, negative bandwidth)", () => {
    expect(() => fiberAttenuation(0, 1550, 0.17, 60)).toThrow();
    expect(() => fiberAttenuation(1550, 1550, 0.17, 0)).toThrow();
    expect(() => fiberAttenuation(1550, 1550, -1, 60)).toThrow();
  });
});
