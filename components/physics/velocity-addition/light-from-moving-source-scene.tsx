"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { SPEED_OF_LIGHT } from "@/lib/physics/constants";
import { relativisticVelocityAdd } from "@/lib/physics/relativity/velocity-addition";

/**
 * FIG.09b — Flashlight on a spaceship. The postulate, made visceral.
 *
 * A spaceship flies at slider-controlled velocity βs · c rightward across
 * the canvas. At t = 0 it switches on a flashlight pointing forward. The
 * scene plots two light fronts:
 *
 *   • A cyan front emitted from the ship — the photons themselves.
 *   • An amber tick that marks where Galileo would expect the light to
 *     be, at speed c + v_ship.
 *
 * The cyan front always moves at exactly c in the lab frame. The amber
 * Galilean ghost runs ahead of it as the ship's speed climbs. The reader
 * pushes the slider toward 0.99 c and the gap widens — but the actual
 * light, not the ghost, moves at c. This is Einstein's second postulate
 * encoded as a kinematic fact.
 *
 * Numerical readout below the canvas:
 *   • v_ship = β · c
 *   • Galilean prediction for emitted light: c + v_ship  (cyan)
 *   • Relativistic answer (the formula): c + v_ship via Einstein → c
 *     (magenta)
 *
 * Palette:
 *   amber    — Galilean prediction ghost
 *   cyan     — actual light front (and its readout)
 *   magenta  — Einstein-formula readout
 */

const RATIO = 0.45;
const MAX_HEIGHT = 320;

export function LightFromMovingSourceScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();

  const [betaShip, setBetaShip] = useState(0.6);
  const betaRef = useRef(betaShip);
  useEffect(() => {
    betaRef.current = betaShip;
  }, [betaShip]);

  const [size, setSize] = useState({ width: 720, height: 320 });
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
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
      }
      ctx.clearRect(0, 0, width, height);

      const c = SPEED_OF_LIGHT;
      const beta = betaRef.current;
      // Einstein answer (encoded for the readout): c + v_ship → c.
      // Plug u' = c, v = β·c into the formula; we get exactly c.
      const uEinstein = relativisticVelocityAdd(c, beta * c, c);
      const uGalilean = c + beta * c;

      // Layout: ship glides left→right along trackY; light front emerges
      // ahead of the ship; Galilean ghost runs farther ahead.
      const padX = 40;
      const trackY = height * 0.55;
      const usable = width - 2 * padX;

      // Animation period 5 s. The ship starts at the left and reaches a
      // fraction β of the canvas width by the end of the period.
      const period = 5;
      const tau = ((t / 1000) % period) / period; // 0..1

      // Ship position (cyan-tinted)
      const xShip = padX + tau * beta * usable;
      ctx.fillStyle = colors.cyan;
      ctx.beginPath();
      ctx.moveTo(xShip - 10, trackY - 6);
      ctx.lineTo(xShip + 10, trackY);
      ctx.lineTo(xShip - 10, trackY + 6);
      ctx.closePath();
      ctx.fill();

      // Track
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padX, trackY);
      ctx.lineTo(width - padX, trackY);
      ctx.stroke();

      // Light front (Einstein, cyan): leaves ship at t=0, advances at
      // speed c → reaches τ·usable from padX.
      const xLight = padX + tau * usable; // light front, lab frame, speed c
      ctx.strokeStyle = colors.cyan;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(xLight, trackY - 14);
      ctx.lineTo(xLight, trackY + 14);
      ctx.stroke();
      ctx.fillStyle = colors.cyan;
      ctx.font = "11px ui-monospace, SFMono-Regular, monospace";
      ctx.fillText("photon (c)", xLight + 4, trackY - 18);

      // Galilean ghost: would be at τ · (1 + β) · usable
      const xGhostRaw = padX + tau * (1 + beta) * usable;
      const xGhost = Math.min(xGhostRaw, width - 6);
      ctx.strokeStyle = "#FFC857";
      ctx.lineWidth = 1.4;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(xGhost, trackY - 14);
      ctx.lineTo(xGhost, trackY + 14);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#FFC857";
      ctx.fillText("Galilean ghost (c + v)", xGhost + 4, trackY + 26);

      // Earth marker
      ctx.fillStyle = colors.fg2;
      ctx.beginPath();
      ctx.arc(padX, trackY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillText("EARTH", padX - 4, trackY + 22);

      // HUD
      ctx.fillStyle = colors.fg2;
      ctx.font = "12px ui-monospace, SFMono-Regular, monospace";
      let yh = 22;
      ctx.fillText(`v_ship = ${beta.toFixed(3)} c`, padX, yh);
      yh += 16;
      ctx.fillStyle = "#FFC857";
      ctx.fillText(
        `Galilean: c + v = ${(uGalilean / c).toFixed(3)} c  ⚠ > c`,
        padX,
        yh,
      );
      yh += 16;
      ctx.fillStyle = colors.magenta;
      ctx.fillText(
        `Einstein: (c + v) / (1 + v/c) = ${(uEinstein / c).toFixed(3)} c`,
        padX,
        yh,
      );
    },
  });

  return (
    <div ref={containerRef} className="w-full">
      <div
        className="relative w-full overflow-hidden rounded-md bg-[#0A0C12]"
        style={{ height: size.height }}
      >
        <canvas ref={canvasRef} className="block h-full w-full" />
      </div>
      <div className="mt-3">
        <label className="block font-mono text-xs text-white/70">
          <div className="mb-1 flex items-center justify-between">
            <span>Spaceship speed (Earth frame): β</span>
            <span className="opacity-60">{betaShip.toFixed(3)} c</span>
          </div>
          <input
            type="range"
            min={0}
            max={0.99}
            step={0.001}
            value={betaShip}
            onChange={(e) => setBetaShip(parseFloat(e.target.value))}
            className="w-full accent-cyan-400"
          />
        </label>
      </div>
      <p className="mt-2 font-mono text-[11px] text-white/50">
        Whatever the ship&apos;s speed, the cyan photon front moves at
        exactly c in the lab frame. Galileo&apos;s amber ghost — at c + v —
        is what classical kinematics demands and what the universe refuses
        to deliver. The Michelson-Morley null, made visible.
      </p>
    </div>
  );
}
