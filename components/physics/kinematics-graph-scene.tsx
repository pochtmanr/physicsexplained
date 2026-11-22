"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  SCENE_CANVAS_CLASS,
  SceneControlGroup,
  SceneControls,
  SceneReadout,
  SceneSlider,
  drawLabel,
  hexToRgba,
  syncCanvas,
  useScenePlayback,
  useSceneSize,
  useSceneTokens,
} from "@/components/physics/_shared";

/** Length of the sweep, in seconds. */
const T_MAX = 5;

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

  const playback = useScenePlayback({
    elementRef: containerRef,
    duration: T_MAX,
    draw: (tCursor) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = syncCanvas(canvas, width, height);
      if (!ctx) return;
      const bounds = { width, height };

      // Vertical layout, top to bottom: track strip, three graphs, tick row.
      const graphX = 52; // left gutter for the y-axis numbers
      const graphW = width - graphX - 18;
      const trackY = 26;
      const graphsTop = 62;
      const gap = 10;
      const tickRow = 22;
      const graphH = (height - graphsTop - gap * 2 - tickRow) / 3;

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

      // x = 0 marker
      ctx.strokeStyle = tokens.axes;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(toTrackPx(0), trackY - 10);
      ctx.lineTo(toTrackPx(0), trackY + 10);
      ctx.stroke();
      ctx.setLineDash([]);
      drawLabel(ctx, "0", toTrackPx(0), trackY + 19, {
        bounds,
        color: tokens.textMute,
        align: "center",
        font: tokens.fontHudSmall,
      });

      // Ball
      ctx.shadowColor = hexToRgba(tokens.cyan, 0.55);
      ctx.shadowBlur = 12;
      ctx.fillStyle = tokens.cyan;
      ctx.beginPath();
      ctx.arc(toTrackPx(xAt(tCursor)), trackY, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // ---- Three stacked graphs ----
      const drawGraph = (
        yTop: number,
        label: string,
        f: (tt: number) => number,
        accent: string,
      ) => {
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
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.moveTo(graphX, zeroY);
        ctx.lineTo(graphX + graphW, zeroY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Curve
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i <= 100; i++) {
          const tt = (i / 100) * T_MAX;
          const { px, py } = toPx(tt, f(tt));
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();

        // Cursor line and dot
        const cursorX = graphX + (tCursor / T_MAX) * graphW;
        ctx.strokeStyle = tokens.axes;
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.moveTo(cursorX, yTop);
        ctx.lineTo(cursorX, yTop + graphH);
        ctx.stroke();
        ctx.setLineDash([]);
        const pt = toPx(tCursor, f(tCursor));
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.arc(pt.px, pt.py, 4, 0, Math.PI * 2);
        ctx.fill();

        // Text goes on last, on a plate, so the curve cannot run through it.
        drawLabel(ctx, label, graphX + 6, yTop + 4, {
          bounds,
          color: tokens.textDim,
          baseline: "top",
          plate: hexToRgba(tokens.bg1, 0.85),
        });
        drawLabel(ctx, yHi.toFixed(1), graphX - 5, yTop, {
          bounds,
          color: tokens.textMute,
          align: "right",
          baseline: "top",
          font: tokens.fontHudSmall,
        });
        drawLabel(ctx, yLo.toFixed(1), graphX - 5, yTop + graphH, {
          bounds,
          color: tokens.textMute,
          align: "right",
          baseline: "bottom",
          font: tokens.fontHudSmall,
        });
      };

      const g1Top = graphsTop;
      const g2Top = g1Top + graphH + gap;
      const g3Top = g2Top + graphH + gap;
      drawGraph(g1Top, "x(t)", xAt, tokens.cyan);
      drawGraph(g2Top, "v(t) = v₀ + a·t", vAt, tokens.mint);
      drawGraph(g3Top, "a(t) = const", () => a, tokens.purple);

      // Time axis: numbers under the last graph, unit in the left gutter.
      const tickY = g3Top + graphH + tickRow / 2 + 2;
      for (let i = 0; i <= T_MAX; i++) {
        drawLabel(ctx, String(i), graphX + (i / T_MAX) * graphW, tickY, {
          bounds,
          color: tokens.textMute,
          align: "center",
          font: tokens.fontHudSmall,
        });
      }
      drawLabel(ctx, "t (s)", graphX - 12, tickY, {
        bounds,
        color: tokens.textMute,
        align: "right",
        font: tokens.fontHudSmall,
      });
    },
  });

  const now = playback.time;

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
        <SceneControls playback={playback} scrub />
        <SceneReadout
          items={[
            { label: "x", value: `${xAt(now).toFixed(2)} m`, color: "var(--color-cyan)" },
            { label: "v", value: `${vAt(now).toFixed(2)} m/s`, color: "var(--color-mint)" },
            { label: "a", value: `${a.toFixed(2)} m/s²`, color: "var(--color-purple)" },
          ]}
        />
        <SceneControlGroup>
          <SceneSlider
            label={<>x<sub>0</sub></>}
            ariaLabel={t("position")}
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
