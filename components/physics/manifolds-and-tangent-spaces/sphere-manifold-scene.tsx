"use client";

import { useState } from "react";
import { ManifoldCanvas } from "@/components/physics/_shared";
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
 */

const EMBED: ManifoldEmbedding = sphereEmbedding(1);

const TANGENT_ARROWS: readonly TangentArrow[] = [
  // North pole: small θ so the arrow is visible — ∂/∂φ direction
  {
    base: { u: 0.35, v: 0 },
    vector: [0, 1] as const,
    color: "#67E8F9",
    label: "∂/∂φ  (near north pole)",
  },
  // Equator: ∂/∂θ direction (meridional)
  {
    base: { u: Math.PI / 2, v: Math.PI / 2 },
    vector: [1, 0] as const,
    color: "#FF6ADE",
    label: "∂/∂θ  (equator)",
  },
  // 45°N: ∂/∂θ direction
  {
    base: { u: Math.PI / 4, v: Math.PI },
    vector: [0, 1] as const,
    color: "#FBBF24",
    label: "∂/∂φ  (45°N)",
  },
];

export function SphereManifoldScene() {
  const [theta, setTheta] = useState(0.7);

  return (
    <div className="flex flex-col items-center gap-3">
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
      />
      <div className="flex w-full max-w-[500px] flex-col gap-1 font-mono text-xs text-white/60">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-[#67E8F9]" />
          <span>∂/∂φ near north pole</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-[#FF6ADE]" />
          <span>∂/∂θ at the equator</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-[#FBBF24]" />
          <span>∂/∂φ at 45°N</span>
        </div>
      </div>
    </div>
  );
}
