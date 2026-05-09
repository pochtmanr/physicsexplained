"use client";

import { useState, useEffect, useRef } from "react";
import { ManifoldCanvas } from "@/components/physics/_shared";
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
const BASE_U = Math.PI * (1 - 50 / 180);  // θ from north pole ≈ 130° → 50°N is θ = 40° = π*(40/180)
const BASE_V = Math.PI / 2;

// Re-derive: 50°N means latitude = 50° which is co-latitude θ = 90° - 50° = 40°
const THETA_50N = Math.PI * 40 / 180;

const TANGENT_ARROWS: readonly TangentArrow[] = [
  {
    base: { u: THETA_50N, v: BASE_V },
    vector: [1, 0] as const,
    color: "#67E8F9",
    label: "∂/∂θ",
  },
  {
    base: { u: THETA_50N, v: BASE_V },
    vector: [0, 1] as const,
    color: "#FF6ADE",
    label: "∂/∂φ",
  },
];

/**
 * Overlay that draws the tangent plane rectangle for the highlighted point.
 * This is a separate canvas drawn on top of the ManifoldCanvas output.
 * We keep it simple: just let the ManifoldCanvas arrows do the heavy lifting;
 * the "plane" is indicated by the two arrows forming a visible coordinate cross.
 */

export function TangentSpaceScene() {
  const [theta, setTheta] = useState(0.9);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <ManifoldCanvas
          embedding={EMBED}
          uRange={[0, Math.PI]}
          vRange={[0, 2 * Math.PI]}
          uSteps={14}
          vSteps={20}
          tangentArrows={TANGENT_ARROWS}
          rotationY={theta}
          onRotationChange={setTheta}
          rotationMin={-Math.PI}
          rotationMax={Math.PI}
          width={500}
          height={380}
          palette={{ highlight: "#67E8F9" }}
        />
        <TangentPlaneOverlay theta={theta} />
      </div>
      <div className="flex w-full max-w-[500px] flex-col gap-1 font-mono text-xs text-white/60">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-[#67E8F9]" />
          <span>∂/∂θ — meridional basis vector at the point</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-[#FF6ADE]" />
          <span>∂/∂φ — azimuthal basis vector at the point</span>
        </div>
        <p className="mt-1 text-white/40">
          T_pM is spanned by these two vectors. Every tangent vector at p is a
          linear combination v = v^θ ∂/∂θ + v^φ ∂/∂φ.
        </p>
      </div>
    </div>
  );
}

// ─── Tangent plane overlay (drawn as a faint rotated parallelogram) ────────────

function TangentPlaneOverlay({ theta }: { theta: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const W = 500;
  const H = 380;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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
    ctx.fillStyle = "rgba(251, 191, 36, 0.10)";
    ctx.strokeStyle = "rgba(251, 191, 36, 0.40)";
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
    ctx.fillStyle = "#FBBF24";
    ctx.beginPath();
    ctx.arc(bx, by, 4, 0, 2 * Math.PI);
    ctx.fill();

    // "T_p M" label
    ctx.fillStyle = "rgba(251,191,36,0.9)";
    ctx.font = "11px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText("T_p M", bx + 8, by - 10);
  }, [theta]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0"
      style={{ width: W, height: H }}
    />
  );
}
