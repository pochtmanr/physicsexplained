"use client";

import { useEffect, useRef, useState } from "react";
import {
  FONT_HUD,
  FONT_HUD_SMALL,
  FONT_HUD_LARGE,
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
  createPvMapping,
  cycleNetWork,
  axisTicks,
  type PvPoint,
} from "@/lib/physics/thermodynamics/pv-plot";

/**
 * FIG.06b — a cycle, and the area it encloses.
 *
 * A four-corner loop (two isobaric legs, two isochoric legs) sits on the PV
 * plane. Press "run" and a marker walks the loop; over one full lap the gas
 * returns to its exact starting state, so ΔU = 0 and the first law collapses to
 * Q_net = W_net = the enclosed area. Traverse it clockwise and that area is
 * positive — net work out, a heat engine. Reverse the direction and the same
 * area turns negative — net work in, a refrigerator. The number under the plot
 * is ∮P dV, signed.
 */

const DOMAIN = { vMin: 0.004, vMax: 0.05, pMin: 0, pMax: 320_000 };

// rectangular loop corners (clockwise from top-left)
const V1 = 0.012;
const V2 = 0.04;
const P1 = 90_000;
const P2 = 260_000;
const LOOP_CW: PvPoint[] = [
  { V: V1, P: P2 }, // A
  { V: V2, P: P2 }, // B  (isobaric expansion, top)
  { V: V2, P: P1 }, // C  (isochoric drop, right)
  { V: V1, P: P1 }, // D  (isobaric compression, bottom)
];

export function CycleWorkScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();

  const [running, setRunning] = useState(true);
  const [clockwise, setClockwise] = useState(true);
  const progressRef = useRef(0); // 0..1 around the loop

  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.62,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 320,
  });

  const loop = clockwise ? LOOP_CW : [...LOOP_CW].reverse();
  const netWork = cycleNetWork(loop); // +area clockwise, −area otherwise

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;

    let raf = 0;
    let prev = performance.now();
    const render = () => {
      draw(ctx, tokens, {
        loop,
        netWork,
        clockwise,
        progress: progressRef.current,
      }, width, height);
    };

    if (!running) {
      render();
      return;
    }
    const tick = (now: number) => {
      const dt = (now - prev) / 1000;
      prev = now;
      progressRef.current = (progressRef.current + dt * 0.25) % 1;
      render();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, clockwise, loop, netWork, tokens, width, height]);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="A closed loop on the pressure–volume plane. A marker walks the loop; the enclosed area is the net work per cycle. Clockwise is an engine (work out), counter-clockwise a refrigerator (work in)."
      />
      <div className="mt-3 flex flex-wrap gap-2 font-mono text-xs">
        <button
          type="button"
          onClick={() => setRunning((r) => !r)}
          className="cursor-pointer rounded-sm border px-2 py-0.5"
          style={{ borderColor: "var(--color-cyan)", color: "var(--color-cyan)" }}
        >
          {running ? "pause" : "run"}
        </button>
        <button
          type="button"
          onClick={() => setClockwise((c) => !c)}
          className="cursor-pointer rounded-sm border px-2 py-0.5"
          style={{ borderColor: "var(--color-fg-4)", color: "var(--color-fg-3)" }}
        >
          reverse direction
        </button>
      </div>
      <p className="mt-2 font-mono text-xs text-[var(--color-fg-3)]">
        W_net = ∮P dV = {(netWork / 1000).toFixed(2)} kJ ·{" "}
        {clockwise ? "clockwise → engine (work out)" : "counter-clockwise → refrigerator (work in)"}
      </p>
    </div>
  );
}

function plotRect(W: number, H: number) {
  const left = 56;
  const top = 28;
  const right = 18;
  const bottom = 40;
  return { left, top, width: W - left - right, height: H - top - bottom };
}

interface DrawState {
  loop: PvPoint[];
  netWork: number;
  clockwise: boolean;
  progress: number;
}

