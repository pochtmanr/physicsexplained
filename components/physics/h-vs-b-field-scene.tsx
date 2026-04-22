"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  hFromBM,
  bFromHLinear,
  linearMagnetization,
} from "@/lib/physics/electromagnetism/magnetization";

/**
 * FIG.17b — the two-panel H-vs-B contrast.
 *
 * A long solenoid surrounds a linear magnetic core with relative permeability
 * μ_r. The core can be slid left or right with a slider — in, out, or half-in.
 *
 * Top panel:    the B-field lines (cyan). They are *continuous* across the
 *               core/air boundary but visibly denser inside the core, because
 *               the bound currents of the magnetised core add to the free
 *               solenoid current's contribution.
 *
 * Bottom panel: the H-field lines (amber). They are *identical inside and out*
 *               in strength, because H cares only about the solenoid's free
 *               current (N·I per metre). Where the core ends, you can see the
 *               "bound magnetic pole" glow on the face.
 *
 * The live HUD shows H, M, and B in the core and outside. Plain-words takeaway:
 * the solenoid is what you control; H is the field the solenoid would make on
 * its own; B includes the material's contribution.
 */

const CYAN = "rgba(120, 220, 255, 0.9)";
const AMBER = "rgba(255, 214, 107, 0.9)";
const FIELD_LINE_B = "rgba(120, 220, 255, 0.7)";
const FIELD_LINE_H = "rgba(255, 214, 107, 0.7)";
const MAGENTA = "#FF6ADE";

const RATIO = 0.72;
const MAX_HEIGHT = 520;

