import { describe, expect, it } from "vitest";
import {
  cross,
  lorentzForce,
  cyclotronRadius,
  cyclotronFrequency,
  type Vec3,
} from "@/lib/physics/electromagnetism/lorentz";

const X: Vec3 = { x: 1, y: 0, z: 0 };
const Y: Vec3 = { x: 0, y: 1, z: 0 };
const Z: Vec3 = { x: 0, y: 0, z: 1 };
const ZERO: Vec3 = { x: 0, y: 0, z: 0 };

describe("cross", () => {
  it("right-handed: x̂ × ŷ = ẑ", () => {
    expect(cross(X, Y)).toEqual(Z);
  });

  it("ŷ × ẑ = x̂", () => {
    expect(cross(Y, Z)).toEqual(X);
  });

  it("ẑ × x̂ = ŷ", () => {
    expect(cross(Z, X)).toEqual(Y);
  });

  it("antisymmetric: a × b = −(b × a)", () => {
    const a: Vec3 = { x: 2, y: -1, z: 3 };
    const b: Vec3 = { x: 0.5, y: 4, z: -2 };
    const ab = cross(a, b);
    const ba = cross(b, a);
    expect(ab.x).toBeCloseTo(-ba.x, 12);
    expect(ab.y).toBeCloseTo(-ba.y, 12);
    expect(ab.z).toBeCloseTo(-ba.z, 12);
  });

  it("a × a = 0", () => {
    const a: Vec3 = { x: 1.7, y: -2.3, z: 0.4 };
    const r = cross(a, a);
    expect(r.x).toBeCloseTo(0, 12);
    expect(r.y).toBeCloseTo(0, 12);
    expect(r.z).toBeCloseTo(0, 12);
  });
});

describe("lorentzForce", () => {
  it("a stationary charge in a pure B field feels nothing", () => {
    const F = lorentzForce(1, ZERO, ZERO, { x: 0, y: 0, z: 1 });
    expect(F).toEqual(ZERO);
  });

  it("E alone gives F = qE (B = 0)", () => {
    const F = lorentzForce(2, ZERO, { x: 3, y: 0, z: 0 }, ZERO);
    expect(F).toEqual({ x: 6, y: 0, z: 0 });
  });

  it("F is perpendicular to v in a pure B field (F · v = 0)", () => {
    const v: Vec3 = { x: 3, y: 4, z: 0 };
    const B: Vec3 = { x: 0, y: 0, z: 2 };
    const F = lorentzForce(1.5, v, ZERO, B);
    const dot = F.x * v.x + F.y * v.y + F.z * v.z;
    expect(dot).toBeCloseTo(0, 12);
  });

  it("v ∥ B gives no magnetic force (purely E term survives)", () => {
    const v: Vec3 = { x: 0, y: 0, z: 5 };
    const B: Vec3 = { x: 0, y: 0, z: 2 };
    const E: Vec3 = { x: 1, y: 0, z: 0 };
    const F = lorentzForce(0.5, v, E, B);
    expect(F.x).toBeCloseTo(0.5, 12);
    expect(F.y).toBeCloseTo(0, 12);
    expect(F.z).toBeCloseTo(0, 12);
  });

  it("known case: q v×B for v=x̂, B=ẑ gives −ŷ", () => {
    // x̂ × ẑ = −ŷ
    const F = lorentzForce(1, X, ZERO, Z);
    expect(F.x).toBeCloseTo(0, 12);
    expect(F.y).toBeCloseTo(-1, 12);
    expect(F.z).toBeCloseTo(0, 12);
  });
});

describe("cyclotronRadius", () => {
  it("scales linearly with v⊥", () => {
    const r1 = cyclotronRadius(1, 100, 1, 1);
    const r2 = cyclotronRadius(1, 200, 1, 1);
    expect(r2 / r1).toBeCloseTo(2, 12);
  });

  it("falls as 1/B", () => {
    const r1 = cyclotronRadius(1, 100, 1, 1);
    const r2 = cyclotronRadius(1, 100, 1, 2);
    expect(r2 / r1).toBeCloseTo(0.5, 12);
  });

  it("uses |q| (negative charge same radius)", () => {
    const rPos = cyclotronRadius(1, 100, +1, 1);
    const rNeg = cyclotronRadius(1, 100, -1, 1);
    expect(rPos).toBeCloseTo(rNeg, 12);
  });
});

describe("cyclotronFrequency", () => {
  it("is independent of speed (no v in the formula)", () => {
    // Confirm the function signature and result don't depend on v.
    const w = cyclotronFrequency(1.6e-19, 1.0, 9.11e-31);
    expect(w).toBeGreaterThan(0);
    expect(w).toBeCloseTo((1.6e-19 * 1.0) / 9.11e-31, 0);
  });

  it("doubles when B doubles", () => {
    const w1 = cyclotronFrequency(1, 1, 1);
    const w2 = cyclotronFrequency(1, 2, 1);
    expect(w2 / w1).toBeCloseTo(2, 12);
  });

  it("electron in 1 T → ~1.76e11 rad/s (textbook)", () => {
    const e = 1.602176634e-19;
    const me = 9.1093837015e-31;
    const w = cyclotronFrequency(e, 1, me);
    expect(w).toBeGreaterThan(1.7e11);
    expect(w).toBeLessThan(1.8e11);
  });
});
