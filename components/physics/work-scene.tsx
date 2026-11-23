"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import {
  SCENE_CANVAS_CLASS,
  SceneControls,
  ScenePanel,
  SceneReadout,
  SceneStage,
  drawLabel,
  syncCanvas,
  type ScenePlayback,
  useSceneHover,
  useScenePlayback,
  useSceneSize,
  useSceneTokens,
} from "@/components/physics/_shared";
import { constantWork } from "@/lib/physics/energy";

const RATIO = 0.5;
/** Inline height cap; the crate and its arrow grow past it in full view. */
const MAX_HEIGHT = 320;
/** Inline width at which the canvas reaches MAX_HEIGHT. */
const BASE_WIDTH = MAX_HEIGHT / RATIO;
/** Length of one push, in seconds. */
const DURATION = 5;
/** The constant push, in newtons. */
const FORCE = 20;
/** How far the crate is pushed in one run, in metres. */
const DISTANCE = 5;

/**
 * FIG.05a — a crate pushed along a rough surface at constant velocity. The
 * applied force F is drawn on the crate; the displacement d accumulates as
 * it moves, and W = F · d is shown as a bar that fills at the bottom.
 *
 * Everything is a function of time (the crate covers DISTANCE in DURATION
 * at a steady speed), so the scene can be scrubbed.
 */
