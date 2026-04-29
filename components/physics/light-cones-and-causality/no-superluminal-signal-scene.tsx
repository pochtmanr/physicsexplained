"use client";

import { useEffect, useRef, useState } from "react";

/**
 * FIG.13c — The superluminal causality violation.
 *
 * In the lab frame a signal travels from A = (x = 0, ct = 0) to
 * B = (x = 4, ct = 2) at v = 2c (slope Δx/Δct = 2 > 1 — superluminal).
 *
 * Toggle to a frame boosted at β = 0.7 in the +x direction:
 *   Δt' = γ (Δt − β Δx/c)
 *   With Δct = 2, Δx = 4, β = 0.7:
 *   Δt' = γ (2 − 0.7 × 4) = γ (2 − 2.8) = γ × (−0.8) < 0
 *   ⇒ B precedes A.  Cause follows effect.  Causality collapses.
 *
 * The red shaded band between the two frames illustrates the
 * contradiction: the same message arrives before it is sent.
 */

const BETA_BOOST = 0.7;
const W = 560;
const H = 360;
const MARGIN = 44;
const X_RANGE: [number, number] = [-0.5, 5.5];
const CT_RANGE: [number, number] = [-1.5, 3.5];

// Signal endpoint coordinates in the lab frame (c = 1 units).
const A_LAB = { x: 0, ct: 0 };
const B_LAB = { x: 4, ct: 2 };

function gamma(beta: number) {
  return 1 / Math.sqrt(1 - beta * beta);
}

/** Lorentz-transform a single (x, ct) point by a +x boost at speed β. */
function lorentz(pt: { x: number; ct: number }, beta: number) {
  const g = gamma(beta);
  return {
    x: g * (pt.x - beta * pt.ct),
    ct: g * (pt.ct - beta * pt.x),
  };
}