export function HVsBFieldScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 700, height: 500 });
  const [chi, setChi] = useState(400); // relative susceptibility; μ_r = chi + 1
  const [corePos, setCorePos] = useState(0.5); // 0 = core fully left of solenoid, 1 = fully inside right side

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

      const panelH = height / 2;
      const margin = 14;

      // Solenoid geometry — same for both panels
      const solLeft = width * 0.18;
      const solRight = width * 0.82;
      const solW = solRight - solLeft;
      const solYCenterTop = panelH * 0.5;
      const solYCenterBot = panelH * 1.5;
      const solHalfH = panelH * 0.22;

      // Core — linear material. `corePos` slides it in from the right.
      // When corePos = 0: core sits mostly to the left of the solenoid (small overlap).
      // When corePos = 1: core fills the right half of the solenoid.
      const coreLen = solW * 0.55;
      const coreLeftWhenOut = solLeft - coreLen * 0.25;
      const coreLeftWhenIn = solLeft + solW * 0.28;
      const coreLeft =
        coreLeftWhenOut + (coreLeftWhenIn - coreLeftWhenOut) * corePos;
      const coreRight = coreLeft + coreLen;

      // Field magnitudes (scene units).
      // Treat H as constant along the axis inside the solenoid, H = n·I.
      const H_inside = 1.0; // a.u. — solenoid free current per unit length
      const H_outside = 0.02; // weak fringe for visual interest
      const M_inside_core = linearMagnetization(H_inside, chi);
      const B_inside_core = bFromHLinear(H_inside, chi); // SI-scaled, but used for relative thickness
      const B_inside_air = bFromHLinear(H_inside, 0);
      // H reconstructed from B and M — confirms H = B/μ₀ − M for the reader.
      const H_recomputed = hFromBM(B_inside_core, M_inside_core);

      // ── TOP PANEL : B ──
      drawPanelFrame(ctx, margin, margin, width - 2 * margin, panelH - 1.5 * margin, colors.fg3);
      ctx.fillStyle = CYAN;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText("B — total field (continuous, denser in core)", margin + 8, margin + 16);

      drawSolenoid(ctx, solLeft, solRight, solYCenterTop, solHalfH, colors, t);
      drawCore(ctx, coreLeft, coreRight, solYCenterTop, solHalfH * 0.78, "#3a2a5e");

      // B field lines — denser inside core, continuous across boundary
      drawBFieldLines(
        ctx,
        solLeft - 60,
        solRight + 60,
        solYCenterTop,
        solHalfH,
        coreLeft,
        coreRight,
        B_inside_air,
        B_inside_core,
      );

      // Bound surface charge glow on the core faces — these are the visible
      // source of the "extra B" compared to H.
      drawBoundPoles(ctx, coreLeft, coreRight, solYCenterTop, solHalfH * 0.78);

      // ── BOTTOM PANEL : H ──
      drawPanelFrame(
        ctx,
        margin,
        panelH + margin * 0.5,
        width - 2 * margin,
        panelH - 1.5 * margin,
        colors.fg3,
      );
      ctx.fillStyle = AMBER;
      ctx.textAlign = "left";
      ctx.fillText(
        "H — free-current field (uniform inside solenoid, independent of the core)",
        margin + 8,
        panelH + margin * 0.5 + 16,
      );

      drawSolenoid(ctx, solLeft, solRight, solYCenterBot, solHalfH, colors, t);
      // Core still drawn for reference, but no bound-pole glow — H is blind to M
      drawCore(ctx, coreLeft, coreRight, solYCenterBot, solHalfH * 0.78, "#2a3a4a");
      drawHFieldLines(
        ctx,
        solLeft - 60,
        solRight + 60,
        solYCenterBot,
        solHalfH,
        coreLeft,
        coreRight,
        H_inside,
        H_outside,
      );

      // HUD bottom-right
      ctx.font = "11px monospace";
      ctx.textAlign = "right";
      ctx.fillStyle = colors.fg2;
      ctx.fillText(
        `μ_r = 1 + χ_m = ${(chi + 1).toFixed(0)}`,
        width - margin - 8,
        height - margin - 44,
      );
      ctx.fillStyle = CYAN;
      ctx.fillText(
        `B_core / B_air ≈ ${(B_inside_core / B_inside_air).toFixed(1)}×`,
        width - margin - 8,
        height - margin - 28,
      );
      ctx.fillStyle = AMBER;
      ctx.fillText(
        `H_core = H_air = ${H_inside.toFixed(2)}`,
        width - margin - 8,
        height - margin - 12,
      );

      // Plain-words legend bottom-left
      ctx.textAlign = "left";
      ctx.fillStyle = colors.fg2;
      ctx.fillText(
        `H = B/μ₀ − M  →  ${H_recomputed.toFixed(3)} ≈ ${H_inside.toFixed(3)}`,
        margin + 8,
        height - margin - 12,
      );

      // Axes badge bottom-left
      drawAxesBadge(ctx, margin + 18, height - margin - 28, colors);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-3 grid grid-cols-1 gap-2 px-2 sm:grid-cols-2">
        <label className="flex items-center gap-2 text-xs font-mono text-[var(--color-fg-2)]">
          <span className="w-14 text-[var(--color-fg-1)]">χ_m</span>
          <input
            type="range"
            min={0}
            max={2000}
            step={10}
            value={chi}
            onChange={(e) => setChi(parseFloat(e.target.value))}
            className="flex-1 accent-[#78DCFF]"
          />
          <span className="w-20 text-right text-[var(--color-fg-1)] tabular-nums">
            {chi.toFixed(0)}
          </span>
        </label>
        <label className="flex items-center gap-2 text-xs font-mono text-[var(--color-fg-2)]">
          <span className="w-14 text-[var(--color-fg-1)]">core pos</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={corePos}
            onChange={(e) => setCorePos(parseFloat(e.target.value))}
            className="flex-1 accent-[#FFD66B]"
          />
          <span className="w-20 text-right text-[var(--color-fg-1)] tabular-nums">
            {corePos.toFixed(2)}
          </span>
        </label>
      </div>
      <p className="mt-2 px-2 text-xs font-mono text-[var(--color-fg-3)]">
        slide the core in and out · B crowds inside the core · H ignores the core entirely
      </p>
    </div>
  );
}

