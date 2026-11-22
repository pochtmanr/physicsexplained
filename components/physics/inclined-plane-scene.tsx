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

const G = 9.80665;
const ANGLE_REF_DEG = 18;
/** Roll time at the reference angle, in seconds. */
const TMAX_REF = 2.75;
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

  const angle = (angleDeg * Math.PI) / 180;
  const tMax = rollTime(angleDeg);

  const playback = useScenePlayback({
    elementRef: containerRef,
    duration: tMax,
    draw: (time) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = syncCanvas(canvas, width, height);
      if (!ctx) return;
      const bounds = { width, height };

      const pad = 28;
      // Headroom above the ramp top for the ball, its glow and the tick labels.
      const headroom = 44;
      const originX = pad + 10;
      const originY = height - pad;
      // The ramp must fit both ways: across the width and under the top edge.
      const rampLen = Math.min(
        (width - originX - pad - 10) / Math.cos(angle),
        (originY - headroom) / Math.sin(angle),
      );
      const endX = originX + rampLen * Math.cos(angle);
      const endY = originY - rampLen * Math.sin(angle);

      // Uniform acceleration from rest: fraction of the ramp covered = (t/tMax)².
      const progress = Math.min(time / tMax, 1);
      const s = progress * progress * rampLen;
      const ballX = endX - s * Math.cos(angle);
      const ballY = endY + s * Math.sin(angle);

      // Ground
      ctx.strokeStyle = tokens.gridHeavy;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad, originY);
      ctx.lineTo(width - pad, originY);
      ctx.stroke();

      // Ramp
      ctx.strokeStyle = tokens.textDim;
      ctx.lineWidth = 2;
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
      ctx.strokeStyle = tokens.axes;
      ctx.beginPath();
      ctx.arc(originX, originY, 26, -angle, 0);
      ctx.stroke();

      // Stroboscopic marks at equal time steps: positions (n/5)² along the
      // ramp, revealed as the ball passes them.
      const nx = -Math.sin(angle); // unit normal, pointing up and away from the ramp
      const ny = -Math.cos(angle);
      const markFractions = [1 / 25, 4 / 25, 9 / 25, 16 / 25, 1];
      const ratios = [1, 3, 5, 7, 9];
      const marksCount = Math.min(5, Math.floor(5 * progress + 1e-9));
      let prevX = endX;
      let prevY = endY;
      for (let i = 0; i < marksCount; i++) {
        const ms = markFractions[i] * rampLen;
        const mx = endX - ms * Math.cos(angle);
        const my = endY + ms * Math.sin(angle);
        ctx.strokeStyle = tokens.axes;
        ctx.beginPath();
        ctx.moveTo(mx, my);
        ctx.lineTo(mx + nx * 10, my + ny * 10);
        ctx.stroke();
        // Interval label, centred on the stretch between two marks.
        drawLabel(ctx, String(ratios[i]), (prevX + mx) / 2 + nx * 22, (prevY + my) / 2 + ny * 22, {
          bounds,
          color: tokens.cyan,
          align: "center",
          font: tokens.fontHudSmall,
        });
        prevX = mx;
        prevY = my;
      }

      // Ball, resting on the ramp surface
      const cx = ballX + nx * BALL_RADIUS;
      const cy = ballY + ny * BALL_RADIUS;
      if (playback.status === "playing") {
        ctx.shadowColor = hexToRgba(tokens.cyan, 0.6);
        ctx.shadowBlur = 14;
      }
      ctx.fillStyle = tokens.cyan;
      ctx.beginPath();
      ctx.arc(cx, cy, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Caption, top-left: the one corner the ramp never reaches.
      drawLabel(ctx, t("intervals"), pad, 18, {
        bounds,
        color: tokens.textMute,
        direction: "inherit",
      });
    },
  });

  // Keep the ball at the same place on the ramp while the angle is dragged.
  const changeAngle = (next: number) => {
    playback.seek((playback.getTime() / tMax) * rollTime(next));
    setAngleDeg(next);
  };

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
        <SceneControls playback={playback} />
        <SceneReadout
          items={[
            { label: "θ", value: `${angleDeg}°` },
            {
              label: t("acceleration"),
              value: `${(G * Math.sin(angle)).toFixed(2)} m/s²`,
              color: "var(--color-cyan)",
            },
            { label: t("rollTime"), value: `${tMax.toFixed(2)} s` },
          ]}
        />
        <SceneControlGroup>
          <SceneSlider
            label={t("angle")}
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
