/**
 * §45 KERR BLACK HOLES AND THE ERGOSPHERE — unit tests.
 *
 * Covers horizon radii, the ergosurface, frame-dragging angular velocities,
 * irreducible mass / extractable energy, horizon area, and spin clamping.
 * All quantities are in units of M (G = c = 1).
 */

import { describe, expect, it } from "vitest";
import {
  outerHorizonRadius,
  innerHorizonRadius,
  ergosphereRadius,
  ergosphereThickness,
  horizonAngularVelocity,
  zamoAngularVelocity,
  irreducibleMass,
  maxExtractableEnergyFraction,
  horizonArea,
  clampSpin,
} from "@/lib/physics/relativity/kerr-and-the-ergosphere";

// ─── horizons ────────────────────────────────────────────────────────────────

describe("outerHorizonRadius", () => {
  it("is the Schwarzschild value 2M at zero spin", () => {
    expect(outerHorizonRadius(0)).toBeCloseTo(2, 12);
  });

  it("shrinks to M at extremal spin", () => {
    expect(outerHorizonRadius(1)).toBeCloseTo(1, 12);
  });

  it("decreases monotonically with spin", () => {
    expect(outerHorizonRadius(0.3)).toBeGreaterThan(outerHorizonRadius(0.6));
    expect(outerHorizonRadius(0.6)).toBeGreaterThan(outerHorizonRadius(0.9));
  });

  it("clamps super-extremal spin to the extremal horizon", () => {
    expect(outerHorizonRadius(1.5)).toBeCloseTo(1, 12);
  });
});

describe("innerHorizonRadius", () => {
  it("is 0 at zero spin and meets the outer horizon at extremality", () => {
    expect(innerHorizonRadius(0)).toBeCloseTo(0, 12);
    expect(innerHorizonRadius(1)).toBeCloseTo(outerHorizonRadius(1), 12);
  });

  it("satisfies r_+ · r_− = a² for a generic spin", () => {
    const a = 0.7;
    expect(outerHorizonRadius(a) * innerHorizonRadius(a)).toBeCloseTo(a * a, 10);
  });
});

// ─── ergosphere ──────────────────────────────────────────────────────────────

describe("ergosphereRadius", () => {
  it("coincides with the horizon at the poles", () => {
    const a = 0.8;
    expect(ergosphereRadius(a, 0)).toBeCloseTo(outerHorizonRadius(a), 12);
  });

  it("reaches 2M at the equator for any spin", () => {
    expect(ergosphereRadius(0.2, Math.PI / 2)).toBeCloseTo(2, 12);
    expect(ergosphereRadius(0.99, Math.PI / 2)).toBeCloseTo(2, 12);
  });

  it("never sits inside the horizon", () => {
    const a = 0.9;
    for (const th of [0, 0.5, 1, Math.PI / 2]) {
      expect(ergosphereRadius(a, th)).toBeGreaterThanOrEqual(
        outerHorizonRadius(a) - 1e-12,
      );
    }
  });
});

describe("ergosphereThickness", () => {
  it("vanishes for a non-rotating hole", () => {
    expect(ergosphereThickness(0)).toBeCloseTo(0, 12);
  });

  it("grows to M at extremality", () => {
    expect(ergosphereThickness(1)).toBeCloseTo(1, 12);
  });
});

// ─── frame dragging ──────────────────────────────────────────────────────────

describe("horizonAngularVelocity", () => {
  it("is 0 for a non-rotating hole", () => {
    expect(horizonAngularVelocity(0)).toBe(0);
  });

  it("is 1/2 at extremality (Ω_H = 1/2M with M = 1)", () => {
    expect(horizonAngularVelocity(1)).toBeCloseTo(0.5, 10);
  });

  it("increases with spin", () => {
    expect(horizonAngularVelocity(0.9)).toBeGreaterThan(
      horizonAngularVelocity(0.3),
    );
  });
});

describe("zamoAngularVelocity", () => {
  it("is 0 everywhere for a non-rotating hole", () => {
    expect(zamoAngularVelocity(0, 3)).toBe(0);
    expect(zamoAngularVelocity(0, 10)).toBe(0);
  });

  it("falls off with radius (Lense–Thirring)", () => {
    const a = 0.8;
    expect(zamoAngularVelocity(a, 3)).toBeGreaterThan(
      zamoAngularVelocity(a, 8),
    );
  });

  it("approaches the horizon angular velocity near r_+", () => {
    const a = 0.8;
    const rPlus = outerHorizonRadius(a);
    const omegaNear = zamoAngularVelocity(a, rPlus + 1e-4);
    expect(omegaNear).toBeGreaterThan(0);
    expect(Math.abs(omegaNear - horizonAngularVelocity(a))).toBeLessThan(1e-2);
  });

  it("decays roughly as 1/r³ far away", () => {
    const a = 0.5;
    const ratio = zamoAngularVelocity(a, 10) / zamoAngularVelocity(a, 20);
    // doubling r should cut ω by ~8×
    expect(ratio).toBeGreaterThan(6);
    expect(ratio).toBeLessThan(10);
  });
});

// ─── energetics ──────────────────────────────────────────────────────────────

describe("irreducibleMass", () => {
  it("equals M for a non-rotating hole", () => {
    expect(irreducibleMass(0)).toBeCloseTo(1, 12);
  });

  it("equals M/√2 at extremality", () => {
    expect(irreducibleMass(1)).toBeCloseTo(1 / Math.SQRT2, 10);
  });
});

describe("maxExtractableEnergyFraction", () => {
  it("is 0 for a non-rotating hole", () => {
    expect(maxExtractableEnergyFraction(0)).toBeCloseTo(0, 12);
  });

  it("is ≈ 29% at extremality", () => {
    expect(maxExtractableEnergyFraction(1)).toBeCloseTo(1 - 1 / Math.SQRT2, 8);
    expect(maxExtractableEnergyFraction(1)).toBeGreaterThan(0.29);
    expect(maxExtractableEnergyFraction(1)).toBeLessThan(0.293);
  });

  it("increases with spin", () => {
    expect(maxExtractableEnergyFraction(0.9)).toBeGreaterThan(
      maxExtractableEnergyFraction(0.4),
    );
  });
});

describe("horizonArea", () => {
  it("is 16π for Schwarzschild and 8π for extremal Kerr", () => {
    expect(horizonArea(0)).toBeCloseTo(16 * Math.PI, 8);
    expect(horizonArea(1)).toBeCloseTo(8 * Math.PI, 8);
  });

  it("decreases monotonically with spin at fixed M", () => {
    expect(horizonArea(0.3)).toBeGreaterThan(horizonArea(0.9));
  });
});

// ─── clampSpin ───────────────────────────────────────────────────────────────

describe("clampSpin", () => {
  it("passes through values in range", () => {
    expect(clampSpin(0.5)).toBe(0.5);
  });

  it("clamps above 1 and folds negatives", () => {
    expect(clampSpin(2)).toBe(1);
    expect(clampSpin(-0.4)).toBeCloseTo(0.4, 12);
  });

  it("maps non-finite input to 0", () => {
    expect(clampSpin(NaN)).toBe(0);
    expect(clampSpin(Infinity)).toBe(1);
  });
});
