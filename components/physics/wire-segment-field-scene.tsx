"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { biotSavartElement } from "@/lib/physics/electromagnetism/biot-savart";

const RATIO = 0.6;
const MAX_HEIGHT = 380;

/**
 * A single straight current element drawn horizontally across the canvas.
 * Twenty stacked sub-elements (dl pieces) along the wire each contribute a
 * tiny dB at the cursor; we draw all twenty contributions as small arrows and
 * their resultant in amber. Hover anywhere on the canvas to move the field
 * point. dB is computed from `biotSavartElement` in the lib.
 *
 * Convention: current flows left → right (positive x). The page is the
 * (x, y) plane, with +z out of the page. dB at any point in-plane therefore
 * lies along ±ẑ — we render the in-plane direction by colour: blue-cyan for
 * +ẑ (out of page, above the wire), magenta for −ẑ (into page, below).
 */
export function WireSegmentFieldScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 640, height: 380 });
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);

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

      const cy = height / 2;
      const wireLeft = 60;
      const wireRight = width - 60;
      const wireLen = wireRight - wireLeft;

      // Field point. If no hover, sample a default point above the centre.
      const fpx = hover?.x ?? width / 2;
      const fpy = hover?.y ?? cy - 80;

      // Pixel → metre scaling. Pick something so wire is ~10 cm and field is in nT range
      const pxToM = 0.001; // 1 px = 1 mm
      const I = 5; // amps
      const N = 20; // discretization
      const dlLenPx = wireLen / N;
      const dlLenM = dlLenPx * pxToM;

      // Per-element contributions
      const contributions: Array<{
        ex: number; // element x (px)
        ey: number;
        bz: number; // out-of-plane component
      }> = [];
      let bzTotal = 0;
      for (let i = 0; i < N; i++) {
        const ex = wireLeft + (i + 0.5) * dlLenPx;
        const ey = cy;
        const r = {
          x: (fpx - ex) * pxToM,
          y: (fpy - ey) * pxToM,
          z: 0,
        };
        const dl = { x: dlLenM, y: 0, z: 0 };
        const dB = biotSavartElement(I, dl, r);
        contributions.push({ ex, ey, bz: dB.z });
        bzTotal += dB.z;
      }

      // Wire — bright horizontal line
      ctx.shadowColor = "rgba(255, 214, 107, 0.55)";
      ctx.shadowBlur = 8;
      ctx.strokeStyle = "#FFD66B";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(wireLeft, cy);
      ctx.lineTo(wireRight, cy);
      ctx.stroke();
      ctx.shadowBlur = 0;
      // Current arrowhead at right end
      ctx.fillStyle = "#FFD66B";
      ctx.beginPath();
      ctx.moveTo(wireRight + 10, cy);
      ctx.lineTo(wireRight - 2, cy - 6);
      ctx.lineTo(wireRight - 2, cy + 6);
      ctx.closePath();
      ctx.fill();

      // Discretization tick marks
      ctx.strokeStyle = "rgba(255, 214, 107, 0.4)";
      ctx.lineWidth = 1;
      for (let i = 1; i < N; i++) {
        const tx = wireLeft + i * dlLenPx;
        ctx.beginPath();
        ctx.moveTo(tx, cy - 3);
        ctx.lineTo(tx, cy + 3);
        ctx.stroke();
      }

      // Per-element contribution glyphs at the field point.
      // We can't draw 20 stacked arrows on top of each other meaningfully, so
      // we instead draw small circles next to each element whose colour and
      // size encode that element's dB magnitude — and a thin connector hint
      // toward the field point. This shows the integration intuition without
      // visual chaos.
      let maxBz = 0;
      for (const c of contributions) maxBz = Math.max(maxBz, Math.abs(c.bz));
      for (const c of contributions) {
        if (maxBz === 0) continue;
        const mag = Math.abs(c.bz) / maxBz;
        const radius = 2 + 4 * mag;
        const isOut = c.bz > 0;
        const color = isOut
          ? `rgba(120, 220, 255, ${(0.3 + 0.6 * mag).toFixed(3)})`
          : `rgba(255, 106, 222, ${(0.3 + 0.6 * mag).toFixed(3)})`;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(c.ex, cy + (isOut ? -8 : 8), radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Field point marker
      ctx.fillStyle = colors.fg0;
      ctx.beginPath();
      ctx.arc(fpx, fpy, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = colors.fg2;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(fpx, fpy, 9, 0, Math.PI * 2);
      ctx.stroke();

      // Resultant dot at the field point (filled disc whose colour = sign of B_z)
      const isOutTotal = bzTotal > 0;
      ctx.shadowColor = isOutTotal
        ? "rgba(120, 220, 255, 0.7)"
        : "rgba(255, 106, 222, 0.7)";
      ctx.shadowBlur = 14;
      ctx.fillStyle = isOutTotal ? "#78DCFF" : "#FF6ADE";
      ctx.beginPath();
      ctx.arc(fpx, fpy - 18, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      // Glyph: dot for "out of page", × for "into page"
      ctx.fillStyle = "#1A1D24";
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(isOutTotal ? "•" : "×", fpx, fpy - 18 + 1);
      ctx.textBaseline = "alphabetic";

      // HUD
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`I = ${I.toFixed(1)} A →`, 14, 22);
      ctx.fillText(`N = ${N} elements`, 14, 40);
      ctx.textAlign = "right";
      ctx.fillText(
        `B_z(P) = ${formatTesla(bzTotal)} ${isOutTotal ? "(⊙ out of page)" : "(⊗ into page)"}`,
        width - 14,
        22,
      );
      ctx.fillStyle = colors.fg2;
      ctx.fillText("hover to move the field point P", width - 14, 40);
    },
  });

  const handleMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    setHover({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block cursor-crosshair"
        onMouseMove={handleMove}
        onMouseLeave={() => setHover(null)}
      />
    </div>
  );
}

function formatTesla(B: number): string {
  if (B === 0) return "0 T";
  const abs = Math.abs(B);
  if (abs >= 1) return `${B.toFixed(2)} T`;
  if (abs >= 1e-3) return `${(B * 1e3).toFixed(2)} mT`;
  if (abs >= 1e-6) return `${(B * 1e6).toFixed(2)} µT`;
  if (abs >= 1e-9) return `${(B * 1e9).toFixed(2)} nT`;
  return `${B.toExponential(2)} T`;
}
