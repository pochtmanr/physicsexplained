import { describe, it, expect } from "vitest";
import {
  R_GAS,
  DULONG_PETIT,
  SPECIFIC_HEATS,
  heat,
  molarHeatCapacity,
  methodOfMixtures,
  cvIdeal,
  cpFromCv,
  gammaFromCv,
  MONATOMIC,
  DIATOMIC,
} from "@/lib/physics/thermodynamics/calorimetry";

describe("specific-heat table", () => {
  it("lists water highest and metals far lower", () => {
    const water = SPECIFIC_HEATS.find((s) => s.name === "Water")!;
    const lead = SPECIFIC_HEATS.find((s) => s.name === "Lead")!;
    expect(water.specificHeat).toBeCloseTo(4.186, 3);
    expect(lead.specificHeat).toBeCloseTo(0.13, 3);
    // Black's ~30× observation (water vs mercury)
    const mercury = SPECIFIC_HEATS.find((s) => s.name === "Mercury")!;
    expect(water.specificHeat / mercury.specificHeat).toBeGreaterThan(25);
  });

  it("every entry has a positive specific heat and a consequence", () => {
    for (const s of SPECIFIC_HEATS) {
      expect(s.specificHeat).toBeGreaterThan(0);
      expect(s.consequence.length).toBeGreaterThan(0);
    }
  });
});

describe("Q = m c ΔT", () => {
  it("1 g water +1 K absorbs 4.186 J", () => {
    expect(heat(1, 4.186, 1)).toBeCloseTo(4.186, 6);
  });
  it("rejects bad inputs", () => {
    expect(() => heat(-1, 4.186, 1)).toThrow();
    expect(() => heat(1, 0, 1)).toThrow();
  });
});

describe("molar heat capacity & Dulong–Petit", () => {
  it("3R ≈ 24.9 J/(mol·K)", () => {
    expect(DULONG_PETIT).toBeCloseTo(24.94, 2);
  });
  it("copper (c=0.385, M=63.5) lands near Dulong–Petit", () => {
    const c = molarHeatCapacity(0.385, 63.5);
    expect(c).toBeCloseTo(24.4, 1);
    expect(Math.abs(c - DULONG_PETIT)).toBeLessThan(2);
  });
});

describe("method of mixtures", () => {
  it("equal m·c gives the mean", () => {
    const t = methodOfMixtures([
      { mass: 100, specificHeat: 4.186, temperature: 20 },
      { mass: 100, specificHeat: 4.186, temperature: 80 },
    ]);
    expect(t).toBeCloseTo(50, 6);
  });

  it("hot metal into cool water settles between, near the water", () => {
    // 100 g iron at 100 °C into 200 g water at 20 °C
    const t = methodOfMixtures([
      { mass: 100, specificHeat: 0.449, temperature: 100 },
      { mass: 200, specificHeat: 4.186, temperature: 20 },
    ]);
    expect(t).toBeGreaterThan(20);
    expect(t).toBeLessThan(30); // water's huge capacity dominates
    // satisfies m_s c_s (T_s−T) = m_w c_w (T−T_w)
    const lhs = 100 * 0.449 * (100 - t);
    const rhs = 200 * 4.186 * (t - 20);
    expect(lhs).toBeCloseTo(rhs, 6);
  });

  it("rejects empty input", () => {
    expect(() => methodOfMixtures([])).toThrow();
  });
});

describe("ideal-gas C_v vs C_p", () => {
  it("monatomic: 3/2 R, 5/2 R, γ=5/3", () => {
    expect(MONATOMIC.cv).toBeCloseTo(1.5 * R_GAS, 6);
    expect(MONATOMIC.cp).toBeCloseTo(2.5 * R_GAS, 6);
    expect(MONATOMIC.gamma).toBeCloseTo(5 / 3, 6);
  });

  it("diatomic: 5/2 R, 7/2 R, γ=7/5", () => {
    expect(DIATOMIC.cv).toBeCloseTo(2.5 * R_GAS, 6);
    expect(DIATOMIC.cp).toBeCloseTo(3.5 * R_GAS, 6);
    expect(DIATOMIC.gamma).toBeCloseTo(7 / 5, 6);
  });

  it("C_p − C_v = R always", () => {
    for (const f of [3, 5, 6]) {
      const cv = cvIdeal(f);
      expect(cpFromCv(cv) - cv).toBeCloseTo(R_GAS, 6);
    }
  });

  it("rejects bad inputs", () => {
    expect(() => cvIdeal(0)).toThrow();
    expect(() => gammaFromCv(0)).toThrow();
  });
});
