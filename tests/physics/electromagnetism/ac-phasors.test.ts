import { describe, expect, it } from "vitest";
import {
  cadd,
  cmul,
  cdiv,
  cabs,
  cphase,
  zResistor,
  zCapacitor,
  zInductor,
  zSeries,
  powerFactor,
  averagePower,
  resonantOmega,
} from "@/lib/physics/electromagnetism/ac-phasors";

describe("complex arithmetic (topic-local Complex)", () => {
  it("cadd and cmul satisfy (1+j)(1−j) = 2", () => {
    const a = { re: 1, im: 1 };
    const b = { re: 1, im: -1 };
    const product = cmul(a, b);
    expect(product.re).toBeCloseTo(2, 12);
    expect(product.im).toBeCloseTo(0, 12);
    const sum = cadd(a, b);
    expect(sum.re).toBeCloseTo(2, 12);
    expect(sum.im).toBeCloseTo(0, 12);
  });

  it("cdiv reverses cmul: (a·b)/b = a", () => {
    const a = { re: 3, im: -4 };
    const b = { re: 2, im: 5 };
    const round = cdiv(cmul(a, b), b);
    expect(round.re).toBeCloseTo(a.re, 10);
    expect(round.im).toBeCloseTo(a.im, 10);
  });

  it("cdiv throws on division by zero", () => {
    expect(() => cdiv({ re: 1, im: 1 }, { re: 0, im: 0 })).toThrow();
  });

  it("cabs and cphase recover polar form of 1 + j", () => {
    const z = { re: 1, im: 1 };
    expect(cabs(z)).toBeCloseTo(Math.SQRT2, 12);
    expect(cphase(z)).toBeCloseTo(Math.PI / 4, 12);
  });
});

describe("reactive impedances", () => {
  it("zCapacitor has phase −π/2 (current leads voltage, ICE)", () => {
    const Z = zCapacitor(2 * Math.PI * 50, 1e-6); // 50 Hz, 1 µF
    expect(Z.re).toBeCloseTo(0, 12);
    expect(Z.im).toBeLessThan(0);
    expect(cphase(Z)).toBeCloseTo(-Math.PI / 2, 12);
  });

  it("zInductor has phase +π/2 (voltage leads current, ELI)", () => {
    const Z = zInductor(2 * Math.PI * 50, 1e-3); // 50 Hz, 1 mH
    expect(Z.re).toBeCloseTo(0, 12);
    expect(Z.im).toBeGreaterThan(0);
    expect(cphase(Z)).toBeCloseTo(Math.PI / 2, 12);
  });

  it("zResistor is real with phase zero", () => {
    const Z = zResistor(47);
    expect(Z.re).toBe(47);
    expect(Z.im).toBe(0);
    expect(cphase(Z)).toBe(0);
  });

  it("throws for non-positive ω, L, C", () => {
    expect(() => zCapacitor(0, 1e-6)).toThrow();
    expect(() => zCapacitor(2 * Math.PI, 0)).toThrow();
    expect(() => zInductor(0, 1e-3)).toThrow();
    expect(() => zInductor(2 * Math.PI, 0)).toThrow();
  });
});

describe("series RLC at resonance", () => {
  it("cancels reactive parts when ω = 1/√(LC)", () => {
    const L = 10e-3; // 10 mH
    const C = 10e-6; // 10 µF
    const omega0 = resonantOmega(L, C);
    expect(omega0).toBeCloseTo(1 / Math.sqrt(L * C), 12);

    const R = 2;
    const Z = zSeries([
      zResistor(R),
      zInductor(omega0, L),
      zCapacitor(omega0, C),
    ]);
    // Imaginary parts cancel exactly; real part is the resistor alone.
    expect(Z.im).toBeCloseTo(0, 10);
    expect(Z.re).toBeCloseTo(R, 10);
  });

  it("off resonance the reactance is nonzero", () => {
    const L = 10e-3;
    const C = 10e-6;
    const omega = 2 * resonantOmega(L, C); // well above ω₀
    const Z = zSeries([
      zResistor(2),
      zInductor(omega, L),
      zCapacitor(omega, C),
    ]);
    expect(Math.abs(Z.im)).toBeGreaterThan(0.01);
  });
});

describe("power factor", () => {
  it("pure resistor → cos(φ) = 1", () => {
    expect(powerFactor(zResistor(100))).toBeCloseTo(1, 12);
  });

  it("pure inductor → cos(φ) = 0", () => {
    expect(powerFactor(zInductor(2 * Math.PI * 50, 0.1))).toBeCloseTo(0, 12);
  });

  it("pure capacitor → cos(φ) = 0", () => {
    expect(powerFactor(zCapacitor(2 * Math.PI * 50, 1e-5))).toBeCloseTo(0, 12);
  });

  it("mixed R + L at equal magnitudes → cos(φ) = 1/√2", () => {
    const R = 10;
    const XL = 10;
    const Z = { re: R, im: XL };
    expect(powerFactor(Z)).toBeCloseTo(1 / Math.SQRT2, 12);
  });
});

describe("averagePower", () => {
  it("P = V·I when φ = 0 (resistive load)", () => {
    expect(averagePower(230, 10, 0)).toBeCloseTo(2300, 10);
  });

  it("P = 0 when φ = ±π/2 (pure reactive load)", () => {
    expect(averagePower(230, 10, Math.PI / 2)).toBeCloseTo(0, 10);
    expect(averagePower(230, 10, -Math.PI / 2)).toBeCloseTo(0, 10);
  });

  it("drops to V·I/√2 at φ = π/4 (45° lag)", () => {
    expect(averagePower(100, 1, Math.PI / 4)).toBeCloseTo(100 / Math.SQRT2, 10);
  });
});

describe("resonantOmega", () => {
  it("matches 1/√(LC) for reasonable LC values", () => {
    const L = 1e-3;
    const C = 1e-6;
    expect(resonantOmega(L, C)).toBeCloseTo(1 / Math.sqrt(L * C), 10);
  });

  it("throws for non-positive L or C", () => {
    expect(() => resonantOmega(0, 1e-6)).toThrow();
    expect(() => resonantOmega(1e-3, 0)).toThrow();
  });
});
