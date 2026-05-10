"use client";

import { useEffect, useRef, useState } from "react";
import { gamma } from "@/lib/physics/relativity/types";
import {
  applyDpr,
  hexToRgba,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";

/**
 * FIG.04b — preview of the light clock for §02.1 time-dilation.
 *
 * Two side-by-side panels:
 *   • LEFT (rest frame).   A photon bounces vertically between two parallel
 *                          mirrors separated by height L. Round-trip time is
 *                          τ₀ = 2L/c.
 *   • RIGHT (boosted frame). The same clock is moving horizontally with
 *                          β = v/c. The photon now traces a longer zig-zag
 *                          diagonal between the two mirrors. By postulate 2
 *                          the photon STILL moves at c — so the round-trip
 *                          must take longer. Δt = γ τ₀.
 *
 * The slider sets β. As β increases the right-hand zig-zag stretches, the
 * γ factor balloons, and the HUD shows the ratio Δt / τ₀ = γ in real time.
 *
 * This scene only PREVIEWS the cliff: this topic doesn't derive Δt = γ τ₀.
 * §02.1 does. But the visual sets up the kinematic question — "if c is the
 * same for both observers, what HAS to give?" — that the next module answers.
 */

const FRAME_DURATION_MS = 4500; // one full round trip in animation time

export function LightClockScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.55,
    maxHeight: SCENE_HEIGHT_DEFAULT,
  });

  const [beta, setBeta] = useState(0.6);
  const [t0, setT0] = useState<number>(() =>
    typeof performance !== "undefined" ? performance.now() : 0,
  );
  const tRef = useRef<number>(0);

  // animate
  useEffect(() => {
    let raf = 0;
    const tick = (now: number) => {
      tRef.current = now;
      const canvas = canvasRef.current;
      if (canvas) draw(canvas);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, beta, tokens, t0]);

  function draw(canvas: HTMLCanvasElement) {
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = tokens.bg;
    ctx.fillRect(0, 0, width, height);

    // phase ∈ [0, 1) — one round trip per FRAME_DURATION_MS at β = 0,
    // ballooning to γ × that at β > 0 (so both frames complete one trip
    // simultaneously in animation time, demonstrating the "lab time grows"
    // intuition without literally syncing photons across frames).
    const phaseRest = ((tRef.current - t0) / FRAME_DURATION_MS) % 1;

    drawRestFrame(ctx, tokens, 0, 0, width / 2, height, phaseRest);
    drawBoostedFrame(ctx, tokens, width / 2, 0, width / 2, height, phaseRest, beta);

    // Divider
    ctx.strokeStyle = tokens.panelBorder;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();

    // HUD
    const g = gamma(beta);
    ctx.fillStyle = tokens.textMute;
    ctx.font = tokens.fontHudSmall;
    ctx.fillText(`rest frame  τ₀ = 2L/c`, 12, 18);
    ctx.fillText(`boosted frame  Δt = γτ₀`, width / 2 + 12, 18);
    ctx.fillText(`γ = ${g.toFixed(3)}`, width / 2 + 12, 36);
  }

  return (
    <div ref={containerRef} className="w-full max-w-[960px] mx-auto p-3">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
      />
      <div className="mt-3 flex items-center gap-3">
        <label htmlFor="lc-beta" className="font-mono text-xs text-[var(--color-fg-2)]">
          β = {beta.toFixed(2)}
        </label>
        <input
          id="lc-beta"
          type="range"
          min={0}
          max={0.95}
          step={0.01}
          value={beta}
          onChange={(e) => {
            setBeta(Number(e.target.value));
            setT0(performance.now()); // restart animation cleanly on slider change
          }}
          className="flex-1"
          style={{ accentColor: "var(--color-magenta)" }}
        />
      </div>
      <p className="mt-2 font-mono text-xs text-[var(--color-fg-3)]">
        Postulate 2 demands the photon moves at c in BOTH frames. The right-hand
        path is longer. Either c gives — or time does.
      </p>
    </div>
  );
}

