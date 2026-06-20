"use client";

import { useEffect, useRef, useState } from "react";
import {
  FONT_HUD_SMALL,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  hexToRgba,
  drawHudReadout,
  drawSectionTitle,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import {
  radialLightSpeed,
  isTrapped,
  outgoingExpansionSign,
} from "@/lib/physics/relativity/singularity-theorems";

/**
 * FIG.59b — The trapped-surface explorer.
 *
 * A Schwarzschild radial diagram: horizontal axis is areal radius r/r_s, the
 * vertical axis is coordinate time t. The horizon sits at r/r_s = 1. Drag the
 * radius slider to place a 2-sphere; at that radius we draw the local radial
 * light cone — the two null rays dr/dt = ±(1 − r_s/r).
 *
 * Outside the horizon the outgoing edge tips *outward* (positive slope): light
 * can still escape. On the horizon the outgoing edge is vertical (frozen at
 * fixed r). Inside the horizon BOTH edges of the cone tip inward — even the
 * "outgoing" wavefront has its area shrinking. That is the definition of a
 * trapped surface, and Penrose's theorem says its mere existence forces a
 * singularity.
 */

const PAD = 16;
const R_MAX = 3; // r/r_s shown

export function TrappedSurfaceScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [rHat, setRHat] = useState(1.8);

  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.55,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 320,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, tokens, rHat, width, height);
  }, [tokens, rHat, width, height]);

  const trapped = isTrapped(rHat);
  const outSpeed = radialLightSpeed(rHat, "outgoing");

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="A Schwarzschild radius-time diagram. A draggable 2-sphere shows its local light cone; inside the horizon even the outgoing null ray moves inward, marking a trapped surface."
      />
      <div className="mt-3 flex flex-col gap-2 font-mono text-xs text-[var(--color-fg-2)]">
        <div className="flex items-center gap-3">
          <span className="w-48 shrink-0">r / r_s = {rHat.toFixed(2)}</span>
          <input
            type="range"
            min={0.25}
            max={R_MAX}
            step={0.01}
            value={rHat}
            onChange={(e) => setRHat(parseFloat(e.target.value))}
            className="flex-1"
            style={{ accentColor: trapped ? "var(--color-red)" : "var(--color-cyan)" }}
          />
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-[var(--color-fg-3)]">
          <button type="button" className="hover:text-[var(--color-fg-1)]" onClick={() => setRHat(2.5)}>
            far field
          </button>
          <button type="button" className="hover:text-[var(--color-fg-1)]" onClick={() => setRHat(1.0)}>
            horizon
          </button>
          <button type="button" className="hover:text-[var(--color-fg-1)]" onClick={() => setRHat(0.5)}>
            interior (trapped)
          </button>
          <span style={{ color: trapped ? "var(--color-red)" : "var(--color-mint)" }}>
            outgoing dr/dt = {outSpeed >= 0 ? "+" : ""}
            {outSpeed.toFixed(2)} c — {trapped ? "TRAPPED" : outSpeed === 0 ? "MARGINAL" : "escapes"}
          </span>
        </div>
      </div>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  rHat: number,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const x0 = PAD + 26;
  const x1 = W - PAD - 8;
  const y0 = PAD + 18;
  const y1 = H - PAD - 22;

  drawSectionTitle(ctx, PAD, PAD - 4, "SCHWARZSCHILD  r – t  DIAGRAM", tokens.textMute);

  const rToX = (r: number) => x0 + (r / R_MAX) * (x1 - x0);
  const horizonX = rToX(1);

  // Interior shading (r < r_s)
  ctx.fillStyle = hexToRgba(tokens.red, 0.1);
  ctx.fillRect(x0, y0, horizonX - x0, y1 - y0);

  // Singularity at r = 0 (left edge)
  ctx.strokeStyle = hexToRgba(tokens.red, 0.9);
  ctx.lineWidth = 2;
  ctx.setLineDash([2, 3]);
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x0, y1);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = tokens.red;
  ctx.font = FONT_HUD_SMALL;
  ctx.save();
  ctx.translate(x0 - 8, (y0 + y1) / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center";
  ctx.fillText("singularity  r = 0", 0, 0);
  ctx.restore();
  ctx.textAlign = "left";

  // Horizon line
  ctx.strokeStyle = hexToRgba(tokens.amber, 0.9);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(horizonX, y0);
  ctx.lineTo(horizonX, y1);
  ctx.stroke();
  ctx.fillStyle = tokens.amber;
  ctx.fillText("horizon  r = r_s", horizonX + 4, y0 + 10);

  // r-axis ticks
  ctx.strokeStyle = tokens.grid;
  ctx.fillStyle = tokens.textFaint;
  ctx.lineWidth = 1;
  for (let r = 0; r <= R_MAX; r += 0.5) {
    const xx = rToX(r);
    ctx.beginPath();
    ctx.moveTo(xx, y1);
    ctx.lineTo(xx, y1 + 3);
    ctx.stroke();
  }
  ctx.fillText("r / r_s →", x1 - 54, y1 + 14);
  // t-axis label
  ctx.save();
  ctx.translate(x0 - 16, (y0 + y1) / 2 + 30);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = tokens.textFaint;
  ctx.fillText("coordinate time t →", 0, 0);
  ctx.restore();

  // ── Sample light cones across radius (faint), to show the tipping ─────────
  const cy = (y0 + y1) * 0.55;
  const coneH = (y1 - y0) * 0.28;
  for (let r = 0.4; r <= R_MAX - 0.1; r += 0.4) {
    if (Math.abs(r - rHat) < 0.18) continue;
    drawCone(ctx, tokens, rToX(r), cy, coneH, r, 0.28);
  }

  // ── The selected 2-sphere + its bold cone ─────────────────────────────────
  const sx = rToX(rHat);
  const trapped = isTrapped(rHat);
  drawCone(ctx, tokens, sx, cy, coneH, rHat, 1);

  // marker dot
  ctx.fillStyle = trapped ? tokens.red : tokens.cyan;
  ctx.beginPath();
  ctx.arc(sx, cy, 4, 0, Math.PI * 2);
  ctx.fill();

  // verdict banner
  const verdict =
    rHat > 1
      ? "OUTGOING LIGHT ESCAPES — untrapped"
      : rHat === 1
      ? "MARGINALLY TRAPPED — outgoing frozen"
      : "TRAPPED SURFACE — even outgoing light falls in";
  ctx.font = FONT_HUD_SMALL;
  ctx.fillStyle = trapped ? tokens.red : tokens.mint;
  ctx.textAlign = "center";
  ctx.fillText(verdict, (x0 + x1) / 2, y0 - 2);
  ctx.textAlign = "left";

  // HUD: expansion signs
  const outSign = outgoingExpansionSign(rHat);
  let hy = y0 + 4;
  hy = drawHudReadout(
    ctx,
    x0 + 6,
    hy,
    "θ₊ (outgoing) ",
    outSign > 0 ? "> 0" : outSign < 0 ? "< 0" : "= 0",
    tokens.textDim,
    outSign <= 0 ? tokens.red : tokens.mint,
  );
  drawHudReadout(
    ctx,
    x0 + 6,
    hy,
    "θ₋ (ingoing)  ",
    "< 0",
    tokens.textDim,
    tokens.red,
  );
}

