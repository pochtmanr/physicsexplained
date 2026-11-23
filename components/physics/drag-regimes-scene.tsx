"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  SCENE_CANVAS_CLASS,
  SceneControlGroup,
  ScenePanel,
  SceneReadout,
  SceneSlider,
  SceneStage,
  drawLabel,
  syncCanvas,
  useSceneHover,
  useSceneSize,
  useSceneTokens,
} from "@/components/physics/_shared";
import { dragCrossoverVelocity, sampleDragRegimes } from "@/lib/physics/friction";

const V_MIN = 0.01;
const V_MAX = 100;
const LOG_V_MIN = Math.log10(V_MIN);
const LOG_V_MAX = Math.log10(V_MAX);
/**
 * Force window, fixed so the axes don't jump as the sliders move. The largest
 * force at v = 100 is k·10⁴ + b·10² ≈ 10⁴ at the top of both sliders.
 */
const LOG_F_MIN = -4;
const LOG_F_MAX = 5;
/** Pixels per decade (at scale 1) from which every force decade is numbered. */
const FINE_DECADE_PX = 48;

/** The three curves, by guide key. */
const CURVE_KEYS = ["linear", "quadratic", "total"] as const;
type CurveKey = (typeof CURVE_KEYS)[number];
/** A slider's guide key → the curve of the term it sets. */
const CONTROL_CURVE: Record<string, CurveKey> = { b: "linear", k: "quadratic" };

const SUPERSCRIPT: Record<string, string> = {
  "-": "⁻",
  "0": "⁰",
  "1": "¹",
  "2": "²",
  "3": "³",
  "4": "⁴",
  "5": "⁵",
  "6": "⁶",
  "7": "⁷",
  "8": "⁸",
  "9": "⁹",
};
/** "10⁻²" for exponent −2. */
const decade = (exp: number) =>
  `10${String(exp)
    .split("")
    .map((c) => SUPERSCRIPT[c] ?? c)
    .join("")}`;
/** A force or speed with two significant figures, in powers of ten when far from 1. */
function formatValue(x: number): string {
  if (x >= 0.01 && x < 1000) return String(Number(x.toPrecision(2)));
  const exp = Math.floor(Math.log10(x));
  return `${(x / 10 ** exp).toFixed(1)}×${decade(exp)}`;
}

/**
 * FIG.04c — drag force against speed on log-log axes: the Stokes term b·v
 * (slope 1), the Newton term k·v² (slope 2) and their sum, with the crossover
 * where the two are equal. A static drawing that redraws on input.
 */
