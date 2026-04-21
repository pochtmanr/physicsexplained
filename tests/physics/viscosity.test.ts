import { describe, it, expect } from "vitest";
import {
  ETA_WATER,
  classifyPipeFlow,
  kinematicViscosity,
  poiseuilleCentrelineVelocity,
  poiseuilleFlowRate,
  poiseuilleMeanVelocity,
  poiseuilleVelocity,
  reynoldsNumber,
  shearStress,
} from "@/lib/physics/viscosity";

describe("shearStress", () => {
  it("is eta times the velocity gradient", () => {
    expect(shearStress(0.01, 50)).toBeCloseTo(0.5, 12);
  });

  it("is zero when either factor is zero", () => {
    expect(shearStress(0, 10)).toBe(0);
    expect(shearStress(1.5, 0)).toBe(0);
  });
});

describe("reynoldsNumber", () => {
  it("water at 1 m/s in a 1 cm pipe is ~10_000 (turbulent)", () => {
    const Re = reynoldsNumber(1000, 1, 0.01, ETA_WATER);
    expect(Re).toBeCloseTo(10_000, 6);
  });

  it("air at 10 m/s over a 1 m wing is ~6e5", () => {
    const Re = reynoldsNumber(1.2, 10, 1, 1.8e-5);
    // 1.2 * 10 * 1 / 1.8e-5 = 666_666.6...
    expect(Re).toBeGreaterThan(5e5);
    expect(Re).toBeLessThan(1e6);
  });

  it("bacterium swimming in water: Re is tiny", () => {
    // 10 micron, 10 micron/s
    const Re = reynoldsNumber(1000, 1e-5, 1e-5, ETA_WATER);
    expect(Re).toBeLessThan(1e-3);
  });

  it("throws on non-positive viscosity", () => {
    expect(() => reynoldsNumber(1000, 1, 1, 0)).toThrow();
    expect(() => reynoldsNumber(1000, 1, 1, -1)).toThrow();
  });
});

describe("classifyPipeFlow", () => {
  it("labels each standard band", () => {
    expect(classifyPipeFlow(0.5)).toBe("creeping");
    expect(classifyPipeFlow(1500)).toBe("laminar");
    expect(classifyPipeFlow(3000)).toBe("transitional");
    expect(classifyPipeFlow(50_000)).toBe("turbulent");
  });
});

describe("poiseuilleVelocity", () => {
  it("is zero at the wall (no-slip)", () => {
    expect(poiseuilleVelocity(1, 1, 100, ETA_WATER)).toBeCloseTo(0, 12);
  });

  it("peaks at the centreline", () => {
    const R = 0.01;
    const centre = poiseuilleVelocity(0, R, 200, ETA_WATER);
    const mid = poiseuilleVelocity(R / 2, R, 200, ETA_WATER);
    const edge = poiseuilleVelocity(0.9 * R, R, 200, ETA_WATER);
    expect(centre).toBeGreaterThan(mid);
    expect(mid).toBeGreaterThan(edge);
  });

  it("is parabolic: u(R/2) = (3/4) u_max", () => {
    const R = 0.02;
    const umax = poiseuilleCentrelineVelocity(R, 500, ETA_WATER);
    const uHalf = poiseuilleVelocity(R / 2, R, 500, ETA_WATER);
    expect(uHalf / umax).toBeCloseTo(0.75, 10);
  });
});

describe("poiseuilleMeanVelocity", () => {
  it("is exactly half the centreline velocity", () => {
    const R = 0.005;
    const dpdx = 300;
    const mean = poiseuilleMeanVelocity(R, dpdx, ETA_WATER);
    const peak = poiseuilleCentrelineVelocity(R, dpdx, ETA_WATER);
    expect(mean).toBeCloseTo(peak / 2, 12);
  });
});

describe("poiseuilleFlowRate", () => {
  it("scales with the fourth power of the radius", () => {
    const Q1 = poiseuilleFlowRate(1e-3, 1000, 1, ETA_WATER);
    const Q2 = poiseuilleFlowRate(2e-3, 1000, 1, ETA_WATER);
    expect(Q2 / Q1).toBeCloseTo(16, 10);
  });

  it("matches pi R^4 dp / (8 eta L)", () => {
    const R = 0.01;
    const dp = 1000;
    const L = 2;
    const eta = ETA_WATER;
    const expected = (Math.PI * R ** 4 * dp) / (8 * eta * L);
    expect(poiseuilleFlowRate(R, dp, L, eta)).toBeCloseTo(expected, 12);
  });

  it("throws on zero viscosity or length", () => {
    expect(() => poiseuilleFlowRate(0.01, 100, 1, 0)).toThrow();
    expect(() => poiseuilleFlowRate(0.01, 100, 0, ETA_WATER)).toThrow();
  });
});

describe("kinematicViscosity", () => {
  it("water: nu ~ 1e-6 m^2/s", () => {
    expect(kinematicViscosity(ETA_WATER, 1000)).toBeCloseTo(1e-6, 12);
  });

  it("throws on non-positive density", () => {
    expect(() => kinematicViscosity(1e-3, 0)).toThrow();
  });
});
