"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { fluxThroughSphere } from "@/lib/physics/gauss";

/**
 * THE MONEY SHOT.
 *
 * A single point charge sits at the centre. Around it, a closed Gaussian
 * surface morphs continuously through four shapes —
 *   sphere → cylinder → cube → pillbox → back to sphere
 * — and the live HUD reports the total flux through it.
 *
 * The number does not change. That is the visual proof of Gauss's law:
 * the flux is a property of the enclosed charge, not of the surface.
 */

const Q_DEMO = 1; // 1 C — keeps the HUD readout a tidy number
const MORPH_SECONDS_PER_SHAPE = 2.4; // seconds spent on each pure shape
const MORPH_SECONDS_TRANSITION = 1.2; // seconds blending between shapes
const CYCLE_SHAPES = 4;
const CYCLE_PERIOD =
  CYCLE_SHAPES * (MORPH_SECONDS_PER_SHAPE + MORPH_SECONDS_TRANSITION);

type ShapeName = "sphere" | "cylinder" | "cube" | "pillbox";
const SHAPES: ShapeName[] = ["sphere", "cylinder", "cube", "pillbox"];

interface BlendState {
  from: ShapeName;
  to: ShapeName;
  /** 0 = entirely `from`, 1 = entirely `to` */
  t: number;
  /** Active label to show in HUD (the dominant shape) */
  active: ShapeName;
}

function smoothstep(x: number): number {
  const c = Math.max(0, Math.min(1, x));
  return c * c * (3 - 2 * c);
}

function getBlend(t: number): BlendState {
  const tCycle = t % CYCLE_PERIOD;
  const slot = MORPH_SECONDS_PER_SHAPE + MORPH_SECONDS_TRANSITION;
  const idx = Math.floor(tCycle / slot);
  const inSlot = tCycle - idx * slot;
  const from = SHAPES[idx % CYCLE_SHAPES]!;
  const to = SHAPES[(idx + 1) % CYCLE_SHAPES]!;
  if (inSlot < MORPH_SECONDS_PER_SHAPE) {
    return { from, to: from, t: 0, active: from };
  }
  const local = (inSlot - MORPH_SECONDS_PER_SHAPE) / MORPH_SECONDS_TRANSITION;
  const blend = smoothstep(local);
  return { from, to, t: blend, active: blend < 0.5 ? from : to };
}

/**
 * Returns a closed planar outline for one of the four shapes, sampled
 * at `n` points around the perimeter, centred at (cx, cy) with overall
 * scale `s`. Polygon arrays are arranged so corresponding indices
 * roughly track the same azimuthal angle — that lets us linearly
 * interpolate between any pair of shapes and get a continuous morph.
 */
function shapeOutline(
  shape: ShapeName,
  cx: number,
  cy: number,
  s: number,
  n: number,
): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i++) {
    const theta = (i / n) * Math.PI * 2;
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    let r: number;
    switch (shape) {
      case "sphere": {
        r = s;
        break;
      }
      case "cube": {
        // Square outline expressed in polar form: r = s / max(|cos|,|sin|)
        const m = Math.max(Math.abs(cos), Math.abs(sin));
        r = s / m;
        break;
      }
      case "cylinder": {
        // Tall narrow rectangle (cross-section of a cylinder seen edge-on)
        // Horizontal half-width 0.55s, vertical half-height 1.15s
        const hx = s * 0.55;
        const hy = s * 1.15;
        const rx = hx / Math.max(Math.abs(cos), 1e-6);
        const ry = hy / Math.max(Math.abs(sin), 1e-6);
        r = Math.min(rx, ry);
        break;
      }
      case "pillbox": {
        // Wide flat rectangle (cross-section of a pillbox / coin)
        const hx = s * 1.25;
        const hy = s * 0.45;
        const rx = hx / Math.max(Math.abs(cos), 1e-6);
        const ry = hy / Math.max(Math.abs(sin), 1e-6);
        r = Math.min(rx, ry);
        break;
      }
    }
    pts.push({ x: cx + r * cos, y: cy + r * sin });
  }
  return pts;
}

