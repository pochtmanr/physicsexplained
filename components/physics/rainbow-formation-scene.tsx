"use client";

/**
 * RainbowFormationScene — a spherical raindrop in 2D. A white ray enters the
 * top, refracts into the water, reflects once off the back (primary path),
 * and exits; a second ray reflects **twice** (secondary path) and exits in
 * the opposite direction. The scene draws both paths for three wavelengths,
 * and a key on the right reports the two Descartes angles — ≈ 42° for the
 * primary bow, ≈ 51° for the secondary.
 *
 * Colour order is reversed between the two bows (red inside / violet outside
 * for the secondary), which is the whole visual point.
 */

import { useMemo, useState } from "react";
import { RayTraceCanvas } from "@/components/physics/ray-trace-canvas";
import type {
  RayTraceScene,
  Vec2,
} from "@/components/physics/ray-trace-canvas/types";
import {
  rainbowPrimaryAngle,
  rainbowSecondaryAngle,
} from "@/lib/physics/electromagnetism/optical-dispersion";

const WIDTH = 640;
const HEIGHT = 420;
const DROP_CENTER: Vec2 = { x: 260, y: 210 };
const DROP_RADIUS = 130;

// A few characteristic wavelengths and the water indices at those colours.
// Values from standard dispersion tables for liquid water at 20°C.
const SAMPLES: Array<{ nm: number; n: number; label: string }> = [
  { nm: 650, n: 1.331, label: "red" },
  { nm: 530, n: 1.335, label: "green" },
  { nm: 420, n: 1.344, label: "violet" },
];

function sub(a: Vec2, b: Vec2): Vec2 { return { x: a.x - b.x, y: a.y - b.y }; }
function add(a: Vec2, b: Vec2): Vec2 { return { x: a.x + b.x, y: a.y + b.y }; }
function scale(a: Vec2, s: number): Vec2 { return { x: a.x * s, y: a.y * s }; }
function dot(a: Vec2, b: Vec2): number { return a.x * b.x + a.y * b.y; }
function norm(a: Vec2): Vec2 {
  const m = Math.hypot(a.x, a.y) || 1;
  return { x: a.x / m, y: a.y / m };
}

/** Refract across a sphere: `normalOut` is the outward normal at the hit point. */
function snell(d: Vec2, normalOut: Vec2, n1: number, n2: number): Vec2 | null {
  let n = normalOut;
  let cosI = -dot(d, n);
  if (cosI < 0) {
    n = scale(n, -1);
    cosI = -cosI;
  }
  const eta = n1 / n2;
  const sin2T = eta * eta * (1 - cosI * cosI);
  if (sin2T > 1) return null;
  const cosT = Math.sqrt(1 - sin2T);
  return norm({
    x: eta * d.x + (eta * cosI - cosT) * n.x,
    y: eta * d.y + (eta * cosI - cosT) * n.y,
  });
}

function reflect(d: Vec2, normalOut: Vec2): Vec2 {
  const n = normalOut;
  return norm(sub(d, scale(n, 2 * dot(d, n))));
}

/** Intersect ray (origin, dir) with the sphere. Returns the far (exit) point along dir. */
function sphereHitFar(origin: Vec2, dir: Vec2, center: Vec2, r: number): Vec2 | null {
  const oc = sub(origin, center);
  const b = 2 * dot(oc, dir);
  const c = dot(oc, oc) - r * r;
  const disc = b * b - 4 * c;
  if (disc <= 0) return null;
  const t = (-b + Math.sqrt(disc)) / 2; // far root
  if (t <= 1e-4) return null;
  return add(origin, scale(dir, t));
}

