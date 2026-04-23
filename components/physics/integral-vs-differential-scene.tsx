"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

/**
 * FIG.34b — Integral form vs differential form, two views of the same law.
 *
 * Left panel: a closed surface (sphere) with outward flux arrows crossing it.
 * Right panel: a single point with a "divergence meter" that flashes a value
 * as charge passes through it. Together they say the same thing — the
 * integral is the surface average of the differential — but they look at the
 * field with different instruments. The integral form asks "how much flux
 * leaves this balloon?"; the differential form asks "at this point, is the
 * field spreading out?".
 *
 * Colour key:
 *   magenta `#FF6ADE`           — positive charge (source)
 *   cyan    `#7ADCFF`           — surface rim
 *   amber   `#FFD66B`           — flux arrows
 *   lilac   `rgba(200,160,255)` — divergence readout accent
 */

const MAGENTA = "#FF6ADE";
const AMBER = "#FFD66B";
const LILAC = "rgba(200, 160, 255, 0.95)";

export function IntegralVsDifferentialScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 640, height: 380 });
  const [q, setQ] = useState(1.5); // relative charge strength
  const tRef = useRef(0);

  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          setSize({ width: w, height: Math.min(Math.max(w * 0.55, 340), 440) });
        }
      }
    });
    ro.observe(c);
    return () => ro.disconnect();
  }, []);

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (_t, dt) => {
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
      tRef.current += dt;

      ctx.clearRect(0, 0, width, height);

      // Two panels side-by-side
      const halfW = width / 2;
      drawIntegralPanel(ctx, 0, 0, halfW, height, q, tRef.current, colors);
      // separator
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(halfW, 20);
      ctx.lineTo(halfW, height - 20);
      ctx.stroke();
      drawDifferentialPanel(
        ctx,
        halfW,
        0,
        halfW,
        height,
        q,
        tRef.current,
        colors,
      );

      // Top banner text bridging both sides
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.font = "10px monospace";
      ctx.fillStyle = colors.fg2;
      ctx.fillText(
        "\u222E E \u00B7 dA   =   (1/\u03B5\u2080) \u222D \u03C1 dV",
        width / 2,
        height - 10,
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
      <div className="mt-2 flex flex-wrap items-center gap-4 px-2 font-mono text-xs text-[var(--color-fg-2)]">
        <label className="flex items-center gap-2">
          <span>Q = {q.toFixed(2)} (arb.)</span>
          <input
            type="range"
            min={-2}
            max={2}
            step={0.05}
            value={q}
            onChange={(e) => setQ(Number(e.target.value))}
            className="accent-[#FF6ADE]"
          />
        </label>
      </div>
    </div>
  );
}

