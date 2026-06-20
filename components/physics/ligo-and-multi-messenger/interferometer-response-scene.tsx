"use client";

import { useEffect, useRef, useState } from "react";
import {
  FONT_HUD_SMALL,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  drawHudReadout,
  drawSectionTitle,
  hexToRgba,
  useSceneSize,
  useSceneTick,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import {
  differentialArmChange,
  darkPortPower,
} from "@/lib/physics/relativity/ligo-and-multi-messenger";

/**
 * FIG.53a — The Michelson interferometer breathing under a passing wave.
 *
 * A laser hits a beam splitter; light runs down two perpendicular 4 km arms,
 * reflects, and recombines at a photodetector (the "dark port"). A "+"
 * polarized gravitational wave stretches one arm while squeezing the other in
 * antiphase. The differential arm change ΔL = h·L pushes the recombined light
 * off the dark fringe, so the output port brightens and darkens at the wave
 * frequency.
 *
 * The honest numbers (h ~ 1e-21, ΔL ~ 1e-18 m) are unviewable, so a slider
 * sets a *visual exaggeration* factor. The HUD always shows the true physical
 * ΔL alongside the cartoon, so the scale stays honest.
 */

const PAD = 18;
const TRUE_STRAIN = 1e-21; // GW150914-scale strain amplitude
const ARM_LENGTH_M = 4000; // 4 km

export function InterferometerResponseScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const tickRef = useSceneTick(true);
  const [exaggeration, setExaggeration] = useState(0.12);
  const [freq, setFreq] = useState(0.8); // visual Hz of the breathing
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.62,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 320,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    let raf = 0;
    const loop = () => {
      const t = tickRef.current / 1000;
      draw(ctx, tokens, exaggeration, freq, t, width, height);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [tokens, exaggeration, freq, tickRef, width, height]);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="A Michelson interferometer with two perpendicular arms. A passing plus-polarized gravitational wave stretches one arm while squeezing the other; the recombined laser light at the output port brightens and darkens. A slider exaggerates the microscopic motion for visibility."
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-44 shrink-0">visual exaggeration</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={exaggeration}
          onChange={(e) => setExaggeration(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-cyan)" }}
        />
      </div>
      <div className="mt-2 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-44 shrink-0">wave frequency</span>
        <input
          type="range"
          min={0.2}
          max={2.5}
          step={0.05}
          value={freq}
          onChange={(e) => setFreq(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-magenta)" }}
        />
      </div>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  exaggeration: number,
  freq: number,
  t: number,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  drawSectionTitle(ctx, PAD, PAD - 6, "MICHELSON INTERFEROMETER", tokens.textMute);

  // Instantaneous strain phase: +arm stretches, ×... here both arms antiphase.
  const phase = Math.sin(2 * Math.PI * freq * t);
  // Visual fractional change of an arm (exaggerated). Real value is h/2.
  const visFrac = exaggeration * 0.16 * phase;

  // Geometry. Beam splitter near lower-left; X-arm to the right, Y-arm up.
  const bsX = PAD + W * 0.16;
  const bsY = H - PAD - H * 0.16;
  const armLenX = W * 0.52;
  const armLenY = H * 0.5;

  const xEnd = bsX + armLenX * (1 + visFrac);
  const yEnd = bsY - armLenY * (1 - visFrac);

  // Grid hairlines behind the apparatus.
  ctx.strokeStyle = tokens.grid;
  ctx.lineWidth = 1;
  for (let gx = PAD; gx < W - PAD; gx += 40) {
    ctx.beginPath();
    ctx.moveTo(gx, PAD + 8);
    ctx.lineTo(gx, H - PAD);
    ctx.stroke();
  }

  // ── Laser source ──────────────────────────────────────────────────────────
  const laserX = PAD + 6;
  ctx.fillStyle = tokens.amber;
  ctx.fillRect(laserX, bsY - 6, 22, 12);
  ctx.fillStyle = tokens.textMute;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.fillText("laser", laserX, bsY - 10);

  // Input beam → beam splitter
  beam(ctx, laserX + 22, bsY, bsX, bsY, tokens.amber, 0.6);

  // ── X-arm (horizontal) ────────────────────────────────────────────────────
  // Arm stretches when phase > 0.
  const xStretch = visFrac;
  beam(ctx, bsX, bsY, xEnd, bsY, tokens.cyan, 0.85);
  mirror(ctx, xEnd, bsY, "v", tokens);
  armLabel(
    ctx,
    (bsX + xEnd) / 2,
    bsY + 16,
    `arm X  ΔL ${xStretch >= 0 ? "+" : ""}${(xStretch * 100).toFixed(1)}%`,
    xStretch >= 0 ? tokens.cyan : tokens.red,
  );

  // ── Y-arm (vertical) — antiphase ──────────────────────────────────────────
  const yStretch = -visFrac;
  beam(ctx, bsX, bsY, bsX, yEnd, tokens.cyan, 0.85);
  mirror(ctx, bsX, yEnd, "h", tokens);
  ctx.save();
  ctx.translate(bsX - 14, (bsY + yEnd) / 2);
  ctx.rotate(-Math.PI / 2);
  armLabel(
    ctx,
    0,
    0,
    `arm Y  ΔL ${yStretch >= 0 ? "+" : ""}${(yStretch * 100).toFixed(1)}%`,
    yStretch >= 0 ? tokens.cyan : tokens.red,
  );
  ctx.restore();

  // ── Beam splitter ─────────────────────────────────────────────────────────
  ctx.save();
  ctx.translate(bsX, bsY);
  ctx.rotate(-Math.PI / 4);
  ctx.fillStyle = hexToRgba(tokens.textBright, 0.55);
  ctx.fillRect(-12, -2, 24, 4);
  ctx.restore();
  ctx.fillStyle = tokens.textMute;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.fillText("beam splitter", bsX - 8, bsY + 8);

  // ── Output (dark) port — downward from beam splitter ──────────────────────
  // Differential phase ∝ difference of arm changes = 2·visFrac (one minus the
  // other). Map to a phase scale that gives a visible fringe.
  const diffPhase = visFrac * 14; // exaggerated optical phase difference
  const power = darkPortPower(diffPhase);
  const portX = bsX;
  const portY = H - PAD + 2;
  beam(ctx, bsX, bsY, portX, portY - 14, tokens.amber, 0.3 + power * 0.7);

  // Photodetector glowing with output power.
  const detR = 9;
  const glow = ctx.createRadialGradient(portX, portY - 8, 0, portX, portY - 8, 26);
  glow.addColorStop(0, hexToRgba(tokens.amber, power * 0.8));
  glow.addColorStop(1, hexToRgba(tokens.amber, 0));
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(portX, portY - 8, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = hexToRgba(tokens.amber, 0.4 + power * 0.6);
  ctx.beginPath();
  ctx.arc(portX, portY - 8, detR, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = tokens.panelBorder;
  ctx.lineWidth = 1;
  ctx.stroke();

  // ── HUD ───────────────────────────────────────────────────────────────────
  const trueStrain = TRUE_STRAIN * phase;
  const trueDL = differentialArmChange(trueStrain, ARM_LENGTH_M);
  let y = PAD + 14;
  const hx = W - PAD - 188;
  y = drawHudReadout(
    ctx,
    hx,
    y,
    "true h = ",
    `${(trueStrain * 1e21).toFixed(2)} × 10⁻²¹`,
    tokens.textDim,
    tokens.cyan,
  );
  y = drawHudReadout(
    ctx,
    hx,
    y,
    "true ΔL = ",
    `${(trueDL * 1e18).toFixed(2)} × 10⁻¹⁸ m`,
    tokens.textDim,
    tokens.magenta,
  );
  y = drawHudReadout(
    ctx,
    hx,
    y,
    "port power = ",
    `${(power * 100).toFixed(0)}%`,
    tokens.textDim,
    tokens.amber,
  );
  ctx.fillStyle = tokens.textFaint;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("(real ΔL ≈ 1/1000 proton width)", hx, y + 2);
}

function beam(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  alpha: number,
) {
  ctx.save();
  ctx.strokeStyle = hexToRgba(color, alpha);
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.restore();
}

function mirror(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  orient: "v" | "h",
  tokens: SceneTokens,
) {
  ctx.save();
  ctx.strokeStyle = tokens.textBright;
  ctx.lineWidth = 3;
  ctx.beginPath();
  if (orient === "v") {
    ctx.moveTo(x, y - 14);
    ctx.lineTo(x, y + 14);
  } else {
    ctx.moveTo(x - 14, y);
    ctx.lineTo(x + 14, y);
  }
  ctx.stroke();
  ctx.restore();
}

function armLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  color: string,
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(text, x, y);
  ctx.restore();
}
