import { describe, expect, it } from "vitest";
import {
  characteristicImpedance,
  propagationVelocity,
  propagationDelay,
  reflectionCoefficient,
  swr,
  standingWaveEnvelope,
  firstVoltageMaximum,
} from "@/lib/physics/electromagnetism/transmission-lines";

describe("characteristicImpedance", () => {
  it("returns 50 Ω for canonical coax inputs (L = 250 nH/m, C = 100 pF/m)", () => {
    // √(2.5e-7 / 1e-10) = √2500 = 50
    expect(characteristicImpedance(2.5e-7, 1e-10)).toBeCloseTo(50, 10);
  });

  it("returns 75 Ω for typical CATV cable (L = 375 nH/m, C = ~66.7 pF/m)", () => {
    const z0 = characteristicImpedance(3.75e-7, 3.75e-7 / (75 * 75));
    expect(z0).toBeCloseTo(75, 9);
  });

  it("throws on non-positive L or C", () => {
    expect(() => characteristicImpedance(0, 1e-10)).toThrow();
    expect(() => characteristicImpedance(1e-7, -1)).toThrow();
  });
});

describe("propagationVelocity", () => {
  it("is 1/√(LC)", () => {
    const v = propagationVelocity(2.5e-7, 1e-10);
    expect(v).toBeCloseTo(1 / Math.sqrt(2.5e-7 * 1e-10), 6);
  });

  it("is below the speed of light for typical polyethylene coax (~2e8 m/s)", () => {
    const v = propagationVelocity(2.5e-7, 1e-10);
    expect(v).toBeLessThan(3e8);
    expect(v).toBeGreaterThan(1e8);
  });
});

describe("propagationDelay", () => {
  it("is length / v", () => {
    const L = 2.5e-7;
    const C = 1e-10;
    const len = 10; // metres
    const v = propagationVelocity(L, C);
    expect(propagationDelay(L, C, len)).toBeCloseTo(len / v, 12);
  });

  it("is zero for zero-length line", () => {
    expect(propagationDelay(2.5e-7, 1e-10, 0)).toBe(0);
  });
});

describe("reflectionCoefficient", () => {
  it("is 0 for matched load (Z_L = Z₀)", () => {
    expect(reflectionCoefficient(50, 50)).toBe(0);
  });

  it("is +1 for open circuit (Z_L → ∞)", () => {
    expect(reflectionCoefficient(Infinity, 50)).toBe(1);
  });

  it("is −1 for short circuit (Z_L = 0)", () => {
    expect(reflectionCoefficient(0, 50)).toBe(-1);
  });

  it("is +1/3 when Z_L = 2·Z₀", () => {
    // (100 − 50) / (100 + 50) = 50/150 = 1/3
    expect(reflectionCoefficient(100, 50)).toBeCloseTo(1 / 3, 12);
  });

  it("throws on non-positive Z₀", () => {
    expect(() => reflectionCoefficient(50, 0)).toThrow();
    expect(() => reflectionCoefficient(50, -50)).toThrow();
  });
});

describe("swr", () => {
  it("is 1 for matched line (Γ = 0)", () => {
    expect(swr(0)).toBe(1);
  });

  it("is 2 when Z_L = 2·Z₀ (Γ = 1/3)", () => {
    // (1 + 1/3)/(1 − 1/3) = (4/3)/(2/3) = 2
    expect(swr(1 / 3)).toBeCloseTo(2, 10);
  });

  it("is infinite for full reflection (|Γ| = 1)", () => {
    expect(swr(1)).toBe(Infinity);
    expect(swr(-1)).toBe(Infinity);
  });

  it("depends only on |Γ| (symmetric)", () => {
    expect(swr(0.4)).toBeCloseTo(swr(-0.4), 12);
  });
});

describe("standingWaveEnvelope", () => {
  it("is flat at V₊ for a matched line (Γ = 0)", () => {
    const beta = 2 * Math.PI;
    const env1 = standingWaveEnvelope(1, 0, beta, 0);
    const env2 = standingWaveEnvelope(1, 0, beta, 0.17);
    const env3 = standingWaveEnvelope(1, 0, beta, 0.41);
    expect(env1).toBeCloseTo(1, 12);
    expect(env2).toBeCloseTo(1, 12);
    expect(env3).toBeCloseTo(1, 12);
  });

  it("oscillates between |1+Γ| and |1−Γ| on an open-terminated line", () => {
    const beta = 2 * Math.PI; // λ = 1 m
    const gamma = 0.5;
    // Maximum at x = 0 (load): 1 + Γ = 1.5
    expect(standingWaveEnvelope(1, gamma, beta, 0)).toBeCloseTo(1.5, 10);
    // Minimum at x = λ/4: 1 − Γ = 0.5
    expect(standingWaveEnvelope(1, gamma, beta, 0.25)).toBeCloseTo(0.5, 10);
  });

  it("is zero at the load for a short-terminated line (Γ = −1)", () => {
    const beta = 2 * Math.PI;
    expect(standingWaveEnvelope(1, -1, beta, 0)).toBeCloseTo(0, 10);
  });
});

describe("firstVoltageMaximum", () => {
  it("is at the load for open-like termination (Γ > 0)", () => {
    expect(firstVoltageMaximum(0.5, 1)).toBe(0);
  });

  it("is a quarter wavelength in for short-like termination (Γ < 0)", () => {
    expect(firstVoltageMaximum(-0.5, 1)).toBeCloseTo(0.25, 12);
  });
});
