"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

/**
 * FIG.58a — Boosted charge counting.
 *
 * Two side-by-side panels of the same parallel-plate capacitor: lab frame
 * on the left, boosted frame on the right. The boost slider β controls
 * the right panel only. Plate length contracts to L₀/γ as β grows; the
 * dot count on each plate is unchanged. The HUD readout shows
 *
 *   Q_lab     = +Ne
 *   Q_boosted = +Ne
 *   Δ         = 0
 *
 * across all β. Charge is a Lorentz scalar; the dots are dots, you can
 * count them either way.
 *
 * Palette:
 *   magenta — positive (+) dots on the upper plate
 *   cyan    — negative (−) dots on the lower plate
 *   amber   — outline of the boosted-frame ghost
 *   pale    — gridlines, plate slabs
 */

const RATIO = 0.55;
const MAX_HEIGHT = 360;
const N_DOTS = 12;

export function BoostedChargeCountingScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();

  const [beta, setBeta] = useState(0.6);
  const betaRef = useRef(beta);
  useEffect(() => {
    betaRef.current = beta;
  }, [beta]);

  const [size, setSize] = useState({ width: 720, height: 360 });
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

      const b = betaRef.current;
      const gamma = 1 / Math.sqrt(1 - b * b);

      // panel halves
      const halfW = width / 2;

      // ── divider line ──
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(halfW, 18);
      ctx.lineTo(halfW, height - 30);
      ctx.stroke();

      // panel headers
      ctx.fillStyle = colors.fg1;
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillText("LAB FRAME", halfW * 0.5, 18);
      ctx.fillText("BOOSTED FRAME", halfW * 1.5, 18);

      // plate-length: lab uses full L0; boosted contracts to L0/γ
      const L0 = halfW * 0.74;
      const Lboost = L0 / gamma;
      const cyLab = height * 0.5;
      const cyBoost = height * 0.5;
      const xLab = halfW * 0.5;
      const xBoost = halfW * 1.5;
      const plateGap = Math.min(110, height * 0.34);

      drawCapacitor(ctx, xLab, cyLab, L0, plateGap, "lab", colors);
      drawCapacitor(ctx, xBoost, cyBoost, Lboost, plateGap, "boost", colors);

      // ── ghost outline of un-contracted plates in boosted frame for ref ──
      ctx.strokeStyle = "rgba(150, 200, 255, 0.18)";
      ctx.setLineDash([3, 4]);
      ctx.lineWidth = 1;
      ctx.strokeRect(xBoost - L0 / 2, cyBoost - plateGap / 2 - 6, L0, 12);
      ctx.strokeRect(xBoost - L0 / 2, cyBoost + plateGap / 2 - 6, L0, 12);
      ctx.setLineDash([]);

      // ── HUD bottom strip ──
      const Q = N_DOTS; // arbitrary unit "Ne"
      const fmt = (n: number) => `+${n}Ne`;
      const fmtNeg = (n: number) => `−${n}Ne`;

      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillStyle = colors.fg2;
      ctx.fillText(`L = L₀`, xLab - L0 * 0.5, cyLab + plateGap / 2 + 28);
      ctx.fillText(
        `L = L₀/γ = ${(1 / gamma).toFixed(3)}·L₀`,
        xBoost - Lboost * 0.5,
        cyBoost + plateGap / 2 + 28,
      );

      ctx.fillStyle = "#FF6ADE";
      ctx.fillText(`Q⁺ = ${fmt(Q)}`, xLab - L0 * 0.5, cyLab - plateGap / 2 - 18);
      ctx.fillText(
        `Q⁺ = ${fmt(Q)}`,
        xBoost - Lboost * 0.5,
        cyBoost - plateGap / 2 - 18,
      );

      ctx.fillStyle = "#6FB8C6";
      ctx.fillText(
        `Q⁻ = ${fmtNeg(Q)}`,
        xLab - L0 * 0.5,
        cyLab + plateGap / 2 + 14,
      );
      ctx.fillText(
        `Q⁻ = ${fmtNeg(Q)}`,
        xBoost - Lboost * 0.5,
        cyBoost + plateGap / 2 + 14,
      );

      // delta
      ctx.fillStyle = colors.fg1;
      ctx.textAlign = "center";
      ctx.fillText(
        `Δ = Q_boost − Q_lab = 0`,
        width / 2,
        height - 12,
      );

      // top-right hint
      ctx.fillStyle = colors.fg2;
      ctx.textAlign = "right";
      ctx.font = "10px monospace";
      ctx.fillText(
        `β = ${b.toFixed(2)}    γ = ${gamma.toFixed(3)}`,
        width - 10,
        height - 12,
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
      <div className="mt-2 flex items-center gap-3 px-2">
        <label className="text-sm text-[var(--color-fg-3)]">β</label>
        <input
          type="range"
          min={0}
          max={0.9}
          step={0.01}
          value={beta}
          onChange={(e) => setBeta(parseFloat(e.target.value))}
          className="flex-1 accent-[#FF6ADE]"
        />
        <span className="w-20 text-right text-sm font-mono text-[var(--color-fg-1)]">
          β = {beta.toFixed(2)}
        </span>
      </div>
      <div className="mt-1 px-2 text-xs text-[var(--color-fg-3)]">
        Plate length L′ = L₀/γ contracts in the boosted frame. The dot count
        on each plate stays at N. Q is invariant; geometry is not.
      </div>
    </div>
  );
}

function drawCapacitor(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  L: number,
  gap: number,
  variant: "lab" | "boost",
  colors: { fg1: string; fg2: string; fg3: string },
) {
  const plateThickness = 10;
  const xL = cx - L / 2;
  const xR = cx + L / 2;
  const yTop = cy - gap / 2;
  const yBot = cy + gap / 2;

  // plates (slabs)
  ctx.fillStyle =
    variant === "lab" ? "rgba(255, 106, 222, 0.16)" : "rgba(255, 106, 222, 0.20)";
  ctx.fillRect(xL, yTop - plateThickness / 2, L, plateThickness);
  ctx.fillStyle =
    variant === "lab" ? "rgba(111, 184, 198, 0.16)" : "rgba(111, 184, 198, 0.20)";
  ctx.fillRect(xL, yBot - plateThickness / 2, L, plateThickness);

  ctx.strokeStyle = colors.fg3;
  ctx.lineWidth = 1;
  ctx.strokeRect(xL, yTop - plateThickness / 2, L, plateThickness);
  ctx.strokeRect(xL, yBot - plateThickness / 2, L, plateThickness);

  // E-field hairlines between plates (5 thin verticals)
  ctx.strokeStyle = "rgba(180, 200, 220, 0.20)";
  ctx.setLineDash([2, 4]);
  for (let i = 1; i <= 4; i++) {
    const x = xL + (i / 5) * L;
    ctx.beginPath();
    ctx.moveTo(x, yTop + plateThickness / 2);
    ctx.lineTo(x, yBot - plateThickness / 2);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // dots — N evenly spaced on each plate
  const margin = Math.max(8, L * 0.06);
  const dotRange = L - 2 * margin;
  const r = 3;
  for (let i = 0; i < N_DOTS; i++) {
    const u = i / (N_DOTS - 1);
    const x = xL + margin + u * dotRange;
    // top: + magenta
    ctx.fillStyle = "#FF6ADE";
    ctx.beginPath();
    ctx.arc(x, yTop, r, 0, Math.PI * 2);
    ctx.fill();
    // bottom: − cyan
    ctx.fillStyle = "#6FB8C6";
    ctx.beginPath();
    ctx.arc(x, yBot, r, 0, Math.PI * 2);
    ctx.fill();
  }
}
