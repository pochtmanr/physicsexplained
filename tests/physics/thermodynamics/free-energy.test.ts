import { describe, it, expect } from "vitest";
import { K_B } from "@/lib/physics/thermodynamics/distributions";
import {
  LN2,
  enthalpy,
  helmholtzFreeEnergy,
  gibbsFreeEnergy,
  gibbsSpontaneity,
  legendreTransform,
  szilardWork,
  landauerLimit,
  szilardNetWork,
} from "@/lib/physics/thermodynamics/free-energy";

// A representative state point.
const U = 5000;
const T = 300;
const S = 12;
const P = 1e5;
const V = 0.02;

describe("the four potentials are mutually consistent", () => {
  it("H = U + PV", () => {
    expect(enthalpy(U, P, V)).toBeCloseTo(U + P * V, 9);
  });

  it("F = U − TS", () => {
    expect(helmholtzFreeEnergy(U, T, S)).toBeCloseTo(U - T * S, 9);
  });

  it("G = U − TS + PV = H − TS = F + PV", () => {
    const G = gibbsFreeEnergy(U, T, S, P, V);
    expect(G).toBeCloseTo(enthalpy(U, P, V) - T * S, 6);
    expect(G).toBeCloseTo(helmholtzFreeEnergy(U, T, S) + P * V, 6);
  });
});

describe("Gibbs spontaneity", () => {
  it("is spontaneous when ΔG < 0", () => {
    // exothermic, entropy-increasing → always spontaneous
    expect(gibbsSpontaneity(-1000, 5, T)).toBe(-1);
  });
  it("is non-spontaneous when ΔG > 0", () => {
    // endothermic, entropy-decreasing → never spontaneous
    expect(gibbsSpontaneity(1000, -5, T)).toBe(1);
  });
  it("flips sign with temperature for ΔH>0, ΔS>0", () => {
    const dH = 1000;
    const dS = 5; // crossover at T = dH/dS = 200 K
    expect(gibbsSpontaneity(dH, dS, 100)).toBe(1);
    expect(gibbsSpontaneity(dH, dS, 300)).toBe(-1);
  });
});

describe("Legendre transform helper", () => {
  it("adds the conjugate product going U → H", () => {
    expect(legendreTransform(U, P * V, true)).toBeCloseTo(enthalpy(U, P, V), 9);
  });
  it("subtracts the conjugate product going U → F", () => {
    expect(legendreTransform(U, T * S, false)).toBeCloseTo(
      helmholtzFreeEnergy(U, T, S),
      9,
    );
  });
});

describe("Szilard engine & Landauer's principle", () => {
  it("the engine extracts k_BT ln 2 per cycle", () => {
    expect(szilardWork(300)).toBeCloseTo(K_B * 300 * LN2, 30);
    // ≈ 2.87e-21 J at room temperature
    expect(szilardWork(300)).toBeCloseTo(2.871e-21, 24);
  });

  it("erasing the bit costs exactly what was extracted", () => {
    expect(landauerLimit(300)).toBeCloseTo(szilardWork(300), 30);
  });

  it("net work over a full cycle is zero — the second law survives", () => {
    expect(szilardNetWork(300)).toBeCloseTo(0, 30);
    expect(szilardNetWork(1)).toBeCloseTo(0, 30);
  });

  it("the Landauer cost scales linearly with temperature", () => {
    expect(landauerLimit(600)).toBeCloseTo(2 * landauerLimit(300), 30);
  });
});
