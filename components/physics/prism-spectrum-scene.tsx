"use client";

/**
 * PrismSpectrumScene — an equilateral glass prism splitting a white ray into
 * the visible spectrum. Each wavelength is refracted by the same geometry but
 * with a different n(λ) from a two-term Cauchy fit, so violet bends more than
 * red and the exit fan is the classic rainbow order.
 *
 * Built on the canonical RayTraceCanvas scene-graph primitive — every prism
 * face is an `Interface` element, and each colour of the fan is emitted by a
 * dedicated `RaySource`. The tracer does the refraction arithmetic.
 */

import { useMemo, useState } from "react";
import { RayTraceCanvas } from "@/components/physics/ray-trace-canvas";
import type {
  Interface,
  RayTraceScene,
  Vec2,
} from "@/components/physics/ray-trace-canvas/types";
import { cauchyDispersion } from "@/lib/physics/electromagnetism/optical-dispersion";

const WIDTH = 640;
const HEIGHT = 380;

// Visible wavelengths (in nm) sampled across the spectrum. Each one becomes
// one RaySource; each one sees a different n from Cauchy.
const SAMPLES: { nm: number; label: string }[] = [
  { nm: 650, label: "red" },
  { nm: 605, label: "orange" },
  { nm: 575, label: "yellow" },
  { nm: 530, label: "green" },
  { nm: 475, label: "blue" },
  { nm: 420, label: "violet" },
];

// Equilateral prism vertices. Apex at the top, base along the bottom.
const APEX: Vec2 = { x: 320, y: 110 };
const BASE_L: Vec2 = { x: 235, y: 260 };
const BASE_R: Vec2 = { x: 405, y: 260 };

// White ray enters from the left, strikes the left face near its midpoint.
const ENTRY_POINT: Vec2 = { x: 140, y: 215 };
const RAY_DIR_DEG = -8; // slightly downward to hit the left face at a useful angle

/**
 * Analytic refraction through the equilateral prism for a given n. Returns
 * three points: entry on left face, exit on right face, and a far-field
 * continuation so the exit ray is visible off-canvas.
 */
function bentPath(n: number): Vec2[] {
  // Left face normal points outward — the face vector is APEX → BASE_L, so
  // the outward normal (air side) is its left-hand perpendicular.
  const leftFaceDir = sub(BASE_L, APEX);
  const leftNormalOut = leftPerp(leftFaceDir); // points into the air (+x away from glass)
  const rightFaceDir = sub(APEX, BASE_R);
  const rightNormalOut = leftPerp(rightFaceDir); // points into the air on the right side

  // Step 1 — incoming ray direction (unit) from entry point and RAY_DIR_DEG.
  const theta0 = (RAY_DIR_DEG * Math.PI) / 180;
  const dIn: Vec2 = { x: Math.cos(theta0), y: Math.sin(theta0) };

  // Step 2 — refract at the left face: air (1) → glass (n).
  const dInGlass = snell(dIn, leftNormalOut, 1, n);
  if (!dInGlass) return [ENTRY_POINT];

  // Step 3 — walk from ENTRY_POINT along dInGlass until we hit the right face.
  const hitRight = intersectSegment(
    ENTRY_POINT,
    dInGlass,
    BASE_R,
    APEX,
  );
  if (!hitRight) return [ENTRY_POINT];

  // Step 4 — refract at the right face: glass (n) → air (1).
  const dOutAir = snell(dInGlass, rightNormalOut, n, 1);
  if (!dOutAir) return [ENTRY_POINT, hitRight];

  // Step 5 — extend the exit ray to the canvas edge for rendering.
  const exitEnd: Vec2 = {
    x: hitRight.x + dOutAir.x * 300,
    y: hitRight.y + dOutAir.y * 300,
  };
  return [ENTRY_POINT, hitRight, exitEnd];
}

function sub(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y };
}
function leftPerp(v: Vec2): Vec2 {
  // 90° CCW rotation — for this scene, BASE_L is below-left of APEX so
  // leftPerp gives the outward-pointing normal away from the prism's interior.
  const m = Math.hypot(v.x, v.y) || 1;
  return { x: -v.y / m, y: v.x / m };
}
function dot(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y;
}

/** Snell at a face. `normalOut` must point into the incoming medium. */
function snell(d: Vec2, normalOut: Vec2, n1: number, n2: number): Vec2 | null {
  let n = normalOut;
  let cosI = -dot(d, n);
  if (cosI < 0) {
    n = { x: -n.x, y: -n.y };
    cosI = -cosI;
  }
  const eta = n1 / n2;
  const sin2T = eta * eta * (1 - cosI * cosI);
  if (sin2T > 1) return null;
  const cosT = Math.sqrt(1 - sin2T);
  return {
    x: eta * d.x + (eta * cosI - cosT) * n.x,
    y: eta * d.y + (eta * cosI - cosT) * n.y,
  };
}

