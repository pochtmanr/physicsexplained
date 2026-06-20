"use client";

import { useEffect, useRef, useState } from "react";
import {
  FONT_HUD_SMALL,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_TALL,
  applyDpr,
  hexToRgba,
  drawHudReadout,
  drawSectionTitle,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";

/**
 * FIG.42c — where the delay is actually acquired.
 *
 * TOP STRIP: the signal path from Earth (left) past the Sun (center) to the
 *   target (right), drawn straight. Each segment glows in proportion to its
 *   local delay contribution d(Δt)/dx = (2GM/c³)/r, with r = √(b² + x²). The
 *   glow is overwhelmingly concentrated in the short stretch where the ray
 *   skirts the Sun — almost all of the ~hundred microseconds is collected
 *   within a few solar radii of closest approach.
 *
 * BOTTOM PANEL: the cumulative delay Δt(x) sweeping left→right. It is flat far
 *   from the Sun, climbs steeply through closest approach, then flattens —
 *   the integral of the spiky integrand above. A draggable "wavefront" marker
 *   (slider) reports the delay accumulated up to that point.
 *
 * The impact parameter b is adjustable; smaller b → taller, narrower spike.
 */

const PAD = 16;
const R_SUN = 6.957e8;
const GM_SUN = 1.32712440018e20;
const C = 2.99792458e8;
const AU = 1.495978707e11;

function gravTimeScale(): number {
  return (2 * GM_SUN) / Math.pow(C, 3);
}

/** Local delay density d(Δt)/dx = (2GM/c³)/r, r = √(b²+x²). Units: s/m. */
function density(x: number, b: number): number {
  const r = Math.hypot(b, x);
  return r === 0 ? 0 : gravTimeScale() / r;
}

export function AccumulatedDelayScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [bRsun, setBRsun] = useState(2);
  // Wavefront position as fraction 0..1 across the path.
  const [front, setFront] = useState(1);
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.6,
    maxHeight: SCENE_HEIGHT_TALL,
    minHeight: 340,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, tokens, bRsun, front, width, height);
  }, [bRsun, front, tokens, width, height]);

  // Total one-way delay (Earth at +1 AU side, target at −1 AU side).
  const b = bRsun * R_SUN;
  const total = integrateDelay(-AU, AU, b);
  const upTo = integrateDelay(-AU, -AU + front * 2 * AU, b);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="A radar signal path past the Sun with per-segment delay contributions glowing, and the cumulative one-way Shapiro delay along the path."
      />
      <div className="mt-3 flex flex-col gap-2 font-mono text-xs text-[var(--color-fg-2)]">
        <div className="flex items-center gap-3">
          <span className="w-56 shrink-0">b = {bRsun.toFixed(2)} R_⊙</span>
          <input
            type="range"
            min={1.02}
            max={8}
            step={0.02}
            value={bRsun}
            onChange={(e) => setBRsun(parseFloat(e.target.value))}
            className="flex-1"
            style={{ accentColor: "var(--color-cyan)" }}
            aria-label="Impact parameter in solar radii"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="w-56 shrink-0">
            wavefront: {(upTo * 1e6).toFixed(1)} / {(total * 1e6).toFixed(1)} μs
          </span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.005}
            value={front}
            onChange={(e) => setFront(parseFloat(e.target.value))}
            className="flex-1"
            style={{ accentColor: "var(--color-amber)" }}
            aria-label="Wavefront position along the path"
          />
        </div>
      </div>
    </div>
  );
}

