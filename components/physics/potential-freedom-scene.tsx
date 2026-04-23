"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { gaugeTransform } from "@/lib/physics/electromagnetism/gauge";

const RATIO = 0.55;
const MAX_HEIGHT = 360;

/**
 * 1D toy. A static uniform electric field E₀ points in the +x direction.
 * We describe it two ways and then slide an arbitrary gauge function f(x, t)
 * on top.
 *
 *   V₀(x) = −E₀·x,        A₀(x, t) = 0                → E = −∂V₀/∂x = E₀ ✓
 *
 * Apply gauge shift with f(x, t) = α·x + β·t:
 *   V' = V₀ − ∂f/∂t = V₀ − β     (a constant offset in V)
 *   A' = A₀ + ∂f/∂x = α          (a constant axial A)
 *
 * Then E' = −∂V'/∂x − ∂A'/∂t = −(−E₀) − 0 = E₀. Still E₀. The scene plots
 *   top row:    V(x) for several values of α, β — the curves move around.
 *   bottom row: A(x) as tiny arrows — different gauges light up.
 *   HUD:        E at a probe point — numerically equal to E₀ in every case.
 */

type GaugeSlot = {
  key: string;
  label: string;
  /** gradient ∂f/∂x */
  alpha: number;
  /** time derivative ∂f/∂t */
  beta: number;
  color: string;
};

const E0 = 2.0; // V/m (scene units)

