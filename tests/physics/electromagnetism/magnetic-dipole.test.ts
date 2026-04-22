import { describe, expect, it } from "vitest";
import {
  magneticMoment,
  dipoleTorque,
  dipoleEnergy,
  dipoleFieldOnAxis,
  dipoleFieldEquatorial,
} from "@/lib/physics/electromagnetism/magnetic-dipole";
import { MU_0 } from "@/lib/physics/constants";

describe("magneticMoment", () => {
  it("returns I·A for a planar current loop", () => {
    // 2 A around a 0.01 m² loop → m = 0.02 A·m²
    expect(magneticMoment(2, 0.01)).toBeCloseTo(0.02, 12);
  });

  it("scales linearly with the current", () => {
    const A = 0.005;
    const a = magneticMoment(1, A);
    const b = magneticMoment(4, A);
    expect(b / a).toBeCloseTo(4, 12);
  });

  it("vanishes for a zero-area loop", () => {
    expect(magneticMoment(10, 0)).toBe(0);
  });

  it("rejects negative area", () => {
    expect(() => magneticMoment(1, -0.1)).toThrow();
  });
});

describe("dipoleTorque", () => {
  it("is zero when m is parallel to B (θ = 0)", () => {
    expect(dipoleTorque(1, 1, 0)).toBeCloseTo(0, 12);
  });

  it("is zero when m is anti-parallel to B (θ = π)", () => {
    expect(dipoleTorque(1, 1, Math.PI)).toBeCloseTo(0, 12);
  });

  it("is maximum (m·B) when m is perpendicular to B (θ = π/2)", () => {
    const m = 0.02;
    const B = 0.5;
    expect(dipoleTorque(m, B, Math.PI / 2)).toBeCloseTo(m * B, 12);
  });

  it("scales linearly with m and with B", () => {
    const theta = Math.PI / 4;
    const base = dipoleTorque(1, 1, theta);
    expect(dipoleTorque(3, 1, theta)).toBeCloseTo(3 * base, 12);
    expect(dipoleTorque(1, 5, theta)).toBeCloseTo(5 * base, 12);
  });
});

describe("dipoleEnergy", () => {
  it("is at its minimum (−m·B) when m is aligned with B (θ = 0)", () => {
    const m = 0.02;
    const B = 0.5;
    expect(dipoleEnergy(m, B, 0)).toBeCloseTo(-m * B, 12);
  });

  it("is at its maximum (+m·B) when m is anti-aligned (θ = π)", () => {
    const m = 0.02;
    const B = 0.5;
    expect(dipoleEnergy(m, B, Math.PI)).toBeCloseTo(m * B, 12);
  });

  it("is zero when m is perpendicular to B (θ = π/2)", () => {
    expect(dipoleEnergy(1, 1, Math.PI / 2)).toBeCloseTo(0, 12);
  });

  it("aligned energy is strictly less than perpendicular energy", () => {
    const m = 1;
    const B = 1;
    const aligned = dipoleEnergy(m, B, 0);
    const perp = dipoleEnergy(m, B, Math.PI / 2);
    expect(aligned).toBeLessThan(perp);
  });
});

describe("dipoleFieldOnAxis", () => {
  it("matches (μ₀/4π) · 2m/z³ for unit moment at unit distance", () => {
    const expected = (MU_0 / (4 * Math.PI)) * 2;
    expect(dipoleFieldOnAxis(1, 1)).toBeCloseTo(expected, 18);
  });

  it("falls off as 1/z³", () => {
    const a = dipoleFieldOnAxis(1, 1);
    const b = dipoleFieldOnAxis(1, 2);
    // doubling z divides B by 8
    expect(a / b).toBeCloseTo(8, 12);
  });

  it("rejects non-positive distance", () => {
    expect(() => dipoleFieldOnAxis(1, 0)).toThrow();
    expect(() => dipoleFieldOnAxis(1, -1)).toThrow();
  });
});

describe("dipoleFieldEquatorial", () => {
  it("matches (μ₀/4π) · m/r³ for unit moment at unit distance", () => {
    const expected = MU_0 / (4 * Math.PI);
    expect(dipoleFieldEquatorial(1, 1)).toBeCloseTo(expected, 18);
  });

  it("falls off as 1/r³", () => {
    const a = dipoleFieldEquatorial(1, 1);
    const b = dipoleFieldEquatorial(1, 2);
    expect(a / b).toBeCloseTo(8, 12);
  });

  it("rejects non-positive distance", () => {
    expect(() => dipoleFieldEquatorial(1, 0)).toThrow();
    expect(() => dipoleFieldEquatorial(1, -1)).toThrow();
  });
});

describe("on-axis vs equatorial dipole field", () => {
  it("on-axis field is exactly twice the equatorial field at the same distance", () => {
    const m = 0.02;
    const d = 0.1;
    const axis = dipoleFieldOnAxis(m, d);
    const eq = dipoleFieldEquatorial(m, d);
    expect(axis / eq).toBeCloseTo(2, 12);
  });

  it("the factor of two is independent of moment and distance", () => {
    for (const m of [1e-6, 1, 1e3]) {
      for (const d of [0.01, 0.5, 100]) {
        const axis = dipoleFieldOnAxis(m, d);
        const eq = dipoleFieldEquatorial(m, d);
        expect(axis / eq).toBeCloseTo(2, 12);
      }
    }
  });
});