/** Trace the primary path (k = 1 internal reflection). */
function primaryPath(impactY: number, n: number): Vec2[] {
  const entryDir: Vec2 = { x: 1, y: 0 }; // rays come in horizontally from the left
  const entryX = DROP_CENTER.x - Math.sqrt(DROP_RADIUS * DROP_RADIUS - (impactY - DROP_CENTER.y) ** 2);
  if (!Number.isFinite(entryX)) return [];
  const entry: Vec2 = { x: entryX, y: impactY };
  const normalOut1 = norm(sub(entry, DROP_CENTER));
  const d1 = snell(entryDir, normalOut1, 1, n);
  if (!d1) return [entry];
  const backHit = sphereHitFar(entry, d1, DROP_CENTER, DROP_RADIUS);
  if (!backHit) return [entry];
  const normalOutBack = norm(sub(backHit, DROP_CENTER));
  const d2 = reflect(d1, normalOutBack);
  const frontHit = sphereHitFar(backHit, d2, DROP_CENTER, DROP_RADIUS);
  if (!frontHit) return [entry, backHit];
  const normalOutFront = norm(sub(frontHit, DROP_CENTER));
  const d3 = snell(d2, normalOutFront, n, 1);
  if (!d3) return [entry, backHit, frontHit];
  const exit: Vec2 = add(frontHit, scale(d3, 260));
  // Include the incoming leg from off-canvas to the entry point.
  const incoming: Vec2 = { x: entry.x - 240, y: entry.y };
  return [incoming, entry, backHit, frontHit, exit];
}

/** Trace the secondary path (k = 2 internal reflections). */
function secondaryPath(impactY: number, n: number): Vec2[] {
  const entryDir: Vec2 = { x: 1, y: 0 };
  const entryX = DROP_CENTER.x - Math.sqrt(DROP_RADIUS * DROP_RADIUS - (impactY - DROP_CENTER.y) ** 2);
  if (!Number.isFinite(entryX)) return [];
  const entry: Vec2 = { x: entryX, y: impactY };
  const n0 = norm(sub(entry, DROP_CENTER));
  const d1 = snell(entryDir, n0, 1, n);
  if (!d1) return [entry];
  const hit1 = sphereHitFar(entry, d1, DROP_CENTER, DROP_RADIUS);
  if (!hit1) return [entry];
  const n1 = norm(sub(hit1, DROP_CENTER));
  const d2 = reflect(d1, n1);
  const hit2 = sphereHitFar(hit1, d2, DROP_CENTER, DROP_RADIUS);
  if (!hit2) return [entry, hit1];
  const n2h = norm(sub(hit2, DROP_CENTER));
  const d3 = reflect(d2, n2h);
  const hit3 = sphereHitFar(hit2, d3, DROP_CENTER, DROP_RADIUS);
  if (!hit3) return [entry, hit1, hit2];
  const n3 = norm(sub(hit3, DROP_CENTER));
  const d4 = snell(d3, n3, n, 1);
  if (!d4) return [entry, hit1, hit2, hit3];
  const exit: Vec2 = add(hit3, scale(d4, 260));
  const incoming: Vec2 = { x: entry.x - 240, y: entry.y };
  return [incoming, entry, hit1, hit2, hit3, exit];
}

function wavelengthToColor(nm: number): string {
  let r = 0, g = 0, b = 0;
  if (nm >= 380 && nm < 440) { r = -(nm - 440) / 60; g = 0; b = 1; }
  else if (nm < 490) { r = 0; g = (nm - 440) / 50; b = 1; }
  else if (nm < 510) { r = 0; g = 1; b = -(nm - 510) / 20; }
  else if (nm < 580) { r = (nm - 510) / 70; g = 1; b = 0; }
  else if (nm < 645) { r = 1; g = -(nm - 645) / 65; b = 0; }
  else if (nm <= 780) { r = 1; g = 0; b = 0; }
  const gamma = 0.85;
  const to255 = (v: number) => Math.max(0, Math.min(255, Math.round(255 * Math.pow(v, gamma))));
  return `rgb(${to255(r)}, ${to255(g)}, ${to255(b)})`;
}

