"use client";

import { useEffect, useRef } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import {
  applyDpr,
  hexToRgba,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  useSceneSize,
  useSceneTokens,
} from "@/components/physics/_shared/scene-tokens";

/**
 * FIG.10c — Cosmological-redshift PREVIEW (forward-link to §12.3).
 *
 *   Palette: amber for the photon track; magenta for the receding
 *   galaxy; cyan for the stationary lab source.
 */

const Z = 1.0;

export function CosmologicalPreviewScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.55,
    maxHeight: SCENE_HEIGHT_DEFAULT,
  });

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (t) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = applyDpr(canvas, width, height);
      if (!ctx) return;

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = tokens.bg;
      ctx.fillRect(0, 0, width, height);

      const cycle = 4;
      const tCycle = (t % cycle) / cycle;
      const a = 1 + tCycle;

      const margin = 20;
      const top = margin;
      const bottom = height * 0.6;
      const midY = (top + bottom) / 2;

      ctx.save();
      ctx.beginPath();
      ctx.rect(margin, top, width - 2 * margin, bottom - top);
      ctx.clip();

      const cellRest = 32;
      const cell = cellRest * a;
      ctx.strokeStyle = hexToRgba(tokens.textFaint, 0.7);
      ctx.lineWidth = 1;
      const cx = (margin + width - margin) / 2;
      for (let x = cx; x < width; x += cell) {
        ctx.beginPath();
        ctx.moveTo(x, top);
        ctx.lineTo(x, bottom);
        ctx.stroke();
      }
      for (let x = cx - cell; x > margin; x -= cell) {
        ctx.beginPath();
        ctx.moveTo(x, top);
        ctx.lineTo(x, bottom);
        ctx.stroke();
      }
      for (let y = midY; y < bottom; y += cell) {
        ctx.beginPath();
        ctx.moveTo(margin, y);
        ctx.lineTo(width - margin, y);
        ctx.stroke();
      }
      for (let y = midY - cell; y > top; y -= cell) {
        ctx.beginPath();
        ctx.moveTo(margin, y);
        ctx.lineTo(width - margin, y);
        ctx.stroke();
      }

      // Galaxy
      const galaxyRest = -160;
      const galaxyX = cx + galaxyRest * a;
      ctx.shadowColor = hexToRgba(tokens.magenta, 0.6);
      ctx.shadowBlur = 14;
      ctx.fillStyle = tokens.magenta;
      ctx.beginPath();
      ctx.arc(galaxyX, midY, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Observer
      const obsX = cx + 180;
      ctx.fillStyle = tokens.cyan;
      ctx.beginPath();
      ctx.arc(obsX, midY, 7, 0, Math.PI * 2);
      ctx.fill();

      // Wavelength tracker
      const path = obsX - galaxyX;
      const lambdaPx = (path / 3) * (a / 1);
      const k = (2 * Math.PI) / lambdaPx;
      ctx.strokeStyle = tokens.amber;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      const N = 80;
      for (let i = 0; i <= N; i++) {
        const f = i / N;
        const px = galaxyX + path * f;
        const py = midY - 16 * Math.sin(k * (px - galaxyX));
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      ctx.restore();

      ctx.font = "11px monospace";
      ctx.fillStyle = tokens.magenta;
      ctx.textAlign = "center";
      ctx.fillText("galaxy at z = 1", galaxyX, top - 6);
      ctx.fillStyle = tokens.cyan;
      ctx.fillText("us", obsX, top - 6);

      ctx.fillStyle = tokens.textMute;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`a(t) = ${a.toFixed(2)}`, margin + 6, top + 14);
      ctx.fillText("(scale factor — space itself stretches)", margin + 6, top + 30);

      // Punchline panel
      const panelTop = bottom + 14;
      const panelBottom = height - margin;
      ctx.fillStyle = hexToRgba(tokens.amber, 0.07);
      ctx.fillRect(margin, panelTop, width - 2 * margin, panelBottom - panelTop);
      ctx.strokeStyle = hexToRgba(tokens.amber, 0.35);
      ctx.lineWidth = 1;
      ctx.strokeRect(margin, panelTop, width - 2 * margin, panelBottom - panelTop);

      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillStyle = tokens.amber;
      ctx.fillText("⚠ this is NOT relativistic Doppler", margin + 12, panelTop + 18);
      ctx.fillStyle = tokens.textDim;
      ctx.fillText(
        "It is metric expansion. λ_obs / λ_emit = a_now / a_then = 1 + z.",
        margin + 12,
        panelTop + 36,
      );
      ctx.fillStyle = tokens.textMute;
      ctx.font = "11px monospace";
      ctx.fillText(
        `at z = ${Z.toFixed(1)}: λ stretched by 1+z = ${(1 + Z).toFixed(0)}× — see §12.3 hubble-and-cosmological-redshift`,
        margin + 12,
        panelTop + 54,
      );
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
      />
      <p className="mt-2 px-2 font-mono text-xs text-[var(--color-fg-3)]">
        forward-link · §12.3 hubble-and-cosmological-redshift covers this in
        detail. Brought up here only to mark the boundary of §02.5&apos;s claim.
      </p>
    </div>
  );
}
