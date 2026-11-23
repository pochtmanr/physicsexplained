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
import { pairKE, pairP, restitutionCollision } from "@/lib/physics/momentum";

/** Mass of A, the reference, in kg. */
const MASS_A = 1;
/** A's speed before the collision, m/s (rightward); B starts at rest. */
const V_A0 = 2;
const V_B0 = 0;
/** Length of the drawn track, in metres. */
const TRACK = 6;
/** Where A and B start along the track, in metres. */
const START_A = 0.5;
const START_B = TRACK * 0.55;
/** Seconds shown after the collision, at most (less if a block reaches the end). */
const AFTER = 2.5;
/** Inline height cap; the blocks grow past it in full view. */
const MAX_HEIGHT = 340;

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

/**
 * FIG.06b — block A slides into block B, at rest, with an adjustable mass
 * ratio and coefficient of restitution. Total momentum stays fixed; kinetic
 * energy drops unless the collision is elastic.
 *
 * The motion is a function of time, so a slider change redraws the same
 * moment with the new outcome. The run ends a moment after the collision, or
 * earlier if a block would leave the track.
 */
export function CollisionScene() {
  const t = useTranslations("scenes.collision");
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.55,
    maxHeight: MAX_HEIGHT,
    minHeight: 160,
    initialWidth: 640,
    // The track stretches to any width and the blocks grow with the height.
    fullView: "fill",
  });
  const [restitution, setRestitution] = useState(1);
  const [massRatio, setMassRatio] = useState(1); // m_B / m_A
  const playbackRef = useRef<ScenePlayback | null>(null);

  const massB = MASS_A * massRatio;
  const { vA: vAf, vB: vBf } = restitutionCollision(MASS_A, V_A0, massB, V_B0, restitution);

  // Text and offsets scale with `u`; the blocks and velocity arrows with `o`,
  // which also follows the canvas height.
  const scale = tokens.scale;
  const u = (n: number) => n * scale;
  const objectScale = Math.min(2.6, Math.max(scale, height / MAX_HEIGHT));
  const o = (n: number) => n * objectScale;

  const padX = u(40);
  const mToPx = (width - 2 * padX) / TRACK;
  const floorY = height * 0.45 + o(30);
  const sideA = o(20 + Math.cbrt(MASS_A) * 6);
  const sideB = o(20 + Math.cbrt(massB) * 6);
  const pxPerMps = o(20);
  const toPx = (x: number) => padX + x * mToPx;
  const toM = (px: number) => (px - padX) / mToPx;

  // Collision geometry, in metres: the blocks touch when their centres are
  // half a side each apart.
  const startA = Math.max(START_A, sideA / 2 / mToPx);
  const contactGap = (sideA + sideB) / 2 / mToPx;
  const tCol = Math.max(0, (START_B - startA - contactGap) / V_A0);
  const xACol = START_B - contactGap;

  // After the collision, stop before a block (or its arrow) leaves the track.
  let after = AFTER;
  if (vBf > 1e-9) {
    const maxB = toM(Math.min(width - padX - sideB / 2, width - u(8) - vBf * pxPerMps));
    after = Math.min(after, (maxB - START_B) / vBf);
  }
  if (vAf < -1e-9) {
    const minA = toM(Math.max(padX + sideA / 2, u(8) - vAf * pxPerMps));
    after = Math.min(after, (xACol - minA) / -vAf);
  }
  after = Math.max(0, after);
  const duration = tCol + after;

  /** Centres (m) and velocities at scene time `time`. */
  const stateAt = (time: number) => {
    if (time < tCol) {
      return { xA: startA + V_A0 * time, xB: START_B, vA: V_A0, vB: V_B0, hit: false };
    }
    const dt = Math.min(time, duration) - tCol;
    return { xA: xACol + vAf * dt, xB: START_B + vBf * dt, vA: vAf, vB: vBf, hit: true };
  };

  const blockHit = (px: number, py: number, cx: number, side: number, reach: number) =>
    Math.abs(px - cx) <= side / 2 + reach && py >= floorY - side - reach && py <= floorY + reach;

  // A block (or its arrow) means its velocity.
  const hover = useSceneHover(canvasRef, (px, py) => {
    const s = stateAt(playbackRef.current?.getTime() ?? 0);
    const reach = u(9);
    const arrowY = floorY - Math.max(sideA, sideB) - u(14);
    const onArrow = (cx: number, v: number) =>
      Math.abs(v) > 1e-3 &&
      Math.abs(py - arrowY) <= reach &&
      px >= Math.min(cx, cx + v * pxPerMps) - reach &&
      px <= Math.max(cx, cx + v * pxPerMps) + reach;
    const cxA = toPx(s.xA);
    const cxB = toPx(s.xB);
    if (blockHit(px, py, cxA, sideA, reach) || onArrow(cxA, s.vA)) return "vA";
    if (blockHit(px, py, cxB, sideB, reach) || onArrow(cxB, s.vB)) return "vB";
    return null;
  });
  const { activeKey } = hover;

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
      const cxA = toPx(s.xA);
      const cxB = toPx(s.xB);

      // Track
      ctx.strokeStyle = tokens.gridHeavy;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padX, floorY);
      ctx.lineTo(width - padX, floorY);
      ctx.stroke();

      // The point of contact, while restitution is pointed at.
      if (activeKey === "restitution") {
        const cx = toPx(START_B) - sideB / 2;
        ctx.save();
        ctx.strokeStyle = tokens.cyan;
        ctx.lineWidth = u(1.5);
        ctx.setLineDash([u(4), u(4)]);
        ctx.beginPath();
        ctx.moveTo(cx, floorY + u(4));
        ctx.lineTo(cx, floorY - Math.max(sideA, sideB) - u(28));
        ctx.stroke();
        ctx.restore();
        drawLabel(ctx, `e = ${restitution.toFixed(2)}`, cx, floorY - Math.max(sideA, sideB) - u(36), {
          bounds,
          color: tokens.cyan,
          align: "center",
          font: tokens.fontHudSmall,
          plate: tokens.bg,
          scale,
        });
      }

      // Blocks, sitting on the track; side grows with the cube root of the mass.
      ctx.fillStyle = tokens.amber;
      ctx.fillRect(cxA - sideA / 2, floorY - sideA, sideA, sideA);
      ctx.fillStyle = tokens.cyan;
      ctx.fillRect(cxB - sideB / 2, floorY - sideB, sideB, sideB);
      if (activeKey === "vA") {
        drawFocusRing(ctx, cxA, floorY - sideA / 2, sideA * 0.75 + u(4), tokens.amber, scale);
      }
      if (activeKey === "vB" || activeKey === "ratio") {
        drawFocusRing(ctx, cxB, floorY - sideB / 2, sideB * 0.75 + u(4), tokens.cyan, scale);
      }

      // Velocity arrows above the blocks.
      const arrowY = floorY - Math.max(sideA, sideB) - u(14);
      const drawVelocity = (cx: number, v: number, color: string, focused: boolean) => {
        if (Math.abs(v) < 1e-3) return;
        arrow(ctx, cx, cx + v * pxPerMps, arrowY, color, o(focused ? 3 : 2), o(6), o(4));
      };
      drawVelocity(cxA, s.vA, tokens.amber, activeKey === "vA");
      drawVelocity(cxB, s.vB, tokens.cyan, activeKey === "vB");

      // Masses under the blocks.
      const labelY = floorY + u(18);
      drawLabel(ctx, `m_A = ${MASS_A.toFixed(1)}`, cxA, labelY, {
        bounds,
        color: activeKey === "vA" ? tokens.textBright : tokens.textDim,
        align: "center",
        font: tokens.fontHud,
      });
      drawLabel(ctx, `m_B = ${massB.toFixed(2)}`, cxB, labelY, {
        bounds,
        color:
          activeKey === "ratio" ? tokens.cyan : activeKey === "vB" ? tokens.textBright : tokens.textDim,
        align: "center",
        font: tokens.fontHud,
      });
    },
  });
  // The hit test above runs between renders and needs the live clock.
  playbackRef.current = playback;

  const now = stateAt(playback.getTime());
  const pNow = pairP(MASS_A, now.vA, massB, now.vB);
  const keNow = pairKE(MASS_A, now.vA, massB, now.vB);
  const ke0 = pairKE(MASS_A, V_A0, massB, V_B0);
  const keLost = Math.max(0, 1 - keNow / ke0) * 100;
  // Never show "-0.00".
  const fmt = (v: number) => (Math.abs(v) < 0.005 ? "0.00" : v.toFixed(2));

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
                label: "v_A",
                value: `${fmt(now.vA)} m/s`,
                color: "var(--color-amber)",
                guideKey: "vA",
              },
              {
                label: "v_B",
                value: `${fmt(now.vB)} m/s`,
                color: "var(--color-cyan)",
                guideKey: "vB",
              },
              {
                label: "p_total",
                value: `${fmt(pNow)} kg·m/s`,
                guideKey: "momentum",
              },
              {
                label: "KE",
                value: `${keNow.toFixed(2)} J (−${keLost.toFixed(0)}%)`,
                guideKey: "energy",
              },
            ]}
          />
        </ScenePanel>
        <SceneControlGroup>
          <SceneSlider
            label={t("restitution")}
            guideKey="restitution"
            value={restitution}
            min={0}
            max={1}
            step={0.01}
            onChange={setRestitution}
            display={restitution.toFixed(2)}
          />
          <SceneSlider
            label={t("ratio")}
            guideKey="ratio"
            value={massRatio}
            min={0.25}
            max={4}
            step={0.05}
            onChange={setMassRatio}
            display={massRatio.toFixed(2)}
          />
        </SceneControlGroup>
      </div>
    </div>
  );
}
