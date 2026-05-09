"use client";

import { useState, useMemo } from "react";
import { ManifoldCanvas } from "@/components/physics/_shared";
import { sphereEmbedding } from "@/lib/physics/relativity/manifolds";
import { greatCircle } from "@/lib/physics/relativity/geodesics";
import type { ManifoldEmbedding } from "@/components/physics/_shared";

/**
 * FIG.33a — Great-circle geodesic on a 2-sphere.
 *
 * A unit sphere is rendered with latitude-longitude grid lines.
 * Two points are highlighted: a fixed start (red dot) and a movable
 * end point (amber dot). The great-circle arc between them is drawn
 * as a thick cyan line.
 *
 * Two sliders:
 *   • "End latitude" — colatitude θ₂ of the second point [0.1, π-0.1].
 *   • "End longitude" — φ₂ of the second point [0, 2π].
 *   • "Rotate view"   — orbit the sphere.
 *
 * The demonstration is simple and unmistakable: no matter where the
 * second point is placed, the shortest path on the sphere is always
 * a great circle — a section of a plane through the centre.
 */

const EMBED: ManifoldEmbedding = sphereEmbedding(1);

// Fixed start: equator at φ = 0.
const THETA_START = Math.PI / 2;
const PHI_START = 0;

function computeGeodesic(theta2: number, phi2: number): { u: number; v: number }[] {
  // Build great-circle arc from (THETA_START, PHI_START) to (theta2, phi2).
  // Strategy: full great circle through start with the azimuth that targets end,
  // then clamp to the shorter arc.

  // Cartesian positions.
  const p1x = Math.sin(THETA_START) * Math.cos(PHI_START);
  const p1y = Math.sin(THETA_START) * Math.sin(PHI_START);
  const p1z = Math.cos(THETA_START);
  const p2x = Math.sin(theta2) * Math.cos(phi2);
  const p2y = Math.sin(theta2) * Math.sin(phi2);
  const p2z = Math.cos(theta2);

  // Normal to the great-circle plane: n = p1 × p2 (normalised).
  let nx = p1y * p2z - p1z * p2y;
  let ny = p1z * p2x - p1x * p2z;
  let nz = p1x * p2y - p1y * p2x;
  const nlen = Math.hypot(nx, ny, nz);
  if (nlen < 1e-9) {
    // Antipodal or identical — return a default meridian arc.
    return Array.from({ length: 65 }, (_, i) => ({
      u: (i / 64) * Math.PI,
      v: PHI_START,
    }));
  }
  nx /= nlen;
  ny /= nlen;
  nz /= nlen;

  // Tangent at p1 in the great-circle plane: t1 = n × p1.
  const t1x = ny * p1z - nz * p1y;
  const t1y = nz * p1x - nx * p1z;
  const t1z = nx * p1y - ny * p1x;

  // Angle from p1 to p2 along the great circle (using atan2 for correct sign).
  const cosAngle = p1x * p2x + p1y * p2y + p1z * p2z;
  const sinAngle = (t1x * p2x + t1y * p2y + t1z * p2z);
  const arcAngle = Math.atan2(sinAngle, cosAngle);

  // Sample the shorter arc from 0 to arcAngle.
  const STEPS = 64;
  const result: { u: number; v: number }[] = [];
  for (let i = 0; i <= STEPS; i++) {
    const s = (i / STEPS) * arcAngle;
    const x = p1x * Math.cos(s) + t1x * Math.sin(s);
    const y = p1y * Math.cos(s) + t1y * Math.sin(s);
    const z = p1z * Math.cos(s) + t1z * Math.sin(s);
    const theta = Math.acos(Math.max(-1, Math.min(1, z)));
    const phi = Math.atan2(y, x);
    result.push({ u: theta, v: phi });
  }
  return result;
}

export function GreatCircleGeodesicScene() {
  const [theta2, setTheta2] = useState(Math.PI / 4);
  const [phi2, setPhi2] = useState(Math.PI);
  const [rotY, setRotY] = useState(0.7);

  const geodesicPath = useMemo(() => computeGeodesic(theta2, phi2), [theta2, phi2]);

  // Two dot markers: start (red) and end (amber) — rendered as single-point tangent arrows
  // with near-zero magnitude (visual dots).
  const dotArrows = useMemo(() => [
    {
      base: { u: THETA_START, v: PHI_START },
      vector: [0.001, 0] as [number, number],
      color: "#F87171",
      label: "start",
    },
    {
      base: { u: theta2, v: phi2 },
      vector: [0.001, 0] as [number, number],
      color: "#FBBF24",
      label: "end",
    },
  ], [theta2, phi2]);

  return (
    <div className="flex flex-col items-center gap-4">
      <ManifoldCanvas
        embedding={EMBED}
        uRange={[0, Math.PI]}
        vRange={[0, 2 * Math.PI]}
        uSteps={14}
        vSteps={20}
        geodesic={geodesicPath}
        tangentArrows={dotArrows}
        rotationY={rotY}
        onRotationChange={setRotY}
        rotationMin={-Math.PI}
        rotationMax={Math.PI}
        width={500}
        height={380}
        palette={{ highlight: "#67E8F9" }}
      />

      {/* Controls */}
      <div className="flex w-full max-w-[500px] flex-col gap-2 font-mono text-xs text-white/70">
        <label className="flex items-center gap-3">
          <span className="w-36 shrink-0">End colatitude θ₂</span>
          <input
            type="range"
            min={0.1}
            max={Math.PI - 0.1}
            step={0.01}
            value={theta2}
            onChange={(e) => setTheta2(parseFloat(e.target.value))}
            className="flex-1"
          />
          <span className="w-12 text-right">{theta2.toFixed(2)}</span>
        </label>

        <label className="flex items-center gap-3">
          <span className="w-36 shrink-0">End longitude φ₂</span>
          <input
            type="range"
            min={0}
            max={2 * Math.PI}
            step={0.01}
            value={phi2}
            onChange={(e) => setPhi2(parseFloat(e.target.value))}
            className="flex-1"
          />
          <span className="w-12 text-right">{phi2.toFixed(2)}</span>
        </label>
      </div>

      {/* Legend */}
      <div className="flex gap-6 font-mono text-xs text-white/60">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-4 rounded bg-[#67E8F9]" />
          great-circle geodesic
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#F87171]" />
          start
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#FBBF24]" />
          end
        </span>
      </div>
    </div>
  );
}
