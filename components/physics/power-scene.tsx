"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.5;
const MAX_HEIGHT = 320;

/**
 * Two engines push identical crates across the same distance. The slow
 * one arrives later but does the same work; the fast one gets there sooner.
 * Power P = W / t is what differs — shown as a live gauge on each track.
 */
export function PowerScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 640, height: 320 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const w = e.contentRect.width;
        if (w > 0) setSize({ width: w, height: Math.min(w * RATIO, MAX_HEIGHT) });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useAnimationFrame({
    elementRef: canvasRef,
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

      const margin = 40;
      const trackSpan = width - margin * 2;
      const fastPeriod = 3;
      const slowPeriod = 7;
      const fastP = (t % fastPeriod) / fastPeriod;
      const slowP = (t % slowPeriod) / slowPeriod;

      const drawTrack = (y: number, progress: number, label: string, period: number) => {
        // track
        ctx.strokeStyle = colors.fg3;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(margin, y);
        ctx.lineTo(width - margin, y);
        ctx.stroke();

        // crate
        const cx = margin + progress * (trackSpan - 48);
        ctx.fillStyle = colors.bg1;
        ctx.fillRect(cx, y - 24, 44, 24);
        ctx.strokeStyle = colors.fg1;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(cx, y - 24, 44, 24);

        // force arrow
        ctx.strokeStyle = colors.magenta;
        ctx.fillStyle = colors.magenta;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - 30, y - 12);
        ctx.lineTo(cx - 4, y - 12);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx - 4, y - 12);
        ctx.lineTo(cx - 10, y - 16);
        ctx.lineTo(cx - 10, y - 8);
        ctx.closePath();
        ctx.fill();

        // label + power meter
        ctx.font = "11px monospace";
        ctx.textAlign = "left";
        ctx.fillStyle = colors.fg2;
        ctx.fillText(label, margin, y + 18);
        // power scale: 1/period (bigger = faster)
        const p = 1 / period;
        const meterMax = 1 / fastPeriod;
        const meterLen = 120;
        const meterX = width - margin - meterLen;
        const meterY = y + 12;
        ctx.strokeStyle = colors.fg3;
        ctx.strokeRect(meterX, meterY, meterLen, 6);
        ctx.fillStyle = colors.magenta;
        ctx.fillRect(meterX, meterY, meterLen * (p / meterMax), 6);
        ctx.textAlign = "right";
        ctx.fillStyle = colors.fg2;
        ctx.fillText("P", meterX - 4, meterY + 6);
      };

      drawTrack(height * 0.32, fastP, "fast engine — same W, less t", fastPeriod);
      drawTrack(height * 0.72, slowP, "slow engine — same W, more t", slowPeriod);

      // Formula banner
      ctx.font = "12px monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = colors.fg1;
      ctx.fillText("P = dW/dt", width / 2, 20);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas ref={canvasRef} style={{ width: size.width, height: size.height }} className="block" />
    </div>
  );
}
