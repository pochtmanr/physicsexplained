import { describe, expect, it } from "vitest";
import {
  flux,
  inducedEmf,
  faradayDiskEmf,
} from "@/lib/physics/electromagnetism/faradays-law";

describe("flux", () => {
  it("reduces to B · A when the normal is parallel to B (θ = 0)", () => {
    expect(flux(2, 0.5, 0)).toBeCloseTo(1, 12);
  });

  it("vanishes when the loop is edge-on (θ = π/2)", () => {
    expect(flux(2, 0.5, Math.PI / 2)).toBeCloseTo(0, 12);
  });

  it("flips sign when the normal is antiparallel to B (θ = π)", () => {
    expect(flux(2, 0.5, Math.PI)).toBeCloseTo(-1, 12);
  });

  it("scales linearly with B and with area", () => {
    expect(flux(4, 0.5, 0)).toBeCloseTo(2, 12);
    expect(flux(2, 1.0, 0)).toBeCloseTo(2, 12);
  });
});

describe("inducedEmf", () => {
  it("is negative when the flux increases (Lenz)", () => {
    expect(inducedEmf(0, 1e-3, 0.01)).toBeCloseTo(-0.1, 12);
  });

  it("is positive when the flux decreases", () => {
    expect(inducedEmf(1e-3, 0, 0.01)).toBeCloseTo(0.1, 12);
  });

  it("multiplies by the number of turns", () => {
    const single = inducedEmf(0, 1e-3, 0.01, 1);
    const hundred = inducedEmf(0, 1e-3, 0.01, 100);
    expect(hundred / single).toBeCloseTo(100, 12);
  });

  it("scales inversely with dt", () => {
    const slow = inducedEmf(0, 1e-3, 0.02);
    const fast = inducedEmf(0, 1e-3, 0.01);
    expect(fast / slow).toBeCloseTo(2, 12);
  });

  it("throws when dt is non-positive", () => {
    expect(() => inducedEmf(0, 1, 0)).toThrow();
    expect(() => inducedEmf(0, 1, -0.01)).toThrow();
  });
});

describe("faradayDiskEmf", () => {
  it("gives exactly ½ at B=1, ω=1, R=1", () => {
    expect(faradayDiskEmf(1, 1, 1)).toBeCloseTo(0.5, 14);
  });

  it("is quadratic in R", () => {
    const small = faradayDiskEmf(1, 1, 0.1);
    const big = faradayDiskEmf(1, 1, 0.2);
    expect(big / small).toBeCloseTo(4, 12);
  });

  it("is linear in B and in ω", () => {
    const base = faradayDiskEmf(0.5, 10, 0.2);
    expect(faradayDiskEmf(1.0, 10, 0.2) / base).toBeCloseTo(2, 12);
    expect(faradayDiskEmf(0.5, 30, 0.2) / base).toBeCloseTo(3, 12);
  });

  it("returns zero when the disk is not spinning", () => {
    expect(faradayDiskEmf(1.5, 0, 0.2)).toBe(0);
  });
});
