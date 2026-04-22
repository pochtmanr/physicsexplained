import { describe, expect, it } from "vitest";
import {
  solenoidField,
  toroidField,
  wireFieldByAmpere,
} from "@/lib/physics/electromagnetism/ampere";
import { MU_0 } from "@/lib/physics/constants";

describe("solenoidField", () => {
  it("returns ~1.257 mT for a 1000 turns/m solenoid carrying 1 A", () => {
    // Textbook number: μ₀ · 1000 · 1 ≈ 1.2566 × 10⁻³ T.
    const B = solenoidField(1000, 1);
    expect(B).toBeCloseTo(1.2566e-3, 6);
  });

  it("matches μ₀ · n · I exactly", () => {
    expect(solenoidField(500, 2)).toBeCloseTo(MU_0 * 500 * 2, 18);
  });

  it("is linear in n", () => {
    const B1 = solenoidField(100, 3);
    const B2 = solenoidField(400, 3);
    expect(B2 / B1).toBeCloseTo(4, 12);
  });

  it("is linear in I", () => {
    const B1 = solenoidField(800, 1);
    const B2 = solenoidField(800, 5);
    expect(B2 / B1).toBeCloseTo(5, 12);
  });

  it("returns zero when no current flows", () => {
    expect(solenoidField(1000, 0)).toBe(0);
  });
});

describe("toroidField", () => {
  it("matches μ₀·N·I/(2π·r) for a textbook case", () => {
    // 500 turns, 2 A, 0.1 m radius → ~2 mT.
    const B = toroidField(500, 2, 0.1);
    expect(B).toBeCloseTo((MU_0 * 500 * 2) / (2 * Math.PI * 0.1), 18);
  });

  it("falls off as 1/r — doubling r halves B", () => {
    const N = 1000;
    const I = 4;
    const Bnear = toroidField(N, I, 0.05);
    const Bfar = toroidField(N, I, 0.10);
    expect(Bnear / Bfar).toBeCloseTo(2, 12);
  });

  it("falls off as 1/r — tripling r reduces B by exactly 3", () => {
    const N = 200;
    const I = 1.5;
    const r0 = 0.08;
    const B0 = toroidField(N, I, r0);
    const B3 = toroidField(N, I, 3 * r0);
    expect(B0 / B3).toBeCloseTo(3, 12);
  });

  it("throws when r is non-positive", () => {
    expect(() => toroidField(100, 1, 0)).toThrow();
    expect(() => toroidField(100, 1, -0.05)).toThrow();
  });
});

describe("wireFieldByAmpere", () => {
  it("matches μ₀·I/(2π·r) for a textbook case", () => {
    // 1 A, 1 cm away → 2 × 10⁻⁵ T = 20 μT.
    const B = wireFieldByAmpere(1, 0.01);
    expect(B).toBeCloseTo(2e-5, 7);
  });

  it("agrees with the Biot–Savart straight-wire result for the same (I, r)", () => {
    // Biot–Savart gives the same closed form for an infinite straight
    // wire: B = μ₀ · I / (2π · r). We verify that the number Ampère's
    // law produces is exactly that — different derivation, same answer.
    const I = 3.7;
    const r = 0.045;
    const expected = (MU_0 * I) / (2 * Math.PI * r);
    expect(wireFieldByAmpere(I, r)).toBeCloseTo(expected, 18);
  });

  it("falls off as 1/r — doubling r halves B", () => {
    const I = 2.5;
    const Bnear = wireFieldByAmpere(I, 0.02);
    const Bfar = wireFieldByAmpere(I, 0.04);
    expect(Bnear / Bfar).toBeCloseTo(2, 12);
  });

  it("is linear in current", () => {
    const r = 0.03;
    const B1 = wireFieldByAmpere(1, r);
    const B7 = wireFieldByAmpere(7, r);
    expect(B7 / B1).toBeCloseTo(7, 12);
  });

  it("throws when r is non-positive", () => {
    expect(() => wireFieldByAmpere(1, 0)).toThrow();
    expect(() => wireFieldByAmpere(1, -0.01)).toThrow();
  });
});
