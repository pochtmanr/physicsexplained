"use client";

import { useMemo } from "react";
import { SpacetimeDiagramCanvas } from "@/components/physics/_shared";
import type { Worldline } from "@/lib/physics/relativity/types";

/**
 * §03.1 MINKOWSKI AXES — the hub scene of the topic.
 *
 * Plots three worldlines in a single (x, ct) Minkowski diagram:
 *   • two stationary observers (cyan, vertical) at x = -1 and x = +1
 *   • one uniformly-moving particle (magenta, tilted at slope β) launched
 *     from the origin
 *
 * The 45° amber dashed light cone bounds the diagram — no physical worldline
 * can tilt past it. The reader should be able to read off the structure at a
 * glance: vertical = at rest, tilted = moving, 45° = light-speed limit.
 *
 * No interactivity. The next two scenes add it.
 */

const T_RANGE: [number, number] = [0, 4];
const X_RANGE: [number, number] = [-2.5, 2.5];
// Hard-coded β for the moving particle in this hub scene. Slope in (x, ct)
// units equals β; β = 0.6 puts the magenta worldline at slope 0.6 — clearly
// inside the cone, clearly tilted.
const BETA = 0.6;

export function MinkowskiAxesScene() {
  const worldlines = useMemo<Worldline[]>(() => {
    // Stationary observer at x = -1 (cyan, vertical)
    const stationaryLeft: Worldline = {
      events: Array.from({ length: 33 }, (_, i) => ({
        t: T_RANGE[0] + (i / 32) * (T_RANGE[1] - T_RANGE[0]),
        x: -1,
        y: 0,
        z: 0,
      })),
      color: "#67E8F9",
      label: "x = -1",
    };
    // Stationary observer at x = +1 (cyan, vertical)
    const stationaryRight: Worldline = {
      events: Array.from({ length: 33 }, (_, i) => ({
        t: T_RANGE[0] + (i / 32) * (T_RANGE[1] - T_RANGE[0]),
        x: 1,
        y: 0,
        z: 0,
      })),
      color: "#67E8F9",
      label: "x = +1",
    };
    // Moving worldline from origin at slope β: x = β · ct, parametrized by t.
    const moving: Worldline = {
      events: Array.from({ length: 33 }, (_, i) => {
        const tt = T_RANGE[0] + (i / 32) * (T_RANGE[1] - T_RANGE[0]);
        return { t: tt, x: BETA * tt, y: 0, z: 0 };
      }),
      color: "#FF6ADE",
      label: `β = ${BETA}`,
    };
    return [stationaryLeft, stationaryRight, moving];
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <SpacetimeDiagramCanvas
        worldlines={worldlines}
        lightCone={true}
        xRange={X_RANGE}
        tRange={T_RANGE}
        width={520}
        height={420}
      />
      <div className="grid grid-cols-3 gap-3 font-mono text-[11px] text-white/70">
        <div className="rounded-md border border-cyan-300/20 bg-cyan-300/[0.04] p-3">
          <div className="text-cyan-300/85">STATIONARY · vertical</div>
          <div className="mt-1 opacity-80">slope = 0 → β = 0</div>
        </div>
        <div className="rounded-md border border-pink-300/20 bg-pink-300/[0.04] p-3">
          <div className="text-pink-300/85">MOVING · tilted</div>
          <div className="mt-1 opacity-80">slope = β = {BETA.toFixed(2)}</div>
        </div>
        <div className="rounded-md border border-amber-300/20 bg-amber-300/[0.04] p-3">
          <div className="text-amber-300/85">LIGHT · 45°</div>
          <div className="mt-1 opacity-80">slope = ±1 (universal limit)</div>
        </div>
      </div>
    </div>
  );
}
