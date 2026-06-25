import { describe, it, expect } from "vitest";
import { K_B } from "@/lib/physics/thermodynamics/distributions";
import {
  zTwoLevel,
  levelPopulationsTwoLevel,
  meanEnergyTwoLevel,
  cvTwoLevel,
  zHarmonic,
  meanEnergyHarmonic,
  cvHarmonic,
  thermalWavelength,
  zIdealTranslational,
  sackurTetrode,
  freeEnergyFromZ,
  meanEnergyFromLnZ,
  entropyFromLnZ,
  heatCapacityFromLnZ,
} from "@/lib/physics/thermodynamics/partition-function";

// A representative energy gap: 1e-21 J ≈ k_B·72 K.
const EPS = 1e-21;
const epsTemp = EPS / K_B; // temperature at which k_BT = ε

describe("two-level system", () => {
  it("Z runs from 1 (cold) to 2 (hot)", () => {
    expect(zTwoLevel(epsTemp * 1e-3, EPS)).toBeCloseTo(1, 6);
    expect(zTwoLevel(epsTemp * 1e4, EPS)).toBeCloseTo(2, 3);
  });

  it("populations sum to 1 and equalise at high T", () => {
    const [p0, p1] = levelPopulationsTwoLevel(epsTemp, EPS);
    expect(p0 + p1).toBeCloseTo(1, 12);
    expect(p0).toBeGreaterThan(p1); // ground state still favoured at k_BT = ε
    const [h0, h1] = levelPopulationsTwoLevel(epsTemp * 1e4, EPS);
    expect(h0).toBeCloseTo(0.5, 3);
    expect(h1).toBeCloseTo(0.5, 3);
  });

  it("mean energy rises from 0 toward ε/2", () => {
    expect(meanEnergyTwoLevel(epsTemp * 1e-2, EPS)).toBeLessThan(EPS * 0.01);
    expect(meanEnergyTwoLevel(epsTemp * 1e4, EPS)).toBeCloseTo(EPS / 2, 2);
  });

  it("heat capacity shows a Schottky peak near k_BT ≈ 0.42 ε", () => {
    const peak = cvTwoLevel(0.417 * epsTemp, EPS);
    const cold = cvTwoLevel(0.05 * epsTemp, EPS);
    const hot = cvTwoLevel(10 * epsTemp, EPS);
    expect(peak).toBeGreaterThan(cold);
    expect(peak).toBeGreaterThan(hot);
    // the textbook peak height is ≈ 0.439 k_B
    expect(peak / K_B).toBeCloseTo(0.439, 2);
  });
});

describe("quantum harmonic oscillator", () => {
  // ħω = 1e-21 J, the same scale as EPS so temperatures are comparable.
  const omega = EPS / 1.054571817e-34;
  const hwTemp = EPS / K_B;

  it("Z diverges as T → ∞ and → 1 as T → 0", () => {
    expect(zHarmonic(hwTemp * 1e-3, omega)).toBeCloseTo(1, 6);
    expect(zHarmonic(hwTemp * 100, omega)).toBeGreaterThan(50);
  });

  it("mean energy approaches the classical k_BT at high T", () => {
    const T = hwTemp * 200;
    expect(meanEnergyHarmonic(T, omega)).toBeCloseTo(K_B * T, 1);
  });

  it("heat capacity approaches k_B at high T and freezes out cold", () => {
    expect(cvHarmonic(hwTemp * 200, omega)).toBeCloseTo(K_B, 2);
    expect(cvHarmonic(hwTemp * 0.1, omega)).toBeLessThan(K_B * 0.01);
  });
});

describe("ideal gas", () => {
  const m = 28.01 * 1.66053906660e-27; // N₂
  const V = 1; // 1 m³
  const N = 2.5e25; // ~1 mol-ish at room conditions

  it("thermal wavelength shrinks with temperature", () => {
    expect(thermalWavelength(100, m)).toBeGreaterThan(thermalWavelength(400, m));
  });

  it("single-particle Z = V/λ³ is huge and dimensionless-large", () => {
    expect(zIdealTranslational(300, m, V)).toBeGreaterThan(1e29);
  });

  it("Sackur–Tetrode entropy is positive and increases with temperature", () => {
    const sLow = sackurTetrode(200, m, V, N);
    const sHigh = sackurTetrode(400, m, V, N);
    expect(sLow).toBeGreaterThan(0);
    expect(sHigh).toBeGreaterThan(sLow);
  });
});

describe("generic observables from ln Z reproduce the analytic results", () => {
  const lnZTwoLevel = (T: number) => Math.log(zTwoLevel(T, EPS));

  it("free energy equals −k_BT ln Z", () => {
    const T = epsTemp;
    expect(freeEnergyFromZ(zTwoLevel(T, EPS), T)).toBeCloseTo(
      -K_B * T * Math.log(zTwoLevel(T, EPS)),
      30,
    );
  });

  it("⟨E⟩ from d ln Z/dβ matches the closed form", () => {
    const T = epsTemp;
    const numeric = meanEnergyFromLnZ(lnZTwoLevel, T);
    expect(numeric).toBeCloseTo(meanEnergyTwoLevel(T, EPS), 23);
  });

  it("C_v from d⟨E⟩/dT matches the Schottky formula", () => {
    const T = 0.5 * epsTemp;
    const numeric = heatCapacityFromLnZ(lnZTwoLevel, T);
    expect(numeric / K_B).toBeCloseTo(cvTwoLevel(T, EPS) / K_B, 3);
  });

  it("entropy is positive and consistent with S = (⟨E⟩ − F)/T", () => {
    const T = epsTemp;
    const S = entropyFromLnZ(lnZTwoLevel, T);
    const viaFE =
      (meanEnergyTwoLevel(T, EPS) - freeEnergyFromZ(zTwoLevel(T, EPS), T)) / T;
    expect(S).toBeGreaterThan(0);
    expect(S).toBeCloseTo(viaFE, 23);
  });
});
