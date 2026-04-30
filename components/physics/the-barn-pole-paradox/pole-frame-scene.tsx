"use client";

import { useMemo, useState } from "react";
import { SpacetimeDiagramCanvas } from "@/components/physics/_shared";
import { gamma, type Worldline } from "@/lib/physics/relativity/types";
import {
  contractedBarnLength,
  doorEventLagInPoleFrame,
} from "@/lib/physics/relativity/barn-pole";

/**
 * §05.1 POLE-FRAME SCENE — the same physics, the pole's view.
 *
 * We Lorentz-boost the entire diagram into the pole's rest frame. The pole's
 * worldlines now run vertically (the pole is at rest); the barn's worldlines
 * tilt (the barn moves at −β in this frame). The two door-closing events
 * that were simultaneous at t = 0 in the barn frame are NO LONGER
 * simultaneous in the pole frame:
 *
 *   Δt' = γ (Δt − β Δx / c) = γ (0 − β · L_barn / c) = −γ β L_barn / c.
 *
 * The front-door event happens BEFORE the rear-door event in the pole frame
 * (Δt' < 0 for our convention). The pole sees the front door slam shut while
 * the rear of the pole is still well outside the barn — and the rear door
 * doesn't slam until much later, by which time the pole has long since
 * burst out the front. The pole is never enclosed at any single instant.
 *
 * To draw this we apply the boost x' = γ(x − β·ct), ct' = γ(ct − β·x) to all
 * the events from the barn-frame story. The pole's worldlines (slope 1/β in
 * the barn frame) become vertical lines in the pole frame. The barn doors
 * (vertical in the barn frame) become tilted lines with slope 1/(−β) = −1/β
 * in the pole frame.
 */

const L_BARN = 5; // barn proper length, meters (using c = 1 ct units)
const L_POLE = 10; // pole proper length, meters
const X_RANGE: [number, number] = [-12, 6];
const T_RANGE: [number, number] = [-8, 8];

function lorentzBoostX(
  x: number,
  ct: number,
  beta: number,
): { x: number; ct: number } {
  const g = gamma(beta);
  return {
    x: g * (x - beta * ct),
    ct: g * (ct - beta * x),
  };
}

export function PoleFrameScene() {
  const [beta, setBeta] = useState(Math.sqrt(3) / 2); // ≈ 0.866 → γ = 2
  const g = gamma(beta);

  // Build all the barn-frame events first (same as BarnFrameScene), then
  // boost into the pole frame.
  const worldlines = useMemo<Worldline[]>(() => {
    const tMin = -10;
    const tMax = 10;

    // Barn-frame parametrization: pole front at x = L_BARN + β·ct, pole rear
    // at x = β·ct, doors vertical at x = 0 and x = L_BARN.
    const sample = (count: number, fn: (s: number) => { x: number; ct: number }) => {
      const events: { t: number; x: number; y: number; z: number }[] = [];
      for (let i = 0; i <= count; i++) {
        const s = i / count;
        const ct = tMin + s * (tMax - tMin);
        const { x, ct: ct0 } = fn(ct);
        const boosted = lorentzBoostX(x, ct0, beta);
        events.push({ t: boosted.ct, x: boosted.x, y: 0, z: 0 });
      }
      return events;
    };

    // Pole rear: barn-frame x = β·ct → boosted = vertical at x' = 0.
    const rearPoleEvents = sample(2, (ct) => ({ x: beta * ct, ct }));
    // Pole front: barn-frame x = L_BARN + β·ct → vertical at x' = L_BARN/γ
    // boosted to the pole's proper length L_POLE. (The pole is L_BARN·γ in
    // proper length only when L_POLE/γ exactly equals L_BARN; we anchor the
    // diagram so the front lines up with the front door at t = 0 in the barn
    // frame, which means in the pole frame the pole's proper length is
    // γ·L_BARN — equal to L_POLE when γ·L_BARN = L_POLE, i.e. γ = 2.)
    const frontPoleEvents = sample(2, (ct) => ({ x: L_BARN + beta * ct, ct }));

    // Barn doors: vertical at x = 0 and x = L_BARN in barn frame.
    const rearDoorEvents = sample(2, (ct) => ({ x: 0, ct }));
    const frontDoorEvents = sample(2, (ct) => ({ x: L_BARN, ct }));

    const rearPole: Worldline = {
      events: rearPoleEvents,
      color: "#FF6ADE",
      label: "pole rear",
    };
    const frontPole: Worldline = {
      events: frontPoleEvents,
      color: "#FF6ADE",
      label: "pole front",
    };
    const rearDoor: Worldline = {
      events: rearDoorEvents,
      color: "#67E8F9",
      label: "rear door",
    };
    const frontDoor: Worldline = {
      events: frontDoorEvents,
      color: "#67E8F9",
      label: "front door",
    };

    // The two door-closing events at (x, ct) = (0, 0) and (L_BARN, 0) in the
    // barn frame, boosted into the pole frame.
    const rearClosedBarnFrame = lorentzBoostX(0, 0, beta);
    const frontClosedBarnFrame = lorentzBoostX(L_BARN, 0, beta);

    const rearEvent: Worldline = {
      events: [
        {
          t: rearClosedBarnFrame.ct,
          x: rearClosedBarnFrame.x,
          y: 0,
          z: 0,
        },
      ],
      color: "#FFD66B",
      label: "rear closed",
    };
    const frontEvent: Worldline = {
      events: [
        {
          t: frontClosedBarnFrame.ct,
          x: frontClosedBarnFrame.x,
          y: 0,
          z: 0,
        },
      ],
      color: "#FFD66B",
      label: "front closed",
    };

    return [rearDoor, frontDoor, rearPole, frontPole, rearEvent, frontEvent];
  }, [beta]);

  const lag = doorEventLagInPoleFrame(L_BARN, beta, 1); // c = 1 in our units
  const barnContracted = contractedBarnLength(L_BARN, beta);

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
        <div className="rounded-md border border-pink-300/20 bg-pink-300/[0.04] p-3">
          <div className="text-pink-300/85">POLE FRAME · pole at rest</div>
          <div className="mt-1 opacity-80">
            L_pole = {L_POLE} m (proper length)
          </div>
          <div className="opacity-80">
            barn contracts to {barnContracted.toFixed(3)} m
          </div>
        </div>
        <div className="rounded-md border border-amber-300/20 bg-amber-300/[0.04] p-3">
          <div className="text-amber-300/85">DOOR EVENTS · NOT simultaneous</div>
          <div className="mt-1 opacity-80">
            Δt' = {lag.toFixed(3)} (ct units)
          </div>
          <div className="opacity-80">
            front before rear (γ = {g.toFixed(3)})
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
        <span className="w-36">|Δt'|/L_barn = {(Math.abs(lag) / L_BARN).toFixed(3)}</span>
      </label>
    </div>
  );
}
