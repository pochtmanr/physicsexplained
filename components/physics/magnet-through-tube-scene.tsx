"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { tubeTerminalVelocity } from "@/lib/physics/electromagnetism/eddy-currents";

const RATIO = 0.62;
const MAX_HEIGHT = 520;

// Scene-space parameters (arbitrary but tuned so the fall looks real).
const MAGNET_MASS = 1.0;
const G = 9.81;
const SIGMA = 6e6;            // "copper-ish" conductivity in scene units
const B_EFF = 0.45;           // peak field near tube wall (scene units, T)
const K_GEOM = 1.4e-6;        // geometry constant (scene units, m³)
const TUBE_LENGTH = 3.0;      // metres of tube
const RESET_PAUSE_S = 1.2;    // pause at the bottom before restarting
const DROP_INTERVAL_S = 8.5;  // total cycle length

/**
 * FIG.25a — the money shot.
 *
 * Side-view of a vertical copper tube. A bar magnet (magenta N, cyan S)
 * is released at the top and falls in slow motion. As it passes each
 * horizontal ring of tube wall, the flux through that ring rises then
 * falls, driving an induced current one way then the other. Lenz's law
 * makes that current oppose the magnet's motion — a retarding force
 * that balances gravity and caps the fall at a terminal velocity.
 *
 * Left panel: position y(t). Right panel: velocity v(t) approaching the
 * terminal-velocity asymptote (dashed amber line).
 *
 * The induced currents are rendered as bright green-cyan rings just
 * above and just below the magnet, with brightness scaled by |dΦ/dt|
 * (i.e. the magnet's speed and proximity).
 */
export function MagnetThroughTubeScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 720, height: 460 });

  // Physics state
  const stateRef = useRef({
    y: 0,          // magnet centre, metres from top of tube
    v: 0,          // downward velocity, m/s
    cycleStart: 0, // time the current drop started
    phase: "fall" as "fall" | "rest",
    restStart: 0,
    // Per-frame traces (for panel plots)
    traceY: [] as { t: number; y: number }[],
    traceV: [] as { t: number; v: number }[],
  });

  const vTerm = tubeTerminalVelocity(MAGNET_MASS, G, SIGMA, B_EFF, K_GEOM);

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
    onFrame: (t, dt) => {
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

      const s = stateRef.current;
      const h = Math.min(dt, 1 / 50);

      // ── Step physics ──
      if (s.phase === "fall") {
        // Linear drag balancing gravity: a = g − (g / v_term) · v
        // (Gives exponential approach to v_term, τ = v_term / g.)
        const a = G - (G / vTerm) * s.v;
        s.v += a * h;
        s.y += s.v * h;

        const tSinceStart = t - s.cycleStart;
        s.traceY.push({ t: tSinceStart, y: s.y });
        s.traceV.push({ t: tSinceStart, v: s.v });
        if (s.traceY.length > 1200) s.traceY.shift();
        if (s.traceV.length > 1200) s.traceV.shift();

        if (s.y >= TUBE_LENGTH) {
          s.y = TUBE_LENGTH;
          s.phase = "rest";
          s.restStart = t;
        }
      } else if (s.phase === "rest") {
        if (t - s.restStart > RESET_PAUSE_S) {
          s.y = 0;
          s.v = 0;
          s.cycleStart = t;
          s.traceY = [];
          s.traceV = [];
          s.phase = "fall";
        }
      }

      // Also reset on long cycles (safety)
      if (t - s.cycleStart > DROP_INTERVAL_S * 2) {
        s.y = 0;
        s.v = 0;
        s.cycleStart = t;
        s.traceY = [];
        s.traceV = [];
        s.phase = "fall";
      }

      // ── Render ──
      ctx.clearRect(0, 0, width, height);

      // Layout: left 45% — tube; right 55% — two stacked panels.
      const tubeW = width * 0.38;
      const panelsX = tubeW + 28;
      const panelsW = width - panelsX - 12;

      drawTube(ctx, colors, width, height, tubeW, s.y, s.v, vTerm);
      drawPanels(
        ctx,
        colors,
        panelsX,
        12,
        panelsW,
        height - 24,
        s.traceY,
        s.traceV,
        vTerm,
      );
      drawRHRBadge(ctx, 10, height - 12, colors);

      // HUD top-left
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillStyle = colors.fg1;
      ctx.fillText("FIG.25a — the tube is not touching the magnet", 12, 18);
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.fillText("v_term ≈ m g / (k σ B²)", 12, 32);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <p className="mt-2 px-2 text-xs font-mono text-[var(--color-fg-3)]">
        induced current rings (green-cyan) glow above and below the magnet;
        each loop opposes the flux change that created it (Lenz)
      </p>
    </div>
  );
}

