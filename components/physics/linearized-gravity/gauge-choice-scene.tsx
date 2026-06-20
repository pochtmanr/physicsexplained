"use client";

import { useEffect, useRef, useState } from "react";
import {
  FONT_HUD_SMALL,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  drawSectionTitle,
  hexToRgba,
  useSceneSize,
  useSceneTick,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import { ringResponse } from "@/lib/physics/relativity/linearized-gravity";

/**
 * FIG.50b — gauge-fixing as choosing honest coordinates.
 *
 * The SAME physical gravitational wave is shown in three coordinate
 * systems applied to one ring of free test masses:
 *
 *   1. "raw"      — an arbitrary gauge: the grid itself wobbles, so the
 *                   masses appear to move even though nothing physical is
 *                   happening to their proper separations. Coordinate noise.
 *   2. "wiggly"   — a different bad gauge: a gauge transformation ξ shifts
 *                   the coordinates around so the picture looks busy but the
 *                   invariant tidal pattern is buried.
 *   3. "TT"       — the transverse-traceless gauge: coordinates ride along
 *                   with freely-falling masses, so the only motion left is
 *                   the true tidal stretch-and-squeeze.
 *
 * A "+"/"×" mix slider and a phase animation drive all three panels with the
 * identical underlying strain; only the TT panel shows the physics cleanly.
 */

const PAD = 16;

type Gauge = "raw" | "wiggly" | "tt";

const PANELS: { key: Gauge; title: string }[] = [
  { key: "raw", title: "ARBITRARY GAUGE" },
  { key: "wiggly", title: "GAUGE ξ APPLIED" },
  { key: "tt", title: "TT GAUGE — honest" },
];

export function GaugeChoiceScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const tickRef = useSceneTick(true);

  const [mix, setMix] = useState(0.0); // 0 = pure +, 1 = pure ×
  const mixRef = useRef(mix);
  useEffect(() => void (mixRef.current = mix), [mix]);

  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.42,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 260,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    let raf = 0;
    const loop = () => {
      const t = tickRef.current / 1000;
      draw(ctx, tokens, mixRef.current, t, width, height);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [tokens, tickRef, width, height]);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="The same gravitational wave shown in three coordinate systems acting on one ring of test masses. The first two panels are arbitrary gauges full of coordinate artifacts; the third is the transverse-traceless gauge, in which only the true tidal stretching and squeezing remains."
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-44 shrink-0">
          polarization: {mix < 0.05 ? "+" : mix > 0.95 ? "×" : `${((1 - mix) * 100).toFixed(0)}% + / ${(mix * 100).toFixed(0)}% ×`}
        </span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={mix}
          onChange={(e) => setMix(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-magenta)" }}
        />
      </div>
      <p className="mt-2 font-mono text-[11px] text-[var(--color-fg-3)]">
        All three panels carry the identical physical wave. Coordinates are a
        choice; only the TT gauge strips the choice away.
      </p>
    </div>
  );
}

function drawRing(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  R: number,
  pts: { x: number; y: number }[],
  ringColor: string,
  dotColor: string,
) {
  // outline
  ctx.strokeStyle = ringColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  pts.forEach((p, i) => {
    const px = cx + p.x * R;
    const py = cy - p.y * R;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.closePath();
  ctx.stroke();
  // masses
  ctx.fillStyle = dotColor;
  for (const p of pts) {
    ctx.beginPath();
    ctx.arc(cx + p.x * R, cy - p.y * R, 2.6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  mix: number,
  t: number,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const phase = t * 1.6;
  const hPlus = (1 - mix) * 0.55;
  const hCross = mix * 0.55;
  const n = 28;

  const panelW = (W - PAD * 2) / 3;
  const R = Math.min(panelW * 0.3, (H - 70) * 0.4);

  PANELS.forEach((panel, idx) => {
    const px0 = PAD + idx * panelW;
    const cx = px0 + panelW / 2;
    const cy = H / 2 + 6;

    // panel border
    ctx.strokeStyle = tokens.panelBorder;
    ctx.lineWidth = 1;
    ctx.strokeRect(px0 + 4, 28, panelW - 8, H - 44);

    const titleColor =
      panel.key === "tt" ? tokens.cyan : tokens.textMute;
    drawSectionTitle(ctx, px0 + 10, 12, panel.title, titleColor);

    // The physical TT response (the truth):
    const ttPts = ringResponse(n, 1, hPlus, hCross, phase);

    if (panel.key === "tt") {
      // faint reference circle
      ctx.strokeStyle = hexToRgba(tokens.gridHeavy, 0.4);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.stroke();
      drawRing(ctx, cx, cy, R, ttPts, tokens.cyan, tokens.cyan);
      // tidal axes
      ctx.strokeStyle = hexToRgba(tokens.amber, 0.5);
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      if (mix < 0.5) {
        ctx.moveTo(cx - R * 1.2, cy);
        ctx.lineTo(cx + R * 1.2, cy);
        ctx.moveTo(cx, cy - R * 1.2);
        ctx.lineTo(cx, cy + R * 1.2);
      } else {
        ctx.moveTo(cx - R * 0.85, cy + R * 0.85);
        ctx.lineTo(cx + R * 0.85, cy - R * 0.85);
        ctx.moveTo(cx - R * 0.85, cy - R * 0.85);
        ctx.lineTo(cx + R * 0.85, cy + R * 0.85);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (panel.key === "raw") {
      // Coordinate artifact: rigid wobble of the WHOLE ring (a pure gauge
      // displacement ξ^i that moves coordinates but not proper separations).
      // Add a bulk translation + breathing that has NO invariant content.
      const wobX = Math.cos(phase) * R * 0.32;
      const wobY = Math.sin(phase * 1.3) * R * 0.18;
      const breathe = 1 + 0.16 * Math.sin(phase * 0.9);
      const pts = Array.from({ length: n }, (_, i) => {
        const th = (2 * Math.PI * i) / n;
        return {
          x: Math.cos(th) * breathe + wobX / R,
          y: Math.sin(th) * breathe + wobY / R,
        };
      });
      drawRing(ctx, cx, cy, R, pts, tokens.magenta, tokens.magenta);
    } else {
      // "wiggly": the TT physics PLUS a coordinate gauge field ξ that adds a
      // node-dependent swirl. Same invariant tidal pattern, buried in noise.
      const pts = ttPts.map((p, i) => {
        const th = (2 * Math.PI * i) / n;
        const swirl = 0.22 * Math.sin(3 * th + phase * 2);
        return {
          x: p.x - swirl * Math.sin(th),
          y: p.y + swirl * Math.cos(th),
        };
      });
      drawRing(ctx, cx, cy, R, pts, tokens.purple, tokens.purple);
    }
  });

  // bottom caption strip
  ctx.fillStyle = tokens.textMute;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText(
    "same wave · three coordinate choices · one physics",
    W / 2,
    H - 4,
  );
  ctx.textAlign = "left";
}
