/**
 * §55 THE FRIEDMANN EQUATIONS — unit tests.
 *
 * Covers the curvature bookkeeping, the E(a) expansion rate and its component
 * scalings, the deceleration parameter and the acceleration-onset redshift,
 * the equality epochs, the scale-factor integrator (against the known
 * Einstein–de Sitter a ∝ t^{2/3} law), and the fate classifier.
 */

import { describe, expect, it } from "vitest";
import {
  curvatureDensity,
  curvatureSign,
  expansionRate,
  expansionRateZ,
  densityOfA,
  componentDensities,
  equalityScaleMatterRadiation,
  equalityScaleMatterLambda,
  decelerationParameter,
  decelerationParameterToday,
  reducedAcceleration,
  accelerationOnsetScale,
  scaleToRedshift,
  integrateScaleFactor,
  universeFate,
  CONCORDANCE,
  type CosmoParams,
} from "@/lib/physics/relativity/friedmann-equations";

const FLAT_MATTER: CosmoParams = { omegaM: 1, omegaR: 0, omegaLambda: 0 };

describe("curvatureDensity / curvatureSign", () => {
  it("flat ΛCDM has Ω_k ≈ 0", () => {
    expect(curvatureDensity(CONCORDANCE)).toBeCloseTo(0, 3);
    expect(curvatureSign(CONCORDANCE)).toBe(0);
  });

  it("open universe (sum < 1) has Ω_k > 0 ⇒ k = −1", () => {
    const p: CosmoParams = { omegaM: 0.3, omegaR: 0, omegaLambda: 0 };
    expect(curvatureDensity(p)).toBeCloseTo(0.7, 12);
    expect(curvatureSign(p)).toBe(-1);
  });

  it("closed universe (sum > 1) has Ω_k < 0 ⇒ k = +1", () => {
    const p: CosmoParams = { omegaM: 1.5, omegaR: 0, omegaLambda: 0 };
    expect(curvatureSign(p)).toBe(1);
  });
});

describe("expansionRate E(a)", () => {
  it("E(1) = 1 today for any flat model (sum of Ω = 1)", () => {
    expect(expansionRate(1, CONCORDANCE)).toBeCloseTo(1, 6);
    expect(expansionRate(1, FLAT_MATTER)).toBeCloseTo(1, 12);
  });

  it("matter-only E(a) = a^(−3/2)", () => {
    expect(expansionRate(0.25, FLAT_MATTER)).toBeCloseTo(Math.pow(0.25, -1.5), 9);
  });

  it("radiation dominates at small a, Λ at large a", () => {
    const small = expansionRate(1e-6, CONCORDANCE);
    // radiation term Ω_r a⁻⁴ should dominate
    expect(small).toBeGreaterThan(expansionRate(1e-3, CONCORDANCE));
    const large = expansionRate(100, CONCORDANCE);
    expect(large).toBeCloseTo(Math.sqrt(CONCORDANCE.omegaLambda), 4);
  });

  it("returns 0 at the turning point of a closed matter universe", () => {
    const p: CosmoParams = { omegaM: 2, omegaR: 0, omegaLambda: 0 };
    // Ω_k = −1; E²(a) = 2/a³ − 1/a² = 0 → a_max = 2
    expect(expansionRate(2, p)).toBe(0);
    expect(expansionRate(3, p)).toBe(0); // beyond turning point: arg<0 → 0
  });

  it("expansionRateZ matches expansionRate(1/(1+z))", () => {
    expect(expansionRateZ(1, CONCORDANCE)).toBeCloseTo(
      expansionRate(0.5, CONCORDANCE),
      12,
    );
  });
});

describe("component scalings", () => {
  it("radiation a⁻⁴, matter a⁻³, Λ const", () => {
    const a = 0.5;
    const c = componentDensities(a, CONCORDANCE);
    expect(c.radiation).toBeCloseTo(CONCORDANCE.omegaR / a ** 4, 12);
    expect(c.matter).toBeCloseTo(CONCORDANCE.omegaM / a ** 3, 12);
    expect(c.lambda).toBe(CONCORDANCE.omegaLambda);
  });

  it("densityOfA sums the three physical components (no curvature)", () => {
    const a = 0.3;
    const c = componentDensities(a, CONCORDANCE);
    expect(densityOfA(a, CONCORDANCE)).toBeCloseTo(
      c.radiation + c.matter + c.lambda,
      12,
    );
  });
});

describe("equality epochs", () => {
  it("matter–radiation equality a_eq = Ω_r/Ω_m, z_eq ≈ 3400", () => {
    const aEq = equalityScaleMatterRadiation(CONCORDANCE);
    expect(aEq).toBeCloseTo(CONCORDANCE.omegaR / CONCORDANCE.omegaM, 12);
    const zEq = scaleToRedshift(aEq);
    expect(zEq).toBeGreaterThan(3000);
    expect(zEq).toBeLessThan(3600);
  });

  it("matter–Λ equality at z ≈ 0.3 for concordance", () => {
    const aEq = equalityScaleMatterLambda(CONCORDANCE);
    const zEq = scaleToRedshift(aEq);
    expect(zEq).toBeGreaterThan(0.2);
    expect(zEq).toBeLessThan(0.4);
  });
});

