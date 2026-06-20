/**
 * §59 SINGULARITY THEOREMS — unit tests for the Raychaudhuri / trapped-surface
 * / energy-condition / theorem-bookkeeping helpers.
 */

import { describe, expect, it } from "vitest";
import {
  transverseDim,
  raychaudhuriRHS,
  integrateExpansion,
  focalParameterBound,
  radialLightSpeed,
  isTrapped,
  outgoingExpansionSign,
  satisfiesEnergyCondition,
  impliesIncompleteness,
  missingHypothesis,
} from "@/lib/physics/relativity/singularity-theorems";

// ─── transverseDim ───────────────────────────────────────────────────────────

describe("transverseDim", () => {
  it("is 2 for null congruences in 4D", () => {
    expect(transverseDim("null")).toBe(2);
  });
  it("is 3 for timelike congruences in 4D", () => {
    expect(transverseDim("timelike")).toBe(3);
  });
});

// ─── raychaudhuriRHS ─────────────────────────────────────────────────────────

describe("raychaudhuriRHS", () => {
  it("is non-positive when the energy condition holds (ricci ≥ 0)", () => {
    expect(raychaudhuriRHS(0.5, "timelike", 0.3, 0.1)).toBeLessThan(0);
    expect(raychaudhuriRHS(-2, "null", 1.0, 0.5)).toBeLessThan(0);
  });

  it("can be positive only if curvature defocuses (ricci < 0, exotic matter)", () => {
    // small θ, no shear, strongly negative ricci → defocusing
    expect(raychaudhuriRHS(0.01, "null", -5)).toBeGreaterThan(0);
  });

  it("uses the 1/n coefficient on the θ² term", () => {
    // pure θ² term, no shear/ricci: null (n=2) vs timelike (n=3)
    const nullRHS = raychaudhuriRHS(3, "null", 0, 0);
    const tlRHS = raychaudhuriRHS(3, "timelike", 0, 0);
    expect(nullRHS).toBeCloseTo(-9 / 2, 12);
    expect(tlRHS).toBeCloseTo(-9 / 3, 12);
  });
});

// ─── integrateExpansion ──────────────────────────────────────────────────────

describe("integrateExpansion", () => {
  it("a contracting congruence focuses to θ → −∞ in finite λ", () => {
    const traj = integrateExpansion({
      theta0: -0.5,
      kind: "timelike",
      ricci: 0.2,
      lambdaMax: 50,
      steps: 4000,
    });
    const last = traj[traj.length - 1];
    expect(last.focused).toBe(true);
    // focal point must arrive before the closed-form bound n/|θ₀| = 3/0.5 = 6
    expect(last.lambda).toBeLessThanOrEqual(6 + 1e-6);
  });

  it("an expanding congruence with no curvature need not focus", () => {
    const traj = integrateExpansion({
      theta0: 1,
      kind: "null",
      ricci: 0,
      lambdaMax: 5,
      steps: 500,
    });
    // θ decreases (−θ²/n) but should not blow up over this short interval
    expect(traj[traj.length - 1].focused).toBe(false);
    expect(traj[traj.length - 1].theta).toBeGreaterThan(0);
  });

  it("θ is monotonically non-increasing while the energy condition holds", () => {
    const traj = integrateExpansion({
      theta0: 0.8,
      kind: "timelike",
      ricci: 0.1,
      shear2: 0.05,
      lambdaMax: 3,
      steps: 300,
    });
    for (let i = 1; i < traj.length; i++) {
      if (traj[i].focused) break;
      expect(traj[i].theta).toBeLessThanOrEqual(traj[i - 1].theta + 1e-9);
    }
  });
});

// ─── focalParameterBound ─────────────────────────────────────────────────────

describe("focalParameterBound", () => {
  it("returns n/|θ₀| for a contracting congruence", () => {
    expect(focalParameterBound(-0.5, "timelike")).toBeCloseTo(6, 12);
    expect(focalParameterBound(-2, "null")).toBeCloseTo(1, 12);
  });

  it("is Infinity when θ₀ ≥ 0", () => {
    expect(focalParameterBound(0, "null")).toBe(Infinity);
    expect(focalParameterBound(1.5, "timelike")).toBe(Infinity);
  });

  it("bounds the integrator's actual focal parameter", () => {
    const theta0 = -0.7;
    const bound = focalParameterBound(theta0, "timelike");
    const traj = integrateExpansion({
      theta0,
      kind: "timelike",
      ricci: 0.4, // extra focusing only makes it sooner
      lambdaMax: 30,
      steps: 3000,
    });
    const focal = traj[traj.length - 1].lambda;
    expect(focal).toBeLessThanOrEqual(bound + 1e-6);
  });
});

