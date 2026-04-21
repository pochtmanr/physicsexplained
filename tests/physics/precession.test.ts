import { describe, it, expect } from "vitest";
import {
  precessionOmega,
  precessionPeriod,
  nutationOmega,
  spinAngularMomentum,
  gravityTorque,
  sagnacPathDifference,
} from "@/lib/physics/precession";
import { g_SI } from "@/lib/physics/constants";

describe("precession — Ω_p = m·g·r / (I·ω_spin)", () => {
  it("matches the closed form for a toy disk", () => {
    // A 300 g disk on a 15 cm arm, I = ½·m·r² with r_disk = 5 cm, spinning at 40 rad/s.
    const m = 0.3;
    const rArm = 0.15;
    const rDisk = 0.05;
    const I = 0.5 * m * rDisk * rDisk;
    const omegaSpin = 40;
    const expected = (m * g_SI * rArm) / (I * omegaSpin);
    expect(precessionOmega(m, rArm, I, omegaSpin)).toBeCloseTo(expected, 12);
  });

  it("scales inversely with spin rate (double the spin, half the precession)", () => {
    const slow = precessionOmega(0.3, 0.15, 1e-4, 20);
    const fast = precessionOmega(0.3, 0.15, 1e-4, 40);
    expect(slow / fast).toBeCloseTo(2, 10);
  });

  it("throws when spin rate is zero", () => {
    expect(() => precessionOmega(1, 0.1, 1e-3, 0)).toThrow();
  });

  it("throws for non-positive moment of inertia", () => {
    expect(() => precessionOmega(1, 0.1, 0, 40)).toThrow();
    expect(() => precessionOmega(1, 0.1, -1e-3, 40)).toThrow();
  });

  it("precessionPeriod is 2π / Ω_p", () => {
    const args = [0.3, 0.15, 0.5 * 0.3 * 0.05 * 0.05, 40] as const;
    const Omega = precessionOmega(...args);
    expect(precessionPeriod(...args)).toBeCloseTo((2 * Math.PI) / Omega, 12);
  });

  it("respects the optional g override", () => {
    const earth = precessionOmega(0.3, 0.15, 1e-4, 40, 9.80665);
    const moon = precessionOmega(0.3, 0.15, 1e-4, 40, 1.625);
    expect(earth / moon).toBeCloseTo(9.80665 / 1.625, 10);
  });
});

describe("nutation — ω_nut ≈ ω_spin · I_axial / I_transverse", () => {
  it("equal principal moments give ω_nut = ω_spin", () => {
    expect(nutationOmega(50, 1, 1)).toBeCloseTo(50, 10);
  });

  it("oblate body (I_axial > I_transverse) gives faster nutation than spin", () => {
    expect(nutationOmega(50, 2, 1)).toBeCloseTo(100, 10);
  });

  it("throws on non-positive transverse inertia", () => {
    expect(() => nutationOmega(50, 1, 0)).toThrow();
  });
});

describe("spin angular momentum and gravity torque", () => {
  it("|L| = I · ω_spin", () => {
    expect(spinAngularMomentum(2, 50)).toBeCloseTo(100, 12);
  });

  it("|τ| = m · g · r with standard gravity", () => {
    expect(gravityTorque(0.3, 0.15)).toBeCloseTo(0.3 * g_SI * 0.15, 12);
  });
});

describe("Sagnac path difference ΔL = 4·A·Ω / c", () => {
  it("is linear in angular rate and area", () => {
    const a = sagnacPathDifference(0.01, 1);
    const b = sagnacPathDifference(0.02, 2);
    expect(b / a).toBeCloseTo(4, 10);
  });

  it("matches an order-of-magnitude sanity check for a lab ring", () => {
    // 1 cm² ring at Earth's rotation rate (~7.29e-5 rad/s) — sub-femtometre.
    const dL = sagnacPathDifference(1e-4, 7.2921159e-5);
    expect(dL).toBeGreaterThan(0);
    expect(dL).toBeLessThan(1e-16);
  });
});
