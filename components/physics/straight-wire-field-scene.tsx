"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { straightWireField } from "@/lib/physics/electromagnetism/biot-savart";

const RATIO = 0.6;
const MAX_HEIGHT = 380;
const N_RINGS = 4;
const RING_DRIFT_SPEED = 0.55; // turns per second around the wire

/**
 * A vertical current-carrying wire (current flowing UP out of the page when
 * viewed from above). We draw three concentric perspective rings that wrap
 * the wire, with arrowheads animating around them to show the direction of B
 * given by the right-hand rule (thumb along +I, fingers curl with B).
 *
 * Slider for current I; live readout of B at a fixed sample distance.
 */
export function StraightWireFieldScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [current, setCurrent] = useState(5); // amps
  const [size, setSize] = useState({ width: 640, height: 380 });

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

      const cx = width / 2;
      const wireTop = 28;
      const wireBottom = height - 28;
      const wireH = wireBottom - wireTop;

      // Wire — bright vertical line with a glow
      ctx.shadowColor = "rgba(255, 214, 107, 0.65)";
      ctx.shadowBlur = 10;
      ctx.strokeStyle = "#FFD66B";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, wireTop);
      ctx.lineTo(cx, wireBottom);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Current direction arrowhead at top of wire (current flows up)
      ctx.fillStyle = "#FFD66B";
      ctx.beginPath();
      ctx.moveTo(cx, wireTop - 10);
      ctx.lineTo(cx - 6, wireTop + 2);
      ctx.lineTo(cx + 6, wireTop + 2);
      ctx.closePath();
      ctx.fill();

      // Three perspective rings drawn at three heights along the wire.
      // Each ring is a flattened ellipse (depth squash) wrapping the wire.
      const ringHeights = [
        wireTop + wireH * 0.18,
        wireTop + wireH * 0.5,
        wireTop + wireH * 0.82,
      ];
      const baseRadii = [Math.min(width * 0.18, 110), Math.min(width * 0.26, 165), Math.min(width * 0.18, 110)];
      const flatten = 0.28; // ellipse y-scale

      for (let i = 0; i < ringHeights.length; i++) {
        const ry = ringHeights[i];
        const radius = baseRadii[i];

        // back half (z < 0) drawn dimmer
        ctx.strokeStyle = "rgba(120, 220, 255, 0.28)";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.ellipse(cx, ry, radius, radius * flatten, 0, Math.PI, 2 * Math.PI);
        ctx.stroke();
        // front half brighter
        ctx.strokeStyle = "rgba(120, 220, 255, 0.85)";
        ctx.beginPath();
        ctx.ellipse(cx, ry, radius, radius * flatten, 0, 0, Math.PI);
        ctx.stroke();

        // Animated arrowheads circulating around the ring (right-hand rule:
        // current up → field circulates counter-clockwise when viewed from above,
        // i.e. on the front face arrows point left→right.
        for (let k = 0; k < N_RINGS; k++) {
          // phase ∈ [0, 2π) advancing with time. Convention: angle 0 is +x (right),
          // π/2 is into page (top of ellipse), π is −x (left), 3π/2 is out of page.
          const phase = (t * RING_DRIFT_SPEED * 2 * Math.PI + k * (Math.PI / 2)) % (2 * Math.PI);
          const ax = cx + Math.cos(phase) * radius;
          const ay = ry + Math.sin(phase) * radius * flatten;
          // Tangent to ellipse at this angle: derivative of (cos, flatten·sin)
          // is (−sin, flatten·cos). Counter-clockwise traversal corresponds to
          // increasing phase, which (viewed from above with +z out of page) is
          // the right-hand-rule direction for current up.
          let tx = -Math.sin(phase);
          let ty = flatten * Math.cos(phase);
          const mag = Math.hypot(tx, ty);
          tx /= mag;
          ty /= mag;
          // Hide arrows on the back half so the ring "wraps" the wire.
          const isFront = phase > 0 && phase < Math.PI;
          const alpha = isFront ? 0.95 : 0.25;
          drawArrowhead(ctx, ax, ay, tx, ty, alpha);
        }
      }

      // Sample point: a small marker 1.5× the middle ring's radius to the right
      const sampleD_px = baseRadii[1] * 1.5;
      const sx = cx + sampleD_px;
      const sy = ringHeights[1];
      const pxToM = 0.001; // 1 px = 1 mm; sample at ~12–25 cm depending on width
      const sampleD = sampleD_px * pxToM;
      const B = straightWireField(current, sampleD);

      ctx.fillStyle = colors.fg0;
      ctx.beginPath();
      ctx.arc(sx, sy, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = "11px monospace";
      ctx.fillStyle = colors.fg2;
      ctx.textAlign = "left";
      ctx.fillText(`d = ${(sampleD * 100).toFixed(1)} cm`, sx + 8, sy - 4);
      ctx.fillText(`B = ${formatTesla(B)}`, sx + 8, sy + 12);

      // HUD
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`I = ${current.toFixed(1)} A ↑`, 14, 22);
      ctx.textAlign = "right";
      ctx.fillText("B = μ₀I / (2π·d)", width - 14, 22);
      ctx.fillStyle = colors.fg2;
      ctx.fillText("right-hand rule: thumb along I, fingers curl with B", width - 14, 40);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-2 flex items-center gap-3 px-2">
        <label className="w-16 text-sm font-mono text-[var(--color-fg-3)]">
          I
        </label>
        <input
          type="range"
          min={0.5}
          max={20}
          step={0.1}
          value={current}
          onChange={(e) => setCurrent(parseFloat(e.target.value))}
          className="flex-1 accent-[#FFD66B]"
        />
        <span className="w-20 text-right text-sm font-mono text-[var(--color-fg-1)]">
          {current.toFixed(1)} A
        </span>
      </div>
    </div>
  );
}

function drawArrowhead(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tx: number,
  ty: number,
  alpha: number,
) {
  const size = 6;
  ctx.fillStyle = `rgba(120, 220, 255, ${alpha.toFixed(3)})`;
  ctx.beginPath();
  ctx.moveTo(x + tx * size, y + ty * size);
  ctx.lineTo(x - tx * size - ty * size * 0.55, y - ty * size + tx * size * 0.55);
  ctx.lineTo(x - tx * size + ty * size * 0.55, y - ty * size - tx * size * 0.55);
  ctx.closePath();
  ctx.fill();
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
