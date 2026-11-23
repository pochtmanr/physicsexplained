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
  type ScenePlayback,
  useSceneHover,
  useScenePlayback,
  useSceneSize,
  useSceneTokens,
} from "@/components/physics/_shared";
import { centripetalAccel } from "@/lib/physics/circular-motion";

/** Drawing size at which the figure has its reference proportions. */
const REF_SIZE = 320;
const RADIUS = 110;
const PARTICLE_R = 7;
/** Drawn length of the |v| arrow at the reference size. */
const V_LEN = 80;
/** Physical speed used in the readout (m/s, illustrative). */
const V_PHYS = 1.5;
/** Physical radius (m). */
const R_PHYS = 1.0;
/** Seconds for one full lap. */
const PERIOD = 4;
/** Angle between v and v + dv (radians), large for clarity. */
const DTHETA = 0.45;

/** Distance from point (px, py) to the segment (x0, y0)–(x1, y1). */
function segmentDistance(px: number, py: number, x0: number, y0: number, x1: number, y1: number) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len2 = dx * dx + dy * dy;
  const s = len2 > 0 ? Math.min(1, Math.max(0, ((px - x0) * dx + (py - y0) * dy) / len2)) : 0;
  return Math.hypot(px - (x0 + s * dx), py - (y0 + s * dy));
}

/**
 * FIG.04a — the velocity triangle. A particle goes round at constant speed;
 * its velocity v and the velocity a moment later, v + dv, drawn tail to tail,
 * close a thin triangle whose third side dv points toward the centre.
 */
