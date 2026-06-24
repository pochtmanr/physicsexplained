import { describe, it, expect } from "vitest";
import {
  R_GAS,
  K_B,
  N_A,
  ABSOLUTE_ZERO_C,
  idealPressure,
  idealVolume,
  idealPressureFromN,
  boylePressure,
  charlesVolumeCelsius,
  compressibility,
  vanDerWaalsPressure,
  vdwIsotherm,
  VDW_GASES,
} from "@/lib/physics/thermodynamics/ideal-gas";

describe("constants", () => {
  it("satisfies R = N_A · k_B", () => {
    expect(N_A * K_B).toBeCloseTo(R_GAS, 6);
  });
  it("places absolute zero at −273.15 °C", () => {
    expect(ABSOLUTE_ZERO_C).toBeCloseTo(-273.15, 2);
  });
});

describe("ideal gas law", () => {
  it("gives ~22.4 L for one mole at STP (0 °C, 1 atm)", () => {
    const V = idealVolume(1, 101325, 273.15);
    expect(V * 1000).toBeCloseTo(22.41, 1); // litres
  });

  it("the molecular and molar forms agree", () => {
    const n = 2;
    const T = 300;
    const V = 0.05;
    const pMolar = idealPressure(n, T, V);
    const pMolecular = idealPressureFromN(n * N_A, T, V);
    // R = N_A·k_B holds only to ~1e-6 relative in the rounded SI constants
    expect(pMolecular / pMolar).toBeCloseTo(1, 5);
  });

  it("pressure scales inversely with volume (Boyle)", () => {
    const T = 300;
    const n = 1;
    const p1 = idealPressure(n, T, 0.02);
    const p2 = idealPressure(n, T, 0.04);
    expect(p1 / p2).toBeCloseTo(2, 6);
  });
});

describe("Boyle isotherm", () => {
  it("keeps PV constant", () => {
    const p = boylePressure(100000, 0.01, 0.02);
    expect(p * 0.02).toBeCloseTo(100000 * 0.01, 6);
  });
});

describe("Charles's law", () => {
  it("volume is proportional to absolute temperature", () => {
    // doubling absolute T doubles V
    const v0 = charlesVolumeCelsius(1, 0, 0); // 273.15 K reference -> itself
    expect(v0).toBeCloseTo(1, 6);
    const vHot = charlesVolumeCelsius(1, 0, 273.15); // ~546.3 K
    expect(vHot).toBeCloseTo(546.3 / 273.15, 3);
  });

  it("extrapolates to zero volume at absolute zero", () => {
    const v = charlesVolumeCelsius(1, 0, ABSOLUTE_ZERO_C);
    expect(v).toBeCloseTo(0, 6);
  });
});

describe("compressibility factor", () => {
  it("is exactly 1 for an ideal gas", () => {
    const n = 1;
    const T = 300;
    const V = 0.025;
    const P = idealPressure(n, T, V);
    expect(compressibility(P, V, n, T)).toBeCloseTo(1, 9);
  });
});

describe("van der Waals", () => {
  it("reduces toward the ideal pressure at large volume", () => {
    const gas = VDW_GASES.find((g) => g.name === "N₂")!;
    const n = 1;
    const T = 300;
    const V = 1; // very large molar volume → nearly ideal
    const pVdw = vanDerWaalsPressure(gas, n, T, V);
    const pIdeal = idealPressure(n, T, V);
    expect(pVdw / pIdeal).toBeCloseTo(1, 3);
  });

  it("an isotherm dips below 1 then climbs above 1", () => {
    const gas = VDW_GASES.find((g) => g.name === "N₂")!;
    const pts = vdwIsotherm(gas, 200);
    const zs = pts.map((p) => p.Z);
    const minZ = Math.min(...zs);
    const maxZ = Math.max(...zs);
    expect(minZ).toBeLessThan(1); // attraction wins at moderate P
    expect(maxZ).toBeGreaterThan(1); // repulsion wins at high P
  });
});
