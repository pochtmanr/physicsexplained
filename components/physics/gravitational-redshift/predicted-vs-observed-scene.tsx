"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  POUND_REBKA_PREDICTED,
  POUND_REBKA_MEASURED,
  POUND_REBKA_MEASUREMENT_ERROR,
  POUND_SNIDER_RATIO,
  POUND_SNIDER_RATIO_ERROR,
} from "@/lib/physics/relativity/gravitational-redshift";
import {
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_TALL,
  applyDpr,
  hexToRgba,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";

/**
 * PredictedVsObservedScene — FIG.27c
 */

interface ConfirmationEntry {
  year: number;
  experiment: string;
  precision: string;
  fractional: number;
  color: string;
}

export function PredictedVsObservedScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.62,
    maxHeight: SCENE_HEIGHT_TALL,
    minHeight: 360,
  });

  const timeline = useMemo<readonly ConfirmationEntry[]>(
    () => [
      {
        year: 1960,
        experiment: "Pound-Rebka",
        precision: "10%",
        fractional: 0.1,
        color: tokens.mint,
      },
      {
        year: 1965,
        experiment: "Pound-Snider",
        precision: "1%",
        fractional: 0.01,
        color: tokens.cyan,
      },
      {
        year: 1976,
        experiment: "Vessot GP-A (hydrogen maser, 10 000 km rocket)",
        precision: "10⁻⁴",
        fractional: 1e-4,
        color: tokens.purple,
      },
      {
        year: 2010,
        experiment: "Optical-clock altitude comparison (NIST)",
        precision: "10⁻⁵",
        fractional: 1e-5,
        color: tokens.amber,
      },
    ],
    [tokens.mint, tokens.cyan, tokens.purple, tokens.amber],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, width, height, tokens, timeline);
  }, [tokens, width, height, timeline]);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Bar chart of predicted vs measured gravitational redshift for the Pound-Rebka 1960 experiment, plus a timeline of subsequent confirmations from 1960 to 2010."
      />
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  tokens: SceneTokens,
  timeline: readonly ConfirmationEntry[],
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.font = "bold 13px ui-monospace, monospace";
  ctx.fillStyle = tokens.textBright;
  ctx.textAlign = "center";
  ctx.fillText("Δν / ν  for the 22.5 m Jefferson tower", W / 2, 24);
  ctx.restore();

  const topY = 50;
  const topH = 200;
  const bottomY = topY + topH + 40;

  drawBarsPanel(ctx, 30, topY, W - 60, topH, tokens);

  ctx.save();
  ctx.strokeStyle = hexToRgba(tokens.textBright, 0.06);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(30, bottomY - 20);
  ctx.lineTo(W - 30, bottomY - 20);
  ctx.stroke();
  ctx.restore();

  drawTimelinePanel(ctx, 30, bottomY, W - 60, H - bottomY - 16, tokens, timeline);
}

function drawBarsPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  tokens: SceneTokens,
) {
  const padL = 70;
  const padR = 24;
  const padT = 30;
  const padB = 36;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  const yMax = 3.0e-15;
  const yToPx = (v: number) => y + padT + plotH - (v / yMax) * plotH;

  ctx.save();
  ctx.strokeStyle = hexToRgba(tokens.textBright, 0.08);
  ctx.strokeRect(x + padL, y + padT, plotW, plotH);

  ctx.font = "10px ui-monospace, monospace";
  ctx.fillStyle = tokens.textFaint;
  ctx.textAlign = "right";
  for (const yv of [0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0]) {
    const yp = yToPx(yv * 1e-15);
    ctx.fillText(`${yv.toFixed(1)}`, x + padL - 6, yp + 3);
    ctx.beginPath();
    ctx.strokeStyle = hexToRgba(tokens.textBright, 0.05);
    ctx.moveTo(x + padL, yp);
    ctx.lineTo(x + padL + plotW, yp);
    ctx.stroke();
  }

  ctx.save();
  ctx.translate(x + 14, y + padT + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center";
  ctx.fillStyle = tokens.textDim;
  ctx.fillText("Δν / ν  (×10⁻¹⁵)", 0, 0);
  ctx.restore();

  ctx.restore();

  const barW = 80;
  const barLeftX = x + padL + plotW * 0.25 - barW / 2;
  const barRightX = x + padL + plotW * 0.65 - barW / 2;

  // PREDICTED bar
  const predTop = yToPx(POUND_REBKA_PREDICTED);
  const predBot = yToPx(0);
  ctx.save();
  ctx.fillStyle = hexToRgba(tokens.amber, 0.35);
  ctx.strokeStyle = tokens.amber;
  ctx.lineWidth = 1.5;
  ctx.fillRect(barLeftX, predTop, barW, predBot - predTop);
  ctx.strokeRect(barLeftX, predTop, barW, predBot - predTop);

  ctx.font = "bold 11px ui-monospace, monospace";
  ctx.fillStyle = tokens.amber;
  ctx.textAlign = "center";
  ctx.fillText(
    `${(POUND_REBKA_PREDICTED * 1e15).toFixed(2)} × 10⁻¹⁵`,
    barLeftX + barW / 2,
    predTop - 8,
  );

  ctx.font = "11px ui-monospace, monospace";
  ctx.fillStyle = tokens.textDim;
  ctx.fillText("PREDICTED", barLeftX + barW / 2, predBot + 16);
  ctx.font = "10px ui-monospace, monospace";
  ctx.fillStyle = tokens.textFaint;
  ctx.fillText("g h / c²", barLeftX + barW / 2, predBot + 30);
  ctx.restore();

  // MEASURED bar
  const measTop = yToPx(POUND_REBKA_MEASURED);
  const measBot = yToPx(0);
  ctx.save();
  ctx.fillStyle = hexToRgba(tokens.mint, 0.35);
  ctx.strokeStyle = tokens.mint;
  ctx.lineWidth = 1.5;
  ctx.fillRect(barRightX, measTop, barW, measBot - measTop);
  ctx.strokeRect(barRightX, measTop, barW, measBot - measTop);

  const errTop = yToPx(POUND_REBKA_MEASURED + POUND_REBKA_MEASUREMENT_ERROR);
  const errBot = yToPx(POUND_REBKA_MEASURED - POUND_REBKA_MEASUREMENT_ERROR);
  ctx.strokeStyle = tokens.mint;
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
  ctx.fillStyle = tokens.mint;
  ctx.textAlign = "center";
  ctx.fillText(
    `(${(POUND_REBKA_MEASURED * 1e15).toFixed(2)} ± ${(POUND_REBKA_MEASUREMENT_ERROR * 1e15).toFixed(2)}) × 10⁻¹⁵`,
    barRightX + barW / 2,
    errTop - 10,
  );

  ctx.font = "11px ui-monospace, monospace";
  ctx.fillStyle = tokens.textDim;
  ctx.fillText("MEASURED", barRightX + barW / 2, measBot + 16);
  ctx.font = "10px ui-monospace, monospace";
  ctx.fillStyle = tokens.textFaint;
  ctx.fillText("Pound-Rebka 1960", barRightX + barW / 2, measBot + 30);
  ctx.restore();

  ctx.save();
  ctx.font = "bold 11px ui-monospace, monospace";
  ctx.fillStyle = tokens.cyan;
  ctx.textAlign = "right";
  const labelX = x + padL + plotW - 8;
  ctx.fillText(
    `Pound-Snider 1965 ratio = ${POUND_SNIDER_RATIO.toFixed(4)} ± ${POUND_SNIDER_RATIO_ERROR.toFixed(4)}`,
    labelX,
    y + padT + 14,
  );
  ctx.font = "10px ui-monospace, monospace";
  ctx.fillStyle = tokens.textDim;
  ctx.fillText("(measured / predicted — agreement to 1%)", labelX, y + padT + 28);
  ctx.restore();

  ctx.save();
  ctx.font = "bold 11px ui-monospace, monospace";
  ctx.fillStyle = tokens.textBright;
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
  tokens: SceneTokens,
  timeline: readonly ConfirmationEntry[],
) {
  ctx.save();
  ctx.font = "bold 11px ui-monospace, monospace";
  ctx.fillStyle = tokens.textBright;
  ctx.textAlign = "left";
  ctx.fillText("Half a century of confirmations", x, y + 14);
  ctx.restore();

  const padL = 50;
  const padR = 30;
  const lineY = y + h - 28;
  const lineX0 = x + padL;
  const lineX1 = x + w - padR;

  ctx.save();
  ctx.strokeStyle = hexToRgba(tokens.textBright, 0.18);
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

  ctx.save();
  ctx.font = "9px ui-monospace, monospace";
  ctx.fillStyle = tokens.textFaint;
  ctx.textAlign = "center";
  for (const yr of [1960, 1970, 1980, 1990, 2000, 2010]) {
    const xp = yearToPx(yr);
    ctx.beginPath();
    ctx.strokeStyle = hexToRgba(tokens.textBright, 0.15);
    ctx.moveTo(xp, lineY - 2);
    ctx.lineTo(xp, lineY + 4);
    ctx.stroke();
    ctx.fillText(`${yr}`, xp, lineY + 16);
  }
  ctx.restore();

  for (const e of timeline) {
    const xp = yearToPx(e.year);
    const dotY = lineY;

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

    ctx.save();
    ctx.fillStyle = e.color;
    ctx.beginPath();
    ctx.arc(xp, dotY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  for (let i = 0; i < timeline.length; i++) {
    const e = timeline[i];
    const xp = yearToPx(e.year);
    const labelY = y + 30 + (i % 2) * 26;
    ctx.save();
    ctx.font = "bold 10px ui-monospace, monospace";
    ctx.fillStyle = e.color;
    ctx.textAlign = "left";
    ctx.fillText(`${e.year}`, xp + 8, labelY);
    ctx.font = "9px ui-monospace, monospace";
    ctx.fillStyle = tokens.textDim;
    const exp = e.experiment.length > 38 ? e.experiment.slice(0, 36) + "…" : e.experiment;
    ctx.fillText(exp, xp + 8, labelY + 12);
    ctx.font = "9px ui-monospace, monospace";
    ctx.fillStyle = tokens.red;
    ctx.fillText(`precision ${e.precision}`, xp + 8, labelY + 24);
    ctx.restore();
  }
}
