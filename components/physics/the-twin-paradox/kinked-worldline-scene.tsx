"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SpacetimeDiagramCanvas } from "@/components/physics/_shared";
import { gamma, type Worldline } from "@/lib/physics/relativity/types";
import { travelerProperTime } from "@/lib/physics/relativity/twin-paradox";

/**
 * §03.5 KINKED WORLDLINE — the geometric payoff of §03.
 *
 * Two worldlines drawn in a Minkowski (x, ct) diagram between two reunion
 * events at the origin and at (x = 0, ct = T_home):
 *
 *   • cyan, vertical: the home twin's straight (geodesic) worldline.
 *   • orange, kinked: the traveling twin's two timelike segments meeting at
 *     the turnaround event (x = β·T_home/2, ct = T_home/2). Marked as
 *     accelerated so the shared canvas paints it orange per the §03.5
 *     palette convention.
 *
 * A play/pause/reset clock advances both twins' proper-time tallies side by
 * side: the home twin's clock matches lab time directly; the traveler's
 * runs at dτ/dt = 1/γ. At reunion the traveler's clock reads T_home/γ — the
 * geometric content of the paradox, made tangible.
 */

const T_HOME = 4; // ct units of the round trip
const X_RANGE: [number, number] = [-2.5, 2.5];
const T_RANGE: [number, number] = [0, 5];
const TICK_MS = 50;
// Real-time seconds per ct = T_HOME of simulated time. Slow enough to read.
const PLAYBACK_SECONDS = 6;

export function KinkedWorldlineScene() {
  const [beta, setBeta] = useState(0.8);
  const [playing, setPlaying] = useState(false);
  const [labCT, setLabCT] = useState(0); // current ct along the trip, 0..T_HOME
  const lastTsRef = useRef<number | null>(null);

  // Animation loop
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

  // Build worldlines up to the current playhead. Home twin: vertical from
  // origin to (0, labCT). Traveler: outbound to (β·T_HOME/2, T_HOME/2),
  // inbound back to (0, T_HOME).
  const worldlines = useMemo<Worldline[]>(() => {
    const turnaroundCT = T_HOME / 2;
    const turnaroundX = beta * turnaroundCT;

    // Home twin: vertical line, just two events (start, current).
    const home: Worldline = {
      events: [
        { t: 0, x: 0, y: 0, z: 0 },
        { t: labCT, x: 0, y: 0, z: 0 },
      ],
      color: "#67E8F9",
      label: "home",
    };

    // Traveler: piecewise linear. Build event list dependent on labCT.
    const travelerEvents: { t: number; x: number; y: number; z: number }[] = [];
    travelerEvents.push({ t: 0, x: 0, y: 0, z: 0 });
    if (labCT <= turnaroundCT) {
      // Still outbound. Linear interpolation along outbound leg.
      const xAtNow = beta * labCT;
      travelerEvents.push({ t: labCT, x: xAtNow, y: 0, z: 0 });
    } else {
      // Past turnaround. Add full outbound leg, then inbound up to labCT.
      travelerEvents.push({ t: turnaroundCT, x: turnaroundX, y: 0, z: 0 });
      const dt = labCT - turnaroundCT;
      const xAtNow = turnaroundX - beta * dt;
      travelerEvents.push({ t: labCT, x: xAtNow, y: 0, z: 0 });
    }

    const traveler: Worldline = {
      events: travelerEvents,
      color: "#FFB36B",
      label: "traveler",
      accelerated: true,
    };

    return [home, traveler];
  }, [beta, labCT]);

  const g = gamma(beta);
  // Home twin's clock: just labCT in our ct units.
  const homeClock = labCT;
  // Traveler's clock: piecewise, dτ/dt = 1/γ on each inertial segment.
  // For an idealised instantaneous turnaround the proper time is
  // monotonically labCT/γ over the whole trip.
  const travelerClock = labCT / g;

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
        <div className="rounded-md border border-cyan-300/20 bg-cyan-300/[0.04] p-3">
          <div className="text-cyan-300/85">HOME TWIN · straight worldline</div>
          <div className="mt-1 opacity-80">τ_home = {homeClock.toFixed(3)}</div>
          <div className="opacity-80">geodesic — longest aging</div>
        </div>
        <div className="rounded-md border border-amber-300/20 bg-amber-300/[0.04] p-3">
          <div className="text-amber-300/85">TRAVELER · kinked worldline</div>
          <div className="mt-1 opacity-80">τ_trav = {travelerClock.toFixed(3)}</div>
          <div className="opacity-80">
            ∫ dt/γ — γ = {g.toFixed(3)}
          </div>
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

      <label className="flex items-center gap-3 font-mono text-xs text-white/70">
        <span className="w-16">β = {beta.toFixed(2)}</span>
        <input
          type="range"
          min={0.1}
          max={0.95}
          step={0.01}
          value={beta}
          onChange={(e) => {
            setPlaying(false);
            setLabCT(0);
            setBeta(parseFloat(e.target.value));
          }}
          className="flex-1"
        />
        <span className="w-24">
          τ_trav/T = {(travelerProperTime(T_HOME, beta) / T_HOME).toFixed(3)}
        </span>
      </label>
    </div>
  );
}
