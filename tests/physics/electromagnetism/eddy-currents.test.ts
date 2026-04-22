import { describe, expect, it } from "vitest";
import {
  tubeTerminalVelocity,
  eddyPowerDensity,
  brakeDragCoefficient,
  brakeTimeConstant,
} from "@/lib/physics/electromagnetism/eddy-currents";

describe("tubeTerminalVelocity", () => {
  it("is inversely proportional to σ (double σ → half v_term)", () => {
    const v1 = tubeTerminalVelocity(0.1, 9.81, 1e7, 0.4, 1e-5);
    const v2 = tubeTerminalVelocity(0.1, 9.81, 2e7, 0.4, 1e-5);
    expect(v2 / v1).toBeCloseTo(0.5, 10);
  });

  it("falls as 1/B² (double B → quarter v_term)", () => {
    const v1 = tubeTerminalVelocity(0.1, 9.81, 1e7, 0.4, 1e-5);
    const v2 = tubeTerminalVelocity(0.1, 9.81, 1e7, 0.8, 1e-5);
    expect(v2 / v1).toBeCloseTo(0.25, 10);
  });

  it("scales linearly with mass (double m → double v_term)", () => {
    const v1 = tubeTerminalVelocity(0.1, 9.81, 1e7, 0.4, 1e-5);
    const v2 = tubeTerminalVelocity(0.2, 9.81, 1e7, 0.4, 1e-5);
    expect(v2 / v1).toBeCloseTo(2, 10);
  });

  it("throws when σ or k is non-positive", () => {
    expect(() => tubeTerminalVelocity(0.1, 9.81, 0, 0.4, 1e-5)).toThrow();
    expect(() => tubeTerminalVelocity(0.1, 9.81, 1e7, 0.4, 0)).toThrow();
    expect(() => tubeTerminalVelocity(0.1, 9.81, 1e7, 0, 1e-5)).toThrow();
  });

  it("gives a slow, finite terminal speed for neodymium-in-copper", () => {
    // σ_Cu ≈ 5.96e7 S/m; tuned k so a ~8 g NdFeB magnet falls slowly.
    const v = tubeTerminalVelocity(0.008, 9.81, 5.96e7, 0.35, 1e-5);
    expect(v).toBeGreaterThan(0);
    expect(v).toBeLessThan(5); // slower than a free-fall snapshot
  });
});

describe("eddyPowerDensity", () => {
  it("scales as d² (half-thickness → quarter power — the lamination rule)", () => {
    const p1 = eddyPowerDensity(1, 1e-3, 50, 1e-7);
    const p2 = eddyPowerDensity(1, 5e-4, 50, 1e-7);
    expect(p2 / p1).toBeCloseTo(0.25, 10);
  });

  it("scales as f² (double frequency → four-times power)", () => {
    const p1 = eddyPowerDensity(1, 1e-3, 50, 1e-7);
    const p2 = eddyPowerDensity(1, 1e-3, 100, 1e-7);
    expect(p2 / p1).toBeCloseTo(4, 10);
  });

  it("scales as B0²", () => {
    const p1 = eddyPowerDensity(1, 1e-3, 50, 1e-7);
    const p2 = eddyPowerDensity(2, 1e-3, 50, 1e-7);
    expect(p2 / p1).toBeCloseTo(4, 10);
  });

  it("is inversely proportional to ρ (double resistivity → half power)", () => {
    const p1 = eddyPowerDensity(1, 1e-3, 50, 1e-7);
    const p2 = eddyPowerDensity(1, 1e-3, 50, 2e-7);
    expect(p2 / p1).toBeCloseTo(0.5, 10);
  });

  it("throws when ρ is non-positive", () => {
    expect(() => eddyPowerDensity(1, 1e-3, 50, 0)).toThrow();
  });
});

describe("brakeDragCoefficient", () => {
  it("scales with B² (double B → four-times drag)", () => {
    const c1 = brakeDragCoefficient(3.5e7, 2e-3, 0.5, 0.01);
    const c2 = brakeDragCoefficient(3.5e7, 2e-3, 1.0, 0.01);
    expect(c2 / c1).toBeCloseTo(4, 10);
  });

  it("is zero when B is zero", () => {
    expect(brakeDragCoefficient(3.5e7, 2e-3, 0, 0.01)).toBe(0);
  });

  it("scales linearly with disk thickness", () => {
    const c1 = brakeDragCoefficient(3.5e7, 1e-3, 0.5, 0.01);
    const c2 = brakeDragCoefficient(3.5e7, 2e-3, 0.5, 0.01);
    expect(c2 / c1).toBeCloseTo(2, 10);
  });
});

describe("brakeTimeConstant", () => {
  it("returns the ratio I / (c · r²)", () => {
    const tau = brakeTimeConstant(0.5, 0.2, 0.1);
    expect(tau).toBeCloseTo(0.5 / (0.2 * 0.01), 10);
  });

  it("longer rotor arm shortens τ quadratically", () => {
    const tauShort = brakeTimeConstant(0.5, 0.2, 0.1);
    const tauLong = brakeTimeConstant(0.5, 0.2, 0.2);
    expect(tauShort / tauLong).toBeCloseTo(4, 10);
  });

  it("throws for non-positive drag or radius", () => {
    expect(() => brakeTimeConstant(0.5, 0, 0.1)).toThrow();
    expect(() => brakeTimeConstant(0.5, 0.2, 0)).toThrow();
  });
});