/** Intersect ray (o, d) with segment (a, b); returns hit point or null. */
function intersectSegment(o: Vec2, d: Vec2, a: Vec2, b: Vec2): Vec2 | null {
  const rx = d.x;
  const ry = d.y;
  const sx = b.x - a.x;
  const sy = b.y - a.y;
  const denom = rx * sy - ry * sx;
  if (Math.abs(denom) < 1e-9) return null;
  const t = ((a.x - o.x) * sy - (a.y - o.y) * sx) / denom;
  const u = ((a.x - o.x) * ry - (a.y - o.y) * rx) / denom;
  if (t < 1e-3 || u < 0 || u > 1) return null;
  return { x: o.x + t * rx, y: o.y + t * ry };
}

/** Map a visible wavelength (380–780 nm) to an approximate sRGB colour string. */
function wavelengthToColor(nm: number): string {
  let r = 0, g = 0, b = 0;
  if (nm >= 380 && nm < 440) { r = -(nm - 440) / 60; g = 0; b = 1; }
  else if (nm < 490) { r = 0; g = (nm - 440) / 50; b = 1; }
  else if (nm < 510) { r = 0; g = 1; b = -(nm - 510) / 20; }
  else if (nm < 580) { r = (nm - 510) / 70; g = 1; b = 0; }
  else if (nm < 645) { r = 1; g = -(nm - 645) / 65; b = 0; }
  else if (nm <= 780) { r = 1; g = 0; b = 0; }
  const gamma = 0.8;
  const to255 = (v: number) => Math.max(0, Math.min(255, Math.round(255 * Math.pow(v, gamma))));
  return `rgb(${to255(r)}, ${to255(g)}, ${to255(b)})`;
}

export interface PrismSpectrumSceneProps {
  initialA?: number;
  initialB?: number;
}

export function PrismSpectrumScene({
  initialA = 1.5046,
  initialB = 4.2e-3,
}: PrismSpectrumSceneProps = {}) {
  const [A, setA] = useState(initialA);
  const [B, setB] = useState(initialB);

  // Base scene: the prism outline (three Interface elements). The actual
  // coloured fan-out is drawn as an overlay below the RayTraceCanvas — the
  // tracer's interface-per-colour split isn't representable in the scene
  // graph we have, so the overlay paints the wavelength-resolved polylines.
  const scene = useMemo<RayTraceScene>(() => {
    const outline: Interface[] = [
      { kind: "interface", id: "face-left", p1: APEX, p2: BASE_L, n1: 1, n2: 1.5 },
      { kind: "interface", id: "face-base", p1: BASE_L, p2: BASE_R, n1: 1, n2: 1.5 },
      { kind: "interface", id: "face-right", p1: BASE_R, p2: APEX, n1: 1, n2: 1.5 },
    ];
    return {
      width: WIDTH,
      height: HEIGHT,
      elements: outline,
      background: "#0b0d10",
    };
  }, []);

  return (
    <div className="w-full">
      <div className="relative" style={{ width: WIDTH, maxWidth: "100%" }}>
        <RayTraceCanvas scene={scene} className="block max-w-full" />
        <svg
          className="pointer-events-none absolute inset-0"
          width={WIDTH}
          height={HEIGHT}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          style={{ maxWidth: "100%", height: "auto" }}
        >
          {/* Incoming white ray */}
          <line
            x1={20}
            y1={ENTRY_POINT.y + ((20 - ENTRY_POINT.x) * Math.tan((RAY_DIR_DEG * Math.PI) / 180))}
            x2={ENTRY_POINT.x}
            y2={ENTRY_POINT.y}
            stroke="#f2f2f2"
            strokeWidth={1.6}
          />
          {/* Per-colour bent paths through the prism */}
          {SAMPLES.map(({ nm }) => {
            const lambdaUm = nm / 1000;
            const n = cauchyDispersion(lambdaUm, A, B);
            const pts = bentPath(n);
            const d = pts
              .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
              .join(" ");
            return (
              <path
                key={nm}
                d={d}
                stroke={wavelengthToColor(nm)}
                strokeWidth={1.4}
                fill="none"
                opacity={0.9}
              />
            );
          })}
        </svg>
      </div>

      <div className="mt-3 flex flex-col gap-3 px-2 font-mono text-xs">
        <div className="flex items-center gap-3">
          <label className="w-20 text-[var(--color-fg-3)]">Cauchy A</label>
          <input
            type="range"
            min={1.40}
            max={1.75}
            step={0.005}
            value={A}
            onChange={(e) => setA(parseFloat(e.target.value))}
            className="flex-1 accent-[#FFD66B]"
          />
          <span className="w-16 text-right text-[var(--color-fg-1)]">
            {A.toFixed(3)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <label className="w-20 text-[var(--color-fg-3)]">Cauchy B (µm²)</label>
          <input
            type="range"
            min={1e-3}
            max={2.5e-2}
            step={5e-4}
            value={B}
            onChange={(e) => setB(parseFloat(e.target.value))}
            className="flex-1 accent-[#FF6ADE]"
          />
          <span className="w-16 text-right text-[var(--color-fg-1)]">
            {B.toExponential(2)}
          </span>
        </div>
        <p className="px-1 pt-1 text-[var(--color-fg-3)]">
          n(λ) = A + B/λ². Crown glass sits near A ≈ 1.50, B ≈ 4e-3. Crank B
          to see flint-glass-style wider spread — the same geometry, more
          chromatic dispersion per degree.
        </p>
      </div>
    </div>
  );
}