export function VelocityTriangleScene() {
  const t = useTranslations("scenes.velocityTriangle");
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 1,
    maxHeight: REF_SIZE,
    minHeight: 220,
    initialWidth: REF_SIZE,
    // The circle stays centred and is sized from the shorter side, so the
    // full view can use any shape.
    fullView: "fill",
  });
  const playbackRef = useRef<ScenePlayback | null>(null);

  const scale = tokens.scale;
  const u = (n: number) => n * scale;
  // The circle and arrows keep their 320 × 320 proportions and grow with the
  // canvas in full view. Inline this is at most 1.
  const objectScale = Math.min(2.6, Math.min(width, height) / REF_SIZE);
  const o = (n: number) => n * objectScale;

  const cx = width / 2;
  const cy = height / 2;
  const radius = o(RADIUS);
  const vLen = o(V_LEN);
  const particleR = o(PARTICLE_R);

  /** Positions of everything drawn, at scene time `time`. */
  const geometry = (time: number) => {
    const theta = ((time % PERIOD) / PERIOD) * 2 * Math.PI;
    const px = cx + radius * Math.cos(theta);
    const py = cy + radius * Math.sin(theta);
    // Tangent at θ (perpendicular to the radius, going round) and at θ + dθ.
    const tx = -Math.sin(theta);
    const ty = Math.cos(theta);
    const tx2 = -Math.sin(theta + DTHETA);
    const ty2 = Math.cos(theta + DTHETA);
    return {
      theta,
      px,
      py,
      tipVx: px + vLen * tx,
      tipVy: py + vLen * ty,
      tipV2x: px + vLen * tx2,
      tipV2y: py + vLen * ty2,
    };
  };

  // The dv side first (it is the point of the figure), then the two velocity
  // arrows, then the particle or the radius to it (the inward acceleration).
  const hover = useSceneHover(canvasRef, (x, y) => {
    const g = geometry(playbackRef.current?.getTime() ?? 0);
    const reach = u(9);
    if (segmentDistance(x, y, g.tipVx, g.tipVy, g.tipV2x, g.tipV2y) <= reach) return "dv";
    if (
      segmentDistance(x, y, g.px, g.py, g.tipVx, g.tipVy) <= reach ||
      segmentDistance(x, y, g.px, g.py, g.tipV2x, g.tipV2y) <= reach
    ) {
      return "speed";
    }
    if (Math.hypot(x - g.px, y - g.py) <= particleR + reach) return "speed";
    if (segmentDistance(x, y, cx, cy, g.px, g.py) <= reach) return "accel";
    return null;
  });
  const { activeKey } = hover;

  const playback = useScenePlayback({
    elementRef: containerRef,
    draw: (time) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = syncCanvas(canvas, width, height);
      if (!ctx) return;
      const bounds = { width, height };
      const g = geometry(time);
      const { px, py, tipVx, tipVy, tipV2x, tipV2y } = g;
      const speedFocused = activeKey === "speed";
      const dvFocused = activeKey === "dv";
      const accelFocused = activeKey === "accel";

      // Circle (path)
      ctx.strokeStyle = tokens.textFaint;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Centre dot
      ctx.fillStyle = tokens.textMute;
      ctx.beginPath();
      ctx.arc(cx, cy, o(2), 0, Math.PI * 2);
      ctx.fill();

      // Radius from the centre to the particle
      ctx.strokeStyle = accelFocused ? tokens.magenta : tokens.textFaint;
      ctx.lineWidth = accelFocused ? u(1.5) : 1;
      ctx.setLineDash([u(3), u(3)]);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(px, py);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.lineWidth = 1;

      // The inward acceleration, shown while it is pointed at: along the
      // radius, toward the centre, the direction dv tends to as dθ → 0.
      if (accelFocused) {
        const ax = px + (cx - px) * 0.45;
        const ay = py + (cy - py) * 0.45;
        drawArrow(ctx, px, py, ax, ay, tokens.magenta, u(2), o(8));
        drawLabel(ctx, "a_c = v²/r", ax, ay - u(12), {
          bounds,
          color: tokens.magenta,
          align: "center",
          font: tokens.fontLabel,
          plate: tokens.bg1,
          scale,
        });
      }

      // v (tangent at the particle)
      drawArrow(ctx, px, py, tipVx, tipVy, tokens.cyan, speedFocused ? u(3) : u(2), o(8));

      // v + dv, dashed, from the same tail to show the rotation
      ctx.save();
      ctx.setLineDash([u(4), u(3)]);
      drawArrow(ctx, px, py, tipV2x, tipV2y, tokens.cyan, speedFocused ? u(2.5) : u(1.5), o(8));
      ctx.restore();

      // The angle dθ between them, shown with dv.
      if (dvFocused) {
        const a0 = Math.atan2(tipVy - py, tipVx - px);
        ctx.strokeStyle = tokens.magenta;
        ctx.lineWidth = u(1.5);
        ctx.beginPath();
        ctx.arc(px, py, vLen * 0.45, a0, a0 + DTHETA);
        ctx.stroke();
        ctx.lineWidth = 1;
        const mid = a0 + DTHETA / 2;
        drawLabel(
          ctx,
          `dθ = ${DTHETA.toFixed(2)} rad`,
          px + vLen * 0.45 * Math.cos(mid),
          py + vLen * 0.45 * Math.sin(mid),
          { bounds, color: tokens.magenta, align: "center", font: tokens.fontLabel, plate: tokens.bg1, scale },
        );
      }

      // dv closes the triangle, from the tip of v to the tip of v + dv
      drawArrow(ctx, tipVx, tipVy, tipV2x, tipV2y, tokens.magenta, dvFocused ? u(3) : u(2), o(7));

      // Particle dot, on top of the arrow tails
      ctx.shadowColor = hexToRgba(tokens.cyan, 0.55);
      ctx.shadowBlur = u(10);
      ctx.fillStyle = tokens.cyan;
      ctx.beginPath();
      ctx.arc(px, py, particleR, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      if (speedFocused) drawFocusRing(ctx, px, py, particleR + u(6), tokens.cyan, scale);

      // Labels last, so the arrows never cover them.
      drawLabel(ctx, "v", tipVx + u(6), tipVy + u(4), {
        bounds,
        color: tokens.cyan,
        font: tokens.fontHudSmall,
      });
      drawLabel(ctx, "v+dv", tipV2x + u(6), tipV2y + u(4), {
        bounds,
        color: tokens.cyan,
        font: tokens.fontHudSmall,
      });
      drawLabel(ctx, "dv", (tipVx + tipV2x) / 2 + u(6), (tipVy + tipV2y) / 2 - u(4), {
        bounds,
        color: tokens.magenta,
        font: dvFocused ? tokens.fontHudLarge : tokens.fontHudSmall,
      });
    },
  });
  // The hit test runs between renders and needs the live clock.
  playbackRef.current = playback;

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
              {
                label: "|v|",
                value: `${V_PHYS.toFixed(2)} m/s`,
                color: "var(--color-cyan)",
                guideKey: "speed",
              },
              {
                label: "|dv| = v·dθ",
                value: `${(V_PHYS * DTHETA).toFixed(2)} m/s`,
                color: "var(--color-magenta)",
                guideKey: "dv",
              },
              {
                label: "a_c = v²/r",
                value: `${centripetalAccel(V_PHYS, R_PHYS).toFixed(2)} m/s²`,
                guideKey: "accel",
              },
            ]}
          />
          <p className="mt-1 px-2 text-xs text-[var(--color-fg-2)]">{t("constantSpeed")}</p>
        </ScenePanel>
      </div>
    </div>
  );
}
