/**
 * §39 THE SCHWARZSCHILD METRIC — unit tests.
 *
 * Covers schwarzschildRadius, gtt/grr/metricFactor, timeDilationFactor,
 * kretschmann, effectivePotential, circularOrbitRadii, iscoRadius,
 * photonSphereRadius, flammHeight, coordinateLightSpeedRadial.
 */

import { describe, expect, it } from "vitest";
import {
  schwarzschildRadius,
  gtt,
  grr,
  metricFactor,
  timeDilationFactor,
  kretschmann,
  effectivePotential,
  circularOrbitRadii,
  iscoRadius,
  photonSphereRadius,
  flammHeight,
  coordinateLightSpeedRadial,
} from "@/lib/physics/relativity/the-schwarzschild-metric";

// ─── schwarzschildRadius ─────────────────────────────────────────────────────

describe("schwarzschildRadius", () => {
  it("the Sun's r_s is ≈ 2954 m (about 3 km)", () => {
    const M_sun = 1.989e30;
    expect(schwarzschildRadius(M_sun)).toBeCloseTo(2954, -2);
  });

  it("the Earth's r_s is ≈ 8.87 mm", () => {
    const M_earth = 5.972e24;
    expect(schwarzschildRadius(M_earth)).toBeCloseTo(0.00887, 4);
  });

  it("scales linearly with mass", () => {
    expect(schwarzschildRadius(2e30) / schwarzschildRadius(1e30)).toBeCloseTo(
      2,
      12,
    );
  });
});

// ─── metric components ───────────────────────────────────────────────────────

describe("metric components", () => {
  it("g_tt → −1 (Minkowski) far from the mass", () => {
    expect(gtt(1e6)).toBeCloseTo(-1, 5);
  });

  it("g_tt vanishes at the horizon x = 1", () => {
    expect(gtt(1)).toBeCloseTo(0, 12);
  });

  it("g_rr → 1 (flat) far from the mass", () => {
    expect(grr(1e6)).toBeCloseTo(1, 5);
  });

  it("g_rr diverges approaching the horizon from outside", () => {
    expect(grr(1.0001)).toBeGreaterThan(1e3);
  });

  it("g_tt and g_rr are reciprocal-signed: g_tt · g_rr = −1 everywhere", () => {
    for (const x of [1.5, 2, 5, 20]) {
      expect(gtt(x) * grr(x)).toBeCloseTo(-1, 12);
    }
  });

  it("metricFactor is zero at the horizon and 1 at infinity", () => {
    expect(metricFactor(1)).toBeCloseTo(0, 12);
    expect(metricFactor(1e9)).toBeCloseTo(1, 6);
  });
});

// ─── timeDilationFactor ──────────────────────────────────────────────────────

describe("timeDilationFactor", () => {
  it("approaches 1 far from the mass", () => {
    expect(timeDilationFactor(1e6)).toBeCloseTo(1, 5);
  });

  it("is 0 at the horizon (clocks freeze as seen from infinity)", () => {
    expect(timeDilationFactor(1)).toBeCloseTo(0, 12);
  });

  it("is NaN inside the horizon (no static observer exists)", () => {
    expect(Number.isNaN(timeDilationFactor(0.5))).toBe(true);
  });

  it("equals √(1/2) at x = 2", () => {
    expect(timeDilationFactor(2)).toBeCloseTo(Math.SQRT1_2, 12);
  });
});

// ─── kretschmann ─────────────────────────────────────────────────────────────

describe("kretschmann", () => {
  it("is finite at the horizon (K = 12 at x = 1) — no real singularity there", () => {
    expect(kretschmann(1)).toBeCloseTo(12, 12);
  });

  it("diverges as x → 0 (the genuine r = 0 singularity)", () => {
    expect(kretschmann(0.01)).toBeGreaterThan(1e10);
  });

  it("falls off like x^-6", () => {
    expect(kretschmann(2) / kretschmann(4)).toBeCloseTo(2 ** 6, 9);
  });
});

// ─── effectivePotential ──────────────────────────────────────────────────────

