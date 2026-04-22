import { describe, expect, it } from "vitest";
import {
  displacementField,
  capacitanceWithDielectric,
  dielectricBreakdownField,
} from "@/lib/physics/electromagnetism/dielectrics";
import { EPSILON_0 } from "@/lib/physics/constants";

describe("displacementField", () => {
  it("reduces to ε₀ E in vacuum (P = 0)", () => {
    expect(displacementField(1e6, 0)).toBeCloseTo(EPSILON_0 * 1e6, 18);
  });

  it("adds polarization on top of ε₀ E inside a dielectric", () => {
    const E = 1e5;
    const P = 4.2e-6;
    expect(displacementField(E, P)).toBeCloseTo(EPSILON_0 * E + P, 16);
  });

  it("returns zero when both E and P are zero", () => {
    expect(displacementField(0, 0)).toBe(0);
  });
});

describe("capacitanceWithDielectric", () => {
  it("returns the vacuum capacitance when κ = 1", () => {
    const C0 = 4.2e-9;
    expect(capacitanceWithDielectric(C0, 1)).toBeCloseTo(C0, 18);
  });

  it("κ = 4 quadruples the capacitance", () => {
    const C0 = 1e-9;
    expect(capacitanceWithDielectric(C0, 4)).toBeCloseTo(4e-9, 18);
  });

  it("water (κ ≈ 80) gives an 80× boost", () => {
    expect(capacitanceWithDielectric(1, 80)).toBeCloseTo(80, 12);
  });
});

describe("dielectricBreakdownField", () => {
  it("returns the textbook ~3 kV/mm value for air", () => {
    expect(dielectricBreakdownField("air")).toBe(3e6);
  });

  it("orders weakest → strongest: air < glass < water < mica", () => {
    const air = dielectricBreakdownField("air");
    const glass = dielectricBreakdownField("glass");
    const water = dielectricBreakdownField("water");
    const mica = dielectricBreakdownField("mica");
    expect(air).toBeLessThan(glass);
    expect(glass).toBeLessThan(water);
    expect(water).toBeLessThan(mica);
  });

  it("mica is at least an order of magnitude tougher than air", () => {
    expect(
      dielectricBreakdownField("mica") / dielectricBreakdownField("air"),
    ).toBeGreaterThanOrEqual(10);
  });
});
