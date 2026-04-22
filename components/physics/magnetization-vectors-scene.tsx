"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

/**
 * FIG.17a — the molecular story behind M.
 *
 * A slab of material sits inside a uniform external B (amber arrows entering
 * from the left). Inside the slab, a 6×4 lattice of tiny arrows represents
 * the atomic magnetic moments. Two regimes swap at a button:
 *
 *   "paramagnet"  — moments jitter thermally with a slight bias toward +B.
 *                   The volume average ⟨μ⟩ climbs modestly with |B|.
 *   "ferromagnet" — moments lock together en masse, regardless of |B|.
 *                   The volume average ⟨μ⟩ is close to saturation almost
 *                   as soon as any field is applied.
 *
 * HUD: applied |B|, volume-averaged magnetisation M (in a.u.), effective χ_m.
 *
 * The takeaway the MDX text leans on: *the moments are real, they really do
 * average to a vector, and that vector is M.*
 */

const MAGENTA = "#FF6ADE";
const AMBER = "#FFD66B";
const B_ARROW = "rgba(120, 220, 255, 0.75)";
const ATOM_CYAN = "rgba(120, 220, 255, 0.9)";

type Regime = "paramagnet" | "ferromagnet";

interface AtomMoment {
  cx: number;
  cy: number;
  /** jitter angle used when regime = paramagnet (radians, any direction) */
  jitter: number;
  /** individual phase for breathing wobble — keeps motion visually organic */
  phase: number;
}

const COLS = 6;
const ROWS = 4;
const RATIO = 0.58;
const MAX_HEIGHT = 420;

export function MagnetizationVectorsScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const reduced = useReducedMotion();
  const [size, setSize] = useState({ width: 640, height: 380 });
  const [bMag, setBMag] = useState(1.4); // applied field magnitude (scene units)
  const [regime, setRegime] = useState<Regime>("paramagnet");

  // Deterministic atom lattice — stable across re-renders so the jitter
  // pattern doesn't shuffle every frame.
  const atoms = useMemo<AtomMoment[]>(() => {
    const out: AtomMoment[] = [];
    let seed = 11;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        out.push({
          cx: c, // normalised column index
          cy: r, // normalised row index
          jitter: (rand() * 2 - 1) * Math.PI,
          phase: rand() * Math.PI * 2,
        });
      }
    }
    return out;
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const w = e.contentRect.width;
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

      // Slab geometry
      const slabLeft = width * 0.18;
      const slabRight = width * 0.9;
      const slabTop = height * 0.22;
      const slabBottom = height * 0.82;
      const slabW = slabRight - slabLeft;
      const slabH = slabBottom - slabTop;

      // Slab fill + outline
      ctx.fillStyle = "rgba(120, 220, 255, 0.03)";
      ctx.fillRect(slabLeft, slabTop, slabW, slabH);
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(slabLeft, slabTop, slabW, slabH);
      ctx.setLineDash([]);

      // External B arrows to the left — entering the slab
      drawExternalB(ctx, slabLeft, slabTop, slabBottom, bMag);

      // Compute the average alignment for M readout
      // fraction of alignment with +x, between 0 (random) and 1 (fully aligned).
      const paraSaturation = 1 - Math.exp(-bMag / 2.4);
      const ferroSaturation = bMag < 0.02 ? 0 : 1 - Math.exp(-bMag / 0.15);
      const alignFraction =
        regime === "paramagnet" ? paraSaturation : ferroSaturation;

      const wobble = reduced ? 0 : 0.06;
      let mSum = 0;

      const colSpacing = slabW / (COLS + 1);
      const rowSpacing = slabH / (ROWS + 1);
      const arrowHalfLen = Math.min(colSpacing, rowSpacing) * 0.42;

      for (const atom of atoms) {
        const px = slabLeft + colSpacing * (atom.cx + 1);
        const py = slabTop + rowSpacing * (atom.cy + 1);

        // Target angle: +x (along B). Start angle: atom.jitter.
        // Ferromagnet locks harder; paramagnet keeps more of the jitter.
        const localWobble =
          wobble *
          Math.sin(t * 1.4 + atom.phase) *
          (1 - alignFraction * 0.6); // aligned atoms wobble less
        const ang =
          atom.jitter * (1 - alignFraction) + 0 * alignFraction + localWobble;

        mSum += Math.cos(ang);

        const dx = Math.cos(ang) * arrowHalfLen;
        const dy = Math.sin(ang) * arrowHalfLen;

        // Arrow shaft
        ctx.strokeStyle = MAGENTA;
        ctx.lineWidth = 1.8;
        ctx.shadowColor = "rgba(255, 106, 222, 0.45)";
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(px - dx, py - dy);
        ctx.lineTo(px + dx, py + dy);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Arrow head
        ctx.fillStyle = MAGENTA;
        const hx = px + dx;
        const hy = py + dy;
        const headLen = 4.2;
        const headW = 3.0;
        const nx = -Math.sin(ang);
        const ny = Math.cos(ang);
        ctx.beginPath();
        ctx.moveTo(hx + Math.cos(ang) * headLen, hy + Math.sin(ang) * headLen);
        ctx.lineTo(hx + nx * headW, hy + ny * headW);
        ctx.lineTo(hx - nx * headW, hy - ny * headW);
        ctx.closePath();
        ctx.fill();

        // Tail dot
        ctx.fillStyle = ATOM_CYAN;
        ctx.beginPath();
        ctx.arc(px - dx, py - dy, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }

      const meanAlign = mSum / atoms.length; // ranges roughly −1..1
      // volume-averaged M in arbitrary units — scale to make the number readable
      const M_AU = meanAlign * 10;
      // Effective χ_m = M / H ≈ M / (B / μ₀); the arithmetic here is illustrative
      // (scene units, not SI), but the sign and magnitude trend are faithful.
      const chiEff = bMag > 0.05 ? meanAlign / (bMag * 0.5) : 0;

      // HUD
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillStyle = colors.fg2;
      ctx.fillText("B_ext", 12, 18);
      ctx.fillStyle = AMBER;
      ctx.fillText(`${bMag.toFixed(2)} T`, 12, 34);

      ctx.fillStyle = colors.fg2;
      ctx.fillText("⟨M⟩", 110, 18);
      ctx.fillStyle = MAGENTA;
      ctx.fillText(`${M_AU.toFixed(2)} A/m`, 110, 34);

      ctx.fillStyle = colors.fg2;
      ctx.textAlign = "right";
      ctx.fillText("χ_m eff", width - 12, 18);
      ctx.fillStyle = colors.fg0;
      ctx.fillText(chiEff.toFixed(3), width - 12, 34);

      // Regime label (bottom right, inside slab)
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "right";
      ctx.fillText(
        regime === "paramagnet"
          ? "paramagnet — thermal jitter + slight bias"
          : "ferromagnet — collective lock-in",
        width - 12,
        height - 10,
      );

      // Axes badge bottom-left (x̂ right, B along +x̂)
      drawAxesBadge(ctx, 20, height - 24, colors);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-3 flex flex-wrap items-center gap-3 px-2">
        <label className="flex items-center gap-2 text-xs font-mono text-[var(--color-fg-2)]">
          <span className="w-10 text-[var(--color-fg-1)]">|B|</span>
          <input
            type="range"
            min={0}
            max={3.0}
            step={0.02}
            value={bMag}
            onChange={(e) => setBMag(parseFloat(e.target.value))}
            className="w-44 accent-[#FFD66B]"
          />
          <span className="w-16 text-right text-[var(--color-fg-1)] tabular-nums">
            {bMag.toFixed(2)} T
          </span>
        </label>
        <div className="inline-flex overflow-hidden rounded border border-[var(--color-fg-4)] text-xs font-mono">
          <button
            type="button"
            onClick={() => setRegime("paramagnet")}
            className={
              regime === "paramagnet"
                ? "bg-[var(--color-fg-1)] px-3 py-1 text-[var(--color-bg-0)]"
                : "px-3 py-1 text-[var(--color-fg-2)] hover:text-[var(--color-fg-1)]"
            }
          >
            paramagnet
          </button>
          <button
            type="button"
            onClick={() => setRegime("ferromagnet")}
            className={
              regime === "ferromagnet"
                ? "bg-[var(--color-fg-1)] px-3 py-1 text-[var(--color-bg-0)]"
                : "px-3 py-1 text-[var(--color-fg-2)] hover:text-[var(--color-fg-1)]"
            }
          >
            ferromagnet
          </button>
        </div>
      </div>
      <p className="mt-2 px-2 text-xs font-mono text-[var(--color-fg-3)]">
        each magenta arrow is one atomic moment · their volume average is M · B from the left
      </p>
    </div>
  );
}

