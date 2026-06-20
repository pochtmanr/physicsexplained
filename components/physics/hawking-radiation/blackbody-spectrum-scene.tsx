"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  FONT_HUD_SMALL,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  drawSectionTitle,
  hexToRgba,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import {
  M_SUN,
  T_CMB,
  hawkingTemperature,
  netPowerVsCMB,
  planckSpectralRadiance,
} from "@/lib/physics/relativity/hawking-radiation";

/**
 * FIG.49c — Blackbody spectra at three masses overlaid with the 2.725 K CMB.
 *
 * Each curve is a normalized Planck spectrum B_λ(λ, T_H(M)) plotted against a
 * log wavelength axis. A stellar-mass hole (T ≈ 6×10⁻⁸ K) peaks far to the
 * right of the CMB and lies entirely beneath it — it absorbs more than it
 * emits today. Smaller holes are hotter and their peaks march leftward. A
 * mass slider lets you drag a fourth, user-controlled curve from primordial to
 * stellar and watch the sign of the net heat flow vs the CMB flip.
 */

const PAD = { l: 16, r: 16, t: 28, b: 38 };

// Wavelength axis in meters (log10): 1 µm .. 1e7 m (radio/very cold).
const LOG_LAM_MIN = -6;
const LOG_LAM_MAX = 7;

interface Curve {
  label: string;
  T: number;
  colorKey: keyof Pick<SceneTokens, "amber" | "orange" | "magenta">;
}

function buildCurves(): Curve[] {
  return [
    { label: "primordial 1e11 kg", T: hawkingTemperature(1e11), colorKey: "magenta" },
    { label: "asteroid 1e20 kg", T: hawkingTemperature(1e20), colorKey: "orange" },
    { label: "stellar 10 M☉", T: hawkingTemperature(10 * M_SUN), colorKey: "amber" },
  ];
}

/** Sample a normalized Planck curve over the log-wavelength axis. */
function sampleCurve(T: number, N: number): { logLam: number; v: number }[] {
  const pts: { logLam: number; v: number }[] = [];
  let peak = 0;
  for (let i = 0; i <= N; i++) {
    const logLam = LOG_LAM_MIN + (i / N) * (LOG_LAM_MAX - LOG_LAM_MIN);
    const lam = Math.pow(10, logLam);
    const v = planckSpectralRadiance(lam, T);
    pts.push({ logLam, v });
    if (v > peak) peak = v;
  }
  // normalize to unit peak so widely different temperatures share one frame
  if (peak > 0) for (const p of pts) p.v /= peak;
  return pts;
}

