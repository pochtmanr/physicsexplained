import { describe, expect, it } from "vitest";
import {
  chargeInvarianceFlux,
  weberKohlrauschRatio,
  fourCurrentFromRhoJ,
  continuityResidual,
} from "@/lib/physics/electromagnetism/charge-invariance";
import { SPEED_OF_LIGHT } from "@/lib/physics/constants";

describe("charge invariance — Q is the same in every frame", () => {
  it("returns the same Q at β = 0, 0.5, 0.9 within 1e-10 relative", () => {
    const rho = 1.234e-6; // C/m³
    const V = 0.5; // m³
    const Q0 = chargeInvarianceFlux(rho, V, 0);
    const Qhalf = chargeInvarianceFlux(rho, V, 0.5);
    const Q9 = chargeInvarianceFlux(rho, V, 0.9);

    const ref = rho * V;
    expect(Math.abs((Q0 - ref) / ref)).toBeLessThan(1e-10);
    expect(Math.abs((Qhalf - ref) / ref)).toBeLessThan(1e-10);
    expect(Math.abs((Q9 - ref) / ref)).toBeLessThan(1e-10);
  });

  it("rejects super-luminal β with a clear error", () => {
    expect(() => chargeInvarianceFlux(1, 1, 1)).toThrow(/β/);
    expect(() => chargeInvarianceFlux(1, 1, 1.2)).toThrow(/β/);
  });

  it("agrees with rho·V across a sweep of β values", () => {
    const rho = 7.7e-9;
    const V = 1.25;
    const ref = rho * V;
    for (const beta of [0, 0.1, 0.3, 0.6, 0.8, 0.95, 0.999]) {
      const Q = chargeInvarianceFlux(rho, V, beta);
      expect(Math.abs((Q - ref) / ref)).toBeLessThan(1e-10);
    }
  });
});

describe("Weber-Kohlrausch — √(1/μ₀ε₀) = c", () => {
  it("matches the speed of light to 1e-10 relative tolerance", () => {
    const ratio = weberKohlrauschRatio();
    const rel = Math.abs((ratio - SPEED_OF_LIGHT) / SPEED_OF_LIGHT);
    expect(rel).toBeLessThan(1e-10);
  });

  it("returns a positive finite number on the order of 3e8 m/s", () => {
    const r = weberKohlrauschRatio();
    expect(Number.isFinite(r)).toBe(true);
    expect(r).toBeGreaterThan(2.99e8);
    expect(r).toBeLessThan(3.01e8);
  });
});

describe("four-current shape", () => {
  it("packages (cρ, J_x, J_y, J_z) with the right component values", () => {
    const rho = 2.5;
    const J = { x: 4, y: -1, z: 7 };
    const Jmu = fourCurrentFromRhoJ(rho, J);
    expect(Jmu).toHaveLength(4);
    expect(Jmu[0]).toBeCloseTo(SPEED_OF_LIGHT * rho, 6);
    expect(Jmu[1]).toBe(4);
    expect(Jmu[2]).toBe(-1);
    expect(Jmu[3]).toBe(7);
  });

  it("gives a zero spatial part for purely static charge", () => {
    const Jmu = fourCurrentFromRhoJ(3, { x: 0, y: 0, z: 0 });
    expect(Jmu[0]).toBeCloseTo(SPEED_OF_LIGHT * 3, 6);
    expect(Jmu[1]).toBe(0);
    expect(Jmu[2]).toBe(0);
    expect(Jmu[3]).toBe(0);
  });
});

describe("continuity — ∂ρ/∂t + ∇·J = 0", () => {
  it("returns zero exactly when ∂ρ/∂t = -∇·J", () => {
    expect(continuityResidual(5, -5)).toBe(0);
    expect(continuityResidual(-2.7, 2.7)).toBe(0);
    expect(continuityResidual(0, 0)).toBe(0);
  });

  it("returns the violation magnitude when conservation fails", () => {
    expect(continuityResidual(1, 0)).toBe(1);
    expect(continuityResidual(2, 3)).toBe(5);
  });
});
