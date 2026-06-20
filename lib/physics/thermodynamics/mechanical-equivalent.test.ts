import { describe, it, expect } from "vitest";
import {
  JOULES_PER_CALORIE,
  caloriesToJoules,
  joulesToCalories,
  workFromFallingWeight,
  temperatureRise,
  paddleWheelDeltaT,
  workFromCranking,
  rumfordSlope,
} from "@/lib/physics/thermodynamics/mechanical-equivalent";

describe("mechanical equivalent of heat", () => {
  it("uses Joule's 4.186 J/cal", () => {
    expect(JOULES_PER_CALORIE).toBeCloseTo(4.186, 6);
    expect(caloriesToJoules(1)).toBeCloseTo(4.186, 6);
    expect(joulesToCalories(4.186)).toBeCloseTo(1, 6);
  });

  it("cal↔J round-trips", () => {
    for (const cal of [0, 1, 100, 1000]) {
      expect(joulesToCalories(caloriesToJoules(cal))).toBeCloseTo(cal, 6);
    }
  });
});

describe("falling weight work", () => {
  it("W = m g h", () => {
    expect(workFromFallingWeight(1, 1, 9.80665)).toBeCloseTo(9.80665, 5);
    expect(workFromFallingWeight(10, 2, 10)).toBeCloseTo(200, 6);
  });

  it("rejects negative inputs", () => {
    expect(() => workFromFallingWeight(-1, 1)).toThrow();
    expect(() => workFromFallingWeight(1, -1)).toThrow();
  });
});

describe("temperature rise from work", () => {
  it("ΔT = W / (m c)", () => {
    // 4186 J into 1 kg of water (c = 4186) → 1 K
    expect(temperatureRise(4186, 1, 4186)).toBeCloseTo(1, 6);
  });

  it("rejects non-positive mass or specific heat", () => {
    expect(() => temperatureRise(100, 0, 4186)).toThrow();
    expect(() => temperatureRise(100, 1, 0)).toThrow();
  });
});

describe("Joule paddle wheel", () => {
  it("combines mgh and ΔT = W/(mc)", () => {
    // 1 kg dropped 1 m (g=9.80665) into 1 kg water → tiny ΔT
    const dt = paddleWheelDeltaT(1, 1, 1, 4186, 9.80665);
    expect(dt).toBeCloseTo(9.80665 / 4186, 8);
  });

  it("scales linearly with drop height (no asymptote)", () => {
    const a = paddleWheelDeltaT(2, 1, 1);
    const b = paddleWheelDeltaT(2, 2, 1);
    expect(b / a).toBeCloseTo(2, 6);
  });
});

describe("Rumford cranking", () => {
  it("W = τ · 2π N grows without bound", () => {
    expect(workFromCranking(1, 1)).toBeCloseTo(2 * Math.PI, 6);
    expect(workFromCranking(1, 1000)).toBeCloseTo(2000 * Math.PI, 6);
  });

  it("water temperature is linear in work via rumfordSlope", () => {
    const slope = rumfordSlope(2, 4186); // K per J
    const work = workFromCranking(5, 100);
    expect(temperatureRise(work, 2, 4186)).toBeCloseTo(work * slope, 8);
  });

  it("rejects negatives", () => {
    expect(() => workFromCranking(-1, 1)).toThrow();
    expect(() => rumfordSlope(0)).toThrow();
  });
});
