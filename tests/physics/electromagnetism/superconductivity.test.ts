import { describe, expect, it } from "vitest";
import {
  resistance,
  bPenetration,
  londonDepthVsT,
  criticalField,
  meissnerSusceptibility,
} from "@/lib/physics/electromagnetism/superconductivity";

describe("resistance", () => {
  it("returns R_0 above T_c", () => {
    expect(resistance(10, 4.2, 0.05)).toBe(0.05);
  });

  it("returns exactly zero at T = T_c", () => {
    expect(resistance(4.2, 4.2, 0.05)).toBe(0);
  });

  it("returns exactly zero below T_c", () => {
    expect(resistance(1.0, 4.2, 0.05)).toBe(0);
  });
});

describe("bPenetration", () => {
  it("B(0) = B_0 at the surface", () => {
    expect(bPenetration(1e-3, 0, 100e-9)).toBeCloseTo(1e-3, 15);
  });

  it("decays by factor e over one λ_L", () => {
    const lambda = 150e-9;
    const B0 = 2e-3;
    expect(bPenetration(B0, lambda, lambda)).toBeCloseTo(B0 / Math.E, 12);
  });

  it("is essentially zero a few λ_L in", () => {
    const lambda = 100e-9;
    // At 10 λ_L the field is B_0 · e^(−10) ≈ 4.5e-5 · B_0
    const B = bPenetration(1, 10 * lambda, lambda);
    expect(B).toBeLessThan(1e-4);
  });

  it("throws if λ_L is non-positive", () => {
    expect(() => bPenetration(1, 1, 0)).toThrow();
    expect(() => bPenetration(1, 1, -1e-9)).toThrow();
  });
});

describe("londonDepthVsT", () => {
  it("equals λ_0 at T = 0", () => {
    expect(londonDepthVsT(100e-9, 0, 9.3)).toBeCloseTo(100e-9, 15);
  });

  it("grows with T below T_c", () => {
    const lam1 = londonDepthVsT(100e-9, 2, 9.3);
    const lam2 = londonDepthVsT(100e-9, 7, 9.3);
    expect(lam2).toBeGreaterThan(lam1);
  });

  it("diverges (returns Infinity) at T ≥ T_c", () => {
    expect(londonDepthVsT(100e-9, 9.3, 9.3)).toBe(Infinity);
    expect(londonDepthVsT(100e-9, 12, 9.3)).toBe(Infinity);
  });
});

describe("criticalField", () => {
  it("equals H_c0 at T = 0", () => {
    expect(criticalField(8e4, 0, 9.3)).toBeCloseTo(8e4, 12);
  });

  it("is zero at T = T_c", () => {
    expect(criticalField(8e4, 9.3, 9.3)).toBe(0);
  });

  it("is zero above T_c", () => {
    expect(criticalField(8e4, 12, 9.3)).toBe(0);
  });

  it("decreases monotonically with T", () => {
    const h1 = criticalField(8e4, 1, 9.3);
    const h2 = criticalField(8e4, 5, 9.3);
    const h3 = criticalField(8e4, 8, 9.3);
    expect(h1).toBeGreaterThan(h2);
    expect(h2).toBeGreaterThan(h3);
  });
});

describe("meissnerSusceptibility", () => {
  it("is exactly −1 below T_c (perfect diamagnet)", () => {
    expect(meissnerSusceptibility(2, 9.3)).toBe(-1);
  });

  it("is exactly −1 at T = T_c (inclusive boundary)", () => {
    expect(meissnerSusceptibility(9.3, 9.3)).toBe(-1);
  });

  it("reverts to the normal-state χ above T_c", () => {
    expect(meissnerSusceptibility(12, 9.3, -2e-5)).toBeCloseTo(-2e-5, 15);
  });

  it("defaults the normal-state χ to 0", () => {
    expect(meissnerSusceptibility(12, 9.3)).toBe(0);
  });
});
