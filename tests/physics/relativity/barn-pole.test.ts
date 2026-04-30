import { describe, expect, it } from "vitest";
import { SPEED_OF_LIGHT } from "@/lib/physics/constants";
import { gamma } from "@/lib/physics/relativity/types";
import {
  contractedBarnLength,
  contractedPoleLength,
  doorEventLagInPoleFrame,
  fitsInBarnInBarnFrame,
  fitsInBarnInPoleFrame,
} from "@/lib/physics/relativity/barn-pole";

describe("fitsInBarnInBarnFrame", () => {
  it("Galilean limit (β = 0): pole fits iff L_pole ≤ L_barn", () => {
    expect(fitsInBarnInBarnFrame(5, 5, 0)).toBe(true);
    expect(fitsInBarnInBarnFrame(4, 5, 0)).toBe(true);
    expect(fitsInBarnInBarnFrame(6, 5, 0)).toBe(false);
  });

  it("β = √3/2 ≈ 0.866 (γ = 2): a 10 m pole contracts to 5 m and fits a 5.001 m barn", () => {
    // γ(0.866...) = 1/√(1 − 0.75) = 1/0.5 = 2. 10 / 2 = 5 ≤ 5.001.
    // (We pad the barn by a hair to avoid floating-point ties at the boundary;
    // see contractedPoleLength tests for the exact 5.0 numeric check.)
    expect(fitsInBarnInBarnFrame(10, 5.001, Math.sqrt(3) / 2)).toBe(true);
  });

  it("β = 0.866, L_pole = 12, L_barn = 5: contracts to 6 m, still does NOT fit", () => {
    expect(fitsInBarnInBarnFrame(12, 5, Math.sqrt(3) / 2)).toBe(false);
  });

  it("symmetric in sign of β (length contraction is even in β)", () => {
    expect(fitsInBarnInBarnFrame(10, 5, 0.866)).toBe(
      fitsInBarnInBarnFrame(10, 5, -0.866),
    );
  });

  it("throws on |β| ≥ 1", () => {
    expect(() => fitsInBarnInBarnFrame(10, 5, 1)).toThrow(RangeError);
    expect(() => fitsInBarnInBarnFrame(10, 5, 1.5)).toThrow(RangeError);
  });
});

describe("fitsInBarnInPoleFrame", () => {
  it("at β = 0 (Galilean): pole fits iff L_pole ≤ L_barn (matches barn-frame answer)", () => {
    expect(fitsInBarnInPoleFrame(5, 5, 0)).toBe(true);
    expect(fitsInBarnInPoleFrame(6, 5, 0)).toBe(false);
  });

  it("β = 0.866, L_pole = 10, L_barn = 5: barn contracts to 2.5 m, pole does NOT fit", () => {
    // γ = 2. L_barn / γ = 2.5 < 10. The paradox case: barn-frame says fits, pole-frame says no.
    expect(fitsInBarnInPoleFrame(10, 5, Math.sqrt(3) / 2)).toBe(false);
  });

  it("disagrees with barn-frame answer at γ > 1 when L_pole > L_barn (the paradox)", () => {
    const beta = Math.sqrt(3) / 2;
    // Pad barn slightly above 5 to avoid float ties at the contracted-length boundary.
    expect(fitsInBarnInBarnFrame(10, 5.001, beta)).toBe(true);
    expect(fitsInBarnInPoleFrame(10, 5.001, beta)).toBe(false);
  });

  it("agrees with barn-frame answer when L_pole ≤ L_barn (no paradox)", () => {
    // Smaller pole: both frames agree it fits.
    const beta = 0.6;
    expect(fitsInBarnInBarnFrame(3, 5, beta)).toBe(
      fitsInBarnInPoleFrame(3, 5, beta),
    );
  });

  it("throws on superluminal β", () => {
    expect(() => fitsInBarnInPoleFrame(10, 5, 1.2)).toThrow(RangeError);
  });
});

describe("doorEventLagInPoleFrame", () => {
  it("equals 0 at β = 0 (no boost, simultaneity preserved)", () => {
    expect(doorEventLagInPoleFrame(5, 0)).toBeCloseTo(0, 18);
  });

  it("β = 0.866 (γ = 2), L_barn = 5 m → Δt' ≈ −2.887 × 10⁻⁸ s", () => {
    // −γ β L_barn / c = −2 · (√3/2) · 5 / c = −5 √3 / c ≈ −2.887e−8 s.
    const beta = Math.sqrt(3) / 2;
    const expected = (-2 * beta * 5) / SPEED_OF_LIGHT;
    expect(doorEventLagInPoleFrame(5, beta)).toBeCloseTo(expected, 16);
    // Sanity: explicit numerical check, ≈ −2.887 × 10⁻⁸ s.
    expect(doorEventLagInPoleFrame(5, beta)).toBeLessThan(-2.88e-8);
    expect(doorEventLagInPoleFrame(5, beta)).toBeGreaterThan(-2.89e-8);
  });

  it("flips sign under β → −β (front- vs rear-door ordering reverses)", () => {
    const beta = 0.6;
    expect(doorEventLagInPoleFrame(5, beta)).toBeCloseTo(
      -doorEventLagInPoleFrame(5, -beta),
      18,
    );
  });

  it("magnitude scales linearly in L_barn", () => {
    const beta = 0.6;
    const lag5 = doorEventLagInPoleFrame(5, beta);
    const lag10 = doorEventLagInPoleFrame(10, beta);
    expect(lag10).toBeCloseTo(2 * lag5, 16);
  });

  it("matches the Lorentz boost formula −γ β L_barn / c for arbitrary subluminal β", () => {
    for (const beta of [0.1, 0.3, 0.5, 0.7, 0.9, 0.99]) {
      const expected = (-gamma(beta) * beta * 5) / SPEED_OF_LIGHT;
      expect(doorEventLagInPoleFrame(5, beta)).toBeCloseTo(expected, 16);
    }
  });

  it("accepts a custom c (natural units, c = 1)", () => {
    // In natural units with c = 1 and L_barn = 1, β = 0.6, γ = 1.25:
    // Δt' = −1.25 · 0.6 · 1 = −0.75.
    expect(doorEventLagInPoleFrame(1, 0.6, 1)).toBeCloseTo(-0.75, 12);
  });

  it("throws on |β| ≥ 1", () => {
    expect(() => doorEventLagInPoleFrame(5, 1)).toThrow(RangeError);
    expect(() => doorEventLagInPoleFrame(5, -1)).toThrow(RangeError);
  });
});

describe("contractedPoleLength / contractedBarnLength", () => {
  it("β = 0: no contraction", () => {
    expect(contractedPoleLength(10, 0)).toBeCloseTo(10, 12);
    expect(contractedBarnLength(5, 0)).toBeCloseTo(5, 12);
  });

  it("β = 0.866: γ = 2 → halves the proper length", () => {
    expect(contractedPoleLength(10, Math.sqrt(3) / 2)).toBeCloseTo(5, 12);
    expect(contractedBarnLength(5, Math.sqrt(3) / 2)).toBeCloseTo(2.5, 12);
  });

  it("approaches 0 as β → 1 (full contraction)", () => {
    expect(contractedPoleLength(10, 0.999999)).toBeLessThan(0.02);
  });
});
