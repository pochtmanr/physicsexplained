"use client";

import { useEffect, useRef, useState } from "react";
import { ManifoldCanvas } from "@/components/physics/_shared/ManifoldCanvas";
import {
  applyDpr,
  SCENE_CANVAS_CLASS,
  drawHudReadout,
  drawSectionTitle,
  hexToRgba,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
  SCENE_HEIGHT_SHORT,
} from "@/components/physics/_shared";

/**
 * FIG.35b — Ricci Scalar Heatmap Scene.
 *
 * Compares two surfaces side by side:
 *   Left:  2-sphere of radius r — uniform Ricci scalar R = 2/r² everywhere.
 *          The sphere surface is AMBER-tinted via hexToRgba.
 *   Right: flat plane — R = 0 everywhere. CYAN axes only.
 *
 * HUD readouts (drawn on the flat-plane canvas) show:
 *   "Ricci scalar (sphere): 2/R² ≈ 2.0" in AMBER
 *   "Ricci scalar (flat): 0" in TEXT_MUTE
 *
 * A slider lets the user vary the sphere radius r.
 */

function drawFlatPanel(
  canvas: HTMLCanvasElement,
  tokens: SceneTokens,
  ricciSphere: number,
  PANEL_W: number,
  PANEL_H: number,
) {
  const ctx = applyDpr(canvas, PANEL_W, PANEL_H);
  if (!ctx) return;

  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, PANEL_W, PANEL_H);

  drawSectionTitle(ctx, 12, 10, "FLAT PLANE", tokens.textMute);

  // CYAN axes
  const marginX = 28;
  const marginY = 32;
  const gridW = PANEL_W - 2 * marginX;
  const gridH = PANEL_H - marginY - 52;

  const nx = 10;
  const ny = 8;
  const dx = gridW / nx;
  const dy = gridH / ny;

  ctx.save();
  ctx.strokeStyle = hexToRgba(tokens.cyan, 0.18);
  ctx.lineWidth = 1;
  for (let i = 0; i <= nx; i++) {
    const x = marginX + i * dx;
    ctx.beginPath();
    ctx.moveTo(x, marginY);
    ctx.lineTo(x, marginY + gridH);
    ctx.stroke();
  }
  for (let j = 0; j <= ny; j++) {
    const y = marginY + j * dy;
    ctx.beginPath();
    ctx.moveTo(marginX, y);
    ctx.lineTo(marginX + gridW, y);
    ctx.stroke();
  }
  // CYAN axis lines (heavier)
  ctx.strokeStyle = hexToRgba(tokens.cyan, 0.5);
  ctx.lineWidth = 1.5;
  const axisX = marginX + gridW / 2;
  const axisY = marginY + gridH / 2;
  ctx.beginPath();
  ctx.moveTo(marginX, axisY);
  ctx.lineTo(marginX + gridW, axisY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(axisX, marginY);
  ctx.lineTo(axisX, marginY + gridH);
  ctx.stroke();
  ctx.restore();

  // HUD readouts
  const hudY = marginY + gridH + 8;
  const nextY = drawHudReadout(
    ctx,
    12,
    hudY,
    "Ricci scalar (sphere): ",
    `2/r² ≈ ${ricciSphere.toFixed(2)}`,
    tokens.textDim,
    tokens.amber,
    18,
  );
  drawHudReadout(
    ctx,
    12,
    nextY,
    "Ricci scalar (flat): ",
    "0",
    tokens.textDim,
    tokens.textMute,
    18,
  );
}

function sphereEmbedding(
  u: number,
  v: number,
): readonly [number, number, number] {
  return [Math.sin(u) * Math.cos(v), Math.sin(u) * Math.sin(v), Math.cos(u)];
}

export function RicciScalarHeatmapScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const planeRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const { width: containerWidth } = useSceneSize(containerRef, {
    ratio: 0.5,
    maxHeight: SCENE_HEIGHT_SHORT,
  });
  // Each panel takes ~half the container, accounting for the gap.
  // On narrow viewports the flex layout wraps and each panel renders at full width.
  const panelW = Math.max(220, Math.min(320, (containerWidth - 32) / 2));
  const panelH = SCENE_HEIGHT_SHORT;
  const [sphereRadius, setSphereRadius] = useState(1);
  const [rotTheta, setRotTheta] = useState(0.7);

  // Ricci scalar for sphere of radius r: R = 2/r²
  const ricciScalarValue = 2 / (sphereRadius * sphereRadius);

  // AMBER-tinted surface: scale alpha with curvature (max at r=0.5, min at r=3)
  const tintAlpha = Math.min(0.40, 0.08 + 0.32 * (ricciScalarValue / 8));
  const sphereSurface = hexToRgba(tokens.amber, tintAlpha);

  useEffect(() => {
    if (planeRef.current) drawFlatPanel(planeRef.current, tokens, ricciScalarValue, panelW, panelH);
  }, [ricciScalarValue, tokens, panelW, panelH]);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <div className="flex flex-wrap items-start justify-center gap-6 py-3">
        {/* Left: sphere */}
        <div className="flex flex-col items-center gap-2">
          <span className="font-mono text-xs" style={{ color: tokens.textMute }}>
            2-sphere (r = {sphereRadius.toFixed(1)})
          </span>
          <ManifoldCanvas
            embedding={sphereEmbedding}
            uRange={[0.05, Math.PI - 0.05]}
            vRange={[0, 2 * Math.PI]}
            uSteps={14}
            vSteps={20}
            width={panelW}
            height={panelH}
            rotationY={rotTheta}
            onRotationChange={setRotTheta}
            palette={{
              surface: sphereSurface,
              background: tokens.bg,
            }}
          />
          <span className="font-mono text-xs" style={{ color: tokens.amber }}>
            R = 2/r² = {ricciScalarValue.toFixed(3)}
          </span>
        </div>

        {/* Right: flat plane with HUD */}
        <div className="flex flex-col items-center gap-2">
          <span className="font-mono text-xs" style={{ color: tokens.textMute }}>
            flat plane
          </span>
          <canvas
            ref={planeRef}
            className={SCENE_CANVAS_CLASS}
            style={{ width: panelW, height: panelH, display: "block" }}
            aria-label="Flat plane with zero Ricci scalar. CYAN grid lines show flat Euclidean geometry. HUD readouts compare Ricci scalars for sphere and plane."
          />
        </div>
      </div>

      {/* Radius slider */}
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-1)]">
        <span>sphere radius r</span>
        <input
          type="range"
          min={0.5}
          max={3}
          step={0.1}
          value={sphereRadius}
          onChange={(e) => setSphereRadius(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-amber)" }}
        />
        <span className="w-16 text-right">r = {sphereRadius.toFixed(1)}</span>
      </div>
    </div>
  );
}
