import { describe, expect, it } from "vitest";
import {
  polarizationFromField,
  polarizationVectorFromField,
  boundSurfaceChargeDensity,
  boundVolumeChargeDensity,
  dipoleAlignment,
  uniformSlabBoundCharges,
  depolarizingFieldInSlab,
} from "@/lib/physics/electromagnetism/polarization";
import { EPSILON_0 } from "@/lib/physics/constants";

describe("polarizationFromField", () => {
  it("returns ε₀·χ_e·E for the linear constitutive relation", () => {
    // χ_e = 2, E = 1000 V/m → P = 2 ε₀ · 1000
    expect(polarizationFromField(2, 1000)).toBeCloseTo(2 * EPSILON_0 * 1000, 18);
  });

  it("vanishes at zero field, regardless of susceptibility", () => {
    expect(polarizationFromField(5, 0)).toBe(0);
  });

  it("scales linearly with the susceptibility", () => {
    const E = 500;
    const a = polarizationFromField(1, E);
    const b = polarizationFromField(3, E);
    expect(b / a).toBeCloseTo(3, 12);
  });

  it("rejects negative susceptibility (not physical for ordinary matter)", () => {
    expect(() => polarizationFromField(-0.1, 100)).toThrow();
  });
});

describe("polarizationVectorFromField", () => {
  it("keeps P parallel to E in linear isotropic matter", () => {
    const E = { x: 3, y: 4 }; // |E| = 5
    const P = polarizationVectorFromField(2, E);
    // P is just ε₀·χ_e times E
    expect(P.x).toBeCloseTo(2 * EPSILON_0 * 3, 18);
    expect(P.y).toBeCloseTo(2 * EPSILON_0 * 4, 18);
    // and ‖P‖ = ε₀·χ_e·‖E‖
    expect(Math.hypot(P.x, P.y)).toBeCloseTo(2 * EPSILON_0 * 5, 18);
  });

  it("returns the zero vector when E vanishes", () => {
    const P = polarizationVectorFromField(7, { x: 0, y: 0 });
    expect(P.x).toBe(0);
    expect(P.y).toBe(0);
  });
});

describe("boundSurfaceChargeDensity", () => {
  it("equals +|P| on a face whose outward normal aligns with P", () => {
    const P = { x: 0, y: 1.5e-6 }; // C/m²
    const nHat = { x: 0, y: 1 };
    expect(boundSurfaceChargeDensity(P, nHat)).toBeCloseTo(1.5e-6, 12);
  });

  it("equals −|P| on the opposite face", () => {
    const P = { x: 0, y: 1.5e-6 };
    const nHat = { x: 0, y: -1 };
    expect(boundSurfaceChargeDensity(P, nHat)).toBeCloseTo(-1.5e-6, 12);
  });

  it("vanishes on a face whose normal is perpendicular to P", () => {
    const P = { x: 0, y: 1.5e-6 };
    const nHat = { x: 1, y: 0 };
    expect(boundSurfaceChargeDensity(P, nHat)).toBeCloseTo(0, 18);
  });

  it("rejects a non-unit normal", () => {
    expect(() =>
      boundSurfaceChargeDensity({ x: 1, y: 0 }, { x: 2, y: 0 }),
    ).toThrow();
  });
});

describe("boundVolumeChargeDensity", () => {
  it("equals −∇·P", () => {
    expect(boundVolumeChargeDensity(0.5)).toBeCloseTo(-0.5, 18);
    expect(boundVolumeChargeDensity(-2.4e-9)).toBeCloseTo(2.4e-9, 18);
  });

  it("vanishes for divergence-free polarization (uniform P)", () => {
    expect(boundVolumeChargeDensity(0)).toBeCloseTo(0, 18);
  });
});

describe("dipoleAlignment", () => {
  it("is +1 for a perfectly aligned dipole", () => {
    expect(dipoleAlignment(0)).toBeCloseTo(1, 12);
  });

  it("is 0 for a perpendicular dipole", () => {
    expect(dipoleAlignment(Math.PI / 2)).toBeCloseTo(0, 12);
  });

  it("is −1 for an anti-aligned dipole", () => {
    expect(dipoleAlignment(Math.PI)).toBeCloseTo(-1, 12);
  });
});

describe("uniformSlabBoundCharges", () => {
  it("places +P on one face and −P on the other", () => {
    const out = uniformSlabBoundCharges(2.0e-6, 0.001);
    expect(out.positiveFace).toBeCloseTo(2.0e-6, 18);
    expect(out.negativeFace).toBeCloseTo(-2.0e-6, 18);
  });

  it("returns a total dipole-moment-per-area equal to P·d", () => {
    const P = 1.2e-6;
    const d = 5e-3;
    const out = uniformSlabBoundCharges(P, d);
    expect(out.totalDipoleMomentPerArea).toBeCloseTo(P * d, 18);
  });

  it("rejects non-positive thickness", () => {
    expect(() => uniformSlabBoundCharges(1, 0)).toThrow();
    expect(() => uniformSlabBoundCharges(1, -1)).toThrow();
  });
});

describe("depolarizingFieldInSlab", () => {
  it("equals P / ε₀ in magnitude", () => {
    expect(depolarizingFieldInSlab(1)).toBeCloseTo(1 / EPSILON_0, 0);
  });

  it("scales linearly with the polarization", () => {
    const a = depolarizingFieldInSlab(1e-6);
    const b = depolarizingFieldInSlab(3e-6);
    expect(b / a).toBeCloseTo(3, 12);
  });

  it("vanishes when there is no polarization", () => {
    expect(depolarizingFieldInSlab(0)).toBe(0);
  });
});