describe("deceleration parameter", () => {
  it("q₀ = Ω_r + ½Ω_m − Ω_Λ ≈ −0.53 for concordance (accelerating)", () => {
    const q0 = decelerationParameterToday(CONCORDANCE);
    expect(q0).toBeCloseTo(
      CONCORDANCE.omegaR + 0.5 * CONCORDANCE.omegaM - CONCORDANCE.omegaLambda,
      12,
    );
    expect(q0).toBeLessThan(0);
  });

  it("matter-only universe has q = ½ (decelerating) at all a", () => {
    expect(decelerationParameter(1, FLAT_MATTER)).toBeCloseTo(0.5, 9);
    expect(decelerationParameter(0.2, FLAT_MATTER)).toBeCloseTo(0.5, 9);
  });

  it("de Sitter (Λ only) has q = −1", () => {
    const p: CosmoParams = { omegaM: 0, omegaR: 0, omegaLambda: 1 };
    expect(decelerationParameter(1, p)).toBeCloseTo(-1, 9);
  });
});

describe("acceleration onset", () => {
  it("reducedAcceleration changes sign across the onset scale", () => {
    const aAcc = accelerationOnsetScale(CONCORDANCE);
    // radiation negligible there; just below ⇒ decelerating, just above ⇒ not
    expect(reducedAcceleration(aAcc * 0.9, CONCORDANCE)).toBeLessThan(0);
    expect(reducedAcceleration(aAcc * 1.1, CONCORDANCE)).toBeGreaterThan(0);
  });

  it("onset redshift z ≈ 0.6–0.7 for concordance", () => {
    const aAcc = accelerationOnsetScale(CONCORDANCE);
    const z = scaleToRedshift(aAcc);
    expect(z).toBeGreaterThan(0.55);
    expect(z).toBeLessThan(0.75);
  });

  it("returns NaN when there is no Λ", () => {
    expect(Number.isNaN(accelerationOnsetScale(FLAT_MATTER))).toBe(true);
  });
});

describe("integrateScaleFactor", () => {
  it("Einstein–de Sitter follows a ∝ t^(2/3)", () => {
    // Flat matter universe: a(t) = (3/2 · t)^{2/3} in Hubble-time units when
    // started from the singularity. Compare the ratio of two late samples.
    const samples = integrateScaleFactor(FLAT_MATTER, {
      a0: 1e-2,
      dt: 1e-3,
      aMax: 4,
    });
    const last = samples[samples.length - 1]!;
    const mid = samples[Math.floor(samples.length / 2)]!;
    // a ∝ t^{2/3} ⇒ a_last/a_mid ≈ (t_last/t_mid)^{2/3}
    const ratioA = last.a / mid.a;
    const ratioT = Math.pow(last.t / mid.t, 2 / 3);
    expect(ratioA).toBeCloseTo(ratioT, 1);
  });

  it("a is monotonically increasing for an accelerating model", () => {
    const samples = integrateScaleFactor(CONCORDANCE, {
      a0: 1e-2,
      dt: 2e-3,
      aMax: 3,
    });
    for (let i = 1; i < samples.length; i++) {
      expect(samples[i]!.a).toBeGreaterThanOrEqual(samples[i - 1]!.a - 1e-9);
    }
    expect(samples[samples.length - 1]!.a).toBeGreaterThan(1);
  });

  it("a closed matter universe turns around (recollapse)", () => {
    const p: CosmoParams = { omegaM: 2, omegaR: 0, omegaLambda: 0 };
    const samples = integrateScaleFactor(p, { a0: 1e-2, dt: 1e-3, aMax: 10 });
    const maxA = Math.max(...samples.map((s) => s.a));
    // turning point at a_max = 2; never reaches aMax = 10
    expect(maxA).toBeLessThan(2.3);
    // and it comes back down
    const lastA = samples[samples.length - 1]!.a;
    expect(lastA).toBeLessThan(maxA);
  });
});

describe("universeFate", () => {
  it("concordance accelerates", () => {
    expect(universeFate(CONCORDANCE)).toBe("accelerate");
  });

  it("flat matter coasts (Einstein–de Sitter)", () => {
    expect(universeFate(FLAT_MATTER)).toBe("coast");
  });

  it("open matter coasts forever", () => {
    expect(universeFate({ omegaM: 0.3, omegaR: 0, omegaLambda: 0 })).toBe(
      "coast",
    );
  });

  it("closed matter universe recollapses", () => {
    expect(universeFate({ omegaM: 2, omegaR: 0, omegaLambda: 0 })).toBe(
      "recollapse",
    );
  });
});
