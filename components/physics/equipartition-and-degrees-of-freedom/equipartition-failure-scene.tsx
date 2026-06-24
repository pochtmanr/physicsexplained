"use client";

import { useEffect, useRef, useState } from "react";
import {
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
  R_GAS,
  cvOfT,
  THETA_ROT_H2,
  THETA_VIB_H2,
} from "@/lib/physics/thermodynamics/equipartition";

/**
 * FIG.17b — the heat capacity of hydrogen, where equipartition visibly fails.
 * Classical physics says C_v should be a constant (7/2)R. Instead H₂ climbs a
 * staircase as it warms: (3/2)R while only translation is alive, (5/2)R once
 * rotation thaws near 100 K, (7/2)R once vibration thaws above 1000 K. The
 * steps sit at the rotational and vibrational characteristic temperatures —
 * the fingerprints of quantised energy on a classical-looking curve. Drag the
 * temperature to read C_v off the staircase.
 */

const LOG_T_MIN = 1; // 10^1 = 10 K
const LOG_T_MAX = 4.7; // ~50000 K
const CV_MIN = 1.0; // in units of R
const CV_MAX = 4.0;

export function EquipartitionFailureScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [logT, setLogT] = useState(2.4); // ~250 K

  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.5,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 260,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, tokens, logT, width, height);
  }, [tokens, logT, width, height]);

  const T = Math.pow(10, logT);
  const cv = cvOfT(T);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="The molar heat capacity of hydrogen versus temperature on a logarithmic axis, climbing a staircase from three-halves R to five-halves R to seven-halves R as rotational then vibrational modes unfreeze."
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-44 shrink-0">
          T: {T < 1000 ? T.toFixed(0) : (T / 1000).toFixed(1) + "k"} K · C_v ={" "}
          {(cv / R_GAS).toFixed(2)}R
        </span>
        <input
          type="range"
          min={LOG_T_MIN}
          max={LOG_T_MAX}
          step={0.01}
          value={logT}
          onChange={(e) => setLogT(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-cyan)" }}
        />
      </div>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  logT: number,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);
  drawSectionTitle(ctx, 30, 8, "C_v(T) FOR H₂ — THE STAIRCASE", tokens.textMute);

  const padL = 44;
  const padR = 16;
  const padT = 26;
  const padB = 30;
  const gx0 = padL;
  const gx1 = W - padR;
  const gy0 = padT;
  const gy1 = H - padB;

  const xOf = (lt: number) =>
    gx0 + ((lt - LOG_T_MIN) / (LOG_T_MAX - LOG_T_MIN)) * (gx1 - gx0);
  const yOf = (cvR: number) =>
    gy1 - ((cvR - CV_MIN) / (CV_MAX - CV_MIN)) * (gy1 - gy0);

  // horizontal plateau guides at 3/2, 5/2, 7/2
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (const [cvR, label] of [
    [1.5, "(3/2)R"],
    [2.5, "(5/2)R"],
    [3.5, "(7/2)R"],
  ] as [number, string][]) {
    ctx.strokeStyle = hexToRgba(tokens.gridHeavy, 0.25);
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(gx0, yOf(cvR));
    ctx.lineTo(gx1, yOf(cvR));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = tokens.textFaint;
    ctx.fillText(label, gx0 - 4, yOf(cvR));
  }

  // decade gridlines + labels on x
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (let d = Math.ceil(LOG_T_MIN); d <= Math.floor(LOG_T_MAX); d++) {
    ctx.strokeStyle = hexToRgba(tokens.gridHeavy, 0.18);
    ctx.beginPath();
    ctx.moveTo(xOf(d), gy0);
    ctx.lineTo(xOf(d), gy1);
    ctx.stroke();
    ctx.fillStyle = tokens.textFaint;
    ctx.fillText(`10^${d}`, xOf(d), gy1 + 6);
  }

  // mark θ_rot and θ_vib
  for (const [theta, label, color] of [
    [THETA_ROT_H2, "θ_rot", tokens.amber],
    [THETA_VIB_H2, "θ_vib", tokens.magenta],
  ] as [number, string, string][]) {
    const lt = Math.log10(theta);
    ctx.strokeStyle = hexToRgba(color, 0.6);
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.moveTo(xOf(lt), gy0);
    ctx.lineTo(xOf(lt), gy1);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = color;
    ctx.textAlign = "left";
    ctx.fillText(label, xOf(lt) + 3, gy0 + 2);
  }

  // axes
  ctx.strokeStyle = tokens.axes;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(gx0, gy0);
  ctx.lineTo(gx0, gy1);
  ctx.lineTo(gx1, gy1);
  ctx.stroke();
  ctx.fillStyle = tokens.textMute;
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.fillText("T (K, log) →", gx1, gy1 + 16);

  // the curve
  ctx.strokeStyle = tokens.cyan;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  const N = 240;
  for (let i = 0; i <= N; i++) {
    const lt = LOG_T_MIN + (i / N) * (LOG_T_MAX - LOG_T_MIN);
    const cvR = cvOfT(Math.pow(10, lt)) / R_GAS;
    const x = xOf(lt);
    const y = yOf(cvR);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // marker at the chosen temperature
  const cvR = cvOfT(Math.pow(10, logT)) / R_GAS;
  ctx.strokeStyle = hexToRgba(tokens.textFaint, 0.5);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(xOf(logT), gy0);
  ctx.lineTo(xOf(logT), gy1);
  ctx.stroke();
  ctx.fillStyle = tokens.cyan;
  ctx.beginPath();
  ctx.arc(xOf(logT), yOf(cvR), 5, 0, Math.PI * 2);
  ctx.fill();
}
