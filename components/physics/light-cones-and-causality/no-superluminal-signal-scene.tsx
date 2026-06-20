"use client";

import { useEffect, useRef, useState } from "react";
import {
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  hexToRgba,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import { Button } from "@/components/ui/button";

/**
 * FIG.13c — The superluminal causality violation.
 *
 * A signal travels from A = (x=0, ct=0) to B = (x=4, ct=2) at v = 2c. In a
 * frame boosted at β > Δct/Δx the events flip in time: B precedes A.
 */

const BETA_BOOST = 0.7;
const MARGIN = 44;
const X_RANGE: [number, number] = [-0.5, 5.5];
const CT_RANGE: [number, number] = [-1.5, 3.5];

const A_LAB = { x: 0, ct: 0 };
const B_LAB = { x: 4, ct: 2 };

function gamma(beta: number) {
  return 1 / Math.sqrt(1 - beta * beta);
}

function lorentz(pt: { x: number; ct: number }, beta: number) {
  const g = gamma(beta);
  return {
    x: g * (pt.x - beta * pt.ct),
    ct: g * (pt.ct - beta * pt.x),
  };
}

export function NoSuperluminalSignalScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [boosted, setBoosted] = useState(false);
  const [beta, setBeta] = useState(BETA_BOOST);

  const { width: W, height: H } = useSceneSize(containerRef, {
    ratio: 0.6,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 280,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, W, H);
    if (!ctx) return;
    draw(ctx, tokens, W, H, boosted, beta);
  }, [boosted, beta, tokens, W, H]);

  // Derived display values
  const g = gamma(beta);
  const dctLab = B_LAB.ct - A_LAB.ct;
  const dxLab = B_LAB.x - A_LAB.x;
  const dctBoosted = g * (dctLab - beta * dxLab);
  const causallyReversed = dctBoosted < 0;

  return (
    <div ref={containerRef} className="flex w-full flex-col gap-3 pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: W, height: H, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Superluminal signal spacetime diagram"
      />

      <div className="flex flex-wrap items-center gap-4 font-mono text-xs text-[var(--color-fg-2)]">
        <Button active={boosted} onClick={() => setBoosted((b) => !b)}>
          {boosted ? "boosted frame (β = " + beta.toFixed(2) + ")" : "lab frame"}
        </Button>

        <label className="flex items-center gap-2">
          <span className="text-[var(--color-fg-3)]">boost β =</span>
          <input
            type="range"
            min={0.1}
            max={0.95}
            step={0.01}
            value={beta}
            onChange={(e) => setBeta(parseFloat(e.target.value))}
            className="w-24"
            style={{ accentColor: "var(--color-red)" }}
          />
          <span>{beta.toFixed(2)}</span>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-1 font-mono text-xs text-[var(--color-fg-2)] sm:grid-cols-2">
        <div>
          <span className="text-[var(--color-fg-3)]">lab frame:</span>{" "}
          A → B,{" "}
          <span style={{ color: "var(--color-magenta)" }}>v = {(dxLab / dctLab).toFixed(1)}c</span>
          {" · "}Δct = {dctLab.toFixed(2)}{" · "}B is later than A
        </div>
        <div>
          <span className="text-[var(--color-fg-3)]">boosted frame (β = {beta.toFixed(2)}):</span>{" "}
          Δct&apos; = γ(Δct − β·Δx) ={" "}
          <span
            className="font-bold"
            style={{
              color: causallyReversed ? "var(--color-red)" : "var(--color-fg-1)",
            }}
          >
            {dctBoosted.toFixed(3)}
          </span>
          {causallyReversed ? (
            <span className="ml-1" style={{ color: "var(--color-red)" }}> ← B precedes A!</span>
          ) : (
            <span className="ml-1 text-[var(--color-fg-3)]"> (B still later)</span>
          )}
        </div>
      </div>

      {causallyReversed && (
        <p
          className="rounded border px-3 py-2 font-mono text-xs"
          style={{
            borderColor: "color-mix(in srgb, var(--color-red) 50%, transparent)",
            background: "color-mix(in srgb, var(--color-red) 10%, transparent)",
            color: "var(--color-red)",
          }}
        >
          In this frame the signal arrives <strong>before it is sent</strong>. An
          observer here could use it to send a reply that reaches A&apos;s past —
          and prevent the original transmission. Causality is violated. This is
          why v &gt; c is forbidden by special relativity.
        </p>
      )}

      <p className="font-mono text-[10px] text-[var(--color-fg-3)]">
        Signal: A = (x=0, ct=0) → B = (x={B_LAB.x}, ct={B_LAB.ct}).
        {" "}v = {(B_LAB.x / B_LAB.ct).toFixed(0)}c in the lab frame.
        {" "}Toggle to the boosted frame at any β &gt; Δct/Δx = {(B_LAB.ct / B_LAB.x).toFixed(2)} to reverse temporal order.
      </p>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  W: number,
  H: number,
  boosted: boolean,
  beta: number,
) {
  ctx.clearRect(0, 0, W, H);

  const plotW = W - 2 * MARGIN;
  const plotH = H - 2 * MARGIN;
  const [xMin, xMax] = X_RANGE;
  const [ctMin, ctMax] = CT_RANGE;

  function xToPx(x: number) {
    return MARGIN + ((x - xMin) / (xMax - xMin)) * plotW;
  }
  function ctToPx(ct: number) {
    return H - MARGIN - ((ct - ctMin) / (ctMax - ctMin)) * plotH;
  }

  // Background
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = tokens.grid;
  ctx.lineWidth = 0.5;
  for (let xi = Math.ceil(xMin); xi <= Math.floor(xMax); xi++) {
    ctx.beginPath();
    ctx.moveTo(xToPx(xi), MARGIN);
    ctx.lineTo(xToPx(xi), H - MARGIN);
    ctx.stroke();
  }
  for (let ct = Math.ceil(ctMin); ct <= Math.floor(ctMax); ct++) {
    ctx.beginPath();
    ctx.moveTo(MARGIN, ctToPx(ct));
    ctx.lineTo(W - MARGIN, ctToPx(ct));
    ctx.stroke();
  }

  // Axes
  ctx.strokeStyle = tokens.axes;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(xToPx(0), MARGIN);
  ctx.lineTo(xToPx(0), H - MARGIN);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(MARGIN, ctToPx(0));
  ctx.lineTo(W - MARGIN, ctToPx(0));
  ctx.stroke();

  // Axis labels
  ctx.fillStyle = tokens.textFaint;
  ctx.font = "10px monospace";
  ctx.fillText("x", W - MARGIN + 6, ctToPx(0) + 4);
  ctx.fillText("ct", xToPx(0) + 4, MARGIN - 6);

  // Light cone from A
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = tokens.amber;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(xToPx(A_LAB.x), ctToPx(A_LAB.ct));
  ctx.lineTo(xToPx(A_LAB.x + (ctMax - A_LAB.ct)), ctToPx(ctMax));
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(xToPx(A_LAB.x), ctToPx(A_LAB.ct));
  ctx.lineTo(xToPx(A_LAB.x - (ctMax - A_LAB.ct)), ctToPx(ctMax));
  ctx.stroke();
  ctx.setLineDash([]);

  // Coordinate system
  let ptA = A_LAB;
  let ptB = B_LAB;
  if (boosted) {
    ptA = lorentz(A_LAB, beta);
    ptB = lorentz(B_LAB, beta);
  }

  // Red contradiction band
  if (boosted && ptB.ct < ptA.ct) {
    const ct1Px = ctToPx(Math.min(ptA.ct, ptB.ct));
    const ct2Px = ctToPx(Math.max(ptA.ct, ptB.ct));
    ctx.fillStyle = hexToRgba(tokens.red, 0.15);
    ctx.fillRect(MARGIN, Math.min(ct1Px, ct2Px), plotW, Math.abs(ct2Px - ct1Px));

    ctx.strokeStyle = hexToRgba(tokens.red, 0.25);
    ctx.lineWidth = 1;
    const step = 12;
    for (
      let yy = Math.min(ct1Px, ct2Px);
      yy < Math.max(ct1Px, ct2Px) + plotW;
      yy += step
    ) {
      ctx.beginPath();
      ctx.moveTo(MARGIN, yy);
      ctx.lineTo(
        MARGIN + Math.min(yy - Math.min(ct1Px, ct2Px), plotW),
        Math.min(ct1Px, ct2Px),
      );
      ctx.stroke();
    }
  }

  // Signal worldline A → B
  const isBackward = ptB.ct < ptA.ct;
  ctx.strokeStyle = isBackward ? tokens.red : tokens.magenta;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(xToPx(ptA.x), ctToPx(ptA.ct));
  ctx.lineTo(xToPx(ptB.x), ctToPx(ptB.ct));
  ctx.stroke();

  // Arrow head pointing toward B
  const dx = xToPx(ptB.x) - xToPx(ptA.x);
  const dct = ctToPx(ptB.ct) - ctToPx(ptA.ct);
  const len = Math.sqrt(dx * dx + dct * dct);
  if (len > 0) {
    const ux = dx / len;
    const uy = dct / len;
    ctx.fillStyle = isBackward ? tokens.red : tokens.magenta;
    ctx.beginPath();
    ctx.moveTo(xToPx(ptB.x), ctToPx(ptB.ct));
    ctx.lineTo(
      xToPx(ptB.x) - 10 * ux + 5 * uy,
      ctToPx(ptB.ct) - 10 * uy - 5 * ux,
    );
    ctx.lineTo(
      xToPx(ptB.x) - 10 * ux - 5 * uy,
      ctToPx(ptB.ct) - 10 * uy + 5 * ux,
    );
    ctx.closePath();
    ctx.fill();
  }

  // Event dots
  ctx.fillStyle = tokens.cyan;
  ctx.beginPath();
  ctx.arc(xToPx(ptA.x), ctToPx(ptA.ct), 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = isBackward ? tokens.red : tokens.purple;
  ctx.beginPath();
  ctx.arc(xToPx(ptB.x), ctToPx(ptB.ct), 6, 0, Math.PI * 2);
  ctx.fill();

  // Event labels
  ctx.font = "bold 11px monospace";
  ctx.fillStyle = tokens.cyan;
  ctx.fillText(
    `A (${ptA.x.toFixed(1)}, ${ptA.ct.toFixed(2)})`,
    xToPx(ptA.x) + 8,
    ctToPx(ptA.ct) - 6,
  );
  ctx.fillStyle = isBackward ? tokens.red : tokens.purple;
  ctx.fillText(
    `B (${ptB.x.toFixed(1)}, ${ptB.ct.toFixed(2)})`,
    xToPx(ptB.x) + 8,
    ctToPx(ptB.ct) + 14,
  );

  // Speed annotation
  const dxSig = boosted ? ptB.x - ptA.x : B_LAB.x - A_LAB.x;
  const dctSig = boosted ? ptB.ct - ptA.ct : B_LAB.ct - A_LAB.ct;
  const speed = Math.abs(dctSig) > 0.001 ? Math.abs(dxSig / dctSig) : Infinity;
  ctx.font = "10px monospace";
  ctx.fillStyle = tokens.textMute;
  const midX = (xToPx(ptA.x) + xToPx(ptB.x)) / 2;
  const midCt = (ctToPx(ptA.ct) + ctToPx(ptB.ct)) / 2;
  ctx.fillText(
    `v = ${isFinite(speed) ? speed.toFixed(1) : "∞"}c`,
    midX + 6,
    midCt - 6,
  );
}
