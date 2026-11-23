"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  SCENE_CANVAS_CLASS,
  SceneControlGroup,
  SceneControls,
  ScenePanel,
  SceneReadout,
  SceneSlider,
  SceneStage,
  drawLabel,
  formatTick,
  hexToRgba,
  niceTicks,
  syncCanvas,
  useSceneHover,
  useScenePlayback,
  useSceneSize,
  useSceneTokens,
} from "@/components/physics/_shared";

/** Length of the sweep, in seconds. */
const T_MAX = 5;

/** The three graphs, by the guide key of the quantity each one plots. */
const GRAPH_KEYS = ["x", "v", "a"] as const;
type GraphKey = (typeof GRAPH_KEYS)[number];
/** A slider's guide key → the graph of the quantity it sets. */
const CONTROL_GRAPH: Record<string, GraphKey> = {
  position: "x",
  velocity: "v",
  acceleration: "a",
};

export function KinematicsGraphScene() {
  const t = useTranslations("scenes.kinematicsGraph");
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 1.05,
    maxHeight: 620,
    minHeight: 340,
    initialWidth: 560,
    // Inline the height is capped at 620, so keeping the ratio in full view
    // would give a narrower figure than the inline one; graphs read well wide.
    fullView: "fill",
  });
  const [x0, setX0] = useState(0);
  const [v0, setV0] = useState(2);
  const [a, setA] = useState(1);

  const xAt = (tt: number) => x0 + v0 * tt + 0.5 * a * tt * tt;
  const vAt = (tt: number) => v0 + a * tt;

  // Every pixel size goes through `u`, so text and marks grow together in
  // full view on a large screen (docs/figure-full-view.md).
  const u = (n: number) => n * tokens.scale;

  // Vertical layout, top to bottom: track strip, then three graphs, each
  // under its own title row, then the time tick row.
  const graphX = u(52); // left gutter for the y-axis numbers
  const graphW = width - graphX - u(18);
  const trackY = u(22);
  const graphsTop = u(56);
  const titleRow = u(18); // titles sit above the plot, never over the data
  const gap = u(6);
  const tickRow = u(22);
  const graphH = (height - graphsTop - (titleRow + gap) * 3 + gap - tickRow) / 3;
  const graphTop = (i: number) => graphsTop + i * (titleRow + graphH + gap);

  // Pointing anywhere on a graph means the quantity it plots.
  const hover = useSceneHover(canvasRef, (px, py) => {
    if (px < graphX || px > graphX + graphW) return null;
    for (let i = 0; i < GRAPH_KEYS.length; i++) {
      const top = graphTop(i);
      if (py >= top && py <= top + titleRow + graphH) return GRAPH_KEYS[i];
    }
    return null;
  });
  // A slider points at the graph of the quantity it sets.
  const linked =
    hover.activeKey === null ? null : (CONTROL_GRAPH[hover.activeKey] ?? hover.activeKey);
  const focusGraph: GraphKey | null = GRAPH_KEYS.find((k) => k === linked) ?? null;

  const playback = useScenePlayback({
    elementRef: containerRef,
    duration: T_MAX,
    draw: (tCursor) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = syncCanvas(canvas, width, height);
      if (!ctx) return;
      const bounds = { width, height };

      // ---- 1D track ----
      ctx.strokeStyle = tokens.gridHeavy;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(graphX, trackY);
      ctx.lineTo(graphX + graphW, trackY);
      ctx.stroke();

      // Scale the track to the whole sweep, so the ball never leaves it.
      const samples = [0, 0.25, 0.5, 0.75, 1].map((f) => xAt(f * T_MAX));
      // A turning point inside the sweep can lie beyond all five samples.
      if (a !== 0) {
        const tTurn = -v0 / a;
        if (tTurn > 0 && tTurn < T_MAX) samples.push(xAt(tTurn));
      }
      const xMin = Math.min(0, ...samples);
      const xMax = Math.max(0, ...samples);
      const margin = Math.max(xMax - xMin, 1) * 0.1;
      const xLo = xMin - margin;
      const xHi = xMax + margin;
      const toTrackPx = (xx: number) => graphX + ((xx - xLo) / (xHi - xLo)) * graphW;

      // Track scale: round positions in metres, with the origin picked out.
      const { ticks: trackTicks, step: trackStep } = niceTicks(xLo, xHi, width > 480 ? 8 : 4);
      for (const tick of trackTicks) {
        const px = toTrackPx(tick);
        const reach = tick === 0 ? u(10) : u(4);
        ctx.strokeStyle = tokens.axes;
        if (tick === 0) ctx.setLineDash([u(2), u(3)]);
        ctx.beginPath();
        ctx.moveTo(px, trackY - reach);
        ctx.lineTo(px, trackY + reach);
        ctx.stroke();
        ctx.setLineDash([]);
        drawLabel(ctx, formatTick(tick, trackStep), px, trackY + u(19), {
          bounds,
          color: tokens.textLabel,
          align: "center",
          font: tokens.fontHudSmall,
        });
      }
      drawLabel(ctx, "x (m)", graphX - u(12), trackY, {
        bounds,
        color: tokens.textLabel,
        align: "right",
        font: tokens.fontHudSmall,
      });

      // Ball: glows only while it is moving.
      if (playback.status === "playing") {
        ctx.shadowColor = hexToRgba(tokens.cyan, 0.55);
        ctx.shadowBlur = u(12);
      }
      ctx.fillStyle = tokens.cyan;
      ctx.beginPath();
      ctx.arc(toTrackPx(xAt(tCursor)), trackY, u(8), 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // ---- Three stacked graphs ----
      const drawGraph = (
        key: GraphKey,
        top: number,
        label: string,
        f: (tt: number) => number,
        accent: string,
      ) => {
        const yTop = top + titleRow;
        const ys: number[] = [];
        for (let i = 0; i <= 40; i++) ys.push(f((i / 40) * T_MAX));
        const yLo0 = Math.min(0, ...ys);
        const yHi0 = Math.max(0, ...ys);
        const yPad = Math.max((yHi0 - yLo0) * 0.15, 0.3);
        const yLo = yLo0 - yPad;
        const yHi = yHi0 + yPad;
        const toPx = (tt: number, yy: number) => ({
          px: graphX + (tt / T_MAX) * graphW,
          py: yTop + graphH - ((yy - yLo) / (yHi - yLo)) * graphH,
        });

        // Grid: one line per whole second and per value tick.
        const { ticks: yTicks, step: yStep } = niceTicks(yLo, yHi, graphH > u(110) ? 4 : 3);
        ctx.strokeStyle = tokens.grid;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 1; i <= T_MAX; i++) {
          const gx = graphX + (i / T_MAX) * graphW;
          ctx.moveTo(gx, yTop);
          ctx.lineTo(gx, yTop + graphH);
        }
        for (const tick of yTicks) {
          if (tick === 0) continue; // the zero line is drawn below
          const gy = toPx(0, tick).py;
          ctx.moveTo(graphX, gy);
          ctx.lineTo(graphX + graphW, gy);
        }
        ctx.stroke();

        // Axes
        ctx.strokeStyle = tokens.gridHeavy;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(graphX, yTop);
        ctx.lineTo(graphX, yTop + graphH);
        ctx.lineTo(graphX + graphW, yTop + graphH);
        ctx.stroke();

        // Zero line
        const zeroY = toPx(0, 0).py;
        ctx.setLineDash([u(2), u(3)]);
        ctx.beginPath();
        ctx.moveTo(graphX, zeroY);
        ctx.lineTo(graphX + graphW, zeroY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Curve. While one quantity is pointed at (here, on its readout or
        // slider, or in the guide), its curve is drawn heavier and the
        // other two step back.
        const focused = focusGraph === key;
        ctx.strokeStyle = accent;
        ctx.lineWidth = u(focused ? 3 : 2);
        ctx.globalAlpha = focusGraph !== null && !focused ? 0.35 : 1;
        ctx.beginPath();
        for (let i = 0; i <= 100; i++) {
          const tt = (i / 100) * T_MAX;
          const { px, py } = toPx(tt, f(tt));
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Cursor line and dot. The line is picked out while the scrubber's
        // guide entry is pointed at.
        const cursorX = graphX + (tCursor / T_MAX) * graphW;
        const scrubFocused = hover.activeKey === "scrub";
        ctx.strokeStyle = scrubFocused ? tokens.cyan : tokens.axes;
        ctx.lineWidth = scrubFocused ? u(1.5) : 1;
        ctx.setLineDash([u(2), u(3)]);
        ctx.beginPath();
        ctx.moveTo(cursorX, yTop);
        ctx.lineTo(cursorX, yTop + graphH);
        ctx.stroke();
        ctx.setLineDash([]);
        const pt = toPx(tCursor, f(tCursor));
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.arc(pt.px, pt.py, u(4), 0, Math.PI * 2);
        ctx.fill();

        drawLabel(ctx, label, graphX, top + titleRow / 2 - 1, {
          bounds,
          color: focused ? tokens.textBright : tokens.textDim,
          font: tokens.fontLabel,
        });
        for (const tick of yTicks) {
          drawLabel(ctx, formatTick(tick, yStep), graphX - u(6), toPx(0, tick).py, {
            bounds,
            color: tokens.textLabel,
            align: "right",
            font: tokens.fontHudSmall,
          });
        }

        // Measurement guidelines: while the pointer is on this graph, read
        // the curve at that time off both axes.
        const p = hover.pointer;
        if (
          p &&
          p.x >= graphX &&
          p.x <= graphX + graphW &&
          p.y >= top &&
          p.y <= yTop + graphH
        ) {
          const tt = ((p.x - graphX) / graphW) * T_MAX;
          const value = f(tt);
          const at = toPx(tt, value);
          ctx.strokeStyle = accent;
          ctx.lineWidth = 1;
          ctx.setLineDash([u(4), u(3)]);
          ctx.beginPath();
          ctx.moveTo(graphX, at.py);
          ctx.lineTo(at.px, at.py);
          ctx.lineTo(at.px, yTop + graphH);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = tokens.bg1;
          ctx.beginPath();
          ctx.arc(at.px, at.py, u(5), 0, Math.PI * 2);
          ctx.fill();
          ctx.lineWidth = u(2);
          ctx.stroke();
          // On plates, so they stay readable over tick numbers and grid.
          drawLabel(ctx, value.toFixed(2), graphX - u(4), at.py, {
            bounds,
            color: accent,
            align: "right",
            font: tokens.fontHudSmall,
            plate: tokens.bg1,
            scale: tokens.scale,
          });
          drawLabel(ctx, `${tt.toFixed(2)} s`, at.px, yTop + graphH - u(3), {
            bounds,
            color: tokens.textBright,
            align: "center",
            baseline: "bottom",
            font: tokens.fontHudSmall,
            plate: tokens.bg1,
            scale: tokens.scale,
          });
        }
      };

      drawGraph("x", graphTop(0), "x(t)  (m)", xAt, tokens.cyan);
      drawGraph("v", graphTop(1), "v(t) = v₀ + a·t  (m/s)", vAt, tokens.mint);
      drawGraph("a", graphTop(2), "a(t) = const  (m/s²)", () => a, tokens.purple);

      // Time axis: numbers under the last graph, unit in the left gutter.
      const tickY = graphTop(2) + titleRow + graphH + tickRow / 2 + u(2);
      for (let i = 0; i <= T_MAX; i++) {
        drawLabel(ctx, String(i), graphX + (i / T_MAX) * graphW, tickY, {
          bounds,
          color: tokens.textLabel,
          align: "center",
          font: tokens.fontHudSmall,
        });
      }
      drawLabel(ctx, "t (s)", graphX - u(12), tickY, {
        bounds,
        color: tokens.textLabel,
        align: "right",
        font: tokens.fontHudSmall,
      });
    },
  });

  const now = playback.time;

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
          <SceneControls playback={playback} scrub scrubKey="scrub" />
          <SceneReadout
            items={[
              {
                label: "x",
                value: `${xAt(now).toFixed(2)} m`,
                color: "var(--color-cyan)",
                guideKey: "x",
              },
              {
                label: "v",
                value: `${vAt(now).toFixed(2)} m/s`,
                color: "var(--color-mint)",
                guideKey: "v",
              },
              {
                label: "a",
                value: `${a.toFixed(2)} m/s²`,
                color: "var(--color-purple)",
                guideKey: "a",
              },
            ]}
          />
        </ScenePanel>
        <SceneControlGroup>
          <SceneSlider
            label={<>x<sub>0</sub></>}
            ariaLabel={t("position")}
            guideKey="position"
            value={x0}
            min={-5}
            max={5}
            step={0.5}
            onChange={setX0}
            display={`${x0.toFixed(1)} m`}
          />
          <SceneSlider
            label={<>v<sub>0</sub></>}
            ariaLabel={t("velocity")}
            guideKey="velocity"
            value={v0}
            min={-4}
            max={4}
            step={0.1}
            onChange={setV0}
            display={`${v0.toFixed(1)} m/s`}
          />
          <SceneSlider
            label="a"
            ariaLabel={t("acceleration")}
            guideKey="acceleration"
            value={a}
            min={-2}
            max={2}
            step={0.1}
            onChange={setA}
            display={`${a.toFixed(1)} m/s²`}
          />
        </SceneControlGroup>
      </div>
    </div>
  );
}
