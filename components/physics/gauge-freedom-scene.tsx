"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { gaugeShift } from "@/lib/physics/electromagnetism/vector-potential";
import type { Vec3 } from "@/lib/physics/electromagnetism/lorentz";

const RATIO = 0.62;
const MAX_HEIGHT = 420;

/**
 * Gauge freedom: A → A + ∇f leaves B = ∇×A unchanged.
 *
 * Underlying physics: a long straight wire along ẑ with current I produces
 * the canonical "Coulomb gauge" potential
 *
 *   A₀(x, y) = (0, 0, A_z(x, y)),  A_z ∝ −ln(r/dRef)
 *
 * — purely axial, only depends on cylindrical r. From it B = ∇×A points in
 * φ̂ with magnitude μ₀I/(2πr), the familiar wire field.
 *
 * Toggle f to add ∇f to A. The arrows on the page (which show the in-plane
 * components Aₓ, A_y, plus a colour for A_z) reshape dramatically: under a
 * linear f they pick up a uniform offset; under a quadratic f they swirl;
 * under f(x, y) = α·xy they shear. But the curl readout, computed
 * numerically in the corner, is identical to four decimal places — because
 * curl(∇f) ≡ 0.
 */

type GaugeChoice = {
  key: string;
  label: string;
  /** ∇f at point (x, y, z=0). Returns a Vec3. */
  gradF: (x: number, y: number) => Vec3;
};

const CHOICES: GaugeChoice[] = [
  {
    key: "none",
    label: "f = 0  (no shift)",
    gradF: () => ({ x: 0, y: 0, z: 0 }),
  },
  {
    key: "linear",
    label: "f = a·x + b·y  (linear)",
    gradF: () => ({ x: 0.6, y: -0.4, z: 0 }),
  },
  {
    key: "quadratic",
    label: "f = ½(x² + y²)  (radial bowl)",
    gradF: (x, y) => ({ x, y, z: 0 }),
  },
  {
    key: "shear",
    label: "f = α·x·y  (shear)",
    gradF: (x, y) => ({ x: 0.8 * y, y: 0.8 * x, z: 0 }),
  },
];

/** Baseline A₀: axial wire potential (cylindrical, no φ-component). */
function aBase(x: number, y: number): Vec3 {
  const r2 = x * x + y * y;
  const safe = Math.max(r2, 1e-4);
  // proportional to −ln(r); arbitrary unit current. Pure ẑ component.
  const Az = -0.5 * Math.log(safe);
  return { x: 0, y: 0, z: Az };
}