export function GaussianSurfacesScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const reducedMotion = useReducedMotion();
  const [size, setSize] = useState({ width: 600, height: 400 });
  const [shapeLabel, setShapeLabel] = useState<ShapeName>("sphere");

  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          setSize({ width: w, height: Math.min(w * 0.6, 400) });
        }
      }
    });
    ro.observe(c);
    return () => ro.disconnect();
  }, []);

  const flux = fluxThroughSphere(Q_DEMO, 1); // r-independent

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
      const cy = height / 2;
      const baseScale = Math.min(width, height) * 0.28;

      // --- Field lines emanating from the central charge (radial spokes) ---
      const lineCount = 24;
      const reach = Math.hypot(width, height);
      ctx.strokeStyle = "rgba(111, 184, 198, 0.18)";
      ctx.lineWidth = 1;
      for (let i = 0; i < lineCount; i++) {
        const a = (i / lineCount) * Math.PI * 2;
        const dx = Math.cos(a);
        const dy = Math.sin(a);
        ctx.beginPath();
        ctx.moveTo(cx + dx * 14, cy + dy * 14);
        ctx.lineTo(cx + dx * reach, cy + dy * reach);
        ctx.stroke();
        // small arrowhead halfway out
        const mx = cx + dx * baseScale * 1.7;
        const my = cy + dy * baseScale * 1.7;
        const head = 5;
        const ang = Math.atan2(dy, dx);
        ctx.fillStyle = "rgba(111, 184, 198, 0.35)";
        ctx.beginPath();
        ctx.moveTo(mx, my);
        ctx.lineTo(
          mx - head * Math.cos(ang - Math.PI / 6),
          my - head * Math.sin(ang - Math.PI / 6),
        );
        ctx.lineTo(
          mx - head * Math.cos(ang + Math.PI / 6),
          my - head * Math.sin(ang + Math.PI / 6),
        );
        ctx.closePath();
        ctx.fill();
      }

      // --- Compute morphing surface outline ---
      const blend = reducedMotion ? getBlend(0) : getBlend(t);
      const N = 192;
      const fromPts = shapeOutline(blend.from, cx, cy, baseScale, N);
      const toPts = shapeOutline(blend.to, cx, cy, baseScale, N);
      const interp: { x: number; y: number }[] = new Array(N);
      for (let i = 0; i < N; i++) {
        const a = fromPts[i]!;
        const b = toPts[i]!;
        interp[i] = {
          x: a.x + (b.x - a.x) * blend.t,
          y: a.y + (b.y - a.y) * blend.t,
        };
      }

      // Surface fill — faint cyan glow
      ctx.beginPath();
      ctx.moveTo(interp[0]!.x, interp[0]!.y);
      for (let i = 1; i < N; i++) ctx.lineTo(interp[i]!.x, interp[i]!.y);
      ctx.closePath();
      ctx.fillStyle = "rgba(111, 184, 198, 0.08)";
      ctx.fill();

      // Surface outline — bright cyan
      ctx.strokeStyle = "#6FB8C6";
      ctx.lineWidth = 2;
      ctx.shadowColor = "rgba(111, 184, 198, 0.5)";
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // --- Central point charge ---
      ctx.shadowColor = "rgba(255, 79, 216, 0.85)";
      ctx.shadowBlur = 22;
      ctx.fillStyle = "#FF4FD8";
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // "+q" label
      ctx.fillStyle = colors.fg0;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillText("+q", cx + 12, cy - 8);

      // Push HUD shape name back to React state when it changes
      if (blend.active !== shapeLabel) {
        setShapeLabel(blend.active);
      }

      // --- HUD overlay (drawn on canvas to stay locked to the scene) ---
      const pad = 12;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillStyle = colors.fg2;
      ctx.fillText("SURFACE", pad, pad + 10);
      ctx.fillStyle = colors.fg0;
      ctx.fillText(blend.active.toUpperCase(), pad, pad + 26);

      ctx.fillStyle = colors.fg2;
      ctx.fillText("ΦE = ∮E·dA", pad, pad + 50);
      ctx.fillStyle = "#6FB8C6";
      ctx.fillText(`= ${flux.toExponential(2)} V·m`, pad, pad + 66);

      ctx.fillStyle = colors.fg2;
      ctx.fillText("= q / ε₀  (constant)", pad, pad + 82);
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
