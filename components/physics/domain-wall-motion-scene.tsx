"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.58;
const MAX_HEIGHT = 420;

/**
 * Zoomed-in view of a single domain wall, with slider-controlled applied H.
 *
 *   - The wall sits between a magenta (+) half and a cyan (−) half.
 *   - A sparse array of pinning sites (small amber dots) attracts the wall.
 *   - For |H| below a threshold the wall bulges reversibly — magenta domain
 *     grows slightly into the cyan side — and snaps back when H releases.
 *   - Once |H| crosses the pinning threshold the wall breaks free of the
 *     current pin and jumps one step rightward (or leftward), snapping onto
 *     the next pinning site. That is a Barkhausen jump, the microscopic
 *     origin of hysteresis loss.
 *
 * A small HUD reports H, the wall's current integer pin column, and whether
 * the wall is in a "bulging / reversible" or "jumping / irreversible" regime.
 */
export function DomainWallMotionScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 640, height: 380 });
  const [H, setH] = useState(0);

  // Wall state: which pin column it is anchored at, and continuous bulge.
  const wallRef = useRef({
    pin: 4, // initial pin column (0..N_PINS-1)
    bulge: 0, // current fractional displacement from pin (−1..+1)
    lastJumpT: -10,
    prevH: 0,
  });

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

      // ── Dynamics ──
      // Pinning thresholds (deterministic, varied) — one per pin column.
      // Below threshold: wall bulges linearly; above: wall jumps one pin.
      const N_PINS = 9;
      const thresholds = [0.25, 0.35, 0.2, 0.4, 0.28, 0.45, 0.22, 0.38, 0.3];
      const state = wallRef.current;

      // Relax bulge toward H (proportional response), capped at threshold.
      const pinThresh = thresholds[state.pin]! ?? 0.3;
      const target = H;
      // Critically damped first-order relaxation.
      state.bulge += (target - state.bulge) * 0.25;

      // Jump detection
      if (state.bulge > pinThresh && state.pin < N_PINS - 1) {
        state.pin += 1;
        state.bulge = 0;
        state.lastJumpT = t;
      } else if (state.bulge < -pinThresh && state.pin > 0) {
        state.pin -= 1;
        state.bulge = 0;
        state.lastJumpT = t;
      }
      state.prevH = H;

      // ── Layout ──
      const padL = 40;
      const padR = 30;
      const padT = 34;
      const padB = 50;
      const plotW = width - padL - padR;
      const plotH = height - padT - padB;

      // Domain slab frame
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.strokeRect(padL, padT, plotW, plotH);

      // Pin columns — evenly spaced
      const pinXs: number[] = [];
      for (let i = 0; i < N_PINS; i++) {
        pinXs.push(padL + ((i + 0.5) / N_PINS) * plotW);
      }

      // Current wall x-position
      const pinCurX = pinXs[state.pin]!;
      const pinSpacing = plotW / N_PINS;
      const wallX = pinCurX + state.bulge * pinSpacing * 0.5;

      // Fill magenta (left) and cyan (right) halves up to the wall
      ctx.fillStyle = "rgba(255, 106, 222, 0.14)";
      ctx.fillRect(padL, padT, wallX - padL, plotH);
      ctx.fillStyle = "rgba(111, 184, 198, 0.14)";
      ctx.fillRect(wallX, padT, plotW - (wallX - padL), plotH);

      // Arrows on each side
      const arrowCols = 4;
      const arrowRows = 3;
      const arrowLen = Math.min(
        (plotW / N_PINS) * 0.8,
        plotH / arrowRows * 0.7,
      );
      // Magenta (+) arrows — left half, pointing up
      for (let r = 0; r < arrowRows; r++) {
        for (let c = 0; c < arrowCols; c++) {
          const fx = padL + ((c + 0.5) / (arrowCols + 1)) * (wallX - padL);
          const fy = padT + ((r + 0.5) / arrowRows) * plotH;
          drawArrow(
            ctx,
            fx,
            fy + arrowLen / 2,
            fx,
            fy - arrowLen / 2,
            "#FF6ADE",
            1.6,
          );
        }
      }
      // Cyan (−) arrows — right half, pointing down
      for (let r = 0; r < arrowRows; r++) {
        for (let c = 0; c < arrowCols; c++) {
          const fx =
            wallX + ((c + 0.5) / (arrowCols + 1)) * (plotW - (wallX - padL));
          const fy = padT + ((r + 0.5) / arrowRows) * plotH;
          drawArrow(
            ctx,
            fx,
            fy - arrowLen / 2,
            fx,
            fy + arrowLen / 2,
            "#6FB8C6",
            1.6,
          );
        }
      }

      // Pinning sites — small amber circles on the midline
      const midY = padT + plotH / 2;
      for (let i = 0; i < N_PINS; i++) {
        const px = pinXs[i]!;
        ctx.fillStyle =
          i === state.pin
            ? "rgba(255, 214, 107, 0.95)"
            : "rgba(255, 214, 107, 0.4)";
        ctx.beginPath();
        ctx.arc(px, midY, i === state.pin ? 5 : 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Domain wall — thick amber line
      const sinceJump = t - state.lastJumpT;
      const jumpFlash = sinceJump < 0.5 ? 1 - sinceJump / 0.5 : 0;
      ctx.strokeStyle = `rgba(255, 214, 107, ${0.85 + jumpFlash * 0.15})`;
      ctx.lineWidth = 3 + jumpFlash * 3;
      ctx.shadowColor = "rgba(255, 214, 107, 0.6)";
      ctx.shadowBlur = jumpFlash * 16;
      ctx.beginPath();
      ctx.moveTo(wallX, padT);
      ctx.lineTo(wallX, padT + plotH);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Regime indicator
      const inJumpRegime = Math.abs(state.bulge) > pinThresh * 0.9;
      const regime = inJumpRegime ? "irreversible (Barkhausen jump)" : "reversible (elastic bulge)";

      // Labels
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText("+M domain", padL + (wallX - padL) / 2, padT + 14);
      ctx.fillText("−M domain", wallX + (plotW - (wallX - padL)) / 2, padT + 14);

      ctx.fillStyle = colors.fg2;
      ctx.textAlign = "center";
      ctx.fillText(
        "pinning sites (impurities, grain boundaries, dislocations)",
        padL + plotW / 2,
        padT + plotH + 18,
      );

      // HUD
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillText(
        `applied H = ${H >= 0 ? "+" : ""}${H.toFixed(2)}`,
        padL,
        20,
      );
      ctx.fillText(
        `pin = ${state.pin + 1}/${N_PINS}    bulge = ${state.bulge.toFixed(2)}`,
        padL + 180,
        20,
      );
      ctx.textAlign = "right";
      ctx.fillStyle = inJumpRegime ? "#FFD66B" : colors.fg3;
      ctx.fillText(regime, width - padR, 20);

      // Right-hand scale hint
      ctx.fillStyle = colors.fg3;
      ctx.font = "9px monospace";
      ctx.textAlign = "left";
      ctx.fillText("zoomed into one wall", padL, padT - 6);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-3 flex items-center gap-3 px-1 font-mono text-[11px] opacity-70">
        <label htmlFor="H-slider">applied H</label>
        <input
          id="H-slider"
          type="range"
          min={-1}
          max={1}
          step={0.01}
          value={H}
          onChange={(e) => setH(Number(e.target.value))}
          className="flex-1 max-w-[260px]"
        />
        <span className="tabular-nums w-10 text-right">
          {(H >= 0 ? "+" : "") + H.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  lineWidth: number,
) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  if (len < 0.5) return;
  const ux = dx / len;
  const uy = dy / len;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  const ah = 5;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - ux * ah - uy * ah * 0.5, y1 - uy * ah + ux * ah * 0.5);
  ctx.lineTo(x1 - ux * ah + uy * ah * 0.5, y1 - uy * ah - ux * ah * 0.5);
  ctx.closePath();
  ctx.fill();
}
