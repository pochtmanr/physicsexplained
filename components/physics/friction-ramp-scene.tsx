"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
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
  useSceneHover,
  useScenePlayback,
  useSceneSize,
  useSceneTokens,
} from "@/components/physics/_shared";
import { G, criticalAngle, isBlockStatic } from "@/lib/physics/friction";

/** Inline height cap; the drawn block grows past it in full view. */
const MAX_HEIGHT = 380;
/** Ratio μ_k / μ_s: kinetic friction is always a bit lower than static. */
const KINETIC_RATIO = 0.75;
/** The drawn ramp stands for this many metres of slope. */
const RAMP_METRES = 6;
/** Longest ramp at scale 1, in pixels. */
const RAMP_MAX_PX = 640;
/** Side of the block at scale 1. */
const BLOCK_SIZE = 26;
/** Keys whose guide entry is about the block, the critical line and the angle. */
const BLOCK_KEYS = ["speed", "acceleration"];
const CRITICAL_KEYS = ["critical", "muStatic"];

interface Slide {
  /** Distance slid down the ramp, in metres. */
  s: number;
  /** Speed along the ramp, in m/s (never negative: friction cannot push it uphill). */
  v: number;
}

/** Distance (px) from point (px, py) to the segment (ax, ay)–(bx, by). */
function distanceToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const f = len2 === 0 ? 0 : Math.min(1, Math.max(0, ((px - ax) * dx + (py - ay) * dy) / len2));
  return Math.hypot(px - (ax + f * dx), py - (ay + f * dy));
}

/**
 * FIG.04a — a block on a ramp with friction. It stays put while tan θ ≤ μ_s
 * and slides once the angle passes the critical angle arctan μ_s, then
 * accelerates at g(sin θ − μ_k cos θ).
 *
 * The angle and μ can be changed while the block slides, so the slide is
 * stepped from the block's current position and speed (`simulation`).
 */
