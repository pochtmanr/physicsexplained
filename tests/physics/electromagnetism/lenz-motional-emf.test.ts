import { describe, expect, it } from "vitest";
import {
  motionalEmf,
  slidingRodDynamics,
  terminalVelocity,
  loopEmfFromDbDt,
} from "@/lib/physics/electromagnetism/lenz-motional-emf";

describe("motionalEmf", () => {
  it("scales linearly with B, L, and v", () => {
    expect(motionalEmf(1, 1, 1)).toBe(1);
    expect(motionalEmf(2, 1, 1)).toBe(2);
    expect(motionalEmf(1, 2, 1)).toBe(2);
    expect(motionalEmf(1, 1, 2)).toBe(2);
  });
  it("returns zero when v is zero (no motion, no EMF)", () => {
    expect(motionalEmf(1.5, 0.3, 0)).toBe(0);
  });
  it("flips sign when v reverses", () => {
    expect(motionalEmf(0.5, 0.4, -3)).toBeCloseTo(-0.6, 10);
  });
});

describe("slidingRodDynamics", () => {
  it("induced current is I = BLv/R", () => {
    const { I } = slidingRodDynamics(0.5, 0.4, 2, 0.1);
    expect(I).toBeCloseTo((0.5 * 0.4 * 2) / 0.1, 10);
  });
  it("retarding force opposes v (negative sign)", () => {
    const { F_mag } = slidingRodDynamics(1, 1, 1, 1);
    expect(F_mag).toBeLessThan(0);
  });
  it("retarding force has magnitude B²L²v/R", () => {
    const { F_mag } = slidingRodDynamics(0.8, 0.5, 3, 2);
    expect(F_mag).toBeCloseTo(-(0.8 ** 2 * 0.5 ** 2 * 3) / 2, 10);
  });
  it("when v is negative, F_mag is positive (still opposes motion)", () => {
    const { F_mag } = slidingRodDynamics(1, 1, -2, 1);
    expect(F_mag).toBeGreaterThan(0);
  });
  it("throws on non-positive R", () => {
    expect(() => slidingRodDynamics(1, 1, 1, 0)).toThrow();
    expect(() => slidingRodDynamics(1, 1, 1, -5)).toThrow();
  });
});

describe("terminalVelocity", () => {
  it("scales as F_ext · R / (B²L²)", () => {
    expect(terminalVelocity(2, 1, 1, 0.5)).toBeCloseTo(1, 10);
    expect(terminalVelocity(4, 1, 1, 0.5)).toBeCloseTo(2, 10);
  });
  it("at terminal velocity, F_ext + F_mag = 0", () => {
    const F_ext = 5;
    const B = 1.2;
    const L = 0.6;
    const R = 0.4;
    const v_term = terminalVelocity(F_ext, B, L, R);
    const { F_mag } = slidingRodDynamics(B, L, v_term, R);
    expect(F_ext + F_mag).toBeCloseTo(0, 10);
  });
  it("stronger field reduces terminal velocity (retarding force grows as B²)", () => {
    const v1 = terminalVelocity(1, 1, 1, 1);
    const v2 = terminalVelocity(1, 2, 1, 1);
    expect(v2).toBeLessThan(v1);
    expect(v2).toBeCloseTo(v1 / 4, 10);
  });
  it("throws when B·L is zero", () => {
    expect(() => terminalVelocity(1, 0, 1, 1)).toThrow();
    expect(() => terminalVelocity(1, 1, 0, 1)).toThrow();
  });
});

describe("loopEmfFromDbDt", () => {
  it("negative of A·dB/dt (Lenz sign)", () => {
    expect(loopEmfFromDbDt(0.02, 3)).toBeCloseTo(-0.06, 10);
  });
  it("sign flips with dB/dt", () => {
    expect(loopEmfFromDbDt(1, -2)).toBe(2);
  });
  it("zero when field is static", () => {
    expect(loopEmfFromDbDt(5, 0)).toBeCloseTo(0, 12);
  });
});
