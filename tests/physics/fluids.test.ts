import { describe, it, expect } from "vitest";
import {
  G_STANDARD,
  P_ATM,
  RHO_MERCURY,
  RHO_WATER,
  buoyantForce,
  columnHeightForPressure,
  gaugePressure,
  hydraulicOutputForce,
  hydrostaticPressure,
  submergedFraction,
} from "@/lib/physics/fluids";

describe("hydrostaticPressure", () => {
  it("reduces to p0 at zero depth", () => {
    expect(hydrostaticPressure(0)).toBeCloseTo(P_ATM, 6);
  });

  it("adds one atmosphere for every ~10.33 m of water", () => {
    const p = hydrostaticPressure(10.33, RHO_WATER);
    // Should be ~2 atm (101325 + 101325) within slider-scale tolerance.
    expect(p / P_ATM).toBeCloseTo(2, 2);
  });

  it("rejects negative depth", () => {
    expect(() => hydrostaticPressure(-1)).toThrow();
  });
});

describe("gaugePressure", () => {
  it("is zero at the surface", () => {
    expect(gaugePressure(0)).toBeCloseTo(0, 10);
  });

  it("equals rho·g·h", () => {
    const h = 5;
    expect(gaugePressure(h, RHO_WATER)).toBeCloseTo(
      RHO_WATER * G_STANDARD * h,
      6,
    );
  });
});

describe("columnHeightForPressure", () => {
  it("Torricelli: one atmosphere balances about 760 mm of mercury", () => {
    const h = columnHeightForPressure(P_ATM, RHO_MERCURY);
    // 0.760 m to within 1 mm given standard numbers.
    expect(h).toBeGreaterThan(0.755);
    expect(h).toBeLessThan(0.765);
  });

  it("one atmosphere balances ~10.33 m of water", () => {
    const h = columnHeightForPressure(P_ATM, RHO_WATER);
    expect(h).toBeCloseTo(10.33, 1);
  });

  it("rejects zero density", () => {
    expect(() => columnHeightForPressure(P_ATM, 0)).toThrow();
  });
});

describe("buoyantForce", () => {
  it("a 1 m^3 block fully submerged in water feels ~9807 N lift", () => {
    const F = buoyantForce(1, RHO_WATER);
    expect(F).toBeCloseTo(RHO_WATER * G_STANDARD, 6);
  });

  it("scales linearly with displaced volume", () => {
    const F1 = buoyantForce(1, RHO_WATER);
    const F2 = buoyantForce(2, RHO_WATER);
    expect(F2).toBeCloseTo(2 * F1, 10);
  });

  it("rejects negative volume", () => {
    expect(() => buoyantForce(-1, RHO_WATER)).toThrow();
  });
});

describe("submergedFraction", () => {
  it("ice in water sits ~92 % submerged", () => {
    const { submergedFraction: f, floats } = submergedFraction(917, RHO_WATER);
    expect(f).toBeCloseTo(0.917, 3);
    expect(floats).toBe(true);
  });

  it("aluminium sinks in water", () => {
    const { submergedFraction: f, floats } = submergedFraction(2700, RHO_WATER);
    expect(f).toBe(1);
    expect(floats).toBe(false);
  });

  it("a neutrally buoyant body sits fully submerged but doesn't sink further", () => {
    const { submergedFraction: f, floats } = submergedFraction(
      RHO_WATER,
      RHO_WATER,
    );
    expect(f).toBe(1);
    expect(floats).toBe(false);
  });
});

describe("hydraulicOutputForce", () => {
  it("pressure is the same on both pistons — force scales with area", () => {
    // 10 N on 1 cm^2 piston lifts 1000 N on 100 cm^2 piston.
    const F = hydraulicOutputForce(10, 1e-4, 1e-2);
    expect(F).toBeCloseTo(1000, 6);
  });

  it("equal areas give equal forces (no mechanical advantage)", () => {
    expect(hydraulicOutputForce(42, 0.01, 0.01)).toBeCloseTo(42, 10);
  });

  it("rejects zero input area", () => {
    expect(() => hydraulicOutputForce(10, 0, 0.01)).toThrow();
  });
});
