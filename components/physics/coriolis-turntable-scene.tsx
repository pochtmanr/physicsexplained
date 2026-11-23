"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import {
  SCENE_CANVAS_CLASS,
  SceneControls,
  ScenePanel,
  SceneReadout,
  SceneStage,
  drawArrow,
  drawFocusRing,
  drawLabel,
  hexToRgba,
  syncCanvas,
  useSceneHover,
  useScenePlayback,
  useSceneSize,
  useSceneTokens,
  type ScenePlayback,
} from "@/components/physics/_shared";
import { coriolisAccel2D } from "@/lib/physics/rotating-frame";

/** Side of the square drawing at full inline size, in px. */
const BASE_SIZE = 380;
/** Turntable radius at full inline size, in px. */
const TURNTABLE_R = 160;
/** Pixels per metre at full inline size. */
const PX_PER_M = 100;
/** Turntable spin rate (rad/s). */
const OMEGA = 1.4;
/** Outward launch speed in the lab frame (m/s). */
const V0 = 0.8;
/** One flight (s). */
const FLIGHT_TIME = 3.2;
/** Trail samples per second of flight. */
const TRAIL_SAMPLES_PER_S = 90;

type Vec = { x: number; y: number };

/**
 * The ball in the turntable's own frame at time `t`. With no real force it
 * moves in a straight line in the lab, so in the rotating frame its position
 * is that line turned back by Ω·t — the exact solution of the motion under
 * the Coriolis and centrifugal terms, with no stepping error.
 */
function rotatingState(time: number): { r: Vec; v: Vec } {
  const c = Math.cos(OMEGA * time);
  const s = Math.sin(OMEGA * time);
  const d = V0 * time;
  return {
    r: { x: d * c, y: -d * s },
    v: { x: V0 * (c - OMEGA * time * s), y: -V0 * (s + OMEGA * time * c) },
  };
}

