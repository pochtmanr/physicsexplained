import { describe, expect, it } from "vitest";
import { gamma } from "@/lib/physics/relativity/types";
import {
  travelerProperTime,
  ageDifference,
} from "@/lib/physics/relativity/twin-paradox";

describe("travelerProperTime", () => {
  it("equals T_home at β = 0 (no motion → no dilation)", () => {
    expect(travelerProperTime(10, 0)).toBeCloseTo(10, 12);
    expect(travelerProperTime(2.2e-6, 0)).toBeCloseTo(2.2e-6, 18);
  });

  it("β = 0.6, T = 10 yr → traveler 8 yr (canonical γ = 1.25 example)", () => {
    // γ(0.6) = 1/√(1 − 0.36) = 1/0.8 = 1.25 → 10 / 1.25 = 8.
    expect(travelerProperTime(10, 0.6)).toBeCloseTo(8, 12);
  });

  it("β = 0.8, T = 10 yr → traveler 6 yr (γ = 5/3 ≈ 1.667)", () => {
    // γ(0.8) = 1/√(1 − 0.64) = 1/0.6 = 5/3 → 10 / (5/3) = 6.
    expect(travelerProperTime(10, 0.8)).toBeCloseTo(6, 12);
  });

  it("scales linearly in T_home", () => {
    expect(travelerProperTime(20, 0.6)).toBeCloseTo(2 * travelerProperTime(10, 0.6), 12);
  });

  it("matches T_home / γ(β) for arbitrary subluminal β", () => {
    for (const beta of [0.1, 0.3, 0.5, 0.7, 0.9, 0.99]) {
      expect(travelerProperTime(7, beta)).toBeCloseTo(7 / gamma(beta), 12);
    }
  });

  it("approaches 0 as β → 1 (ultrarelativistic limit)", () => {
    expect(travelerProperTime(10, 0.999999)).toBeLessThan(0.02);
  });

  it("throws when |β| ≥ 1 (gamma diverges)", () => {
    expect(() => travelerProperTime(10, 1)).toThrow(RangeError);
    expect(() => travelerProperTime(10, 1.5)).toThrow(RangeError);
    expect(() => travelerProperTime(10, -1)).toThrow(RangeError);
  });
});

describe("ageDifference", () => {
  it("equals 0 at β = 0 (no trip, no disparity)", () => {
    expect(ageDifference(10, 0)).toBeCloseTo(0, 12);
  });

  it("β = 0.6, T = 10 yr → 2 yr disparity", () => {
    expect(ageDifference(10, 0.6)).toBeCloseTo(2, 12);
  });

  it("β = 0.8, T = 10 yr → 4 yr disparity", () => {
    expect(ageDifference(10, 0.8)).toBeCloseTo(4, 12);
  });

  it("is non-negative for any subluminal β and positive T_home", () => {
    for (const beta of [0, 0.1, 0.3, 0.5, 0.7, 0.9, 0.99]) {
      expect(ageDifference(10, beta)).toBeGreaterThanOrEqual(0);
    }
  });

  it("equals T_home · (1 − 1/γ) by construction", () => {
    const T = 12;
    const beta = 0.7;
    expect(ageDifference(T, beta)).toBeCloseTo(T * (1 - 1 / gamma(beta)), 12);
  });

  it("approaches T_home as β → 1 (traveler's clock barely advances)", () => {
    expect(ageDifference(10, 0.999999)).toBeGreaterThan(9.98);
    expect(ageDifference(10, 0.999999)).toBeLessThan(10);
  });

  it("throws on superluminal β", () => {
    expect(() => ageDifference(10, 1.2)).toThrow(RangeError);
  });
});
