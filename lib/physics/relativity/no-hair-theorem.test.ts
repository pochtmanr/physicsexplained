/**
 * §47 THE NO-HAIR THEOREM — unit tests.
 *
 * Covers spin clamping, the Geroch–Hansen Kerr multipole moments, the
 * quadrupole-ratio test value, and the Berti–Cardoso–Will ringdown fits
 * (frequency, quality factor, damping time) in both geometrized and SI units.
 */

import { describe, expect, it } from "vitest";
import {
  clampSpin,
  outerHorizonRadius,
  kerrMassMultipole,
  kerrCurrentMultipole,
  kerrQuadrupoleRatio,
  ringdownFrequencyDimensionless,
  ringdownQualityFactor,
  ringdownDampingTimeDimensionless,
  geometricTimeSeconds,
  ringdownFrequencyHz,
  ringdownDampingTimeSeconds,
  ringdownWaveform,
} from "@/lib/physics/relativity/no-hair-theorem";

// ─── clampSpin ───────────────────────────────────────────────────────────────

describe("clampSpin", () => {
  it("passes through values in range", () => {
    expect(clampSpin(0.5)).toBe(0.5);
    expect(clampSpin(0)).toBe(0);
  });

  it("caps at just below extremal and folds negatives", () => {
    expect(clampSpin(1)).toBe(0.9999);
    expect(clampSpin(2)).toBe(0.9999);
    expect(clampSpin(-0.4)).toBeCloseTo(0.4, 12);
  });

  it("maps non-finite input to 0", () => {
    expect(clampSpin(NaN)).toBe(0);
    expect(clampSpin(Infinity)).toBe(0.9999);
  });
});

describe("outerHorizonRadius", () => {
  it("is 2M for Schwarzschild and ~M near extremality", () => {
    expect(outerHorizonRadius(0)).toBeCloseTo(2, 12);
    expect(outerHorizonRadius(1)).toBeLessThan(1.02);
    expect(outerHorizonRadius(1)).toBeGreaterThan(1);
  });
});

// ─── Geroch–Hansen multipoles ────────────────────────────────────────────────

describe("kerrMassMultipole", () => {
  it("gives M_0 = M (the mass itself)", () => {
    expect(kerrMassMultipole(0.7, 0)).toBeCloseTo(1, 12);
  });

  it("gives the mass quadrupole M_2 = −a²", () => {
    expect(kerrMassMultipole(0.6, 2)).toBeCloseTo(-0.36, 12);
    expect(kerrMassMultipole(0, 2)).toBeCloseTo(0, 12);
  });

  it("gives M_4 = +a⁴", () => {
    expect(kerrMassMultipole(0.5, 4)).toBeCloseTo(Math.pow(0.5, 4), 12);
  });

  it("vanishes for odd ℓ (reflection symmetry)", () => {
    expect(kerrMassMultipole(0.8, 1)).toBe(0);
    expect(kerrMassMultipole(0.8, 3)).toBe(0);
  });

  it("returns NaN for invalid ℓ", () => {
    expect(Number.isNaN(kerrMassMultipole(0.5, -1))).toBe(true);
    expect(Number.isNaN(kerrMassMultipole(0.5, 1.5))).toBe(true);
  });
});

describe("kerrCurrentMultipole", () => {
  it("gives S_1 = a (the angular momentum J = M a)", () => {
    expect(kerrCurrentMultipole(0.7, 1)).toBeCloseTo(0.7, 12);
  });

  it("gives S_3 = −a³", () => {
    expect(kerrCurrentMultipole(0.5, 3)).toBeCloseTo(-Math.pow(0.5, 3), 12);
  });

  it("vanishes for even ℓ", () => {
    expect(kerrCurrentMultipole(0.8, 0)).toBe(0);
    expect(kerrCurrentMultipole(0.8, 2)).toBe(0);
  });
});

describe("kerrQuadrupoleRatio", () => {
  it("is exactly −1 for any Kerr black hole", () => {
    expect(kerrQuadrupoleRatio(0)).toBe(-1);
    expect(kerrQuadrupoleRatio(0.5)).toBe(-1);
    expect(kerrQuadrupoleRatio(0.99)).toBe(-1);
  });

  it("matches M_2 = ratio · M a² with M = 1", () => {
    const a = 0.6;
    const m2 = kerrQuadrupoleRatio(a) * a * a;
    expect(m2).toBeCloseTo(kerrMassMultipole(a, 2), 12);
  });
});

