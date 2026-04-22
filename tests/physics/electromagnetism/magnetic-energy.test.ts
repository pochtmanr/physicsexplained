import { describe, expect, it } from "vitest";
import {
  inductorEnergy,
  magneticEnergyDensity,
  magneticEnergyDensityMatter,
  totalFieldEnergy,
  inductorPower,
} from "@/lib/physics/electromagnetism/magnetic-energy";
import { MU_0 } from "@/lib/physics/constants";

describe("inductorEnergy", () => {
  it("is zero when current is zero", () => {
    expect(inductorEnergy(1e-3, 0)).toBe(0);
  });

  it("quadruples when current doubles", () => {
    const L = 2.5e-3;
    const u1 = inductorEnergy(L, 1);
    const u2 = inductorEnergy(L, 2);
    expect(u2 / u1).toBeCloseTo(4, 10);
  });

  it("scales linearly with inductance at fixed current", () => {
    expect(inductorEnergy(2, 3)).toBeCloseTo(2 * inductorEnergy(1, 3), 10);
  });
});

describe("magneticEnergyDensity", () => {
  it("is zero in zero field", () => {
    expect(magneticEnergyDensity(0)).toBe(0);
  });

  it("at B = 1 T gives ≈ 397.9 kJ/m³", () => {
    const u = magneticEnergyDensity(1);
    expect(u).toBeCloseTo(1 / (2 * MU_0), 6);
    expect(u).toBeGreaterThan(3.97e5);
    expect(u).toBeLessThan(3.99e5);
  });

  it("is even in B (sign of B does not matter)", () => {
    expect(magneticEnergyDensity(-0.7)).toBeCloseTo(
      magneticEnergyDensity(0.7),
      12,
    );
  });
});

describe("magneticEnergyDensityMatter", () => {
  it("matches B²/(2μ₀) in vacuum where B = μ₀H", () => {
    const H = 1000; // A/m
    const B = MU_0 * H;
    expect(magneticEnergyDensityMatter(H, B)).toBeCloseTo(
      magneticEnergyDensity(B),
      12,
    );
  });

  it("is zero when either H or B is zero", () => {
    expect(magneticEnergyDensityMatter(0, 1)).toBe(0);
    expect(magneticEnergyDensityMatter(1, 0)).toBe(0);
  });
});

describe("totalFieldEnergy", () => {
  it("scales linearly with volume", () => {
    expect(totalFieldEnergy(0.5, 2)).toBeCloseTo(
      2 * totalFieldEnergy(0.5, 1),
      10,
    );
  });

  it("equals u · V exactly", () => {
    const B = 2;
    const V = 0.01;
    expect(totalFieldEnergy(B, V)).toBeCloseTo(magneticEnergyDensity(B) * V, 12);
  });
});

describe("inductorPower", () => {
  it("is zero when either I or dI/dt is zero", () => {
    expect(inductorPower(1, 0, 5)).toBe(0);
    expect(inductorPower(1, 5, 0)).toBe(0);
  });

  it("satisfies P = L·I·dI/dt", () => {
    expect(inductorPower(2e-3, 3, 100)).toBeCloseTo(0.6, 10);
  });
});
