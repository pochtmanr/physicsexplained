"use client";

import { useEffect, useRef, useState } from "react";
import {
  FONT_HUD_SMALL,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  drawSectionTitle,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import {
  createPvMapping,
  isothermalCurve,
  adiabaticCurve,
  axisTicks,
  type PvPoint,
} from "@/lib/physics/thermodynamics/pv-plot";
import {
  compareProcesses,
  MONATOMIC,
  DIATOMIC,
} from "@/lib/physics/thermodynamics/processes";

/**
 * FIG.07a — same compression, two laws.
 *
 * Both paths start at the amber point and are squeezed to the same final volume
 * (drag the slider). The isotherm (red) stays pinned to its temperature, so it
 * obeys PV = const. The adiabat (cyan) traps its heat, so it obeys the steeper
 * PVᵞ = const — and ends both hotter and at higher pressure. The readouts show
 * the gap: identical ΔV, very different destinations.
 */

const N = 1; // mol
const T1 = 300; // K
const V1 = 0.04; // m³ (start expanded; we compress)
const P1 = (N * 8.314462618 * T1) / V1; // Pa
const DOMAIN = { vMin: 0.008, vMax: 0.045, pMin: 0, pMax: 520_000 };

export function IsothermalVsAdiabaticScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();

  const [v2, setV2] = useState(0.018); // m³ final volume
  const [diatomic, setDiatomic] = useState(false);

  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.64,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 320,
  });

  const gamma = diatomic ? DIATOMIC.gamma : MONATOMIC.gamma;
  const cmp = compareProcesses(N, T1, P1, V1, v2, gamma);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, tokens, { v2, gamma, cmp }, width, height);
  }, [v2, gamma, cmp, tokens, width, height]);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="A PV diagram comparing an isothermal and an adiabatic compression of the same gas to the same final volume. The adiabat is steeper and ends at higher pressure and temperature."
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-40 shrink-0">compress to V₂: {(v2 * 1000).toFixed(1)} L</span>
        <input
          type="range"
          min={0.01}
          max={0.039}
          step={0.001}
          value={v2}
          onChange={(e) => setV2(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-cyan)" }}
        />
      </div>
      <div className="mt-2 flex flex-wrap gap-2 font-mono text-xs">
        <button
          type="button"
          onClick={() => setDiatomic(false)}
          className="cursor-pointer rounded-sm border px-2 py-0.5"
          style={
            !diatomic
              ? { borderColor: "var(--color-cyan)", color: "var(--color-cyan)" }
              : { borderColor: "var(--color-fg-4)", color: "var(--color-fg-3)" }
          }
        >
          monatomic (γ = 5/3)
        </button>
        <button
          type="button"
          onClick={() => setDiatomic(true)}
          className="cursor-pointer rounded-sm border px-2 py-0.5"
          style={
            diatomic
              ? { borderColor: "var(--color-cyan)", color: "var(--color-cyan)" }
              : { borderColor: "var(--color-fg-4)", color: "var(--color-fg-3)" }
          }
        >
          diatomic (γ = 7/5)
        </button>
      </div>
      <p className="mt-2 font-mono text-xs text-[var(--color-fg-3)]">
        isotherm: P₂ = {(cmp.isothermal.P2 / 1000).toFixed(0)} kPa, T₂ = {cmp.isothermal.T2.toFixed(0)} K
        {"  ·  "}
        adiabat: P₂ = {(cmp.adiabatic.P2 / 1000).toFixed(0)} kPa, T₂ = {cmp.adiabatic.T2.toFixed(0)} K (hotter)
      </p>
    </div>
  );
}

function plotRect(W: number, H: number) {
  const left = 56;
  const top = 26;
  const right = 18;
  const bottom = 40;
  return { left, top, width: W - left - right, height: H - top - bottom };
}

interface DrawState {
  v2: number;
  gamma: number;
  cmp: ReturnType<typeof compareProcesses>;
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

  drawSectionTitle(ctx, rect.left, 10, "ISOTHERM vs ADIABAT — SAME ΔV", tokens.textMute);

  // grid + ticks
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

  const start: PvPoint = { V: V1, P: P1 };

  // isotherm (red)
  const iso = isothermalCurve(start, s.v2, 80);
  strokeCurve(ctx, mapping, iso, tokens.red, 2.5);
  // adiabat (cyan)
  const adia = adiabaticCurve(start, s.v2, s.gamma, 80);
  strokeCurve(ctx, mapping, adia, tokens.cyan, 2.5);

  // start point
  const sp = mapping.toPx(start);
  ctx.fillStyle = tokens.amber;
  ctx.beginPath();
  ctx.arc(sp.x, sp.y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = tokens.textBright;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "left";
  ctx.fillText("start", sp.x - 30, sp.y - 8);

  // end points
  const isoEnd = mapping.toPx({ V: s.v2, P: s.cmp.isothermal.P2 });
  const adiaEnd = mapping.toPx({ V: s.v2, P: s.cmp.adiabatic.P2 });
  dot(ctx, isoEnd, tokens.red);
  dot(ctx, adiaEnd, tokens.cyan);

  ctx.font = FONT_HUD_SMALL;
  ctx.fillStyle = tokens.cyan;
  ctx.fillText("adiabat", adiaEnd.x + 8, adiaEnd.y + 2);
  ctx.fillStyle = tokens.red;
  ctx.fillText("isotherm", isoEnd.x + 8, isoEnd.y + 4);
}

function strokeCurve(
  ctx: CanvasRenderingContext2D,
  mapping: ReturnType<typeof createPvMapping>,
  curve: PvPoint[],
  color: string,
  lw: number,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.beginPath();
  curve.forEach((pt, i) => {
    const px = mapping.toPx(pt);
    if (i === 0) ctx.moveTo(px.x, px.y);
    else ctx.lineTo(px.x, px.y);
  });
  ctx.stroke();
}

function dot(
  ctx: CanvasRenderingContext2D,
  p: { x: number; y: number },
  color: string,
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
  ctx.fill();
}
