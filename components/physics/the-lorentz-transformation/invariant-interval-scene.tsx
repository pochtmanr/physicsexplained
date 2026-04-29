"use client";

import { useState } from "react";
import { SpacetimeDiagramCanvas } from "@/components/physics/_shared";
import type { Worldline } from "@/lib/physics/relativity/types";
import { gamma } from "@/lib/physics/relativity/types";

/**
 * FIG.08b — Invariant spacetime interval s² = c²Δt² − Δx² preserved
 * under Lorentz boost.
 *
 * Three event-pair presets:
 *   · timelike  (s² > 0): event at (Δt = 2, Δx = 1) — inside the lightcone
 *   · null      (s² = 0): event at (Δt = 1.5, Δx = 1.5) — on the lightcone
 *   · spacelike (s² < 0): event at (Δt = 0.5, Δx = 1.5) — outside lightcone
 *
 * As β slides, the boosted frame's t' and x' axes tilt symmetrically toward
 * the light cone. The two events' coordinates change frame-by-frame, but
 * the scalar s² that we print in the HUD does NOT — that is the geometric
 * statement of Lorentz invariance.
 *
 * Wraps the shared `SpacetimeDiagramCanvas` primitive (Wave 1.5). We pass
 * each event pair as two trivial worldlines (one event each, with a small
 * connecting hyperlink line drawn as a third worldline).
 *
 * Convention: t-axis is in light-seconds (so c·t and x share units), x-axis
 * in light-seconds. That keeps the lightcone at slope ±1.
 */

type Preset = "timelike" | "null" | "spacelike";

interface EventPair {
  label: string;
  A: { t: number; x: number };
  B: { t: number; x: number };
}

const PRESETS: Record<Preset, EventPair> = {
  timelike: {
    label: "TIMELIKE   s² > 0",
    A: { t: 0, x: 0 },
    B: { t: 2, x: 1 },
  },
  null: {
    label: "NULL  (LIGHT)  s² = 0",
    A: { t: 0, x: 0 },
    B: { t: 1.5, x: 1.5 },
  },
  spacelike: {
    label: "SPACELIKE  s² < 0",
    A: { t: 0, x: 0 },
    B: { t: 0.5, x: 1.5 },
  },
};

export function InvariantIntervalScene() {
  const [beta, setBeta] = useState(0.0);
  const [preset, setPreset] = useState<Preset>("timelike");

  const pair = PRESETS[preset];

  // Compute the boosted-frame (t', x') of each event using the Lorentz
  // formulas in normalised units (c = 1 light-second per second).
  const g = gamma(beta);
  const boost = (e: { t: number; x: number }) => ({
    t: g * (e.t - beta * e.x),
    x: g * (e.x - beta * e.t),
  });
  const Ap = boost(pair.A);
  const Bp = boost(pair.B);

  // Invariant interval s² = (Δt)² − (Δx)² in normalised c=1 units.
  const dt = pair.B.t - pair.A.t;
  const dx = pair.B.x - pair.A.x;
  const s2Lab = dt * dt - dx * dx;
  const dtP = Bp.t - Ap.t;
  const dxP = Bp.x - Ap.x;
  const s2Boost = dtP * dtP - dxP * dxP;

  // Build worldlines: one short segment for event A → B (cyan); a thin
  // segment from origin to A (acts as a marker if A != origin); one short
  // segment in the boosted frame, drawn in magenta (we draw it manually by
  // computing the inverse-projected boosted-frame coordinates back into the
  // lab plot — i.e. show where the events sit in the SAME diagram).
  const worldlines: Worldline[] = [
    {
      color: "#67E8F9",
      label: `A,B (s²=${s2Lab.toFixed(2)})`,
      events: [
        { t: pair.A.t, x: pair.A.x, y: 0, z: 0 },
        { t: pair.B.t, x: pair.B.x, y: 0, z: 0 },
      ],
    },
  ];

  return (
    <div className="flex flex-col items-center gap-3 p-4">
      <div className="flex gap-2 font-mono text-xs">
        {(Object.keys(PRESETS) as Preset[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setPreset(k)}
            className={`rounded border px-3 py-1 transition ${
              preset === k
                ? "border-white/60 bg-white/10 text-white"
                : "border-white/15 text-white/60 hover:border-white/30 hover:text-white/85"
            }`}
          >
            {PRESETS[k].label}
          </button>
        ))}
      </div>

      <SpacetimeDiagramCanvas
        worldlines={worldlines}
        lightCone
        boostBeta={beta}
        onBoostChange={setBeta}
        boostMin={0}
        boostMax={0.9}
        boostStep={0.01}
        xRange={[-2, 3]}
        tRange={[-0.5, 3]}
        width={520}
        height={360}
      />

      <div className="grid w-full max-w-[520px] grid-cols-2 gap-x-6 gap-y-1 font-mono text-xs text-white/70">
        <span className="text-white/85">LAB FRAME</span>
        <span className="text-white/85">BOOSTED FRAME (β = {beta.toFixed(2)})</span>
        <span>A = ({pair.A.t.toFixed(2)}, {pair.A.x.toFixed(2)})</span>
        <span>A' = ({Ap.t.toFixed(2)}, {Ap.x.toFixed(2)})</span>
        <span>B = ({pair.B.t.toFixed(2)}, {pair.B.x.toFixed(2)})</span>
        <span>B' = ({Bp.t.toFixed(2)}, {Bp.x.toFixed(2)})</span>
        <span>Δt = {dt.toFixed(2)},  Δx = {dx.toFixed(2)}</span>
        <span>Δt' = {dtP.toFixed(2)},  Δx' = {dxP.toFixed(2)}</span>
        <span className="text-cyan-300">s² = {s2Lab.toFixed(4)}</span>
        <span className="text-fuchsia-300">s'² = {s2Boost.toFixed(4)}</span>
      </div>
      <p className="font-mono text-[11px] text-white/55">
        s² is invariant: |s² − s'²| = {Math.abs(s2Lab - s2Boost).toExponential(2)}
      </p>
    </div>
  );
}
