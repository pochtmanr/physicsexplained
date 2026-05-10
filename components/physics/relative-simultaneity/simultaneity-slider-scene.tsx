"use client";

import { useEffect, useRef, useState } from "react";
import {
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  hexToRgba,
  useSceneSize,
  useSceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import { tPrimeDifference } from "@/lib/physics/relativity/simultaneity";
import { SPEED_OF_LIGHT } from "@/lib/physics/constants";

/**
 * FIG.05c — Three observers, one slider.
 *
 * Two events A and B, simultaneous in the lab frame, separated by L = 600 m
 * along x. Three observers:
 *
 *   • cyan stationary observer (β = 0):    A and B simultaneous.
 *   • magenta toward-A observer (β = -|s|): sees A first.
 *   • amber toward-B observer (β = +|s|):   sees B first.
 *
 * The slider drives |s| from 0 → 0.95. Each observer's strip shows two
 * markers placed by the actual t' values from `tPrimeDifference`.
 *
 * The bottom-of-canvas conclusion text fades in as |β| crosses 0.05:
 *   "There is no privileged 'now' extending across space."
 */

const L = 600; // meters between events along x
const T_MAX_FRAMING = (1.05 * L) / SPEED_OF_LIGHT; // domain for the strip mapping

export function SimultaneitySliderScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [beta, setBeta] = useState(0);

  const { width: W, height: H } = useSceneSize(containerRef, {
    ratio: 0.5,
    maxHeight: SCENE_HEIGHT_DEFAULT,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, W, H);
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = tokens.bg;
    ctx.fillRect(0, 0, W, H);

    // Common strip layout: time axis maps from -T_MAX to +T_MAX onto the strip.
    const stripX0 = Math.max(110, W * 0.18);
    const stripX1 = W - 50;
    const stripW = stripX1 - stripX0;
    const cxStrip = stripX0 + stripW / 2;
    const tToFraction = (t: number) =>
      Math.max(-1, Math.min(1, t / T_MAX_FRAMING));
    const tToPx = (t: number) => cxStrip + tToFraction(t) * (stripW / 2);

    const rowYs = [H * 0.31, H * 0.5, H * 0.69];

    // Observer mappings. Events A at x = 0, B at x = +L, both at t = 0 (lab).
    type ObserverRow = {
      label: string;
      betaUsed: number;
      color: string;
      y: number;
      conclusion: string;
    };
    const observers: ObserverRow[] = [
      {
        label: "stationary",
        betaUsed: 0,
        color: tokens.cyan,
        y: rowYs[0],
        conclusion: "A and B simultaneous",
      },
      {
        label: "toward A",
        betaUsed: -Math.abs(beta),
        color: tokens.magenta,
        y: rowYs[1],
        conclusion: "A first",
      },
      {
        label: "toward B",
        betaUsed: +Math.abs(beta),
        color: tokens.amber,
        y: rowYs[2],
        conclusion: "B first",
      },
    ];

    // Headers
    ctx.fillStyle = tokens.textBright;
    ctx.font = "13px ui-monospace, monospace";
    ctx.fillText("Three observers, one pair of events", 12, 28);
    ctx.fillStyle = tokens.textMute;
    ctx.font = "11px ui-monospace, monospace";
    ctx.fillText(
      `A at x = 0,  B at x = ${L} m,  both at t = 0 (lab frame).  |β| = ${Math.abs(beta).toFixed(2)}`,
      12,
      46,
    );

    // Time axis label
    ctx.fillStyle = tokens.textFaint;
    ctx.fillText("← earlier   t' (each observer's frame)   later →", stripX0, 70);

    // Center reference line
    ctx.strokeStyle = hexToRgba(tokens.textFaint, 0.5);
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.moveTo(cxStrip, rowYs[0] - 20);
    ctx.lineTo(cxStrip, rowYs[2] + 30);
    ctx.stroke();
    ctx.setLineDash([]);

    // Each observer row
    for (const obs of observers) {
      // Strip line
      ctx.strokeStyle = obs.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(stripX0, obs.y);
      ctx.lineTo(stripX1, obs.y);
      ctx.stroke();

      // Label
      ctx.fillStyle = obs.color;
      ctx.font = "12px ui-monospace, monospace";
      ctx.fillText(obs.label, 12, obs.y - 4);
      ctx.fillStyle = tokens.textMute;
      ctx.font = "10px ui-monospace, monospace";
      ctx.fillText(`β = ${obs.betaUsed.toFixed(2)}`, 12, obs.y + 12);

      // Compute t'_A and t'_B in this observer's frame using the lab event
      // pair (A at (0,0), B at (0, L)). Reference event = A.
      const dtA = tPrimeDifference(0, 0, 0, 0, obs.betaUsed); // = 0
      const dtB = tPrimeDifference(0, L, 0, 0, obs.betaUsed); // = γ ( -β L / c )

      // Draw markers for A and B on the strip
      const drawMark = (
        t: number,
        label: string,
        markerColor: string,
      ) => {
        const px = tToPx(t);
        ctx.fillStyle = markerColor;
        ctx.beginPath();
        ctx.arc(px, obs.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = tokens.textBright;
        ctx.font = "11px ui-monospace, monospace";
        ctx.fillText(label, px - 3, obs.y - 10);
      };
      drawMark(dtA, "A", tokens.cyan);
      drawMark(dtB, "B", tokens.amber);

      // Conclusion text (right-aligned at end of row)
      const concText =
        obs.betaUsed === 0
          ? obs.conclusion
          : Math.abs(beta) < 0.02
            ? obs.conclusion + " (≈ simultaneous)"
            : obs.conclusion;
      ctx.fillStyle = obs.color;
      ctx.font = "11px ui-monospace, monospace";
      const tw = ctx.measureText(concText).width;
      ctx.fillText(concText, stripX1 - tw, obs.y + 22);
    }

    // Bottom conclusion (fades in past |β| > 0.05)
    const opacity = Math.min(1, Math.max(0, (Math.abs(beta) - 0.05) / 0.15));
    ctx.fillStyle = hexToRgba(tokens.amber, opacity);
    ctx.font = 'italic 13px ui-monospace, monospace';
    const conclusion = "There is no privileged 'now' extending across space.";
    const cwidth = ctx.measureText(conclusion).width;
    ctx.fillText(conclusion, (W - cwidth) / 2, H - 24);
  }, [beta, tokens, W, H]);

  return (
    <div ref={containerRef} className="flex w-full flex-col gap-2">
      <canvas
        ref={canvasRef}
        style={{ width: W, height: H, display: "block" }}
        className={SCENE_CANVAS_CLASS}
      />
      <label className="flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span>|β| = {Math.abs(beta).toFixed(2)}</span>
        <input
          type="range"
          min={0}
          max={0.95}
          step={0.01}
          value={Math.abs(beta)}
          onChange={(e) => setBeta(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-cyan)" }}
        />
      </label>
    </div>
  );
}
