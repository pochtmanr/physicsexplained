"use client";

import { useEffect, useRef, useState } from "react";
import {
  FONT_HUD_SMALL,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  drawHudReadout,
  drawSectionTitle,
  hexToRgba,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import {
  localizationAreaDeg2,
} from "@/lib/physics/relativity/ligo-and-multi-messenger";

/**
 * FIG.53c — Sky triangulation.
 *
 * A gravitational wave reaches the detectors at slightly different times. Each
 * detector *pair* fixes the source to a ring on the sky (the locus of
 * directions giving the measured delay). With two detectors you get one fat
 * ring spanning the sky; adding a third detector gives a second ring, and the
 * two rings intersect in a small patch — which is why Virgo joining Hanford
 * and Livingston shrank the GW170817 localization to ~28 deg², small enough for
 * optical telescopes to find the kilonova.
 *
 * Toggle 2↔3 detectors and drag the timing precision to watch the rings — and
 * the localization area — thicken or shrink.
 */

const PAD = 18;
const BASELINE_KM = 3000; // Hanford–Livingston scale

export function SkyTriangulationScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [nDet, setNDet] = useState<2 | 3>(3);
  const [sigmaUs, setSigmaUs] = useState(50); // timing precision, microseconds
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.62,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 320,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, tokens, nDet, sigmaUs, width, height);
  }, [tokens, nDet, sigmaUs, width, height]);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="A patch of sky. Each detector pair constrains the gravitational-wave source to a ring. With two detectors a single broad ring is shown; with three detectors a second ring intersects it, isolating a small localization patch. A slider sets the arrival-time precision, thickening or thinning the rings."
      />
      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-xs text-[var(--color-fg-3)]">
        {([2, 3] as const).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setNDet(n)}
            className="cursor-pointer border px-3 py-1"
            style={{
              borderColor:
                nDet === n ? "var(--color-cyan)" : "var(--color-fg-4)",
              color: nDet === n ? "var(--color-cyan)" : "var(--color-fg-3)",
            }}
          >
            {n} detectors
          </button>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-44 shrink-0">timing σ = {sigmaUs} µs</span>
        <input
          type="range"
          min={5}
          max={200}
          step={5}
          value={sigmaUs}
          onChange={(e) => setSigmaUs(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-magenta)" }}
        />
      </div>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  nDet: 2 | 3,
  sigmaUs: number,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  drawSectionTitle(ctx, PAD, PAD - 6, "SKY LOCALIZATION", tokens.textMute);

  // Sky panel: an ellipse standing in for a patch of the celestial sphere.
  const cx = W * 0.42;
  const cy = H * 0.52;
  const rx = Math.min(W * 0.36, 240);
  const ry = Math.min(H * 0.4, 180);

  // Star field.
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = hexToRgba(tokens.textBright, 0.5);
  for (let i = 0; i < 90; i++) {
    const a = (i * 2.39996); // golden angle
    const r = (i / 90) * Math.max(rx, ry) * 1.1;
    const sx = cx + Math.cos(a) * r * (rx / Math.max(rx, ry));
    const sy = cy + Math.sin(a) * r * (ry / Math.max(rx, ry));
    ctx.fillRect(sx, sy, 1, 1);
  }
  ctx.restore();

  // Sky boundary.
  ctx.strokeStyle = tokens.panelBorder;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();

  // True source location.
  const srcX = cx + rx * 0.18;
  const srcY = cy - ry * 0.12;

  // Ring thickness in pixels, scaled from timing precision. Better timing
  // (smaller σ) → thinner rings.
  const sigmaT = sigmaUs * 1e-6;
  const thicknessPx = Math.max(4, sigmaUs * 0.6);

  // ── Ring 1 (detector pair A–B): a band passing through the source ─────────
  drawRingBand(ctx, cx, cy, rx, ry, srcX, srcY, 0.4, thicknessPx, tokens.cyan);

  // ── Ring 2 (third detector adds pair A–C): crosses ring 1 at the source ───
  if (nDet === 3) {
    drawRingBand(
      ctx,
      cx,
      cy,
      rx,
      ry,
      srcX,
      srcY,
      Math.PI / 2 + 0.4,
      thicknessPx,
      tokens.magenta,
    );

    // Highlight the intersection patch.
    const patchR = Math.max(6, thicknessPx * 0.9);
    const glow = ctx.createRadialGradient(srcX, srcY, 0, srcX, srcY, patchR * 2);
    glow.addColorStop(0, hexToRgba(tokens.amber, 0.85));
    glow.addColorStop(1, hexToRgba(tokens.amber, 0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(srcX, srcY, patchR * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Source marker.
  ctx.fillStyle = tokens.textBright;
  ctx.beginPath();
  ctx.arc(srcX, srcY, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // ── HUD readouts ──────────────────────────────────────────────────────────
  const area = localizationAreaDeg2(nDet, sigmaT, BASELINE_KM);
  const hx = W - PAD - 196;
  let y = PAD + 12;
  y = drawHudReadout(
    ctx,
    hx,
    y,
    "detectors = ",
    `${nDet}`,
    tokens.textDim,
    tokens.cyan,
  );
  y = drawHudReadout(
    ctx,
    hx,
    y,
    "timing σ = ",
    `${sigmaUs} µs`,
    tokens.textDim,
    tokens.magenta,
  );
  y = drawHudReadout(
    ctx,
    hx,
    y,
    "sky area ≈ ",
    area >= 1000 ? `${(area / 1000).toFixed(1)}k deg²` : `${area.toFixed(0)} deg²`,
    tokens.textDim,
    tokens.amber,
  );

  ctx.font = FONT_HUD_SMALL;
  ctx.fillStyle = tokens.textFaint;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  const note =
    nDet === 2
      ? "2 detectors → a ring, not a point"
      : "3rd detector → rings cross → patch";
  ctx.fillText(note, hx, y + 4);
  ctx.fillText("GW170817: 3 detectors → 28 deg²", hx, y + 20);
}

/**
 * Draw a translucent ring band crossing the sky ellipse along a chord at angle
 * `angle`, passing through (sx, sy), with pixel half-width `halfW`.
 */
function drawRingBand(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  sx: number,
  sy: number,
  angle: number,
  halfW: number,
  color: string,
) {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const nx = -dy;
  const ny = dx;
  const len = Math.max(rx, ry) * 2.4;

  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.clip();

  // Filled band.
  ctx.fillStyle = hexToRgba(color, 0.16);
  ctx.beginPath();
  ctx.moveTo(sx + dx * len + nx * halfW, sy + dy * len + ny * halfW);
  ctx.lineTo(sx - dx * len + nx * halfW, sy - dy * len + ny * halfW);
  ctx.lineTo(sx - dx * len - nx * halfW, sy - dy * len - ny * halfW);
  ctx.lineTo(sx + dx * len - nx * halfW, sy + dy * len - ny * halfW);
  ctx.closePath();
  ctx.fill();

  // Centre line.
  ctx.strokeStyle = hexToRgba(color, 0.85);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(sx + dx * len, sy + dy * len);
  ctx.lineTo(sx - dx * len, sy - dy * len);
  ctx.stroke();
  ctx.restore();
}
