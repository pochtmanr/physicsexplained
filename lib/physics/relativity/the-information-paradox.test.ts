/**
 * §60 THE INFORMATION PARADOX — unit tests.
 *
 * Checks the two entropy bookkeepings (Hawking's rising line vs Page's
 * rise-and-fall), the Page-time turnover, the energy/entropy bookkeeping used
 * by scene (b), the Bekenstein–Hawking ceiling, and the integrity of the
 * positions catalog.
 */

import { describe, expect, it } from "vitest";
import {
  M_SUN,
  schwarzschildRadius,
  bekensteinHawkingEntropy,
  bekensteinHawkingEntropyBits,
  hawkingRadiationEntropy,
  pageCurveEntropy,
  pageCurveSmooth,
  PAGE_FRACTION,
  pageFraction,
  informationInRadiation,
  energyRadiatedFraction,
  remainingMassFraction,
  PARADOX_POSITIONS,
} from "@/lib/physics/relativity/the-information-paradox";

// ─── Bekenstein–Hawking entropy ──────────────────────────────────────────────

describe("bekensteinHawkingEntropy", () => {
  it("is enormous for one solar mass (~10⁷⁷ nats)", () => {
    const S = bekensteinHawkingEntropy(M_SUN);
    expect(S).toBeGreaterThan(1e76);
    expect(S).toBeLessThan(1e78);
  });

  it("scales as M² (area law)", () => {
    expect(bekensteinHawkingEntropy(2 * M_SUN)).toBeCloseTo(
      4 * bekensteinHawkingEntropy(M_SUN),
      -70,
    );
  });

  it("bits version is nats / ln 2", () => {
    expect(bekensteinHawkingEntropyBits(M_SUN)).toBeCloseTo(
      bekensteinHawkingEntropy(M_SUN) / Math.LN2,
      -70,
    );
  });

  it("uses the right Schwarzschild radius (~2.95 km at one solar mass)", () => {
    expect(schwarzschildRadius(M_SUN)).toBeCloseTo(2954, -1);
  });
});

// ─── Hawking's rising line ───────────────────────────────────────────────────

describe("hawkingRadiationEntropy", () => {
  it("rises monotonically from 0 to 1", () => {
    expect(hawkingRadiationEntropy(0)).toBe(0);
    expect(hawkingRadiationEntropy(0.5)).toBeCloseTo(0.5, 12);
    expect(hawkingRadiationEntropy(1)).toBe(1);
  });

  it("never turns over (ends at its maximum)", () => {
    const a = hawkingRadiationEntropy(0.9);
    const b = hawkingRadiationEntropy(1.0);
    expect(b).toBeGreaterThanOrEqual(a);
  });

  it("clamps out-of-range input", () => {
    expect(hawkingRadiationEntropy(-3)).toBe(0);
    expect(hawkingRadiationEntropy(7)).toBe(1);
  });
});

// ─── The Page curve ──────────────────────────────────────────────────────────

describe("pageCurveEntropy", () => {
  it("starts and ends at zero", () => {
    expect(pageCurveEntropy(0)).toBe(0);
    expect(pageCurveEntropy(1)).toBe(0);
  });

  it("peaks at 1/2 at the Page time (f = 1/2)", () => {
    expect(pageCurveEntropy(PAGE_FRACTION)).toBeCloseTo(0.5, 12);
    expect(pageFraction()).toBe(0.5);
  });

  it("is symmetric about the Page time", () => {
    expect(pageCurveEntropy(0.3)).toBeCloseTo(pageCurveEntropy(0.7), 12);
    expect(pageCurveEntropy(0.1)).toBeCloseTo(pageCurveEntropy(0.9), 12);
  });

  it("rises before the Page time and falls after it", () => {
    expect(pageCurveEntropy(0.25)).toBeLessThan(pageCurveEntropy(0.5));
    expect(pageCurveEntropy(0.75)).toBeLessThan(pageCurveEntropy(0.5));
  });

  it("never exceeds Hawking's line", () => {
    for (let f = 0; f <= 1.0001; f += 0.05) {
      expect(pageCurveEntropy(f)).toBeLessThanOrEqual(
        hawkingRadiationEntropy(f) + 1e-9,
      );
    }
  });
});

// ─── Smoothed Page curve ─────────────────────────────────────────────────────

describe("pageCurveSmooth", () => {
  it("tracks the sharp curve away from the corner", () => {
    expect(pageCurveSmooth(0.1)).toBeCloseTo(pageCurveEntropy(0.1), 2);
    expect(pageCurveSmooth(0.9)).toBeCloseTo(pageCurveEntropy(0.9), 2);
  });

  it("rounds the corner: at f=1/2 it is at or below the sharp peak", () => {
    expect(pageCurveSmooth(0.5)).toBeLessThanOrEqual(
      pageCurveEntropy(0.5) + 1e-9,
    );
    expect(pageCurveSmooth(0.5)).toBeGreaterThan(0.4);
  });

  it("starts near zero", () => {
    expect(pageCurveSmooth(0)).toBeLessThan(0.05);
  });
});

// ─── Information in the radiation ────────────────────────────────────────────

describe("informationInRadiation", () => {
  it("is zero up to the Page time", () => {
    expect(informationInRadiation(0)).toBe(0);
    expect(informationInRadiation(0.3)).toBeCloseTo(0, 12);
    expect(informationInRadiation(0.5)).toBeCloseTo(0, 12);
  });

  it("rises after the Page time", () => {
    expect(informationInRadiation(0.75)).toBeGreaterThan(0);
    expect(informationInRadiation(1)).toBeCloseTo(1, 12);
  });

  it("is monotonically non-decreasing once it starts", () => {
    expect(informationInRadiation(0.9)).toBeGreaterThan(
      informationInRadiation(0.6),
    );
  });
});

// ─── Energy / mass bookkeeping ───────────────────────────────────────────────

describe("energyRadiatedFraction", () => {
  it("is 0 at the start and 1 at full evaporation", () => {
    expect(energyRadiatedFraction(0)).toBe(0);
    expect(energyRadiatedFraction(1)).toBeCloseTo(1, 12);
  });

  it("is convex: less than half the energy is out at the Page time", () => {
    // At f=1/2, E_out = 1 − √0.5 ≈ 0.293 < 0.5: most energy leaves LATE.
    expect(energyRadiatedFraction(0.5)).toBeLessThan(0.5);
    expect(energyRadiatedFraction(0.5)).toBeCloseTo(1 - Math.SQRT1_2, 12);
  });

  it("complements remainingMassFraction", () => {
    for (let f = 0; f <= 1.0001; f += 0.1) {
      expect(energyRadiatedFraction(f) + remainingMassFraction(f)).toBeCloseTo(
        1,
        12,
      );
    }
  });
});

// ─── Positions catalog ───────────────────────────────────────────────────────

describe("PARADOX_POSITIONS", () => {
  it("has unique ids", () => {
    const ids = PARADOX_POSITIONS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("includes the unitary modern resolution (islands) and the lossy original", () => {
    const byId = Object.fromEntries(PARADOX_POSITIONS.map((p) => [p.id, p]));
    expect(byId["islands"].unitary).toBe(true);
    expect(byId["information-lost"].unitary).toBe(false);
  });

  it("the firewall is the only smooth-horizon violator", () => {
    const violators = PARADOX_POSITIONS.filter((p) => !p.smoothHorizon);
    expect(violators.map((p) => p.id)).toEqual(["firewall"]);
  });

  it("every position states a nonempty cost", () => {
    for (const p of PARADOX_POSITIONS) {
      expect(p.cost.length).toBeGreaterThan(0);
    }
  });
});