/** Position along a closed polygon loop at fractional progress p∈[0,1). */
function loopPoint(loop: PvPoint[], p: number): PvPoint {
  const n = loop.length;
  const seg = p * n;
  const i = Math.floor(seg) % n;
  const f = seg - Math.floor(seg);
  const a = loop[i];
  const b = loop[(i + 1) % n];
  return { V: a.V + (b.V - a.V) * f, P: a.P + (b.P - a.P) * f };
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  s: DrawState,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const rect = plotRect(W, H);
  const mapping = createPvMapping(DOMAIN, rect);

  drawSectionTitle(ctx, rect.left, 10, "ONE CYCLE — ΔU = 0", tokens.textMute);

  // gridlines + ticks
  ctx.strokeStyle = tokens.grid;
  ctx.lineWidth = 1;
  ctx.font = FONT_HUD_SMALL;
  ctx.fillStyle = tokens.textFaint;
  for (const v of axisTicks(DOMAIN.vMin, DOMAIN.vMax, 5)) {
    const { x } = mapping.toPx({ V: v, P: DOMAIN.pMin });
    ctx.beginPath();
    ctx.moveTo(x, rect.top);
    ctx.lineTo(x, rect.top + rect.height);
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.fillText((v * 1000).toFixed(0), x, rect.top + rect.height + 14);
  }
  for (const p of axisTicks(DOMAIN.pMin, DOMAIN.pMax, 4)) {
    const { y } = mapping.toPx({ V: DOMAIN.vMin, P: p });
    ctx.beginPath();
    ctx.moveTo(rect.left, y);
    ctx.lineTo(rect.left + rect.width, y);
    ctx.stroke();
    ctx.textAlign = "right";
    ctx.fillText((p / 1000).toFixed(0), rect.left - 8, y + 3);
  }

  ctx.fillStyle = tokens.textMute;
  ctx.textAlign = "center";
  ctx.fillText("volume V (L)", rect.left + rect.width / 2, H - 6);
  ctx.save();
  ctx.translate(14, rect.top + rect.height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("pressure P (kPa)", 0, 0);
  ctx.restore();
  ctx.textAlign = "left";

  // enclosed area fill
  const engine = s.clockwise;
  const fill = engine ? tokens.cyan : tokens.magenta;
  ctx.beginPath();
  s.loop.forEach((pt, i) => {
    const px = mapping.toPx(pt);
    if (i === 0) ctx.moveTo(px.x, px.y);
    else ctx.lineTo(px.x, px.y);
  });
  ctx.closePath();
  ctx.fillStyle = hexToRgba(fill, 0.16);
  ctx.fill();
  ctx.strokeStyle = fill;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // direction arrowhead at the marker
  const here = loopPoint(s.loop, s.progress);
  const ahead = loopPoint(s.loop, (s.progress + 0.01) % 1);
  const hp = mapping.toPx(here);
  const ap = mapping.toPx(ahead);
  const ang = Math.atan2(ap.y - hp.y, ap.x - hp.x);

  // corner dots
  for (const pt of s.loop) {
    const px = mapping.toPx(pt);
    ctx.fillStyle = hexToRgba(tokens.textFaint, 0.8);
    ctx.beginPath();
    ctx.arc(px.x, px.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // moving marker
  ctx.fillStyle = tokens.amber;
  ctx.beginPath();
  ctx.arc(hp.x, hp.y, 6, 0, Math.PI * 2);
  ctx.fill();
  // little heading triangle
  ctx.save();
  ctx.translate(hp.x, hp.y);
  ctx.rotate(ang);
  ctx.fillStyle = tokens.amber;
  ctx.beginPath();
  ctx.moveTo(10, 0);
  ctx.lineTo(2, -5);
  ctx.lineTo(2, 5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // big net-work label inside the loop
  const center = mapping.toPx({ V: (V1 + V2) / 2, P: (P1 + P2) / 2 });
  ctx.fillStyle = fill;
  ctx.font = FONT_HUD_LARGE;
  ctx.textAlign = "center";
  ctx.fillText(`${(s.netWork / 1000).toFixed(2)} kJ`, center.x, center.y - 4);
  ctx.fillStyle = tokens.textMute;
  ctx.font = FONT_HUD_SMALL;
  ctx.fillText(engine ? "engine" : "fridge", center.x, center.y + 12);
  ctx.textAlign = "left";
}
