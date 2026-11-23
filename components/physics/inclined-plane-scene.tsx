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
  drawFocusRing,
  drawLabel,
  hexToRgba,
  syncCanvas,
  type ScenePlayback,
  useSceneHover,
  useScenePlayback,
  useSceneSize,
  useSceneTokens,
} from "@/components/physics/_shared";

const G = 9.80665;
const ANGLE_REF_DEG = 18;
/** Roll time at the reference angle, in seconds. */
const TMAX_REF = 2.75;
/** Ball radius at scale 1. */
const BALL_RADIUS = 9;

/**
 * Roll time scales with 1/√(sin θ), matching a = g·sin θ on a ramp of fixed
 * length; at the reference angle it equals TMAX_REF.
 */
function rollTime(angleDeg: number): number {
  const ref = Math.sin((ANGLE_REF_DEG * Math.PI) / 180);
  return TMAX_REF * Math.sqrt(ref / Math.sin((angleDeg * Math.PI) / 180));
}

export function InclinedPlaneScene() {
  const t = useTranslations("scenes.inclinedPlane");
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.55,
    maxHeight: 360,
    minHeight: 240,
    initialWidth: 640,
    // The ramp is sized from both width and height, so any shape works; on a
    // phone this lets the full view use the screen's height.
    fullView: "fill",
  });
  const [angleDeg, setAngleDeg] = useState(18);
  const playbackRef = useRef<ScenePlayback | null>(null);

  const angle = (angleDeg * Math.PI) / 180;
  const tMax = rollTime(angleDeg);

  // Every pixel size goes through `u`, so text and objects grow together in
  // full view on a large screen (docs/figure-full-view.md).
  const scale = tokens.scale;
  const u = (n: number) => n * scale;
  const ballRadius = u(BALL_RADIUS);

  const pad = u(28);
  // Headroom above the ramp top for the ball, its glow and the tick labels.
  const headroom = u(44);
  const originX = pad + u(10);
  const originY = height - pad;
  // The ramp must fit both ways: across the width and under the top edge.
  const rampLen = Math.min(
    (width - originX - pad - u(10)) / Math.cos(angle),
    (originY - headroom) / Math.sin(angle),
  );
  const endX = originX + rampLen * Math.cos(angle);
  const endY = originY - rampLen * Math.sin(angle);
  const nx = -Math.sin(angle); // unit normal, pointing up and away from the ramp
  const ny = -Math.cos(angle);
  /** Ball centre at scene time `time`: uniform acceleration from rest. */
  const ballAt = (time: number) => {
    const progress = Math.min(time / tMax, 1);
    const s = progress * progress * rampLen;
    return {
      progress,
      x: endX - s * Math.cos(angle) + nx * ballRadius,
      y: endY + s * Math.sin(angle) + ny * ballRadius,
    };
  };

  // What lies under the pointer: the ball (its acceleration), the angle at
  // the foot of the ramp, or the strip above the ramp where the marks are.
  const hover = useSceneHover(canvasRef, (px, py) => {
    const ball = ballAt(playbackRef.current?.getTime() ?? 0);
    if (Math.hypot(px - ball.x, py - ball.y) <= ballRadius + u(10)) return "acceleration";
    if (Math.hypot(px - originX, py - originY) <= u(44)) return "angle";
    // Distance along and above the ramp, measured from its top.
    const along = (endX - px) * Math.cos(angle) + (py - endY) * Math.sin(angle);
    const above = (px - endX) * nx + (py - endY) * ny;
    if (along >= 0 && along <= rampLen && above >= -u(6) && above <= u(36)) return "marks";
    return null;
  });
  const { activeKey } = hover;

  const playback = useScenePlayback({
    elementRef: containerRef,
    duration: tMax,
    draw: (time) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = syncCanvas(canvas, width, height);
      if (!ctx) return;
      const bounds = { width, height };

      // Uniform acceleration from rest: fraction of the ramp covered = (t/tMax)².
      const ball = ballAt(time);
      const { progress } = ball;

      // Ground
      ctx.strokeStyle = tokens.gridHeavy;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad, originY);
      ctx.lineTo(width - pad, originY);
      ctx.stroke();

      // Ramp
      ctx.strokeStyle = tokens.textDim;
      ctx.lineWidth = u(2);
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Vertical drop under the ramp top
      ctx.strokeStyle = tokens.gridHeavy;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(endX, originY);
      ctx.stroke();

      // Angle arc at the foot of the ramp
      const angleFocused = activeKey === "angle";
      ctx.strokeStyle = angleFocused ? tokens.cyan : tokens.axes;
      ctx.lineWidth = angleFocused ? u(2) : 1;
      ctx.beginPath();
      ctx.arc(originX, originY, u(26), -angle, 0);
      ctx.stroke();
      ctx.lineWidth = 1;
      // The angle, named beside its arc while it is pointed at.
      if (angleFocused) {
        drawLabel(
          ctx,
          `θ = ${angleDeg}°`,
          originX + u(34) * Math.cos(angle / 2),
          originY - u(34) * Math.sin(angle / 2),
          { bounds, color: tokens.cyan, font: tokens.fontLabel, plate: tokens.bg1, scale },
        );
      }

      // Stroboscopic marks at equal time steps: positions (n/5)² along the
      // ramp, revealed as the ball passes them.
      const marksFocused = activeKey === "marks";
      const markFractions = [1 / 25, 4 / 25, 9 / 25, 16 / 25, 1];
      const ratios = [1, 3, 5, 7, 9];
      const marksCount = Math.min(5, Math.floor(5 * progress + 1e-9));
      let prevX = endX;
      let prevY = endY;
      for (let i = 0; i < marksCount; i++) {
        const ms = markFractions[i] * rampLen;
        const mx = endX - ms * Math.cos(angle);
        const my = endY + ms * Math.sin(angle);
        ctx.strokeStyle = marksFocused ? tokens.cyan : tokens.axes;
        ctx.lineWidth = marksFocused ? u(2) : 1;
        ctx.beginPath();
        ctx.moveTo(mx, my);
        ctx.lineTo(mx + nx * u(10), my + ny * u(10));
        ctx.stroke();
        ctx.lineWidth = 1;
        // Interval label, centred on the stretch between two marks.
        drawLabel(
          ctx,
          String(ratios[i]),
          (prevX + mx) / 2 + nx * u(22),
          (prevY + my) / 2 + ny * u(22),
          {
            bounds,
            color: tokens.cyan,
            align: "center",
            font: marksFocused ? tokens.fontHudLarge : tokens.fontHudSmall,
          },
        );
        prevX = mx;
        prevY = my;
      }

      // Ball, resting on the ramp surface
      if (playback.status === "playing") {
        ctx.shadowColor = hexToRgba(tokens.cyan, 0.6);
        ctx.shadowBlur = u(14);
      }
      ctx.fillStyle = tokens.cyan;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      if (activeKey === "acceleration") {
        drawFocusRing(ctx, ball.x, ball.y, ballRadius + u(7), tokens.cyan, scale);
      }

      // Caption, top-left: the one corner the ramp never reaches.
      drawLabel(ctx, t("intervals"), pad, u(18), {
        bounds,
        color: marksFocused ? tokens.textBright : tokens.textMute,
        direction: "inherit",
        font: tokens.fontLabel,
      });
    },
  });
  // The hit test above runs between renders and needs the live clock.
  playbackRef.current = playback;

  // Keep the ball at the same place on the ramp while the angle is dragged.
  const changeAngle = (next: number) => {
    playback.seek((playback.getTime() / tMax) * rollTime(next));
    setAngleDeg(next);
  };

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
          <SceneControls playback={playback} />
          <SceneReadout
            items={[
              { label: "θ", value: `${angleDeg}°`, guideKey: "angle" },
              {
                label: t("acceleration"),
                value: `${(G * Math.sin(angle)).toFixed(2)} m/s²`,
                color: "var(--color-cyan)",
                guideKey: "acceleration",
              },
              { label: t("rollTime"), value: `${tMax.toFixed(2)} s`, guideKey: "rollTime" },
            ]}
          />
        </ScenePanel>
        <SceneControlGroup>
          <SceneSlider
            label={t("angle")}
            guideKey="angle"
            value={angleDeg}
            min={5}
            max={45}
            step={1}
            onChange={changeAngle}
            display={`${angleDeg}°`}
          />
        </SceneControlGroup>
      </div>
    </div>
  );
}