/** Trapezoidal integral of the density from x0 to x1 (with x in metres). */
function integrateDelay(x0: number, x1: number, b: number): number {
  const N = 400;
  let acc = 0;
  let prev = density(x0, b);
  for (let i = 1; i <= N; i++) {
    const x = x0 + ((x1 - x0) * i) / N;
    const d = density(x, b);
    acc += ((prev + d) / 2) * ((x1 - x0) / N);
    prev = d;
  }
  return acc;
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  bRsun: number,
  front: number,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const b = bRsun * R_SUN;
  const innerX0 = PAD + 4;
  const innerX1 = W - PAD - 4;
  const plotW = innerX1 - innerX0;

  // Path domain in metres: −AU .. +AU, Sun at center (x=0).
  const X_HALF = AU;
  const sx = (x: number) => innerX0 + ((x + X_HALF) / (2 * X_HALF)) * plotW;

  // ── TOP STRIP: the glowing path ───────────────────────────────────────────
  const stripY0 = PAD + 22;
  const stripH = 84;
  ctx.strokeStyle = tokens.panelBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(PAD, stripY0, W - PAD * 2, stripH);
  drawSectionTitle(ctx, PAD + 6, stripY0 - 16, "SIGNAL PATH  ·  DELAY PER SEGMENT", tokens.textMute);

  const pathY = stripY0 + stripH / 2;

  // Find peak density for normalization (at x=0).
  const peak = density(0, b);

  // Draw the path as many short glowing segments.
  const SEG = 220;
  for (let i = 0; i < SEG; i++) {
    const x = -X_HALF + (2 * X_HALF * (i + 0.5)) / SEG;
    const frac = (x + X_HALF) / (2 * X_HALF);
    const lit = frac <= front;
    const d = density(x, b);
    const norm = d / peak; // 0..1
    const x0 = sx(-X_HALF + (2 * X_HALF * i) / SEG);
    const x1 = sx(-X_HALF + (2 * X_HALF * (i + 1)) / SEG);
    const baseColor = lit ? tokens.amber : tokens.textFaint;
    const alpha = lit ? 0.25 + 0.75 * norm : 0.12 + 0.25 * norm;
    const lw = 2 + norm * 7;
    if (lit && norm > 0.25) {
      ctx.save();
      ctx.shadowColor = tokens.amber;
      ctx.shadowBlur = norm * 16;
      ctx.strokeStyle = hexToRgba(baseColor, alpha);
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(x0, pathY);
      ctx.lineTo(x1, pathY);
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.strokeStyle = hexToRgba(baseColor, alpha);
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(x0, pathY);
      ctx.lineTo(x1, pathY);
      ctx.stroke();
    }
  }

  // Sun marker
  const sunX = sx(0);
  ctx.fillStyle = tokens.amber;
  ctx.beginPath();
  ctx.arc(sunX, pathY, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = hexToRgba(tokens.amber, 0.25);
  ctx.beginPath();
  ctx.arc(sunX, pathY, 16, 0, Math.PI * 2);
  ctx.fill();

  // Endpoint labels
  ctx.font = FONT_HUD_SMALL;
  ctx.fillStyle = tokens.cyan;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("Earth", innerX0 + 2, pathY - 16);
  ctx.fillStyle = tokens.magenta;
  ctx.textAlign = "right";
  ctx.fillText("target", innerX1 - 2, pathY - 16);
  ctx.fillStyle = tokens.amber;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("Sun", sunX, pathY + 18);

  // Wavefront marker
  const frontX = sx(-X_HALF + front * 2 * X_HALF);
  ctx.strokeStyle = tokens.amber;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(frontX, stripY0 + 4);
  ctx.lineTo(frontX, stripY0 + stripH - 4);
  ctx.stroke();

  // ── BOTTOM PANEL: cumulative delay ────────────────────────────────────────
  const plotY0 = stripY0 + stripH + 30;
  const plotY1 = H - PAD - 18;
  const plotX0 = innerX0 + 30;
  const plotX1 = innerX1;
  ctx.strokeStyle = tokens.panelBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(PAD, plotY0 - 14, W - PAD * 2, plotY1 - plotY0 + 30);
  drawSectionTitle(ctx, PAD + 6, plotY0 - 30, "CUMULATIVE DELAY  Δt(x)  (μs)", tokens.textMute);

  // Precompute cumulative curve.
  const N = 240;
  const cum: { x: number; us: number }[] = [];
  let acc = 0;
  let prevD = density(-X_HALF, b);
  cum.push({ x: -X_HALF, us: 0 });
  for (let i = 1; i <= N; i++) {
    const x = -X_HALF + (2 * X_HALF * i) / N;
    const d = density(x, b);
    acc += ((prevD + d) / 2) * ((2 * X_HALF) / N);
    prevD = d;
    cum.push({ x, us: acc * 1e6 });
  }
  const totalUs = acc * 1e6;
  const yTop = totalUs * 1.1 || 1;

  const cx = (x: number) => plotX0 + ((x + X_HALF) / (2 * X_HALF)) * (plotX1 - plotX0);
  const cy = (u: number) => plotY1 - (u / yTop) * (plotY1 - plotY0);

  // Axes
  ctx.strokeStyle = tokens.axes;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(plotX0, plotY0);
  ctx.lineTo(plotX0, plotY1);
  ctx.lineTo(plotX1, plotY1);
  ctx.stroke();

  // y labels
  ctx.font = FONT_HUD_SMALL;
  ctx.fillStyle = tokens.textMute;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (let k = 0; k <= 2; k++) {
    const u = (yTop * k) / 2;
    ctx.fillText(u.toFixed(0), plotX0 - 4, cy(u));
    ctx.strokeStyle = tokens.grid;
    ctx.beginPath();
    ctx.moveTo(plotX0, cy(u));
    ctx.lineTo(plotX1, cy(u));
    ctx.stroke();
  }

  // Sun vertical guide
  ctx.strokeStyle = hexToRgba(tokens.amber, 0.4);
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(cx(0), plotY0);
  ctx.lineTo(cx(0), plotY1);
  ctx.stroke();
  ctx.setLineDash([]);

  // Cumulative curve, split at the wavefront.
  const frontXm = -X_HALF + front * 2 * X_HALF;
  ctx.lineWidth = 2;
  ctx.strokeStyle = tokens.amber;
  ctx.beginPath();
  let started = false;
  for (const p of cum) {
    if (p.x > frontXm) break;
    const X = cx(p.x);
    const Y = cy(p.us);
    if (!started) {
      ctx.moveTo(X, Y);
      started = true;
    } else ctx.lineTo(X, Y);
  }
  ctx.stroke();
  // Faded remainder
  ctx.strokeStyle = hexToRgba(tokens.amber, 0.3);
  ctx.beginPath();
  started = false;
  for (const p of cum) {
    if (p.x < frontXm) continue;
    const X = cx(p.x);
    const Y = cy(p.us);
    if (!started) {
      ctx.moveTo(X, Y);
      started = true;
    } else ctx.lineTo(X, Y);
  }
  ctx.stroke();

  // Wavefront dot + readout
  const upTo = integrateDelay(-X_HALF, frontXm, b) * 1e6;
  const fx = cx(frontXm);
  const fy = cy(upTo);
  ctx.fillStyle = tokens.amber;
  ctx.beginPath();
  ctx.arc(fx, fy, 4, 0, Math.PI * 2);
  ctx.fill();

  drawHudReadout(
    ctx,
    plotX0 + 6,
    plotY0 - 2,
    "total Δt = ",
    `${totalUs.toFixed(1)} μs (one-way)`,
    tokens.textDim,
    tokens.amber,
  );
}
