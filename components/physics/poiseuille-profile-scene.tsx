"use client";

import { useEffect, useRef, useState } from "react";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  poiseuilleCentrelineVelocity,
  poiseuilleMeanVelocity,
  poiseuilleVelocity,
} from "@/lib/physics/viscosity";

const RATIO = 0.48;
const MAX_HEIGHT = 360;

// Scene parameters. The slider controls viscosity on a log scale across a
// range that covers water (1e-3 Pa·s) up to honey (~10 Pa·s) — a factor of
// 10 000. Radius and pressure gradient stay fixed so the slider's effect is
// isolated to the one quantity the reader is thinking about.
const RADIUS = 0.01; // 1 cm pipe
const DPDX = 200; // Pa/m pressure gradient

export interface PoiseuilleProfileSceneProps {
  initialViscosity?: number;
}

export function PoiseuilleProfileScene({
  initialViscosity = 1e-3,
}: PoiseuilleProfileSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [eta, setEta] = useState(initialViscosity);
  const [size, setSize] = useState({ width: 640, height: 320 });

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

  useEffect(() => {
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

    // --- Pipe geometry ------------------------------------------------------
    const padL = 48;
    const padR = 24;
    const padT = 28;
    const padB = 40;

    const pipeLeft = padL;
    const pipeRight = width - padR;
    const pipeW = pipeRight - pipeLeft;
    const pipeMidY = padT + (height - padT - padB) / 2;
    const pipeHalfH = Math.min(90, (height - padT - padB) / 2 - 4);

    // Pipe walls (top and bottom)
    ctx.strokeStyle = colors.fg2;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pipeLeft, pipeMidY - pipeHalfH);
    ctx.lineTo(pipeRight, pipeMidY - pipeHalfH);
    ctx.moveTo(pipeLeft, pipeMidY + pipeHalfH);
    ctx.lineTo(pipeRight, pipeMidY + pipeHalfH);
    ctx.stroke();

    // --- Parabolic profile envelope ----------------------------------------
    const umax = poiseuilleCentrelineVelocity(RADIUS, DPDX, eta);
    // Visual scaling: always draw so the centreline arrow reaches the
    // available horizontal budget at the lowest viscosity. Reference eta =
    // 1e-3 (water) gives umax = 0.005 m/s for our pipe/dp choice. We cap the
    // arrow at a fixed pixel length and shrink proportionally for thicker
    // fluids, so honey looks like a trickle and water looks like a gush.
    const uRef = poiseuilleCentrelineVelocity(RADIUS, DPDX, 1e-3);
    const maxArrow = Math.min(220, pipeW * 0.42);
    const pxPerUnit = maxArrow / uRef;

    // Origin of velocity arrows — a vertical line near the pipe midpoint.
    const originX = pipeLeft + pipeW * 0.3;

    // Profile curve — draw once as a filled parabolic region for visual
    // emphasis, then overlay a crisp outline.
    const samples = 80;
    ctx.fillStyle = "rgba(111, 184, 198, 0.18)";
    ctx.beginPath();
    ctx.moveTo(originX, pipeMidY - pipeHalfH);
    for (let i = 0; i <= samples; i++) {
      const y = -pipeHalfH + (2 * pipeHalfH * i) / samples;
      const r = Math.abs(y / pipeHalfH) * RADIUS;
      const u = poiseuilleVelocity(r, RADIUS, DPDX, eta);
      const px = originX + u * pxPerUnit;
      ctx.lineTo(px, pipeMidY + y);
    }
    ctx.lineTo(originX, pipeMidY + pipeHalfH);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#6FB8C6";
    ctx.lineWidth = 1.75;
    ctx.beginPath();
    for (let i = 0; i <= samples; i++) {
      const y = -pipeHalfH + (2 * pipeHalfH * i) / samples;
      const r = Math.abs(y / pipeHalfH) * RADIUS;
      const u = poiseuilleVelocity(r, RADIUS, DPDX, eta);
      const px = originX + u * pxPerUnit;
      if (i === 0) ctx.moveTo(px, pipeMidY + y);
      else ctx.lineTo(px, pipeMidY + y);
    }
    ctx.stroke();

    // Velocity arrows — one per band, length proportional to local u.
    const arrowRows = 9;
    ctx.strokeStyle = "#6FB8C6";
    ctx.fillStyle = "#6FB8C6";
    ctx.lineWidth = 1.25;
    for (let i = 0; i < arrowRows; i++) {
      const frac = (i + 0.5) / arrowRows; // 0..1
      const y = -pipeHalfH + 2 * pipeHalfH * frac;
      const r = Math.abs(y / pipeHalfH) * RADIUS;
      const u = poiseuilleVelocity(r, RADIUS, DPDX, eta);
      const len = u * pxPerUnit;
      const rowY = pipeMidY + y;
      if (len < 1) continue;
      ctx.beginPath();
      ctx.moveTo(originX, rowY);
      ctx.lineTo(originX + len, rowY);
      ctx.stroke();
      // Arrowhead
      const head = 5;
      ctx.beginPath();
      ctx.moveTo(originX + len, rowY);
      ctx.lineTo(originX + len - head, rowY - head / 2);
      ctx.lineTo(originX + len - head, rowY + head / 2);
      ctx.closePath();
      ctx.fill();
    }

    // Axis line at origin
    ctx.strokeStyle = colors.fg3;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.moveTo(originX, pipeMidY - pipeHalfH);
    ctx.lineTo(originX, pipeMidY + pipeHalfH);
    ctx.stroke();
    ctx.setLineDash([]);

    // No-slip labels at the walls
    ctx.fillStyle = colors.fg2;
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    ctx.fillText("u = 0   (no-slip)", originX + maxArrow / 2, pipeMidY - pipeHalfH - 6);
    ctx.fillText("u = 0   (no-slip)", originX + maxArrow / 2, pipeMidY + pipeHalfH + 14);

    // r axis on the left — ticks at ±R and 0
    ctx.strokeStyle = colors.fg3;
    ctx.beginPath();
    ctx.moveTo(pipeLeft - 12, pipeMidY - pipeHalfH);
    ctx.lineTo(pipeLeft - 6, pipeMidY - pipeHalfH);
    ctx.moveTo(pipeLeft - 12, pipeMidY);
    ctx.lineTo(pipeLeft - 6, pipeMidY);
    ctx.moveTo(pipeLeft - 12, pipeMidY + pipeHalfH);
    ctx.lineTo(pipeLeft - 6, pipeMidY + pipeHalfH);
    ctx.stroke();
    ctx.fillStyle = colors.fg2;
    ctx.textAlign = "right";
    ctx.fillText("+R", pipeLeft - 14, pipeMidY - pipeHalfH + 3);
    ctx.fillText("0", pipeLeft - 14, pipeMidY + 3);
    ctx.fillText("−R", pipeLeft - 14, pipeMidY + pipeHalfH + 3);

    // Numeric readouts
    const umaxNow = umax;
    const umeanNow = poiseuilleMeanVelocity(RADIUS, DPDX, eta);
    ctx.fillStyle = colors.fg1;
    ctx.font = "11px monospace";
    ctx.textAlign = "right";
    ctx.fillText(
      `u_max = ${formatVelocity(umaxNow)}`,
      pipeRight,
      padT - 10,
    );
    ctx.fillText(
      `u_mean = ${formatVelocity(umeanNow)}   (half of peak)`,
      pipeRight,
      height - padB + 18,
    );
  }, [eta, size, colors]);

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-2 flex flex-col gap-2 px-2">
        <div className="flex items-center gap-3">
          <label className="w-28 text-sm text-[var(--color-fg-3)]">
            Viscosity η
          </label>
          <input
            type="range"
            min={-4}
            max={1.2}
            step={0.05}
            value={Math.log10(eta)}
            onChange={(e) => setEta(Math.pow(10, parseFloat(e.target.value)))}
            className="flex-1 accent-[#6FB8C6]"
          />
          <span className="w-28 text-right text-sm font-mono text-[var(--color-fg-1)]">
            {formatViscosity(eta)}
          </span>
        </div>
        <p className="px-1 text-xs text-[var(--color-fg-3)]">
          Same pipe, same pressure push. The profile is always a parabola —
          zero at the wall, maximum on the axis. Slide from air (~10⁻⁵ Pa·s)
          through water (10⁻³) to honey (~10). Thicker fluid, slower flow.
        </p>
      </div>
    </div>
  );
}

function formatViscosity(eta: number): string {
  if (eta >= 1) return `${eta.toFixed(2)} Pa·s`;
  if (eta >= 1e-2) return `${(eta * 1e3).toFixed(1)} mPa·s`;
  if (eta >= 1e-4) return `${(eta * 1e3).toFixed(2)} mPa·s`;
  return `${(eta * 1e6).toFixed(1)} µPa·s`;
}

function formatVelocity(u: number): string {
  if (Math.abs(u) >= 1) return `${u.toFixed(2)} m/s`;
  if (Math.abs(u) >= 1e-3) return `${(u * 1000).toFixed(2)} mm/s`;
  return `${(u * 1e6).toFixed(1)} µm/s`;
}
