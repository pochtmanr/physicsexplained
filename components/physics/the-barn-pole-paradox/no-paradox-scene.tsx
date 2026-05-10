"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  SCENE_CANVAS_CLASS,
  applyDpr,
  hexToRgba,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
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
 */

const L_BARN = 5;
const L_POLE = 10;
const BETA = Math.sqrt(3) / 2; // γ = 2

const MARGIN = 20;

// Time scrubber range in barn-frame ct units.
const T_MIN = -2.5;
const T_MAX = 2.5;

function drawBarnFramePanel(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  W: number,
  H: number,
  ct: number,
  beta: number,
) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const xMin = -3;
  const xMax = L_BARN + 3;
  const xToPx = (x: number) =>
    MARGIN + ((x - xMin) / (xMax - xMin)) * (W - 2 * MARGIN);
  const yMid = H / 2;

  // Floor line
  ctx.strokeStyle = hexToRgba(tokens.textFaint, 0.7);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(MARGIN, yMid + 30);
  ctx.lineTo(W - MARGIN, yMid + 30);
  ctx.stroke();

  // Barn — a rectangle from x = 0 to x = L_BARN, with doors at the ends.
  const barnLeft = xToPx(0);
  const barnRight = xToPx(L_BARN);
  ctx.strokeStyle = tokens.cyan;
  ctx.lineWidth = 2;
  // Roof
  ctx.beginPath();
  ctx.moveTo(barnLeft, yMid - 30);
  ctx.lineTo(barnRight, yMid - 30);
  ctx.stroke();

  // Doors at the ends.
  const doorClosed = Math.abs(ct) < 0.05;
  ctx.strokeStyle = doorClosed ? tokens.amber : tokens.cyan;
  ctx.lineWidth = doorClosed ? 3 : 1.5;
  ctx.beginPath();
  ctx.moveTo(barnLeft, yMid - 30);
  ctx.lineTo(barnLeft, yMid + 30);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(barnRight, yMid - 30);
  ctx.lineTo(barnRight, yMid + 30);
  ctx.stroke();

  // The pole — contracted to L_POLE / γ in this frame, moving at +β.
  const Lcontracted = contractedPoleLength(L_POLE, beta);
  const rearX = beta * ct;
  const frontX = rearX + Lcontracted;

  ctx.strokeStyle = tokens.magenta;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(xToPx(rearX), yMid + 5);
  ctx.lineTo(xToPx(frontX), yMid + 5);
  ctx.stroke();

  // Label
  ctx.fillStyle = tokens.textBright;
  ctx.font = "11px ui-monospace, monospace";
  ctx.fillText("BARN FRAME", MARGIN, 14);
  ctx.fillStyle = hexToRgba(tokens.cyan, 0.85);
  ctx.fillText(`barn = ${L_BARN.toFixed(0)} m`, MARGIN, H - 24);
  ctx.fillStyle = hexToRgba(tokens.magenta, 0.85);
  ctx.fillText(
    `pole/γ = ${Lcontracted.toFixed(2)} m`,
    MARGIN,
    H - 8,
  );
  ctx.fillStyle = hexToRgba(tokens.amber, 0.85);
  ctx.fillText(`ct = ${ct.toFixed(2)}`, W - 90, 14);
  if (doorClosed) {
    ctx.fillText("BOTH DOORS CLOSED", W - 160, H - 8);
  }
}

