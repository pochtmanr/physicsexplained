import { describe, it, expect } from "vitest";
import {
  R_GAS,
  cvMolar,
  gamma,
  energyPerMolecule,
  einsteinFactor,
  cvOfT,
  THETA_VIB_H2,
} from "@/lib/physics/thermodynamics/equipartition";

describe("cvMolar / gamma", () => {
  it("gives the textbook heat capacities", () => {
    expect(cvMolar(3)).toBeCloseTo(1.5 * R_GAS, 9); // monatomic
    expect(cvMolar(5)).toBeCloseTo(2.5 * R_GAS, 9); // diatomic, room T
    expect(cvMolar(6)).toBeCloseTo(3 * R_GAS, 9); // Dulong–Petit solid
  });

  it("gives the textbook adiabatic exponents", () => {
    expect(gamma(3)).toBeCloseTo(5 / 3, 9); // monatomic
    expect(gamma(5)).toBeCloseTo(7 / 5, 9); // diatomic
    expect(gamma(7)).toBeCloseTo(9 / 7, 9);
  });
});

describe("energyPerMolecule", () => {
  it("is (f/2)kT", () => {
    const kT = energyPerMolecule(2, 300); // f=2 → kT exactly
    expect(kT).toBeCloseTo(1.380649e-23 * 300, 30);
  });
});

describe("einsteinFactor", () => {
  it("saturates to 1 at high T and vanishes at low T", () => {
    expect(einsteinFactor(100, 1e6)).toBeCloseTo(1, 3);
    expect(einsteinFactor(6000, 10)).toBeCloseTo(0, 6);
  });
  it("is monotonically increasing in T", () => {
    let prev = -1;
    for (let T = 10; T <= 20000; T += 50) {
      const c = einsteinFactor(THETA_VIB_H2, T);
      expect(c).toBeGreaterThanOrEqual(prev - 1e-12);
      prev = c;
    }
  });
});

describe("cvOfT staircase", () => {
  it("approaches (3/2)R at low T (rotation frozen)", () => {
    // well below θ_rot ≈ 85 K the rotational mode is silent → only translation
    expect(cvOfT(5)).toBeCloseTo(1.5 * R_GAS, 1);
    // and the step is still climbing near θ_rot, not yet at (5/2)R
    expect(cvOfT(40) / R_GAS).toBeGreaterThan(1.5);
    expect(cvOfT(40) / R_GAS).toBeLessThan(2.4);
  });
  it("is ~(5/2)R at room temperature", () => {
    expect(cvOfT(300) / R_GAS).toBeGreaterThan(2.4);
    expect(cvOfT(300) / R_GAS).toBeLessThan(2.6);
  });
  it("approaches (7/2)R at very high T", () => {
    expect(cvOfT(50000)).toBeCloseTo(3.5 * R_GAS, 1);
  });
  it("is monotonically non-decreasing across the decades", () => {
    let prev = -1;
    for (let T = 10; T <= 50000; T += 25) {
      const c = cvOfT(T);
      expect(c).toBeGreaterThanOrEqual(prev - 1e-9);
      prev = c;
    }
  });
});
