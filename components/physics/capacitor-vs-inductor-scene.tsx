"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { energyStored } from "@/lib/physics/capacitance";
import { inductorEnergy } from "@/lib/physics/electromagnetism/magnetic-energy";

const RATIO = 0.55;
const MAX_HEIGHT = 360;

const TAU_C = 1.4; // RC in seconds (visual)
const TAU_L = 1.4; // L/R in seconds (visual) — chosen equal so shapes overlay
const CYCLE = TAU_C * 5.5 + 1;

const C = 1.0; // farads, scene units
const V_MAX = 2.5; // volts, scene units
const L = 1.0; // henries, scene units
const I_MAX = 2.5; // amperes, scene units

/**
 * FIG.24c — the mirror pair.
 *
 * Left panel: capacitor with plates, V(t) ramps along the RC curve, shaded
 * E-field between plates (§01.5 echo). Energy label U_E = ½CV².
 * Right panel: inductor coil with current ramping along the RL curve,
 * shaded B-field inside the coil. Energy label U_B = ½LI².
 *
 * Both panels share the same time axis; with matched τ, the two curves have
 * the same shape. Different field, different equation, same geometry.
 *
 * The middle strip shows the symmetry table:
 *   ½CV²   ↔   ½LI²
 *   ½ε₀E²  ↔   B²/(2μ₀)
 *
 * Caption reads: "electricity and magnetism are each other's mirror images."
 */
export function CapacitorVsInductorScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 680, height: 360 });
  const startRef = useRef<number>(0);
  const tNowRef = useRef<number>(0);

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
      tNowRef.current = t;
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

      let elapsed = t - startRef.current;
      if (elapsed > CYCLE) {
        startRef.current = t;
        elapsed = 0;
      }

      const V = V_MAX * (1 - Math.exp(-elapsed / TAU_C));
      const I = I_MAX * (1 - Math.exp(-elapsed / TAU_L));
      const U_E = energyStored(C, V);
      const U_B = inductorEnergy(L, I);
      const U_E_max = energyStored(C, V_MAX);
      const U_B_max = inductorEnergy(L, I_MAX);

      // Layout
      const midW = 140;
      const panelW = (width - midW - 40) / 2;
      const leftL = 20;
      const leftR = leftL + panelW;
      const rightL = leftR + midW;
      const rightR = rightL + panelW;
      const panelTop = 40;
      const panelBot = height - 48;

      drawCapacitorPanel(ctx, {
        left: leftL,
        right: leftR,
        top: panelTop,
        bottom: panelBot,
        fillFrac: V / V_MAX,
        uFrac: U_E / U_E_max,
        V,
        U: U_E,
        colors,
      });
      drawInductorPanel(ctx, {
        left: rightL,
        right: rightR,
        top: panelTop,
        bottom: panelBot,
        fillFrac: I / I_MAX,
        uFrac: U_B / U_B_max,
        I,
        U: U_B,
        t,
        colors,
      });

      // Middle symmetry table
      drawSymmetryStrip(ctx, leftR, rightL, panelTop, panelBot, colors);

      // Footer caption
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        "electricity and magnetism are each other's mirror images",
        width / 2,
        height - 14,
      );
    },
  });

  const handleReset = () => {
    startRef.current = tNowRef.current;
  };

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-2 flex items-center justify-between px-2 font-mono text-xs">
        <span className="text-[var(--color-fg-3)]">
          matched τ = RC = L/R · same ramp shape · different field, different formula
        </span>
        <button
          type="button"
          onClick={handleReset}
          className="border border-[var(--color-fg-4)] px-3 py-1 text-[var(--color-fg-1)] transition-colors hover:border-[#FF6ADE] hover:text-[#FF6ADE]"
        >
          reset
        </button>
      </div>
    </div>
  );
}