/** FIG.06b — a ball rolled outward on a turntable, drawn in both frames. */
export function CoriolisTurntableScene() {
  const t = useTranslations("scenes.coriolisTurntable");
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 1,
    maxHeight: BASE_SIZE,
    minHeight: 260,
    initialWidth: BASE_SIZE,
    // The turntable is centred in whatever shape it gets.
    fullView: "fill",
  });

  // `u` for text, offsets and hairlines; the turntable and the balls grow
  // with the canvas (`k` for positions, `o` for sizes). Inline o = 1.
  const u = (n: number) => n * tokens.scale;
  const k = Math.min(width, height) / BASE_SIZE;
  const objectScale = Math.min(2.6, Math.max(tokens.scale, k));
  const o = (n: number) => n * objectScale;
  const cx = width / 2;
  const cy = height / 2;
  const rimR = TURNTABLE_R * k;
  const pxPerM = PX_PER_M * k;
  const toPx = (p: Vec) => ({ x: cx + p.x * pxPerM, y: cy + p.y * pxPerM });

  // Legend under the turntable's left edge, where it sat on the old 380 px
  // canvas; it moves with the drawing as the canvas grows.
  const legendX = cx - (BASE_SIZE / 2) * k + u(12);
  const legendRotY = cy + (BASE_SIZE / 2) * k - u(14);
  const legendLabY = legendRotY - u(14);

  const playbackRef = useRef<ScenePlayback | null>(null);
  const hover = useSceneHover(canvasRef, (px, py) => {
    const time = playbackRef.current?.getTime() ?? 0;
    const rot = toPx(rotatingState(time).r);
    const lab = toPx({ x: V0 * time, y: 0 });
    const reach = o(5) + u(9);
    if (Math.hypot(px - rot.x, py - rot.y) <= reach) return "coriolis";
    if (Math.hypot(px - lab.x, py - lab.y) <= reach) return "v0";
    // The legend lines name the two paths.
    if (px >= legendX - u(4) && px <= legendX + u(260)) {
      if (Math.abs(py - legendLabY) <= u(7)) return "v0";
      if (Math.abs(py - legendRotY) <= u(7)) return "coriolis";
    }
    // Near either path.
    for (let i = 0; i <= 60; i++) {
      const tau = (i / 60) * time;
      const p = toPx(rotatingState(tau).r);
      if (Math.hypot(px - p.x, py - p.y) <= u(9)) return "coriolis";
    }
    if (time > 0 && Math.abs(py - cy) <= u(9) && px >= cx && px <= lab.x) return "v0";
    const d = Math.hypot(px - cx, py - cy);
    if (Math.abs(d - rimR) <= u(9)) return "omega";
    return null;
  });
  const { activeKey } = hover;

  const playback = useScenePlayback({
    elementRef: containerRef,
    duration: FLIGHT_TIME,
    draw: (time) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = syncCanvas(canvas, width, height);
      if (!ctx) return;
      const bounds = { width, height };

      // Turntable rim; heavier while its spin rate is pointed at.
      const rimFocused = activeKey === "omega";
      ctx.strokeStyle = rimFocused ? tokens.textBright : tokens.axes;
      ctx.lineWidth = o(rimFocused ? 3 : 2);
      ctx.beginPath();
      ctx.arc(cx, cy, rimR, 0, Math.PI * 2);
      ctx.stroke();

      // Faint cross-axes
      ctx.strokeStyle = tokens.gridHeavy;
      ctx.lineWidth = 1;
      ctx.setLineDash([u(3), u(3)]);
      ctx.beginPath();
      ctx.moveTo(cx - rimR, cy);
      ctx.lineTo(cx + rimR, cy);
      ctx.moveTo(cx, cy - rimR);
      ctx.lineTo(cx, cy + rimR);
      ctx.stroke();
      ctx.setLineDash([]);

      // One path pointed at: it is drawn heavier, the other steps back.
      const focus = activeKey === "v0" ? "lab" : activeKey === "coriolis" ? "rot" : null;
      const pathStyle = (which: "lab" | "rot", color: string) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = o(focus === which ? 3 : 2);
        ctx.globalAlpha = focus !== null && focus !== which ? 0.35 : 1;
      };

      const lab = toPx({ x: V0 * time, y: 0 });
      const state = rotatingState(time);
      const rot = toPx(state.r);

      // Lab-frame path: straight out along the launch line.
      if (time > 0) {
        pathStyle("lab", tokens.cyan);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(lab.x, lab.y);
        ctx.stroke();

        // Rotating-frame path: the same line, curled by the turning frame.
        pathStyle("rot", tokens.magenta);
        const n = Math.max(2, Math.ceil(time * TRAIL_SAMPLES_PER_S));
        ctx.beginPath();
        for (let i = 0; i <= n; i++) {
          const p = toPx(rotatingState((i / n) * time).r);
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      const ball = (p: Vec, color: string) => {
        ctx.fillStyle = color;
        ctx.shadowColor = hexToRgba(color, 0.55);
        ctx.shadowBlur = o(8);
        ctx.beginPath();
        ctx.arc(p.x, p.y, o(5), 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      };
      ball(lab, tokens.cyan);
      ball(rot, tokens.magenta);

      // Centre marker
      ctx.fillStyle = tokens.textDim;
      ctx.beginPath();
      ctx.arc(cx, cy, o(3), 0, Math.PI * 2);
      ctx.fill();

      // While the Coriolis acceleration is pointed at, show its direction on
      // the ball: always square to the ball's velocity in the rotating frame.
      if (activeKey === "coriolis") {
        const a = coriolisAccel2D({ omegaZ: OMEGA }, state.v);
        const mag = Math.hypot(a.x, a.y);
        if (mag > 0) {
          const len = o(5) + u(30);
          drawArrow(
            ctx,
            rot.x,
            rot.y,
            rot.x + (a.x / mag) * len,
            rot.y + (a.y / mag) * len,
            tokens.magenta,
            u(2),
            u(8),
          );
          drawLabel(ctx, "a_C", rot.x + (a.x / mag) * (len + u(14)), rot.y + (a.y / mag) * (len + u(14)), {
            bounds,
            color: tokens.magenta,
            align: "center",
            font: tokens.fontHudSmall,
            plate: tokens.bg1,
            scale: tokens.scale,
          });
        }
        drawFocusRing(ctx, rot.x, rot.y, o(5) + u(6), tokens.magenta, tokens.scale);
      }
      if (activeKey === "v0") {
        drawFocusRing(ctx, lab.x, lab.y, o(5) + u(6), tokens.cyan, tokens.scale);
      }
      if (rimFocused) {
        drawLabel(ctx, `Ω = ${OMEGA.toFixed(2)} rad/s`, cx, cy - rimR - u(12), {
          bounds,
          color: tokens.textBright,
          align: "center",
          font: tokens.fontHudSmall,
          plate: tokens.bg1,
          scale: tokens.scale,
        });
      }

      // Legend
      drawLabel(ctx, t("legendLab"), legendX, legendLabY, {
        bounds,
        color: tokens.cyan,
        font: tokens.fontHudSmall,
        direction: "inherit",
      });
      drawLabel(ctx, t("legendRotating"), legendX, legendRotY, {
        bounds,
        color: tokens.magenta,
        font: tokens.fontHudSmall,
        direction: "inherit",
      });
    },
  });
  playbackRef.current = playback;

  const aC = coriolisAccel2D({ omegaZ: OMEGA }, rotatingState(playback.time).v);

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
              { label: "Ω", value: `${OMEGA.toFixed(2)} rad/s`, guideKey: "omega" },
              {
                label: "v₀",
                value: `${V0.toFixed(2)} m/s`,
                color: "var(--color-cyan)",
                guideKey: "v0",
              },
              {
                label: "|a_C|",
                value: `${Math.hypot(aC.x, aC.y).toFixed(2)} m/s²`,
                color: "var(--color-magenta)",
                guideKey: "coriolis",
              },
            ]}
          />
        </ScenePanel>
      </div>
    </div>
  );
}
