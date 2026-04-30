"use client";

import { useMemo, useState } from "react";
import { SpacetimeDiagramCanvas } from "@/components/physics/_shared";
import { gamma, type Worldline } from "@/lib/physics/relativity/types";
import { contractedPoleLength } from "@/lib/physics/relativity/barn-pole";

/**
 * §05.1 BARN-FRAME SCENE — the barn observer's spacetime diagram.
 *
 * In the barn rest frame the two doors are vertical worldlines (the barn is at
 * rest). The pole's two ends are tilted worldlines moving at slope 1/β
 * through the diagram (the standard convention with x horizontal and ct
 * vertical: a worldline of an object at speed β has slope 1/β in (x, ct)).
 *
 * The two "door closed" events are simultaneous in this frame — both at
 * t = 0 — and they lie on the same horizontal `t = const` slice. Between the
 * two door events, the pole's contracted length L_pole / γ fits inside the
 * barn of length L_barn (we pick parameters so it fits exactly at γ = 2).
 *
 * The slider lets the reader vary β; the contracted-pole-length HUD updates
 * live so they can watch the contraction approach the barn length as
 * β → √3/2.
 */

const L_BARN = 5; // barn length in meters (and ct units, with c = 1 normalized)
const L_POLE = 10; // pole proper length in meters
const X_RANGE: [number, number] = [-2, 8];
const T_RANGE: [number, number] = [-3, 3];

export function BarnFrameScene() {
  const [beta, setBeta] = useState(Math.sqrt(3) / 2); // ≈ 0.866 → γ = 2

  const g = gamma(beta);
  const polePixContracted = contractedPoleLength(L_POLE, beta);

  // The "moment of full enclosure" is t = 0 in the barn frame. Build pole
  // worldlines as two parallel lines: the front of the pole and the rear of
  // the pole, both moving at +β. We anchor them so that at t = 0 the front
  // is at x = L_barn (just inside the front door) and the rear is at x = 0
  // (just inside the rear door). So:
  //
  //   front of pole: x = L_barn + β · ct
  //   rear of pole:  x = 0 + β · ct
  //
  // Both have slope 1/β in (x, ct).
  const worldlines = useMemo<Worldline[]>(() => {
    const tMin = T_RANGE[0];
    const tMax = T_RANGE[1];

    const frontPole: Worldline = {
      events: [
        { t: tMin, x: L_BARN + beta * tMin, y: 0, z: 0 },
        { t: tMax, x: L_BARN + beta * tMax, y: 0, z: 0 },
      ],
      color: "#FF6ADE",
      label: "pole front",
    };
    const rearPole: Worldline = {
      events: [
        { t: tMin, x: 0 + beta * tMin, y: 0, z: 0 },
        { t: tMax, x: 0 + beta * tMax, y: 0, z: 0 },
      ],
      color: "#FF6ADE",
      label: "pole rear",
    };

    // Barn doors: vertical worldlines at x = 0 (rear door) and x = L_BARN
    // (front door).
    const rearDoor: Worldline = {
      events: [
        { t: tMin, x: 0, y: 0, z: 0 },
        { t: tMax, x: 0, y: 0, z: 0 },
      ],
      color: "#67E8F9",
      label: "rear door",
    };
    const frontDoor: Worldline = {
      events: [
        { t: tMin, x: L_BARN, y: 0, z: 0 },
        { t: tMax, x: L_BARN, y: 0, z: 0 },
      ],
      color: "#67E8F9",
      label: "front door",
    };

    // The two door-closed events at t = 0: dummy "worldlines" of length zero
    // to mark the events as labeled points on the diagram.
    const rearEvent: Worldline = {
      events: [{ t: 0, x: 0, y: 0, z: 0 }],
      color: "#FFD66B",
      label: "rear closed",
    };
    const frontEvent: Worldline = {
      events: [{ t: 0, x: L_BARN, y: 0, z: 0 }],
      color: "#FFD66B",
      label: "front closed",
    };

    return [rearDoor, frontDoor, rearPole, frontPole, rearEvent, frontEvent];
  }, [beta]);

  // Build a non-null simultaneity slice at t' = 0 for boost β = 0 — but
  // boostBeta = 0 means no boosted axes drawn, and we just want the t = 0
  // horizontal line as a visual cue. Skip simultaneitySlice (the t = 0 lab
  // axis is already drawn by the canvas).

  return (
    <div className="flex flex-col gap-3">
      <SpacetimeDiagramCanvas
        worldlines={worldlines}
        lightCone={false}
        boostBeta={0}
        xRange={X_RANGE}
        tRange={T_RANGE}
        width={520}
        height={400}
      />

      <div className="grid grid-cols-2 gap-3 font-mono text-[11px] text-white/70">
        <div className="rounded-md border border-cyan-300/20 bg-cyan-300/[0.04] p-3">
          <div className="text-cyan-300/85">BARN FRAME · barn at rest</div>
          <div className="mt-1 opacity-80">L_barn = {L_BARN.toFixed(2)} m</div>
          <div className="opacity-80">doors closed at t = 0 (simultaneous)</div>
        </div>
        <div className="rounded-md border border-pink-300/20 bg-pink-300/[0.04] p-3">
          <div className="text-pink-300/85">POLE · contracted in this frame</div>
          <div className="mt-1 opacity-80">
            L_pole / γ = {polePixContracted.toFixed(3)} m
          </div>
          <div className="opacity-80">
            γ = {g.toFixed(3)} (proper L_pole = {L_POLE} m)
          </div>
        </div>
      </div>

      <label className="flex items-center gap-3 font-mono text-xs text-white/70">
        <span className="w-20">β = {beta.toFixed(3)}</span>
        <input
          type="range"
          min={0.1}
          max={0.95}
          step={0.005}
          value={beta}
          onChange={(e) => setBeta(parseFloat(e.target.value))}
          className="flex-1"
        />
        <span className="w-32">
          fits? {polePixContracted <= L_BARN + 1e-9 ? "yes" : "no"}
        </span>
      </label>
    </div>
  );
}