export function WorkScene() {
  const t = useTranslations("scenes.work");
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: RATIO,
    maxHeight: MAX_HEIGHT,
    minHeight: 140,
    initialWidth: 640,
    // The floor stretches to any width and the crate grows with the canvas.
    fullView: "fill",
  });
  const playbackRef = useRef<ScenePlayback | null>(null);

  // Text, offsets and hairlines use `u`; the crate and its arrow use `o`,
  // which also follows the canvas size (1 inline).
  const scale = tokens.scale;
  const u = (n: number) => n * scale;
  const objectScale = Math.min(
    2.6,
    Math.max(scale, Math.min(height / MAX_HEIGHT, width / BASE_WIDTH)),
  );
  const o = (n: number) => n * objectScale;

  const margin = u(40);
  const groundY = height * 0.62;
  const crateW = o(60);
  const crateH = o(44);
  const crateY = groundY - crateH;
  const fLen = o(60);
  const fy = crateY + crateH / 2;
  // The force arrow trails the crate, so the run starts far enough in for
  // its tail to stay on the canvas.
  const startX = Math.max(margin + u(8), fLen + u(12));
  const travel = Math.max(0, width - margin - u(12) - startX - crateW);
  const dLineY = groundY + u(18);
  const barX = margin;
  const barW = width - margin * 2;
  const barH = u(14);
  const barY = height - u(28);

  /** Fraction of the push done at scene time `time`. */
  const progressAt = (time: number) => Math.min(1, Math.max(0, time / DURATION));
  const crateXAt = (time: number) => startX + progressAt(time) * travel;

  // The force arrow, the crate or its track (displacement), or the work bar.
  const hover = useSceneHover(canvasRef, (px, py) => {
    const crateX = crateXAt(playbackRef.current?.getTime() ?? 0);
    const reach = u(9);
    if (px >= crateX - fLen - reach && px <= crateX && Math.abs(py - fy) <= reach) return "force";
    if (px >= crateX && px <= crateX + crateW && py >= crateY && py <= groundY) return "displacement";
    if (
      px >= startX + crateW / 2 - u(20) &&
      px <= crateX + crateW / 2 + reach &&
      Math.abs(py - dLineY) <= reach
    ) {
      return "displacement";
    }
    if (px >= barX - reach && px <= barX + barW + reach && py >= barY - u(20) && py <= barY + barH + reach) {
      return "work";
    }
    return null;
  });
  const { activeKey } = hover;

  const playback = useScenePlayback({
    elementRef: containerRef,
    duration: DURATION,
    draw: (time) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = syncCanvas(canvas, width, height);
      if (!ctx) return;
      const bounds = { width, height };
      const p = progressAt(time);
      const crateX = crateXAt(time);
      const d = p * DISTANCE;

      // Surface line, hatched underneath.
      ctx.strokeStyle = tokens.textFaint;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(margin, groundY);
      ctx.lineTo(width - margin, groundY);
      ctx.stroke();
      ctx.beginPath();
      for (let x = margin; x < width - margin; x += u(12)) {
        ctx.moveTo(x, groundY);
        ctx.lineTo(x - u(6), groundY + u(8));
      }
      ctx.stroke();

      // Crate with its cross-brace.
      ctx.fillStyle = tokens.bg1;
      ctx.fillRect(crateX, crateY, crateW, crateH);
      ctx.strokeStyle = tokens.textDim;
      ctx.lineWidth = o(1.5);
      ctx.strokeRect(crateX, crateY, crateW, crateH);
      ctx.beginPath();
      ctx.moveTo(crateX, crateY);
      ctx.lineTo(crateX + crateW, crateY + crateH);
      ctx.moveTo(crateX + crateW, crateY);
      ctx.lineTo(crateX, crateY + crateH);
      ctx.strokeStyle = tokens.textFaint;
      ctx.stroke();

      // Force vector F on the back of the crate.
      const forceFocused = activeKey === "force";
      ctx.strokeStyle = tokens.magenta;
      ctx.fillStyle = tokens.magenta;
      ctx.lineWidth = o(forceFocused ? 3 : 2);
      ctx.beginPath();
      ctx.moveTo(crateX - fLen, fy);
      ctx.lineTo(crateX - o(4), fy);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(crateX - o(4), fy);
      ctx.lineTo(crateX - o(12), fy - o(5));
      ctx.lineTo(crateX - o(12), fy + o(5));
      ctx.closePath();
      ctx.fill();
      drawLabel(ctx, forceFocused ? `F = ${FORCE} N` : "F", crateX - fLen / 2, fy - o(5) - u(8), {
        bounds,
        color: tokens.magenta,
        align: "center",
        baseline: "bottom",
        font: tokens.fontHud,
        plate: forceFocused ? tokens.bg1 : undefined,
        scale,
      });

      // Displacement d, from where the crate started to where it is.
      const dFocused = activeKey === "displacement";
      const dStart = startX + crateW / 2;
      ctx.strokeStyle = dFocused ? tokens.cyan : tokens.textMute;
      ctx.lineWidth = dFocused ? u(2) : 1;
      ctx.setLineDash([u(3), u(4)]);
      ctx.beginPath();
      ctx.moveTo(dStart, dLineY);
      ctx.lineTo(crateX + crateW / 2, dLineY);
      ctx.stroke();
      ctx.setLineDash([]);
      drawLabel(ctx, dFocused ? `d = ${d.toFixed(2)} m` : "d", dStart - u(6), dLineY, {
        bounds,
        color: dFocused ? tokens.cyan : tokens.textLabel,
        align: "right",
        font: tokens.fontHud,
        plate: dFocused ? tokens.bg1 : undefined,
        scale,
      });

      // Work bar: W = F · d grows with the distance covered.
      const workFocused = activeKey === "work";
      ctx.fillStyle = tokens.magenta;
      ctx.fillRect(barX, barY, barW * p, barH);
      ctx.strokeStyle = workFocused ? tokens.textBright : tokens.textFaint;
      ctx.lineWidth = workFocused ? u(2) : 1;
      ctx.strokeRect(barX, barY, barW, barH);
      drawLabel(
        ctx,
        workFocused ? `W = F · d = ${constantWork(FORCE, d).toFixed(1)} J` : "W = F · d",
        barX,
        barY - u(6),
        {
          bounds,
          color: workFocused ? tokens.textBright : tokens.textLabel,
          baseline: "bottom",
          font: tokens.fontHud,
          plate: workFocused ? tokens.bg1 : undefined,
          scale,
        },
      );
    },
  });
  // The hit test above runs between renders and needs the live clock.
  playbackRef.current = playback;

  const d = progressAt(playback.time) * DISTANCE;

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
                label: "F",
                value: `${FORCE.toFixed(1)} N`,
                color: "var(--color-magenta)",
                guideKey: "force",
              },
              { label: "d", value: `${d.toFixed(2)} m`, guideKey: "displacement" },
              {
                label: "W = F·d",
                value: `${constantWork(FORCE, d).toFixed(1)} J`,
                color: "var(--color-magenta)",
                guideKey: "work",
              },
            ]}
          />
        </ScenePanel>
      </div>
    </div>
  );
}
