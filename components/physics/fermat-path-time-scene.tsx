"use client";

import { useEffect, useRef, useState } from "react";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

/**
 * FIG.47a — FermatPathTimeScene. Money shot for §09.6.
 *
 * Source S sits in air, observer O sits in water. The user drags the
 * candidate crossing point y along the air–water interface. For each y the
 * scene:
 *
 *   – draws seven "candidate" ghost paths from S to the interface to O, at
 *     evenly-spaced crossing heights, so the reader feels Fermat as a family
 *     of possibilities the photon is implicitly comparing;
 *   – highlights the user's live choice;
 *   – plots the total travel time t(y) as a convex curve, with the minimum
 *     marked in amber.
 *
 * The minimum-time path is the one that satisfies Snell's law: sin θ_air /
 * v_air = sin θ_water / v_water. Drag the slider to feel it snap into place.
 *
 * Unlike SnellFermatScene (§09.4), which puts the user on the refraction
 * side of the story, this one foregrounds the *principle*: a whole
 * continuum of trial paths, one extremum, a plot of time vs crossing.
 */

const RATIO = 0.72;
const MAX_HEIGHT = 480;

// Scene geometry, in arbitrary scene-units. Source S above (in air), observer
// O below (in water); S and O span D units horizontally. H_S is the height
// of S above the interface, H_O is the depth of O below it.
const H_S = 3;
const H_O = 3;
const D = 10;

// Light speeds, normalised to v_air = 1. Water has n ≈ 1.33.
const V_AIR = 1.0;
const V_WATER = 1 / 1.33;

function totalTime(y: number): number {
  // y = horizontal position of the crossing along the interface, in [0, D].
  return (
    Math.sqrt(y * y + H_S * H_S) / V_AIR +
    Math.sqrt((D - y) * (D - y) + H_O * H_O) / V_WATER
  );
}

/** Analytic minimiser of t(y) — Newton iteration on the Snell residual. */
function optimalY(): number {
  let y = D / 2;
  for (let i = 0; i < 80; i++) {
    const r1 = Math.sqrt(y * y + H_S * H_S);
    const r2 = Math.sqrt((D - y) * (D - y) + H_O * H_O);
    const f = y / (V_AIR * r1) - (D - y) / (V_WATER * r2);
    const fp =
      (H_S * H_S) / (V_AIR * r1 * r1 * r1) +
      (H_O * H_O) / (V_WATER * r2 * r2 * r2);
    const dy = f / fp;
    y -= dy;
    if (y < 0) y = 0;
    if (y > D) y = D;
    if (Math.abs(dy) < 1e-14) break;
  }
  return y;
}

