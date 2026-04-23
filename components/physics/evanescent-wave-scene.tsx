"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  criticalAngleRad,
  evanescentDecayLength,
  frustratedTIRTransmittance,
} from "@/lib/physics/electromagnetism/tir";
import type { RayTraceScene } from "@/components/physics/ray-trace-canvas";
import { RayTraceCanvas } from "@/components/physics/ray-trace-canvas";

/**
 * FIG.45c — Evanescent wave + frustrated TIR scene.
 *
 * Left mode ("normal TIR"): a ray totally-internally reflects at the top of
 * a glass slab. Above the interface, on the air side, we paint the
 * exponential evanescent field — amplitude ~ exp(−y/d) where d is the
 * evanescent decay length from the `tir.ts` kernel. The field is real and
 * oscillates perpendicular to the interface, but carries zero net energy.
 *
 * Right mode ("frustrated TIR"): a second slab of glass is placed a gap
 * `gap` above the first. The evanescent field leaks into the second slab and
 * *propagating* light emerges on the far side. The transmitted-to-incident
 * intensity follows T ≈ exp(−2·gap / d). A variable gap slider sweeps this
 * from near-unity (touching) to near-zero (multiple wavelengths apart).
 *
 * This is the optical analogue of quantum-mechanical tunnelling — a wave
 * forbidden by classical geometry leaks through an exponentially-decaying
 * "wavefunction" and emerges on the other side.
 */

const WIDTH = 680;
const HEIGHT = 380;
const N_GLASS = 1.5;
const N_AIR = 1.0;
const LAMBDA_MM = 0.00055; // 550 nm
const THETA_DEG = 55; // well past θ_c ≈ 41.81°

