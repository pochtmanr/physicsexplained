"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { superpose, type Charge } from "@/lib/physics/coulomb";

const RATIO = 0.65;
const MAX_HEIGHT = 420;
const PX_TO_M = 0.005; // 1 px = 5 mm
const TEST_Q = 1e-9; // 1 nC test charge

interface UICharge {
  id: number;
  px: number; // screen x (px) at insertion time
  py: number;
  q: number; // microcoulombs
}

let nextId = 1;

/**
 * Drag-to-add charges. Click anywhere to drop a +1 µC charge; shift-click
 * to drop a −1 µC charge. Right-click (or option-click) a charge to remove it.
 * A test charge sits at the screen center; its force arrow updates in real time
 * as you add or remove sources. This is the topic's interactive payoff.
 */
export function ChargeSuperpositionScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 640, height: 420 });
  const [charges, setCharges] = useState<UICharge[]>(() => [
    { id: nextId++, px: -120, py: -60, q: +1 },
    { id: nextId++, px: 100, py: 60, q: -1 },
  ]);
  const [nextSign, setNextSign] = useState<1 | -1>(1);

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

  // Derived: physics-space sources (origin at canvas center)
  const sources: Charge[] = charges.map((c) => ({
    q: c.q * 1e-6,
    x: c.px * PX_TO_M,
    y: c.py * PX_TO_M,
  }));

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: () => {
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

      const cx = width / 2;
      const cy = height / 2;

      // Faint origin crosshair
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(cx - 10, cy);
      ctx.lineTo(cx + 10, cy);
      ctx.moveTo(cx, cy - 10);
      ctx.lineTo(cx, cy + 10);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw each source charge
      for (const c of charges) {
        const sx = cx + c.px;
        const sy = cy + c.py;
        drawCharge(ctx, sx, sy, c.q);
      }

      // Compute total force on the test charge at origin
      const f = superpose(sources, { q: TEST_Q, x: 0, y: 0 });
      const fMag = Math.hypot(f.x, f.y);

      // Draw test charge marker
      ctx.fillStyle = colors.fg0;
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = colors.fg2;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, 9, 0, Math.PI * 2);
      ctx.stroke();

      // Draw resultant arrow
      if (fMag > 0) {
        const ux = f.x / fMag;
        const uy = f.y / fMag;
        // Logarithmic length, capped to fit canvas
        const len = Math.min(160, Math.max(20, Math.log10(1 + fMag) * 38));
        const x1 = cx + ux * len;
        const y1 = cy + uy * len;

        ctx.strokeStyle = "#FFD66B"; // amber for the resultant — distinct from source colors
        ctx.fillStyle = "#FFD66B";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(x1, y1);
        ctx.stroke();
        // arrowhead
        const ah = 8;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1 - ux * ah - uy * ah * 0.55, y1 - uy * ah + ux * ah * 0.55);
        ctx.lineTo(x1 - ux * ah + uy * ah * 0.55, y1 - uy * ah - ux * ah * 0.55);
        ctx.closePath();
        ctx.fill();
      }

      // HUD
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`sources: ${charges.length}`, 12, 20);
      ctx.fillText(`next click: ${nextSign > 0 ? "+1 µC" : "−1 µC"}`, 12, 38);
      ctx.textAlign = "right";
      ctx.fillText(`|F| on test = ${formatForce(fMag)}`, width - 12, 20);
      if (fMag > 0) {
        const angleDeg = (Math.atan2(f.y, f.x) * 180) / Math.PI;
        ctx.fillText(`θ = ${angleDeg.toFixed(0)}°`, width - 12, 38);
      }
    },
  });

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = size.width / 2;
    const cy = size.height / 2;
    const localX = x - cx;
    const localY = y - cy;

    // Hit-test existing charges first → option/alt-click removes
    if (e.altKey) {
      const hit = charges.findIndex(
        (c) => Math.hypot(c.px - localX, c.py - localY) < 18,
      );
      if (hit >= 0) {
        setCharges((prev) => prev.filter((_, i) => i !== hit));
      }
      return;
    }

    // Don't drop on top of the test charge
    if (Math.hypot(localX, localY) < 16) return;

    const sign = e.shiftKey ? -1 : nextSign;
    setCharges((prev) => [
      ...prev,
      { id: nextId++, px: localX, py: localY, q: sign },
    ]);
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = size.width / 2;
    const cy = size.height / 2;
    const localX = x - cx;
    const localY = y - cy;
    const hit = charges.findIndex(
      (c) => Math.hypot(c.px - localX, c.py - localY) < 18,
    );
    if (hit >= 0) {
      setCharges((prev) => prev.filter((_, i) => i !== hit));
    }
  };

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block cursor-crosshair"
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      />
      <div className="mt-2 flex flex-wrap items-center gap-2 px-2">
        <button
          type="button"
          onClick={() => setNextSign(1)}
          className={`rounded px-3 py-1 text-sm font-mono ${
            nextSign === 1
              ? "bg-[#FF6ADE] text-[var(--color-bg-0)]"
              : "border border-[var(--color-fg-4)] text-[var(--color-fg-1)]"
          }`}
        >
          +1 µC
        </button>
        <button
          type="button"
          onClick={() => setNextSign(-1)}
          className={`rounded px-3 py-1 text-sm font-mono ${
            nextSign === -1
              ? "bg-[#6FB8C6] text-[var(--color-bg-0)]"
              : "border border-[var(--color-fg-4)] text-[var(--color-fg-1)]"
          }`}
        >
          −1 µC
        </button>
        <button
          type="button"
          onClick={() => setCharges([])}
          className="rounded border border-[var(--color-fg-4)] px-3 py-1 text-sm font-mono text-[var(--color-fg-1)]"
        >
          clear
        </button>
        <span className="ml-2 text-xs font-mono text-[var(--color-fg-3)]">
          click empty space to add · shift-click flips sign · alt-click or right-click removes
        </span>
      </div>
    </div>
  );
}

function drawCharge(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  q: number,
) {
  const radius = 12;
  const isPos = q > 0;
  const fill = isPos ? "#FF6ADE" : "#6FB8C6";
  ctx.shadowColor = isPos
    ? "rgba(255, 106, 222, 0.55)"
    : "rgba(111, 184, 198, 0.55)";
  ctx.shadowBlur = 12;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = "#1A1D24";
  ctx.font = "bold 13px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(isPos ? "+" : "−", cx, cy + 1);
  ctx.textBaseline = "alphabetic";
}

function formatForce(n: number): string {
  if (n === 0) return "0 N";
  const abs = Math.abs(n);
  if (abs >= 1) return `${n.toFixed(2)} N`;
  if (abs >= 1e-3) return `${(n * 1e3).toFixed(2)} mN`;
  if (abs >= 1e-6) return `${(n * 1e6).toFixed(2)} µN`;
  if (abs >= 1e-9) return `${(n * 1e9).toFixed(2)} nN`;
  return `${n.toExponential(2)} N`;
}