export function GaugeFreedomScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 640, height: 400 });
  const [choiceIdx, setChoiceIdx] = useState(0);

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

      const halfWorld = 1.0;
      const cx = width / 2;
      const cy = height / 2;
      const scale = Math.min(width, height) * 0.42;
      const mToPx = (xM: number, yM: number) => ({
        x: cx + xM * scale,
        y: cy - yM * scale,
      });

      const choice = CHOICES[choiceIdx]!;

      // Sample A on a grid; draw arrow for in-plane (Ax, Ay), color for Az.
      const cellPx = 38;
      const cols = Math.floor(width / cellPx);
      const rows = Math.floor(height / cellPx);
      const xOff = (width - cols * cellPx) / 2 + cellPx / 2;
      const yOff = (height - rows * cellPx) / 2 + cellPx / 2;

      let aPlanarMax = 1e-6;
      let azAbsMax = 1e-6;
      const samples: Array<{
        sx: number;
        sy: number;
        ax: number;
        ay: number;
        az: number;
      }> = [];
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const sx = xOff + i * cellPx;
          const sy = yOff + j * cellPx;
          const xM = (sx - cx) / scale;
          const yM = -(sy - cy) / scale;
          if (Math.abs(xM) > halfWorld || Math.abs(yM) > halfWorld) continue;
          // skip cells too close to the wire (singular)
          if (Math.hypot(xM, yM) < 0.06) continue;
          const A = gaugeShift(aBase(xM, yM), choice.gradF(xM, yM));
          const planar = Math.hypot(A.x, A.y);
          if (planar > aPlanarMax) aPlanarMax = planar;
          if (Math.abs(A.z) > azAbsMax) azAbsMax = Math.abs(A.z);
          samples.push({ sx, sy, ax: A.x, ay: A.y, az: A.z });
        }
      }

      // First, paint cell backgrounds tinted by A_z (magenta = +, cyan = −)
      for (const s of samples) {
        const norm = Math.max(-1, Math.min(1, s.az / azAbsMax));
        const alpha = 0.18 * Math.abs(norm);
        if (norm > 0) {
          ctx.fillStyle = `rgba(255, 106, 222, ${alpha.toFixed(3)})`;
        } else {
          ctx.fillStyle = `rgba(120, 220, 255, ${alpha.toFixed(3)})`;
        }
        ctx.fillRect(
          s.sx - cellPx / 2,
          s.sy - cellPx / 2,
          cellPx,
          cellPx,
        );
      }

      // Draw the wire (out of page) at the origin
      const wirePx = mToPx(0, 0);
      ctx.fillStyle = "rgba(120, 220, 255, 0.95)";
      ctx.beginPath();
      ctx.arc(wirePx.x, wirePx.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#1A1D24";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(wirePx.x, wirePx.y, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Now draw in-plane arrows (the part that LOOKS different per gauge)
      const arrowMaxPx = cellPx * 0.55;
      for (const s of samples) {
        const planar = Math.hypot(s.ax, s.ay);
        if (planar < 1e-9) continue;
        const norm = planar / aPlanarMax;
        const len = Math.max(4, norm * arrowMaxPx);
        const ux = s.ax / planar;
        // screen y is flipped
        const uy = -s.ay / planar;
        const x1 = s.sx + ux * len;
        const y1 = s.sy + uy * len;
        const alpha = 0.45 + 0.5 * norm;
        ctx.strokeStyle = `rgba(255, 214, 107, ${alpha.toFixed(3)})`;
        ctx.fillStyle = `rgba(255, 214, 107, ${alpha.toFixed(3)})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(s.sx, s.sy);
        ctx.lineTo(x1, y1);
        ctx.stroke();
        const ah = 4;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1 - ux * ah - uy * ah * 0.5, y1 - uy * ah + ux * ah * 0.5);
        ctx.lineTo(x1 - ux * ah + uy * ah * 0.5, y1 - uy * ah - ux * ah * 0.5);
        ctx.closePath();
        ctx.fill();
      }

      // ---- Compute B = (∇×A)_z at a probe point and display ----
      // Pick a probe at (0.4, 0.0) — outside the singular core.
      const probeX = 0.4;
      const probeY = 0.0;
      const h = 5e-4;
      const Aplus_x = gaugeShift(
        aBase(probeX + h, probeY),
        choice.gradF(probeX + h, probeY),
      );
      const Aminus_x = gaugeShift(
        aBase(probeX - h, probeY),
        choice.gradF(probeX - h, probeY),
      );
      const Aplus_y = gaugeShift(
        aBase(probeX, probeY + h),
        choice.gradF(probeX, probeY + h),
      );
      const Aminus_y = gaugeShift(
        aBase(probeX, probeY - h),
        choice.gradF(probeX, probeY - h),
      );
      // (∇×A)_z = ∂A_y/∂x − ∂A_x/∂y
      const dAy_dx = (Aplus_x.y - Aminus_x.y) / (2 * h);
      const dAx_dy = (Aplus_y.x - Aminus_y.x) / (2 * h);
      const Bz = dAy_dx - dAx_dy;
      // (∇×A)_x = ∂A_z/∂y, (∇×A)_y = −∂A_z/∂x
      const Bx = (Aplus_y.z - Aminus_y.z) / (2 * h);
      const By = -(Aplus_x.z - Aminus_x.z) / (2 * h);
      const Bmag = Math.hypot(Bx, By, Bz);

      // Mark the probe point
      const pp = mToPx(probeX, probeY);
      ctx.strokeStyle = "rgba(238, 242, 249, 0.85)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(pp.x, pp.y, 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "rgba(238, 242, 249, 0.95)";
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText("probe", pp.x + 9, pp.y + 3);

      // HUD
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText(choice.label, 12, 16);
      ctx.textAlign = "right";
      ctx.fillText(
        `|B| at probe = ${Bmag.toFixed(4)}  (unchanged by f)`,
        width - 12,
        16,
      );
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-2 flex flex-wrap items-center gap-2 px-2 font-mono text-xs">
        <span className="text-[var(--color-fg-3)]">choose f:</span>
        {CHOICES.map((c, i) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setChoiceIdx(i)}
            className={
              "rounded border px-2 py-1 transition " +
              (i === choiceIdx
                ? "border-[#FFD66B] text-[#FFD66B]"
                : "border-[var(--color-fg-4)] text-[var(--color-fg-1)] hover:border-[var(--color-fg-3)]")
            }
          >
            {c.label}
          </button>
        ))}
      </div>
      <div className="mt-2 px-2 font-mono text-xs text-[var(--color-fg-3)]">
        amber arrows = in-plane A (Aₓ, A_y) · pink/cyan tint = sign of A_z ·
        wire (cyan dot) carries current out of page
      </div>
    </div>
  );
}
