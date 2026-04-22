"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.78;
const MAX_HEIGHT = 460;

/**
 * The visual punchline of the D-field topic. Two horizontal panels show the
 * exact same parallel-plate setup with a dielectric slab in the middle third.
 *
 *   Top panel (E): cyan vector grid. Inside the dielectric the arrows are
 *   visibly shorter — E drops by 1/κ because the bound surface charges on
 *   the slab faces partially cancel the plate field.
 *
 *   Bottom panel (D): amber vector grid. The arrows are uniform across the
 *   whole gap. D = ε₀E + P, and the κ-fold reduction in E is exactly
 *   compensated by the polarisation P inside the slab. D never notices the
 *   slab at all — it only sees the free charge on the plates.
 *
 * Slider for κ.
 */
export function DVsEDifferenceScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [kappa, setKappa] = useState(4);
  const [size, setSize] = useState({ width: 600, height: 460 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          setSize({ width: w, height: Math.min(w * RATIO, MAX_HEIGHT) });
        }
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: () => {
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

      const padX = 60;
      const padTopE = 30;
      const labelGap = 24;
      const panelH = (height - padTopE - labelGap - 40) / 2;
      const panelW = width - padX * 2;
      const xL = padX;
      const xR = padX + panelW;

      // Slab takes the centre third
      const slabL = xL + panelW * 0.34;
      const slabR = xL + panelW * 0.66;

      // ───────── E panel (top) ─────────
      const yET = padTopE + 22;
      const yEB = yET + panelH;
      drawPanel(ctx, {
        label: "E — force per unit charge (the physical thing)",
        labelColor: "#6FB8C6",
        xL,
        xR,
        yT: yET,
        yB: yEB,
        slabL,
        slabR,
        kappa,
        // E is reduced inside the slab by 1/κ
        scaleInside: 1 / kappa,
        scaleOutside: 1,
        arrowColor: "#6FB8C6",
        colors,
      });

      // ───────── D panel (bottom) ─────────
      const yDT = yEB + labelGap + 22;
      const yDB = yDT + panelH;
      drawPanel(ctx, {
        label: "D — bookkeeping field (only sees free charge)",
        labelColor: "#FFD66B",
        xL,
        xR,
        yT: yDT,
        yB: yDB,
        slabL,
        slabR,
        kappa,
        // D is the same magnitude inside and outside
        scaleInside: 1,
        scaleOutside: 1,
        arrowColor: "#FFD66B",
        colors,
      });

      // Footer
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        "Same plates · same charge · same slab — E shrinks, D doesn't",
        width / 2,
        height - 14,
      );
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-2 flex items-center gap-3 px-2 font-mono text-xs">
        <label className="w-8 text-[var(--color-fg-3)]">κ</label>
        <input
          type="range"
          min={1}
          max={10}
          step={0.1}
          value={kappa}
          onChange={(e) => setKappa(parseFloat(e.target.value))}
          className="flex-1 accent-[#FF6ADE]"
        />
        <span className="w-16 text-right text-[var(--color-fg-1)]">
          {kappa.toFixed(1)}
        </span>
      </div>
    </div>
  );
}

interface PanelOpts {
  label: string;
  labelColor: string;
  xL: number;
  xR: number;
  yT: number;
  yB: number;
  slabL: number;
  slabR: number;
  kappa: number;
  scaleInside: number;
  scaleOutside: number;
  arrowColor: string;
  colors: { fg1: string; fg2: string; fg3: string };
}

function drawPanel(ctx: CanvasRenderingContext2D, opts: PanelOpts) {
  const {
    label,
    labelColor,
    xL,
    xR,
    yT,
    yB,
    slabL,
    slabR,
    kappa,
    scaleInside,
    scaleOutside,
    arrowColor,
    colors,
  } = opts;

  // Plates (top + magenta, bottom − cyan)
  drawPlate(ctx, xL, xR, yT, "+");
  drawPlate(ctx, xL, xR, yB, "−");

  // Dielectric tint
  const tintAlpha = Math.min(0.22, 0.04 + 0.03 * (kappa - 1));
  ctx.fillStyle = `rgba(255, 106, 222, ${tintAlpha.toFixed(3)})`;
  ctx.fillRect(slabL, yT + 3, slabR - slabL, yB - yT - 6);

  // Slab outline
  ctx.strokeStyle = colors.fg3;
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.strokeRect(slabL, yT + 3, slabR - slabL, yB - yT - 6);
  ctx.setLineDash([]);

  // Vector grid: 12 columns, 3 rows
  const cols = 12;
  const rows = 3;
  const colW = (xR - xL) / (cols + 1);
  const rowH = (yB - yT) / (rows + 1);
  const baseLen = Math.min(rowH * 0.7, 28);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ax = xL + (c + 1) * colW;
      const ay = yT + (r + 1) * rowH;
      const inside = ax >= slabL && ax <= slabR;
      const scale = inside ? scaleInside : scaleOutside;
      const len = baseLen * scale;
      // Arrow points downward (E goes from + plate to − plate)
      const alpha = Math.min(0.95, 0.35 + 0.5 * scale);
      ctx.strokeStyle = withAlpha(arrowColor, alpha);
      ctx.fillStyle = withAlpha(arrowColor, alpha);
      ctx.lineWidth = 1.4;
      const yStart = ay - len / 2;
      const yEnd = ay + len / 2;
      ctx.beginPath();
      ctx.moveTo(ax, yStart);
      ctx.lineTo(ax, yEnd);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(ax, yEnd);
      ctx.lineTo(ax - 4, yEnd - 6);
      ctx.lineTo(ax + 4, yEnd - 6);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Label above the panel
  ctx.fillStyle = labelColor;
  ctx.font = "bold 12px monospace";
  ctx.textAlign = "left";
  ctx.fillText(label, xL, yT - 8);

  // Mini caption inside slab area
  ctx.fillStyle = colors.fg2;
  ctx.font = "10px monospace";
  ctx.textAlign = "center";
  ctx.fillText(
    scaleInside === 1 ? "uniform across the slab" : `× 1/κ inside`,
    (slabL + slabR) / 2,
    yB + 14,
  );
}

function drawPlate(
  ctx: CanvasRenderingContext2D,
  xL: number,
  xR: number,
  y: number,
  sign: "+" | "−",
) {
  const isPos = sign === "+";
  ctx.fillStyle = isPos ? "#FF6ADE" : "#6FB8C6";
  ctx.fillRect(xL, y - 3, xR - xL, 6);
  const w = xR - xL;
  const n = Math.max(6, Math.floor(w / 28));
  const step = w / (n + 1);
  ctx.fillStyle = "#0B1018";
  ctx.font = "bold 10px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let i = 1; i <= n; i++) ctx.fillText(sign, xL + i * step, y);
  ctx.textBaseline = "alphabetic";
}

function withAlpha(hex: string, alpha: number): string {
  // hex like "#FFD66B" or "#6FB8C6"
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
}
