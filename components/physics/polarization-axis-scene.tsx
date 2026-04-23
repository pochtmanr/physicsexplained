"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.55;
const MAX_HEIGHT = 400;

const MAGENTA = "rgba(255, 100, 200,";
const AMBER = "rgba(255, 180, 80,";
const GREEN = "rgba(120, 255, 170,";

/**
 * FIG.39b — Malus's law, in motion.
 *
 * An unpolarised beam enters from the left. A linear polariser fixed at
 * angle α sets the incoming polarisation. A second polariser — the
 * analyser — rotates at angle θ. The transmitted intensity follows
 *
 *   I(θ) = I₀ · cos²(θ − α)
 *
 * Etienne-Louis Malus wrote this down in 1809 while watching sunlight
 * reflect off a Parisian building at sunset. The analyser angle θ is
 * user-controlled; the bar on the right shows I/I₀ and the small plot
 * traces cos²(θ − α) with the current operating point marked.
 */
export function PolarizationAxisScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 720, height: 400 });
  const [analyserDeg, setAnalyserDeg] = useState(30);
  const polariserDeg = 0; // α — first polariser is fixed along the lab x-axis.

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

      const cy = height * 0.48;
      const beamLeft = 20;
      const beamRight = width * 0.62;
      const polariserX = width * 0.24;
      const analyserX = width * 0.46;

      const alpha = (polariserDeg * Math.PI) / 180;
      const theta = (analyserDeg * Math.PI) / 180;
      const transmitted = Math.cos(theta - alpha) ** 2;
      // The "½" factor from unpolarised → linear has already been applied
      // logically; we display I/I₀ post-first-polariser = cos²(θ − α).

      // ─── Unpolarised beam (left segment) ─────────────────────────────
      // Many arrows at random angles, moving.
      const speed = 80;
      const segLen1 = polariserX - beamLeft;
      const nIncoming = 16;
      for (let i = 0; i < nIncoming; i++) {
        const phase = ((t * speed + (i * segLen1) / nIncoming) % segLen1);
        const x = beamLeft + phase;
        const ang = (i * 0.73 + t * 2.1) % (2 * Math.PI);
        const len = 10;
        const alphaAmber = (0.5 + 0.3 * Math.sin(i + t)).toFixed(3);
        ctx.strokeStyle = `${AMBER} ${alphaAmber})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x - (Math.cos(ang) * len) / 2, cy - (Math.sin(ang) * len) / 2);
        ctx.lineTo(x + (Math.cos(ang) * len) / 2, cy + (Math.sin(ang) * len) / 2);
        ctx.stroke();
      }

      // ─── First polariser (at angle α) ─────────────────────────────────
      drawPolariser(ctx, polariserX, cy, alpha, "polariser", `${MAGENTA} 0.95)`);

      // ─── Linear beam (middle segment) ─────────────────────────────────
      const segLen2 = analyserX - polariserX;
      const nMid = 8;
      for (let i = 0; i < nMid; i++) {
        const phase = ((t * speed + (i * segLen2) / nMid) % segLen2);
        const x = polariserX + phase;
        const len = 14;
        ctx.strokeStyle = `${MAGENTA} 0.85)`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x - (Math.cos(alpha) * len) / 2, cy - (Math.sin(alpha) * len) / 2);
        ctx.lineTo(x + (Math.cos(alpha) * len) / 2, cy + (Math.sin(alpha) * len) / 2);
        ctx.stroke();
      }

      // ─── Analyser (at angle θ) ────────────────────────────────────────
      drawPolariser(ctx, analyserX, cy, theta, "analyser", `${GREEN} 0.95)`);

      // ─── Transmitted beam (right of analyser) ────────────────────────
      // Amplitude scales with cos(θ − α); intensity with its square. We
      // taper the arrow length with cos(θ − α) so the visual magnitude
      // matches the amplitude.
      const ampScale = Math.abs(Math.cos(theta - alpha));
      const segLen3 = beamRight - analyserX;
      if (ampScale > 0.03) {
        const nOut = 6;
        for (let i = 0; i < nOut; i++) {
          const phase = ((t * speed + (i * segLen3) / nOut) % segLen3);
          const x = analyserX + phase;
          const len = 14 * ampScale;
          ctx.strokeStyle = `${GREEN} 0.9)`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x - (Math.cos(theta) * len) / 2, cy - (Math.sin(theta) * len) / 2);
          ctx.lineTo(x + (Math.cos(theta) * len) / 2, cy + (Math.sin(theta) * len) / 2);
          ctx.stroke();
        }
      }

      // ─── Intensity bar (right side) ──────────────────────────────────
      const barX = width * 0.68;
      const barY0 = cy - 90;
      const barH = 180;
      const barW = 22;
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY0, barW, barH);
      const fillH = barH * transmitted;
      ctx.fillStyle = `${GREEN} 0.7)`;
      ctx.fillRect(barX, barY0 + (barH - fillH), barW, fillH);
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`I / I₀ = ${transmitted.toFixed(3)}`, barX + barW + 8, barY0 + 10);
      ctx.fillText(`cos²(θ − α)`, barX + barW + 8, barY0 + 24);

      // ─── cos²(θ − α) curve ───────────────────────────────────────────
      const plotX0 = width * 0.68 + 80;
      const plotY0 = cy + 18;
      const plotW = Math.max(100, width - plotX0 - 16);
      const plotH = 68;
      ctx.strokeStyle = colors.fg3;
      ctx.strokeRect(plotX0, plotY0, plotW, plotH);
      ctx.strokeStyle = `${GREEN} 0.7)`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      const nPts = 90;
      for (let i = 0; i <= nPts; i++) {
        const th = (i / nPts) * Math.PI; // 0..180°
        const I = Math.cos(th - alpha) ** 2;
        const px = plotX0 + (th / Math.PI) * plotW;
        const py = plotY0 + plotH - I * plotH;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Operating point dot
      const opX = plotX0 + ((theta % Math.PI) / Math.PI) * plotW;
      const opY = plotY0 + plotH - transmitted * plotH;
      ctx.fillStyle = `${GREEN} 0.95)`;
      ctx.beginPath();
      ctx.arc(opX, opY, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = colors.fg2;
      ctx.textAlign = "left";
      ctx.fillText("θ", plotX0 + plotW - 10, plotY0 + plotH - 3);

      // Caption
      ctx.textAlign = "left";
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.fillText("FIG.39b · Malus's law — analyser rotates, intensity follows", 12, 18);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-3 grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2 px-2 text-sm">
        <label className="text-[var(--color-fg-3)]">Analyser angle θ</label>
        <input
          type="range"
          min={0}
          max={180}
          step={1}
          value={analyserDeg}
          onChange={(e) => setAnalyserDeg(parseFloat(e.target.value))}
          className="accent-[rgb(120,255,170)]"
        />
        <span className="w-16 text-right font-mono text-[var(--color-fg-1)]">
          {analyserDeg.toFixed(0)}°
        </span>
      </div>
    </div>
  );
}

function drawPolariser(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  angleRad: number,
  label: string,
  strokeCss: string,
) {
  const R = 40;
  ctx.save();
  // Ring
  ctx.strokeStyle = strokeCss;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.stroke();

  // Transmission axis lines
  ctx.lineWidth = 1.2;
  const nLines = 7;
  for (let i = 0; i < nLines; i++) {
    const offset = ((i / (nLines - 1)) - 0.5) * 2 * R * 0.85;
    // Lines are perpendicular to angleRad in the filter face
    const dirX = Math.cos(angleRad);
    const dirY = Math.sin(angleRad);
    const perpX = -dirY;
    const perpY = dirX;
    // Line along `dir`, offset by perp*offset
    const cxLine = cx + perpX * offset;
    const cyLine = cy + perpY * offset;
    const lineHalf = Math.sqrt(Math.max(0, R * R - offset * offset));
    const x0 = cxLine - dirX * lineHalf;
    const y0 = cyLine - dirY * lineHalf;
    const x1 = cxLine + dirX * lineHalf;
    const y1 = cyLine + dirY * lineHalf;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }

  // Label
  ctx.fillStyle = strokeCss;
  ctx.font = "10px monospace";
  ctx.textAlign = "center";
  ctx.fillText(label, cx, cy + R + 14);
  ctx.restore();
}
