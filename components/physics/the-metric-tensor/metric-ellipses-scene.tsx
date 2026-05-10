"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ManifoldCanvas } from "@/components/physics/_shared";
import { sphereEmbedding } from "@/lib/physics/relativity/manifolds";
import { sphericalMetric2D } from "@/lib/physics/relativity/metric";
import type { TangentArrow, ManifoldEmbedding } from "@/components/physics/_shared";
import { SCENE_HEIGHT_DEFAULT, useSceneSize, useSceneTokens } from "@/components/physics/_shared/scene-tokens";

/**
 * §07 METRIC ELLIPSES SCENE — FIG.31a
 *
 * A 2-sphere of radius 1. At five latitudes (north pole, 30°N, equator,
 * 30°S, south pole) we draw a pair of tangent arrows whose ambient length
 * is proportional to the metric scale factor at that point.
 *
 * h_θ arrows are drawn in CYAN; h_φ arrows in MAGENTA.
 * Rotation idles (slow drift) when the user is not interacting.
 *
 * Title: "METRIC AS LOCAL DISTANCE".
 */

const R = 1;
const EMBED: ManifoldEmbedding = sphereEmbedding(R);

// Scale factor for tangent arrows: keeps them visually manageable.
const SCALE = 0.55;

// Five latitudes: near north pole, 30°N, equator, 30°S, near south pole.
const THETA_VALS = [0.18, Math.PI / 6, Math.PI / 2, (5 * Math.PI) / 6, Math.PI - 0.18] as const;

function buildArrows(cyan: string, magenta: string): readonly TangentArrow[] {
  const v0 = Math.PI; // render at a fixed longitude so they're visible
  const arrows: TangentArrow[] = [];
  for (const theta of THETA_VALS) {
    const g = sphericalMetric2D(R, theta);
    const hTheta = Math.sqrt(g[0][0]); // = R (constant)
    const hPhi = Math.sqrt(g[1][1]); // = R sin θ

    // ∂/∂θ arrow (meridional) — CYAN
    arrows.push({
      base: { u: theta, v: v0 },
      vector: [SCALE * hTheta, 0] as const,
      color: cyan,
      label: `h_θ=${hTheta.toFixed(2)}`,
    });
    // ∂/∂φ arrow (azimuthal) — MAGENTA, only drawn where non-degenerate
    if (hPhi > 0.05) {
      arrows.push({
        base: { u: theta, v: v0 },
        vector: [0, SCALE * hPhi] as const,
        color: magenta,
      });
    }
  }
  return arrows;
}

// Idle rotation speed: ~0.4 rad / 4 s = slow drift
const IDLE_SPEED = 0.1; // rad per second

export function MetricEllipsesScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.76,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 280,
    initialWidth: 500,
  });
  const [rotY, setRotY] = useState(0.5);
  const rafRef = useRef<number>(0);
  const lastInteractRef = useRef<number>(0);
  const lastTimeRef = useRef<number | null>(null);
  const rotYRef = useRef(rotY);
  rotYRef.current = rotY;
  const tokens = useSceneTokens();
  const arrows = useMemo(
    () => buildArrows(tokens.cyan, tokens.magenta),
    [tokens.cyan, tokens.magenta],
  );

  // Idle-animate rotation when user hasn't touched the slider for >1.5 s
  useEffect(() => {
    const step = (t: number) => {
      if (lastTimeRef.current !== null) {
        const idle = t - lastInteractRef.current > 1500;
        if (idle) {
          const dt = (t - lastTimeRef.current) / 1000;
          const next = rotYRef.current + IDLE_SPEED * dt;
          // Keep within [-π, π]
          const wrapped = ((next + Math.PI) % (2 * Math.PI)) - Math.PI;
          setRotY(wrapped);
        }
      }
      lastTimeRef.current = t;
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const handleRotation = (v: number) => {
    lastInteractRef.current = performance.now();
    setRotY(v);
  };

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <ManifoldCanvas
        embedding={EMBED}
        uRange={[0, Math.PI]}
        vRange={[0, 2 * Math.PI]}
        uSteps={14}
        vSteps={20}
        tangentArrows={arrows}
        rotationY={rotY}
        onRotationChange={handleRotation}
        rotationMin={-Math.PI}
        rotationMax={Math.PI}
        width={width}
        height={height}
        palette={{
          surface: tokens.grid,
          highlight: tokens.cyan,
          transport: tokens.magenta,
          background: tokens.bg,
          axes: tokens.axes,
        }}
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-1)]">
        <span className="shrink-0 uppercase tracking-wide" style={{ color: tokens.textMute }}>
          metric as local distance
        </span>
        <span className="ml-auto flex items-center gap-2">
          <span style={{ color: tokens.cyan }}>▬ h_θ (meridional)</span>
          <span style={{ color: tokens.magenta }}>▬ h_φ (azimuthal)</span>
        </span>
      </div>
      <p className="mt-1 font-mono text-xs" style={{ color: tokens.textDim }}>
        Each arrow pair shows the Lamé scale factors at that latitude.
        Near the poles h_φ → 0; at the equator both arrows are equal.
      </p>
    </div>
  );
}
