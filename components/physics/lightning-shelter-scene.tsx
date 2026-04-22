"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.7;
const MAX_HEIGHT = 420;

// Period of the strike-and-flow loop, seconds.
const STRIKE_PERIOD = 3.6;
const STRIKE_FLASH = 0.18;
const FLOW_DURATION = 2.0;

/**
 * A boxy car silhouette gets struck by a lightning bolt from above.
 * Charge floods the exterior shell — bright arcs sweep down the roof, fork
 * around the windows, race along the doors, and dissipate into the ground.
 * Inside the cabin: zero. Field arrows in the cabin stay at length zero
 * for the entire animation. The point of the topic, in one image.
 */
export function LightningShelterScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 640, height: 420 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          setSize({ width: w, height: Math.min(w * RATIO, MAX_HEIGHT) });
        }
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

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

      const cycle = t % STRIKE_PERIOD;
      const flashing = cycle < STRIKE_FLASH;
      const flowing = cycle < STRIKE_FLASH + FLOW_DURATION;
      // Progress of the flow phase, 0 → 1
      const flowP = Math.min(
        1,
        Math.max(0, (cycle - STRIKE_FLASH) / FLOW_DURATION),
      );

      // ── Ground line ──
      const groundY = height * 0.86;
      ctx.strokeStyle = colors.fg2;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(width, groundY);
      ctx.stroke();
      // Ground hatch
      ctx.strokeStyle = colors.fg3;
      for (let x = 0; x < width; x += 14) {
        ctx.beginPath();
        ctx.moveTo(x, groundY);
        ctx.lineTo(x - 8, groundY + 10);
        ctx.stroke();
      }

      // ── Car geometry ──
      const cx = width / 2;
      const carBaseY = groundY;
      const bodyW = Math.min(width * 0.42, 280);
      const bodyH = 56;
      const cabinW = bodyW * 0.62;
      const cabinH = 46;
      const bodyX = cx - bodyW / 2;
      const bodyTopY = carBaseY - bodyH;
      const cabinX = cx - cabinW / 2;
      const cabinTopY = bodyTopY - cabinH;

      // Cabin path (simplified hatchback): roof slopes a bit at the rear.
      const roofFrontX = cabinX + cabinW * 0.18;
      const roofRearX = cabinX + cabinW * 0.82;
      const cabinPath = new Path2D();
      cabinPath.moveTo(cabinX, bodyTopY);
      cabinPath.lineTo(roofFrontX, cabinTopY);
      cabinPath.lineTo(roofRearX, cabinTopY);
      cabinPath.lineTo(cabinX + cabinW, bodyTopY);
      cabinPath.closePath();

      const bodyPath = new Path2D();
      bodyPath.moveTo(bodyX, carBaseY);
      bodyPath.lineTo(bodyX, bodyTopY + 8);
      bodyPath.quadraticCurveTo(bodyX, bodyTopY, bodyX + 16, bodyTopY);
      bodyPath.lineTo(bodyX + bodyW - 16, bodyTopY);
      bodyPath.quadraticCurveTo(
        bodyX + bodyW,
        bodyTopY,
        bodyX + bodyW,
        bodyTopY + 8,
      );
      bodyPath.lineTo(bodyX + bodyW, carBaseY);
      bodyPath.closePath();

      // Body fill
      ctx.fillStyle = colors.bg1;
      ctx.fill(bodyPath);
      ctx.fill(cabinPath);
      ctx.strokeStyle = colors.fg1;
      ctx.lineWidth = 2;
      ctx.stroke(bodyPath);
      ctx.stroke(cabinPath);

      // Window divider (B-pillar) — purely decorative
      ctx.strokeStyle = colors.fg2;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, cabinTopY + 6);
      ctx.lineTo(cx, bodyTopY);
      ctx.stroke();

      // Wheels
      const wheelR = 14;
      ctx.fillStyle = colors.fg2;
      ctx.beginPath();
      ctx.arc(bodyX + bodyW * 0.22, carBaseY, wheelR, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(bodyX + bodyW * 0.78, carBaseY, wheelR, 0, Math.PI * 2);
      ctx.fill();

      // ── Lightning bolt from cloud to roof ──
      const cloudY = 18;
      const roofPeakX = cx;
      const roofPeakY = cabinTopY;
      drawBolt(
        ctx,
        roofPeakX + (Math.sin(t * 13.1) * 8),
        cloudY,
        roofPeakX,
        roofPeakY,
        flashing ? 1 : 0.45 * Math.max(0, 1 - flowP),
        flashing ? 3 : 1.8,
      );

      // ── Exterior current arcs sweeping along the body shell ──
      // Build a parametric path along: roof front → roof back → down rear
      // → along underside → up front → back to roof front. Animate a
      // travelling bright pulse along it during the flow phase.
      const shellPath: { x: number; y: number }[] = [
        { x: roofFrontX, y: cabinTopY },
        { x: roofRearX, y: cabinTopY },
        { x: cabinX + cabinW, y: bodyTopY },
        { x: bodyX + bodyW - 16, y: bodyTopY },
        { x: bodyX + bodyW, y: bodyTopY + 8 },
        { x: bodyX + bodyW, y: carBaseY },
        { x: bodyX, y: carBaseY },
        { x: bodyX, y: bodyTopY + 8 },
        { x: bodyX + 16, y: bodyTopY },
        { x: cabinX, y: bodyTopY },
        { x: roofFrontX, y: cabinTopY },
      ];

      if (flowing) {
        // Compute cumulative arc length
        const segLens: number[] = [];
        let total = 0;
        for (let i = 0; i < shellPath.length - 1; i++) {
          const a = shellPath[i]!;
          const b = shellPath[i + 1]!;
          const L = Math.hypot(b.x - a.x, b.y - a.y);
          segLens.push(L);
          total += L;
        }

        // Three travelling pulses staggered by 1/3
        for (let pulse = 0; pulse < 3; pulse++) {
          const phase = (flowP + pulse / 3) % 1;
          const sTarget = phase * total;
          const haloLen = total * 0.16; // pulse footprint along the path
          let accum = 0;
          for (let i = 0; i < shellPath.length - 1; i++) {
            const a = shellPath[i]!;
            const b = shellPath[i + 1]!;
            const L = segLens[i]!;
            const segStart = accum;
            const segEnd = accum + L;
            // Distance from this segment to the pulse centre
            const overlap =
              Math.max(0, Math.min(segEnd, sTarget + haloLen) -
                Math.max(segStart, sTarget - haloLen));
            if (overlap > 0) {
              const ratio = overlap / L;
              const alpha = 0.35 + 0.55 * ratio * (1 - flowP * 0.4);
              ctx.strokeStyle = `rgba(120, 220, 255, ${alpha})`;
              ctx.lineWidth = 3;
              ctx.shadowColor = "rgba(120, 220, 255, 0.8)";
              ctx.shadowBlur = 10;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
              ctx.shadowBlur = 0;
            }
            accum += L;
          }
        }

        // Ground discharge — small radial sparks at both wheels
        const sparkAlpha = 0.4 + 0.5 * Math.max(0, 1 - flowP);
        ctx.strokeStyle = `rgba(120, 220, 255, ${sparkAlpha})`;
        ctx.lineWidth = 1.5;
        for (const wx of [bodyX + bodyW * 0.22, bodyX + bodyW * 0.78]) {
          for (let k = 0; k < 4; k++) {
            const a = (k / 4) * Math.PI - Math.PI / 8;
            ctx.beginPath();
            ctx.moveTo(wx, carBaseY + wheelR - 2);
            ctx.lineTo(
              wx + Math.cos(a) * 14,
              carBaseY + wheelR + 4 + Math.sin(a) * 6,
            );
            ctx.stroke();
          }
        }
      }

      // ── Interior: zero E ──
      // A small "E = 0" badge inside the cabin, with stubby arrow stumps.
      const cabinMidY = (cabinTopY + bodyTopY) / 2;
      ctx.fillStyle = colors.fg1;
      ctx.font = "bold 13px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("E = 0", cx, cabinMidY);
      ctx.textBaseline = "alphabetic";
      ctx.textAlign = "left";

      // ── HUD ──
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.fillText("strike → exterior current → ground", 12, 18);
      ctx.textAlign = "right";
      ctx.fillText("inside the shell: |E| = 0", width - 12, 18);
      ctx.fillText(
        flashing ? "STRIKE" : flowing ? "FLOWING" : "SAFE",
        width - 12,
        36,
      );
      ctx.textAlign = "left";
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
    </div>
  );
}

function drawBolt(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  alpha: number,
  width: number,
) {
  if (alpha <= 0.01) return;
  // Build a jagged polyline between the two points with a few zigzags.
  const segments = 7;
  const dx = x1 - x0;
  const dy = y1 - y0;
  const points: { x: number; y: number }[] = [{ x: x0, y: y0 }];
  // Deterministic-ish zigzag — uses index, no randomness, so the bolt
  // shape is stable while only the alpha pulses.
  for (let i = 1; i < segments; i++) {
    const f = i / segments;
    const px = x0 + dx * f;
    const py = y0 + dy * f;
    const jitter = (i % 2 === 0 ? 1 : -1) * (12 - i);
    points.push({ x: px + jitter, y: py });
  }
  points.push({ x: x1, y: y1 });

  ctx.strokeStyle = `rgba(180, 230, 255, ${alpha})`;
  ctx.shadowColor = `rgba(180, 230, 255, ${alpha * 0.9})`;
  ctx.shadowBlur = 14;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(points[0]!.x, points[0]!.y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i]!.x, points[i]!.y);
  }
  ctx.stroke();
  ctx.shadowBlur = 0;
}
