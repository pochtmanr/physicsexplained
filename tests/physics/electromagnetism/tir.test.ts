import { describe, expect, it } from "vitest";
import {
  criticalAngleRad,
  isTIR,
  evanescentDecayLength,
  frustratedTIRTransmittance,
} from "@/lib/physics/electromagnetism/tir";

const DEG = Math.PI / 180;

describe("criticalAngleRad", () => {
  it("glass → air (n = 1.5 / 1.0) is 41.81° within 0.05°", () => {
    const tc = criticalAngleRad(1.5, 1.0);
    expect(tc).not.toBeNull();
    const deg = (tc as number) / DEG;
    expect(Math.abs(deg - 41.81)).toBeLessThan(0.05);
  });

  it("water → air (n = 1.33 / 1.0) is ≈ 48.75° (spec value 48.6° within 0.2°)", () => {
    const tc = criticalAngleRad(1.33, 1.0);
    expect(tc).not.toBeNull();
    const deg = (tc as number) / DEG;
    // arcsin(1/1.33) ≈ 48.753°; spec's rounded "48.6" is within 0.2°.
    expect(Math.abs(deg - 48.6)).toBeLessThan(0.2);
    expect(Math.abs(deg - 48.753)).toBeLessThan(0.01);
  });

  it("returns null when n1 <= n2 (no TIR into a denser or equal medium)", () => {
    expect(criticalAngleRad(1.0, 1.5)).toBeNull();
    expect(criticalAngleRad(1.5, 1.5)).toBeNull();
    expect(criticalAngleRad(1.0, 1.0)).toBeNull();
  });
});

describe("isTIR", () => {
  it("45° through glass → air is TIR", () => {
    expect(isTIR(45 * DEG, 1.5, 1.0)).toBe(true);
  });

  it("40° through glass → air is NOT TIR (below critical)", () => {
    expect(isTIR(40 * DEG, 1.5, 1.0)).toBe(false);
  });

  it("any angle from air → glass is NOT TIR (no critical angle exists)", () => {
    expect(isTIR(10 * DEG, 1.0, 1.5)).toBe(false);
    expect(isTIR(80 * DEG, 1.0, 1.5)).toBe(false);
  });
});

describe("evanescentDecayLength", () => {
  it("shortens as incidence angle increases past critical", () => {
    const tc = criticalAngleRad(1.5, 1.0) as number;
    const d_near = evanescentDecayLength(tc + 1 * DEG, 1.5, 1.0, 0.0005);
    const d_far = evanescentDecayLength(tc + 10 * DEG, 1.5, 1.0, 0.0005);
    expect(d_near).not.toBeNull();
    expect(d_far).not.toBeNull();
    // Close to θ_c the decay length diverges — so d_near ≫ d_far.
    expect(d_near as number).toBeGreaterThan(d_far as number);
  });

  it("returns null below the critical angle (no evanescent regime)", () => {
    const d = evanescentDecayLength(30 * DEG, 1.5, 1.0, 0.0005);
    expect(d).toBeNull();
  });

  it("scales linearly with vacuum wavelength at fixed geometry", () => {
    const tc = criticalAngleRad(1.5, 1.0) as number;
    const d1 = evanescentDecayLength(tc + 5 * DEG, 1.5, 1.0, 0.0005) as number;
    const d2 = evanescentDecayLength(tc + 5 * DEG, 1.5, 1.0, 0.001) as number;
    expect(d2 / d1).toBeCloseTo(2, 8);
  });
});

describe("frustratedTIRTransmittance", () => {
  it("zero gap → full transmission (T = 1)", () => {
    const T = frustratedTIRTransmittance(0, 0.0005, 45 * DEG, 1.5, 1.0);
    expect(T).toBeCloseTo(1, 12);
  });

  it("large gap → T decays toward zero", () => {
    const tc = criticalAngleRad(1.5, 1.0) as number;
    const T1 = frustratedTIRTransmittance(0.0001, 0.0005, tc + 5 * DEG, 1.5, 1.0);
    const T2 = frustratedTIRTransmittance(0.001, 0.0005, tc + 5 * DEG, 1.5, 1.0);
    const T3 = frustratedTIRTransmittance(0.01, 0.0005, tc + 5 * DEG, 1.5, 1.0);
    expect(T1).toBeGreaterThan(T2);
    expect(T2).toBeGreaterThan(T3);
    expect(T3).toBeLessThan(0.05); // a wavelength-scale gap, then some — very little tunnels
  });

  it("is 1 when the configuration is not in TIR regime (gap is irrelevant)", () => {
    // 30° in glass → air is sub-critical; ordinary refraction, no barrier.
    expect(frustratedTIRTransmittance(0.001, 0.0005, 30 * DEG, 1.5, 1.0)).toBe(1);
  });
});