/** Draw a local radial light cone at screen x sx, vertical center cy.
 *  Slopes come from dr/dt = ±(1 − 1/rHat); we map +dr (rightward) to the
 *  outgoing edge, −dr to the ingoing edge. Vertical = pure time (frozen r). */
function drawCone(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  sx: number,
  cy: number,
  coneH: number,
  rHat: number,
  alpha: number,
) {
  const out = radialLightSpeed(rHat, "outgoing"); // dr/dt, in c
  const ing = radialLightSpeed(rHat, "ingoing");
  // Convert dr/dt into screen dx per upward dt. Larger |dr/dt| → wider tilt.
  // Use a fixed time extent (coneH upward) and a pixel-per-r scale.
  const pxPerR = 60; // visual scale for the cone opening
  const trapped = rHat < 1;
  const fill = trapped ? tokens.red : tokens.cyan;

  // future cone: from (sx, cy) upward by coneH, edges displaced by dr*scale
  const topY = cy - coneH;
  const outDX = out * pxPerR; // outgoing edge horizontal displacement
  const ingDX = ing * pxPerR; // ingoing (negative)

  ctx.save();
  // shaded future cone
  ctx.beginPath();
  ctx.moveTo(sx, cy);
  ctx.lineTo(sx + outDX, topY);
  ctx.lineTo(sx + ingDX, topY);
  ctx.closePath();
  ctx.fillStyle = hexToRgba(fill, 0.12 * alpha);
  ctx.fill();

  // outgoing edge (the diagnostic one)
  ctx.strokeStyle = hexToRgba(trapped ? tokens.red : tokens.mint, 0.95 * alpha);
  ctx.lineWidth = alpha > 0.9 ? 2 : 1;
  ctx.beginPath();
  ctx.moveTo(sx, cy);
  ctx.lineTo(sx + outDX, topY);
  ctx.stroke();

  // ingoing edge
  ctx.strokeStyle = hexToRgba(tokens.blue, 0.85 * alpha);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(sx, cy);
  ctx.lineTo(sx + ingDX, topY);
  ctx.stroke();
  ctx.restore();
}
