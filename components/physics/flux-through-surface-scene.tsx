"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

/**
 * Educational scene: a uniform E-field grid pointing to the right,
 * and a flat surface the reader can rotate with a slider (or by
 * dragging the surface) to tilt it. The HUD reports
 *   Φ = E · A · cos θ
 * live, where θ is the angle between the surface normal and the field.
 *
 * Tilt to vertical (normal aligned with E) → flux is maximal.
 * Tilt the surface edge-on to the field (normal perpendicular to E) → flux is zero.
 */

const E_MAGNITUDE = 1; // arbitrary units — we report Φ as a fraction of E·A
const SURFACE_LENGTH = 1; // arbitrary units (one "unit area" in 2D cross-section)
const CYAN = "#6FB8C6";
const MAGENTA = "#FF4FD8";

export function FluxThroughSurfaceScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 600, height: 360 });
  // angle of surface NORMAL relative to +x (E direction); 0 → flux maximal.
  const [normalAngle, setNormalAngle] = useState(0);
  const draggingRef = useRef(false);

  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          setSize({ width: w, height: Math.min(w * 0.6, 360) });
        }
      }
    });
    ro.observe(c);
    return () => ro.disconnect();
  }, []);

  // Compute flux per unit length (2D analog of E·A·cosθ, with A = 1)
  const cosTheta = Math.cos(normalAngle);
  const flux = E_MAGNITUDE * SURFACE_LENGTH * cosTheta;

  // Render — pure draw, no animation needed.
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

    // --- Uniform E-field grid (arrows pointing +x) ---
    const stepX = 40;
    const stepY = 36;
    const arrowLen = 20;
    ctx.strokeStyle = "rgba(111, 184, 198, 0.45)";
    ctx.fillStyle = "rgba(111, 184, 198, 0.6)";
    ctx.lineWidth = 1;
    for (let x = stepX / 2; x < width; x += stepX) {
      for (let y = stepY / 2; y < height; y += stepY) {
        ctx.beginPath();
        ctx.moveTo(x - arrowLen / 2, y);
        ctx.lineTo(x + arrowLen / 2, y);
        ctx.stroke();
        // arrowhead
        ctx.beginPath();
        ctx.moveTo(x + arrowLen / 2, y);
        ctx.lineTo(x + arrowLen / 2 - 4, y - 3);
        ctx.lineTo(x + arrowLen / 2 - 4, y + 3);
        ctx.closePath();
        ctx.fill();
      }
    }

    // --- The surface, drawn as a thick line through the centre ---
    const cx = width / 2;
    const cy = height / 2;
    const surfaceHalfLen = Math.min(width, height) * 0.22;
    // Surface tangent direction is perpendicular to the normal
    const tx = -Math.sin(normalAngle);
    const ty = Math.cos(normalAngle);
    const ax = cx + tx * surfaceHalfLen;
    const ay = cy + ty * surfaceHalfLen;
    const bx = cx - tx * surfaceHalfLen;
    const by = cy - ty * surfaceHalfLen;

    // Faint wedge that fills the "behind the surface" region (visual aid)
    const nx = Math.cos(normalAngle);
    const ny = Math.sin(normalAngle);
    ctx.fillStyle = "rgba(111, 184, 198, 0.06)";
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.lineTo(bx + nx * surfaceHalfLen * 0.4, by + ny * surfaceHalfLen * 0.4);
    ctx.lineTo(ax + nx * surfaceHalfLen * 0.4, ay + ny * surfaceHalfLen * 0.4);
    ctx.closePath();
    ctx.fill();

    // Surface line
    ctx.strokeStyle = MAGENTA;
    ctx.lineWidth = 3;
    ctx.shadowColor = "rgba(255, 79, 216, 0.6)";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Surface normal arrow
    const nLen = surfaceHalfLen * 0.75;
    const tipX = cx + nx * nLen;
    const tipY = cy + ny * nLen;
    ctx.strokeStyle = CYAN;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();
    // arrowhead
    const head = 8;
    ctx.fillStyle = CYAN;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(
      tipX - head * Math.cos(normalAngle - Math.PI / 6),
      tipY - head * Math.sin(normalAngle - Math.PI / 6),
    );
    ctx.lineTo(
      tipX - head * Math.cos(normalAngle + Math.PI / 6),
      tipY - head * Math.sin(normalAngle + Math.PI / 6),
    );
    ctx.closePath();
    ctx.fill();

    // n̂ label
    ctx.fillStyle = CYAN;
    ctx.font = "11px monospace";
    ctx.textAlign = "left";
    ctx.fillText("n̂", tipX + 6, tipY + 4);

    // E label near a representative arrow at top-right
    ctx.fillStyle = colors.fg2;
    ctx.font = "10px monospace";
    ctx.textAlign = "right";
    ctx.fillText("E (uniform)", width - 8, 16);

    // HUD
    const pad = 10;
    ctx.font = "11px monospace";
    ctx.textAlign = "left";
    ctx.fillStyle = colors.fg2;
    ctx.fillText("θ = angle(n̂, E)", pad, pad + 10);
    ctx.fillStyle = colors.fg0;
    ctx.fillText(
      `θ = ${((normalAngle * 180) / Math.PI).toFixed(0)}°`,
      pad,
      pad + 26,
    );
    ctx.fillStyle = colors.fg2;
    ctx.fillText("Φ = E · A · cos θ", pad, pad + 50);
    ctx.fillStyle = CYAN;
    ctx.fillText(`Φ = ${flux.toFixed(2)} (× E·A)`, pad, pad + 66);
  }, [size, normalAngle, colors, flux]);

  // Drag-to-rotate
  function angleFromPointer(e: ReactPointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const dx = e.clientX - rect.left - cx;
    const dy = e.clientY - rect.top - cy;
    return Math.atan2(dy, dx);
  }

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{
          width: size.width,
          height: size.height,
          touchAction: "none",
          cursor: draggingRef.current ? "grabbing" : "grab",
        }}
        className="block"
        onPointerDown={(e) => {
          draggingRef.current = true;
          (e.target as Element).setPointerCapture(e.pointerId);
          const a = angleFromPointer(e);
          if (a !== null) setNormalAngle(a);
        }}
        onPointerMove={(e) => {
          if (!draggingRef.current) return;
          const a = angleFromPointer(e);
          if (a !== null) setNormalAngle(a);
        }}
        onPointerUp={(e) => {
          draggingRef.current = false;
          (e.target as Element).releasePointerCapture(e.pointerId);
        }}
      />
      <div className="mt-2 flex items-center gap-3 px-2">
        <label className="text-sm text-[var(--color-fg-3)]">Tilt n̂</label>
        <input
          type="range"
          min={-Math.PI}
          max={Math.PI}
          step={0.01}
          value={normalAngle}
          onChange={(e) => setNormalAngle(parseFloat(e.target.value))}
          className="flex-1 accent-[#6FB8C6]"
        />
        <span className="w-16 text-right font-mono text-sm text-[var(--color-fg-1)]">
          {((normalAngle * 180) / Math.PI).toFixed(0)}°
        </span>
      </div>
    </div>
  );
}
