import { describe, expect, it } from "vitest";
import {
  twoSourceIntensity,
  thinFilmPhase,
  newtonRingRadius,
  coherenceLength,
} from "@/lib/physics/electromagnetism/interference";

describe("twoSourceIntensity — coherent overlap", () => {
  it("Δφ = 0 with equal amplitudes gives 4 E² (full constructive)", () => {
    const E = 2.5;
    const I = twoSourceIntensity(E, E, 0);
    expect(I).toBeCloseTo(4 * E * E, 10);
  });

  it("Δφ = π with equal amplitudes is exactly zero (full destructive)", () => {
    const E = 1.7;
    const I = twoSourceIntensity(E, E, Math.PI);
    expect(I).toBeCloseTo(0, 10);
  });

  it("incoherent sum (⟨cos Δφ⟩ = 0) would only give E₁² + E₂²", () => {
    // At Δφ = π/2 the cross term vanishes even with coherent addition.
    const I = twoSourceIntensity(3, 4, Math.PI / 2);
    expect(I).toBeCloseTo(9 + 16, 10);
  });
});

describe("thinFilmPhase — π-flip bookkeeping", () => {
  it("air/soap/air, d → 0: top reflection flips, bottom does not → Δφ = −π (destructive)", () => {
    // Very thin soap film in air: path phase ~ 0, only the top π-jump survives.
    const phi = thinFilmPhase(0, 1.33, 550e-9, 1.0, 1.0);
    expect(Math.abs(phi)).toBeCloseTo(Math.PI, 10);
  });

  it("soap film of thickness λ/(4 n) lands at the first constructive thickness", () => {
    // At d = λ/(4n) the round-trip is λ/2 → path phase = π. Add the −π from
    // the single reflection flip → total 0 (mod 2π) → constructive.
    const lambda = 550e-9;
    const n_film = 1.33;
    const d = lambda / (4 * n_film);
    const phi = thinFilmPhase(d, n_film, lambda, 1.0, 1.0);
    expect(phi).toBeCloseTo(0, 8);
  });

  it("Newton's-rings geometry (d = λ/2, glass/air/glass): destructive", () => {
    // Plano-convex lens on flat. Interference happens in the air film
    // (n_film = 1.0) between two glass surfaces (n = 1.5). Top reflection
    // glass→air does NOT flip (n_film < n_before). Bottom reflection
    // air→glass DOES flip (n_after > n_film). Round-trip 2 n_film d = λ at
    // d = λ/2 → path phase = 2π. Plus a +π from the single bottom flip →
    // total π → destructive (a dark ring, as expected).
    const lambda = 633e-9;
    const d = lambda / 2;
    const phi = thinFilmPhase(d, 1.0, lambda, 1.5, 1.5);
    expect(Math.abs(phi)).toBeCloseTo(Math.PI, 8);
  });
});

describe("newtonRingRadius — r_m = √(m · λ · R)", () => {
  it("m = 0 is the contact point, r = 0", () => {
    expect(newtonRingRadius(0, 633e-9, 1.0)).toBe(0);
  });

  it("ring radii scale as √m — the signature sqrt spacing", () => {
    const lambda = 633e-9;
    const R = 1.0; // 1 m radius of curvature
    const r1 = newtonRingRadius(1, lambda, R);
    const r4 = newtonRingRadius(4, lambda, R);
    const r9 = newtonRingRadius(9, lambda, R);
    // r_m ∝ √m ⇒ r_4 / r_1 = 2, r_9 / r_1 = 3.
    expect(r4 / r1).toBeCloseTo(2, 10);
    expect(r9 / r1).toBeCloseTo(3, 10);
  });

  it("first dark ring for HeNe on a 1 m lens sits at ~0.8 mm", () => {
    const r1 = newtonRingRadius(1, 633e-9, 1.0);
    expect(r1).toBeCloseTo(7.956e-4, 6); // √(6.33e-7) m
  });
});

describe("coherenceLength — L_c = λ² / Δλ", () => {
  it("HeNe 632.8 nm, ΔλFWHM ≈ 1.5 pm → L_c ≈ 27 cm", () => {
    const lambda = 632.8e-9;
    const dLambda = 1.5e-12;
    const Lc = coherenceLength(lambda, dLambda);
    // λ² / Δλ = (6.328e-7)² / 1.5e-12 ≈ 0.267 m.
    expect(Lc).toBeGreaterThan(0.25);
    expect(Lc).toBeLessThan(0.30);
  });

  it("white-light LED (Δλ = 100 nm @ 550 nm) has L_c ≈ 3 μm — barely any", () => {
    const Lc = coherenceLength(550e-9, 100e-9);
    // (5.5e-7)² / 1e-7 = 3.025e-6 m.
    expect(Lc).toBeCloseTo(3.025e-6, 9);
  });

  it("throws on non-positive inputs (no silent NaN leak into a chart)", () => {
    expect(() => coherenceLength(0, 1e-12)).toThrow();
    expect(() => coherenceLength(633e-9, 0)).toThrow();
    expect(() => coherenceLength(-1, 1)).toThrow();
  });
});
