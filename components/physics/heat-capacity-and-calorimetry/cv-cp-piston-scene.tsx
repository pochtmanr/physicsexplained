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
  MONATOMIC,
  DIATOMIC,
  R_GAS,
} from "@/lib/physics/thermodynamics/calorimetry";

/**
 * FIG.03c — Why C_p exceeds C_v.
 *
 * Two cylinders hold the same gas. The left one is sealed at fixed volume; the
 * right has a free, weightless piston holding pressure constant. Pour the same
 * heat Q into both. The sealed gas turns all of Q into temperature, so it warms
 * more: ΔT = Q / (n C_v). The open gas spends part of Q doing expansion work as
 * its piston rises, so it warms less: ΔT = Q / (n C_p), with C_p = C_v + R. The
 * missing warmth is the lifted piston — the physical meaning of the gas
 * constant R.
 */

const N_MOLES = 1;
const T0 = 300; // K
const P0 = 101_325; // Pa
const V0 = (N_MOLES * R_GAS * T0) / P0; // m³

export function CvCpPistonScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [heatQ, setHeatQ] = useState(1500); // J
  const [diatomic, setDiatomic] = useState(false);

  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.52,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 300,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, tokens, { heatQ, diatomic }, width, height);
  }, [heatQ, diatomic, tokens, width, height]);

  const gas = diatomic ? DIATOMIC : MONATOMIC;
  const dtV = heatQ / (N_MOLES * gas.cv);
  const dtP = heatQ / (N_MOLES * gas.cp);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Two cylinders of the same gas receive equal heat. The sealed, fixed-volume one warms more; the constant-pressure one with a free piston warms less but its piston rises, doing expansion work. This is why the constant-pressure heat capacity exceeds the constant-volume one by R."
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-40 shrink-0">heat Q: {heatQ} J</span>
        <input
          type="range"
          min={0}
          max={3000}
          step={50}
          value={heatQ}
          onChange={(e) => setHeatQ(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-amber)" }}
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
          monatomic (C_v = 3/2 R)
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
          diatomic (C_v = 5/2 R)
        </button>
      </div>
      <p className="mt-2 font-mono text-xs text-[var(--color-fg-3)]">
        sealed ΔT = +{dtV.toFixed(1)} K · open ΔT = +{dtP.toFixed(1)} K · gap =
        +{(dtV - dtP).toFixed(1)} K (the work the piston does)
      </p>
    </div>
  );
}

interface DrawState {
  heatQ: number;
  diatomic: boolean;
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

  const gas = s.diatomic ? DIATOMIC : MONATOMIC;
  const dtV = s.heatQ / (N_MOLES * gas.cv);
  const dtP = s.heatQ / (N_MOLES * gas.cp);
  const dV = (N_MOLES * R_GAS * dtP) / P0; // expansion of the open cylinder
  const workP = P0 * dV; // = n R ΔT_p

  const PAD = 16;
  const colW = (W - PAD * 3) / 2;
  const baseY = H - PAD - 30;
  const cylH = H * 0.52;
  const cylTop = baseY - cylH;

  drawCylinder(ctx, tokens, {
    x: PAD,
    w: colW,
    top: cylTop,
    base: baseY,
    title: "SEALED — fixed V",
    fillFrac: 0.62, // gas fills the cylinder, piston locked
    pistonLocked: true,
    deltaT: dtV,
    temp: T0 + dtV,
    extraLabel: "all Q → temperature",
    riseFrac: 0,
  });

  // open cylinder: gas column rises by dV/V0, capped for display
  const riseFrac = Math.min(0.32, (dV / V0) * 0.62);
  drawCylinder(ctx, tokens, {
    x: PAD * 2 + colW,
    w: colW,
    top: cylTop,
    base: baseY,
    title: "OPEN — constant P",
    fillFrac: 0.62,
    pistonLocked: false,
    deltaT: dtP,
    temp: T0 + dtP,
    extraLabel: `Q → heat + work (${workP.toFixed(0)} J)`,
    riseFrac,
  });

  // shared heat label
  ctx.fillStyle = tokens.amber;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "center";
  ctx.fillText(`equal heat in: Q = ${s.heatQ} J each`, W / 2, H - PAD - 4);
  ctx.textAlign = "left";
}

interface CylSpec {
  x: number;
  w: number;
  top: number;
  base: number;
  title: string;
  fillFrac: number;
  pistonLocked: boolean;
  deltaT: number;
  temp: number;
  extraLabel: string;
  riseFrac: number;
}

