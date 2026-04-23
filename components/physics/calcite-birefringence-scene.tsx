"use client";

import { useEffect, useRef, useState } from "react";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { birefringenceSplit } from "@/lib/physics/electromagnetism/polarization-optics";

const RATIO = 0.58;
const MAX_HEIGHT = 520;

const AMBER = "rgba(255, 180, 80,";
const CYAN = "rgba(120, 220, 240,";
const LILAC = "rgba(200, 160, 255,";
const MAGENTA = "rgba(255, 100, 200,";

// Calcite — the archetypal negative uniaxial crystal.
const N_O = 1.658;
const N_E = 1.486;

/**
 * CALCITE BIREFRINGENCE SCENE. An unpolarised ray hits a calcite slab
 * and emerges as *two* rays — the ordinary ray (o-ray, magenta: the usual
 * Snell-law refraction with n = n_o) and the extraordinary ray (e-ray,
 * lilac: refraction with n = n_e, which for calcite is *smaller* than
 * n_o). Inside the crystal the two rays travel along different paths; at
 * the exit face they are displaced laterally by
 *
 *   Δx = d · [ tan(θ_o) − tan(θ_e) ]
 *
 * which is what `birefringenceSplit` returns.
 *
 * Drag the slider to tilt the crystal — the incidence angle changes, and
 * the split changes with it. Normal incidence (θ = 0°) gives no split.
 */
