import { describe, it, expect } from "vitest";
import {
  potentialAtPoint,
  potentialDifference,
} from "@/lib/physics/electric-potential";
import { K_COULOMB } from "@/lib/physics/constants";

describe("potentialAtPoint", () => {
  it("V at r = 1 m from a 1 C point charge equals K_COULOMB", () => {
    const v = potentialAtPoint(
      [{ q: 1, x: 0, y: 0 }],
      { x: 1, y: 0 },
    );
    expect(v).toBeCloseTo(K_COULOMB, 6);
  });

  it("V is zero on the perpendicular bisector of a symmetric dipole", () => {
    // +q at (-1, 0), −q at (+1, 0). Any point on the y-axis is equidistant
    // from both charges, so the two 1/r terms are equal and opposite.
    const sources = [
      { q: 1e-9, x: -1, y: 0 },
      { q: -1e-9, x: 1, y: 0 },
    ];
    for (const y of [-2, -0.5, 0, 0.5, 2, 7]) {
      const v = potentialAtPoint(sources, { x: 0, y });
      expect(v).toBeCloseTo(0, 12);
    }
  });

  it("falls off as 1/r — half the distance gives twice the potential", () => {
    const source = [{ q: 1e-9, x: 0, y: 0 }];
    const near = potentialAtPoint(source, { x: 0.5, y: 0 });
    const far = potentialAtPoint(source, { x: 1, y: 0 });
    expect(near / far).toBeCloseTo(2, 10);
  });

  it("superposes linearly across multiple sources", () => {
    const a = potentialAtPoint([{ q: 2e-9, x: 0, y: 0 }], { x: 1, y: 0 });
    const b = potentialAtPoint([{ q: 3e-9, x: 0, y: 0 }], { x: 1, y: 0 });
    const sum = potentialAtPoint(
      [
        { q: 2e-9, x: 0, y: 0 },
        { q: 3e-9, x: 0, y: 0 },
      ],
      { x: 1, y: 0 },
    );
    expect(sum).toBeCloseTo(a + b, 12);
  });

  it("returns Infinity at the location of a positive source rather than NaN", () => {
    const v = potentialAtPoint([{ q: 1e-9, x: 0, y: 0 }], { x: 0, y: 0 });
    expect(v).toBe(Infinity);
  });
});

describe("potentialDifference", () => {
  it("matches V(a) − V(b) computed directly", () => {
    const sources = [
      { q: 1e-9, x: -1, y: 0 },
      { q: -1e-9, x: 1, y: 0 },
    ];
    const a = { x: -0.5, y: 0.3 };
    const b = { x: 0.6, y: -0.2 };
    const dv = potentialDifference(sources, a, b);
    const va = potentialAtPoint(sources, a);
    const vb = potentialAtPoint(sources, b);
    expect(dv).toBeCloseTo(va - vb, 12);
  });

  it("is path-independent — V is a function of position, not route", () => {
    // For a single + source at the origin, V(r) = k·q / r.
    // Pick endpoints a = (3, 0) m and b = (0, 4) m.
    // V(a) − V(b) must equal k·q · (1/3 − 1/4) regardless of how the test
    // charge actually walked between them, because V depends only on the
    // endpoint positions.
    const sources = [{ q: 1e-9, x: 0, y: 0 }];
    const a = { x: 3, y: 0 };
    const b = { x: 0, y: 4 };
    const expected = K_COULOMB * 1e-9 * (1 / 3 - 1 / 4);
    expect(potentialDifference(sources, a, b)).toBeCloseTo(expected, 14);
  });

  it("is antisymmetric: V(a)−V(b) = −(V(b)−V(a))", () => {
    const sources = [
      { q: 4e-9, x: 0.1, y: -0.2 },
      { q: -2e-9, x: -0.4, y: 0.5 },
    ];
    const a = { x: 1, y: 1 };
    const b = { x: -1, y: 0.3 };
    const ab = potentialDifference(sources, a, b);
    const ba = potentialDifference(sources, b, a);
    expect(ab).toBeCloseTo(-ba, 12);
  });
});