export function EvanescentWaveScene() {
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  const [frustrated, setFrustrated] = useState(false);
  // Gap in units of λ (makes the slider more legible).
  const [gapWavelengths, setGapWavelengths] = useState(0.3);

  const thetaRad = (THETA_DEG * Math.PI) / 180;
  const thetaC = criticalAngleRad(N_GLASS, N_AIR) as number;
  const thetaCdeg = (thetaC * 180) / Math.PI;
  const dMm = evanescentDecayLength(thetaRad, N_GLASS, N_AIR, LAMBDA_MM) as number;
  const dInLambdas = dMm / LAMBDA_MM;
  const gapMm = gapWavelengths * LAMBDA_MM;
  const T = frustratedTIRTransmittance(gapMm, LAMBDA_MM, thetaRad, N_GLASS, N_AIR);

  // Single TIR ray drawn by the analytic tracer — amber in-glass segments.
  const scene: RayTraceScene = useMemo(() => {
    const interfaceY = HEIGHT * 0.55;
    const srcX = WIDTH * 0.1;
    const srcY = HEIGHT * 0.85;
    const directionDeg = 270 + THETA_DEG;
    const elements: RayTraceScene["elements"] = [
      {
        kind: "ray-source",
        id: "src",
        position: { x: srcX, y: srcY },
        directionDeg,
        wavelengthNm: 550,
      },
      {
        kind: "interface",
        id: "glass-air",
        p1: { x: 0, y: interfaceY },
        p2: { x: WIDTH, y: interfaceY },
        n1: N_GLASS,
        n2: N_AIR,
      },
    ];
    return { width: WIDTH, height: HEIGHT, elements, maxBounces: 1 };
  }, []);

  // Overlay: region tints, evanescent field, optional second-glass slab
  // + transmitted ray for FTIR mode.
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

    const interfaceY = HEIGHT * 0.55;

    // Pixel-per-wavelength scale — arbitrary but keeps things legible.
    const PX_PER_LAMBDA = 22;
    const dPx = dInLambdas * PX_PER_LAMBDA;
    const gapPx = gapWavelengths * PX_PER_LAMBDA;
    const upperInterfaceY = frustrated ? interfaceY - gapPx : -9999;

    // --- Air region paint (between glass_1 and glass_2 if frustrated) ---
    ctx.fillStyle = "rgba(111, 184, 198, 0.04)";
    ctx.fillRect(0, 0, WIDTH, interfaceY);

    // --- Second glass slab (frustrated mode) ---
    if (frustrated) {
      const slabThickness = 60;
      ctx.fillStyle = "rgba(111, 184, 198, 0.26)";
      ctx.fillRect(0, upperInterfaceY - slabThickness, WIDTH, slabThickness);
      ctx.strokeStyle = "rgba(120, 220, 240, 0.7)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, upperInterfaceY);
      ctx.lineTo(WIDTH, upperInterfaceY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, upperInterfaceY - slabThickness);
      ctx.lineTo(WIDTH, upperInterfaceY - slabThickness);
      ctx.stroke();
      ctx.fillStyle = "rgba(230, 236, 244, 0.55)";
      ctx.font = "10px ui-monospace, monospace";
      ctx.textAlign = "left";
      ctx.fillText(
        `glass — n = ${N_GLASS.toFixed(2)}`,
        12,
        upperInterfaceY - slabThickness / 2 + 3,
      );
      ctx.fillText(`gap — air`, 12, upperInterfaceY - 4);
    }

    // --- Glass region (bottom) ---
    const glassGrad = ctx.createLinearGradient(0, interfaceY, 0, HEIGHT);
    glassGrad.addColorStop(0, "rgba(111, 184, 198, 0.24)");
    glassGrad.addColorStop(1, "rgba(111, 184, 198, 0.32)");
    ctx.fillStyle = glassGrad;
    ctx.fillRect(0, interfaceY, WIDTH, HEIGHT - interfaceY);

    // --- Evanescent field (above interface, on air side) ---
    // Find the hit point of the ray on the interface.
    const srcX = WIDTH * 0.1;
    const srcY = HEIGHT * 0.85;
    const dxHat = Math.cos(((270 + THETA_DEG) * Math.PI) / 180);
    const dyHat = Math.sin(((270 + THETA_DEG) * Math.PI) / 180);
    const tHit = (interfaceY - srcY) / dyHat;
    const hitX = srcX + tHit * dxHat;
    const hitY = interfaceY;

    // Evanescent field: amplitude envelope exp(−y / d), carrier oscillation
    // in the horizontal (along-interface) direction at spatial frequency
    // matching the parallel component of the wave vector.
    const parallelKPx = 2 * Math.PI / PX_PER_LAMBDA * Math.sin(thetaRad) * N_GLASS;
    // Render the field over a region +/- 160 px around the hit point.
    const xStart = Math.max(0, hitX - 200);
    const xEnd = Math.min(WIDTH, hitX + 260);
    const yTop = Math.max(0, interfaceY - dPx * 6);
    // Clip to the air region (between interfaces for FTIR).
    const yClipTop = frustrated ? Math.max(yTop, upperInterfaceY) : yTop;

    // Paint as a vertical stripe of exponentially-fading, horizontally-
    // oscillating intensity.
    const step = 2;
    for (let x = xStart; x <= xEnd; x += step) {
      for (let y = yClipTop; y <= interfaceY; y += step) {
        const depth = interfaceY - y;
        const env = Math.exp(-depth / dPx);
        const carrier = Math.cos((x - hitX) * parallelKPx * 0.3);
        // Magenta for the evanescent field — it's not a propagating wave,
        // it's a field on the forbidden side.
        const a = 0.55 * env * (0.5 + 0.5 * carrier);
        if (a < 0.02) continue;
        ctx.fillStyle = `rgba(255, 106, 222, ${a})`;
        ctx.fillRect(x, y, step, step);
      }
    }

    // Decay-length marker: a horizontal tick y = interfaceY − d.
    ctx.strokeStyle = "rgba(255, 106, 222, 0.65)";
    ctx.setLineDash([3, 4]);
    ctx.lineWidth = 1;
    const dLineY = interfaceY - dPx;
    if (dLineY > yClipTop) {
      ctx.beginPath();
      ctx.moveTo(hitX - 120, dLineY);
      ctx.lineTo(hitX + 120, dLineY);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(255, 106, 222, 0.85)";
    ctx.font = "11px ui-monospace, monospace";
    ctx.textAlign = "left";
    if (dLineY > yClipTop) {
      ctx.fillText(`y = d ≈ ${dInLambdas.toFixed(2)} λ`, hitX + 124, dLineY + 4);
    }

    // Transmitted ray on the far side of the second glass (FTIR mode).
    if (frustrated && T > 0.005) {
      // The transmitted ray continues in the same direction the original
      // ray would have gone if it had refracted (mirror-symmetric about the
      // surface normal). We draw it entering the top slab from below and
      // exiting out the top — fading alpha by T^0.5 so amplitude, not
      // intensity, drives the visual weight.
      const txDirDeg = 360 - THETA_DEG - 180; // going up-right
      const txDx = Math.cos((txDirDeg * Math.PI) / 180);
      const txDy = Math.sin((txDirDeg * Math.PI) / 180);
      const slabThickness = 60;
      const startY = upperInterfaceY;
      const endY = upperInterfaceY - slabThickness;
      const tLen = Math.abs((endY - startY) / txDy);
      ctx.strokeStyle = `rgba(255, 180, 80, ${0.35 + 0.6 * Math.sqrt(T)})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(hitX, startY);
      ctx.lineTo(hitX + txDx * tLen, endY);
      // And continue out into air above the slab.
      const endAboveY = endY - 60;
      const tAbove = Math.abs((endAboveY - endY) / txDy);
      ctx.lineTo(hitX + txDx * (tLen + tAbove), endAboveY);
      ctx.stroke();
    }

    // --- Labels ---
    ctx.fillStyle = "rgba(230, 236, 244, 0.7)";
    ctx.font = "11px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText(`glass — n = ${N_GLASS.toFixed(2)}`, 12, HEIGHT - 10);
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(228, 194, 122, 0.9)";
    ctx.fillText(
      `θ_i = ${THETA_DEG}°    θ_c = ${thetaCdeg.toFixed(2)}°`,
      WIDTH - 12,
      16,
    );
    ctx.fillText(`d (decay) = ${dInLambdas.toFixed(2)} λ`, WIDTH - 12, 32);
    if (frustrated) {
      ctx.fillStyle =
        T > 0.1 ? "rgba(255, 180, 80, 0.95)" : "rgba(255, 106, 222, 0.85)";
      ctx.fillText(
        `gap = ${gapWavelengths.toFixed(2)} λ    T = ${(T * 100).toFixed(1)} %`,
        WIDTH - 12,
        48,
      );
    }
  }, [frustrated, gapWavelengths, dInLambdas, thetaCdeg, thetaRad, T]);

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
      <div className="mt-3 flex flex-wrap items-center gap-3 px-2">
        <button
          type="button"
          onClick={() => setFrustrated((v) => !v)}
          className="rounded border border-[var(--color-fg-4)] px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-[var(--color-fg-1)] hover:bg-[var(--color-bg-1)]"
        >
          {frustrated ? "MODE · frustrated TIR" : "MODE · normal TIR"}
        </button>
        {frustrated && (
          <div className="flex flex-1 items-center gap-3 min-w-[200px]">
            <label className="text-sm text-[var(--color-fg-3)]">gap (λ)</label>
            <input
              type="range"
              min={0}
              max={3}
              step={0.02}
              value={gapWavelengths}
              onChange={(e) => setGapWavelengths(parseFloat(e.target.value))}
              className="flex-1 accent-[#FF6ADE]"
            />
            <span className="w-14 text-right font-mono text-sm text-[var(--color-fg-1)]">
              {gapWavelengths.toFixed(2)}
            </span>
          </div>
        )}
      </div>
      <p className="px-2 pt-2 text-xs text-[var(--color-fg-3)]">
        Magenta haze above the interface is the evanescent field — it penetrates
        about one wavelength before fading. In frustrated mode a second glass
        slab at gap ≲ d siphons the field back into a propagating ray: optical
        tunnelling.
      </p>
    </div>
  );
}
