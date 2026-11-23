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
  syncCanvas,
  type ScenePlayback,
  useSceneHover,
  useScenePlayback,
  useSceneSize,
  useSceneTokens,
} from "@/components/physics/_shared";
import { skaterVelocities } from "@/lib/physics/newton";

/** Equal and opposite push impulse, kg·m/s. */
const IMPULSE = 60;
/** Seconds over which the push acts. */
const PUSH_DURATION = 0.35;
/** Seconds of gliding shown after the push. */
const GLIDE_DURATION = 3.2;
/** Mass of skater A, the reference, in kg. */
const MASS_A = 60;
/** Inline height cap; objects grow past it in full view. */
const MAX_HEIGHT = 360;
/** Drawn pixels per metre of travel, at object scale 1. */
const PX_PER_METRE = 24;

/** Horizontal arrow from x0 to x1 at height y, head at x1. */
function arrow(
  ctx: CanvasRenderingContext2D,
  x0: number,
  x1: number,
  y: number,
  color: string,
  lineWidth: number,
  headLength: number,
  headHalf: number,
) {
  const dir = Math.sign(x1 - x0) || 1;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.lineTo(x1, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x1 - dir * headLength, y - headHalf);
  ctx.lineTo(x1 - dir * headLength, y + headHalf);
  ctx.closePath();
  ctx.fill();
}

