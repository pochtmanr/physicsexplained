"use client";

import { useEffect, useRef, useState } from "react";
import {
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
  schwarzschildRadius,
  comptonWavelength,
  planckMass,
  planckLength,
  domainRegime,
} from "@/lib/physics/relativity/what-relativity-doesnt-say";

/**
 * FIG.61a — The domain map.
 *
 * A log-log mass (x) vs size (y) chart. Two straight boundary lines divide the
 * plane:
 *   - r_s = 2GM/c²  (slope +1): below it a system is a black hole — GR strong.
 *   - λ_C = ħ/(Mc)  (slope −1): below it quantum mechanics is unavoidable.
 * They cross at the Planck point. The wedge below BOTH is the quantum-gravity
 * corner where neither theory is trusted. Known objects are plotted as labeled
 * dots; a draggable probe reports which regime it falls in.
 */

// Axis ranges in log10 (SI: kg and m).
const LOG_M_MIN = -32; // electron-ish mass
const LOG_M_MAX = 54; // observable-universe mass scale
const LOG_S_MIN = -38; // sub-Planck length
const LOG_S_MAX = 28; // ~Hubble radius

const PAD_L = 52;
const PAD_R = 16;
const PAD_T = 28;
const PAD_B = 34;

interface Marker {
  label: string;
  M: number; // kg
  size: number; // m
}

const MARKERS: Marker[] = [
  { label: "electron", M: 9.109e-31, size: 2.4e-12 },
  { label: "proton", M: 1.673e-27, size: 8.4e-16 },
  { label: "you", M: 70, size: 1.8 },
  { label: "Earth", M: 5.97e24, size: 6.37e6 },
  { label: "Sun", M: 1.989e30, size: 6.96e8 },
  { label: "Sgr A*", M: 8.5e36, size: 1.3e10 },
  { label: "galaxy", M: 2e42, size: 9.5e20 },
];

function logScaleX(logM: number, W: number): number {
  const plotW = W - PAD_L - PAD_R;
  return PAD_L + ((logM - LOG_M_MIN) / (LOG_M_MAX - LOG_M_MIN)) * plotW;
}
function logScaleY(logS: number, H: number): number {
  const plotH = H - PAD_T - PAD_B;
  // y inverted: large size near top
  return PAD_T + (1 - (logS - LOG_S_MIN) / (LOG_S_MAX - LOG_S_MIN)) * plotH;
}
function invScaleX(px: number, W: number): number {
  const plotW = W - PAD_L - PAD_R;
  return LOG_M_MIN + ((px - PAD_L) / plotW) * (LOG_M_MAX - LOG_M_MIN);
}
function invScaleY(py: number, H: number): number {
  const plotH = H - PAD_T - PAD_B;
  return LOG_S_MIN + (1 - (py - PAD_T) / plotH) * (LOG_S_MAX - LOG_S_MIN);
}

const REGIME_LABEL: Record<string, string> = {
  classical: "CLASSICAL (GR / Newton)",
  "black-hole": "BLACK HOLE (GR strong)",
  quantum: "QUANTUM (QFT)",
  "quantum-gravity": "QUANTUM GRAVITY — no theory",
};

