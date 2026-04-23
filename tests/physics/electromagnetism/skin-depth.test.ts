import { describe, expect, it } from "vitest";
import {
  SIGMA_AL,
  SIGMA_CU,
  effectiveResistance,
  skinDepth,
  skinDepthCopper,
  surfaceImpedance,
} from "@/lib/physics/electromagnetism/skin-depth";
import { MU_0 } from "@/lib/physics/constants";

describe("skinDepthCopper", () => {
  it("gives ≈ 9.3 mm at 50 Hz (within 5%)", () => {
    const delta = skinDepthCopper(50);
    // Textbook value: δ = √(2/(μ₀·σ·ω)) ≈ 9.22 mm at 50 Hz.
    const mm = delta * 1000;
    expect(mm).toBeGreaterThan(9.0);
    expect(mm).toBeLessThan(9.6);
  });

  it("gives ≈ 2.1 μm at 1 GHz", () => {
    const delta = skinDepthCopper(1e9);
    const um = delta * 1e6;
    // Textbook value: ~2.06 μm at 1 GHz in copper.
    expect(um).toBeGreaterThan(1.9);
    expect(um).toBeLessThan(2.3);
  });

  it("throws for non-positive frequency", () => {
    expect(() => skinDepthCopper(0)).toThrow();
    expect(() => skinDepthCopper(-1)).toThrow();
  });
});

describe("skinDepth scaling laws", () => {
  it("δ scales as 1/√f (freq quadruples → δ halves)", () => {
    const a = skinDepthCopper(1e6);
    const b = skinDepthCopper(4e6);
    // 4× frequency → 2× smaller δ.
    expect(a / b).toBeCloseTo(2, 8);
  });

  it("δ scales as 1/√σ at fixed ω", () => {
    const omega = 2 * Math.PI * 1e3;
    const dCu = skinDepth(SIGMA_CU, omega);
    // Quadruple σ → halve δ.
    const dQuad = skinDepth(4 * SIGMA_CU, omega);
    expect(dCu / dQuad).toBeCloseTo(2, 10);
  });

  it("aluminum at 60 Hz ≈ 10.7 mm (within 5%)", () => {
    const omega = 2 * Math.PI * 60;
    const delta = skinDepth(SIGMA_AL, omega);
    const mm = delta * 1000;
    // Textbook value for Al at 60 Hz: ~10.6 mm.
    expect(mm).toBeGreaterThan(10.2);
    expect(mm).toBeLessThan(11.2);
  });

  it("matches the closed form √(2/(μσω)) exactly", () => {
    const sigma = 3.5e7;
    const omega = 2 * Math.PI * 1e4;
    const expected = Math.sqrt(2 / (MU_0 * sigma * omega));
    expect(skinDepth(sigma, omega)).toBeCloseTo(expected, 20);
  });
});

describe("skinDepth input validation", () => {
  it("throws on non-positive sigma, omega, or mu", () => {
    expect(() => skinDepth(0, 1)).toThrow();
    expect(() => skinDepth(1, 0)).toThrow();
    expect(() => skinDepth(1, 1, 0)).toThrow();
    expect(() => skinDepth(-1, 1)).toThrow();
  });
});

describe("effectiveResistance", () => {
  it("grows as 1/δ — halving δ doubles the AC resistance", () => {
    const r1 = effectiveResistance(1, 1e-3, 1e-3);
    const r2 = effectiveResistance(1, 5e-4, 1e-3);
    expect(r2 / r1).toBeCloseTo(2, 10);
  });

  it("throws on bad inputs", () => {
    expect(() => effectiveResistance(0, 1, 1)).toThrow();
    expect(() => effectiveResistance(1, 0, 1)).toThrow();
    expect(() => effectiveResistance(1, 1, 0)).toThrow();
  });
});

describe("surfaceImpedance", () => {
  it("equals √2 / (σ·δ) — independent verification", () => {
    const sigma = SIGMA_CU;
    const omega = 2 * Math.PI * 1e9;
    const delta = skinDepth(sigma, omega);
    const expected = Math.SQRT2 / (sigma * delta);
    expect(surfaceImpedance(sigma, omega)).toBeCloseTo(expected, 20);
  });

  it("grows as √ω (1 GHz vs 1 MHz → ×√1000)", () => {
    const zLow = surfaceImpedance(SIGMA_CU, 2 * Math.PI * 1e6);
    const zHigh = surfaceImpedance(SIGMA_CU, 2 * Math.PI * 1e9);
    const ratio = zHigh / zLow;
    expect(ratio).toBeCloseTo(Math.sqrt(1000), 4);
  });
});
