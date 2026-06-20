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
  redshiftFromScaleFactor,
  stretchFactor,
} from "@/lib/physics/relativity/hubble-and-cosmological-redshift";

/**
 * FIG.56b — the stretching photon on the expanding grid.
 *
 * A sine wave drawn across a comoving grid. The wave is "painted" onto space
 * at emission, when the scale factor was a_emit; as the slider moves a from
 * a_emit up to a_now = 1, the gridlines spread apart and the wave stretches
 * with them — its wavelength grows by exactly the factor a_now / a_emit. The
 * redshift z = a_now/a_emit − 1 is read out live. The key teaching point: the
 * photon is not Doppler-shifted by anything's velocity; the wave is stretched
 * because the space it lives in expanded underneath it.
 */

const PAD = 16;
const N_GRID = 12; // comoving cells

export function StretchingPhotonScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  // a_emit: scale factor at emission (< 1). Slider sets how far back.
  const [aEmit, setAEmit] = useState(0.4);
  // a_now: current scale factor we have expanded TO (≥ a_emit, ≤ 1).
  const [aNow, setANow] = useState(1.0);
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.55,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 320,
  });

  const aCur = Math.max(aEmit, aNow);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, tokens, aEmit, aCur, width, height);
  }, [tokens, aEmit, aCur, width, height]);

  const z = redshiftFromScaleFactor(aEmit, aCur);

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="A light wave painted on an expanding comoving grid. As the scale factor grows the gridlines and the wave stretch together; the wavelength grows by the ratio of scale factors and the redshift is shown."
      />
      <div className="mt-3 space-y-2 font-mono text-xs text-[var(--color-fg-2)]">
        <div className="flex items-center gap-3">
          <span className="w-44 shrink-0">a(emit) = {aEmit.toFixed(2)}</span>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.01}
            value={aEmit}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              setAEmit(v);
              if (aNow < v) setANow(v);
            }}
            className="flex-1"
            style={{ accentColor: "var(--color-amber)" }}
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="w-44 shrink-0">a(now) = {aCur.toFixed(2)}</span>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.01}
            value={aCur}
            onChange={(e) => setANow(Math.max(aEmit, parseFloat(e.target.value)))}
            className="flex-1"
            style={{ accentColor: "var(--color-cyan)" }}
          />
        </div>
        <div className="text-[var(--color-fg-3)]">
          1 + z = a(now)/a(emit) = {stretchFactor(z).toFixed(2)} &nbsp;→&nbsp; z = {z.toFixed(2)}
        </div>
      </div>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  aEmit: number,
  aNow: number,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const x0 = PAD;
  const x1 = W - PAD;
  const fieldW = x1 - x0;
  const topY = PAD + 20;
  const botY = H - PAD - 14;

  drawSectionTitle(ctx, x0, PAD - 2, "EXPANDING COMOVING GRID", tokens.textMute);

  // Two reference rows: "then" (at a_emit) and "now" (at a_now), so the
  // viewer sees the same wave at both scale factors.
  const rowThenY = topY + (botY - topY) * 0.32;
  const rowNowY = topY + (botY - topY) * 0.78;

  // ── comoving gridlines: spacing ∝ scale factor ──
  // We anchor the grid at the left edge and let cells widen with a.
  // The full comoving field always spans the canvas at a = 1.
  const drawGrid = (rowY: number, a: number, color: string) => {
    const cellW = (fieldW / N_GRID) * a;
    ctx.strokeStyle = hexToRgba(color, 0.35);
    ctx.lineWidth = 1;
    for (let i = 0; i <= N_GRID; i++) {
      const gx = x0 + i * cellW;
      if (gx > x1 + 1) break;
      ctx.beginPath();
      ctx.moveTo(gx, rowY - 34);
      ctx.lineTo(gx, rowY + 34);
      ctx.stroke();
    }
  };

  // ── the wave: N full wavelengths across the comoving field ──
  // Physical wavelength ∝ a, so at larger a fewer crests fit on screen.
  const N_WAVES = 8; // comoving wave count painted at emission
  const drawWave = (rowY: number, a: number, color: string, lw: number) => {
    const physWaveW = (fieldW / N_WAVES) * a; // on-screen wavelength
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.beginPath();
    const amp = 22;
    for (let px = 0; px <= fieldW; px += 2) {
      const phase = (px / physWaveW) * Math.PI * 2;
      const y = rowY - amp * Math.sin(phase);
      if (px === 0) ctx.moveTo(x0 + px, y);
      else ctx.lineTo(x0 + px, y);
    }
    ctx.stroke();
  };

  // THEN row (emission)
  drawGrid(rowThenY, aEmit, tokens.textFaint);
  drawWave(rowThenY, aEmit, tokens.blue, 2);
  ctx.fillStyle = tokens.textMute;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(`emitted · a = ${aEmit.toFixed(2)}`, x0 + 2, rowThenY - 44);

  // NOW row (received)
  drawGrid(rowNowY, aNow, tokens.textFaint);
  drawWave(rowNowY, aNow, tokens.red, 2.4);
  ctx.fillStyle = tokens.textMute;
  ctx.fillText(`received · a = ${aNow.toFixed(2)}`, x0 + 2, rowNowY - 44);

  // ── wavelength brackets ──
  const physThen = (fieldW / N_WAVES) * aEmit;
  const physNow = (fieldW / N_WAVES) * aNow;
  drawWavelengthBracket(ctx, x0, rowThenY + 40, physThen, tokens.blue, "λ_emit", tokens);
  drawWavelengthBracket(ctx, x0, rowNowY + 40, physNow, tokens.red, "λ_obs", tokens);

  // ── HUD ──
  const z = redshiftFromScaleFactor(aEmit, aNow);
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  let hy = topY + 2;
  hy = drawHudReadout(
    ctx,
    x1 - 172,
    hy,
    "stretch λ_obs/λ_emit = ",
    `${stretchFactor(z).toFixed(2)}×`,
    tokens.textDim,
    tokens.red,
  );
  drawHudReadout(
    ctx,
    x1 - 172,
    hy,
    "redshift  z = ",
    z.toFixed(2),
    tokens.textDim,
    tokens.amber,
  );
  ctx.textBaseline = "alphabetic";
}

function drawWavelengthBracket(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  color: string,
  label: string,
  tokens: SceneTokens,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y - 4);
  ctx.lineTo(x, y + 4);
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.moveTo(x + w, y - 4);
  ctx.lineTo(x + w, y + 4);
  ctx.stroke();
  ctx.fillStyle = tokens.textMute;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x + w + 6, y);
}
