"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { ELEMENTARY_CHARGE, H_BAR } from "@/lib/physics/constants";
import {
  diracMonopoleUnit,
  diracQuantizationCondition,
} from "@/lib/physics/electromagnetism/monopole";

/**
 * FIG.65c — Dirac quantization condition.
 *
 * Slider drives the magnetic charge g over the range [0, 4 g_D]. The
 * scene shows two stacked panels:
 *
 *   Top panel — the wave-function phase Δφ = qg/ℏ accumulated around the
 *   Dirac string, drawn as an arc that wraps around a unit circle. The
 *   phase is single-valued (consistent quantum mechanics) only when the
 *   arc closes onto an integer multiple of 2π. Lilac integer markers sit
 *   at every 2π step around the circle. When g is at an integer multiple
 *   of g_D, the marker locks; otherwise the arc tip lands BETWEEN markers
 *   and a small amber "fail" badge appears.
 *
 *   Bottom panel — eg / (2πℏ) on the y-axis vs g/g_D on the x-axis. A
 *   straight line through the origin with slope 1 (because eg/(2πℏ) =
 *   g/g_D when q = e). The integers n = 1, 2, 3, … are the lilac dots
 *   that the slider must hit for the condition to be satisfied.
 *
 * Palette:
 *   amber  — Dirac string / phase arc
 *   lilac  — integer-n quantization markers
 *   magenta — electric charge q = e indicator
 *   cyan   — magnetic charge g
 */

const RATIO = 0.78;
const MAX_HEIGHT = 480;

const G_D = diracMonopoleUnit(); // 2πℏ/e
const E_CHARGE = ELEMENTARY_CHARGE;

