"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SpacetimeDiagramCanvas } from "@/components/physics/_shared";
import type { Worldline } from "@/lib/physics/relativity/types";
import { bornRigidAccelerationRatio } from "@/lib/physics/relativity/bell-spaceship";

/**
 * §05.2 BORN-RIGID COMPARISON — the rigidity that Bell's setup violates.
 *
 * Two pairs of rockets accelerate side by side in the same canvas:
 *
 *   • LEFT pair (orange — accelerated palette): Bell's setup. Identical
 *     lab-frame acceleration profiles, lab-frame separation D₀ stays
 *     constant. The string drawn between them stretches as their proper
 *     separation grows by γ.
 *
 *   • RIGHT pair (cyan — stationary palette, repurposed for "rigid").
 *     Born-rigid Rindler observers: x_i(t) = √(x_i,₀² + (ct)²) with the
 *     trailing rocket at smaller x₀, hence larger proper acceleration. The
 *     proper separation between them is exactly x_front,₀ − x_rear,₀ = D₀
 *     for all time. The string between this pair never stretches.
 *
 * The scene plays both pairs from ct = 0 forward. At each lab time we draw
 * a magenta segment between Bell's pair (the stretching string) and a
 * green segment between the Born-rigid pair (the unstretched string). The
 * strain disparity is the visual point.
 */

const D0 = 0.5; // separation in canvas units (smaller so two pairs fit side-by-side)
const A_BELL = 0.4; // dimensionless lab-frame acceleration for Bell pair
const X_REAR_BELL = -0.5; // Bell rear-rocket initial x
const X_REAR_RIGID = 1.5; // Born-rigid rear-rocket initial x (from "Rindler horizon" at x=0; we shift it).
const X_RANGE: [number, number] = [-1.0, 3.5];
const T_RANGE: [number, number] = [0, 4];
const T_HOME = 4;
const PLAYBACK_SECONDS = 7;

/** Bell-pair lab-frame trajectory (identical hyperbolic profile per rocket). */
function bellX(ct: number, x0: number): number {
  return x0 + (1 / A_BELL) * (Math.sqrt(1 + (A_BELL * ct) ** 2) - 1);
}

/** Born-rigid Rindler trajectory: x(ct) = √(x₀² + (ct)²) where x₀ is the
 *  rocket's initial position from the Rindler horizon. We then shift the
 *  whole pair rightward by `shift` so it doesn't overlap the Bell pair. */
function rindlerX(ct: number, x0FromHorizon: number, shift: number): number {
  return shift + (Math.sqrt(x0FromHorizon * x0FromHorizon + ct * ct) - x0FromHorizon);
}

