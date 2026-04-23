"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  phaseVelocity,
} from "@/lib/physics/electromagnetism/optics-refraction";
import { SPEED_OF_LIGHT } from "@/lib/physics/constants";

const RATIO = 0.5;
const MAX_HEIGHT = 360;

const MAGENTA = "rgba(255, 100, 200,"; // vacuum pulse
const CYAN = "rgba(120, 220, 255,"; // medium pulse
const LILAC = "rgba(200, 160, 255,"; // slab tint

/**
 * FIG.42a — two pulses, same source, one through vacuum, one through a slab
 * of refractive index n. Both travel the same geometric screen-distance; the
 * one that traverses the slab emerges late by (n − 1)·L/c seconds.
 *
 * - Top track:  vacuum. Pulse advances at animation speed 1.0.
 * - Bottom track: same source, but a lilac slab of width L fills part of the
 *   path. Inside the slab the pulse advances at 1/n of the vacuum rate.
 *
 * Slider: n from 1.0 (vacuum, pulses arrive together) to 2.5 (diamond-ish,
 * pulses arrive with a big visible gap). HUD: delay in nanoseconds for a 1 m
 * slab, which is the physically meaningful number.
 *
 * The scene intentionally does NOT show refraction / bending. The point of
 * this FIG is the *temporal* delay, not the angular deflection — that comes
 * later in §09.2 (Snell's law).
 */