export function DiracQuantizationConditionScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();

  // slider expressed in multiples of g_D so it reads cleanly
  const [gOverGD, setGOverGD] = useState(1.0);
  const gRef = useRef(gOverGD);
  useEffect(() => {
    gRef.current = gOverGD;
  }, [gOverGD]);

  const [size, setSize] = useState({ width: 720, height: 480 });
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

  // Quantization metric — is the slider's g at an integer multiple of g_D?
  const liveStats = useMemo(() => {
    const g = gOverGD * G_D;
    const { eg, n } = diracQuantizationCondition(E_CHARGE, g);
    const nNearest = Math.round(n);
    const tolerance = 0.04; // ±4% of an integer counts as locked
    const locked = Math.abs(n - nNearest) < tolerance;
    return { eg, n, nNearest, locked, g };
  }, [gOverGD]);

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

      const g = gRef.current * G_D;
      const n = (E_CHARGE * g) / (2 * Math.PI * H_BAR);
      const nNearest = Math.round(n);
      const locked = Math.abs(n - nNearest) < 0.04;

      // ── TOP PANEL: phase arc on a unit circle ──────────────────────
      const topH = height * 0.5;
      const cx = width * 0.28;
      const cy = topH * 0.55;
      const r = Math.min(topH * 0.36, width * 0.16);

      // outer ring
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      // integer markers around the circle (one per 2π in phase = one per
      // integer-n; we draw 4 dots evenly spaced as the integer ticks for
      // visual rhythm — the math is "every full revolution = one n")
      ctx.fillStyle = "rgba(200, 160, 255, 0.85)";
      for (let k = 0; k < 4; k++) {
        const ang = -Math.PI / 2 + (k * Math.PI) / 2;
        const x = cx + r * Math.cos(ang);
        const y = cy + r * Math.sin(ang);
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // phase arc — wraps as g grows past 1×g_D, 2×g_D, …
      const totalRevs = n; // total revolutions (can be > 1)
      const fracRev = totalRevs - Math.floor(Math.max(0, totalRevs));
      const phaseAngle = fracRev * 2 * Math.PI;

      const arcAlpha = 0.85;
      ctx.strokeStyle = `rgba(255, 180, 80, ${arcAlpha})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + phaseAngle, false);
      ctx.stroke();

      // tip of arc
      const tipAng = -Math.PI / 2 + phaseAngle;
      const tipX = cx + r * Math.cos(tipAng);
      const tipY = cy + r * Math.sin(tipAng);
      ctx.fillStyle = "rgba(255, 180, 80, 1)";
      ctx.beginPath();
      ctx.arc(tipX, tipY, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // centre label: completed revolutions
      ctx.fillStyle = colors.fg1;
      ctx.font = "13px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`Δφ = ${(n).toFixed(2)} × 2π`, cx, cy + 4);
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.fillText("loop phase", cx, cy + 18);

      // panel label
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText(
        "PHASE AROUND DIRAC STRING — must close on integer × 2π",
        24,
        20,
      );

      // ── verdict to the right of the circle ─────────────────────────
      const vx = cx + r + 28;
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`q = e   (electron charge)`, vx, cy - 36);
      ctx.fillStyle = "rgba(120, 220, 255, 0.95)";
      ctx.fillText(`g = ${gRef.current.toFixed(2)} × g_D`, vx, cy - 18);
      ctx.fillStyle = colors.fg1;
      ctx.fillText(`n = eg / (2πℏ) = ${n.toFixed(3)}`, vx, cy);

      if (locked) {
        const pulse = (Math.sin(t * 2.8) + 1) * 0.5;
        ctx.fillStyle = `rgba(200, 160, 255, ${(0.7 + 0.3 * pulse).toFixed(3)})`;
        ctx.font = "12px monospace";
        ctx.fillText(
          `n = ${nNearest}   QUANTIZATION SATISFIED`,
          vx,
          cy + 24,
        );
      } else {
        const pulse = (Math.sin(t * 2.8) + 1) * 0.5;
        ctx.fillStyle = `rgba(255, 180, 80, ${(0.6 + 0.3 * pulse).toFixed(3)})`;
        ctx.font = "12px monospace";
        ctx.fillText(
          `n NON-INTEGER  →  wave function not single-valued`,
          vx,
          cy + 24,
        );
      }

      // ── BOTTOM PANEL: integer staircase ────────────────────────────
      const bottomY0 = topH + 12;
      const padL = 56;
      const padR = 24;
      const padT = 28;
      const padB = 36;
      const plotW = width - padL - padR;
      const plotH = height - bottomY0 - padT - padB;
      const x0 = padL;
      const y0 = bottomY0 + padT;
      const xMax = 4; // g/g_D up to 4
      const yMax = 4; // n up to 4

      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText(
        "DIRAC LINE — n = g / g_D (with q = e); integers are the only allowed values",
        24,
        bottomY0 + 14,
      );

      // axes
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x0, y0 + plotH);
      ctx.lineTo(x0 + plotW, y0 + plotH);
      ctx.stroke();

      // axis labels & ticks
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      for (let k = 0; k <= xMax; k++) {
        const px = x0 + (k / xMax) * plotW;
        ctx.beginPath();
        ctx.moveTo(px, y0 + plotH);
        ctx.lineTo(px, y0 + plotH + 4);
        ctx.stroke();
        ctx.fillText(`${k}`, px, y0 + plotH + 16);
      }
      ctx.fillText("g / g_D", x0 + plotW / 2, y0 + plotH + 30);

      ctx.textAlign = "right";
      for (let k = 0; k <= yMax; k++) {
        const py = y0 + plotH - (k / yMax) * plotH;
        ctx.beginPath();
        ctx.moveTo(x0 - 4, py);
        ctx.lineTo(x0, py);
        ctx.stroke();
        ctx.fillText(`${k}`, x0 - 8, py + 3);
      }
      ctx.save();
      ctx.translate(x0 - 38, y0 + plotH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = "center";
      ctx.fillText("n = eg / (2πℏ)", 0, 0);
      ctx.restore();

      // straight line n = g/g_D
      ctx.strokeStyle = "rgba(180, 170, 200, 0.45)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x0, y0 + plotH);
      ctx.lineTo(x0 + plotW, y0 + plotH - (xMax / yMax) * plotH);
      ctx.stroke();

      // integer dots — the only allowed values
      for (let k = 1; k <= xMax; k++) {
        const px = x0 + (k / xMax) * plotW;
        const py = y0 + plotH - (k / yMax) * plotH;
        ctx.fillStyle = "rgba(200, 160, 255, 0.95)";
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = colors.fg2;
        ctx.font = "9px monospace";
        ctx.textAlign = "left";
        ctx.fillText(`n=${k}`, px + 8, py - 6);
      }

      // current slider position dot
      const cgx = x0 + (Math.min(gRef.current, xMax) / xMax) * plotW;
      const cgy = y0 + plotH - (Math.min(n, yMax) / yMax) * plotH;
      ctx.fillStyle = locked
        ? "rgba(200, 160, 255, 1)"
        : "rgba(255, 180, 80, 1)";
      ctx.beginPath();
      ctx.arc(cgx, cgy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = colors.bg1;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // dashed vertical projection
      ctx.strokeStyle = "rgba(120, 220, 255, 0.45)";
      ctx.setLineDash([3, 4]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cgx, cgy);
      ctx.lineTo(cgx, y0 + plotH);
      ctx.stroke();
      ctx.setLineDash([]);

      void liveStats;
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
        <label className="text-sm text-[var(--color-fg-3)] font-mono">
          g / g_D
        </label>
        <input
          type="range"
          min={0}
          max={4}
          step={0.01}
          value={gOverGD}
          onChange={(e) => setGOverGD(parseFloat(e.target.value))}
          className="flex-1 accent-[#78DCFF]"
        />
        <span className="w-24 text-right text-sm font-mono text-[var(--color-fg-1)]">
          {gOverGD.toFixed(2)} g_D
        </span>
      </div>
      <div className="mt-1 px-2 text-xs text-[var(--color-fg-3)]">
        Drag g across the integer ticks. The wave function is single-valued only
        when n = eg / (2πℏ) is an integer; the lilac markers are the allowed
        Dirac monopole charges (g_D ≈ 4.14×10⁻¹⁵ Wb = Φ₀).
      </div>
    </div>
  );
}
