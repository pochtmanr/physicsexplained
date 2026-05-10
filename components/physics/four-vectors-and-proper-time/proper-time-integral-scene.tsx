"use client";

import { useMemo, useRef, useState } from "react";
import { SpacetimeDiagramCanvas } from "@/components/physics/_shared";
import { useSceneTokens } from "@/components/physics/_shared/scene-tokens";
import { properTimeAlongWorldline } from "@/lib/physics/relativity/four-vectors";
import type { MinkowskiPoint, Worldline } from "@/lib/physics/relativity/types";

/**
 * FIG.14b — A worldline drawn in (x, ct) coordinates with a running
 * proper-time accumulator. Stationary (cyan) vs uniformly-moving (magenta).
 */

const C_UNITS = 1;
const T_MAX = 4;
const N_SAMPLES = 80;

export function ProperTimeIntegralScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const tokens = useSceneTokens();
  const [beta, setBeta] = useState(0.6);
  const [progress, setProgress] = useState(1);

  const stationaryFull: MinkowskiPoint[] = useMemo(() => {
    const events: MinkowskiPoint[] = [];
    for (let i = 0; i <= N_SAMPLES; i++) {
      const t = (i / N_SAMPLES) * T_MAX;
      events.push({ t, x: 0, y: 0, z: 0 });
    }
    return events;
  }, []);

  const movingFull: MinkowskiPoint[] = useMemo(() => {
    const events: MinkowskiPoint[] = [];
    for (let i = 0; i <= N_SAMPLES; i++) {
      const t = (i / N_SAMPLES) * T_MAX;
      events.push({ t, x: beta * t, y: 0, z: 0 });
    }
    return events;
  }, [beta]);

  const cutoff = Math.max(2, Math.floor(progress * (N_SAMPLES + 1)));
  const stationaryPrefix = stationaryFull.slice(0, cutoff);
  const movingPrefix = movingFull.slice(0, cutoff);

  const tauStationary = properTimeAlongWorldline(stationaryPrefix, C_UNITS);
  const tauMoving = properTimeAlongWorldline(movingPrefix, C_UNITS);
  const labTime = stationaryPrefix.length > 0
    ? stationaryPrefix[stationaryPrefix.length - 1].t
    : 0;

  const worldlines: Worldline[] = useMemo(
    () => [
      {
        events: stationaryPrefix,
        color: tokens.cyan,
        label: `home  τ=${tauStationary.toFixed(2)}`,
      },
      {
        events: movingPrefix,
        color: tokens.magenta,
        label: `mover τ=${tauMoving.toFixed(2)}`,
      },
    ],
    [stationaryPrefix, movingPrefix, tauStationary, tauMoving, tokens],
  );

  const gammaApprox = labTime > 0 && tauMoving > 0 ? labTime / tauMoving : 1;

  return (
    <div ref={containerRef} className="flex flex-col gap-3 pb-4">
      <SpacetimeDiagramCanvas
        worldlines={worldlines}
        lightCone={true}
        xRange={[-2, 4]}
        tRange={[0, T_MAX]}
        width={520}
        height={340}
      />
      <div className="px-3 py-2 font-mono text-xs text-[var(--color-fg-2)]">
        <div>
          lab time t = {labTime.toFixed(2)}
        </div>
        <div style={{ color: tokens.cyan }}>
          home (β=0) — τ = {tauStationary.toFixed(3)} (= lab time, no dilation)
        </div>
        <div style={{ color: tokens.magenta }}>
          mover (β={beta.toFixed(2)}) — τ = {tauMoving.toFixed(3)}  (γ ≈ {gammaApprox.toFixed(3)})
        </div>
        <div className="mt-1 text-[var(--color-fg-3)]">
          ∫ dτ = ∫ dt √(1 − β²) — the §02.1 formula recovered geometrically.
        </div>
      </div>
      <div className="flex flex-col gap-2 px-1">
        <label className="flex items-center gap-3 font-mono text-xs text-[var(--color-fg-3)]">
          <span className="w-28">β (mover) = {beta.toFixed(2)}</span>
          <input
            type="range"
            min={0}
            max={0.95}
            step={0.01}
            value={beta}
            onChange={(e) => setBeta(parseFloat(e.target.value))}
            className="flex-1"
            style={{ accentColor: "var(--color-magenta)" }}
          />
        </label>
        <label className="flex items-center gap-3 font-mono text-xs text-[var(--color-fg-3)]">
          <span className="w-28">progress = {(progress * 100).toFixed(0)}%</span>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.01}
            value={progress}
            onChange={(e) => setProgress(parseFloat(e.target.value))}
            className="flex-1"
            style={{ accentColor: "var(--color-cyan)" }}
          />
        </label>
      </div>
    </div>
  );
}
