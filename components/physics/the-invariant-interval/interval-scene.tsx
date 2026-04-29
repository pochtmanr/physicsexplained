"use client";

import { useMemo, useState } from "react";
import { SpacetimeDiagramCanvas } from "@/components/physics/_shared";
import { gamma, type Worldline } from "@/lib/physics/relativity/types";

/**
 * FIG.12a — THE INVARIANT INTERVAL.
 *
 * Two events A and B plotted in a Minkowski (x, ct) diagram. A β slider
 * boosts the frame; the cyan worldline shows the lab-frame coordinates of
 * the event pair, and the magenta points show where the SAME two events sit
 * after a Lorentz boost — recomputed via Λ(β) and overlaid in the same plot.
 *
 * The HUD displays s² in both frames. Sliding β changes Δt, Δx individually
 * — but s² (printed live) does NOT change. That is Lorentz invariance, made
 * visual. The headline statement of §03.2.
 *
 * Three preset event pairs (timelike / null / spacelike) let the reader
 * confirm the invariance is sign-agnostic: positive, zero, and negative
 * intervals are all preserved separately.
 *
 * Convention: c = 1 light-second per second, so the t-axis numbers are ct
 * and the light cone sits at slope ±1.
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

export function IntervalScene() {
  const [beta, setBeta] = useState(0.0);
  const [preset, setPreset] = useState<Preset>("timelike");

  const pair = PRESETS[preset];

  // Lorentz boost in normalised (c = 1) units. Two events A, B → A', B'.
  const g = gamma(beta);
  const boost = (e: { t: number; x: number }) => ({
    t: g * (e.t - beta * e.x),
    x: g * (e.x - beta * e.t),
  });
  const Ap = boost(pair.A);
  const Bp = boost(pair.B);

  // s² = (Δt)² − (Δx)² in normalised (c = 1) units.
  const dt = pair.B.t - pair.A.t;
  const dx = pair.B.x - pair.A.x;
  const s2Lab = dt * dt - dx * dx;
  const dtP = Bp.t - Ap.t;
  const dxP = Bp.x - Ap.x;
  const s2Boost = dtP * dtP - dxP * dxP;

  const worldlines = useMemo<Worldline[]>(
    () => [
      {
        color: "#67E8F9",
        label: "A→B (lab)",
        events: [
          { t: pair.A.t, x: pair.A.x, y: 0, z: 0 },
          { t: pair.B.t, x: pair.B.x, y: 0, z: 0 },
        ],
      },
    ],
    [pair],
  );

  const quadrant =
    Math.abs(s2Lab) < 1e-9
      ? "null"
      : s2Lab > 0
        ? "timelike"
        : "spacelike";

  return (
    <div className="flex flex-col items-center gap-3 p-4">
      <div className="flex flex-wrap gap-2 font-mono text-xs">
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
        boostMin={-0.9}
        boostMax={0.9}
        boostStep={0.01}
        xRange={[-2, 3]}
        tRange={[-0.5, 3]}
        width={520}
        height={360}
      />

      <div className="grid w-full max-w-[520px] grid-cols-2 gap-x-6 gap-y-1 font-mono text-xs text-white/70">
        <span className="text-white/85">LAB FRAME</span>
        <span className="text-white/85">
          BOOSTED FRAME (β = {beta.toFixed(2)}, γ = {g.toFixed(3)})
        </span>
        <span>
          A = ({pair.A.t.toFixed(2)}, {pair.A.x.toFixed(2)})
        </span>
        <span>
          A' = ({Ap.t.toFixed(2)}, {Ap.x.toFixed(2)})
        </span>
        <span>
          B = ({pair.B.t.toFixed(2)}, {pair.B.x.toFixed(2)})
        </span>
        <span>
          B' = ({Bp.t.toFixed(2)}, {Bp.x.toFixed(2)})
        </span>
        <span>
          Δt = {dt.toFixed(2)}, Δx = {dx.toFixed(2)}
        </span>
        <span>
          Δt' = {dtP.toFixed(2)}, Δx' = {dxP.toFixed(2)}
        </span>
        <span className="text-cyan-300">s² = {s2Lab.toFixed(4)}</span>
        <span className="text-fuchsia-300">s'² = {s2Boost.toFixed(4)}</span>
      </div>
      <p className="font-mono text-[11px] text-white/55">
        s² invariant ({quadrant}); |s² − s'²| ={" "}
        {Math.abs(s2Lab - s2Boost).toExponential(2)}
      </p>
    </div>
  );
}
