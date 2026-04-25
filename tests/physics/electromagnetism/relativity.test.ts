import { describe, expect, it } from "vitest";
import {
  gamma,
  lorentzBoostMatrix,
  buildFieldTensor,
  transformFields,
  dualTensor,
  MINKOWSKI,
} from "@/lib/physics/electromagnetism/relativity";

describe("gamma", () => {
  it("equals 1 at β=0", () => {
    expect(gamma(0)).toBe(1);
  });
  it("equals 1.25 at β=0.6", () => {
    expect(gamma(0.6)).toBeCloseTo(1.25, 10);
  });
  it("≈ 7.0888 at β=0.99", () => {
    expect(gamma(0.99)).toBeCloseTo(7.0888, 3);
  });
});

describe("lorentzBoostMatrix", () => {
  it("is identity at β=0", () => {
    const M = lorentzBoostMatrix(0);
    expect(M[0][0]).toBe(1);
    expect(M[1][1]).toBe(1);
    expect(M[0][1]).toBeCloseTo(0, 12);
    expect(M[1][0]).toBeCloseTo(0, 12);
    expect(M[2][2]).toBe(1);
    expect(M[3][3]).toBe(1);
  });
  it("Λ(β)·Λ(−β) = I in the (t,x) block", () => {
    const Mp = lorentzBoostMatrix(0.6);
    const Mn = lorentzBoostMatrix(-0.6);
    const tt = Mp[0][0] * Mn[0][0] + Mp[0][1] * Mn[1][0];
    const tx = Mp[0][0] * Mn[0][1] + Mp[0][1] * Mn[1][1];
    const xt = Mp[1][0] * Mn[0][0] + Mp[1][1] * Mn[1][0];
    const xx = Mp[1][0] * Mn[0][1] + Mp[1][1] * Mn[1][1];
    expect(tt).toBeCloseTo(1, 10);
    expect(tx).toBeCloseTo(0, 10);
    expect(xt).toBeCloseTo(0, 10);
    expect(xx).toBeCloseTo(1, 10);
  });
});

describe("buildFieldTensor", () => {
  it("is antisymmetric: F[i][j] = -F[j][i]", () => {
    const E = { x: 1e3, y: 2e3, z: -5e2 };
    const B = { x: 1e-4, y: -2e-4, z: 3e-4 };
    const F = buildFieldTensor(E, B);
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        expect(F[i][j]).toBeCloseTo(-F[j][i], 12);
      }
    }
  });
  it("diagonal is exactly zero", () => {
    const F = buildFieldTensor({ x: 1, y: 2, z: 3 }, { x: 4, y: 5, z: 6 });
    expect(F[0][0]).toBe(0);
    expect(F[1][1]).toBe(0);
    expect(F[2][2]).toBe(0);
    expect(F[3][3]).toBe(0);
  });
});

describe("transformFields", () => {
  it("identity at β=0", () => {
    const E = { x: 1, y: 2, z: 3 };
    const B = { x: 4, y: 5, z: 6 };
    const result = transformFields(E, B, 0);
    expect(result.E).toEqual(E);
    expect(result.B).toEqual(B);
  });
  it("pure-E lab frame produces a B' under boost (Purcell §5.9 form)", () => {
    // Pure E in y, no B, boost along x. Should produce B'_z = -γβE_y/c.
    const E = { x: 0, y: 1e3, z: 0 };
    const B = { x: 0, y: 0, z: 0 };
    const beta = 0.5;
    const result = transformFields(E, B, beta);
    // E'_y = γE_y → amplified by γ > 1
    expect(result.E.y).toBeGreaterThan(E.y);
    // B'_z = -γβE_y/c² · c = -γβE_y/c — sign is negative for +β, +E_y
    expect(result.B.z).toBeLessThan(0);
  });
});

describe("MINKOWSKI", () => {
  it("has signature (+,−,−,−)", () => {
    expect(MINKOWSKI[0][0]).toBe(1);
    expect(MINKOWSKI[1][1]).toBe(-1);
    expect(MINKOWSKI[2][2]).toBe(-1);
    expect(MINKOWSKI[3][3]).toBe(-1);
  });
  it("is diagonal", () => {
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (i !== j) expect(MINKOWSKI[i][j]).toBe(0);
      }
    }
  });
});

describe("dualTensor", () => {
  it("dual is antisymmetric", () => {
    const F = buildFieldTensor(
      { x: 1, y: 2, z: 3 },
      { x: 0.001, y: 0.002, z: 0.003 },
    );
    const D = dualTensor(F);
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        expect(D[i][j]).toBeCloseTo(-D[j][i], 12);
      }
    }
  });
});
