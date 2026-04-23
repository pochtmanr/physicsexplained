import { describe, expect, it } from "vitest";
import {
  huygensSum,
  singleSlitFirstMinAngle,
  singleSlitCentralHalfWidth,
  doubleSlitFringeSpacing,
  doubleSlitFringeCount,
  diffractionGratingPrincipalMaxima,
  gratingPrincipalMaxHalfWidth,
} from "@/lib/physics/electromagnetism/diffraction";

const deg = (d: number) => (d * Math.PI) / 180;
const rad2deg = (r: number) => (r * 180) / Math.PI;

describe("Diffraction — single slit", () => {
  it("first-order minimum for λ = 550 nm, a = 50 μm sits at ≈ 0.63°", () => {
    // λ / a = 550e-9 / 50e-6 = 0.011 → arcsin(0.011) ≈ 0.0110 rad ≈ 0.63°
    const lambda = 550e-9; // metres
    const a = 50e-6;        // metres
    const theta = singleSlitFirstMinAngle(lambda, a);
    expect(rad2deg(theta)).toBeCloseTo(0.63, 2);
    // In the small-angle regime arcsin(x) ≈ x to within 0.1%.
    expect(theta).toBeCloseTo(lambda / a, 5);
  });

  it("central-maximum linear half-width scales linearly with L", () => {
    const lambda = 550e-9;
    const a = 100e-6;
    const w1 = singleSlitCentralHalfWidth(lambda, a, 1.0);
    const w2 = singleSlitCentralHalfWidth(lambda, a, 2.0);
    expect(w2).toBeCloseTo(2 * w1, 12);
  });
});

describe("Diffraction — double slit (Young 1801 geometry)", () => {
  it("λ=550 nm, d=0.25 mm, L=500 mm → fringe spacing ≈ 1.1 mm", () => {
    const lambda = 550e-9;
    const d = 0.25e-3;
    const L = 0.5;
    const spacing = doubleSlitFringeSpacing(lambda, L, d);
    // (550e-9 × 0.5) / 0.25e-3 = 1.1e-3 m = 1.1 mm
    expect(spacing).toBeCloseTo(1.1e-3, 5);
  });

  it("fringe spacing is linear in L (screen distance)", () => {
    const lambda = 632.8e-9;
    const d = 0.3e-3;
    const s1 = doubleSlitFringeSpacing(lambda, 0.5, d);
    const s2 = doubleSlitFringeSpacing(lambda, 1.0, d);
    const s4 = doubleSlitFringeSpacing(lambda, 2.0, d);
    expect(s2 / s1).toBeCloseTo(2.0, 12);
    expect(s4 / s1).toBeCloseTo(4.0, 12);
  });

  it("fringe spacing scales as 1/d (slit separation)", () => {
    const lambda = 550e-9;
    const L = 1.0;
    const sA = doubleSlitFringeSpacing(lambda, L, 0.1e-3);
    const sB = doubleSlitFringeSpacing(lambda, L, 0.2e-3);
    const sC = doubleSlitFringeSpacing(lambda, L, 0.5e-3);
    expect(sB / sA).toBeCloseTo(0.5, 12);
    expect(sC / sA).toBeCloseTo(0.2, 12);
    // And the classic inverse relation.
    expect(sA * 0.1e-3).toBeCloseTo(sB * 0.2e-3, 12);
  });
});

describe("Diffraction — grating principal maxima", () => {
  it("sin θ_m = m λ / d for every order up to |m| ≤ d/λ", () => {
    const N = 20;
    const lambda = 550e-9;
    const d = 2e-6; // 500 lines/mm grating
    const maxima = diffractionGratingPrincipalMaxima(N, lambda, d);
    // d/λ = 2000/550 ≈ 3.64 → orders m ∈ {−3,…,3}, seven lines.
    expect(maxima.length).toBe(7);
    for (const { order, angleRad } of maxima) {
      expect(Math.sin(angleRad)).toBeCloseTo((order * lambda) / d, 10);
    }
    // The zeroth order is straight through.
    const zeroth = maxima.find((m) => m.order === 0);
    expect(zeroth).toBeDefined();
    expect(zeroth!.angleRad).toBeCloseTo(0, 12);
  });

  it("principal-max half-width narrows as 1/N (adding more slits sharpens)", () => {
    const lambda = 550e-9;
    const d = 1e-6;
    const w10 = gratingPrincipalMaxHalfWidth(10, lambda, d);
    const w100 = gratingPrincipalMaxHalfWidth(100, lambda, d);
    expect(w10 / w100).toBeCloseTo(10, 12);
  });

  it("throws on degenerate grating (N < 2)", () => {
    expect(() => diffractionGratingPrincipalMaxima(1, 550e-9, 1e-6)).toThrow();
  });
});

describe("Diffraction — huygensSum numerical ↔ analytical cross-check", () => {
  it("fringe count on a 10 mm screen matches analytical prediction (λL/d)", () => {
    // Fraunhofer: λ = 550 nm, L = 500 mm, d = 0.25 mm.
    // Expected spacing = 1.1 mm → roughly 9 fringes across ±5 mm = 10 mm.
    const lambdaMm = 550e-6; // mm
    const L = 500;           // mm
    const d = 0.25;          // mm
    const screenHalfWidth = 5; // mm
    const bins = 4096;

    const intensity = huygensSum({
      slitPositions: [-d / 2, +d / 2],
      slitWidth: 0.02,
      wavelengthMm: lambdaMm,
      distanceToScreen: L,
      screenHalfWidth,
      bins,
    });

    // Count local maxima above a modest threshold.
    let peakCount = 0;
    for (let i = 2; i < bins - 2; i += 1) {
      const a = intensity[i];
      if (
        a > 0.05 &&
        a >= intensity[i - 1] &&
        a >= intensity[i + 1] &&
        a > intensity[i - 2] &&
        a > intensity[i + 2]
      ) {
        peakCount += 1;
      }
    }

    // Analytical: screen_width / fringe_spacing — allow ±2 peaks slack
    // for boundary effects near the single-slit envelope zero.
    const expected = doubleSlitFringeCount(lambdaMm, L, d, 2 * screenHalfWidth);
    // expected = floor(10 / 1.1) = 9
    expect(expected).toBe(9);
    expect(peakCount).toBeGreaterThanOrEqual(expected - 2);
    expect(peakCount).toBeLessThanOrEqual(expected + 2);
  });

  it("central-peak location sits at the screen centre (symmetry)", () => {
    const intensity = huygensSum({
      slitPositions: [-0.15, +0.15],
      slitWidth: 0.02,
      wavelengthMm: 550e-6,
      distanceToScreen: 500,
      screenHalfWidth: 4,
      bins: 2048,
    });
    let maxIdx = 0;
    let maxVal = 0;
    for (let i = 0; i < intensity.length; i += 1) {
      if (intensity[i] > maxVal) {
        maxVal = intensity[i];
        maxIdx = i;
      }
    }
    // Centre bin index = (bins - 1) / 2 ≈ 1023.5 — allow ±1 bin.
    const centreIdx = (intensity.length - 1) / 2;
    expect(Math.abs(maxIdx - centreIdx)).toBeLessThanOrEqual(1);
  });
});
