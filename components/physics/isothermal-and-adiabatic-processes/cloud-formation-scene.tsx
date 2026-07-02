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
  DRY_ADIABATIC_LAPSE_RATE,
  parcelTemperatureAfterAscent,
} from "@/lib/physics/thermodynamics/processes";

/**
 * FIG.07c — how an adiabat makes a cloud.
 *
 * A moist air parcel is nudged upward. Pressure falls with height, so the parcel
 * expands; sealed from the air around it, it does that expansion adiabatically
 * and cools at the dry rate, about 9.8 K per kilometre. Raise it far enough and
 * its temperature meets the dew point — the lifting condensation level — and the
 * vapour it carries condenses into droplets. That altitude is the flat base you
 * see on every fair-weather cumulus. Drag the parcel up to find it.
 */

const T_SURFACE_C = 24; // °C at the ground
const DEWPOINT_SURFACE_C = 11; // °C — the moisture the parcel carries
const MAX_KM = 4;
// dew point falls slowly with height (~1.8 K/km); parcel falls at ~9.8 K/km.
const DEWPOINT_LAPSE = 1.8;
// LCL where parcel temp meets dew point:
const LCL_KM =
  (T_SURFACE_C - DEWPOINT_SURFACE_C) / (DRY_ADIABATIC_LAPSE_RATE - DEWPOINT_LAPSE);

export function CloudFormationScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [km, setKm] = useState(0.4);

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
    draw(ctx, tokens, km, width, height);
  }, [km, tokens, width, height]);

  const parcelTempC = T_SURFACE_C - DRY_ADIABATIC_LAPSE_RATE * km;
  const condensing = km >= LCL_KM;

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="A moist air parcel rises through the atmosphere, expanding and cooling adiabatically. At the lifting condensation level its temperature reaches the dew point and droplets form — the base of a cloud."
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-32 shrink-0">altitude: {km.toFixed(2)} km</span>
        <input
          type="range"
          min={0}
          max={MAX_KM}
          step={0.02}
          value={km}
          onChange={(e) => setKm(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-cyan)" }}
        />
      </div>
      <p className="mt-2 font-mono text-xs text-[var(--color-fg-3)]">
        parcel {parcelTempC.toFixed(1)} °C · cooling 9.8 K/km ·{" "}
        {condensing
          ? `condensing — cloud base at ${LCL_KM.toFixed(2)} km`
          : `dry, clear (dew point reached at ${LCL_KM.toFixed(2)} km)`}
      </p>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  km: number,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  drawSectionTitle(ctx, 16, 10, "RISING PARCEL — ADIABATIC COOLING", tokens.textMute);

  const colX = 50;
  const colW = W - colX - 150;
  const groundY = H - 36;
  const topY = 28;
  const colH = groundY - topY;

  const kmToY = (k: number) => groundY - (k / MAX_KM) * colH;

  // altitude axis
  ctx.strokeStyle = tokens.axes;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(colX, topY);
  ctx.lineTo(colX, groundY);
  ctx.stroke();
  ctx.font = FONT_HUD_SMALL;
  ctx.fillStyle = tokens.textFaint;
  ctx.textAlign = "right";
  for (let k = 0; k <= MAX_KM; k++) {
    const y = kmToY(k);
    ctx.beginPath();
    ctx.moveTo(colX - 4, y);
    ctx.lineTo(colX, y);
    ctx.stroke();
    ctx.fillText(`${k} km`, colX - 8, y + 3);
  }

  // ground
  ctx.strokeStyle = tokens.panelBorder;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(colX, groundY);
  ctx.lineTo(colX + colW, groundY);
  ctx.stroke();

  // LCL line
  const lclY = kmToY(LCL_KM);
  ctx.strokeStyle = hexToRgba(tokens.amber, 0.8);
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(colX, lclY);
  ctx.lineTo(colX + colW, lclY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = tokens.amber;
  ctx.textAlign = "left";
  ctx.fillText("lifting condensation level (cloud base)", colX + 6, lclY - 6);

  // cloud band above LCL once the parcel has reached it
  if (km >= LCL_KM) {
    ctx.fillStyle = hexToRgba(tokens.textBright, 0.12);
    const cloudBot = lclY;
    const cloudTop = kmToY(Math.min(MAX_KM, km + 0.2));
    for (let i = 0; i < 9; i++) {
      const cx = colX + 26 + (i * colW) / 9 + ((i % 2) * 12);
      const cy = cloudBot - 6 - ((i * 37) % 26);
      ctx.beginPath();
      ctx.arc(cx, Math.max(cloudTop, cy), 14 + ((i * 13) % 8), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // the parcel
  const parcelX = colX + colW * 0.5;
  const parcelY = kmToY(km);
  // expands as it rises (pressure ~ exp(-z/8.4km))
  const expansion = Math.exp(km / 8.4);
  const r = 16 * expansion;
  const parcelTempC = T_SURFACE_C - DRY_ADIABATIC_LAPSE_RATE * km;
  const warmFrac = Math.max(0, Math.min(1, (parcelTempC + 5) / (T_SURFACE_C + 5)));
  const parcelColor = warmFrac > 0.5 ? tokens.amber : tokens.cyan;

  ctx.fillStyle = hexToRgba(parcelColor, 0.22);
  ctx.strokeStyle = parcelColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(parcelX, parcelY, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // droplets if condensing
  if (km >= LCL_KM) {
    ctx.fillStyle = tokens.blue;
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      const dx = parcelX + Math.cos(a) * r * 0.55;
      const dy = parcelY + Math.sin(a) * r * 0.55;
      ctx.beginPath();
      ctx.arc(dx, dy, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // up arrow
  ctx.strokeStyle = tokens.textMute;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(parcelX, parcelY + r + 4);
  ctx.lineTo(parcelX, parcelY + r + 20);
  ctx.stroke();

  // readout panel (right)
  const px = colX + colW + 18;
  ctx.textAlign = "left";
  ctx.font = FONT_HUD;
  ctx.fillStyle = tokens.textBright;
  ctx.fillText(`${parcelTempC.toFixed(1)} °C`, px, topY + 30);
  ctx.font = FONT_HUD_SMALL;
  ctx.fillStyle = tokens.textMute;
  ctx.fillText(`altitude ${km.toFixed(2)} km`, px, topY + 50);
  ctx.fillText(`surface ${T_SURFACE_C} °C`, px, topY + 66);
  ctx.fillText(`dew pt ${DEWPOINT_SURFACE_C} °C`, px, topY + 82);
  ctx.fillStyle = km >= LCL_KM ? tokens.blue : tokens.textFaint;
  ctx.fillText(km >= LCL_KM ? "condensing" : "clear", px, topY + 102);
}
