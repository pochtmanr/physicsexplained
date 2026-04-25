"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  ELEMENTARY_CHARGE,
  MU_0,
  SPEED_OF_LIGHT,
} from "@/lib/physics/constants";
import { magneticForcePerLength } from "@/lib/physics/electromagnetism/relativistic-magnetism";

/**
 * FIG.61a — Two-wire setup, drawn in the LAB FRAME.
 *
 * Two parallel wires both carrying current I to the right. Magenta + ions
 * (lattice) sit motionless on each wire; cyan electrons drift to the right
 * at v_drift, depicted with leftward-trailing ghost positions to convey
 * motion. The wires are net-neutral (per-length count of magenta = per-
 * length count of cyan). Cyan B-field arrows in the gap between the wires
 * convey the magnetic attraction. HUD reports the live magnetic-force-per-
 * length and the current.
 *
 * The β slider is shared (via a module-level store) with the companion
 * electron-frame and force-equivalence scenes, so the user can drag β in
 * one panel and watch all three update in lockstep — the central pedagogy.
 */

// ── shared β store ───────────────────────────────────────────────────────
// All three §11.4 scenes synchronise on a single β value via this store.
// We use a logarithmic mapping in the slider UI so the user can sweep from
// the realistic copper drift (~10⁻¹²) up through 0.99 c on a single bar.

let _beta = 0.5; // β = v/c. Default mid-range so the lab-frame B-field is visible.
type BetaListener = () => void;
const _listeners = new Set<BetaListener>();
const subscribe = (l: BetaListener) => {
  _listeners.add(l);
  return () => {
    _listeners.delete(l);
  };
};
const getBeta = () => _beta;
export function setBeta(beta: number) {
  _beta = Math.max(0, Math.min(0.99, beta));
  _listeners.forEach((l) => l());
}
export function useSharedBeta(): number {
  return useSyncExternalStore(
    subscribe,
    getBeta,
    () => 0.5, // SSR fallback
  );
}

const RATIO = 0.55;
const MAX_HEIGHT = 360;

// Lattice line density in the visualisation (charges per metre of canvas).
// Used purely for the HUD numerics — picks a copper-like 10²⁹/m.
const N0_VIZ = 1e29;
const D_VIZ = 0.01; // 1 cm separation

