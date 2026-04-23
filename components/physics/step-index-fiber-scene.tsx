"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { RayTraceCanvas } from "@/components/physics/ray-trace-canvas";
import type { RayTraceScene } from "@/components/physics/ray-trace-canvas";
import {
  acceptanceConeDeg,
  numericalAperture,
} from "@/lib/physics/electromagnetism/waveguides";

/**
 * FIG.51a — Step-index fiber scene.
 *
 * A horizontal step-index fiber (core n₁ = 1.48, cladding n₂ = 1.46) runs
 * across the canvas. A fan of rays enters from the left at a user-controlled
 * half-angle. Rays inside the **internal** acceptance cone (≤ 90° − θ_c, the
 * wall-TIR limit) bounce their way down the length of the guide indefinitely;
 * rays outside it refract through the wall within a pass or two and are lost
 * in the cladding.
 *
 * The tracer handles refraction + TIR at both wall interfaces. The overlay
 * paints the two-layer dielectric stack, labels, and the guide's numerical
 * aperture for context.
 */

const WIDTH = 720;
const HEIGHT = 300;
const N_CORE = 1.48;
const N_CLAD = 1.46;
const FAN_HALF_ANGLE_DEG_MAX = 30;

export function StepIndexFiberScene() {
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  const [fanHalfAngleDeg, setFanHalfAngleDeg] = useState(8);

  const na = numericalAperture(N_CORE, N_CLAD);
  const coneDeg = acceptanceConeDeg(na); // external acceptance (in air) ≈ 14.04°
  // Internal wall-TIR threshold: a ray tilted by φ off the axis hits the side
  // wall at angle (90° − φ) from the wall normal. TIR requires this ≥ θ_c,
  // i.e. φ ≤ 90° − θ_c. For a typical step-index fiber this is ≫ θ_a above.
  const thetaCInternalDeg =
    (Math.asin(N_CLAD / N_CORE) * 180) / Math.PI; // wall critical angle
  const internalAcceptDeg = 90 - thetaCInternalDeg; // wall-TIR max tilt

  const scene: RayTraceScene = useMemo(() => {
    const topY = HEIGHT * 0.32;
    const botY = HEIGHT * 0.68;
    const srcX = WIDTH * 0.06;
    const srcY = (topY + botY) / 2;

    const elements: RayTraceScene["elements"] = [
      // Top wall: p1 left → p2 right. Tracer normal points downward into the
      // core, so an internal ray approaching from below registers (n1, n2) =
      // (CORE, CLAD). Correct.
      {
        kind: "interface",
        id: "wall-top",
        p1: { x: 0, y: topY },
        p2: { x: WIDTH, y: topY },
        n1: N_CORE,
        n2: N_CLAD,
      },
      // Bottom wall: p1 right → p2 left so the normal points upward into the
      // core. Internal ray below the normal line registers (CORE, CLAD).
      {
        kind: "interface",
        id: "wall-bot",
        p1: { x: WIDTH, y: botY },
        p2: { x: 0, y: botY },
        n1: N_CORE,
        n2: N_CLAD,
      },
      {
        kind: "ray-source",
        id: "fan",
        position: { x: srcX, y: srcY },
        directionDeg: 0,
        fanHalfAngleDeg,
        fanCount: 9,
        wavelengthNm: 1550,
      },
    ];

    return { width: WIDTH, height: HEIGHT, elements, maxBounces: 60 };
  }, [fanHalfAngleDeg]);

  useEffect(() => {
    const cv = overlayRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    if (cv.width !== WIDTH * dpr || cv.height !== HEIGHT * dpr) {
      cv.width = WIDTH * dpr;
      cv.height = HEIGHT * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    const topY = HEIGHT * 0.32;
    const botY = HEIGHT * 0.68;

    // Cladding bands — faint tint.
    ctx.fillStyle = "rgba(111, 184, 198, 0.06)";
    ctx.fillRect(0, 0, WIDTH, topY);
    ctx.fillRect(0, botY, WIDTH, HEIGHT - botY);

    // Core — slightly denser glass tint (higher n₁).
    const coreGrad = ctx.createLinearGradient(0, topY, 0, botY);
    coreGrad.addColorStop(0, "rgba(111, 184, 198, 0.20)");
    coreGrad.addColorStop(0.5, "rgba(111, 184, 198, 0.28)");
    coreGrad.addColorStop(1, "rgba(111, 184, 198, 0.20)");
    ctx.fillStyle = coreGrad;
    ctx.fillRect(0, topY, WIDTH, botY - topY);

    // Wall edges
    ctx.strokeStyle = "rgba(111, 184, 198, 0.45)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, topY);
    ctx.lineTo(WIDTH, topY);
    ctx.moveTo(0, botY);
    ctx.lineTo(WIDTH, botY);
    ctx.stroke();

    // Labels
    ctx.fillStyle = "rgba(230, 236, 244, 0.72)";
    ctx.font = "11px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText(`cladding — n₂ = ${N_CLAD.toFixed(2)}`, 12, 16);
    ctx.fillText(`core — n₁ = ${N_CORE.toFixed(2)}`, 12, (topY + botY) / 2 + 4);
    ctx.fillText(`cladding — n₂ = ${N_CLAD.toFixed(2)}`, 12, HEIGHT - 10);

    // HUD
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(228, 194, 122, 0.9)";
    ctx.fillText(`NA = ${na.toFixed(3)}`, WIDTH - 12, 16);
    ctx.fillText(
      `acceptance cone (air) ≤ ${coneDeg.toFixed(2)}°`,
      WIDTH - 12,
      32,
    );
    ctx.fillText(
      `internal wall-TIR ≤ ${internalAcceptDeg.toFixed(2)}°`,
      WIDTH - 12,
      48,
    );
    ctx.fillStyle =
      fanHalfAngleDeg <= internalAcceptDeg
        ? "rgba(111, 184, 198, 0.9)"
        : "rgba(255, 106, 222, 0.9)";
    ctx.fillText(
      fanHalfAngleDeg <= internalAcceptDeg
        ? "all rays guided"
        : "outer rays leak",
      WIDTH - 12,
      64,
    );
  }, [fanHalfAngleDeg, na, coneDeg, internalAcceptDeg]);

  return (
    <div className="w-full pb-4" style={{ maxWidth: WIDTH }}>
      <div className="relative mx-auto" style={{ width: WIDTH, height: HEIGHT }}>
        <canvas
          ref={overlayRef}
          style={{ width: WIDTH, height: HEIGHT, position: "absolute", inset: 0, zIndex: 0 }}
        />
        <div style={{ position: "absolute", inset: 0, zIndex: 1 }}>
          <RayTraceCanvas scene={scene} />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3 px-2">
        <label className="text-sm text-[var(--color-fg-3)]">Fan half-angle</label>
        <input
          type="range"
          min={0}
          max={FAN_HALF_ANGLE_DEG_MAX}
          step={0.25}
          value={fanHalfAngleDeg}
          onChange={(e) => setFanHalfAngleDeg(parseFloat(e.target.value))}
          className="flex-1 accent-[#6FB8C6]"
        />
        <span className="w-14 text-right font-mono text-sm text-[var(--color-fg-1)]">
          {fanHalfAngleDeg.toFixed(1)}°
        </span>
      </div>
      <p className="px-2 pt-2 text-xs text-[var(--color-fg-3)]">
        Inside the internal wall-TIR cone (
        {internalAcceptDeg.toFixed(1)}°) every ray bounces its way to the far
        end by total internal reflection. Crank the fan past it and the outer
        rays refract into the cladding within a bounce or two and are gone.
      </p>
    </div>
  );
}
