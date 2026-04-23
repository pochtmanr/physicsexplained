"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  displacementCurrentDensity,
} from "@/lib/physics/electromagnetism/displacement-current";

const RATIO = 0.52;
const MAX_HEIGHT = 360;

const LILAC = "rgba(200, 160, 255,";

const DRIVE_I = 1.0; // A, conduction current charging the cap
const PLATE_AREA = 0.02; // m²
// dE/dt = (dQ/dt)/(A·ε₀) = I/(A·ε₀) ≈ 5.65×10¹² V/(m·s) — exaggerated visually.
const EPSILON_0 = 8.8541878128e-12;
const DEDT = DRIVE_I / (PLATE_AREA * EPSILON_0);

/**
 * FIG.33b — between the plates.
 *
 * A parallel-plate capacitor is charging at a constant rate. The electric
 * field magnitude in the gap rises linearly with time:  E(t) = σ(t)/ε₀ =
 * (Q(t))/(A·ε₀). The scene shows E-arrows in lilac, getting longer as t
 * progresses — then a reset. Overlaid: a live bar for dE/dt and the
 * derived displacement-current density J_d = ε₀·∂E/∂t.
 *
 * The reader's takeaway: nothing flows through the gap, and yet something
 * is changing there at the right rate to act like a current. Maxwell saw
 * this first.
 */
export function DisplacementFieldBuildupScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 720, height: 360 });

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

      // Charging cycle: E grows from 0 to 1 over 3 seconds, then resets.
      const cycle = 3.0;
      const frac = ((t % cycle) / cycle);

      const cx = width / 2;
      const cy = height / 2;
      const plateH = Math.min(height * 0.62, 200);
      const plateGap = Math.min(width * 0.24, 160);

      // ─────── Plates ───────
      ctx.fillStyle = "rgba(255, 106, 222, 0.8)";
      ctx.fillRect(cx - plateGap / 2 - 5, cy - plateH / 2, 5, plateH);
      ctx.fillStyle = "rgba(111, 184, 198, 0.8)";
      ctx.fillRect(cx + plateGap / 2, cy - plateH / 2, 5, plateH);

      // ─────── Wires & conduction-current dots ───────
      ctx.strokeStyle = colors.fg1;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(16, cy);
      ctx.lineTo(cx - plateGap / 2 - 5, cy);
      ctx.moveTo(cx + plateGap / 2 + 5, cy);
      ctx.lineTo(width - 16, cy);
      ctx.stroke();

      // ─────── Growing E-field arrows between plates ───────
      const nArrows = 7;
      const step = plateH / (nArrows + 1);
      const arrowLenMax = plateGap - 12;
      const arrowLen = Math.max(6, arrowLenMax * (0.1 + 0.9 * frac));
      const x0 = cx - arrowLen / 2;
      const x1 = cx + arrowLen / 2;
      ctx.strokeStyle = `${LILAC} ${(0.45 + 0.4 * frac).toFixed(3)})`;
      ctx.fillStyle = `${LILAC} ${(0.85).toFixed(3)})`;
      ctx.lineWidth = 1.5;
      for (let i = 1; i <= nArrows; i++) {
        const yy = cy - plateH / 2 + i * step;
        ctx.beginPath();
        ctx.moveTo(x0, yy);
        ctx.lineTo(x1, yy);
        ctx.stroke();
        // arrowhead
        ctx.beginPath();
        ctx.moveTo(x1, yy);
        ctx.lineTo(x1 - 6, yy - 3.5);
        ctx.lineTo(x1 - 6, yy + 3.5);
        ctx.closePath();
        ctx.fill();
      }

      // "E" label
      ctx.fillStyle = `${LILAC} 0.95)`;
      ctx.font = "bold 12px monospace";
      ctx.textAlign = "center";
      ctx.fillText("E(t)", cx, cy - plateH / 2 - 8);

      // ─────── Displacement flow lines ───────
      // A cascade of small lilac "current-like" dots crossing the gap —
      // phase tied to t to suggest continuous flow.
      const nFlow = 4;
      const dotSpeed = 60;
      const dotPhase = (t * dotSpeed) % (plateGap - 10);
      for (let k = 0; k < nFlow; k++) {
        const yy = cy - plateH / 4 + (k - 1.5) * 20;
        const xx =
          cx - (plateGap - 10) / 2 + ((dotPhase + (k * plateGap) / nFlow) %
            (plateGap - 10));
        ctx.fillStyle = `${LILAC} ${(0.5 + 0.4 * frac).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(xx, yy, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // ─────── HUD: dE/dt + J_d ───────
      const dEdtNow = DEDT; // constant under constant-I charging
      const Jd = displacementCurrentDensity(dEdtNow);
      ctx.textAlign = "left";
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.fillText(`E(t) — growing linearly while Q grows`, 12, 18);
      ctx.fillStyle = `${LILAC} 0.95)`;
      ctx.fillText(
        `dE/dt ≈ ${dEdtNow.toExponential(2)} V/(m·s)`,
        12,
        height - 30,
      );
      ctx.fillText(
        `J_d = ε₀·dE/dt ≈ ${Jd.toExponential(2)} A/m²`,
        12,
        height - 14,
      );

      // Tick mark showing the charging cycle phase
      ctx.fillStyle = colors.fg3;
      ctx.fillRect(width - 140, height - 16, 120, 2);
      ctx.fillStyle = colors.fg1;
      ctx.fillRect(width - 140 + frac * 120 - 1, height - 20, 3, 10);
      ctx.fillStyle = colors.fg2;
      ctx.textAlign = "right";
      ctx.fillText("charging cycle", width - 12, height - 22);
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
