"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ManifoldCanvas,
  SCENE_HEIGHT_DEFAULT,
  useSceneSize,
  useSceneTokens,
} from "@/components/physics/_shared";
import { sphereEmbedding } from "@/lib/physics/relativity/manifolds";
import type { TangentArrow, ManifoldEmbedding } from "@/components/physics/_shared";

/**
 * §07 SPHERE MANIFOLD SCENE
 *
 * A 2-sphere of radius 1 rendered as a latitude-longitude grid.
 * Three labeled tangent arrows are drawn at distinct points:
 *   • North pole (u ≈ 0.25, v = 0) — ∂/∂φ
 *   • Equator (u = π/2, v = π/2)   — ∂/∂θ
 *   • 45°N (u = π/4, v = π)        — ∂/∂θ
 *
 * A rotation slider is exposed so the reader can inspect the sphere from
 * any angle and verify that the tangent arrows genuinely lie on the surface.
 * When the user is not interacting, a slow continuous auto-rotation runs
 * (~30 s per full revolution).
 */

const EMBED: ManifoldEmbedding = sphereEmbedding(1);

// Slow auto-rotation: one full revolution in 30 s.
const AUTO_ROT_SPEED = (2 * Math.PI) / 30;

export function SphereManifoldScene() {
  const tokens = useSceneTokens();
  const containerRef = useRef<HTMLDivElement>(null);
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.76,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 280,
    initialWidth: 500,
  });
  const [theta, setTheta] = useState(0.7);
  const userInteractingRef = useRef(false);
  const lastInteractRef = useRef(0);

  const tangentArrows = useMemo<readonly TangentArrow[]>(
    () => [
      // North pole: small θ so the arrow is visible — ∂/∂φ direction
      {
        base: { u: 0.35, v: 0 },
        vector: [0, 1] as const,
        color: tokens.cyan,
        label: "∂/∂φ  (near north pole)",
      },
      // Equator: ∂/∂θ direction (meridional)
      {
        base: { u: Math.PI / 2, v: Math.PI / 2 },
        vector: [1, 0] as const,
        color: tokens.magenta,
        label: "∂/∂θ  (equator)",
      },
      // 45°N: ∂/∂θ direction
      {
        base: { u: Math.PI / 4, v: Math.PI },
        vector: [0, 1] as const,
        color: tokens.amber,
        label: "∂/∂φ  (45°N)",
      },
    ],
    [tokens.cyan, tokens.magenta, tokens.amber],
  );

  const palette = useMemo(
    () => ({
      surface: tokens.grid,
      highlight: tokens.cyan,
      transport: tokens.magenta,
      background: tokens.bg,
      axes: tokens.axes,
    }),
    [tokens.grid, tokens.cyan, tokens.magenta, tokens.bg, tokens.axes],
  );

  // Auto-rotation RAF loop — pauses briefly after user interaction.
  useEffect(() => {
    let raf = 0;
    let lastT = performance.now();

    const loop = (t: number) => {
      const dt = (t - lastT) / 1000;
      lastT = t;

      const idleSince = (t - lastInteractRef.current) / 1000;
      if (!userInteractingRef.current && idleSince > 1.5) {
        setTheta((prev) => prev + AUTO_ROT_SPEED * dt);
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleRotationChange = (v: number) => {
    userInteractingRef.current = true;
    lastInteractRef.current = performance.now();
    setTheta(v);
    // Allow auto-rotation to resume after a pause.
    setTimeout(() => {
      userInteractingRef.current = false;
    }, 100);
  };

  return (
    <div ref={containerRef} className="relative w-full flex flex-col items-center gap-3 pb-4">
      <ManifoldCanvas
        embedding={EMBED}
        uRange={[0, Math.PI]}
        vRange={[0, 2 * Math.PI]}
        uSteps={14}
        vSteps={20}
        tangentArrows={tangentArrows}
        rotationY={theta}
        onRotationChange={handleRotationChange}
        rotationMin={-Math.PI}
        rotationMax={Math.PI}
        width={width}
        height={height}
        palette={palette}
      />
      <div className="flex w-full flex-col gap-1 font-mono text-xs text-[var(--color-fg-3)]">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: tokens.cyan }} />
          <span>∂/∂φ near north pole</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: tokens.magenta }} />
          <span>∂/∂θ at the equator</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: tokens.amber }} />
          <span>∂/∂φ at 45°N</span>
        </div>
      </div>
    </div>
  );
}
