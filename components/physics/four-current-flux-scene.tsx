"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

/**
 * FIG.58c — Four-current flux through a 3-surface.
 *
 * 2D Minkowski-like wedge: time runs upward, one spatial axis runs
 * horizontally (the 2nd spatial axis is suppressed and indicated by
 * the slanted prism faces). A vertical "world-tube" of charge runs
 * up through the wedge — a charged region persisting in time.
 *
 * Three different 3-surfaces are offered (slider: 1, 2, 3):
 *   1. Lab simultaneity — horizontal slice, t = const.
 *   2. Boosted simultaneity — slanted slice, the t' = const line.
 *   3. Oblique slicing — a hand-drawn wavy slice that cuts the world-tube.
 *
 * The flux integral ∫ J^μ dΣ_μ returns the same Q for any of the three
 * surfaces, because ∂_μJ^μ = 0 makes the integral depend only on which
 * world-tube it bounds. HUD readout: "Q = 12 C".
 *
 * Palette:
 *   pale-blue — wedge frame
 *   magenta   — world-tube of charge (12 dots distributed in time)
 *   amber     — selected slicing surface
 */

const RATIO = 0.62;
const MAX_HEIGHT = 400;
const N_DOTS = 12;

type Slicing = 1 | 2 | 3;

export function FourCurrentFluxScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();

  const [slicing, setSlicing] = useState<Slicing>(1);
  const slicingRef = useRef<Slicing>(slicing);
  useEffect(() => {
    slicingRef.current = slicing;
  }, [slicing]);

  const [size, setSize] = useState({ width: 720, height: 400 });
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

      const padX = 36;
      const padTop = 28;
      const padBot = 50;
      const x0 = padX;
      const x1 = width - padX;
      const y0 = padTop;
      const y1 = height - padBot;

      // ── Minkowski wedge frame (slanted prism) ──
      // Front face: a parallelogram suggesting (x, t) with depth.
      const skew = Math.min(28, (x1 - x0) * 0.06);
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x0, y1);
      ctx.lineTo(x1, y1);
      ctx.lineTo(x1 + skew, y0);
      ctx.lineTo(x0 + skew, y0);
      ctx.closePath();
      ctx.stroke();
      // back face hint (suggests the suppressed 2nd spatial axis)
      ctx.strokeStyle = "rgba(150, 200, 255, 0.18)";
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(x0 + skew, y0);
      ctx.lineTo(x0 + skew * 2, y0 - skew * 0.45);
      ctx.lineTo(x1 + skew * 2, y0 - skew * 0.45);
      ctx.lineTo(x1 + skew, y0);
      ctx.stroke();
      ctx.setLineDash([]);

      // axes labels
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText("x", x1 + 4, y1 + 4);
      ctx.fillText("t", x0 + skew - 4, y0 - 4);

      // ── world-tube of charge: vertical band centered at xc ──
      const xc = (x0 + x1) * 0.5;
      const tubeHalf = (x1 - x0) * 0.07;
      const tubeXL = xc - tubeHalf;
      const tubeXR = xc + tubeHalf;
      ctx.fillStyle = "rgba(255, 106, 222, 0.08)";
      ctx.fillRect(tubeXL, y0, tubeXR - tubeXL, y1 - y0);
      ctx.strokeStyle = "rgba(255, 106, 222, 0.55)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(tubeXL, y0);
      ctx.lineTo(tubeXL, y1);
      ctx.moveTo(tubeXR, y0);
      ctx.lineTo(tubeXR, y1);
      ctx.stroke();
      ctx.setLineDash([]);

      // 12 dots distributed across the tube (six in each row, two rows)
      const dotsPerRow = 6;
      for (let i = 0; i < N_DOTS; i++) {
        const row = Math.floor(i / dotsPerRow);
        const col = i % dotsPerRow;
        const u = (col + 0.5) / dotsPerRow;
        const x = tubeXL + u * (tubeXR - tubeXL);
        const y =
          y0 + (y1 - y0) * (row === 0 ? 0.35 : 0.65) +
          Math.sin(t * 1.2 + i) * 1.2;
        ctx.fillStyle = "#FF6ADE";
        ctx.beginPath();
        ctx.arc(x, y, 2.8, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── selected slicing 3-surface ──
      const slc = slicingRef.current;
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(255, 200, 80, 0.92)";
      ctx.beginPath();
      if (slc === 1) {
        // horizontal slice, lab simultaneity (t = const)
        const ySlice = y0 + (y1 - y0) * 0.5;
        ctx.moveTo(x0, ySlice);
        ctx.lineTo(x1, ySlice);
      } else if (slc === 2) {
        // slanted simultaneity line of a +x boost (lower-left to upper-right)
        const slope = 0.35;
        const yMid = y0 + (y1 - y0) * 0.5;
        ctx.moveTo(x0, yMid + slope * (x1 - x0) * 0.5);
        ctx.lineTo(x1, yMid - slope * (x1 - x0) * 0.5);
      } else {
        // oblique wavy 3-surface
        const yMid = y0 + (y1 - y0) * 0.5;
        const samples = 80;
        for (let i = 0; i <= samples; i++) {
          const u = i / samples;
          const x = x0 + u * (x1 - x0);
          const y =
            yMid +
            Math.sin(u * Math.PI * 2.2) * (y1 - y0) * 0.15 +
            Math.cos(u * Math.PI * 1.1 + 1.0) * (y1 - y0) * 0.08;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // arrow/label on the slice
      ctx.fillStyle = "rgba(255, 200, 80, 0.92)";
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      const labelMap: Record<Slicing, string> = {
        1: "Σ₁  : lab simultaneity (t = const)",
        2: "Σ₂  : boosted simultaneity (t' = const)",
        3: "Σ₃  : oblique 3-surface",
      };
      ctx.fillText(labelMap[slc], x0 + 4, y0 - 8);

      // ── HUD: Q stable ──
      ctx.fillStyle = colors.fg1;
      ctx.font = "13px monospace";
      ctx.textAlign = "right";
      ctx.fillText("Q = ∫ J^μ dΣ_μ = 12 C", x1, y1 + 28);

      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText(
        "∂_μJ^μ = 0  ⇒  flux through any 3-surface bounding the same world-tube is Q",
        x0,
        y1 + 28,
      );

      // top-left HUD
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText("world-tube of charge", tubeXR + 6, y0 + 12);
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
        <label className="text-sm text-[var(--color-fg-3)]">slicing</label>
        <SlicingButton
          active={slicing === 1}
          onClick={() => setSlicing(1)}
          label="Σ₁ lab"
        />
        <SlicingButton
          active={slicing === 2}
          onClick={() => setSlicing(2)}
          label="Σ₂ boosted"
        />
        <SlicingButton
          active={slicing === 3}
          onClick={() => setSlicing(3)}
          label="Σ₃ oblique"
        />
        <span className="ml-auto text-sm font-mono text-[var(--color-fg-1)]">
          Q = 12 C
        </span>
      </div>
      <div className="mt-1 px-2 text-xs text-[var(--color-fg-3)]">
        Pick any 3-surface that cuts the world-tube once. The integral of the
        four-current through it is the same Q. Charge is what you get when
        you count, however you slice spacetime.
      </div>
    </div>
  );
}

function SlicingButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded border px-2 py-1 font-mono text-xs transition " +
        (active
          ? "border-[var(--color-fg-1)] text-[var(--color-fg-0)]"
          : "border-[var(--color-fg-4)] text-[var(--color-fg-3)] hover:text-[var(--color-fg-1)]")
      }
    >
      {label}
    </button>
  );
}
