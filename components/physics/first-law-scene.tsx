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
  drawLabel,
  syncCanvas,
  useSceneHover,
  useScenePlayback,
  useSceneSize,
  useSceneTokens,
} from "@/components/physics/_shared";
import { coastWithFriction } from "@/lib/physics/newton";

const G = 9.80665;
/** Initial push, in m/s. */
const V0 = 3.2;
/** Length of track shown, in metres; the block wraps round past its end. */
const TRACK_METRES = 12;
/** Inline height cap; objects grow past it in full view. */
const MAX_HEIGHT = 340;

interface Coast {
  /** Position on the visible track, metres in [0, TRACK_METRES). */
  x: number;
  /** Speed, m/s; 0 once friction has stopped the block. */
  v: number;
}

const atPush = (): Coast => ({ x: 0, v: V0 });

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
 * FIG.03a — a block pushed once and left to coast on a floor with friction.
 *
 * Friction can be changed while the block slides, so the motion is stepped
 * from its current speed (`simulation`) with the exact constant-deceleration
 * solution, instead of restarting the run.
 */
export function FirstLawScene() {
  const t = useTranslations("scenes.firstLaw");
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.55,
    maxHeight: MAX_HEIGHT,
    minHeight: 150,
    initialWidth: 640,
    // The track stretches to any width and the block grows with the height.
    fullView: "fill",
  });
  const [mu, setMu] = useState(0.15);
  const reducedMotion = useReducedMotion();
  const coastRef = useRef<Coast>(atPush());
  /** Friction was changed after the block stopped and has not been replayed. */
  const staleRunRef = useRef(false);

  // Text, offsets and hairlines scale with `u`; the block, its arrows and the
  // floor hatching with `o`, which also follows the canvas height.
  const scale = tokens.scale;
  const u = (n: number) => n * scale;
  const objectScale = Math.min(2.6, Math.max(scale, height / MAX_HEIGHT));
  const o = (n: number) => n * objectScale;

  const padX = u(30);
  const floorY = height - u(30) - o(30);
  const plotLeft = padX;
  const plotRight = width - padX;
  const trackW = plotRight - plotLeft;
  const toPx = (metres: number) => plotLeft + (metres / TRACK_METRES) * trackW;
  const blockW = o(44);
  const blockH = o(30);
  const blockY = floorY - blockH;
  const hatchLen = o(4 + mu * 18);
  const arrowY = blockY - o(10);
  const frictionY = blockY + blockH / 2;
  const velocityLen = (v: number) => o((v / V0) * 70 + 10);
  const frictionLen = o(Math.min(60, mu * 120));
  /** How far the push carries the block before friction stops it (m). */
  const stopDistance = mu > 0 ? (V0 * V0) / (2 * mu * G) : Infinity;

  // The block and its velocity arrow, the friction arrow behind it, or the
  // floor whose roughness the slider sets.
  const hover = useSceneHover(canvasRef, (px, py) => {
    const { x, v } = coastRef.current;
    const left = toPx(x) - blockW / 2;
    const reach = u(9);
    if (
      px >= left - reach &&
      px <= left + blockW + reach &&
      py >= blockY - reach &&
      py <= floorY + reach / 2
    ) {
      return "velocity";
    }
    if (
      v > 0.01 &&
      px >= left &&
      px <= left + blockW / 2 + velocityLen(v) + reach &&
      Math.abs(py - arrowY) <= reach
    ) {
      return "velocity";
    }
    if (
      mu > 0 &&
      v > 0.01 &&
      px <= left &&
      px >= left - frictionLen - reach &&
      Math.abs(py - frictionY) <= reach
    ) {
      return "friction";
    }
    if (px >= plotLeft && px <= plotRight && py >= floorY - u(4) && py <= floorY + hatchLen + u(6)) {
      return "mu";
    }
    return null;
  });
  const { activeKey } = hover;

  const playback = useScenePlayback({
    elementRef: containerRef,
    simulation: {
      step: (dt) => {
        const { x, v } = coastRef.current;
        if (v <= 0) return;
        const next = coastWithFriction(dt, v, mu, G);
        const moved = (x + next.x) % TRACK_METRES;
        coastRef.current = { x: moved < 0 ? moved + TRACK_METRES : moved, v: next.v };
      },
      reset: () => {
        coastRef.current = atPush();
      },
      isDone: () => coastRef.current.v <= 0,
    },
    draw: () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = syncCanvas(canvas, width, height);
      if (!ctx) return;
      const bounds = { width, height };
      const { x, v } = coastRef.current;

      // Floor, thickened downwards so the block keeps resting on its top edge.
      const floorWidth = Math.max(1, o(1));
      ctx.strokeStyle = tokens.axes;
      ctx.lineWidth = floorWidth;
      ctx.beginPath();
      ctx.moveTo(plotLeft, floorY + (floorWidth - 1) / 2);
      ctx.lineTo(plotRight, floorY + (floorWidth - 1) / 2);
      ctx.stroke();

      // Hatch marks under the floor: longer the rougher it is.
      const muFocused = activeKey === "mu";
      const hatchCount = 30;
      const hatchSpacing = trackW / hatchCount;
      ctx.strokeStyle = muFocused ? tokens.cyan : tokens.gridHeavy;
      ctx.lineWidth = muFocused ? u(1.5) : 1;
      ctx.beginPath();
      for (let i = 0; i <= hatchCount; i++) {
        const hx = plotLeft + i * hatchSpacing;
        ctx.moveTo(hx, floorY + floorWidth - 1);
        ctx.lineTo(hx - hatchLen * 0.5, floorY + floorWidth - 1 + hatchLen);
      }
      ctx.stroke();

      // Where the push runs out, shown while the stopping distance is pointed at.
      if (activeKey === "stopDistance" && stopDistance <= TRACK_METRES) {
        const sx = toPx(stopDistance);
        ctx.strokeStyle = tokens.red;
        ctx.lineWidth = u(1.5);
        ctx.setLineDash([u(4), u(3)]);
        ctx.beginPath();
        ctx.moveTo(sx, blockY - o(16));
        ctx.lineTo(sx, floorY);
        ctx.stroke();
        ctx.setLineDash([]);
        drawLabel(ctx, `${stopDistance.toFixed(2)} m`, sx, blockY - o(16) - u(10), {
          bounds,
          color: tokens.red,
          align: "center",
          font: tokens.fontHudSmall,
          plate: tokens.bg1,
          scale,
        });
      }

      const blockX = toPx(x) - blockW / 2;

      // Velocity arrow: length follows the current speed.
      if (v > 0.01) {
        const x0 = blockX + blockW / 2;
        const focused = activeKey === "velocity";
        arrow(ctx, x0, x0 + velocityLen(v), arrowY, tokens.cyan, o(focused ? 3 : 2), o(6), o(4));
      }

      // Friction arrow: backwards, longer the rougher the floor.
      if (mu > 0.001 && v > 0.01) {
        const focused = activeKey === "friction";
        arrow(
          ctx,
          blockX,
          blockX - frictionLen,
          frictionY,
          tokens.red,
          o(focused ? 3 : 2),
          o(6),
          o(4),
        );
      }

      // The block itself.
      ctx.fillStyle = tokens.textDim;
      ctx.beginPath();
      ctx.roundRect(blockX, blockY, blockW, blockH, o(3));
      ctx.fill();
    },
  });

  const { v } = coastRef.current;
  const stopped = v <= 0;

  // A new friction value never restarts a slide in progress: the next step
  // simply uses it. A block already at rest stays at rest — so once the reader
  // lets go of the slider, push it again to show the new floor.
  const changeMu = (next: number) => {
    if (next === mu) return;
    setMu(next);
    if (playback.status === "ended") staleRunRef.current = true;
  };
  const commitMu = () => {
    if (!staleRunRef.current) return;
    staleRunRef.current = false;
    if (playback.status !== "ended") return;
    if (reducedMotion) playback.seek(0);
    else playback.replay();
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
              {
                label: "v",
                value: `${v.toFixed(2)} m/s`,
                color: "var(--color-cyan)",
                guideKey: "velocity",
              },
              {
                label: t("friction"),
                value: `${(mu > 0 ? -mu * G : 0).toFixed(2)} m/s²`,
                color: "var(--color-red)",
                guideKey: "friction",
              },
              {
                label: t("stopDistance"),
                value: Number.isFinite(stopDistance) ? `${stopDistance.toFixed(2)} m` : "∞",
                guideKey: "stopDistance",
              },
            ]}
          />
        </ScenePanel>
        <SceneControlGroup>
          <SceneSlider
            label={t("mu")}
            guideKey="mu"
            value={mu}
            min={0}
            max={0.5}
            step={0.005}
            onChange={changeMu}
            onCommit={commitMu}
            display={mu.toFixed(3)}
          />
          <span className="text-xs text-[var(--color-fg-2)]">
            {mu === 0 ? t("noteFrictionless") : stopped ? t("noteRest") : t("noteSlowing")}
          </span>
        </SceneControlGroup>
      </div>
    </div>
  );
}
