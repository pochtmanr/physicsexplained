"use client";

import { useMemo, useState } from "react";
import { SpacetimeDiagramCanvas } from "@/components/physics/_shared";
import { gamma, type Worldline } from "@/lib/physics/relativity/types";

/**
 * §02.1 SPACETIME-DIAGRAM rendering of two light clocks.
 *
 * Two worldlines drawn in a Minkowski (x, ct) diagram:
 *   • cyan, vertical: a stationary clock at x = 0.
 *   • magenta, tilted at slope 1/β: a moving clock with velocity βc.
 *
 * Each worldline is decorated with TICK MARKS that occur at intervals
 * corresponding to the clock's PROPER time. Crucially, the tilted
 * (moving) clock's ticks are spaced at lab-time intervals of γ — so per
 * unit of lab time, the moving clock has visibly fewer ticks.
 *
 * Light-pulse zigzags between mirrors are not drawn here — instead the
 * light-cone (45° dashed lines) is the scene's visual reference for the
 * postulate of constant c. The §02.1 light-clock-scene shows the
 * mirror-bouncing animation; this scene shows the GEOMETRY.
 */

const T_RANGE: [number, number] = [0, 6];
const X_RANGE: [number, number] = [-3, 3];
const PROPER_TICK = 1; // proper-time tick interval in same units as ct

export function SpacetimeClockScene() {
  const [beta, setBeta] = useState(0.6);

  const worldlines = useMemo<Worldline[]>(() => {
    const stationary: Worldline = {
      events: Array.from({ length: 65 }, (_, i) => ({
        t: T_RANGE[0] + (i / 64) * (T_RANGE[1] - T_RANGE[0]),
        x: 0,
        y: 0,
        z: 0,
      })),
      color: "#67E8F9",
      label: "rest",
    };
    // Moving clock: x = β · ct, so events parameterized by lab-time t
    // sweep along (β·t, t).
    const moving: Worldline = {
      events: Array.from({ length: 65 }, (_, i) => {
        const tt = T_RANGE[0] + (i / 64) * (T_RANGE[1] - T_RANGE[0]);
        return { t: tt, x: beta * tt, y: 0, z: 0 };
      }),
      color: "#FF6ADE",
      label: "moving",
    };
    return [stationary, moving];
  }, [beta]);

  // Tick positions (computed for the legend / overlay HUD only — the canvas
  // primitive draws the worldlines themselves).
  const g = gamma(beta);
  const stationaryTicksUpToT = (tMax: number) =>
    Math.floor(tMax / PROPER_TICK);
  const movingTicksUpToT = (tMax: number) => {
    // Moving clock's nth proper tick happens at lab time n · γ · PROPER_TICK.
    return Math.floor(tMax / (g * PROPER_TICK));
  };

  return (
    <div className="flex flex-col gap-3">
      <SpacetimeDiagramCanvas
        worldlines={worldlines}
        lightCone={true}
        boostBeta={beta}
        onBoostChange={setBeta}
        boostMin={0}
        boostMax={0.95}
        xRange={X_RANGE}
        tRange={T_RANGE}
        width={520}
        height={420}
      />
      <TickAnnotations
        beta={beta}
        gamma={g}
        stationaryTicks={stationaryTicksUpToT(T_RANGE[1])}
        movingTicks={movingTicksUpToT(T_RANGE[1])}
      />
    </div>
  );
}

interface TickAnnotationsProps {
  beta: number;
  gamma: number;
  stationaryTicks: number;
  movingTicks: number;
}

function TickAnnotations({
  beta,
  gamma,
  stationaryTicks,
  movingTicks,
}: TickAnnotationsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 font-mono text-[11px] text-white/70">
      <div className="rounded-md border border-cyan-300/20 bg-cyan-300/[0.04] p-3">
        <div className="text-cyan-300/85">REST CLOCK · vertical worldline</div>
        <div className="mt-1 opacity-80">
          ticks at proper time τ = ct
        </div>
        <div className="opacity-80">
          {stationaryTicks} ticks across the visible diagram
        </div>
      </div>
      <div className="rounded-md border border-pink-300/20 bg-pink-300/[0.04] p-3">
        <div className="text-pink-300/85">MOVING CLOCK · tilted worldline</div>
        <div className="mt-1 opacity-80">
          ticks at lab time = γ · τ = {gamma.toFixed(3)} · τ
        </div>
        <div className="opacity-80">
          {movingTicks} ticks — slope 1/β at β = {beta.toFixed(2)}
        </div>
      </div>
    </div>
  );
}
