"use client";

import { useEffect, useRef, useState } from "react";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  fresnelAll,
  reflectance,
  transmittanceS,
  transmittanceP,
  brewsterAngle,
} from "@/lib/physics/electromagnetism/fresnel";

const RATIO = 0.58;
const MAX_HEIGHT = 560;

const AMBER = "rgba(255, 180, 80,"; // rays
const CYAN = "rgba(120, 220, 240,"; // interface
const LILAC = "rgba(200, 160, 255,"; // glass region / p-channel
const MAGENTA = "rgba(255, 100, 200,"; // s-channel

/**
 * FIG.44 — THE MONEY SHOT.
 *
 * Left half: an air → glass interface with a slider-selected incidence
 * angle. The incoming ray (amber) hits the interface, spawning a
 * reflected + transmitted pair whose pixel-widths are weighted by the
 * Fresnel amplitude coefficients |r_s|² + |r_p|² and their transmitted
 * counterparts — so the reader sees directly how much energy goes each
 * way at every angle.
 *
 * Right half: reflectance vs incidence angle. R_s (magenta) and R_p
 * (lilac) plotted from 0 to 90°, with the Brewster angle highlighted —
 * the one point at which R_p = 0 and the reflected beam is purely
 * s-polarised. The live slider position is tracked as a vertical cursor.
 *
 * Everything is computed by `fresnelAll` / `reflectance` / `transmittanceS`
 * from `lib/physics/electromagnetism/fresnel.ts`. No fake numbers.
 */
