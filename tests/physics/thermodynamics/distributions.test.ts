import { describe, it, expect } from "vitest";
import {
  K_B,
  gaussian,
  maxwellBoltzmannSpeed,
  boltzmannFactor,
} from "@/lib/physics/thermodynamics/distributions";

/** Composite-trapezoid integral of f over [a, b]. */
function integrate(f: (x: number) => number, a: number, b: number, n = 4000): number {
  const dx = (b - a) / n;
  let s = 0;
  for (let i = 0; i <= n; i++) {
    const x = a + i * dx;
    const w = i === 0 || i === n ? 0.5 : 1;
    s += f(x) * w * dx;
  }
  return s;
}

describe("gaussian", () => {
  it("integrates to 1 over the real line", () => {
    const area = integrate((x) => gaussian(x, 0, 1), -10, 10);
    expect(area).toBeCloseTo(1, 3);
  });
  it("peaks at the mean and is symmetric", () => {
    expect(gaussian(2, 2, 1)).toBeGreaterThan(gaussian(3, 2, 1));
    expect(gaussian(1, 2, 1)).toBeCloseTo(gaussian(3, 2, 1), 12);
  });
});

describe("maxwellBoltzmannSpeed", () => {
  const T = 300;
  const m = 28.01 * 1.66053906660e-27; // N₂
  it("is a normalised density (integrates to 1)", () => {
    const vMax = 4000;
    const area = integrate((v) => maxwellBoltzmannSpeed(v, T, m), 0, vMax, 8000);
    expect(area).toBeCloseTo(1, 2);
  });
  it("is zero at v = 0 and positive in between", () => {
    expect(maxwellBoltzmannSpeed(0, T, m)).toBe(0);
    expect(maxwellBoltzmannSpeed(500, T, m)).toBeGreaterThan(0);
  });
  it("peaks at the most probable speed √(2kT/m)", () => {
    const vmp = Math.sqrt((2 * K_B * T) / m);
    const peak = maxwellBoltzmannSpeed(vmp, T, m);
    expect(peak).toBeGreaterThan(maxwellBoltzmannSpeed(vmp * 0.7, T, m));
    expect(peak).toBeGreaterThan(maxwellBoltzmannSpeed(vmp * 1.4, T, m));
  });
});

describe("boltzmannFactor", () => {
  it("equals 1 at E = 0", () => {
    expect(boltzmannFactor(0, 300)).toBe(1);
  });
  it("decreases with energy and increases with temperature", () => {
    const E = 5e-21;
    expect(boltzmannFactor(2 * E, 300)).toBeLessThan(boltzmannFactor(E, 300));
    expect(boltzmannFactor(E, 600)).toBeGreaterThan(boltzmannFactor(E, 300));
  });
});
