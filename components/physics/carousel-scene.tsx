"use client";

import { useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const CANVAS_W = 360;
const CANVAS_H = 360;
const TURNTABLE_R = 150; // px
const RIDER_R = 90; // px from centre — where the rider sits
const BALL_SPEED = 60; // px/s outward (in lab frame)
const OMEGA = 0.9; // rad/s (carousel spin rate)
const PERIOD_LAB = 4.0; // seconds before the ball is reset

const CYAN = "#6FB8C6";
const MAGENTA = "#FF6ADE";

type Frame = "rider" | "outside";

export function CarouselScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [frame, setFrame] = useState<Frame>("outside");
  const frameRef = useRef<Frame>(frame);
  frameRef.current = frame;

  // Trail of ball positions (in canvas-space) for the active frame view.
  const trailRef = useRef<Array<{ x: number; y: number }>>([]);
  const lastFrameKey = useRef<Frame>(frame);

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (t) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== CANVAS_W * dpr || canvas.height !== CANVAS_H * dpr) {
        canvas.width = CANVAS_W * dpr;
        canvas.height = CANVAS_H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      const cx = CANVAS_W / 2;
      const cy = CANVAS_H / 2;
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      // Reset trail when switching frame mid-flight
      if (lastFrameKey.current !== frameRef.current) {
        trailRef.current = [];
        lastFrameKey.current = frameRef.current;
      }

      // Time within one ball flight
      const tFlight = t % PERIOD_LAB;
      // Reset trail when flight restarts
      if (tFlight < 0.05) {
        trailRef.current = [];
      }

      // Carousel angle in lab frame
      const carouselAngle = OMEGA * t;
      // Ball position in lab frame: travels along +x at constant velocity from origin
      const ballLabX = BALL_SPEED * tFlight;
      const ballLabY = 0;
      // Rider position in lab frame: fixed at +x of the rotating turntable
      const riderLabX = RIDER_R * Math.cos(carouselAngle);
      const riderLabY = RIDER_R * Math.sin(carouselAngle);

      let drawCarouselAngle = carouselAngle;
      let drawBallX: number, drawBallY: number;
      let drawRiderX: number, drawRiderY: number;

      if (frameRef.current === "outside") {
        // Lab view: ball goes straight, carousel spins
        drawBallX = ballLabX;
        drawBallY = ballLabY;
        drawRiderX = riderLabX;
        drawRiderY = riderLabY;
      } else {
        // Rider view: rotate everything by -carouselAngle so the carousel is fixed
        const cosA = Math.cos(-carouselAngle);
        const sinA = Math.sin(-carouselAngle);
        drawBallX = ballLabX * cosA - ballLabY * sinA;
        drawBallY = ballLabX * sinA + ballLabY * cosA;
        drawRiderX = RIDER_R; // fixed
        drawRiderY = 0;
        drawCarouselAngle = 0; // carousel doesn't appear to spin in rider frame
      }

      // Append to trail (in canvas-space)
      trailRef.current.push({ x: cx + drawBallX, y: cy + drawBallY });
      if (trailRef.current.length > 240) trailRef.current.shift();

      // --- Draw turntable ---
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(drawCarouselAngle);

      // Outer rim
      ctx.strokeStyle = colors.fg2;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, TURNTABLE_R, 0, Math.PI * 2);
      ctx.stroke();

      // Filled disc (subtle)
      ctx.fillStyle = colors.bg1;
      ctx.beginPath();
      ctx.arc(0, 0, TURNTABLE_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = colors.fg2;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, TURNTABLE_R, 0, Math.PI * 2);
      ctx.stroke();

      // Spokes (8) — make rotation visible in outside view
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      for (let k = 0; k < 8; k++) {
        const a = (k * Math.PI) / 4;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(TURNTABLE_R * Math.cos(a), TURNTABLE_R * Math.sin(a));
        ctx.stroke();
      }

      // Reference radial line (cyan) so the rider's direction is obvious
      ctx.strokeStyle = CYAN;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(TURNTABLE_R, 0);
      ctx.stroke();

      ctx.restore();

      // --- Trail (ball path in current frame) ---
      if (trailRef.current.length > 1) {
        ctx.strokeStyle = MAGENTA;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.55;
        ctx.beginPath();
        ctx.moveTo(trailRef.current[0]!.x, trailRef.current[0]!.y);
        for (let i = 1; i < trailRef.current.length; i++) {
          ctx.lineTo(trailRef.current[i]!.x, trailRef.current[i]!.y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // --- Rider (cyan dot) ---
      ctx.fillStyle = CYAN;
      ctx.shadowColor = "rgba(111,184,198,0.55)";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(cx + drawRiderX, cy + drawRiderY, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // --- Ball (magenta dot) ---
      ctx.fillStyle = MAGENTA;
      ctx.shadowColor = "rgba(255,106,222,0.55)";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(cx + drawBallX, cy + drawBallY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Centre marker
      ctx.fillStyle = colors.fg1;
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();
    },
  });

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: CANVAS_W, height: CANVAS_H }}
        className="mx-auto block"
      />
      <div className="pointer-events-none absolute right-2 top-2">
        <div className="rounded-sm border border-[var(--color-fg-4)] bg-[var(--color-bg-0)]/70 px-2 py-1 font-mono text-[10px] leading-relaxed text-[var(--color-fg-1)] backdrop-blur-sm">
          <div>Ω = {OMEGA.toFixed(2)} rad/s</div>
          <div>r_rider = {(RIDER_R / 100).toFixed(2)} m</div>
          <div className="text-[var(--color-fg-3)]">
            frame: <span style={{ color: frame === "rider" ? MAGENTA : CYAN }}>{frame}</span>
          </div>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-3 px-2">
        <button
          type="button"
          onClick={() => setFrame((f) => (f === "outside" ? "rider" : "outside"))}
          className="font-mono text-xs uppercase tracking-wider text-[var(--color-fg-3)] hover:text-[var(--color-fg-1)]"
        >
          switch to {frame === "outside" ? "rider's view" : "outside view"}
        </button>
      </div>
    </div>
  );
}
