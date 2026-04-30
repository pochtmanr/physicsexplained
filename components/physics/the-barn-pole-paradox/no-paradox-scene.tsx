"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  contractedBarnLength,
  contractedPoleLength,
  doorEventLagInPoleFrame,
} from "@/lib/physics/relativity/barn-pole";
import { gamma } from "@/lib/physics/relativity/types";

/**
 * §05.1 NO-PARADOX SCENE — the side-by-side resolution.
 *
 * Two stacked Canvas-2D pictures:
 *   • LEFT — barn frame: a static rectangle (the barn) with a contracted pole
 *     drawn in it at t = 0. Both doors slammed shut on cue. The pole fits.
 *   • RIGHT — pole frame: a static pole with a contracted barn approaching at
 *     speed −β. At the playhead's `t' = 0` the front door has already closed
 *     (and reopened); the rear door has not yet closed. The pole is never
 *     fully enclosed.
 *
 * A single playhead drags both panels through their respective time
 * coordinates synchronized via the relativity-of-simultaneity offset
 * Δt' = −γ β L_barn / c. The reader scrubs the slider and watches the same
 * physical events sequence themselves differently.
 *
 * Style matches the §05 palette: cyan = static frame, magenta = boosted
 * object, amber = events. Dark canvas, mono HUD, all per the shared canvas
 * convention.
 */

const L_BARN = 5;
const L_POLE = 10;
const BETA = Math.sqrt(3) / 2; // γ = 2

const PANEL_W = 360;
const PANEL_H = 220;
const MARGIN = 20;

// Time scrubber range in barn-frame ct units. The "interesting window" is
// roughly when the pole is overlapping the barn: ct ∈ [-2, +2] is plenty.
const T_MIN = -2.5;
const T_MAX = 2.5;

function drawBarnFramePanel(
  ctx: CanvasRenderingContext2D,
  ct: number,
  beta: number,
) {
  ctx.clearRect(0, 0, PANEL_W, PANEL_H);
  ctx.fillStyle = "#0A0C12";
  ctx.fillRect(0, 0, PANEL_W, PANEL_H);

  // World units: barn occupies x ∈ [0, L_BARN]. View x ∈ [-2, L_BARN + 2] = [-2, 7].
  const xMin = -3;
  const xMax = L_BARN + 3;
  const xToPx = (x: number) =>
    MARGIN + ((x - xMin) / (xMax - xMin)) * (PANEL_W - 2 * MARGIN);
  const yMid = PANEL_H / 2;

  // Floor line
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(MARGIN, yMid + 30);
  ctx.lineTo(PANEL_W - MARGIN, yMid + 30);
  ctx.stroke();

  // Barn — a rectangle from x = 0 to x = L_BARN, with doors at the ends.
  const barnLeft = xToPx(0);
  const barnRight = xToPx(L_BARN);
  ctx.strokeStyle = "#67E8F9";
  ctx.lineWidth = 2;
  // Roof
  ctx.beginPath();
  ctx.moveTo(barnLeft, yMid - 30);
  ctx.lineTo(barnRight, yMid - 30);
  ctx.stroke();

  // Doors at the ends. They are "closed" when |ct| < 0.05, otherwise open.
  const doorClosed = Math.abs(ct) < 0.05;
  ctx.strokeStyle = doorClosed ? "#FFD66B" : "#67E8F9";
  ctx.lineWidth = doorClosed ? 3 : 1.5;
  // Rear door (left end)
  ctx.beginPath();
  ctx.moveTo(barnLeft, yMid - 30);
  ctx.lineTo(barnLeft, yMid + 30);
  ctx.stroke();
  // Front door (right end)
  ctx.beginPath();
  ctx.moveTo(barnRight, yMid - 30);
  ctx.lineTo(barnRight, yMid + 30);
  ctx.stroke();

  // The pole — contracted to L_POLE / γ in this frame, moving at +β.
  // At ct = 0 the rear of the pole sits at x = 0 and the front at x = L_BARN
  // (so it's exactly inside). At general ct: rear = β·ct, front = L_BARN + β·ct.
  const Lcontracted = contractedPoleLength(L_POLE, beta);
  const rearX = beta * ct;
  const frontX = rearX + Lcontracted;

  ctx.strokeStyle = "#FF6ADE";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(xToPx(rearX), yMid + 5);
  ctx.lineTo(xToPx(frontX), yMid + 5);
  ctx.stroke();

  // Label
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = "11px ui-monospace, monospace";
  ctx.fillText("BARN FRAME", MARGIN, 14);
  ctx.fillStyle = "rgba(103,232,249,0.85)";
  ctx.fillText(`barn = ${L_BARN.toFixed(0)} m`, MARGIN, PANEL_H - 24);
  ctx.fillStyle = "rgba(255,106,222,0.85)";
  ctx.fillText(
    `pole/γ = ${Lcontracted.toFixed(2)} m`,
    MARGIN,
    PANEL_H - 8,
  );
  ctx.fillStyle = "rgba(255,214,107,0.85)";
  ctx.fillText(`ct = ${ct.toFixed(2)}`, PANEL_W - 90, 14);
  if (doorClosed) {
    ctx.fillText("BOTH DOORS CLOSED", PANEL_W - 160, PANEL_H - 8);
  }
}

