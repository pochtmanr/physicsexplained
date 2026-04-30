"use client";

import { useEffect, useRef } from "react";
import {
  POUND_REBKA_PREDICTED,
  POUND_REBKA_MEASURED,
  POUND_REBKA_MEASUREMENT_ERROR,
  POUND_SNIDER_RATIO,
  POUND_SNIDER_RATIO_ERROR,
} from "@/lib/physics/relativity/gravitational-redshift";

/**
 * PredictedVsObservedScene — FIG.27c
 *
 * Two side-by-side displays:
 *   (a) PREDICTED vs MEASURED — bars with error bars.
 *       Predicted: 2.46 × 10⁻¹⁵  (deterministic, gh/c²)
 *       Measured (Pound-Rebka 1960): (2.57 ± 0.26) × 10⁻¹⁵
 *       Pound-Snider 1965 ratio: 0.999 ± 0.008  → 1% agreement
 *
 *   (b) Timeline of subsequent confirmations:
 *       Pound-Rebka 1960 — first lab test, 10%
 *       Pound-Snider 1965 — refined, 1%
 *       Vessot-Levine GP-A 1976 — hydrogen-maser rocket, 10⁻⁴
 *       Optical-clock comparison 2010s — 10⁻⁵+
 *
 * Canvas 2D, dark bg. PascalCase export: PredictedVsObservedScene.
 */

const BG = "#0A0C12";
const TEXT_BRIGHT = "rgba(255,255,255,0.92)";
const TEXT_DIM = "rgba(255,255,255,0.65)";
const TEXT_MUTE = "rgba(255,255,255,0.45)";
const AMBER = "#FFB36B";
const GREEN = "#86EFAC";
const CYAN = "#67E8F9";
const VIOLET = "#A78BFA";
const RED_PALE = "#FCA5A5";

interface ConfirmationEntry {
  year: number;
  experiment: string;
  precision: string;
  fractional: number; // for sorting / chart placement
  color: string;
}

const TIMELINE: readonly ConfirmationEntry[] = [
  {
    year: 1960,
    experiment: "Pound-Rebka",
    precision: "10%",
    fractional: 0.1,
    color: GREEN,
  },
  {
    year: 1965,
    experiment: "Pound-Snider",
    precision: "1%",
    fractional: 0.01,
    color: CYAN,
  },
  {
    year: 1976,
    experiment: "Vessot GP-A (hydrogen maser, 10 000 km rocket)",
    precision: "10⁻⁴",
    fractional: 1e-4,
    color: VIOLET,
  },
  {
    year: 2010,
    experiment: "Optical-clock altitude comparison (NIST)",
    precision: "10⁻⁵",
    fractional: 1e-5,
    color: AMBER,
  },
] as const;

export function PredictedVsObservedScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    draw(ctx, W, H);
  }, []);

  return (
    <div className="relative w-full">
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: 440, display: "block" }}
        className="rounded-md border border-white/10 bg-[#0A0C12]"
        aria-label="Bar chart of predicted vs measured gravitational redshift for the Pound-Rebka 1960 experiment, plus a timeline of subsequent confirmations from 1960 to 2010."
      />
    </div>
  );
}

function draw(ctx: CanvasRenderingContext2D, W: number, H: number) {
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // ── header ──
  ctx.save();
  ctx.font = "bold 13px ui-monospace, monospace";
  ctx.fillStyle = TEXT_BRIGHT;
  ctx.textAlign = "center";
  ctx.fillText(
    "Δν / ν  for the 22.5 m Jefferson tower",
    W / 2,
    24,
  );
  ctx.restore();

  // ── Top half: predicted vs measured bars ──
  const topY = 50;
  const topH = 200;
  const bottomY = topY + topH + 40;

  drawBarsPanel(ctx, 30, topY, W - 60, topH);

  // ── separator ──
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(30, bottomY - 20);
  ctx.lineTo(W - 30, bottomY - 20);
  ctx.stroke();
  ctx.restore();

  // ── Bottom half: timeline of confirmations ──
  drawTimelinePanel(ctx, 30, bottomY, W - 60, H - bottomY - 16);
}

function drawBarsPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const padL = 70;
  const padR = 24;
  const padT = 30;
  const padB = 36;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  // y-axis goes from 0 to ~ 3.0 × 10⁻¹⁵
  const yMax = 3.0e-15;
  const yToPx = (v: number) => y + padT + plotH - (v / yMax) * plotH;

  // ── frame + y ticks ──
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.strokeRect(x + padL, y + padT, plotW, plotH);

  ctx.font = "10px ui-monospace, monospace";
  ctx.fillStyle = TEXT_MUTE;
  ctx.textAlign = "right";
  for (const yv of [0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0]) {
    const yp = yToPx(yv * 1e-15);
    ctx.fillText(`${yv.toFixed(1)}`, x + padL - 6, yp + 3);
    ctx.beginPath();
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.moveTo(x + padL, yp);
    ctx.lineTo(x + padL + plotW, yp);
    ctx.stroke();
  }

  // y-axis label
  ctx.save();
  ctx.translate(x + 14, y + padT + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center";
  ctx.fillStyle = TEXT_DIM;
  ctx.fillText("Δν / ν  (×10⁻¹⁵)", 0, 0);
  ctx.restore();

  ctx.restore();

  // ── two bars: PREDICTED, MEASURED ──
  const barW = 80;
  const gap = 100;
  const barLeftX = x + padL + plotW * 0.25 - barW / 2;
  const barRightX = x + padL + plotW * 0.65 - barW / 2;

  // PREDICTED bar
  const predTop = yToPx(POUND_REBKA_PREDICTED);
  const predBot = yToPx(0);
  ctx.save();
  ctx.fillStyle = "rgba(255,179,107,0.35)";
  ctx.strokeStyle = AMBER;
  ctx.lineWidth = 1.5;
  ctx.fillRect(barLeftX, predTop, barW, predBot - predTop);
  ctx.strokeRect(barLeftX, predTop, barW, predBot - predTop);

  ctx.font = "bold 11px ui-monospace, monospace";
  ctx.fillStyle = AMBER;
  ctx.textAlign = "center";
  ctx.fillText(
    `${(POUND_REBKA_PREDICTED * 1e15).toFixed(2)} × 10⁻¹⁵`,
    barLeftX + barW / 2,
    predTop - 8,
  );

  ctx.font = "11px ui-monospace, monospace";
  ctx.fillStyle = TEXT_DIM;
  ctx.fillText("PREDICTED", barLeftX + barW / 2, predBot + 16);
  ctx.font = "10px ui-monospace, monospace";
  ctx.fillStyle = TEXT_MUTE;
  ctx.fillText("g h / c²", barLeftX + barW / 2, predBot + 30);
  ctx.restore();

  // MEASURED bar
  const measTop = yToPx(POUND_REBKA_MEASURED);
  const measBot = yToPx(0);
  ctx.save();
  ctx.fillStyle = "rgba(134,239,172,0.35)";
  ctx.strokeStyle = GREEN;
  ctx.lineWidth = 1.5;
  ctx.fillRect(barRightX, measTop, barW, measBot - measTop);
  ctx.strokeRect(barRightX, measTop, barW, measBot - measTop);

  // error bars
  const errTop = yToPx(POUND_REBKA_MEASURED + POUND_REBKA_MEASUREMENT_ERROR);
  const errBot = yToPx(POUND_REBKA_MEASURED - POUND_REBKA_MEASUREMENT_ERROR);
  ctx.strokeStyle = GREEN;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(barRightX + barW / 2, errTop);
  ctx.lineTo(barRightX + barW / 2, errBot);
  ctx.moveTo(barRightX + barW / 2 - 8, errTop);
  ctx.lineTo(barRightX + barW / 2 + 8, errTop);
  ctx.moveTo(barRightX + barW / 2 - 8, errBot);
  ctx.lineTo(barRightX + barW / 2 + 8, errBot);
  ctx.stroke();

  ctx.font = "bold 11px ui-monospace, monospace";
  ctx.fillStyle = GREEN;
  ctx.textAlign = "center";
  ctx.fillText(
    `(${(POUND_REBKA_MEASURED * 1e15).toFixed(2)} ± ${(POUND_REBKA_MEASUREMENT_ERROR * 1e15).toFixed(2)}) × 10⁻¹⁵`,
    barRightX + barW / 2,
    errTop - 10,
  );

  ctx.font = "11px ui-monospace, monospace";
  ctx.fillStyle = TEXT_DIM;
  ctx.fillText("MEASURED", barRightX + barW / 2, measBot + 16);
  ctx.font = "10px ui-monospace, monospace";
  ctx.fillStyle = TEXT_MUTE;
  ctx.fillText("Pound-Rebka 1960", barRightX + barW / 2, measBot + 30);
  ctx.restore();

  // ── ratio annotation ──
  ctx.save();
  ctx.font = "bold 11px ui-monospace, monospace";
  ctx.fillStyle = CYAN;
  ctx.textAlign = "right";
  const labelX = x + padL + plotW - 8;
  ctx.fillText(
    `Pound-Snider 1965 ratio = ${POUND_SNIDER_RATIO.toFixed(4)} ± ${POUND_SNIDER_RATIO_ERROR.toFixed(4)}`,
    labelX,
    y + padT + 14,
  );
  ctx.font = "10px ui-monospace, monospace";
  ctx.fillStyle = TEXT_DIM;
  ctx.fillText("(measured / predicted — agreement to 1%)", labelX, y + padT + 28);
  ctx.restore();

  // ── header ──
  ctx.save();
  ctx.font = "bold 11px ui-monospace, monospace";
  ctx.fillStyle = TEXT_BRIGHT;
  ctx.textAlign = "left";
  ctx.fillText("Predicted vs measured", x + padL, y + 20);
  ctx.restore();
}

function drawTimelinePanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  ctx.save();
  ctx.font = "bold 11px ui-monospace, monospace";
  ctx.fillStyle = TEXT_BRIGHT;
  ctx.textAlign = "left";
  ctx.fillText(
    "Half a century of confirmations",
    x,
    y + 14,
  );
  ctx.restore();

  // simple horizontal timeline
  const padL = 50;
  const padR = 30;
  const lineY = y + h - 28;
  const lineX0 = x + padL;
  const lineX1 = x + w - padR;

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(lineX0, lineY);
  ctx.lineTo(lineX1, lineY);
  ctx.stroke();
  ctx.restore();

  const yearMin = 1955;
  const yearMax = 2015;
  const yearToPx = (yr: number) =>
    lineX0 + ((yr - yearMin) / (yearMax - yearMin)) * (lineX1 - lineX0);

  // year ticks
  ctx.save();
  ctx.font = "9px ui-monospace, monospace";
  ctx.fillStyle = TEXT_MUTE;
  ctx.textAlign = "center";
  for (const yr of [1960, 1970, 1980, 1990, 2000, 2010]) {
    const xp = yearToPx(yr);
    ctx.beginPath();
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.moveTo(xp, lineY - 2);
    ctx.lineTo(xp, lineY + 4);
    ctx.stroke();
    ctx.fillText(`${yr}`, xp, lineY + 16);
  }
  ctx.restore();

  // markers
  for (const e of TIMELINE) {
    const xp = yearToPx(e.year);
    const dotY = lineY;

    // vertical leader
    ctx.save();
    ctx.strokeStyle = e.color;
    ctx.globalAlpha = 0.6;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(xp, dotY);
    ctx.lineTo(xp, y + 30);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // dot
    ctx.save();
    ctx.fillStyle = e.color;
    ctx.beginPath();
    ctx.arc(xp, dotY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // labels with stagger
  for (let i = 0; i < TIMELINE.length; i++) {
    const e = TIMELINE[i];
    const xp = yearToPx(e.year);
    const labelY = y + 30 + (i % 2) * 26;
    ctx.save();
    ctx.font = "bold 10px ui-monospace, monospace";
    ctx.fillStyle = e.color;
    ctx.textAlign = "left";
    ctx.fillText(`${e.year}`, xp + 8, labelY);
    ctx.font = "9px ui-monospace, monospace";
    ctx.fillStyle = TEXT_DIM;
    const exp = e.experiment.length > 38 ? e.experiment.slice(0, 36) + "…" : e.experiment;
    ctx.fillText(exp, xp + 8, labelY + 12);
    ctx.font = "9px ui-monospace, monospace";
    ctx.fillStyle = RED_PALE;
    ctx.fillText(`precision ${e.precision}`, xp + 8, labelY + 24);
    ctx.restore();
  }
}
