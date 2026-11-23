"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import {
  SCENE_CANVAS_CLASS,
  SceneControls,
  ScenePanel,
  SceneReadout,
  SceneStage,
  drawLabel,
  syncCanvas,
  type ScenePlayback,
  useSceneHover,
  useScenePlayback,
  useSceneSize,
  useSceneTokens,
} from "@/components/physics/_shared";
import { averagePower, constantWork } from "@/lib/physics/energy";

const RATIO = 0.5;
/** Inline height cap; the crates and arrows grow past it in full view. */
const MAX_HEIGHT = 320;
/** Inline width at which the canvas reaches MAX_HEIGHT. */
const BASE_WIDTH = MAX_HEIGHT / RATIO;
/** Time each engine takes for the full distance, in seconds. */
const FAST_TIME = 3;
const SLOW_TIME = 7;
/** The push of each engine, in newtons, and the distance, in metres. */
const FORCE = 20;
const DISTANCE = 6;
/** Work each engine does over the run: the same for both. */
const WORK = constantWork(FORCE, DISTANCE);
const FAST_POWER = averagePower(WORK, FAST_TIME);
const SLOW_POWER = averagePower(WORK, SLOW_TIME);

type Lane = "fast" | "slow";
const LANE_KEY: Record<Lane, string> = { fast: "fastPower", slow: "slowPower" };

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const inRect = (px: number, py: number, r: Rect, reach: number) =>
  px >= r.x - reach && px <= r.x + r.w + reach && py >= r.y - reach && py <= r.y + r.h + reach;

/**
 * FIG.05c — two engines push identical crates across the same distance. The
 * slow one arrives later but does the same work; the fast one gets there
 * sooner. Power P = W / t is what differs, shown as a gauge on each track.
 *
 * Both start together; the fast crate arrives at FAST_TIME and waits while
 * the slow one finishes. Positions are a function of time, so the scene can
 * be scrubbed.
 */
