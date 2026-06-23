import { describe, it, expect } from "vitest";
import {
  BOLTZMANN_K,
  entropyFromMultiplicity,
  entropyFromLogMultiplicity,
  dimensionlessEntropyTwoBox,
  mixingEntropyEqualGases,
  mixingEntropyFromFractions,
} from "@/lib/physics/thermodynamics/boltzmann-entropy";

describe("S = k_B ln Omega", () => {
  it("a single microstate has zero entropy", () => {
    expect(entropyFromMultiplicity(1)).toBe(0);
  });

  it("agrees with the log-form", () => {
    expect(entropyFromMultiplicity(252)).toBeCloseTo(
      entropyFromLogMultiplicity(Math.log(252)),
      30,
    );
  });

  it("scales with Boltzmann's constant", () => {
    expect(entropyFromLogMultiplicity(1)).toBe(BOLTZMANN_K);
  });

  it("rejects a non-positive multiplicity", () => {
    expect(() => entropyFromMultiplicity(0)).toThrow();
  });

  it("two-box dimensionless entropy is ln C(N,k)", () => {
    expect(dimensionlessEntropyTwoBox(10, 5)).toBeCloseTo(Math.log(252), 12);
  });
});

describe("mixing-entropy bridge to FIG.10", () => {
  it("equal gases give 2 N k_B ln 2", () => {
    const n = 1000;
    expect(mixingEntropyEqualGases(n)).toBeCloseTo(2 * n * BOLTZMANN_K * Math.LN2, 30);
  });

  it("the mole-fraction form reproduces the equal-gas result", () => {
    const n = 500; // per gas
    const fromFractions = mixingEntropyFromFractions(2 * n, [0.5, 0.5]);
    expect(fromFractions).toBeCloseTo(mixingEntropyEqualGases(n), 30);
  });

  it("vanishes when one species fills the box", () => {
    expect(mixingEntropyFromFractions(1000, [1, 0])).toBeCloseTo(0, 30);
  });
});
