import { describe, it, expect } from "vitest";
import {
  imageChargeForPlane,
  imageChargeForSphere,
  forceOnRealCharge,
} from "@/lib/physics/method-of-images";
import { K_COULOMB } from "@/lib/physics/constants";

describe("imageChargeForPlane", () => {
  it("mirrors a unit + charge to a unit − charge below the plane", () => {
    expect(imageChargeForPlane(1, 1)).toEqual({ q: -1, x: 0, y: -1 });
  });

  it("mirrors a − charge to a + charge below the plane", () => {
    expect(imageChargeForPlane(-2, 3)).toEqual({ q: 2, x: 0, y: -3 });
  });

  it("scales the height linearly", () => {
    const img = imageChargeForPlane(5, 7);
    expect(img.q).toBe(-5);
    expect(img.x).toBe(0);
    expect(img.y).toBe(-7);
  });
});

describe("imageChargeForSphere", () => {
  it("matches Kelvin's formula q' = −qR/a, d' = R²/a", () => {
    expect(imageChargeForSphere(1, 2, 1)).toEqual({ q: -0.5, distance: 0.5 });
  });

  it("places the image deep inside the sphere when the real charge is far away", () => {
    const img = imageChargeForSphere(1, 100, 1);
    expect(img.distance).toBeCloseTo(0.01, 12);
    expect(img.q).toBeCloseTo(-0.01, 12);
  });

  it("approaches a point-charge mirror as the real charge nears the surface", () => {
    // a → R⁺ : image charge → -q, sitting just inside the surface (≈R).
    const R = 1;
    const a = 1.0001;
    const img = imageChargeForSphere(1, a, R);
    expect(img.q).toBeCloseTo(-1, 3);
    expect(img.distance).toBeCloseTo(R, 3);
  });
});

describe("forceOnRealCharge", () => {
  it("is attractive (negative) and equals -K_COULOMB / 4 for q=1, d=1", () => {
    // The real charge feels its image at distance 2d = 2, so |F| = k·q²/(2d)²
    //  = k / 4.  The force pulls it toward the plane → negative.
    expect(forceOnRealCharge(1, 1)).toBeCloseTo(-K_COULOMB / 4, 5);
  });

  it("falls off as 1/d² (doubling d → 1/4 the force)", () => {
    const fNear = forceOnRealCharge(1, 1);
    const fFar = forceOnRealCharge(1, 2);
    expect(fFar / fNear).toBeCloseTo(0.25, 6);
  });

  it("is independent of the sign of q (q² in the formula)", () => {
    expect(forceOnRealCharge(2, 1)).toBeCloseTo(forceOnRealCharge(-2, 1), 12);
  });
});
