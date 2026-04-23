"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { coaxAxialPoynting } from "@/lib/physics/electromagnetism/poynting";

const RATIO = 0.62;
const MAX_HEIGHT = 400;

/**
 * FIG.36b — the coaxial-cable reveal.
 *
 * Cross-section view of a coax carrying DC current I at voltage V.
 * Inside the insulating gap:
 *   E: radial (outward, from + centre conductor to − outer shield)
 *     — drawn in magenta
 *   B: circumferential (right-hand rule around the current)
 *     — drawn in cyan
 *   S = E × B / μ₀: axial, INTO THE PAGE (along the cable)
 *     — drawn as lilac "into-page" markers spread across the gap
 *
 * A small side inset (right) shows the side view — energy flowing
 * through the *annular gap*, with the copper conductors shaded grey
 * to emphasise: the energy never goes through the metal.
 *
 * Sliders: V (volts) and I (amps). HUD tracks transported power (V·I)
 * and peak S magnitude at the inner-conductor surface.
 */
export function CoaxEnergyFlowScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 640, height: 400 });
  const [V, setV] = useState(12);
  const [I, setI] = useState(3);

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

      // ── Layout: cross-section on left, side view on right ──
      const splitX = Math.floor(width * 0.58);
      const csRadius = Math.min(splitX, height) * 0.35;
      const csCx = splitX * 0.5;
      const csCy = height * 0.5;

      const a = csRadius * 0.22; // inner conductor radius (display)
      const b = csRadius * 0.82; // outer shield inner radius

      // Real-units for physics: assume a = 1 mm, b = 5 mm
      const aPhys = 1e-3;
      const bPhys = 5e-3;
      const sMax = coaxAxialPoynting(V, I, aPhys, bPhys, aPhys); // peak at r=a

      // ── Cross-section background (gap) ──
      ctx.fillStyle = "rgba(200, 160, 255, 0.05)";
      ctx.beginPath();
      ctx.arc(csCx, csCy, b, 0, Math.PI * 2);
      ctx.arc(csCx, csCy, a, 0, Math.PI * 2, true);
      ctx.fill();

      // ── Outer shield (copper, thin ring) ──
      ctx.fillStyle = "rgba(180, 120, 90, 0.22)";
      ctx.beginPath();
      ctx.arc(csCx, csCy, b * 1.18, 0, Math.PI * 2);
      ctx.arc(csCx, csCy, b, 0, Math.PI * 2, true);
      ctx.fill();
      ctx.strokeStyle = "rgba(220, 150, 110, 0.55)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(csCx, csCy, b, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(csCx, csCy, b * 1.18, 0, Math.PI * 2);
      ctx.stroke();

      // ── Inner conductor (copper, solid) ──
      ctx.fillStyle = "rgba(200, 140, 100, 0.85)";
      ctx.beginPath();
      ctx.arc(csCx, csCy, a, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(240, 180, 130, 0.9)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Inner conductor current direction — dot (out of page) at centre
      ctx.fillStyle = "#FFD66B";
      ctx.beginPath();
      ctx.arc(csCx, csCy, Math.max(2, a * 0.28), 0, Math.PI * 2);
      ctx.fill();

      // ── E-field (radial, magenta) — 12 arrows from inner to outer ──
      const nE = 12;
      for (let i = 0; i < nE; i++) {
        const ang = (i / nE) * Math.PI * 2;
        const r0 = a + 4;
        const r1 = b - 6;
        const x0 = csCx + r0 * Math.cos(ang);
        const y0 = csCy + r0 * Math.sin(ang);
        const x1 = csCx + r1 * Math.cos(ang);
        const y1 = csCy + r1 * Math.sin(ang);
        drawArrow(ctx, x0, y0, x1, y1, "#FF6ADE", 0.8, 1.3);
      }

      // ── B-field (circumferential, cyan) — dashed ring at mid-radius ──
      const nRings = 2;
      for (let k = 0; k < nRings; k++) {
        const rMid = a + ((k + 1) / (nRings + 1)) * (b - a);
        ctx.strokeStyle = `rgba(120, 220, 255, ${(0.6 - k * 0.2).toFixed(3)})`;
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(csCx, csCy, rMid, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        // Arrowheads on the ring to indicate circulation (counter-clockwise
        // looking at +z, which is the right-hand rule for I out of page).
        const nHeads = 4;
        for (let j = 0; j < nHeads; j++) {
          const ang = (j / nHeads) * Math.PI * 2 + t * 0.4 + k * 0.5;
          const hx = csCx + rMid * Math.cos(ang);
          const hy = csCy + rMid * Math.sin(ang);
          // tangent (counter-clockwise)
          const tx = -Math.sin(ang);
          const ty = Math.cos(ang);
          drawArrow(
            ctx,
            hx - tx * 6,
            hy - ty * 6,
            hx + tx * 6,
            hy + ty * 6,
            `rgba(120, 220, 255, ${(0.8 - k * 0.2).toFixed(3)})`,
            1,
            1.4,
          );
        }
      }

      // ── S (into the page): lilac crosses-in-circles scattered in the gap ──
      const nS = 24;
      for (let i = 0; i < nS; i++) {
        const ang = ((i + 0.5) / nS) * Math.PI * 2 + t * 0.2;
        const rFrac = 0.25 + 0.55 * ((i * 7) % 11) / 11;
        const r = a + rFrac * (b - a);
        const x = csCx + r * Math.cos(ang);
        const y = csCy + r * Math.sin(ang);
        // Size/intensity modulate with 1/r² (Poynting magnitude in coax)
        const sMag = coaxAxialPoynting(V, I, aPhys, bPhys, aPhys + rFrac * (bPhys - aPhys));
        const intens = sMax > 0 ? Math.min(1, sMag / sMax) : 0;
        const R = 3 + 4.5 * intens;
        const alpha = 0.35 + 0.55 * intens;
        drawIntoPage(ctx, x, y, R, `rgba(200, 160, 255, ${alpha.toFixed(3)})`);
      }

      // ── Cross-section labels ──
      ctx.fillStyle = colors.fg1;
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillText("cross-section", csCx, csCy - csRadius - 18);
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.fillText("(looking along the cable)", csCx, csCy - csRadius - 4);

      ctx.textAlign = "left";
      ctx.fillStyle = "#FF6ADE";
      ctx.fillText("E →", csCx + b + 8, csCy - 8);
      ctx.fillStyle = "rgba(120, 220, 255, 0.9)";
      ctx.fillText("B ⟲", csCx + b + 8, csCy + 6);
      ctx.fillStyle = "rgba(200, 160, 255, 0.95)";
      ctx.fillText("S ⊗", csCx + b + 8, csCy + 20);

      // ── Side view (right panel) ──
      const svX0 = splitX + 14;
      const svX1 = width - 14;
      const svCy = height * 0.5;
      const svW = svX1 - svX0;
      const svH = Math.min(svW * 0.42, csRadius * 1.4);
      const shieldH = svH;
      const innerH = svH * 0.28;
      // shield (copper) — top & bottom
      ctx.fillStyle = "rgba(180, 120, 90, 0.3)";
      ctx.fillRect(svX0, svCy - shieldH / 2, svW, shieldH * 0.14);
      ctx.fillRect(svX0, svCy + shieldH / 2 - shieldH * 0.14, svW, shieldH * 0.14);
      ctx.strokeStyle = "rgba(220, 150, 110, 0.7)";
      ctx.lineWidth = 1;
      ctx.strokeRect(svX0, svCy - shieldH / 2, svW, shieldH * 0.14);
      ctx.strokeRect(svX0, svCy + shieldH / 2 - shieldH * 0.14, svW, shieldH * 0.14);
      // inner conductor — middle bar
      ctx.fillStyle = "rgba(200, 140, 100, 0.85)";
      ctx.fillRect(svX0, svCy - innerH / 2, svW, innerH);
      // flow arrows in the gap
      const gapTopY = svCy - shieldH / 2 + shieldH * 0.14 + 6;
      const gapBotY = svCy + shieldH / 2 - shieldH * 0.14 - 6;
      const flowY0 = svCy - innerH / 2 - 6;
      const flowY1 = svCy + innerH / 2 + 6;
      const nFlow = 5;
      for (let i = 0; i < nFlow; i++) {
        const frac = (i + 0.5) / nFlow;
        const xC = svX0 + 12 + frac * (svW - 30);
        const anim = ((t * 50 + i * 40) % (svW / nFlow)) / (svW / nFlow);
        const shiftedX = svX0 + 12 + ((frac + anim) % 1) * (svW - 30);
        // top gap
        drawArrow(
          ctx,
          shiftedX,
          (gapTopY + flowY0) / 2,
          shiftedX + 28,
          (gapTopY + flowY0) / 2,
          "rgba(200, 160, 255, 0.85)",
          1,
          2,
        );
        // bottom gap
        drawArrow(
          ctx,
          shiftedX,
          (gapBotY + flowY1) / 2,
          shiftedX + 28,
          (gapBotY + flowY1) / 2,
          "rgba(200, 160, 255, 0.85)",
          1,
          2,
        );
        // suppress unused
        void xC;
      }

      // Labels
      ctx.fillStyle = colors.fg1;
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillText("side view", (svX0 + svX1) / 2, svCy - shieldH / 2 - 12);
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.fillText("energy flows through the gap →", (svX0 + svX1) / 2, svCy + shieldH / 2 + 20);

      // ── HUD ──
      const P = V * I;
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`V = ${V.toFixed(1)} V`, 14, 22);
      ctx.fillText(`I = ${I.toFixed(2)} A`, 14, 40);
      ctx.textAlign = "right";
      ctx.fillStyle = "rgba(200, 160, 255, 0.95)";
      ctx.fillText(`P = V·I = ${P.toFixed(1)} W`, width - 14, 22);
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.fillText(`(all of it through the gap)`, width - 14, 38);

      // Footer
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        `the copper is a boundary condition · the energy never touches it`,
        width / 2,
        height - 8,
      );
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
        <label className="w-8 text-[var(--color-fg-3)]">V</label>
        <input
          type="range"
          min={1}
          max={48}
          step={0.5}
          value={V}
          onChange={(e) => setV(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "#FF6ADE" }}
        />
        <span className="w-16 text-right text-[var(--color-fg-1)]">
          {V.toFixed(1)} V
        </span>
      </div>
      <div className="mt-1 flex items-center gap-3 px-2 font-mono text-xs">
        <label className="w-8 text-[var(--color-fg-3)]">I</label>
        <input
          type="range"
          min={0.1}
          max={10}
          step={0.1}
          value={I}
          onChange={(e) => setI(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "#78DCFF" }}
        />
        <span className="w-16 text-right text-[var(--color-fg-1)]">
          {I.toFixed(2)} A
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
  if (!hex.startsWith("#") || hex.length !== 7) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
}

function drawIntoPage(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  R: number,
  color: string,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(x, y, R, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - R * 0.55, y - R * 0.55);
  ctx.lineTo(x + R * 0.55, y + R * 0.55);
  ctx.moveTo(x + R * 0.55, y - R * 0.55);
  ctx.lineTo(x - R * 0.55, y + R * 0.55);
  ctx.stroke();
}