function drawIntegralPanel(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  w: number,
  h: number,
  q: number,
  t: number,
  colors: { fg0: string; fg1: string; fg2: string; fg3: string },
) {
  // Title
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.font = "10px monospace";
  ctx.fillStyle = colors.fg2;
  ctx.fillText("INTEGRAL FORM   \u2014  flux through a surface", x0 + 14, y0 + 18);

  const cx = x0 + w / 2;
  const cy = y0 + h / 2 + 4;
  const R = Math.min(w, h) * 0.3;

  // Closed surface (sphere in 2D projection: a circle)
  ctx.strokeStyle = "#7ADCFF";
  ctx.setLineDash([5, 4]);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Equatorial ellipse for 3D hint
  ctx.strokeStyle = "rgba(122, 220, 255, 0.35)";
  ctx.beginPath();
  ctx.ellipse(cx, cy, R, R * 0.3, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Central charge
  ctx.fillStyle = q >= 0 ? MAGENTA : "#7ADCFF";
  ctx.beginPath();
  ctx.arc(cx, cy, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#0A0A0F";
  ctx.font = "bold 11px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(q >= 0 ? "+" : "\u2212", cx, cy + 1);

  // Animated radial flux arrows crossing the surface
  const arrowCount = 12;
  const speed = 40; // px/s
  const phase = (t * speed) % 30;
  for (let i = 0; i < arrowCount; i++) {
    const a = (i / arrowCount) * Math.PI * 2;
    const rxHat = Math.cos(a);
    const ryHat = Math.sin(a);
    // each arrow travels outward from slightly beyond the charge, looping
    for (let seg = 0; seg < 3; seg++) {
      const r = 14 + ((phase + seg * 30) % 90);
      if (r < 14 || r > R + 32) continue;
      const px = cx + rxHat * r;
      const py = cy + ryHat * r;
      const signFactor = Math.sign(q) || 1;
      drawArrow(ctx, px, py, rxHat * signFactor, ryHat * signFactor, 12, AMBER);
    }
  }

  // Label
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = "11px monospace";
  ctx.fillStyle = colors.fg1;
  ctx.fillText("\u222E E \u00B7 dA  =  Q_enc / \u03B5\u2080", cx, y0 + h - 30);
  ctx.fillStyle = colors.fg2;
  ctx.font = "10px monospace";
  ctx.fillText(
    "\"how much field leaves the balloon?\"",
    cx,
    y0 + h - 14,
  );
}

function drawDifferentialPanel(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  w: number,
  h: number,
  q: number,
  t: number,
  colors: { fg0: string; fg1: string; fg2: string; fg3: string },
) {
  // Title
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.font = "10px monospace";
  ctx.fillStyle = colors.fg2;
  ctx.fillText(
    "DIFFERENTIAL FORM   \u2014  divergence at a point",
    x0 + 14,
    y0 + 18,
  );

  const cx = x0 + w / 2;
  const cy = y0 + h / 2 + 4;

  // Grid of tiny vectors showing the local field around one point
  ctx.strokeStyle = "rgba(255, 214, 107, 0.35)";
  ctx.fillStyle = "rgba(255, 214, 107, 0.35)";
  ctx.lineWidth = 1;
  const step = 28;
  for (let gx = x0 + 30; gx < x0 + w - 20; gx += step) {
    for (let gy = y0 + 40; gy < y0 + h - 60; gy += step) {
      const dx = gx - cx;
      const dy = gy - cy;
      const r = Math.hypot(dx, dy);
      if (r < 6) continue;
      const hx = dx / r;
      const hy = dy / r;
      const mag = Math.min(14, 80 / (r + 6)) * (q >= 0 ? 1 : -1);
      drawArrow(ctx, gx, gy, hx, hy, Math.abs(mag), "rgba(255, 214, 107, 0.6)");
    }
  }

  // Central point — the "place where divergence is measured"
  const pulse = 1 + 0.15 * Math.sin(t * 3);
  ctx.strokeStyle = LILAC;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, 18 * pulse, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.fillStyle = LILAC;
  ctx.fill();

  // Divergence readout
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = "10px monospace";
  ctx.fillStyle = LILAC;
  const divRead = q >= 0 ? "\u2207\u00B7E  >  0" : "\u2207\u00B7E  <  0";
  ctx.fillText(divRead, cx, cy - 26);
  ctx.fillStyle = colors.fg2;
  ctx.fillText(q >= 0 ? "source" : "sink", cx, cy + 36);

  // Footer
  ctx.font = "11px monospace";
  ctx.fillStyle = colors.fg1;
  ctx.fillText("\u2207 \u00B7 E  =  \u03C1 / \u03B5\u2080", cx, y0 + h - 30);
  ctx.fillStyle = colors.fg2;
  ctx.font = "10px monospace";
  ctx.fillText("\"at this point, is the field spreading out?\"", cx, y0 + h - 14);
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tx: number,
  ty: number,
  len: number,
  color: string,
) {
  const tipX = x + tx * len * 0.5;
  const tipY = y + ty * len * 0.5;
  const tailX = x - tx * len * 0.5;
  const tailY = y - ty * len * 0.5;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(tailX, tailY);
  ctx.lineTo(tipX, tipY);
  ctx.stroke();
  const ang = Math.atan2(ty, tx);
  const head = 4;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(
    tipX - head * Math.cos(ang - Math.PI / 6),
    tipY - head * Math.sin(ang - Math.PI / 6),
  );
  ctx.lineTo(
    tipX - head * Math.cos(ang + Math.PI / 6),
    tipY - head * Math.sin(ang + Math.PI / 6),
  );
  ctx.closePath();
  ctx.fill();
}
