import { describe, expect, it } from "vitest";
import {
  COMPTON_WAVELENGTH,
  comptonShift,
  scatteredWavelength,
} from "@/lib/physics/relativity/compton";

describe("COMPTON_WAVELENGTH", () => {
  it("matches the CODATA value 2.4263e-12 m to 4 significant figures", () => {
    // h / (m_e c) ≈ 2.42631e-12 m. Check to 4 sig figs (5e-16 m absolute tolerance).
    expect(COMPTON_WAVELENGTH).toBeGreaterThan(2.4262e-12);
    expect(COMPTON_WAVELENGTH).toBeLessThan(2.4264e-12);
  });

  it("is positive and dimensionally a length", () => {
    expect(COMPTON_WAVELENGTH).toBeGreaterThan(0);
    // Should be in the picometre range — between 1e-13 and 1e-11 m.
    expect(COMPTON_WAVELENGTH).toBeGreaterThan(1e-13);
    expect(COMPTON_WAVELENGTH).toBeLessThan(1e-11);
  });
});

describe("comptonShift", () => {
  it("is zero at θ = 0 (forward-scatter, no interaction)", () => {
    expect(comptonShift(0)).toBeCloseTo(0, 18);
  });

  it("equals one Compton wavelength at θ = π/2", () => {
    expect(comptonShift(Math.PI / 2)).toBeCloseTo(COMPTON_WAVELENGTH, 18);
  });

  it("equals two Compton wavelengths at θ = π (back-scatter)", () => {
    expect(comptonShift(Math.PI)).toBeCloseTo(2 * COMPTON_WAVELENGTH, 18);
  });

  it("is non-negative for any θ", () => {
    for (const theta of [-Math.PI, -1, 0, 0.5, 1, 2, Math.PI, 2 * Math.PI]) {
      expect(comptonShift(theta)).toBeGreaterThanOrEqual(0);
    }
  });

  it("is symmetric in θ → −θ (depends only on cos θ)", () => {
    for (const theta of [0.3, 0.8, 1.4, 2.7]) {
      expect(comptonShift(theta)).toBeCloseTo(comptonShift(-theta), 18);
    }
  });

  it("is bounded above by 2 λ_C for any real θ", () => {
    for (let i = 0; i < 50; i++) {
      const theta = (i / 49) * 2 * Math.PI;
      expect(comptonShift(theta)).toBeLessThanOrEqual(2 * COMPTON_WAVELENGTH + 1e-30);
    }
  });
});

describe("scatteredWavelength", () => {
  it("returns the input wavelength at θ = 0", () => {
    const lambdaIn = 7.1e-11; // 0.071 nm — Mo Kα
    expect(scatteredWavelength(lambdaIn, 0)).toBeCloseTo(lambdaIn, 18);
  });

  it("is always ≥ the incoming wavelength (photon never blue-shifts)", () => {
    const lambdaIn = 7.1e-11;
    for (let i = 0; i < 30; i++) {
      const theta = (i / 29) * Math.PI;
      expect(scatteredWavelength(lambdaIn, theta)).toBeGreaterThanOrEqual(
        lambdaIn,
      );
    }
  });

  it("at θ = π/2 adds exactly one Compton wavelength to λ_in", () => {
    const lambdaIn = 7.1e-11;
    expect(scatteredWavelength(lambdaIn, Math.PI / 2)).toBeCloseTo(
      lambdaIn + COMPTON_WAVELENGTH,
      18,
    );
  });

  it("at θ = π adds exactly two Compton wavelengths to λ_in", () => {
    const lambdaIn = 7.1e-11;
    expect(scatteredWavelength(lambdaIn, Math.PI)).toBeCloseTo(
      lambdaIn + 2 * COMPTON_WAVELENGTH,
      18,
    );
  });

  it("the *shift* is independent of the incoming wavelength (the experimental signature)", () => {
    // Two very different incoming wavelengths must produce the same Δλ at fixed θ.
    const theta = 1.2; // radians
    const shiftA = scatteredWavelength(1e-11, theta) - 1e-11;
    const shiftB = scatteredWavelength(1e-9, theta) - 1e-9;
    expect(shiftA).toBeCloseTo(shiftB, 18);
    expect(shiftA).toBeCloseTo(comptonShift(theta), 18);
  });
});