function drawPoleFramePanel(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  W: number,
  H: number,
  ctBarnFrame: number,
  beta: number,
) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const g = gamma(beta);

  const tPrime = g * ctBarnFrame;

  const xMin = -3;
  const xMax = L_POLE + 4;
  const xToPx = (x: number) =>
    MARGIN + ((x - xMin) / (xMax - xMin)) * (W - 2 * MARGIN);
  const yMid = H / 2;

  ctx.strokeStyle = hexToRgba(tokens.textFaint, 0.7);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(MARGIN, yMid + 30);
  ctx.lineTo(W - MARGIN, yMid + 30);
  ctx.stroke();

  // The pole at rest from x = 0 to x = L_POLE.
  ctx.strokeStyle = tokens.magenta;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(xToPx(0), yMid + 5);
  ctx.lineTo(xToPx(L_POLE), yMid + 5);
  ctx.stroke();

  // Barn — contracted, moving at speed −β.
  const barnContracted = contractedBarnLength(L_BARN, beta);
  const barnRearX = -beta * tPrime;
  const barnFrontX = barnRearX + barnContracted;

  ctx.strokeStyle = tokens.cyan;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(xToPx(barnRearX), yMid - 30);
  ctx.lineTo(xToPx(barnFrontX), yMid - 30);
  ctx.stroke();

  // Door events
  const tFrontEvent = doorEventLagInPoleFrame(L_BARN, beta, 1);
  const tRearEvent = 0;

  const eps = 0.05;
  const frontDoorClosed = Math.abs(tPrime - tFrontEvent) < eps;
  const rearDoorClosed = Math.abs(tPrime - tRearEvent) < eps;

  ctx.strokeStyle = rearDoorClosed ? tokens.amber : tokens.cyan;
  ctx.lineWidth = rearDoorClosed ? 3 : 1.5;
  ctx.beginPath();
  ctx.moveTo(xToPx(barnRearX), yMid - 30);
  ctx.lineTo(xToPx(barnRearX), yMid + 30);
  ctx.stroke();

  ctx.strokeStyle = frontDoorClosed ? tokens.amber : tokens.cyan;
  ctx.lineWidth = frontDoorClosed ? 3 : 1.5;
  ctx.beginPath();
  ctx.moveTo(xToPx(barnFrontX), yMid - 30);
  ctx.lineTo(xToPx(barnFrontX), yMid + 30);
  ctx.stroke();

  // Label
  ctx.fillStyle = tokens.textBright;
  ctx.font = "11px ui-monospace, monospace";
  ctx.fillText("POLE FRAME", MARGIN, 14);
  ctx.fillStyle = hexToRgba(tokens.magenta, 0.85);
  ctx.fillText(`pole = ${L_POLE} m`, MARGIN, H - 24);
  ctx.fillStyle = hexToRgba(tokens.cyan, 0.85);
  ctx.fillText(
    `barn/γ = ${barnContracted.toFixed(2)} m`,
    MARGIN,
    H - 8,
  );
  ctx.fillStyle = hexToRgba(tokens.amber, 0.85);
  ctx.fillText(`t' = ${tPrime.toFixed(2)}`, W - 90, 14);
  if (frontDoorClosed) {
    ctx.fillText("FRONT DOOR CLOSING", W - 170, H - 8);
  } else if (rearDoorClosed) {
    ctx.fillText("REAR DOOR CLOSING", W - 160, H - 8);
  }
}

export function NoParadoxScene() {
  const [ct, setCt] = useState(0);
  const tokens = useSceneTokens();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const barnRef = useRef<HTMLCanvasElement | null>(null);
  const poleRef = useRef<HTMLCanvasElement | null>(null);

  const lag = useMemo(() => doorEventLagInPoleFrame(L_BARN, BETA, 1), []);
  const g = useMemo(() => gamma(BETA), []);

  // Each panel takes half the container width (minus a small gap), capped.
  const { width: containerW } = useSceneSize(containerRef, {
    ratio: 0.3,
    maxHeight: 240,
    minHeight: 200,
  });
  const PANEL_W = Math.max(200, Math.floor((containerW - 12) / 2));
  const PANEL_H = Math.min(220, Math.max(180, Math.floor(PANEL_W * 0.6)));

  useEffect(() => {
    const barn = barnRef.current;
    const pole = poleRef.current;
    if (!barn || !pole) return;
    const barnCtx = applyDpr(barn, PANEL_W, PANEL_H);
    const poleCtx = applyDpr(pole, PANEL_W, PANEL_H);
    if (barnCtx) drawBarnFramePanel(barnCtx, tokens, PANEL_W, PANEL_H, ct, BETA);
    if (poleCtx) drawPoleFramePanel(poleCtx, tokens, PANEL_W, PANEL_H, ct, BETA);
  }, [ct, tokens, PANEL_W, PANEL_H]);

  return (
    <div ref={containerRef} className="flex w-full flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        <canvas
          ref={barnRef}
          style={{ width: PANEL_W, height: PANEL_H, display: "block" }}
          className={SCENE_CANVAS_CLASS}
        />
        <canvas
          ref={poleRef}
          style={{ width: PANEL_W, height: PANEL_H, display: "block" }}
          className={SCENE_CANVAS_CLASS}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 font-mono text-[11px] text-[var(--color-fg-2)]">
        <div
          className="rounded-md border p-3"
          style={{
            borderColor: "color-mix(in srgb, var(--color-cyan) 30%, transparent)",
            backgroundColor: "color-mix(in srgb, var(--color-cyan) 5%, transparent)",
          }}
        >
          <div style={{ color: "var(--color-cyan)" }}>BARN STORY</div>
          <div className="mt-1 opacity-80">
            doors close simultaneously at t = 0
          </div>
          <div className="opacity-80">contracted pole fits in barn</div>
        </div>
        <div
          className="rounded-md border p-3"
          style={{
            borderColor: "color-mix(in srgb, var(--color-magenta) 30%, transparent)",
            backgroundColor: "color-mix(in srgb, var(--color-magenta) 5%, transparent)",
          }}
        >
          <div style={{ color: "var(--color-magenta)" }}>POLE STORY</div>
          <div className="mt-1 opacity-80">
            front door closes at t' = {lag.toFixed(2)}
          </div>
          <div className="opacity-80">rear door closes at t' = 0</div>
        </div>
      </div>

      <label className="flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-32">barn-frame ct = {ct.toFixed(2)}</span>
        <input
          type="range"
          min={T_MIN}
          max={T_MAX}
          step={0.02}
          value={ct}
          onChange={(e) => setCt(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-cyan)" }}
        />
        <span className="w-32">γ = {g.toFixed(3)}</span>
      </label>
    </div>
  );
}