function drawCapacitorPanel(
  ctx: CanvasRenderingContext2D,
  opts: {
    left: number;
    right: number;
    top: number;
    bottom: number;
    fillFrac: number;
    uFrac: number;
    V: number;
    U: number;
    colors: { fg1: string; fg2: string; fg3: string };
  },
) {
  const { left, right, top, bottom, fillFrac, uFrac, V, U, colors } = opts;
  const cx = (left + right) / 2;
  const w = right - left;
  const h = bottom - top;

  // Panel outline
  ctx.strokeStyle = colors.fg3;
  ctx.lineWidth = 1;
  ctx.strokeRect(left, top, w, h);

  ctx.fillStyle = colors.fg1;
  ctx.font = "12px monospace";
  ctx.textAlign = "center";
  ctx.fillText("CAPACITOR", cx, top + 18);
  ctx.fillStyle = colors.fg2;
  ctx.font = "11px monospace";
  ctx.fillText("U_E = ½ C V²", cx, top + 34);

  // Plates — horizontal, two lines in the panel middle
  const plateW = w * 0.6;
  const plateL = cx - plateW / 2;
  const plateR = cx + plateW / 2;
  const gap = h * 0.32;
  const midY = top + h * 0.55;
  const yT = midY - gap / 2;
  const yB = midY + gap / 2;

  // E-field shading (cyan + magenta wash, scales with u = ½ε₀E² ∝ V²)
  const cyanA = Math.min(0.55, 0.1 + 0.6 * uFrac);
  const magentaA = Math.min(0.5, uFrac * 0.65);
  ctx.fillStyle = `rgba(111, 184, 198, ${cyanA.toFixed(3)})`;
  ctx.fillRect(plateL, yT, plateW, gap);
  ctx.fillStyle = `rgba(255, 106, 222, ${magentaA.toFixed(3)})`;
  ctx.fillRect(plateL, yT, plateW, gap);

  // E-field arrows (top → bottom)
  const arrowAlpha = (0.3 + 0.6 * fillFrac).toFixed(3);
  ctx.strokeStyle = `rgba(230, 237, 247, ${arrowAlpha})`;
  ctx.fillStyle = `rgba(230, 237, 247, ${arrowAlpha})`;
  ctx.lineWidth = 1.2;
  const nArr = 5;
  for (let i = 1; i <= nArr; i++) {
    const ax = plateL + (plateW / (nArr + 1)) * i;
    ctx.beginPath();
    ctx.moveTo(ax, yT + 6);
    ctx.lineTo(ax, yB - 6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ax, yB - 6);
    ctx.lineTo(ax - 3, yB - 10);
    ctx.lineTo(ax + 3, yB - 10);
    ctx.closePath();
    ctx.fill();
  }

  // Plates
  const posA = 0.35 + 0.6 * fillFrac;
  ctx.fillStyle = `rgba(255, 106, 222, ${posA.toFixed(3)})`;
  ctx.fillRect(plateL, yT - 3, plateW, 4);
  ctx.fillStyle = `rgba(111, 184, 198, ${posA.toFixed(3)})`;
  ctx.fillRect(plateL, yB - 1, plateW, 4);

  // HUD
  ctx.fillStyle = colors.fg1;
  ctx.font = "11px monospace";
  ctx.textAlign = "left";
  ctx.fillText(`V = ${V.toFixed(2)} V`, left + 10, bottom - 24);
  ctx.fillText(`U_E = ${U.toFixed(3)} J`, left + 10, bottom - 8);

  // Field label
  ctx.fillStyle = "rgba(111, 184, 198, 0.95)";
  ctx.textAlign = "right";
  ctx.font = "10px monospace";
  ctx.fillText("E", right - 10, midY - 4);
}