export function MediumDelayScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 720, height: 360 });
  const [n, setN] = useState(1.5);

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

      // Layout: two tracks, vacuum on top, medium on bottom.
      const marginX = 40;
      const trackLen = width - 2 * marginX;
      const topY = height * 0.32;
      const botY = height * 0.68;

      // Slab occupies the middle third of the bottom track.
      const slabX0 = marginX + trackLen * 0.35;
      const slabX1 = marginX + trackLen * 0.65;

      // Pulse cycle: 2.5 s — both pulses start at the left edge together,
      // vacuum pulse always reaches the right edge first.
      const cycle = 2.5;
      const phase = ((t % cycle) / cycle); // 0..1

      // ─── Vacuum track ───
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(marginX, topY);
      ctx.lineTo(marginX + trackLen, topY);
      ctx.stroke();

      // Vacuum pulse: linear motion from marginX to marginX+trackLen.
      const vacuumPos = marginX + phase * trackLen;

      // ─── Medium track ───
      ctx.strokeStyle = colors.fg3;
      ctx.beginPath();
      ctx.moveTo(marginX, botY);
      ctx.lineTo(marginX + trackLen, botY);
      ctx.stroke();

      // Lilac slab rectangle.
      const slabH = 42;
      ctx.fillStyle = `${LILAC} 0.18)`;
      ctx.strokeStyle = `${LILAC} 0.7)`;
      ctx.lineWidth = 1;
      ctx.fillRect(slabX0, botY - slabH / 2, slabX1 - slabX0, slabH);
      ctx.strokeRect(slabX0, botY - slabH / 2, slabX1 - slabX0, slabH);
      ctx.fillStyle = `${LILAC} 0.9)`;
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`n = ${n.toFixed(2)}`, (slabX0 + slabX1) / 2, botY - slabH / 2 - 6);

      // Medium pulse: same speed as vacuum OUTSIDE the slab, slower inside by
      // factor 1/n. We compute its position as a function of phase by
      // integrating the piecewise-constant speed.
      //
      // Vacuum traverses full trackLen in one cycle at speed v_vac = trackLen.
      // Medium traverses full "optical length" = trackLen − L + n·L in one
      // cycle at the same visual speed, where L = slabX1 − slabX0. So the
      // medium pulse finishes the scene LATE by (n−1)·L in canvas pixels.
      //
      // We want both pulses to *start* at the same x = marginX and the vacuum
      // pulse to finish at phase 1. To show the delay clearly, we let the
      // medium pulse fall behind and *re-emerge* only after it has cleared
      // the slab — i.e. we drive its position by arc-length, not time.

      const L_px = slabX1 - slabX0;
      const totalOptical = trackLen + (n - 1) * L_px; // extra path-length equivalent
      // s is the optical arc-length travelled by the medium pulse this cycle.
      const s = phase * totalOptical;

      let medPos: number;
      // Piecewise: before slab (speed 1), inside slab (speed 1/n), after slab.
      const s1 = slabX0 - marginX; // arc-length to reach slab start at speed 1
      const s2 = s1 + n * L_px;    // arc-length to exit slab (speed 1/n)
      if (s <= s1) {
        medPos = marginX + s;
      } else if (s <= s2) {
        const inside = (s - s1) / n; // geometric distance into slab
        medPos = slabX0 + inside;
      } else {
        medPos = slabX1 + (s - s2);
      }

      // Draw pulses as small blurry circles.
      drawPulse(ctx, vacuumPos, topY, `${MAGENTA} 0.95)`, `${MAGENTA} 0.0)`);
      drawPulse(ctx, medPos, botY, `${CYAN} 0.95)`, `${CYAN} 0.0)`);

      // Finish markers at the right edge.
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText("screen", marginX + trackLen, topY - 12);
      ctx.fillText("screen", marginX + trackLen, botY + 22);
      ctx.fillStyle = colors.fg3;
      ctx.fillRect(marginX + trackLen - 1, topY - 8, 2, 16);
      ctx.fillRect(marginX + trackLen - 1, botY - 8, 2, 16);

      // Source marker at the left.
      ctx.fillStyle = colors.fg1;
      ctx.beginPath();
      ctx.arc(marginX, topY, 3, 0, Math.PI * 2);
      ctx.arc(marginX, botY, 3, 0, Math.PI * 2);
      ctx.fill();

      // HUD — n, v_phase, delay per 1 m of slab.
      ctx.textAlign = "left";
      ctx.fillStyle = colors.fg1;
      ctx.font = "11px monospace";
      ctx.fillText("FIG.42a — same source, same screen, one path through a slab", 12, 18);

      const v = phaseVelocity(n);
      const delaySecondsPerMeter = (n - 1) / SPEED_OF_LIGHT;
      const delayNsPerMeter = delaySecondsPerMeter * 1e9;
      ctx.fillStyle = `${MAGENTA} 0.95)`;
      ctx.fillText(`vacuum:  v = c = 2.998 × 10⁸ m/s`, 12, height - 38);
      ctx.fillStyle = `${CYAN} 0.95)`;
      ctx.fillText(
        `medium:  v = c/n = ${(v / 1e8).toFixed(3)} × 10⁸ m/s`,
        12,
        height - 22,
      );
      ctx.fillStyle = `${LILAC} 0.95)`;
      ctx.fillText(
        `delay through a 1 m slab: (n − 1)·L/c = ${delayNsPerMeter.toFixed(2)} ns`,
        12,
        height - 6,
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
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 px-2 font-mono text-xs">
        <label className="flex items-center gap-2 text-[var(--color-fg-3)]">
          refractive index n
          <input
            type="range"
            min={1.0}
            max={2.5}
            step={0.01}
            value={n}
            onChange={(e) => setN(Number(e.target.value))}
            className="w-48"
          />
          <span className="text-[var(--color-fg-1)]">{n.toFixed(2)}</span>
        </label>
        <span className="text-[var(--color-fg-3)]">
          1.00 vacuum · 1.33 water · 1.50 crown · 2.42 diamond
        </span>
      </div>
    </div>
  );
}

function drawPulse(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  core: string,
  halo: string,
): void {
  const grad = ctx.createRadialGradient(x, y, 0, x, y, 14);
  grad.addColorStop(0, core);
  grad.addColorStop(1, halo);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, 14, 0, Math.PI * 2);
  ctx.fill();
}