export function NoSuperluminalSignalScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [boosted, setBoosted] = useState(false);
  const [beta, setBeta] = useState(BETA_BOOST);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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

    // ── Background ──────────────────────────────────────────────────────
    ctx.fillStyle = "#0A0C12";
    ctx.fillRect(0, 0, W, H);

    // ── Grid lines ──────────────────────────────────────────────────────
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
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

    // ── Axes ────────────────────────────────────────────────────────────
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 1;
    // ct axis
    ctx.beginPath();
    ctx.moveTo(xToPx(0), MARGIN);
    ctx.lineTo(xToPx(0), H - MARGIN);
    ctx.stroke();
    // x axis
    ctx.beginPath();
    ctx.moveTo(MARGIN, ctToPx(0));
    ctx.lineTo(W - MARGIN, ctToPx(0));
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.font = "10px monospace";
    ctx.fillText("x", W - MARGIN + 6, ctToPx(0) + 4);
    ctx.fillText("ct", xToPx(0) + 4, MARGIN - 6);

    // ── Light cone from A (origin here) ────────────────────────────────
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = "#FFD66B";
    ctx.lineWidth = 1;
    // future cone: ct = +x and ct = -x (only upper half shown for clutter)
    ctx.beginPath();
    ctx.moveTo(xToPx(A_LAB.x), ctToPx(A_LAB.ct));
    ctx.lineTo(xToPx(A_LAB.x + (ctMax - A_LAB.ct)), ctToPx(ctMax));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(xToPx(A_LAB.x), ctToPx(A_LAB.ct));
    ctx.lineTo(xToPx(A_LAB.x - (ctMax - A_LAB.ct)), ctToPx(ctMax));
    ctx.stroke();
    ctx.setLineDash([]);

    // ── Choose coordinate system ────────────────────────────────────────
    let ptA = A_LAB;
    let ptB = B_LAB;
    if (boosted) {
      ptA = lorentz(A_LAB, beta);
      ptB = lorentz(B_LAB, beta);
    }

    // ── Red "contradiction" band between the two events ─────────────────
    // The band highlights that B is earlier than A in the boosted frame.
    if (boosted && ptB.ct < ptA.ct) {
      // shade vertical stripe between the two ct values
      const ct1Px = ctToPx(Math.min(ptA.ct, ptB.ct));
      const ct2Px = ctToPx(Math.max(ptA.ct, ptB.ct));
      ctx.fillStyle = "rgba(220, 38, 38, 0.15)";
      ctx.fillRect(MARGIN, Math.min(ct1Px, ct2Px), plotW, Math.abs(ct2Px - ct1Px));

      // Hatching for emphasis
      ctx.strokeStyle = "rgba(220, 38, 38, 0.25)";
      ctx.lineWidth = 1;
      const step = 12;
      for (
        let yy = Math.min(ct1Px, ct2Px);
        yy < Math.max(ct1Px, ct2Px) + plotW;
        yy += step
      ) {
        ctx.beginPath();
        ctx.moveTo(MARGIN, yy);
        ctx.lineTo(MARGIN + Math.min(yy - Math.min(ct1Px, ct2Px), plotW), Math.min(ct1Px, ct2Px));
        ctx.stroke();
      }
    }

    // ── Signal worldline A → B ──────────────────────────────────────────
    const isBackward = ptB.ct < ptA.ct;
    ctx.strokeStyle = isBackward ? "#EF4444" : "#FF6ADE"; // red if backwards
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
      ctx.fillStyle = isBackward ? "#EF4444" : "#FF6ADE";
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

    // ── Event dots ──────────────────────────────────────────────────────
    // A — source event
    ctx.fillStyle = "#67E8F9";
    ctx.beginPath();
    ctx.arc(xToPx(ptA.x), ctToPx(ptA.ct), 6, 0, Math.PI * 2);
    ctx.fill();
    // B — target event
    ctx.fillStyle = isBackward ? "#EF4444" : "#C084FC";
    ctx.beginPath();
    ctx.arc(xToPx(ptB.x), ctToPx(ptB.ct), 6, 0, Math.PI * 2);
    ctx.fill();

    // ── Event labels ────────────────────────────────────────────────────
    ctx.font = "bold 11px monospace";
    ctx.fillStyle = "#67E8F9";
    ctx.fillText(
      `A (${ptA.x.toFixed(1)}, ${ptA.ct.toFixed(2)})`,
      xToPx(ptA.x) + 8,
      ctToPx(ptA.ct) - 6,
    );
    ctx.fillStyle = isBackward ? "#EF4444" : "#C084FC";
    ctx.fillText(
      `B (${ptB.x.toFixed(1)}, ${ptB.ct.toFixed(2)})`,
      xToPx(ptB.x) + 8,
      ctToPx(ptB.ct) + 14,
    );

    // ── Speed annotation ────────────────────────────────────────────────
    const dxSig = boosted ? (ptB.x - ptA.x) : (B_LAB.x - A_LAB.x);
    const dctSig = boosted ? (ptB.ct - ptA.ct) : (B_LAB.ct - A_LAB.ct);
    const speed = Math.abs(dctSig) > 0.001 ? Math.abs(dxSig / dctSig) : Infinity;
    ctx.font = "10px monospace";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    const midX = (xToPx(ptA.x) + xToPx(ptB.x)) / 2;
    const midCt = (ctToPx(ptA.ct) + ctToPx(ptB.ct)) / 2;
    ctx.fillText(
      `v = ${isFinite(speed) ? speed.toFixed(1) : "∞"}c`,
      midX + 6,
      midCt - 6,
    );
  }, [boosted, beta]);

  // Derived display values
  const g = gamma(beta);
  const dctLab = B_LAB.ct - A_LAB.ct;
  const dxLab = B_LAB.x - A_LAB.x;
  const dctBoosted = g * (dctLab - beta * dxLab);
  const causallyReversed = dctBoosted < 0;

  return (
    <div className="flex flex-col gap-3">
      <canvas ref={canvasRef} className="rounded" aria-label="Superluminal signal spacetime diagram" />

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 font-mono text-xs text-white/70">
        <button
          type="button"
          onClick={() => setBoosted((b) => !b)}
          className={`rounded border px-3 py-1 transition-colors ${
            boosted
              ? "border-red-500/50 bg-red-900/30 text-red-300"
              : "border-white/15 bg-white/5 text-white/70 hover:bg-white/10"
          }`}
        >
          {boosted ? "boosted frame (β = " + beta.toFixed(2) + ")" : "lab frame"}
        </button>

        <label className="flex items-center gap-2">
          <span className="text-white/50">boost β =</span>
          <input
            type="range"
            min={0.1}
            max={0.95}
            step={0.01}
            value={beta}
            onChange={(e) => setBeta(parseFloat(e.target.value))}
            className="w-24 accent-red-400"
          />
          <span>{beta.toFixed(2)}</span>
        </label>
      </div>

      {/* HUD */}
      <div className="grid grid-cols-1 gap-1 font-mono text-xs text-white/70 sm:grid-cols-2">
        <div>
          <span className="text-white/50">lab frame:</span>{" "}
          A → B,{" "}
          <span className="text-[#FF6ADE]">v = {(dxLab / dctLab).toFixed(1)}c</span>
          {" · "}Δct = {dctLab.toFixed(2)}{" · "}B is later than A
        </div>
        <div>
          <span className="text-white/50">boosted frame (β = {beta.toFixed(2)}):</span>{" "}
          Δct&apos; = γ(Δct − β·Δx) ={" "}
          <span className={causallyReversed ? "text-red-400 font-bold" : "text-white/85"}>
            {dctBoosted.toFixed(3)}
          </span>
          {causallyReversed ? (
            <span className="ml-1 text-red-400"> ← B precedes A!</span>
          ) : (
            <span className="ml-1 text-white/40"> (B still later)</span>
          )}
        </div>
      </div>

      {causallyReversed && (
        <p className="rounded border border-red-500/30 bg-red-900/15 px-3 py-2 font-mono text-xs text-red-300">
          In this frame the signal arrives <strong>before it is sent</strong>. An
          observer here could use it to send a reply that reaches A&apos;s past —
          and prevent the original transmission. Causality is violated. This is
          why v &gt; c is forbidden by special relativity.
        </p>
      )}

      <p className="font-mono text-[10px] text-white/35">
        Signal: A = (x=0, ct=0) → B = (x={B_LAB.x}, ct={B_LAB.ct}).
        {" "}v = {(B_LAB.x / B_LAB.ct).toFixed(0)}c in the lab frame.
        {" "}Toggle to the boosted frame at any β &gt; Δct/Δx = {(B_LAB.ct / B_LAB.x).toFixed(2)} to reverse temporal order.
      </p>
    </div>
  );
}
