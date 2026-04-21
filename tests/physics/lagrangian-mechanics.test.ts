import { describe, it, expect } from "vitest";
import {
  simplePendulumLagrangian,
  simplePendulumThetaDDot,
  doublePendulumEnergy,
  doublePendulumRhs,
  solveDoublePendulum,
  tautochroneTime,
} from "@/lib/physics/lagrangian-mechanics";
import { g_SI } from "@/lib/physics/constants";

describe("lagrangian — simple pendulum", () => {
  it("L = 0 at rest at the bottom", () => {
    expect(simplePendulumLagrangian(0, 0, { m: 1, L: 1 })).toBe(0);
  });

  it("L is positive with only kinetic energy", () => {
    const L = simplePendulumLagrangian(0, 1, { m: 1, L: 1 });
    // T = ½ · 1 · 1² · 1² = 0.5, V = 0.
    expect(L).toBeCloseTo(0.5, 10);
  });

  it("θ̈ = −(g/L) sin θ from Euler-Lagrange", () => {
    // At θ = π/2, sin θ = 1, so θ̈ = −g/L.
    expect(simplePendulumThetaDDot(Math.PI / 2, 1)).toBeCloseTo(-g_SI, 10);
    // At θ = 0 the bob is at equilibrium — no acceleration.
    expect(simplePendulumThetaDDot(0, 1)).toBe(-0);
  });
});

describe("lagrangian — double pendulum", () => {
  const params = { L1: 1, L2: 1, m1: 1, m2: 1 };

  it("rhs returns a length-4 vector", () => {
    const dy = doublePendulumRhs([0.1, 0.2, 0, 0], params);
    expect(dy.length).toBe(4);
    expect(Number.isFinite(dy[0]!)).toBe(true);
    expect(Number.isFinite(dy[3]!)).toBe(true);
  });

  it("at rest at equilibrium, all accelerations vanish", () => {
    const dy = doublePendulumRhs([0, 0, 0, 0], params);
    expect(dy[0]).toBe(0);
    expect(dy[1]).toBe(0);
    expect(Math.abs(dy[2]!)).toBeLessThan(1e-12);
    expect(Math.abs(dy[3]!)).toBeLessThan(1e-12);
  });

  it("energy is conserved along a trajectory to < 1%", () => {
    const initial = {
      theta1: 0.8,
      theta2: -0.4,
      omega1: 0,
      omega2: 0,
    };
    const E0 = doublePendulumEnergy(initial, params);
    const samples = solveDoublePendulum({
      initial,
      params,
      tEnd: 4,
      nSamples: 200,
    });
    const maxDrift = samples.reduce((worst, s) => {
      const E = doublePendulumEnergy(s.state, params);
      return Math.max(worst, Math.abs((E - E0) / E0));
    }, 0);
    expect(maxDrift).toBeLessThan(1e-2);
  });

  it("small-angle upper-pendulum limit approaches single-pendulum rate", () => {
    // If m2 → 0 and θ₂ tracks θ₁, the upper bob behaves like a single
    // pendulum of length L₁. With θ₁ small and everything else zero,
    // ω̇₁ ≈ −(g/L₁) θ₁.
    const limit = { L1: 1, L2: 1, m1: 1, m2: 1e-6 };
    const dy = doublePendulumRhs([0.05, 0.05, 0, 0], limit);
    const expected = -(g_SI / 1) * Math.sin(0.05);
    expect(dy[2]).toBeCloseTo(expected, 3);
  });
});

describe("lagrangian — cycloid re-export", () => {
  it("tautochrone time is π √(R/g)", () => {
    expect(tautochroneTime(1, g_SI)).toBeCloseTo(
      Math.PI * Math.sqrt(1 / g_SI),
      10,
    );
  });
});
