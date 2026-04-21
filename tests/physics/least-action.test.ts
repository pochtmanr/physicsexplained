import { describe, it, expect } from "vitest";
import {
  lagrangian1D,
  actionFromSamples,
  freeFallActionExact,
  perturbedFreeFall,
  fermatTime,
  fermatOptimalX,
  fermatAngles,
  snellResidual,
} from "@/lib/physics/least-action";
import { g_SI } from "@/lib/physics/constants";

describe("lagrangian1D — L = T − V for uniform gravity", () => {
  it("returns ½ m v² − m g y", () => {
    expect(lagrangian1D(2, 3, 5, 10)).toBeCloseTo(0.5 * 2 * 9 - 2 * 10 * 5, 12);
  });
  it("is zero when kinetic equals potential", () => {
    // ½·m·v² = m·g·y  ⇒  v = √(2 g y)
    const m = 1;
    const g = 9.81;
    const y = 4;
    const v = Math.sqrt(2 * g * y);
    expect(lagrangian1D(m, v, y, g)).toBeCloseTo(0, 10);
  });
});

describe("freeFallActionExact — closed-form action on the physical path", () => {
  it("agrees with numerical action on the same trajectory", () => {
    const m = 1;
    const g = g_SI;
    const y0 = 0;
    const yT = 0; // up and back
    const T = 2;
    const SExact = freeFallActionExact(y0, yT, T, m, g);

    // Sample the physical path finely and integrate numerically.
    const N = 2000;
    const ys = new Array(N + 1);
    const v0 = (yT - y0) / T + 0.5 * g * T;
    for (let i = 0; i <= N; i++) {
      const t = (T * i) / N;
      ys[i] = y0 + v0 * t - 0.5 * g * t * t;
    }
    const SNum = actionFromSamples(ys, T, m, g);
    expect(SNum).toBeCloseTo(SExact, 3);
  });

  it("rejects non-positive T", () => {
    expect(() => freeFallActionExact(0, 0, 0, 1)).toThrow();
    expect(() => freeFallActionExact(0, 0, -1, 1)).toThrow();
  });
});

describe("stationarity — S is minimised on the physical path", () => {
  it("any small perturbation raises the action", () => {
    const m = 1;
    const g = g_SI;
    const y0 = 0;
    const yT = 0;
    const T = 2;
    const N = 1000;

    const sample = (eps: number) => {
      const ys = new Array(N + 1);
      for (let i = 0; i <= N; i++) {
        const t = (T * i) / N;
        ys[i] = perturbedFreeFall(t, T, y0, yT, eps, g);
      }
      return actionFromSamples(ys, T, m, g);
    };

    const S0 = sample(0);
    // Symmetric perturbations in both directions should both raise S.
    for (const eps of [-0.5, -0.2, -0.05, 0.05, 0.2, 0.5]) {
      expect(sample(eps)).toBeGreaterThan(S0 - 1e-6);
    }
    // And larger perturbations should raise S further.
    expect(sample(0.5)).toBeGreaterThan(sample(0.05));
  });
});

describe("fermatTime — travel time of a two-medium ray", () => {
  it("reduces to straight-line time when v1 = v2 and h1 = h2", () => {
    // Same medium throughout, symmetric geometry: crossing at the midpoint
    // gives the geodesic time (a straight line).
    const d = 10, h1 = 3, h2 = 3, v1 = 1, v2 = 1;
    const straight = Math.sqrt(d * d + (h1 + h2) * (h1 + h2)) / v1;
    const tMid = fermatTime(d / 2, d, h1, h2, v1, v2);
    expect(tMid).toBeCloseTo(straight, 10);
  });

  it("rejects non-positive heights and speeds", () => {
    expect(() => fermatTime(1, 2, 0, 1, 1, 1)).toThrow();
    expect(() => fermatTime(1, 2, 1, 0, 1, 1)).toThrow();
    expect(() => fermatTime(1, 2, 1, 1, 0, 1)).toThrow();
    expect(() => fermatTime(1, 2, 1, 1, 1, 0)).toThrow();
  });
});

describe("fermatOptimalX — the minimiser satisfies Snell's law", () => {
  it("same medium: crosses at the straight-line midpoint", () => {
    // With v1 = v2 and h1 = h2, geometry forces x = d/2 by symmetry.
    const d = 8;
    const x = fermatOptimalX(d, 2, 2, 1, 1);
    expect(x).toBeCloseTo(d / 2, 10);
  });

  it("air → water: the ray shortens its path in the slow medium", () => {
    // v2 < v1, so the ray wants to minimise distance travelled in medium 2.
    // With A at (0, +h1) and B at (d, -h2), that means the crossing moves
    // CLOSER to B (i.e., larger x) than in the equal-speed geometry.
    const d = 10, h1 = 3, h2 = 3;
    const xEqual = fermatOptimalX(d, h1, h2, 1, 1);
    const xSlower = fermatOptimalX(d, h1, h2, 1, 0.5);
    expect(xSlower).toBeGreaterThan(xEqual);
  });

  it("the minimiser zeroes the Snell residual", () => {
    const d = 10, h1 = 4, h2 = 2.5, v1 = 3e8, v2 = 2.25e8; // roughly air→water
    const x = fermatOptimalX(d, h1, h2, v1, v2);
    expect(Math.abs(snellResidual(x, d, h1, h2, v1, v2))).toBeLessThan(1e-12);
  });

  it("the minimiser actually minimises travel time", () => {
    const d = 10, h1 = 4, h2 = 2.5, v1 = 3, v2 = 2;
    const xStar = fermatOptimalX(d, h1, h2, v1, v2);
    const tStar = fermatTime(xStar, d, h1, h2, v1, v2);
    for (const dx of [-1, -0.5, -0.1, 0.1, 0.5, 1]) {
      const x = xStar + dx;
      if (x > 0 && x < d) {
        expect(fermatTime(x, d, h1, h2, v1, v2)).toBeGreaterThan(tStar);
      }
    }
  });
});

describe("fermatAngles — angles read back correctly", () => {
  it("symmetric case: sin θ1 = sin θ2", () => {
    const { sinTheta1, sinTheta2 } = fermatAngles(5, 10, 3, 3);
    expect(sinTheta1).toBeCloseTo(sinTheta2, 12);
  });
});
