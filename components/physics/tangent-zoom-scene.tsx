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
  drawFocusRing,
  drawLabel,
  formatTick,
  niceTicks,
  syncCanvas,
  useSceneHover,
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
    // The plot adapts to any shape, so the full view uses all the room
    // instead of leaving empty bands around a fixed-ratio drawing.
    fullView: "fill",
  });
  const [t0, setT0] = useState(1.4);
  const [dt, setDt] = useState(1.0);

  // Second point, kept inside the plotted range.
  const tA = t0;
  const tB = Math.min(T_MAX - 0.02, t0 + dt);
  const secantSlope = (x(tB) - x(tA)) / (tB - tA);
  const tangentSlope = tA + 0.3;

  // Every pixel size goes through `u`, so text and marks grow together in
  // full view on a large screen (docs/figure-full-view.md).
  const scale = tokens.scale;
  const u = (n: number) => n * scale;

  const padL = u(50); // room for the x-axis numbers and the "t (s)" axis name
  const padR = u(16);
  const padT = u(16);
  const padB = u(30); // room for the t-axis numbers
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;
  const xMax = x(T_MAX) + 0.3;
  const toPx = (tt: number, xx: number) => ({
    px: padL + ((tt - T_MIN) / (T_MAX - T_MIN)) * plotW,
    py: padT + plotH - (xx / xMax) * plotH,
  });
  const toT = (px: number) => T_MIN + ((px - padL) / plotW) * (T_MAX - T_MIN);

  // What lies under the pointer, most specific first: the first point (the
  // time slider), the triangle's legs (the interval), the secant, the curve.
  const hover = useSceneHover(canvasRef, (px, py) => {
    if (px < padL || px > padL + plotW || py < padT || py > padT + plotH) return null;
    const reach = u(9);
    const pA = toPx(tA, x(tA));
    const pB = toPx(tB, x(tB));
    if (Math.hypot(px - pA.px, py - pA.py) <= reach * 1.3) return "time";
    const onRun = Math.abs(py - pA.py) <= reach && px >= pA.px && px <= pB.px;
    const onRise = Math.abs(px - pB.px) <= reach && py <= pA.py && py >= pB.py;
    if (onRun || onRise) return "interval";
    const tt = toT(px);
    const secantY = toPx(tt, x(tA) + secantSlope * (tt - tA)).py;
    if (Math.abs(py - secantY) <= reach) return "secant";
    if (Math.abs(py - toPx(tt, x(tt)).py) <= reach) return "curve";
    return null;
  });
  const { activeKey, pointer } = hover;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = syncCanvas(canvas, width, height);
    if (!ctx) return;
    const bounds = { width, height };

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
    ctx.strokeStyle = activeKey === "curve" ? tokens.textBright : tokens.textDim;
    ctx.lineWidth = u(activeKey === "curve" ? 3 : 2);
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
    ctx.lineWidth = u(activeKey === "secant" ? 2.5 : 1.5);
    ctx.setLineDash([u(5), u(4)]);
    const left = toPx(T_MIN, xA + secantSlope * (T_MIN - tA));
    const right = toPx(T_MAX, xA + secantSlope * (T_MAX - tA));
    ctx.beginPath();
    ctx.moveTo(left.px, left.py);
    ctx.lineTo(right.px, right.py);
    ctx.stroke();

    // Rise / run triangle
    const pA = toPx(tA, xA);
    const pB = toPx(tB, x(tB));
    const intervalFocused = activeKey === "interval";
    ctx.strokeStyle = intervalFocused ? tokens.cyan : tokens.axes;
    ctx.lineWidth = intervalFocused ? u(1.5) : 1;
    ctx.setLineDash([u(2), u(3)]);
    ctx.beginPath();
    ctx.moveTo(pA.px, pA.py);
    ctx.lineTo(pB.px, pA.py);
    ctx.lineTo(pB.px, pB.py);
    ctx.stroke();
    ctx.setLineDash([]);

    // The tangent at the first point: shown only while its readout or guide
    // entry is pointed at, as the line the secant is closing in on.
    if (activeKey === "tangent") {
      ctx.strokeStyle = tokens.amber;
      ctx.lineWidth = u(2);
      const tl = toPx(T_MIN, xA + tangentSlope * (T_MIN - tA));
      const tr = toPx(T_MAX, xA + tangentSlope * (T_MAX - tA));
      ctx.beginPath();
      ctx.moveTo(tl.px, tl.py);
      ctx.lineTo(tr.px, tr.py);
      ctx.stroke();
    }

    // The two points
    ctx.fillStyle = tokens.cyan;
    for (const p of [pA, pB]) {
      ctx.beginPath();
      ctx.arc(p.px, p.py, u(5), 0, Math.PI * 2);
      ctx.fill();
    }
    if (activeKey === "time") drawFocusRing(ctx, pA.px, pA.py, u(11), tokens.cyan, scale);

    // The interval's two sides, named while it is pointed at.
    if (intervalFocused) {
      drawLabel(ctx, "Δt", (pA.px + pB.px) / 2, pA.py + u(10), {
        bounds,
        color: tokens.cyan,
        align: "center",
        font: tokens.fontLabel,
        plate: tokens.bg1,
        scale,
      });
      drawLabel(ctx, "Δx", pB.px + u(8), (pA.py + pB.py) / 2, {
        bounds,
        color: tokens.cyan,
        font: tokens.fontLabel,
        plate: tokens.bg1,
        scale,
      });
    }
    ctx.restore();

    // Axis numbers
    for (let i = T_MIN; i <= T_MAX; i++) {
      drawLabel(ctx, String(i), toPx(i, 0).px, padT + plotH + u(14), {
        bounds,
        color: tokens.textLabel,
        align: "center",
        font: tokens.fontHudSmall,
      });
    }
    for (const tick of xTicks) {
      const { py } = toPx(0, tick);
      if (tick === 0 || py < padT + u(18)) continue;
      drawLabel(ctx, formatTick(tick, xStep), padL - u(6), py, {
        bounds,
        color: tokens.textLabel,
        align: "right",
        font: tokens.fontHudSmall,
      });
    }

    // Axis names, with units: in the left gutter, as in the other graphs.
    drawLabel(ctx, "t (s)", padL - u(12), padT + plotH + u(14), {
      bounds,
      color: tokens.textLabel,
      align: "right",
      font: tokens.fontHudSmall,
    });
    drawLabel(ctx, "x (m)", padL - u(6), padT, {
      bounds,
      color: tokens.textLabel,
      align: "right",
      baseline: "top",
      font: tokens.fontHudSmall,
    });

    // Measurement guidelines: while the pointer is on the plot, read the
    // curve at that time off both axes.
    if (pointer && pointer.x >= padL && pointer.x <= padL + plotW) {
      const tt = toT(pointer.x);
      const at = toPx(tt, x(tt));
      ctx.strokeStyle = tokens.textDim;
      ctx.lineWidth = 1;
      ctx.setLineDash([u(4), u(3)]);
      ctx.beginPath();
      ctx.moveTo(padL, at.py);
      ctx.lineTo(at.px, at.py);
      ctx.lineTo(at.px, padT + plotH);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = tokens.bg1;
      ctx.beginPath();
      ctx.arc(at.px, at.py, u(4), 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = u(1.5);
      ctx.stroke();
      // On plates, so they stay readable over the tick numbers.
      drawLabel(ctx, `${x(tt).toFixed(2)} m`, padL - u(4), at.py, {
        bounds,
        color: tokens.textBright,
        align: "right",
        font: tokens.fontHudSmall,
        plate: tokens.bg1,
        scale,
      });
      drawLabel(ctx, `${tt.toFixed(2)} s`, at.px, padT + plotH + u(14), {
        bounds,
        color: tokens.textBright,
        align: "center",
        font: tokens.fontHudSmall,
        plate: tokens.bg1,
        scale,
      });
    }
    // `toPx`, `toT` and `u` are rebuilt each render from the values listed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tA, tB, secantSlope, tangentSlope, width, height, tokens, activeKey, pointer]);

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
              // Three decimals: the point of the figure is watching the secant
              // close in on the tangent, and the last steps are in the thousandths.
              {
                label: t("secant"),
                value: `${secantSlope.toFixed(3)} m/s`,
                color: "var(--color-cyan)",
                guideKey: "secant",
              },
              {
                label: t("tangent"),
                value: `${tangentSlope.toFixed(3)} m/s`,
                guideKey: "tangent",
              },
            ]}
          />
        </ScenePanel>
        <SceneControlGroup>
          <SceneSlider
            label="t"
            ariaLabel={t("time")}
            guideKey="time"
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
            guideKey="interval"
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
