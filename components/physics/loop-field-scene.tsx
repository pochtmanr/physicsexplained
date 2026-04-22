"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { loopAxisField } from "@/lib/physics/electromagnetism/biot-savart";

const RATIO = 0.62;
const MAX_HEIGHT = 400;

/**
 * A circular current loop drawn in 3D-ish projection (a flattened ellipse).
 * The horizontal axis is the loop's symmetry axis; we plot B(z) along it as
 * a curve and let the user slide z to read the value.
 *
 * Sliders: loop radius R and current I. Live readout of axial B at the
 * chosen z. Right-hand-rule visual cue: little arrows on the loop showing
 * current circulation; B-arrows on the axis pointing the direction the
 * thumb of a curled right hand would.
 */
export function LoopFieldScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [radius, setRadius] = useState(0.05); // metres
  const [current, setCurrent] = useState(2); // amps
  const [zSample, setZSample] = useState(0.05); // metres
  const [size, setSize] = useState({ width: 640, height: 400 });

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
      const cy = height / 2 + 10;
      const flatten = 0.35;

      // ---- Geometry: pick a screen scale that keeps the loop visible.
      // Visual radius in pixels is fixed; physical radius from slider scales the
      // axis distance via mToPx so that the B(z) curve looks reasonable.
      const visR = Math.min(width * 0.12, 80);
      const mToPx = visR / radius;

      // ---- B(z) curve along the horizontal axis through the loop centre.
      const axisHalf = Math.min(width / 2 - 30, 280);
      const zMaxM = axisHalf / mToPx;
      const B0 = loopAxisField(current, radius, 0); // peak — used for vertical scale
      const curveYScale = 60; // px height for B0

      // Trace curve
      ctx.strokeStyle = "rgba(120, 220, 255, 0.85)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const N = 120;
      for (let i = 0; i <= N; i++) {
        const z = -zMaxM + (2 * zMaxM * i) / N;
        const B = loopAxisField(current, radius, z);
        const px = cx + z * mToPx;
        const py = cy - (B / B0) * curveYScale;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Axis line
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(cx - axisHalf, cy);
      ctx.lineTo(cx + axisHalf, cy);
      ctx.stroke();
      ctx.setLineDash([]);

      // ---- Loop drawn at x = 0 on the axis. Project as flattened ellipse.
      // Back half (z < 0 in viewer's depth) drawn behind axis line.
      // Convention: viewing from +z slight angle → ellipse with vertical
      // semi-axis visR and horizontal semi-axis visR*flatten (loop appears
      // edge-on toward the axis, so the "thin" axis is the symmetry axis).
      // Back half (going behind axis): top of ellipse is "away", bottom is "near".
      ctx.strokeStyle = "rgba(255, 214, 107, 0.45)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, visR * flatten, visR, 0, Math.PI, 2 * Math.PI);
      ctx.stroke();
      ctx.strokeStyle = "#FFD66B";
      ctx.shadowColor = "rgba(255, 214, 107, 0.55)";
      ctx.shadowBlur = 8;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(cx, cy, visR * flatten, visR, 0, 0, Math.PI);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Current direction arrows on the loop (animated)
      const phase = (t * 0.6 * 2 * Math.PI) % (2 * Math.PI);
      for (let k = 0; k < 4; k++) {
        const a = (phase + (k * Math.PI) / 2) % (2 * Math.PI);
        const ax = cx + Math.cos(a) * visR * flatten;
        const ay = cy + Math.sin(a) * visR;
        // Tangent: derivative (−sin·flatten, cos)
        let tx = -Math.sin(a) * flatten;
        let ty = Math.cos(a);
        const m = Math.hypot(tx, ty);
        tx /= m;
        ty /= m;
        const isFront = a > 0 && a < Math.PI;
        if (isFront) drawArrowhead(ctx, ax, ay, tx, ty, "#FFD66B", 0.95);
      }

      // ---- Axial B-vector arrows at a few z values, pointing along +z (right)
      // since current circulates "front-of-loop down" → right-hand rule gives B
      // along +z (to the right on the canvas).
      for (let i = -3; i <= 3; i++) {
        if (i === 0) continue;
        const z = i * (zMaxM / 4);
        const B = loopAxisField(current, radius, z);
        const px = cx + z * mToPx;
        const len = Math.min(40, (B / B0) * 36 + 6);
        ctx.strokeStyle = "rgba(120, 220, 255, 0.85)";
        ctx.fillStyle = "rgba(120, 220, 255, 0.85)";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(px - len / 2, cy);
        ctx.lineTo(px + len / 2, cy);
        ctx.stroke();
        // arrowhead pointing right
        ctx.beginPath();
        ctx.moveTo(px + len / 2, cy);
        ctx.lineTo(px + len / 2 - 5, cy - 3);
        ctx.lineTo(px + len / 2 - 5, cy + 3);
        ctx.closePath();
        ctx.fill();
      }

      // ---- Sample marker at z = zSample
      const sampleClamped = Math.max(-zMaxM, Math.min(zMaxM, zSample));
      const spx = cx + sampleClamped * mToPx;
      const Bsample = loopAxisField(current, radius, sampleClamped);
      const spy = cy - (Bsample / B0) * curveYScale;
      ctx.fillStyle = "#FFD66B";
      ctx.beginPath();
      ctx.arc(spx, spy, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 214, 107, 0.45)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(spx, spy);
      ctx.lineTo(spx, cy);
      ctx.stroke();

      // HUD
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`R = ${(radius * 100).toFixed(1)} cm`, 14, 22);
      ctx.fillText(`I = ${current.toFixed(2)} A`, 14, 40);
      ctx.fillText(`z = ${(sampleClamped * 100).toFixed(1)} cm`, 14, 58);
      ctx.textAlign = "right";
      ctx.fillText(`B(0) = ${formatTesla(B0)}`, width - 14, 22);
      ctx.fillText(`B(z) = ${formatTesla(Bsample)}`, width - 14, 40);
      ctx.fillStyle = colors.fg2;
      ctx.fillText("B(z) = μ₀IR² / [2(R²+z²)^(3/2)]", width - 14, 58);
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
        <SliderRow
          label="R"
          value={radius * 100}
          min={1}
          max={15}
          step={0.5}
          unit="cm"
          onChange={(v) => setRadius(v / 100)}
        />
        <SliderRow
          label="I"
          value={current}
          min={0.1}
          max={10}
          step={0.1}
          unit="A"
          onChange={setCurrent}
        />
        <SliderRow
          label="z"
          value={zSample * 100}
          min={-30}
          max={30}
          step={0.5}
          unit="cm"
          onChange={(v) => setZSample(v / 100)}
        />
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
  color: string,
  alpha: number,
) {
  const size = 6;
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.moveTo(x + tx * size, y + ty * size);
  ctx.lineTo(x - tx * size - ty * size * 0.55, y - ty * size + tx * size * 0.55);
  ctx.lineTo(x - tx * size + ty * size * 0.55, y - ty * size - tx * size * 0.55);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
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

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <label className="w-10 text-sm font-mono text-[var(--color-fg-3)]">
        {label}
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 accent-[#78DCFF]"
      />
      <span className="w-20 text-right text-sm font-mono text-[var(--color-fg-1)]">
        {value.toFixed(1)} {unit}
      </span>
    </div>
  );
}
