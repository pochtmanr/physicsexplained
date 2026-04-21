"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  G_STANDARD,
  RHO_WATER,
  buoyantForce,
  submergedFraction,
} from "@/lib/physics/fluids";

const RATIO = 0.62;
const MAX_HEIGHT = 420;

/**
 * Archimedes' principle, made tactile.
 *
 * A rectangular block of adjustable density is placed in a tank of fluid
 * of adjustable density. The block settles to the depth at which the weight
 * of displaced fluid equals its own weight. Sinks, floats, or hovers —
 * the scene picks the right outcome from the density ratio alone.
 */
export function BuoyancyScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [bodyDensity, setBodyDensity] = useState(600);
  const [fluidDensity, setFluidDensity] = useState(RHO_WATER);
  const [size, setSize] = useState({ width: 640, height: 400 });
  const fracRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          setSize({ width: w, height: Math.min(w * RATIO, MAX_HEIGHT) });
        }
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  const { submergedFraction: targetFrac, floats } = submergedFraction(
    bodyDensity,
    fluidDensity,
  );

  // Fixed-size block for display and force calculation (1 m × 1 m × 1 m).
  const BLOCK_VOL = 1;
  const weight = bodyDensity * BLOCK_VOL * G_STANDARD;
  const fullBuoyancy = buoyantForce(BLOCK_VOL, fluidDensity);

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

      // Approach equilibrium smoothly.
      const speed = 3;
      fracRef.current += (targetFrac - fracRef.current) * Math.min(1, speed * dt);
      const frac = fracRef.current;

      ctx.clearRect(0, 0, width, height);

      // ---- Tank geometry ----------------------------------------------------
      const tankPad = 28;
      const tankTop = 40;
      const tankBottom = height - 28;
      const tankLeft = tankPad;
      const tankRight = Math.min(width - tankPad, tankPad + 380);
      const tankW = tankRight - tankLeft;
      const tankH = tankBottom - tankTop;

      // Waterline sits ~20 % from the top of the tank.
      const surfaceY = tankTop + tankH * 0.22;

      // Fluid fill (translucent cyan)
      ctx.fillStyle = "rgba(111, 184, 198, 0.18)";
      ctx.fillRect(tankLeft, surfaceY, tankW, tankBottom - surfaceY);

      // Tank walls
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(tankLeft, tankTop);
      ctx.lineTo(tankLeft, tankBottom);
      ctx.lineTo(tankRight, tankBottom);
      ctx.lineTo(tankRight, tankTop);
      ctx.stroke();

      // Waterline
      ctx.strokeStyle = "rgba(111, 184, 198, 0.7)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tankLeft, surfaceY);
      ctx.lineTo(tankRight, surfaceY);
      ctx.stroke();

      // ---- Block geometry ---------------------------------------------------
      const blockW = tankW * 0.28;
      const blockH = Math.min(tankH * 0.36, 140);
      const blockX = tankLeft + tankW / 2 - blockW / 2;
      // When frac = 0: block sits entirely above surfaceY.
      // When frac = 1: block is entirely below surfaceY.
      const blockTop = surfaceY - blockH * (1 - frac);
      const blockBottom = blockTop + blockH;

      // If block fully submerged and sinking (floats=false, body > fluid),
      // continue falling until it hits the floor.
      let drawTop = blockTop;
      let drawBottom = blockBottom;
      if (!floats && frac >= 0.999) {
        const maxSink = tankBottom - blockBottom;
        drawTop = blockTop + maxSink;
        drawBottom = blockBottom + maxSink;
      }

      // Displaced-fluid highlight: the fluid-filled portion of the block's
      // footprint, rendered as a shaded rectangle behind the block.
      const submergedTop = Math.max(drawTop, surfaceY);
      const submergedBottom = Math.min(drawBottom, tankBottom);
      if (submergedBottom > submergedTop) {
        ctx.fillStyle = "rgba(255, 79, 216, 0.18)";
        ctx.fillRect(
          blockX - 6,
          submergedTop,
          blockW + 12,
          submergedBottom - submergedTop,
        );
      }

      // Block body
      ctx.fillStyle = "#6FB8C6";
      ctx.shadowColor = "rgba(111, 184, 198, 0.5)";
      ctx.shadowBlur = 12;
      ctx.fillRect(blockX, drawTop, blockW, blockH);
      ctx.shadowBlur = 0;
      ctx.strokeStyle = colors.fg1;
      ctx.lineWidth = 1;
      ctx.strokeRect(blockX, drawTop, blockW, blockH);

      // Force arrows (gravity down, buoyancy up) — from block centre.
      const centerX = blockX + blockW / 2;
      const centerY = drawTop + blockH / 2;
      const maxArrow = Math.min(blockH * 0.9, 70);

      // Buoyancy magnitude in the current configuration.
      const liveBuoyancy = fullBuoyancy * (floats ? frac : 1);
      const buoyScale = Math.min(1, liveBuoyancy / weight);

      // Gravity (downward, gold)
      ctx.strokeStyle = "#E4C27A";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX - 12, centerY);
      ctx.lineTo(centerX - 12, centerY + maxArrow);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(centerX - 16, centerY + maxArrow - 5);
      ctx.lineTo(centerX - 12, centerY + maxArrow);
      ctx.lineTo(centerX - 8, centerY + maxArrow - 5);
      ctx.stroke();

      ctx.fillStyle = "#E4C27A";
      ctx.font = "11px monospace";
      ctx.textAlign = "right";
      ctx.fillText("mg", centerX - 18, centerY + maxArrow);

      // Buoyancy (upward, magenta) — scaled by how much fluid is displaced.
      const buoyLen = maxArrow * buoyScale;
      ctx.strokeStyle = "#FF4FD8";
      ctx.beginPath();
      ctx.moveTo(centerX + 12, centerY);
      ctx.lineTo(centerX + 12, centerY - buoyLen);
      ctx.stroke();
      if (buoyLen > 6) {
        ctx.beginPath();
        ctx.moveTo(centerX + 8, centerY - buoyLen + 5);
        ctx.lineTo(centerX + 12, centerY - buoyLen);
        ctx.lineTo(centerX + 16, centerY - buoyLen + 5);
        ctx.stroke();
      }
      ctx.fillStyle = "#FF4FD8";
      ctx.textAlign = "left";
      ctx.fillText("F_b", centerX + 18, centerY - buoyLen + 4);

      // Waterline label
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText("surface", tankLeft + 4, surfaceY - 4);

      // ---- Side panel: readouts --------------------------------------------
      const panelX = tankRight + 24;
      if (panelX + 160 <= width) {
        ctx.fillStyle = colors.fg2;
        ctx.textAlign = "left";
        ctx.font = "11px monospace";
        let row = tankTop + 8;
        const line = (label: string, value: string) => {
          ctx.fillStyle = colors.fg3;
          ctx.fillText(label, panelX, row);
          ctx.fillStyle = colors.fg1;
          ctx.fillText(value, panelX + 84, row);
          row += 18;
        };
        line("ρ_body", `${bodyDensity.toFixed(0)} kg/m³`);
        line("ρ_fluid", `${fluidDensity.toFixed(0)} kg/m³`);
        line("weight", `${(weight / 1000).toFixed(2)} kN`);
        line(
          "F_b (max)",
          `${(fullBuoyancy / 1000).toFixed(2)} kN`,
        );
        line(
          "status",
          floats
            ? `floats · ${(targetFrac * 100).toFixed(0)}% sub`
            : "sinks",
        );
      }
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-2 flex flex-col gap-2 px-2">
        <div className="flex items-center gap-3">
          <label className="w-32 text-sm text-[var(--color-fg-3)]">
            ρ body (kg/m³)
          </label>
          <input
            type="range"
            min={100}
            max={2500}
            step={10}
            value={bodyDensity}
            onChange={(e) => setBodyDensity(parseFloat(e.target.value))}
            className="flex-1 accent-[#6FB8C6]"
          />
          <span className="w-16 text-right font-mono text-sm text-[var(--color-fg-1)]">
            {bodyDensity.toFixed(0)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <label className="w-32 text-sm text-[var(--color-fg-3)]">
            ρ fluid (kg/m³)
          </label>
          <input
            type="range"
            min={500}
            max={1800}
            step={10}
            value={fluidDensity}
            onChange={(e) => setFluidDensity(parseFloat(e.target.value))}
            className="flex-1 accent-[#FF4FD8]"
          />
          <span className="w-16 text-right font-mono text-sm text-[var(--color-fg-1)]">
            {fluidDensity.toFixed(0)}
          </span>
        </div>
        <p className="px-1 text-xs text-[var(--color-fg-3)]">
          The block settles where buoyant force equals weight. The submerged
          fraction is exactly ρ_body / ρ_fluid — nothing more. Push the body
          denser than the fluid and it sinks.
        </p>
      </div>
    </div>
  );
}
