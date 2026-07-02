import { describe, it, expect } from "vitest";
import {
  R_GAS,
  MONATOMIC,
  isothermalWork,
  isothermalHeat,
  isothermalFinalPressure,
  adiabaticFinalPressure,
  adiabaticFinalTemperature,
  adiabaticWork,
  adiabaticTemperatureRatio,
  compareProcesses,
  freeExpansion,
  parcelTemperatureAfterAscent,
} from "@/lib/physics/thermodynamics/processes";

const GAMMA = MONATOMIC.gamma; // 5/3

describe("isothermal process", () => {
  it("W = nRT ln(V2/V1), positive for expansion, and Q = W", () => {
    const w = isothermalWork(1, 300, 0.01, 0.02);
    expect(w).toBeCloseTo(R_GAS * 300 * Math.log(2), 6);
    expect(w).toBeGreaterThan(0);
    expect(isothermalHeat(1, 300, 0.01, 0.02)).toBeCloseTo(w, 9);
  });
  it("compression gives negative work", () => {
    expect(isothermalWork(1, 300, 0.02, 0.01)).toBeLessThan(0);
  });
  it("obeys Boyle's law for the final pressure", () => {
    expect(isothermalFinalPressure(200_000, 0.01, 0.02)).toBeCloseTo(100_000, 6);
  });
});

describe("adiabatic process", () => {
  it("PV^gamma constant gives the final pressure", () => {
    const P2 = adiabaticFinalPressure(100_000, 0.02, 0.01, GAMMA);
    expect(P2).toBeCloseTo(100_000 * Math.pow(2, GAMMA), 0);
  });
  it("TV^(gamma-1) constant gives the final temperature", () => {
    const T2 = adiabaticFinalTemperature(300, 0.02, 0.01, GAMMA);
    expect(T2).toBeCloseTo(300 * Math.pow(2, GAMMA - 1), 6);
    expect(T2).toBeGreaterThan(300); // compression heats
  });
  it("work = (P1V1 − P2V2)/(γ−1); expansion does positive work and cools", () => {
    const P1 = 200_000, V1 = 0.01, V2 = 0.02;
    const w = adiabaticWork(P1, V1, V2, GAMMA);
    expect(w).toBeGreaterThan(0);
    // expansion cools
    expect(adiabaticFinalTemperature(300, V1, V2, GAMMA)).toBeLessThan(300);
  });
  it("a diesel compression ratio of ~20 heats air enough to ignite fuel", () => {
    // air γ ≈ 1.4; r = 20 ⟹ T2/T1 ≈ 3.3, lifting 300 K to ~1000 K
    const ratio = adiabaticTemperatureRatio(20, 1.4);
    expect(300 * ratio).toBeGreaterThan(900);
  });
});

describe("isothermal vs adiabatic from the same start", () => {
  it("compressing, the adiabat ends hotter and higher-pressure than the isotherm", () => {
    const { isothermal, adiabatic } = compareProcesses(
      1, 300, 200_000, 0.02, 0.01, GAMMA,
    );
    expect(adiabatic.T2).toBeGreaterThan(isothermal.T2);
    expect(adiabatic.P2).toBeGreaterThan(isothermal.P2);
  });
});

describe("free expansion (Joule)", () => {
  it("no work, no heat, no temperature change for an ideal gas", () => {
    const r = freeExpansion(300);
    expect(r.W).toBe(0);
    expect(r.Q).toBe(0);
    expect(r.deltaU).toBe(0);
    expect(r.T2).toBe(300);
  });
});

describe("atmospheric ascent", () => {
  it("a parcel cools ~9.8 K per km on the dry adiabat", () => {
    expect(parcelTemperatureAfterAscent(288, 1)).toBeCloseTo(278.2, 6);
  });
});
