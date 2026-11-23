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
  drawArrow,
  drawFocusRing,
  drawLabel,
  hexToRgba,
  syncCanvas,
  useSceneHover,
  useScenePlayback,
  useSceneSize,
  useSceneTokens,
} from "@/components/physics/_shared";
import { angularFromPeriod, linearFromAngular } from "@/lib/physics/circular-motion";

/** Wheel radius in metres: what v = ωR refers to in the readout. */
const WHEEL_R_PHYS = 1.0;
/** Drawing size at which the wheel has its reference proportions (radius 100 px). */
const REF_W = 360;
const REF_H = 280;
const WHEEL_R = 100;
const DOT_R = 7;
const ARROW_LEN = 38;

/**
 * FIG.04c — a wheel turning at ω = 2π/T, with the velocity of one rim point.
 *
 * The period can be changed while the wheel turns, so the angle is stepped
 * from where it is (`simulation`) instead of being read off ω·t, which would
 * jump the wheel to a new angle on every change.
 */
export function AngularVelocityScene() {
  const t = useTranslations("scenes.angularVelocity");
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: REF_H / REF_W,
    maxHeight: REF_H,
    minHeight: 220,
    initialWidth: REF_W,
    // The wheel is sized from both directions and stays centred, so the full
    // view can use any shape.
    fullView: "fill",
  });
  const [period, setPeriod] = useState(2.0);
  /** Angle of the tracked rim point, in radians. */
  const phaseRef = useRef(0);

  const omega = angularFromPeriod(period);
  const v = linearFromAngular(omega, WHEEL_R_PHYS);

  const scale = tokens.scale;
  const u = (n: number) => n * scale;
  // The wheel fills the canvas the way it did at 360 × 280, and grows with a
  // taller canvas in full view. Inline it is at most 1.
  const objectScale = Math.min(2.6, Math.max(scale, height / REF_H), width / REF_W);
  const o = (n: number) => n * objectScale;

  const cx = width / 2;
  const cy = height / 2;
  const wheelR = o(WHEEL_R);
  const dotR = o(DOT_R);
  const arrowLen = o(ARROW_LEN);
  const rimPoint = (phase: number) => ({
    x: cx + wheelR * Math.cos(phase),
    y: cy + wheelR * Math.sin(phase),
  });

  // The rim point (its speed), the radius line to it, the rim (one lap: the
  // period) or the inside of the wheel (how fast it turns).
  const hover = useSceneHover(canvasRef, (px, py) => {
    const phase = phaseRef.current;
    const dot = rimPoint(phase);
    const tx = -Math.sin(phase);
    const ty = Math.cos(phase);
    if (Math.hypot(px - dot.x, py - dot.y) <= dotR + u(9)) return "speed";
    // Along the velocity arrow.
    const along = (px - dot.x) * tx + (py - dot.y) * ty;
    const across = Math.abs((px - dot.x) * -ty + (py - dot.y) * tx);
    if (along >= 0 && along <= arrowLen + u(6) && across <= u(9)) return "speed";
    const r = Math.hypot(px - cx, py - cy);
    if (Math.abs(r - wheelR) <= u(9)) return "period";
    if (r < wheelR) {
      // Distance from the radius line to the rim point.
      const rx = Math.cos(phase);
      const ry = Math.sin(phase);
      const s = (px - cx) * rx + (py - cy) * ry;
      const d = Math.abs((px - cx) * -ry + (py - cy) * rx);
      if (s >= 0 && d <= u(9)) return "radius";
      return "omega";
    }
    return null;
  });
  const { activeKey } = hover;

  const playback = useScenePlayback({
    elementRef: containerRef,
    simulation: {
      step: (dt) => {
        phaseRef.current += omega * dt;
      },
      reset: () => {
        phaseRef.current = 0;
      },
      isDone: () => false,
    },
    draw: () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = syncCanvas(canvas, width, height);
      if (!ctx) return;
      const bounds = { width, height };
      const phase = phaseRef.current;

      // Wheel rim
      const periodFocused = activeKey === "period";
      ctx.strokeStyle = periodFocused ? tokens.cyan : tokens.textMute;
      ctx.lineWidth = periodFocused ? u(3) : u(2);
      ctx.beginPath();
      ctx.arc(cx, cy, wheelR, 0, Math.PI * 2);
      ctx.stroke();

      // Spokes (4), to show the rotation
      const omegaFocused = activeKey === "omega";
      ctx.strokeStyle = omegaFocused ? tokens.cyan : tokens.textFaint;
      ctx.lineWidth = omegaFocused ? u(1.5) : 1;
      for (let k = 0; k < 4; k++) {
        const ang = phase + (k * Math.PI) / 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + wheelR * Math.cos(ang), cy + wheelR * Math.sin(ang));
        ctx.stroke();
      }
      ctx.lineWidth = 1;

      // Hub
      ctx.fillStyle = tokens.textDim;
      ctx.beginPath();
      ctx.arc(cx, cy, o(4), 0, Math.PI * 2);
      ctx.fill();

      const dot = rimPoint(phase);

      // Radius to the tracked point, named while it is pointed at.
      if (activeKey === "radius") {
        ctx.strokeStyle = tokens.cyan;
        ctx.lineWidth = u(2);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(dot.x, dot.y);
        ctx.stroke();
        ctx.lineWidth = 1;
      }

      // Rim dot (the tracked particle)
      ctx.shadowColor = hexToRgba(tokens.magenta, 0.55);
      ctx.shadowBlur = u(10);
      ctx.fillStyle = tokens.magenta;
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, dotR, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Tangent velocity arrow on the rim dot
      const speedFocused = activeKey === "speed";
      const tx = -Math.sin(phase);
      const ty = Math.cos(phase);
      const tipX = dot.x + arrowLen * tx;
      const tipY = dot.y + arrowLen * ty;
      drawArrow(ctx, dot.x, dot.y, tipX, tipY, tokens.cyan, speedFocused ? u(3) : u(2), o(7));
      if (speedFocused) drawFocusRing(ctx, dot.x, dot.y, dotR + u(6), tokens.magenta, scale);

      drawLabel(ctx, "v = ωR", tipX + u(6), tipY + u(4), {
        bounds,
        color: tokens.cyan,
        font: tokens.fontHudSmall,
        plate: speedFocused ? tokens.bg1 : undefined,
        scale,
      });

      // Names of the emphasised quantity, on plates.
      if (activeKey === "radius") {
        drawLabel(ctx, `R = ${WHEEL_R_PHYS.toFixed(1)} m`, (cx + dot.x) / 2, (cy + dot.y) / 2, {
          bounds,
          color: tokens.cyan,
          align: "center",
          font: tokens.fontLabel,
          plate: tokens.bg1,
          scale,
        });
      }
      if (omegaFocused) {
        drawLabel(ctx, `ω = ${omega.toFixed(2)} rad/s`, cx, cy - u(16), {
          bounds,
          color: tokens.cyan,
          align: "center",
          font: tokens.fontLabel,
          plate: tokens.bg1,
          scale,
        });
      }
      if (periodFocused) {
        drawLabel(ctx, `T = ${period.toFixed(2)} s`, cx, cy - wheelR - u(14), {
          bounds,
          color: tokens.cyan,
          align: "center",
          font: tokens.fontLabel,
          plate: tokens.bg1,
          scale,
        });
      }
    },
  });

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
              { label: "T", value: `${period.toFixed(2)} s`, guideKey: "period" },
              { label: "ω = 2π/T", value: `${omega.toFixed(2)} rad/s`, guideKey: "omega" },
              {
                label: "v = ωR",
                value: `${v.toFixed(2)} m/s`,
                color: "var(--color-cyan)",
                guideKey: "speed",
              },
              { label: "R", value: `${WHEEL_R_PHYS.toFixed(1)} m`, guideKey: "radius" },
            ]}
          />
        </ScenePanel>
        <SceneControlGroup>
          <SceneSlider
            label={t("period")}
            guideKey="period"
            value={period}
            min={0.5}
            max={5}
            step={0.05}
            onChange={setPeriod}
            display={`${period.toFixed(2)} s`}
          />
        </SceneControlGroup>
      </div>
    </div>
  );
}
