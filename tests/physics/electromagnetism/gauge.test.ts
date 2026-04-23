import { describe, expect, it } from "vitest";
import {
  gaugeTransform,
  electricFromPotentials,
  checkGaugeInvariance,
  lorenzGaugeResidual,
  isLorenzGauge,
  isCoulombGauge,
} from "@/lib/physics/electromagnetism/gauge";
import { SPEED_OF_LIGHT } from "@/lib/physics/constants";

describe("gaugeTransform", () => {
  it("is the identity when f = 0 (gradF = 0, ∂f/∂t = 0)", () => {
    const A = { x: 1.2, y: -0.7, z: 3.14 };
    const V = 5.0;
    const out = gaugeTransform(A, V, { x: 0, y: 0, z: 0 }, 0);
    expect(out.A).toEqual(A);
    expect(out.V).toBe(V);
  });

  it("adds ∇f to A and subtracts ∂f/∂t from V componentwise", () => {
    const A = { x: 1, y: 2, z: 3 };
    const V = 10;
    const gradF = { x: 0.5, y: -1, z: 2 };
    const dFdt = 4;
    const out = gaugeTransform(A, V, gradF, dFdt);
    expect(out.A).toEqual({ x: 1.5, y: 1, z: 5 });
    expect(out.V).toBe(6);
  });
});

describe("checkGaugeInvariance of E = −∇V − ∂A/∂t", () => {
  it("is satisfied for a nontrivial gauge function f(x, y, z, t) = α·x·t", () => {
    // f = α·x·t  ⇒  ∇f = (α·t, 0, 0),  ∂f/∂t = α·x.
    // Under the shift A → A + ∇f, V → V − ∂f/∂t:
    //   gradV adjusts by −∇(∂f/∂t) = (−α, 0, 0)
    //   dAdt  adjusts by +∂(∇f)/∂t = (+α, 0, 0)
    // The two corrections cancel in E, so E before and after must match.
    const alpha = 0.7;
    const t = 1.3;
    const x = 0.4;

    // Pick arbitrary "before" values
    const gradV = { x: 2, y: -1, z: 0.5 };
    const dAdt = { x: 0.3, y: 0.2, z: -0.1 };

    // After-values given the f chosen above
    const gradVAfter = { x: gradV.x - alpha, y: gradV.y, z: gradV.z };
    const dAdtAfter = { x: dAdt.x + alpha, y: dAdt.y, z: dAdt.z };
    void t;
    void x;

    expect(checkGaugeInvariance(gradV, dAdt, gradVAfter, dAdtAfter)).toBe(true);

    // Sanity: E itself computes the same both ways.
    const Ebefore = electricFromPotentials(gradV, dAdt);
    const Eafter = electricFromPotentials(gradVAfter, dAdtAfter);
    expect(Eafter.x).toBeCloseTo(Ebefore.x, 15);
    expect(Eafter.y).toBeCloseTo(Ebefore.y, 15);
    expect(Eafter.z).toBeCloseTo(Ebefore.z, 15);
  });

  it("returns false when the 'after' values drift by more than the tolerance", () => {
    const gradV = { x: 1, y: 0, z: 0 };
    const dAdt = { x: 0, y: 0, z: 0 };
    const gradVAfter = { x: 1 + 1e-6, y: 0, z: 0 };
    const dAdtAfter = { x: 0, y: 0, z: 0 };
    expect(checkGaugeInvariance(gradV, dAdt, gradVAfter, dAdtAfter, 1e-10)).toBe(
      false,
    );
    // With a looser tolerance, the same inputs pass.
    expect(checkGaugeInvariance(gradV, dAdt, gradVAfter, dAdtAfter, 1e-4)).toBe(
      true,
    );
  });
});

describe("lorenzGaugeResidual / isLorenzGauge", () => {
  it("is zero for a (V, A) pair chosen to satisfy the condition", () => {
    // Pick any ∂V/∂t; then set ∇·A = −(1/c²) ∂V/∂t by hand.
    const dVdt = 3.7;
    const divA = -dVdt / (SPEED_OF_LIGHT * SPEED_OF_LIGHT);
    expect(lorenzGaugeResidual(divA, dVdt)).toBeCloseTo(0, 20);
    expect(isLorenzGauge(divA, dVdt)).toBe(true);
  });

  it("is nonzero (and detected) for a generic (V, A) pair", () => {
    // Coulomb-gauge pair ∇·A = 0 with ∂V/∂t ≠ 0 does NOT satisfy Lorenz.
    // Use c = 1 (normalised units) so the dVdt/c² term is visible at machine
    // precision — with SI's c = 3e8 the residual for everyday dVdt values is
    // already below the default tolerance, which is the whole motivation for
    // letting the user pass an explicit c.
    const residual = lorenzGaugeResidual(0, 5.0, 1);
    expect(residual).toBeGreaterThan(0);
    expect(isLorenzGauge(0, 5.0, 1e-12, 1)).toBe(false);
  });

  it("accepts an explicit propagation speed c (useful for unit-scaled tests)", () => {
    // With c = 1 and ∇·A = −∂V/∂t the residual is zero.
    expect(lorenzGaugeResidual(-2.5, 2.5, 1)).toBeCloseTo(0, 20);
    expect(isLorenzGauge(-2.5, 2.5, 1e-12, 1)).toBe(true);
  });
});

describe("isCoulombGauge", () => {
  it("holds when ∇·A is zero", () => {
    expect(isCoulombGauge(0)).toBe(true);
    expect(isCoulombGauge(1e-15)).toBe(true);
  });

  it("fails when ∇·A is nonzero above tolerance", () => {
    expect(isCoulombGauge(1e-6)).toBe(false);
    expect(isCoulombGauge(1e-6, 1e-4)).toBe(true);
  });

  it("is independent of ∂V/∂t (Coulomb gauge ignores V entirely)", () => {
    // This is the whole point — Coulomb gauge is a statement about A only.
    // We don't pass V at all; just confirm that the condition tolerates any
    // ∂V/∂t by not even asking.
    expect(isCoulombGauge(0)).toBe(true);
  });
});
