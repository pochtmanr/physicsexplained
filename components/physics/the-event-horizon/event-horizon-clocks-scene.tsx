"use client";

import { useEffect, useRef, useState } from "react";
import {
  FONT_HUD_SMALL,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  hexToRgba,
  drawSectionTitle,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import {
  staticTimeDilation,
  redshiftFactor,
} from "@/lib/physics/relativity/the-event-horizon";

/**
 * FIG.44a — Two clocks at the horizon.
 *
 * A radial infaller's position x = r/r_s is set by a slider (x from 3 down to
 * 1.001). Two analog clocks tick side by side:
 *   • LEFT  ("INFALLER, dτ")  — the wristwatch falling with the observer.
 *     Its second hand sweeps at a constant rate regardless of x. Nothing
 *     special happens locally, even at the horizon.
 *   • RIGHT ("DISTANT, dt")   — the rate a far-away astronomer assigns to the
 *     infaller's clock, dτ/dt = √(1 − 1/x). As x → 1 the right hand crawls to
 *     a halt: the distant view freezes the infaller at the horizon.
 * The infaller's image is also tinted by its gravitational redshift 1+z and
 * dimmed to black as x → 1 (redshift to invisibility).
 */

const PAD = 18;
const TAU = Math.PI * 2;

export function EventHorizonClocksScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [x, setX] = useState(2.5);
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.5,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 300,
  });

  // Accumulated hand angles (proper-time and coordinate-time), advanced in the
  // animation loop so the two clocks visibly drift apart over time.
  const phaseRef = useRef({ proper: 0, distant: 0, last: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;

    let raf = 0;
    const rate = staticTimeDilation(x); // dτ/dt for the distant clock
    const loop = (t: number) => {
      const ph = phaseRef.current;
      const dt = ph.last === 0 ? 0 : (t - ph.last) / 1000;
      ph.last = t;
      // proper-time clock: one revolution every 4 s (constant)
      ph.proper += (dt * TAU) / 4;
      // distant clock: same, scaled by the dilation rate
      ph.distant += (dt * TAU * rate) / 4;
      draw(ctx, tokens, x, ph.proper, ph.distant, width, height);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [x, tokens, width, height]);

  const rate = staticTimeDilation(x);
  const z = redshiftFactor(x);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Two clocks compared as an observer falls toward a black hole horizon. The infaller's own clock ticks at a constant rate while the distant observer sees it slow to a halt at the horizon."
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-44 shrink-0">
          r / r_s = {x.toFixed(3)}
        </span>
        <input
          type="range"
          min={1.001}
          max={3}
          step={0.001}
          value={x}
          onChange={(e) => setX(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-cyan)" }}
        />
      </div>
      <div className="mt-1 flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs text-[var(--color-fg-3)]">
        <span>
          distant tick rate dτ/dt = {rate.toFixed(3)}
        </span>
        <span>
          redshift 1+z = {Number.isFinite(z) ? z.toFixed(2) : "∞"}
        </span>
        <button
          type="button"
          className="cursor-pointer hover:text-[var(--color-fg-1)]"
          onClick={() => setX(2.5)}
        >
          reset
        </button>
        <button
          type="button"
          className="cursor-pointer hover:text-[var(--color-fg-1)]"
          onClick={() => setX(1.001)}
        >
          at the horizon
        </button>
      </div>
    </div>
  );
}

function drawClock(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  R: number,
  angle: number,
  faceColor: string,
  handColor: string,
  rimColor: string,
  frozen: boolean,
) {
  ctx.save();
  // rim
  ctx.strokeStyle = rimColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, TAU);
  ctx.stroke();
  // ticks
  ctx.strokeStyle = hexToRgba(rimColor, 0.5);
  ctx.lineWidth = 1;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU;
    const r0 = R * 0.86;
    const r1 = R * 0.96;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
    ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    ctx.stroke();
  }
  // hand (12 o'clock = up)
  const ha = angle - Math.PI / 2;
  ctx.strokeStyle = handColor;
  ctx.lineWidth = frozen ? 3 : 2.4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(ha) * R * 0.72, cy + Math.sin(ha) * R * 0.72);
  ctx.stroke();
  // hub
  ctx.fillStyle = handColor;
  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  x: number,
  properAngle: number,
  distantAngle: number,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const rate = staticTimeDilation(x);
  const frozen = rate < 0.04;

  // ── radial map strip across the top: hole, horizon, infaller dot ──────────
  const stripY = PAD + 30;
  const stripX0 = PAD;
  const stripX1 = W - PAD;
  const stripW = stripX1 - stripX0;
  drawSectionTitle(ctx, stripX0, PAD + 6, "RADIAL POSITION", tokens.textMute);

  // map r/r_s ∈ [0, 3] onto the strip; hole at x=0 left edge
  const xMax = 3;
  const px = (rr: number) => stripX0 + (rr / xMax) * stripW;
  // baseline
  ctx.strokeStyle = tokens.grid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(stripX0, stripY);
  ctx.lineTo(stripX1, stripY);
  ctx.stroke();

  // horizon marker at x=1
  const hx = px(1);
  ctx.strokeStyle = tokens.amber;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(hx, stripY - 14);
  ctx.lineTo(hx, stripY + 14);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = tokens.amber;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText("horizon  r_s", hx, stripY - 16);

  // black-hole disc from 0..horizon
  ctx.fillStyle = hexToRgba(tokens.textBright, 0.06);
  ctx.fillRect(stripX0, stripY - 8, hx - stripX0, 16);

  // infaller dot
  const dx = px(x);
  ctx.fillStyle = tokens.cyan;
  ctx.beginPath();
  ctx.arc(dx, stripY, 5, 0, TAU);
  ctx.fill();
  ctx.textBaseline = "top";
  ctx.fillStyle = tokens.textMute;
  ctx.fillText("infaller", dx, stripY + 10);

  // ── two clocks below ──────────────────────────────────────────────────────
  const clockY = stripY + 64 + Math.min(120, (H - stripY - 120) / 2 + 20);
  const R = Math.min(70, (W - PAD * 4) / 5);
  const leftCX = W * 0.27;
  const rightCX = W * 0.73;

  // LEFT — infaller proper time (constant rate, full brightness)
  drawSectionTitle(ctx, leftCX - R, clockY - R - 26, "INFALLER  dτ", tokens.cyan);
  drawClock(
    ctx,
    leftCX,
    clockY,
    R,
    properAngle,
    tokens.bg1,
    tokens.cyan,
    tokens.cyan,
    false,
  );
  ctx.fillStyle = tokens.textMute;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("ticks normally — nothing special locally", leftCX, clockY + R + 12);

  // RIGHT — distant view (slowed, redshifted, dimming)
  const dimAlpha = Math.max(0.12, rate); // fades toward black at horizon
  drawSectionTitle(
    ctx,
    rightCX - R,
    clockY - R - 26,
    "DISTANT  dt",
    tokens.magenta,
  );
  drawClock(
    ctx,
    rightCX,
    clockY,
    R,
    distantAngle,
    tokens.bg1,
    hexToRgba(tokens.magenta, Math.max(0.25, dimAlpha)),
    hexToRgba(tokens.magenta, Math.max(0.3, dimAlpha)),
    frozen,
  );
  // redshift / freeze label
  ctx.fillStyle = tokens.textMute;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const msg = frozen
    ? "frozen at the horizon, redshifted to black"
    : `slowed ×${rate.toFixed(2)} and reddened`;
  ctx.fillText(msg, rightCX, clockY + R + 12);

  // freeze flag
  if (frozen) {
    ctx.fillStyle = tokens.amber;
    ctx.textBaseline = "bottom";
    ctx.fillText("dt → ∞", rightCX, clockY - R - 40);
  }
}
