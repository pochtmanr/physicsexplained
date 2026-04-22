"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

/**
 * FIG.21b — flux change by area change.
 *
 * A rectangular wire loop with a conducting bar sliding along two
 * horizontal rails. The whole apparatus sits in a uniform B pointing
 * *into the page* (drawn as a grid of crosses). As the bar slides to
 * the right, the loop's enclosed area grows, Φ = B·A grows with it,
 * and an EMF is induced. Lenz: the induced current circulates so as
 * to oppose the *increase* in into-the-page flux — i.e. counter-
 * clockwise (viewed from the reader), producing an out-of-page B
 * inside the loop that cancels part of the growing flux.
 *
 * Slide the bar left and the sense of the induced current reverses.
 * Hold it still and the current dies.
 *
 * Colour key:
 *   cyan (into-page B)          — rgba(120,220,255,…)
 *   amber `#FFD66B`             — velocity cue / axes badge
 *   rgba(120,255,170,0.95)      — induced current (green-cyan)
 *   `#FF6ADE` magenta           — +x accent / rail frame
 */

const MAGENTA = "#FF6ADE";
const AMBER = "#FFD66B";
const INDUCED = "rgba(120, 255, 170, 0.95)";
const B_INTO = "rgba(120, 220, 255, 0.6)";

