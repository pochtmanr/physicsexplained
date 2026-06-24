import { describe, it, expect } from "vitest";
import {
  K_B,
  meanKE,
  meanSquareFromT,
  vRms,
  temperatureFromMeanSquare,
  pressureFromMeanSquare,
  vRmsForSpecies,
  characteristicSpeeds,
  SPECIES,
} from "@/lib/physics/thermodynamics/kinetic-pressure";

describe("temperature as kinetic energy", () => {
  it("mean KE is (3/2) k_B T", () => {
    expect(meanKE(300)).toBeCloseTo(1.5 * K_B * 300, 30);
  });

  it("½ m ⟨v²⟩ equals (3/2) k_B T", () => {
    const m = SPECIES[2].mass; // N₂
    const T = 300;
    const half = 0.5 * m * meanSquareFromT(T, m);
    expect(half).toBeCloseTo(1.5 * K_B * T, 25);
  });

  it("temperature inverts the mean-square speed", () => {
    const m = SPECIES[1].mass;
    const T = 412;
    expect(temperatureFromMeanSquare(meanSquareFromT(T, m), m)).toBeCloseTo(T, 6);
  });
});

describe("v_rms by species", () => {
  it("orders H₂ fastest and Xe slowest at a common temperature", () => {
    const T = 300;
    const speeds = SPECIES.map((s) => vRmsForSpecies(s.name, T));
    for (let i = 1; i < speeds.length; i++) {
      expect(speeds[i]).toBeLessThan(speeds[i - 1]);
    }
  });

  it("gives the textbook ~1900 m/s for H₂ and ~510 m/s for N₂ at 300 K", () => {
    expect(vRmsForSpecies("H₂", 300)).toBeGreaterThan(1800);
    expect(vRmsForSpecies("H₂", 300)).toBeLessThan(2000);
    expect(vRmsForSpecies("N₂", 300)).toBeGreaterThan(480);
    expect(vRmsForSpecies("N₂", 300)).toBeLessThan(540);
  });

  it("scales as √T", () => {
    const m = SPECIES[0].mass;
    expect(vRms(1200, m) / vRms(300, m)).toBeCloseTo(2, 6);
  });
});

describe("kinetic pressure", () => {
  it("PV = (1/3) N m ⟨v²⟩ reproduces N k_B T / V", () => {
    const N = 1e23;
    const m = SPECIES[2].mass;
    const T = 300;
    const V = 0.01;
    const meanSq = meanSquareFromT(T, m);
    const pKinetic = pressureFromMeanSquare(N, m, meanSq, V);
    const pIdeal = (N * K_B * T) / V;
    expect(pKinetic).toBeCloseTo(pIdeal, 6);
  });
});

describe("characteristic speeds", () => {
  it("always satisfy v_mp < ⟨v⟩ < v_rms", () => {
    const { vMp, vMean, vRms: vr } = characteristicSpeeds(300, SPECIES[2].mass);
    expect(vMp).toBeLessThan(vMean);
    expect(vMean).toBeLessThan(vr);
  });
});