export function FrictionRampScene() {
  const t = useTranslations("scenes.frictionRamp");
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.6,
    maxHeight: MAX_HEIGHT,
    initialWidth: 640,
    // The ramp is sized from both width and height, so any shape works.
    fullView: "fill",
  });
  const [angleDeg, setAngleDeg] = useState(15);
  const [muStatic, setMuStatic] = useState(0.4);
  const reducedMotion = useReducedMotion();
  const slideRef = useRef<Slide>({ s: 0, v: 0 });

  const angle = (angleDeg * Math.PI) / 180;
  const muKinetic = muStatic * KINETIC_RATIO;
  const thetaCrit = criticalAngle(muStatic);
  const staticHolds = isBlockStatic(angle, muStatic);
  /** Acceleration along the slope while sliding (negative: friction is braking it). */
  const slideAccel = G * (Math.sin(angle) - muKinetic * Math.cos(angle));
  const isHeld = () => slideRef.current.v === 0 && staticHolds;
  const atBottom = () => slideRef.current.s >= RAMP_METRES;

  // Every pixel size goes through `u`, so text and objects grow together in
  // full view on a large screen (docs/figure-full-view.md).
  const scale = tokens.scale;
  const u = (n: number) => n * scale;
  // The block and the ramp also grow with a tall canvas. Inline this is 1.
  const objectScale = Math.min(2.6, Math.max(scale, height / MAX_HEIGHT));
  const o = (n: number) => n * objectScale;

  const pad = u(28);
  const originX = pad + u(10);
  const originY = height - pad - u(14);
  // Room above the ramp top for the block and its glow.
  const headroom = u(12) + o(30);
  // The ramp and the critical line share one length, short enough that both
  // stay under the top edge.
  const steepest = Math.max(angle, thetaCrit);
  const rampLen = Math.min(
    width - pad * 2 - u(20),
    o(RAMP_MAX_PX),
    steepest > 0 ? (originY - headroom) / Math.sin(steepest) : Infinity,
  );
  const endX = originX + rampLen * Math.cos(angle);
  const endY = originY - rampLen * Math.sin(angle);
  const critEndX = originX + rampLen * Math.cos(thetaCrit);
  const critEndY = originY - rampLen * Math.sin(thetaCrit);
  // Outward normal to the ramp surface (up and to the left of the slope).
  const nx = -Math.sin(angle);
  const ny = -Math.cos(angle);
  const blockSize = o(BLOCK_SIZE);
  /** Centre of the block for a slide distance `s` (metres). */
  const blockAt = (s: number) => {
    const topOffset = rampLen * 0.05; // starts a little below the peak
    const along = topOffset + Math.min(1, s / RAMP_METRES) * (rampLen - topOffset - o(24));
    return {
      x: endX - along * Math.cos(angle) + nx * blockSize * 0.5,
      y: endY + along * Math.sin(angle) + ny * blockSize * 0.5,
    };
  };
  const badgeY = pad + u(4);

  const hover = useSceneHover(canvasRef, (px, py) => {
    const block = blockAt(slideRef.current.s);
    if (Math.hypot(px - block.x, py - block.y) <= blockSize * 0.75 + u(6)) return "speed";
    if (px >= width * 0.5 && Math.abs(py - badgeY) <= u(10)) return "speed";
    if (distanceToSegment(px, py, originX, originY, critEndX, critEndY) <= u(9)) return "critical";
    if (Math.hypot(px - originX, py - originY) <= u(44)) return "angle";
    if (distanceToSegment(px, py, originX, originY, endX, endY) <= u(9)) return "angle";
    return null;
  });
  const { activeKey } = hover;
  const blockFocused = activeKey !== null && BLOCK_KEYS.includes(activeKey);
  const criticalFocused = activeKey !== null && CRITICAL_KEYS.includes(activeKey);
  const angleFocused = activeKey === "angle";

  const playback = useScenePlayback({
    elementRef: containerRef,
    simulation: {
      // Constant acceleration over each step, solved exactly, so the slide
      // does not depend on the frame rate.
      step: (dt) => {
        const { s, v } = slideRef.current;
        if (v === 0 && staticHolds) return;
        const a = slideAccel;
        let next: Slide;
        if (a < 0 && v + a * dt <= 0) {
          // Kinetic friction brings the block to rest within this step.
          next = { s: s + (v * v) / (2 * -a), v: 0 };
        } else {
          next = { s: s + v * dt + 0.5 * a * dt * dt, v: v + a * dt };
        }
        if (next.s >= RAMP_METRES) next = { s: RAMP_METRES, v: next.v };
        slideRef.current = next;
      },
      reset: () => {
        slideRef.current = { s: 0, v: 0 };
      },
      isDone: () => atBottom() || isHeld(),
    },
    draw: () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = syncCanvas(canvas, width, height);
      if (!ctx) return;
      const bounds = { width, height };
      // Free of static friction (sliding, or already at the foot), and
      // actually moving.
      const free = !isHeld();
      const sliding = free && !atBottom();

      // Ground
      ctx.strokeStyle = tokens.gridHeavy;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad, originY);
      ctx.lineTo(width - pad, originY);
      ctx.stroke();

      // Shaded ramp triangle
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.lineTo(endX, endY);
      ctx.lineTo(endX, originY);
      ctx.closePath();
      ctx.fillStyle = hexToRgba(tokens.gridHeavy, 0.2);
      ctx.fill();

      // Ramp face
      ctx.strokeStyle = tokens.textDim;
      ctx.lineWidth = u(2);
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Critical-angle line: where the block would just start to slip.
      ctx.strokeStyle = tokens.cyan;
      ctx.globalAlpha = criticalFocused ? 1 : 0.35;
      ctx.lineWidth = criticalFocused ? u(2) : u(1);
      ctx.setLineDash([u(4), u(4)]);
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.lineTo(critEndX, critEndY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      if (criticalFocused) {
        drawLabel(
          ctx,
          `θc = ${((thetaCrit * 180) / Math.PI).toFixed(1)}°`,
          critEndX,
          critEndY - u(12),
          { bounds, color: tokens.cyan, align: "center", font: tokens.fontLabel, plate: tokens.bg1, scale },
        );
      }

      // Angle at the foot of the ramp: an arc while it is pointed at, and the
      // value under the ground line, clear of the ramp at every angle.
      if (angleFocused && angle > 0) {
        ctx.strokeStyle = tokens.cyan;
        ctx.lineWidth = u(2);
        ctx.beginPath();
        ctx.arc(originX, originY, u(30), -angle, 0);
        ctx.stroke();
      }
      drawLabel(ctx, `θ = ${angleDeg.toFixed(1)}°`, originX, originY + u(14), {
        bounds,
        color: angleFocused ? tokens.cyan : tokens.textDim,
        font: tokens.fontHud,
      });

      // Block: a square sitting on the ramp, lit while it slides.
      const block = blockAt(slideRef.current.s);
      ctx.save();
      ctx.translate(block.x, block.y);
      ctx.rotate(-angle);
      ctx.fillStyle = free ? tokens.cyan : tokens.axes;
      if (sliding) {
        ctx.shadowColor = hexToRgba(tokens.cyan, 0.45);
        ctx.shadowBlur = u(10);
      }
      ctx.fillRect(-blockSize / 2, -blockSize / 2, blockSize, blockSize);
      ctx.restore();
      if (blockFocused) {
        drawFocusRing(ctx, block.x, block.y, blockSize * 0.75 + u(4), free ? tokens.cyan : tokens.textBright, scale);
      }

      // State, top right.
      drawLabel(ctx, free ? t("slides") : t("holds"), width - pad, badgeY, {
        bounds,
        color: free ? tokens.cyan : tokens.textLabel,
        align: "right",
        direction: "inherit",
        font: tokens.fontHudSmall,
      });
    },
  });

  // A finished slide (or a block held at rest) has nothing left to show the
  // change on. When the reader lets go: a block now free to slide moves on
  // from where it is, and one that reached the bottom starts again.
  const commit = () => {
    if (playback.status !== "ended") return;
    if (atBottom()) {
      if (reducedMotion) playback.seek(0);
      else playback.replay();
    } else if (!isHeld() && !reducedMotion) {
      playback.play();
    }
  };

  const { v } = slideRef.current;
  const accelNow = isHeld() ? 0 : atBottom() ? 0 : slideAccel;

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
                label: t("critical"),
                value: `${((thetaCrit * 180) / Math.PI).toFixed(1)}°`,
                color: "var(--color-cyan)",
                guideKey: "critical",
              },
              { label: "μk", value: muKinetic.toFixed(2), guideKey: "muKinetic" },
              { label: "a", value: `${accelNow.toFixed(2)} m/s²`, guideKey: "acceleration" },
              { label: "v", value: `${v.toFixed(2)} m/s`, guideKey: "speed" },
            ]}
          />
        </ScenePanel>
        <SceneControlGroup>
          <SceneSlider
            label={t("angle")}
            guideKey="angle"
            value={angleDeg}
            min={0}
            max={45}
            step={0.5}
            onChange={setAngleDeg}
            onCommit={commit}
            display={`${angleDeg.toFixed(1)}°`}
          />
          <SceneSlider
            label={
              <>
                μ<sub>s</sub>
              </>
            }
            ariaLabel={t("muStatic")}
            guideKey="muStatic"
            value={muStatic}
            min={0.05}
            max={0.9}
            step={0.01}
            onChange={setMuStatic}
            onCommit={commit}
            display={muStatic.toFixed(2)}
          />
        </SceneControlGroup>
      </div>
    </div>
  );
}
