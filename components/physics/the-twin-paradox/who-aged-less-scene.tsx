"use client";

import { useEffect, useRef, useState } from "react";
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
const WIDTH = 640;
const HEIGHT = 280;
const PAD_X = 28;
const PAD_Y = 36;

export function WhoAgedLessScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [beta, setBeta] = useState(0.6);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = WIDTH * dpr;
    canvas.height = HEIGHT * dpr;
    canvas.style.width = `${WIDTH}px`;
    canvas.style.height = `${HEIGHT}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    const g = gamma(beta);
    const tauTraveler = travelerProperTime(T_HOME_YEARS, beta);
    const delta = ageDifference(T_HOME_YEARS, beta);

    // Bar layout: years on horizontal axis from 0 to T_HOME (cyan bar maxes out).
    const plotX = PAD_X + 60;
    const plotW = WIDTH - plotX - PAD_X;
    const yearsToPx = (yrs: number) => plotX + (yrs / T_HOME_YEARS) * plotW;

    // Tick marks (every 2 years)
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.lineWidth = 1;
    ctx.font = "10px ui-monospace, monospace";
    ctx.fillStyle = "rgba(255,255,255,0.45)";
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
    ctx.fillStyle = "rgba(103, 232, 249, 0.18)";
    ctx.fillRect(plotX, homeY, plotW, barH);
    ctx.fillStyle = "#67E8F9";
    ctx.fillRect(plotX, homeY, yearsToPx(T_HOME_YEARS) - plotX, barH);
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "11px ui-monospace, monospace";
    ctx.textAlign = "right";
    ctx.fillText("HOME", plotX - 8, homeY + barH / 2 + 4);
    ctx.textAlign = "left";
    ctx.fillStyle = "#0A0C12";
    ctx.font = "12px ui-monospace, monospace";
    ctx.fillText(
      `${T_HOME_YEARS.toFixed(1)} yr`,
      plotX + 8,
      homeY + barH / 2 + 4,
    );

    // Traveler bar (orange), bottom
    const travY = homeY + barH + 18;
    ctx.fillStyle = "rgba(255, 179, 107, 0.18)";
    ctx.fillRect(plotX, travY, plotW, barH);
    ctx.fillStyle = "#FFB36B";
    ctx.fillRect(plotX, travY, yearsToPx(tauTraveler) - plotX, barH);
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "11px ui-monospace, monospace";
    ctx.textAlign = "right";
    ctx.fillText("TRAVELER", plotX - 8, travY + barH / 2 + 4);
    ctx.textAlign = "left";
    ctx.fillStyle = "#0A0C12";
    ctx.font = "12px ui-monospace, monospace";
    ctx.fillText(
      `${tauTraveler.toFixed(2)} yr`,
      plotX + 8,
      travY + barH / 2 + 4,
    );

    // HUD
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "11px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText(`β = ${beta.toFixed(3)}`, PAD_X, 18);
    ctx.fillText(`γ = ${g.toFixed(3)}`, PAD_X + 110, 18);
    ctx.fillText(
      `Δ = ${delta.toFixed(2)} yr younger`,
      PAD_X + 220,
      18,
    );
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.fillText("years (lab-frame T_home = 10)", PAD_X, HEIGHT - 8);
  }, [beta]);

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas ref={canvasRef} className="rounded-md border border-white/10 bg-black/40" />
      <label className="flex w-full max-w-[640px] items-center gap-3 font-mono text-xs text-white/70">
        <span className="w-20">β = {beta.toFixed(2)}</span>
        <input
          type="range"
          min={0}
          max={0.99}
          step={0.01}
          value={beta}
          onChange={(e) => setBeta(parseFloat(e.target.value))}
          className="flex-1"
        />
        <span className="w-28">γ = {gamma(beta).toFixed(3)}</span>
      </label>
    </div>
  );
}
