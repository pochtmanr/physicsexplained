import { describe, expect, it } from "vitest";
import { g_SI } from "@/lib/physics/constants";
import {
  apparentGravityInFreelyFallingFrame,
  tidalAccelerationOverSeparation,
  elevatorFallTime,
  elevatorFallVelocity,
  EARTH_RADIUS_M,
} from "@/lib/physics/relativity/elevator";

describe("apparentGravityInFreelyFallingFrame", () => {
  it("free-fall cancels gravity exactly: a_lab = g_field → g_apparent = 0", () => {
    expect(apparentGravityInFreelyFallingFrame(9.81, 9.81)).toBe(0);
    expect(apparentGravityInFreelyFallingFrame(g_SI, g_SI)).toBe(0);
  });

  it("a stationary lab feels the full gravitational field", () => {
    expect(apparentGravityInFreelyFallingFrame(9.81, 0)).toBe(9.81);
  });

  it("a lab accelerating opposite to g doubles the apparent g", () => {
    // a_lab = -g_field (lab pushed upward) → g_apparent = g_field - (-g_field) = 2 g_field
    expect(apparentGravityInFreelyFallingFrame(9.81, -9.81)).toBeCloseTo(19.62, 6);
  });

  it("reverse equivalence: a rocket at a_lab = -g in deep space (g_field = 0) mimics surface gravity g", () => {
    // Lab in deep space (no gravity): g_field = 0. Lab accelerating "downward" at -g
    // (i.e., the rocket floor pushes upward at +g) → apparent g = 0 - (-9.81) = 9.81.
    expect(apparentGravityInFreelyFallingFrame(0, -9.81)).toBeCloseTo(9.81, 6);
  });

  it("is linear in both arguments", () => {
    const r1 = apparentGravityInFreelyFallingFrame(10, 3);
    const r2 = apparentGravityInFreelyFallingFrame(20, 6);
    expect(r2).toBeCloseTo(2 * r1, 10);
  });
});

describe("tidalAccelerationOverSeparation", () => {
  it("1 m radial separation at Earth's surface gives Δa ≈ −3.08 × 10⁻⁶ m/s² (small but nonzero)", () => {
    // Δa = -2 × 9.80665 × 1 / 6.371e6 ≈ -3.078 × 10⁻⁶
    const deltaA = tidalAccelerationOverSeparation(1);
    expect(deltaA).toBeLessThan(-3.0e-6);
    expect(deltaA).toBeGreaterThan(-3.2e-6);
  });

  it("zero separation gives zero tidal acceleration", () => {
    expect(tidalAccelerationOverSeparation(0)).toBeCloseTo(0, 12);
  });

  it("scales linearly in separation", () => {
    const a1 = tidalAccelerationOverSeparation(1);
    const a10 = tidalAccelerationOverSeparation(10);
    expect(a10).toBeCloseTo(10 * a1, 12);
  });

  it("reverses sign under deltaR → -deltaR (the elevator-equivalence breaks symmetrically)", () => {
    expect(tidalAccelerationOverSeparation(-5)).toBeCloseTo(
      -tidalAccelerationOverSeparation(5),
      12,
    );
  });

  it("scales as 1/R for fixed deltaR (the tide is steeper closer to the source)", () => {
    const aSurface = tidalAccelerationOverSeparation(1, EARTH_RADIUS_M);
    const aHalf = tidalAccelerationOverSeparation(1, EARTH_RADIUS_M / 2);
    expect(aHalf).toBeCloseTo(2 * aSurface, 12);
  });

  it("throws on non-positive R", () => {
    expect(() => tidalAccelerationOverSeparation(1, 0)).toThrow(RangeError);
    expect(() => tidalAccelerationOverSeparation(1, -1e6)).toThrow(RangeError);
  });
});

describe("elevatorFallTime", () => {
  it("10 m drop at Earth's surface ≈ 1.428 s", () => {
    // t = sqrt(2 × 10 / 9.80665) ≈ 1.4278 s
    const t = elevatorFallTime(10);
    expect(t).toBeGreaterThan(1.42);
    expect(t).toBeLessThan(1.44);
  });

  it("zero drop takes zero time", () => {
    expect(elevatorFallTime(0)).toBe(0);
  });

  it("scales as √h (doubling drop multiplies time by √2)", () => {
    const t1 = elevatorFallTime(5);
    const t2 = elevatorFallTime(10);
    expect(t2 / t1).toBeCloseTo(Math.SQRT2, 10);
  });

  it("inverse-scales as √g (Moon's surface, g ≈ 1.625 m/s², slows fall by √(g_E/g_M))", () => {
    const tEarth = elevatorFallTime(10);
    const tMoon = elevatorFallTime(10, 1.625);
    expect(tMoon / tEarth).toBeCloseTo(Math.sqrt(g_SI / 1.625), 6);
  });

  it("throws on negative drop", () => {
    expect(() => elevatorFallTime(-1)).toThrow(RangeError);
  });

  it("throws on non-positive g", () => {
    expect(() => elevatorFallTime(10, 0)).toThrow(RangeError);
    expect(() => elevatorFallTime(10, -9.81)).toThrow(RangeError);
  });
});

describe("elevatorFallVelocity", () => {
  it("after 1 s of free-fall, v ≈ g_SI ≈ 9.807 m/s", () => {
    expect(elevatorFallVelocity(1)).toBeCloseTo(g_SI, 6);
  });

  it("zero time → zero velocity (released from rest)", () => {
    expect(elevatorFallVelocity(0)).toBe(0);
  });

  it("is linear in t (constant proper acceleration before SR effects matter)", () => {
    const v1 = elevatorFallVelocity(1);
    const v3 = elevatorFallVelocity(3);
    expect(v3).toBeCloseTo(3 * v1, 10);
  });

  it("kinematic consistency: v(t) × t / 2 reproduces h via h = ½ g t² (sanity round-trip)", () => {
    const t = elevatorFallTime(10);
    const v = elevatorFallVelocity(t);
    const hRecovered = (v * t) / 2;
    expect(hRecovered).toBeCloseTo(10, 6);
  });

  it("throws on negative time", () => {
    expect(() => elevatorFallVelocity(-1)).toThrow(RangeError);
  });
});

describe("EARTH_RADIUS_M", () => {
  it("matches the IUGG mean volumetric radius of 6371 km within 1 km", () => {
    expect(EARTH_RADIUS_M).toBeGreaterThan(6.370e6);
    expect(EARTH_RADIUS_M).toBeLessThan(6.372e6);
  });
});
