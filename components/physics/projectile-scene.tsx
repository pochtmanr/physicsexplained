"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  G_EARTH,
  peakHeight,
  position,
  range,
  timeOfFlight,
  trajectory,
  velocity,
} from "@/lib/physics/projectile";
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
  formatTick,
  hexToRgba,
  niceTicks,
  syncCanvas,
  type ScenePlayback,
  useSceneHover,
  useScenePlayback,
  useSceneSize,
  useSceneTokens,
} from "@/components/physics/_shared";

/** Inline height cap; the ball and arrows grow with the canvas beyond it. */
const MAX_HEIGHT = 460;
/** Shortest run, so a launch at 0° still has a clock. */
const MIN_DURATION = 0.1;

/** Guide keys that are about the trajectory as a whole. */
const PATH_KEYS = ["range", "peak", "flightTime"];

/**
 * FIG.02b — a projectile launched at angle θ and speed v, with its velocity
 * split into the constant horizontal part and the changing vertical part.
 */
export function ProjectileScene() {
  const t = useTranslations("scenes.projectile");
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.62,
    maxHeight: MAX_HEIGHT,
    minHeight: 220,
    initialWidth: 640,
    // A graph of height against distance: it reads well at any shape.
    fullView: "fill",
  });
  const [angleDeg, setAngleDeg] = useState(45);
  const [speed, setSpeed] = useState(18);
  const playbackRef = useRef<ScenePlayback | null>(null);

  const angle = (angleDeg * Math.PI) / 180;
  const tFlight = timeOfFlight(speed, angle);
  const R = range(speed, angle);
  const H = peakHeight(speed, angle);
  const duration = Math.max(tFlight, MIN_DURATION);

  // Every pixel size goes through `u`; the ball and its arrows through `o`,
  // so they do not shrink to specks on a tall canvas.
  const scale = tokens.scale;
  const u = (n: number) => n * scale;
  const objectScale = Math.min(2.6, Math.max(scale, height / MAX_HEIGHT));
  const o = (n: number) => n * objectScale;

  // Layout: the plot fills the canvas, with a left gutter for the y numbers
  // and a bottom row for the x numbers.
  const padL = u(40);
  const padR = u(18);
  const padT = u(18);
  const padB = u(36);
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;
  // World bounds: pad around R and H so the arc is visible.
  const worldXMax = Math.max(R * 1.05, 4);
  const worldYMax = Math.max(H * 1.25, 2);
  const toPx = (x: number, y: number) => ({
    px: padL + (x / worldXMax) * plotW,
    py: padT + plotH - (y / worldYMax) * plotH,
  });
  const origin = toPx(0, 0);
  const launchLen = Math.min(0.18 * plotH, o(70));
  const vLen = Math.min(0.14 * plotH, o(60));
  const ballRadius = o(6);

  /** Ball and arrow tips at scene time `time`. */
  const stateAt = (time: number) => {
    const tSim = Math.min(time, tFlight);
    const pos = position(tSim, speed, angle);
    const vel = velocity(tSim, speed, angle);
    const ball = toPx(pos.x, pos.y);
    const vMax = Math.max(speed, 0.1);
    return {
      tSim,
      vel,
      ball,
      vxEnd: { px: ball.px + (vel.x / vMax) * vLen, py: ball.py },
      // vy positive = up on screen = −py
      vyEnd: { px: ball.px, py: ball.py - (vel.y / vMax) * vLen },
    };
  };
  const launchTip = {
    px: origin.px + launchLen * Math.cos(angle),
    py: origin.py - launchLen * Math.sin(angle),
  };
  const apex = toPx(R / 2, H);
  const landing = toPx(R, 0);

  // What lies under the pointer, most specific first.
  const hover = useSceneHover(canvasRef, (px, py) => {
    const s = stateAt(playbackRef.current?.getTime() ?? 0);
    const reach = u(9);
    if (distToSegment(px, py, s.ball.px, s.ball.py, s.vxEnd.px, s.vxEnd.py) <= reach && px > s.ball.px + ballRadius) return "vx";
    if (distToSegment(px, py, s.ball.px, s.ball.py, s.vyEnd.px, s.vyEnd.py) <= reach && Math.abs(py - s.ball.py) > ballRadius) return "vy";
    if (Math.hypot(px - apex.px, py - apex.py) <= u(14)) return "peak";
    if (Math.hypot(px - landing.px, py - landing.py) <= u(14)) return "range";
    if (distToSegment(px, py, origin.px, origin.py, launchTip.px, launchTip.py) <= reach) return "speed";
    if (Math.hypot(px - origin.px, py - origin.py) <= u(34)) return "angle";
    return null;
  });
  const { activeKey } = hover;
  const pathFocused = activeKey !== null && PATH_KEYS.includes(activeKey);

  const playback = useScenePlayback({
    elementRef: containerRef,
    duration,
    draw: (time) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = syncCanvas(canvas, width, height);
      if (!ctx) return;
      const bounds = { width, height };
      const s = stateAt(time);

      // Grid at round distances and heights (faint, dashed).
      const { ticks: xTicks, step: xStep } = niceTicks(0, worldXMax, plotW > u(360) ? 5 : 3);
      const { ticks: yTicks, step: yStep } = niceTicks(0, worldYMax, plotH > u(200) ? 4 : 3);
      ctx.strokeStyle = tokens.gridHeavy;
      ctx.lineWidth = 1;
      ctx.setLineDash([u(2), u(4)]);
      ctx.beginPath();
      for (const tick of xTicks) {
        if (tick === 0) continue;
        const gx = toPx(tick, 0).px;
        ctx.moveTo(gx, padT);
        ctx.lineTo(gx, padT + plotH);
      }
      for (const tick of yTicks) {
        if (tick === 0) continue;
        const gy = toPx(0, tick).py;
        ctx.moveTo(padL, gy);
        ctx.lineTo(padL + plotW, gy);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Axes
      ctx.strokeStyle = tokens.axes;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padL, padT);
      ctx.lineTo(padL, padT + plotH);
      ctx.lineTo(padL + plotW, padT + plotH);
      ctx.stroke();

      // Trajectory path: heavier while range, peak or flight time is pointed at.
      const path = trajectory(speed, angle, 80);
      ctx.strokeStyle = pathFocused ? tokens.textBright : tokens.textDim;
      ctx.lineWidth = u(pathFocused ? 2.5 : 1.5);
      ctx.beginPath();
      for (let i = 0; i < path.length; i++) {
        const { px, py } = toPx(path[i].x, path[i].y);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Peak: a dashed line from the apex to the height axis, with its value.
      if (activeKey === "peak" && H > 0) {
        ctx.strokeStyle = tokens.cyan;
        ctx.lineWidth = u(1.5);
        ctx.setLineDash([u(4), u(3)]);
        ctx.beginPath();
        ctx.moveTo(padL, apex.py);
        ctx.lineTo(apex.px, apex.py);
        ctx.lineTo(apex.px, origin.py);
        ctx.stroke();
        ctx.setLineDash([]);
        drawLabel(ctx, `H = ${H.toFixed(2)} m`, apex.px, apex.py - u(12), {
          bounds, color: tokens.cyan, align: "center", font: tokens.fontLabel, plate: tokens.bg1, scale,
        });
      }
      // Range: the stretch of ground from launch to landing.
      if (activeKey === "range" && R > 0) {
        ctx.strokeStyle = tokens.cyan;
        ctx.lineWidth = u(2);
        ctx.beginPath();
        ctx.moveTo(origin.px, origin.py - u(6));
        ctx.lineTo(origin.px, origin.py + u(6));
        ctx.moveTo(origin.px, origin.py);
        ctx.lineTo(landing.px, landing.py);
        ctx.moveTo(landing.px, landing.py - u(6));
        ctx.lineTo(landing.px, landing.py + u(6));
        ctx.stroke();
        drawLabel(ctx, `R = ${R.toFixed(2)} m`, (origin.px + landing.px) / 2, origin.py - u(12), {
          bounds, color: tokens.cyan, align: "center", font: tokens.fontLabel, plate: tokens.bg1, scale,
        });
      }

      // Launch vector (angle and speed) at the origin.
      const launchFocused = activeKey === "speed" || activeKey === "angle";
      drawVector(ctx, origin.px, origin.py, launchTip.px, launchTip.py, tokens.cyan, u(launchFocused ? 3 : 2), objectScale);
      if (activeKey === "angle") {
        ctx.strokeStyle = tokens.cyan;
        ctx.lineWidth = u(2);
        ctx.beginPath();
        ctx.arc(origin.px, origin.py, u(26), -angle, 0);
        ctx.stroke();
        drawLabel(
          ctx,
          `θ = ${angleDeg}°`,
          origin.px + u(36) * Math.cos(angle / 2),
          origin.py - u(36) * Math.sin(angle / 2),
          { bounds, color: tokens.cyan, font: tokens.fontLabel, plate: tokens.bg1, scale },
        );
      }

      // Velocity components at the ball. While one is pointed at, it is
      // drawn heavier and the other steps back.
      const comp = (key: "vx" | "vy", end: { px: number; py: number }, color: string) => {
        const focused = activeKey === key;
        const other = activeKey === "vx" || activeKey === "vy";
        ctx.globalAlpha = other && !focused ? 0.35 : 1;
        drawVector(ctx, s.ball.px, s.ball.py, end.px, end.py, color, u(focused ? 3 : 1.5), objectScale);
        ctx.globalAlpha = 1;
      };
      comp("vx", s.vxEnd, tokens.mint);
      comp("vy", s.vyEnd, tokens.purple);

      // Ball: glows only while it is moving.
      if (playback.status === "playing") {
        ctx.shadowColor = hexToRgba(tokens.cyan, 0.5);
        ctx.shadowBlur = o(10);
      }
      ctx.fillStyle = tokens.cyan;
      ctx.beginPath();
      ctx.arc(s.ball.px, s.ball.py, ballRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      if (activeKey === "flightTime") {
        drawFocusRing(ctx, s.ball.px, s.ball.py, ballRadius + u(6), tokens.cyan, scale);
      }

      // Axis numbers and units, after the curves.
      const tickY = padT + plotH + u(18);
      for (const tick of xTicks) {
        drawLabel(ctx, formatTick(tick, xStep), toPx(tick, 0).px, tickY, {
          bounds, color: tokens.textLabel, align: "center", font: tokens.fontHudSmall,
        });
      }
      for (const tick of yTicks) {
        if (tick === 0) continue;
        drawLabel(ctx, formatTick(tick, yStep), padL - u(6), toPx(0, tick).py, {
          bounds, color: tokens.textLabel, align: "right", font: tokens.fontHudSmall,
        });
      }
      drawLabel(ctx, "y (m)", padL + u(6), padT + u(4), {
        bounds, color: tokens.textLabel, font: tokens.fontHudSmall, plate: tokens.bg1, scale,
      });
      drawLabel(ctx, "x (m)", padL + plotW, tickY + u(14), {
        bounds, color: tokens.textLabel, align: "right", font: tokens.fontHudSmall,
      });

      // Measurement guidelines: while the pointer is over the plot, read the
      // arc at that distance off both axes.
      const p = hover.pointer;
      if (p && p.x >= padL && p.x <= padL + plotW && p.y >= padT && p.y <= padT + plotH && R > 0) {
        const x = Math.min(R, Math.max(0, ((p.x - padL) / plotW) * worldXMax));
        const y = x * Math.tan(angle) - (G_EARTH / (2 * speed * speed * Math.cos(angle) ** 2)) * x * x;
        const at = toPx(x, Math.max(0, y));
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
        ctx.arc(at.px, at.py, u(5), 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = u(2);
        ctx.stroke();
        drawLabel(ctx, Math.max(0, y).toFixed(2), padL - u(4), at.py, {
          bounds, color: tokens.textBright, align: "right", font: tokens.fontHudSmall, plate: tokens.bg1, scale,
        });
        drawLabel(ctx, `${x.toFixed(2)} m`, at.px, padT + plotH - u(3), {
          bounds, color: tokens.textBright, align: "center", baseline: "bottom", font: tokens.fontHudSmall, plate: tokens.bg1, scale,
        });
      }
    },
  });
  // The hit test above runs between renders and needs the live clock.
  playbackRef.current = playback;

  // A new launch keeps the ball at the same fraction of its flight.
  const relaunch = (nextAngleDeg: number, nextSpeed: number) => {
    const next = Math.max(timeOfFlight(nextSpeed, (nextAngleDeg * Math.PI) / 180), MIN_DURATION);
    playback.seek((playback.getTime() / duration) * next);
  };
  const changeAngle = (next: number) => {
    relaunch(next, speed);
    setAngleDeg(next);
  };
  const changeSpeed = (next: number) => {
    relaunch(angleDeg, next);
    setSpeed(next);
  };

  const vel = velocity(Math.min(playback.time, tFlight), speed, angle);

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
          <SceneControls
            playback={playback}
            note={`g = ${G_EARTH.toFixed(2)} m/s²`}
            noteKey="g"
          />
          <SceneReadout
            items={[
              {
                label: <>v<sub>x</sub> = v·cos θ</>,
                value: `${vel.x.toFixed(2)} m/s`,
                color: "var(--color-mint)",
                guideKey: "vx",
              },
              {
                label: <>v<sub>y</sub> = v·sin θ − g·t</>,
                value: `${vel.y.toFixed(2)} m/s`,
                color: "var(--color-purple)",
                guideKey: "vy",
              },
              { label: t("range"), value: `${R.toFixed(2)} m`, guideKey: "range" },
              { label: t("peak"), value: `${H.toFixed(2)} m`, guideKey: "peak" },
              { label: t("flightTime"), value: `${tFlight.toFixed(2)} s`, guideKey: "flightTime" },
            ]}
          />
        </ScenePanel>
        <SceneControlGroup>
          <SceneSlider
            label={t("angle")}
            guideKey="angle"
            value={angleDeg}
            min={0}
            max={90}
            step={1}
            onChange={changeAngle}
            display={`${angleDeg}°`}
          />
          <SceneSlider
            label={t("speed")}
            guideKey="speed"
            value={speed}
            min={5}
            max={30}
            step={0.1}
            onChange={changeSpeed}
            display={`${speed.toFixed(1)} m/s`}
          />
        </SceneControlGroup>
      </div>
    </div>
  );
}

function distToSegment(
  px: number,
  py: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): number {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len2 = dx * dx + dy * dy;
  const k = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - x0) * dx + (py - y0) * dy) / len2));
  return Math.hypot(px - (x0 + k * dx), py - (y0 + k * dy));
}

function drawVector(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  lineWidth: number,
  scale: number,
) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  if (len < 0.5) return;
  const ux = dx / len;
  const uy = dy / len;
  const head = Math.min(9 * scale, Math.max(4 * scale, len * 0.25));

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1 - ux * head, y1 - uy * head);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - ux * head - uy * head * 0.55, y1 - uy * head + ux * head * 0.55);
  ctx.lineTo(x1 - ux * head + uy * head * 0.55, y1 - uy * head - ux * head * 0.55);
  ctx.closePath();
  ctx.fill();
}
