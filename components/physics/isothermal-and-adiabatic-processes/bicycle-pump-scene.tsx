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
import { adiabaticTemperatureRatio } from "@/lib/physics/thermodynamics/processes";

/**
 * FIG.07b — the bicycle pump.
 *
 * Work the pump slowly and each compression has time to leak its heat to the
 * barrel and the air around it: the process is nearly isothermal and the barrel
 * barely warms. Work it fast and the heat has nowhere to go between strokes: the
 * process is nearly adiabatic and the barrel scalds. The speed slider slides the
 * gas continuously between those two limits; the thermometer on the barrel reads
 * the result. Same air, same stroke, opposite temperature outcome.
 */

const T_AMBIENT = 295; // K (~22 °C)
const COMPRESSION_RATIO = 3.2;
const GAMMA_AIR = 1.4;
// peak temperature if a stroke were fully adiabatic
const T_ADIABATIC = T_AMBIENT * adiabaticTemperatureRatio(COMPRESSION_RATIO, GAMMA_AIR);

export function BicyclePumpScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();

  const [speed, setSpeed] = useState(0.3); // 0 slow .. 1 fast
  const phaseRef = useRef(0); // piston stroke phase
  const tempRef = useRef(T_AMBIENT); // current barrel temperature (K)

  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.56,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 300,
  });

  // keep latest speed available to the animation loop without restarting it
  const speedRef = useRef(speed);
  speedRef.current = speed;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;

    let raf = 0;
    let prev = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      const sp = speedRef.current;
      // stroke frequency grows with speed
      const freq = 0.4 + sp * 3.2; // Hz-ish
      phaseRef.current = (phaseRef.current + dt * freq) % 1;

      // adiabaticity: slow → isothermal (0), fast → adiabatic (1)
      const adiabaticity = sp * sp; // emphasise the fast end
      const targetPeak = T_AMBIENT + adiabaticity * (T_ADIABATIC - T_AMBIENT);
      // barrel heats on the compression half-stroke, relaxes toward ambient always
      const compressing = phaseRef.current < 0.5;
      const heatRate = compressing ? 6 * (0.3 + sp) : 0;
      const coolRate = 1.4; // leak to surroundings
      tempRef.current +=
        heatRate * dt * (targetPeak - tempRef.current) / Math.max(1, targetPeak - T_AMBIENT)
        - coolRate * dt * (tempRef.current - T_AMBIENT);
      if (tempRef.current < T_AMBIENT) tempRef.current = T_AMBIENT;

      draw(
        ctx,
        tokens,
        { phase: phaseRef.current, temp: tempRef.current, speed: sp },
        width,
        height,
      );
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [tokens, width, height]);

  const regime =
    speed < 0.33 ? "slow → nearly isothermal" : speed > 0.66 ? "fast → nearly adiabatic" : "in between";

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="A bicycle pump strokes at a speed you set. Slow strokes keep the barrel near room temperature (isothermal); fast strokes heat it sharply (adiabatic), shown on a thermometer."
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-28 shrink-0">stroke speed</span>
        <span className="text-[var(--color-fg-3)]">slow</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={speed}
          onChange={(e) => setSpeed(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-amber)" }}
        />
        <span className="text-[var(--color-fg-3)]">fast</span>
      </div>
      <p className="mt-2 font-mono text-xs text-[var(--color-fg-3)]">{regime}</p>
    </div>
  );
}

interface DrawState {
  phase: number;
  temp: number;
  speed: number;
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

  drawSectionTitle(ctx, 16, 10, "BICYCLE PUMP — SLOW vs FAST", tokens.textMute);

  // ── pump barrel (left-centre) ──
  const barrelX = W * 0.18;
  const barrelW = W * 0.16;
  const barrelTop = H * 0.24;
  const barrelBot = H * 0.82;
  const barrelH = barrelBot - barrelTop;

  // piston position: 0 (top, fully out) .. 1 (bottom, compressed) via cosine
  const compress = (1 - Math.cos(s.phase * Math.PI * 2)) / 2; // 0..1..0
  const pistonY = barrelTop + 10 + compress * (barrelH * 0.5);

  // barrel walls
  ctx.strokeStyle = tokens.panelBorder;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(barrelX, barrelTop, barrelW, barrelH);

  // compressed gas, tinted by temperature
  const warm = Math.max(0, Math.min(1, (s.temp - T_AMBIENT) / (T_ADIABATIC - T_AMBIENT)));
  const gasColor = warm < 0.5
    ? tokens.cyan
    : tokens.amber;
  ctx.fillStyle = hexToRgba(gasColor, 0.2 + warm * 0.5);
  ctx.fillRect(barrelX + 2, pistonY + 8, barrelW - 4, barrelBot - pistonY - 8);

  // piston + rod
  ctx.fillStyle = hexToRgba(tokens.textFaint, 0.9);
  ctx.fillRect(barrelX + 2, pistonY, barrelW - 4, 8);
  ctx.strokeStyle = tokens.textMute;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(barrelX + barrelW / 2, pistonY);
  ctx.lineTo(barrelX + barrelW / 2, barrelTop - 22);
  ctx.stroke();
  // handle
  ctx.fillStyle = tokens.textMute;
  ctx.fillRect(barrelX + barrelW / 2 - 18, barrelTop - 28, 36, 7);

  // hose to tyre
  ctx.strokeStyle = tokens.panelBorder;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(barrelX + barrelW / 2, barrelBot);
  ctx.lineTo(barrelX + barrelW / 2, barrelBot + 14);
  ctx.stroke();

  // ── thermometer (right) ──
  const thX = W * 0.62;
  const thTop = H * 0.2;
  const thBot = H * 0.8;
  const thH = thBot - thTop;
  const bulbR = 14;

  // stem
  ctx.strokeStyle = tokens.panelBorder;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(thX - 6, thTop);
  ctx.lineTo(thX - 6, thBot);
  ctx.moveTo(thX + 6, thTop);
  ctx.lineTo(thX + 6, thBot);
  ctx.arc(thX, thTop, 6, Math.PI, 0);
  ctx.stroke();
  // bulb
  ctx.beginPath();
  ctx.arc(thX, thBot + bulbR - 2, bulbR, 0, Math.PI * 2);
  ctx.strokeStyle = tokens.panelBorder;
  ctx.stroke();

  // mercury fill
  const tFrac = Math.max(0, Math.min(1, (s.temp - T_AMBIENT) / (T_ADIABATIC - T_AMBIENT + 5)));
  const fillTop = thBot - tFrac * thH;
  const merc = warm > 0.45 ? tokens.red : tokens.cyan;
  ctx.fillStyle = merc;
  ctx.beginPath();
  ctx.arc(thX, thBot + bulbR - 2, bulbR - 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(thX - 4, fillTop, 8, thBot - fillTop);

  // readout
  const tempC = s.temp - 273.15;
  ctx.fillStyle = tokens.textBright;
  ctx.font = FONT_HUD;
  ctx.textAlign = "left";
  ctx.fillText(`barrel: ${tempC.toFixed(0)} °C`, thX + 28, thTop + 30);
  ctx.fillStyle = tokens.textMute;
  ctx.font = FONT_HUD_SMALL;
  ctx.fillText(`ambient: ${(T_AMBIENT - 273.15).toFixed(0)} °C`, thX + 28, thTop + 48);
  ctx.fillText(
    warm > 0.45 ? "heat trapped — adiabatic" : "heat leaks out — isothermal",
    thX + 28,
    thTop + 66,
  );
}
