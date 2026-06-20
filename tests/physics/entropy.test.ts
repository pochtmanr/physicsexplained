import { describe, it, expect } from "vitest";
import {
  R_GAS,
  dsIsothermal,
  dsIsochoric,
  dsIsobaric,
  dsAdiabaticReversible,
  entropyOfMixing,
  heatTransferDsUniverse,
  reversibleHeatTransferEntropy,
  freeExpansionDs,
  mixingTimeSeries,
} from "@/lib/physics/thermodynamics/entropy";

describe("ideal-gas ΔS", () => {
  it("isothermal expansion raises entropy by nR ln(V₂/V₁)", () => {
    expect(dsIsothermal(1, 1, 2)).toBeCloseTo(R_GAS * Math.log(2), 9);
    expect(dsIsothermal(2, 2, 1)).toBeLessThan(0); // compression lowers it
  });

  it("isochoric and isobaric heating raise entropy", () => {
    expect(dsIsochoric(1, 12.47, 300, 600)).toBeGreaterThan(0);
    expect(dsIsobaric(1, 20.79, 300, 600)).toBeGreaterThan(0);
  });

  it("a reversible adiabat is isentropic", () => {
    expect(dsAdiabaticReversible()).toBe(0);
  });
});

describe("entropyOfMixing", () => {
  it("is (n_A + n_B) R ln 2 for equal moles", () => {
    expect(entropyOfMixing({ nA: 1, nB: 1 })).toBeCloseTo(2 * R_GAS * Math.log(2), 9);
  });

  it("is always positive", () => {
    expect(entropyOfMixing({ nA: 3, nB: 1 })).toBeGreaterThan(0);
    expect(entropyOfMixing({ nA: 0.5, nB: 2 })).toBeGreaterThan(0);
  });
});

describe("heat transfer entropy", () => {
  it("direct conduction grows the universe's entropy", () => {
    const r = heatTransferDsUniverse(1000, 600, 300);
    expect(r.dsHot).toBeLessThan(0);
    expect(r.dsCold).toBeGreaterThan(0);
    expect(r.dsUniverse).toBeCloseTo(1000 * (1 / 300 - 1 / 600), 9);
    expect(r.dsUniverse).toBeGreaterThan(0);
  });

  it("reversible transfer through a Carnot engine leaves ΔS_universe = 0", () => {
    const r = reversibleHeatTransferEntropy(1000, 600, 300);
    expect(r.dsUniverse).toBeCloseTo(0, 9);
  });
});

describe("freeExpansionDs", () => {
  it("matches the reversible isothermal value despite no heat flow", () => {
    expect(freeExpansionDs(1, 1, 3)).toBeCloseTo(dsIsothermal(1, 1, 3), 12);
  });

  it("requires V₂ > V₁", () => {
    expect(() => freeExpansionDs(1, 2, 1)).toThrow();
  });
});

describe("mixingTimeSeries", () => {
  it("climbs monotonically from ~0 toward the final value", () => {
    const final = entropyOfMixing({ nA: 1, nB: 1 });
    const series = mixingTimeSeries(final, 50);
    expect(series).toHaveLength(50);
    expect(series[0].ds).toBeCloseTo(0, 9);
    for (let i = 1; i < series.length; i++) {
      expect(series[i].ds).toBeGreaterThanOrEqual(series[i - 1].ds);
    }
    expect(series[series.length - 1].ds).toBeLessThanOrEqual(final + 1e-9);
    expect(series[series.length - 1].ds).toBeGreaterThan(final * 0.9);
  });
});
