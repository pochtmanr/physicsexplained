import { describe, it, expect } from "vitest";
import {
  electricFieldAtPoint,
  electricFieldFromSource,
  sampleField,
} from "@/lib/physics/electric-field";
import { K_COULOMB } from "@/lib/physics/constants";

describe("electricFieldAtPoint", () => {
  it("doubles when the source charge doubles", () => {
    const point = { x: 1, y: 0 };
    const e1 = electricFieldAtPoint([{ q: 1e-9, x: 0, y: 0 }], point);
    const e2 = electricFieldAtPoint([{ q: 2e-9, x: 0, y: 0 }], point);
    expect(e2.x).toBeCloseTo(2 * e1.x, 12);
    expect(e2.y).toBeCloseTo(2 * e1.y, 12);
  });

  it("falls off as 1/r² — moving 2× farther reduces |E| by 4×", () => {
    const source = { q: 1e-9, x: 0, y: 0 };
    const near = electricFieldAtPoint([source], { x: 1, y: 0 });
    const far = electricFieldAtPoint([source], { x: 2, y: 0 });
    const magNear = Math.hypot(near.x, near.y);
    const magFar = Math.hypot(far.x, far.y);
    expect(magNear / magFar).toBeCloseTo(4, 10);
  });

  it("on a dipole's perpendicular bisector, E is anti-parallel to the dipole moment", () => {
    // +q at (-1, 0), −q at (+1, 0). Dipole moment p runs from − to +,
    // i.e. p = (-2q, 0) — points in the −x direction.
    // On the perpendicular bisector (the y-axis) the standard result is
    // E ∥ −p, so E points in the +x direction with E_y = 0.
    const sources = [
      { q: 1e-9, x: -1, y: 0 },
      { q: -1e-9, x: 1, y: 0 },
    ];
    const point = { x: 0, y: 1 };
    const e = electricFieldAtPoint(sources, point);
    expect(e.y).toBeCloseTo(0, 12);
    expect(e.x).toBeGreaterThan(0);
    // Each charge sits at distance r = √2 from the field point; the surviving
    // x-component is the sum of two equal contributions of (k·q / r²)·(1/√2)
    // = k·q / (√2)³. Two of them gives 2·k·q / (√2)³ = k·q · √2 / 2.
    const expectedEx = (2 * K_COULOMB * 1e-9) / Math.pow(Math.sqrt(2), 3);
    expect(e.x).toBeCloseTo(expectedEx, 12);
  });

  it("single-source helper agrees with k·q / r²", () => {
    const e = electricFieldFromSource({ q: 1e-9, x: 0, y: 0 }, { x: 3, y: 4 });
    const r = 5;
    const expectedMag = (K_COULOMB * 1e-9) / (r * r);
    expect(Math.hypot(e.x, e.y)).toBeCloseTo(expectedMag, 12);
    // Direction is radially outward — the unit vector is (3/5, 4/5).
    expect(e.x / Math.hypot(e.x, e.y)).toBeCloseTo(3 / 5, 12);
    expect(e.y / Math.hypot(e.x, e.y)).toBeCloseTo(4 / 5, 12);
  });

  it("sampleField returns a (gridSize+1) × (gridSize+1) grid", () => {
    const grid = sampleField([{ q: 1e-9, x: 0, y: 0 }], {
      xMin: -1,
      yMin: -1,
      xMax: 1,
      yMax: 1,
      gridSize: 4,
    });
    expect(grid.length).toBe(5);
    expect(grid[0]!.length).toBe(5);
  });

  it("returns zero at the singularity rather than NaN", () => {
    const e = electricFieldAtPoint([{ q: 1e-9, x: 0, y: 0 }], { x: 0, y: 0 });
    expect(e.x).toBe(0);
    expect(e.y).toBe(0);
  });
});