export function BlackbodySpectrumScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [logM, setLogM] = useState(15);
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.6,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 320,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, tokens, logM, width, height);
  }, [tokens, logM, width, height]);

  const readout = useMemo(() => {
    const M = Math.pow(10, logM);
    return {
      M,
      T: hawkingTemperature(M),
      net: netPowerVsCMB(M),
    };
  }, [logM]);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Normalized Planck blackbody spectra for black holes of three different masses plotted against log wavelength, overlaid with the 2.725 K cosmic-microwave-background curve, plus a draggable fourth curve controlled by a mass slider."
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-40 shrink-0">
          M = 10^{logM.toFixed(1)} kg
        </span>
        <input
          type="range"
          min={9}
          max={Math.log10(10 * M_SUN)}
          step={0.05}
          value={logM}
          onChange={(e) => setLogM(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-cyan)" }}
          aria-label="Mass of the adjustable spectrum (log scale)"
        />
      </div>
      <div className="mt-1 font-mono text-xs">
        <span className="text-[var(--color-fg-3)]">
          T_H = {readout.T.toExponential(2)} K ·{" "}
        </span>
        <span
          className={
            readout.net > 0
              ? "text-[var(--color-cyan)]"
              : "text-[var(--color-red)]"
          }
        >
          {readout.net > 0
            ? "net-emits (evaporating)"
            : "net-absorbs the CMB (growing)"}
        </span>
      </div>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  logM: number,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const x0 = PAD.l;
  const x1 = W - PAD.r;
  const y0 = PAD.t;
  const y1 = H - PAD.b;
  const plotW = x1 - x0;
  const plotH = y1 - y0;

  const xOf = (logLam: number) =>
    x0 + ((logLam - LOG_LAM_MIN) / (LOG_LAM_MAX - LOG_LAM_MIN)) * plotW;
  const yOf = (v: number) => y1 - v * plotH; // v ∈ [0,1]

  // ── grid (decade lines on x) ────────────────────────────────────────────
  ctx.strokeStyle = tokens.grid;
  ctx.lineWidth = 1;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (let ll = LOG_LAM_MIN; ll <= LOG_LAM_MAX; ll += 2) {
    const px = xOf(ll);
    ctx.beginPath();
    ctx.moveTo(px, y0);
    ctx.lineTo(px, y1);
    ctx.stroke();
    ctx.fillStyle = tokens.textFaint;
    ctx.fillText(`10^${ll}`, px, y1 + 6);
  }
  ctx.strokeStyle = tokens.axes;
  ctx.strokeRect(x0, y0, plotW, plotH);
  ctx.fillStyle = tokens.textMute;
  ctx.fillText("wavelength λ  (m, log scale)", (x0 + x1) / 2, H - 14);

  const N = 220;

  const plotCurve = (T: number, color: string, lineWidth: number, dash?: number[]) => {
    const pts = sampleCurve(T, N);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    if (dash) ctx.setLineDash(dash);
    ctx.beginPath();
    let started = false;
    for (const p of pts) {
      const px = xOf(p.logLam);
      const py = yOf(p.v);
      if (!started) {
        ctx.moveTo(px, py);
        started = true;
      } else ctx.lineTo(px, py);
    }
    ctx.stroke();
    if (dash) ctx.setLineDash([]);
  };

  // ── CMB reference curve (RED dashed) ────────────────────────────────────
  plotCurve(T_CMB, hexToRgba(tokens.red, 0.85), 2, [6, 4]);
  // mark its peak label
  {
    // CMB peaks ~1 mm
    const lamPeak = 2.897771955e-3 / T_CMB;
    const px = xOf(Math.log10(lamPeak));
    ctx.fillStyle = tokens.red;
    ctx.textAlign = "center";
    ctx.fillText("CMB 2.725 K", px, y0 + 2);
  }

  // ── three reference hole spectra ────────────────────────────────────────
  const curves = buildCurves();
  for (const c of curves) {
    plotCurve(c.T, tokens[c.colorKey], 2);
  }

  // ── adjustable user curve (CYAN, bold) ──────────────────────────────────
  const M = Math.pow(10, logM);
  const Tuser = hawkingTemperature(M);
  plotCurve(Tuser, tokens.cyan, 2.5);

  // mark adjustable peak
  {
    const lamPeak = 2.897771955e-3 / Tuser;
    const px = xOf(Math.log10(lamPeak));
    if (px >= x0 && px <= x1) {
      ctx.strokeStyle = hexToRgba(tokens.cyan, 0.5);
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(px, y0);
      ctx.lineTo(px, y1);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // ── legend ──────────────────────────────────────────────────────────────
  drawSectionTitle(ctx, x0 + 4, y0 + 4, "NORMALIZED B_λ", tokens.textMute);
  const legend: { label: string; color: string }[] = [
    { label: "you (slider)", color: tokens.cyan },
    ...curves.map((c) => ({ label: c.label, color: tokens[c.colorKey] })),
    { label: "CMB 2.725 K", color: tokens.red },
  ];
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = FONT_HUD_SMALL;
  let ly = y0 + 20;
  for (const item of legend) {
    ctx.strokeStyle = item.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x0 + 6, ly);
    ctx.lineTo(x0 + 24, ly);
    ctx.stroke();
    ctx.fillStyle = tokens.textMute;
    ctx.fillText(item.label, x0 + 30, ly);
    ly += 15;
  }

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}
