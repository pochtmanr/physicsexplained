"use client";

import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  ManifoldCanvas,
  useSceneTokens,
} from "@/components/physics/_shared";
import { sphereEmbedding } from "@/lib/physics/relativity/manifolds";
import {
  christoffelSymbols,
  parallelTransportStep,
  sphericalMetric,
} from "@/lib/physics/relativity/christoffel";
import type {
  ManifoldEmbedding,
  TangentArrow,
  ParallelTransportPath,
  ManifoldChartPoint,
} from "@/components/physics/_shared";

/**
 * RIEMANN VS FLAT SCENE — §08 THE RIEMANN TENSOR
 *
 * Two side-by-side ManifoldCanvas panels:
 *   Left  — flat plane (R = 0). FLAT (R=0) label. Closed loop returns the
 *            vector unchanged. GREEN vector arrows. CYAN surface.
 *   Right — unit sphere (R = 2). CURVED (R=2) label. Closed loop rotates the
 *            vector by area / R². GREEN vector arrows. MAGENTA surface.
 *
 * Controls (slider row): "show transport path" / "hide transport path" toggle
 * button, loop size slider.
 */

// ─── Flat plane ────────────────────────────────────────────────────────────────

const FLAT_EMBED: ManifoldEmbedding = (u, v) => [u, v, 0] as const;

function flatMetric(
  _x: readonly number[],
): readonly (readonly number[])[] {
  return [
    [1, 0],
    [0, 1],
  ];
}

// ─── Sphere ────────────────────────────────────────────────────────────────────

const SPHERE_EMBED: ManifoldEmbedding = sphereEmbedding(1);
const SPHERE_METRIC = sphericalMetric(1);

// ─── Tangent arrows (built from theme tokens) ──────────────────────────────────

function buildArrowSets(green: string): {
  flat: readonly TangentArrow[];
  sphere: readonly TangentArrow[];
} {
  return {
    flat: [
      { base: { u: 0.3, v: 0.3 }, vector: [1, 0], color: green, label: "V" },
      { base: { u: 0.3, v: -0.3 }, vector: [1, 0], color: green },
      { base: { u: -0.3, v: 0.3 }, vector: [1, 0], color: green },
      { base: { u: -0.3, v: -0.3 }, vector: [1, 0], color: green },
    ],
    sphere: [
      { base: { u: Math.PI / 4, v: 0 }, vector: [1, 0], color: green, label: "V" },
      {
        base: { u: Math.PI / 2, v: Math.PI / 2 },
        vector: [1, 0],
        color: green,
      },
      { base: { u: Math.PI * 0.7, v: Math.PI }, vector: [1, 0], color: green },
    ],
  };
}

// ─── Loop builders ─────────────────────────────────────────────────────────────

interface LoopTransport {
  curve: ManifoldChartPoint[];
  transported: (readonly [number, number])[];
}

function buildFlatLoop(size: number): LoopTransport {
  const steps = 40;
  const u0 = 0;
  const v0 = 0;
  const s = size * 0.5;
  const sides: Array<[number, number, number, number]> = [
    [u0, v0, u0 + s, v0],
    [u0 + s, v0, u0 + s, v0 + s],
    [u0 + s, v0 + s, u0, v0 + s],
    [u0, v0 + s, u0, v0],
  ];
  const curve: ManifoldChartPoint[] = [];
  let V: readonly number[] = [1, 0];
  const transported: (readonly [number, number])[] = [];

  for (const [u1, v1, u2, v2] of sides) {
    const du = (u2 - u1) / steps;
    const dv = (v2 - v1) / steps;
    const dxdl: readonly number[] = [du / (1 / steps), dv / (1 / steps)];
    for (let i = 0; i < steps; i++) {
      const u = u1 + i * du;
      const v = v1 + i * dv;
      curve.push({ u, v });
      transported.push([V[0], V[1]] as const);
      const Gamma = christoffelSymbols(flatMetric, [u, v]);
      V = parallelTransportStep(V, Gamma, dxdl, 1 / steps);
    }
  }
  curve.push({ u: u0, v: v0 });
  transported.push([V[0], V[1]] as const);
  return { curve, transported };
}

