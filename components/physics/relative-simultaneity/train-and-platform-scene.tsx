"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";

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

const W = 720;
const H = 360;

// Train parameters (in scene-pixel units; this is a thought experiment, not
// an SI simulation).
const TRAIN_HALF_LENGTH = 160; // px — front bolt at +160 from train center
const TRAIN_SPEED = 60; // px/s — well below the visual "c" so the geometry is honest
const LIGHT_SPEED_PX = 220; // px/s — animation-only; sets the amber pulse rate
const PLATFORM_Y = 230;
const TRAIN_Y = 170;

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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
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
  // Front bolt at x = +TRAIN_HALF_LENGTH; rear at x = -TRAIN_HALF_LENGTH.
  const frontBolt: PulseState = { xStrike: +TRAIN_HALF_LENGTH, tStrike: 0 };
  const rearBolt: PulseState = { xStrike: -TRAIN_HALF_LENGTH, tStrike: 0 };

  // Stationary platform observer P at x = 0 (origin).
  // Train passenger T's lab-frame position: x_T(t) = TRAIN_SPEED * t (starts
  // at origin at t = 0, moving in +x).
  const passengerX = (t: number) => TRAIN_SPEED * t;

  // Reception time for an observer with position x_obs(t) and a pulse from
  // x_strike at t_strike: |x_obs(t) − x_strike| = c (t − t_strike).
  // Stationary observer: t_recv = t_strike + |x_obs − x_strike| / c.
  // Moving observer: solve |v t − x_strike| = c (t − t_strike) for t.
  //   For passenger meeting front-bolt light moving in -x (since
  //   x_strike > 0, light moves in -x toward train center):
  //     v t − x_strike = -c t
  //     t (v + c) = x_strike  →  t = x_strike / (c + v).
  //   For rear-bolt light (x_strike < 0, light moves in +x):
  //     v t − x_strike = c t
  //     t (v − c) = x_strike  →  t = x_strike / (v − c)  (positive when both negative).
  const tRecvPlatformFront = TRAIN_HALF_LENGTH / LIGHT_SPEED_PX;
  const tRecvPlatformRear = TRAIN_HALF_LENGTH / LIGHT_SPEED_PX; // |−L| / c
  const tRecvPassengerFront =
    TRAIN_HALF_LENGTH / (LIGHT_SPEED_PX + TRAIN_SPEED);
  const tRecvPassengerRear =
    -TRAIN_HALF_LENGTH / (TRAIN_SPEED - LIGHT_SPEED_PX); // = L / (c − v)

  const tMax = Math.max(
    tRecvPlatformFront,
    tRecvPlatformRear,
    tRecvPassengerFront,
    tRecvPassengerRear,
  ) + 0.6; // hold a beat after the last reception

  useAnimationFrame({
    elementRef: canvasRef as unknown as React.RefObject<HTMLElement | null>,
    onFrame: (t) => {
      const tWrapped = t % tMax;
      setTNow(tWrapped);
      // Reset marks at loop boundary; otherwise commit on first crossing.
      setMarks((prev) => {
        // Loop reset: if t just wrapped to near zero, clear.
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
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const cx = W / 2;
    const xToPx = (xLab: number) => cx + xLab;

    // Platform rail
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(40, PLATFORM_Y + 22);
    ctx.lineTo(W - 40, PLATFORM_Y + 22);
    ctx.stroke();

    // Train (drawn at lab-frame center x_train_center = TRAIN_SPEED * tNow)
    const trainCenter = TRAIN_SPEED * tNow;
    const trainBodyX = xToPx(trainCenter - TRAIN_HALF_LENGTH);
    const trainBodyW = 2 * TRAIN_HALF_LENGTH;
    ctx.fillStyle = "rgba(255,106,222,0.10)";
    ctx.strokeStyle = "#FF6ADE";
    ctx.lineWidth = 1.5;
    ctx.fillRect(trainBodyX, TRAIN_Y - 26, trainBodyW, 52);
    ctx.strokeRect(trainBodyX, TRAIN_Y - 26, trainBodyW, 52);

    // Passenger T at train center
    ctx.fillStyle = "#FF6ADE";
    ctx.beginPath();
    ctx.arc(xToPx(passengerX(tNow)), TRAIN_Y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FF6ADE";
    ctx.font = "12px ui-monospace, monospace";
    ctx.fillText("T (passenger)", xToPx(passengerX(tNow)) + 10, TRAIN_Y + 4);

    // Platform observer P at origin
    ctx.fillStyle = "#67E8F9";
    ctx.beginPath();
    ctx.arc(xToPx(0), PLATFORM_Y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#67E8F9";
    ctx.fillText("P (platform)", xToPx(0) + 10, PLATFORM_Y + 4);

    // Bolt-strike markers (visible briefly at t = 0)
    if (tNow < 0.4) {
      ctx.strokeStyle = "#FFD66B";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(xToPx(frontBolt.xStrike), TRAIN_Y - 60);
      ctx.lineTo(xToPx(frontBolt.xStrike), TRAIN_Y - 26);
      ctx.moveTo(xToPx(rearBolt.xStrike), TRAIN_Y - 60);
      ctx.lineTo(xToPx(rearBolt.xStrike), TRAIN_Y - 26);
      ctx.stroke();
      ctx.fillStyle = "#FFD66B";
      ctx.fillText("⚡", xToPx(frontBolt.xStrike) - 5, TRAIN_Y - 64);
      ctx.fillText("⚡", xToPx(rearBolt.xStrike) - 5, TRAIN_Y - 64);
    }

    // Light pulses — expanding radii at speed c (LIGHT_SPEED_PX/s).
    // Front-bolt: pulse expands from xStrike at tStrike → outward in ±x at c.
    const elapsed = tNow - frontBolt.tStrike;
    if (elapsed > 0) {
      const r = elapsed * LIGHT_SPEED_PX;
      // Render two thin amber wavefronts at ±r from each strike location.
      ctx.strokeStyle = "rgba(255,214,107,0.85)";
      ctx.lineWidth = 1.5;

      // Front bolt — left-going + right-going wavefronts
      ctx.beginPath();
      ctx.moveTo(xToPx(frontBolt.xStrike - r), TRAIN_Y - 14);
      ctx.lineTo(xToPx(frontBolt.xStrike - r), TRAIN_Y + 50);
      ctx.moveTo(xToPx(frontBolt.xStrike + r), TRAIN_Y - 14);
      ctx.lineTo(xToPx(frontBolt.xStrike + r), TRAIN_Y + 50);
      // Rear bolt — same
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
      ctx.strokeStyle = "#67E8F9";
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
      ctx.strokeStyle = "#FF6ADE";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(xToPx(passengerX(tNow)), TRAIN_Y, 14, 0, Math.PI * 2);
      ctx.stroke();
    }

    // ─── Timeline strips below ─────────────────────────────────────────────
    const stripY1 = 290;
    const stripY2 = 322;
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
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.font = "10px ui-monospace, monospace";
        ctx.fillText(m.label, px - 6, y - 8);
      }
    };

    const platformMarks: TimelineMark[] = [];
    if (marks.platform.front !== null && marks.platform.rear !== null) {
      // Both arrive at same instant for platform observer.
      platformMarks.push({
        label: "F & R together",
        fraction: tRecvPlatformFront / tMax,
        color: "#FFD66B",
      });
    } else {
      if (marks.platform.front !== null) {
        platformMarks.push({
          label: "F",
          fraction: marks.platform.front / tMax,
          color: "#FFD66B",
        });
      }
      if (marks.platform.rear !== null) {
        platformMarks.push({
          label: "R",
          fraction: marks.platform.rear / tMax,
          color: "#FFD66B",
        });
      }
    }
    drawStrip(stripY1, "platform P sees:", "#67E8F9", platformMarks);

    const passengerMarks: TimelineMark[] = [];
    if (marks.passenger.front !== null) {
      passengerMarks.push({
        label: "F first",
        fraction: marks.passenger.front / tMax,
        color: "#FFD66B",
      });
    }
    if (marks.passenger.rear !== null) {
      passengerMarks.push({
        label: "R later",
        fraction: marks.passenger.rear / tMax,
        color: "#FFD66B",
      });
    }
    drawStrip(stripY2, "passenger T sees:", "#FF6ADE", passengerMarks);

    // HUD
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "11px ui-monospace, monospace";
    ctx.fillText(
      `t = ${tNow.toFixed(2)} s   train v = ${TRAIN_SPEED} px/s   c = ${LIGHT_SPEED_PX} px/s`,
      12,
      24,
    );
    ctx.fillStyle = "rgba(255,255,255,0.45)";
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
  ]);

  return (
    <div className="flex flex-col gap-2">
      <canvas
        ref={canvasRef}
        className="rounded-md border border-white/10 bg-[#0A0C12]"
      />
      <p className="font-mono text-xs text-white/55">
        Both observers measure light at the same speed c. The disagreement
        about ordering comes from the train moving while the light propagates,
        not from any bias in measurement.
      </p>
    </div>
  );
}
