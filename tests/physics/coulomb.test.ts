import { describe, expect, it } from "vitest";
import { coulombForce, superpose } from "@/lib/physics/coulomb";
import { K_COULOMB } from "@/lib/physics/constants";

describe("coulombForce", () => {
  it("returns zero when coincident", () => {
    const f = coulombForce({ q: 1, x: 0, y: 0 }, { q: 1, x: 0, y: 0 });
    expect(f).toEqual({ x: 0, y: 0 });
  });

  it("repels like charges along the axis", () => {
    const f = coulombForce({ q: 1, x: 0, y: 0 }, { q: 1, x: 1, y: 0 });
    expect(f.x).toBeCloseTo(K_COULOMB, 5);
    expect(f.y).toBeCloseTo(0, 10);
  });

  it("attracts opposite charges", () => {
    const f = coulombForce({ q: 1, x: 0, y: 0 }, { q: -1, x: 1, y: 0 });
    expect(f.x).toBeCloseTo(-K_COULOMB, 5);
  });

  it("falls as 1/r² (doubling r → 1/4 the force)", () => {
    const near = coulombForce({ q: 1, x: 0, y: 0 }, { q: 1, x: 1, y: 0 });
    const far = coulombForce({ q: 1, x: 0, y: 0 }, { q: 1, x: 2, y: 0 });
    expect(far.x / near.x).toBeCloseTo(0.25, 5);
  });
});

describe("superpose", () => {
  it("cancels symmetrically", () => {
    const sources = [
      { q: 1, x: -1, y: 0 },
      { q: 1, x: 1, y: 0 },
    ];
    const f = superpose(sources, { q: 1, x: 0, y: 0 });
    expect(f.x).toBeCloseTo(0, 5);
    expect(f.y).toBeCloseTo(0, 5);
  });
});
