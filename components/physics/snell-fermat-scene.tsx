"use client";

import { useEffect, useRef, useState } from "react";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  fermatTime,
  fermatOptimalX,
  fermatAngles,
} from "@/lib/physics/least-action";

const RATIO = 0.72;
const MAX_HEIGHT = 460;

// Fixed geometry (in arbitrary scene-units): A above, B below.
const H1 = 3; // perpendicular distance from A to the interface
const H2 = 3; // perpendicular distance from B to the interface
const D = 10; // horizontal separation of A and B

// Speeds (normalised: v_air = 1). v_water corresponds to n ≈ 1.33.
const V1 = 1.0;
const V2 = 1 / 1.33;

/**
 * FERMAT'S PRINCIPLE AS A FEEL.
 *
 * A light ray must get from A (in air) to B (in water). The user drags
 * the crossing point along the interface. The scene colours the two
 * segments, reads off total travel time, and traces out t(x) on a
 * graph below — a convex curve with a single minimum. The minimum
 * sits exactly where Snell's law is satisfied.
 */
export function SnellFermatScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 640, height: 460 });
  const [xFrac, setXFrac] = useState(0.5); // user's crossing position, 0..1
  const [dragging, setDragging] = useState(false);

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

  // Derived quantities in physical scene units.
  const xStar = fermatOptimalX(D, H1, H2, V1, V2);
  const x = xFrac * D;
  const tHere = fermatTime(x, D, H1, H2, V1, V2);
  const tStar = fermatTime(xStar, D, H1, H2, V1, V2);
  const { sinTheta1, sinTheta2 } = fermatAngles(x, D, H1, H2);
  // Snell's law: n1 sin θ1 = n2 sin θ2.  With n_i = c/v_i, this is
  // sin θ1 / v1 = sin θ2 / v2.
  const snellLHS = sinTheta1 / V1;
  const snellRHS = sinTheta2 / V2;

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

    // ---------------------------------------------------------------
    // Layout: top 60% is the ray diagram; bottom 40% is the t(x) plot.
    // ---------------------------------------------------------------
    const rayTop = 16;
    const rayHeight = height * 0.58;
    const rayBottom = rayTop + rayHeight;
    const plotTop = rayBottom + 28;
    const plotBottom = height - 26;

    const padX = 32;
    const sceneLeft = padX;
    const sceneRight = width - padX;
    const sceneW = sceneRight - sceneLeft;

    // Map scene-units → pixels. Interface at y_phys = 0 sits centrally.
    const pxPerUnit = Math.min(sceneW / D, rayHeight / (H1 + H2));
    const interfaceY = rayTop + H1 * pxPerUnit;
    const ax = sceneLeft + (sceneW - D * pxPerUnit) / 2;
    const aY = interfaceY - H1 * pxPerUnit;
    const bX = ax + D * pxPerUnit;
    const bY = interfaceY + H2 * pxPerUnit;
    const crossX = ax + x * pxPerUnit;
    const starX = ax + xStar * pxPerUnit;

    // -- Air region: subtle gradient ----------------------------------
    const airGrad = ctx.createLinearGradient(0, rayTop, 0, interfaceY);
    airGrad.addColorStop(0, "rgba(111, 184, 198, 0.02)");
    airGrad.addColorStop(1, "rgba(111, 184, 198, 0.08)");
    ctx.fillStyle = airGrad;
    ctx.fillRect(sceneLeft, rayTop, sceneW, interfaceY - rayTop);

    // -- Water region ------------------------------------------------
    const waterGrad = ctx.createLinearGradient(0, interfaceY, 0, rayBottom);
    waterGrad.addColorStop(0, "rgba(111, 184, 198, 0.22)");
    waterGrad.addColorStop(1, "rgba(111, 184, 198, 0.32)");
    ctx.fillStyle = waterGrad;
    ctx.fillRect(sceneLeft, interfaceY, sceneW, rayBottom - interfaceY);

    // Interface line
    ctx.strokeStyle = "rgba(111, 184, 198, 0.7)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sceneLeft, interfaceY);
    ctx.lineTo(sceneRight, interfaceY);
    ctx.stroke();

    // Labels
    ctx.fillStyle = colors.fg2;
    ctx.font = "11px monospace";
    ctx.textAlign = "left";
    ctx.fillText("n₁  ·  v = c", sceneLeft + 4, rayTop + 14);
    ctx.fillText("n₂  ·  v = c / 1.33", sceneLeft + 4, rayBottom - 6);

    // Normal at the crossing (dashed)
    ctx.strokeStyle = colors.fg3;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(crossX, interfaceY - 34);
    ctx.lineTo(crossX, interfaceY + 34);
    ctx.stroke();
    ctx.setLineDash([]);

    // -- Optimal ray (ghost) -----------------------------------------
    ctx.strokeStyle = colors.fg3;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(ax, aY);
    ctx.lineTo(starX, interfaceY);
    ctx.lineTo(bX, bY);
    ctx.stroke();
    ctx.setLineDash([]);

    // -- User's candidate ray (live) ---------------------------------
    // Segment 1: through air (cyan)
    ctx.strokeStyle = "#6FB8C6";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ax, aY);
    ctx.lineTo(crossX, interfaceY);
    ctx.stroke();
    // Segment 2: through water (magenta)
    ctx.strokeStyle = "#FF6ADE";
    ctx.beginPath();
    ctx.moveTo(crossX, interfaceY);
    ctx.lineTo(bX, bY);
    ctx.stroke();

    // Endpoint markers
    ctx.fillStyle = colors.fg0;
    ctx.textAlign = "center";
    ctx.font = "12px monospace";
    ctx.beginPath();
    ctx.arc(ax, aY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText("A", ax, aY - 10);
    ctx.beginPath();
    ctx.arc(bX, bY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText("B", bX, bY + 18);

    // Crossing point (draggable)
    ctx.fillStyle = dragging ? "#FFD66A" : "#E4C27A";
    ctx.shadowColor = "#E4C27A";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(crossX, interfaceY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // ---------------------------------------------------------------
    // t(x) curve below
    // ---------------------------------------------------------------
    const plotLeft = ax;
    const plotRight = bX;
    const plotW = plotRight - plotLeft;
    const plotH = plotBottom - plotTop;

    // Sample curve and find vertical extent for autoscaling.
    const N = 140;
    const ts: number[] = new Array(N + 1);
    let tMin = Infinity;
    let tMax = -Infinity;
    for (let i = 0; i <= N; i++) {
      const xi = (D * i) / N;
      const ti = fermatTime(xi, D, H1, H2, V1, V2);
      ts[i] = ti;
      if (ti < tMin) tMin = ti;
      if (ti > tMax) tMax = ti;
    }
    const tPad = (tMax - tMin) * 0.1 + 1e-6;
    const tLo = tMin - tPad;
    const tHi = tMax + tPad;

    // Axes box
    ctx.strokeStyle = colors.fg3;
    ctx.lineWidth = 1;
    ctx.strokeRect(plotLeft, plotTop, plotW, plotH);

    // Minimum horizontal rule
    const yOfT = (ti: number) =>
      plotTop + plotH * (1 - (ti - tLo) / (tHi - tLo));
    ctx.strokeStyle = "rgba(228, 194, 122, 0.35)";
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(plotLeft, yOfT(tStar));
    ctx.lineTo(plotRight, yOfT(tStar));
    ctx.stroke();
    ctx.setLineDash([]);

    // Curve
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

    // Star marker at the minimum
    const starY = yOfT(tStar);
    ctx.fillStyle = "#E4C27A";
    ctx.beginPath();
    ctx.arc(starX, starY, 4, 0, Math.PI * 2);
    ctx.fill();

    // Live cursor
    const liveX = ax + x * pxPerUnit;
    const liveY = yOfT(tHere);
    ctx.strokeStyle = "#FF6ADE";
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.moveTo(liveX, plotTop);
    ctx.lineTo(liveX, plotBottom);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#FF6ADE";
    ctx.beginPath();
    ctx.arc(liveX, liveY, 4, 0, Math.PI * 2);
    ctx.fill();

    // Plot axis labels
    ctx.fillStyle = colors.fg2;
    ctx.font = "10px monospace";
    ctx.textAlign = "left";
    ctx.fillText("t(x) — total travel time", plotLeft + 4, plotTop + 12);
    ctx.textAlign = "right";
    ctx.fillText("x = d", plotRight - 2, plotBottom - 4);
    ctx.textAlign = "left";
    ctx.fillText("x = 0", plotLeft + 2, plotBottom - 4);

    // Snell readout inside the main scene
    const readout = [
      `t(x)      = ${tHere.toFixed(3)}`,
      `t_min    = ${tStar.toFixed(3)}`,
      `sinθ₁/v₁ = ${snellLHS.toFixed(3)}`,
      `sinθ₂/v₂ = ${snellRHS.toFixed(3)}`,
    ];
    ctx.fillStyle = colors.fg1;
    ctx.font = "11px monospace";
    ctx.textAlign = "right";
    const rx = sceneRight - 6;
    let ry = rayTop + 14;
    for (const line of readout) {
      ctx.fillText(line, rx, ry);
      ry += 14;
    }
  }, [size, xFrac, dragging, colors, x, xStar, tHere, tStar, snellLHS, snellRHS, sinTheta1, sinTheta2]);

  // Pointer handling — drag the crossing along the interface.
  const pointerToFrac = (clientX: number) => {
    const c = canvasRef.current;
    if (!c) return xFrac;
    const rect = c.getBoundingClientRect();
    const local = clientX - rect.left;
    const pxPerUnit = Math.min(
      (size.width - 2 * 32) / D,
      (size.height * 0.58) / (H1 + H2),
    );
    const axPx = 32 + (size.width - 2 * 32 - D * pxPerUnit) / 2;
    const xUnits = (local - axPx) / pxPerUnit;
    return Math.max(0.02, Math.min(0.98, xUnits / D));
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
          setXFrac(pointerToFrac(e.clientX));
        }}
        onPointerMove={(e) => {
          if (!dragging) return;
          setXFrac(pointerToFrac(e.clientX));
        }}
        onPointerUp={(e) => {
          setDragging(false);
          try {
            (e.target as HTMLCanvasElement).releasePointerCapture(e.pointerId);
          } catch {}
        }}
      />
      <div className="mt-2 flex items-center gap-3 px-2">
        <label className="text-sm text-[var(--color-fg-3)]">
          x / d
        </label>
        <input
          type="range"
          min={0.02}
          max={0.98}
          step={0.001}
          value={xFrac}
          onChange={(e) => setXFrac(parseFloat(e.target.value))}
          className="flex-1 accent-[#E4C27A]"
        />
        <span className="w-14 text-right font-mono text-sm text-[var(--color-fg-1)]">
          {xFrac.toFixed(2)}
        </span>
      </div>
      <p className="px-2 pt-2 text-xs text-[var(--color-fg-3)]">
        Drag the amber dot along the interface — or use the slider. The dashed
        ghost ray is Fermat's minimum. Your live ray (cyan + magenta) matches
        it exactly when sin θ₁ / v₁ = sin θ₂ / v₂ — that is, when Snell's law
        holds.
      </p>
    </div>
  );
}
