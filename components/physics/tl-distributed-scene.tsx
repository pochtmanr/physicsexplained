"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  characteristicImpedance,
  propagationVelocity,
} from "@/lib/physics/electromagnetism/transmission-lines";

const RATIO = 0.46;
const MAX_HEIGHT = 360;

const N_CELLS = 14;

/**
 * FIG.32a — the distributed LC ladder.
 *
 * A transmission line drawn as a chain of tiny series-L and shunt-C cells.
 * Each cell represents a small slice dx of the actual line. A short Gaussian
 * pulse (amber) is launched at the left end and propagates to the right at
 * v = 1/√(LC). Sliders for L_per_m and C_per_m rescale both v and Z₀ live.
 *
 * This is the primitive picture of Heaviside's model: inductance in series
 * because a long wire carrying current stores magnetic energy along its
 * length, capacitance to ground because the wire pair stores electric
 * energy in the field between the conductors. Nothing else is needed to
 * build a wave that travels.
 */
export function TlDistributedScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 720, height: 330 });

  // Inputs in SI units: 250 nH/m and 100 pF/m → Z₀ = 50 Ω, v ≈ 2×10⁸ m/s
  const [lNh, setLNh] = useState(250); // nH per metre
  const [cPf, setCPf] = useState(100); // pF per metre

  const L = lNh * 1e-9;
  const C = cPf * 1e-12;
  const z0 = characteristicImpedance(L, C);
  const v = propagationVelocity(L, C);

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

      drawLadder(ctx, colors, width, height, t, v);
      drawHud(ctx, colors, width, z0, v, L, C);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-3 grid grid-cols-1 gap-2 px-2 sm:grid-cols-2">
        <Slider
          label="L"
          value={lNh}
          min={50}
          max={800}
          step={10}
          unit="nH/m"
          accent="#FF6ADE"
          onChange={setLNh}
        />
        <Slider
          label="C"
          value={cPf}
          min={20}
          max={400}
          step={5}
          unit="pF/m"
          accent="#78DCFF"
          onChange={setCPf}
        />
      </div>
      <p className="mt-2 px-2 text-xs font-mono text-[var(--color-fg-3)]">
        each cell is one slice dx of line: series L, shunt C — a pulse
        propagates at v = 1/√(LC)
      </p>
    </div>
  );
}

function drawLadder(
  ctx: CanvasRenderingContext2D,
  colors: { fg1: string; fg2: string; fg3: string },
  width: number,
  height: number,
  t: number,
  v: number,
) {
  const marginX = 40;
  const topWireY = Math.max(90, height * 0.34);
  const bottomWireY = Math.max(200, height * 0.72);
  const usable = width - 2 * marginX;
  const dx = usable / N_CELLS;

  // Top conductor (signal) and bottom conductor (return / ground)
  ctx.strokeStyle = colors.fg2;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(marginX, topWireY);
  ctx.lineTo(marginX + usable, topWireY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(marginX, bottomWireY);
  ctx.lineTo(marginX + usable, bottomWireY);
  ctx.stroke();

  // Per-cell L (zigzag on top wire) + C (parallel plates to bottom wire)
  for (let i = 0; i < N_CELLS; i++) {
    const x0 = marginX + i * dx;
    const x1 = x0 + dx;
    const midX = (x0 + x1) / 2;

    // Series inductor (small coil glyph on the top wire between x0 and midX - 8)
    drawInductor(ctx, colors, x0 + 6, midX - 10, topWireY);

    // Shunt capacitor from the node between inductor-end and next inductor-start,
    // down to the bottom wire.
    drawCapacitor(ctx, colors, midX, topWireY + 6, bottomWireY - 6);
  }

  // Ground triangles at the bottom-wire ends
  drawGround(ctx, colors, marginX, bottomWireY);
  drawGround(ctx, colors, marginX + usable, bottomWireY);

  // Launch port / load port labels
  ctx.fillStyle = colors.fg2;
  ctx.font = "10px monospace";
  ctx.textAlign = "left";
  ctx.fillText("source", marginX - 8, topWireY - 10);
  ctx.textAlign = "right";
  ctx.fillText("→", marginX + usable + 8, topWireY - 10);

  // ── Propagating Gaussian pulse (amber) along the top conductor ──
  // Normalise: the pulse should traverse the ladder in a few seconds regardless
  // of the real v. Map real v to a scene-space pixel/second by a visual factor.
  const cyclePeriod = 3.4; // seconds for one traversal, visually tuned
  const sceneSpeed = usable / cyclePeriod; // px/s
  // Show (v scaled) in the HUD, but the animation uses scene speed so the user
  // can compare the position of the pulse against a reference tick.
  const phase = (t * sceneSpeed) % (usable + 40);
  const pulseX = marginX + phase;

  // Gaussian envelope around pulseX
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let k = -24; k <= 24; k++) {
    const x = pulseX + k;
    if (x < marginX || x > marginX + usable) continue;
    const a = Math.exp(-(k * k) / (2 * 8 * 8));
    ctx.fillStyle = `rgba(255, 214, 107, ${a * 0.85})`;
    ctx.fillRect(x - 0.5, topWireY - 14 * a, 1.5, 14 * a);
  }
  ctx.restore();

  // Small tick showing the analytical position if v were the scene speed
  // (purely informational anchor: the pulse always arrives at the right edge
  // at t = cyclePeriod)
  ctx.fillStyle = colors.fg2;
  ctx.font = "9px monospace";
  ctx.textAlign = "center";
  ctx.fillText(`v·t`, pulseX, topWireY - 18);

  // Scene-units label
  ctx.textAlign = "left";
  ctx.fillStyle = colors.fg3;
  ctx.fillText(
    `v = 1/√(LC) = ${formatVelocity(v)}`,
    marginX,
    bottomWireY + 28,
  );
}

