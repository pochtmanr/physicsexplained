import { describe, it, expect } from "vitest";
import { refract, criticalAngle, fresnelCoefficients, thinLensImage, trace } from "./tracer";
import type { RayTraceScene } from "./types";

const deg = (r: number) => (r * 180) / Math.PI;

describe("refract — Snell's law", () => {
  it("sandwich 1.0 → 1.5 → 1.0 returns original direction", () => {
    const start = { x: 1, y: 0 };
    const norm1 = { x: 0, y: 1 };
    const after1 = refract(start, norm1, 1.0, 1.5);
    const norm2 = { x: 0, y: -1 };
    const after2 = refract(after1!, norm2, 1.5, 1.0);
    expect(after2!.x).toBeCloseTo(start.x, 5);
    expect(after2!.y).toBeCloseTo(start.y, 5);
  });

  it("normal incidence passes through unchanged", () => {
    const d = { x: 0, y: 1 };
    const n = { x: 0, y: -1 };
    const out = refract(d, n, 1.0, 1.5);
    expect(out!.x).toBeCloseTo(0, 5);
    expect(out!.y).toBeCloseTo(1, 5);
  });
});

describe("criticalAngle", () => {
  it("glass(1.5) → air(1.0) gives arcsin(1/1.5) ≈ 41.81°", () => {
    const angleDeg = deg(criticalAngle(1.5, 1.0)!);
    expect(angleDeg).toBeCloseTo(41.81, 1);
  });
  it("returns null when n1 ≤ n2 (no TIR possible)", () => {
    expect(criticalAngle(1.0, 1.5)).toBeNull();
  });
});

describe("fresnelCoefficients", () => {
  it("normal incidence: r_s and r_p have equal magnitude and are negative for n1 < n2", () => {
    const { rs, rp, ts, tp } = fresnelCoefficients(0, 1.0, 1.5);
    expect(Math.abs(rs)).toBeCloseTo(Math.abs(rp), 5);
    expect(rs).toBeLessThan(0);
    expect(rp).toBeLessThan(0);
    // |r|² + |t|² relation with index ratio
    const R = rs * rs;
    const T = (1.5 / 1.0) * ts * ts * Math.cos(0) / Math.cos(0);
    expect(R + T).toBeCloseTo(1, 4);
  });
  it("Brewster's angle: r_p = 0 for air-glass at arctan(1.5)", () => {
    const brewsterRad = Math.atan(1.5 / 1.0);
    const { rp } = fresnelCoefficients(brewsterRad, 1.0, 1.5);
    expect(rp).toBeCloseTo(0, 4);
  });
});

describe("thinLensImage", () => {
  it("object at 2f produces image at 2f with magnification −1", () => {
    const f = 10;
    const { imageDistance, magnification } = thinLensImage(f, 2 * f);
    expect(imageDistance).toBeCloseTo(2 * f, 5);
    expect(magnification).toBeCloseTo(-1, 5);
  });
  it("object at infinity produces image at f", () => {
    const f = 10;
    const { imageDistance } = thinLensImage(f, 1e9);
    expect(imageDistance).toBeCloseTo(f, 2);
  });
});

describe("trace — full scene", () => {
  it("single ray refracts through a dielectric interface at 45°", () => {
    const scene: RayTraceScene = {
      width: 400,
      height: 400,
      elements: [
        {
          kind: "ray-source",
          id: "src",
          position: { x: 100, y: 100 },
          directionDeg: 45,
          wavelengthNm: 550,
        },
        {
          kind: "interface",
          id: "glass",
          p1: { x: 200, y: 50 },
          p2: { x: 200, y: 350 },
          n1: 1.0,
          n2: 1.5,
        },
        {
          kind: "screen",
          id: "scr",
          center: { x: 380, y: 200 },
          axis: { x: -1, y: 0 },
          halfWidth: 200,
        },
      ],
    };
    const result = trace(scene);
    expect(result.rays.length).toBe(1);
    expect(result.rays[0].segments.length).toBeGreaterThanOrEqual(2);
    // After refraction entering a denser medium, the ray bends toward the normal
    const entering = result.rays[0].segments[0];
    const inside = result.rays[0].segments[1];
    const angleInside = Math.atan2(inside.to.y - inside.from.y, inside.to.x - inside.from.x);
    const angleEntering = Math.atan2(entering.to.y - entering.from.y, entering.to.x - entering.from.x);
    expect(Math.abs(angleInside)).toBeLessThan(Math.abs(angleEntering));
  });
});

describe("huygensSum — double-slit fringe spacing", () => {
  it("produces fringe spacing λL/d (within 5%) for small-angle Fraunhofer geometry", async () => {
    const { huygensSum } = await import("./tracer");
    const lambdaMm = 550e-6;      // 550 nm in mm
    const d = 0.25;                // slit separation mm
    const L = 500;                 // distance to screen mm
    const expectedFringe = (lambdaMm * L) / d;
    // sample intensity across the screen; find first peak spacing
    const bins = 2048;
    const halfScreen = 20;
    const intensity = huygensSum({
      slitPositions: [-d / 2, +d / 2],
      slitWidth: 0.05,
      wavelengthMm: lambdaMm,
      distanceToScreen: L,
      screenHalfWidth: halfScreen,
      bins,
    });
    // find centre peak and first side peak
    let centreIdx = 0;
    let maxI = 0;
    for (let i = 0; i < bins; i += 1) {
      if (intensity[i] > maxI) {
        maxI = intensity[i];
        centreIdx = i;
      }
    }
    let firstPeakIdx = centreIdx + 1;
    while (firstPeakIdx < bins - 1 && !(intensity[firstPeakIdx] > intensity[firstPeakIdx - 1] && intensity[firstPeakIdx] > intensity[firstPeakIdx + 1])) {
      firstPeakIdx += 1;
    }
    const fringeMm = ((firstPeakIdx - centreIdx) / bins) * 2 * halfScreen;
    expect(fringeMm).toBeCloseTo(expectedFringe, 1);
  });
});
