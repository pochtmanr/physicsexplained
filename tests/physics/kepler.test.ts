import { describe, it, expect } from "vitest";
import { solveKepler } from "@/lib/physics/kepler";

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
