"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { SPEED_OF_LIGHT } from "@/lib/physics/constants";
import {
  gamma,
  transformFields,
} from "@/lib/physics/electromagnetism/relativity";

/**
 * FIG.59a — Two-panel side-by-side comparison of the EM field in the lab
 * frame and in a frame boosted along +x by β.
 *
 * Lab (left panel):
 *   · Pure magnetic field, B = (0, 0, B0), out of the page (cyan ⊙ glyphs).
 *   · No electric field at all.
 *
 * Boost (right panel):
 *   · B'_z = γ B_z (cyan ⊙, slightly stronger glyph due to γ).
 *   · E'_y = -γ v B_z (magenta arrows pointing in the new electric direction).
 *   · The boost direction is shown by an amber arrow at the top.
 *
 * The slider controls β from 0 → 0.9. The HUD prints the current
 * closed-form values of E' and B' computed by `transformFields`.
 *
 * Palette:
 *   cyan    — magnetic field B and B'
 *   magenta — induced electric field E'
 *   amber   — boost direction indicator
 */

const RATIO = 0.5;
const MAX_HEIGHT = 360;

const B0 = 1; // tesla, lab-frame B_z magnitude
const C = SPEED_OF_LIGHT;

export function BoostMixingEBScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();

  const [beta, setBeta] = useState(0.5);
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
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
      }
      ctx.clearRect(0, 0, width, height);

      const b = betaRef.current;
      const g = gamma(b);
      const v = b * C;

      // Closed-form: lab is pure B_z = B0; boost along +x by β.
      const E = { x: 0, y: 0, z: 0 };
      const B = { x: 0, y: 0, z: B0 };
      const { E: Ep, B: Bp } = transformFields(E, B, b);

      const halfW = width * 0.5;
      const cyL = height * 0.5;
      const cyR = height * 0.5;
      const cxL = halfW * 0.5;
      const cxR = halfW + halfW * 0.5;

      // ── divider ──
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(halfW, 28);
      ctx.lineTo(halfW, height - 12);
      ctx.stroke();

      // ── headers ──
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "center";
      ctx.fillText("LAB FRAME", cxL, 18);
      ctx.fillText(`BOOSTED FRAME · β = ${b.toFixed(2)}`, cxR, 18);

      // ── boost-direction indicator (amber arrow at top of right panel) ──
      const aColor = "rgba(255, 180, 80, 0.95)";
      drawArrow(
        ctx,
        cxR - 60,
        34,
        cxR + 60,
        34,
        aColor,
        2,
      );
      ctx.fillStyle = aColor;
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillText("v = βc", cxR, 50);

      // ── LEFT PANEL: pure B_z out of the page ──
      drawBOutOfPageGrid(ctx, cxL, cyL, halfW * 0.7, height * 0.55, B.z, B0, "cyan");
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillText("B = (0, 0, B₀) ⊙", cxL, height - 28);
      ctx.fillText("E = 0", cxL, height - 14);

      // ── RIGHT PANEL: B'_z out of page (cyan) + E'_y arrows (magenta) ──
      drawBOutOfPageGrid(ctx, cxR, cyR, halfW * 0.7, height * 0.55, Bp.z, B0, "cyan");

      // E' arrows pointing in the y-direction. E'_y = γ(E_y - v B_z) = -γ v B_z.
      // For positive β and B_z, that is negative, so arrows point in -y (down on canvas).
      const Epy = Ep.y;
      const eMaxRef = g * v * B0; // reference magnitude for normalization at β
      const eFracRaw = Math.abs(Epy) / Math.max(eMaxRef, 1e-30);
      // Use β itself as a visibility scale so at β=0 there are no arrows.
      const eFrac = b < 0.001 ? 0 : Math.min(1, eFracRaw);
      const eDir = Epy >= 0 ? -1 : 1; // canvas-y is down
      drawEArrowsField(ctx, cxR, cyR, halfW * 0.7, height * 0.55, eDir, eFrac, t);

      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`B' = (0, 0, ${(Bp.z / B0).toFixed(2)} B₀) ⊙`, cxR, height - 28);
      ctx.fillText(
        `E'_y = -γβc·B₀ = ${formatSci(Epy)} V/m`,
        cxR,
        height - 14,
      );

      // ── HUD top-right ──
      ctx.fillStyle = colors.fg1;
      ctx.textAlign = "right";
      ctx.font = "11px monospace";
      ctx.fillText(`γ = ${g.toFixed(3)}`, width - 14, 18);
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
        <span className="w-16 text-right text-sm font-mono text-[var(--color-fg-1)]">
          β = {beta.toFixed(2)}
        </span>
      </div>
      <div className="mt-1 px-2 text-xs text-[var(--color-fg-3)]">
        Lab frame holds a pure B-field out of the page. In any boosted frame, the
        same configuration is a stronger B' plus a fresh E' perpendicular to both
        boost and B.
      </div>
    </div>
  );
}