export function DomainMapScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.62,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 300,
  });

  // Probe position in log space; start near a proton.
  const [probeLogM, setProbeLogM] = useState(-26);
  const [probeLogS, setProbeLogS] = useState(-14);

  const probeM = Math.pow(10, probeLogM);
  const probeSize = Math.pow(10, probeLogS);
  const regime = domainRegime(probeM, probeSize);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, tokens, width, height, probeLogM, probeLogS, regime);
  }, [tokens, width, height, probeLogM, probeLogS, regime]);

  const handlePointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const lm = Math.max(LOG_M_MIN, Math.min(LOG_M_MAX, invScaleX(px, width)));
    const ls = Math.max(LOG_S_MIN, Math.min(LOG_S_MAX, invScaleY(py, height)));
    setProbeLogM(lm);
    setProbeLogS(ls);
  };

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block", touchAction: "none" }}
        className={SCENE_CANVAS_CLASS}
        onPointerDown={handlePointer}
        aria-label="Log-log mass versus size domain map. The Schwarzschild-radius line and the Compton-wavelength line cross at the Planck point, carving out the quantum-gravity corner. Click anywhere to place a probe and read its regime."
      />
      <div className="mt-3 grid grid-cols-1 gap-2 font-mono text-xs text-[var(--color-fg-2)] sm:grid-cols-2">
        <label className="flex items-center gap-2">
          <span className="w-28 shrink-0">log₁₀ mass (kg)</span>
          <input
            type="range"
            min={LOG_M_MIN}
            max={LOG_M_MAX}
            step={0.5}
            value={probeLogM}
            onChange={(e) => setProbeLogM(parseFloat(e.target.value))}
            className="flex-1"
            style={{ accentColor: "var(--color-cyan)" }}
          />
        </label>
        <label className="flex items-center gap-2">
          <span className="w-28 shrink-0">log₁₀ size (m)</span>
          <input
            type="range"
            min={LOG_S_MIN}
            max={LOG_S_MAX}
            step={0.5}
            value={probeLogS}
            onChange={(e) => setProbeLogS(parseFloat(e.target.value))}
            className="flex-1"
            style={{ accentColor: "var(--color-magenta)" }}
          />
        </label>
      </div>
      <p className="mt-2 font-mono text-xs text-[var(--color-fg-3)]">
        probe: {probeM.toExponential(1)} kg, {probeSize.toExponential(1)} m →{" "}
        <span className="text-[var(--color-fg-1)]">{REGIME_LABEL[regime]}</span>
      </p>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  W: number,
  H: number,
  probeLogM: number,
  probeLogS: number,
  regime: string,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  drawSectionTitle(ctx, PAD_L, 8, "MASS  →   vs   SIZE  ↑   (LOG–LOG)", tokens.textMute);

  // ── Boundary curves (sampled across the mass axis) ───────────────────────
  const samples = 120;
  const rsPts: [number, number][] = [];
  const lcPts: [number, number][] = [];
  for (let i = 0; i <= samples; i++) {
    const logM = LOG_M_MIN + (i / samples) * (LOG_M_MAX - LOG_M_MIN);
    const M = Math.pow(10, logM);
    rsPts.push([logScaleX(logM, W), logScaleY(Math.log10(schwarzschildRadius(M)), H)]);
    lcPts.push([logScaleX(logM, W), logScaleY(Math.log10(comptonWavelength(M)), H)]);
  }

  // Quantum-gravity wedge fill — region below BOTH lines (small size).
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(PAD_L, H - PAD_B);
  for (let i = 0; i <= samples; i++) {
    const logM = LOG_M_MIN + (i / samples) * (LOG_M_MAX - LOG_M_MIN);
    const M = Math.pow(10, logM);
    const lower = Math.min(
      Math.log10(schwarzschildRadius(M)),
      Math.log10(comptonWavelength(M)),
    );
    const yLower = Math.min(H - PAD_B, logScaleY(lower, H));
    ctx.lineTo(logScaleX(logM, W), yLower);
  }
  ctx.lineTo(W - PAD_R, H - PAD_B);
  ctx.closePath();
  ctx.fillStyle = hexToRgba(tokens.purple, 0.16);
  ctx.fill();
  ctx.restore();

  // r_s line (GR — cyan)
  strokePolyline(ctx, rsPts, tokens.cyan, 2);
  // λ_C line (QM — magenta)
  strokePolyline(ctx, lcPts, tokens.magenta, 2);

  // ── Planck point ─────────────────────────────────────────────────────────
  const mP = planckMass();
  const lP = planckLength();
  const ppx = logScaleX(Math.log10(mP), W);
  const ppy = logScaleY(Math.log10(lP), H);
  ctx.fillStyle = tokens.amber;
  ctx.beginPath();
  ctx.arc(ppx, ppy, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = hexToRgba(tokens.amber, 0.5);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(ppx, ppy, 11, 0, Math.PI * 2);
  ctx.stroke();
  label(ctx, tokens.amber, "Planck point", ppx + 9, ppy - 6);

  // ── Region labels ────────────────────────────────────────────────────────
  ctx.font = "10px ui-monospace, monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = hexToRgba(tokens.cyan, 0.7);
  ctx.fillText("black hole (r < r_s)", PAD_L + 8, H - PAD_B - 40);
  ctx.fillStyle = hexToRgba(tokens.magenta, 0.7);
  ctx.fillText("quantum (r < λ_C)", W - PAD_R - 130, PAD_T + 6);
  ctx.fillStyle = hexToRgba(tokens.purple, 0.85);
  ctx.fillText("quantum gravity", ppx - 40, H - PAD_B - 16);

  // line labels
  label(ctx, tokens.cyan, "r_s = 2GM/c²", W - PAD_R - 96, rsPts[samples][1] - 14);
  label(ctx, tokens.magenta, "λ_C = ħ/Mc", PAD_L + 6, lcPts[0][1] + 4);

  // ── Object markers ───────────────────────────────────────────────────────
  for (const m of MARKERS) {
    const x = logScaleX(Math.log10(m.M), W);
    const y = logScaleY(Math.log10(m.size), H);
    if (x < PAD_L || x > W - PAD_R || y < PAD_T || y > H - PAD_B) continue;
    ctx.fillStyle = tokens.textDim;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = tokens.textMute;
    ctx.font = "9px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(m.label, x + 5, y);
  }

  // ── Probe ────────────────────────────────────────────────────────────────
  const probeColor =
    regime === "quantum-gravity"
      ? tokens.purple
      : regime === "black-hole"
        ? tokens.cyan
        : regime === "quantum"
          ? tokens.magenta
          : tokens.green;
  const px = logScaleX(probeLogM, W);
  const py = logScaleY(probeLogS, H);
  ctx.strokeStyle = hexToRgba(probeColor, 0.4);
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(px, PAD_T);
  ctx.lineTo(px, H - PAD_B);
  ctx.moveTo(PAD_L, py);
  ctx.lineTo(W - PAD_R, py);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = probeColor;
  ctx.beginPath();
  ctx.arc(px, py, 5, 0, Math.PI * 2);
  ctx.fill();

  // ── Plot frame ───────────────────────────────────────────────────────────
  ctx.strokeStyle = tokens.panelBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(PAD_L, PAD_T, W - PAD_L - PAD_R, H - PAD_T - PAD_B);
}

function strokePolyline(
  ctx: CanvasRenderingContext2D,
  pts: [number, number][],
  color: string,
  lw: number,
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.beginPath();
  let started = false;
  for (const [x, y] of pts) {
    // clip to plot box vertically
    if (y < -50 || y > 5000) continue;
    if (!started) {
      ctx.moveTo(x, y);
      started = true;
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
  ctx.restore();
}

function label(
  ctx: CanvasRenderingContext2D,
  color: string,
  text: string,
  x: number,
  y: number,
) {
  ctx.save();
  ctx.font = "10px ui-monospace, monospace";
  ctx.fillStyle = color;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(text, x, y);
  ctx.restore();
}