function drawInductorPanel(
  ctx: CanvasRenderingContext2D,
  opts: {
    left: number;
    right: number;
    top: number;
    bottom: number;
    fillFrac: number;
    uFrac: number;
    I: number;
    U: number;
    t: number;
    colors: { fg1: string; fg2: string; fg3: string };
  },
) {
  const { left, right, top, bottom, fillFrac, uFrac, I, U, t, colors } = opts;
  const cx = (left + right) / 2;
  const w = right - left;
  const h = bottom - top;

  ctx.strokeStyle = colors.fg3;
  ctx.lineWidth = 1;
  ctx.strokeRect(left, top, w, h);

  ctx.fillStyle = colors.fg1;
  ctx.font = "12px monospace";
  ctx.textAlign = "center";
  ctx.fillText("INDUCTOR", cx, top + 18);
  ctx.fillStyle = colors.fg2;
  ctx.font = "11px monospace";
  ctx.fillText("U_B = ½ L I²", cx, top + 34);

  // Coil: horizontal solenoid cross-section shown as stacked loops
  const coilL = cx - w * 0.3;
  const coilR = cx + w * 0.3;
  const coilW = coilR - coilL;
  const coilH = h * 0.32;
  const midY = top + h * 0.55;
  const yT = midY - coilH / 2;
  const yB = midY + coilH / 2;

  // Interior B-field shading (cyan/magenta wash, scales with u ∝ I²)
  const cyanA = Math.min(0.55, 0.1 + 0.6 * uFrac);
  const magentaA = Math.min(0.5, uFrac * 0.65);
  ctx.fillStyle = `rgba(111, 184, 198, ${cyanA.toFixed(3)})`;
  ctx.fillRect(coilL, yT, coilW, coilH);
  ctx.fillStyle = `rgba(255, 106, 222, ${magentaA.toFixed(3)})`;
  ctx.fillRect(coilL, yT, coilW, coilH);

  // B-field arrows inside (left → right)
  const arrowAlpha = (0.3 + 0.6 * fillFrac).toFixed(3);
  ctx.strokeStyle = `rgba(120, 220, 255, ${arrowAlpha})`;
  ctx.fillStyle = `rgba(120, 220, 255, ${arrowAlpha})`;
  ctx.lineWidth = 1.4;
  const nArr = 4;
  for (let i = 1; i <= nArr; i++) {
    const ay = yT + (coilH / (nArr + 1)) * i;
    ctx.beginPath();
    ctx.moveTo(coilL + 8, ay);
    ctx.lineTo(coilR - 8, ay);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(coilR - 8, ay);
    ctx.lineTo(coilR - 12, ay - 3);
    ctx.lineTo(coilR - 12, ay + 3);
    ctx.closePath();
    ctx.fill();
  }

  // Coil turns as vertical segments on top/bottom edges — like a cutaway
  // solenoid: dots on top (current out), crosses on bottom (current in)
  ctx.strokeStyle = "rgba(182, 196, 216, 0.85)";
  ctx.fillStyle = "rgba(182, 196, 216, 0.85)";
  ctx.lineWidth = 1;
  const nTurns = 8;
  for (let i = 0; i < nTurns; i++) {
    const tx = coilL + (coilW / (nTurns - 1)) * i;
    // top: circle with dot (current out of page) — amber for current
    ctx.strokeStyle = `rgba(255, 214, 107, ${arrowAlpha})`;
    ctx.fillStyle = `rgba(255, 214, 107, ${arrowAlpha})`;
    ctx.beginPath();
    ctx.arc(tx, yT - 6, 3.2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(tx, yT - 6, 1.0, 0, Math.PI * 2);
    ctx.fill();
    // bottom: circle with × (current into page)
    ctx.beginPath();
    ctx.arc(tx, yB + 6, 3.2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(tx - 1.8, yB + 6 - 1.8);
    ctx.lineTo(tx + 1.8, yB + 6 + 1.8);
    ctx.moveTo(tx + 1.8, yB + 6 - 1.8);
    ctx.lineTo(tx - 1.8, yB + 6 + 1.8);
    ctx.stroke();
  }

  // Subtle ramping "current dot" slides across the top of coil
  if (fillFrac > 0.02) {
    const nDots = 3;
    const speed = 0.6 + 2 * fillFrac;
    const phase = (t * speed) % 1;
    ctx.fillStyle = `rgba(255, 214, 107, ${(0.3 + 0.6 * fillFrac).toFixed(3)})`;
    for (let i = 0; i < nDots; i++) {
      const u = (phase + i / nDots) % 1;
      const dx = coilL + u * coilW;
      ctx.beginPath();
      ctx.arc(dx, yT - 16, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.fillStyle = colors.fg1;
  ctx.font = "11px monospace";
  ctx.textAlign = "left";
  ctx.fillText(`I = ${I.toFixed(2)} A`, left + 10, bottom - 24);
  ctx.fillText(`U_B = ${U.toFixed(3)} J`, left + 10, bottom - 8);

  ctx.fillStyle = "rgba(120, 220, 255, 0.95)";
  ctx.textAlign = "right";
  ctx.font = "10px monospace";
  ctx.fillText("B", right - 10, midY - 4);
}

function drawSymmetryStrip(
  ctx: CanvasRenderingContext2D,
  leftEdge: number,
  rightEdge: number,
  top: number,
  bottom: number,
  colors: { fg1: string; fg2: string; fg3: string },
) {
  const cx = (leftEdge + rightEdge) / 2;
  const h = bottom - top;
  const midY = top + h / 2;

  ctx.fillStyle = colors.fg1;
  ctx.textAlign = "center";
  ctx.font = "13px monospace";
  ctx.fillText("↔", cx, midY - 40);
  ctx.fillText("↔", cx, midY - 4);
  ctx.fillText("↔", cx, midY + 32);

  ctx.fillStyle = colors.fg2;
  ctx.font = "11px monospace";
  ctx.fillText("½CV²  ·  ½LI²", cx, midY - 54);
  ctx.fillText("½ε₀E² · B²/(2μ₀)", cx, midY - 18);
  ctx.fillText("E-field  ·  B-field", cx, midY + 18);

  ctx.fillStyle = colors.fg3;
  ctx.font = "10px monospace";
  ctx.fillText("mirror symmetry", cx, top + 20);
}
