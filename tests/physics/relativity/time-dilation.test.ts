import { describe, expect, it } from "vitest";
import { gamma } from "@/lib/physics/relativity/types";
import {
  dilatedTime,
  properTime,
  muonSurvivalFraction,
  classicalSurvivalFraction,
} from "@/lib/physics/relativity/time-dilation";

const C_MS = 2.99792458e8;
const TAU_MUON = 2.2e-6; // seconds — rest-frame muon decay timescale

describe("dilatedTime", () => {
  it("equals t0 at β = 0 (zero-β identity)", () => {
    expect(dilatedTime(1, 0)).toBeCloseTo(1, 12);
    expect(dilatedTime(2.2e-6, 0)).toBeCloseTo(2.2e-6, 18);
  });

  it("≈ 1.1547 · t0 at β = 0.5 (γ ≈ 2/√3)", () => {
    // γ(0.5) = 1/√(1 − 0.25) = 2/√3 ≈ 1.1547005383792515
    expect(dilatedTime(1, 0.5)).toBeCloseTo(1.1547005383792515, 10);
  });

  it("scales linearly in t0", () => {
    expect(dilatedTime(2, 0.6)).toBeCloseTo(2 * dilatedTime(1, 0.6), 12);
  });

  it("at β = 0.995, γ ≈ 10 → 2.2 μs proper ticks become ~22 μs in lab", () => {
    // γ(0.995) ≈ 10.0125 → 2.2 μs · γ ≈ 22.03 μs
    const lab = dilatedTime(2.2e-6, 0.995);
    expect(lab).toBeGreaterThan(2.1e-5);
    expect(lab).toBeLessThan(2.3e-5);
  });
});

describe("properTime", () => {
  it("equals dtLab at β = 0 (zero-β identity)", () => {
    expect(properTime(22e-6, 0)).toBeCloseTo(22e-6, 18);
  });

  it("inverts dilatedTime exactly", () => {
    const beta = 0.8;
    const t0 = 5;
    expect(properTime(dilatedTime(t0, beta), beta)).toBeCloseTo(t0, 12);
  });

  it("muon at β = 0.995 sees ~2.2 μs of proper time when 22 μs ticks in lab", () => {
    // γ(0.995) ≈ 10.0125 → τ_proper = 22 μs / 10.0125 ≈ 2.197 μs
    const tProper = properTime(22e-6, 0.995);
    expect(tProper).toBeCloseTo(22e-6 / gamma(0.995), 14);
    expect(tProper).toBeGreaterThan(2.0e-6);
    expect(tProper).toBeLessThan(2.4e-6);
  });
});

describe("muonSurvivalFraction (the §02.1 money shot)", () => {
  // The atmospheric-muon experimental fact: surviving fraction at sea level
  // is enormously larger than the classical no-dilation prediction. The plan
  // quotes "~7× excess at 10 km / β=0.995 / τ=2.2 μs ≈ 0.49"; a careful
  // calculation with the verbatim formula `2^(-t_proper/τ)` produces ≈ 0.35
  // at L = 10 km (and ≈ 0.49 at the Mt-Washington-like distance L ≈ 7 km).
  // The asymmetry test below — "many orders of magnitude excess" — captures
  // the experimental-fact essence either way.
  it("at β = 0.995, 10 km, τ = 2.2 μs is between the classical wrong answer and 1", () => {
    const surviving = muonSurvivalFraction(10_000, 0.995, TAU_MUON, C_MS);
    expect(surviving).toBeGreaterThan(0.30);
    expect(surviving).toBeLessThan(0.40);
    expect(surviving).toBeCloseTo(0.348, 2);
  });

  it("at β = 0.995, ~7 km column → ≈ 0.49 (the canonical ~0.49 figure)", () => {
    // The Mt-Washington / Frisch-Smith arithmetic: with the verbatim
    // formula, ≈ 0.49 surviving fraction occurs at L ≈ 6.75 km.
    const surviving = muonSurvivalFraction(6_750, 0.995, TAU_MUON, C_MS);
    expect(surviving).toBeCloseTo(0.49, 1);
  });

  it("vastly exceeds the classical (no-dilation) prediction at 10 km", () => {
    const relativistic = muonSurvivalFraction(10_000, 0.995, TAU_MUON, C_MS);
    const classical = classicalSurvivalFraction(10_000, 0.995, TAU_MUON, C_MS);
    // Classical ≈ 2.6e-5 at 10 km — sea level should see almost none.
    // Relativistic ≈ 0.35 — sea level sees most of them. Ratio ≫ 1000.
    expect(classical).toBeLessThan(1e-4);
    expect(relativistic / classical).toBeGreaterThan(1000);
  });

  it("approaches 1 as L → 0 (no time to decay)", () => {
    expect(muonSurvivalFraction(0.001, 0.995, TAU_MUON, C_MS)).toBeCloseTo(1, 4);
  });

  it("approaches 0 as L → ∞ (everything decays eventually)", () => {
    expect(muonSurvivalFraction(1e9, 0.995, TAU_MUON, C_MS)).toBeLessThan(1e-6);
  });

  it("returns 0.5 when proper-time travel equals exactly one half-life", () => {
    // Choose L so that t_proper = τ exactly:
    //   t_lab = L / (β·c), t_proper = t_lab / γ → L = β·c·γ·τ
    const beta = 0.995;
    const L = beta * C_MS * gamma(beta) * TAU_MUON;
    expect(muonSurvivalFraction(L, beta, TAU_MUON, C_MS)).toBeCloseTo(0.5, 8);
  });
});

describe("classicalSurvivalFraction (the no-dilation prediction)", () => {
  it("at β = 0.995, 10 km, τ = 2.2 μs is essentially zero — sea level should see no muons", () => {
    const classical = classicalSurvivalFraction(10_000, 0.995, TAU_MUON, C_MS);
    expect(classical).toBeLessThan(1e-4);
  });

  it("agrees with the relativistic answer at β = 0 (no boost → no dilation)", () => {
    const c = classicalSurvivalFraction(100, 0.5, TAU_MUON, C_MS);
    const r = muonSurvivalFraction(100, 0.5, TAU_MUON, C_MS);
    // β = 0.5 still has a γ factor of ~1.155, so they differ slightly,
    // but the structural identity at β → 0 is what we care about: take
    // β so small that γ ≈ 1, so the two formulas agree.
    expect(r).not.toBeCloseTo(c, 3); // sanity: they ARE different at β=0.5
    const beta = 1e-6;
    expect(
      muonSurvivalFraction(100, beta, TAU_MUON, C_MS),
    ).toBeCloseTo(classicalSurvivalFraction(100, beta, TAU_MUON, C_MS), 8);
  });
});
