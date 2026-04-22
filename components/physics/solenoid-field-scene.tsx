"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { solenoidField } from "@/lib/physics/electromagnetism/ampere";

/**
 * A long solenoid seen in cross-section. Top wall has current-carrying
 * loops with current flowing OUT of the page (⊙); bottom wall has the
 * opposite-side return with current flowing INTO the page (⊗). The B
 * field inside flows uniformly to the right; outside, it is essentially
 * zero (a faint hint at the ends suggests the small return field).
 *
 * A dashed amber rectangle is the Amperian rectangle of the derivation:
 * one long side inside the solenoid (where B is uniform), the other
 * outside (where B ≈ 0), the two short sides perpendicular to B (so
 * they contribute nothing to the line integral).
 *
 * Sliders control turns-per-metre n and current I; the HUD reports
 * B = μ₀ · n · I in tesla.
 *
 * Colours:
 *   magenta `#FF6ADE` for + (current ⊙ out of page) accents
 *   cyan-blue for B-field arrows
 *   amber `#FFD66B` for the Amperian rectangle and resultant B label
 */

const MAGENTA = "#FF6ADE";
const CYAN = "#6FB8C6";
const AMBER = "#FFD66B";
const FIELD_COLOR = "rgba(120, 220, 255, 0.85)";

export function SolenoidFieldScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 640, height: 360 });
  const [n, setN] = useState(1000); // turns per metre
  const [I, setI] = useState(1); // amperes

  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          setSize({ width: w, height: Math.min(Math.max(w * 0.55, 300), 380) });
        }
      }
    });
    ro.observe(c);
    return () => ro.disconnect();
  }, []);

  const B = solenoidField(n, I);

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

      const padX = 40;
      const cy = height * 0.5;
      const wallY1 = cy - height * 0.18;
      const wallY2 = cy + height * 0.18;
      const xL = padX;
      const xR = width - padX;
      const solL = xL + 40;
      const solR = xR - 40;

      // --- Field arrows INSIDE the solenoid (uniform, pointing right) ---
      const arrowAlpha = Math.min(0.95, 0.25 + Math.log10(B / 1e-5 + 1) * 0.4);
      const fieldStr = `rgba(120, 220, 255, ${arrowAlpha.toFixed(3)})`;
      const cols = Math.max(4, Math.floor((solR - solL) / 80));
      const rows = 3;
      const phase = (t * 60) % 80;
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = solL + 30 + ((i * 80 + phase) % (solR - solL - 60));
          const y = wallY1 + ((j + 0.5) / rows) * (wallY2 - wallY1);
          drawArrow(ctx, x, y, 22, fieldStr);
        }
      }

      // --- Outside the solenoid: very faint return-field hints at the ends ---
      ctx.strokeStyle = "rgba(120, 220, 255, 0.10)";
      ctx.lineWidth = 1;
      // Curved end-cap field line top-left
      ctx.beginPath();
      ctx.moveTo(solL, wallY1);
      ctx.bezierCurveTo(solL - 60, wallY1 - 40, xL, cy - 70, xL, cy);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(solL, wallY2);
      ctx.bezierCurveTo(solL - 60, wallY2 + 40, xL, cy + 70, xL, cy);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(solR, wallY1);
      ctx.bezierCurveTo(solR + 60, wallY1 - 40, xR, cy - 70, xR, cy);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(solR, wallY2);
      ctx.bezierCurveTo(solR + 60, wallY2 + 40, xR, cy + 70, xR, cy);
      ctx.stroke();

      // --- Solenoid walls (rows of current-carrying turn cross-sections) ---
      const turnStep = 28;
      // Top wall: current OUT of the page (⊙)
      for (let x = solL + turnStep / 2; x < solR; x += turnStep) {
        drawCurrentMarker(ctx, x, wallY1, "out");
      }
      // Bottom wall: current INTO the page (⊗)
      for (let x = solL + turnStep / 2; x < solR; x += turnStep) {
        drawCurrentMarker(ctx, x, wallY2, "in");
      }

      // --- Amperian rectangle: one long side inside, other outside ---
      const ampL = solL + (solR - solL) * 0.35;
      const ampR = solL + (solR - solL) * 0.65;
      const ampTopInside = wallY1 + (wallY2 - wallY1) * 0.45;
      const ampBotOutside = wallY2 + height * 0.10;
      ctx.strokeStyle = AMBER;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(
        ampL,
        ampTopInside,
        ampR - ampL,
        ampBotOutside - ampTopInside,
      );
      ctx.setLineDash([]);

      // Annotate the inside-long-side as "L" and contributes B·L
      ctx.fillStyle = AMBER;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText("inside: contributes B·L", (ampL + ampR) / 2, ampTopInside - 4);
      ctx.fillText(
        "outside: B ≈ 0",
        (ampL + ampR) / 2,
        ampBotOutside + 12,
      );

      // --- HUD ---
      const pad = 12;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillStyle = colors.fg2;
      ctx.fillText("B = μ₀ · n · I", pad, pad + 12);
      ctx.fillStyle = colors.fg0;
      ctx.fillText(
        `B = ${(B * 1e3).toFixed(3)} mT`,
        pad,
        pad + 28,
      );
      ctx.fillStyle = colors.fg2;
      ctx.fillText(`n = ${n} turns/m`, pad, pad + 50);
      ctx.fillText(`I = ${I.toFixed(1)} A`, pad, pad + 66);

      // Colour legend
      ctx.textAlign = "right";
      ctx.fillStyle = MAGENTA;
      ctx.fillText("⊙ current out", width - pad, pad + 12);
      ctx.fillStyle = CYAN;
      ctx.fillText("⊗ current in", width - pad, pad + 28);
      ctx.fillStyle = AMBER;
      ctx.fillText("┄ Amperian loop", width - pad, pad + 44);
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
            n (turns/m)
          </label>
          <input
            type="range"
            min={100}
            max={5000}
            step={100}
            value={n}
            onChange={(e) => setN(parseInt(e.target.value, 10))}
            className="flex-1 accent-[#FF6ADE]"
          />
          <span className="w-16 text-right font-mono text-xs text-[var(--color-fg-1)]">
            {n}
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
) {
  const r = 6;
  const color = dir === "out" ? MAGENTA : CYAN;
  ctx.shadowColor = `${color}AA`;
  ctx.shadowBlur = 8;
  ctx.fillStyle = "#0E0F18";
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  if (dir === "out") {
    // dot in the centre = arrow tip coming toward you
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 1.6, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // X = arrow fletching going away
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
  len: number,
  color: string,
) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(x - len / 2, y);
  ctx.lineTo(x + len / 2, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + len / 2, y);
  ctx.lineTo(x + len / 2 - 5, y - 3);
  ctx.lineTo(x + len / 2 - 5, y + 3);
  ctx.closePath();
  ctx.fill();
}
