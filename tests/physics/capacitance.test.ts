import { describe, expect, it } from "vitest";
import {
  parallelPlateCapacitance,
  energyStored,
  energyDensity,
} from "@/lib/physics/capacitance";
import { EPSILON_0 } from "@/lib/physics/constants";

describe("parallelPlateCapacitance", () => {
  it("returns ε₀ for unit geometry in vacuum", () => {
    expect(parallelPlateCapacitance(1, 1, 1)).toBeCloseTo(EPSILON_0, 20);
  });

  it("defaults kappa to 1 when omitted", () => {
    expect(parallelPlateCapacitance(1, 1)).toBeCloseTo(EPSILON_0, 20);
  });

  it("doubling the plate area doubles C", () => {
    const C1 = parallelPlateCapacitance(1, 0.001, 1);
    const C2 = parallelPlateCapacitance(2, 0.001, 1);
    expect(C2 / C1).toBeCloseTo(2, 10);
  });

  it("halving the gap doubles C", () => {
    const C1 = parallelPlateCapacitance(1, 0.002, 1);
    const C2 = parallelPlateCapacitance(1, 0.001, 1);
    expect(C2 / C1).toBeCloseTo(2, 10);
  });

  it("κ = 2 doubles C at fixed geometry", () => {
    const C1 = parallelPlateCapacitance(1, 0.001, 1);
    const C2 = parallelPlateCapacitance(1, 0.001, 2);
    expect(C2 / C1).toBeCloseTo(2, 10);
  });
});

describe("energyStored", () => {
  it("computes U = ½ C V²", () => {
    expect(energyStored(2, 3)).toBeCloseTo(9, 10);
  });

  it("scales linearly with C", () => {
    expect(energyStored(4, 1)).toBeCloseTo(2, 10);
  });

  it("scales quadratically with V (doubling V → 4× the energy)", () => {
    const u1 = energyStored(1, 5);
    const u2 = energyStored(1, 10);
    expect(u2 / u1).toBeCloseTo(4, 10);
  });

  it("returns zero at zero voltage", () => {
    expect(energyStored(1, 0)).toBe(0);
  });
});

describe("energyDensity", () => {
  it("returns ½ ε₀ for E = 1 V/m in vacuum", () => {
    expect(energyDensity(1)).toBeCloseTo(0.5 * EPSILON_0, 20);
  });

  it("scales as E²", () => {
    const u1 = energyDensity(2);
    const u2 = energyDensity(4);
    expect(u2 / u1).toBeCloseTo(4, 10);
  });

  it("κ = 3 triples the density at the same E", () => {
    const u1 = energyDensity(1, 1);
    const u2 = energyDensity(1, 3);
    expect(u2 / u1).toBeCloseTo(3, 10);
  });
});
