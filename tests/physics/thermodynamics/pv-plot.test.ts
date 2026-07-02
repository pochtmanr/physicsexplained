import { describe, it, expect } from "vitest";
import {
  R_GAS,
  idealPressure,
  idealTemperature,
  isobaricCurve,
  isochoricCurve,
  isothermalCurve,
  adiabaticCurve,
  processCurve,
  workUnderCurve,
  cycleNetWork,
  createPvMapping,
  axisTicks,
  type PvPoint,
} from "@/lib/physics/thermodynamics/pv-plot";

describe("ideal-gas state relations", () => {
  it("P = nRT/V and T = PV/(nR) invert each other", () => {
    const P = idealPressure(2, 300, 0.05);
    expect(P).toBeCloseTo((2 * R_GAS * 300) / 0.05, 6);
    expect(idealTemperature(2, P, 0.05)).toBeCloseTo(300, 6);
  });
  it("rejects non-physical inputs", () => {
    expect(() => idealPressure(1, 300, 0)).toThrow();
    expect(() => idealTemperature(0, 1, 1)).toThrow();
  });
});

describe("curve generators", () => {
  const start: PvPoint = { V: 0.01, P: 200_000 };

  it("isobar holds pressure and spans the volume range", () => {
    const c = isobaricCurve(start, 0.03, 10);
    expect(c).toHaveLength(11);
    expect(c.every((p) => p.P === start.P)).toBe(true);
    expect(c[0].V).toBeCloseTo(0.01, 9);
    expect(c[c.length - 1].V).toBeCloseTo(0.03, 9);
  });

  it("isochore holds volume and spans the pressure range", () => {
    const c = isochoricCurve(start, 50_000, 10);
    expect(c.every((p) => p.V === start.V)).toBe(true);
    expect(c[c.length - 1].P).toBeCloseTo(50_000, 6);
  });

  it("isotherm keeps PV constant", () => {
    const c = isothermalCurve(start, 0.04, 20);
    const pv0 = start.P * start.V;
    for (const p of c) expect(p.P * p.V).toBeCloseTo(pv0, 4);
  });

  it("adiabat keeps PV^gamma constant and is steeper than the isotherm", () => {
    const gamma = 5 / 3;
    const adia = adiabaticCurve(start, 0.04, gamma, 20);
    const k = start.P * Math.pow(start.V, gamma);
    for (const p of adia) expect(p.P * Math.pow(p.V, gamma)).toBeCloseTo(k, 0);
    // expanding to the same larger volume, the adiabat drops below the isotherm
    const iso = isothermalCurve(start, 0.04, 20);
    expect(adia[adia.length - 1].P).toBeLessThan(iso[iso.length - 1].P);
  });

  it("processCurve dispatches and requires gamma for adiabats", () => {
    expect(processCurve("isobaric", start, 0.02).every((p) => p.P === start.P)).toBe(true);
    expect(() => processCurve("adiabatic", start, 0.02)).toThrow();
  });
});

describe("work integrals", () => {
  it("isobaric work is P·ΔV exactly (trapezoid is exact on a flat line)", () => {
    const start: PvPoint = { V: 0.01, P: 200_000 };
    const c = isobaricCurve(start, 0.03, 4);
    expect(workUnderCurve(c)).toBeCloseTo(200_000 * (0.03 - 0.01), 6);
  });

  it("isothermal work approaches nRT ln(V2/V1)", () => {
    const n = 1, T = 300;
    const V1 = 0.01, V2 = 0.02;
    const P1 = idealPressure(n, T, V1);
    const c = isothermalCurve({ V: V1, P: P1 }, V2, 2000);
    const analytic = n * R_GAS * T * Math.log(V2 / V1);
    expect(workUnderCurve(c)).toBeCloseTo(analytic, 1);
  });

  it("compression returns negative work", () => {
    const start: PvPoint = { V: 0.03, P: 100_000 };
    expect(workUnderCurve(isobaricCurve(start, 0.01, 4))).toBeLessThan(0);
  });

  it("path dependence: two paths between the same endpoints do different work", () => {
    const a: PvPoint = { V: 0.01, P: 200_000 };
    const b: PvPoint = { V: 0.03, P: 100_000 };
    // path 1: expand at high P, then drop P at large V
    const path1 = [...isobaricCurve(a, b.V, 8), ...isochoricCurve({ V: b.V, P: a.P }, b.P, 8)];
    // path 2: drop P first, then expand at low P
    const path2 = [...isochoricCurve(a, b.P, 8), ...isobaricCurve({ V: a.V, P: b.P }, b.V, 8)];
    expect(workUnderCurve(path1)).toBeGreaterThan(workUnderCurve(path2));
  });
});

describe("cycle net work", () => {
  // a rectangular loop on the PV plane, traversed clockwise (engine):
  // (V1,P2) → (V2,P2) → (V2,P1) → (V1,P1) → back. Enclosed area = ΔP·ΔV.
  const V1 = 0.01, V2 = 0.03, P1 = 100_000, P2 = 200_000;
  const clockwise: PvPoint[] = [
    { V: V1, P: P2 },
    { V: V2, P: P2 },
    { V: V2, P: P1 },
    { V: V1, P: P1 },
  ];

  it("clockwise loop yields positive net work equal to the enclosed area", () => {
    expect(cycleNetWork(clockwise)).toBeCloseTo((P2 - P1) * (V2 - V1), 6);
  });

  it("reversing the loop flips the sign (refrigerator)", () => {
    const ccw = [...clockwise].reverse();
    expect(cycleNetWork(ccw)).toBeCloseTo(-(P2 - P1) * (V2 - V1), 6);
  });
});

describe("pixel mapping", () => {
  const mapping = createPvMapping(
    { vMin: 0, vMax: 10, pMin: 0, pMax: 100 },
    { left: 40, top: 20, width: 200, height: 100 },
  );

  it("maps domain corners to the rect corners with P inverted", () => {
    expect(mapping.toPx({ V: 0, P: 0 })).toEqual({ x: 40, y: 120 });
    expect(mapping.toPx({ V: 10, P: 100 })).toEqual({ x: 240, y: 20 });
  });

  it("toData inverts toPx", () => {
    const px = mapping.toPx({ V: 3, P: 70 });
    const back = mapping.toData(px.x, px.y);
    expect(back.V).toBeCloseTo(3, 9);
    expect(back.P).toBeCloseTo(70, 9);
  });

  it("axisTicks spans the range inclusively", () => {
    expect(axisTicks(0, 10, 5)).toEqual([0, 2, 4, 6, 8, 10]);
  });
});
