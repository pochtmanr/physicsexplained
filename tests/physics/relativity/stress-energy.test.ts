/**
 * §08 THE STRESS-ENERGY TENSOR — unit tests.
 *
 * Tests cover vacuumStressEnergy, dustStressEnergy, perfectFluidRestFrame,
 * stressEnergyTrace, energyDensity, isotropicPressure, asymmetryDefect,
 * and momentumDensity.
 */

import { describe, expect, it } from "vitest";
import {
  vacuumStressEnergy,
  dustStressEnergy,
  perfectFluidRestFrame,
  stressEnergyTrace,
  energyDensity,
  isotropicPressure,
  asymmetryDefect,
  momentumDensity,
} from "@/lib/physics/relativity/stress-energy";

// ─── vacuumStressEnergy ───────────────────────────────────────────────────────

describe("vacuumStressEnergy", () => {
  it("returns all zeros — every component is 0", () => {
    const T = vacuumStressEnergy();
    for (let mu = 0; mu < 4; mu++) {
      for (let nu = 0; nu < 4; nu++) {
        expect(T[mu][nu]).toBe(0);
      }
    }
  });
});

// ─── dustStressEnergy ─────────────────────────────────────────────────────────

describe("dustStressEnergy", () => {
  it("with ρ=1, c=1: T_{00} = 1 and all other components are zero", () => {
    const T = dustStressEnergy(1, 1);
    expect(T[0][0]).toBeCloseTo(1, 12);
    // All non-(0,0) components must be zero
    for (let mu = 0; mu < 4; mu++) {
      for (let nu = 0; nu < 4; nu++) {
        if (mu === 0 && nu === 0) continue;
        expect(T[mu][nu]).toBe(0);
      }
    }
  });

  it("with ρ=2, c=3: T_{00} = ρc² = 18", () => {
    const T = dustStressEnergy(2, 3);
    expect(T[0][0]).toBeCloseTo(18, 10);
  });
});

// ─── perfectFluidRestFrame ────────────────────────────────────────────────────

describe("perfectFluidRestFrame", () => {
  it("p=0 reduces to dust: T_{00}=ρc², all other components zero", () => {
    const rho = 5;
    const c = 2;
    const T = perfectFluidRestFrame(rho, 0, c);
    expect(T[0][0]).toBeCloseTo(rho * c * c, 10);
    expect(T[1][1]).toBe(0);
    expect(T[2][2]).toBe(0);
    expect(T[3][3]).toBe(0);
    expect(T[0][1]).toBe(0);
  });

  it("ρ=0, p=1: T_{00}=0; T_{11}=T_{22}=T_{33}=1", () => {
    const T = perfectFluidRestFrame(0, 1, 1);
    expect(T[0][0]).toBeCloseTo(0, 12);
    expect(T[1][1]).toBeCloseTo(1, 12);
    expect(T[2][2]).toBeCloseTo(1, 12);
    expect(T[3][3]).toBeCloseTo(1, 12);
  });

  it("off-diagonal spatial components are zero", () => {
    const T = perfectFluidRestFrame(3, 2, 1);
    expect(T[1][2]).toBe(0);
    expect(T[1][3]).toBe(0);
    expect(T[2][3]).toBe(0);
  });

  it("time-space components are zero", () => {
    const T = perfectFluidRestFrame(3, 2, 1);
    expect(T[0][1]).toBe(0);
    expect(T[0][2]).toBe(0);
    expect(T[0][3]).toBe(0);
  });
});

// ─── stressEnergyTrace ────────────────────────────────────────────────────────

describe("stressEnergyTrace", () => {
  it("trace of dust (ρc²): T = T_{00} = ρc²", () => {
    const rho = 3;
    const c = 2;
    const T = dustStressEnergy(rho, c);
    expect(stressEnergyTrace(T)).toBeCloseTo(rho * c * c, 10);
  });

  it("trace of pressure-only fluid (ρ=0, p=1): T = 0 - 1 - 1 - 1 = -3", () => {
    const T = perfectFluidRestFrame(0, 1, 1);
    expect(stressEnergyTrace(T)).toBeCloseTo(-3, 12);
  });

  it("trace of vacuum is 0", () => {
    expect(stressEnergyTrace(vacuumStressEnergy())).toBe(0);
  });
});

// ─── energyDensity ────────────────────────────────────────────────────────────

describe("energyDensity", () => {
  it("returns T_{00} for dust", () => {
    const T = dustStressEnergy(7, 1);
    expect(energyDensity(T)).toBeCloseTo(7, 12);
  });

  it("returns T_{00} = ρc² for perfect fluid", () => {
    const rho = 4;
    const c = 3;
    const T = perfectFluidRestFrame(rho, 2, c);
    expect(energyDensity(T)).toBeCloseTo(rho * c * c, 10);
  });
});

// ─── isotropicPressure ────────────────────────────────────────────────────────

describe("isotropicPressure", () => {
  it("perfect fluid with p=2 returns isotropic pressure 2", () => {
    const T = perfectFluidRestFrame(1, 2, 1);
    expect(isotropicPressure(T)).toBeCloseTo(2, 12);
  });

  it("dust has zero pressure", () => {
    const T = dustStressEnergy(5, 1);
    expect(isotropicPressure(T)).toBeCloseTo(0, 12);
  });
});

// ─── asymmetryDefect ─────────────────────────────────────────────────────────

describe("asymmetryDefect", () => {
  it("vacuum tensor is perfectly symmetric (defect = 0)", () => {
    expect(asymmetryDefect(vacuumStressEnergy())).toBe(0);
  });

  it("dust tensor is perfectly symmetric (defect = 0)", () => {
    expect(asymmetryDefect(dustStressEnergy(1, 1))).toBe(0);
  });

  it("perfect fluid tensor is perfectly symmetric (defect = 0)", () => {
    expect(asymmetryDefect(perfectFluidRestFrame(2, 3, 1))).toBe(0);
  });
});

// ─── momentumDensity ─────────────────────────────────────────────────────────

describe("momentumDensity", () => {
  it("dust at rest has zero momentum density", () => {
    const T = dustStressEnergy(1, 1);
    const p = momentumDensity(T, 1);
    expect(p[0]).toBe(0);
    expect(p[1]).toBe(0);
    expect(p[2]).toBe(0);
  });

  it("vacuum has zero momentum density", () => {
    const T = vacuumStressEnergy();
    const p = momentumDensity(T, 3e8);
    expect(p[0]).toBe(0);
    expect(p[1]).toBe(0);
    expect(p[2]).toBe(0);
  });
});