export function CalciteBirefringenceScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 860, height: 500 });
  const [thetaDeg, setThetaDeg] = useState(45);
  // Thickness in "pixel millimetres" — the scene uses normalised units
  // so the geometry fits the canvas. This is set by the canvas height.
  const [thicknessMm, setThicknessMm] = useState(1.0);

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

  useEffect(() => {
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

    // Geometry: the calcite slab is a rectangle drawn centred. The ray
    // enters from the left at a downward slope set by `thetaDeg` measured
    // from the slab normal.
    const slabW = Math.min(width * 0.55, 460);
    const slabH = Math.min(height * 0.44, 180);
    const slabX = width * 0.5 - slabW * 0.5;
    const slabY = height * 0.5 - slabH * 0.5;

    // Slab body — lilac tint to signal a crystal.
    ctx.fillStyle = `${LILAC} 0.14)`;
    ctx.fillRect(slabX, slabY, slabW, slabH);
    ctx.strokeStyle = `${CYAN} 0.85)`;
    ctx.lineWidth = 1.4;
    ctx.strokeRect(slabX, slabY, slabW, slabH);

    // Optic-axis decoration (diagonal dashed lines inside the slab) —
    // visual shorthand for a uniaxial crystal with its optic axis
    // oblique. Not physically exact; it's a cue to the reader.
    ctx.strokeStyle = `${AMBER} 0.18)`;
    ctx.setLineDash([3, 5]);
    for (let k = -5; k <= 5; k++) {
      ctx.beginPath();
      ctx.moveTo(slabX + k * 22, slabY);
      ctx.lineTo(slabX + k * 22 + slabH * 0.6, slabY + slabH);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Entry point on the *top* face: halfway across, unless θ > 0 tilts it.
    const entryX = slabX + slabW * 0.32;
    const entryY = slabY;

    // Incoming ray — comes in from upper-left at angle θ from the normal
    // (which is vertical, since the slab's top face is horizontal).
    const theta = (thetaDeg * Math.PI) / 180;
    const approachLen = Math.min(width, height) * 0.28;
    const incStartX = entryX - approachLen * Math.sin(theta);
    const incStartY = entryY - approachLen * Math.cos(theta);

    // Unpolarised marker bundle.
    drawUnpolarisedRay(ctx, incStartX, incStartY, entryX, entryY);
    drawArrowhead(ctx, incStartX, incStartY, entryX, entryY, `${AMBER} 0.95)`);

    // Surface normal at entry point (dashed).
    ctx.strokeStyle = colors.fg3;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(entryX, entryY - 40);
    ctx.lineTo(entryX, entryY + slabH + 40);
    ctx.stroke();
    ctx.setLineDash([]);

    // Compute internal refracted angles.
    const sinO = Math.sin(theta) / N_O;
    const sinE = Math.sin(theta) / N_E;
    const thetaO = Math.asin(sinO);
    const thetaE = Math.asin(sinE);

    // Exit points for o- and e-ray on the *bottom* face of the slab.
    const exitOX = entryX + slabH * Math.tan(thetaO);
    const exitOY = slabY + slabH;
    const exitEX = entryX + slabH * Math.tan(thetaE);
    const exitEY = slabY + slabH;

    // o-ray inside slab (magenta).
    ctx.strokeStyle = `${MAGENTA} 0.95)`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(entryX, entryY);
    ctx.lineTo(exitOX, exitOY);
    ctx.stroke();

    // e-ray inside slab (lilac).
    ctx.strokeStyle = `${LILAC} 0.95)`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(entryX, entryY);
    ctx.lineTo(exitEX, exitEY);
    ctx.stroke();

    // On exit, each ray refracts *back* to the original external angle
    // (parallel to the incoming beam, since the slab is a parallel-face
    // slab). So both exit rays are parallel to the incoming ray.
    const exitLen = approachLen * 0.9;
    const exitVecX = Math.sin(theta);
    const exitVecY = Math.cos(theta);
    const oEndX = exitOX + exitLen * exitVecX;
    const oEndY = exitOY + exitLen * exitVecY;
    const eEndX = exitEX + exitLen * exitVecX;
    const eEndY = exitEY + exitLen * exitVecY;

    // o-ray outside slab.
    ctx.strokeStyle = `${MAGENTA} 0.92)`;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(exitOX, exitOY);
    ctx.lineTo(oEndX, oEndY);
    ctx.stroke();
    drawArrowhead(ctx, exitOX, exitOY, oEndX, oEndY, `${MAGENTA} 0.92)`);
    // s-polarisation dots along the o-ray outside.
    drawDots(ctx, exitOX, exitOY, oEndX, oEndY, `${MAGENTA} 0.9)`);

    // e-ray outside slab.
    ctx.strokeStyle = `${LILAC} 0.92)`;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(exitEX, exitEY);
    ctx.lineTo(eEndX, eEndY);
    ctx.stroke();
    drawArrowhead(ctx, exitEX, exitEY, eEndX, eEndY, `${LILAC} 0.92)`);
    // Ticks (in-plane polarisation) along the e-ray outside.
    drawTicks(ctx, exitEX, exitEY, eEndX, eEndY, `${LILAC} 0.9)`);

    // Measured split (in mm) using the pure helper. For display.
    const dxMm = birefringenceSplit(N_O, N_E, thicknessMm, thetaDeg);

    // Labels.
    ctx.fillStyle = colors.fg2;
    ctx.font = "11px monospace";
    ctx.textAlign = "left";
    ctx.fillText("calcite  n_o = 1.658  n_e = 1.486", slabX + 8, slabY - 8);
    ctx.fillStyle = colors.fg2;
    ctx.font = "10px monospace";
    ctx.textAlign = "left";
    ctx.fillText("unpolarised", incStartX + 8, incStartY - 4);

    // Separation bracket on the exit face.
    if (Math.abs(exitOX - exitEX) > 3) {
      const bracketY = exitOY + 22;
      ctx.strokeStyle = colors.fg2;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(exitOX, exitOY + 4);
      ctx.lineTo(exitOX, bracketY);
      ctx.lineTo(exitEX, bracketY);
      ctx.lineTo(exitEX, exitOY + 4);
      ctx.stroke();
      ctx.fillStyle = colors.fg1;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        `Δx = ${Math.abs(dxMm).toFixed(3)} mm`,
        (exitOX + exitEX) / 2,
        bracketY + 14,
      );
    }

    // Legend (top-right).
    ctx.textAlign = "right";
    ctx.font = "10px monospace";
    ctx.fillStyle = `${MAGENTA} 0.95)`;
    ctx.fillText("• o-ray  (n = n_o, ⊥ optic axis)", width - 14, 18);
    ctx.fillStyle = `${LILAC} 0.95)`;
    ctx.fillText("∣ e-ray  (n = n_e, ∥ optic axis)", width - 14, 32);

    // Bottom caption.
    ctx.fillStyle = colors.fg2;
    ctx.textAlign = "center";
    ctx.font = "10px monospace";
    ctx.fillText(
      `θᵢ = ${thetaDeg.toFixed(1)}°   ·   d = ${thicknessMm.toFixed(2)} mm   ·   one ray in → two rays out`,
      width / 2,
      height - 12,
    );
  }, [size, thetaDeg, thicknessMm, colors]);

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-3 grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2 px-2 text-sm">
        <label className="text-[var(--color-fg-3)]">Incidence θᵢ</label>
        <input
          type="range"
          min={0}
          max={75}
          step={0.5}
          value={thetaDeg}
          onChange={(e) => setThetaDeg(parseFloat(e.target.value))}
          className="accent-[rgb(255,180,80)]"
        />
        <span className="w-16 text-right font-mono text-[var(--color-fg-1)]">
          {thetaDeg.toFixed(1)}°
        </span>

        <label className="text-[var(--color-fg-3)]">Thickness d (mm)</label>
        <input
          type="range"
          min={0.2}
          max={3.0}
          step={0.05}
          value={thicknessMm}
          onChange={(e) => setThicknessMm(parseFloat(e.target.value))}
          className="accent-[rgb(200,160,255)]"
        />
        <span className="w-16 text-right font-mono text-[var(--color-fg-1)]">
          {thicknessMm.toFixed(2)}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-3 px-2 font-mono text-[11px] text-[var(--color-fg-3)]">
        <button
          type="button"
          className="border border-[var(--color-fg-4)] px-2 py-0.5 hover:border-[rgb(120,220,240)] hover:text-[var(--color-fg-1)]"
          onClick={() => setThetaDeg(0)}
        >
          normal (no split)
        </button>
        <button
          type="button"
          className="border border-[var(--color-fg-4)] px-2 py-0.5 hover:border-[rgb(255,100,200)] hover:text-[var(--color-fg-1)]"
          onClick={() => {
            setThetaDeg(60);
            setThicknessMm(1);
          }}
        >
          classic rhomb
        </button>
      </div>
    </div>
  );
}

