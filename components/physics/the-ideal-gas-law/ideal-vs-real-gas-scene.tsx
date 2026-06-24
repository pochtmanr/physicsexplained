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
import { VDW_GASES, vdwIsotherm } from "@/lib/physics/thermodynamics/ideal-gas";

/**
 * FIG.14b — where "ideal" breaks. The compressibility factor Z = PV/nRT is 1
 * for a perfect gas (the dashed line). A real gas first dips below 1 as
 * intermolecular attraction pulls the molecules together and lets the gas
 * compress more than ideal; then, at high pressure, the finite size of the
 * molecules dominates and Z climbs above 1. Pick a gas and a temperature: the
 * dip deepens as you cool toward the gas's critical region.
 */

const P_MAX = 6e7; // Pa (600 bar) — top of the pressure axis
const Z_MIN = 0.3;
const Z_MAX = 1.9;
const REF_TEMPS = [200, 500]; // faint context isotherms, K

export function IdealVsRealGasScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [gasName, setGasName] = useState("N₂");
  const [tempK, setTempK] = useState(160);

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
    draw(ctx, tokens, gasName, tempK, width, height);
  }, [tokens, gasName, tempK, width, height]);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Compressibility factor Z versus pressure. A dashed horizontal line at Z equals one marks the ideal gas. The real-gas curve dips below one at moderate pressure where attraction dominates, then rises above one at high pressure where molecular volume dominates."
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-40 shrink-0">
          {gasName} at T: {tempK.toFixed(0)} K
        </span>
        <input
          type="range"
          min={120}
          max={600}
          step={5}
          value={tempK}
          onChange={(e) => setTempK(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-cyan)" }}
        />
      </div>
      <div className="mt-2 flex flex-wrap gap-2 font-mono text-xs">
        {VDW_GASES.map((g) => {
          const active = g.name === gasName;
          return (
            <button
              key={g.name}
              type="button"
              onClick={() => setGasName(g.name)}
              className="cursor-pointer rounded-sm border px-2 py-0.5"
              style={{
                borderColor: active ? "var(--color-cyan)" : "var(--color-fg-4)",
                color: active ? "var(--color-cyan)" : "var(--color-fg-3)",
              }}
            >
              {g.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  gasName: string,
  tempK: number,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);
  drawSectionTitle(ctx, 30, 8, "COMPRESSIBILITY · Z = PV/nRT", tokens.textMute);

  const gas = VDW_GASES.find((g) => g.name === gasName) ?? VDW_GASES[2];

  const padL = 38;
  const padR = 14;
  const padT = 26;
  const padB = 28;
  const gx0 = padL;
  const gx1 = W - padR;
  const gy0 = padT;
  const gy1 = H - padB;

  const xOf = (P: number) => gx0 + (P / P_MAX) * (gx1 - gx0);
  const yOf = (Z: number) => gy1 - ((Z - Z_MIN) / (Z_MAX - Z_MIN)) * (gy1 - gy0);

  // grid: Z gridlines
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (const Z of [0.5, 1.0, 1.5]) {
    ctx.strokeStyle = hexToRgba(tokens.gridHeavy, Z === 1 ? 0.0 : 0.25);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(gx0, yOf(Z));
    ctx.lineTo(gx1, yOf(Z));
    ctx.stroke();
    ctx.fillStyle = tokens.textFaint;
    ctx.fillText(Z.toFixed(1), gx0 - 4, yOf(Z));
  }

  // Z = 1 ideal reference (dashed)
  ctx.strokeStyle = tokens.mint;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(gx0, yOf(1));
  ctx.lineTo(gx1, yOf(1));
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = tokens.mint;
  ctx.textAlign = "left";
  ctx.fillText("ideal (Z=1)", gx0 + 6, yOf(1) - 9);

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
  ctx.fillText("P (bar) →", gx1, gy1 + 8);
  ctx.textAlign = "left";
  ctx.fillText(`${(P_MAX / 1e5).toFixed(0)}`, gx1 - 24, gy1 + 8);

  const plotIsotherm = (T: number, color: string, w: number) => {
    const pts = vdwIsotherm(gas, T, { steps: 400 });
    ctx.strokeStyle = color;
    ctx.lineWidth = w;
    ctx.beginPath();
    let started = false;
    for (const { P, Z } of pts) {
      if (P < 0 || P > P_MAX) continue;
      const x = xOf(P);
      const y = yOf(Math.max(Z_MIN, Math.min(Z_MAX, Z)));
      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  };

  // faint context isotherms, then the selected one bright
  plotIsotherm(REF_TEMPS[0], hexToRgba(tokens.blue, 0.45), 1.5);
  plotIsotherm(REF_TEMPS[1], hexToRgba(tokens.red, 0.45), 1.5);
  plotIsotherm(tempK, tokens.cyan, 2.5);

  // labels for the context isotherms
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "left";
  ctx.fillStyle = hexToRgba(tokens.blue, 0.8);
  ctx.fillText(`${REF_TEMPS[0]} K`, gx0 + 6, gy1 - 14);
  ctx.fillStyle = hexToRgba(tokens.red, 0.8);
  ctx.fillText(`${REF_TEMPS[1]} K`, gx0 + 60, gy1 - 14);
}
