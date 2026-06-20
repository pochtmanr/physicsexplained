import { describe, it, expect } from "vitest";
import {
  clausiusIntegral,
  carnotFridgeCop,
  kelvinViolatorImpliesClausius,
  clausiusViolatorImpliesKelvin,
  oceanEngine,
} from "@/lib/physics/thermodynamics/second-law";

describe("clausiusIntegral", () => {
  it("vanishes for a reversible Carnot cycle", () => {
    // Absorb Q at T_h, reject (T_c/T_h)·Q at T_c → ∮ dQ/T = 0.
    const tHot = 600;
    const tCold = 300;
    const q = 1000;
    const sum = clausiusIntegral([
      { dQ: q, T: tHot },
      { dQ: -q * (tCold / tHot), T: tCold },
    ]);
    expect(sum).toBeCloseTo(0, 9);
  });

  it("is strictly negative for an irreversible cycle", () => {
    // Reject more heat at the cold side than reversibility allows.
    const sum = clausiusIntegral([
      { dQ: 1000, T: 600 },
      { dQ: -700, T: 300 },
    ]);
    expect(sum).toBeLessThan(0);
  });

  it("rejects non-positive temperatures", () => {
    expect(() => clausiusIntegral([{ dQ: 1, T: 0 }])).toThrow();
  });
});

describe("carnotFridgeCop", () => {
  it("is T_c/(T_h − T_c)", () => {
    expect(carnotFridgeCop(300, 270)).toBeCloseTo(270 / 30, 9);
  });
});

describe("statement equivalence", () => {
  it("K–P violator drives a fridge to move heat cold → hot (Clausius violation)", () => {
    const r = kelvinViolatorImpliesClausius(1000, 600, 300);
    expect(r.violates).toBe("clausius");
    expect(r.work).toBeCloseTo(1000, 9);
    // Hot gains exactly what cold loses; no work consumed overall.
    expect(r.netColdToHot).toBeGreaterThan(0);
    expect(r.hotDelivered - r.coldExtracted).toBeCloseTo(r.work, 9);
    expect(r.netColdToHot).toBeCloseTo(r.coldExtracted, 9);
  });

  it("Clausius violator drives an engine to make work from one reservoir (K–P violation)", () => {
    const r = clausiusViolatorImpliesKelvin(1000, 600, 300);
    expect(r.violates).toBe("kelvin");
    // Cold reservoir breaks even; net work comes out of the hot reservoir alone.
    expect(r.netColdToHot).toBeCloseTo(0, 9);
    expect(r.netWorkFromHot).toBeGreaterThan(0);
    expect(r.netWorkFromHot).toBeCloseTo(1000 - 1000 * (300 / 600), 9);
  });
});

describe("oceanEngine", () => {
  it("fails with no cold reservoir (perpetual motion of the second kind)", () => {
    const r = oceanEngine(300, 300);
    expect(r.works).toBe(false);
    expect(r.efficiencyBound).toBe(0);
  });

  it("runs once a colder deep layer is tapped, bounded by (T_s − T_d)/T_s", () => {
    const r = oceanEngine(300, 277);
    expect(r.works).toBe(true);
    expect(r.efficiencyBound).toBeCloseTo((300 - 277) / 300, 9);
  });

  it("rejects a deep layer warmer than the surface", () => {
    expect(() => oceanEngine(290, 300)).toThrow();
  });
});
