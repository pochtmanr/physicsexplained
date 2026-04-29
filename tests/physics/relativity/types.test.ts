import { describe, expect, it } from "vitest";
import { gamma, boostX, boostY, boostZ, rotation, applyMatrix, pointToVec4, vec4ToPoint } from "@/lib/physics/relativity/types";
import type { Vec4 } from "@/lib/physics/relativity/types";

describe("gamma", () => {
  it("equals 1 at rest", () => {
    expect(gamma(0)).toBeCloseTo(1, 12);
  });

  it("≈ 1.005 at β = 0.1", () => {
    expect(gamma(0.1)).toBeCloseTo(1.0050378152592121, 10);
  });

  it("≈ 10 at β = 0.99499", () => {
    expect(gamma(0.99499)).toBeCloseTo(10.00255102582804, 4);
  });

  it("throws at |β| ≥ 1", () => {
    expect(() => gamma(1)).toThrow(RangeError);
    expect(() => gamma(-1.0001)).toThrow(RangeError);
  });
});

describe("boostX", () => {
  it("is identity at β = 0", () => {
    const M = boostX(0);
    expect(M[0][0]).toBeCloseTo(1, 12);
    expect(M[0][1]).toBeCloseTo(0, 12);
    expect(M[1][0]).toBeCloseTo(0, 12);
    expect(M[1][1]).toBeCloseTo(1, 12);
  });

  it("transforms (ct, 0, 0, 0) to γ(ct, -βct, 0, 0) — moving lab event", () => {
    const M = boostX(0.6);
    const v: Vec4 = [1, 0, 0, 0];
    const out = applyMatrix(M, v);
    expect(out[0]).toBeCloseTo(1.25, 8);
    expect(out[1]).toBeCloseTo(-0.75, 8);
    expect(out[2]).toBeCloseTo(0, 12);
    expect(out[3]).toBeCloseTo(0, 12);
  });

  it("preserves invariant interval (ct)² − x² − y² − z²", () => {
    const v: Vec4 = [2, 1, 0, 0];
    const M = boostX(0.5);
    const out = applyMatrix(M, v);
    const sIn = v[0] * v[0] - v[1] * v[1] - v[2] * v[2] - v[3] * v[3];
    const sOut = out[0] * out[0] - out[1] * out[1] - out[2] * out[2] - out[3] * out[3];
    expect(sOut).toBeCloseTo(sIn, 8);
  });
});

describe("boostY / boostZ", () => {
  it("boostY mixes (ct, y) and leaves x, z alone", () => {
    const M = boostY(0.5);
    const v: Vec4 = [1, 7, 0, 11];
    const out = applyMatrix(M, v);
    expect(out[1]).toBeCloseTo(7, 8);
    expect(out[3]).toBeCloseTo(11, 8);
  });

  it("boostZ mixes (ct, z) and leaves x, y alone", () => {
    const M = boostZ(0.5);
    const v: Vec4 = [1, 7, 11, 0];
    const out = applyMatrix(M, v);
    expect(out[1]).toBeCloseTo(7, 8);
    expect(out[2]).toBeCloseTo(11, 8);
  });
});

describe("rotation", () => {
  it("rotation(π/2, 'z') sends (1, 0) to (0, 1) in the x-y plane", () => {
    const M = rotation(Math.PI / 2, "z");
    const v: Vec4 = [0, 1, 0, 0];
    const out = applyMatrix(M, v);
    expect(out[1]).toBeCloseTo(0, 8);
    expect(out[2]).toBeCloseTo(1, 8);
  });

  it("preserves time component", () => {
    const M = rotation(0.7, "x");
    const v: Vec4 = [3, 1, 1, 1];
    const out = applyMatrix(M, v);
    expect(out[0]).toBeCloseTo(3, 12);
  });
});

describe("pointToVec4 / vec4ToPoint round trip", () => {
  it("roundtrips at c = 299792458", () => {
    const c = 299792458;
    const p = { t: 1.5e-9, x: 0.1, y: 0.2, z: -0.3 };
    const v = pointToVec4(p, c);
    const back = vec4ToPoint(v, c);
    expect(back.t).toBeCloseTo(p.t, 18);
    expect(back.x).toBeCloseTo(p.x, 12);
    expect(back.y).toBeCloseTo(p.y, 12);
    expect(back.z).toBeCloseTo(p.z, 12);
  });
});

