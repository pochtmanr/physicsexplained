"use client";

import { useEffect, useRef, useState } from "react";
import {
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_SHORT,
  applyDpr,
  hexToRgba,
  useSceneSize,
  useSceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import { gamma } from "@/lib/physics/relativity/types";
import {
  ageDifference,
  travelerProperTime,
} from "@/lib/physics/relativity/twin-paradox";

/**
 * §03.5 WHO AGED LESS — bar-chart payoff at reunion.
 *
 * Two horizontal bars compare the two twin's clock readings at the moment
 * of reunion, given a round-trip lab-frame duration of T_HOME and a slider-
 * controlled β. The home bar (cyan) is fixed at T_HOME; the traveler bar
 * (orange) shrinks to T_HOME/γ. The visible disparity grows as β → 1.
 */

const T_HOME_YEARS = 10;
const PAD_X = 28;
const PAD_Y = 36;

export function WhoAgedLessScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [beta, setBeta] = useState(0.6);
  const { width: WIDTH, height: HEIGHT } = useSceneSize(containerRef, {
    ratio: 0.45,
    maxHeight: SCENE_HEIGHT_SHORT,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, WIDTH, HEIGHT);
    if (!ctx) return;
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = tokens.bg;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    const g = gamma(beta);
    const tauTraveler = travelerProperTime(T_HOME_YEARS, beta);
    const delta = ageDifference(T_HOME_YEARS, beta);

    const plotX = PAD_X + 60;
    const plotW = WIDTH - plotX - PAD_X;
    const yearsToPx = (yrs: number) => plotX + (yrs / T_HOME_YEARS) * plotW;

    // Tick marks (every 2 years)
    ctx.strokeStyle = tokens.grid;
    ctx.lineWidth = 1;
    ctx.font = "10px ui-monospace, monospace";
    ctx.fillStyle = tokens.textFaint;
    ctx.textAlign = "center";
    for (let yr = 0; yr <= T_HOME_YEARS; yr += 2) {
      const px = yearsToPx(yr);
      ctx.beginPath();
      ctx.moveTo(px, PAD_Y);
      ctx.lineTo(px, HEIGHT - PAD_Y);
      ctx.stroke();
      ctx.fillText(`${yr}`, px, HEIGHT - PAD_Y + 14);
    }
    ctx.textAlign = "left";

    // Home bar (cyan), top
    const barH = 52;
    const homeY = PAD_Y + 12;
    ctx.fillStyle = hexToRgba(tokens.cyan, 0.18);
    ctx.fillRect(plotX, homeY, plotW, barH);
    ctx.fillStyle = tokens.cyan;
    ctx.fillRect(plotX, homeY, yearsToPx(T_HOME_YEARS) - plotX, barH);
    ctx.fillStyle = tokens.textBright;
    ctx.font = "11px ui-monospace, monospace";
    ctx.textAlign = "right";
    ctx.fillText("HOME", plotX - 8, homeY + barH / 2 + 4);
    ctx.textAlign = "left";
    ctx.fillStyle = tokens.bg;
    ctx.font = "12px ui-monospace, monospace";
    ctx.fillText(
      `${T_HOME_YEARS.toFixed(1)} yr`,
      plotX + 8,
      homeY + barH / 2 + 4,
    );

    // Traveler bar (orange), bottom
    const travY = homeY + barH + 18;
    ctx.fillStyle = hexToRgba(tokens.orange, 0.18);
    ctx.fillRect(plotX, travY, plotW, barH);
    ctx.fillStyle = tokens.orange;
    ctx.fillRect(plotX, travY, yearsToPx(tauTraveler) - plotX, barH);
    ctx.fillStyle = tokens.textBright;
    ctx.font = "11px ui-monospace, monospace";
    ctx.textAlign = "right";
    ctx.fillText("TRAVELER", plotX - 8, travY + barH / 2 + 4);
    ctx.textAlign = "left";
    ctx.fillStyle = tokens.bg;
    ctx.font = "12px ui-monospace, monospace";
    ctx.fillText(
      `${tauTraveler.toFixed(2)} yr`,
      plotX + 8,
      travY + barH / 2 + 4,
    );

    // HUD
    ctx.fillStyle = tokens.textDim;
    ctx.font = "11px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText(`β = ${beta.toFixed(3)}`, PAD_X, 18);
    ctx.fillText(`γ = ${g.toFixed(3)}`, PAD_X + 110, 18);
    ctx.fillText(
      `Δ = ${delta.toFixed(2)} yr younger`,
      PAD_X + 220,
      18,
    );
    ctx.fillStyle = tokens.textFaint;
    ctx.fillText("years (lab-frame T_home = 10)", PAD_X, HEIGHT - 8);
  }, [beta, tokens, WIDTH, HEIGHT]);

  return (
    <div ref={containerRef} className="flex w-full flex-col items-center gap-3">
      <canvas
        ref={canvasRef}
        style={{ width: WIDTH, height: HEIGHT, display: "block" }}
        className={SCENE_CANVAS_CLASS}
      />
      <label className="flex w-full items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-20">β = {beta.toFixed(2)}</span>
        <input
          type="range"
          min={0}
          max={0.99}
          step={0.01}
          value={beta}
          onChange={(e) => setBeta(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-cyan)" }}
        />
        <span className="w-28">γ = {gamma(beta).toFixed(3)}</span>
      </label>
    </div>
  );
}
