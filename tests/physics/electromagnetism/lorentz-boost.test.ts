import { describe, expect, it } from "vitest";
import {
  lengthContract,
  boostLineDensity,
  netChargeDensityTwoWire,
} from "@/lib/physics/electromagnetism/lorentz-boost";

describe("lengthContract", () => {
  it("is identity at β=0", () => {
    expect(lengthContract(1, 0)).toBe(1);
  });
  it("contracts to L_0/γ at β=0.6 → 0.8·L_0", () => {
    expect(lengthContract(1, 0.6)).toBeCloseTo(0.8, 10);
  });
  it("preserves rest length at β→0", () => {
    expect(lengthContract(2.5, 1e-12)).toBeCloseTo(2.5, 10);
  });
});

describe("boostLineDensity", () => {
  it("is identity at β=0", () => {
    expect(boostLineDensity(1, 0, 1)).toBe(1);
    expect(boostLineDensity(1, 0, -1)).toBe(1);
  });
  it("multiplies by γ at β=0.6 → 1.25·n0", () => {
    expect(boostLineDensity(1, 0.6, 1)).toBeCloseTo(1.25, 10);
  });
  it("magnitude is symmetric in sign of motion", () => {
    expect(boostLineDensity(1, 0.6, 1)).toBe(boostLineDensity(1, 0.6, -1));
  });
});

describe("netChargeDensityTwoWire", () => {
  it("is exactly zero at β=0 (lab-frame neutrality)", () => {
    expect(netChargeDensityTwoWire(0, 1)).toBe(0);
  });
  it("scales as n0(γ − 1/γ) at β=0.6 with n0=5 → 5·(1.25 − 0.8) = 2.25", () => {
    const n0 = 5;
    expect(netChargeDensityTwoWire(0.6, n0)).toBeCloseTo(n0 * (1.25 - 0.8), 10);
  });
  it("is positive for any β > 0 (γ − 1/γ > 0)", () => {
    expect(netChargeDensityTwoWire(0.001, 1)).toBeGreaterThan(0);
    expect(netChargeDensityTwoWire(0.5, 1)).toBeGreaterThan(0);
    expect(netChargeDensityTwoWire(0.9, 1)).toBeGreaterThan(0);
  });
  it("monotonically increases in β", () => {
    const a = netChargeDensityTwoWire(0.1, 1);
    const b = netChargeDensityTwoWire(0.5, 1);
    const c = netChargeDensityTwoWire(0.9, 1);
    expect(b).toBeGreaterThan(a);
    expect(c).toBeGreaterThan(b);
  });
});