// ─── drawing helpers ────────────────────────────────────────────────────────

const RING_RGB = "120, 255, 170"; // induced-current glow

function drawTube(
  ctx: CanvasRenderingContext2D,
  colors: { fg1: string; fg2: string; fg3: string },
  _width: number,
  height: number,
  tubeW: number,
  yMag: number,
  vMag: number,
  vTerm: number,
) {
  const padT = 28;
  const padB = 28;
  const tubeH = height - padT - padB;
  const cx = tubeW / 2 + 14;
  const tubeInnerW = tubeW * 0.42;
  const tubeOuterW = tubeW * 0.58;

  // Tube walls (front and back as two vertical shaded bars).
  const leftOuter = cx - tubeOuterW / 2;
  const leftInner = cx - tubeInnerW / 2;
  const rightInner = cx + tubeInnerW / 2;
  const rightOuter = cx + tubeOuterW / 2;

  // Copper gradient on the walls.
  const grad = ctx.createLinearGradient(leftOuter, 0, rightOuter, 0);
  grad.addColorStop(0, "rgba(180, 120, 90, 0.35)");
  grad.addColorStop(0.5, "rgba(220, 160, 110, 0.5)");
  grad.addColorStop(1, "rgba(180, 120, 90, 0.35)");
  ctx.fillStyle = grad;
  ctx.fillRect(leftOuter, padT, leftInner - leftOuter, tubeH);
  ctx.fillRect(rightInner, padT, rightOuter - rightInner, tubeH);

  // Tube outline
  ctx.strokeStyle = colors.fg3;
  ctx.lineWidth = 1;
  ctx.strokeRect(leftOuter, padT, leftInner - leftOuter, tubeH);
  ctx.strokeRect(rightInner, padT, rightOuter - rightInner, tubeH);

  // ── Current-density heatmap on tube walls ──
  // Each horizontal ring glows with brightness ∝ |v| · exp(−(y_ring − y_mag)²/ℓ²)
  const ringSpacing = 8;
  const ringHalfWidth = 40; // pixels; how far above/below the magnet to glow
  const magY = padT + (yMag / TUBE_LENGTH) * tubeH;
  const intensity = Math.min(1, Math.abs(vMag) / Math.max(0.01, vTerm * 1.1));

  for (let y = padT; y <= padT + tubeH; y += ringSpacing) {
    const dy = y - magY;
    const falloff = Math.exp(-(dy * dy) / (ringHalfWidth * ringHalfWidth));
    const above = dy < 0 ? 1 : 0.55;
    const below = dy > 0 ? 1 : 0.55;
    const weight = falloff * intensity * (dy < 0 ? above : below);
    if (weight < 0.03) continue;

    // Above magnet = current going one way (say counter-clockwise from viewer),
    // Below magnet = opposite. Render as luminous bands across the walls.
    ctx.strokeStyle = `rgba(${RING_RGB}, ${Math.min(0.95, weight * 1.1)})`;
    ctx.lineWidth = 2 + 2 * weight;
    ctx.shadowColor = `rgba(${RING_RGB}, ${weight * 0.9})`;
    ctx.shadowBlur = 8 * weight;
    // Left wall
    ctx.beginPath();
    ctx.moveTo(leftOuter, y);
    ctx.lineTo(leftInner, y);
    ctx.stroke();
    // Right wall
    ctx.beginPath();
    ctx.moveTo(rightInner, y);
    ctx.lineTo(rightOuter, y);
    ctx.stroke();
    // Arrow heads on the front-facing side to hint at circulation direction.
    const arrowX = rightOuter + 4;
    ctx.fillStyle = `rgba(${RING_RGB}, ${Math.min(0.9, weight)})`;
    ctx.beginPath();
    if (dy < 0) {
      // above: arrow pointing up (current opposing approaching flux)
      ctx.moveTo(arrowX, y);
      ctx.lineTo(arrowX + 6, y + 3);
      ctx.lineTo(arrowX + 6, y - 3);
    } else {
      ctx.moveTo(arrowX, y);
      ctx.lineTo(arrowX + 6, y - 3);
      ctx.lineTo(arrowX + 6, y + 3);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.shadowBlur = 0;

  // ── Magnet ──
  const magHpx = tubeH * 0.08;
  const magWpx = tubeInnerW * 0.75;
  const magX = cx - magWpx / 2;
  const magTop = magY - magHpx / 2;

  // N pole (top, magenta)
  ctx.fillStyle = "#FF6ADE";
  ctx.shadowColor = "rgba(255, 106, 222, 0.7)";
  ctx.shadowBlur = 8;
  ctx.fillRect(magX, magTop, magWpx, magHpx / 2);
  // S pole (bottom, cyan)
  ctx.fillStyle = "rgba(120, 220, 255, 1)";
  ctx.shadowColor = "rgba(120, 220, 255, 0.7)";
  ctx.fillRect(magX, magTop + magHpx / 2, magWpx, magHpx / 2);
  ctx.shadowBlur = 0;

  // Pole labels
  ctx.fillStyle = "#07090E";
  ctx.font = "bold 10px monospace";
  ctx.textAlign = "center";
  ctx.fillText("N", cx, magTop + magHpx / 4 + 4);
  ctx.fillText("S", cx, magTop + (3 * magHpx) / 4 + 4);

  // ── Caption under tube ──
  ctx.fillStyle = colors.fg2;
  ctx.font = "9px monospace";
  ctx.textAlign = "center";
  ctx.fillText("copper tube", cx, padT + tubeH + 14);
  ctx.fillText(
    `|v| = ${vMag.toFixed(3)} m/s`,
    cx,
    padT + tubeH + 26,
  );
}

function drawPanels(
  ctx: CanvasRenderingContext2D,
  colors: { fg1: string; fg2: string; fg3: string },
  x: number,
  y: number,
  w: number,
  h: number,
  traceY: { t: number; y: number }[],
  traceV: { t: number; v: number }[],
  vTerm: number,
) {
  const gap = 10;
  const panelH = (h - gap) / 2;

  // Top panel: position vs time
  drawPanelFrame(ctx, colors, x, y, w, panelH, "y(t)  position");
  const tMax = Math.max(1, traceY.length > 0 ? traceY[traceY.length - 1]!.t : 1);
  plotTrace(
    ctx,
    x,
    y,
    w,
    panelH,
    traceY.map((p) => ({ t: p.t, v: p.y })),
    tMax,
    TUBE_LENGTH * 1.05,
    "rgba(255, 214, 107, 0.9)",
    "rgba(255, 214, 107, 0.25)",
  );

  // Bottom panel: velocity vs time
  const by = y + panelH + gap;
  drawPanelFrame(ctx, colors, x, by, w, panelH, "v(t)  velocity");
  plotTrace(
    ctx,
    x,
    by,
    w,
    panelH,
    traceV.map((p) => ({ t: p.t, v: p.v })),
    tMax,
    vTerm * 1.3,
    `rgba(${RING_RGB}, 0.95)`,
    `rgba(${RING_RGB}, 0.25)`,
  );

  // Terminal-velocity asymptote (dashed amber)
  const padL = 42;
  const padR = 10;
  const padT = 20;
  const padB = 20;
  const plotH = panelH - padT - padB;
  const plotW = w - padL - padR;
  const yTerm = by + padT + (1 - vTerm / (vTerm * 1.3)) * plotH;
  ctx.strokeStyle = "rgba(255, 214, 107, 0.8)";
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + padL, yTerm);
  ctx.lineTo(x + padL + plotW, yTerm);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(255, 214, 107, 0.9)";
  ctx.font = "10px monospace";
  ctx.textAlign = "right";
  ctx.fillText(
    `v_term ≈ ${vTerm.toFixed(2)} m/s`,
    x + padL + plotW - 4,
    yTerm - 4,
  );
}

function drawPanelFrame(
  ctx: CanvasRenderingContext2D,
  colors: { fg1: string; fg2: string; fg3: string },
  x: number,
  y: number,
  w: number,
  h: number,
  title: string,
) {
  ctx.strokeStyle = colors.fg3;
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = colors.fg2;
  ctx.font = "10px monospace";
  ctx.textAlign = "left";
  ctx.fillText(title, x + 6, y + 12);
}

function plotTrace(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  pts: { t: number; v: number }[],
  tMax: number,
  vMax: number,
  stroke: string,
  fill: string,
) {
  const padL = 42;
  const padR = 10;
  const padT = 20;
  const padB = 20;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  // Axes
  ctx.strokeStyle = "rgba(86, 104, 127, 0.5)";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(x + padL, y + padT);
  ctx.lineTo(x + padL, y + padT + plotH);
  ctx.lineTo(x + padL + plotW, y + padT + plotH);
  ctx.stroke();

  if (pts.length < 2) return;

  // Fill under curve
  ctx.beginPath();
  ctx.moveTo(x + padL, y + padT + plotH);
  for (const p of pts) {
    const px = x + padL + Math.min(1, p.t / tMax) * plotW;
    const py = y + padT + (1 - Math.min(1, p.v / vMax)) * plotH;
    ctx.lineTo(px, py);
  }
  ctx.lineTo(
    x + padL + Math.min(1, pts[pts.length - 1]!.t / tMax) * plotW,
    y + padT + plotH,
  );
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();

  // Line on top
  ctx.beginPath();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.6;
  ctx.shadowColor = stroke;
  ctx.shadowBlur = 4;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i]!;
    const px = x + padL + Math.min(1, p.t / tMax) * plotW;
    const py = y + padT + (1 - Math.min(1, p.v / vMax)) * plotH;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function drawRHRBadge(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  colors: { fg2: string; fg3: string },
) {
  // Right-hand rule axes: x̂ right, ŷ up, ẑ out (dot in circle). Above, a
  // small curl arrow hinting at the circulating current direction.
  const len = 16;
  ctx.strokeStyle = colors.fg2;
  ctx.fillStyle = colors.fg2;
  ctx.lineWidth = 1.2;

  // x̂ right
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(ox + len, oy);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(ox + len, oy);
  ctx.lineTo(ox + len - 4, oy - 3);
  ctx.lineTo(ox + len - 4, oy + 3);
  ctx.closePath();
  ctx.fill();

  // ŷ up
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(ox, oy - len);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(ox, oy - len);
  ctx.lineTo(ox - 3, oy - len + 4);
  ctx.lineTo(ox + 3, oy - len + 4);
  ctx.closePath();
  ctx.fill();

  // ẑ out
  ctx.strokeStyle = `rgba(${RING_RGB}, 0.8)`;
  ctx.fillStyle = `rgba(${RING_RGB}, 0.95)`;
  ctx.beginPath();
  ctx.arc(ox + 12, oy - 12, 5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(ox + 12, oy - 12, 1.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = colors.fg3;
  ctx.font = "9px monospace";
  ctx.textAlign = "left";
  ctx.fillText("x̂", ox + len + 2, oy + 4);
  ctx.fillText("ŷ", ox - 3, oy - len - 3);
  ctx.fillText("I", ox + 19, oy - 9);
}
