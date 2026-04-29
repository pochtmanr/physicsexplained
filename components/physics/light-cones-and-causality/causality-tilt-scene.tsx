"use client";

import { useState } from "react";
import { SpacetimeDiagramCanvas } from "@/components/physics/_shared";
import type { Worldline } from "@/lib/physics/relativity/types";

/**
 * FIG.13b — Causality vs. the elsewhere.
 *
 * Two event pairs share the diagram:
 *
 *   Pair 1 (timelike):   T1 = (x = 0, ct = 1),  T2 = (x = 0.4, ct = 2.5).
 *     s² = (1.5)² − (0.4)² ≈ 2.09 m² > 0  ⇒  timelike.
 *     T2 is in T1's future light cone in EVERY frame.
 *
 *   Pair 2 (spacelike):  S1 = (x = -1.5, ct = 1.4),  S2 = (x = 1.5, ct = 1.6).
 *     s² = (0.2)² − (3)² < 0                ⇒  spacelike.
 *     The temporal order of S1 and S2 flips at β > Δct/Δx ≈ 0.067.
 *
 * Pulling the β slider tilts the magenta boosted axes toward the light cone.
 * The HUD reports Δt' for each pair. Pair 1 stays positive; pair 2 crosses
 * zero and changes sign — the elsewhere has no frame-independent ordering.
 */

const PAIR_T = {
  a: { x: 0, ct: 1 },
  b: { x: 0.4, ct: 2.5 },
};

const PAIR_S = {
  a: { x: -1.5, ct: 1.4 },
  b: { x: 1.5, ct: 1.6 },
};

/** Build a tiny worldline blob at (x, ct) for marker rendering. */
function dotWorldline(
  x: number,
  ct: number,
  color: string,
  label: string,
): Worldline {
  return {
    events: [
      { t: ct - 0.05, x, y: 0, z: 0 },
      { t: ct + 0.05, x, y: 0, z: 0 },
    ],
    color,
    label,
  };
}

/** Δt' between (a, b) under a +x boost, in ct units (c = 1).
 *  Δt' = γ (Δt − β Δx)   (with Δt in ct units already). */
function deltaTPrime(
  a: { x: number; ct: number },
  b: { x: number; ct: number },
  beta: number,
): number {
  const g = 1 / Math.sqrt(1 - beta * beta);
  return g * ((b.ct - a.ct) - beta * (b.x - a.x));
}

export function CausalityTiltScene() {
  const [beta, setBeta] = useState(0);

  // Timelike pair drawn in cyan (their causal order is invariant).
  const t1 = dotWorldline(PAIR_T.a.x, PAIR_T.a.ct, "#67E8F9", "T1");
  const t2 = dotWorldline(PAIR_T.b.x, PAIR_T.b.ct, "#67E8F9", "T2");
  // Spacelike pair drawn in amber (their order tilts with the boost).
  const s1 = dotWorldline(PAIR_S.a.x, PAIR_S.a.ct, "#FFD66B", "S1");
  const s2 = dotWorldline(PAIR_S.b.x, PAIR_S.b.ct, "#FFD66B", "S2");

  const dtT = deltaTPrime(PAIR_T.a, PAIR_T.b, beta);
  const dtS = deltaTPrime(PAIR_S.a, PAIR_S.b, beta);

  // The boost that flips spacelike-pair temporal ordering.
  const flipBeta =
    (PAIR_S.b.ct - PAIR_S.a.ct) / (PAIR_S.b.x - PAIR_S.a.x);

  return (
    <div className="flex flex-col gap-2">
      <SpacetimeDiagramCanvas
        worldlines={[t1, t2, s1, s2]}
        boostBeta={beta}
        onBoostChange={setBeta}
        xRange={[-3, 3]}
        tRange={[-0.5, 3.5]}
        width={560}
        height={380}
        lightCone
      />
      <div className="grid grid-cols-1 gap-1 font-mono text-xs text-white/70 sm:grid-cols-2">
        <div>
          <span className="text-[#67E8F9]">timelike pair (T1 → T2):</span>{" "}
          Δt&apos; = {dtT.toFixed(3)} ct{" "}
          <span className="text-white/50">
            ({dtT > 0 ? "T2 still in T1&apos;s future" : "impossible — would violate s² > 0"})
          </span>
        </div>
        <div>
          <span className="text-[#FFD66B]">spacelike pair (S1, S2):</span>{" "}
          Δt&apos; = {dtS.toFixed(3)} ct{" "}
          <span className="text-white/50">
            ({Math.abs(dtS) < 0.02
              ? "simultaneous in this frame"
              : dtS > 0
                ? "S2 later"
                : "S1 later"})
          </span>
        </div>
      </div>
      <p className="font-mono text-[10px] text-white/45">
        At |β| ≳ {Math.abs(flipBeta).toFixed(3)} the spacelike pair&apos;s temporal order
        flips. The timelike pair&apos;s order is invariant for all |β| &lt; 1.
      </p>
    </div>
  );
}
