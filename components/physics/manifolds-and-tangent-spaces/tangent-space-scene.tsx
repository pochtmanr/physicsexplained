"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  ManifoldCanvas,
  FONT_HUD_SMALL,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  hexToRgba,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared";
import { sphereEmbedding } from "@/lib/physics/relativity/manifolds";
import type { TangentArrow, ManifoldEmbedding } from "@/components/physics/_shared";

/**
 * §07 TANGENT SPACE SCENE
 *
 * A single sphere with one highlighted point; the tangent plane at that point
 * is sketched as a rotated rectangle in a faint color; and a basis pair
 * ∂/∂θ, ∂/∂φ is drawn as two orthogonal tangent arrows at that point.
 *
 * A rotation slider lets the reader orbit the sphere.
 */

const EMBED: ManifoldEmbedding = sphereEmbedding(1);

// Highlighted point: 50°N, φ = π/2 (on the left-side meridian)
const BASE_V = Math.PI / 2;

// Re-derive: 50°N means latitude = 50° which is co-latitude θ = 90° - 50° = 40°
const THETA_50N = (Math.PI * 40) / 180;

/**
 * Overlay that draws the tangent plane rectangle for the highlighted point.
 * This is a separate canvas drawn on top of the ManifoldCanvas output.
 * We keep it simple: just let the ManifoldCanvas arrows do the heavy lifting;
 * the "plane" is indicated by the two arrows forming a visible coordinate cross.
 */

export function TangentSpaceScene() {
  const tokens = useSceneTokens();
  const containerRef = useRef<HTMLDivElement>(null);
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.76,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 280,
    initialWidth: 500,
  });
  const [theta, setTheta] = useState(0.9);

  const tangentArrows = useMemo<readonly TangentArrow[]>(
    () => [
      {
        base: { u: THETA_50N, v: BASE_V },
        vector: [1, 0] as const,
        color: tokens.cyan,
        label: "∂/∂θ",
      },
      {
        base: { u: THETA_50N, v: BASE_V },
        vector: [0, 1] as const,
        color: tokens.magenta,
        label: "∂/∂φ",
      },
    ],
    [tokens.cyan, tokens.magenta],
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

  return (
    <div ref={containerRef} className="relative w-full flex flex-col items-center gap-3 pb-4">
      <div className="relative" style={{ width, height }}>
        <ManifoldCanvas
          embedding={EMBED}
          uRange={[0, Math.PI]}
          vRange={[0, 2 * Math.PI]}
          uSteps={14}
          vSteps={20}
          tangentArrows={tangentArrows}
          rotationY={theta}
          onRotationChange={setTheta}
          rotationMin={-Math.PI}
          rotationMax={Math.PI}
          width={width}
          height={height}
          palette={palette}
        />
        <TangentPlaneOverlay theta={theta} tokens={tokens} width={width} height={height} />
      </div>
      <div className="flex w-full flex-col gap-1 font-mono text-xs text-[var(--color-fg-3)]">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: tokens.cyan }} />
          <span>∂/∂θ — meridional basis vector at the point</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: tokens.magenta }} />
          <span>∂/∂φ — azimuthal basis vector at the point</span>
        </div>
        <p className="mt-1 text-[var(--color-fg-4)]">
          T_pM is spanned by these two vectors. Every tangent vector at p is a
          linear combination v = v^θ ∂/∂θ + v^φ ∂/∂φ.
        </p>
      </div>
    </div>
  );
}

// ─── Tangent plane overlay (drawn as a faint rotated parallelogram) ────────────

