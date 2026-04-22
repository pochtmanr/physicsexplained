import { describe, expect, it } from "vitest";
import {
  hFromBM,
  linearMagnetization,
  relativePermeability,
  absolutePermeability,
  bFromHLinear,
  curieSusceptibility,
  curieWeissSusceptibility,
} from "@/lib/physics/electromagnetism/magnetization";
import { MU_0 } from "@/lib/physics/constants";

describe("hFromBM", () => {
  it("returns B/μ₀ when M is zero (vacuum)", () => {
    expect(hFromBM(2e-3, 0)).toBeCloseTo(2e-3 / MU_0, 4);
  });
  it("subtracts M from B/μ₀ in matter", () => {
    expect(hFromBM(2e-3, 100)).toBeCloseTo(2e-3 / MU_0 - 100, 4);
  });
  it("returns 0 when B = μ₀ M (all of B is supplied by the material)", () => {
    expect(hFromBM(MU_0 * 50, 50)).toBeCloseTo(0, 10);
  });
});

describe("linearMagnetization", () => {
  it("scales with susceptibility", () => {
    expect(linearMagnetization(1000, 2.5e-5)).toBeCloseTo(2.5e-2, 10);
  });
  it("returns 0 when χ_m is 0", () => {
    expect(linearMagnetization(1000, 0)).toBe(0);
  });
  it("flips sign for diamagnets (χ < 0)", () => {
    expect(linearMagnetization(1000, -9.5e-6)).toBeLessThan(0);
  });
});

describe("relativePermeability", () => {
  it("equals 1 in vacuum", () => {
    expect(relativePermeability(0)).toBe(1);
  });
  it("is slightly less than 1 for diamagnets (χ < 0)", () => {
    expect(relativePermeability(-1e-5)).toBeCloseTo(0.99999, 6);
  });
  it("is huge for soft iron (χ ~ 4000)", () => {
    expect(relativePermeability(4000)).toBe(4001);
  });
});

describe("absolutePermeability", () => {
  it("equals μ₀ in vacuum", () => {
    expect(absolutePermeability(0)).toBeCloseTo(MU_0, 15);
  });
  it("scales linearly with (1 + χ)", () => {
    expect(absolutePermeability(1)).toBeCloseTo(2 * MU_0, 15);
  });
});

describe("bFromHLinear", () => {
  it("B = μ₀ H in vacuum", () => {
    expect(bFromHLinear(1000, 0)).toBeCloseTo(MU_0 * 1000, 10);
  });
  it("B > μ₀ H for paramagnet (χ > 0)", () => {
    expect(bFromHLinear(1000, 1e-3)).toBeGreaterThan(MU_0 * 1000);
  });
  it("B < μ₀ H for diamagnet (χ < 0)", () => {
    expect(bFromHLinear(1000, -1e-5)).toBeLessThan(MU_0 * 1000);
  });
});

describe("curieSusceptibility", () => {
  it("follows 1/T", () => {
    const chi100 = curieSusceptibility(100, 1e-3);
    const chi200 = curieSusceptibility(200, 1e-3);
    expect(chi200 / chi100).toBeCloseTo(0.5, 10);
  });
  it("throws on non-positive temperature", () => {
    expect(() => curieSusceptibility(0, 1)).toThrow();
    expect(() => curieSusceptibility(-10, 1)).toThrow();
  });
});

describe("curieWeissSusceptibility", () => {
  it("reduces toward Curie's law for T ≫ T_c", () => {
    const C = 1e-3;
    const Tc = 100;
    const chiFar = curieWeissSusceptibility(10000, C, Tc);
    const curieFar = curieSusceptibility(10000, C);
    // Relative error shrinks to T_c / T ≈ 1%
    expect(Math.abs(chiFar - curieFar) / curieFar).toBeLessThan(0.02);
  });
  it("diverges as T approaches T_c from above", () => {
    const chi = curieWeissSusceptibility(100.001, 1e-3, 100);
    expect(chi).toBeGreaterThan(curieSusceptibility(200, 1e-3));
  });
  it("returns Infinity at or below T_c (ordered phase, no linear law)", () => {
    expect(curieWeissSusceptibility(100, 1, 100)).toBe(
      Number.POSITIVE_INFINITY,
    );
    expect(curieWeissSusceptibility(50, 1, 100)).toBe(
      Number.POSITIVE_INFINITY,
    );
  });
});
