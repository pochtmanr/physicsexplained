import { describe, it, expect } from "vitest";
import {
  SPECIES,
  speciesMass,
  vMostProbable,
  vMean,
  vRms,
  fastFraction,
  arrheniusFactor,
} from "@/lib/physics/thermodynamics/maxwell-boltzmann";

const N2 = speciesMass(SPECIES.find((s) => s.name === "N₂")!);

describe("characteristic speeds", () => {
  it("are ordered v_mp < ⟨v⟩ < v_rms", () => {
    const T = 300;
    expect(vMostProbable(T, N2)).toBeLessThan(vMean(T, N2));
    expect(vMean(T, N2)).toBeLessThan(vRms(T, N2));
  });

  it("hold the exact textbook ratios", () => {
    const T = 273;
    const vmp = vMostProbable(T, N2);
    expect(vMean(T, N2) / vmp).toBeCloseTo(Math.sqrt(4 / Math.PI), 6); // 1.1284
    expect(vRms(T, N2) / vmp).toBeCloseTo(Math.sqrt(1.5), 6); // 1.2247
  });

  it("give ~510 m/s rms for N₂ at room temperature", () => {
    expect(vRms(298, N2)).toBeGreaterThan(480);
    expect(vRms(298, N2)).toBeLessThan(540);
  });

  it("make H₂ far faster than N₂ at the same temperature", () => {
    const H2 = speciesMass(SPECIES.find((s) => s.name === "H₂")!);
    expect(vRms(298, H2)).toBeGreaterThan(3 * vRms(298, N2));
  });
});

describe("fastFraction", () => {
  it("is 1 below all speeds and 0 far above them", () => {
    expect(fastFraction(0, 300, N2)).toBeCloseTo(1, 6);
    expect(fastFraction(1e5, 300, N2)).toBeCloseTo(0, 6);
  });
  it("stays within [0, 1]", () => {
    const f = fastFraction(600, 300, N2);
    expect(f).toBeGreaterThanOrEqual(0);
    expect(f).toBeLessThanOrEqual(1);
  });
  it("rises with temperature at a fixed threshold", () => {
    const vth = 900;
    expect(fastFraction(vth, 600, N2)).toBeGreaterThan(fastFraction(vth, 300, N2));
  });
});

describe("arrheniusFactor", () => {
  it("is in (0, 1] and rises with temperature", () => {
    const Ea = 8e-20;
    const cold = arrheniusFactor(Ea, 300);
    const hot = arrheniusFactor(Ea, 600);
    expect(cold).toBeGreaterThan(0);
    expect(cold).toBeLessThanOrEqual(1);
    expect(hot).toBeGreaterThan(cold);
  });
});