export function BornRigidComparisonScene() {
  const [playing, setPlaying] = useState(false);
  const [labCT, setLabCT] = useState(0);
  const lastTsRef = useRef<number | null>(null);

  useEffect(() => {
    if (!playing) {
      lastTsRef.current = null;
      return;
    }
    let raf: number;
    const tick = (ts: number) => {
      if (lastTsRef.current === null) lastTsRef.current = ts;
      const dtMs = ts - lastTsRef.current;
      lastTsRef.current = ts;
      const ctPerMs = T_HOME / (PLAYBACK_SECONDS * 1000);
      setLabCT((prev) => {
        const next = prev + dtMs * ctPerMs;
        if (next >= T_HOME) {
          setPlaying(false);
          return T_HOME;
        }
        return next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  const worldlines = useMemo<Worldline[]>(() => {
    const N = 64;
    // BELL pair (orange = accelerated palette)
    const bellRearEvents: { t: number; x: number; y: number; z: number }[] = [];
    const bellFrontEvents: { t: number; x: number; y: number; z: number }[] = [];
    for (let i = 0; i <= N; i++) {
      const ct = (i / N) * labCT;
      bellRearEvents.push({ t: ct, x: bellX(ct, X_REAR_BELL), y: 0, z: 0 });
      bellFrontEvents.push({ t: ct, x: bellX(ct, X_REAR_BELL + D0), y: 0, z: 0 });
    }
    const bellRear: Worldline = {
      events: bellRearEvents,
      color: "#FFB36B",
      label: "Bell rear",
      accelerated: true,
    };
    const bellFront: Worldline = {
      events: bellFrontEvents,
      color: "#FFB36B",
      label: "Bell front",
      accelerated: true,
    };

    // BORN-RIGID pair (cyan = stationary palette, treated as "rigid").
    const rigidShift = 2.0; // place rigid pair to the right of Bell pair on canvas
    const rigidRearEvents: { t: number; x: number; y: number; z: number }[] = [];
    const rigidFrontEvents: { t: number; x: number; y: number; z: number }[] = [];
    for (let i = 0; i <= N; i++) {
      const ct = (i / N) * labCT;
      rigidRearEvents.push({
        t: ct,
        x: rindlerX(ct, X_REAR_RIGID, rigidShift),
        y: 0,
        z: 0,
      });
      rigidFrontEvents.push({
        t: ct,
        x: rindlerX(ct, X_REAR_RIGID + D0, rigidShift),
        y: 0,
        z: 0,
      });
    }
    const rigidRear: Worldline = {
      events: rigidRearEvents,
      color: "#67E8F9",
      label: "rigid rear",
    };
    const rigidFront: Worldline = {
      events: rigidFrontEvents,
      color: "#67E8F9",
      label: "rigid front",
    };

    // Strings: magenta for Bell (stretches), green for rigid (taut).
    const bellString: Worldline = {
      events: [
        { t: labCT, x: bellX(labCT, X_REAR_BELL), y: 0, z: 0 },
        { t: labCT, x: bellX(labCT, X_REAR_BELL + D0), y: 0, z: 0 },
      ],
      color: "#FF6ADE",
      label: "Bell string",
    };
    const rigidString: Worldline = {
      events: [
        { t: labCT, x: rindlerX(labCT, X_REAR_RIGID, 2.0), y: 0, z: 0 },
        { t: labCT, x: rindlerX(labCT, X_REAR_RIGID + D0, 2.0), y: 0, z: 0 },
      ],
      color: "#7CF59A",
      label: "rigid string",
    };

    return [bellRear, bellFront, rigidRear, rigidFront, bellString, rigidString];
  }, [labCT]);

  const ratio = bornRigidAccelerationRatio(X_REAR_RIGID, D0);

  return (
    <div className="flex flex-col gap-3">
      <SpacetimeDiagramCanvas
        worldlines={worldlines}
        lightCone={false}
        xRange={X_RANGE}
        tRange={T_RANGE}
        width={560}
        height={420}
      />

      <div className="grid grid-cols-2 gap-3 font-mono text-[11px] text-white/70">
        <div className="rounded-md border border-amber-300/20 bg-amber-300/[0.04] p-3">
          <div className="text-amber-300/85">BELL PAIR · launch-frame-identical</div>
          <div className="mt-1 opacity-80">a_rear / a_front = 1 (by setup)</div>
          <div className="opacity-80">proper separation grows as γ·D₀ → string stretches</div>
        </div>
        <div className="rounded-md border border-cyan-300/20 bg-cyan-300/[0.04] p-3">
          <div className="text-cyan-300/85">BORN-RIGID PAIR · Rindler observers</div>
          <div className="mt-1 opacity-80">
            a_rear / a_front = {ratio.toFixed(3)} (&gt; 1)
          </div>
          <div className="opacity-80">proper separation = D₀ always → string holds</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-white/70">
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          className="rounded border border-white/20 bg-white/5 px-3 py-1 hover:bg-white/10"
        >
          {playing ? "pause" : labCT >= T_HOME ? "replay" : "play"}
        </button>
        <button
          type="button"
          onClick={() => {
            setPlaying(false);
            setLabCT(0);
          }}
          className="rounded border border-white/20 bg-white/5 px-3 py-1 hover:bg-white/10"
        >
          reset
        </button>
        <span className="ml-2 opacity-70">
          ct = {labCT.toFixed(2)} / {T_HOME.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
