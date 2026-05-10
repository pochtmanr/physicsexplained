"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import {
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  hexToRgba,
  useSceneSize,
  useSceneTokens,
} from "@/components/physics/_shared/scene-tokens";

/**
 * FIG.05a — Train-and-platform thought experiment.
 *
 * A train moves to the right past a stationary platform observer P at the
 * origin. Two lightning bolts strike the front and rear of the train
 * SIMULTANEOUSLY in the platform frame. Light from each bolt then propagates
 * outward at c (amber pulses) toward the platform observer at center and
 * toward the train passenger T at the train center.
 *
 *   • Platform observer P sees the two pulses arrive at the same instant —
 *     she concludes the bolts struck simultaneously.
 *   • Passenger T is moving toward the front-bolt's pulse (and away from
 *     the rear-bolt's pulse), so the front-bolt light reaches her first.
 *     She concludes the front-bolt struck first.
 *
 * Two timeline strips below display "events the platform marked" and
 * "events the passenger marked" — they show the same physical events
 * indexed in different orders, side by side.
 *
 * Palette: cyan = platform frame; magenta = train (boosted) frame;
 * amber = light pulse.
 */

// Train parameters (in scene-pixel units; this is a thought experiment, not
// an SI simulation).
const TRAIN_HALF_LENGTH = 160; // px — front bolt at +160 from train center
const TRAIN_SPEED = 60; // px/s — well below the visual "c" so the geometry is honest
const LIGHT_SPEED_PX = 220; // px/s — animation-only; sets the amber pulse rate
const PLATFORM_Y_FRAC = 0.64;
const TRAIN_Y_FRAC = 0.47;

interface PulseState {
  // Lab-frame strike position of the bolt
  xStrike: number;
  // Lab-frame time of strike (seconds since loop start)
  tStrike: number;
}

interface TimelineMark {
  label: string;
  fraction: number; // 0..1 along the strip
  color: string;
}

