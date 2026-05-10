"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { SPEED_OF_LIGHT } from "@/lib/physics/constants";
import {
  cFromFoucault,
  foucaultRotation,
} from "@/lib/physics/relativity/maxwell-c";
import {
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  hexToRgba,
  useSceneSize,
  useSceneTokens,
} from "@/components/physics/_shared/scene-tokens";

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
 * Palette (theme-aware via `useSceneTokens()`):
 *   amber   — the laser pulse / light path
 *   cyan    — stationary apparatus (source S, fixed mirror M)
 *   magenta — the rotating mirror R
 */

export function FoucaultRotatingMirrorScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokens = useSceneTokens();

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

  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.55,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 280,
  });

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (t) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = applyDpr(canvas, width, height);
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      // Background
      ctx.fillStyle = tokens.bg;
      ctx.fillRect(0, 0, width, height);

      const L = distRef.current;
      const rpmNow = rpmRef.current;
      const omega = (2 * Math.PI * rpmNow) / 60; // rad/s

      // Geometry: source on the left, rotating mirror near centre, fixed mirror right.
      const padX = Math.max(40, width * 0.08);
      const cy = height * 0.55;
      const sourceX = padX;
      const rotX = width * 0.32;
      const fixedX = width - padX;

      const period = 2.4; // total round trip in stage seconds
      const stage = ((t / 1000) % period) / period; // 0 → 1

      // Visual mirror angle — animated for clarity, not physically scaled
      const visualMirrorAngle = ((omega * t) / 1000) * 0.005;
      const mirrorLen = Math.min(28, height * 0.075);

      // Predicted angular shift at this rpm + L (real physics)
      const dtheta = foucaultRotation(L, rpmNow, SPEED_OF_LIGHT);
      const recoveredC =
        dtheta > 0 ? cFromFoucault(L, rpmNow, dtheta) : SPEED_OF_LIGHT;

      // ── Light path: outbound (S → R → M)
      ctx.strokeStyle = tokens.amber;
      ctx.lineWidth = 1.25;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(sourceX, cy);
      ctx.lineTo(rotX, cy);
      ctx.lineTo(fixedX, cy);
      ctx.stroke();
      ctx.setLineDash([]);

      // ── Inbound — return arrives deflected (visualised, not literal)
      const visualReturnAngle = Math.min(0.18, dtheta * 4000);
      const returnYAtSource = cy + Math.tan(visualReturnAngle) * (rotX - sourceX);
      ctx.strokeStyle = tokens.amber;
      ctx.lineWidth = 1.25;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(fixedX, cy);
      ctx.lineTo(rotX, cy);
      ctx.lineTo(sourceX + 30, returnYAtSource);
      ctx.stroke();
      ctx.setLineDash([]);

      // Animated pulse along the active phase
      const pulseRadius = 4;
      let px = 0;
      let py = 0;
      if (stage < 0.5) {
        const u = stage / 0.5;
        if (u < 0.5) {
          const v = u / 0.5;
          px = sourceX + (rotX - sourceX) * v;
          py = cy;
        } else {
          const v = (u - 0.5) / 0.5;
          px = rotX + (fixedX - rotX) * v;
          py = cy;
        }
      } else {
        const u = (stage - 0.5) / 0.5;
        if (u < 0.5) {
          const v = u / 0.5;
          px = fixedX + (rotX - fixedX) * v;
          py = cy;
        } else {
          const v = (u - 0.5) / 0.5;
          px = rotX + (sourceX + 30 - rotX) * v;
          py = cy + (returnYAtSource - cy) * v;
        }
      }
      ctx.fillStyle = tokens.amber;
      ctx.beginPath();
      ctx.arc(px, py, pulseRadius, 0, Math.PI * 2);
      ctx.fill();

      // ── Source S
      ctx.fillStyle = tokens.cyan;
      ctx.fillRect(sourceX - 12, cy - 16, 8, 32);
      ctx.fillStyle = tokens.textMute;
      ctx.font = tokens.fontHud;
      ctx.fillText("S (source)", sourceX - 16, cy + 32);

      // ── Fixed mirror M
      ctx.fillStyle = tokens.cyan;
      ctx.fillRect(fixedX, cy - 24, 4, 48);
      ctx.fillText("M (fixed)", fixedX - 24, cy + 38);

      // ── Rotating mirror R (magenta)
      ctx.save();
      ctx.translate(rotX, cy);
      ctx.rotate(visualMirrorAngle);
      ctx.strokeStyle = tokens.magenta;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, -mirrorLen);
      ctx.lineTo(0, mirrorLen);
      ctx.stroke();
      ctx.strokeStyle = tokens.magenta;
      ctx.lineWidth = 1;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * (mirrorLen / 2));
        ctx.lineTo(6, i * (mirrorLen / 2));
        ctx.stroke();
      }
      ctx.restore();
      ctx.fillStyle = tokens.textMute;
      ctx.fillText("R (rotating)", rotX - 32, cy - mirrorLen - 8);

      // ── Distance label
      ctx.strokeStyle = tokens.panelBorder;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(rotX, cy + mirrorLen + 18);
      ctx.lineTo(fixedX, cy + mirrorLen + 18);
      ctx.stroke();
      ctx.fillStyle = tokens.textMute;
      const Llabel = `L = ${L.toFixed(1)} m`;
      ctx.fillText(
        Llabel,
        (rotX + fixedX) / 2 - ctx.measureText(Llabel).width / 2,
        cy + mirrorLen + 32,
      );

      // ── HUD readout (top-left)
      ctx.fillStyle = tokens.textMute;
      ctx.textAlign = "left";
      let yh = 22;
      const hx = padX;
      ctx.font = tokens.fontHud;
      ctx.fillText(
        `ω = ${omega.toFixed(1)} rad/s   (${rpmNow.toLocaleString()} rpm)`,
        hx,
        yh,
      );
      yh += 16;
      ctx.fillText(
        `Δθ = ω · 2L/c = ${(dtheta * 1e6).toFixed(2)} μrad`,
        hx,
        yh,
      );
      yh += 16;
      ctx.fillStyle = tokens.amber;
      ctx.fillText(
        `c (recovered) = ${recoveredC.toExponential(6)} m/s`,
        hx,
        yh,
      );

      // soft amber glow under the HUD c readout
      const glowGrad = ctx.createRadialGradient(hx, yh - 6, 0, hx, yh - 6, 80);
      glowGrad.addColorStop(0, hexToRgba(tokens.amber, 0.06));
      glowGrad.addColorStop(1, hexToRgba(tokens.amber, 0));
      ctx.fillStyle = glowGrad;
      ctx.fillRect(hx - 10, yh - 30, 280, 40);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Foucault's rotating-mirror geometry: a pulse leaves S, reflects off the spinning mirror R toward the fixed mirror M, and returns. R has turned during the round-trip; the deflection angle gives c."
      />
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <SliderRow
          label="L (m)"
          accentVar="--color-cyan"
          min={1}
          max={50}
          step={0.5}
          value={distance}
          onChange={setDistance}
          formatter={(v) => `${v.toFixed(1)} m`}
        />
        <SliderRow
          label="rotation (rpm)"
          accentVar="--color-magenta"
          min={1000}
          max={120000}
          step={1000}
          value={rpm}
          onChange={setRpm}
          formatter={(v) => v.toLocaleString()}
        />
      </div>
      <p className="mt-2 font-mono text-[11px] text-[var(--color-fg-3)]">
        Foucault's 1862 apparatus used L ≈ 20 m and ω ≈ 800 rev/s. The deflection at
        the return screen was a fraction of a millimetre — measurable, and gave c
        to better than 1%.
      </p>
    </div>
  );
}

function SliderRow({
  label,
  accentVar,
  min,
  max,
  step,
  value,
  onChange,
  formatter,
}: {
  label: string;
  accentVar: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  formatter: (v: number) => string;
}) {
  return (
    <label className="block font-mono text-xs text-[var(--color-fg-3)]">
      <div className="mb-1 flex items-center justify-between">
        <span>{label}</span>
        <span className="text-[var(--color-fg-2)]">{formatter(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
        style={{ accentColor: `var(${accentVar})` }}
      />
    </label>
  );
}
