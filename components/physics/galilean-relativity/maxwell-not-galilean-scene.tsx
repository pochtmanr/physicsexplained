"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { galileanWaveSpeed } from "@/lib/physics/relativity/galilean";
import {
  applyDpr,
  hexToRgba,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  useSceneSize,
  useSceneTokens,
} from "@/components/physics/_shared/scene-tokens";

/**
 * FIG.01b — Maxwell is not Galilean-invariant.
 *
 * Three stacked rows.
 *   Row 1 — LAB FRAME: a sinusoidal EM wave (amber pulse) propagating at c.
 *   Row 2 — BOOSTED FRAME (Galilean prediction): same wave, but Galilean
 *           kinematics says it should propagate at c − v in this frame.
 *   Row 3 — BOOSTED FRAME (what Maxwell + experiment actually give): the
 *           wave propagates at c. Same as the lab.
 *
 *   The discrepancy between rows 2 and 3 is the entire engine of §01.
 *   A "Galilean prediction failed" tag lights up when v ≠ 0.
 *
 *   c is shown in arbitrary scene units (1.0 means "speed-of-light in this
 *   plot"); v is the boost as a fraction of c.
 */

export function MaxwellNotGalileanScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tokens = useSceneTokens();

  const [v, setV] = useState(0.4); // boost fraction of c
  const vRef = useRef(v);
  useEffect(() => {
    vRef.current = v;
  }, [v]);

  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.65,
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

      const margin = 24;
      const plotW = width - 2 * margin;

      const cScene = 1.0; // dimensionless "c" in scene units
      const vNow = vRef.current * cScene;
      const cMinusV = galileanWaveSpeed(cScene, vNow);

      const rowH = (height - 60) / 3;
      const rowGap = 6;
      const rows = [
        {
          y: 12,
          title: "LAB FRAME",
          subtitle: "Maxwell wave equation: speed = c.",
          speed: cScene,
          color: tokens.amber,
          accent: tokens.textMute,
        },
        {
          y: 12 + rowH + rowGap,
          title: "BOOSTED FRAME — Galilean prediction",
          subtitle: `If kinematics were Galilean, observer at +v would measure c − v = ${cMinusV.toFixed(2)} c.`,
          speed: cMinusV,
          color: tokens.orange,
          accent: tokens.magenta,
          flag: vRef.current !== 0 ? "PREDICTION ≠ EXPERIMENT" : null,
        },
        {
          y: 12 + 2 * (rowH + rowGap),
          title: "BOOSTED FRAME — what Maxwell + measurement actually give",
          subtitle: "Speed = c. Same as the lab. Galilean rule fails for light.",
          speed: cScene,
          color: tokens.amber,
          accent: tokens.cyan,
        },
      ] as const;

      for (const r of rows) {
        // panel background
        ctx.fillStyle = hexToRgba(tokens.textBright, 0.02);
        ctx.fillRect(margin, r.y, plotW, rowH);
        ctx.strokeStyle = tokens.panelBorder;
        ctx.lineWidth = 0.6;
        ctx.strokeRect(margin + 0.5, r.y + 0.5, plotW - 1, rowH - 1);

        // title
        ctx.fillStyle = tokens.textDim;
        ctx.font = tokens.fontHudSmall;
        ctx.textAlign = "left";
        ctx.fillText(r.title, margin + 6, r.y + 14);
        ctx.fillStyle = r.accent;
        ctx.font = "10px monospace";
        ctx.fillText(r.subtitle, margin + 6, r.y + 28);

        // axis
        const axY = r.y + rowH - 18;
        ctx.strokeStyle = tokens.panelBorder;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(margin + 6, axY);
        ctx.lineTo(margin + plotW - 6, axY);
        ctx.stroke();
        ctx.setLineDash([]);

        // wave packet — sinusoid inside a Gaussian envelope, drifting at r.speed
        const ampPx = (rowH - 50) / 2;
        const lambdaPx = plotW / 6; // visual wavelength
        const k = (2 * Math.PI) / lambdaPx;
        const omega = (k * r.speed) * (plotW / 5); // tune so visible motion at speed=1 is reasonable
        const period = 6.0; // s for one full sweep
        const sweep = ((r.speed === 0 ? 0 : (t / period) * r.speed) % 1 + 1) % 1;
        const xCentrePx = margin + 12 + sweep * (plotW - 24);
        ctx.strokeStyle = r.color;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        const samples = Math.floor(plotW);
        for (let i = 0; i <= samples; i++) {
          const px = margin + 6 + i * ((plotW - 12) / samples);
          const dx = px - xCentrePx;
          const env = Math.exp(-(dx * dx) / (2 * 60 * 60));
          const y = axY - env * ampPx * Math.sin(k * dx + omega * t);
          if (i === 0) ctx.moveTo(px, y);
          else ctx.lineTo(px, y);
        }
        ctx.stroke();

        // crest marker — shows the speed visually
        const crestX = xCentrePx;
        ctx.strokeStyle = r.color;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(crestX, axY - ampPx - 4);
        ctx.lineTo(crestX, axY + 6);
        ctx.stroke();

        // speed readout
        ctx.fillStyle = r.color;
        ctx.font = "10px monospace";
        ctx.textAlign = "right";
        ctx.fillText(`speed = ${r.speed.toFixed(2)} c`, margin + plotW - 6, r.y + 14);

        // failure flag
        if ("flag" in r && r.flag) {
          ctx.fillStyle = tokens.magenta;
          ctx.font = "10px monospace";
          ctx.textAlign = "right";
          ctx.fillText(r.flag, margin + plotW - 6, r.y + 28);
        }
      }

      // Bottom HUD
      ctx.fillStyle = tokens.textDim;
      ctx.font = tokens.fontHud;
      ctx.textAlign = "center";
      ctx.fillText(
        `boost v = ${vRef.current.toFixed(2)} c   →   Galilean predicts c − v = ${cMinusV.toFixed(2)} c   ✗`,
        width / 2,
        height - 10,
      );
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-3">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
      />
      <div className="mt-3 grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2 px-3 text-xs">
        <label className="font-mono text-[var(--color-fg-3)]">boost v / c</label>
        <input
          type="range"
          min={0}
          max={0.95}
          step={0.01}
          value={v}
          onChange={(e) => setV(parseFloat(e.target.value))}
          style={{ accentColor: "var(--color-magenta)" }}
        />
        <span className="w-20 text-right font-mono text-[var(--color-fg-1)]">{v.toFixed(2)} c</span>
      </div>
      <div className="mt-1 px-3 font-mono text-[10px] text-[var(--color-fg-3)]">
        Slide v upward. The middle panel — Galilean prediction — slows down. The bottom panel — actual physics — does not.
      </div>
    </div>
  );
}