function drawSkater(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  headGap: number,
  bodyColor: string,
  strokeColor: string,
) {
  ctx.fillStyle = bodyColor;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1;
  // Body
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Head
  ctx.beginPath();
  ctx.arc(cx, cy - r - headGap, r * 0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

/**
 * FIG.03c — two skaters push off each other: equal and opposite forces,
 * velocities in inverse proportion to the masses.
 *
 * The motion is a function of time, so a new mass ratio simply redraws the
 * same moment with the new velocities.
 */
export function ActionReactionScene() {
  const t = useTranslations("scenes.actionReaction");
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.6,
    maxHeight: MAX_HEIGHT,
    minHeight: 160,
    initialWidth: 640,
    // The ice stretches to any width and the skaters grow with the height.
    fullView: "fill",
  });
  const [ratio, setRatio] = useState(1); // m_B / m_A
  const playbackRef = useRef<ScenePlayback | null>(null);

  const massB = MASS_A * ratio;
  const { vA, vB } = skaterVelocities(MASS_A, massB, IMPULSE);

  // Text and offsets scale with `u`; the skaters, their travel and the force
  // arrows with `o`, which also follows the canvas height.
  const scale = tokens.scale;
  const u = (n: number) => n * scale;
  const objectScale = Math.min(2.6, Math.max(scale, height / MAX_HEIGHT));
  const o = (n: number) => n * objectScale;

  const centreX = width / 2;
  const iceY = height * 0.55;
  const padX = u(40);
  const iceLineY = iceY + o(28);
  const rA = o(18 + Math.cbrt(MASS_A) * 2);
  const rB = o(18 + Math.cbrt(massB) * 2);
  const headGap = o(6);
  const forceLen = o(34);

  /** Positions (m from the start) and speeds at scene time `time`. */
  const motionAt = (time: number) => {
    if (time < PUSH_DURATION) {
      // Constant force during the push: speed grows linearly to its final value.
      const frac = time / PUSH_DURATION;
      return {
        pushing: true,
        xA: 0.5 * vA * time * frac,
        xB: 0.5 * vB * time * frac,
        speedA: vA * frac,
        speedB: vB * frac,
      };
    }
    const glide = Math.min(time, PUSH_DURATION + GLIDE_DURATION) - PUSH_DURATION;
    return {
      pushing: false,
      xA: 0.5 * vA * PUSH_DURATION + vA * glide,
      xB: 0.5 * vB * PUSH_DURATION + vB * glide,
      speedA: vA,
      speedB: vB,
    };
  };
  /** Skater centres on the canvas: hands touching at the start, kept inside the ice. */
  const centresAt = (time: number) => {
    const m = motionAt(time);
    const cxA = Math.max(padX + rA + u(10), centreX - rA + m.xA * o(PX_PER_METRE));
    const cxB = Math.min(width - padX - rB - u(10), centreX + rB + m.xB * o(PX_PER_METRE));
    return { ...m, cxA, cxB };
  };

  // A skater (body or head) means its velocity; the strip where the hands
  // meet during the push means the force pair.
  const hover = useSceneHover(canvasRef, (px, py) => {
    const { cxA, cxB, pushing } = centresAt(playbackRef.current?.getTime() ?? 0);
    const reach = u(9);
    const onSkater = (cx: number, r: number) =>
      Math.hypot(px - cx, py - iceY) <= r + reach ||
      Math.hypot(px - cx, py - (iceY - r - headGap)) <= r * 0.45 + reach;
    if (pushing && Math.abs(px - (cxA + rA + cxB - rB) / 2) <= forceLen + reach && Math.abs(py - iceY) <= o(8) + reach) {
      return "forces";
    }
    if (onSkater(cxA, rA)) return "vA";
    if (onSkater(cxB, rB)) return "vB";
    return null;
  });
  const { activeKey } = hover;

  const playback = useScenePlayback({
    elementRef: containerRef,
    duration: PUSH_DURATION + GLIDE_DURATION,
    draw: (time) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = syncCanvas(canvas, width, height);
      if (!ctx) return;
      const bounds = { width, height };
      const { cxA, cxB, pushing } = centresAt(time);

      // Ice line
      ctx.strokeStyle = tokens.axes;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padX, iceLineY);
      ctx.lineTo(width - padX, iceLineY);
      ctx.stroke();

      // Subtle ice hatching
      ctx.strokeStyle = tokens.gridHeavy;
      ctx.setLineDash([u(2), u(6)]);
      ctx.beginPath();
      for (let x = padX; x < width - padX; x += u(16)) {
        ctx.moveTo(x, iceLineY + o(6));
        ctx.lineTo(x + u(8), iceLineY + o(6));
      }
      ctx.stroke();
      ctx.setLineDash([]);

      drawSkater(ctx, cxA, iceY, rA, headGap, tokens.amber, tokens.textBright);
      drawSkater(ctx, cxB, iceY, rB, headGap, tokens.cyan, tokens.textBright);
      if (activeKey === "vA") drawFocusRing(ctx, cxA, iceY, rA + u(6), tokens.amber, scale);
      if (activeKey === "vB" || activeKey === "ratio") {
        drawFocusRing(ctx, cxB, iceY, rB + u(6), tokens.cyan, scale);
      }

      // The force pair, during the push: from the hands, B on A to the left,
      // A on B to the right, in one colour: two halves of one interaction.
      // Pointed at, both appear on their skaters even after the push, as the
      // two forces that acted.
      const forcesFocused = activeKey === "forces";
      if (pushing || forcesFocused) {
        ctx.save();
        if (!pushing) ctx.globalAlpha = 0.5;
        const lw = o(forcesFocused ? 3 : 2);
        arrow(ctx, cxA + rA, cxA + rA - forceLen, iceY - o(4), tokens.red, lw, o(6), o(4));
        arrow(ctx, cxB - rB, cxB - rB + forceLen, iceY + o(6), tokens.red, lw, o(6), o(4));
        ctx.restore();
      }

      // Names and masses under each skater.
      const nameY = iceY + Math.max(rA, rB) + u(20);
      drawLabel(ctx, "A", cxA, nameY, {
        bounds,
        color: activeKey === "vA" ? tokens.textBright : tokens.textDim,
        align: "center",
        font: tokens.fontHudLarge,
      });
      drawLabel(ctx, "B", cxB, nameY, {
        bounds,
        color: activeKey === "vB" ? tokens.textBright : tokens.textDim,
        align: "center",
        font: tokens.fontHudLarge,
      });
      drawLabel(ctx, `${MASS_A} kg`, cxA, nameY + u(16), {
        bounds,
        color: tokens.textLabel,
        align: "center",
        font: tokens.fontHudSmall,
      });
      drawLabel(ctx, `${massB.toFixed(0)} kg`, cxB, nameY + u(16), {
        bounds,
        color: activeKey === "ratio" ? tokens.cyan : tokens.textLabel,
        align: "center",
        font: tokens.fontHudSmall,
      });
    },
  });
  // The hit test above runs between renders and needs the live clock.
  playbackRef.current = playback;

  const now = motionAt(playback.getTime());
  const momentum = MASS_A * now.speedA + massB * now.speedB;

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
                label: "v_A",
                value: `${now.speedA.toFixed(2)} m/s`,
                color: "var(--color-amber)",
                guideKey: "vA",
              },
              {
                label: "v_B",
                value: `${now.speedB.toFixed(2)} m/s`,
                color: "var(--color-cyan)",
                guideKey: "vB",
              },
              {
                label: "m_A·v_A + m_B·v_B",
                // Exactly zero; never show "-0.00".
                value: `${Math.abs(momentum) < 0.005 ? "0.00" : momentum.toFixed(2)} kg·m/s`,
                guideKey: "momentum",
              },
            ]}
          />
        </ScenePanel>
        <SceneControlGroup>
          <SceneSlider
            label={t("ratio")}
            guideKey="ratio"
            value={ratio}
            min={0.25}
            max={4}
            step={0.05}
            onChange={setRatio}
            display={ratio.toFixed(2)}
          />
        </SceneControlGroup>
      </div>
    </div>
  );
}