describe("effectivePotential", () => {
  it("vanishes at the horizon for any ℓ (the (1 − 1/x) factor)", () => {
    expect(effectivePotential(1, 5)).toBeCloseTo(0, 12);
  });

  it("approaches 1 far away (rest energy, bound threshold)", () => {
    expect(effectivePotential(1e6, 4)).toBeCloseTo(1, 4);
  });

  it("has a local maximum and minimum for ℓ = 4 (stable + unstable orbits)", () => {
    const orbits = circularOrbitRadii(4)!;
    const eps = 1e-3;
    // local min at the stable radius: neighbours are higher
    const vMin = effectivePotential(orbits.stable, 4);
    expect(effectivePotential(orbits.stable - eps, 4)).toBeGreaterThan(vMin);
    expect(effectivePotential(orbits.stable + eps, 4)).toBeGreaterThan(vMin);
    // local max at the unstable radius: neighbours are lower
    const vMax = effectivePotential(orbits.unstable, 4);
    expect(effectivePotential(orbits.unstable - eps, 4)).toBeLessThan(vMax);
    expect(effectivePotential(orbits.unstable + eps, 4)).toBeLessThan(vMax);
  });
});

// ─── circularOrbitRadii / ISCO ───────────────────────────────────────────────

describe("circularOrbitRadii", () => {
  it("returns null below ℓ = √3 (no circular orbits exist)", () => {
    expect(circularOrbitRadii(1.7)).toBeNull();
    expect(circularOrbitRadii(Math.sqrt(3) - 0.01)).toBeNull();
  });

  it("merges both roots at x = 3 when ℓ = √3 (the ISCO)", () => {
    const o = circularOrbitRadii(Math.sqrt(3))!;
    expect(o.stable).toBeCloseTo(3, 9);
    expect(o.unstable).toBeCloseTo(3, 9);
  });

  it("stable root exceeds unstable root for ℓ > √3", () => {
    const o = circularOrbitRadii(5)!;
    expect(o.stable).toBeGreaterThan(o.unstable);
  });

  it("recovers the Newtonian circular radius x ≈ ℓ² for large ℓ", () => {
    const o = circularOrbitRadii(50)!;
    expect(o.stable).toBeCloseTo(50 * 50 * 2, -2);
  });

  it("each root is an extremum of V_eff (numerical derivative ≈ 0)", () => {
    const ell = 4;
    const o = circularOrbitRadii(ell)!;
    const h = 1e-5;
    for (const x of [o.stable, o.unstable]) {
      const dV =
        (effectivePotential(x + h, ell) - effectivePotential(x - h, ell)) /
        (2 * h);
      expect(Math.abs(dV)).toBeLessThan(1e-4);
    }
  });
});

describe("iscoRadius / photonSphereRadius", () => {
  it("ISCO sits at 3 r_s = 6 GM/c²", () => {
    expect(iscoRadius()).toBe(3);
  });

  it("photon sphere sits at 1.5 r_s = 3 GM/c²", () => {
    expect(photonSphereRadius()).toBe(1.5);
  });
});

// ─── flammHeight ─────────────────────────────────────────────────────────────

describe("flammHeight", () => {
  it("is zero at the horizon (the funnel mouth)", () => {
    expect(flammHeight(1)).toBeCloseTo(0, 12);
  });

  it("is NaN inside the horizon (embedding undefined there)", () => {
    expect(Number.isNaN(flammHeight(0.5))).toBe(true);
  });

  it("grows like 2√(x − 1)", () => {
    expect(flammHeight(2)).toBeCloseTo(2, 12);
    expect(flammHeight(5)).toBeCloseTo(4, 12);
  });
});

// ─── coordinateLightSpeedRadial ──────────────────────────────────────────────

describe("coordinateLightSpeedRadial", () => {
  it("is c far away", () => {
    expect(coordinateLightSpeedRadial(1e6)).toBeCloseTo(1, 5);
  });

  it("drops to 0 at the horizon (coordinate, not local, statement)", () => {
    expect(coordinateLightSpeedRadial(1)).toBeCloseTo(0, 12);
  });

  it("equals 1/2 at x = 2", () => {
    expect(coordinateLightSpeedRadial(2)).toBeCloseTo(0.5, 12);
  });
});