function buildSphereLoop(size: number): LoopTransport {
  const steps = 60;
  const th0 = Math.PI / 2;
  const ph0 = 0.1;
  const dth = 0.4 * size;
  const dph = 0.5 * size;
  const sides: Array<[number, number, number, number]> = [
    [th0, ph0, th0 + dth, ph0],
    [th0 + dth, ph0, th0 + dth, ph0 + dph],
    [th0 + dth, ph0 + dph, th0, ph0 + dph],
    [th0, ph0 + dph, th0, ph0],
  ];
  const curve: ManifoldChartPoint[] = [];
  let V: readonly number[] = [1, 0];
  const transported: (readonly [number, number])[] = [];

  for (const [u1, v1, u2, v2] of sides) {
    const du = (u2 - u1) / steps;
    const dv = (v2 - v1) / steps;
    const dxdl: readonly number[] = [du * steps, dv * steps];
    for (let i = 0; i < steps; i++) {
      const u = u1 + i * du;
      const v = v1 + i * dv;
      curve.push({ u, v });
      transported.push([V[0], V[1]] as const);
      const Gamma = christoffelSymbols(SPHERE_METRIC, [u, v]);
      V = parallelTransportStep(V, Gamma, dxdl, 1 / steps);
    }
  }
  curve.push({ u: th0, v: ph0 });
  transported.push([V[0], V[1]] as const);
  return { curve, transported };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RiemannVsFlatScene() {
  const tokens = useSceneTokens();
  const [showTransport, setShowTransport] = useState(false);
  const [loopSize, setLoopSize] = useState(0.6);
  const [flatRot, setFlatRot] = useState(0.4);
  const [sphereRot, setSphereRot] = useState(0.7);

  const flatLoop = buildFlatLoop(loopSize);
  const sphereLoop = buildSphereLoop(loopSize);
  const arrows = useMemo(() => buildArrowSets(tokens.green), [tokens.green]);

  const flatTransport: ParallelTransportPath | null = showTransport
    ? {
        curve: flatLoop.curve,
        initialVector: [1, 0],
        transportedVectors: flatLoop.transported,
        color: tokens.green,
        label: "V",
      }
    : null;

  const sphereTransport: ParallelTransportPath | null = showTransport
    ? {
        curve: sphereLoop.curve,
        initialVector: [1, 0],
        transportedVectors: sphereLoop.transported,
        color: tokens.green,
        label: "V",
      }
    : null;

  const area =
    Math.sin(Math.PI / 2) * 0.4 * loopSize * 0.5 * loopSize;
  const holoAngleDeg = ((area / (1 * 1)) * 180) / Math.PI;

  const handleFlatRot = useCallback((v: number) => setFlatRot(v), []);
  const handleSphereRot = useCallback((v: number) => setSphereRot(v), []);

  return (
    <div className="relative w-full pb-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Left: Flat plane */}
        <div className="flex flex-col items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-widest text-[var(--color-fg-3)]">
            FLAT (R=0)
          </span>
          <ManifoldCanvas
            embedding={FLAT_EMBED}
            uRange={[-1, 1]}
            vRange={[-1, 1]}
            uSteps={8}
            vSteps={8}
            tangentArrows={arrows.flat}
            parallelTransport={flatTransport}
            rotationY={flatRot}
            onRotationChange={handleFlatRot}
            rotationMin={-Math.PI}
            rotationMax={Math.PI}
            width={260}
            height={220}
            palette={{ surface: `${tokens.cyan}33`, highlight: tokens.cyan }}
          />
          <p className="font-mono text-xs" style={{ color: tokens.textDim }}>
            Loop returns V unchanged{" "}
            <span style={{ color: tokens.green }}>(δ = 0)</span>
          </p>
        </div>

        {/* Right: Sphere */}
        <div className="flex flex-col items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-widest text-[var(--color-fg-3)]">
            CURVED (R=2)
          </span>
          <ManifoldCanvas
            embedding={SPHERE_EMBED}
            uRange={[0, Math.PI]}
            vRange={[0, 2 * Math.PI]}
            uSteps={12}
            vSteps={18}
            tangentArrows={arrows.sphere}
            parallelTransport={sphereTransport}
            rotationY={sphereRot}
            onRotationChange={handleSphereRot}
            rotationMin={-Math.PI}
            rotationMax={Math.PI}
            width={260}
            height={220}
            palette={{ surface: `${tokens.magenta}33`, highlight: tokens.magenta }}
          />
          <p className="font-mono text-xs" style={{ color: tokens.textDim }}>
            Loop rotates V by ≈{" "}
            <span style={{ color: tokens.amber }}>
              {holoAngleDeg.toFixed(1)}°
            </span>{" "}
            (area/R²)
          </p>
        </div>
      </div>

      {/* Controls — canonical slider row */}
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <Button
          active={showTransport}
          size="sm"
          onClick={() => setShowTransport((v) => !v)}
          className="shrink-0"
        >
          {showTransport ? "hide transport path" : "show transport path"}
        </Button>
        <span className="shrink-0 text-[var(--color-fg-3)]">loop size</span>
        <input
          type="range"
          min={0.2}
          max={1.0}
          step={0.05}
          value={loopSize}
          onChange={(e) => setLoopSize(Number(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-cyan)" }}
        />
        <span className="w-10 text-right">{loopSize.toFixed(2)}</span>
      </div>

      {/* Info row */}
      <div
        className="mt-2 grid grid-cols-2 gap-4 font-mono text-[11px]"
        style={{ color: tokens.textMute }}
      >
        <div>
          <span style={{ color: tokens.cyan }}>Flat plane:</span> R = 0 everywhere. A
          cylinder is flat in this sense — you can unroll it.
        </div>
        <div>
          <span style={{ color: tokens.magenta }}>Unit sphere:</span> Ricci scalar =
          2/R² = 2. Intrinsic curvature — the transported vector arrives
          rotated.
        </div>
      </div>
    </div>
  );
}