function drawPanelFrame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  stroke: string,
) {
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 5]);
  ctx.strokeRect(x, y, w, h);
  ctx.setLineDash([]);
}

function drawSolenoid(
  ctx: CanvasRenderingContext2D,
  xLeft: number,
  xRight: number,
  yCenter: number,
  halfH: number,
  colors: { fg2: string; fg3: string },
  t: number,
) {
  // Top and bottom rails of the solenoid, with evenly spaced current indicators
  const count = 20;
  const spacing = (xRight - xLeft) / count;
  ctx.strokeStyle = colors.fg2;
  ctx.lineWidth = 1;
  for (let i = 0; i < count; i++) {
    const x = xLeft + spacing * (i + 0.5);
    // Top: cross (into page)
    ctx.strokeStyle = colors.fg2;
    ctx.beginPath();
    ctx.arc(x, yCenter - halfH, 3.2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 2, yCenter - halfH - 2);
    ctx.lineTo(x + 2, yCenter - halfH + 2);
    ctx.moveTo(x - 2, yCenter - halfH + 2);
    ctx.lineTo(x + 2, yCenter - halfH - 2);
    ctx.stroke();
    // Bottom: dot (out of page)
    ctx.beginPath();
    ctx.arc(x, yCenter + halfH, 3.2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = colors.fg2;
    ctx.beginPath();
    ctx.arc(x, yCenter + halfH, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Subtle current animation along the rails
  const phase = (t * 0.6) % 1;
  ctx.strokeStyle = "rgba(255, 214, 107, 0.28)";
  ctx.lineWidth = 1.2;
  ctx.setLineDash([4, 10]);
  ctx.lineDashOffset = -phase * 14;
  ctx.beginPath();
  ctx.moveTo(xLeft, yCenter - halfH - 6);
  ctx.lineTo(xRight, yCenter - halfH - 6);
  ctx.moveTo(xRight, yCenter + halfH + 6);
  ctx.lineTo(xLeft, yCenter + halfH + 6);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.lineDashOffset = 0;
}

function drawCore(
  ctx: CanvasRenderingContext2D,
  xLeft: number,
  xRight: number,
  yCenter: number,
  halfH: number,
  fill: string,
) {
  ctx.fillStyle = fill;
  ctx.strokeStyle = "rgba(200, 180, 220, 0.4)";
  ctx.lineWidth = 1;
  ctx.fillRect(xLeft, yCenter - halfH, xRight - xLeft, halfH * 2);
  ctx.strokeRect(xLeft, yCenter - halfH, xRight - xLeft, halfH * 2);
  ctx.fillStyle = "rgba(200, 180, 220, 0.65)";
  ctx.font = "10px monospace";
  ctx.textAlign = "center";
  ctx.fillText("CORE (μ_r)", (xLeft + xRight) / 2, yCenter - halfH - 4);
}

function drawBFieldLines(
  ctx: CanvasRenderingContext2D,
  x1: number,
  x2: number,
  yCenter: number,
  halfH: number,
  coreLeft: number,
  coreRight: number,
  bAir: number,
  bCore: number,
) {
  // Horizontal streamlines, with line density modulated by local B magnitude.
  const nLines = 9;
  for (let i = 0; i < nLines; i++) {
    const frac = (i + 0.5) / nLines;
    const y = yCenter - halfH + halfH * 2 * frac;
    // Inside core: thick. Outside core but inside solenoid: medium. Outside: thin.
    // Emulate by drawing multiple passes with varying alpha/thickness.
    // Draw air-strength line across the full span, then overlay the core stretch.
    const tAir = 0.25 + 0.3 * Math.min(1, bAir / 2);
    ctx.strokeStyle = `rgba(120, 220, 255, ${tAir})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
    ctx.stroke();

    // Over the core, add a denser overlay proportional to (bCore/bAir)
    const tCore = Math.min(0.85, 0.25 + 0.25 * Math.log10(bCore / bAir + 1));
    ctx.strokeStyle = `rgba(120, 220, 255, ${tCore})`;
    ctx.lineWidth = 1.2 + Math.min(2.2, (bCore / bAir) * 0.005);
    ctx.beginPath();
    ctx.moveTo(coreLeft, y);
    ctx.lineTo(coreRight, y);
    ctx.stroke();

    // Arrowhead at right tip of overlay (shows direction)
    ctx.fillStyle = FIELD_LINE_B;
    ctx.beginPath();
    ctx.moveTo(x2, y);
    ctx.lineTo(x2 - 6, y - 3);
    ctx.lineTo(x2 - 6, y + 3);
    ctx.closePath();
    ctx.fill();
  }
}

function drawHFieldLines(
  ctx: CanvasRenderingContext2D,
  x1: number,
  x2: number,
  yCenter: number,
  halfH: number,
  _coreLeft: number,
  _coreRight: number,
  hInside: number,
  hOutside: number,
) {
  // H lines inside the solenoid are uniform; outside they fade fast.
  const nLines = 9;
  for (let i = 0; i < nLines; i++) {
    const frac = (i + 0.5) / nLines;
    const y = yCenter - halfH + halfH * 2 * frac;
    const tIn = 0.35 + 0.35 * Math.min(1, hInside);
    ctx.strokeStyle = `rgba(255, 214, 107, ${tIn})`;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(x1 + 50, y);
    ctx.lineTo(x2 - 50, y);
    ctx.stroke();

    // Very faint outside
    const tOut = 0.18 + 0.2 * Math.min(1, hOutside * 10);
    ctx.strokeStyle = `rgba(255, 214, 107, ${tOut})`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x1 + 50, y);
    ctx.moveTo(x2 - 50, y);
    ctx.lineTo(x2, y);
    ctx.stroke();

    // Arrowhead at the right
    ctx.fillStyle = FIELD_LINE_H;
    ctx.beginPath();
    ctx.moveTo(x2, y);
    ctx.lineTo(x2 - 6, y - 3);
    ctx.lineTo(x2 - 6, y + 3);
    ctx.closePath();
    ctx.fill();
  }
}

function drawBoundPoles(
  ctx: CanvasRenderingContext2D,
  coreLeft: number,
  coreRight: number,
  yCenter: number,
  halfH: number,
) {
  // Right face: +σ_m (north-pole-like bound current sheet)
  ctx.shadowBlur = 10;
  ctx.shadowColor = "rgba(255, 106, 222, 0.6)";
  ctx.strokeStyle = "rgba(255, 106, 222, 0.9)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(coreRight, yCenter - halfH);
  ctx.lineTo(coreRight, yCenter + halfH);
  ctx.stroke();
  // Left face: −σ_m
  ctx.shadowColor = "rgba(120, 220, 255, 0.6)";
  ctx.strokeStyle = "rgba(120, 220, 255, 0.9)";
  ctx.beginPath();
  ctx.moveTo(coreLeft, yCenter - halfH);
  ctx.lineTo(coreLeft, yCenter + halfH);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Labels
  ctx.fillStyle = MAGENTA;
  ctx.font = "10px monospace";
  ctx.textAlign = "left";
  ctx.fillText("N", coreRight + 4, yCenter - halfH + 10);
  ctx.fillStyle = "rgba(120, 220, 255, 0.9)";
  ctx.textAlign = "right";
  ctx.fillText("S", coreLeft - 4, yCenter - halfH + 10);
}

function drawAxesBadge(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  colors: { fg2: string; fg3: string },
) {
  const len = 14;
  ctx.strokeStyle = colors.fg2;
  ctx.fillStyle = colors.fg2;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(ox + len, oy);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(ox + len, oy);
  ctx.lineTo(ox + len - 3, oy - 2);
  ctx.lineTo(ox + len - 3, oy + 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = colors.fg3;
  ctx.font = "10px monospace";
  ctx.fillText("axis", ox + len + 4, oy + 3);
}