import { intervalSquared, classifyInterval, restMass, minkowskiNormSquared } from "@/lib/physics/relativity/types";
import type { FourMomentum } from "@/lib/physics/relativity/types";

describe("minkowskiNormSquared", () => {
  it("is positive for a timelike Vec4", () => {
    // (ct, x, y, z) = (3, 1, 1, 1): 9 − 1 − 1 − 1 = 6
    const v: Vec4 = [3, 1, 1, 1];
    expect(minkowskiNormSquared(v)).toBeCloseTo(6, 12);
  });

  it("is negative for a spacelike Vec4", () => {
    // (1, 2, 0, 0): 1 − 4 = −3
    const v: Vec4 = [1, 2, 0, 0];
    expect(minkowskiNormSquared(v)).toBeCloseTo(-3, 12);
  });

  it("vanishes for a null Vec4", () => {
    // (5, 3, 4, 0): 25 − 9 − 16 = 0
    const v: Vec4 = [5, 3, 4, 0];
    expect(minkowskiNormSquared(v)).toBeCloseTo(0, 12);
  });
});

describe("intervalSquared", () => {
  const c = 1; // natural units for the algebra checks
  it("vanishes for two coincident events", () => {
    const p = { t: 0.5, x: 0.2, y: -0.3, z: 1.7 };
    expect(intervalSquared(p, p, c)).toBeCloseTo(0, 12);
  });

  it("is positive for timelike separation", () => {
    const p1 = { t: 0, x: 0, y: 0, z: 0 };
    const p2 = { t: 2, x: 1, y: 0, z: 0 };
    expect(intervalSquared(p1, p2, c)).toBeCloseTo(3, 8); // 4 − 1 = 3
  });

  it("is negative for spacelike separation", () => {
    const p1 = { t: 0, x: 0, y: 0, z: 0 };
    const p2 = { t: 1, x: 2, y: 0, z: 0 };
    expect(intervalSquared(p1, p2, c)).toBeCloseTo(-3, 8); // 1 − 4 = −3
  });

  it("vanishes on the light cone", () => {
    const p1 = { t: 0, x: 0, y: 0, z: 0 };
    const p2 = { t: 5, x: 5, y: 0, z: 0 };
    expect(intervalSquared(p1, p2, c)).toBeCloseTo(0, 8);
  });
});

describe("classifyInterval", () => {
  const c = 1;
  it("classifies timelike-future", () => {
    expect(classifyInterval({ t: 0, x: 0, y: 0, z: 0 }, { t: 2, x: 1, y: 0, z: 0 }, c)).toBe("timelike-future");
  });
  it("classifies timelike-past", () => {
    expect(classifyInterval({ t: 2, x: 1, y: 0, z: 0 }, { t: 0, x: 0, y: 0, z: 0 }, c)).toBe("timelike-past");
  });
  it("classifies spacelike", () => {
    expect(classifyInterval({ t: 0, x: 0, y: 0, z: 0 }, { t: 1, x: 2, y: 0, z: 0 }, c)).toBe("spacelike");
  });
  it("classifies null-future on the light cone", () => {
    expect(classifyInterval({ t: 0, x: 0, y: 0, z: 0 }, { t: 5, x: 5, y: 0, z: 0 }, c)).toBe("null-future");
  });
});

describe("restMass", () => {
  it("recovers electron rest mass from its four-momentum at rest (E = mc², p = 0)", () => {
    const c = 2.99792458e8;
    const m = 9.1093837015e-31; // electron mass kg
    const E = m * c * c;
    const p: FourMomentum = [E / c, 0, 0, 0];
    // m is ~9e-31 kg; relative tolerance < 1e-12 of that is comfortably within double precision.
    expect(restMass(p, c) / m).toBeCloseTo(1, 12);
  });

  it("vanishes for a photon (null four-momentum)", () => {
    const c = 1;
    const p: FourMomentum = [1, 1, 0, 0]; // E/c = px = 1
    expect(restMass(p, c)).toBeCloseTo(0, 12);
  });

  it("throws on a spacelike four-momentum", () => {
    const c = 1;
    const p: FourMomentum = [1, 2, 0, 0]; // E²/c² − p² = 1 − 4 = −3 < 0
    expect(() => restMass(p, c)).toThrow(RangeError);
  });
});
