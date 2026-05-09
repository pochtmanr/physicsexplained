/**
 * §08 EINSTEIN'S FIELD EQUATIONS — unit tests.
 *
 * Tests cover einsteinCoupling, schwarzschildRadius, solarSchwarzschildRadius,
 * earthSchwarzschildRadius, efeResidual, and einsteinCouplingValueSI.
 */

import { describe, expect, it } from "vitest";
import {
  einsteinCoupling,
  schwarzschildRadius,
  solarSchwarzschildRadius,
  earthSchwarzschildRadius,
  efeResidual,
  einsteinCouplingValueSI,
} from "@/lib/physics/relativity/efe";
import { G_SI, SPEED_OF_LIGHT } from "@/lib/physics/constants";

// ─── einsteinCoupling ─────────────────────────────────────────────────────────

describe("einsteinCoupling", () => {
  it("returns approximately 2.077e-43 in SI units (within 1%)", () => {
    const kappa = einsteinCoupling();
    const expected = (8 * Math.PI * G_SI) / Math.pow(SPEED_OF_LIGHT, 4);
    expect(kappa).toBeCloseTo(expected, 50);
    // 1% tolerance around 2.077e-43
    expect(kappa).toBeGreaterThan(2.077e-43 * 0.99);
    expect(kappa).toBeLessThan(2.077e-43 * 1.01);
  });

  it("is positive — geometry and matter couple with the same sign", () => {
    expect(einsteinCoupling()).toBeGreaterThan(0);
  });

  it("scales as G/c⁴ — doubling G doubles κ", () => {
    const kappa1 = einsteinCoupling(G_SI);
    const kappa2 = einsteinCoupling(2 * G_SI);
    expect(kappa2).toBeCloseTo(2 * kappa1, 50);
  });
});

// ─── schwarzschildRadius ──────────────────────────────────────────────────────

describe("schwarzschildRadius", () => {
  it("solar mass ≈ 2954 m (roughly 3 km)", () => {
    const r_s = solarSchwarzschildRadius();
    expect(r_s).toBeGreaterThan(2940);
    expect(r_s).toBeLessThan(2970);
  });

  it("Earth's Schwarzschild radius ≈ 8.87 mm", () => {
    const r_s = earthSchwarzschildRadius();
    // expect value in metres, ~0.00887
    expect(r_s).toBeGreaterThan(0.0087);
    expect(r_s).toBeLessThan(0.0090);
  });

  it("is linear in mass: r_s(2M) = 2 r_s(M)", () => {
    const M = 1e25; // arbitrary mass in kg
    expect(schwarzschildRadius(2 * M)).toBeCloseTo(
      2 * schwarzschildRadius(M),
      10,
    );
  });

  it("Schwarzschild radius of zero mass is 0", () => {
    expect(schwarzschildRadius(0)).toBe(0);
  });

  it("is proportional to G: doubling G doubles r_s", () => {
    const M = 2e30;
    const r1 = schwarzschildRadius(M, G_SI);
    const r2 = schwarzschildRadius(M, 2 * G_SI);
    expect(r2).toBeCloseTo(2 * r1, 10);
  });
});

// ─── efeResidual ──────────────────────────────────────────────────────────────

describe("efeResidual", () => {
  it("with Λ=0 reduces to G_{μν} − κ T_{μν}", () => {
    const G_munu = 1.5;
    const T_munu = 2.3;
    const kappa = einsteinCoupling();
    const residual = efeResidual(G_munu, T_munu, 1, 0);
    expect(residual).toBeCloseTo(G_munu - kappa * T_munu, 40);
  });

  it("returns 0 when the field equations are satisfied (Λ=0)", () => {
    // Set G_munu = κ T_munu with T_munu = 1e44 (chosen so product is ~1)
    const T_munu = 1e44;
    const kappa = einsteinCoupling();
    const G_munu = kappa * T_munu; // exact solution
    const residual = efeResidual(G_munu, T_munu, 1, 0);
    expect(Math.abs(residual)).toBeLessThan(1e-10);
  });

  it("non-zero Λ shifts the residual by Λ·g_{μν}", () => {
    const G_munu = 1;
    const T_munu = 0;
    const g_munu = 1;
    const Lambda = 1.1e-52; // order of actual cosmological constant in SI
    const residual = efeResidual(G_munu, T_munu, g_munu, Lambda);
    expect(residual).toBeCloseTo(G_munu + Lambda * g_munu, 60);
  });
});

// ─── einsteinCouplingValueSI ──────────────────────────────────────────────────

describe("einsteinCouplingValueSI", () => {
  it("returns the same value as einsteinCoupling()", () => {
    expect(einsteinCouplingValueSI()).toBe(einsteinCoupling());
  });
});
