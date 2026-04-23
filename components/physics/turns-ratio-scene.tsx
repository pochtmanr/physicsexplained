"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { voltageRatio } from "@/lib/physics/electromagnetism/transformers";

/**
 * FIG.31b — three transformers side by side, fed from the same 120 V
 * primary source. Turns ratios (left → right) are 0.5 (step-down 2:1),
 * 1.0 (isolation), 2.0 (step-up 1:2). The primary sine V_p is drawn once
 * at the top; each transformer's secondary trace V_s = n · V_p is drawn
 * on its own vertical scale so the amplitude ratios are visible at a
 * glance.
 *
 * No controls — this is a pedagogical side-by-side, the pair to the
 * interactive TransformerCouplingScene.
 */

const RATIO = 0.45;
const MAX_HEIGHT = 320;
const OMEGA = 2 * Math.PI * 0.45;
const VP_AMP = 120; // peak volts
const TRANS = [
  { n: 0.5, label: "2:1 step-down", Np: 8, Ns: 4 },
  { n: 1.0, label: "1:1 isolation", Np: 6, Ns: 6 },
  { n: 2.0, label: "1:2 step-up", Np: 4, Ns: 8 },
] as const;
const MAGENTA = "#FF6ADE";
const AMBER = "#FFD66B";
const CYAN = "rgba(120, 220, 255, 0.95)";

export function TurnsRatioScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 720, height: 320 });

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

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (t) => {
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

      const Vp = VP_AMP * Math.sin(OMEGA * t);

      const padX = 20;
      const padY = 20;
      const cellW = (width - padX * 2) / TRANS.length;

      // Draw three transformer cells
      TRANS.forEach((cfg, i) => {
        const cx = padX + cellW * i;
        const Vs = voltageRatio(cfg.n, Vp);
        drawCell(
          ctx,
          cx,
          padY,
          cellW,
          height - padY * 2,
          cfg,
          Vp,
          Vs,
          colors,
        );
      });

      // Global HUD
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        `common primary drive: V_p = ${Vp.toFixed(0)} V  (peak ${VP_AMP})`,
        width / 2,
        height - 4,
      );
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-2">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
    </div>
  );
}

function drawCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  cfg: { n: number; label: string; Np: number; Ns: number },
  Vp: number,
  Vs: number,
  colors: { fg1: string; fg2: string; fg3: string },
) {
  // Cell border hair
  ctx.strokeStyle = colors.fg3;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 4, y + 4, w - 8, h - 8);

  const coreL = x + w * 0.28;
  const coreR = x + w * 0.72;
  const coreT = y + 34;
  const coreB = y + h - 64;
  ctx.strokeStyle = "rgba(180, 165, 120, 0.85)";
  ctx.lineWidth = 10;
  ctx.strokeRect(coreL, coreT, coreR - coreL, coreB - coreT);

  // Flux arrows (minimal)
  ctx.strokeStyle = CYAN;
  ctx.fillStyle = CYAN;
  ctx.lineWidth = 1.2;
  const sign = Math.sign(Math.cos((Vp / VP_AMP) * (Math.PI / 2))) || 1;
  drawFluxArrow(
    ctx,
    (coreL + coreR) / 2 - 12 * sign,
    coreT - 4,
    (coreL + coreR) / 2 + 12 * sign,
    coreT - 4,
  );

  // Primary coil (left) — Np drawn turns
  drawCoil(ctx, coreL, coreT, coreB, cfg.Np, "left", "#FF6ADE");
  // Secondary coil (right) — Ns drawn turns
  drawCoil(ctx, coreR, coreT, coreB, cfg.Ns, "right", "#FFD66B");

  // Amplitude bars — visual ratio cue
  const barsY = coreB + 14;
  const barsH = 22;
  const maxSpan = Math.max(VP_AMP, Math.abs(Vs), VP_AMP * cfg.n);
  const primaryBarW = (Math.abs(Vp) / maxSpan) * ((coreR - coreL) * 0.42);
  const secondaryBarW = (Math.abs(Vs) / maxSpan) * ((coreR - coreL) * 0.42);
  ctx.fillStyle = Vp >= 0 ? "rgba(255,106,222,0.75)" : "rgba(255,106,222,0.4)";
  ctx.fillRect(coreL - 4, barsY, -primaryBarW, barsH);
  ctx.fillStyle = Vs >= 0 ? "rgba(255,214,107,0.8)" : "rgba(255,214,107,0.45)";
  ctx.fillRect(coreR + 4, barsY, secondaryBarW, barsH);

  // Labels
  ctx.font = "11px monospace";
  ctx.fillStyle = colors.fg1;
  ctx.textAlign = "center";
  ctx.fillText(cfg.label, x + w / 2, y + 16);
  ctx.font = "10px monospace";
  ctx.fillStyle = colors.fg2;
  ctx.fillText(`n = ${cfg.n.toFixed(2)}`, x + w / 2, y + 28);

  // Turn counts
  ctx.fillStyle = "#FF6ADE";
  ctx.textAlign = "right";
  ctx.fillText(`N_p = ${cfg.Np}`, coreL - 6, coreT - 4);
  ctx.fillStyle = "#FFD66B";
  ctx.textAlign = "left";
  ctx.fillText(`N_s = ${cfg.Ns}`, coreR + 6, coreT - 4);

  // Live voltage readouts
  ctx.textAlign = "center";
  ctx.font = "10px monospace";
  ctx.fillStyle = "#FF6ADE";
  ctx.fillText(`V_p = ${Vp.toFixed(0)} V`, coreL - 4 - primaryBarW / 2, barsY + barsH + 12);
  ctx.fillStyle = "#FFD66B";
  ctx.fillText(`V_s = ${Vs.toFixed(0)} V`, coreR + 4 + secondaryBarW / 2, barsY + barsH + 12);
}

function drawCoil(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  topY: number,
  botY: number,
  turns: number,
  side: "left" | "right",
  color: string,
) {
  const r = 6;
  const span = botY - topY;
  const step = span / (turns + 1);
  const offset = side === "left" ? -1 : 1;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  for (let i = 0; i < turns; i++) {
    const cy = topY + (i + 1) * step;
    ctx.beginPath();
    ctx.arc(centerX, cy, r, -Math.PI / 2, Math.PI / 2, offset > 0);
    ctx.stroke();
  }
}

function drawFluxArrow(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
) {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const ah = 4;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - ah * ux - ah * 0.6 * -uy, y1 - ah * uy - ah * 0.6 * ux);
  ctx.lineTo(x1 - ah * ux + ah * 0.6 * -uy, y1 - ah * uy + ah * 0.6 * ux);
  ctx.closePath();
  ctx.fill();
}