export function FresnelCurvesScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 880, height: 520 });
  const [thetaDeg, setThetaDeg] = useState(45);
  const [n1, setN1] = useState(1.0);
  const [n2, setN2] = useState(1.5);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) setSize({ width: w, height: Math.min(w * RATIO, MAX_HEIGHT) });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = size;
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    }
    ctx.clearRect(0, 0, width, height);

    const theta = (thetaDeg * Math.PI) / 180;
    const { rs, rp, ts, tp, thetaT } = fresnelAll(theta, n1, n2);
    const Rs = reflectance(rs);
    const Rp = reflectance(rp);
    const Ts = transmittanceS(ts, n1, n2, theta, thetaT);
    const Tp = transmittanceP(tp, n1, n2, theta, thetaT);

    // ── Layout ─────────────────────────────────────────────────────────
    // Left half is the ray diagram; right half is the plot. On narrow
    // viewports we stack — check width/height ratio.
    const isStacked = width < 560;
    const leftW = isStacked ? width : width * 0.5;
    const rightW = isStacked ? width : width * 0.5;
    const leftH = isStacked ? height * 0.55 : height;
    const rightH = isStacked ? height * 0.45 : height;
    const rightX = isStacked ? 0 : leftW;
    const rightY = isStacked ? leftH : 0;

    // ── Ray diagram ────────────────────────────────────────────────────
    drawRayDiagram(ctx, colors, {
      x: 0,
      y: 0,
      w: leftW,
      h: leftH,
      theta,
      thetaT,
      n1,
      n2,
      Rs,
      Rp,
      Ts,
      Tp,
    });

    // ── R vs θ plot ────────────────────────────────────────────────────
    drawReflectancePlot(ctx, colors, {
      x: rightX,
      y: rightY,
      w: rightW,
      h: rightH,
      n1,
      n2,
      liveTheta: theta,
    });
  }, [size, thetaDeg, n1, n2, colors]);

  const thetaB = (brewsterAngle(n1, n2) * 180) / Math.PI;
  const thetaRad = (thetaDeg * Math.PI) / 180;
  const { rs, rp, ts, tp, thetaT } = fresnelAll(thetaRad, n1, n2);
  const Rs = reflectance(rs);
  const Rp = reflectance(rp);
  const Ts = transmittanceS(ts, n1, n2, thetaRad, thetaT);
  const Tp = transmittanceP(tp, n1, n2, thetaRad, thetaT);

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-3 grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2 px-2 text-sm">
        <label className="text-[var(--color-fg-3)]">Angle θᵢ</label>
        <input
          type="range"
          min={0}
          max={89.9}
          step={0.1}
          value={thetaDeg}
          onChange={(e) => setThetaDeg(parseFloat(e.target.value))}
          className="accent-[rgb(255,180,80)]"
        />
        <span className="w-16 text-right font-mono text-[var(--color-fg-1)]">
          {thetaDeg.toFixed(1)}°
        </span>

        <label className="text-[var(--color-fg-3)]">n₁</label>
        <input
          type="range"
          min={1.0}
          max={2.5}
          step={0.01}
          value={n1}
          onChange={(e) => setN1(parseFloat(e.target.value))}
          className="accent-[rgb(120,220,240)]"
        />
        <span className="w-16 text-right font-mono text-[var(--color-fg-1)]">
          {n1.toFixed(2)}
        </span>

        <label className="text-[var(--color-fg-3)]">n₂</label>
        <input
          type="range"
          min={1.0}
          max={2.5}
          step={0.01}
          value={n2}
          onChange={(e) => setN2(parseFloat(e.target.value))}
          className="accent-[rgb(200,160,255)]"
        />
        <span className="w-16 text-right font-mono text-[var(--color-fg-1)]">
          {n2.toFixed(2)}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-4 px-2 font-mono text-[11px] text-[var(--color-fg-3)]">
        <span>θ_B = {Number.isFinite(thetaB) ? `${thetaB.toFixed(1)}°` : "—"}</span>
        <span style={{ color: "rgb(255,100,200)" }}>
          R_s = {Rs.toFixed(3)}
        </span>
        <span style={{ color: "rgb(200,160,255)" }}>
          R_p = {Rp.toFixed(3)}
        </span>
        <span style={{ color: "rgb(255,180,80)" }}>
          T_s = {Ts.toFixed(3)}  ·  T_p = {Tp.toFixed(3)}
        </span>
        <button
          type="button"
          className="border border-[var(--color-fg-4)] px-2 py-0.5 hover:border-[rgb(200,160,255)] hover:text-[var(--color-fg-1)]"
          onClick={() => setThetaDeg(thetaB)}
        >
          jump to θ_B
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Ray diagram subroutine.
// ─────────────────────────────────────────────────────────────────────────
function drawRayDiagram(
  ctx: CanvasRenderingContext2D,
  colors: { fg0: string; fg1: string; fg2: string; fg3: string },
  o: {
    x: number;
    y: number;
    w: number;
    h: number;
    theta: number;
    thetaT: number;
    n1: number;
    n2: number;
    Rs: number;
    Rp: number;
    Ts: number;
    Tp: number;
  },
) {
  const { x, y, w, h, theta, thetaT, n1, n2, Rs, Rp, Ts, Tp } = o;

  const cx = x + w / 2;
  const cy = y + h / 2;
  const rayLen = Math.min(w, h) * 0.35;

  // Upper half — medium 1 (air). Lower half — medium 2 (glass), lilac tint.
  ctx.fillStyle = `${LILAC} 0.09)`;
  ctx.fillRect(x, cy, w, h - (cy - y));

  // Interface line (cyan)
  ctx.strokeStyle = `${CYAN} 0.85)`;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(x + 10, cy);
  ctx.lineTo(x + w - 10, cy);
  ctx.stroke();

  // Surface normal (dashed)
  ctx.strokeStyle = `${colors.fg3}`;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(cx, cy - h * 0.42);
  ctx.lineTo(cx, cy + h * 0.42);
  ctx.stroke();
  ctx.setLineDash([]);

  // Labels: medium 1 / medium 2
  ctx.fillStyle = colors.fg2;
  ctx.font = "11px monospace";
  ctx.textAlign = "left";
  ctx.fillText(`n₁ = ${n1.toFixed(2)}`, x + 14, y + 16);
  ctx.fillText(`n₂ = ${n2.toFixed(2)}`, x + 14, y + h - 10);
  ctx.textAlign = "right";
  ctx.fillText("plane of incidence", x + w - 12, y + 16);

  // Incoming ray — comes from upper-left down to the hit point. Angle θ is
  // measured from the normal (the dashed vertical line).
  const hitX = cx;
  const hitY = cy;
  const incomingStartX = hitX - rayLen * Math.sin(theta);
  const incomingStartY = hitY - rayLen * Math.cos(theta);
  ctx.strokeStyle = `${AMBER} 0.95)`;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(incomingStartX, incomingStartY);
  ctx.lineTo(hitX, hitY);
  ctx.stroke();
  // Arrowhead on incoming
  drawArrowhead(ctx, incomingStartX, incomingStartY, hitX, hitY, `${AMBER} 0.95)`);

  // Reflected ray — mirror about normal.
  const avgR = 0.5 * (Rs + Rp);
  const refWidth = Math.max(0.3, avgR * 6);
  const reflEndX = hitX + rayLen * Math.sin(theta);
  const reflEndY = hitY - rayLen * Math.cos(theta);
  ctx.strokeStyle = `${AMBER} ${(0.5 + 0.5 * avgR).toFixed(2)})`;
  ctx.lineWidth = refWidth;
  ctx.beginPath();
  ctx.moveTo(hitX, hitY);
  ctx.lineTo(reflEndX, reflEndY);
  ctx.stroke();

  // Transmitted ray — refracted by Snell's law.
  const avgT = 0.5 * (Ts + Tp);
  if (Number.isFinite(thetaT)) {
    const transWidth = Math.max(0.3, avgT * 6);
    const transEndX = hitX + rayLen * Math.sin(thetaT);
    const transEndY = hitY + rayLen * Math.cos(thetaT);
    ctx.strokeStyle = `${AMBER} ${(0.35 + 0.6 * avgT).toFixed(2)})`;
    ctx.lineWidth = transWidth;
    ctx.beginPath();
    ctx.moveTo(hitX, hitY);
    ctx.lineTo(transEndX, transEndY);
    ctx.stroke();
    drawArrowhead(ctx, hitX, hitY, transEndX, transEndY, `${AMBER} 0.9)`);
  }

  // Angle markers — arcs at the hit point.
  ctx.strokeStyle = colors.fg3;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(hitX, hitY, 26, -Math.PI / 2, -Math.PI / 2 + theta);
  ctx.stroke();
  ctx.fillStyle = colors.fg1;
  ctx.font = "10px monospace";
  ctx.textAlign = "left";
  ctx.fillText(`θᵢ = ${((theta * 180) / Math.PI).toFixed(1)}°`, hitX + 30, hitY - 12);
  if (Number.isFinite(thetaT)) {
    ctx.beginPath();
    ctx.arc(hitX, hitY, 26, Math.PI / 2 - thetaT, Math.PI / 2);
    ctx.stroke();
    ctx.fillText(
      `θ_t = ${((thetaT * 180) / Math.PI).toFixed(1)}°`,
      hitX + 30,
      hitY + 22,
    );
  } else {
    ctx.fillStyle = `${MAGENTA} 0.9)`;
    ctx.fillText("TIR", hitX + 30, hitY + 22);
  }

  // Caption strip at bottom of left panel.
  ctx.fillStyle = colors.fg2;
  ctx.textAlign = "center";
  ctx.font = "10px monospace";
  ctx.fillText(
    "ray width ∝ √(R_avg) (reflected)  ·  √(T_avg) (transmitted)",
    x + w / 2,
    y + h - 24,
  );
}

