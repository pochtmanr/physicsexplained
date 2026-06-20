import { describe, it, expect } from "vitest";
import {
  gravTimeScale,
  shapiroOneWay,
  shapiroRoundTrip,
  coordinateLightSpeed,
  impactParameterFromAngle,
  earthVenusRoundTrip,
  delayDensity,
  toMicroseconds,
  GM_SUN,
  AU,
  R_SUN,
  C,
} from "@/lib/physics/relativity/shapiro-delay";

describe("shapiro-delay helpers", () => {
  it("gravTimeScale 2GM/c³ for the Sun is ≈ 9.85 μs", () => {
    const ts = gravTimeScale(GM_SUN);
    expect(toMicroseconds(ts)).toBeCloseTo(9.85, 1);
  });

  it("round trip is exactly twice one-way for identical geometry", () => {
    const r1 = AU;
    const r2 = 0.723 * AU;
    const b = R_SUN;
    expect(shapiroRoundTrip(r1, r2, b)).toBeCloseTo(2 * shapiroOneWay(r1, r2, b), 12);
  });

  it("Earth–Venus radar grazing the Sun gives the famous ~200 μs round trip", () => {
    const dt = earthVenusRoundTrip(R_SUN);
    const us = toMicroseconds(dt);
    // Historical figure quoted by Shapiro is ~200 μs; the log form lands ~240 μs
    // for a grazing ray. Bracket generously.
    expect(us).toBeGreaterThan(150);
    expect(us).toBeLessThan(300);
  });

  it("delay grows as the impact parameter shrinks (closer to the mass = more delay)", () => {
    const r1 = AU;
    const r2 = 0.723 * AU;
    const near = shapiroOneWay(r1, r2, R_SUN);
    const far = shapiroOneWay(r1, r2, 0.5 * AU);
    expect(near).toBeGreaterThan(far);
  });

  it("delay depends on b only logarithmically: halving b adds a fixed increment", () => {
    const r1 = AU;
    const r2 = AU;
    const d1 = shapiroOneWay(r1, r2, R_SUN);
    const d2 = shapiroOneWay(r1, r2, R_SUN / 2);
    // Δ = (2GM/c³)·ln(4) when b halves (two factors of b² in the log).
    const expectedIncrement = gravTimeScale() * Math.log(4);
    expect(d2 - d1).toBeCloseTo(expectedIncrement, 9);
  });

  it("rejects impact parameter larger than an endpoint radius", () => {
    expect(() => shapiroOneWay(R_SUN, AU, 2 * AU)).toThrow();
  });

  it("rejects non-positive impact parameter", () => {
    expect(() => shapiroOneWay(AU, AU, 0)).toThrow();
  });

  it("coordinate light speed is below c near the mass and approaches c far away", () => {
    const rs = (2 * GM_SUN) / (C * C);
    const near = coordinateLightSpeed(10 * rs);
    const far = coordinateLightSpeed(1e6 * rs);
    expect(near).toBeLessThan(far);
    expect(near).toBeLessThan(1);
    expect(far).toBeGreaterThan(0.99);
    // At r = 2 r_s the coordinate speed is exactly c/2 = 0.5 c.
    expect(coordinateLightSpeed(2 * rs)).toBeCloseTo(0.5, 6);
  });

  it("impactParameterFromAngle: a 0.25° offset at 1 AU is ~1 solar radius", () => {
    const theta = (0.25 * Math.PI) / 180;
    const b = impactParameterFromAngle(theta, AU);
    // 0.25° at 1 AU ≈ 6.5e8 m, close to one solar radius (6.96e8 m).
    expect(b / R_SUN).toBeGreaterThan(0.7);
    expect(b / R_SUN).toBeLessThan(1.3);
  });

  it("delayDensity is sharply peaked at closest approach (x=0)", () => {
    const b = R_SUN;
    const atClosest = delayDensity(0, b);
    const farOut = delayDensity(100 * b, b);
    expect(atClosest).toBeGreaterThan(farOut * 50);
  });

  it("toMicroseconds converts seconds to μs", () => {
    expect(toMicroseconds(1e-6)).toBeCloseTo(1, 12);
  });
});