function drawCylinder(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  c: CylSpec,
) {
  const innerX = c.x + 8;
  const innerW = c.w - 16;
  const fullH = c.base - c.top;

  drawSectionTitle(ctx, c.x, c.top - 18, c.title, tokens.textMute);

  // cylinder walls
  ctx.strokeStyle = tokens.panelBorder;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(c.x, c.top);
  ctx.lineTo(c.x, c.base);
  ctx.lineTo(c.x + c.w, c.base);
  ctx.lineTo(c.x + c.w, c.top);
  ctx.stroke();

  // gas column
  const gasH = fullH * (c.fillFrac + c.riseFrac);
  const gasTop = c.base - gasH;
  const warm = Math.max(0, Math.min(1, c.deltaT / 250));
  const gasColor = warm < 0.5
    ? mix(tokens.cyan, tokens.amber, warm / 0.5)
    : mix(tokens.amber, tokens.red, (warm - 0.5) / 0.5);
  ctx.fillStyle = hexToRgba(gasColor, 0.3 + warm * 0.4);
  ctx.fillRect(innerX, gasTop, innerW, gasH);

  // gas particles (a few dots) to suggest motion/density
  ctx.fillStyle = hexToRgba(tokens.textBright, 0.5);
  for (let i = 0; i < 14; i++) {
    const px = innerX + ((i * 53) % innerW);
    const py = gasTop + ((i * 71) % (gasH - 6)) + 3;
    ctx.beginPath();
    ctx.arc(px, py, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }

  // piston
  ctx.fillStyle = c.pistonLocked
    ? hexToRgba(tokens.textFaint, 0.9)
    : hexToRgba(tokens.cyan, 0.9);
  ctx.fillRect(innerX, gasTop - 8, innerW, 8);
  ctx.strokeStyle = tokens.panelBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(innerX, gasTop - 8, innerW, 8);

  if (c.pistonLocked) {
    // lock hatches
    ctx.strokeStyle = hexToRgba(tokens.textFaint, 0.9);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(innerX - 4, gasTop - 4);
    ctx.lineTo(innerX, gasTop - 4);
    ctx.moveTo(innerX + innerW, gasTop - 4);
    ctx.lineTo(innerX + innerW + 4, gasTop - 4);
    ctx.stroke();
  } else if (c.riseFrac > 0.001) {
    // rise arrow
    ctx.strokeStyle = tokens.cyan;
    ctx.fillStyle = tokens.cyan;
    ctx.lineWidth = 1.5;
    const ax = innerX + innerW / 2;
    ctx.beginPath();
    ctx.moveTo(ax, gasTop - 12);
    ctx.lineTo(ax, gasTop - 26);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ax, gasTop - 26);
    ctx.lineTo(ax - 4, gasTop - 20);
    ctx.lineTo(ax + 4, gasTop - 20);
    ctx.closePath();
    ctx.fill();
  }

  // heat arrow at base
  ctx.strokeStyle = tokens.amber;
  ctx.fillStyle = tokens.amber;
  ctx.lineWidth = 2;
  const hx = c.x + c.w / 2;
  ctx.beginPath();
  ctx.moveTo(hx, c.base + 16);
  ctx.lineTo(hx, c.base + 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(hx, c.base + 2);
  ctx.lineTo(hx - 4, c.base + 8);
  ctx.lineTo(hx + 4, c.base + 8);
  ctx.closePath();
  ctx.fill();

  // readouts
  ctx.fillStyle = tokens.textBright;
  ctx.font = FONT_HUD;
  ctx.textAlign = "center";
  ctx.fillText(`ΔT = +${c.deltaT.toFixed(0)} K`, c.x + c.w / 2, c.top + 14);
  ctx.fillStyle = tokens.textMute;
  ctx.font = FONT_HUD_SMALL;
  ctx.fillText(c.extraLabel, c.x + c.w / 2, c.top + 30);
  ctx.textAlign = "left";
}

function mix(a: string, b: string, t: number): string {
  const pa = hex(a);
  const pb = hex(b);
  if (!pa || !pb) return a;
  const r = Math.round(pa[0] + (pb[0] - pa[0]) * t);
  const g = Math.round(pa[1] + (pb[1] - pa[1]) * t);
  const bl = Math.round(pa[2] + (pb[2] - pa[2]) * t);
  return `rgb(${r},${g},${bl})`;
}

function hex(h: string): [number, number, number] | null {
  if (!h.startsWith("#")) return null;
  const s = h.replace("#", "");
  const e = s.length === 3 ? s.split("").map((c) => c + c).join("") : s;
  if (e.length !== 6) return null;
  return [
    parseInt(e.slice(0, 2), 16),
    parseInt(e.slice(2, 4), 16),
    parseInt(e.slice(4, 6), 16),
  ];
}
