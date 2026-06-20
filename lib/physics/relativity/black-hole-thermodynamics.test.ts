/**
 * §48 BLACK-HOLE THERMODYNAMICS — unit tests.
 *
 * Covers horizon area/radius, surface gravity (zeroth/third laws), irreducible
 * mass, the merger area-theorem check, and the SI entropy/temperature scales
 * (sanity-checked against the textbook solar-mass values).
 */

import { describe, expect, it } from "vitest";
import {
  horizonRadius,
  horizonArea,
  irreducibleMass,
  surfaceGravity,
  mergerAreaCheck,
  maxRadiatedFractionEqualMerger,
  clampSpin,
  schwarzschildRadiusSI,
  bekensteinHawkingEntropySI,
  entropyInBits,
  hawkingTemperatureSI,
  M_SUN_KG,
} from "@/lib/physics/relativity/black-hole-thermodynamics";

// ─── geometrized horizon geometry ────────────────────────────────────────────

describe("horizonRadius", () => {
  it("is 2M for Schwarzschild and M at extremality", () => {
    expect(horizonRadius(0)).toBeCloseTo(2, 12);
    expect(horizonRadius(1)).toBeCloseTo(1, 12);
  });
});

describe("horizonArea", () => {
  it("is 16π M² for Schwarzschild and 8π M² for extremal Kerr", () => {
    expect(horizonArea(1, 0)).toBeCloseTo(16 * Math.PI, 8);
    expect(horizonArea(1, 1)).toBeCloseTo(8 * Math.PI, 8);
  });

  it("scales as M²", () => {
    expect(horizonArea(2, 0)).toBeCloseTo(4 * horizonArea(1, 0), 8);
  });

  it("decreases monotonically with spin at fixed mass", () => {
    expect(horizonArea(1, 0.3)).toBeGreaterThan(horizonArea(1, 0.9));
  });
});

describe("irreducibleMass", () => {
  it("equals M for a non-rotating hole", () => {
    expect(irreducibleMass(1, 0)).toBeCloseTo(1, 12);
  });

  it("equals M/√2 at extremality", () => {
    expect(irreducibleMass(1, 1)).toBeCloseTo(1 / Math.SQRT2, 10);
  });
});

describe("surfaceGravity", () => {
  it("is 1/(4M) for Schwarzschild", () => {
    expect(surfaceGravity(1, 0)).toBeCloseTo(0.25, 12);
    expect(surfaceGravity(2, 0)).toBeCloseTo(0.125, 12);
  });

  it("vanishes at extremality (third law)", () => {
    expect(surfaceGravity(1, 1)).toBeCloseTo(0, 10);
  });

  it("decreases with spin", () => {
    expect(surfaceGravity(1, 0.3)).toBeGreaterThan(surfaceGravity(1, 0.9));
  });
});

// ─── the area theorem ────────────────────────────────────────────────────────

describe("mergerAreaCheck", () => {
  it("satisfies A_final ≥ A₁ + A₂ for a non-radiating merger", () => {
    const r = mergerAreaCheck(1, 0, 1, 0, 0, 0);
    expect(r.areaIn).toBeCloseTo(32 * Math.PI, 6);
    // remnant mass 2 → area 16π·4 = 64π > 32π
    expect(r.areaFinal).toBeCloseTo(64 * Math.PI, 6);
    expect(r.satisfies).toBe(true);
  });

  it("still satisfies the theorem at the maximal radiated fraction", () => {
    const f = maxRadiatedFractionEqualMerger();
    const r = mergerAreaCheck(1, 0, 1, 0, f, 0);
    expect(r.satisfies).toBe(true);
    // exactly saturates: A_final ≈ A_in
    expect(r.areaFinal).toBeCloseTo(r.areaIn, 4);
  });

  it("violates the theorem if too much mass is radiated away", () => {
    const r = mergerAreaCheck(1, 0, 1, 0, 0.5, 0);
    expect(r.satisfies).toBe(false);
  });

  it("conserves mass minus the radiated fraction", () => {
    const r = mergerAreaCheck(3, 0, 5, 0, 0.05, 0);
    expect(r.massFinal).toBeCloseTo(8 * 0.95, 10);
  });
});

describe("maxRadiatedFractionEqualMerger", () => {
  it("is 1 − 1/√2 ≈ 0.293", () => {
    expect(maxRadiatedFractionEqualMerger()).toBeCloseTo(0.2929, 4);
  });
});

describe("clampSpin", () => {
  it("passes values in range and clamps the rest", () => {
    expect(clampSpin(0.5)).toBe(0.5);
    expect(clampSpin(2)).toBe(1);
    expect(clampSpin(-0.4)).toBeCloseTo(0.4, 12);
    expect(clampSpin(NaN)).toBe(0);
    expect(clampSpin(Infinity)).toBe(1);
  });
});

// ─── SI sanity checks against textbook solar-mass values ─────────────────────

describe("schwarzschildRadiusSI", () => {
  it("gives ≈ 2.95 km for one solar mass", () => {
    const rs = schwarzschildRadiusSI(M_SUN_KG);
    expect(rs).toBeGreaterThan(2900);
    expect(rs).toBeLessThan(3000);
  });
});

describe("hawkingTemperatureSI", () => {
  it("gives ≈ 6.2 × 10⁻⁸ K for one solar mass", () => {
    const T = hawkingTemperatureSI(M_SUN_KG);
    expect(T).toBeGreaterThan(5e-8);
    expect(T).toBeLessThan(7e-8);
  });

  it("scales as 1/M (small holes are hot)", () => {
    expect(hawkingTemperatureSI(M_SUN_KG)).toBeCloseTo(
      2 * hawkingTemperatureSI(2 * M_SUN_KG),
      30,
    );
  });
});

describe("bekensteinHawkingEntropySI", () => {
  it("gives ≈ 10⁵⁴ J/K for one solar mass", () => {
    const S = bekensteinHawkingEntropySI(M_SUN_KG);
    expect(S).toBeGreaterThan(1e53);
    expect(S).toBeLessThan(1e55);
  });

  it("scales as M²", () => {
    const ratio =
      bekensteinHawkingEntropySI(2 * M_SUN_KG) /
      bekensteinHawkingEntropySI(M_SUN_KG);
    expect(ratio).toBeCloseTo(4, 6);
  });
});

describe("entropyInBits", () => {
  it("gives ≈ 10⁷⁷ k_B for one solar mass", () => {
    const n = entropyInBits(M_SUN_KG);
    expect(n).toBeGreaterThan(1e76);
    expect(n).toBeLessThan(1e78);
  });
});
