import { describe, expect, it } from "vitest";
import {
  aFromInfiniteWire,
  aFromSolenoid,
  gaugeShift,
} from "@/lib/physics/electromagnetism/vector-potential";
import { MU_0 } from "@/lib/physics/constants";

describe("aFromInfiniteWire", () => {
  it("vanishes at the reference distance", () => {
    expect(aFromInfiniteWire(1, 1, 1)).toBeCloseTo(0, 18);
    expect(aFromInfiniteWire(10, 0.5, 0.5)).toBeCloseTo(0, 18);
  });

  it("equals −(μ₀ I)/(2π) · ln(d/dRef)", () => {
    const I = 5;
    const d = 0.2;
    const dRef = 1;
    const expected = -((MU_0 * I) / (2 * Math.PI)) * Math.log(d / dRef);
    expect(aFromInfiniteWire(I, d, dRef)).toBeCloseTo(expected, 18);
  });

  it("recovers B_φ = μ₀I/(2πd) via numerical curl (∂A_z/∂d, in cylindrical)", () => {
    // For an infinite wire along ẑ, A = A_z ẑ depends only on cylindrical
    // distance d. The relevant curl component is B_φ = −∂A_z/∂d.
    const I = 7;
    const d = 0.3;
    const dRef = 1;
    const h = 1e-6;
    const Aplus = aFromInfiniteWire(I, d + h, dRef);
    const Aminus = aFromInfiniteWire(I, d - h, dRef);
    const dAdd = (Aplus - Aminus) / (2 * h);
    const Bphi = -dAdd;
    const expectedB = (MU_0 * I) / (2 * Math.PI * d);
    expect(Bphi).toBeCloseTo(expectedB, 12);
  });

  it("flips sign when current reverses", () => {
    const a = aFromInfiniteWire(3, 0.4, 1);
    const b = aFromInfiniteWire(-3, 0.4, 1);
    expect(b).toBeCloseTo(-a, 18);
  });
});

describe("aFromSolenoid", () => {
  it("gives A_φ = B·r/2 strictly inside (r < R)", () => {
    const B = 0.05;
    const R = 0.2;
    const r = 0.1;
    expect(aFromSolenoid(B, R, r)).toBeCloseTo((B * r) / 2, 18);
  });

  it("gives A_φ = B·R²/(2r) strictly outside (r > R), where B itself is zero", () => {
    const B = 0.05;
    const R = 0.2;
    const r = 0.5;
    expect(aFromSolenoid(B, R, r)).toBeCloseTo((B * R * R) / (2 * r), 18);
    // r > R: A_φ ≠ 0 even though the actual B field is zero out here.
    expect(aFromSolenoid(B, R, r)).toBeGreaterThan(0);
  });

  it("matches at the boundary r = R from both formulas (= B·R/2)", () => {
    const B = 0.05;
    const R = 0.2;
    // At r = R both formulas give B·R/2.
    const insideLimit = (B * R) / 2;
    const outsideLimit = (B * R * R) / (2 * R);
    expect(insideLimit).toBeCloseTo(outsideLimit, 18);
    // Function should return the outside-formula value at exactly r = R.
    expect(aFromSolenoid(B, R, R)).toBeCloseTo(insideLimit, 18);
  });

  it("recovers uniform B inside via numerical curl: B = (1/r) d(r·A_φ)/dr = B_inside", () => {
    // B_z = (1/r) · d(r A_φ)/dr in cylindrical coords.
    const B_in = 0.05;
    const R = 0.2;
    const r = 0.1;
    const h = 1e-6;
    const rA_plus = (r + h) * aFromSolenoid(B_in, R, r + h);
    const rA_minus = (r - h) * aFromSolenoid(B_in, R, r - h);
    const drA = (rA_plus - rA_minus) / (2 * h);
    const Bz = drA / r;
    expect(Bz).toBeCloseTo(B_in, 8);
  });

  it("recovers B = 0 outside via numerical curl", () => {
    const B_in = 0.05;
    const R = 0.2;
    const r = 0.5;
    const h = 1e-6;
    const rA_plus = (r + h) * aFromSolenoid(B_in, R, r + h);
    const rA_minus = (r - h) * aFromSolenoid(B_in, R, r - h);
    const drA = (rA_plus - rA_minus) / (2 * h);
    const Bz = drA / r;
    expect(Math.abs(Bz)).toBeLessThan(1e-10);
  });

  it("flux through any external loop equals total flux through the solenoid", () => {
    // ∮ A · dℓ around radius r = 2π r · A_φ should equal Φ = B · π R².
    const B_in = 0.05;
    const R = 0.2;
    for (const r of [0.25, 0.5, 1.0, 2.0]) {
      const circulation = 2 * Math.PI * r * aFromSolenoid(B_in, R, r);
      const flux = B_in * Math.PI * R * R;
      expect(circulation).toBeCloseTo(flux, 12);
    }
  });
});

describe("gaugeShift", () => {
  it("adds ∇f componentwise", () => {
    const A = { x: 1, y: 2, z: 3 };
    const gradF = { x: 0.1, y: -0.5, z: 4 };
    expect(gaugeShift(A, gradF)).toEqual({ x: 1.1, y: 1.5, z: 7 });
  });

  it("the zero shift is the identity", () => {
    const A = { x: 0.7, y: -1.2, z: 5 };
    expect(gaugeShift(A, { x: 0, y: 0, z: 0 })).toEqual(A);
  });

  it("leaves B = ∇×A invariant for f(x,y,z) = a·x + b·y + c·z (a uniform shift)", () => {
    // For f linear in coordinates, ∇f is a constant vector. Adding any
    // constant vector to A cannot change ∇×A (its derivatives all vanish).
    // We don't need to compute ∇×A explicitly — we verify the algebraic
    // requirement: A' − A = ∇f everywhere, so the curl of (A' − A) is zero.
    const A = { x: 2, y: -1, z: 0.5 };
    const gradF = { x: 0.3, y: 0.7, z: -0.2 };
    const Aprime = gaugeShift(A, gradF);
    expect(Aprime.x - A.x).toBeCloseTo(gradF.x, 15);
    expect(Aprime.y - A.y).toBeCloseTo(gradF.y, 15);
    expect(Aprime.z - A.z).toBeCloseTo(gradF.z, 15);
  });

  it("composes: shifting twice is shifting once by the sum", () => {
    const A = { x: 1, y: 1, z: 1 };
    const g1 = { x: 0.5, y: 0, z: 2 };
    const g2 = { x: -0.2, y: 3, z: 1 };
    const twice = gaugeShift(gaugeShift(A, g1), g2);
    const once = gaugeShift(A, {
      x: g1.x + g2.x,
      y: g1.y + g2.y,
      z: g1.z + g2.z,
    });
    expect(twice).toEqual(once);
  });
});