function drawBOutOfPageGrid(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  W: number,
  H: number,
  Bz: number,
  Bref: number,
  _color: "cyan",
) {
  // 5 × 4 grid of "⊙" glyphs whose alpha tracks |Bz|/|Bref|.
  const cols = 5;
  const rows = 4;
  const dx = W / (cols + 1);
  const dy = H / (rows + 1);
  const x0 = cx - W * 0.5 + dx;
  const y0 = cy - H * 0.5 + dy;

  const mag = Math.min(1, Math.abs(Bz) / Math.max(Math.abs(Bref), 1e-30));
  const alpha = 0.35 + 0.55 * mag;
  const r = 5 + 4 * mag;
  ctx.strokeStyle = `rgba(111, 184, 198, ${alpha.toFixed(3)})`;
  ctx.fillStyle = `rgba(111, 184, 198, ${(alpha * 0.6).toFixed(3)})`;
  ctx.lineWidth = 1.4;

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const x = x0 + i * dx;
      const y = y0 + j * dy;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();
      // central dot to indicate "out of page"
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawEArrowsField(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  W: number,
  H: number,
  dir: 1 | -1,
  frac: number,
  t: number,
) {
  if (frac <= 0) return;
  const cols = 5;
  const dx = W / (cols + 1);
  const x0 = cx - W * 0.5 + dx;
  // place a row of arrows just below the B-grid
  const yBase = cy + H * 0.5 - 18;
  const len = 30 + 26 * frac;
  const pulse = 0.6 + 0.4 * Math.sin(t * 2.0);
  const alpha = (0.55 + 0.4 * pulse) * Math.max(0.25, frac);

  for (let i = 0; i < cols; i++) {
    const x = x0 + i * dx;
    const y0a = yBase - len * 0.5 * dir;
    const y1a = yBase + len * 0.5 * dir;
    drawArrow(
      ctx,
      x,
      y0a,
      x,
      y1a,
      `rgba(255, 106, 222, ${alpha.toFixed(3)})`,
      2,
    );
  }
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
  const head = Math.min(8, len * 0.35);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  const nx = -uy;
  const ny = ux;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(
    x1 - ux * head + nx * head * 0.5,
    y1 - uy * head + ny * head * 0.5,
  );
  ctx.lineTo(
    x1 - ux * head - nx * head * 0.5,
    y1 - uy * head - ny * head * 0.5,
  );
  ctx.closePath();
  ctx.fill();
}

function formatSci(v: number): string {
  if (Math.abs(v) < 1e-30) return "0";
  const sign = v < 0 ? "-" : "";
  const a = Math.abs(v);
  const exp = Math.floor(Math.log10(a));
  const mant = a / Math.pow(10, exp);
  return `${sign}${mant.toFixed(2)}e${exp >= 0 ? "+" : ""}${exp}`;
}
