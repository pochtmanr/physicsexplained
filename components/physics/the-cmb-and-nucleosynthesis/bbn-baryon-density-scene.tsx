"use client";

import { useEffect, useRef, useState } from "react";
import {
  FONT_HUD,
  FONT_HUD_SMALL,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  drawHudReadout,
  drawSectionTitle,
  hexToRgba,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import { heliumFractionFromBaryon } from "@/lib/physics/relativity/the-cmb-and-nucleosynthesis";
import { Button } from "@/components/ui/button";

/**
 * FIG.57c — Helium versus baryon density: the BBN baryometer.
 *
 * Plots the primordial helium-4 mass fraction Y_p against the baryon-to-photon
 * ratio η₁₀ on a log axis. The model curve is almost flat — a factor-of-ten
 * change in η moves Y_p by barely a percent. The horizontal band is the
 * observed Y_p ≈ 0.245–0.250; the vertical band is the η₁₀ ≈ 5.9–6.2 that the
 * Planck satellite measured from the CMB decades later. They cross. The reader
 * drags η and watches the predicted helium track the data — a concordance that
 * fixed the baryon count of the universe long before Planck existed.
 */

const ETA_MIN = 1; // η₁₀
const ETA_MAX = 12;
const Y_MIN = 0.22;
const Y_MAX = 0.27;

// Observed primordial helium band (Aver et al. 2015-ish), mass fraction.
const Y_OBS_LO = 0.2449;
const Y_OBS_HI = 0.2521;
// Planck CMB baryon density η₁₀ band.
const ETA_CMB_LO = 5.9;
const ETA_CMB_HI = 6.2;

export function BbnBaryonDensityScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [eta, setEta] = useState(6.1);
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.55,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 320,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, tokens, eta, width, height);
  }, [tokens, eta, width, height]);

  const Yp = heliumFractionFromBaryon(eta);
  const inData = Yp >= Y_OBS_LO && Yp <= Y_OBS_HI;

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Primordial helium-4 mass fraction versus the baryon-to-photon ratio, with the observed helium band and the Planck baryon-density band crossing near eta-10 = 6 and Y_p = 0.247."
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-44 shrink-0">
          η₁₀ = {eta.toFixed(2)} · Y_p = {Yp.toFixed(4)}
        </span>
        <input
          type="range"
          min={ETA_MIN}
          max={ETA_MAX}
          step={0.05}
          value={eta}
          onChange={(e) => setEta(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-cyan)" }}
        />
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-xs text-[var(--color-fg-3)]">
        <span className={inData ? "text-[var(--color-mint)]" : "text-[var(--color-red)]"}>
          {inData ? "Y_p inside observed band" : "Y_p outside observed band"}
        </span>
        <Button size="sm" onClick={() => setEta(6.1)}>
          Planck value (η₁₀ ≈ 6.1)
        </Button>
      </div>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  eta: number,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const padL = 58;
  const padR = 18;
  const padT = 30;
  const padB = 40;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  drawSectionTitle(ctx, padL, padT - 20, "BBN BARYOMETER  Y_p(η)", tokens.textMute);

  const logMin = Math.log10(ETA_MIN);
  const logMax = Math.log10(ETA_MAX);
  const xOf = (e: number) =>
    padL + ((Math.log10(e) - logMin) / (logMax - logMin)) * plotW;
  const yOf = (y: number) =>
    padT + plotH - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * plotH;

  // ── Grid ───────────────────────────────────────────────────────────────────
  ctx.strokeStyle = tokens.grid;
  ctx.lineWidth = 1;
  for (let y = Y_MIN; y <= Y_MAX + 1e-9; y += 0.01) {
    const py = yOf(y);
    ctx.beginPath();
    ctx.moveTo(padL, py);
    ctx.lineTo(padL + plotW, py);
    ctx.stroke();
  }
  for (const e of [1, 2, 3, 5, 8, 12]) {
    const x = xOf(e);
    ctx.beginPath();
    ctx.moveTo(x, padT);
    ctx.lineTo(x, padT + plotH);
    ctx.stroke();
  }

  // ── Observed helium band (horizontal) ──────────────────────────────────────
  ctx.fillStyle = hexToRgba(tokens.amber, 0.16);
  ctx.fillRect(padL, yOf(Y_OBS_HI), plotW, yOf(Y_OBS_LO) - yOf(Y_OBS_HI));
  ctx.strokeStyle = hexToRgba(tokens.amber, 0.5);
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(padL, yOf(Y_OBS_LO));
  ctx.lineTo(padL + plotW, yOf(Y_OBS_LO));
  ctx.moveTo(padL, yOf(Y_OBS_HI));
  ctx.lineTo(padL + plotW, yOf(Y_OBS_HI));
  ctx.stroke();
  ctx.setLineDash([]);

  // ── Planck baryon-density band (vertical) ──────────────────────────────────
  ctx.fillStyle = hexToRgba(tokens.magenta, 0.16);
  ctx.fillRect(xOf(ETA_CMB_LO), padT, xOf(ETA_CMB_HI) - xOf(ETA_CMB_LO), plotH);
  ctx.strokeStyle = hexToRgba(tokens.magenta, 0.55);
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(xOf(ETA_CMB_LO), padT);
  ctx.lineTo(xOf(ETA_CMB_LO), padT + plotH);
  ctx.moveTo(xOf(ETA_CMB_HI), padT);
  ctx.lineTo(xOf(ETA_CMB_HI), padT + plotH);
  ctx.stroke();
  ctx.setLineDash([]);

  // ── Axes ───────────────────────────────────────────────────────────────────
  ctx.strokeStyle = tokens.axes;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(padL, padT);
  ctx.lineTo(padL, padT + plotH);
  ctx.lineTo(padL + plotW, padT + plotH);
  ctx.stroke();

  ctx.fillStyle = tokens.textMute;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("baryon-to-photon ratio  η × 10¹⁰", padL + plotW / 2, padT + plotH + 22);
  for (const e of [1, 2, 3, 5, 8, 12]) {
    ctx.fillText(String(e), xOf(e), padT + plotH + 6);
  }
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (let y = Y_MIN; y <= Y_MAX + 1e-9; y += 0.01) {
    ctx.fillText(y.toFixed(2), padL - 6, yOf(y));
  }
  ctx.save();
  ctx.translate(padL - 44, padT + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("helium fraction  Y_p", 0, 0);
  ctx.restore();

  // ── Model curve Y_p(η) ─────────────────────────────────────────────────────
  ctx.strokeStyle = tokens.cyan;
  ctx.lineWidth = 2;
  ctx.beginPath();
  const steps = 160;
  for (let i = 0; i <= steps; i++) {
    const e = Math.pow(10, logMin + (i / steps) * (logMax - logMin));
    const x = xOf(e);
    const y = yOf(heliumFractionFromBaryon(e));
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // ── Marker at current η ────────────────────────────────────────────────────
  const Yp = heliumFractionFromBaryon(eta);
  const mx = xOf(eta);
  const my = yOf(Yp);
  ctx.strokeStyle = tokens.gridHeavy;
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 3]);
  ctx.beginPath();
  ctx.moveTo(mx, my);
  ctx.lineTo(mx, padT + plotH);
  ctx.moveTo(mx, my);
  ctx.lineTo(padL, my);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = tokens.textBright;
  ctx.beginPath();
  ctx.arc(mx, my, 4.5, 0, Math.PI * 2);
  ctx.fill();

  // ── Labels for the bands ───────────────────────────────────────────────────
  ctx.font = FONT_HUD_SMALL;
  ctx.fillStyle = tokens.amber;
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.fillText("observed Y_p", padL + 6, yOf(Y_OBS_HI) - 2);
  ctx.fillStyle = tokens.magenta;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("Planck η", (xOf(ETA_CMB_LO) + xOf(ETA_CMB_HI)) / 2, padT + 2);

  // ── HUD ────────────────────────────────────────────────────────────────────
  let hy = padT + 6;
  hy = drawHudReadout(
    ctx,
    padL + 8,
    hy,
    "η₁₀ = ",
    eta.toFixed(2),
    tokens.textDim,
    tokens.cyan,
  );
  drawHudReadout(
    ctx,
    padL + 8,
    hy,
    "Y_p = ",
    Yp.toFixed(4),
    tokens.textDim,
    tokens.amber,
  );
}
