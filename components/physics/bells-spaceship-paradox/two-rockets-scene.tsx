"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SpacetimeDiagramCanvas } from "@/components/physics/_shared";
import { gamma, type Worldline } from "@/lib/physics/relativity/types";
import { properSeparation } from "@/lib/physics/relativity/bell-spaceship";

/**
 * §05.2 TWO ROCKETS — Bell's launch-frame-identical accelerations.
 *
 * Two rockets ignite simultaneously in the launch frame and follow
 * identical hyperbolic worldlines x(t) = (c²/a)(√(1 + (at/c)²) − 1) + x₀,
 * shifted only by the initial separation D₀. In the launch frame their
 * separation stays constant at D₀ for all time — yet a string tied between
 * them stretches because the *proper* separation (measured in the rockets'
 * shared instantaneous rest frame) is γ · D₀ and grows without bound as
 * β → 1.
 *
 * The play head sweeps lab time. At each lab time we plot:
 *   • two orange (accelerated-color) worldlines, lab-frame parallel.
 *   • a magenta string segment connecting them at the current event pair.
 *   • a HUD readout of β, γ, lab-frame separation D₀, proper separation
 *     γ·D₀, and the strain factor (γ − 1).
 *
 * Diagram coordinates are (x in units of D₀, ct in units of D₀). The
 * proper-acceleration choice (a · D₀ / c² = 0.4) is purely cosmetic — it
 * sets how fast the rockets reach relativistic speed within the visible
 * canvas range; the physics is identical for any a > 0.
 */

const D0 = 1; // initial separation in canvas units (also the unit of x).
const A_DIMENSIONLESS = 0.4; // a · D₀ / c² — sets curvature inside the canvas.
const X_RANGE: [number, number] = [-0.5, 4];
const T_RANGE: [number, number] = [0, 4];
const T_HOME = 4; // sweep ct from 0 to T_HOME (in units of D₀)
const PLAYBACK_SECONDS = 7;

/** Lab-frame trajectory of a rocket with constant proper acceleration a,
 *  starting at rest at x = x0 at ct = 0. Returns x(ct) in units of D₀. */
function rocketX(ct: number, x0: number): number {
  // Hyperbolic motion: x(t) − x0 = (c²/a)(√(1 + (at/c)²) − 1).
  // In dimensionless form with α = a · D₀ / c² and τ = ct/D₀:
  //   (x − x0)/D₀ = (1/α)(√(1 + (α τ)²) − 1).
  return x0 + (1 / A_DIMENSIONLESS) * (Math.sqrt(1 + (A_DIMENSIONLESS * ct) ** 2) - 1);
}

/** Lab-frame velocity β = dx/d(ct) of a rocket with the trajectory above. */
function rocketBeta(ct: number): number {
  // β = (α τ) / √(1 + (α τ)²)
  const aT = A_DIMENSIONLESS * ct;
  return aT / Math.sqrt(1 + aT * aT);
}

export function BellTwoRocketsScene() {
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
    // Sample each worldline at 64 lab-time steps from 0 to current labCT.
    const N = 64;
    const sample = (x0: number): { t: number; x: number; y: number; z: number }[] => {
      const events: { t: number; x: number; y: number; z: number }[] = [];
      for (let i = 0; i <= N; i++) {
        const ct = (i / N) * labCT;
        events.push({ t: ct, x: rocketX(ct, x0), y: 0, z: 0 });
      }
      return events;
    };

    const rear: Worldline = {
      events: sample(0),
      color: "#FFB36B",
      label: "rear",
      accelerated: true,
    };
    const front: Worldline = {
      events: sample(D0),
      color: "#FFB36B",
      label: "front",
      accelerated: true,
    };

    // String: a horizontal segment at the current lab time connecting the
    // two rocket events. Drawn as a "worldline" with two events for
    // SpacetimeDiagramCanvas — color magenta to read as a stretched filament.
    const string: Worldline = {
      events: [
        { t: labCT, x: rocketX(labCT, 0), y: 0, z: 0 },
        { t: labCT, x: rocketX(labCT, D0), y: 0, z: 0 },
      ],
      color: "#FF6ADE",
      label: "string",
    };

    return [rear, front, string];
  }, [labCT]);

  const beta = rocketBeta(labCT);
  const g = gamma(Math.min(Math.abs(beta), 0.9999));
  const dProper = properSeparation(D0, Math.min(Math.abs(beta), 0.9999));
  const strain = g - 1;

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

      <div className="grid grid-cols-2 gap-3 font-mono text-[11px] text-white/70">
        <div className="rounded-md border border-amber-300/20 bg-amber-300/[0.04] p-3">
          <div className="text-amber-300/85">LAUNCH FRAME · two rockets</div>
          <div className="mt-1 opacity-80">D_lab = {D0.toFixed(3)} (constant)</div>
          <div className="opacity-80">β = {beta.toFixed(3)}</div>
        </div>
        <div className="rounded-md border border-fuchsia-300/20 bg-fuchsia-300/[0.04] p-3">
          <div className="text-fuchsia-300/85">PROPER FRAME · the string</div>
          <div className="mt-1 opacity-80">D_proper = γ·D₀ = {dProper.toFixed(3)}</div>
          <div className="opacity-80">strain ε = γ − 1 = {strain.toFixed(3)}</div>
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
          ct/D₀ = {labCT.toFixed(2)} · γ = {g.toFixed(3)}
        </span>
      </div>
    </div>
  );
}
