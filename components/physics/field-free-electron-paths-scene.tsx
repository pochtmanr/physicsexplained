"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

/**
 * FIG.64c — A single electron path threading one side of the solenoid.
 *
 * Zoom in on path 1 of the §12.2 money shot. Show that the path stays at
 * radius r > r_solenoid throughout, i.e. in the field-free region. As the
 * electron travels along the path we accumulate the line integral
 *
 *   ∮ A·dℓ        (integrand: A_φ at the current radius for an ideal solenoid)
 *
 * For an ideal infinite solenoid in cylindrical coordinates the vector
 * potential outside is purely azimuthal:
 *
 *   A_φ(r) = Φ_B / (2π r)        (r > r_solenoid)
 *
 * with B = 0 outside (the curl vanishes). The line integral around any
 * loop enclosing the solenoid evaluates to Φ_B; the line integral along
 * a path that does NOT enclose the solenoid evaluates to zero. The
 * Aharonov-Bohm phase reads off the enclosed flux.
 *
 * Controls:
 *   - slider: position s ∈ [0, 1] along the path (or autoplay)
 *
 * Palette:
 *   amber       — electron and its trail
 *   pale-grey   — solenoid body (field is INSIDE; not visible from this angle)
 *   cyan        — A-field arrows (azimuthal, faint)
 *   lilac       — running ∫ A·dℓ readout
 */

const RATIO = 0.50;
const MAX_HEIGHT = 380;

const AMBER = "rgba(255, 180, 80,";
const GREY = "rgba(180, 170, 200,";
const CYAN = "rgba(120, 220, 255,";
const LILAC = "rgba(200, 160, 255,";

export function FieldFreeElectronPathsScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();

  const [size, setSize] = useState({ width: 720, height: 360 });
  const [s, setS] = useState(0.0); // arclength fraction
  const [autoplay, setAutoplay] = useState(true);

  const sRef = useRef(s);
  const autoplayRef = useRef(autoplay);
  useEffect(() => {
    sRef.current = s;
  }, [s]);
  useEffect(() => {
    autoplayRef.current = autoplay;
  }, [autoplay]);

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
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
      }
      ctx.clearRect(0, 0, width, height);

      if (autoplayRef.current) {
        const next = (sRef.current + dt / 6.0) % 1.0;
        sRef.current = next;
        if (Math.floor(t * 10) % 2 === 0) setS(next);
      }

      drawScene(ctx, colors, 0, 0, width, height, sRef.current);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />

      <div className="mt-2 grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1 px-2 text-sm">
        <label className="text-[var(--color-fg-3)]">path position s</label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.005}
          value={s}
          onChange={(e) => {
            setAutoplay(false);
            setS(parseFloat(e.target.value));
          }}
          className="accent-[rgb(255,180,80)]"
        />
        <span className="w-16 text-right font-mono text-[var(--color-fg-1)]">
          {s.toFixed(2)}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-3 px-2 font-mono text-[11px] text-[var(--color-fg-3)]">
        <button
          type="button"
          className="border border-[var(--color-fg-4)] px-2 py-0.5 hover:border-[rgb(255,180,80)] hover:text-[var(--color-fg-1)]"
          onClick={() => setAutoplay((a) => !a)}
        >
          {autoplay ? "pause" : "auto-play"}
        </button>
        <span>
          B (along the path) ={" "}
          <span style={{ color: "rgb(255,180,80)" }}>0</span>
        </span>
        <span>
          A (along the path) ={" "}
          <span style={{ color: "rgb(120,220,255)" }}>≠ 0</span>
        </span>
      </div>

      <div className="mt-2 px-2 text-xs text-[var(--color-fg-3)]">
        The path stays at radius r &gt; r_solenoid the whole way — B = 0 every
        step. But A_φ = Φ_B/(2πr) is non-zero outside the solenoid, and the
        line integral ∫A·dℓ accumulates a real phase. The half-loop on this
        side picks up Φ_B/2; combined with the other half-loop (path 2, on
        the opposite side, opposite sign), the closed-loop integral evaluates
        to the full enclosed flux Φ_B.
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Geometry: the electron path is parameterised as a smooth half-arc that
// curls around the solenoid in the plane of the page. We compute the
// coordinate of the electron at fraction s, and render a faint A-field
// (azimuthal arrow grid) outside the solenoid.
// ─────────────────────────────────────────────────────────────────────────────
function drawScene(
  ctx: CanvasRenderingContext2D,
  colors: { fg0: string; fg1: string; fg2: string; fg3: string },
  x: number,
  y: number,
  w: number,
  h: number,
  s: number,
) {
  // Layout
  const cx = x + w * 0.5;
  const cy = y + h * 0.55;
  const solR = Math.min(w, h) * 0.07;
  const pathR = solR * 2.4; // electron path radius (always > solR)

  // Background tint
  ctx.fillStyle = `${CYAN} 0.025)`;
  ctx.fillRect(x, y, w, h);

  // ── A-field outside the solenoid: azimuthal arrow grid.
  //    A_φ(r) ∝ 1/r — fade arrow length with radius.
  ctx.lineWidth = 1;
  const aGridR0 = solR * 1.25;
  const aGridR1 = Math.min(w, h) * 0.42;
  const ringCount = 4;
  const segPerRing = 16;
  for (let ri = 0; ri < ringCount; ri += 1) {
    const r = aGridR0 + (aGridR1 - aGridR0) * (ri / (ringCount - 1));
    const alpha = 0.20 * (aGridR0 / r);
    ctx.strokeStyle = `${CYAN} ${alpha.toFixed(3)})`;
    for (let si = 0; si < segPerRing; si += 1) {
      const theta = (si / segPerRing) * 2 * Math.PI;
      const px = cx + r * Math.cos(theta);
      const py = cy + r * Math.sin(theta);
      const ux = -Math.sin(theta);
      const uy = Math.cos(theta);
      const len = Math.min(14, 18 * (aGridR0 / r));
      ctx.beginPath();
      ctx.moveTo(px - ux * len * 0.5, py - uy * len * 0.5);
      ctx.lineTo(px + ux * len * 0.5, py + uy * len * 0.5);
      ctx.stroke();
      // tiny arrowhead at the tip
      ctx.fillStyle = `${CYAN} ${alpha.toFixed(3)})`;
      const tipx = px + ux * len * 0.5;
      const tipy = py + uy * len * 0.5;
      const head = 3;
      ctx.beginPath();
      ctx.moveTo(tipx, tipy);
      ctx.lineTo(tipx - ux * head + uy * head * 0.5, tipy - uy * head - ux * head * 0.5);
      ctx.lineTo(tipx - ux * head - uy * head * 0.5, tipy - uy * head + ux * head * 0.5);
      ctx.closePath();
      ctx.fill();
    }
  }

  // ── Solenoid core (field NOT shown — invisible from outside; that's the point)
  ctx.fillStyle = `${GREY} 0.45)`;
  ctx.beginPath();
  ctx.arc(cx, cy, solR, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = `${GREY} 0.95)`;
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // tiny B label inside (faint)
  ctx.fillStyle = `${CYAN} 0.85)`;
  ctx.font = "10px monospace";
  ctx.textAlign = "center";
  ctx.fillText("B ≠ 0", cx, cy + 3);

  ctx.fillStyle = `${GREY} 0.95)`;
  ctx.font = "9.5px monospace";
  ctx.textAlign = "left";
  ctx.fillText("solenoid", cx + solR + 4, cy + solR + 12);

  // r > r_solenoid annotation
  ctx.strokeStyle = `${AMBER} 0.50)`;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.arc(cx, cy, pathR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // ── Trace the electron path (half-arc above the solenoid for clarity).
  //    We use a smooth horseshoe path: enter from the left, curl over the
  //    top, exit to the right. Parametrise by angle θ ∈ [π, 0] with extra
  //    straight stubs on either end.
  const stubLen = w * 0.18;
  const enterX = cx - stubLen - pathR;
  const exitX = cx + stubLen + pathR;
  const sourceY = cy + h * 0.06; // a bit below centre so the curl reads up

  // 0..0.25 — straight from source to top-left of the arc
  // 0.25..0.75 — semicircular curl OVER the solenoid
  // 0.75..1 — straight to the right edge
  // Compute (px, py) at fraction s
  let px = 0, py = 0, tx = 0, ty = 0; // tx/ty = tangent
  const ALPHA1 = 0.25;
  const ALPHA2 = 0.75;
  if (s <= ALPHA1) {
    const f = s / ALPHA1;
    px = enterX + f * (cx - pathR - enterX);
    py = sourceY + f * (cy - sourceY);
    tx = (cx - pathR - enterX);
    ty = (cy - sourceY);
  } else if (s <= ALPHA2) {
    const f = (s - ALPHA1) / (ALPHA2 - ALPHA1);
    const theta = Math.PI - f * Math.PI; // π → 0 over the top
    px = cx + pathR * Math.cos(theta);
    py = cy - pathR * Math.sin(theta);
    tx = -pathR * Math.sin(theta) * (-Math.PI);
    ty = -pathR * Math.cos(theta) * (-Math.PI);
  } else {
    const f = (s - ALPHA2) / (1 - ALPHA2);
    px = cx + pathR + f * (exitX - (cx + pathR));
    py = cy + f * (sourceY - cy);
    tx = (exitX - (cx + pathR));
    ty = (sourceY - cy);
  }
  const tlen = Math.hypot(tx, ty) || 1;
  const tux = tx / tlen;
  const tuy = ty / tlen;

  // ── Static path trace (faint dashed, always visible)
  ctx.strokeStyle = `${AMBER} 0.45)`;
  ctx.setLineDash([4, 3]);
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  // straight stub L
  ctx.moveTo(enterX, sourceY);
  ctx.lineTo(cx - pathR, cy);
  // semicircle over the top
  ctx.arc(cx, cy, pathR, Math.PI, 0, false);
  // straight stub R
  ctx.lineTo(exitX, sourceY);
  ctx.stroke();
  ctx.setLineDash([]);

  // ── Travelled portion (solid amber)
  ctx.strokeStyle = `${AMBER} 0.95)`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (s <= ALPHA1) {
    const f = s / ALPHA1;
    ctx.moveTo(enterX, sourceY);
    ctx.lineTo(enterX + f * (cx - pathR - enterX), sourceY + f * (cy - sourceY));
  } else if (s <= ALPHA2) {
    ctx.moveTo(enterX, sourceY);
    ctx.lineTo(cx - pathR, cy);
    const f = (s - ALPHA1) / (ALPHA2 - ALPHA1);
    ctx.arc(cx, cy, pathR, Math.PI, Math.PI - f * Math.PI, true);
  } else {
    ctx.moveTo(enterX, sourceY);
    ctx.lineTo(cx - pathR, cy);
    ctx.arc(cx, cy, pathR, Math.PI, 0, false);
    const f = (s - ALPHA2) / (1 - ALPHA2);
    ctx.lineTo(cx + pathR + f * (exitX - (cx + pathR)), cy + f * (sourceY - cy));
  }
  ctx.stroke();

  // ── Electron dot
  ctx.fillStyle = `${AMBER} 1)`;
  ctx.beginPath();
  ctx.arc(px, py, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // tangent indicator (dℓ direction — small arrow)
  ctx.strokeStyle = `${AMBER} 0.95)`;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(px + tux * 16, py + tuy * 16);
  ctx.stroke();

  // Compute the running ∫A·dℓ in fractions of Φ_B.
  // For the half-loop semicircle: ∫A·dℓ over the full top semicircle is Φ_B/2
  // (the full loop integral is Φ_B; symmetric half-loops each contribute Φ_B/2).
  // The straight stubs contribute zero (they are radial — A is azimuthal).
  let accum = 0;
  if (s <= ALPHA1) {
    accum = 0;
  } else if (s <= ALPHA2) {
    const f = (s - ALPHA1) / (ALPHA2 - ALPHA1);
    accum = 0.5 * f;
  } else {
    accum = 0.5;
  }

  // ── HUD
  ctx.fillStyle = colors.fg1;
  ctx.font = "bold 10px monospace";
  ctx.textAlign = "left";
  ctx.fillText("FIELD-FREE PATH", x + 12, y + 18);

  ctx.fillStyle = colors.fg2;
  ctx.font = "9.5px monospace";
  ctx.fillText("r > r_solenoid  ⇒  B(path) = 0", x + 12, y + 32);

  ctx.fillStyle = `${LILAC} 0.95)`;
  ctx.font = "10px monospace";
  ctx.textAlign = "right";
  ctx.fillText(
    `∫A·dℓ  =  ${accum.toFixed(2)} Φ_B`,
    x + w - 14,
    y + 18,
  );
  ctx.fillStyle = colors.fg2;
  ctx.font = "9.5px monospace";
  ctx.fillText("(running, path 1 only — half loop)", x + w - 14, y + 32);

  // ── Bottom legend
  ctx.fillStyle = `${CYAN} 0.95)`;
  ctx.textAlign = "left";
  ctx.font = "9.5px monospace";
  ctx.fillText("A_φ = Φ_B / (2π r)  (cyan, azimuthal)", x + 12, y + h - 14);
  ctx.fillStyle = `${AMBER} 0.95)`;
  ctx.textAlign = "right";
  ctx.fillText("electron path  (amber)", x + w - 14, y + h - 14);
}
