import { describe, expect, it } from "vitest";
import {
  aharonovBohmPhase,
  fluxQuantum,
  interferencePattern,
  abPhaseFromFluxRatio,
} from "@/lib/physics/electromagnetism/aharonov-bohm";
import { ELEMENTARY_CHARGE, PLANCK_CONSTANT, H_BAR } from "@/lib/physics/constants";

describe("aharonov-bohm", () => {
  it("AB phase Φ = qΦ_B/ℏ", () => {
    const phase = aharonovBohmPhase(ELEMENTARY_CHARGE, 1e-15);
    expect(phase).toBeCloseTo((ELEMENTARY_CHARGE * 1e-15) / H_BAR, 6);
  });

  it("flux quantum Φ_0 = h/e ≈ 4.14e-15 Wb", () => {
    const phi0 = fluxQuantum(ELEMENTARY_CHARGE);
    expect(phi0).toBeCloseTo(PLANCK_CONSTANT / ELEMENTARY_CHARGE, 12);
    expect(phi0).toBeCloseTo(4.135667696e-15, 6);
  });

  it("AB phase from one flux quantum equals 2π", () => {
    expect(abPhaseFromFluxRatio(1, ELEMENTARY_CHARGE)).toBeCloseTo(2 * Math.PI, 12);
  });

  it("AB phase from half a flux quantum equals π (fringes flip)", () => {
    expect(abPhaseFromFluxRatio(0.5, ELEMENTARY_CHARGE)).toBeCloseTo(Math.PI, 12);
  });

  it("interferencePattern is 2π periodic in phaseShift", () => {
    const I0 = interferencePattern(1e-6, 1, 5e-10, 0);
    const I2pi = interferencePattern(1e-6, 1, 5e-10, 2 * Math.PI);
    expect(I0(0)).toBeCloseTo(I2pi(0), 10);
    expect(I0(5e-4)).toBeCloseTo(I2pi(5e-4), 10);
  });

  it("interferencePattern fringe inversion at φ = π (constructive ↔ destructive at x=0)", () => {
    const I0 = interferencePattern(1e-6, 1, 5e-10, 0);
    const Ipi = interferencePattern(1e-6, 1, 5e-10, Math.PI);
    // At x=0: I0(0) = 4cos²(0) = 4 (max); Ipi(0) = 4cos²(π/2) = 0 (min)
    expect(I0(0)).toBeCloseTo(4, 10);
    expect(Ipi(0)).toBeCloseTo(0, 10);
  });
});
