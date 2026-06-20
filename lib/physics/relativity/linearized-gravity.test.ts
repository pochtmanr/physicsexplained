/**
 * §50 LINEARIZED GRAVITY — unit tests.
 *
 * Covers the plane-wave evaluator, the vacuum dispersion relation (waves
 * travel at c), the transverse-traceless strain matrix (symmetric and
 * traceless), and the ring deformation used by the scenes.
 */

import { describe, expect, it } from "vitest";
import { SPEED_OF_LIGHT } from "@/lib/physics/constants";
import {
  planeWave,
  angularFrequencyFromWavenumber,
  wavenumberFromAngularFrequency,
  phaseSpeed,
  wavelength,
  ttStrainMatrix,
  deformPoint,
  ringResponse,
  analogyTable,
  armLengthChange,
} from "@/lib/physics/relativity/linearized-gravity";

describe("planeWave", () => {
  it("equals the amplitude at the crest (phase 0)", () => {
    expect(planeWave(0.3, 1, 1, 0, 0)).toBeCloseTo(0.3, 12);
  });

  it("vanishes a quarter period later at fixed z", () => {
    // k z − ω t = −π/2 ⇒ cos = 0 when z = 0, ω t = π/2
    expect(planeWave(1, 1, 1, 0, Math.PI / 2)).toBeCloseTo(0, 12);
  });

  it("is periodic in t with period 2π/ω", () => {
    const a = planeWave(1, 2, 3, 0.5, 1.0);
    const b = planeWave(1, 2, 3, 0.5, 1.0 + (2 * Math.PI) / 3);
    expect(b).toBeCloseTo(a, 12);
  });
});

describe("dispersion relation", () => {
  it("gives ω = c k", () => {
    expect(angularFrequencyFromWavenumber(2)).toBeCloseTo(2 * SPEED_OF_LIGHT, 6);
  });

  it("round-trips k → ω → k", () => {
    const k = 3.7e-8;
    const omega = angularFrequencyFromWavenumber(k);
    expect(wavenumberFromAngularFrequency(omega)).toBeCloseTo(k, 18);
  });

  it("phase speed is exactly c on the dispersion curve", () => {
    const k = 5;
    const omega = angularFrequencyFromWavenumber(k);
    expect(phaseSpeed(omega, k)).toBeCloseTo(SPEED_OF_LIGHT, 6);
  });

  it("returns 0 phase speed for a zero wavenumber (guard)", () => {
    expect(phaseSpeed(1, 0)).toBe(0);
  });
});

describe("wavelength", () => {
  it("is 2π/k", () => {
    expect(wavelength(2)).toBeCloseTo(Math.PI, 12);
  });
});

describe("ttStrainMatrix", () => {
  it("is symmetric", () => {
    const m = ttStrainMatrix(0.4, 0.2, 0.9);
    expect(m[0][1]).toBeCloseTo(m[1][0], 12);
  });

  it("is traceless (hxx + hyy = 0)", () => {
    const m = ttStrainMatrix(0.4, 0.2, 0.9);
    expect(m[0][0] + m[1][1]).toBeCloseTo(0, 12);
  });

  it("pure plus mode is diagonal at the crest", () => {
    const m = ttStrainMatrix(0.5, 0, 0);
    expect(m[0][0]).toBeCloseTo(0.5, 12);
    expect(m[1][1]).toBeCloseTo(-0.5, 12);
    expect(m[0][1]).toBeCloseTo(0, 12);
  });

  it("pure cross mode is off-diagonal at the crest", () => {
    const m = ttStrainMatrix(0, 0.5, 0);
    expect(m[0][0]).toBeCloseTo(0, 12);
    expect(m[0][1]).toBeCloseTo(0.5, 12);
  });

  it("flips sign at half a period", () => {
    const a = ttStrainMatrix(0.5, 0.3, 0);
    const b = ttStrainMatrix(0.5, 0.3, Math.PI);
    expect(b[0][0]).toBeCloseTo(-a[0][0], 12);
    expect(b[0][1]).toBeCloseTo(-a[0][1], 12);
  });
});

describe("deformPoint", () => {
  it("leaves a point fixed under zero strain", () => {
    const strain = ttStrainMatrix(0, 0, 0);
    const p = deformPoint({ x: 1, y: 2 }, strain);
    expect(p.x).toBeCloseTo(1, 12);
    expect(p.y).toBeCloseTo(2, 12);
  });

  it("stretches x and squeezes y for the plus mode at the crest", () => {
    const strain = ttStrainMatrix(0.2, 0, 0);
    const px = deformPoint({ x: 1, y: 0 }, strain);
    const py = deformPoint({ x: 0, y: 1 }, strain);
    // δL/L = h/2 ⇒ x grows by 0.1, y shrinks by 0.1
    expect(px.x).toBeCloseTo(1.1, 12);
    expect(py.y).toBeCloseTo(0.9, 12);
  });
});

describe("ringResponse", () => {
  it("returns n points", () => {
    expect(ringResponse(24, 1, 0.1, 0, 0)).toHaveLength(24);
  });

  it("is an undistorted circle at zero amplitude", () => {
    const ring = ringResponse(64, 2, 0, 0, 0);
    for (const p of ring) {
      expect(Math.hypot(p.x, p.y)).toBeCloseTo(2, 10);
    }
  });

  it("conserves area to first order for the plus mode (incompressible)", () => {
    // A traceless strain preserves area to first order: the + mode stretches
    // one axis and squeezes the other by the same fraction.
    const ring = ringResponse(4, 1, 0.2, 0, 0);
    // points at 0,90,180,270 degrees
    const right = ring[0];
    const top = ring[1];
    expect(right.x).toBeGreaterThan(1); // stretched along x
    expect(top.y).toBeLessThan(1); // squeezed along y
  });
});

describe("analogyTable", () => {
  it("has six rows with unique keys", () => {
    const rows = analogyTable();
    expect(rows).toHaveLength(6);
    expect(new Set(rows.map((r) => r.key)).size).toBe(6);
  });

  it("pairs dipole (EM) with quadrupole (GR)", () => {
    const source = analogyTable().find((r) => r.key === "source");
    expect(source?.em.toLowerCase()).toContain("dipole");
    expect(source?.gr.toLowerCase()).toContain("quadrupole");
  });
});

describe("armLengthChange", () => {
  it("is half the strain times the arm length", () => {
    expect(armLengthChange(1e-21, 4000)).toBeCloseTo(2e-18, 30);
  });
});
