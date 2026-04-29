"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { gamma } from "@/lib/physics/relativity/types";
import { contractedLength } from "@/lib/physics/relativity/length-contraction";

/**
 * FIG.07c — A pole-and-garage preview, the disturbance only.
 *
 *  • A 5 m pole (proper length) and a 4 m garage (proper length).
 *  • Two viewports stacked vertically:
 *      Top    — GARAGE FRAME: pole rushes through, contracted to 5/γ. At
 *               β = 0.6 → γ = 1.25 → pole is 4 m, exactly fits the 4 m
 *               garage.
 *      Bottom — POLE FRAME: garage rushes past, contracted to 4/γ. At
 *               β = 0.6 the garage is only 3.2 m — too short for the 5 m
 *               pole.
 *  • Both observers run the same physics. Each watches the OTHER frame's
 *    object contract along the direction of motion. Both are "right".
 *
 * This scene does NOT resolve the paradox. The resolution involves the
 * relativity of simultaneity (the two ends of the pole are not inside the
 * garage at the same TIME in the pole's frame), and that's §05.1's job.
 * Here we just plant the disturbance.
 */

const RATIO = 0.85;
const MAX_HEIGHT = 520;

const POLE_PROPER_M = 5;
const GARAGE_PROPER_M = 4;

export function GarageParadoxPreviewScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();

  const [beta, setBeta] = useState(0.6);
  const betaRef = useRef(beta);
  useEffect(() => {
    betaRef.current = beta;
  }, [beta]);

  const [size, setSize] = useState({ width: 720, height: 520 });
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

      const b = betaRef.current;
      const g = gamma(b);

      // Layout: two viewports stacked vertically.
      const halfH = height / 2;
      const padX = 24;
      const innerLeft = padX;
      const innerRight = width - padX;
      const innerW = innerRight - innerLeft;

      // Pixels per meter, common to both frames so visual sizes scale alike.
      // We want 5 m + a generous runway. Allocate 7 m of canvas span.
      const pxPerMeter = innerW / 9;

      // Cycle pacing: pole/garage swept through over 5s.
      const cycleSec = 5;
      const phase = ((t / cycleSec) % 1) * 2 - 1; // -1 → +1

      // ===== TOP VIEWPORT — GARAGE FRAME =====
      const topY = halfH;
      const topMid = halfH * 0.6;

      // Header
      ctx.fillStyle = colors.fg1;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText("garage frame  ·  garage at rest, pole moving →", padX, 16);

      // Garage (cyan, at rest in this frame). Centred horizontally.
      const garageWpx = GARAGE_PROPER_M * pxPerMeter;
      const garageLeft = (width - garageWpx) / 2;
      const garageRight = garageLeft + garageWpx;
      const garageH = halfH * 0.45;
      const garageTopY = topMid - garageH * 0.5;
      const garageBotY = topMid + garageH * 0.5;

      ctx.strokeStyle = colors.cyan;
      ctx.lineWidth = 2;
      // floor
      ctx.beginPath();
      ctx.moveTo(garageLeft - 30, garageBotY);
      ctx.lineTo(garageRight + 30, garageBotY);
      ctx.stroke();
      // walls + ceiling (open both ends, but we draw thin posts for the
      // fronts so the scene reads as a "garage")
      ctx.strokeStyle = "rgba(116, 220, 255, 0.55)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(garageLeft, garageTopY);
      ctx.lineTo(garageRight, garageTopY);
      ctx.stroke();
      // door posts
      ctx.beginPath();
      ctx.moveTo(garageLeft, garageBotY);
      ctx.lineTo(garageLeft, garageTopY);
      ctx.moveTo(garageRight, garageBotY);
      ctx.lineTo(garageRight, garageTopY);
      ctx.stroke();
      // back hatching
      ctx.fillStyle = "rgba(116, 220, 255, 0.06)";
      ctx.fillRect(garageLeft, garageTopY, garageWpx, garageH);

      // Garage label
      ctx.fillStyle = colors.cyan;
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`garage  L = ${GARAGE_PROPER_M} m`, (garageLeft + garageRight) / 2, garageTopY - 8);

      // Pole (magenta, moving). Contracted length = POLE_PROPER / γ.
      const poleContractedM = contractedLength(POLE_PROPER_M, b);
      const polePx = poleContractedM * pxPerMeter;

      // Pole left end position: drift across the viewport.
      const runway = innerW + polePx;
      const poleLeft = innerLeft - polePx + runway * (phase * 0.5 + 0.5);
      const poleRight = poleLeft + polePx;

      ctx.strokeStyle = colors.magenta;
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(poleLeft, topMid);
      ctx.lineTo(poleRight, topMid);
      ctx.stroke();
      ctx.fillStyle = colors.magenta;
      ctx.beginPath();
      ctx.arc(poleLeft, topMid, 4, 0, Math.PI * 2);
      ctx.arc(poleRight, topMid, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = colors.magenta;
      ctx.fillText(
        `pole  ${POLE_PROPER_M} m → ${poleContractedM.toFixed(2)} m  (contracted)`,
        (poleLeft + poleRight) / 2,
        topMid + 18,
      );

      // Annotation: does it fit?
      const fitsInGarage = polePx <= garageWpx + 0.5;
      ctx.fillStyle = fitsInGarage ? colors.cyan : colors.magenta;
      ctx.font = "11px monospace";
      ctx.textAlign = "right";
      ctx.fillText(
        fitsInGarage
          ? `pole fits inside the garage`
          : `pole pokes out`,
        innerRight,
        16,
      );

      // ===== Divider =====
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(0, halfH);
      ctx.lineTo(width, halfH);
      ctx.stroke();

      // ===== BOTTOM VIEWPORT — POLE FRAME =====
      const bottomMid = halfH + halfH * 0.6;

      ctx.fillStyle = colors.fg1;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText(
        "pole frame  ·  pole at rest, garage rushing ←",
        padX,
        halfH + 16,
      );

      // Pole (magenta, at rest in this frame). Centred.
      const polePropPx = POLE_PROPER_M * pxPerMeter;
      const poleLeft2 = (width - polePropPx) / 2;
      const poleRight2 = poleLeft2 + polePropPx;

      ctx.strokeStyle = colors.magenta;
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(poleLeft2, bottomMid);
      ctx.lineTo(poleRight2, bottomMid);
      ctx.stroke();
      ctx.fillStyle = colors.magenta;
      ctx.beginPath();
      ctx.arc(poleLeft2, bottomMid, 4, 0, Math.PI * 2);
      ctx.arc(poleRight2, bottomMid, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = colors.magenta;
      ctx.fillText(
        `pole  L₀ = ${POLE_PROPER_M} m`,
        (poleLeft2 + poleRight2) / 2,
        bottomMid - 14,
      );

      // Garage (cyan, contracted, moving →←). The garage drifts leftward
      // through the viewport in this frame (since the pole sees it
      // approaching from the right).
      const garageContractedM = contractedLength(GARAGE_PROPER_M, b);
      const garageContractedPx = garageContractedM * pxPerMeter;

      const garageRunway = innerW + garageContractedPx;
      const garagePhase = -phase; // move opposite direction
      const garageLeft2 =
        innerLeft - garageContractedPx + garageRunway * (garagePhase * 0.5 + 0.5);
      const garageRight2 = garageLeft2 + garageContractedPx;
      const garageH2 = halfH * 0.45;
      const garageTopY2 = bottomMid - garageH2 * 0.5;
      const garageBotY2 = bottomMid + garageH2 * 0.5;

      ctx.strokeStyle = "rgba(116, 220, 255, 0.55)";
      ctx.lineWidth = 1.4;
      ctx.fillStyle = "rgba(116, 220, 255, 0.06)";
      ctx.fillRect(
        garageLeft2,
        garageTopY2,
        garageContractedPx,
        garageH2,
      );
      ctx.beginPath();
      ctx.moveTo(garageLeft2, garageTopY2);
      ctx.lineTo(garageRight2, garageTopY2);
      ctx.moveTo(garageLeft2, garageBotY2);
      ctx.lineTo(garageRight2, garageBotY2);
      ctx.moveTo(garageLeft2, garageTopY2);
      ctx.lineTo(garageLeft2, garageBotY2);
      ctx.moveTo(garageRight2, garageTopY2);
      ctx.lineTo(garageRight2, garageBotY2);
      ctx.stroke();

      ctx.fillStyle = colors.cyan;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        `garage  ${GARAGE_PROPER_M} m → ${garageContractedM.toFixed(2)} m  (contracted)`,
        (garageLeft2 + garageRight2) / 2,
        garageBotY2 + 14,
      );

      // Annotation: pole fits inside this contracted garage?
      const garageFitsPole = garageContractedPx >= polePropPx - 0.5;
      ctx.fillStyle = garageFitsPole ? colors.cyan : colors.magenta;
      ctx.font = "11px monospace";
      ctx.textAlign = "right";
      ctx.fillText(
        garageFitsPole
          ? "garage now contains the pole"
          : "garage too short for the pole",
        innerRight,
        halfH + 16,
      );

      // ===== Bottom HUD =====
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText(
        `β = ${b.toFixed(2)}   γ = ${g.toFixed(3)}   ` +
          `pole/γ = ${poleContractedM.toFixed(2)} m   ` +
          `garage/γ = ${garageContractedM.toFixed(2)} m`,
        padX,
        height - 8,
      );
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-3">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block bg-[#0A0C12]"
      />
      <div className="mt-3 flex items-center gap-3 px-2 font-mono text-xs text-white/70">
        <label htmlFor="beta-garage" className="shrink-0">
          β = {beta.toFixed(2)}
        </label>
        <input
          id="beta-garage"
          type="range"
          min={0}
          max={0.95}
          step={0.01}
          value={beta}
          onChange={(e) => setBeta(parseFloat(e.target.value))}
          className="w-full accent-[#FF6ADE]"
        />
      </div>
    </div>
  );
}
