"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { imageChargeForSphere } from "@/lib/physics/method-of-images";

const RATIO = 0.6;
const MAX_HEIGHT = 380;

/**
 * Grounded conducting sphere of radius R at the origin. A real + charge sits
 * outside at distance a > R along the +x axis. The image charge appears at
 * R²/a from the centre, with magnitude −qR/a — Kelvin's 1848 result.
 *
 * Sliders for R and a. The image position and magnitude track the formula
 * live, with a HUD readout. The dashed segment from origin → real charge
 * → image charge marks the inverse-point construction.
 */
export function ImageChargeSphereScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [R, setR] = useState(1.0);
  const [a, setA] = useState(2.5);
  const [size, setSize] = useState({ width: 640, height: 380 });

  // Keep a > R always so the image stays inside.
  const effA = Math.max(a, R + 0.05);

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

      // World layout: origin at (0,0). Show world x ∈ [-1.5, 4.5] for
      // breathing room around the real charge at (a, 0).
      const worldXMin = -1.5;
      const worldXMax = 4.5;
      const worldXSpan = worldXMax - worldXMin;

      const pxPerUnit = Math.min(
        (width - 60) / worldXSpan,
        (height - 80) / 3, // worldY half-span ~ 1.5
      );
      const cx = 30 + (-worldXMin) * pxPerUnit; // canvas x of world origin
      const cy = height / 2;

      // X-axis (subtle)
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(20, cy);
      ctx.lineTo(width - 20, cy);
      ctx.stroke();

      // The grounded sphere
      const Rpx = R * pxPerUnit;
      ctx.save();
      ctx.fillStyle = "rgba(86, 104, 127, 0.18)";
      ctx.strokeStyle = colors.fg2;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, Rpx, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // "GROUNDED" label and centre dot
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillText("V = 0", cx, cy + Rpx + 16);
      ctx.beginPath();
      ctx.arc(cx, cy, 2, 0, Math.PI * 2);
      ctx.fill();

      // Real charge
      const realX = cx + effA * pxPerUnit;
      ctx.shadowColor = "rgba(255, 106, 222, 0.55)";
      ctx.shadowBlur = 16;
      ctx.fillStyle = "#FF6ADE";
      ctx.beginPath();
      ctx.arc(realX, cy, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = "#1A1D24";
      ctx.font = "bold 13px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("+", realX, cy + 1);
      ctx.textBaseline = "alphabetic";

      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText("real +q", realX, cy - 22);
      ctx.fillText(`a = ${effA.toFixed(2)}`, realX, cy + 28);

      // Image charge
      const image = imageChargeForSphere(1, effA, R);
      const imgX = cx + image.distance * pxPerUnit;
      // Magnitude scales the disc radius (between 4 and 13 px)
      const imgRadius = Math.max(4, 13 * Math.abs(image.q));

      ctx.save();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = "rgba(111, 184, 198, 0.8)";
      ctx.lineWidth = 1.5;
      ctx.fillStyle = "rgba(111, 184, 198, 0.22)";
      ctx.beginPath();
      ctx.arc(imgX, cy, imgRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = "rgba(230, 237, 247, 0.85)";
      ctx.font = `bold ${Math.max(10, Math.round(imgRadius))}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("−", imgX, cy + 1);
      ctx.textBaseline = "alphabetic";

      // Dashed line origin → image → real charge (inverse-point construction)
      ctx.save();
      ctx.setLineDash([2, 4]);
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(realX, cy);
      ctx.stroke();
      ctx.restore();

      // R label inside the sphere
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`R = ${R.toFixed(2)}`, cx + 4, cy - 6);

      // d' tick from sphere centre to image
      ctx.save();
      ctx.strokeStyle = "rgba(111, 184, 198, 0.6)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(imgX, cy + 14);
      ctx.lineTo(imgX, cy + 24);
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = colors.fg2;
      ctx.textAlign = "center";
      ctx.fillText(`d′ = ${image.distance.toFixed(2)}`, imgX, cy + 40);

      // -----------------------
      // HUD
      // -----------------------
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`q  = +1`, 14, 20);
      ctx.fillText(`R  = ${R.toFixed(2)} m`, 14, 38);
      ctx.fillText(`a  = ${effA.toFixed(2)} m`, 14, 56);
      ctx.textAlign = "right";
      ctx.fillText(`q′ = -qR/a = ${image.q.toFixed(3)}`, width - 14, 20);
      ctx.fillText(
        `d′ = R²/a = ${image.distance.toFixed(3)} m`,
        width - 14,
        38,
      );
      ctx.fillStyle = colors.fg2;
      ctx.fillText("Kelvin, 1848", width - 14, 56);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-3 flex flex-col gap-3 px-2 font-mono text-xs">
        <div className="flex items-center gap-3">
          <label className="w-12 text-[var(--color-fg-3)]">R</label>
          <input
            type="range"
            min={0.4}
            max={1.6}
            step={0.05}
            value={R}
            onChange={(e) => setR(parseFloat(e.target.value))}
            className="flex-1 accent-[#6FB8C6]"
          />
          <span className="w-20 text-right text-[var(--color-fg-1)]">
            {R.toFixed(2)} m
          </span>
        </div>
        <div className="flex items-center gap-3">
          <label className="w-12 text-[var(--color-fg-3)]">a</label>
          <input
            type="range"
            min={1.2}
            max={4.0}
            step={0.05}
            value={a}
            onChange={(e) => setA(parseFloat(e.target.value))}
            className="flex-1 accent-[#6FB8C6]"
          />
          <span className="w-20 text-right text-[var(--color-fg-1)]">
            {effA.toFixed(2)} m
          </span>
        </div>
      </div>
    </div>
  );
}