// ─── ringdown (Berti–Cardoso–Will fits) ──────────────────────────────────────

describe("ringdownFrequencyDimensionless", () => {
  it("matches the known Schwarzschild value M ω_R ≈ 0.3737", () => {
    expect(ringdownFrequencyDimensionless(0)).toBeCloseTo(0.3737, 3);
  });

  it("increases monotonically with spin toward ~1/2", () => {
    expect(ringdownFrequencyDimensionless(0.9)).toBeGreaterThan(
      ringdownFrequencyDimensionless(0.3),
    );
    expect(ringdownFrequencyDimensionless(0.998)).toBeGreaterThan(0.45);
    expect(ringdownFrequencyDimensionless(0.998)).toBeLessThan(0.55);
  });
});

describe("ringdownQualityFactor", () => {
  it("is ~0.7 for Schwarzschild (about two visible cycles)", () => {
    expect(ringdownQualityFactor(0)).toBeCloseTo(0.7 + 1.4187, 2);
  });

  it("grows large near extremality (many cycles)", () => {
    expect(ringdownQualityFactor(0.99)).toBeGreaterThan(
      ringdownQualityFactor(0.5),
    );
    expect(ringdownQualityFactor(0.99)).toBeGreaterThan(10);
  });
});

describe("ringdownDampingTimeDimensionless", () => {
  it("equals Q / (π ω_R) and is positive", () => {
    const a = 0.6;
    const expected =
      ringdownQualityFactor(a) /
      (Math.PI * ringdownFrequencyDimensionless(a));
    expect(ringdownDampingTimeDimensionless(a)).toBeCloseTo(expected, 12);
    expect(ringdownDampingTimeDimensionless(a)).toBeGreaterThan(0);
  });

  it("lengthens with spin (slower decay at high spin)", () => {
    expect(ringdownDampingTimeDimensionless(0.9)).toBeGreaterThan(
      ringdownDampingTimeDimensionless(0.2),
    );
  });
});

// ─── SI conversions ──────────────────────────────────────────────────────────

describe("geometricTimeSeconds", () => {
  it("is ~4.93 µs per solar mass", () => {
    expect(geometricTimeSeconds(1)).toBeCloseTo(4.9255e-6, 9);
    expect(geometricTimeSeconds(10)).toBeCloseTo(4.9255e-5, 8);
  });
});

describe("ringdownFrequencyHz", () => {
  it("puts the GW150914 ~62 M⊙, a*≈0.67 remnant near 250 Hz", () => {
    const f = ringdownFrequencyHz(62, 0.67);
    expect(f).toBeGreaterThan(200);
    expect(f).toBeLessThan(320);
  });

  it("scales inversely with mass", () => {
    const f10 = ringdownFrequencyHz(10, 0.5);
    const f20 = ringdownFrequencyHz(20, 0.5);
    expect(f10 / f20).toBeCloseTo(2, 6);
  });
});

describe("ringdownDampingTimeSeconds", () => {
  it("is a few milliseconds for a stellar-mass remnant", () => {
    const tau = ringdownDampingTimeSeconds(62, 0.67);
    expect(tau).toBeGreaterThan(1e-3);
    expect(tau).toBeLessThan(2e-2);
  });
});

// ─── waveform ────────────────────────────────────────────────────────────────

describe("ringdownWaveform", () => {
  it("starts at A₀ cos(φ) and decays toward zero", () => {
    expect(ringdownWaveform(0, 1, 1, 2, 0)).toBeCloseTo(2, 12);
    expect(Math.abs(ringdownWaveform(20, 1, 1, 2, 0))).toBeLessThan(1e-6);
  });

  it("oscillates: a half period later the phase advances by π", () => {
    const omega = 2;
    const tHalf = Math.PI / omega; // half period
    const a0 = ringdownWaveform(0, omega, 1e6, 1, 0); // ~1, negligible decay
    const aHalf = ringdownWaveform(tHalf, omega, 1e6, 1, 0); // ~−1
    expect(a0).toBeCloseTo(1, 3);
    expect(aHalf).toBeCloseTo(-1, 3);
  });
});
