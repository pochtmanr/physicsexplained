import { describe, it, expect } from "vitest";
import {
  R_GAS,
  carnotEfficiency,
  carnotCycleStates,
  carnotHeats,
  carnotPVPath,
  carnotTSRectangle,
  tsRectangleArea,
  ENGINE_COMPARISONS,
  carnotLimitOf,
  type CarnotParams,
} from "@/lib/physics/thermodynamics/carnot";

const PARAMS: CarnotParams = {
  nMoles: 1,
  gamma: 5 / 3,
  tHot: 600,
  tCold: 300,
  vStart: 0.01,
  expansionRatio: 2,
};

describe("carnotEfficiency", () => {
  it("is 1 − T_c/T_h", () => {
    expect(carnotEfficiency(600, 300)).toBeCloseTo(0.5, 12);
    expect(carnotEfficiency(800, 200)).toBeCloseTo(0.75, 12);
  });

  it("rejects unphysical temperatures", () => {
    expect(() => carnotEfficiency(300, 300)).toThrow();
    expect(() => carnotEfficiency(300, 600)).toThrow();
    expect(() => carnotEfficiency(0, -1)).toThrow();
  });
});

describe("carnotCycleStates", () => {
  it("places the corners on the right isotherms and closes the cycle", () => {
    const [s1, s2, s3, s4] = carnotCycleStates(PARAMS);
    expect(s1.t).toBe(600);
    expect(s2.t).toBe(600);
    expect(s3.t).toBe(300);
    expect(s4.t).toBe(300);
    // The two adiabats force equal isothermal volume ratios → cycle closes.
    expect(s2.v / s1.v).toBeCloseTo(s3.v / s4.v, 10);
    // Every corner satisfies PV = nRT.
    for (const s of [s1, s2, s3, s4]) {
      expect(s.p * s.v).toBeCloseTo(PARAMS.nMoles * R_GAS * s.t, 6);
    }
  });

  it("honours the adiabatic relation TV^(γ−1) = const on the expansion leg", () => {
    const [, s2, s3] = carnotCycleStates(PARAMS);
    const lhs = s2.t * Math.pow(s2.v, PARAMS.gamma - 1);
    const rhs = s3.t * Math.pow(s3.v, PARAMS.gamma - 1);
    expect(lhs).toBeCloseTo(rhs, 6);
  });
});

describe("carnotHeats", () => {
  it("makes W/Q_h equal 1 − T_c/T_h", () => {
    const { qHot, qCold, work, efficiency } = carnotHeats(PARAMS);
    expect(qHot).toBeGreaterThan(0);
    expect(qCold).toBeGreaterThan(0);
    expect(work).toBeCloseTo(qHot - qCold, 9);
    expect(efficiency).toBeCloseTo(carnotEfficiency(PARAMS.tHot, PARAMS.tCold), 10);
  });

  it("matches Q_h = nR T_h ln r", () => {
    const { qHot } = carnotHeats(PARAMS);
    expect(qHot).toBeCloseTo(
      PARAMS.nMoles * R_GAS * PARAMS.tHot * Math.log(PARAMS.expansionRatio),
      9,
    );
  });
});

describe("carnotPVPath", () => {
  it("returns 4 legs of samples and starts at state 1", () => {
    const path = carnotPVPath(PARAMS, 16);
    expect(path).toHaveLength(64);
    const [s1] = carnotCycleStates(PARAMS);
    expect(path[0].v).toBeCloseTo(s1.v, 9);
    expect(path[0].p).toBeCloseTo(s1.p, 3);
  });
});

describe("carnotTSRectangle", () => {
  it("encloses an area equal to the net work", () => {
    const { work } = carnotHeats(PARAMS);
    const sLow = 0;
    const sHigh = PARAMS.nMoles * R_GAS * Math.log(PARAMS.expansionRatio);
    const rect = carnotTSRectangle({
      tHot: PARAMS.tHot,
      tCold: PARAMS.tCold,
      sLow,
      sHigh,
    });
    expect(rect).toHaveLength(4);
    const area = tsRectangleArea({
      tHot: PARAMS.tHot,
      tCold: PARAMS.tCold,
      sLow,
      sHigh,
    });
    expect(area).toBeCloseTo(work, 6);
  });
});

describe("ENGINE_COMPARISONS", () => {
  it("keeps every genuine heat engine at or below its Carnot ceiling", () => {
    for (const c of ENGINE_COMPARISONS) {
      if (!c.isHeatEngine) continue;
      expect(c.actualEfficiency).toBeLessThanOrEqual(carnotLimitOf(c));
    }
  });

  it("includes muscle as the non-heat-engine exception that beats its tiny limit", () => {
    const muscle = ENGINE_COMPARISONS.find((c) => !c.isHeatEngine);
    expect(muscle).toBeDefined();
    expect(muscle!.actualEfficiency).toBeGreaterThan(carnotLimitOf(muscle!));
  });

  it("every entry carries a non-empty note", () => {
    for (const c of ENGINE_COMPARISONS) {
      expect(c.note.length).toBeGreaterThan(0);
    }
  });
});
