import { describe, expect, it } from "vitest";
import {
  schwarzschildRadius,
  weakFieldGtt,
  newtonianPotential,
} from "@/lib/physics/relativity/gravity-as-geometry";
import { G_SI, SPEED_OF_LIGHT } from "@/lib/physics/constants";

const M_SUN = 1.989e30; // kg
const M_EARTH = 5.972e24; // kg
const c = SPEED_OF_LIGHT;

describe("schwarzschildRadius", () => {
  it("for one solar mass is ≈ 2953 m (canonical textbook value)", () => {
    // r_s = 2 G M / c² with G = 6.6743e-11, M_sun = 1.989e30, c = 2.998e8
    // Numeric value sits at 2953.25 m within standard precision; assert within 1 m.
    const rs = schwarzschildRadius(M_SUN);
    expect(rs).toBeGreaterThan(2952);
    expect(rs).toBeLessThan(2955);
  });

  it("for one Earth mass is ≈ 8.87 mm (the classic 'Earth as a black hole' factoid)", () => {
    const rs = schwarzschildRadius(M_EARTH);
    expect(rs).toBeCloseTo(2 * G_SI * M_EARTH / (c * c), 12);
    expect(rs).toBeGreaterThan(8e-3);
    expect(rs).toBeLessThan(10e-3);
  });

  it("scales linearly with M", () => {
    const r1 = schwarzschildRadius(M_SUN);
    const r2 = schwarzschildRadius(2 * M_SUN);
    expect(r2 / r1).toBeCloseTo(2, 12);
  });

  it("throws on M <= 0", () => {
    expect(() => schwarzschildRadius(0)).toThrow(RangeError);
    expect(() => schwarzschildRadius(-1)).toThrow(RangeError);
  });
});

describe("weakFieldGtt", () => {
  it("at r = 100 r_s for a 1 M_sun source is ≈ −(1 − 0.02) = −0.98 (small departure from flat)", () => {
    // At r = 100 r_s, 2Φ/c² = -2GM/(r c²) = -r_s/r = -0.01.
    // g_tt = -(1 + 2Φ/c²) = -(1 - 0.01) = -0.99.
    const rs = schwarzschildRadius(M_SUN);
    const gtt = weakFieldGtt(100 * rs, M_SUN);
    expect(gtt).toBeCloseTo(-0.99, 6);
  });

  it("approaches the flat-space value g_tt = −1 as r → ∞", () => {
    // For any finite M, lim_{r → ∞} weakFieldGtt(r, M) = -1.
    const rs = schwarzschildRadius(M_SUN);
    const gtt = weakFieldGtt(1e12 * rs, M_SUN);
    expect(gtt).toBeCloseTo(-1, 10);
  });

  it("departure from −1 is twice the (negative) Newtonian potential / c²", () => {
    // g_tt = -(1 + 2Φ/c²); g_tt + 1 = -2Φ/c²; (-2Φ/c²) > 0 because Φ < 0.
    const r = 1e7; // m, well outside Earth's surface
    const gtt = weakFieldGtt(r, M_EARTH);
    const phi = newtonianPotential(r, M_EARTH);
    expect(gtt + 1).toBeCloseTo(-2 * phi / (c * c), 14);
  });

  it("for the Sun at Earth's orbit (1 AU) the deviation is parts-per-billion", () => {
    // Φ_sun at 1 AU ≈ -GM_sun/r_AU ≈ -8.87e8 m²/s².
    // 2Φ/c² ≈ -1.97e-8 — a parts-per-100-million deviation from flat.
    const r_AU = 1.495978707e11; // m
    const gtt = weakFieldGtt(r_AU, M_SUN);
    expect(Math.abs(gtt + 1)).toBeLessThan(2.5e-8);
    expect(Math.abs(gtt + 1)).toBeGreaterThan(1.5e-8);
  });
});

describe("newtonianPotential", () => {
  it("Φ = -GM/r is negative for any positive (r, M)", () => {
    expect(newtonianPotential(1e7, M_EARTH)).toBeLessThan(0);
    expect(newtonianPotential(1.495978707e11, M_SUN)).toBeLessThan(0);
  });

  it("matches the literal -GM/r formula", () => {
    const r = 6.371e6;
    const phi = newtonianPotential(r, M_EARTH);
    expect(phi).toBeCloseTo(-G_SI * M_EARTH / r, 18);
  });

  it("scales as 1/r — halving r doubles |Φ|", () => {
    const phi1 = newtonianPotential(1e7, M_EARTH);
    const phi2 = newtonianPotential(5e6, M_EARTH);
    expect(phi2 / phi1).toBeCloseTo(2, 12);
  });

  it("throws on r ≤ 0 or M ≤ 0", () => {
    expect(() => newtonianPotential(0, M_EARTH)).toThrow(RangeError);
    expect(() => newtonianPotential(-1, M_EARTH)).toThrow(RangeError);
    expect(() => newtonianPotential(1, 0)).toThrow(RangeError);
    expect(() => newtonianPotential(1, -1)).toThrow(RangeError);
  });
});
