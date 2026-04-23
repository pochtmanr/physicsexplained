import { describe, expect, it } from "vitest";
import {
  snellsLaw,
  thinLensImage,
  lensmakerEquation,
  fermatTime,
  opticalPathLength,
} from "@/lib/physics/electromagnetism/geometric-optics";

const DEG = Math.PI / 180;

describe("snellsLaw", () => {
  it("air → glass at 30° gives ≈ 19.47°", () => {
    // sin 30° / 1.5 = 0.333…  → asin ≈ 19.4712°
    const thetaT = snellsLaw(30 * DEG, 1.0, 1.5);
    expect(thetaT).not.toBeNull();
    const deg = (thetaT as number) / DEG;
    expect(Math.abs(deg - 19.4712)).toBeLessThan(0.005);
  });

  it("returns null past the critical angle (glass → air)", () => {
    // Critical angle glass→air ≈ 41.81°. 60° is well past it.
    const thetaT = snellsLaw(60 * DEG, 1.5, 1.0);
    expect(thetaT).toBeNull();
  });

  it("straight-through when n1 === n2 (no bending)", () => {
    const thetaT = snellsLaw(40 * DEG, 1.5, 1.5);
    expect(thetaT).not.toBeNull();
    expect(thetaT as number).toBeCloseTo(40 * DEG, 10);
  });

  it("normal incidence goes straight through every interface", () => {
    expect(snellsLaw(0, 1.0, 1.5)).toBeCloseTo(0, 12);
    expect(snellsLaw(0, 1.5, 1.0)).toBeCloseTo(0, 12);
  });
});

describe("thinLensImage", () => {
  it("object at 2f makes a real, inverted, unit-magnification image at 2f", () => {
    const r = thinLensImage(10, 20);
    expect(r.s_i).toBeCloseTo(20, 12);
    expect(r.magnification).toBeCloseTo(-1, 12);
    expect(r.type).toBe("real");
    expect(r.orientation).toBe("inverted");
  });

  it("object inside f (s_o < f) gives a virtual upright magnified image", () => {
    const r = thinLensImage(10, 5);
    // 1/s_i = 1/10 − 1/5 = −1/10  ⇒  s_i = −10.
    expect(r.s_i).toBeCloseTo(-10, 12);
    // m = −s_i/s_o = −(−10)/5 = +2
    expect(r.magnification).toBeCloseTo(2, 12);
    expect(r.type).toBe("virtual");
    expect(r.orientation).toBe("upright");
  });

  it("object at f → image at infinity (parallel rays out)", () => {
    const r = thinLensImage(10, 10);
    expect(r.s_i).toBe(Number.POSITIVE_INFINITY);
  });

  it("object at 1.5f gives s_i = 3f and |m| = 2 (inverted, magnified)", () => {
    // 1/s_i = 1/10 − 1/15 → s_i = 30, m = −30/15 = −2
    const r = thinLensImage(10, 15);
    expect(r.s_i).toBeCloseTo(30, 12);
    expect(r.magnification).toBeCloseTo(-2, 12);
    expect(r.type).toBe("real");
    expect(r.orientation).toBe("inverted");
  });
});

describe("lensmakerEquation", () => {
  it("symmetric biconvex n=1.5, R1=R2=10 gives f=10", () => {
    // Symmetric biconvex means R1 = +10, R2 = −10 (centres of curvature
    // flank the lens). The plan says "R1=R2=10" meaning the unsigned radii
    // — we pass the signed convention explicitly.
    const f = lensmakerEquation(1.5, 10, -10);
    expect(f).toBeCloseTo(10, 12);
  });

  it("plano-convex n=1.5, R1=10, R2=∞ gives f=20", () => {
    const f = lensmakerEquation(1.5, 10, Number.POSITIVE_INFINITY);
    expect(f).toBeCloseTo(20, 12);
  });

  it("doubling (n − 1) halves the focal length", () => {
    const f1 = lensmakerEquation(1.5, 10, -10); // (n−1) = 0.5
    const f2 = lensmakerEquation(2.0, 10, -10); // (n−1) = 1.0
    expect(f2).toBeCloseTo(f1 / 2, 12);
  });
});

