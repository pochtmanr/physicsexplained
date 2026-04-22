"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { toroidField } from "@/lib/physics/electromagnetism/ampere";

/**
 * A toroid (a solenoid bent into a doughnut) drawn in plan view from
 * above. The doughnut's central axis is perpendicular to the screen,
 * piercing the centre. The torus is the annular region between an inner
 * radius `Rin` and an outer radius `Rout`; current loops wind around
 * the small cross-section of the doughnut.
 *
 * Three concentric circular Amperian loops at radii r₁ < r₂ < r₃ all
 * lie *inside* the toroidal interior. The HUD overlays each loop's B,
 * computed from B(r) = μ₀·N·I / (2π·r), to show the 1/r decay.
 *
 * A fourth dashed loop sits *outside* the doughnut; for it the enclosed
 * current is zero (each turn punches in once and out once), so B = 0.
 *
 * Colour key:
 *   magenta `#FF6ADE` — current ⊙ marker (out of page, on the inner edge of cross-section)
 *   cyan-blue        — current ⊗ marker / B-field on Amperian loops
 *   amber `#FFD66B`  — the B(r) value on each Amperian loop
 */

const MAGENTA = "#FF6ADE";
const CYAN = "#6FB8C6";
const AMBER = "#FFD66B";

export function ToroidFieldScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 640, height: 380 });
  const [N, setN] = useState(500); // total turns
  const [I, setI] = useState(2); // amperes

  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          setSize({ width: w, height: Math.min(Math.max(w * 0.6, 320), 420) });
        }
      }
    });
    ro.observe(c);
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
      const cy = height / 2;
      // Geometry: Rmid is the major radius (centre of the tube),
      // tubeR is the half-thickness of the tube cross-section.
      const Rmid = Math.min(width, height) * 0.32;
      const tubeR = Math.min(width, height) * 0.08;
      const Rin = Rmid - tubeR;
      const Rout = Rmid + tubeR;

      // --- Toroid body (filled annulus with a faint magenta tint) ---
      ctx.fillStyle = "rgba(255, 106, 222, 0.06)";
      ctx.beginPath();
      ctx.arc(cx, cy, Rout, 0, Math.PI * 2);
      ctx.arc(cx, cy, Rin, 0, Math.PI * 2, true);
      ctx.fill("evenodd");

      // Outer & inner edge curves
      ctx.strokeStyle = "rgba(255, 106, 222, 0.55)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, Rout, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, Rin, 0, Math.PI * 2);
      ctx.stroke();

      // --- Current markers around the tube (poloidal winding cross-sections) ---
      // On the OUTER edge of the annulus, the wire is going INTO the page (⊗).
      // On the INNER edge, the wire is coming OUT of the page (⊙).
      // A turn enters at the outer edge, wraps over to the inner edge, and exits.
      const turnCount = 28;
      for (let k = 0; k < turnCount; k++) {
        const a = (k / turnCount) * Math.PI * 2;
        const xOut = cx + Math.cos(a) * Rout;
        const yOut = cy + Math.sin(a) * Rout;
        const xIn = cx + Math.cos(a) * Rin;
        const yIn = cy + Math.sin(a) * Rin;
        drawCurrentMarker(ctx, xOut, yOut, "in", 5);
        drawCurrentMarker(ctx, xIn, yIn, "out", 5);
      }

      // --- Three Amperian loops INSIDE the toroid (different radii) ---
      const loopFracs = [0.85, 1.0, 1.15];
      const phase = t * 0.6;
      for (let li = 0; li < loopFracs.length; li++) {
        const r = Rmid * loopFracs[li]!;
        // Only valid if Rin < r < Rout
        if (r < Rin || r > Rout) continue;
        ctx.strokeStyle = "rgba(120, 220, 255, 0.85)";
        ctx.lineWidth = 1.6;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Direction-of-circulation arrow on the loop (counter-clockwise)
        const aArrow = phase + (li * Math.PI) / 3;
        const ax = cx + Math.cos(aArrow) * r;
        const ay = cy + Math.sin(aArrow) * r;
        const tx = -Math.sin(aArrow);
        const ty = Math.cos(aArrow);
        drawArrow(ctx, ax, ay, tx, ty, 12, "rgba(120, 220, 255, 0.95)");

        // Annotate the local B value (in mT) using physical scale:
        // map pixels to metres so r = Rmid corresponds to 0.10 m.
        const rMeters = (r / Rmid) * 0.10;
        const Bmag = toroidField(N, I, rMeters);
        ctx.fillStyle = AMBER;
        ctx.font = "10px monospace";
        ctx.textAlign = "left";
        ctx.fillText(
          `B(${rMeters.toFixed(3)} m) = ${(Bmag * 1e3).toFixed(3)} mT`,
          cx + r + 6,
          cy - li * 12 - 4,
        );
      }

      // --- A loop OUTSIDE the toroid: B = 0 there ---
      const outsideR = Rout * 1.18;
      ctx.strokeStyle = "rgba(120, 220, 255, 0.35)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.arc(cx, cy, outsideR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText("outside loop: B = 0", cx, cy - outsideR - 6);

      // --- HUD ---
      const pad = 12;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillStyle = colors.fg2;
      ctx.fillText("B(r) = μ₀·N·I / (2π·r)", pad, pad + 12);
      ctx.fillStyle = colors.fg2;
      ctx.fillText(`N = ${N} turns`, pad, pad + 32);
      ctx.fillText(`I = ${I.toFixed(1)} A`, pad, pad + 48);

      // Right-hand rule reminder
      ctx.textAlign = "right";
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.fillText(
        "right-hand rule: fingers wrap with the turns,",
        width - pad,
        pad + 12,
      );
      ctx.fillText(
        "thumb points along the toroidal B inside",
        width - pad,
        pad + 26,
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
      <div className="mt-2 grid grid-cols-1 gap-2 px-2 sm:grid-cols-2">
        <div className="flex items-center gap-2">
          <label className="w-24 font-mono text-xs text-[var(--color-fg-3)]">
            N (turns)
          </label>
          <input
            type="range"
            min={50}
            max={2000}
            step={50}
            value={N}
            onChange={(e) => setN(parseInt(e.target.value, 10))}
            className="flex-1 accent-[#FF6ADE]"
          />
          <span className="w-16 text-right font-mono text-xs text-[var(--color-fg-1)]">
            {N}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <label className="w-24 font-mono text-xs text-[var(--color-fg-3)]">
            I (A)
          </label>
          <input
            type="range"
            min={0}
            max={10}
            step={0.1}
            value={I}
            onChange={(e) => setI(parseFloat(e.target.value))}
            className="flex-1 accent-[#FFD66B]"
          />
          <span className="w-16 text-right font-mono text-xs text-[var(--color-fg-1)]">
            {I.toFixed(1)}
          </span>
        </div>
      </div>
    </div>
  );
}

