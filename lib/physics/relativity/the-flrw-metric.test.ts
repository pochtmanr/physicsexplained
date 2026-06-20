/**
 * §54 THE FLRW METRIC — unit tests.
 *
 * Covers properDistance / comovingDistance round-trip, recessionVelocity,
 * hubbleParameter, redshift ↔ scale-factor inversion, the S_k radial
 * function, Gauss–Bonnet angle sums, and g_rr.
 */

import { describe, expect, it } from "vitest";
import {
  properDistance,
  comovingDistance,
  recessionVelocity,
  hubbleParameter,
  redshiftFromScaleFactor,
  scaleFactorFromRedshift,
  sk,
  triangleAngleSum,
  angleSumDegrees,
  gRadial,
} from "@/lib/physics/relativity/the-flrw-metric";

// ─── proper / comoving distance ──────────────────────────────────────────────

describe("properDistance / comovingDistance", () => {
  it("proper = a · comoving", () => {
    expect(properDistance(2, 5)).toBe(10);
    expect(properDistance(1, 5)).toBe(5);
  });

  it("round-trips through comovingDistance", () => {
    const chi = 7.3;
    const a = 1.8;
    expect(comovingDistance(properDistance(a, chi), a)).toBeCloseTo(chi, 12);
  });

  it("comovingDistance is safe at a = 0", () => {
    expect(comovingDistance(10, 0)).toBe(0);
  });
});

// ─── recession velocity / Hubble parameter ───────────────────────────────────

describe("recessionVelocity", () => {
  it("v = H · d (Hubble law)", () => {
    expect(recessionVelocity(2.3, 4)).toBeCloseTo(9.2, 12);
  });
});

describe("hubbleParameter", () => {
  it("H = ȧ / a", () => {
    expect(hubbleParameter(2, 1)).toBe(0.5);
  });
  it("is safe at a = 0", () => {
    expect(hubbleParameter(0, 1)).toBe(0);
  });
});

// ─── cosmological redshift ↔ scale factor ────────────────────────────────────

describe("redshift ↔ scale factor", () => {
  it("1 + z = a_now / a_emit", () => {
    // a_emit = 0.5 → universe was half its current size → z = 1
    expect(redshiftFromScaleFactor(0.5)).toBeCloseTo(1, 12);
    expect(redshiftFromScaleFactor(0.25)).toBeCloseTo(3, 12);
  });

  it("no shift today (a_emit = a_now = 1)", () => {
    expect(redshiftFromScaleFactor(1)).toBeCloseTo(0, 12);
  });

  it("inverts: a_emit = a_now / (1 + z)", () => {
    const z = 1100; // recombination
    const a = scaleFactorFromRedshift(z);
    expect(a).toBeCloseTo(1 / 1101, 12);
    expect(redshiftFromScaleFactor(a)).toBeCloseTo(z, 6);
  });

  it("CMB redshift z ≈ 1100 means space has grown ~1101×", () => {
    expect(1 / scaleFactorFromRedshift(1100)).toBeCloseTo(1101, 6);
  });
});

// ─── S_k radial function ─────────────────────────────────────────────────────

describe("sk", () => {
  it("flat: S(χ) = χ", () => {
    expect(sk(0.7, 0)).toBeCloseTo(0.7, 12);
  });
  it("closed: S(χ) = sin χ", () => {
    expect(sk(Math.PI / 2, 1)).toBeCloseTo(1, 12);
  });
  it("open: S(χ) = sinh χ", () => {
    expect(sk(1, -1)).toBeCloseTo(Math.sinh(1), 12);
  });
  it("all three agree to first order at small χ", () => {
    const chi = 1e-4;
    expect(sk(chi, 1)).toBeCloseTo(chi, 10);
    expect(sk(chi, -1)).toBeCloseTo(chi, 10);
  });
});

// ─── Gauss–Bonnet angle sums ─────────────────────────────────────────────────

describe("triangleAngleSum", () => {
  it("flat space: angle sum is exactly π", () => {
    expect(triangleAngleSum(1.0, 0)).toBeCloseTo(Math.PI, 12);
  });
  it("positive curvature bulges the sum above π", () => {
    expect(triangleAngleSum(0.5, 1)).toBeGreaterThan(Math.PI);
  });
  it("negative curvature pinches the sum below π", () => {
    expect(triangleAngleSum(0.5, -1)).toBeLessThan(Math.PI);
  });
});

describe("angleSumDegrees", () => {
  it("flat slice gives 180°", () => {
    expect(angleSumDegrees(0.3, 0)).toBeCloseTo(180, 12);
  });
  it("closed slice exceeds 180°, open slice falls below", () => {
    expect(angleSumDegrees(0.3, 1)).toBeGreaterThan(180);
    expect(angleSumDegrees(0.3, -1)).toBeLessThan(180);
  });
  it("clamps fractional area into [0, 1]", () => {
    expect(angleSumDegrees(5, 0)).toBeCloseTo(180, 12);
    expect(angleSumDegrees(-5, 0)).toBeCloseTo(180, 12);
  });
});

// ─── g_rr ────────────────────────────────────────────────────────────────────

describe("gRadial", () => {
  it("flat: g_rr = a²", () => {
    expect(gRadial(2, 0.5, 0)).toBeCloseTo(4, 12);
  });
  it("closed universe diverges at the coordinate equator r = 1", () => {
    expect(gRadial(1, 1, 1)).toBe(Infinity);
  });
  it("open universe stays finite for all r", () => {
    expect(Number.isFinite(gRadial(1, 5, -1))).toBe(true);
  });
});