function TangentPlaneOverlay({
  theta,
  tokens,
  width,
  height,
}: {
  theta: number;
  tokens: SceneTokens;
  width: number;
  height: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const W = width;
  const H = height;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, W, H);
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);

    // We need to replicate the same projection math used by ManifoldCanvas
    // to know where the highlighted point ends up on screen.
    const embed = sphereEmbedding(1);
    const eps = 1e-3;

    // Rotation around Y
    const rotateY = (
      p: readonly [number, number, number],
      t: number,
    ): readonly [number, number, number] => {
      const c = Math.cos(t);
      const s = Math.sin(t);
      return [c * p[0] + s * p[2], p[1], -s * p[0] + c * p[2]];
    };

    // Compute scale/center from the sphere (mirror ManifoldCanvas logic)
    const uRange: [number, number] = [0, Math.PI];
    const vRange: [number, number] = [0, 2 * Math.PI];
    const denseU = 24;
    const denseV = 32;
    let sumX = 0, sumY = 0, count = 0;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (let i = 0; i <= denseU; i++) {
      const u = uRange[0] + ((uRange[1] - uRange[0]) * i) / denseU;
      for (let j = 0; j <= denseV; j++) {
        const v = vRange[0] + ((vRange[1] - vRange[0]) * j) / denseV;
        const p = rotateY(embed(u, v), theta);
        sumX += p[0]; sumY += p[1]; count++;
        if (p[0] < minX) minX = p[0];
        if (p[0] > maxX) maxX = p[0];
        if (p[1] < minY) minY = p[1];
        if (p[1] > maxY) maxY = p[1];
      }
    }
    const cx = count > 0 ? sumX / count : 0;
    const cy = count > 0 ? sumY / count : 0;
    const spanX = Math.max(1e-6, maxX - minX);
    const spanY = Math.max(1e-6, maxY - minY);
    const margin = 24;
    const scale = Math.min((W - 2 * margin) / spanX, (H - 2 * margin) / spanY);

    const toScreen = (p: readonly [number, number, number]): [number, number] => {
      const r = rotateY(p, theta);
      return [W / 2 + (r[0] - cx) * scale, H / 2 - (r[1] - cy) * scale];
    };

    const baseP = embed(THETA_50N, BASE_V);
    const puP = embed(THETA_50N + eps, BASE_V);
    const pvP = embed(THETA_50N, BASE_V + eps);

    const eu: [number, number, number] = [
      (puP[0] - baseP[0]) / eps,
      (puP[1] - baseP[1]) / eps,
      (puP[2] - baseP[2]) / eps,
    ];
    const ev: [number, number, number] = [
      (pvP[0] - baseP[0]) / eps,
      (pvP[1] - baseP[1]) / eps,
      (pvP[2] - baseP[2]) / eps,
    ];

    const PLANE_SIZE = 0.45;

    // Four corners of the tangent plane parallelogram
    const corners: readonly [number, number, number][] = [
      [
        baseP[0] - PLANE_SIZE * eu[0] - PLANE_SIZE * ev[0],
        baseP[1] - PLANE_SIZE * eu[1] - PLANE_SIZE * ev[1],
        baseP[2] - PLANE_SIZE * eu[2] - PLANE_SIZE * ev[2],
      ],
      [
        baseP[0] + PLANE_SIZE * eu[0] - PLANE_SIZE * ev[0],
        baseP[1] + PLANE_SIZE * eu[1] - PLANE_SIZE * ev[1],
        baseP[2] + PLANE_SIZE * eu[2] - PLANE_SIZE * ev[2],
      ],
      [
        baseP[0] + PLANE_SIZE * eu[0] + PLANE_SIZE * ev[0],
        baseP[1] + PLANE_SIZE * eu[1] + PLANE_SIZE * ev[1],
        baseP[2] + PLANE_SIZE * eu[2] + PLANE_SIZE * ev[2],
      ],
      [
        baseP[0] - PLANE_SIZE * eu[0] + PLANE_SIZE * ev[0],
        baseP[1] - PLANE_SIZE * eu[1] + PLANE_SIZE * ev[1],
        baseP[2] - PLANE_SIZE * eu[2] + PLANE_SIZE * ev[2],
      ],
    ];

    const screenCorners = corners.map(toScreen);

    // Draw the tangent plane as a faint filled quadrilateral
    ctx.fillStyle = hexToRgba(tokens.amber, 0.10);
    ctx.strokeStyle = hexToRgba(tokens.amber, 0.40);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(screenCorners[0][0], screenCorners[0][1]);
    for (let i = 1; i < screenCorners.length; i++) {
      ctx.lineTo(screenCorners[i][0], screenCorners[i][1]);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Dot at the base point
    const [bx, by] = toScreen(baseP);
    ctx.fillStyle = tokens.amber;
    ctx.beginPath();
    ctx.arc(bx, by, 4, 0, 2 * Math.PI);
    ctx.fill();

    // "T_p M" label
    ctx.fillStyle = hexToRgba(tokens.amber, 0.9);
    ctx.font = FONT_HUD_SMALL;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("T_p M", bx + 8, by - 10);
  }, [theta, tokens, W, H]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0"
      style={{ width: W, height: H }}
    />
  );
}
