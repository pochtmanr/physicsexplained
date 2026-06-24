import { describe, it, expect } from "vitest";
import {
  K_B,
  einsteinStokesD,
  kBFromD,
  diffusionFromStep,
  simulateWalk2D,
  ensembleMSD,
} from "@/lib/physics/thermodynamics/brownian";
import { mulberry32 } from "@/lib/physics/thermodynamics/random";

describe("Einstein–Stokes relation", () => {
  it("gives a physically sensible D for a Perrin-scale bead", () => {
    // r = 0.5 µm gamboge sphere in water (η ≈ 1e-3 Pa·s) at 293 K
    const D = einsteinStokesD(293, 1e-3, 0.5e-6);
    // order ~ 4e-13 m²/s
    expect(D).toBeGreaterThan(1e-13);
    expect(D).toBeLessThan(1e-12);
  });

  it("kBFromD inverts einsteinStokesD (the Perrin route to k_B)", () => {
    const T = 293;
    const eta = 1e-3;
    const r = 0.5e-6;
    const D = einsteinStokesD(T, eta, r);
    const recovered = kBFromD(D, T, eta, r);
    expect(recovered).toBeCloseTo(K_B, 28); // ~1.381e-23
    expect(recovered / K_B).toBeCloseTo(1, 9);
  });
});

describe("random walk", () => {
  it("returns a trajectory of the right length starting at the origin", () => {
    const walk = simulateWalk2D(mulberry32(1), 50, 1);
    expect(walk.xs).toHaveLength(51);
    expect(walk.ys).toHaveLength(51);
    expect(walk.xs[0]).toBe(0);
    expect(walk.ys[0]).toBe(0);
  });

  it("mean-square displacement grows linearly with slope ≈ 4D", () => {
    const stepStd = 0.7;
    const steps = 60;
    const msd = ensembleMSD(mulberry32(2024), 6000, steps, stepStd);
    const D = diffusionFromStep(stepStd, 1);
    // ⟨r²⟩(n) ≈ 4 D n. Check the endpoint and a midpoint within tolerance.
    expect(msd[steps] / (4 * D * steps)).toBeCloseTo(1, 1);
    const mid = steps / 2;
    expect(msd[mid] / (4 * D * mid)).toBeCloseTo(1, 1);
    // linearity: slope between mid and end matches slope from 0 to mid
    const slope1 = msd[mid] / mid;
    const slope2 = (msd[steps] - msd[mid]) / mid;
    expect(slope2 / slope1).toBeCloseTo(1, 0);
  });
});
