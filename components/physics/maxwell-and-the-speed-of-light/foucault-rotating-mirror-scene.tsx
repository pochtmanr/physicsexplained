"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { SPEED_OF_LIGHT } from "@/lib/physics/constants";
import {
  cFromFoucault,
  foucaultRotation,
} from "@/lib/physics/relativity/maxwell-c";

/**
 * FIG.02b — Foucault's 1862 rotating-mirror measurement of c.
 *
 * A monochromatic source S sends a pulse to a rotating mirror R; the
 * pulse bounces to a distant fixed mirror M, returns to R, and is
 * deflected by an angle Δθ relative to its outgoing direction because R
 * has rotated during the round-trip.
 *
 *   Δθ = ω · (2L / c)
 *
 * Sliders control L (round-trip half-distance, in meters) and the
 * mirror's rotation rate (rpm). The HUD shows Δθ and the deduced c.
 *
 * Palette:
 *   amber   — the laser pulse / light path
 *   cyan    — stationary apparatus (source S, fixed mirror M, screen)
 *   magenta — the rotating mirror R
 */

const RATIO = 0.55;
const MAX_HEIGHT = 380;

export function FoucaultRotatingMirrorScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();

  const [distance, setDistance] = useState(20); // L in metres
  const [rpm, setRpm] = useState(48000);
  const distRef = useRef(distance);
  const rpmRef = useRef(rpm);
  useEffect(() => {
    distRef.current = distance;
  }, [distance]);
  useEffect(() => {
    rpmRef.current = rpm;
  }, [rpm]);

  const [size, setSize] = useState({ width: 720, height: 380 });
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

      const L = distRef.current;
      const rpmNow = rpmRef.current;
      const omega = (2 * Math.PI * rpmNow) / 60; // rad/s

      // Geometry: source on the left, rotating mirror near centre, fixed mirror right.
      const padX = 60;
      const cy = height * 0.55;
      const sourceX = padX;
      const rotX = width * 0.28;
      const fixedX = width - padX;
      const screenY = height * 0.85;

      // Round-trip time, animation tempo. We slow the actual light by a
      // huge factor so the eye can follow it. The angular reading uses
      // the real physics formula.
      const visualSpeed = 1; // unit per second of "stage time"
      const period = 2.4; // total round trip in stage seconds
      const stage = ((t / 1000) % period) / period; // 0 → 1

      // Phases: 0–0.5 = outbound, 0.5–1 = inbound (post-reflection from R outbound, then return).
      // Real geometry: S → R outbound → M → R again (inbound) → screen.
      // We simplify into outbound (S→M via R) and inbound (M→screen via R).

      // R rotation visual: scaled-up real rotation rate so the eye sees motion.
      // Display rotation is decoupled from physics rotation rate: we just
      // animate the mirror tilting through a small range.
      const visualMirrorAngle = ((omega * t) / 1000) * 0.005; // visual only
      const mirrorLen = 28;

      // Predicted angular shift at this rpm + L (real physics)
      const dtheta = foucaultRotation(L, rpmNow, SPEED_OF_LIGHT);
      const recoveredC = dtheta > 0 ? cFromFoucault(L, rpmNow, dtheta) : SPEED_OF_LIGHT;

      // ── Light path: outbound (S → R → M)
      ctx.strokeStyle = "#FFC857";
      ctx.lineWidth = 1.25;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(sourceX, cy);
      ctx.lineTo(rotX, cy);
      ctx.lineTo(fixedX, cy);
      ctx.stroke();
      ctx.setLineDash([]);

      // ── Light path: inbound — return arrives deflected by 2·Δθ at screen
      // (the standard interferometric factor of two from grazing reflection).
      // Visualise that deflection by aiming the inbound ray at a slightly
      // offset point near the source.
      const visualReturnAngle = Math.min(0.18, dtheta * 4000); // amplify for visibility
      const returnDx = -L * 0; // schematic: stays near S
      const returnYAtSource = cy + Math.tan(visualReturnAngle) * (rotX - sourceX);
      ctx.strokeStyle = "#FFC857";
      ctx.lineWidth = 1.25;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(fixedX, cy);
      ctx.lineTo(rotX, cy);
      ctx.lineTo(sourceX + 30 + returnDx, returnYAtSource);
      ctx.stroke();
      ctx.setLineDash([]);

      // Animated pulse along the active phase
      const pulseRadius = 4;
      let px = 0;
      let py = 0;
      if (stage < 0.5) {
        const u = stage / 0.5; // 0 → 1
        if (u < 0.5) {
          // S → R
          const v = u / 0.5;
          px = sourceX + (rotX - sourceX) * v;
          py = cy;
        } else {
          // R → M
          const v = (u - 0.5) / 0.5;
          px = rotX + (fixedX - rotX) * v;
          py = cy;
        }
      } else {
        const u = (stage - 0.5) / 0.5;
        if (u < 0.5) {
          // M → R
          const v = u / 0.5;
          px = fixedX + (rotX - fixedX) * v;
          py = cy;
        } else {
          // R → screen (deflected)
          const v = (u - 0.5) / 0.5;
          px = rotX + (sourceX + 30 - rotX) * v;
          py = cy + (returnYAtSource - cy) * v;
        }
      }
      ctx.fillStyle = "#FFC857";
      ctx.beginPath();
      ctx.arc(px, py, pulseRadius, 0, Math.PI * 2);
      ctx.fill();

      // ── Source S
      ctx.fillStyle = colors.cyan;
      ctx.fillRect(sourceX - 12, cy - 16, 8, 32);
      ctx.fillStyle = colors.fg2;
      ctx.font = "12px ui-monospace, SFMono-Regular, monospace";
      ctx.fillText("S (source)", sourceX - 16, cy + 32);

      // ── Fixed mirror M
      ctx.fillStyle = colors.cyan;
      ctx.fillRect(fixedX, cy - 24, 4, 48);
      ctx.fillText("M (fixed)", fixedX - 24, cy + 38);

      // ── Rotating mirror R (magenta)
      ctx.save();
      ctx.translate(rotX, cy);
      ctx.rotate(visualMirrorAngle);
      ctx.strokeStyle = colors.magenta;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, -mirrorLen);
      ctx.lineTo(0, mirrorLen);
      ctx.stroke();
      // tick marks
      ctx.strokeStyle = colors.magenta;
      ctx.lineWidth = 1;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * (mirrorLen / 2));
        ctx.lineTo(6, i * (mirrorLen / 2));
        ctx.stroke();
      }
      ctx.restore();
      ctx.fillStyle = colors.fg2;
      ctx.fillText("R (rotating)", rotX - 32, cy - mirrorLen - 8);

      // ── Distance label
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(rotX, cy + mirrorLen + 18);
      ctx.lineTo(fixedX, cy + mirrorLen + 18);
      ctx.stroke();
      ctx.fillStyle = colors.fg2;
      const Llabel = `L = ${L.toFixed(1)} m`;
      ctx.fillText(Llabel, (rotX + fixedX) / 2 - ctx.measureText(Llabel).width / 2, cy + mirrorLen + 32);

      // ── HUD readout panel (top-right)
      ctx.fillStyle = colors.fg2;
      ctx.textAlign = "left";
      let yh = 22;
      const hx = padX;
      ctx.fillText(`ω = ${omega.toFixed(1)} rad/s   (${rpmNow.toLocaleString()} rpm)`, hx, yh);
      yh += 16;
      ctx.fillText(
        `Δθ = ω · 2L/c = ${(dtheta * 1e6).toFixed(2)} μrad`,
        hx,
        yh,
      );
      yh += 16;
      ctx.fillStyle = "#FFC857";
      ctx.fillText(
        `c (recovered) = ${recoveredC.toExponential(6)} m/s`,
        hx,
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
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block font-mono text-xs text-white/70">
          <div className="mb-1 flex items-center justify-between">
            <span>L (rotating mirror → fixed mirror, m)</span>
            <span className="opacity-60">{distance.toFixed(1)} m</span>
          </div>
          <input
            type="range"
            min={1}
            max={50}
            step={0.5}
            value={distance}
            onChange={(e) => setDistance(parseFloat(e.target.value))}
            className="w-full accent-cyan-400"
          />
        </label>
        <label className="block font-mono text-xs text-white/70">
          <div className="mb-1 flex items-center justify-between">
            <span>Mirror rotation rate (rpm)</span>
            <span className="opacity-60">{rpm.toLocaleString()}</span>
          </div>
          <input
            type="range"
            min={1000}
            max={120000}
            step={1000}
            value={rpm}
            onChange={(e) => setRpm(parseFloat(e.target.value))}
            className="w-full accent-fuchsia-400"
          />
        </label>
      </div>
      <p className="mt-2 font-mono text-[11px] text-white/50">
        Foucault's 1862 apparatus used L ≈ 20 m and ω ≈ 800 rev/s. The deflection at
        the return screen was a fraction of a millimetre — measurable, and gave c
        to better than 1%.
      </p>
    </div>
  );
}
