import { describe, expect, it } from "vitest";
import {
  relativisticVelocityAdd,
  relativisticVelocitySubtract,
  galileanLimit,
  fresnelDragCoefficient,
  fresnelLinearApproximation,
  partialDraggingFizeau,
  twoRocketEarthFrameVelocity,
  REFRACTIVE_INDEX_WATER,
  REFRACTIVE_INDEX_GLASS,
  FIZEAU_1851_WATER_SPEED,
} from "@/lib/physics/relativity/velocity-addition";
import { SPEED_OF_LIGHT } from "@/lib/physics/constants";

describe("relativisticVelocityAdd", () => {
  it("reduces to Galilean addition at low speeds (boat-on-river precision)", () => {
    // 5 m/s + 3 m/s — relativistic correction is ~10⁻¹⁶, dominated by float noise.
    const u = relativisticVelocityAdd(5, 3);
    expect(u).toBeCloseTo(8, 12);
  });

  it("c + v = c for any sub-luminal v (Einstein's second postulate, encoded)", () => {
    for (const v of [0, 1e3, 0.3 * SPEED_OF_LIGHT, 0.99 * SPEED_OF_LIGHT]) {
      const u = relativisticVelocityAdd(SPEED_OF_LIGHT, v);
      expect(u).toBeCloseTo(SPEED_OF_LIGHT, 6);
    }
  });

  it("c + c = c (light, uniquely, refuses to add)", () => {
    expect(relativisticVelocityAdd(SPEED_OF_LIGHT, SPEED_OF_LIGHT)).toBeCloseTo(
      SPEED_OF_LIGHT,
      6,
    );
  });

  it("the two-rockets canonical: 0.6c + 0.6c → 0.882c, NOT 1.2c", () => {
    const c = SPEED_OF_LIGHT;
    const u = relativisticVelocityAdd(0.6 * c, 0.6 * c);
    // Closed form: 1.2/1.36 c ≈ 0.88235c.
    expect(u / c).toBeCloseTo(1.2 / 1.36, 12);
    expect(u / c).toBeGreaterThan(0.88);
    expect(u / c).toBeLessThan(0.89);
    // And NOT the Galilean answer.
    const galilean = galileanLimit(0.6 * c, 0.6 * c);
    expect(galilean / c).toBeCloseTo(1.2, 12);
    // Confirm the discrepancy between Galilean and Einstein is sizable here.
    expect(galilean - u).toBeGreaterThan(0.3 * c);
  });

  it("is symmetric: u' + v = v + u' (relativistic boosts in 1D commute)", () => {
    const c = SPEED_OF_LIGHT;
    const a = relativisticVelocityAdd(0.4 * c, 0.7 * c);
    const b = relativisticVelocityAdd(0.7 * c, 0.4 * c);
    expect(a).toBeCloseTo(b, 12);
  });

  it("two sub-luminal velocities never compose to super-luminal", () => {
    const c = SPEED_OF_LIGHT;
    for (const u of [0.5 * c, 0.9 * c, 0.99 * c, 0.999 * c]) {
      for (const v of [0.5 * c, 0.9 * c, 0.99 * c, 0.999 * c]) {
        const r = relativisticVelocityAdd(u, v);
        expect(r).toBeLessThan(c);
        expect(Math.abs(r)).toBeLessThan(c);
      }
    }
  });

  it("identity at zero: 0 + v = v and u' + 0 = u'", () => {
    expect(relativisticVelocityAdd(0, 12345)).toBeCloseTo(12345, 9);
    expect(relativisticVelocityAdd(12345, 0)).toBeCloseTo(12345, 9);
  });

  it("anti-symmetry: u' + (−u') = 0 for any u' (relativistic group inverse)", () => {
    const c = SPEED_OF_LIGHT;
    for (const u of [0.1 * c, 0.5 * c, 0.99 * c]) {
      const r = relativisticVelocityAdd(u, -u);
      expect(Math.abs(r)).toBeLessThan(1e-6);
    }
  });

  it("throws on super-luminal inputs (|·| > c is unphysical)", () => {
    const c = SPEED_OF_LIGHT;
    expect(() => relativisticVelocityAdd(1.01 * c, 0.5 * c)).toThrow(RangeError);
    expect(() => relativisticVelocityAdd(0.5 * c, 1.01 * c)).toThrow(RangeError);
    expect(() => relativisticVelocityAdd(0.5 * c, 0.5 * c, 0)).toThrow(
      RangeError,
    );
  });

  it("relativisticVelocitySubtract is the inverse of Add", () => {
    const c = SPEED_OF_LIGHT;
    const v = 0.5 * c;
    const uPrime = 0.3 * c;
    const u = relativisticVelocityAdd(uPrime, v);
    const back = relativisticVelocitySubtract(u, v);
    expect(back).toBeCloseTo(uPrime, 6);
  });
});

