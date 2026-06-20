"use client";

import { useEffect, useRef, useState } from "react";
import {
  FONT_HUD,
  FONT_HUD_SMALL,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  hexToRgba,
  drawArrow,
  drawSectionTitle,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import { oceanEngine } from "@/lib/physics/thermodynamics/second-law";

/**
 * FIG.09b — Perpetual motion of the second kind, and its cure.
 *
 * An engine that draws heat from a single warm reservoir — the ocean surface —
 * and turns it entirely into work would violate the Kelvin–Planck statement. It
 * does not break energy conservation; the ocean is vast. It breaks the Second
 * Law, and so it cannot run. Switch on a colder deep-water reservoir and the
 * machine springs to life, now bounded by (T_surface − T_deep)/T_surface — the
 * principle behind real ocean-thermal power.
 */

export function PerpetualMotionScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [coldOn, setColdOn] = useState(false);
  const [tSurface, setTSurface] = useState(298); // ~25 °C
  const [tDeep, setTDeep] = useState(278); // ~5 °C

  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.58,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 320,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, tokens, { coldOn, tSurface, tDeep }, width, height);
  }, [coldOn, tSurface, tDeep, tokens, width, height]);

  const effectiveDeep = coldOn ? tDeep : tSurface;
  const result = oceanEngine(tSurface, effectiveDeep);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="An ocean engine. With only a warm surface reservoir it cannot run — perpetual motion of the second kind. With a colder deep reservoir switched on, it runs, bounded by the temperature difference."
      />
      <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-xs">
        <button
          type="button"
          onClick={() => setColdOn((c) => !c)}
          className="cursor-pointer rounded-sm border px-2 py-0.5"
          style={
            coldOn
              ? { borderColor: "var(--color-blue)", color: "var(--color-blue)" }
              : { borderColor: "var(--color-fg-4)", color: "var(--color-fg-3)" }
          }
        >
          {coldOn ? "deep-ocean reservoir: ON" : "deep-ocean reservoir: OFF"}
        </button>
        <span className="text-[var(--color-fg-3)]">
          {result.works
            ? `runs · η ≤ ${(result.efficiencyBound * 100).toFixed(1)}%`
            : "stalled · η ≤ 0% (forbidden)"}
        </span>
      </div>
      <div className="mt-2 flex flex-col gap-2 font-mono text-xs text-[var(--color-fg-2)]">
        <div className="flex items-center gap-3">
          <span className="w-28 shrink-0" style={{ color: "var(--color-red)" }}>
            surface: {(tSurface - 273).toFixed(0)} °C
          </span>
          <input
            type="range"
            min={283}
            max={303}
            step={1}
            value={tSurface}
            onChange={(e) => setTSurface(Math.max(tDeep + 1, parseFloat(e.target.value)))}
            className="flex-1"
            style={{ accentColor: "var(--color-red)" }}
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="w-28 shrink-0" style={{ color: "var(--color-blue)" }}>
            deep: {(tDeep - 273).toFixed(0)} °C
          </span>
          <input
            type="range"
            min={275}
            max={297}
            step={1}
            value={tDeep}
            disabled={!coldOn}
            onChange={(e) => setTDeep(Math.min(tSurface - 1, parseFloat(e.target.value)))}
            className="flex-1"
            style={{ accentColor: "var(--color-blue)", opacity: coldOn ? 1 : 0.4 }}
          />
        </div>
      </div>
    </div>
  );
}

interface DrawState {
  coldOn: boolean;
  tSurface: number;
  tDeep: number;
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
  drawSectionTitle(ctx, 16, 4, "THE OCEAN ENGINE", tokens.textMute);

  const PAD = 16;
  const surfY = PAD + 30;
  const barH = 18;
  const engY = H * 0.5;
  const deepY = H - PAD - 30;
  const cx = W * 0.42;

  // surface (warm) reservoir
  ctx.fillStyle = hexToRgba(tokens.red, 0.22);
  ctx.fillRect(PAD, surfY, W - 2 * PAD, barH);
  ctx.fillStyle = tokens.red;
  ctx.font = FONT_HUD_SMALL;
  ctx.fillText(`WARM SURFACE  T = ${(s.tSurface - 273).toFixed(0)} °C`, PAD + 4, surfY - 4);

  // deep (cold) reservoir — only if on
  if (s.coldOn) {
    ctx.fillStyle = hexToRgba(tokens.blue, 0.22);
    ctx.fillRect(PAD, deepY, W - 2 * PAD, barH);
    ctx.fillStyle = tokens.blue;
    ctx.fillText(`COLD DEEP  T = ${(s.tDeep - 273).toFixed(0)} °C`, PAD + 4, deepY + barH + 11);
  } else {
    ctx.strokeStyle = hexToRgba(tokens.textFaint, 0.6);
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(PAD, deepY, W - 2 * PAD, barH);
    ctx.setLineDash([]);
    ctx.fillStyle = tokens.textFaint;
    ctx.fillText("no cold reservoir", PAD + 4, deepY + barH + 11);
  }

  const effDeep = s.coldOn ? s.tDeep : s.tSurface;
  const res = oceanEngine(s.tSurface, effDeep);

  // heat in from surface
  drawArrow(ctx, cx, surfY + barH, cx, engY - 28, tokens.amber, 2.6, 10);
  ctx.fillStyle = tokens.amber;
  ctx.font = FONT_HUD_SMALL;
  ctx.fillText("Q_in", cx + 8, (surfY + barH + engY) / 2 - 14);

  // engine box
  const boxOk = res.works;
  const bw = 110;
  const bh = 54;
  ctx.fillStyle = boxOk ? hexToRgba(tokens.cyan, 0.1) : hexToRgba(tokens.red, 0.12);
  ctx.fillRect(cx - bw / 2, engY - bh / 2, bw, bh);
  ctx.strokeStyle = boxOk ? tokens.cyan : tokens.red;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(cx - bw / 2, engY - bh / 2, bw, bh);
  ctx.fillStyle = tokens.textBright;
  ctx.font = FONT_HUD;
  ctx.textAlign = "center";
  ctx.fillText("ocean engine", cx, engY - bh / 2 - 6);

  if (boxOk) {
    // work out
    drawArrow(ctx, cx + bw / 2, engY, cx + bw / 2 + 80, engY, tokens.mint, 2.6, 10);
    ctx.fillStyle = tokens.mint;
    ctx.fillText("W", cx + bw / 2 + 92, engY + 4);
    // waste heat to deep
    drawArrow(ctx, cx, engY + bh / 2, cx, deepY, tokens.blue, 2.4, 9);
    ctx.fillStyle = tokens.blue;
    ctx.font = FONT_HUD_SMALL;
    ctx.fillText("Q_out", cx + 8, (engY + deepY) / 2 + 4);
    ctx.fillStyle = tokens.textMute;
    ctx.textAlign = "center";
    ctx.fillText(`η ≤ ${(res.efficiencyBound * 100).toFixed(1)}%`, cx, engY + 4);
  } else {
    ctx.fillStyle = tokens.red;
    ctx.font = FONT_HUD;
    ctx.fillText("✕ cannot run", cx, engY + 4);
    ctx.fillStyle = tokens.textMute;
    ctx.font = FONT_HUD_SMALL;
    ctx.fillText("perpetual motion of the second kind", cx, engY + bh / 2 + 16);
  }

  ctx.textAlign = "left";
}
