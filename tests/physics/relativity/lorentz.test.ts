import { describe, expect, it } from "vitest";
import { SPEED_OF_LIGHT } from "@/lib/physics/constants";
import {
  lorentzTransform,
  inverseLorentz,
  interval,
  applyLorentzBoost,
} from "@/lib/physics/relativity/lorentz";
import { gamma } from "@/lib/physics/relativity/types";
import type { Vec4 } from "@/lib/physics/relativity/types";

describe("lorentzTransform", () => {
  it("is the identity at β = 0", () => {
    const { t, x } = lorentzTransform(7, 13, 0);
    expect(t).toBeCloseTo(7, 12);
    expect(x).toBeCloseTo(13, 12);
  });

  it("matches the closed form at β = 0.6 (γ = 1.25) for the lab origin", () => {
    // Event at lab origin (t=0, x=0) maps to (0, 0) in any boosted frame.
    const { t, x } = lorentzTransform(0, 0, 0.6);
    expect(t).toBeCloseTo(0, 12);
    expect(x).toBeCloseTo(0, 12);
  });

  it("transforms a unit-time, zero-x event correctly at β = 0.6", () => {
    // (t = 1, x = 0) → (γ·1, γ·(−β·c·1)) = (1.25, −0.75 c)
    const { t, x } = lorentzTransform(1, 0, 0.6);
    expect(t).toBeCloseTo(1.25, 10);
    expect(x).toBeCloseTo(-0.75 * SPEED_OF_LIGHT, 4);
  });

  it("reduces to Galilean (x' ≈ x − v t, t' ≈ t) for β ≪ 1", () => {
    const beta = 1e-6;
    const v = beta * SPEED_OF_LIGHT;
    const t = 2;
    const x = 5;
    const { t: tPrime, x: xPrime } = lorentzTransform(t, x, beta);
    // Leading order: t' ≈ t − β x / c ≈ t (the βx/c piece is ~1.7e-14 here);
    // x' ≈ x − v t.
    expect(tPrime).toBeCloseTo(t, 8);
    expect(xPrime).toBeCloseTo(x - v * t, 4);
  });
});

describe("inverseLorentz", () => {
  it("round-trips: inverseLorentz ∘ lorentzTransform = identity", () => {
    const beta = 0.7;
    const t0 = 2.3;
    const x0 = 1.1e8; // a respectable fraction of a light-second
    const { t: tP, x: xP } = lorentzTransform(t0, x0, beta);
    const { t: tBack, x: xBack } = inverseLorentz(tP, xP, beta);
    expect(tBack).toBeCloseTo(t0, 8);
    expect(xBack).toBeCloseTo(x0, 0); // x is in m, ~1e8 scale → 1m precision
  });

  it("inverseLorentz is the same as lorentzTransform with β → −β", () => {
    const beta = 0.4;
    const t = 1.5;
    const x = 5e7;
    const a = inverseLorentz(t, x, beta);
    const b = lorentzTransform(t, x, -beta);
    expect(a.t).toBeCloseTo(b.t, 12);
    expect(a.x).toBeCloseTo(b.x, 6);
  });
});

describe("interval", () => {
  it("is preserved under a Lorentz boost (timelike separation)", () => {
    const c = SPEED_OF_LIGHT;
    const t = 2; // s
    const x = 1.5e8; // m  (β_event = 0.25, definitely timelike: ct > x)
    const y = 0;
    const z = 0;
    const sLab = interval(t, x, y, z);
    expect(sLab).toBeGreaterThan(0); // timelike

    // Boost via the 4-vector matrix form and reconstruct s² in the boosted frame.
    const v: Vec4 = [c * t, x, y, z];
    const out = applyLorentzBoost(v, 0.6);
    const sPrime = out[0] ** 2 - out[1] ** 2 - out[2] ** 2 - out[3] ** 2;
    expect(sPrime).toBeCloseTo(sLab, -4); // ~1e8 scale → relative precision
    // Stronger relative test:
    expect(Math.abs((sPrime - sLab) / sLab)).toBeLessThan(1e-12);
  });

  it("is zero for a null (light-cone) separation", () => {
    const c = SPEED_OF_LIGHT;
    const x = 3e8;
    const t = x / c; // exactly on the light cone
    expect(interval(t, x, 0, 0)).toBeCloseTo(0, 4);
  });

  it("is negative for a spacelike separation", () => {
    const c = SPEED_OF_LIGHT;
    const t = 0.5; // s
    const x = 3 * c; // light could only have travelled 0.5 c in 0.5 s, but x = 3 c → spacelike
    expect(interval(t, x, 0, 0)).toBeLessThan(0);
  });

  it("is preserved under boost for a spacelike separation", () => {
    const c = SPEED_OF_LIGHT;
    const t = 0.2;
    const x = 2 * c;
    const sLab = interval(t, x, 0, 0);
    const out = applyLorentzBoost([c * t, x, 0, 0], 0.5);
    const sPrime = out[0] ** 2 - out[1] ** 2 - out[2] ** 2 - out[3] ** 2;
    expect(Math.abs((sPrime - sLab) / sLab)).toBeLessThan(1e-12);
  });
});

describe("applyLorentzBoost", () => {
  it("agrees with the per-component lorentzTransform on (t, x)", () => {
    const c = SPEED_OF_LIGHT;
    const beta = 0.5;
    const t = 1;
    const x = 1e7;
    const { t: tP, x: xP } = lorentzTransform(t, x, beta);
    const out = applyLorentzBoost([c * t, x, 0, 0], beta);
    expect(out[0] / c).toBeCloseTo(tP, 8);
    expect(out[1]).toBeCloseTo(xP, -2);
  });

  it("leaves y and z untouched", () => {
    const out = applyLorentzBoost([1, 0, 7, 11], 0.8);
    expect(out[2]).toBeCloseTo(7, 12);
    expect(out[3]).toBeCloseTo(11, 12);
  });

  it("composes boostX(β1) ∘ boostX(β2) = boostX(β-add) (rapidity additivity)", () => {
    // Rapidity ϕ satisfies tanh(ϕ) = β; rapidities add under boost composition.
    const beta1 = 0.3;
    const beta2 = 0.4;
    const phi1 = Math.atanh(beta1);
    const phi2 = Math.atanh(beta2);
    const betaSum = Math.tanh(phi1 + phi2);
    const v: Vec4 = [1, 2, 0, 0];
    const stepwise = applyLorentzBoost(applyLorentzBoost(v, beta2), beta1);
    const direct = applyLorentzBoost(v, betaSum);
    expect(stepwise[0]).toBeCloseTo(direct[0], 10);
    expect(stepwise[1]).toBeCloseTo(direct[1], 10);
  });

  it("γ at β = 0.99499 ≈ 10 (sanity-check the underlying gamma)", () => {
    expect(gamma(0.99499)).toBeCloseTo(10.00255102582804, 4);
  });
});