export function PowerScene() {
  const t = useTranslations("scenes.power");
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: RATIO,
    maxHeight: MAX_HEIGHT,
    minHeight: 140,
    initialWidth: 640,
    // Two tracks stretch to any width; the crates grow with the canvas.
    fullView: "fill",
  });
  const playbackRef = useRef<ScenePlayback | null>(null);
  /** Where each gauge was last drawn (its row depends on the label width). */
  const metersRef = useRef<Record<Lane, Rect | null>>({ fast: null, slow: null });

  // Text, gauges and hairlines use `u`; the crates and arrows use `o`.
  const scale = tokens.scale;
  const u = (n: number) => n * scale;
  const objectScale = Math.min(
    2.6,
    Math.max(scale, Math.min(height / MAX_HEIGHT, width / BASE_WIDTH)),
  );
  const o = (n: number) => n * objectScale;

  const margin = u(40);
  // The force arrow trails each crate; keep its tail on the canvas.
  const trackLeft = Math.max(margin, o(30) + u(10));
  const trackRight = width - margin;
  const crateW = o(44);
  const crateH = o(24);
  const travel = Math.max(0, trackRight - trackLeft - crateW - o(4));
  const laneY: Record<Lane, number> = { fast: height * 0.32, slow: height * 0.72 };
  const laneTime: Record<Lane, number> = { fast: FAST_TIME, slow: SLOW_TIME };
  const meterLen = u(120);

  const crateXAt = (lane: Lane, time: number) =>
    trackLeft + Math.min(1, Math.max(0, time / laneTime[lane])) * travel;

  // A crate, its track or its gauge stands for that engine's power; either
  // force arrow for the work.
  const hover = useSceneHover(canvasRef, (px, py) => {
    const time = playbackRef.current?.getTime() ?? 0;
    const reach = u(9);
    for (const lane of ["fast", "slow"] as const) {
      const y = laneY[lane];
      const cx = crateXAt(lane, time);
      if (px >= cx - o(30) - reach && px < cx && Math.abs(py - (y - crateH / 2)) <= reach) return "work";
      if (inRect(px, py, { x: cx, y: y - crateH, w: crateW, h: crateH }, reach)) return LANE_KEY[lane];
      const meter = metersRef.current[lane];
      if (meter && inRect(px, py, meter, reach)) return LANE_KEY[lane];
      if (px >= margin && px <= trackRight && Math.abs(py - y) <= reach) return LANE_KEY[lane];
    }
    return null;
  });
  const { activeKey } = hover;

  const playback = useScenePlayback({
    elementRef: containerRef,
    duration: SLOW_TIME,
    draw: (time) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = syncCanvas(canvas, width, height);
      if (!ctx) return;
      const bounds = { width, height };
      const workFocused = activeKey === "work";

      const drawLane = (lane: Lane, label: string, power: number) => {
        const y = laneY[lane];
        const focused = activeKey === LANE_KEY[lane];

        // Track; the whole distance d is marked while the work is pointed at.
        ctx.strokeStyle = workFocused ? tokens.magenta : focused ? tokens.textDim : tokens.textFaint;
        ctx.lineWidth = workFocused || focused ? u(1.5) : 1;
        ctx.beginPath();
        ctx.moveTo(margin, y);
        ctx.lineTo(trackRight, y);
        ctx.stroke();

        // Crate
        const cx = crateXAt(lane, time);
        ctx.fillStyle = tokens.bg1;
        ctx.fillRect(cx, y - crateH, crateW, crateH);
        ctx.strokeStyle = focused ? tokens.textBright : tokens.textDim;
        ctx.lineWidth = o(focused ? 2.5 : 1.5);
        ctx.strokeRect(cx, y - crateH, crateW, crateH);

        // Force arrow on the back of the crate.
        const ay = y - crateH / 2;
        ctx.strokeStyle = tokens.magenta;
        ctx.fillStyle = tokens.magenta;
        ctx.lineWidth = o(workFocused ? 3 : 2);
        ctx.beginPath();
        ctx.moveTo(cx - o(30), ay);
        ctx.lineTo(cx - o(4), ay);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx - o(4), ay);
        ctx.lineTo(cx - o(10), ay - o(4));
        ctx.lineTo(cx - o(10), ay + o(4));
        ctx.closePath();
        ctx.fill();

        // Name of the engine under the track.
        const labelBox = drawLabel(ctx, label, margin, y + u(18), {
          bounds,
          color: focused ? tokens.textBright : tokens.textLabel,
          font: tokens.fontHudSmall,
          direction: "inherit",
        });

        // Power gauge at the right: the fast engine fills it. On a narrow
        // canvas it drops below the name instead of running into it.
        const meterX = trackRight - meterLen;
        const besideName = labelBox.x + labelBox.width + u(24) <= meterX;
        const meterY = besideName ? y + u(12) : labelBox.y + labelBox.height + u(6);
        const meterH = u(6);
        metersRef.current[lane] = { x: meterX - u(14), y: meterY, w: meterLen + u(14), h: meterH };
        ctx.fillStyle = tokens.magenta;
        ctx.fillRect(meterX, meterY, meterLen * (power / FAST_POWER), meterH);
        ctx.strokeStyle = focused ? tokens.textBright : tokens.textFaint;
        ctx.lineWidth = focused ? u(1.5) : 1;
        ctx.strokeRect(meterX, meterY, meterLen, meterH);
        drawLabel(ctx, "P", meterX - u(4), meterY + meterH / 2, {
          bounds,
          color: focused ? tokens.textBright : tokens.textLabel,
          align: "right",
          font: tokens.fontHudSmall,
        });
        if (focused) {
          drawLabel(ctx, `P = ${power.toFixed(1)} W`, trackRight, meterY - u(4), {
            bounds,
            color: tokens.textBright,
            align: "right",
            baseline: "bottom",
            font: tokens.fontHudSmall,
            plate: tokens.bg1,
            scale,
          });
        }
      };

      drawLane("fast", t("fastLabel"), FAST_POWER);
      drawLane("slow", t("slowLabel"), SLOW_POWER);

      // Formula banner
      drawLabel(ctx, workFocused ? `W = F · d = ${WORK.toFixed(0)} J` : "P = dW/dt", width / 2, u(20), {
        bounds,
        color: tokens.textDim,
        align: "center",
        font: tokens.fontHud,
        plate: workFocused ? tokens.bg1 : undefined,
        scale,
      });
    },
  });
  // The hit test above runs between renders and needs the live clock.
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
          <SceneControls playback={playback} scrub scrubKey="scrub" />
          <SceneReadout
            items={[
              {
                label: "W = F·d",
                value: `${WORK.toFixed(0)} J`,
                color: "var(--color-magenta)",
                guideKey: "work",
              },
              { label: t("fastPower"), value: `${FAST_POWER.toFixed(1)} W`, guideKey: "fastPower" },
              { label: t("slowPower"), value: `${SLOW_POWER.toFixed(1)} W`, guideKey: "slowPower" },
            ]}
          />
        </ScenePanel>
      </div>
    </div>
  );
}