export function TrainAndPlatformScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const { width: W, height: H } = useSceneSize(containerRef, {
    ratio: 0.5,
    maxHeight: SCENE_HEIGHT_DEFAULT,
  });
  const [tNow, setTNow] = useState(0);
  // Two reception markers per observer; once filled, they freeze.
  const [marks, setMarks] = useState<{
    platform: { front: number | null; rear: number | null };
    passenger: { front: number | null; rear: number | null };
  }>({
    platform: { front: null, rear: null },
    passenger: { front: null, rear: null },
  });

  // The bolts strike at lab time t = 0 with the train center at x = 0.
  const frontBolt: PulseState = { xStrike: +TRAIN_HALF_LENGTH, tStrike: 0 };
  const rearBolt: PulseState = { xStrike: -TRAIN_HALF_LENGTH, tStrike: 0 };

  const passengerX = (t: number) => TRAIN_SPEED * t;

  const tRecvPlatformFront = TRAIN_HALF_LENGTH / LIGHT_SPEED_PX;
  const tRecvPlatformRear = TRAIN_HALF_LENGTH / LIGHT_SPEED_PX;
  const tRecvPassengerFront =
    TRAIN_HALF_LENGTH / (LIGHT_SPEED_PX + TRAIN_SPEED);
  const tRecvPassengerRear =
    -TRAIN_HALF_LENGTH / (TRAIN_SPEED - LIGHT_SPEED_PX);

  const tMax =
    Math.max(
      tRecvPlatformFront,
      tRecvPlatformRear,
      tRecvPassengerFront,
      tRecvPassengerRear,
    ) + 0.6;

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (t) => {
      const tWrapped = t % tMax;
      setTNow(tWrapped);
      setMarks((prev) => {
        if (tWrapped < 0.05) {
          return {
            platform: { front: null, rear: null },
            passenger: { front: null, rear: null },
          };
        }
        const next = {
          platform: { ...prev.platform },
          passenger: { ...prev.passenger },
        };
        if (next.platform.front === null && tWrapped >= tRecvPlatformFront) {
          next.platform.front = tRecvPlatformFront;
        }
        if (next.platform.rear === null && tWrapped >= tRecvPlatformRear) {
          next.platform.rear = tRecvPlatformRear;
        }
        if (next.passenger.front === null && tWrapped >= tRecvPassengerFront) {
          next.passenger.front = tRecvPassengerFront;
        }
        if (next.passenger.rear === null && tWrapped >= tRecvPassengerRear) {
          next.passenger.rear = tRecvPassengerRear;
        }
        return next;
      });
    },
  });

  // Drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, W, H);
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = tokens.bg;
    ctx.fillRect(0, 0, W, H);

    const PLATFORM_Y = H * PLATFORM_Y_FRAC;
    const TRAIN_Y = H * TRAIN_Y_FRAC;
    const cx = W / 2;
    const xToPx = (xLab: number) => cx + xLab;

    // Platform rail
    ctx.strokeStyle = hexToRgba(tokens.textFaint, 0.7);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(40, PLATFORM_Y + 22);
    ctx.lineTo(W - 40, PLATFORM_Y + 22);
    ctx.stroke();

    // Train (drawn at lab-frame center x_train_center = TRAIN_SPEED * tNow)
    const trainCenter = TRAIN_SPEED * tNow;
    const trainBodyX = xToPx(trainCenter - TRAIN_HALF_LENGTH);
    const trainBodyW = 2 * TRAIN_HALF_LENGTH;
    ctx.fillStyle = hexToRgba(tokens.magenta, 0.1);
    ctx.strokeStyle = tokens.magenta;
    ctx.lineWidth = 1.5;
    ctx.fillRect(trainBodyX, TRAIN_Y - 26, trainBodyW, 52);
    ctx.strokeRect(trainBodyX, TRAIN_Y - 26, trainBodyW, 52);

    // Passenger T at train center
    ctx.fillStyle = tokens.magenta;
    ctx.beginPath();
    ctx.arc(xToPx(passengerX(tNow)), TRAIN_Y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = tokens.magenta;
    ctx.font = "12px ui-monospace, monospace";
    ctx.fillText("T (passenger)", xToPx(passengerX(tNow)) + 10, TRAIN_Y + 4);

    // Platform observer P at origin
    ctx.fillStyle = tokens.cyan;
    ctx.beginPath();
    ctx.arc(xToPx(0), PLATFORM_Y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = tokens.cyan;
    ctx.fillText("P (platform)", xToPx(0) + 10, PLATFORM_Y + 4);

    // Bolt-strike markers (visible briefly at t = 0)
    if (tNow < 0.4) {
      ctx.strokeStyle = tokens.amber;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(xToPx(frontBolt.xStrike), TRAIN_Y - 60);
      ctx.lineTo(xToPx(frontBolt.xStrike), TRAIN_Y - 26);
      ctx.moveTo(xToPx(rearBolt.xStrike), TRAIN_Y - 60);
      ctx.lineTo(xToPx(rearBolt.xStrike), TRAIN_Y - 26);
      ctx.stroke();
      ctx.fillStyle = tokens.amber;
      ctx.fillText("⚡", xToPx(frontBolt.xStrike) - 5, TRAIN_Y - 64);
      ctx.fillText("⚡", xToPx(rearBolt.xStrike) - 5, TRAIN_Y - 64);
    }

    // Light pulses — expanding radii at speed c (LIGHT_SPEED_PX/s).
    const elapsed = tNow - frontBolt.tStrike;
    if (elapsed > 0) {
      const r = elapsed * LIGHT_SPEED_PX;
      ctx.strokeStyle = hexToRgba(tokens.amber, 0.85);
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.moveTo(xToPx(frontBolt.xStrike - r), TRAIN_Y - 14);
      ctx.lineTo(xToPx(frontBolt.xStrike - r), TRAIN_Y + 50);
      ctx.moveTo(xToPx(frontBolt.xStrike + r), TRAIN_Y - 14);
      ctx.lineTo(xToPx(frontBolt.xStrike + r), TRAIN_Y + 50);
      ctx.moveTo(xToPx(rearBolt.xStrike - r), TRAIN_Y - 14);
      ctx.lineTo(xToPx(rearBolt.xStrike - r), TRAIN_Y + 50);
      ctx.moveTo(xToPx(rearBolt.xStrike + r), TRAIN_Y - 14);
      ctx.lineTo(xToPx(rearBolt.xStrike + r), TRAIN_Y + 50);
      ctx.stroke();
    }

    // Reception flash at platform P
    if (
      Math.abs(tNow - tRecvPlatformFront) < 0.08 ||
      Math.abs(tNow - tRecvPlatformRear) < 0.08
    ) {
      ctx.strokeStyle = tokens.cyan;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(xToPx(0), PLATFORM_Y, 14, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Reception flash at passenger T
    if (
      Math.abs(tNow - tRecvPassengerFront) < 0.08 ||
      Math.abs(tNow - tRecvPassengerRear) < 0.08
    ) {
      ctx.strokeStyle = tokens.magenta;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(xToPx(passengerX(tNow)), TRAIN_Y, 14, 0, Math.PI * 2);
      ctx.stroke();
    }

    // ─── Timeline strips below ─────────────────────────────────────────────
    const stripY1 = H * 0.83;
    const stripY2 = H * 0.93;
    const stripX0 = 90;
    const stripX1 = W - 40;
    const stripW = stripX1 - stripX0;

    const drawStrip = (
      y: number,
      label: string,
      color: string,
      timelineMarks: TimelineMark[],
    ) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(stripX0, y);
      ctx.lineTo(stripX1, y);
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.font = "11px ui-monospace, monospace";
      ctx.fillText(label, 12, y + 4);
      for (const m of timelineMarks) {
        const px = stripX0 + m.fraction * stripW;
        ctx.fillStyle = m.color;
        ctx.beginPath();
        ctx.arc(px, y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = tokens.textBright;
        ctx.font = "10px ui-monospace, monospace";
        ctx.fillText(m.label, px - 6, y - 8);
      }
    };

    const platformMarks: TimelineMark[] = [];
    if (marks.platform.front !== null && marks.platform.rear !== null) {
      platformMarks.push({
        label: "F & R together",
        fraction: tRecvPlatformFront / tMax,
        color: tokens.amber,
      });
    } else {
      if (marks.platform.front !== null) {
        platformMarks.push({
          label: "F",
          fraction: marks.platform.front / tMax,
          color: tokens.amber,
        });
      }
      if (marks.platform.rear !== null) {
        platformMarks.push({
          label: "R",
          fraction: marks.platform.rear / tMax,
          color: tokens.amber,
        });
      }
    }
    drawStrip(stripY1, "platform P sees:", tokens.cyan, platformMarks);

    const passengerMarks: TimelineMark[] = [];
    if (marks.passenger.front !== null) {
      passengerMarks.push({
        label: "F first",
        fraction: marks.passenger.front / tMax,
        color: tokens.amber,
      });
    }
    if (marks.passenger.rear !== null) {
      passengerMarks.push({
        label: "R later",
        fraction: marks.passenger.rear / tMax,
        color: tokens.amber,
      });
    }
    drawStrip(stripY2, "passenger T sees:", tokens.magenta, passengerMarks);

    // HUD
    ctx.fillStyle = tokens.textDim;
    ctx.font = "11px ui-monospace, monospace";
    ctx.fillText(
      `t = ${tNow.toFixed(2)} s   train v = ${TRAIN_SPEED} px/s   c = ${LIGHT_SPEED_PX} px/s`,
      12,
      24,
    );
    ctx.fillStyle = tokens.textFaint;
    ctx.fillText(
      "platform-frame: bolts strike both ends at t = 0, simultaneously",
      12,
      H - 6,
    );
  }, [
    tNow,
    marks,
    frontBolt.tStrike,
    frontBolt.xStrike,
    rearBolt.xStrike,
    tRecvPlatformFront,
    tRecvPlatformRear,
    tRecvPassengerFront,
    tRecvPassengerRear,
    tMax,
    tokens,
    W,
    H,
  ]);

  return (
    <div ref={containerRef} className="flex w-full flex-col gap-2">
      <canvas
        ref={canvasRef}
        style={{ width: W, height: H, display: "block" }}
        className={SCENE_CANVAS_CLASS}
      />
      <p className="font-mono text-xs text-[var(--color-fg-3)]">
        Both observers measure light at the same speed c. The disagreement
        about ordering comes from the train moving while the light propagates,
        not from any bias in measurement.
      </p>
    </div>
  );
}
