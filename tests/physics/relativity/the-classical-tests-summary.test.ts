import { describe, expect, it } from "vitest";
import {
  classicalTests,
  deflectionArcsec,
  gravitationalRedshiftFraction,
  GR_PPN,
  isConsistentWithGr,
  ninesOfAgreement,
  precisionHistory,
  shapiroCoefficient,
} from "@/lib/physics/relativity/the-classical-tests-summary";

describe("classicalTests", () => {
  it("returns the four classical tests in chronological order", () => {
    const tests = classicalTests();
    expect(tests.map((t) => t.id)).toEqual([
      "perihelion",
      "deflection",
      "redshift",
      "shapiro",
    ]);
    const years = tests.map((t) => t.firstYear);
    const sorted = [...years].sort((a, b) => a - b);
    expect(years).toEqual(sorted);
  });

  it("assigns each test the correct theory layer", () => {
    const byId = Object.fromEntries(classicalTests().map((t) => [t.id, t]));
    expect(byId.redshift.layer).toBe("equivalence-principle");
    expect(byId.deflection.layer).toBe("metric");
    expect(byId.shapiro.layer).toBe("metric");
    expect(byId.perihelion.layer).toBe("field-equations");
  });

  it("has strictly positive, sub-unity best precisions", () => {
    for (const t of classicalTests()) {
      expect(t.bestPrecision).toBeGreaterThan(0);
      expect(t.bestPrecision).toBeLessThan(1);
    }
  });
});

describe("precisionHistory", () => {
  it("covers all four tests", () => {
    const hist = precisionHistory();
    expect(Object.keys(hist).sort()).toEqual([
      "deflection",
      "perihelion",
      "redshift",
      "shapiro",
    ]);
  });

  it("improves (precision strictly decreases) over time for every test", () => {
    const hist = precisionHistory();
    for (const points of Object.values(hist)) {
      for (let i = 1; i < points.length; i++) {
        expect(points[i].year).toBeGreaterThan(points[i - 1].year);
        expect(points[i].precision).toBeLessThan(points[i - 1].precision);
      }
    }
  });
});

describe("deflectionArcsec", () => {
  it("gives ~1.75 arcsec in GR (gamma = 1)", () => {
    expect(deflectionArcsec(1)).toBeCloseTo(1.75, 1);
  });

  it("gives half the GR value for a Newtonian photon (gamma = 0)", () => {
    expect(deflectionArcsec(0)).toBeCloseTo(deflectionArcsec(1) / 2, 6);
  });

  it("is linear in gamma", () => {
    const a = deflectionArcsec(0);
    const b = deflectionArcsec(1);
    expect(deflectionArcsec(0.5)).toBeCloseTo((a + b) / 2, 6);
  });
});

describe("shapiroCoefficient", () => {
  it("is 1 in GR and 1/2 for gamma = 0", () => {
    expect(shapiroCoefficient(1)).toBe(1);
    expect(shapiroCoefficient(0)).toBe(0.5);
  });
});

describe("gravitationalRedshiftFraction", () => {
  it("reproduces the Pound-Rebka shift over 22.5 m on Earth", () => {
    // g = 9.8 m/s², h = 22.5 m → ~2.45e-15
    const frac = gravitationalRedshiftFraction(9.8, 22.5);
    expect(frac).toBeGreaterThan(2.4e-15);
    expect(frac).toBeLessThan(2.5e-15);
  });

  it("scales linearly with height", () => {
    const single = gravitationalRedshiftFraction(9.8, 10);
    const double = gravitationalRedshiftFraction(9.8, 20);
    expect(double).toBeCloseTo(2 * single, 20);
  });
});

describe("ninesOfAgreement", () => {
  it("maps 1e-5 to 5 nines", () => {
    expect(ninesOfAgreement(1e-5)).toBeCloseTo(5, 6);
  });

  it("clamps at 0 for precision >= 1", () => {
    expect(ninesOfAgreement(1)).toBe(0);
    expect(ninesOfAgreement(2)).toBe(0);
  });
});

describe("isConsistentWithGr", () => {
  it("accepts the exact GR values", () => {
    expect(isConsistentWithGr(GR_PPN)).toBe(true);
  });

  it("accepts Cassini-level gamma within tolerance", () => {
    expect(isConsistentWithGr({ gamma: 1.000021, beta: 1 }, 1e-3)).toBe(true);
  });

  it("rejects a clearly Newtonian gamma", () => {
    expect(isConsistentWithGr({ gamma: 0, beta: 1 })).toBe(false);
  });
});
