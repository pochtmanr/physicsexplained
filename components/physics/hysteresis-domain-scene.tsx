"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  ferromagneticM,
  remanentMagnetisation,
  type HysteresisParams,
} from "@/lib/physics/electromagnetism/ferromagnetism";

const RATIO = 0.52;
const MAX_HEIGHT = 440;

/**
 * Soft-iron parameters. Pr/Psat = 0.38 per the Session 2 soft-loop precedent;
 * Hc ≈ 15% of Hsat, matching a realistic (non-cartoon) loop shape.
 */
const PARAMS: HysteresisParams = {
  Msat: 1.0, // normalised
  Hc: 0.15, // 15% of Hsat — the soft-loop rule
  remanence: 0.38, // Pr/Psat = 0.38
};
const H_SAT = 1.0;
const SWEEP_PERIOD_S = 8; // full H sweep cycle

const COLS = 12;
const ROWS = 8;
const N_CELLS = COLS * ROWS;

/**
 * THE MONEY SHOT — two panels driven by the same applied H.
 *
 * Left:  B vs H plot. Soft hysteresis loop traced live. Markers at ±Hc
 *        (coercive field, zero crossing on each branch) and ±Br (remanence
 *        at H = 0). Grid, axis labels, numeric HUD. Vertical ruler pins
 *        "you are here" on the loop.
 * Right: 12×8 domain mosaic. Each cell magenta (+) or cyan (−) arrow.
 *        Domain walls drawn as thin amber lines between antiparallel
 *        neighbours. Cells flip in clumps as H sweeps — Barkhausen-style,
 *        with a short visual flash on the frame of flip.
 *
 * Both panels are locked to the same H(t) phase variable, so the reader
 * sees cause-and-effect: the macroscopic loop is the average of the
 * microscopic domain reconfiguration.
 */
