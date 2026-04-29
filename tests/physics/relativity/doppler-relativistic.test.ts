import { describe, expect, it } from "vitest";
import {
  longitudinalDoppler,
  transverseDoppler,
} from "@/lib/physics/relativity/doppler-relativistic";
import { gamma } from "@/lib/physics/relativity/types";

describe("longitudinalDoppler", () => {
  it("is the identity at β = 0", () => {
    expect(longitudinalDoppler(1.0, 0)).toBeCloseTo(1.0, 12);
    expect(longitudinalDoppler(5.0e14, 0)).toBeCloseTo(5.0e14, 4);
  });

  it("redshifts a receding source (β > 0): f_obs < f_emit", () => {
    const fEmit = 1.0;
    const f = longitudinalDoppler(fEmit, 0.5);
    // sqrt(0.5 / 1.5) ≈ 0.5774
    expect(f).toBeLessThan(fEmit);
    expect(f).toBeCloseTo(Math.sqrt(0.5 / 1.5), 12);
  });

  it("blueshifts an approaching source (β < 0): f_obs > f_emit", () => {
    const fEmit = 1.0;
    const f = longitudinalDoppler(fEmit, -0.5);
    // sqrt(1.5 / 0.5) ≈ 1.7321
    expect(f).toBeGreaterThan(fEmit);
    expect(f).toBeCloseTo(Math.sqrt(1.5 / 0.5), 12);
  });

  it("collapses to classical f·(1 − β) at low β", () => {
    // At β = 1e-4 the relativistic and classical predictions agree to 8 figures.
    const beta = 1e-4;
    const relat = longitudinalDoppler(1.0, beta);
    const classical = 1.0 * (1 - beta);
    expect(relat).toBeCloseTo(classical, 7);
  });

  it("approaches zero as β → 1 (extreme recession)", () => {
    const f = longitudinalDoppler(1.0, 0.999);
    expect(f).toBeLessThan(0.05);
    expect(f).toBeGreaterThan(0);
  });

  it("approach/recede are reciprocals: f(β) · f(−β) = f_emit²", () => {
    const fEmit = 3.0;
    const recede = longitudinalDoppler(fEmit, 0.4);
    const approach = longitudinalDoppler(fEmit, -0.4);
    expect(recede * approach).toBeCloseTo(fEmit * fEmit, 12);
  });
});

describe("transverseDoppler", () => {
  it("is the identity at β = 0", () => {
    expect(transverseDoppler(1.0, 0)).toBeCloseTo(1.0, 12);
  });

  it("always redshifts: f_obs < f_emit for any β ≠ 0", () => {
    expect(transverseDoppler(1.0, 0.3)).toBeLessThan(1.0);
    expect(transverseDoppler(1.0, -0.3)).toBeLessThan(1.0);
    expect(transverseDoppler(1.0, 0.8)).toBeLessThan(1.0);
  });

  it("is even in β: f(β) = f(−β) (depends only on |β| via γ)", () => {
    const fEmit = 7.0;
    expect(transverseDoppler(fEmit, 0.6)).toBeCloseTo(
      transverseDoppler(fEmit, -0.6),
      12,
    );
  });

  it("equals f_emit / γ exactly", () => {
    const fEmit = 1.0;
    const beta = 0.5;
    expect(transverseDoppler(fEmit, beta)).toBeCloseTo(
      fEmit / gamma(beta),
      12,
    );
  });

  it("has no classical analogue: at |β| ≪ 1 it shifts as 1 − β²/2 (second order)", () => {
    // Classical Doppler is first-order in β (zero at perpendicular motion).
    // The transverse-Doppler shift is second-order: f/f_emit = 1 / γ ≈ 1 − β²/2.
    const beta = 1e-3;
    const f = transverseDoppler(1.0, beta);
    expect(1 - f).toBeCloseTo(0.5 * beta * beta, 9);
  });
});
