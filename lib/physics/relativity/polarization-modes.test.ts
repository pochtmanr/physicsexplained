import { describe, it, expect } from "vitest";
import {
  strainAmplitudes,
  deformedPosition,
  deformedRing,
  principalAxisAngle,
  symmetryAngle,
  quadrupoleStrain,
  massDipole,
  type Vec2,
} from "./polarization-modes";

describe("strainAmplitudes", () => {
  it("plus mode oscillates only in h₊", () => {
    const a = strainAmplitudes("plus", 0.4, 0);
    expect(a.hPlus).toBeCloseTo(0.4, 12);
    expect(a.hCross).toBe(0);
  });

  it("cross mode oscillates only in h×", () => {
    const a = strainAmplitudes("cross", 0.4, 0);
    expect(a.hPlus).toBe(0);
    expect(a.hCross).toBeCloseTo(0.4, 12);
  });

  it("circular mode keeps |h|² constant in time", () => {
    const h = 0.3;
    for (const phase of [0, 0.7, 1.9, 4.2]) {
      const a = strainAmplitudes("circular", h, phase);
      expect(a.hPlus * a.hPlus + a.hCross * a.hCross).toBeCloseTo(h * h, 12);
    }
  });
});

describe("deformedPosition", () => {
  it("returns the rest position when the strain is zero", () => {
    const p = deformedPosition(Math.PI / 3, 10, 0, 0);
    expect(p.x).toBeCloseTo(10 * Math.cos(Math.PI / 3), 12);
    expect(p.y).toBeCloseTo(10 * Math.sin(Math.PI / 3), 12);
  });

  it("plus mode stretches +x and squeezes +y by ±½hL", () => {
    const h = 0.2;
    const L = 10;
    // mass on +x axis (θ = 0): δr_x = +½ h L
    const px = deformedPosition(0, L, h, 0);
    expect(px.x).toBeCloseTo(L + 0.5 * h * L, 12);
    expect(px.y).toBeCloseTo(0, 12);
    // mass on +y axis (θ = π/2): δr_y = −½ h L
    const py = deformedPosition(Math.PI / 2, L, h, 0);
    expect(py.x).toBeCloseTo(0, 12);
    expect(py.y).toBeCloseTo(L - 0.5 * h * L, 12);
  });

  it("cross mode acts like plus rotated by 45°", () => {
    const h = 0.2;
    const L = 10;
    // pure cross at θ = 45° behaves like pure plus at θ = 0 (max stretch)
    const pc = deformedPosition(Math.PI / 4, L, 0, h);
    const r = Math.hypot(pc.x, pc.y);
    expect(r).toBeCloseTo(L + 0.5 * h * L, 6);
  });
});

describe("deformedRing", () => {
  it("produces the requested number of masses", () => {
    const ring = deformedRing(12, 10, 0.1, 0);
    expect(ring).toHaveLength(12);
  });

  it("conserves area to first order (volume-preserving TT strain)", () => {
    // The plus deformation stretches one axis and squeezes the other by the
    // same factor, so the bounding ellipse area is unchanged to O(h²).
    const ring = deformedRing(360, 10, 0.05, 0);
    const xs = ring.map((p) => p.x);
    const ys = ring.map((p) => p.y);
    const a = (Math.max(...xs) - Math.min(...xs)) / 2;
    const b = (Math.max(...ys) - Math.min(...ys)) / 2;
    const area = Math.PI * a * b;
    const restArea = Math.PI * 10 * 10;
    expect(area).toBeCloseTo(restArea, 1);
  });
});

describe("principalAxisAngle", () => {
  it("is 0 for pure plus and 45° for pure cross", () => {
    expect(principalAxisAngle(1, 0)).toBeCloseTo(0, 12);
    expect(principalAxisAngle(0, 1)).toBeCloseTo(Math.PI / 4, 12);
  });
});

describe("symmetryAngle", () => {
  it("spin-1 returns 180°, spin-2 returns 90° (half the recurrence turn)", () => {
    // ψ-recurrence is π/s: photon recurs at π (180°), graviton at π/2 (90°)
    expect(symmetryAngle(1)).toBeCloseTo(Math.PI, 12);
    expect(symmetryAngle(2)).toBeCloseTo(Math.PI / 2, 12);
  });
});

describe("quadrupoleStrain", () => {
  it("gives strain ~10⁻²¹ for a stellar-mass binary at cosmological distance", () => {
    const Msun = 1.989e30;
    const Mpc = 3.086e22;
    // ~30 M☉, v ~ 0.5c, ~400 Mpc — GW150914-scale
    const h = quadrupoleStrain(30 * Msun, 0.5 * 2.998e8, 400 * Mpc);
    expect(h).toBeGreaterThan(1e-23);
    expect(h).toBeLessThan(1e-19);
  });

  it("falls off as 1/distance", () => {
    const h1 = quadrupoleStrain(1e30, 1e7, 1e22);
    const h2 = quadrupoleStrain(1e30, 1e7, 2e22);
    expect(h1 / h2).toBeCloseTo(2, 9);
  });
});

describe("massDipole", () => {
  it("is identically zero about the centre of mass", () => {
    const masses = [2, 3, 5];
    const positions: Vec2[] = [
      { x: 1, y: 4 },
      { x: -3, y: 2 },
      { x: 5, y: -1 },
    ];
    const d = massDipole(masses, positions);
    expect(d.x).toBeCloseTo(0, 9);
    expect(d.y).toBeCloseTo(0, 9);
  });

  it("stays zero even when the configuration oscillates", () => {
    // Two equal masses on a spring: as they move apart symmetrically the
    // mass dipole never develops — only the quadrupole does.
    for (const s of [0, 0.5, 1, 2]) {
      const d = massDipole([1, 1], [
        { x: s, y: 0 },
        { x: -s, y: 0 },
      ]);
      expect(d.x).toBeCloseTo(0, 9);
      expect(d.y).toBeCloseTo(0, 9);
    }
  });
});