export function HysteresisDomainScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 720, height: 440 });

  // Rolling trail of (H, M) for the live trace on the left panel.
  const trailRef = useRef<Array<{ H: number; M: number; t: number }>>([]);
  // State is the previous (H, M) point — the shape `ferromagneticM` expects.
  const stateRef = useRef({ H: H_SAT, M: PARAMS.Msat });

  // Quenched per-cell switching thresholds (each cell has its own h_i).
  // A cell flips to +1 once H ≥ +h_i, and to −1 once H ≤ −h_i — classic
  // Preisach-style hysteron population. The ensemble average reproduces
  // the soft-loop shape from the continuum model.
  const cellsRef = useRef<{
    thresholds: number[]; // in [0.02, ~1.4·Hc] — low threshold → soft domain
    signs: number[]; // +1 or -1
    flipFlashT: number[]; // time of last flip (for visual flash)
  } | null>(null);

  if (cellsRef.current === null) {
    const thresholds = new Array<number>(N_CELLS);
    const signs = new Array<number>(N_CELLS);
    const flipFlashT = new Array<number>(N_CELLS);
    // Deterministic PRNG so the domain layout is stable across renders.
    let seed = 20260422;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
    for (let i = 0; i < N_CELLS; i++) {
      // Thresholds concentrated near Hc, a few harder outliers beyond.
      // Distribution: base ∈ [0.2, 1.3] · Hc.
      thresholds[i] = (0.2 + rand() * 1.1) * PARAMS.Hc;
      signs[i] = rand() < 0.5 ? -1 : +1;
      flipFlashT[i] = -10;
    }
    cellsRef.current = { thresholds, signs, flipFlashT };
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

      // ── Applied H: triangle wave in [−Hsat, +Hsat] with period SWEEP_PERIOD_S ──
      const phase = (t % SWEEP_PERIOD_S) / SWEEP_PERIOD_S;
      let H: number;
      if (phase < 0.5) {
        H = H_SAT * (1 - 4 * phase); // +1 → −1 over [0, 0.5]
      } else {
        H = H_SAT * (-1 + 4 * (phase - 0.5)); // −1 → +1 over [0.5, 1]
      }

      // ── Step the continuum hysteresis model (drives the left panel) ──
      const M = ferromagneticM(H, stateRef.current, PARAMS);
      stateRef.current = { H, M };

      // ── Step the domain cells (Preisach hysterons, drive the right panel) ──
      const cells = cellsRef.current!;
      for (let i = 0; i < N_CELLS; i++) {
        const hc_i = cells.thresholds[i]!;
        let newSign = cells.signs[i]!;
        if (H >= hc_i) newSign = +1;
        else if (H <= -hc_i) newSign = -1;
        if (newSign !== cells.signs[i]) {
          cells.signs[i] = newSign;
          cells.flipFlashT[i] = t;
        }
      }

      // Append to the trail
      trailRef.current.push({ H, M, t });
      const cutoff = t - 2 * SWEEP_PERIOD_S;
      while (
        trailRef.current.length > 0 &&
        trailRef.current[0]!.t < cutoff
      ) {
        trailRef.current.shift();
      }

      // ── Layout: split canvas in two ──
      const split = Math.floor(width * 0.55);
      const padOuter = 14;

      drawLoopPanel(ctx, {
        x: padOuter,
        y: padOuter,
        w: split - 2 * padOuter,
        h: height - 2 * padOuter,
        t,
        H,
        M,
        trail: trailRef.current,
        colors,
      });
      drawDomainPanel(ctx, {
        x: split,
        y: padOuter,
        w: width - split - padOuter,
        h: height - 2 * padOuter,
        t,
        H,
        cells,
        colors,
      });
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

// ---------------------------------------------------------------------------
// Left panel — B vs H hysteresis loop
// ---------------------------------------------------------------------------

interface LoopPanelProps {
  x: number;
  y: number;
  w: number;
  h: number;
  t: number;
  H: number;
  M: number;
  trail: Array<{ H: number; M: number; t: number }>;
  colors: { fg1: string; fg2: string; fg3: string };
}

function drawLoopPanel(ctx: CanvasRenderingContext2D, p: LoopPanelProps) {
  const { x, y, w, h, t, H, M, trail, colors } = p;
  const padL = 46;
  const padR = 14;
  const padT = 28;
  const padB = 34;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  const Hrange = H_SAT * 1.1;
  const Mrange = PARAMS.Msat * 1.1;
  const xOf = (hh: number) =>
    x + padL + ((hh + Hrange) / (2 * Hrange)) * plotW;
  const yOf = (mm: number) =>
    y + padT + (1 - (mm + Mrange) / (2 * Mrange)) * plotH;

  // Gridlines every 0.25 in H and M (normalised)
  ctx.strokeStyle = "rgba(86, 104, 127, 0.22)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = -1; i <= 1; i += 0.25) {
    if (Math.abs(i) > 1e-6) {
      ctx.moveTo(xOf(i), y + padT);
      ctx.lineTo(xOf(i), y + padT + plotH);
      ctx.moveTo(x + padL, yOf(i));
      ctx.lineTo(x + padL + plotW, yOf(i));
    }
  }
  ctx.stroke();

  // Axes: H = 0 vertical, M = 0 horizontal (dashed)
  ctx.strokeStyle = "rgba(86, 104, 127, 0.7)";
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(xOf(0), y + padT);
  ctx.lineTo(xOf(0), y + padT + plotH);
  ctx.moveTo(x + padL, yOf(0));
  ctx.lineTo(x + padL + plotW, yOf(0));
  ctx.stroke();
  ctx.setLineDash([]);

  // Outer frame
  ctx.strokeStyle = colors.fg3;
  ctx.strokeRect(x + padL, y + padT, plotW, plotH);

  // ±Hc tick marks on the M = 0 axis
  ctx.strokeStyle = "#FFD66B";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(xOf(-PARAMS.Hc), yOf(0) - 4);
  ctx.lineTo(xOf(-PARAMS.Hc), yOf(0) + 4);
  ctx.moveTo(xOf(+PARAMS.Hc), yOf(0) - 4);
  ctx.lineTo(xOf(+PARAMS.Hc), yOf(0) + 4);
  ctx.stroke();
  ctx.fillStyle = "rgba(255, 214, 107, 0.85)";
  ctx.font = "10px monospace";
  ctx.textAlign = "center";
  ctx.fillText("−Hc", xOf(-PARAMS.Hc), yOf(0) + 14);
  ctx.fillText("+Hc", xOf(+PARAMS.Hc), yOf(0) + 14);

  // ±Br (remanence) markers on the H = 0 axis
  const Br = remanentMagnetisation(PARAMS);
  ctx.strokeStyle = "#FF6ADE";
  ctx.beginPath();
  ctx.moveTo(xOf(0) - 4, yOf(+Br));
  ctx.lineTo(xOf(0) + 4, yOf(+Br));
  ctx.stroke();
  ctx.strokeStyle = "#6FB8C6";
  ctx.beginPath();
  ctx.moveTo(xOf(0) - 4, yOf(-Br));
  ctx.lineTo(xOf(0) + 4, yOf(-Br));
  ctx.stroke();
  ctx.fillStyle = "rgba(255, 106, 222, 0.85)";
  ctx.textAlign = "right";
  ctx.fillText("+Br", xOf(0) - 6, yOf(+Br) + 4);
  ctx.fillStyle = "rgba(111, 184, 198, 0.85)";
  ctx.fillText("−Br", xOf(0) - 6, yOf(-Br) + 4);

  // Axis labels
  ctx.fillStyle = colors.fg2;
  ctx.font = "11px monospace";
  ctx.textAlign = "center";
  ctx.fillText("H  (applied)", x + padL + plotW / 2, y + padT + plotH + 28);
  ctx.save();
  ctx.translate(x + 14, y + padT + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("B  (response)", 0, 0);
  ctx.restore();

  // Scale hints
  ctx.textAlign = "left";
  ctx.fillStyle = colors.fg3;
  ctx.font = "9px monospace";
  ctx.fillText("±Hsat", x + padL, y + padT - 6);
  ctx.textAlign = "right";
  ctx.fillText("±Msat", x + padL + plotW, y + padT - 6);

  // ── The trail (live trace) ──
  ctx.lineWidth = 1.8;
  for (let i = 1; i < trail.length; i++) {
    const a = trail[i - 1]!;
    const b = trail[i]!;
    const age = (t - b.t) / (2 * SWEEP_PERIOD_S);
    const alpha = Math.max(0.08, 1 - age);
    ctx.strokeStyle = `rgba(120, 220, 255, ${alpha})`;
    ctx.beginPath();
    ctx.moveTo(xOf(a.H), yOf(a.M));
    ctx.lineTo(xOf(b.H), yOf(b.M));
    ctx.stroke();
  }

  // ── "You are here" vertical marker at the current H ──
  ctx.strokeStyle = "rgba(255, 214, 107, 0.45)";
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 3]);
  ctx.beginPath();
  ctx.moveTo(xOf(H), y + padT);
  ctx.lineTo(xOf(H), y + padT + plotH);
  ctx.stroke();
  ctx.setLineDash([]);

  // Current position dot
  ctx.fillStyle = "#FFD66B";
  ctx.shadowColor = "rgba(255, 214, 107, 0.7)";
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(xOf(H), yOf(M), 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // HUD header
  ctx.fillStyle = colors.fg1;
  ctx.font = "12px monospace";
  ctx.textAlign = "left";
  ctx.fillText(
    `H = ${H >= 0 ? "+" : ""}${H.toFixed(2)}   B = ${M >= 0 ? "+" : ""}${M.toFixed(2)}`,
    x + padL,
    y + 14,
  );
  ctx.textAlign = "right";
  ctx.fillStyle = colors.fg3;
  ctx.fillText("soft loop · Pr/Psat ≈ 0.38", x + padL + plotW, y + 14);
}