function drawExternalB(
  ctx: CanvasRenderingContext2D,
  xLeft: number,
  yTop: number,
  yBottom: number,
  bMag: number,
) {
  const alpha = 0.25 + 0.55 * Math.min(1, bMag / 2);
  const nRows = 5;
  const gap = (yBottom - yTop) / (nRows + 1);
  const x1 = xLeft - 80;
  const x2 = xLeft - 10;
  ctx.strokeStyle = `rgba(120, 220, 255, ${alpha})`;
  ctx.fillStyle = `rgba(120, 220, 255, ${alpha})`;
  ctx.lineWidth = 1.2 + bMag * 0.4;
  for (let r = 1; r <= nRows; r++) {
    const y = yTop + gap * r;
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
    ctx.stroke();
    // arrowhead
    ctx.beginPath();
    ctx.moveTo(x2, y);
    ctx.lineTo(x2 - 6, y - 3);
    ctx.lineTo(x2 - 6, y + 3);
    ctx.closePath();
    ctx.fill();
  }
  ctx.font = "10px monospace";
  ctx.textAlign = "left";
  ctx.fillStyle = B_ARROW;
  ctx.fillText("B_ext →", x1, yTop - 6);
}

function drawAxesBadge(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  colors: { fg2: string; fg3: string },
) {
  const len = 16;
  ctx.strokeStyle = colors.fg2;
  ctx.fillStyle = colors.fg2;
  ctx.lineWidth = 1.1;
  // x̂ right
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(ox + len, oy);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(ox + len, oy);
  ctx.lineTo(ox + len - 3, oy - 2);
  ctx.lineTo(ox + len - 3, oy + 2);
  ctx.closePath();
  ctx.fill();
  // ŷ up
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(ox, oy - len);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(ox, oy - len);
  ctx.lineTo(ox - 2, oy - len + 3);
  ctx.lineTo(ox + 2, oy - len + 3);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = colors.fg3;
  ctx.font = "10px monospace";
  ctx.textAlign = "left";
  ctx.fillText("x̂", ox + len + 3, oy + 4);
  ctx.fillText("ŷ", ox - 3, oy - len - 3);
}
