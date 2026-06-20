"use client";

import { useEffect, useRef, useState } from "react";
import {
  FONT_HUD_SMALL,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_TALL,
  applyDpr,
  hexToRgba,
  drawSectionTitle,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import { flammHeight } from "@/lib/physics/relativity/the-schwarzschild-metric";

/**
 * FIG.39c — Flamm's paraboloid embedding diagram.
 *
 * The equatorial spatial slice of the Schwarzschild geometry, embedded in flat
 * 3-space as z(r) = 2√(r_s(r − r_s)). A wireframe funnel rendered in oblique
 * projection: concentric rings (constant r) sink toward a vertical throat at
 * the horizon r = r_s, where the slope is infinite. The mass slider rescales
 * r_s, deepening and widening the well. This is the "rubber sheet" made exact —
 * but only for space, frozen at one instant, outside the horizon.
 */

const PAD = 16;

export function FlammParaboloidScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [massScale, setMassScale] = useState(0.5); // 0..1 → r_s
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.62,
    maxHeight: SCENE_HEIGHT_TALL,
    minHeight: 340,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, tokens, massScale, width, height);
  }, [tokens, massScale, width, height]);

  // r_s grows with mass; label in solar masses for concreteness
  const solarMasses = (0.2 + massScale * 9.8).toFixed(1);

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Flamm's paraboloid: the equatorial slice of Schwarzschild space embedded in flat 3-space as a funnel. Concentric rings sink toward a vertical throat at the horizon. A mass slider deepens and widens the well."
      />
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-44 shrink-0">
          M = {solarMasses} M☉{" "}
          <span className="text-[var(--color-fg-3)]">
            (r_s ∝ M)
          </span>
        </span>
        <input
          type="range"
          min={0.05}
          max={1}
          step={0.01}
          value={massScale}
          onChange={(e) => setMassScale(parseFloat(e.target.value))}
          className="flex-1 min-w-[160px]"
          style={{ accentColor: "var(--color-amber)" }}
        />
      </div>
      <p className="mt-2 font-mono text-[11px] leading-relaxed text-[var(--color-fg-3)]">
        z(r) = 2√(r_s(r − r_s)). The throat is vertical at the horizon — but
        this is the geometry of <em>space alone</em>, one frozen instant; it is
        not the spacetime curvature that makes things fall.
      </p>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  massScale: number,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  drawSectionTitle(
    ctx,
    PAD,
    PAD - 4,
    "FLAMM PARABOLOID — equatorial spatial slice",
    tokens.textMute,
  );

  const cx = W / 2;
  const cy = H * 0.4;
  // Oblique projection: ring of radius r → ellipse (rx, ry), shifted down by z.
  const rsUnits = 1; // horizon at r = 1 in funnel units
  const rMax = 6; // outer radius drawn
  const planScaleBase = Math.min(W * 0.42, (H * 0.42));
  const planScale = planScaleBase / rMax;
  const flatten = 0.32; // ellipse vertical squash for oblique view
  // depth scale grows with mass
  const depthScale = (14 + massScale * 30);

  // map (r, theta) → screen, with vertical drop z(r)
  const project = (r: number, theta: number) => {
    const z = r > rsUnits ? flammHeight(r) : 0;
    const sx = cx + r * planScale * Math.cos(theta);
    const sy =
      cy + r * planScale * flatten * Math.sin(theta) + z * depthScale;
    return { sx, sy };
  };

  // ── radial spokes ─────────────────────────────────────────────────────────
  ctx.strokeStyle = tokens.grid;
  ctx.lineWidth = 1;
  const spokes = 24;
  for (let s = 0; s < spokes; s++) {
    const theta = (s / spokes) * Math.PI * 2;
    ctx.beginPath();
    let started = false;
    for (let r = rsUnits; r <= rMax; r += 0.08) {
      const { sx, sy } = project(r, theta);
      if (!started) {
        ctx.moveTo(sx, sy);
        started = true;
      } else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
  }

  // ── concentric rings (constant r) ──────────────────────────────────────────
  for (let r = rsUnits; r <= rMax; r += 0.5) {
    // color: hot near throat (amber/red), cool far out (cyan)
    const tcol = Math.min(1, (r - rsUnits) / (rMax - rsUnits));
    const near = tokens.amber;
    const far = tokens.cyan;
    ctx.strokeStyle =
      r <= rsUnits + 0.01
        ? hexToRgba(tokens.red, 0.95)
        : hexToRgba(tcol < 0.5 ? near : far, 0.55 + 0.35 * (1 - tcol));
    ctx.lineWidth = r <= rsUnits + 0.01 ? 2 : 1.2;
    ctx.beginPath();
    for (let a = 0; a <= 64; a++) {
      const theta = (a / 64) * Math.PI * 2;
      const { sx, sy } = project(r, theta);
      if (a === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
  }

  // ── horizon throat highlight + label ───────────────────────────────────────
  const throat = project(rsUnits, Math.PI / 2);
  ctx.fillStyle = hexToRgba(tokens.red, 0.95);
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("horizon r = r_s (vertical throat)", cx, throat.sy + 8);

  // far rim label
  const rim = project(rMax, -Math.PI / 2);
  ctx.fillStyle = tokens.textMute;
  ctx.textBaseline = "bottom";
  ctx.fillText("asymptotically flat", cx, rim.sy - 6);

  // ── HUD ─────────────────────────────────────────────────────────────────
  ctx.fillStyle = tokens.textDim;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(
    `depth ∝ √(r − r_s)   ·   slope → ∞ at r_s`,
    PAD,
    H - PAD - 12,
  );
}
