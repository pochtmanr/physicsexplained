/**
 * §09 LIGHT DEFLECTION AND GRAVITATIONAL LENSING — unit tests.
 *
 * Covers deflectionGR / deflectionNewtonian (the famous factor of two),
 * solarLimbDeflectionArcsec (the 1.75″ headline), einsteinRadius,
 * lensImagePositions, imageMagnification, totalMagnification, and the
 * tracePhoton integrator (asymptotic bend angle).
 */

import { describe, expect, it } from "vitest";
import {
  deflectionGR,
  deflectionNewtonian,
  solarLimbDeflectionArcsec,
  radToArcsec,
  einsteinRadius,
  lensImagePositions,
  imageMagnification,
  totalMagnification,
  tracePhoton,
  tracedBendAngle,
  R_SUN_M,
} from "@/lib/physics/relativity/light-deflection-and-lensing";
import { GM_SUN_SI, SPEED_OF_LIGHT } from "@/lib/physics/constants";

// ─── deflection angle ──────────────────────────────────────────────────────

describe("deflectionGR", () => {
  it("equals 4GM/(c²b)", () => {
    const b = 1e9;
    const expected = (4 * GM_SUN_SI) / (SPEED_OF_LIGHT ** 2 * b);
    expect(deflectionGR(b)).toBeCloseTo(expected, 30);
  });

  it("is exactly twice the Newtonian value at the same impact parameter", () => {
    const b = R_SUN_M;
    expect(deflectionGR(b)).toBeCloseTo(2 * deflectionNewtonian(b), 30);
  });

  it("falls off as 1/b — doubling b halves the deflection", () => {
    expect(deflectionGR(2e9)).toBeCloseTo(deflectionGR(1e9) / 2, 30);
  });

  it("diverges as b → 0", () => {
    expect(deflectionGR(0)).toBe(Infinity);
  });
});

describe("solarLimbDeflectionArcsec", () => {
  it("reproduces the 1919 headline ≈ 1.75 arcseconds (within 0.5%)", () => {
    const a = solarLimbDeflectionArcsec();
    expect(a).toBeGreaterThan(1.74);
    expect(a).toBeLessThan(1.76);
  });

  it("is twice the pre-1915 Newtonian half-value of ≈ 0.87″", () => {
    const newtonArcsec = radToArcsec(deflectionNewtonian(R_SUN_M));
    expect(solarLimbDeflectionArcsec()).toBeCloseTo(2 * newtonArcsec, 10);
    expect(newtonArcsec).toBeGreaterThan(0.86);
    expect(newtonArcsec).toBeLessThan(0.88);
  });
});

// ─── lensing geometry ──────────────────────────────────────────────────────

describe("einsteinRadius", () => {
  it("is zero for degenerate distances", () => {
    expect(einsteinRadius(0, 1e20, 1e20)).toBe(0);
  });

  it("grows as sqrt(GM)", () => {
    const r1 = einsteinRadius(1e20, 2e20, 1e20, GM_SUN_SI);
    const r2 = einsteinRadius(1e20, 2e20, 1e20, 4 * GM_SUN_SI);
    expect(r2).toBeCloseTo(2 * r1, 10);
  });

  it("is a small but positive angle for a stellar lens at galactic distances", () => {
    const kpc = 3.086e19;
    const r = einsteinRadius(4 * kpc, 8 * kpc, 4 * kpc, GM_SUN_SI);
    expect(r).toBeGreaterThan(0);
    expect(r).toBeLessThan(1e-6); // sub-microradian — milliarcsecond scale
  });
});

describe("lensImagePositions", () => {
  it("gives θ± = ½(u ± √(u²+4))", () => {
    const [tp, tm] = lensImagePositions(0.5);
    const root = Math.sqrt(0.25 + 4);
    expect(tp).toBeCloseTo(0.5 * (0.5 + root), 12);
    expect(tm).toBeCloseTo(0.5 * (0.5 - root), 12);
  });

  it("produces images at ±1 (the Einstein ring) for perfect alignment", () => {
    const [tp, tm] = lensImagePositions(0);
    expect(tp).toBeCloseTo(1, 12);
    expect(tm).toBeCloseTo(-1, 12);
  });

  it("places one image outside and one inside the Einstein radius", () => {
    const [tp, tm] = lensImagePositions(1.2);
    expect(Math.abs(tp)).toBeGreaterThan(1);
    expect(Math.abs(tm)).toBeLessThan(1);
  });

  it("satisfies the lens equation u = θ − 1/θ for both images", () => {
    const u = 0.8;
    const [tp, tm] = lensImagePositions(u);
    expect(tp - 1 / tp).toBeCloseTo(u, 12);
    expect(tm - 1 / tm).toBeCloseTo(u, 12);
  });
});

describe("imageMagnification", () => {
  it("diverges on the Einstein ring (θ = 1)", () => {
    expect(imageMagnification(1)).toBe(Infinity);
  });

  it("is positive for the outer image and negative for the inner image", () => {
    const [tp, tm] = lensImagePositions(0.5);
    expect(imageMagnification(tp)).toBeGreaterThan(0);
    expect(imageMagnification(tm)).toBeLessThan(0);
  });
});

describe("totalMagnification", () => {
  it("equals (u²+2)/(u√(u²+4))", () => {
    const u = 0.7;
    const expected = (u * u + 2) / (u * Math.sqrt(u * u + 4));
    expect(totalMagnification(u)).toBeCloseTo(expected, 12);
  });

  it("approaches 1 for a far-off source (u ≫ 1)", () => {
    expect(totalMagnification(50)).toBeGreaterThan(0.999);
    expect(totalMagnification(50)).toBeLessThan(1.001);
  });

  it("matches the sum of |individual magnifications|", () => {
    const u = 0.6;
    const [tp, tm] = lensImagePositions(u);
    const sum =
      Math.abs(imageMagnification(tp)) + Math.abs(imageMagnification(tm));
    expect(totalMagnification(u)).toBeCloseTo(sum, 8);
  });

  it("blows up as the source approaches perfect alignment", () => {
    expect(totalMagnification(0.001)).toBeGreaterThan(100);
  });
});

// ─── photon-trace integrator ───────────────────────────────────────────────

describe("tracePhoton", () => {
  it("returns a polyline that starts at the requested impact parameter", () => {
    const pts = tracePhoton(2, 0.05, -20, 20, 400, "gr");
    expect(pts[0].x).toBeCloseTo(-20, 6);
    expect(pts[0].y).toBeCloseTo(2, 6);
    expect(pts.length).toBe(401);
  });

  it("bends the ray toward the mass (final y below the initial y)", () => {
    const pts = tracePhoton(2, 0.1, -40, 40, 800, "gr");
    expect(pts[pts.length - 1].y).toBeLessThan(pts[0].y);
  });

  it("bends GR rays about twice as much as Newtonian rays", () => {
    const gr = Math.abs(tracedBendAngle(tracePhoton(3, 0.05, -60, 60, 1200, "gr")));
    const nt = Math.abs(
      tracedBendAngle(tracePhoton(3, 0.05, -60, 60, 1200, "newtonian")),
    );
    expect(gr / nt).toBeGreaterThan(1.8);
    expect(gr / nt).toBeLessThan(2.2);
  });

  it("reproduces a larger bend for a smaller impact parameter", () => {
    const close = Math.abs(
      tracedBendAngle(tracePhoton(2, 0.05, -60, 60, 1200, "gr")),
    );
    const far = Math.abs(
      tracedBendAngle(tracePhoton(6, 0.05, -60, 60, 1200, "gr")),
    );
    expect(close).toBeGreaterThan(far);
  });
});
