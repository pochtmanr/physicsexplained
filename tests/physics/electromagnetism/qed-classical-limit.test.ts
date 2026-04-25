import { describe, expect, it } from "vitest";
import {
  coherentStatePhotonStats,
  runningCouplingAlpha,
  anomalousMagneticMomentLeadingOrder,
} from "@/lib/physics/electromagnetism/qed-classical-limit";
import { ALPHA_FINE, ELECTRON_MASS, SPEED_OF_LIGHT } from "@/lib/physics/constants";

describe("qed-classical-limit", () => {
  describe("coherentStatePhotonStats", () => {
    it("mean and variance both equal |α|² (Poisson)", () => {
      const stats = coherentStatePhotonStats(10);
      expect(stats.meanN).toBe(100);
      expect(stats.varianceN).toBe(100);
    });

    it("relative fluctuation is 1/|α| — vanishes at large α", () => {
      const stats100 = coherentStatePhotonStats(100);
      const stats10000 = coherentStatePhotonStats(10000);
      expect(stats100.relativeFluctuation).toBeCloseTo(0.01, 12);
      expect(stats10000.relativeFluctuation).toBeCloseTo(0.0001, 12);
    });
  });

  describe("runningCouplingAlpha", () => {
    it("returns α(0) ≈ 1/137 at the electron mass scale", () => {
      const meRest = ELECTRON_MASS * SPEED_OF_LIGHT * SPEED_OF_LIGHT;
      expect(runningCouplingAlpha(meRest)).toBeCloseTo(ALPHA_FINE, 10);
    });

    it("returns α(0) for energies at or below electron rest mass", () => {
      const meRest = ELECTRON_MASS * SPEED_OF_LIGHT * SPEED_OF_LIGHT;
      expect(runningCouplingAlpha(0)).toBeCloseTo(ALPHA_FINE, 12);
      expect(runningCouplingAlpha(meRest / 2)).toBeCloseTo(ALPHA_FINE, 12);
    });

    it("running α at LEP scale (M_Z ≈ 91 GeV) is larger than α(0)", () => {
      const Mz_J = 91.1876e9 * 1.602176634e-19;
      const alphaMz = runningCouplingAlpha(Mz_J);
      // Expected: α(M_Z) ≈ 1/128 from full SM running; one-loop QED-only is closer
      // to 1/134, but the qualitative feature (running > α(0)) is the testable claim.
      expect(alphaMz).toBeGreaterThan(ALPHA_FINE);
    });
  });

  describe("anomalousMagneticMomentLeadingOrder", () => {
    it("returns α/(2π) — Schwinger 1948", () => {
      expect(anomalousMagneticMomentLeadingOrder()).toBeCloseTo(
        ALPHA_FINE / (2 * Math.PI),
        12,
      );
    });

    it("numerical value ≈ 0.00116", () => {
      expect(anomalousMagneticMomentLeadingOrder()).toBeCloseTo(0.00116, 5);
    });
  });
});
