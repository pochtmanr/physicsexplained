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
  useSceneTick,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import { readoutFromCelsius } from "@/lib/physics/thermodynamics/thermometry";

/**
 * FIG.01a — Galileo's thermoscope (1592).
 *
 * An inverted glass bulb on a long neck stands in a dish of water. The bulb
 * traps a pocket of air; warming the air expands it and drives the water column
 * in the neck *down*, cooling lets the column rise. It is a thermometer with no
 * numbers — it shows change, not value. The slider sets the ambient
 * temperature; a tri-scale readout (°C / °F / K) shows what a later, calibrated
 * instrument would report for the same air.
 */

const T_MIN = -10;
const T_MAX = 50;

export function ThermoscopeScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [ambientC, setAmbientC] = useState(20);
  const tickRef = useSceneTick(true);
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.62,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 300,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;

    let raf = 0;
    const loop = () => {
      const t = tickRef.current / 1000;
      draw(ctx, tokens, ambientC, t, width, height);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [ambientC, tokens, tickRef, width, height]);

  const r = readoutFromCelsius(ambientC);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Galileo's thermoscope: an inverted glass bulb over a dish of water. A slider sets the ambient temperature; warmer air expands and pushes the water column down the neck, cooler air lets it rise. A readout shows the temperature in Celsius, Fahrenheit, and Kelvin."
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-44 shrink-0">
          ambient: {ambientC.toFixed(0)} °C
        </span>
        <input
          type="range"
          min={T_MIN}
          max={T_MAX}
          step={1}
          value={ambientC}
          onChange={(e) => setAmbientC(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-red)" }}
        />
      </div>
      <div className="mt-1 flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs text-[var(--color-fg-3)]">
        {[
          { label: "winter (−5 °C)", v: -5 },
          { label: "room (20 °C)", v: 20 },
          { label: "warm hand (35 °C)", v: 35 },
          { label: "hot day (45 °C)", v: 45 },
        ].map((p) => (
          <button
            key={p.label}
            type="button"
            className="cursor-pointer hover:text-[var(--color-fg-1)]"
            onClick={() => setAmbientC(p.v)}
          >
            {p.label}
          </button>
        ))}
      </div>
      <p className="mt-2 font-mono text-xs text-[var(--color-fg-3)]">
        readout — {r.celsius.toFixed(1)} °C · {r.fahrenheit.toFixed(1)} °F ·{" "}
        {r.kelvin.toFixed(2)} K
      </p>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  ambientC: number,
  t: number,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  drawSectionTitle(ctx, 16, 14, "GALILEO'S THERMOSCOPE", tokens.textMute);

  // Warmth fraction 0..1 — drives both the air-gap glow and the column drop.
  const frac = (ambientC - T_MIN) / (T_MAX - T_MIN);

  // ── Geometry ───────────────────────────────────────────────────────────
  const cx = W * 0.5;
  const bulbR = Math.min(46, W * 0.075);
  const bulbCY = H * 0.26;
  const neckTop = bulbCY + bulbR * 0.7;
  const neckBottom = H * 0.78;
  const neckH = neckBottom - neckTop;
  const neckW = Math.max(12, bulbR * 0.42);

  // Dish of water at the base.
  const dishY = H * 0.78;
  const dishW = Math.min(W * 0.5, 260);
  const dishH = 46;
  const dishX = cx - dishW / 2;

  // Water surface in the dish (subtle ripple).
  const ripple = Math.sin(t * 1.6) * 1.2;
  const dishWaterY = dishY + 12 + ripple;

  // Column height inside the neck: hot → low column, cold → high column.
  // At T_MIN the column nearly fills the neck; at T_MAX it sinks toward the dish.
  const colTopMin = neckTop + neckH * 0.06; // coldest: high
  const colTopMax = neckTop + neckH * 0.82; // hottest: low
  const colTopY = colTopMin + frac * (colTopMax - colTopMin);

  const waterColor = tokens.blue;
  const glassColor = hexToRgba(tokens.textFaint, 0.55);

  // ── Trapped air pocket glow (bulb), warms toward red as T rises ─────────
  const airColor = frac < 0.5
    ? blend(tokens.cyan, tokens.amber, frac / 0.5)
    : blend(tokens.amber, tokens.red, (frac - 0.5) / 0.5);

  // Bulb glow.
  const glow = ctx.createRadialGradient(cx, bulbCY, bulbR * 0.2, cx, bulbCY, bulbR * 1.8);
  glow.addColorStop(0, hexToRgba(airColor, 0.35 + frac * 0.4));
  glow.addColorStop(1, hexToRgba(airColor, 0));
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, bulbCY, bulbR * 1.8, 0, Math.PI * 2);
  ctx.fill();

  // ── Glass: bulb + neck outline ──────────────────────────────────────────
  ctx.strokeStyle = glassColor;
  ctx.lineWidth = 2;

  // Bulb
  ctx.beginPath();
  ctx.arc(cx, bulbCY, bulbR, 0, Math.PI * 2);
  ctx.stroke();
  // Air fill inside bulb
  ctx.fillStyle = hexToRgba(airColor, 0.18 + frac * 0.22);
  ctx.beginPath();
  ctx.arc(cx, bulbCY, bulbR - 2, 0, Math.PI * 2);
  ctx.fill();

  // Neck (two vertical walls)
  ctx.strokeStyle = glassColor;
  ctx.beginPath();
  ctx.moveTo(cx - neckW / 2, neckTop);
  ctx.lineTo(cx - neckW / 2, neckBottom);
  ctx.moveTo(cx + neckW / 2, neckTop);
  ctx.lineTo(cx + neckW / 2, neckBottom);
  ctx.stroke();

  // ── Water column inside the neck (from colTopY down into the dish) ───────
  ctx.fillStyle = hexToRgba(waterColor, 0.85);
  ctx.fillRect(cx - neckW / 2 + 1, colTopY, neckW - 2, neckBottom - colTopY + 6);

  // Meniscus line
  ctx.strokeStyle = hexToRgba(waterColor, 1);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - neckW / 2 + 1, colTopY);
  ctx.lineTo(cx + neckW / 2 - 1, colTopY);
  ctx.stroke();

  // Trapped-air label arrow inside bulb.
  ctx.fillStyle = tokens.textMute;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("trapped air", cx, bulbCY);

  // ── Dish ────────────────────────────────────────────────────────────────
  ctx.strokeStyle = glassColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(dishX, dishY);
  ctx.lineTo(dishX, dishY + dishH);
  ctx.lineTo(dishX + dishW, dishY + dishH);
  ctx.lineTo(dishX + dishW, dishY);
  ctx.stroke();
  // dish water
  ctx.fillStyle = hexToRgba(waterColor, 0.7);
  ctx.fillRect(dishX + 1, dishWaterY, dishW - 2, dishY + dishH - dishWaterY - 1);
  ctx.strokeStyle = hexToRgba(waterColor, 1);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(dishX + 1, dishWaterY);
  ctx.lineTo(dishX + dishW - 1, dishWaterY);
  ctx.stroke();

  // ── Direction hint: arrow on the column ─────────────────────────────────
  const arrowX = cx + neckW / 2 + 22;
  ctx.strokeStyle = hexToRgba(tokens.textFaint, 0.8);
  ctx.fillStyle = hexToRgba(tokens.textFaint, 0.8);
  ctx.lineWidth = 1.5;
  const dir = frac > 0.5 ? 1 : -1; // warmer than mid → pushing down
  const ay0 = colTopY;
  const ay1 = colTopY + dir * 26;
  ctx.beginPath();
  ctx.moveTo(arrowX, ay0);
  ctx.lineTo(arrowX, ay1);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(arrowX, ay1);
  ctx.lineTo(arrowX - 4, ay1 - dir * 6);
  ctx.lineTo(arrowX + 4, ay1 - dir * 6);
  ctx.closePath();
  ctx.fill();
  ctx.textAlign = "left";
  ctx.font = FONT_HUD_SMALL;
  ctx.fillStyle = tokens.textMute;
  ctx.fillText(frac > 0.5 ? "air expands" : "air contracts", arrowX + 8, (ay0 + ay1) / 2);

  // ── Tri-scale readout panel (top-right) ─────────────────────────────────
  const r = readoutFromCelsius(ambientC);
  const panelX = W - 168;
  const panelY = 34;
  ctx.font = FONT_HUD;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  const rows: [string, string, string][] = [
    ["°C", r.celsius.toFixed(1), tokens.red],
    ["°F", r.fahrenheit.toFixed(1), tokens.amber],
    ["K", r.kelvin.toFixed(2), tokens.cyan],
  ];
  rows.forEach(([label, value, color], i) => {
    const y = panelY + i * 22;
    ctx.fillStyle = tokens.textMute;
    ctx.fillText(label, panelX, y);
    ctx.fillStyle = color;
    ctx.fillText(value, panelX + 34, y);
  });

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

/** Linear blend of two CSS color strings via the canvas — approximated by
 *  parsing only #rrggbb; falls back to `a`. */
function blend(a: string, b: string, t: number): string {
  const pa = parseHex(a);
  const pb = parseHex(b);
  if (!pa || !pb) return a;
  const r = Math.round(pa[0] + (pb[0] - pa[0]) * t);
  const g = Math.round(pa[1] + (pb[1] - pa[1]) * t);
  const bl = Math.round(pa[2] + (pb[2] - pa[2]) * t);
  return `rgb(${r},${g},${bl})`;
}

function parseHex(hex: string): [number, number, number] | null {
  if (!hex.startsWith("#")) return null;
  const h = hex.replace("#", "");
  const e = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  if (e.length !== 6) return null;
  return [
    parseInt(e.slice(0, 2), 16),
    parseInt(e.slice(2, 4), 16),
    parseInt(e.slice(4, 6), 16),
  ];
}
