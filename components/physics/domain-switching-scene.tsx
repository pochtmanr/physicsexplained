"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.62;
const MAX_HEIGHT = 380;

const COLS = 18;
const ROWS = 11;
const SWEEP_PERIOD_S = 8; // one full E sweep cycle

/**
 * A 2-D mosaic of ferroelectric domains. Each cell carries a polarisation
 * arrow that points either "up" (+1) or "down" (−1) along the polar axis.
 * Each cell also has a quenched random "switching threshold" h_i in [0, 1] —
 * its personal coercive field. As the externally applied E sweeps between
 * −1 and +1, every cell aligns once |E| > h_i (with sign matching E):
 *
 *     if E ≥ h_i:  domain → +1
 *     if E ≤ −h_i: domain → −1
 *
 * The macroscopic polarisation is the average of all cell signs. As E ramps,
 * cells flip in waves — soft ones first, hard ones last — and the running
 * average traces out a hysteresis loop in real time. A small histogram in
 * the corner shows the threshold distribution and where the current |E|
 * stands.
 */
export function DomainSwitchingScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 640, height: 380 });

  // Quenched cell thresholds in [0.05, 0.98].
  const thresholdsRef = useRef<number[]>([]);
  // Cell signs (+1 or −1).
  const signsRef = useRef<number[]>([]);
  // Last applied E to detect direction changes for the |E|·sign(E) gate.
  const stateRef = useRef({ initialised: false });

  if (!stateRef.current.initialised) {
    const N = COLS * ROWS;
    const t = new Array<number>(N);
    const s = new Array<number>(N);
    // Deterministic PRNG so renders are stable
    let seed = 1234567;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
    for (let i = 0; i < N; i++) {
      t[i] = 0.05 + rand() * 0.93;
      // Start in a roughly random state so we see the loop emerge
      s[i] = rand() < 0.5 ? -1 : +1;
    }
    thresholdsRef.current = t;
    signsRef.current = s;
    stateRef.current.initialised = true;
  }

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

      // Triangular E in [−1, +1]
      const phase = (t % SWEEP_PERIOD_S) / SWEEP_PERIOD_S; // 0..1
      let E: number;
      if (phase < 0.5) {
        E = 1 - 4 * phase; // +1 → −1
      } else {
        E = -1 + 4 * (phase - 0.5); // −1 → +1
      }

      // Update domains based on the threshold rule
      const thresholds = thresholdsRef.current;
      const signs = signsRef.current;
      for (let i = 0; i < signs.length; i++) {
        const h = thresholds[i]!;
        if (E >= h) signs[i] = +1;
        else if (E <= -h) signs[i] = -1;
        // otherwise: keep current sign (memory)
      }

      // Macroscopic polarisation (mean of signs)
      let sum = 0;
      for (const s of signs) sum += s;
      const Pmacro = sum / signs.length;

      // ── Layout ──
      const padL = 18;
      const padR = 200; // reserve for histogram + readout
      const padT = 18;
      const padB = 18;
      const gridW = width - padL - padR;
      const gridH = height - padT - padB;
      const cellW = gridW / COLS;
      const cellH = gridH / ROWS;
      const cellSize = Math.min(cellW, cellH);
      // Centre grid in the available area
      const ox = padL + (gridW - cellSize * COLS) / 2;
      const oy = padT + (gridH - cellSize * ROWS) / 2;

      // ── Draw each domain cell ──
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const i = r * COLS + c;
          const sign = signs[i]!;
          const cx = ox + (c + 0.5) * cellSize;
          const cy = oy + (r + 0.5) * cellSize;
          // Cell tint
          const isUp = sign > 0;
          const fill = isUp
            ? "rgba(255, 106, 222, 0.18)"
            : "rgba(111, 184, 198, 0.18)";
          ctx.fillStyle = fill;
          ctx.fillRect(
            ox + c * cellSize + 1,
            oy + r * cellSize + 1,
            cellSize - 2,
            cellSize - 2,
          );
          // Arrow
          const arrowH = cellSize * 0.6;
          const ay0 = isUp ? cy + arrowH / 2 : cy - arrowH / 2;
          const ay1 = isUp ? cy - arrowH / 2 : cy + arrowH / 2;
          drawArrow(
            ctx,
            cx,
            ay0,
            cx,
            ay1,
            isUp ? "#FF6ADE" : "#6FB8C6",
            1.4,
          );
        }
      }

      // Grid border
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.strokeRect(ox, oy, cellSize * COLS, cellSize * ROWS);

      // ── Side panel: histogram + readouts ──
      const panelX = ox + cellSize * COLS + 24;
      const panelW = width - panelX - 14;
      const histY = padT + 28;
      const histH = 80;

      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillText("threshold spectrum", panelX, histY - 10);

      // Build histogram of thresholds
      const BINS = 16;
      const counts = new Array<number>(BINS).fill(0);
      for (const h of thresholds) {
        const b = Math.min(BINS - 1, Math.floor(h * BINS));
        counts[b]!++;
      }
      const maxCount = counts.reduce((a, b) => Math.max(a, b), 1);
      const binW = panelW / BINS;
      for (let b = 0; b < BINS; b++) {
        const h = (counts[b]! / maxCount) * histH;
        ctx.fillStyle = "rgba(86, 104, 127, 0.7)";
        ctx.fillRect(
          panelX + b * binW + 1,
          histY + (histH - h),
          binW - 2,
          h,
        );
      }
      // Frame
      ctx.strokeStyle = colors.fg3;
      ctx.strokeRect(panelX, histY, panelW, histH);
      // Current |E| line on the histogram
      const Eabs = Math.abs(E);
      const ex = panelX + Eabs * panelW;
      ctx.strokeStyle = "#FFD66B";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(ex, histY - 3);
      ctx.lineTo(ex, histY + histH + 3);
      ctx.stroke();
      ctx.fillStyle = "#FFD66B";
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText("|E|", ex, histY - 6);

      // Numeric readouts
      const readY = histY + histH + 26;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillStyle = colors.fg1;
      ctx.fillText(`E    = ${E >= 0 ? "+" : ""}${E.toFixed(2)}`, panelX, readY);
      ctx.fillText(
        `⟨P⟩  = ${Pmacro >= 0 ? "+" : ""}${Pmacro.toFixed(2)}`,
        panelX,
        readY + 16,
      );
      // Count of up vs down
      let nUp = 0;
      for (const s of signs) if (s > 0) nUp++;
      ctx.fillStyle = colors.fg2;
      ctx.fillText(
        `↑ ${nUp}   ↓ ${signs.length - nUp}`,
        panelX,
        readY + 32,
      );

      // Mini macroscopic-P bar
      const barY = readY + 50;
      const barW = panelW;
      const barH = 14;
      ctx.strokeStyle = colors.fg3;
      ctx.strokeRect(panelX, barY, barW, barH);
      const fillX = panelX + barW / 2;
      const fillW = (Pmacro * barW) / 2;
      ctx.fillStyle = Pmacro >= 0 ? "#FF6ADE" : "#6FB8C6";
      ctx.fillRect(
        Math.min(fillX, fillX + fillW),
        barY + 1,
        Math.abs(fillW),
        barH - 2,
      );
      // Centre tick
      ctx.strokeStyle = colors.fg2;
      ctx.beginPath();
      ctx.moveTo(panelX + barW / 2, barY - 2);
      ctx.lineTo(panelX + barW / 2, barY + barH + 2);
      ctx.stroke();
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
    </div>
  );
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  lineWidth: number,
) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  if (len < 0.5) return;
  const ux = dx / len;
  const uy = dy / len;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  const ah = 5;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - ux * ah - uy * ah * 0.5, y1 - uy * ah + ux * ah * 0.5);
  ctx.lineTo(x1 - ux * ah + uy * ah * 0.5, y1 - uy * ah - ux * ah * 0.5);
  ctx.closePath();
  ctx.fill();
}
