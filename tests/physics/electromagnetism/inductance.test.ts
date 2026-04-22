import { describe, expect, it } from "vitest";
import {
  solenoidSelfInductance,
  toroidSelfInductance,
  selfInducedEmf,
  concentricSolenoidMutual,
  rlTimeConstant,
  rlCurrent,
} from "@/lib/physics/electromagnetism/inductance";
import { MU_0 } from "@/lib/physics/constants";

describe("solenoidSelfInductance", () => {
  it("matches μ₀·N²·A/ℓ for a textbook case", () => {
    // 300 turns, 5 cm² cross-section, 0.2 m long.
    const N = 300;
    const A = 5e-4;
    const ell = 0.2;
    const L = solenoidSelfInductance(N, A, ell);
    expect(L).toBeCloseTo((MU_0 * N * N * A) / ell, 18);
  });

  it("scales with N² — doubling N quadruples L", () => {
    const L1 = solenoidSelfInductance(100, 1e-4, 0.1);
    const L2 = solenoidSelfInductance(200, 1e-4, 0.1);
    expect(L2 / L1).toBeCloseTo(4, 12);
  });

  it("is linear in cross-sectional area", () => {
    const L1 = solenoidSelfInductance(500, 1e-4, 0.2);
    const L2 = solenoidSelfInductance(500, 3e-4, 0.2);
    expect(L2 / L1).toBeCloseTo(3, 12);
  });

  it("falls inversely with length", () => {
    const Lshort = solenoidSelfInductance(400, 2e-4, 0.1);
    const Llong = solenoidSelfInductance(400, 2e-4, 0.4);
    expect(Lshort / Llong).toBeCloseTo(4, 12);
  });

  it("throws when length is non-positive", () => {
    expect(() => solenoidSelfInductance(100, 1e-4, 0)).toThrow();
    expect(() => solenoidSelfInductance(100, 1e-4, -0.1)).toThrow();
  });
});

describe("toroidSelfInductance", () => {
  it("matches μ₀·N²·h·ln(b/a)/(2π) for a textbook case", () => {
    // 250 turns, 1 cm tall, inner radius 2 cm, outer radius 3 cm.
    const N = 250;
    const h = 0.01;
    const a = 0.02;
    const b = 0.03;
    const L = toroidSelfInductance(N, h, a, b);
    const expected = (MU_0 * N * N * h * Math.log(b / a)) / (2 * Math.PI);
    expect(L).toBeCloseTo(expected, 18);
  });

  it("scales with N²", () => {
    const L1 = toroidSelfInductance(100, 0.01, 0.02, 0.03);
    const L2 = toroidSelfInductance(300, 0.01, 0.02, 0.03);
    expect(L2 / L1).toBeCloseTo(9, 10);
  });

  it("throws for invalid radii", () => {
    expect(() => toroidSelfInductance(100, 0.01, 0, 0.03)).toThrow();
    expect(() => toroidSelfInductance(100, 0.01, 0.03, 0.02)).toThrow();
  });
});

describe("selfInducedEmf", () => {
  it("opposes a rising current (negative when dI/dt > 0)", () => {
    expect(selfInducedEmf(0.5, 2.0)).toBe(-1.0);
  });

  it("pushes forward when current is falling (positive when dI/dt < 0)", () => {
    expect(selfInducedEmf(0.5, -2.0)).toBe(1.0);
  });

  it("is zero when the current is steady", () => {
    expect(selfInducedEmf(1.0, 0)).toBeCloseTo(0, 15);
  });
});

describe("concentricSolenoidMutual", () => {
  it("matches μ₀·n1·N2·A for a textbook case", () => {
    const n1 = 2000; // turns/m
    const N2 = 100;
    const A = 1e-4; // m²
    const M = concentricSolenoidMutual(n1, N2, A);
    expect(M).toBeCloseTo(MU_0 * n1 * N2 * A, 18);
  });

  it("is linear in the secondary turn count", () => {
    const M1 = concentricSolenoidMutual(1000, 50, 2e-4);
    const M2 = concentricSolenoidMutual(1000, 200, 2e-4);
    expect(M2 / M1).toBeCloseTo(4, 12);
  });
});

describe("rlTimeConstant", () => {
  it("τ = L/R", () => {
    expect(rlTimeConstant(2.0, 4.0)).toBe(0.5);
  });

  it("throws when R is non-positive", () => {
    expect(() => rlTimeConstant(1.0, 0)).toThrow();
    expect(() => rlTimeConstant(1.0, -1)).toThrow();
  });
});

describe("rlCurrent", () => {
  it("starts at 0 when t = 0", () => {
    expect(rlCurrent(12, 4, 2, 0)).toBe(0);
  });

  it("reaches ~63.2 % of the asymptote at t = τ", () => {
    const V = 12;
    const R = 4;
    const L = 2;
    const tau = L / R;
    const I = rlCurrent(V, R, L, tau);
    expect(I / (V / R)).toBeCloseTo(1 - 1 / Math.E, 10);
  });

  it("reaches ~95 % of the asymptote at t = 3τ", () => {
    const V = 9;
    const R = 3;
    const L = 1.5;
    const tau = L / R;
    const I = rlCurrent(V, R, L, 3 * tau);
    expect(I / (V / R)).toBeCloseTo(1 - Math.exp(-3), 10);
  });

  it("approaches V/R as t → ∞", () => {
    const V = 5;
    const R = 2;
    const I = rlCurrent(V, R, 0.1, 100);
    expect(I).toBeCloseTo(V / R, 10);
  });
});