function drawPoleFramePanel(
  ctx: CanvasRenderingContext2D,
  ctBarnFrame: number,
  beta: number,
) {
  ctx.clearRect(0, 0, PANEL_W, PANEL_H);
  ctx.fillStyle = "#0A0C12";
  ctx.fillRect(0, 0, PANEL_W, PANEL_H);

  const g = gamma(beta);

  // We're in the pole rest frame. The pole is stationary, length L_POLE.
  // The barn moves at speed −β; its proper length is L_BARN, contracted to
  // L_BARN / γ in this frame. The two door-closing events are at:
  //   front: t' = −γ β L_BARN / c, x' = γ L_BARN
  //   rear:  t' = 0,               x' = 0
  // (using the boost from barn-frame events (0,0) and (L_BARN, 0))
  // ...actually the rear closing event in barn frame is at (x,t)=(0,0), which
  // boosts to (x',t') = (0,0). Front closing event (L_BARN, 0) boosts to
  // (γ L_BARN, −γ β L_BARN). So front-door event happens earlier (t' = -γβL_b)
  // than rear-door event (t' = 0).

  // We map the barn-frame ct to a "playhead" in the pole frame's t' coord.
  // For visual simplicity we'll treat the slider's `ctBarnFrame` value as
  // controlling the rear-door event timing — i.e., the slider is "where is
  // the rear of the pole at this barn-frame moment", which corresponds to
  // pole-frame t' = ctBarnFrame · γ (rear of pole at x=β·ct in barn frame
  // boosts to x' = 0 at t' = γ ct in pole frame).
  const tPrime = g * ctBarnFrame;

  // Pole-frame x range: pole sits at x' ∈ [0, L_POLE]; barn approaches from
  // x' = +∞. Show x' ∈ [-3, L_POLE + 4] = [-3, 14].
  const xMin = -3;
  const xMax = L_POLE + 4;
  const xToPx = (x: number) =>
    MARGIN + ((x - xMin) / (xMax - xMin)) * (PANEL_W - 2 * MARGIN);
  const yMid = PANEL_H / 2;

  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(MARGIN, yMid + 30);
  ctx.lineTo(PANEL_W - MARGIN, yMid + 30);
  ctx.stroke();

  // The pole at rest from x = 0 to x = L_POLE.
  ctx.strokeStyle = "#FF6ADE";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(xToPx(0), yMid + 5);
  ctx.lineTo(xToPx(L_POLE), yMid + 5);
  ctx.stroke();

  // Barn — contracted, moving at speed −β. At t' = 0 the barn extends from
  // x' = 0 (where the rear-door event happens) to x' = γ·L_BARN (where the
  // front-door event happened, but earlier).
  // Position of the barn at pole-frame time t': both ends move at velocity
  // −β. Rear edge of barn was at x' = 0 at t' = 0, so at general t' it's at
  // x' = -β·t'. Front edge of barn (proper length L_BARN, contracted to
  // L_BARN/γ in pole frame) is at x' = -β·t' + L_BARN/γ.
  const barnContracted = contractedBarnLength(L_BARN, beta);
  const barnRearX = -beta * tPrime;
  const barnFrontX = barnRearX + barnContracted;

  ctx.strokeStyle = "#67E8F9";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(xToPx(barnRearX), yMid - 30);
  ctx.lineTo(xToPx(barnFrontX), yMid - 30);
  ctx.stroke();

  // Door events: front-door event at t' = −γ β L_BARN, x' = γ L_BARN (a fixed
  // event in spacetime). Rear-door event at t' = 0, x' = 0.
  const tFrontEvent = doorEventLagInPoleFrame(L_BARN, beta, 1); // = −γβL_BARN
  const tRearEvent = 0;

  // A door is "closed" if the playhead t' is within ε of the event time.
  const eps = 0.05;
  const frontDoorClosed = Math.abs(tPrime - tFrontEvent) < eps;
  const rearDoorClosed = Math.abs(tPrime - tRearEvent) < eps;

  // Draw the two door positions at the playhead: rear door is the left edge
  // of the barn, front door is the right edge.
  ctx.strokeStyle = rearDoorClosed ? "#FFD66B" : "#67E8F9";
  ctx.lineWidth = rearDoorClosed ? 3 : 1.5;
  ctx.beginPath();
  ctx.moveTo(xToPx(barnRearX), yMid - 30);
  ctx.lineTo(xToPx(barnRearX), yMid + 30);
  ctx.stroke();

  ctx.strokeStyle = frontDoorClosed ? "#FFD66B" : "#67E8F9";
  ctx.lineWidth = frontDoorClosed ? 3 : 1.5;
  ctx.beginPath();
  ctx.moveTo(xToPx(barnFrontX), yMid - 30);
  ctx.lineTo(xToPx(barnFrontX), yMid + 30);
  ctx.stroke();

  // Label
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = "11px ui-monospace, monospace";
  ctx.fillText("POLE FRAME", MARGIN, 14);
  ctx.fillStyle = "rgba(255,106,222,0.85)";
  ctx.fillText(`pole = ${L_POLE} m`, MARGIN, PANEL_H - 24);
  ctx.fillStyle = "rgba(103,232,249,0.85)";
  ctx.fillText(
    `barn/γ = ${barnContracted.toFixed(2)} m`,
    MARGIN,
    PANEL_H - 8,
  );
  ctx.fillStyle = "rgba(255,214,107,0.85)";
  ctx.fillText(`t' = ${tPrime.toFixed(2)}`, PANEL_W - 90, 14);
  if (frontDoorClosed) {
    ctx.fillText("FRONT DOOR CLOSING", PANEL_W - 170, PANEL_H - 8);
  } else if (rearDoorClosed) {
    ctx.fillText("REAR DOOR CLOSING", PANEL_W - 160, PANEL_H - 8);
  }
}