function drawRestFrame(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  x0: number,
  y0: number,
  w: number,
  h: number,
  phase: number,
) {
  const cx = x0 + w / 2;
  const yTop = y0 + h * 0.18;
  const yBot = y0 + h * 0.78;
  const mirrorHalf = w * 0.16;

  // mirrors
  ctx.strokeStyle = tokens.cyan;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - mirrorHalf, yTop);
  ctx.lineTo(cx + mirrorHalf, yTop);
  ctx.moveTo(cx - mirrorHalf, yBot);
  ctx.lineTo(cx + mirrorHalf, yBot);
  ctx.stroke();

  // L marker
  ctx.strokeStyle = hexToRgba(tokens.textBright, 0.14);
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(cx - mirrorHalf - 16, yTop);
  ctx.lineTo(cx - mirrorHalf - 16, yBot);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = tokens.textMute;
  ctx.font = tokens.fontHudSmall;
  ctx.fillText("L", cx - mirrorHalf - 28, (yTop + yBot) / 2);

  // photon position — bounces top → bottom → top in one full trip
  const u = phase < 0.5 ? phase * 2 : 2 - phase * 2;
  const py = yTop + (yBot - yTop) * u;

  // photon trail
  ctx.strokeStyle = hexToRgba(tokens.amber, 0.35);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx, yTop);
  ctx.lineTo(cx, yBot);
  ctx.stroke();

  // photon
  ctx.fillStyle = tokens.amber;
  ctx.beginPath();
  ctx.arc(cx, py, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowColor = tokens.amber;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(cx, py, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // frame label
  ctx.fillStyle = tokens.cyan;
  ctx.font = tokens.fontHud;
  ctx.fillText("S — clock at rest", x0 + 12, y0 + h - 12);
}

function drawBoostedFrame(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  x0: number,
  y0: number,
  w: number,
  h: number,
  phase: number,
  b: number,
) {
  const yTop = y0 + h * 0.18;
  const yBot = y0 + h * 0.78;
  const L = yBot - yTop;
  // The clock translates horizontally by βct over the round trip.
  // In animation units the round trip is FRAME_DURATION_MS at β=0;
  // we keep that pace and just translate the clock by β × span as phase
  // sweeps 0 → 1.
  const span = w * 0.7; // visible swept distance
  const x0Clock = x0 + w * 0.15;
  const xClock = x0Clock + span * b * phase;

  const mirrorHalf = w * 0.12;

  // ghost mirrors at start (so the user sees the clock translate)
  ctx.strokeStyle = hexToRgba(tokens.magenta, 0.22);
  ctx.lineWidth = 1.5;
  ctx.setLineDash([2, 3]);
  ctx.beginPath();
  ctx.moveTo(x0Clock - mirrorHalf, yTop);
  ctx.lineTo(x0Clock + mirrorHalf, yTop);
  ctx.moveTo(x0Clock - mirrorHalf, yBot);
  ctx.lineTo(x0Clock + mirrorHalf, yBot);
  ctx.stroke();
  ctx.setLineDash([]);

  // current mirrors (magenta for boosted)
  ctx.strokeStyle = tokens.magenta;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(xClock - mirrorHalf, yTop);
  ctx.lineTo(xClock + mirrorHalf, yTop);
  ctx.moveTo(xClock - mirrorHalf, yBot);
  ctx.lineTo(xClock + mirrorHalf, yBot);
  ctx.stroke();

  // photon path — diagonal up then diagonal down
  // Endpoints in lab frame: start at (x0Clock, yTop), bounce at midpoint, end at xClock(t=1) at top.
  const xEnd = x0Clock + span * b;
  const xMid = (x0Clock + xEnd) / 2;
  ctx.strokeStyle = hexToRgba(tokens.amber, 0.45);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x0Clock, yTop);
  ctx.lineTo(xMid, yBot);
  ctx.lineTo(xEnd, yTop);
  ctx.stroke();

  // photon position: parameterize along the zig-zag
  const u = phase < 0.5 ? phase * 2 : 2 - phase * 2;
  const py = yTop + L * u;
  // x position: at u=0 we're at the BOTTOM-of-trip start (xClock); the photon
  // is currently between the moving mirrors (so x = xClock).
  // For the trail visual we place the photon on the moving clock's centerline.
  const px = xClock;

  ctx.fillStyle = tokens.amber;
  ctx.shadowColor = tokens.amber;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(px, py, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // velocity arrow above clock
  ctx.strokeStyle = tokens.magenta;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(xClock - 30, yTop - 18);
  ctx.lineTo(xClock + 30, yTop - 18);
  ctx.lineTo(xClock + 24, yTop - 14);
  ctx.moveTo(xClock + 30, yTop - 18);
  ctx.lineTo(xClock + 24, yTop - 22);
  ctx.stroke();
  ctx.fillStyle = tokens.magenta;
  ctx.font = tokens.fontHudSmall;
  ctx.fillText(`v = ${b.toFixed(2)}c`, xClock - 24, yTop - 24);

  // L (still measured perpendicular to motion — unchanged)
  ctx.strokeStyle = hexToRgba(tokens.textBright, 0.12);
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(x0 + w - 16, yTop);
  ctx.lineTo(x0 + w - 16, yBot);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = tokens.textMute;
  ctx.font = tokens.fontHudSmall;
  ctx.fillText("L", x0 + w - 28, (yTop + yBot) / 2);

  // frame label
  ctx.fillStyle = tokens.magenta;
  ctx.font = tokens.fontHud;
  ctx.fillText("S′ — clock moving with v", x0 + 12, y0 + h - 12);
}