export function FermatPathTimeScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 680, height: 480 });
  const [yFrac, setYFrac] = useState(0.5);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          setSize({ width: w, height: Math.min(w * RATIO, MAX_HEIGHT) });
        }
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const y = yFrac * D;
  const yStar = optimalY();
  const tLive = totalTime(y);
  const tMin = totalTime(yStar);

  // Angles from the interface normal for the live path, so we can print the
  // Snell readout.
  const sinAir = y / Math.sqrt(y * y + H_S * H_S);
  const sinWater = (D - y) / Math.sqrt((D - y) * (D - y) + H_O * H_O);

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

    // Layout: ray diagram above, t(y) plot below.
    const rayTop = 16;
    const rayHeight = height * 0.58;
    const rayBottom = rayTop + rayHeight;
    const plotTop = rayBottom + 26;
    const plotBottom = height - 26;

    const padX = 36;
    const sceneLeft = padX;
    const sceneRight = width - padX;
    const sceneW = sceneRight - sceneLeft;

    const pxPerUnit = Math.min(sceneW / D, rayHeight / (H_S + H_O));
    const interfaceY = rayTop + H_S * pxPerUnit;
    const sceneLeftX = sceneLeft + (sceneW - D * pxPerUnit) / 2;
    const sX = sceneLeftX;
    const sY = interfaceY - H_S * pxPerUnit;
    const oX = sceneLeftX + D * pxPerUnit;
    const oY = interfaceY + H_O * pxPerUnit;
    const liveX = sceneLeftX + y * pxPerUnit;
    const starX = sceneLeftX + yStar * pxPerUnit;

    // Air (top).
    const airGrad = ctx.createLinearGradient(0, rayTop, 0, interfaceY);
    airGrad.addColorStop(0, "rgba(111, 184, 198, 0.02)");
    airGrad.addColorStop(1, "rgba(111, 184, 198, 0.08)");
    ctx.fillStyle = airGrad;
    ctx.fillRect(sceneLeft, rayTop, sceneW, interfaceY - rayTop);

    // Water (bottom).
    const waterGrad = ctx.createLinearGradient(0, interfaceY, 0, rayBottom);
    waterGrad.addColorStop(0, "rgba(111, 184, 198, 0.22)");
    waterGrad.addColorStop(1, "rgba(111, 184, 198, 0.32)");
    ctx.fillStyle = waterGrad;
    ctx.fillRect(sceneLeft, interfaceY, sceneW, rayBottom - interfaceY);

    ctx.strokeStyle = "rgba(111, 184, 198, 0.7)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sceneLeft, interfaceY);
    ctx.lineTo(sceneRight, interfaceY);
    ctx.stroke();

    // Labels for the two media.
    ctx.fillStyle = colors.fg2;
    ctx.font = "11px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText("n₁ = 1.00 · air", sceneLeft + 4, rayTop + 14);
    ctx.fillText("n₂ = 1.33 · water", sceneLeft + 4, rayBottom - 6);

    // Candidate ghost paths — a quiet chorus of trial paths.
    ctx.strokeStyle = colors.fg3;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.35;
    const CANDIDATE_COUNT = 7;
    for (let k = 1; k <= CANDIDATE_COUNT; k++) {
      const frac = k / (CANDIDATE_COUNT + 1);
      const cx = sceneLeftX + frac * D * pxPerUnit;
      ctx.beginPath();
      ctx.moveTo(sX, sY);
      ctx.lineTo(cx, interfaceY);
      ctx.lineTo(oX, oY);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Dashed normal at the live crossing.
    ctx.strokeStyle = colors.fg3;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(liveX, interfaceY - 36);
    ctx.lineTo(liveX, interfaceY + 36);
    ctx.stroke();
    ctx.setLineDash([]);

    // Optimal ray (ghost amber underlay).
    ctx.strokeStyle = "rgba(228, 194, 122, 0.55)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(sX, sY);
    ctx.lineTo(starX, interfaceY);
    ctx.lineTo(oX, oY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Live candidate ray — cyan in air, magenta in water.
    ctx.strokeStyle = "#6FB8C6";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sX, sY);
    ctx.lineTo(liveX, interfaceY);
    ctx.stroke();
    ctx.strokeStyle = "#FF6ADE";
    ctx.beginPath();
    ctx.moveTo(liveX, interfaceY);
    ctx.lineTo(oX, oY);
    ctx.stroke();

    // Endpoints.
    ctx.fillStyle = colors.fg0;
    ctx.textAlign = "center";
    ctx.font = "12px ui-monospace, monospace";
    ctx.beginPath();
    ctx.arc(sX, sY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText("S", sX, sY - 10);
    ctx.beginPath();
    ctx.arc(oX, oY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText("O", oX, oY + 18);

    // Crossing handle.
    ctx.fillStyle = dragging ? "#FFD66A" : "#E4C27A";
    ctx.shadowColor = "#E4C27A";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(liveX, interfaceY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // t(y) plot.
    const plotLeft = sX;
    const plotRight = oX;
    const plotW = plotRight - plotLeft;
    const plotH = plotBottom - plotTop;

    const N = 160;
    const ts: number[] = new Array(N + 1);
    let tLo = Infinity;
    let tHi = -Infinity;
    for (let i = 0; i <= N; i++) {
      const yi = (D * i) / N;
      const ti = totalTime(yi);
      ts[i] = ti;
      if (ti < tLo) tLo = ti;
      if (ti > tHi) tHi = ti;
    }
    const pad = (tHi - tLo) * 0.1 + 1e-6;
    const lo = tLo - pad;
    const hi = tHi + pad;

    ctx.strokeStyle = colors.fg3;
    ctx.strokeRect(plotLeft, plotTop, plotW, plotH);

    const yOfT = (ti: number) =>
      plotTop + plotH * (1 - (ti - lo) / (hi - lo));

    // Horizontal rule at the minimum.
    ctx.strokeStyle = "rgba(228, 194, 122, 0.35)";
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(plotLeft, yOfT(tMin));
    ctx.lineTo(plotRight, yOfT(tMin));
    ctx.stroke();
    ctx.setLineDash([]);

    // Curve.
    ctx.strokeStyle = colors.fg1;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i <= N; i++) {
      const px = plotLeft + (plotW * i) / N;
      const py = yOfT(ts[i]);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Amber star at minimum.
    ctx.fillStyle = "#E4C27A";
    ctx.beginPath();
    ctx.arc(starX, yOfT(tMin), 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Magenta cursor for live choice.
    ctx.strokeStyle = "#FF6ADE";
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.moveTo(liveX, plotTop);
    ctx.lineTo(liveX, plotBottom);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#FF6ADE";
    ctx.beginPath();
    ctx.arc(liveX, yOfT(tLive), 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = colors.fg2;
    ctx.font = "10px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText("t(y) — total travel time", plotLeft + 4, plotTop + 12);
    ctx.textAlign = "right";
    ctx.fillText("y = d", plotRight - 2, plotBottom - 4);
    ctx.textAlign = "left";
    ctx.fillText("y = 0", plotLeft + 2, plotBottom - 4);

    // HUD readout.
    ctx.fillStyle = colors.fg1;
    ctx.font = "11px ui-monospace, monospace";
    ctx.textAlign = "right";
    const rx = sceneRight - 6;
    const readout = [
      `t(y)       = ${tLive.toFixed(3)}`,
      `t_min      = ${tMin.toFixed(3)}`,
      `sinθ₁/v₁  = ${(sinAir / V_AIR).toFixed(3)}`,
      `sinθ₂/v₂  = ${(sinWater / V_WATER).toFixed(3)}`,
    ];
    let ry = rayTop + 14;
    for (const line of readout) {
      ctx.fillText(line, rx, ry);
      ry += 14;
    }
  }, [size, yFrac, dragging, colors, y, yStar, tLive, tMin, sinAir, sinWater]);

  const pointerToFrac = (clientX: number) => {
    const c = canvasRef.current;
    if (!c) return yFrac;
    const rect = c.getBoundingClientRect();
    const local = clientX - rect.left;
    const pxPerUnit = Math.min(
      (size.width - 2 * 36) / D,
      (size.height * 0.58) / (H_S + H_O),
    );
    const axPx = 36 + (size.width - 2 * 36 - D * pxPerUnit) / 2;
    const units = (local - axPx) / pxPerUnit;
    return Math.max(0.02, Math.min(0.98, units / D));
  };

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height, touchAction: "none" }}
        className="block cursor-ew-resize select-none"
        onPointerDown={(e) => {
          (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
          setDragging(true);
          setYFrac(pointerToFrac(e.clientX));
        }}
        onPointerMove={(e) => {
          if (!dragging) return;
          setYFrac(pointerToFrac(e.clientX));
        }}
        onPointerUp={(e) => {
          setDragging(false);
          try {
            (e.target as HTMLCanvasElement).releasePointerCapture(e.pointerId);
          } catch {}
        }}
      />
      <div className="mt-2 flex items-center gap-3 px-2">
        <label className="text-sm text-[var(--color-fg-3)]">y / d</label>
        <input
          type="range"
          min={0.02}
          max={0.98}
          step={0.001}
          value={yFrac}
          onChange={(e) => setYFrac(parseFloat(e.target.value))}
          className="flex-1 accent-[#E4C27A]"
        />
        <span className="w-14 text-right font-mono text-sm text-[var(--color-fg-1)]">
          {yFrac.toFixed(2)}
        </span>
      </div>
      <p className="px-2 pt-2 text-xs text-[var(--color-fg-3)]">
        Every grey ghost path is a candidate Fermat never takes. The amber star
        marks the minimum of t(y) — and that crossing-point is exactly where
        sin θ₁ / v₁ = sin θ₂ / v₂, which is Snell's law written with speeds
        instead of indices.
      </p>
    </div>
  );
}