export function NoParadoxScene() {
  const [ct, setCt] = useState(0);
  const barnRef = useRef<HTMLCanvasElement | null>(null);
  const poleRef = useRef<HTMLCanvasElement | null>(null);

  const lag = useMemo(() => doorEventLagInPoleFrame(L_BARN, BETA, 1), []);
  const g = useMemo(() => gamma(BETA), []);

  useEffect(() => {
    const dpr =
      typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    for (const ref of [barnRef, poleRef]) {
      const c = ref.current;
      if (!c) continue;
      c.width = PANEL_W * dpr;
      c.height = PANEL_H * dpr;
      c.style.width = `${PANEL_W}px`;
      c.style.height = `${PANEL_H}px`;
      const ctx = c.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }, []);

  useEffect(() => {
    const barnCtx = barnRef.current?.getContext("2d");
    const poleCtx = poleRef.current?.getContext("2d");
    if (barnCtx) drawBarnFramePanel(barnCtx, ct, BETA);
    if (poleCtx) drawPoleFramePanel(poleCtx, ct, BETA);
  }, [ct]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        <canvas
          ref={barnRef}
          className="rounded-md border border-white/10 bg-black/40"
        />
        <canvas
          ref={poleRef}
          className="rounded-md border border-white/10 bg-black/40"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 font-mono text-[11px] text-white/70">
        <div className="rounded-md border border-cyan-300/20 bg-cyan-300/[0.04] p-3">
          <div className="text-cyan-300/85">BARN STORY</div>
          <div className="mt-1 opacity-80">
            doors close simultaneously at t = 0
          </div>
          <div className="opacity-80">contracted pole fits in barn</div>
        </div>
        <div className="rounded-md border border-pink-300/20 bg-pink-300/[0.04] p-3">
          <div className="text-pink-300/85">POLE STORY</div>
          <div className="mt-1 opacity-80">
            front door closes at t' = {lag.toFixed(2)}
          </div>
          <div className="opacity-80">rear door closes at t' = 0</div>
        </div>
      </div>

      <label className="flex items-center gap-3 font-mono text-xs text-white/70">
        <span className="w-32">barn-frame ct = {ct.toFixed(2)}</span>
        <input
          type="range"
          min={T_MIN}
          max={T_MAX}
          step={0.02}
          value={ct}
          onChange={(e) => setCt(parseFloat(e.target.value))}
          className="flex-1"
        />
        <span className="w-32">γ = {g.toFixed(3)}</span>
      </label>
    </div>
  );
}