function drawInductor(
  ctx: CanvasRenderingContext2D,
  colors: { fg1: string; fg2: string },
  x0: number,
  x1: number,
  y: number,
) {
  // 4 tight loops
  const loops = 4;
  const w = x1 - x0;
  const per = w / loops;
  const r = Math.min(per / 2, 6);
  ctx.strokeStyle = colors.fg1;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x0, y);
  for (let i = 0; i < loops; i++) {
    const cx = x0 + (i + 0.5) * per;
    ctx.arc(cx, y, r, Math.PI, 0, false);
  }
  ctx.lineTo(x1, y);
  ctx.stroke();
}

function drawCapacitor(
  ctx: CanvasRenderingContext2D,
  colors: { fg1: string; fg2: string; fg3: string },
  cx: number,
  yTop: number,
  yBottom: number,
) {
  const yMid = (yTop + yBottom) / 2;
  const plateGap = 4;
  const plateW = 14;

  // wire from top to upper plate
  ctx.strokeStyle = colors.fg1;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(cx, yTop);
  ctx.lineTo(cx, yMid - plateGap / 2);
  ctx.stroke();

  // two parallel plates
  ctx.beginPath();
  ctx.moveTo(cx - plateW / 2, yMid - plateGap / 2);
  ctx.lineTo(cx + plateW / 2, yMid - plateGap / 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - plateW / 2, yMid + plateGap / 2);
  ctx.lineTo(cx + plateW / 2, yMid + plateGap / 2);
  ctx.stroke();

  // wire from lower plate to bottom
  ctx.beginPath();
  ctx.moveTo(cx, yMid + plateGap / 2);
  ctx.lineTo(cx, yBottom);
  ctx.stroke();
}

function drawGround(
  ctx: CanvasRenderingContext2D,
  colors: { fg2: string; fg3: string },
  x: number,
  y: number,
) {
  ctx.strokeStyle = colors.fg2;
  ctx.lineWidth = 1;
  const sizes = [10, 7, 4];
  for (let i = 0; i < sizes.length; i++) {
    const w = sizes[i];
    const yy = y + 4 + i * 3;
    ctx.beginPath();
    ctx.moveTo(x - w, yy);
    ctx.lineTo(x + w, yy);
    ctx.stroke();
  }
}

function drawHud(
  ctx: CanvasRenderingContext2D,
  colors: { fg1: string; fg2: string; fg3: string },
  width: number,
  z0: number,
  v: number,
  L: number,
  C: number,
) {
  ctx.font = "12px monospace";
  ctx.textAlign = "left";
  ctx.fillStyle = colors.fg1;
  ctx.fillText("FIG.32a — distributed LC ladder", 12, 20);

  ctx.font = "10px monospace";
  ctx.textAlign = "right";
  ctx.fillStyle = colors.fg2;
  ctx.fillText(`Z₀ = √(L/C) = ${z0.toFixed(1)} Ω`, width - 12, 20);
  ctx.fillText(
    `β·c/v ≈ ${(299792458 / v).toFixed(2)} (dielectric slowing)`,
    width - 12,
    34,
  );
  ctx.fillText(
    `LC = ${(L * C).toExponential(2)}  v = ${formatVelocity(v)}`,
    width - 12,
    48,
  );
}

function formatVelocity(v: number): string {
  if (v >= 1e8) return `${(v / 1e8).toFixed(2)}×10⁸ m/s`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}×10⁶ m/s`;
  return `${v.toExponential(2)} m/s`;
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  unit,
  accent,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  unit: string;
  accent: string;
}) {
  return (
    <label className="flex items-center gap-2 text-xs font-mono text-[var(--color-fg-2)]">
      <span className="w-6 text-[var(--color-fg-1)]">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1"
        style={{ accentColor: accent }}
      />
      <span className="w-24 text-right text-[var(--color-fg-1)]">
        {value.toFixed(0)} {unit}
      </span>
    </label>
  );
}