describe("Fresnel partial-dragging coefficient (Fizeau 1851)", () => {
  it("water n = 1.33 gives drag coefficient ≈ 0.4347", () => {
    const eta = fresnelDragCoefficient(REFRACTIVE_INDEX_WATER);
    // 1 − 1/1.33² = 1 − 1/1.7689 = 1 − 0.5654… ≈ 0.4347
    expect(eta).toBeCloseTo(1 - 1 / (1.33 * 1.33), 12);
    expect(eta).toBeGreaterThan(0.43);
    expect(eta).toBeLessThan(0.44);
  });

  it("glass n = 1.5 gives drag coefficient ≈ 0.5556", () => {
    const eta = fresnelDragCoefficient(REFRACTIVE_INDEX_GLASS);
    expect(eta).toBeCloseTo(1 - 1 / 2.25, 12);
  });

  it("vacuum n = 1 gives zero drag (light cannot be dragged in vacuum)", () => {
    expect(fresnelDragCoefficient(1)).toBe(0);
  });

  it("throws on non-positive refractive index", () => {
    expect(() => fresnelDragCoefficient(0)).toThrow(RangeError);
    expect(() => fresnelDragCoefficient(-1)).toThrow(RangeError);
  });
});

describe("partialDraggingFizeau — relativistic addition produces Fresnel", () => {
  it("at Fizeau's 1851 water speed (~7 m/s) matches the Fresnel linear approximation to 10⁻¹²", () => {
    const full = partialDraggingFizeau(
      REFRACTIVE_INDEX_WATER,
      FIZEAU_1851_WATER_SPEED,
    );
    const linear = fresnelLinearApproximation(
      REFRACTIVE_INDEX_WATER,
      FIZEAU_1851_WATER_SPEED,
    );
    // Relative discrepancy at 7 m/s vs c is ~10⁻¹⁶.
    expect(Math.abs(full - linear) / full).toBeLessThan(1e-12);
  });

  it("the v/c-order coefficient extracted from the relativistic curve equals 1 − 1/n²", () => {
    // Numerically extract the coefficient: u = c/n + η · v + O(v²/c).
    // Use a small but non-trivial v_water to avoid float-cancellation noise.
    // At v = 1 km/s the O(v²/c) tail is below 10⁻⁹ relative to η, so the
    // extracted slope agrees with the closed-form Fresnel coefficient to
    // many digits; tightening v further would push us into float-noise
    // territory.
    const n = REFRACTIVE_INDEX_WATER;
    const vWater = 1e3;
    const u = partialDraggingFizeau(n, vWater);
    const coefficient = (u - SPEED_OF_LIGHT / n) / vWater;
    const expected = 1 - 1 / (n * n);
    expect(coefficient).toBeCloseTo(expected, 5);
  });

  it("at v_water = 0, light moves at c/n (the standard rest-frame answer)", () => {
    const u = partialDraggingFizeau(REFRACTIVE_INDEX_WATER, 0);
    expect(u).toBeCloseTo(SPEED_OF_LIGHT / REFRACTIVE_INDEX_WATER, 9);
  });
});

describe("twoRocketEarthFrameVelocity (the §02.4 money number)", () => {
  it("Rocket A at 0.6c, fires Rocket B at 0.6c forward → Earth sees 0.882c", () => {
    const c = SPEED_OF_LIGHT;
    const u = twoRocketEarthFrameVelocity(0.6 * c, 0.6 * c);
    expect(u / c).toBeCloseTo(0.88235, 4);
  });

  it("Galilean over-prediction is large: 1.2c vs 0.882c — gap of ~0.318c", () => {
    const c = SPEED_OF_LIGHT;
    const galilean = galileanLimit(0.6 * c, 0.6 * c);
    const einstein = twoRocketEarthFrameVelocity(0.6 * c, 0.6 * c);
    expect((galilean - einstein) / c).toBeGreaterThan(0.3);
  });
});
