import { describe, expect, it } from "vitest";
import { gamma } from "@/lib/physics/relativity/types";
import {
  properSeparation,
  stringStrain,
  snapSpeed,
  bornRigidAccelerationRatio,
} from "@/lib/physics/relativity/bell-spaceship";

describe("properSeparation", () => {
  it("equals D₀ at β = 0 (no boost, no contraction)", () => {
    expect(properSeparation(1, 0)).toBeCloseTo(1, 12);
    expect(properSeparation(42, 0)).toBeCloseTo(42, 12);
  });

  it("β = 0.6, γ = 1.25 → proper separation = 1.25 D₀", () => {
    // γ(0.6) = 1/√(1 − 0.36) = 1/0.8 = 1.25
    expect(properSeparation(10, 0.6)).toBeCloseTo(12.5, 10);
  });

  it("β = 0.866 (γ = 2) → proper separation doubles", () => {
    // γ(√3/2) = 1/√(1 − 0.75) = 1/0.5 = 2 (Bell's canonical snap point for ε_c = 1).
    expect(properSeparation(5, Math.sqrt(3) / 2)).toBeCloseTo(10, 9);
  });

  it("matches γ(β) · D₀ for arbitrary subluminal β", () => {
    for (const beta of [0.1, 0.3, 0.5, 0.7, 0.9, 0.99]) {
      expect(properSeparation(7, beta)).toBeCloseTo(7 * gamma(beta), 10);
    }
  });

  it("throws RangeError for |β| ≥ 1", () => {
    expect(() => properSeparation(1, 1)).toThrow(RangeError);
    expect(() => properSeparation(1, 1.5)).toThrow(RangeError);
    expect(() => properSeparation(1, -1)).toThrow(RangeError);
  });
});

describe("stringStrain", () => {
  it("equals 0 at β = 0 (string at rest, no stretch)", () => {
    expect(stringStrain(0)).toBeCloseTo(0, 12);
  });

  it("equals γ − 1 by construction", () => {
    for (const beta of [0.1, 0.4, 0.7, 0.95]) {
      expect(stringStrain(beta)).toBeCloseTo(gamma(beta) - 1, 12);
    }
  });

  it("is monotonically increasing in |β|", () => {
    const betas = [0.0, 0.1, 0.3, 0.5, 0.7, 0.9, 0.99];
    for (let i = 1; i < betas.length; i++) {
      expect(stringStrain(betas[i])).toBeGreaterThan(stringStrain(betas[i - 1]));
    }
  });

  it("symmetric in β → −β (γ depends only on β²)", () => {
    for (const beta of [0.2, 0.5, 0.8]) {
      expect(stringStrain(beta)).toBeCloseTo(stringStrain(-beta), 12);
    }
  });

  it("diverges as β → 1", () => {
    expect(stringStrain(0.999999)).toBeGreaterThan(700);
  });
});

describe("snapSpeed", () => {
  it("ε_c = 1 (γ_crit = 2) → β_snap = √3/2 ≈ 0.866", () => {
    expect(snapSpeed(1)).toBeCloseTo(Math.sqrt(3) / 2, 12);
  });

  it("ε_c = 0.25 (γ_crit = 1.25) → β_snap = 0.6", () => {
    // γ = 1.25 ↔ β = 0.6 exactly.
    expect(snapSpeed(0.25)).toBeCloseTo(0.6, 12);
  });

  it("inverts stringStrain: stringStrain(snapSpeed(ε)) = ε", () => {
    for (const eps of [0.01, 0.1, 0.5, 1, 3]) {
      expect(stringStrain(snapSpeed(eps))).toBeCloseTo(eps, 10);
    }
  });

  it("is monotonically increasing in ε_c (tougher strings break later)", () => {
    const eps = [0.001, 0.01, 0.1, 0.5, 1, 5];
    for (let i = 1; i < eps.length; i++) {
      expect(snapSpeed(eps[i])).toBeGreaterThan(snapSpeed(eps[i - 1]));
    }
  });

  it("low-strain limit: ε_c = 0.01 (1%) snaps at β ≈ √(2 ε_c) ≈ 0.14", () => {
    // For small ε: γ_crit ≈ 1 + ε ⇒ β² ≈ 1 − 1/(1+2ε+ε²) ≈ 2ε ⇒ β ≈ √(2ε).
    expect(snapSpeed(0.01)).toBeCloseTo(Math.sqrt(2 * 0.01), 2);
  });

  it("throws RangeError for ε_c ≤ 0", () => {
    expect(() => snapSpeed(0)).toThrow(RangeError);
    expect(() => snapSpeed(-0.1)).toThrow(RangeError);
  });
});

describe("bornRigidAccelerationRatio", () => {
  it("equals 1 in the limit D₀ → 0 (single-rocket fiction)", () => {
    expect(bornRigidAccelerationRatio(10, 0)).toBeCloseTo(1, 12);
  });

  it("a_rear / a_front > 1 for any positive D₀ (trailing rocket pushes harder)", () => {
    expect(bornRigidAccelerationRatio(10, 1)).toBeGreaterThan(1);
    expect(bornRigidAccelerationRatio(100, 5)).toBeGreaterThan(1);
  });

  it("ratio = (x_rear + D₀) / x_rear by construction", () => {
    expect(bornRigidAccelerationRatio(10, 1)).toBeCloseTo(11 / 10, 12);
    expect(bornRigidAccelerationRatio(100, 5)).toBeCloseTo(105 / 100, 12);
  });

  it("throws RangeError for x_rear ≤ 0 (Rindler horizon constraint)", () => {
    expect(() => bornRigidAccelerationRatio(0, 1)).toThrow(RangeError);
    expect(() => bornRigidAccelerationRatio(-5, 1)).toThrow(RangeError);
  });
});
