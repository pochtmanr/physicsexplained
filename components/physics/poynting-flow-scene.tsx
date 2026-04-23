"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { planeWaveB0, planeWaveIntensity } from "@/lib/physics/electromagnetism/poynting";

const RATIO = 0.55;
const MAX_HEIGHT = 360;
const E0_MIN = 100; // V/m — low amplitude
const E0_MAX = 3000; // V/m — bright, but still sub-lightning

/**
 * FIG.36a — a plane electromagnetic wave moving to the right.
 *
 * Visualises the E × B = S perpendicularity: magenta E in the vertical
 * plane, cyan B in the horizontal plane, lilac S pointing along +x̂.
 * Everything oscillates in phase. The reader drags the amplitude slider
 * and watches the intensity I = ½·E₀²/(μ₀c) track as the square.
 *
 * Colour palette:
 *   #FF6ADE magenta — E field (up/down in y)
 *   rgba(120,220,255,…) cyan — B field (in/out along z)
 *   rgba(200,160,255,…) lilac — S vector, along +x̂ (propagation)
 *
 * No slider for B₀ — the plane-wave relation B₀ = E₀/c is locked in.
 * This is the "everything perpendicular to everything, energy still
 * flows" primitive the topic hangs on.
 */
export function PoyntingFlowScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 640, height: 360 });
  const [E0, setE0] = useState(1200);

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

      // ── Layout ──
      const padTop = 36;
      const padBottom = 54;
      const padL = 48;
      const padR = 24;
      const axisY = (padTop + (height - padBottom)) / 2;
      const axisX0 = padL;
      const axisX1 = width - padR;
      const axisLen = axisX1 - axisX0;
      const ampY = ((height - padBottom) - padTop) * 0.38;

      // Normalise amplitude for drawing (clamped so it doesn't blow out)
      const ampFrac = (E0 - E0_MIN) / (E0_MAX - E0_MIN);
      const ampScale = 0.35 + 0.65 * ampFrac;

      // ── Propagation axis ──
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(axisX0, axisY);
      ctx.lineTo(axisX1, axisY);
      ctx.stroke();
      ctx.setLineDash([]);

      // ── Wave parameters ──
      const wavelengthPx = axisLen / 2.2; // 2.2 waves across canvas
      const k = (2 * Math.PI) / wavelengthPx;
      const omega = 1.2; // screen rad/s; purely cosmetic
      const phase = -omega * t;

      // ── Draw E field as vertical magenta arrows at sampled x ──
      const samples = 28;
      const dx = axisLen / samples;
      for (let i = 0; i <= samples; i++) {
        const x = axisX0 + i * dx;
        const s = Math.sin(k * (x - axisX0) + phase);
        const eLen = s * ampY * ampScale;
        drawArrow(
          ctx,
          x,
          axisY,
          x,
          axisY - eLen,
          "#FF6ADE",
          0.55 + 0.35 * Math.abs(s),
          1.6,
        );
      }

      // ── Draw B field as cyan in/out circles along the axis ──
      for (let i = 0; i <= samples; i++) {
        const x = axisX0 + i * dx;
        const s = Math.sin(k * (x - axisX0) + phase);
        const mag = Math.abs(s) * ampScale;
        const R = 3.2 + mag * 5.5;
        const alpha = 0.45 + 0.45 * Math.abs(s);
        ctx.strokeStyle = `rgba(120, 220, 255, ${alpha.toFixed(3)})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(x, axisY + 3, R, 0, Math.PI * 2);
        ctx.stroke();
        // Dot (out of page) when s > 0, cross (into page) when s < 0
        ctx.fillStyle = `rgba(120, 220, 255, ${alpha.toFixed(3)})`;
        if (s > 0) {
          ctx.beginPath();
          ctx.arc(x, axisY + 3, Math.max(1.3, R * 0.22), 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.moveTo(x - R * 0.55, axisY + 3 - R * 0.55);
          ctx.lineTo(x + R * 0.55, axisY + 3 + R * 0.55);
          ctx.moveTo(x + R * 0.55, axisY + 3 - R * 0.55);
          ctx.lineTo(x - R * 0.55, axisY + 3 + R * 0.55);
          ctx.stroke();
        }
      }

      // ── Draw S vector as lilac arrows along the axis (always +x̂) ──
      const nS = 6;
      for (let i = 0; i < nS; i++) {
        const frac = (i + 0.5) / nS;
        const x = axisX0 + frac * axisLen - 18;
        // animated stripe: intensity modulates with sin² of phase at that x
        const s = Math.sin(k * (x - axisX0) + phase);
        const intens = s * s;
        const alpha = 0.35 + 0.55 * intens;
        drawArrow(
          ctx,
          x,
          axisY - 2,
          x + 36,
          axisY - 2,
          `rgba(200, 160, 255, ${alpha.toFixed(3)})`,
          1,
          2.2,
        );
      }

      // ── Axis labels & axes badge ──
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.textAlign = "right";
      ctx.fillText("E ↑ (magenta)", axisX0 - 6, axisY - 4);
      ctx.fillText("B ⊙ (cyan)", axisX0 - 6, axisY + 12);
      ctx.textAlign = "left";
      ctx.fillText("→ S = (1/μ₀) E×B", axisX1 - 140, axisY - 16);

      // ── HUD ──
      const I = planeWaveIntensity(E0);
      const B0 = planeWaveB0(E0);
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`E₀ = ${E0.toFixed(0)} V/m`, padL, 22);
      ctx.fillText(`B₀ = ${(B0 * 1e9).toFixed(2)} nT`, padL + 180, 22);
      ctx.textAlign = "right";
      ctx.fillText(`I = ${formatIntensity(I)}`, axisX1, 22);

      // Footer note
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        `E⊥B⊥S · propagation along +x̂ · I ∝ E₀²`,
        width / 2,
        height - 28,
      );
      ctx.fillStyle = "rgba(200, 160, 255, 0.85)";
      ctx.font = "10px monospace";
      ctx.fillText(
        `solar constant ≈ 1.36 kW/m² for scale`,
        width / 2,
        height - 14,
      );

      // Right-hand-rule badge bottom-right
      drawAxesBadge(ctx, width - 60, height - 24, colors);
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
        <label className="w-8 text-[var(--color-fg-3)]">E₀</label>
        <input
          type="range"
          min={E0_MIN}
          max={E0_MAX}
          step={10}
          value={E0}
          onChange={(e) => setE0(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "#FF6ADE" }}
        />
        <span className="w-24 text-right text-[var(--color-fg-1)]">
          {E0.toFixed(0)} V/m
        </span>
      </div>
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
  alpha: number,
  width: number,
) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  if (len < 0.5) return;
  const ux = dx / len;
  const uy = dy / len;
  const head = Math.min(6, len * 0.45);
  const strokeAlpha = Math.max(0, Math.min(1, alpha));
  // support explicit rgba color strings or plain hex
  ctx.strokeStyle =
    color.startsWith("rgba(") || color.startsWith("rgb(")
      ? color
      : applyAlpha(color, strokeAlpha);
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  // arrowhead
  const nx = -uy;
  const ny = ux;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - ux * head + nx * head * 0.5, y1 - uy * head + ny * head * 0.5);
  ctx.lineTo(x1 - ux * head - nx * head * 0.5, y1 - uy * head - ny * head * 0.5);
  ctx.closePath();
  ctx.fill();
}

function applyAlpha(hex: string, alpha: number): string {
  // #RRGGBB → rgba()
  if (!hex.startsWith("#") || hex.length !== 7) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
}

function drawAxesBadge(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  colors: { fg2: string; fg3: string },
) {
  const len = 16;
  ctx.strokeStyle = colors.fg2;
  ctx.fillStyle = colors.fg2;
  ctx.lineWidth = 1.1;
  // x̂ right (S direction)
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(ox + len, oy);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(ox + len, oy);
  ctx.lineTo(ox + len - 3, oy - 3);
  ctx.lineTo(ox + len - 3, oy + 3);
  ctx.closePath();
  ctx.fill();
  ctx.font = "10px monospace";
  ctx.fillText("S", ox + len + 3, oy + 3);
  // ŷ up (E direction)
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(ox, oy - len);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(ox, oy - len);
  ctx.lineTo(ox - 3, oy - len + 3);
  ctx.lineTo(ox + 3, oy - len + 3);
  ctx.closePath();
  ctx.fill();
  ctx.fillText("E", ox - 10, oy - len + 2);
  // B out of page
  ctx.strokeStyle = "rgba(120, 220, 255, 0.85)";
  const bx = ox + 10;
  const by = oy - 12;
  ctx.beginPath();
  ctx.arc(bx, by, 4.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "rgba(120, 220, 255, 0.85)";
  ctx.beginPath();
  ctx.arc(bx, by, 1.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.fg3;
  ctx.font = "10px monospace";
  ctx.fillText("B⊙", ox + 17, oy - 9);
}

function formatIntensity(I: number): string {
  if (I >= 1e6) return `${(I / 1e6).toFixed(2)} MW/m²`;
  if (I >= 1e3) return `${(I / 1e3).toFixed(2)} kW/m²`;
  if (I >= 1) return `${I.toFixed(2)} W/m²`;
  return `${(I * 1e3).toFixed(2)} mW/m²`;
}
