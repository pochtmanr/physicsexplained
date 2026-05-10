"use client";

import { useMemo, useRef, useState } from "react";
import {
  ManifoldCanvas,
  SCENE_HEIGHT_DEFAULT,
  hexToRgba,
  useSceneSize,
  useSceneTokens,
} from "@/components/physics/_shared";
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
 * Design: scene-tokens palette + idle sphere rotation.
 */

const EMBED = sphereEmbedding(1);
const METRIC = sphericalMetric(1);
const STEPS_PER_LEG = 60;

/** Build the closed triangle curve and transport vectors up to `progressFrac` ∈ [0,1]. */
function buildTransport(progressFrac: number, color: string): ParallelTransportPath {
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
    color,
    label: "V",
  };
}

export function SphericalTriangleHolonomyScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.76,
    maxHeight: SCENE_HEIGHT_DEFAULT,
  });
  const [progress, setProgress] = useState(1.0);
  const [rotationY, setRotationY] = useState(0.55);

  const transport = useMemo(
    () => buildTransport(progress, tokens.magenta),
    [progress, tokens.magenta],
  );

  const holonomyAngle = sphericalHolonomyAngle(Math.PI / 2, 1);
  const progressFraction = progress;
  const progressDeg = (progressFraction * holonomyAngle * (180 / Math.PI)).toFixed(1);
  const enclosedArea = (Math.PI / 2).toFixed(3);

  return (
    <div ref={containerRef} className="relative w-full flex flex-col items-center gap-3 pb-4">
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
        width={width}
        height={height}
        palette={{
          surface: hexToRgba(tokens.cyan, 0.4),
          transport: tokens.magenta,
          background: tokens.bg,
          highlight: tokens.cyan,
        }}
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-1)] w-full">
        <span className="shrink-0 w-20">progress</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.005}
          value={progress}
          onChange={(e) => setProgress(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-magenta)" }}
        />
        <span className="shrink-0 w-12 text-right">{(progress * 100).toFixed(0)}%</span>
      </div>
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-1)] w-full">
        <span className="shrink-0 w-20">rotate</span>
        <input
          type="range"
          min={-Math.PI}
          max={Math.PI}
          step={0.01}
          value={rotationY}
          onChange={(e) => setRotationY(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-cyan)" }}
        />
        <span className="shrink-0 w-12 text-right">{rotationY.toFixed(2)}</span>
      </div>
      {/* HUD card — mirrors the canvas HUD readout in HTML for accessibility */}
      <div className="flex w-full flex-col gap-1 rounded-md border border-[var(--color-fg-4)] bg-[var(--color-bg-1)] p-3 font-mono text-xs">
        <p className="text-[var(--color-fg-3)] uppercase tracking-wider text-[11px] mb-1">Parallel Transport</p>
        <div className="flex justify-between">
          <span className="text-[var(--color-fg-2)]">enclosed area:</span>
          <span style={{ color: tokens.amber }} className="font-semibold">{enclosedArea} sr</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--color-fg-2)]">rotation: Δθ = A/R²</span>
          <span style={{ color: tokens.green }} className="font-semibold">
            {(holonomyAngle * 180 / Math.PI).toFixed(2)}° (full)
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--color-fg-2)]">rotation so far:</span>
          <span className="text-[var(--color-fg-0)]">≈ {progressDeg}°</span>
        </div>
        <p className="mt-1 text-[var(--color-fg-3)] leading-relaxed">
          V starts pointing south (∂/∂θ). After traversing the full triangle it points east (∂/∂φ) — rotated 90°
          by the curvature of the sphere. Flat space cannot do this.
        </p>
      </div>
    </div>
  );
}