// ---------------------------------------------------------------------------
// Right panel — domain mosaic
// ---------------------------------------------------------------------------

interface DomainPanelProps {
  x: number;
  y: number;
  w: number;
  h: number;
  t: number;
  H: number;
  cells: {
    thresholds: number[];
    signs: number[];
    flipFlashT: number[];
  };
  colors: { fg1: string; fg2: string; fg3: string };
}

function drawDomainPanel(ctx: CanvasRenderingContext2D, p: DomainPanelProps) {
  const { x, y, w, h, t, H, cells, colors } = p;
  const padL = 8;
  const padR = 8;
  const padT = 28;
  const padB = 26;
  const gridW = w - padL - padR;
  const gridH = h - padT - padB;

  const cellW = gridW / COLS;
  const cellH = gridH / ROWS;
  const cellSize = Math.min(cellW, cellH);
  const ox = x + padL + (gridW - cellSize * COLS) / 2;
  const oy = y + padT + (gridH - cellSize * ROWS) / 2;

  // Cells
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const i = r * COLS + c;
      const sign = cells.signs[i]!;
      const isUp = sign > 0;
      const cx = ox + (c + 0.5) * cellSize;
      const cy = oy + (r + 0.5) * cellSize;

      // Flash boost if this cell flipped recently
      const sinceFlip = t - cells.flipFlashT[i]!;
      const flash = sinceFlip < 0.35 ? 1 - sinceFlip / 0.35 : 0;

      const baseAlpha = 0.22;
      const boostedAlpha = baseAlpha + flash * 0.55;
      const fill = isUp
        ? `rgba(255, 106, 222, ${boostedAlpha})`
        : `rgba(111, 184, 198, ${boostedAlpha})`;
      ctx.fillStyle = fill;
      ctx.fillRect(
        ox + c * cellSize + 1,
        oy + r * cellSize + 1,
        cellSize - 2,
        cellSize - 2,
      );

      // Arrow
      const arrowH = cellSize * 0.58;
      const ay0 = isUp ? cy + arrowH / 2 : cy - arrowH / 2;
      const ay1 = isUp ? cy - arrowH / 2 : cy + arrowH / 2;
      drawArrow(
        ctx,
        cx,
        ay0,
        cx,
        ay1,
        isUp ? "#FF6ADE" : "#6FB8C6",
        1.5 + flash * 1.5,
      );
    }
  }

  // Domain walls: amber lines between antiparallel neighbours
  ctx.strokeStyle = "rgba(255, 214, 107, 0.8)";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const i = r * COLS + c;
      // Vertical wall between cell (r,c) and (r,c+1)
      if (c + 1 < COLS) {
        const j = r * COLS + (c + 1);
        if (cells.signs[i] !== cells.signs[j]) {
          const wx = ox + (c + 1) * cellSize;
          const wy0 = oy + r * cellSize;
          const wy1 = oy + (r + 1) * cellSize;
          ctx.moveTo(wx, wy0);
          ctx.lineTo(wx, wy1);
        }
      }
      // Horizontal wall between (r,c) and (r+1,c)
      if (r + 1 < ROWS) {
        const j = (r + 1) * COLS + c;
        if (cells.signs[i] !== cells.signs[j]) {
          const wy = oy + (r + 1) * cellSize;
          const wx0 = ox + c * cellSize;
          const wx1 = ox + (c + 1) * cellSize;
          ctx.moveTo(wx0, wy);
          ctx.lineTo(wx1, wy);
        }
      }
    }
  }
  ctx.stroke();

  // Frame
  ctx.strokeStyle = colors.fg3;
  ctx.lineWidth = 1;
  ctx.strokeRect(ox, oy, cellSize * COLS, cellSize * ROWS);

  // Header
  ctx.fillStyle = colors.fg1;
  ctx.font = "12px monospace";
  ctx.textAlign = "left";
  ctx.fillText("domain mosaic (12 × 8)", x + padL, y + 14);

  // Count up/down
  let nUp = 0;
  for (const s of cells.signs) if (s > 0) nUp++;
  const nDown = cells.signs.length - nUp;
  const frac = (nUp - nDown) / cells.signs.length;

  ctx.textAlign = "right";
  ctx.fillStyle = colors.fg3;
  ctx.fillText(
    `↑ ${nUp}   ↓ ${nDown}   ⟨M⟩ = ${frac >= 0 ? "+" : ""}${frac.toFixed(2)}`,
    x + w - padR,
    y + 14,
  );

  // H indicator bar at the bottom: shows where in the sweep we are
  const barX = ox;
  const barY = oy + cellSize * ROWS + 10;
  const barW = cellSize * COLS;
  const barH = 6;
  ctx.strokeStyle = colors.fg3;
  ctx.strokeRect(barX, barY, barW, barH);
  // Centre mark
  ctx.strokeStyle = "rgba(86, 104, 127, 0.6)";
  ctx.beginPath();
  ctx.moveTo(barX + barW / 2, barY - 2);
  ctx.lineTo(barX + barW / 2, barY + barH + 2);
  ctx.stroke();
  // ±Hc tick marks
  const hcLeft = barX + (0.5 + -PARAMS.Hc / (2 * H_SAT)) * barW;
  const hcRight = barX + (0.5 + +PARAMS.Hc / (2 * H_SAT)) * barW;
  ctx.strokeStyle = "rgba(255, 214, 107, 0.6)";
  ctx.beginPath();
  ctx.moveTo(hcLeft, barY - 1);
  ctx.lineTo(hcLeft, barY + barH + 1);
  ctx.moveTo(hcRight, barY - 1);
  ctx.lineTo(hcRight, barY + barH + 1);
  ctx.stroke();
  // Current H marker
  const curX = barX + (0.5 + H / (2 * H_SAT)) * barW;
  ctx.fillStyle = "#FFD66B";
  ctx.fillRect(curX - 1.5, barY - 2, 3, barH + 4);

  ctx.fillStyle = colors.fg2;
  ctx.font = "10px monospace";
  ctx.textAlign = "center";
  ctx.fillText(
    `applied H = ${H >= 0 ? "+" : ""}${H.toFixed(2)}`,
    barX + barW / 2,
    barY + barH + 14,
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