export function DragRegimesScene() {
  const t = useTranslations("scenes.dragRegimes");
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.62,
    maxHeight: 420,
    initialWidth: 720,
    // A plot reads well at any shape.
    fullView: "fill",
  });
  // b: linear (Stokes) coefficient. k: quadratic coefficient. The defaults
  // put the crossover at v = 1 m/s, a hand-sized object in air.
  const [b, setB] = useState(0.05);
  const [k, setK] = useState(0.05);

  // Every pixel size goes through `u`, so text and lines grow together in
  // full view on a large screen (docs/figure-full-view.md).
  const scale = tokens.scale;
  const u = (n: number) => n * scale;

  const padL = u(56);
  const padR = u(20);
  const padT = u(28);
  const padB = u(44);
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;
  const pxV = (v: number) =>
    padL + ((Math.log10(Math.max(v, 1e-9)) - LOG_V_MIN) / (LOG_V_MAX - LOG_V_MIN)) * plotW;
  const pxF = (f: number) =>
    padT + plotH - ((Math.log10(Math.max(f, 1e-12)) - LOG_F_MIN) / (LOG_F_MAX - LOG_F_MIN)) * plotH;
  const vAtPx = (px: number) => 10 ** (LOG_V_MIN + ((px - padL) / plotW) * (LOG_V_MAX - LOG_V_MIN));
  const force: Record<CurveKey, (v: number) => number> = {
    linear: (v) => b * v,
    quadratic: (v) => k * v * v,
    total: (v) => b * v + k * v * v,
  };
  const vCross = dragCrossoverVelocity(b, k);
  const crossShown = vCross > V_MIN && vCross < V_MAX;
  const cross = { x: pxV(vCross), y: pxF(b * vCross) };
  // Legend rows, top left inside the plot.
  const legendX = padL + u(12);
  const legendRowY = (i: number) => padT + u(10) + i * u(18);
  const legendW = u(240);

  const hover = useSceneHover(canvasRef, (px, py) => {
    if (px < padL || px > padL + plotW || py < padT || py > padT + plotH) return null;
    for (let i = 0; i < CURVE_KEYS.length; i++) {
      if (px <= legendX + legendW && Math.abs(py - legendRowY(i)) <= u(8)) return CURVE_KEYS[i];
    }
    if (crossShown && Math.hypot(px - cross.x, py - cross.y) <= u(9)) return "crossover";
    // The nearest curve, measured straight up or down at the pointer's speed.
    const v = vAtPx(px);
    let best: CurveKey | null = null;
    let bestDist = u(9);
    for (const key of ["total", "quadratic", "linear"] as const) {
      const dist = Math.abs(pxF(force[key](v)) - py);
      if (dist < bestDist) {
        best = key;
        bestDist = dist;
      }
    }
    // Anywhere else on the plot stands for what an object actually feels.
    return best ?? "total";
  });
  const { activeKey, pointer } = hover;
  const linked = activeKey === null ? null : (CONTROL_CURVE[activeKey] ?? activeKey);
  const focusCurve: CurveKey | null = CURVE_KEYS.find((key) => key === linked) ?? null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = syncCanvas(canvas, width, height);
    if (!ctx) return;
    const bounds = { width, height };
    const color: Record<CurveKey, string> = {
      linear: tokens.amber,
      quadratic: tokens.magenta,
      total: tokens.cyan,
    };

    const samples = sampleDragRegimes({
      linearCoefficient: b,
      quadraticCoefficient: k,
      vMin: V_MIN,
      vMax: V_MAX,
      samples: 240,
    });

    // Grid: one line per decade.
    ctx.strokeStyle = tokens.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let lv = Math.ceil(LOG_V_MIN); lv <= Math.floor(LOG_V_MAX); lv++) {
      const px = pxV(10 ** lv);
      ctx.moveTo(px, padT);
      ctx.lineTo(px, padT + plotH);
    }
    for (let lf = LOG_F_MIN; lf <= LOG_F_MAX; lf++) {
      const py = pxF(10 ** lf);
      ctx.moveTo(padL, py);
      ctx.lineTo(padL + plotW, py);
    }
    ctx.stroke();

    // Axes
    ctx.strokeStyle = tokens.axes;
    ctx.beginPath();
    ctx.moveTo(padL, padT);
    ctx.lineTo(padL, padT + plotH);
    ctx.lineTo(padL + plotW, padT + plotH);
    ctx.stroke();

    // Curves, kept inside the plot.
    ctx.save();
    ctx.beginPath();
    ctx.rect(padL, padT, plotW, plotH);
    ctx.clip();
    const curve = (key: CurveKey, pick: (s: (typeof samples)[number]) => number) => {
      const focused = focusCurve === key;
      const base = key === "total" ? 2.25 : 1.5;
      ctx.strokeStyle = color[key];
      ctx.lineWidth = u(focused ? 3 : base);
      ctx.globalAlpha = focusCurve !== null && !focused ? 0.35 : 1;
      ctx.setLineDash(key === "total" ? [] : [u(5), u(4)]);
      ctx.beginPath();
      samples.forEach((s, i) => {
        const px = pxV(s.v);
        const py = pxF(pick(s));
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    };
    curve("linear", (s) => s.linear);
    curve("quadratic", (s) => s.quadratic);
    curve("total", (s) => s.total);
    ctx.restore();

    // Crossover marker: where the two terms are equal.
    const crossFocused = activeKey === "crossover";
    if (crossShown) {
      ctx.strokeStyle = tokens.cyan;
      ctx.lineWidth = crossFocused ? u(1.5) : 1;
      ctx.globalAlpha = crossFocused ? 1 : 0.35;
      ctx.setLineDash([u(2), u(3)]);
      ctx.beginPath();
      ctx.moveTo(cross.x, padT + plotH);
      ctx.lineTo(cross.x, cross.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      ctx.fillStyle = tokens.cyan;
      ctx.beginPath();
      ctx.arc(cross.x, cross.y, u(5), 0, Math.PI * 2);
      ctx.fill();
      if (crossFocused) {
        ctx.lineWidth = u(1.5);
        ctx.setLineDash([u(3), u(3)]);
        ctx.beginPath();
        ctx.arc(cross.x, cross.y, u(10), 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Axis numbers: every speed decade; every second force decade, or every
    // one when the plot is tall enough (never inline).
    for (let lv = Math.ceil(LOG_V_MIN); lv <= Math.floor(LOG_V_MAX); lv++) {
      drawLabel(ctx, decade(lv), pxV(10 ** lv), padT + plotH + u(12), {
        bounds,
        color: tokens.textLabel,
        align: "center",
        font: tokens.fontHudSmall,
      });
    }
    const fStep = plotH / (LOG_F_MAX - LOG_F_MIN) >= u(FINE_DECADE_PX) ? 1 : 2;
    for (let lf = LOG_F_MIN; lf <= LOG_F_MAX; lf += fStep) {
      drawLabel(ctx, decade(lf), padL - u(6), pxF(10 ** lf), {
        bounds,
        color: tokens.textLabel,
        align: "right",
        font: tokens.fontHudSmall,
      });
    }

    // Axis titles
    drawLabel(ctx, t("speedAxis"), padL + plotW / 2, padT + plotH + u(30), {
      bounds,
      color: tokens.textDim,
      align: "center",
      direction: "inherit",
      font: tokens.fontLabel,
    });
    ctx.save();
    ctx.translate(u(18), padT + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.font = tokens.fontLabel;
    ctx.fillStyle = tokens.textDim;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.direction = "inherit";
    ctx.fillText(t("forceAxis"), 0, 0);
    ctx.restore();

    // Crossover name, above the speed axis.
    if (crossShown) {
      drawLabel(ctx, "Re ≈ 1", cross.x, padT + plotH - u(8), {
        bounds,
        color: crossFocused ? tokens.cyan : tokens.textDim,
        align: "center",
        font: tokens.fontHudSmall,
        plate: tokens.bg1,
        scale,
      });
    }

    // Legend
    const legend: [CurveKey, string][] = [
      ["linear", t("legendLinear")],
      ["quadratic", t("legendQuadratic")],
      ["total", t("legendTotal")],
    ];
    legend.forEach(([key, text], i) => {
      const y = legendRowY(i);
      const focused = focusCurve === key;
      ctx.strokeStyle = color[key];
      ctx.lineWidth = u(focused ? 3 : 2);
      ctx.globalAlpha = focusCurve !== null && !focused ? 0.35 : 1;
      ctx.setLineDash(key === "total" ? [] : [u(5), u(4)]);
      ctx.beginPath();
      ctx.moveTo(legendX, y);
      ctx.lineTo(legendX + u(22), y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      drawLabel(ctx, text, legendX + u(30), y, {
        bounds,
        color: focused ? tokens.textBright : tokens.textDim,
        font: tokens.fontHudSmall,
        plate: tokens.bg1,
        scale,
      });
    });

    // Measurement guidelines: the focused curve (else the total) at the
    // pointer's speed, read off both axes.
    const p = pointer;
    if (p && p.x >= padL && p.x <= padL + plotW && p.y >= padT && p.y <= padT + plotH) {
      const key = focusCurve ?? "total";
      const v = vAtPx(p.x);
      const f = force[key](v);
      const fy = pxF(f);
      if (fy >= padT && fy <= padT + plotH) {
        ctx.strokeStyle = color[key];
        ctx.lineWidth = 1;
        ctx.setLineDash([u(4), u(3)]);
        ctx.beginPath();
        ctx.moveTo(padL, fy);
        ctx.lineTo(p.x, fy);
        ctx.lineTo(p.x, padT + plotH);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = tokens.bg1;
        ctx.beginPath();
        ctx.arc(p.x, fy, u(5), 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = u(2);
        ctx.stroke();
        drawLabel(ctx, `${formatValue(f)} N`, padL - u(4), fy, {
          bounds,
          color: color[key],
          align: "right",
          font: tokens.fontHudSmall,
          plate: tokens.bg1,
          scale,
        });
        drawLabel(ctx, `${formatValue(v)} m/s`, p.x, padT + plotH - u(3), {
          bounds,
          color: tokens.textBright,
          align: "center",
          baseline: "bottom",
          font: tokens.fontHudSmall,
          plate: tokens.bg1,
          scale,
        });
      }
    }
  }, [b, k, width, height, tokens, activeKey, pointer, t]);

  return (
    <div ref={containerRef} className="scene-root w-full pb-4">
      <div className="mx-auto" style={{ width }}>
        <SceneStage>
          <canvas
            ref={canvasRef}
            role="img"
            aria-label={t("aria")}
            className={SCENE_CANVAS_CLASS}
            style={{ width, height }}
          />
        </SceneStage>
        <ScenePanel>
          <SceneReadout
            items={[
              {
                label: (
                  <>
                    v<sub>×</sub> = b / k
                  </>
                ),
                value: crossShown ? `${vCross.toFixed(2)} m/s` : "—",
                color: "var(--color-cyan)",
                guideKey: "crossover",
              },
              {
                label: (
                  <>
                    F(v<sub>×</sub>)
                  </>
                ),
                value: crossShown ? `${formatValue(2 * b * vCross)} N` : "—",
                guideKey: "crossover",
              },
            ]}
          />
        </ScenePanel>
        <SceneControlGroup>
          <SceneSlider
            label={t("stokes")}
            guideKey="b"
            value={b}
            min={0.001}
            max={1}
            step={0.001}
            onChange={setB}
            display={b.toFixed(3)}
          />
          <SceneSlider
            label={t("newton")}
            guideKey="k"
            value={k}
            min={0.001}
            max={1}
            step={0.001}
            onChange={setK}
            display={k.toFixed(3)}
          />
          <p className="text-xs text-[var(--color-fg-2)]">{t("note")}</p>
        </SceneControlGroup>
      </div>
    </div>
  );
}
