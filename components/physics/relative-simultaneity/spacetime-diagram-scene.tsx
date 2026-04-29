"use client";

import { useState } from "react";
import { SpacetimeDiagramCanvas } from "@/components/physics/_shared";
import type { Worldline } from "@/lib/physics/relativity/types";

/**
 * FIG.05b — Spacetime-diagram view of relative simultaneity.
 *
 * Two events A and B in the lab frame, simultaneous (same ct-coordinate)
 * and spatially separated. Drag β: the boosted-frame's simultaneity slice
 * tilts, and the events that lie on the lab's horizontal "now" line stop
 * sharing a t' coordinate.
 *
 *   • Lab axes (cyan ct, x).
 *   • Boosted axes (magenta ct', x') tilt symmetrically toward the light cone.
 *   • Magenta dashed simultaneity slice anchored to event A: the line of
 *     constant t' that passes through A. As β varies, that slice picks up
 *     a tilt of slope β; event B no longer lies on it.
 *
 * The geometry of the train-and-platform argument: same physical events,
 * different "horizontal" depending on who is moving.
 */

const EVENT_A = { x: -1, t: 2 } as const; // lab simultaneous events at ct = 2
const EVENT_B = { x: +1, t: 2 } as const;

export function SpacetimeDiagramScene() {
  const [beta, setBeta] = useState(0);

  // Worldline = single dot rendered as a 2-point degenerate polyline so the
  // canvas paints a marker. We use a tiny vertical stub so a 2.5-px stroke
  // shows as a visible point with its label attached.
  const eventDot = (
    p: { x: number; t: number },
    color: string,
    label: string,
  ): Worldline => ({
    events: [
      { t: p.t - 0.04, x: p.x, y: 0, z: 0 },
      { t: p.t + 0.04, x: p.x, y: 0, z: 0 },
    ],
    color,
    label,
  });

  const worldlines: Worldline[] = [
    eventDot(EVENT_A, "#FFD66B", "A"),
    eventDot(EVENT_B, "#FFD66B", "B"),
  ];

  // Anchor the simultaneity slice to event A in the boosted frame:
  //   t'_A = γ (t_A − β x_A)   (with c = 1, ct units throughout)
  const g = 1 / Math.sqrt(1 - beta * beta);
  const tPrimeA = g * (EVENT_A.t - beta * EVENT_A.x);

  // Δt' between B and A in the boosted frame (for the HUD).
  // Δt' = γ (Δt − β Δx) = γ (0 − β · 2) = -2 γ β  (in ct units)
  const dtPrime = g * ((EVENT_B.t - EVENT_A.t) - beta * (EVENT_B.x - EVENT_A.x));

  return (
    <div className="flex flex-col gap-2">
      <SpacetimeDiagramCanvas
        worldlines={worldlines}
        boostBeta={beta}
        onBoostChange={setBeta}
        simultaneitySlice={{ tPrime: tPrimeA, beta }}
        xRange={[-2, 2]}
        tRange={[0, 4]}
        width={520}
        height={360}
        lightCone
      />
      <div className="font-mono text-xs text-white/70">
        <p>
          A = (x = −1, ct = 2), B = (x = +1, ct = 2). Lab-frame Δt = 0.
        </p>
        <p>
          In the boost,{" "}
          <span className="text-[#FF6ADE]">
            Δt&apos; = γ (Δt − β Δx) = {dtPrime.toFixed(3)}
          </span>{" "}
          (ct units). Magenta dashed line: events on the boosted observer&apos;s
          &quot;now&quot; through A.
        </p>
      </div>
    </div>
  );
}
