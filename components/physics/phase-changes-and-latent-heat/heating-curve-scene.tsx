"use client";

import { useEffect, useRef, useState } from "react";
import {
  FONT_HUD,
  FONT_HUD_SMALL,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  hexToRgba,
  drawSectionTitle,
  useSceneSize,
  useSceneTick,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import {
  heatingCurve,
  totalHeat,
  temperatureAtHeat,
  type HeatingSegment,
} from "@/lib/physics/thermodynamics/phase-change";

/**
 * FIG.04a — The heating curve of water.
 *
 * Pour heat steadily into 1 kg of ice at −20 °C and the temperature climbs in
 * five legs: ice warming, the melting plateau (flat at 0 °C), water warming,
 * the boiling plateau (flat at 100 °C), then steam warming. The two plateaus
 * are where latent heat goes — energy in, no temperature change. The boiling
 * plateau is vast: vaporising water costs nearly seven times as much as melting
 * it. Scrub the heat, or press play, and watch the dot stall on each plateau.
 */

const SEGS: HeatingSegment[] = heatingCurve(1, -20, 130);
const Q_TOTAL = totalHeat(SEGS);

export function HeatingCurveScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [qFrac, setQFrac] = useState(0.18);
  const [playing, setPlaying] = useState(false);
  const tickRef = useSceneTick(true);
  const lastRef = useRef(0);
  const qRef = useRef(0.18);

  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.55,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 300,
  });

  // keep ref in sync when slider moves
  qRef.current = qFrac;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;

    let raf = 0;
    const loop = () => {
      const now = tickRef.current / 1000;
      const dt = lastRef.current === 0 ? 0 : Math.min(0.05, now - lastRef.current);
      lastRef.current = now;
      if (playing) {
        let next = qRef.current + dt * 0.12;
        if (next >= 1) {
          next = 1;
          setPlaying(false);
        }
        qRef.current = next;
        setQFrac(next);
      }
      draw(ctx, tokens, qRef.current, width, height);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing, tokens, tickRef, width, height]);

  const q = qFrac * Q_TOTAL;
  const t = temperatureAtHeat(SEGS, q);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Temperature versus heat added for one kilogram of water, from ice at minus twenty Celsius to superheated steam. Five regions with two flat plateaus at the melting and boiling points; a dot advances as heat is added and stalls on each plateau."
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-44 shrink-0">
          Q: {(q / 1000).toFixed(0)} kJ · T: {t.toFixed(0)} °C
        </span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.002}
          value={qFrac}
          onChange={(e) => {
            setPlaying(false);
            setQFrac(parseFloat(e.target.value));
          }}
          className="flex-1"
          style={{ accentColor: "var(--color-amber)" }}
        />
      </div>
      <div className="mt-2 flex flex-wrap gap-2 font-mono text-xs">
        <button
          type="button"
          onClick={() => {
            if (qFrac >= 1) {
              setQFrac(0);
              qRef.current = 0;
            }
            setPlaying((v) => !v);
          }}
          className="cursor-pointer rounded-sm border px-2 py-0.5"
          style={{ borderColor: "var(--color-amber)", color: "var(--color-amber)" }}
        >
          {playing ? "pause" : "play"}
        </button>
      </div>
    </div>
  );
}

const REGION_LABELS = ["ice", "melting", "water", "boiling", "steam"];

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  qFrac: number,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);
  drawSectionTitle(ctx, 16, 8, "HEATING CURVE — 1 kg H₂O", tokens.textMute);

  const PAD = 16;
  const gx0 = PAD + 30;
  const gy0 = PAD + 18;
  const gx1 = W - PAD;
  const gy1 = H - PAD - 28;

  const tMin = -25;
  const tMax = 135;
  const xOf = (q: number) => gx0 + (q / Q_TOTAL) * (gx1 - gx0);
  const yOf = (T: number) => gy1 - ((T - tMin) / (tMax - tMin)) * (gy1 - gy0);

  // axes
  ctx.strokeStyle = tokens.axes;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(gx0, gy0);
  ctx.lineTo(gx0, gy1);
  ctx.lineTo(gx1, gy1);
  ctx.stroke();

  // reference gridlines at 0 and 100 °C
  for (const T of [0, 100]) {
    ctx.strokeStyle = hexToRgba(tokens.gridHeavy, 0.3);
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(gx0, yOf(T));
    ctx.lineTo(gx1, yOf(T));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = tokens.textFaint;
    ctx.font = FONT_HUD_SMALL;
    ctx.textAlign = "right";
    ctx.fillText(`${T}°C`, gx0 - 4, yOf(T) + 3);
  }

  // region backdrops + labels
  SEGS.forEach((s, i) => {
    const x0 = xOf(s.qStart);
    const x1 = xOf(s.qEnd);
    const isLatent = s.kind === "latent";
    ctx.fillStyle = hexToRgba(isLatent ? tokens.cyan : tokens.amber, 0.07);
    ctx.fillRect(x0, gy0, x1 - x0, gy1 - gy0);
    // region label (skip if too narrow)
    if (x1 - x0 > 26) {
      ctx.fillStyle = tokens.textFaint;
      ctx.font = FONT_HUD_SMALL;
      ctx.textAlign = "center";
      ctx.save();
      ctx.translate((x0 + x1) / 2, gy0 + 8);
      ctx.fillText(REGION_LABELS[i], 0, 0);
      ctx.restore();
    }
  });

  // the curve
  ctx.strokeStyle = tokens.red;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  SEGS.forEach((s, i) => {
    if (i === 0) ctx.moveTo(xOf(s.qStart), yOf(s.tStart));
    ctx.lineTo(xOf(s.qEnd), yOf(s.tEnd));
  });
  ctx.stroke();

  // advancing dot
  const q = qFrac * Q_TOTAL;
  const T = temperatureAtHeat(SEGS, q);
  const dx = xOf(q);
  const dy = yOf(T);
  ctx.strokeStyle = hexToRgba(tokens.textFaint, 0.5);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(dx, gy0);
  ctx.lineTo(dx, gy1);
  ctx.stroke();
  ctx.fillStyle = tokens.amber;
  ctx.beginPath();
  ctx.arc(dx, dy, 5, 0, Math.PI * 2);
  ctx.fill();

  // latent-heat callouts on the plateaus
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "center";
  ctx.fillStyle = tokens.cyan;
  const melt = SEGS[1];
  ctx.fillText("334 kJ", (xOf(melt.qStart) + xOf(melt.qEnd)) / 2, yOf(0) - 8);
  const boil = SEGS[3];
  ctx.fillText("2260 kJ", (xOf(boil.qStart) + xOf(boil.qEnd)) / 2, yOf(100) - 8);

  // axis titles
  ctx.fillStyle = tokens.textMute;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "right";
  ctx.fillText("heat added Q →", gx1, gy1 + 16);

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}
