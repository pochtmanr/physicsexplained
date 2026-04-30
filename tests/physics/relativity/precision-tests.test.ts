import { describe, expect, it } from "vitest";
import {
  precisionTestTimeline,
  smeBounds,
  naivePlanckScaleBound,
  naturalnessGapOrders,
  precisionImprovementOrders,
} from "@/lib/physics/relativity/precision-tests";

describe("precisionTestTimeline", () => {
  const tl = precisionTestTimeline();

  it("starts with Michelson-Morley 1887 — the first canonical test", () => {
    expect(tl[0].year).toBe(1887);
    expect(tl[0].experiment).toContain("Michelson-Morley");
    expect(tl[0].bound).toBe(1e-9);
  });

  it("is ordered chronologically (years strictly increasing)", () => {
    for (let i = 1; i < tl.length; i++) {
      expect(tl[i].year).toBeGreaterThan(tl[i - 1].year);
    }
  });

  it("Hughes-Drever (1959–60) is the first qualitative leap below 10⁻⁹", () => {
    const hd = tl[2];
    expect(hd.experiment).toContain("Hughes");
    expect(hd.experiment).toContain("Drever");
    expect(hd.year).toBeGreaterThanOrEqual(1959);
    expect(hd.year).toBeLessThanOrEqual(1960);
    expect(hd.bound).toBeLessThan(1e-9);
    // Earlier two entries are both at the 10⁻⁹ level.
    expect(tl[0].bound).toBeLessThanOrEqual(1e-9);
    expect(tl[1].bound).toBeLessThanOrEqual(1e-9);
    expect(tl[0].bound).toBeGreaterThan(hd.bound);
    expect(tl[1].bound).toBeGreaterThan(hd.bound);
  });

  it("modern optical-clock comparison (last entry) is at parts in 10⁻¹⁸", () => {
    const latest = tl[tl.length - 1];
    expect(latest.year).toBeGreaterThanOrEqual(2015);
    expect(latest.bound).toBeLessThanOrEqual(1e-17);
  });

  it("includes Brillet-Hall 1979 as a refined Michelson-Morley", () => {
    const bh = tl.find((e) => e.experiment.includes("Brillet"));
    expect(bh).toBeDefined();
    expect(bh!.year).toBe(1979);
    expect(bh!.technique).toMatch(/Michelson|interferometer/i);
  });

  it("every entry carries a non-empty technique description", () => {
    for (const entry of tl) {
      expect(entry.technique.length).toBeGreaterThan(0);
    }
  });
});

describe("smeBounds", () => {
  const bounds = smeBounds();

  it("includes a photon-sector bound at the 10⁻¹⁸ level (modern frontier)", () => {
    const photons = bounds.filter((b) => b.sector === "photon");
    expect(photons.length).toBeGreaterThan(0);
    const tightest = photons.reduce((a, b) => (a.bound < b.bound ? a : b));
    expect(tightest.bound).toBeLessThanOrEqual(1e-17);
  });

  it("covers all four canonical SME sectors (photon, electron, proton, neutron)", () => {
    const sectors = new Set(bounds.map((b) => b.sector));
    expect(sectors.has("photon")).toBe(true);
    expect(sectors.has("electron")).toBe(true);
    expect(sectors.has("proton")).toBe(true);
    expect(sectors.has("neutron")).toBe(true);
  });

  it("every coefficient bound is strictly positive (an upper limit)", () => {
    for (const b of bounds) {
      expect(b.bound).toBeGreaterThan(0);
    }
  });

  it("every entry carries a non-empty experimental source", () => {
    for (const b of bounds) {
      expect(b.source.length).toBeGreaterThan(0);
    }
  });
});

describe("naivePlanckScaleBound", () => {
  it("is order ~10⁻⁴ (Earth orbital speed / c)", () => {
    const x = naivePlanckScaleBound();
    expect(x).toBeGreaterThan(5e-5);
    expect(x).toBeLessThan(5e-4);
  });

  it("scales inversely with the speed-of-light argument", () => {
    const a = naivePlanckScaleBound(1);
    const b = naivePlanckScaleBound(2);
    expect(a).toBeCloseTo(2 * b, 6);
  });
});

describe("naturalnessGapOrders", () => {
  it("at the modern 10⁻¹⁸ bound the gap is ~14 orders of magnitude", () => {
    const gap = naturalnessGapOrders(1e-18);
    expect(gap).toBeGreaterThan(13);
    expect(gap).toBeLessThan(15);
  });

  it("zero or negative bounds throw (an upper limit must be positive)", () => {
    expect(() => naturalnessGapOrders(0)).toThrow(RangeError);
    expect(() => naturalnessGapOrders(-1e-18)).toThrow(RangeError);
  });

  it("vanishes when the bound matches the naïve estimate exactly", () => {
    expect(naturalnessGapOrders(naivePlanckScaleBound())).toBeCloseTo(0, 12);
  });
});

describe("precisionImprovementOrders", () => {
  it("Michelson-Morley → modern clocks is at least 8 orders of magnitude", () => {
    const orders = precisionImprovementOrders();
    expect(orders).toBeGreaterThanOrEqual(8);
    expect(orders).toBeLessThanOrEqual(11);
  });
});
