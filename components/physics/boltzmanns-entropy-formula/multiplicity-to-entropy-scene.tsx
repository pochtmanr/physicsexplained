"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import {
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  hexToRgba,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import {
  createRng,
  randomRange,
  type Rng,
} from "@/lib/physics/thermodynamics/random";
import {
  BOLTZMANN_K,
  mixingEntropyEqualGases,
} from "@/lib/physics/thermodynamics/boltzmann-entropy";

/**
 * FIG.12b — From multiplicity to entropy: the mixing bridge.
 *
 * Two ideal gases of N molecules each, red on the left and blue on the right,
 * share a box split by a removable partition. Model each half as M discrete
 * cells; a gas of N molecules then has Ω = (cells)ᴺ spatial microstates, so its
 * Boltzmann entropy in units of k is ln Ω = N ln(cells). Remove the partition
 * and every molecule doubles its accessible cells, M → 2M, so each gas gains
 * N ln 2 — and the total entropy of mixing, ΔS = 2 N k ln 2, is exactly the
 * FIG.10 thermodynamic result. The absolute count depends on the cell size M;
 * the *change* does not, which is why the statistical and thermodynamic numbers
 * agree.
 */

const CELLS_PER_HALF = 64; // arbitrary coarse-graining M
const SEED = 0x5e1f_b0c2 | 0;

interface Mol {
  x: number;
  y: number;
  vx: number;
  vy: number;
  species: 0 | 1; // 0 = red (left origin), 1 = blue (right origin)
}

function makeMols(n: number, rng: Rng): Mol[] {
  const mols: Mol[] = [];
  for (let s = 0 as 0 | 1; s <= 1; s = (s + 1) as 0 | 1) {
    for (let i = 0; i < n; i++) {
      const angle = randomRange(rng, 0, Math.PI * 2);
      const speed = 0.16;
      mols.push({
        x: s === 0 ? randomRange(rng, 0.02, 0.48) : randomRange(rng, 0.52, 0.98),
        y: randomRange(rng, 0.02, 0.98),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        species: s,
      });
    }
  }
  return mols;
}

export function MultiplicityToEntropyScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokens = useSceneTokens();

  const [n, setN] = useState(40);
  const [open, setOpen] = useState(false);

  const openRef = useRef(open);
  openRef.current = open;
  const molsRef = useRef<Mol[]>([]);
  const rngRef = useRef<Rng>(createRng(SEED));

  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.5,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 280,
  });

  useEffect(() => {
    rngRef.current = createRng(SEED + n);
    molsRef.current = makeMols(n, rngRef.current);
    setOpen(false);
  }, [n]);

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (_t, dt) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = applyDpr(canvas, width, height);
      if (!ctx) return;

      const step = Math.min(dt, 0.05);
      const isOpen = openRef.current;
      for (const m of molsRef.current) {
        m.x += m.vx * step;
        m.y += m.vy * step;
        // Outer walls.
        if (m.x < 0) { m.x = -m.x; m.vx = -m.vx; }
        else if (m.x > 1) { m.x = 2 - m.x; m.vx = -m.vx; }
        if (m.y < 0) { m.y = -m.y; m.vy = -m.vy; }
        else if (m.y > 1) { m.y = 2 - m.y; m.vy = -m.vy; }
        // Central partition (only when closed): each species stays in its half.
        if (!isOpen) {
          if (m.species === 0 && m.x > 0.5) { m.x = 0.5; m.vx = -Math.abs(m.vx); }
          if (m.species === 1 && m.x < 0.5) { m.x = 0.5; m.vx = Math.abs(m.vx); }
        }
      }

      drawScene(ctx, tokens, width, height, molsRef.current, isOpen, n);
    },
  });

  // ── Entropy bookkeeping (cell-model). Units of k for the per-state numbers.
  const lnBefore = n * Math.log(CELLS_PER_HALF) + n * Math.log(CELLS_PER_HALF);
  const lnAfter =
    n * Math.log(2 * CELLS_PER_HALF) + n * Math.log(2 * CELLS_PER_HALF);
  const deltaOverK = lnAfter - lnBefore; // = 2N ln2
  const deltaJ = mixingEntropyEqualGases(n);

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Two gases either side of a partition; removing it lets them interdiffuse, raising the entropy by 2N k ln2."
      />
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <label className="block w-full font-mono text-xs text-[var(--color-fg-3)] sm:max-w-[14rem]">
          <div className="mb-1 flex items-center justify-between">
            <span>N per gas</span>
            <span className="text-[var(--color-fg-2)]">{n}</span>
          </div>
          <input
            type="range"
            min={10}
            max={200}
            step={5}
            value={n}
            onChange={(e) => setN(parseInt(e.target.value, 10))}
            className="w-full"
            style={{ accentColor: "var(--color-cyan)" }}
          />
        </label>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={`shrink-0 rounded-sm border px-3 py-1 font-mono text-xs transition-colors ${
            open
              ? "border-[var(--color-amber)] text-[var(--color-amber)]"
              : "border-[var(--color-fg-4)] text-[var(--color-fg-3)] hover:border-[var(--color-cyan)] hover:text-[var(--color-cyan)]"
          }`}
        >
          {open ? "Replace partition" : "Remove partition"}
        </button>
      </div>
      <div className="mt-2 grid grid-cols-1 gap-1 font-mono text-[11px] text-[var(--color-fg-3)] sm:grid-cols-3">
        <span>
          before: S/k = <span className="text-[var(--color-fg-2)]">{lnBefore.toFixed(1)}</span>
        </span>
        <span>
          after: S/k = <span className="text-[var(--color-fg-2)]">{lnAfter.toFixed(1)}</span>
        </span>
        <span>
          ΔS = 2N k ln2 = <span className="text-[var(--color-amber)]">{deltaOverK.toFixed(1)} k</span>{" "}
          = {deltaJ.toExponential(2)} J/K
        </span>
      </div>
      <p className="mt-1 font-mono text-[11px] text-[var(--color-fg-3)]">
        The absolute S/k depends on the cell size; ΔS = 2N&nbsp;k&nbsp;ln2 does
        not — and it matches the FIG.10 entropy of mixing exactly.
      </p>
    </div>
  );
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  W: number,
  H: number,
  mols: Mol[],
  open: boolean,
  n: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const pad = 6;
  const boxW = W - pad * 2;
  const boxH = H - pad * 2;
  const bx = pad;
  const by = pad;

  ctx.strokeStyle = tokens.gridHeavy;
  ctx.lineWidth = 1;
  ctx.strokeRect(bx + 0.5, by + 0.5, boxW, boxH);

  // Partition at the centre — solid when closed, faint dashed when open.
  const midX = bx + boxW / 2;
  if (open) {
    ctx.strokeStyle = hexToRgba(tokens.textFaint, 0.4);
    ctx.setLineDash([4, 6]);
  } else {
    ctx.strokeStyle = tokens.textMute;
    ctx.setLineDash([]);
  }
  ctx.lineWidth = open ? 1 : 2.5;
  ctx.beginPath();
  ctx.moveTo(midX, by);
  ctx.lineTo(midX, by + boxH);
  ctx.stroke();
  ctx.setLineDash([]);

  const r = Math.max(1.6, boxW / (Math.sqrt(n) * 16));
  for (const m of mols) {
    ctx.fillStyle = m.species === 0 ? tokens.red : tokens.blue;
    ctx.beginPath();
    ctx.arc(bx + m.x * boxW, by + m.y * boxH, r, 0, Math.PI * 2);
    ctx.fill();
  }
}
