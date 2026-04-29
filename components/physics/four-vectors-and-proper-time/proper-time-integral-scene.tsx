"use client";

import { useMemo, useState } from "react";
import { SpacetimeDiagramCanvas } from "@/components/physics/_shared";
import { properTimeAlongWorldline } from "@/lib/physics/relativity/four-vectors";
import type { MinkowskiPoint, Worldline } from "@/lib/physics/relativity/types";

/**
 * FIG.14b — A worldline drawn in (x, ct) coordinates, with a running
 * proper-time accumulator displayed beneath. The slider sweeps the
 * worldline's β; an animation knob (segment count / progress) is replaced
 * here by a deterministic "progress" slider that determines how much of
 * the worldline has been traversed so far. The proper-time accumulator
 * shows ∫dτ along the traversed prefix.
 *
 * Two worldlines are drawn together so the geometric content is visible:
 *   • a stationary worldline (cyan) at x = 0 — its lab time and proper time
 *     are equal, providing the reference clock.
 *   • a uniformly-moving worldline (magenta) at velocity βc — its proper
 *     time is lab time / γ, exactly the §02.1 time-dilation formula
 *     recovered as a special case of the geometric integral.
 *
 * The HUD prints both proper-time accumulators side by side, so the reader
 * can see the moving clock fall behind by a factor of γ as the integration
 * proceeds.
 *
 * The (x, ct) coordinates are dimensionless here — events are sampled on a
 * unit grid and the speed of light is 1 in these units, so light worldlines
 * are at exactly 45°. The {@link properTimeAlongWorldline} helper accepts
 * any consistent units provided c matches them; we pass c = 1 to keep the
 * arithmetic clean for the visualisation.
 */

const C_UNITS = 1;
const T_MAX = 4;
const N_SAMPLES = 80;

export function ProperTimeIntegralScene() {
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

  // Truncate to the progress fraction.
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
        color: "#67E8F9",
        label: `home  τ=${tauStationary.toFixed(2)}`,
      },
      {
        events: movingPrefix,
        color: "#FF6ADE",
        label: `mover τ=${tauMoving.toFixed(2)}`,
      },
    ],
    [stationaryPrefix, movingPrefix, tauStationary, tauMoving],
  );

  const gammaApprox = labTime > 0 && tauMoving > 0 ? labTime / tauMoving : 1;

  return (
    <div className="flex flex-col gap-3 p-2">
      <SpacetimeDiagramCanvas
        worldlines={worldlines}
        lightCone={true}
        xRange={[-2, 4]}
        tRange={[0, T_MAX]}
        width={520}
        height={340}
      />
      <div className="rounded-md border border-white/10 bg-black/40 px-3 py-2 font-mono text-xs text-white/80">
        <div>
          lab time t = {labTime.toFixed(2)}
        </div>
        <div className="text-cyan-300">
          home (β=0) — τ = {tauStationary.toFixed(3)} (= lab time, no dilation)
        </div>
        <div className="text-fuchsia-300">
          mover (β={beta.toFixed(2)}) — τ = {tauMoving.toFixed(3)}  (γ ≈ {gammaApprox.toFixed(3)})
        </div>
        <div className="mt-1 text-white/55">
          ∫ dτ = ∫ dt √(1 − β²) — the §02.1 formula recovered geometrically.
        </div>
      </div>
      <div className="flex flex-col gap-2 px-1">
        <label className="flex items-center gap-3 font-mono text-xs text-white/70">
          <span className="w-28">β (mover) = {beta.toFixed(2)}</span>
          <input
            type="range"
            min={0}
            max={0.95}
            step={0.01}
            value={beta}
            onChange={(e) => setBeta(parseFloat(e.target.value))}
            className="flex-1"
          />
        </label>
        <label className="flex items-center gap-3 font-mono text-xs text-white/70">
          <span className="w-28">progress = {(progress * 100).toFixed(0)}%</span>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.01}
            value={progress}
            onChange={(e) => setProgress(parseFloat(e.target.value))}
            className="flex-1"
          />
        </label>
      </div>
    </div>
  );
}