function drawArrowhead(
  ctx: CanvasRenderingContext2D,
  fx: number,
  fy: number,
  tx: number,
  ty: number,
  fill: string,
) {
  const dx = tx - fx;
  const dy = ty - fy;
  const l = Math.hypot(dx, dy) || 1;
  const ux = dx / l;
  const uy = dy / l;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(tx, ty);
  ctx.lineTo(tx - ux * 9 - uy * 4, ty - uy * 9 + ux * 4);
  ctx.lineTo(tx - ux * 9 + uy * 4, ty - uy * 9 - ux * 4);
  ctx.closePath();
  ctx.fill();
}

// ─────────────────────────────────────────────────────────────────────────
// R(θ) plot subroutine.
// ─────────────────────────────────────────────────────────────────────────
function drawReflectancePlot(
  ctx: CanvasRenderingContext2D,
  colors: { fg0: string; fg1: string; fg2: string; fg3: string },
  o: { x: number; y: number; w: number; h: number; n1: number; n2: number; liveTheta: number },
) {
  const { x, y, w, h, n1, n2, liveTheta } = o;

  const padL = 40;
  const padR = 14;
  const padT = 26;
  const padB = 34;
  const plotX = x + padL;
  const plotY = y + padT;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  // Frame
  ctx.strokeStyle = colors.fg3;
  ctx.lineWidth = 1;
  ctx.strokeRect(plotX, plotY, plotW, plotH);

  // Axis labels
  ctx.fillStyle = colors.fg2;
  ctx.font = "10px monospace";
  ctx.textAlign = "left";
  ctx.fillText("R(θ)", plotX + 6, plotY + 12);
  ctx.textAlign = "center";
  ctx.fillText("θᵢ (deg)", plotX + plotW / 2, y + h - 10);

  // Grid + ticks for R (0, 0.25, 0.5, 0.75, 1)
  ctx.fillStyle = colors.fg3;
  ctx.font = "9px monospace";
  ctx.textAlign = "right";
  for (let r = 0; r <= 1.001; r += 0.25) {
    const py = plotY + plotH * (1 - r);
    ctx.strokeStyle = `${colors.fg3}`;
    ctx.setLineDash([1, 3]);
    ctx.beginPath();
    ctx.moveTo(plotX, py);
    ctx.lineTo(plotX + plotW, py);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillText(r.toFixed(2), plotX - 4, py + 3);
  }
  // Ticks for angle (0, 30, 60, 90)
  ctx.textAlign = "center";
  for (let a = 0; a <= 90; a += 15) {
    const px = plotX + (plotW * a) / 90;
    ctx.fillText(String(a), px, plotY + plotH + 12);
  }

  // Compute curves — sample 200 points.
  const N = 200;
  const rsPts: [number, number][] = [];
  const rpPts: [number, number][] = [];
  for (let i = 0; i <= N; i++) {
    const thetaDegSample = (i / N) * 89.9;
    const theta = (thetaDegSample * Math.PI) / 180;
    const { rs, rp } = fresnelAll(theta, n1, n2);
    rsPts.push([thetaDegSample, rs * rs]);
    rpPts.push([thetaDegSample, rp * rp]);
  }
  const toPx = (angleDeg: number, R: number) => ({
    x: plotX + (plotW * angleDeg) / 90,
    y: plotY + plotH * (1 - R),
  });

  // R_s — magenta
  ctx.strokeStyle = `${MAGENTA} 0.95)`;
  ctx.lineWidth = 1.7;
  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const p = toPx(rsPts[i][0], rsPts[i][1]);
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();

  // R_p — lilac
  ctx.strokeStyle = `${LILAC} 0.95)`;
  ctx.lineWidth = 1.7;
  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const p = toPx(rpPts[i][0], rpPts[i][1]);
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();

  // Brewster marker (R_p = 0 point).
  const thetaBdeg = (Math.atan(n2 / n1) * 180) / Math.PI;
  if (thetaBdeg > 0 && thetaBdeg < 90) {
    const pB = toPx(thetaBdeg, 0);
    ctx.strokeStyle = `${LILAC} 0.8)`;
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.moveTo(pB.x, plotY);
    ctx.lineTo(pB.x, plotY + plotH);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = `${LILAC} 0.95)`;
    ctx.textAlign = "left";
    ctx.font = "10px monospace";
    ctx.fillText(`θ_B ${thetaBdeg.toFixed(1)}°`, pB.x + 4, plotY + 14);
  }

  // Live cursor at the selected incidence angle.
  const liveDeg = (liveTheta * 180) / Math.PI;
  const liveX = plotX + (plotW * liveDeg) / 90;
  ctx.strokeStyle = `${AMBER} 0.85)`;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(liveX, plotY);
  ctx.lineTo(liveX, plotY + plotH);
  ctx.stroke();
  ctx.setLineDash([]);

  // Legend
  ctx.textAlign = "right";
  ctx.font = "10px monospace";
  ctx.fillStyle = `${MAGENTA} 0.95)`;
  ctx.fillText("R_s (s-pol)", plotX + plotW - 6, plotY + 14);
  ctx.fillStyle = `${LILAC} 0.95)`;
  ctx.fillText("R_p (p-pol)", plotX + plotW - 6, plotY + 28);
}