function drawCurrentMarker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dir: "in" | "out",
  r: number,
) {
  const color = dir === "out" ? MAGENTA : CYAN;
  ctx.fillStyle = "#0E0F18";
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  if (dir === "out") {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 1.3, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(x - r * 0.55, y - r * 0.55);
    ctx.lineTo(x + r * 0.55, y + r * 0.55);
    ctx.moveTo(x + r * 0.55, y - r * 0.55);
    ctx.lineTo(x - r * 0.55, y + r * 0.55);
    ctx.stroke();
  }
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tx: number,
  ty: number,
  len: number,
  color: string,
) {
  const tipX = x + tx * len * 0.5;
  const tipY = y + ty * len * 0.5;
  const tailX = x - tx * len * 0.5;
  const tailY = y - ty * len * 0.5;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(tailX, tailY);
  ctx.lineTo(tipX, tipY);
  ctx.stroke();
  const ang = Math.atan2(ty, tx);
  const head = 5;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(
    tipX - head * Math.cos(ang - Math.PI / 6),
    tipY - head * Math.sin(ang - Math.PI / 6),
  );
  ctx.lineTo(
    tipX - head * Math.cos(ang + Math.PI / 6),
    tipY - head * Math.sin(ang + Math.PI / 6),
  );
  ctx.closePath();
  ctx.fill();
}
