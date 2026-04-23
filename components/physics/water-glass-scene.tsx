"use client";

import { useEffect, useRef, useState } from "react";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  fresnelAll,
  reflectance,
  transmittanceS,
  transmittanceP,
} from "@/lib/physics/electromagnetism/fresnel";

const RATIO = 0.6;
const MAX_HEIGHT = 540;

const AMBER = "rgba(255, 180, 80,";
const CYAN = "rgba(120, 220, 240,";
const LILAC = "rgba(200, 160, 255,";
const PALE_BLUE = "rgba(180, 210, 240,";

/**
 * WATER-GLASS SCENE. An air → water → glass sandwich, three media, two
 * interfaces. A ray enters from above at the slider-selected angle and is
 * tracked all the way through: at each interface Snell's law bends it and
 * the Fresnel equations split the energy into (reflected, transmitted).
 *
 * Ray widths are drawn proportional to the fraction of intensity still in
 * the ray — so after two interfaces you see directly how much of the
 * original beam survives into the glass.
 */
export function WaterGlassScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 860, height: 520 });
  const [thetaDeg, setThetaDeg] = useState(35);
  const nAir = 1.0;
  const nWater = 1.33;
  const nGlass = 1.5;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) setSize({ width: w, height: Math.min(w * RATIO, MAX_HEIGHT) });
      }
    });
    ro.observe(el);
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
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    }
    ctx.clearRect(0, 0, width, height);

    const theta1 = (thetaDeg * Math.PI) / 180;

    // ── Three-layer geometry ──────────────────────────────────────────
    const padX = 20;
    const padY = 20;
    const usableW = width - 2 * padX;
    const usableH = height - 2 * padY - 40; // keep footer room
    const layerH = usableH / 3;
    const airTop = padY;
    const waterTop = padY + layerH;
    const glassTop = padY + 2 * layerH;
    const glassBottom = padY + 3 * layerH;

    // Layer tints.
    ctx.fillStyle = `${PALE_BLUE} 0.06)`;
    ctx.fillRect(padX, waterTop, usableW, layerH);
    ctx.fillStyle = `${LILAC} 0.09)`;
    ctx.fillRect(padX, glassTop, usableW, layerH);

    // Interface lines.
    ctx.strokeStyle = `${CYAN} 0.85)`;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(padX, waterTop);
    ctx.lineTo(padX + usableW, waterTop);
    ctx.moveTo(padX, glassTop);
    ctx.lineTo(padX + usableW, glassTop);
    ctx.stroke();

    // Labels for layers.
    ctx.fillStyle = colors.fg2;
    ctx.font = "11px monospace";
    ctx.textAlign = "right";
    ctx.fillText(`air · n = ${nAir.toFixed(2)}`, padX + usableW - 6, airTop + 14);
    ctx.fillText(`water · n = ${nWater.toFixed(2)}`, padX + usableW - 6, waterTop + 14);
    ctx.fillText(`glass · n = ${nGlass.toFixed(2)}`, padX + usableW - 6, glassTop + 14);

    // ── First interface: air → water ─────────────────────────────────
    const hit1x = padX + usableW * 0.5;
    const hit1y = waterTop;

    const incLen = 0.9 * layerH;
    const incStartX = hit1x - incLen * Math.sin(theta1);
    const incStartY = hit1y - incLen * Math.cos(theta1);

    const first = fresnelAll(theta1, nAir, nWater);
    const Rs1 = reflectance(first.rs);
    const Rp1 = reflectance(first.rp);
    const Ts1 = transmittanceS(first.ts, nAir, nWater, theta1, first.thetaT);
    const Tp1 = transmittanceP(first.tp, nAir, nWater, theta1, first.thetaT);
    const R1 = 0.5 * (Rs1 + Rp1); // unpolarised average
    const T1 = 0.5 * (Ts1 + Tp1);

    // Incoming beam — full amplitude.
    drawRay(ctx, incStartX, incStartY, hit1x, hit1y, 1.0, colors);
    drawArrow(ctx, incStartX, incStartY, hit1x, hit1y);

    // Reflected off interface 1.
    const refl1EndX = hit1x + incLen * Math.sin(theta1);
    const refl1EndY = hit1y - incLen * Math.cos(theta1);
    drawRay(ctx, hit1x, hit1y, refl1EndX, refl1EndY, R1, colors);

    // Transmitted into water — at θ2.
    const theta2 = first.thetaT;
    const glassLayerDepth = layerH;
    // Path length in water: runs from (hit1x, hit1y) to (hit2x, glassTop).
    const hit2y = glassTop;
    const waterDepth = hit2y - hit1y;
    const hit2x = hit1x + waterDepth * Math.tan(theta2);
    drawRay(ctx, hit1x, hit1y, hit2x, hit2y, T1, colors);

    // ── Second interface: water → glass ───────────────────────────────
    const second = fresnelAll(theta2, nWater, nGlass);
    const Rs2 = reflectance(second.rs);
    const Rp2 = reflectance(second.rp);
    const Ts2 = transmittanceS(second.ts, nWater, nGlass, theta2, second.thetaT);
    const Tp2 = transmittanceP(second.tp, nWater, nGlass, theta2, second.thetaT);
    const R2 = 0.5 * (Rs2 + Rp2);
    const T2 = 0.5 * (Ts2 + Tp2);

    // Reflected off interface 2 — back up into the water.
    const reflect2EndX = hit2x + waterDepth * Math.tan(theta2);
    const reflect2EndY = hit2y - waterDepth;
    drawRay(ctx, hit2x, hit2y, reflect2EndX, reflect2EndY, T1 * R2, colors);

    // Transmitted into glass.
    const theta3 = second.thetaT;
    const glassEndY = glassBottom;
    const glassEndX = hit2x + glassLayerDepth * Math.tan(theta3);
    drawRay(ctx, hit2x, hit2y, glassEndX, glassEndY, T1 * T2, colors);
    drawArrow(ctx, hit2x, hit2y, glassEndX, glassEndY);

    // Normals (dashed).
    ctx.strokeStyle = colors.fg3;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(hit1x, waterTop - 18);
    ctx.lineTo(hit1x, waterTop + 18);
    ctx.moveTo(hit2x, glassTop - 18);
    ctx.lineTo(hit2x, glassTop + 18);
    ctx.stroke();
    ctx.setLineDash([]);

    // Hit-point annotations.
    ctx.fillStyle = colors.fg1;
    ctx.font = "10px monospace";
    ctx.textAlign = "left";
    ctx.fillText(
      `#1 air→water · R=${R1.toFixed(3)} · T=${T1.toFixed(3)}`,
      hit1x + 8,
      hit1y - 4,
    );
    ctx.fillText(
      `#2 water→glass · R=${R2.toFixed(3)} · T=${T2.toFixed(3)}`,
      hit2x + 8,
      hit2y - 4,
    );
    ctx.fillStyle = `${AMBER} 0.95)`;
    ctx.fillText(
      `surviving into glass: ${(T1 * T2 * 100).toFixed(1)}%`,
      padX + 8,
      height - 24,
    );

    // Footer caption.
    ctx.fillStyle = colors.fg2;
    ctx.textAlign = "center";
    ctx.font = "10px monospace";
    ctx.fillText(
      "Unpolarised average: R = ½(R_s + R_p). Ray width ∝ √(intensity fraction).",
      width / 2,
      height - 10,
    );
  }, [size, thetaDeg, colors]);

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-3 grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2 px-2 text-sm">
        <label className="text-[var(--color-fg-3)]">Angle θᵢ (in air)</label>
        <input
          type="range"
          min={0}
          max={85}
          step={0.1}
          value={thetaDeg}
          onChange={(e) => setThetaDeg(parseFloat(e.target.value))}
          className="accent-[rgb(255,180,80)]"
        />
        <span className="w-16 text-right font-mono text-[var(--color-fg-1)]">
          {thetaDeg.toFixed(1)}°
        </span>
      </div>
    </div>
  );
}

function drawRay(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  intensityFrac: number,
  _colors: unknown,
) {
  const w = Math.max(0.3, Math.sqrt(Math.max(intensityFrac, 0)) * 5);
  const alpha = (0.25 + 0.7 * Math.sqrt(Math.max(intensityFrac, 0))).toFixed(2);
  ctx.strokeStyle = `${AMBER} ${alpha})`;
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const l = Math.hypot(dx, dy) || 1;
  const ux = dx / l;
  const uy = dy / l;
  ctx.fillStyle = `${AMBER} 0.95)`;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - ux * 9 - uy * 4, y2 - uy * 9 + ux * 4);
  ctx.lineTo(x2 - ux * 9 + uy * 4, y2 - uy * 9 - ux * 4);
  ctx.closePath();
  ctx.fill();
}
