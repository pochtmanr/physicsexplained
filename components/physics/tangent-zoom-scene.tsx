"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  SCENE_CANVAS_CLASS,
  SceneControlGroup,
  SceneReadout,
  SceneSlider,
  drawLabel,
  formatTick,
  niceTicks,
  syncCanvas,
  useSceneSize,
  useSceneTokens,
} from "@/components/physics/_shared";

const T_MIN = 0;
const T_MAX = 3;

// x(t) = 0.5 t² + 0.3 t  →  x'(t) = t + 0.3
function x(t: number) {
  return 0.5 * t * t + 0.3 * t;
}

export function TangentZoomScene() {
  const t = useTranslations("scenes.tangentZoom");
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.6,
    maxHeight: 340,
    minHeight: 220,
    initialWidth: 640,
    fullView: "ratio",
  });
  const [t0, setT0] = useState(1.4);
  const [dt, setDt] = useState(1.0);

  // Second point, kept inside the plotted range.
  const tA = t0;
  const tB = Math.min(T_MAX - 0.02, t0 + dt);
  const secantSlope = (x(tB) - x(tA)) / (tB - tA);
  const tangentSlope = tA + 0.3;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = syncCanvas(canvas, width, height);
    if (!ctx) return;
    const bounds = { width, height };

    const padL = 50; // room for the x-axis numbers and the "t (s)" axis name
    const padR = 16;
    const padT = 16;
    const padB = 30; // room for the t-axis numbers
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;
    const xMax = x(T_MAX) + 0.3;
    const toPx = (tt: number, xx: number) => ({
      px: padL + ((tt - T_MIN) / (T_MAX - T_MIN)) * plotW,
      py: padT + plotH - (xx / xMax) * plotH,
    });

    // Grid and scale: whole seconds across, round metres up.
    const { ticks: xTicks, step: xStep } = niceTicks(0, xMax, 4);
    ctx.strokeStyle = tokens.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = T_MIN + 1; i <= T_MAX; i++) {
      const { px } = toPx(i, 0);
      ctx.moveTo(px, padT);
      ctx.lineTo(px, padT + plotH);
    }
    for (const tick of xTicks) {
      if (tick === 0) continue;
      const { py } = toPx(0, tick);
      ctx.moveTo(padL, py);
      ctx.lineTo(padL + plotW, py);
    }
    ctx.stroke();

    // Axes
    ctx.strokeStyle = tokens.gridHeavy;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padL, padT);
    ctx.lineTo(padL, padT + plotH);
    ctx.lineTo(padL + plotW, padT + plotH);
    ctx.stroke();

    // Everything below is clipped to the plot, so the extended secant cannot
    // run into the axis labels.
    ctx.save();
    ctx.beginPath();
    ctx.rect(padL, padT, plotW, plotH);
    ctx.clip();

    // Curve x(t)
    ctx.strokeStyle = tokens.textDim;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= 200; i++) {
      const tt = T_MIN + (i / 200) * (T_MAX - T_MIN);
      const { px, py } = toPx(tt, x(tt));
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Secant, extended across the plot
    const xA = x(tA);
    ctx.strokeStyle = tokens.cyan;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    const left = toPx(T_MIN, xA + secantSlope * (T_MIN - tA));
    const right = toPx(T_MAX, xA + secantSlope * (T_MAX - tA));
    ctx.beginPath();
    ctx.moveTo(left.px, left.py);
    ctx.lineTo(right.px, right.py);
    ctx.stroke();

    // Rise / run triangle
    const pA = toPx(tA, xA);
    const pB = toPx(tB, x(tB));
    ctx.strokeStyle = tokens.axes;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.moveTo(pA.px, pA.py);
    ctx.lineTo(pB.px, pA.py);
    ctx.lineTo(pB.px, pB.py);
    ctx.stroke();
    ctx.setLineDash([]);

    // The two points
    ctx.fillStyle = tokens.cyan;
    for (const p of [pA, pB]) {
      ctx.beginPath();
      ctx.arc(p.px, p.py, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Axis numbers
    for (let i = T_MIN; i <= T_MAX; i++) {
      drawLabel(ctx, String(i), toPx(i, 0).px, padT + plotH + 14, {
        bounds,
        color: tokens.textLabel,
        align: "center",
        font: tokens.fontHudSmall,
      });
    }
    for (const tick of xTicks) {
      const { py } = toPx(0, tick);
      if (tick === 0 || py < padT + 18) continue;
      drawLabel(ctx, formatTick(tick, xStep), padL - 6, py, {
        bounds,
        color: tokens.textLabel,
        align: "right",
        font: tokens.fontHudSmall,
      });
    }

    // Axis names, with units: in the left gutter, as in the other graphs.
    drawLabel(ctx, "t (s)", padL - 12, padT + plotH + 14, {
      bounds,
      color: tokens.textLabel,
      align: "right",
      font: tokens.fontHudSmall,
    });
    drawLabel(ctx, "x (m)", padL - 6, padT, {
      bounds,
      color: tokens.textLabel,
      align: "right",
      baseline: "top",
      font: tokens.fontHudSmall,
    });
  }, [tA, tB, secantSlope, width, height, tokens]);

  return (
    <div ref={containerRef} className="w-full pb-4">
      <div className="mx-auto" style={{ width }}>
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={t("aria")}
          className={SCENE_CANVAS_CLASS}
          style={{ width, height }}
        />
        <SceneReadout
          items={[
            // Three decimals: the point of the figure is watching the secant
            // close in on the tangent, and the last steps are in the thousandths.
            {
              label: t("secant"),
              value: `${secantSlope.toFixed(3)} m/s`,
              color: "var(--color-cyan)",
            },
            { label: t("tangent"), value: `${tangentSlope.toFixed(3)} m/s` },
          ]}
        />
        <SceneControlGroup>
          <SceneSlider
            label="t"
            ariaLabel={t("time")}
            value={t0}
            min={0.2}
            max={2.4}
            step={0.01}
            onChange={setT0}
            display={`${t0.toFixed(2)} s`}
          />
          <SceneSlider
            label="Δt"
            ariaLabel={t("interval")}
            value={dt}
            min={0.01}
            max={1.5}
            step={0.01}
            onChange={setDt}
            display={`${dt.toFixed(2)} s`}
          />
        </SceneControlGroup>
      </div>
    </div>
  );
}