export function TwoWireLabFrameScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const beta = useSharedBeta();

  const betaRef = useRef(beta);
  useEffect(() => {
    betaRef.current = beta;
  }, [beta]);

  const [size, setSize] = useState({ width: 640, height: 360 });
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) setSize({ width: w, height: Math.min(w * RATIO, MAX_HEIGHT) });
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

      const b = betaRef.current;

      // ── geometry ───────────────────────────────────────────────────────
      const padX = 64;
      const cy1 = height * 0.32;
      const cy2 = height * 0.74;
      const wireL = padX;
      const wireR = width - padX;
      const wireLen = wireR - wireL;
      const dotCount = 18;
      const dotSpacing = wireLen / (dotCount - 1);

      // Drift speed for the cyan-electron animation, in pixels/sec. Mapped
      // visually to β so the user can see the flow speed up — but capped so
      // it never blurs to invisibility.
      const vPx = 30 + 90 * b;
      const driftOffset = ((t * vPx) % dotSpacing) - dotSpacing;

      // ── wires ─────────────────────────────────────────────────────────
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1.4;
      for (const cy of [cy1, cy2]) {
        ctx.beginPath();
        ctx.moveTo(wireL - 14, cy);
        ctx.lineTo(wireR + 14, cy);
        ctx.stroke();
      }

      // ── magenta lattice + cyan electrons on each wire ─────────────────
      for (const cy of [cy1, cy2]) {
        // Lattice — static magenta dots, slightly larger.
        for (let i = 0; i < dotCount; i++) {
          const x = wireL + i * dotSpacing;
          ctx.fillStyle = "rgba(255, 106, 222, 0.95)";
          ctx.beginPath();
          ctx.arc(x, cy - 5, 3.6, 0, Math.PI * 2);
          ctx.fill();
        }
        // Electrons — cyan dots drifting right; their offset is the wrap-
        // around translation, with a faint trailing ghost.
        for (let i = 0; i < dotCount + 1; i++) {
          const x = wireL + i * dotSpacing + driftOffset;
          if (x < wireL - 4 || x > wireR + 4) continue;
          // Trailing ghost at the previous step.
          ctx.fillStyle = "rgba(111, 184, 198, 0.22)";
          ctx.beginPath();
          ctx.arc(x - 6, cy + 5, 2.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "rgba(111, 184, 198, 0.95)";
          ctx.beginPath();
          ctx.arc(x, cy + 5, 3.0, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ── current arrow on each wire (right-pointing) ───────────────────
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText("I →", wireR + 6, cy1 - 12);
      ctx.fillText("I →", wireR + 6, cy2 - 12);

      // ── B-field cyan arrows in the gap (attraction cue) ───────────────
      const gapMid = (cy1 + cy2) / 2;
      const arrowAlpha = 0.35 + 0.55 * Math.min(1, b * 4);
      const Barrows = 6;
      for (let k = 0; k < Barrows; k++) {
        const x = wireL + ((k + 0.5) / Barrows) * wireLen;
        // top wire pulled DOWN
        drawArrow(
          ctx,
          x,
          cy1 + 14,
          x,
          gapMid - 4,
          `rgba(111, 184, 198, ${arrowAlpha.toFixed(3)})`,
          1.6,
        );
        // bottom wire pulled UP
        drawArrow(
          ctx,
          x,
          cy2 - 14,
          x,
          gapMid + 4,
          `rgba(111, 184, 198, ${arrowAlpha.toFixed(3)})`,
          1.6,
        );
      }

      // ── separation marker d ───────────────────────────────────────────
      ctx.strokeStyle = colors.fg3;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(wireL - 24, cy1);
      ctx.lineTo(wireL - 24, cy2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = colors.fg2;
      ctx.textAlign = "right";
      ctx.fillText("d", wireL - 30, (cy1 + cy2) / 2);

      // ── HUD ───────────────────────────────────────────────────────────
      const v = b * SPEED_OF_LIGHT;
      const I = N0_VIZ * ELEMENTARY_CHARGE * v;
      const F = magneticForcePerLength(I, I, D_VIZ);

      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillText("LAB FRAME — wires are neutral", 14, 22);
      ctx.textAlign = "right";
      ctx.fillStyle = colors.fg2;
      ctx.fillText("F_mag = (μ₀ I²) / (2π d)", width - 14, 22);
      ctx.fillStyle = colors.fg1;
      ctx.fillText(
        `I = n₀ e v = ${formatSci(I)} A    F/L = ${formatSci(F)} N/m`,
        width - 14,
        height - 12,
      );

      // ── footer key ────────────────────────────────────────────────────
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText("magenta = lattice (static)", 14, height - 26);
      ctx.fillText("cyan = drift electrons (→)", 14, height - 12);

      // β indicator (top-left under heading)
      ctx.textAlign = "left";
      ctx.fillStyle = colors.fg2;
      ctx.fillText(`β = v/c = ${formatBeta(b)}`, 14, 40);
      // mute the constant so it's clear we're using μ₀ I² / 2π d
      void MU_0;
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <BetaSlider />
      <div className="mt-1 px-2 text-xs text-[var(--color-fg-3)]">
        Slide β. Magenta lattice ions sit still; cyan electrons drift right at
        v = βc. The wires stay neutral, but the gap fills with a magnetic
        attraction proportional to I².
      </div>
    </div>
  );
}

// ── shared β slider control ──────────────────────────────────────────────
//
// Maps a [0,1] log-scaled handle to β in [10⁻¹², 0.99]. This way the
// realistic mm/s drift sits at the left edge and 0.99 c at the right edge
// on a uniform sweep, so the user can scrub through the entire transition
// — no drift / mild drift / relativistic — in one continuous motion.

const BETA_MIN_LOG = -12; // log10(β) lower bound
const BETA_MAX_LOG = Math.log10(0.99);

function sliderToBeta(s: number): number {
  if (s <= 0) return 0;
  const lg = BETA_MIN_LOG + (BETA_MAX_LOG - BETA_MIN_LOG) * s;
  return Math.min(0.99, Math.pow(10, lg));
}
function betaToSlider(beta: number): number {
  if (beta <= 0) return 0;
  const lg = Math.log10(Math.max(beta, Math.pow(10, BETA_MIN_LOG)));
  return (lg - BETA_MIN_LOG) / (BETA_MAX_LOG - BETA_MIN_LOG);
}

export function BetaSlider() {
  const beta = useSharedBeta();
  const sliderVal = betaToSlider(beta);
  return (
    <div className="mt-2 flex items-center gap-3 px-2">
      <label className="text-sm text-[var(--color-fg-3)]">β = v/c</label>
      <input
        type="range"
        min={0}
        max={1}
        step={0.001}
        value={sliderVal}
        onChange={(e) => setBeta(sliderToBeta(parseFloat(e.target.value)))}
        className="flex-1 accent-[#FF6ADE]"
      />
      <span className="w-28 text-right text-sm font-mono text-[var(--color-fg-1)]">
        {formatBeta(beta)}
      </span>
    </div>
  );
}

// ── shared helpers ───────────────────────────────────────────────────────
export function formatBeta(beta: number): string {
  if (beta < 1e-6) return beta.toExponential(2);
  if (beta < 0.01) return beta.toExponential(2);
  return beta.toFixed(3);
}

export function formatSci(x: number): string {
  if (x === 0) return "0";
  const abs = Math.abs(x);
  if (abs >= 0.01 && abs < 1000) return x.toFixed(3);
  return x.toExponential(2);
}

export function drawArrow(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  lineWidth: number,
) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  if (len < 0.5) return;
  const ux = dx / len;
  const uy = dy / len;
  const head = Math.min(8, len * 0.35);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  const nx = -uy;
  const ny = ux;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(
    x1 - ux * head + nx * head * 0.5,
    y1 - uy * head + ny * head * 0.5,
  );
  ctx.lineTo(
    x1 - ux * head - nx * head * 0.5,
    y1 - uy * head - ny * head * 0.5,
  );
  ctx.closePath();
  ctx.fill();
}

// Constants exposed for sibling scenes' HUD math.
export const SCENE_N0 = N0_VIZ;
export const SCENE_D = D_VIZ;
