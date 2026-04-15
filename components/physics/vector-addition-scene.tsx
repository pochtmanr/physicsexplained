"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { add, angleOf, mag, type Vec2 } from "@/lib/physics/projectile";

const RATIO = 0.7;
const MAX_HEIGHT = 460;
const ACCENT = "#5BE9FF";
const A_COLOR = "#8EE8A3";
const B_COLOR = "#E29FFF";
const GRAB_RADIUS = 16;

export function VectorAdditionScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 640, height: 420 });

  // Two vectors, anchored at a shared origin. Stored in *world* units.
  const [a, setA] = useState<Vec2>({ x: 4, y: 2 });
  const [b, setB] = useState<Vec2>({ x: 2, y: 3 });

  const dragRef = useRef<"a" | "b" | null>(null);

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

  const worldBounds = { min: -6, max: 6 };

  const toPx = useCallback(
    (v: Vec2) => {
      const { width, height } = size;
      const padL = 40;
      const padR = 20;
      const padT = 20;
      const padB = 30;
      const plotW = width - padL - padR;
      const plotH = height - padT - padB;
      const span = worldBounds.max - worldBounds.min;
      return {
        px: padL + ((v.x - worldBounds.min) / span) * plotW,
        py: padT + plotH - ((v.y - worldBounds.min) / span) * plotH,
        plotW,
        plotH,
        padL,
        padT,
        padB,
      };
    },
    [size],
  );

  const fromPx = useCallback(
    (px: number, py: number): Vec2 => {
      const { width, height } = size;
      const padL = 40;
      const padR = 20;
      const padT = 20;
      const padB = 30;
      const plotW = width - padL - padR;
      const plotH = height - padT - padB;
      const span = worldBounds.max - worldBounds.min;
      return {
        x: worldBounds.min + ((px - padL) / plotW) * span,
        y: worldBounds.min + ((padT + plotH - py) / plotH) * span,
      };
    },
    [size],
  );

  // Redraw whenever anything changes
  useEffect(() => {
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

    const origin = toPx({ x: 0, y: 0 });
    const tipA = toPx(a);
    const tipB = toPx(b);
    const sum = add(a, b);
    const tipS = toPx(sum);

    // Grid (faint)
    ctx.strokeStyle = colors.fg3;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);
    for (let i = worldBounds.min; i <= worldBounds.max; i++) {
      if (i === 0) continue;
      const gx = toPx({ x: i, y: 0 }).px;
      ctx.beginPath();
      ctx.moveTo(gx, origin.padT);
      ctx.lineTo(gx, origin.padT + origin.plotH);
      ctx.stroke();

      const gy = toPx({ x: 0, y: i }).py;
      ctx.beginPath();
      ctx.moveTo(origin.padL, gy);
      ctx.lineTo(origin.padL + origin.plotW, gy);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Axes
    ctx.strokeStyle = colors.fg2;
    ctx.lineWidth = 1;
    const zeroY = toPx({ x: 0, y: 0 }).py;
    const zeroX = toPx({ x: 0, y: 0 }).px;
    ctx.beginPath();
    ctx.moveTo(origin.padL, zeroY);
    ctx.lineTo(origin.padL + origin.plotW, zeroY);
    ctx.moveTo(zeroX, origin.padT);
    ctx.lineTo(zeroX, origin.padT + origin.plotH);
    ctx.stroke();

    // Parallelogram guide: dashed lines a→a+b and b→a+b
    ctx.strokeStyle = colors.fg2;
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tipA.px, tipA.py);
    ctx.lineTo(tipS.px, tipS.py);
    ctx.moveTo(tipB.px, tipB.py);
    ctx.lineTo(tipS.px, tipS.py);
    ctx.stroke();
    ctx.setLineDash([]);

    // Resultant first (drawn underneath a and b so arrowheads stay crisp)
    drawArrow(ctx, origin.px, origin.py, tipS.px, tipS.py, ACCENT, 2.5);

    // a and b
    drawArrow(ctx, origin.px, origin.py, tipA.px, tipA.py, A_COLOR, 2);
    drawArrow(ctx, origin.px, origin.py, tipB.px, tipB.py, B_COLOR, 2);

    // Handles at tips
    drawHandle(ctx, tipA.px, tipA.py, A_COLOR);
    drawHandle(ctx, tipB.px, tipB.py, B_COLOR);

    // Labels near tips
    ctx.font = "12px monospace";
    ctx.textAlign = "left";
    ctx.fillStyle = A_COLOR;
    ctx.fillText("a", tipA.px + 10, tipA.py - 8);
    ctx.fillStyle = B_COLOR;
    ctx.fillText("b", tipB.px + 10, tipB.py - 8);
    ctx.fillStyle = ACCENT;
    ctx.fillText("a + b", tipS.px + 10, tipS.py - 8);

    // Readout in the top-left
    ctx.font = "11px monospace";
    ctx.fillStyle = colors.fg2;
    const rx = origin.padL + 8;
    let ry = origin.padT + 14;
    ctx.fillText("drag the coloured tips", rx, ry);
    ry += 16;
    ctx.fillStyle = A_COLOR;
    ctx.fillText(
      `a = (${a.x.toFixed(2)}, ${a.y.toFixed(2)})  |a| = ${mag(a).toFixed(2)}`,
      rx,
      ry,
    );
    ry += 14;
    ctx.fillStyle = B_COLOR;
    ctx.fillText(
      `b = (${b.x.toFixed(2)}, ${b.y.toFixed(2)})  |b| = ${mag(b).toFixed(2)}`,
      rx,
      ry,
    );
    ry += 14;
    ctx.fillStyle = ACCENT;
    const s = add(a, b);
    ctx.fillText(
      `a+b = (${s.x.toFixed(2)}, ${s.y.toFixed(2)})  |a+b| = ${mag(s).toFixed(2)}`,
      rx,
      ry,
    );
    ry += 14;
    const degs = (angleOf(s) * 180) / Math.PI;
    ctx.fillStyle = colors.fg2;
    ctx.fillText(`direction ≈ ${degs.toFixed(1)}°`, rx, ry);
  }, [a, b, size, colors, toPx]);

  // Pointer handling
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const tipA = toPx(a);
      const tipB = toPx(b);
      const dA = Math.hypot(px - tipA.px, py - tipA.py);
      const dB = Math.hypot(px - tipB.px, py - tipB.py);
      let target: "a" | "b" | null = null;
      if (dA < dB && dA < GRAB_RADIUS) target = "a";
      else if (dB <= dA && dB < GRAB_RADIUS) target = "b";
      if (target) {
        dragRef.current = target;
        canvas.setPointerCapture(e.pointerId);
      }
    },
    [a, b, toPx],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!dragRef.current) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const world = fromPx(px, py);
      // Clamp to world bounds
      const clamped: Vec2 = {
        x: Math.max(worldBounds.min, Math.min(worldBounds.max, world.x)),
        y: Math.max(worldBounds.min, Math.min(worldBounds.max, world.y)),
      };
      if (dragRef.current === "a") setA(clamped);
      else setB(clamped);
    },
    [fromPx],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (dragRef.current) {
        dragRef.current = null;
        const canvas = canvasRef.current;
        if (canvas && canvas.hasPointerCapture(e.pointerId)) {
          canvas.releasePointerCapture(e.pointerId);
        }
      }
    },
    [],
  );

  const handleReset = () => {
    setA({ x: 4, y: 2 });
    setB({ x: 2, y: 3 });
  };

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height, touchAction: "none" }}
        className="block cursor-grab"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
      <div className="mt-2 flex items-center gap-3 px-2">
        <button
          type="button"
          onClick={handleReset}
          className="rounded border border-[#5BE9FF] px-3 py-1 text-xs font-mono text-[#5BE9FF] transition hover:bg-[#5BE9FF]/10"
        >
          reset
        </button>
        <span className="text-xs text-[var(--color-fg-2)]">
          drag the green or purple tip — the cyan resultant updates live
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
  width: number,
) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  if (len < 0.5) return;
  const ux = dx / len;
  const uy = dy / len;
  const head = Math.min(11, Math.max(5, len * 0.2));

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1 - ux * head, y1 - uy * head);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - ux * head - uy * head * 0.55, y1 - uy * head + ux * head * 0.55);
  ctx.lineTo(x1 - ux * head + uy * head * 0.55, y1 - uy * head - ux * head * 0.55);
  ctx.closePath();
  ctx.fill();
}

function drawHandle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = 1;
  ctx.stroke();
}
