"use client";

import { useState } from "react";
import { ManifoldCanvas } from "@/components/physics/_shared";
import { sphereEmbedding } from "@/lib/physics/relativity/manifolds";
import { sphericalMetric2D } from "@/lib/physics/relativity/metric";
import type { TangentArrow, ManifoldEmbedding } from "@/components/physics/_shared";

/**
 * §07 METRIC ELLIPSES SCENE — FIG.31a
 *
 * A 2-sphere of radius 1. At five latitudes (north pole, 30°N, equator,
 * 30°S, south pole) we draw a pair of tangent arrows whose ambient length
 * is proportional to the metric scale factor at that point.
 *
 * At the poles sin θ → 0 so the φ-arrow shrinks to nothing, while
 * at the equator sin θ = 1 and the two basis arrows are equal length.
 * This makes the non-uniform metric structure visible as non-uniform
 * ellipses of "infinitesimal balls."
 */

const R = 1;
const EMBED: ManifoldEmbedding = sphereEmbedding(R);

// Scale factor for tangent arrows: keeps them visually manageable.
const SCALE = 0.55;

function makeArrows(): readonly TangentArrow[] {
  const latitudes: Array<{ theta: number; color: string; label: string }> = [
    { theta: 0.18, color: "#67E8F9", label: "θ≈10°" },
    { theta: Math.PI / 6, color: "#A78BFA", label: "θ=30°" },
    { theta: Math.PI / 2, color: "#FF6ADE", label: "θ=90°" },
    { theta: (5 * Math.PI) / 6, color: "#FCD34D", label: "θ=150°" },
    { theta: Math.PI - 0.18, color: "#6EE7B7", label: "θ≈170°" },
  ];
  const v0 = Math.PI; // render at a fixed longitude so they're visible

  const arrows: TangentArrow[] = [];
  for (const { theta, color, label } of latitudes) {
    const g = sphericalMetric2D(R, theta);
    // h_θ = √g_{θθ} = R  (constant),  h_φ = √g_{φφ} = R sin θ
    const hTheta = Math.sqrt(g[0][0]); // = R
    const hPhi = Math.sqrt(g[1][1]); // = R sin θ

    // ∂/∂θ arrow (meridional)
    arrows.push({
      base: { u: theta, v: v0 },
      vector: [SCALE * hTheta, 0] as const,
      color,
      label: `h_θ=${hTheta.toFixed(2)} ${label}`,
    });
    // ∂/∂φ arrow (azimuthal) — only drawn where it's non-degenerate
    if (hPhi > 0.05) {
      arrows.push({
        base: { u: theta, v: v0 },
        vector: [0, SCALE * hPhi] as const,
        color,
      });
    }
  }
  return arrows;
}

const ARROWS = makeArrows();

export function MetricEllipsesScene() {
  const [rotY, setRotY] = useState(0.5);

  return (
    <div className="flex flex-col items-center gap-3">
      <ManifoldCanvas
        embedding={EMBED}
        uRange={[0, Math.PI]}
        vRange={[0, 2 * Math.PI]}
        uSteps={14}
        vSteps={20}
        tangentArrows={ARROWS}
        rotationY={rotY}
        onRotationChange={setRotY}
        rotationMin={-Math.PI}
        rotationMax={Math.PI}
        width={500}
        height={380}
      />
      <div className="flex w-full max-w-[500px] flex-col gap-1 font-mono text-xs text-white/60">
        <p className="text-white/80">
          Each pair of arrows shows the metric scale factors{" "}
          <span className="text-[#FF6ADE]">h_θ = R</span> and{" "}
          <span className="text-[#67E8F9]">h_φ = R sin θ</span> at that latitude.
        </p>
        <p>
          Near the poles h_φ → 0: the φ-arrow shrinks. At the equator both arrows
          have equal length. The metric encodes these varying distances.
        </p>
      </div>
    </div>
  );
}
