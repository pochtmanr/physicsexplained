"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

type Mode = "D" | "E" | "BOTH";

const RATIO = 0.62;
const MAX_HEIGHT = 380;
const N_LINES = 16;
const ARROW_DRIFT_SPEED = 0.18;

/**
 * A single positive free point charge at the centre of a spherical shell of
 * dielectric. Two field species are drawn:
 *
 *   D-field lines (amber) — sourced ONLY by the free charge in the centre,
 *   so they radiate straight out and pass through the dielectric boundary
 *   with no kink whatsoever.
 *
 *   E-field lines (cyan) — sourced by free + bound charge. Inside the
 *   dielectric they are weaker by a factor of κ; at the boundary they
 *   visibly contract (each line stays the same line, but its arrow speed
 *   slows). Outside the slab E and D agree (up to ε₀).
 *
 * Reader toggles D / E / BOTH; slider controls κ of the dielectric shell.
 */
export function DFieldFreeChargeScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [mode, setMode] = useState<Mode>("BOTH");
  const [kappa, setKappa] = useState(4);
  const [size, setSize] = useState({ width: 480, height: 300 });

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
      const cy = height / 2 + 12;

      const inner = 18;
      const outer = Math.min(width, height) / 2 - 18;
      const rDielectricInner = inner + (outer - inner) * 0.32;
      const rDielectricOuter = inner + (outer - inner) * 0.7;

      // Dielectric shell (donut)
      ctx.beginPath();
      ctx.arc(cx, cy, rDielectricOuter, 0, Math.PI * 2);
      ctx.arc(cx, cy, rDielectricInner, 0, Math.PI * 2, true);
      const tintAlpha = Math.min(0.22, 0.04 + 0.04 * (kappa - 1));
      ctx.fillStyle = `rgba(255, 106, 222, ${tintAlpha.toFixed(3)})`;
      ctx.fill("evenodd");

      // Boundary outlines
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, rDielectricInner, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, rDielectricOuter, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Static field lines: same geometry for D and E (radial). What differs
      // is colour and the arrow drift speed inside the dielectric (E slows).
      const showD = mode !== "E";
      const showE = mode !== "D";

      for (let i = 0; i < N_LINES; i++) {
        const angle = (i / N_LINES) * Math.PI * 2;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        // D line — amber, straight, uniform speed
        if (showD) {
          ctx.strokeStyle = "rgba(255, 214, 107, 0.55)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(cx + cos * inner, cy + sin * inner);
          ctx.lineTo(cx + cos * outer, cy + sin * outer);
          ctx.stroke();

          const phase = (t * ARROW_DRIFT_SPEED + i * 0.04) % 1;
          const r = inner + (outer - inner) * phase;
          drawArrowHead(ctx, cx + cos * r, cy + sin * r, cos, sin, "#FFD66B");
        }

        // E line — cyan; same geometry but speed depends on segment
        if (showE) {
          ctx.strokeStyle = "rgba(111, 184, 198, 0.55)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(cx + cos * inner, cy + sin * inner);
          ctx.lineTo(cx + cos * outer, cy + sin * outer);
          ctx.stroke();

          // E drifts at full speed outside dielectric, slowed by κ inside.
          // We model this by mapping a single global phase to a piecewise
          // arc-length so arrows visibly hesitate inside the slab.
          const lengths = segmentLengths(
            inner,
            rDielectricInner,
            rDielectricOuter,
            outer,
            kappa,
          );
          const total = lengths.reduce((a, b) => a + b, 0);
          const phase = (t * ARROW_DRIFT_SPEED + i * 0.07 + 0.5) % 1;
          const target = phase * total;
          const r = mapPhaseToRadius(
            target,
            lengths,
            inner,
            rDielectricInner,
            rDielectricOuter,
            outer,
            kappa,
          );
          drawArrowHead(ctx, cx + cos * r, cy + sin * r, cos, sin, "#6FB8C6");
        }
      }

      // Central charge
      ctx.shadowColor = "rgba(255, 106, 222, 0.55)";
      ctx.shadowBlur = 18;
      ctx.fillStyle = "#FF6ADE";
      ctx.beginPath();
      ctx.arc(cx, cy, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#0B1018";
      ctx.font = "bold 16px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("+", cx, cy + 1);
      ctx.textBaseline = "alphabetic";

      // Legend & HUD
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`κ = ${kappa.toFixed(1)} (dielectric shell)`, 14, 20);
      ctx.textAlign = "right";
      ctx.fillText(
        showD && showE
          ? "amber: D · cyan: E"
          : showD
            ? "amber: D — ignores the boundary"
            : "cyan: E — weakened by κ inside slab",
        width - 14,
        20,
      );

      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        "D radiates straight from the free charge · E knows about the bound charge too",
        width / 2,
        height - 10,
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
      <div className="mt-2 flex flex-col gap-2 px-2 font-mono text-xs">
        <div className="flex items-center gap-3">
          <span className="text-[var(--color-fg-3)]">FIELD</span>
          {(["BOTH", "D", "E"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded border px-3 py-1 transition-colors ${
                mode === m
                  ? "border-[var(--color-cyan)] text-[var(--color-cyan)]"
                  : "border-[var(--color-fg-4)] text-[var(--color-fg-3)] hover:text-[var(--color-fg-1)]"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <label className="w-8 text-[var(--color-fg-3)]">κ</label>
          <input
            type="range"
            min={1}
            max={10}
            step={0.1}
            value={kappa}
            onChange={(e) => setKappa(parseFloat(e.target.value))}
            className="flex-1 accent-[#FF6ADE]"
          />
          <span className="w-16 text-right text-[var(--color-fg-1)]">
            {kappa.toFixed(1)}
          </span>
        </div>
      </div>
    </div>
  );
}

function drawArrowHead(
  ctx: CanvasRenderingContext2D,
  ax: number,
  ay: number,
  cos: number,
  sin: number,
  color: string,
) {
  const aSize = 5;
  const dx = cos;
  const dy = sin;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(ax + dx * aSize, ay + dy * aSize);
  ctx.lineTo(
    ax - dx * aSize - dy * aSize * 0.6,
    ay - dy * aSize + dx * aSize * 0.6,
  );
  ctx.lineTo(
    ax - dx * aSize + dy * aSize * 0.6,
    ay - dy * aSize - dx * aSize * 0.6,
  );
  ctx.closePath();
  ctx.fill();
}

// Inside the dielectric the local "arc-length budget" per second is multiplied
// by κ — the arrow physically moves slower because E is smaller there. We
// translate a global phase ∈ [0,1] into a radius using piecewise weights.
function segmentLengths(
  rIn: number,
  rDIn: number,
  rDOut: number,
  rOut: number,
  kappa: number,
): [number, number, number] {
  return [rDIn - rIn, (rDOut - rDIn) * kappa, rOut - rDOut];
}

function mapPhaseToRadius(
  target: number,
  lengths: [number, number, number],
  rIn: number,
  rDIn: number,
  rDOut: number,
  rOut: number,
  kappa: number,
): number {
  let acc = 0;
  if (target <= acc + lengths[0]) {
    return rIn + (target - acc);
  }
  acc += lengths[0];
  if (target <= acc + lengths[1]) {
    const frac = (target - acc) / lengths[1];
    return rDIn + frac * (rDOut - rDIn);
  }
  acc += lengths[1];
  const frac = (target - acc) / lengths[2];
  // kappa is captured in the second-segment length so frac here is correct
  void kappa;
  return rDOut + frac * (rOut - rDOut);
}
