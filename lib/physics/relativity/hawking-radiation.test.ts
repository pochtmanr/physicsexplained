/**
 * §49 HAWKING RADIATION — unit tests.
 *
 * Sanity-checks the temperature, luminosity, lifetime, and CMB-comparison
 * helpers against textbook order-of-magnitude values for a one-solar-mass hole
 * and against the internal scaling laws (T ∝ 1/M, τ ∝ M³).
 */

import { describe, expect, it } from "vitest";
import {
  M_SUN,
  T_CMB,
  AGE_UNIVERSE_S,
  schwarzschildRadius,
  hawkingTemperature,
  horizonArea,
  hawkingLuminosity,
  evaporationLifetime,
  massAfterTime,
  massFromLifetime,
  netPowerVsCMB,
  planckSpectralRadiance,
} from "@/lib/physics/relativity/hawking-radiation";

// ─── Schwarzschild radius ────────────────────────────────────────────────────

describe("schwarzschildRadius", () => {
  it("gives ~2.95 km for one solar mass", () => {
    expect(schwarzschildRadius(M_SUN)).toBeCloseTo(2954, -1);
  });

  it("scales linearly with mass", () => {
    expect(schwarzschildRadius(2 * M_SUN)).toBeCloseTo(
      2 * schwarzschildRadius(M_SUN),
      6,
    );
  });
});

// ─── Hawking temperature ─────────────────────────────────────────────────────

describe("hawkingTemperature", () => {
  it("is ~6.2×10⁻⁸ K for one solar mass", () => {
    const T = hawkingTemperature(M_SUN);
    expect(T).toBeGreaterThan(5e-8);
    expect(T).toBeLessThan(7e-8);
  });

  it("is inversely proportional to mass (T ∝ 1/M)", () => {
    expect(hawkingTemperature(2 * M_SUN)).toBeCloseTo(
      hawkingTemperature(M_SUN) / 2,
      30,
    );
  });

  it("a stellar hole is far colder than the CMB", () => {
    expect(hawkingTemperature(M_SUN)).toBeLessThan(T_CMB);
  });

  it("a small primordial hole (1e11 kg) is hot, well above the CMB", () => {
    expect(hawkingTemperature(1e11)).toBeGreaterThan(T_CMB);
  });
});

// ─── Horizon area ────────────────────────────────────────────────────────────

describe("horizonArea", () => {
  it("equals 4π r_s²", () => {
    const rs = schwarzschildRadius(M_SUN);
    expect(horizonArea(M_SUN)).toBeCloseTo(4 * Math.PI * rs * rs, 0);
  });

  it("scales as M²", () => {
    expect(horizonArea(3 * M_SUN)).toBeCloseTo(9 * horizonArea(M_SUN), 0);
  });
});

// ─── Luminosity ──────────────────────────────────────────────────────────────

describe("hawkingLuminosity", () => {
  it("is vanishingly small for one solar mass (< 1e-28 W)", () => {
    expect(hawkingLuminosity(M_SUN)).toBeLessThan(1e-28);
    expect(hawkingLuminosity(M_SUN)).toBeGreaterThan(0);
  });

  it("rises steeply as mass falls (L ∝ 1/M²)", () => {
    const ratio = hawkingLuminosity(M_SUN / 2) / hawkingLuminosity(M_SUN);
    expect(ratio).toBeCloseTo(4, 4);
  });
});

// ─── Lifetime ────────────────────────────────────────────────────────────────

describe("evaporationLifetime", () => {
  it("is ~2×10⁶⁷ years for one solar mass", () => {
    const years = evaporationLifetime(M_SUN) / (365.25 * 86400);
    expect(years).toBeGreaterThan(1e66);
    expect(years).toBeLessThan(1e68);
  });

  it("scales as M³", () => {
    expect(evaporationLifetime(2 * M_SUN)).toBeCloseTo(
      8 * evaporationLifetime(M_SUN),
      30,
    );
  });

  it("a solar-mass hole outlives the universe by many orders of magnitude", () => {
    expect(evaporationLifetime(M_SUN)).toBeGreaterThan(AGE_UNIVERSE_S * 1e40);
  });
});

// ─── Mass evolution ──────────────────────────────────────────────────────────

describe("massAfterTime", () => {
  it("returns the initial mass at t = 0", () => {
    expect(massAfterTime(1e12, 0)).toBeCloseTo(1e12, 0);
  });

  it("reaches zero at the lifetime", () => {
    const tau = evaporationLifetime(1e12);
    expect(massAfterTime(1e12, tau)).toBe(0);
  });

  it("is monotonically decreasing", () => {
    const tau = evaporationLifetime(1e12);
    const a = massAfterTime(1e12, 0.1 * tau);
    const b = massAfterTime(1e12, 0.5 * tau);
    expect(a).toBeGreaterThan(b);
  });

  it("clamps to zero past the lifetime", () => {
    const tau = evaporationLifetime(1e12);
    expect(massAfterTime(1e12, 2 * tau)).toBe(0);
  });
});

// ─── massFromLifetime is the inverse of evaporationLifetime ──────────────────

describe("massFromLifetime", () => {
  it("inverts evaporationLifetime", () => {
    const M = 4.7e11;
    expect(massFromLifetime(evaporationLifetime(M))).toBeCloseTo(M, 0);
  });

  it("a hole evaporating now (τ = age of universe) is ~10¹¹–10¹² kg", () => {
    const M = massFromLifetime(AGE_UNIVERSE_S);
    expect(M).toBeGreaterThan(1e11);
    expect(M).toBeLessThan(1e12);
  });
});

// ─── Net power vs CMB ────────────────────────────────────────────────────────

describe("netPowerVsCMB", () => {
  it("is negative for a stellar hole (it net-absorbs the CMB today)", () => {
    expect(netPowerVsCMB(M_SUN)).toBeLessThan(0);
  });

  it("is positive for a hot primordial hole", () => {
    expect(netPowerVsCMB(1e11)).toBeGreaterThan(0);
  });

  it("crosses zero where T_H equals the CMB temperature", () => {
    // Find the mass with T_H = T_CMB; net power should be ~0 there.
    const T = T_CMB;
    // T_H ∝ 1/M, so M_cross = M_SUN · T_H(M_SUN)/T
    const Mcross = M_SUN * (hawkingTemperature(M_SUN) / T);
    expect(Math.abs(netPowerVsCMB(Mcross))).toBeLessThan(
      Math.abs(netPowerVsCMB(M_SUN)) * 1e-6 + 1e-30,
    );
  });
});

// ─── Planck spectrum ─────────────────────────────────────────────────────────

describe("planckSpectralRadiance", () => {
  it("is positive in the bulk of the spectrum", () => {
    expect(planckSpectralRadiance(1e-3, 3)).toBeGreaterThan(0);
  });

  it("peaks near the Wien wavelength for its temperature", () => {
    const T = 3;
    const lamPeak = 2.897771955e-3 / T;
    const atPeak = planckSpectralRadiance(lamPeak, T);
    const below = planckSpectralRadiance(lamPeak * 0.5, T);
    const above = planckSpectralRadiance(lamPeak * 2, T);
    expect(atPeak).toBeGreaterThan(below);
    expect(atPeak).toBeGreaterThan(above);
  });

  it("returns 0 for degenerate input", () => {
    expect(planckSpectralRadiance(1e-3, 0)).toBe(0);
  });
});
