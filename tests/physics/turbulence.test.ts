import { describe, it, expect } from "vitest";
import {
  KOLMOGOROV_CONSTANT,
  kolmogorovMicroscale,
  kolmogorovSpectrum,
  sampleSpectrum,
  scaleSeparation,
} from "@/lib/physics/turbulence";

describe("kolmogorovSpectrum — E(k) = C_K · ε^(2/3) · k^(-5/3)", () => {
  it("scales as k^(-5/3)", () => {
    const epsilon = 1;
    const E1 = kolmogorovSpectrum(1, epsilon);
    const E8 = kolmogorovSpectrum(8, epsilon);
    // E(8)/E(1) should equal 8^(-5/3) ≈ 0.03125
    expect(E8 / E1).toBeCloseTo(Math.pow(8, -5 / 3), 12);
  });

  it("scales as ε^(2/3)", () => {
    const k = 2;
    const Eref = kolmogorovSpectrum(k, 1);
    const Ehot = kolmogorovSpectrum(k, 8);
    // 8^(2/3) = 4
    expect(Ehot / Eref).toBeCloseTo(4, 10);
  });

  it("uses C_K = 1.5 by default", () => {
    expect(kolmogorovSpectrum(1, 1)).toBeCloseTo(KOLMOGOROV_CONSTANT, 12);
  });

  it("throws on non-positive k", () => {
    expect(() => kolmogorovSpectrum(0, 1)).toThrow();
    expect(() => kolmogorovSpectrum(-1, 1)).toThrow();
  });

  it("throws on negative dissipation", () => {
    expect(() => kolmogorovSpectrum(1, -0.1)).toThrow();
  });
});

describe("kolmogorovMicroscale η = (ν³/ε)^(1/4)", () => {
  it("matches the closed form for air at ε = 1e-3 W/kg", () => {
    const nu = 1.5e-5; // air kinematic viscosity, m²/s
    const epsilon = 1e-3;
    const eta = kolmogorovMicroscale(nu, epsilon);
    const expected = Math.pow((nu * nu * nu) / epsilon, 0.25);
    expect(eta).toBeCloseTo(expected, 12);
    // Air at this dissipation rate: sub-millimetre, as advertised.
    expect(eta).toBeLessThan(1e-3);
  });

  it("shrinks as dissipation grows", () => {
    const nu = 1e-6;
    const etaCalm = kolmogorovMicroscale(nu, 1e-4);
    const etaViolent = kolmogorovMicroscale(nu, 1e-1);
    expect(etaViolent).toBeLessThan(etaCalm);
  });

  it("throws on invalid inputs", () => {
    expect(() => kolmogorovMicroscale(0, 1)).toThrow();
    expect(() => kolmogorovMicroscale(1, 0)).toThrow();
  });
});

describe("scaleSeparation — L/η ∼ Re^(3/4)", () => {
  it("is 1 at Re = 1", () => {
    expect(scaleSeparation(1)).toBeCloseTo(1, 12);
  });

  it("gives ~178 at Re = 1000 (about 2.25 decades of inertial range)", () => {
    expect(scaleSeparation(1000)).toBeCloseTo(Math.pow(1000, 0.75), 10);
  });

  it("throws on non-positive Reynolds number", () => {
    expect(() => scaleSeparation(0)).toThrow();
    expect(() => scaleSeparation(-100)).toThrow();
  });
});

describe("sampleSpectrum — log-log sampling", () => {
  it("produces the requested number of points", () => {
    const pts = sampleSpectrum(1e-2, 1e2, 41);
    expect(pts.length).toBe(41);
  });

  it("is linear in (log k, log E) with slope −5/3", () => {
    const pts = sampleSpectrum(1e-2, 1e2, 21);
    const first = pts[0]!;
    const last = pts[pts.length - 1]!;
    const slope = (last.logE - first.logE) / (last.logK - first.logK);
    expect(slope).toBeCloseTo(-5 / 3, 10);
  });

  it("endpoints bracket the requested range exactly", () => {
    const pts = sampleSpectrum(1e-3, 1e3, 31);
    expect(pts[0]!.k).toBeCloseTo(1e-3, 12);
    expect(pts[pts.length - 1]!.k).toBeCloseTo(1e3, 10);
  });

  it("throws on malformed ranges", () => {
    expect(() => sampleSpectrum(0, 1, 10)).toThrow();
    expect(() => sampleSpectrum(1, 1, 10)).toThrow();
    expect(() => sampleSpectrum(1, 10, 1)).toThrow();
  });
});
