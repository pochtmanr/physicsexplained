// tests/physics/rotating-frame.test.ts
import { describe, expect, it } from "vitest";
import {
  coriolisAccel2D,
  centrifugalAccel2D,
  foucaultRotationPeriodHours,
  EARTH_OMEGA,
} from "@/lib/physics/rotating-frame";

describe("rotating-frame", () => {
  it("coriolisAccel2D = -2 Ω × v", () => {
    // Ω along +z, v along +x: -2 ẑ × x̂ = -2 ŷ (deflects to the right when Ω>0)
    const a = coriolisAccel2D({ omegaZ: 1 }, { x: 1, y: 0 });
    expect(a.x).toBeCloseTo(0, 6);
    expect(a.y).toBeCloseTo(-2, 6);
  });

  it("centrifugalAccel2D = Ω² r (outward radial)", () => {
    const a = centrifugalAccel2D({ omegaZ: 2 }, { x: 3, y: 0 });
    expect(a.x).toBeCloseTo(12, 6);
    expect(a.y).toBeCloseTo(0, 6);
  });

  it("Foucault pendulum at pole completes 360° in one sidereal day (~23.93h)", () => {
    const T = foucaultRotationPeriodHours(90);
    expect(T).toBeCloseTo(23.93, 1);
  });

  it("Foucault pendulum at Paris (48.85°) completes 360° in ~31.7h", () => {
    const T = foucaultRotationPeriodHours(48.85);
    expect(T).toBeCloseTo(31.8, 0);
  });

  it("Foucault period diverges at equator", () => {
    expect(Number.isFinite(foucaultRotationPeriodHours(0))).toBe(false);
  });

  it("EARTH_OMEGA ≈ 7.292e-5 rad/s", () => {
    expect(EARTH_OMEGA).toBeCloseTo(7.292e-5, 8);
  });
});
