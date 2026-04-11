import { describe, it, expect } from "vitest";
import { solveKepler, orbitPosition } from "@/lib/physics/kepler";

describe("Kepler's equation solver", () => {
  const eccentricities = [0, 0.1, 0.3, 0.5, 0.7, 0.9];

  for (const e of eccentricities) {
    it(`round-trips for e=${e} across mean anomaly`, () => {
      for (let i = 0; i < 20; i++) {
        const M = (2 * Math.PI * i) / 20 - Math.PI;
        const E = solveKepler(M, e);
        const MRecovered = E - e * Math.sin(E);
        expect(MRecovered).toBeCloseTo(M, 10);
      }
    });
  }

  it("converges within 10 iterations even at e=0.9", () => {
    const { iterations } = solveKepler(1.5, 0.9, { returnDiagnostics: true });
    expect(iterations).toBeLessThanOrEqual(10);
  });
});

describe("Keplerian orbit position", () => {
  const a = 1; // AU
  const e = 0.3;
  const T = 1; // year

  it("at t=0 the body is at perihelion (positive x axis, distance a(1-e))", () => {
    const p = orbitPosition({ t: 0, a, e, T });
    expect(p.x).toBeCloseTo(a * (1 - e), 10);
    expect(p.y).toBeCloseTo(0, 10);
    expect(p.r).toBeCloseTo(a * (1 - e), 10);
  });

  it("at t=T/2 the body is at aphelion (negative x, distance a(1+e))", () => {
    const p = orbitPosition({ t: T / 2, a, e, T });
    expect(p.x).toBeCloseTo(-a * (1 + e), 10);
    expect(p.y).toBeCloseTo(0, 10);
    expect(p.r).toBeCloseTo(a * (1 + e), 10);
  });

  it("at t=T the body returns to perihelion", () => {
    const p = orbitPosition({ t: T, a, e, T });
    expect(p.x).toBeCloseTo(a * (1 - e), 10);
    expect(p.y).toBeCloseTo(0, 10);
  });

  it("circular orbit (e=0) has constant radius a", () => {
    for (let i = 0; i < 10; i++) {
      const p = orbitPosition({ t: (i / 10) * T, a: 1, e: 0, T });
      expect(p.r).toBeCloseTo(1, 10);
    }
  });
});
