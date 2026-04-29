import { describe, expect, it } from "vitest";
import {
  galileanCAdd,
  einsteinCAdd,
  compareAtVariousV,
  postulatesAgreeAt,
} from "@/lib/physics/relativity/postulates";
import { SPEED_OF_LIGHT } from "@/lib/physics/constants";

describe("galileanCAdd", () => {
  it("returns c at v = 0 (observer at rest agrees with the source)", () => {
    expect(galileanCAdd(SPEED_OF_LIGHT, 0)).toBeCloseTo(SPEED_OF_LIGHT, 6);
  });

  it("returns c − v for an observer moving with the light (Galilean subtraction)", () => {
    const c = SPEED_OF_LIGHT;
    expect(galileanCAdd(c, 0.5 * c)).toBeCloseTo(0.5 * c, 6);
    expect(galileanCAdd(c, 0.99 * c)).toBeCloseTo(0.01 * c, 6);
  });

  it("crashes through zero at v = c (the prediction Michelson-Morley failed to find)", () => {
    expect(galileanCAdd(SPEED_OF_LIGHT, SPEED_OF_LIGHT)).toBeCloseTo(0, 6);
  });
});

describe("einsteinCAdd", () => {
  it("returns c at v = 0", () => {
    expect(einsteinCAdd(SPEED_OF_LIGHT, 0)).toBe(SPEED_OF_LIGHT);
  });

  it("returns c at any sub-luminal v — the postulate, as a function", () => {
    const c = SPEED_OF_LIGHT;
    for (const beta of [0.1, 0.3, 0.5, 0.9, -0.5, -0.99]) {
      expect(einsteinCAdd(c, beta * c)).toBe(c);
    }
  });

  it("throws at |v| ≥ c — no inertial observer can be at lightspeed", () => {
    const c = SPEED_OF_LIGHT;
    expect(() => einsteinCAdd(c, c)).toThrow(RangeError);
    expect(() => einsteinCAdd(c, -c)).toThrow(RangeError);
    expect(() => einsteinCAdd(c, 1.5 * c)).toThrow(RangeError);
  });
});

describe("compareAtVariousV", () => {
  it("agrees with both postulates only at β = 0", () => {
    const [sample] = compareAtVariousV(SPEED_OF_LIGHT, [0]);
    expect(sample.galilean).toBeCloseTo(SPEED_OF_LIGHT, 6);
    expect(sample.einstein).toBeCloseTo(SPEED_OF_LIGHT, 6);
  });

  it("disagrees at every β ≠ 0 in (−1, 1)", () => {
    const samples = compareAtVariousV(SPEED_OF_LIGHT, [0.1, 0.3, 0.5, 0.9, -0.4]);
    for (const s of samples) {
      // Einstein flat-lines at c; Galilean drops by βc.
      expect(s.einstein).toBeCloseTo(SPEED_OF_LIGHT, 6);
      expect(s.galilean).toBeCloseTo(SPEED_OF_LIGHT * (1 - s.beta), 6);
      expect(s.galilean).not.toBeCloseTo(s.einstein, 0);
    }
  });

  it("returns NaN for Einstein at the unphysical |β| ≥ 1 boundary, finite Galilean", () => {
    const samples = compareAtVariousV(1, [1, -1, 1.2]);
    for (const s of samples) {
      expect(Number.isNaN(s.einstein)).toBe(true);
      expect(Number.isFinite(s.galilean)).toBe(true);
    }
  });

  it("uses SPEED_OF_LIGHT by default", () => {
    const samples = compareAtVariousV(undefined, [0.5]);
    expect(samples[0].einstein).toBeCloseTo(SPEED_OF_LIGHT, 6);
    expect(samples[0].galilean).toBeCloseTo(0.5 * SPEED_OF_LIGHT, 6);
  });
});

describe("postulatesAgreeAt", () => {
  it("agrees only at β = 0 inside (−1, 1)", () => {
    expect(postulatesAgreeAt(0)).toBe(true);
    expect(postulatesAgreeAt(0.001)).toBe(false);
    expect(postulatesAgreeAt(0.5)).toBe(false);
    expect(postulatesAgreeAt(-0.5)).toBe(false);
  });

  it("returns false at the unphysical |β| ≥ 1 boundary", () => {
    expect(postulatesAgreeAt(1)).toBe(false);
    expect(postulatesAgreeAt(-1)).toBe(false);
    expect(postulatesAgreeAt(2)).toBe(false);
  });
});
