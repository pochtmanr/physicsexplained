"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.55;
const MAX_HEIGHT = 340;

/**
 * A spacecraft approaches a moving planet, bends around it, and flies
 * away faster than it came in. In the planet's frame the encounter is
 * elastic and only changes direction; in the heliocentric frame the
 * spacecraft has stolen some of the planet's orbital momentum.
 */
export function GravityAssistScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 640, height: 340 });
  const trailRef = useRef<Array<{ x: number; y: number }>>([]);

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

      const cycle = 8;
      const p = (t % cycle) / cycle;

      // Planet moves slowly leftward across the middle
      const planetX = width * 0.85 - p * width * 0.7;
      const planetY = height * 0.5;
      const planetR = 22;

      // Spacecraft approaches from bottom-right, bends around planet, exits upper-left
      // Build a parametric trajectory that curves through the planet's frame.
      // In planet frame: hyperbolic flyby — approximate with a quadratic bend.
      const localT = p * 2 - 1; // -1..1 across encounter
      const dx = localT * 260;
      const dy = (1 - localT * localT) * -80 + 80; // bends upward near the planet
      const scX = planetX + dx;
      const scY = planetY + dy;

      // Trail (decays)
      trailRef.current.push({ x: scX, y: scY });
      if (trailRef.current.length > 220) trailRef.current.shift();
      if (p < 0.02) trailRef.current.length = 0;

      // Sun reference (upper-left tiny)
      ctx.fillStyle = colors.fg2;
      ctx.beginPath();
      ctx.arc(32, 32, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText("Sun", 42, 36);

      // Planet
      ctx.fillStyle = colors.fg1;
      ctx.beginPath();
      ctx.arc(planetX, planetY, planetR, 0, Math.PI * 2);
      ctx.fill();
      // Planet's velocity vector (orbital motion)
      ctx.strokeStyle = colors.fg2;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(planetX, planetY);
      ctx.lineTo(planetX - 40, planetY);
      ctx.stroke();
      ctx.fillStyle = colors.fg2;
      ctx.beginPath();
      ctx.moveTo(planetX - 40, planetY);
      ctx.lineTo(planetX - 34, planetY - 4);
      ctx.lineTo(planetX - 34, planetY + 4);
      ctx.closePath();
      ctx.fill();
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText("v_planet", planetX - 22, planetY - 8);

      // Trail
      const trail = trailRef.current;
      if (trail.length > 1) {
        ctx.strokeStyle = colors.magenta;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(trail[0].x, trail[0].y);
        for (let i = 1; i < trail.length; i++) ctx.lineTo(trail[i].x, trail[i].y);
        ctx.stroke();
      }

      // Spacecraft
      ctx.fillStyle = colors.magenta;
      ctx.shadowColor = colors.magenta;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(scX, scY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Caption: speed changes in heliocentric frame
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText("spacecraft gains v by stealing planetary momentum", 16, height - 18);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas ref={canvasRef} style={{ width: size.width, height: size.height }} className="block" />
    </div>
  );
}
