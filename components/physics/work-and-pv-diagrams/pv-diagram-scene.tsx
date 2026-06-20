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
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import {
  createPvMapping,
  processCurve,
  workUnderCurve,
  axisTicks,
  type PvPoint,
  type ProcessKind,
} from "@/lib/physics/thermodynamics/pv-plot";
import { MONATOMIC } from "@/lib/physics/thermodynamics/calorimetry";

/**
 * FIG.06a — the PV plane, drawn.
 *
 * A fixed start state sits on the plane; the reader drags the end point left or
 * right to set the final volume, and a chosen canonical process (isobaric,
 * isochoric, isothermal, adiabatic) draws the path between them automatically.
 * The area under the path is shaded — that area is the work W = ∫P dV done by
 * the gas. Expansion shades positive (work out); compression shades the area
 * with a minus sign (work in). The whole point Clapeyron made in 1834: a number
 * you integrate becomes a region you can see.
 */

const START: PvPoint = { V: 0.012, P: 240_000 }; // m³, Pa
const DOMAIN = { vMin: 0.004, vMax: 0.05, pMin: 0, pMax: 320_000 };
const GAMMA = MONATOMIC.gamma; // 5/3

const PROCESSES: { kind: ProcessKind; label: string }[] = [
  { kind: "isobaric", label: "isobaric" },
  { kind: "isochoric", label: "isochoric" },
  { kind: "isothermal", label: "isothermal" },
  { kind: "adiabatic", label: "adiabatic" },
];

export function PvDiagramScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const draggingRef = useRef(false);

  const [kind, setKind] = useState<ProcessKind>("isothermal");
  const [endV, setEndV] = useState(0.03); // m³, the draggable target volume

  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.62,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 320,
  });

  // Isochoric holds volume fixed, so the drag has no horizontal effect: the path
  // is a vertical line from the start pressure down to a fixed lower pressure,
  // and the area under it (hence the work) is identically zero.
  const ISOCHORIC_P2 = 100_000; // Pa
  const curve =
    kind === "isochoric"
      ? processCurve("isochoric", START, ISOCHORIC_P2, { steps: 64 })
      : processCurve(kind, START, endV, { gamma: GAMMA, steps: 64 });
  const work = workUnderCurve(curve);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, tokens, { kind, curve, work, endV }, width, height);
  }, [kind, curve, work, endV, tokens, width, height]);

  const rect = plotRect(width, height);
  const mapping = createPvMapping(DOMAIN, rect);

  const onPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (kind === "isochoric") return; // volume is fixed in an isochore
    const r = e.currentTarget.getBoundingClientRect();
    const data = mapping.toData(e.clientX - r.left, e.clientY - r.top);
    const v = Math.max(DOMAIN.vMin + 0.001, Math.min(DOMAIN.vMax - 0.001, data.V));
    setEndV(v);
  };

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block", touchAction: "none" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="A pressure–volume diagram. A gas starts at a fixed state; dragging sets the final volume, and the selected process draws the path. The shaded area beneath the path is the work done by the gas."
        onPointerDown={(e) => {
          draggingRef.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          onPointer(e);
        }}
        onPointerMove={(e) => {
          if (draggingRef.current) onPointer(e);
        }}
        onPointerUp={(e) => {
          draggingRef.current = false;
          e.currentTarget.releasePointerCapture(e.pointerId);
        }}
      />
      <div className="mt-3 flex flex-wrap gap-2 font-mono text-xs">
        {PROCESSES.map((p) => (
          <button
            key={p.kind}
            type="button"
            onClick={() => setKind(p.kind)}
            className="cursor-pointer rounded-sm border px-2 py-0.5"
            style={
              kind === p.kind
                ? { borderColor: "var(--color-cyan)", color: "var(--color-cyan)" }
                : { borderColor: "var(--color-fg-4)", color: "var(--color-fg-3)" }
            }
          >
            {p.label}
          </button>
        ))}
      </div>
      <p className="mt-2 font-mono text-xs text-[var(--color-fg-3)]">
        {kind === "isochoric"
          ? "volume fixed — the path is vertical, area under it is zero, so W = 0"
          : `drag the end point · W = ∫P dV = ${(work / 1000).toFixed(2)} kJ ${
              work >= 0 ? "(done by the gas)" : "(done on the gas)"
            }`}
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
  kind: ProcessKind;
  curve: PvPoint[];
  work: number;
  endV: number;
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

  drawSectionTitle(ctx, rect.left, 10, "PRESSURE–VOLUME PLANE", tokens.textMute);

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

  // axis labels
  ctx.fillStyle = tokens.textMute;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "center";
  ctx.fillText("volume V (L)", rect.left + rect.width / 2, H - 6);
  ctx.save();
  ctx.translate(14, rect.top + rect.height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("pressure P (kPa)", 0, 0);
  ctx.restore();
  ctx.textAlign = "left";

  // shaded work area under the curve (down to the V axis)
  const baseY = mapping.toPx({ V: DOMAIN.vMin, P: DOMAIN.pMin }).y;
  const expanding = s.work >= 0;
  const areaColor = expanding ? tokens.cyan : tokens.red;
  ctx.beginPath();
  const first = mapping.toPx(s.curve[0]);
  ctx.moveTo(first.x, baseY);
  for (const pt of s.curve) {
    const px = mapping.toPx(pt);
    ctx.lineTo(px.x, px.y);
  }
  const last = mapping.toPx(s.curve[s.curve.length - 1]);
  ctx.lineTo(last.x, baseY);
  ctx.closePath();
  ctx.fillStyle = hexToRgba(areaColor, 0.18);
  ctx.fill();

  // the process path
  ctx.strokeStyle = areaColor;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  s.curve.forEach((pt, i) => {
    const px = mapping.toPx(pt);
    if (i === 0) ctx.moveTo(px.x, px.y);
    else ctx.lineTo(px.x, px.y);
  });
  ctx.stroke();

  // "W" label centered in the shaded region
  if (s.kind !== "isochoric") {
    const mid = mapping.toPx(s.curve[Math.floor(s.curve.length / 2)]);
    ctx.fillStyle = areaColor;
    ctx.font = FONT_HUD;
    ctx.textAlign = "center";
    ctx.fillText("W", mid.x, (mid.y + baseY) / 2);
    ctx.textAlign = "left";
  }

  // start point
  const sp = mapping.toPx(START);
  ctx.fillStyle = tokens.amber;
  ctx.beginPath();
  ctx.arc(sp.x, sp.y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = tokens.textBright;
  ctx.font = FONT_HUD_SMALL;
  ctx.fillText("start", sp.x + 8, sp.y - 6);

  // end / draggable point
  const ep = mapping.toPx(s.curve[s.curve.length - 1]);
  ctx.fillStyle = tokens.cyan;
  ctx.beginPath();
  ctx.arc(ep.x, ep.y, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = tokens.bg;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  if (s.kind !== "isochoric") {
    ctx.fillStyle = tokens.textMute;
    ctx.fillText("drag", ep.x + 9, ep.y + 4);
  }
}
