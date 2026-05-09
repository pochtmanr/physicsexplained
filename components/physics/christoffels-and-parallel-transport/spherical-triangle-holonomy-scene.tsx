"use client";

import { useMemo, useState } from "react";
import { ManifoldCanvas } from "@/components/physics/_shared";
import { sphereEmbedding } from "@/lib/physics/relativity/manifolds";
import {
  christoffelSymbols,
  parallelTransportStep,
  sphericalHolonomyAngle,
  sphericalMetric,
} from "@/lib/physics/relativity/christoffel";
import type { ParallelTransportPath, ManifoldChartPoint } from "@/components/physics/_shared";

/**
 * §07 SPHERICAL TRIANGLE HOLONOMY — THE MONEY SHOT.
 *
 * A closed great-circle triangle on the unit 2-sphere:
 *   Leg 1 — equator from (θ=π/2, φ=0) to (θ=π/2, φ=π/2)
 *   Leg 2 — meridian from (θ=π/2, φ=π/2) down to (θ=0, φ=π/2)  [toward north pole]
 *   Leg 3 — meridian from (θ=0, φ=π/2) back down to (θ=π/2, φ=0) [i.e. along φ=0 reversed]
 *
 * Encloses one octant of the sphere — area = π/2 steradians — so the holonomy
 * angle is π/2. The transport vector starts pointing "south" (∂/∂θ) and arrives
 * pointing "east" (∂/∂φ, normalised): visibly rotated by 90°.
 *
 * A "progress" slider shows the vector at each point along the path.
 */

const EMBED = sphereEmbedding(1);
const METRIC = sphericalMetric(1);
const STEPS_PER_LEG = 60;

/** Build the closed triangle curve and transport vectors up to `progressFrac` ∈ [0,1]. */
function buildTransport(progressFrac: number): ParallelTransportPath {
  // ── Sample the three legs ────────────────────────────────────────────────
  const curve: ManifoldChartPoint[] = [];

  // Leg 1: equator from φ=0 to φ=π/2 at θ=π/2
  for (let i = 0; i <= STEPS_PER_LEG; i++) {
    curve.push({ u: Math.PI / 2, v: (Math.PI / 2) * (i / STEPS_PER_LEG) });
  }
  // Leg 2: meridian φ=π/2 from θ=π/2 down to θ=ε (near north pole)
  const POLE_EPS = 0.08; // avoid the coordinate singularity at θ=0
  for (let i = 1; i <= STEPS_PER_LEG; i++) {
    const t = i / STEPS_PER_LEG;
    curve.push({ u: Math.PI / 2 - t * (Math.PI / 2 - POLE_EPS), v: Math.PI / 2 });
  }
  // Leg 3: meridian φ=0 from θ=ε back to θ=π/2
  for (let i = 1; i <= STEPS_PER_LEG; i++) {
    const t = i / STEPS_PER_LEG;
    curve.push({ u: POLE_EPS + t * (Math.PI / 2 - POLE_EPS), v: 0 });
  }

  const totalPoints = curve.length;

  // ── Parallel-transport the initial vector ──────────────────────────────
  // Start: V = [1, 0] in (θ, φ) coords — pointing in the ∂/∂θ direction.
  const initialVector: [number, number] = [1, 0];
  const vectors: (readonly [number, number])[] = [initialVector];

  // Precompute all tangent vectors (dθ/dλ, dφ/dλ) for each segment.
  for (let i = 0; i < totalPoints - 1; i++) {
    const p0 = curve[i];
    const p1 = curve[i + 1];
    const dTheta = p1.u - p0.u;
    const dPhi = p1.v - p0.v;
    const dlambda = Math.sqrt(dTheta * dTheta + dPhi * dPhi);
    if (dlambda < 1e-12) {
      vectors.push(vectors[vectors.length - 1]);
      continue;
    }
    const dxdlambda = [dTheta / dlambda, dPhi / dlambda];
    const x = [p0.u, p0.v] as const;
    const Gamma = christoffelSymbols(METRIC, x);
    const prevV = vectors[vectors.length - 1];
    const nextV = parallelTransportStep(prevV, Gamma, dxdlambda, dlambda);
    vectors.push(nextV as readonly [number, number]);
  }

  // ── Truncate to progress fraction ─────────────────────────────────────
  const cutIdx = Math.round(progressFrac * (totalPoints - 1));
  const curveTruncated = curve.slice(0, cutIdx + 1);
  const vectorsTruncated = vectors.slice(0, cutIdx + 1);

  return {
    curve: curveTruncated,
    initialVector,
    transportedVectors: vectorsTruncated,
    color: "#FF6ADE",
    label: "V",
  };
}

export function SphericalTriangleHolonomyScene() {
  const [progress, setProgress] = useState(1.0);
  const [rotationY, setRotationY] = useState(0.55);

  const transport = useMemo(() => buildTransport(progress), [progress]);

  const holonomyAngle = sphericalHolonomyAngle(Math.PI / 2, 1);
  const progressFraction = progress;
  const progressDeg = (progressFraction * holonomyAngle * (180 / Math.PI)).toFixed(1);

  return (
    <div className="flex flex-col items-center gap-3">
      <ManifoldCanvas
        embedding={EMBED}
        uRange={[0, Math.PI]}
        vRange={[0, 2 * Math.PI]}
        uSteps={12}
        vSteps={18}
        parallelTransport={transport}
        rotationY={rotationY}
        onRotationChange={setRotationY}
        rotationMin={-Math.PI}
        rotationMax={Math.PI}
        width={500}
        height={380}
        palette={{
          surface: "rgba(255,255,255,0.15)",
          transport: "#FF6ADE",
        }}
      />
      <label className="flex w-full max-w-[500px] items-center gap-3 font-mono text-xs text-white/70">
        <span className="shrink-0 w-20">progress</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.005}
          value={progress}
          onChange={(e) => setProgress(parseFloat(e.target.value))}
          className="flex-1"
        />
        <span className="shrink-0 w-12 text-right">{(progress * 100).toFixed(0)}%</span>
      </label>
      <div className="flex w-full max-w-[500px] flex-col gap-1 rounded-md border border-white/10 bg-white/5 p-3 font-mono text-xs text-white/70">
        <div className="flex justify-between">
          <span>enclosed area</span>
          <span className="text-white/90">π/2 sr (one octant)</span>
        </div>
        <div className="flex justify-between">
          <span>holonomy angle  Δθ = A/R²</span>
          <span className="text-[#FF6ADE] font-semibold">π/2 = 90°</span>
        </div>
        <div className="flex justify-between">
          <span>rotation so far</span>
          <span className="text-white/90">≈ {progressDeg}°</span>
        </div>
        <p className="mt-1 text-white/40 leading-relaxed">
          V starts pointing south (∂/∂θ). After traversing the full triangle it points east (∂/∂φ) — rotated 90°
          by the curvature of the sphere. Flat space cannot do this.
        </p>
      </div>
    </div>
  );
}