// ─── radialLightSpeed / isTrapped / outgoingExpansionSign ────────────────────

describe("radialLightSpeed", () => {
  it("outgoing ray moves outward outside the horizon", () => {
    expect(radialLightSpeed(2, "outgoing")).toBeGreaterThan(0);
  });

  it("outgoing ray is frozen exactly on the horizon", () => {
    expect(radialLightSpeed(1, "outgoing")).toBeCloseTo(0, 12);
  });

  it("even the OUTGOING ray moves inward inside the horizon", () => {
    expect(radialLightSpeed(0.5, "outgoing")).toBeLessThan(0);
  });

  it("ingoing ray always moves inward outside the horizon", () => {
    expect(radialLightSpeed(3, "ingoing")).toBeLessThan(0);
  });
});

describe("isTrapped", () => {
  it("is false outside the horizon", () => {
    expect(isTrapped(2)).toBe(false);
  });
  it("is true inside the horizon", () => {
    expect(isTrapped(0.5)).toBe(true);
  });
  it("the horizon itself is the marginal (not strictly trapped) boundary", () => {
    expect(isTrapped(1)).toBe(false);
    expect(outgoingExpansionSign(1)).toBe(0);
  });
});

// ─── satisfiesEnergyCondition ────────────────────────────────────────────────

describe("satisfiesEnergyCondition", () => {
  it("ordinary matter (ρ>0, small p) satisfies all four conditions", () => {
    for (const c of ["NEC", "WEC", "SEC", "DEC"] as const) {
      expect(satisfiesEnergyCondition(c, 10, 1)).toBe(true);
    }
  });

  it("a cosmological constant (p = −ρ) violates SEC but keeps NEC/WEC", () => {
    const rho = 5;
    const p = -5;
    expect(satisfiesEnergyCondition("NEC", rho, p)).toBe(true);
    expect(satisfiesEnergyCondition("WEC", rho, p)).toBe(true);
    expect(satisfiesEnergyCondition("SEC", rho, p)).toBe(false); // ρ+3p = −10 < 0
  });

  it("a sufficiently negative pressure violates NEC", () => {
    expect(satisfiesEnergyCondition("NEC", 1, -2)).toBe(false);
  });

  it("DEC fails when pressure exceeds density in magnitude", () => {
    expect(satisfiesEnergyCondition("DEC", 1, 3)).toBe(false);
  });
});

// ─── impliesIncompleteness / missingHypothesis ───────────────────────────────

describe("impliesIncompleteness", () => {
  it("fires when all three hypotheses hold", () => {
    expect(
      impliesIncompleteness({
        trappedSurface: true,
        energyCondition: true,
        globalHyperbolicity: true,
      }),
    ).toBe(true);
  });

  it("fails if any single hypothesis is dropped", () => {
    expect(
      impliesIncompleteness({
        trappedSurface: false,
        energyCondition: true,
        globalHyperbolicity: true,
      }),
    ).toBe(false);
    expect(
      impliesIncompleteness({
        trappedSurface: true,
        energyCondition: false,
        globalHyperbolicity: true,
      }),
    ).toBe(false);
    expect(
      impliesIncompleteness({
        trappedSurface: true,
        energyCondition: true,
        globalHyperbolicity: false,
      }),
    ).toBe(false);
  });
});

describe("missingHypothesis", () => {
  it("returns null when the theorem already fires", () => {
    expect(
      missingHypothesis({
        trappedSurface: true,
        energyCondition: true,
        globalHyperbolicity: true,
      }),
    ).toBeNull();
  });

  it("names the first missing hypothesis", () => {
    expect(
      missingHypothesis({
        trappedSurface: false,
        energyCondition: true,
        globalHyperbolicity: true,
      }),
    ).toBe("trappedSurface");
    expect(
      missingHypothesis({
        trappedSurface: true,
        energyCondition: false,
        globalHyperbolicity: false,
      }),
    ).toBe("energyCondition");
  });
});
