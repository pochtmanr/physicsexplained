import { describe, it, expect } from "vitest";
import {
  C_ICE,
  C_WATER,
  L_FUSION,
  L_VAPORISATION,
  heatingCurve,
  totalHeat,
  temperatureAtHeat,
  energyToMelt,
  energyToVaporise,
  vaporizationPressure,
  sublimationPressure,
  meltingTemperature,
  classifyPhase,
  WATER,
  CO2,
} from "@/lib/physics/thermodynamics/phase-change";

describe("heating curve", () => {
  const segs = heatingCurve(1, -20, 120); // 1 kg

  it("has five regions, two of them latent plateaus", () => {
    expect(segs).toHaveLength(5);
    expect(segs.filter((s) => s.kind === "latent")).toHaveLength(2);
    expect(segs.map((s) => s.kind)).toEqual([
      "sensible",
      "latent",
      "sensible",
      "latent",
      "sensible",
    ]);
  });

  it("segment heats match m c ΔT and m L", () => {
    expect(segs[0].qEnd - segs[0].qStart).toBeCloseTo(C_ICE * 20, 6); // ice -20→0
    expect(segs[1].qEnd - segs[1].qStart).toBeCloseTo(L_FUSION, 6); // melt
    expect(segs[2].qEnd - segs[2].qStart).toBeCloseTo(C_WATER * 100, 6); // 0→100
    expect(segs[3].qEnd - segs[3].qStart).toBeCloseTo(L_VAPORISATION, 6); // boil
  });

  it("plateaus are flat (temperature constant)", () => {
    for (const s of segs.filter((x) => x.kind === "latent")) {
      expect(s.tStart).toBeCloseTo(s.tEnd, 6);
    }
  });

  it("fusion plateau ≈ warming water 0→80 °C (Black's comparison)", () => {
    // 334 kJ/kg ≈ heating 1 kg water by ~80 K (4186·80 ≈ 334.9 kJ)
    expect(L_FUSION).toBeGreaterThan(C_WATER * 70);
    expect(L_FUSION).toBeLessThan(C_WATER * 90);
  });

  it("temperatureAtHeat: monotone non-decreasing with flat plateaus", () => {
    const qMax = totalHeat(segs);
    let prev = -Infinity;
    for (let i = 0; i <= 100; i++) {
      const t = temperatureAtHeat(segs, (qMax * i) / 100);
      expect(t).toBeGreaterThanOrEqual(prev - 1e-6);
      prev = t;
    }
    expect(temperatureAtHeat(segs, 0)).toBeCloseTo(-20, 6);
    expect(temperatureAtHeat(segs, qMax)).toBeCloseTo(120, 6);
  });

  it("at the midpoint of the melting plateau, T is still 0 °C", () => {
    const qMidMelt = (segs[1].qStart + segs[1].qEnd) / 2;
    expect(temperatureAtHeat(segs, qMidMelt)).toBeCloseTo(0, 6);
  });

  it("rejects bad ranges", () => {
    expect(() => heatingCurve(0)).toThrow();
    expect(() => heatingCurve(1, 5, 120)).toThrow(); // start above freezing
    expect(() => heatingCurve(1, -20, 90)).toThrow(); // end below boiling
  });
});

describe("latent bookkeeping", () => {
  it("scales with mass", () => {
    expect(energyToMelt(2)).toBeCloseTo(2 * L_FUSION, 6);
    expect(energyToVaporise(0.5)).toBeCloseTo(0.5 * L_VAPORISATION, 6);
  });
  it("vaporisation costs far more than fusion", () => {
    expect(energyToVaporise(1)).toBeGreaterThan(6 * energyToMelt(1));
  });
});

describe("P–T phase diagram", () => {
  it("vaporisation curve passes through triple and critical points", () => {
    expect(vaporizationPressure(WATER, WATER.triplePoint.tempK)).toBeCloseTo(
      WATER.triplePoint.pressurePa,
      0,
    );
    expect(vaporizationPressure(WATER, WATER.criticalPoint.tempK)).toBeCloseTo(
      WATER.criticalPoint.pressurePa,
      -3, // within ~1 kPa of 22 MPa
    );
  });

  it("vapour pressure rises with temperature", () => {
    const lo = vaporizationPressure(WATER, 300);
    const hi = vaporizationPressure(WATER, 400);
    expect(hi).toBeGreaterThan(lo);
  });

  it("sublimation curve meets the vaporisation curve at the triple point", () => {
    expect(sublimationPressure(WATER, WATER.triplePoint.tempK)).toBeCloseTo(
      WATER.triplePoint.pressurePa,
      0,
    );
  });

  it("water's melting line slopes negative; CO₂'s positive", () => {
    // higher pressure ⟹ lower melting T for water, higher for CO₂
    const Pt = WATER.triplePoint.pressurePa;
    expect(meltingTemperature(WATER, Pt * 1000)).toBeLessThan(
      WATER.triplePoint.tempK,
    );
    const PtC = CO2.triplePoint.pressurePa;
    expect(meltingTemperature(CO2, PtC * 5)).toBeGreaterThan(
      CO2.triplePoint.tempK,
    );
  });

  it("classifies the obvious regions", () => {
    // very low T, modest P → solid
    expect(classifyPhase(WATER, { tempK: 200, pressurePa: 1e5 })).toBe("solid");
    // room T, vacuum → vapor
    expect(classifyPhase(WATER, { tempK: 300, pressurePa: 100 })).toBe("vapor");
    // room T, 1 atm → liquid
    expect(classifyPhase(WATER, { tempK: 298, pressurePa: 101_325 })).toBe(
      "liquid",
    );
    // above critical in both T and P → supercritical
    expect(
      classifyPhase(WATER, { tempK: 700, pressurePa: 25e6 }),
    ).toBe("supercritical");
  });
});