function drawUnpolarisedRay(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const px = -uy;
  const py = ux;

  ctx.strokeStyle = `${AMBER} 0.9)`;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  // Along the ray: alternate a dot and a tick, pseudo-random angles — the
  // canonical drawing convention for "unpolarised light".
  const n = Math.max(4, Math.floor(len / 22));
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const mx = x1 + dx * t;
    const my = y1 + dy * t;
    if (i % 2 === 0) {
      // dot
      ctx.fillStyle = `${AMBER} 0.9)`;
      ctx.beginPath();
      ctx.arc(mx + px * 5, my + py * 5, 1.6, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // short tick perpendicular to ray
      ctx.strokeStyle = `${AMBER} 0.9)`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(mx - px * 4, my - py * 4);
      ctx.lineTo(mx + px * 4, my + py * 4);
      ctx.stroke();
    }
  }
}

function drawDots(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const px = -uy;
  const py = ux;

  const n = Math.max(3, Math.floor(len / 18));
  ctx.fillStyle = color;
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const mx = x1 + dx * t;
    const my = y1 + dy * t;
    ctx.beginPath();
    ctx.arc(mx + px * 6, my + py * 6, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawTicks(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const px = -uy;
  const py = ux;

  const n = Math.max(3, Math.floor(len / 18));
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.4;
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const mx = x1 + dx * t;
    const my = y1 + dy * t;
    ctx.beginPath();
    ctx.moveTo(mx - px * 5, my - py * 5);
    ctx.lineTo(mx + px * 5, my + py * 5);
    ctx.stroke();
  }
}

function drawArrowhead(
  ctx: CanvasRenderingContext2D,
  fx: number,
  fy: number,
  tx: number,
  ty: number,
  fill: string,
) {
  const dx = tx - fx;
  const dy = ty - fy;
  const l = Math.hypot(dx, dy) || 1;
  const ux = dx / l;
  const uy = dy / l;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(tx, ty);
  ctx.lineTo(tx - ux * 9 - uy * 4, ty - uy * 9 + ux * 4);
  ctx.lineTo(tx - ux * 9 + uy * 4, ty - uy * 9 - ux * 4);
  ctx.closePath();
  ctx.fill();
}