export function RainbowFormationScene() {
  // Impact parameter for the primary bow is near the Descartes impact
  // b = R·sin(θ_i); user can drag along [0, R) to see how the exit angle
  // sweeps, but for the canonical figure we just stack all three colours at
  // the same Descartes impact for each bow and show the angular separation.
  const [impactFraction, setImpactFraction] = useState(0.86);

  const { primaryDeg, secondaryDeg } = useMemo(() => {
    const nRef = 1.333;
    return {
      primaryDeg: rainbowPrimaryAngle(nRef),
      secondaryDeg: rainbowSecondaryAngle(nRef),
    };
  }, []);

  // Empty base scene — we render the drop and rays in an SVG overlay because
  // the tracer has no spherical-interface primitive in the current types.
  const scene: RayTraceScene = useMemo(
    () => ({
      width: WIDTH,
      height: HEIGHT,
      elements: [],
      background: "#0b0d10",
    }),
    [],
  );

  const impactY_primary = DROP_CENTER.y - DROP_RADIUS * impactFraction;
  // The secondary bow uses a smaller impact parameter (below centre) by convention.
  const impactY_secondary = DROP_CENTER.y + DROP_RADIUS * impactFraction * 0.6;

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
          {/* The drop */}
          <circle
            cx={DROP_CENTER.x}
            cy={DROP_CENTER.y}
            r={DROP_RADIUS}
            fill="rgba(111, 184, 198, 0.10)"
            stroke="rgba(111, 184, 198, 0.55)"
            strokeWidth={1.3}
          />
          <text
            x={DROP_CENTER.x}
            y={DROP_CENTER.y - DROP_RADIUS - 8}
            textAnchor="middle"
            fill="rgba(200, 200, 210, 0.75)"
            fontFamily="ui-monospace, monospace"
            fontSize={11}
          >
            raindrop · n = 1.33
          </text>

          {/* Primary rays — one internal bounce, upper impact. */}
          {SAMPLES.map(({ nm, n }) => {
            const pts = primaryPath(impactY_primary, n);
            if (pts.length < 2) return null;
            const d = pts
              .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
              .join(" ");
            return (
              <path
                key={`p-${nm}`}
                d={d}
                stroke={wavelengthToColor(nm)}
                strokeWidth={1.4}
                fill="none"
                opacity={0.92}
              />
            );
          })}

          {/* Secondary rays — two internal bounces, lower impact. */}
          {SAMPLES.map(({ nm, n }) => {
            const pts = secondaryPath(impactY_secondary, n);
            if (pts.length < 2) return null;
            const d = pts
              .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
              .join(" ");
            return (
              <path
                key={`s-${nm}`}
                d={d}
                stroke={wavelengthToColor(nm)}
                strokeWidth={1.1}
                strokeDasharray="4,3"
                fill="none"
                opacity={0.8}
              />
            );
          })}

          {/* Angle key, top right */}
          <g transform={`translate(${WIDTH - 168}, 18)`}>
            <rect width={152} height={64} fill="rgba(11, 13, 16, 0.78)" stroke="rgba(200,200,210,0.25)" rx={4} />
            <text x={10} y={18} fill="rgba(200,200,210,0.85)" fontFamily="ui-monospace, monospace" fontSize={11}>
              primary (solid): {primaryDeg.toFixed(1)}°
            </text>
            <text x={10} y={34} fill="rgba(200,200,210,0.85)" fontFamily="ui-monospace, monospace" fontSize={11}>
              secondary (dashed): {secondaryDeg.toFixed(1)}°
            </text>
            <text x={10} y={54} fill="rgba(230,180,100,0.85)" fontFamily="ui-monospace, monospace" fontSize={10}>
              Δ ≈ {(secondaryDeg - primaryDeg).toFixed(1)}° · colours reversed
            </text>
          </g>
        </svg>
      </div>

      <div className="mt-3 flex flex-col gap-3 px-2 font-mono text-xs">
        <div className="flex items-center gap-3">
          <label className="w-24 text-[var(--color-fg-3)]">Impact b / R</label>
          <input
            type="range"
            min={0.2}
            max={0.98}
            step={0.01}
            value={impactFraction}
            onChange={(e) => setImpactFraction(parseFloat(e.target.value))}
            className="flex-1 accent-[#6FB8C6]"
          />
          <span className="w-16 text-right text-[var(--color-fg-1)]">
            {impactFraction.toFixed(2)}
          </span>
        </div>
        <p className="px-1 pt-1 text-[var(--color-fg-3)]">
          Solid rays are the primary bow (one internal reflection, ≈ 42°).
          Dashed rays are the secondary bow (two internal reflections, ≈ 51°).
          The Descartes impact parameter is where dD/db = 0 — a caustic where
          rays pile up, which is why a rainbow is bright at exactly that angle.
        </p>
      </div>
    </div>
  );
}
