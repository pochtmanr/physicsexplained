"use client";

import { useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { foucaultRotationPeriodHours } from "@/lib/physics/rotating-frame";

const CANVAS_W = 380;
const CANVAS_H = 380;
const GLOBE_R = 160; // px — radius from canvas centre to equator
// Polar projection: distance from canvas centre = GLOBE_R * (1 - sin(lat))
// so latitude 90° (pole) is at the centre, latitude 0° (equator) on the rim.

const CYAN = "#6FB8C6";
const MAGENTA = "#FF6ADE";

function latitudeToRadius(latDeg: number): number {
  // North hemisphere: latDeg in [0, 90]
  // r = 0 at pole, r = GLOBE_R at equator
  const sinLat = Math.sin((latDeg * Math.PI) / 180);
  return GLOBE_R * (1 - sinLat);
}

function drawCurvedArrow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  startAngle: number, // radians around the globe centre
  latDeg: number,
  hemisphere: "N" | "S",
  color: string,
) {
  const r = latitudeToRadius(Math.abs(latDeg));
  // The arrow starts moving "outward" (toward equator). Coriolis deflects it:
  //   N: deflect to the right (clockwise around centre as seen from above pole)
  //   S: deflect to the left
  // Render this as a small spiral arc.
  const STEPS = 14;
  const ARC_LEN = 0.55; // radians around the centre
  const RADIAL_SPAN = 26; // px outward growth over the arc

  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  let prevX = 0;
  let prevY = 0;
  for (let i = 0; i <= STEPS; i++) {
    const f = i / STEPS;
    const sign = hemisphere === "N" ? 1 : -1;
    const a = startAngle + sign * ARC_LEN * f;
    const rr = r + RADIAL_SPAN * f;
    const x = cx + rr * Math.cos(a);
    const y = cy + rr * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
    prevX = x;
    prevY = y;
  }
  ctx.stroke();

  // Arrowhead at the tip
  const sign = hemisphere === "N" ? 1 : -1;
  const aTip = startAngle + sign * ARC_LEN;
  const rTip = r + RADIAL_SPAN;
  const tipX = cx + rTip * Math.cos(aTip);
  const tipY = cy + rTip * Math.sin(aTip);
  // Tangent direction at tip (numerical from previous point)
  const tdx = tipX - prevX;
  const tdy = tipY - prevY;
  const tang = Math.atan2(tdy, tdx);
  const head = 6;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(
    tipX - head * Math.cos(tang - Math.PI / 6),
    tipY - head * Math.sin(tang - Math.PI / 6),
  );
  ctx.lineTo(
    tipX - head * Math.cos(tang + Math.PI / 6),
    tipY - head * Math.sin(tang + Math.PI / 6),
  );
  ctx.closePath();
  ctx.fill();
}

export function CoriolisGlobeScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [latitude, setLatitude] = useState(45);

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== CANVAS_W * dpr || canvas.height !== CANVAS_H * dpr) {
        canvas.width = CANVAS_W * dpr;
        canvas.height = CANVAS_H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      const cx = CANVAS_W / 2;
      const cy = CANVAS_H / 2;
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      // Equator (outer circle)
      ctx.strokeStyle = colors.fg2;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, GLOBE_R, 0, Math.PI * 2);
      ctx.stroke();

      // Latitude rings: 30°, 60°, and the user's slider value
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 3]);
      for (const lat of [30, 60]) {
        ctx.beginPath();
        ctx.arc(cx, cy, latitudeToRadius(lat), 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // User-selected latitude ring (cyan, dashed)
      ctx.strokeStyle = CYAN;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.arc(cx, cy, latitudeToRadius(latitude), 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Pole marker
      ctx.fillStyle = colors.fg1;
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = "10px monospace";
      ctx.fillStyle = colors.fg2;
      ctx.textAlign = "left";
      ctx.fillText("N pole", cx + 6, cy - 4);
      ctx.textAlign = "center";
      ctx.fillText("equator", cx, cy + GLOBE_R + 14);

      // North-hemisphere wind arrows (curve right) — cyan
      // Place at four cardinal angles around the globe
      const N_LATS = [60, 45, 30];
      const ANGLES = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
      for (const lat of N_LATS) {
        for (const a of ANGLES) {
          drawCurvedArrow(ctx, cx, cy, a, lat, "N", CYAN);
        }
      }

      // South-hemisphere arrows (curve left) — magenta. Reuse the helper at a
      // faux southern band (radius GLOBE_R - 28 ≈ latitude 10° on the same
      // projection) but with hemisphere "S" so the curl direction flips.
      for (const a of ANGLES) {
        drawCurvedArrow(ctx, cx, cy, a, 10, "S", MAGENTA);
      }
    },
  });

  const period = foucaultRotationPeriodHours(latitude);
  const periodLabel = Number.isFinite(period)
    ? `${period.toFixed(2)} h`
    : "∞ — Foucault fails here";

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: CANVAS_W, height: CANVAS_H }}
        className="mx-auto block"
      />
      <div className="pointer-events-none absolute right-2 top-2">
        <div className="rounded-sm border border-[var(--color-fg-4)] bg-[var(--color-bg-0)]/70 px-2 py-1 font-mono text-[10px] leading-relaxed text-[var(--color-fg-1)] backdrop-blur-sm">
          <div>latitude = {latitude.toFixed(0)}°</div>
          <div>
            T_Foucault ={" "}
            <span style={{ color: Number.isFinite(period) ? CYAN : MAGENTA }}>
              {periodLabel}
            </span>
          </div>
          <div className="text-[var(--color-fg-3)]">N: curl right · S: curl left</div>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-3 px-2">
        <label className="w-20 text-sm text-[var(--color-fg-3)]">latitude</label>
        <input
          type="range"
          min={0}
          max={90}
          step={1}
          value={latitude}
          onChange={(e) => setLatitude(parseFloat(e.target.value))}
          className="flex-1 accent-[#6FB8C6]"
        />
        <span className="w-16 text-right text-sm font-mono text-[var(--color-fg-1)]">
          {latitude.toFixed(0)}°
        </span>
      </div>
    </div>
  );
}
