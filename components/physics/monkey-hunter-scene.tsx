"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { G_EARTH } from "@/lib/physics/projectile";

const RATIO = 0.62;
const MAX_HEIGHT = 440;
const ACCENT = "#5BE9FF";
const MONKEY_COLOR = "#E4C27A";

/**
 * Classic "monkey and the hunter" demo.
 *
 * World layout:
 *   - Cannon at origin (0, 0)
 *   - Monkey hanging from a branch at (Dx, Dy), fixed once fired
 *   - Cannon is always aimed directly AT the monkey at the instant of firing
 *   - At t = 0 the dart leaves with speed v at that aim angle; simultaneously
 *     the monkey releases and starts free-falling from (Dx, Dy)
 *
 * Parallel free-fall of dart and monkey guarantees the dart hits the monkey
 * as long as the dart gets to x = Dx before either reaches the ground.
 */
export function MonkeyHunterScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [speed, setSpeed] = useState(16);
  const [isFiring, setIsFiring] = useState(false);
  const [size, setSize] = useState({ width: 640, height: 400 });
  const startRef = useRef<number | null>(null);

  // Fixed world geometry for the scene (tuned for a 0–12 m horizontal range)
  const monkey = { x: 9, y: 5 };
  const cannon = { x: 0, y: 0 };
  const dx = monkey.x - cannon.x;
  const dy = monkey.y - cannon.y;
  const aimAngle = Math.atan2(dy, dx);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          setSize({ width: w, height: Math.min(w * RATIO, MAX_HEIGHT) });
        }
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fire = () => {
    startRef.current = null;
    setIsFiring(true);
  };

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (t) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const { width, height } = size;
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }

      ctx.clearRect(0, 0, width, height);

      // World bounds
      const worldXMin = -1;
      const worldXMax = 13;
      const worldYMin = -0.5;
      const worldYMax = 7;
      const padL = 30;
      const padR = 30;
      const padT = 20;
      const padB = 30;
      const plotW = width - padL - padR;
      const plotH = height - padT - padB;
      const toPx = (x: number, y: number) => ({
        px: padL + ((x - worldXMin) / (worldXMax - worldXMin)) * plotW,
        py: padT + plotH - ((y - worldYMin) / (worldYMax - worldYMin)) * plotH,
      });

      // Ground line
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      const groundY = toPx(0, 0).py;
      ctx.beginPath();
      ctx.moveTo(padL, groundY);
      ctx.lineTo(padL + plotW, groundY);
      ctx.stroke();

      // Branch line (horizontal) above the monkey
      const branchY = toPx(0, monkey.y + 0.35).py;
      const branchXStart = toPx(monkey.x - 1.2, 0).px;
      const branchXEnd = toPx(monkey.x + 0.8, 0).px;
      ctx.strokeStyle = colors.fg2;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(branchXStart, branchY);
      ctx.lineTo(branchXEnd, branchY);
      ctx.stroke();
      ctx.lineWidth = 1;

      // Dashed aim line: cannon → original monkey position
      const aimEnd = toPx(monkey.x, monkey.y);
      const aimStart = toPx(cannon.x, cannon.y);
      ctx.strokeStyle = colors.fg3;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(aimStart.px, aimStart.py);
      ctx.lineTo(aimEnd.px, aimEnd.py);
      ctx.stroke();
      ctx.setLineDash([]);

      // Animation time
      if (!isFiring) {
        startRef.current = null;
      } else if (startRef.current === null) {
        startRef.current = t;
      }

      const tSim = isFiring && startRef.current !== null ? t - startRef.current : 0;

      // Dart trajectory (if fired)
      // dart: x = v·cosθ·t, y = v·sinθ·t − ½gt²
      const vx = speed * Math.cos(aimAngle);
      const vy = speed * Math.sin(aimAngle);

      // Time at which the dart crosses x = Dx
      const tCross = dx / vx;
      // Dart y at that moment
      const dartYAtCross = vy * tCross - 0.5 * G_EARTH * tCross * tCross;
      // Monkey y at the same moment (free fall from Dy)
      const monkeyYAtCross = monkey.y - 0.5 * G_EARTH * tCross * tCross;
      const interceptY = monkeyYAtCross; // same value since (vy·t − ½gt²) at x=Dx equals Dy − ½gt²  when vy = (Dy/Dx)·vx
      const willHit =
        tCross > 0 && interceptY > 0; // intercept happens above the ground

      // Freeze-after-hit time: clamp to tCross (if it hits), else dart ground time
      const dartGroundT =
        (vy + Math.sqrt(Math.max(vy * vy, 0))) / G_EARTH + 0.001;
      const monkeyGroundT = Math.sqrt((2 * monkey.y) / G_EARTH);
      const endT = willHit
        ? tCross
        : Math.min(dartGroundT, monkeyGroundT);
      const tClamped = Math.min(tSim, endT + 0.4);
      const tRender = Math.min(tClamped, endT);

      // Monkey position
      let monkeyX = monkey.x;
      let monkeyYWorld = monkey.y;
      if (isFiring) {
        monkeyYWorld = Math.max(0, monkey.y - 0.5 * G_EARTH * tRender * tRender);
      }
      const monkeyPx = toPx(monkeyX, monkeyYWorld);

      // Rope (while hanging or while falling, connect to where the monkey
      // was tied — but once released the rope drops with the monkey, so we
      // skip drawing the rope after fire).
      if (!isFiring) {
        ctx.strokeStyle = colors.fg2;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(monkeyPx.px, toPx(monkey.x, monkey.y + 0.35).py);
        ctx.lineTo(monkeyPx.px, monkeyPx.py - 10);
        ctx.stroke();
      }

      // Draw cannon — a rectangle rotated to the aim angle
      const cannonBase = toPx(cannon.x, cannon.y);
      ctx.save();
      ctx.translate(cannonBase.px, cannonBase.py);
      ctx.rotate(-aimAngle); // screen-y is inverted
      ctx.fillStyle = colors.fg2;
      ctx.fillRect(-4, -8, 34, 16);
      ctx.fillStyle = colors.fg3;
      ctx.fillRect(-10, -12, 10, 24);
      ctx.restore();

      // Draw monkey
      drawMonkey(ctx, monkeyPx.px, monkeyPx.py, MONKEY_COLOR);

      // Draw dart (if fired and still in flight)
      if (isFiring && tRender >= 0) {
        const dartX = vx * tRender;
        const dartY = vy * tRender - 0.5 * G_EARTH * tRender * tRender;
        if (dartY >= 0 || tRender <= endT) {
          const dartPx = toPx(dartX, Math.max(dartY, 0));
          // trail
          ctx.strokeStyle = ACCENT;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          const samples = 30;
          for (let i = 0; i <= samples; i++) {
            const tt = (i / samples) * tRender;
            const xx = vx * tt;
            const yy = vy * tt - 0.5 * G_EARTH * tt * tt;
            const p = toPx(xx, Math.max(yy, 0));
            if (i === 0) ctx.moveTo(p.px, p.py);
            else ctx.lineTo(p.px, p.py);
          }
          ctx.stroke();
          // dart
          ctx.fillStyle = ACCENT;
          ctx.beginPath();
          ctx.arc(dartPx.px, dartPx.py, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // HUD text
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillStyle = colors.fg2;
      ctx.fillText(
        `aim angle  ${((aimAngle * 180) / Math.PI).toFixed(1)}°`,
        padL + 6,
        padT + 12,
      );
      ctx.fillText(
        `speed      ${speed.toFixed(1)} m/s`,
        padL + 6,
        padT + 26,
      );
      if (isFiring) {
        ctx.fillStyle = willHit ? ACCENT : "#E29FFF";
        const msg = willHit
          ? tRender >= endT
            ? "HIT — dart intercepts monkey"
            : "dart in flight — monkey in free fall"
          : "monkey falls to ground before dart arrives";
        ctx.fillText(msg, padL + 6, padT + 42);
      } else {
        ctx.fillStyle = colors.fg2;
        ctx.fillText("press FIRE — monkey drops at the trigger", padL + 6, padT + 42);
      }

      // Auto-end fire sequence after a short pause past endT
      if (isFiring && tSim > endT + 1.2) {
        setIsFiring(false);
      }
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-2 flex flex-col gap-2 px-2">
        <div className="flex items-center gap-3">
          <label className="w-20 text-sm text-[var(--color-fg-3)]">speed</label>
          <input
            type="range"
            min={6}
            max={28}
            step={0.1}
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="flex-1 accent-[#5BE9FF]"
          />
          <span className="w-20 text-right text-sm font-mono text-[var(--color-fg-1)]">
            {speed.toFixed(1)} m/s
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fire}
            disabled={isFiring}
            className="rounded border border-[#5BE9FF] px-3 py-1 text-xs font-mono text-[#5BE9FF] transition hover:bg-[#5BE9FF]/10 disabled:opacity-50"
          >
            fire
          </button>
          <span className="text-xs text-[var(--color-fg-3)]">
            the cannon is always aimed straight at the monkey; change the speed
            and try again
          </span>
        </div>
      </div>
    </div>
  );
}

function drawMonkey(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
) {
  ctx.fillStyle = color;
  // body
  ctx.beginPath();
  ctx.ellipse(x, y + 2, 9, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  // head
  ctx.beginPath();
  ctx.arc(x, y - 9, 6, 0, Math.PI * 2);
  ctx.fill();
  // ears
  ctx.beginPath();
  ctx.arc(x - 6, y - 10, 2.5, 0, Math.PI * 2);
  ctx.arc(x + 6, y - 10, 2.5, 0, Math.PI * 2);
  ctx.fill();
  // face
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.beginPath();
  ctx.arc(x - 2, y - 9, 0.9, 0, Math.PI * 2);
  ctx.arc(x + 2, y - 9, 0.9, 0, Math.PI * 2);
  ctx.fill();
}