export function PotentialFreedomScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [alpha, setAlpha] = useState(0.8);
  const [beta, setBeta] = useState(-0.6);
  const [size, setSize] = useState({ width: 640, height: 360 });

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

      // Layout
      const padL = 48;
      const padR = 16;
      const padT = 28;
      const padB = 66;
      const topH = (height - padT - padB) * 0.55;
      const botY = padT + topH + 14;
      const botH = height - padB - botY;
      const plotLeft = padL;
      const plotRight = width - padR;
      const plotW = plotRight - plotLeft;
      const topMid = padT + topH / 2;

      // x-range in scene units
      const xMin = -1;
      const xMax = 1;
      // V range: V₀ spans [−E₀·xMax, −E₀·xMin] = [−2, 2]; add offset β room.
      const vSpan = 4;
      const vMid = 0;

      const xToPx = (x: number) =>
        plotLeft + ((x - xMin) / (xMax - xMin)) * plotW;
      const vToPxTop = (v: number) => topMid - (v / (vSpan / 2)) * (topH / 2);

      // ---- The static fields/slots we compare ----
      const slots: GaugeSlot[] = [
        {
          key: "ref",
          label: "f = 0  (the reference)",
          alpha: 0,
          beta: 0,
          color: "rgba(238, 242, 249, 0.75)",
        },
        {
          key: "shift",
          label: `f = α·x + β·t  (slider)`,
          alpha,
          beta,
          color: "#FFD66B",
        },
      ];

      // ---- Grid / axes ----
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(plotLeft, topMid);
      ctx.lineTo(plotRight, topMid);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(xToPx(0), padT);
      ctx.lineTo(xToPx(0), padT + topH);
      ctx.stroke();

      // top plot border
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 0.8;
      ctx.strokeRect(plotLeft, padT, plotW, topH);

      // bottom plot border
      ctx.strokeRect(plotLeft, botY, plotW, botH);

      // labels
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText("V(x)", plotLeft + 4, padT + 12);
      ctx.fillText("A(x)  (x-component)", plotLeft + 4, botY + 12);
      ctx.textAlign = "right";
      ctx.fillText("x →", plotRight - 2, padT + topH - 4);

      // ---- Plot V(x) for each slot ----
      const sampleN = 200;
      for (const slot of slots) {
        ctx.strokeStyle = slot.color;
        ctx.lineWidth = slot.key === "shift" ? 1.8 : 1.2;
        ctx.setLineDash(slot.key === "ref" ? [3, 3] : []);
        ctx.beginPath();
        for (let i = 0; i <= sampleN; i++) {
          const x = xMin + (i / sampleN) * (xMax - xMin);
          // V₀(x) = −E₀·x. Gauge shift: V' = V₀ − ∂f/∂t = V₀ − β.
          const V0x = -E0 * x;
          const shifted = gaugeTransform(
            { x: 0, y: 0, z: 0 },
            V0x,
            { x: slot.alpha, y: 0, z: 0 },
            slot.beta,
          );
          const px = xToPx(x);
          const py = vToPxTop(
            Math.max(-vSpan / 2 + 0.01, Math.min(vSpan / 2 - 0.01, shifted.V)),
          );
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // ---- Bottom: A as horizontal arrows along x (A₀ = 0, shifted = α) ----
      const arrowCount = 9;
      const amax = 1.5; // visual scale — clamps α so arrows don't run off
      for (const slot of slots) {
        const Ax = slot.alpha; // after shift
        const yLane =
          botY + (slot.key === "ref" ? botH * 0.33 : botH * 0.66);
        ctx.fillStyle = colors.fg2;
        ctx.font = "10px monospace";
        ctx.textAlign = "left";
        ctx.fillText(
          slot.key === "ref" ? "A₀" : "A'",
          plotLeft + 4,
          yLane - 10,
        );

        const norm = Math.max(-1, Math.min(1, Ax / amax));
        const pxLen = norm * 28;
        ctx.strokeStyle = slot.color;
        ctx.fillStyle = slot.color;
        ctx.setLineDash(slot.key === "ref" ? [3, 3] : []);
        ctx.lineWidth = slot.key === "shift" ? 1.4 : 1;
        for (let i = 0; i < arrowCount; i++) {
          const x = xMin + ((i + 0.5) / arrowCount) * (xMax - xMin);
          const ax0 = xToPx(x);
          if (Math.abs(pxLen) < 1) {
            ctx.beginPath();
            ctx.arc(ax0, yLane, 1.5, 0, Math.PI * 2);
            ctx.fill();
            continue;
          }
          ctx.beginPath();
          ctx.moveTo(ax0 - pxLen / 2, yLane);
          ctx.lineTo(ax0 + pxLen / 2, yLane);
          ctx.stroke();
          const dir = Math.sign(pxLen);
          ctx.beginPath();
          ctx.moveTo(ax0 + pxLen / 2, yLane);
          ctx.lineTo(ax0 + pxLen / 2 - dir * 5, yLane - 3);
          ctx.lineTo(ax0 + pxLen / 2 - dir * 5, yLane + 3);
          ctx.closePath();
          ctx.fill();
        }
        ctx.setLineDash([]);
      }

      // ---- Compute E at a probe point, before and after — should match. ----
      // E_x = −∂V/∂x − ∂A_x/∂t.  V' = V₀ − β, A' = α (both constant in t and x
      // in terms of their gauge-added parts), so −∂V'/∂x = E₀ and ∂A'/∂t = 0.
      const Ebefore = E0;
      const Eafter = -(-E0) /* from −∂V₀/∂x */ - 0 /* ∂α/∂t */;

      ctx.fillStyle = colors.fg1;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText(
        `E (before) = ${Ebefore.toFixed(4)} V/m`,
        plotLeft + 4,
        height - 42,
      );
      ctx.fillStyle = "#FFD66B";
      ctx.fillText(
        `E (after)  = ${Eafter.toFixed(4)} V/m`,
        plotLeft + 4,
        height - 28,
      );
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.fillText(
        "The two E-values are identical by construction — E is gauge-invariant.",
        plotLeft + 4,
        height - 14,
      );

      ctx.textAlign = "right";
      ctx.fillText("α = ∂f/∂x", plotRight - 4, height - 42);
      ctx.fillText("β = ∂f/∂t", plotRight - 4, height - 28);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-2 flex flex-col gap-1 px-2 font-mono text-xs">
        <div className="flex items-center gap-3">
          <label className="w-8 text-[var(--color-fg-3)]">α</label>
          <input
            type="range"
            min={-1.5}
            max={1.5}
            step={0.05}
            value={alpha}
            onChange={(e) => setAlpha(parseFloat(e.target.value))}
            className="flex-1 accent-[#FFD66B]"
          />
          <span className="w-16 text-right text-[var(--color-fg-1)]">
            {alpha.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <label className="w-8 text-[var(--color-fg-3)]">β</label>
          <input
            type="range"
            min={-1.5}
            max={1.5}
            step={0.05}
            value={beta}
            onChange={(e) => setBeta(parseFloat(e.target.value))}
            className="flex-1 accent-[#FFD66B]"
          />
          <span className="w-16 text-right text-[var(--color-fg-1)]">
            {beta.toFixed(2)}
          </span>
        </div>
        <div className="mt-1 text-[var(--color-fg-3)]">
          white-dashed = reference (f = 0) · amber = shifted (α, β) · the V-curve
          tilts and slides; the A-arrows grow and flip; the field E stays put.
        </div>
      </div>
    </div>
  );
}