export function FluxChangeAreaScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 680, height: 380 });
  const [B, setB] = useState(0.5); // tesla
  const [v, setV] = useState(0.4); // m/s (signed); positive → right

  const stateRef = useRef({
    x: 0.35, // bar normalised position (0..1 along the rail)
    prevArea: 0,
    flux: 0,
    dFlux: 0,
  });

  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          setSize({ width: w, height: Math.min(Math.max(w * 0.55, 300), 420) });
        }
      }
    });
    ro.observe(c);
    return () => ro.disconnect();
  }, []);

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (_t, dt) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const { width, height } = size;
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }
      ctx.clearRect(0, 0, width, height);

      // Rails
      const railLeftX = width * 0.1;
      const railRightX = width * 0.92;
      const railSpan = railRightX - railLeftX;
      const railTop = height * 0.28;
      const railBot = height * 0.72;
      const railHeight = railBot - railTop;

      // Metres-per-pixel scale (so HUD reads in real units)
      const metresPerPx = 0.005; // → railSpan ≈ 3 m, railHeight ≈ 1.5 m

      // Update bar position from v and dt
      const s = stateRef.current;
      // convert v (m/s) to normalised displacement/s
      const dNorm = (v / (railSpan * metresPerPx)) * dt;
      s.x = Math.max(0.05, Math.min(0.95, s.x + dNorm));

      // Loop spans from the left rail end to the bar position
      const barX = railLeftX + s.x * railSpan;
      const loopW = barX - railLeftX;
      const areaPx = loopW * railHeight;
      const area = areaPx * metresPerPx * metresPerPx;
      const phi = B * area;
      s.dFlux = dt > 0 ? (phi - stateRef.current.flux) / dt : 0;
      s.flux = phi;
      // Manual recompute via prevArea tracking already covered by s.flux update
      s.prevArea = area;

      const emf = -s.dFlux;

      // --- Draw into-page B grid ---
      ctx.fillStyle = B_INTO;
      ctx.strokeStyle = B_INTO;
      ctx.lineWidth = 1.2;
      const gridStep = 32;
      for (let gx = railLeftX + 18; gx < railRightX; gx += gridStep) {
        for (let gy = railTop + 20; gy < railBot; gy += gridStep) {
          // ⊗ — circle with X in it
          ctx.beginPath();
          ctx.arc(gx, gy, 4, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(gx - 3, gy - 3);
          ctx.lineTo(gx + 3, gy + 3);
          ctx.moveTo(gx - 3, gy + 3);
          ctx.lineTo(gx + 3, gy - 3);
          ctx.stroke();
        }
      }

      // --- Draw rails + fixed left end (return wire) ---
      ctx.strokeStyle = colors.fg1;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(railLeftX, railTop);
      ctx.lineTo(railRightX, railTop);
      ctx.moveTo(railLeftX, railBot);
      ctx.lineTo(railRightX, railBot);
      // Left closing wire with a small resistor/galv indicator
      ctx.moveTo(railLeftX, railTop);
      ctx.lineTo(railLeftX, railBot);
      ctx.stroke();

      // Resistor bumps on the left closing wire
      ctx.strokeStyle = colors.fg2;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const midY = (railTop + railBot) / 2;
      ctx.moveTo(railLeftX, midY - 30);
      for (let k = 0; k < 6; k++) {
        const y = midY - 30 + k * 10;
        ctx.lineTo(railLeftX + (k % 2 === 0 ? -6 : 6), y + 5);
      }
      ctx.lineTo(railLeftX, midY + 30);
      ctx.stroke();

      // --- Induced-current arrows around the loop ---
      // sign: if dΦ/dt > 0 (flux INTO page growing), induced current is CCW
      // (from reader's perspective: up the bar, left along the top rail,
      // down the left wire, right along the bottom rail). If the bar
      // moves right (v>0, area grows), flux grows ⇒ induced current CCW.
      const indSign = Math.sign(s.dFlux);
      const indMag = Math.min(1, Math.abs(s.dFlux) * 4);
      if (indMag > 0.02) {
        ctx.strokeStyle = INDUCED;
        ctx.globalAlpha = 0.35 + 0.6 * indMag;
        ctx.lineWidth = 2;
        // bar vertical: if indSign>0 then current goes UP the bar (toward top rail)
        drawArrow(
          ctx,
          barX,
          (railTop + railBot) / 2,
          0,
          indSign > 0 ? -1 : 1,
          22,
          INDUCED,
        );
        // top rail: if indSign>0 current goes LEFT
        drawArrow(
          ctx,
          (railLeftX + barX) / 2,
          railTop,
          indSign > 0 ? -1 : 1,
          0,
          22,
          INDUCED,
        );
        // left return wire: down if indSign>0
        drawArrow(
          ctx,
          railLeftX,
          (railTop + railBot) / 2 + 50,
          0,
          indSign > 0 ? 1 : -1,
          22,
          INDUCED,
        );
        // bottom rail: right if indSign>0
        drawArrow(
          ctx,
          (railLeftX + barX) / 2,
          railBot,
          indSign > 0 ? 1 : -1,
          0,
          22,
          INDUCED,
        );
        ctx.globalAlpha = 1;
      }

      // --- Sliding bar ---
      ctx.strokeStyle = MAGENTA;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(barX, railTop - 6);
      ctx.lineTo(barX, railBot + 6);
      ctx.stroke();

      // Velocity arrow above the bar
      if (Math.abs(v) > 0.01) {
        const vDir = Math.sign(v);
        drawArrow(ctx, barX, railTop - 24, vDir, 0, 30, AMBER);
        ctx.fillStyle = AMBER;
        ctx.font = "11px monospace";
        ctx.textAlign = "center";
        ctx.fillText("v", barX + vDir * 22, railTop - 30);
      }

      // --- HUD ---
      ctx.textAlign = "left";
      const pad = 12;
      ctx.font = "11px monospace";
      ctx.fillStyle = colors.fg2;
      ctx.fillText(`L = ${(railHeight * metresPerPx).toFixed(2)} m`, pad, pad + 14);
      ctx.fillText(`x(t) = ${(loopW * metresPerPx).toFixed(2)} m`, pad, pad + 30);
      ctx.fillStyle = colors.fg2;
      ctx.fillText("Φ = B·A", pad, pad + 54);
      ctx.fillStyle = B_INTO;
      ctx.fillText(`= ${phi.toExponential(3)} Wb`, pad, pad + 70);
      ctx.fillStyle = colors.fg2;
      ctx.fillText("dΦ/dt", pad, pad + 94);
      ctx.fillStyle = AMBER;
      ctx.fillText(`= ${s.dFlux.toExponential(3)} Wb/s`, pad, pad + 110);
      ctx.fillStyle = colors.fg2;
      ctx.fillText("EMF = −dΦ/dt", pad, pad + 134);
      ctx.fillStyle = INDUCED;
      ctx.fillText(`= ${emf.toFixed(3)} V`, pad, pad + 150);

      // Right-hand-rule axes badge (bottom-left)
      drawRHRBadge(ctx, 24, height - 26, colors.fg2);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-2 flex flex-wrap items-center gap-4 px-2 font-mono text-xs text-[var(--color-fg-2)]">
        <label className="flex items-center gap-2">
          <span>B = {B.toFixed(2)} T</span>
          <input
            type="range"
            min={0}
            max={2}
            step={0.05}
            value={B}
            onChange={(e) => setB(Number(e.target.value))}
            className="accent-[rgba(120,220,255,0.9)]"
          />
        </label>
        <label className="flex items-center gap-2">
          <span>v = {v.toFixed(2)} m/s</span>
          <input
            type="range"
            min={-1}
            max={1}
            step={0.05}
            value={v}
            onChange={(e) => setV(Number(e.target.value))}
            className="accent-[#FFD66B]"
          />
        </label>
        <div className="ml-auto text-[10px] text-[var(--color-fg-3)]">
          ⊗ = B into page; green arrows = induced current
        </div>
      </div>
    </div>
  );
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tx: number,
  ty: number,
  len: number,
  color: string,
) {
  const tipX = x + tx * len * 0.5;
  const tipY = y + ty * len * 0.5;
  const tailX = x - tx * len * 0.5;
  const tailY = y - ty * len * 0.5;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(tailX, tailY);
  ctx.lineTo(tipX, tipY);
  ctx.stroke();
  const ang = Math.atan2(ty, tx);
  const head = 6;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(
    tipX - head * Math.cos(ang - Math.PI / 6),
    tipY - head * Math.sin(ang - Math.PI / 6),
  );
  ctx.lineTo(
    tipX - head * Math.cos(ang + Math.PI / 6),
    tipY - head * Math.sin(ang + Math.PI / 6),
  );
  ctx.closePath();
  ctx.fill();
}

function drawRHRBadge(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  subdued: string,
) {
  ctx.save();
  ctx.strokeStyle = subdued;
  ctx.lineWidth = 1;
  drawArrow(ctx, cx + 8, cy, 1, 0, 16, subdued);
  drawArrow(ctx, cx, cy - 8, 0, -1, 16, subdued);
  ctx.beginPath();
  ctx.arc(cx + 3, cy - 3, 9, 0.2, Math.PI * 1.6);
  ctx.stroke();
  ctx.font = "9px monospace";
  ctx.fillStyle = subdued;
  ctx.textAlign = "left";
  ctx.fillText("RHR", cx + 20, cy - 14);
  ctx.restore();
}