describe("opticalPathLength & fermatTime — Fermat consistency", () => {
  it("sums n·L over all segments", () => {
    // 2 cm in air (n=1) + 1 cm in glass (n=1.5) + 3 cm in air.
    const opl = opticalPathLength([
      { length: 2, index: 1.0 },
      { length: 1, index: 1.5 },
      { length: 3, index: 1.0 },
    ]);
    expect(opl).toBeCloseTo(2 + 1.5 + 3, 12);
  });

  it("OPL of an air–glass–air sandwich is minimum when the ray kink follows Snell's law", () => {
    // Geometry: source S at (0, 1), thin glass slab spanning y = 0 (top) to
    // y = −1 (bottom) with n = 1.5, observer O at (4, −2). The ray enters at
    // some x1 on y=0 and exits at some x2 on y=−1. For a flat slab the
    // entrance and exit angles from the interface normal must be equal by
    // symmetry, and Snell's law at each surface demands sin θ_air = 1.5 ·
    // sin θ_glass. The true Fermat path has x2 − x1 derived from Snell. We
    // verify by scanning over x1 with x2 determined by Snell, and checking
    // that its OPL is strictly less than any nearby pair.
    const S = { x: 0, y: 1 };
    const O = { x: 4, y: -2 };
    const nAir = 1.0;
    const nGlass = 1.5;
    // In each medium the path is straight, so between the two interfaces
    // the ray inside the glass must have the same angle coming and going.
    // Fermat ⇒ single variable: angle θ_air in the air. We just verify that
    // for any *candidate* (x1, x2) with x2 chosen to satisfy Snell at the
    // entry (and, by symmetry of a parallel slab, automatically at exit),
    // the OPL is a minimum against perturbations in x1.
    const oplOfPath = (x1: number, x2: number): number => {
      const L1 = Math.hypot(x1 - S.x, 0 - S.y); // air
      const L2 = Math.hypot(x2 - x1, -1 - 0); // glass
      const L3 = Math.hypot(O.x - x2, O.y - -1); // air
      return opticalPathLength([
        { length: L1, index: nAir },
        { length: L2, index: nGlass },
        { length: L3, index: nAir },
      ]);
    };

    // Numerically minimise OPL by scanning x1 and x2 on a fine grid.
    // At the minimum we will *derive* the entry and exit Snell angles and
    // confirm Snell's law holds.
    let bestOpl = Infinity;
    let bestX1 = 0;
    let bestX2 = 0;
    for (let i = 0; i <= 400; i++) {
      const x1 = (4 * i) / 400;
      for (let j = 0; j <= 400; j++) {
        const x2 = (4 * j) / 400;
        const o = oplOfPath(x1, x2);
        if (o < bestOpl) {
          bestOpl = o;
          bestX1 = x1;
          bestX2 = x2;
        }
      }
    }
    // Snell angles at the entry: the air ray comes from (0,1) to (x1,0) —
    // its angle from the normal (ĵ) is atan(x1 / 1). The glass ray goes
    // from (x1,0) to (x2,−1) — its angle from the normal is atan((x2−x1)/1).
    const thetaAir = Math.atan(bestX1); // from vertical normal
    const thetaGlass = Math.atan(bestX2 - bestX1);
    const snellLHS = nAir * Math.sin(thetaAir);
    const snellRHS = nGlass * Math.sin(thetaGlass);
    // Grid is 0.01 wide, so expect ~1% agreement on the angles — but the
    // Snell residual itself should be well within the grid precision.
    expect(Math.abs(snellLHS - snellRHS)).toBeLessThan(0.02);

    // And Fermat time along the real path is OPL / c.
    const path = [S, { x: bestX1, y: 0 }, { x: bestX2, y: -1 }, O];
    const t = fermatTime(path, [nAir, nGlass, nAir]);
    const c = 299_792_458;
    expect(t).toBeCloseTo(bestOpl / c, 18);
  });
});
