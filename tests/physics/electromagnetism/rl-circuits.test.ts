import { describe, expect, it } from "vitest";
import {
  rlTimeConstant,
  rlCurrent,
  rlDecay,
  backEMF,
  inductorEnergy,
} from "@/lib/physics/electromagnetism/rl-circuits";

describe("rlTimeConstant", () => {
  it("is L/R for canonical inputs", () => {
    expect(rlTimeConstant(2, 4)).toBeCloseTo(0.5, 12);
  });

  it("throws for non-positive resistance", () => {
    expect(() => rlTimeConstant(1, 0)).toThrow();
    expect(() => rlTimeConstant(1, -1)).toThrow();
  });
});

describe("rlCurrent", () => {
  it("is zero at t = 0 (initial condition I(0) = 0)", () => {
    expect(rlCurrent(12, 4, 2, 0)).toBe(0);
  });

  it("reaches 63.2 % of V/R at one time constant", () => {
    // τ = L/R = 2/4 = 0.5 s → at t = τ the current is (V/R)(1 − 1/e).
    const V0 = 12;
    const R = 4;
    const L = 2;
    const tau = rlTimeConstant(L, R);
    const I = rlCurrent(V0, R, L, tau);
    const Iasymp = V0 / R;
    expect(I / Iasymp).toBeCloseTo(1 - 1 / Math.E, 10);
    expect(I / Iasymp).toBeCloseTo(0.6321205588, 6);
  });

  it("approaches V/R for t ≫ τ", () => {
    const V0 = 10;
    const R = 5;
    const L = 1e-3;
    // 100 τ out — effectively at the asymptote.
    const t = 100 * rlTimeConstant(L, R);
    expect(rlCurrent(V0, R, L, t)).toBeCloseTo(V0 / R, 10);
  });
});

describe("rlDecay", () => {
  it("starts at I0 at t = 0", () => {
    expect(rlDecay(3, 4, 2, 0)).toBe(3);
  });

  it("decays to I0/e at one time constant", () => {
    const I0 = 2;
    const R = 4;
    const L = 2;
    const tau = rlTimeConstant(L, R);
    expect(rlDecay(I0, R, L, tau)).toBeCloseTo(I0 / Math.E, 10);
  });

  it("is symmetric with rlCurrent under t → ∞ (both converge on their asymptotes)", () => {
    // rise + decay to a common asymptote: V/R = I0 in this contrivance.
    const V0 = 8;
    const R = 2;
    const L = 0.5;
    const Iasymp = V0 / R; // 4 A
    const t = 50 * rlTimeConstant(L, R);
    expect(rlCurrent(V0, R, L, t)).toBeCloseTo(Iasymp, 10);
    expect(rlDecay(Iasymp, R, L, t)).toBeCloseTo(0, 10);
  });
});

describe("backEMF", () => {
  it("equals V0 at t = 0 (all source voltage sits across the inductor)", () => {
    expect(backEMF(12, 4, 2, 0)).toBeCloseTo(12, 12);
  });

  it("decays to zero at steady state (inductor looks like a wire)", () => {
    const V0 = 12;
    const R = 4;
    const L = 2;
    const t = 100 * rlTimeConstant(L, R);
    expect(backEMF(V0, R, L, t)).toBeCloseTo(0, 10);
  });

  it("satisfies Kirchhoff: V0 = I·R + V_L at every t", () => {
    const V0 = 9;
    const R = 3;
    const L = 0.6;
    for (const t of [0, 0.05, 0.2, 0.8, 2.5]) {
      const I = rlCurrent(V0, R, L, t);
      const VL = backEMF(V0, R, L, t);
      expect(I * R + VL).toBeCloseTo(V0, 10);
    }
  });
});

describe("inductorEnergy", () => {
  it("is zero at zero current", () => {
    expect(inductorEnergy(1, 0)).toBe(0);
  });

  it("equals ½ L I² at steady state", () => {
    // V/R steady current: 12 / 4 = 3 A, L = 2 H → U = ½·2·9 = 9 J.
    const V0 = 12;
    const R = 4;
    const L = 2;
    const Isteady = V0 / R;
    expect(inductorEnergy(L, Isteady)).toBeCloseTo(9, 12);
  });

  it("quadruples when current doubles (U ∝ I²)", () => {
    const L = 0.01;
    const u1 = inductorEnergy(L, 1);
    const u2 = inductorEnergy(L, 2);
    expect(u2 / u1).toBeCloseTo(4, 12);
  });
});
