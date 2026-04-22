"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { langevin } from "@/lib/physics/electromagnetism/magnetic-materials";

const RATIO = 0.7;
const MAX_HEIGHT = 460;

interface Spin {
  cx: number;
  cy: number;
  angle: number; // radians from +x
  thermalPhase: number;
  thermalFreq: number;
}

/**
 * A 2D lattice of 40 spins (8×5), each drawn as a magenta arrow. An external
 * B field points to the right (amber arrows on the left edge). Above each spin
 * we overlay a thermal-noise wobble; at high T (left of slider) the wobble
 * dominates and orientations scatter. At low T the bias toward +x wins.
 *
 * The equilibrium fraction aligned is exactly the Langevin average, so as the
 * user drags T, the bulk magnetisation M/Msat traces the Langevin curve. We
 * also render a small M-vs-T HUD on the right that follows Curie's 1/T fall.
 */
export function ParamagnetAlignmentScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 700, height: 460 });
  const [temperature, setTemperature] = useState(2.0); // scene units (~K-ish)
  const spinsRef = useRef<Spin[] | null>(null);

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

  // Seed (or reseed) the lattice when the canvas resizes so spins land on
  // the grid. Thermal phases are random per spin so the noise is uncorrelated.
  useEffect(() => {
    const { width, height } = size;
    const cols = 8;
    const rows = 5;
    const padL = 60;
    const padT = 70;
    const padR = 200;
    const padB = 60;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;
    const dx = plotW / (cols - 1);
    const dy = plotH / (rows - 1);
    const spins: Spin[] = [];
    let seed = 0x9e3779b9;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        spins.push({
          cx: padL + c * dx,
          cy: padT + r * dy,
          angle: rand() * Math.PI * 2,
          thermalPhase: rand() * Math.PI * 2,
          thermalFreq: 1.5 + rand() * 2.0,
        });
      }
    }
    spinsRef.current = spins;
  }, [size.width, size.height]);

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

      const spins = spinsRef.current;
      if (!spins) return;

      // x = μB/kT in scene units — fixed B, variable T.
      // As T → 0, x → ∞, L(x) → 1 (full alignment).
      // As T → ∞, x → 0, L(x) → x/3 → 0.
      const B_SCENE = 2.5;
      const x = B_SCENE / Math.max(0.05, temperature);
      const mRel = langevin(x); // in [0, 1]

      ctx.clearRect(0, 0, width, height);

      // Applied B arrows (amber, pointing right, three rows on the far left).
      drawAppliedB(ctx, 12, height / 2 - 60, 120, colors);

      // Spins.
      const noiseAmp = Math.min(Math.PI, 0.15 + 2.0 * temperature);
      for (const s of spins) {
        // Bias angle: mRel controls how strongly the spin wants to face +x.
        // Each spin has its own thermal wobble.
        s.thermalPhase += s.thermalFreq * dt;
        const bias = 0; // +x direction
        // Current target: a mix between thermal noise and bias.
        const wobble = Math.sin(t * s.thermalFreq + s.thermalPhase) * noiseAmp;
        const biasWeight = mRel; // 0 = pure noise, 1 = pure aligned
        const target =
          bias + (1 - biasWeight) * wobble + biasWeight * wobble * 0.08;
        // Smooth exponential blend toward target.
        const k = 6 * dt;
        s.angle = s.angle + (target - s.angle) * Math.min(1, k);
        // Keep angle bounded.
        while (s.angle > Math.PI) s.angle -= 2 * Math.PI;
        while (s.angle < -Math.PI) s.angle += 2 * Math.PI;

        drawSpinArrow(ctx, s.cx, s.cy, s.angle);
      }

      // Right-panel Curie chart: χ vs T (1/T curve), current-T marker.
      drawCurieChart(ctx, width, height, temperature, colors);

      // HUD.
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillStyle = colors.fg1;
      ctx.fillText("paramagnet · 40 spins · B = 2.5 T (applied)", 12, 20);
      ctx.fillStyle = "#FFD66B";
      ctx.fillText(`T = ${temperature.toFixed(2)} K (scene)`, 12, 38);
      ctx.fillStyle = "#FF6ADE";
      ctx.fillText(
        `⟨M⟩ / Msat = L(μB/kT) = ${mRel.toFixed(3)}`,
        12,
        56,
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
      <div className="mt-3 grid grid-cols-1 gap-2 px-2">
        <Slider
          label="T"
          value={temperature}
          min={0.1}
          max={6}
          step={0.05}
          onChange={setTemperature}
          unit="K"
          accent="#FFD66B"
        />
      </div>
      <p className="mt-2 px-2 text-xs font-mono text-[var(--color-fg-3)]">
        cool the sample → thermal jitter loses → spins bias toward B → M rises as 1/T (Curie's law)
      </p>
    </div>
  );
}

function drawSpinArrow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  angle: number,
) {
  const len = 22;
  const hx = cx + len * Math.cos(angle);
  const hy = cy + len * Math.sin(angle);
  ctx.strokeStyle = "#FF6ADE";
  ctx.lineWidth = 2;
  ctx.shadowColor = "rgba(255, 106, 222, 0.55)";
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.moveTo(cx - (len / 2) * Math.cos(angle), cy - (len / 2) * Math.sin(angle));
  ctx.lineTo(hx - (len / 2) * Math.cos(angle), hy - (len / 2) * Math.sin(angle));
  ctx.stroke();
  // Head.
  const a1 = angle + Math.PI - 0.45;
  const a2 = angle + Math.PI + 0.45;
  const tipX = hx - (len / 2) * Math.cos(angle);
  const tipY = hy - (len / 2) * Math.sin(angle);
  ctx.fillStyle = "#FF6ADE";
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(tipX + 6 * Math.cos(a1), tipY + 6 * Math.sin(a1));
  ctx.lineTo(tipX + 6 * Math.cos(a2), tipY + 6 * Math.sin(a2));
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawAppliedB(
  ctx: CanvasRenderingContext2D,
  x: number,
  yTop: number,
  h: number,
  colors: { fg3: string },
) {
  // Three short amber arrows along the left edge pointing right.
  ctx.strokeStyle = "#FFD66B";
  ctx.fillStyle = "#FFD66B";
  ctx.lineWidth = 1.6;
  for (let i = 0; i < 3; i++) {
    const y = yTop + (i * h) / 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 28, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 28, y);
    ctx.lineTo(x + 22, y - 4);
    ctx.lineTo(x + 22, y + 4);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = colors.fg3;
  ctx.font = "10px monospace";
  ctx.textAlign = "left";
  ctx.fillText("B", x + 32, yTop + h / 2 + 4);
}

function drawCurieChart(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  currentT: number,
  colors: { fg1: string; fg2: string; fg3: string },
) {
  const padR = 16;
  const plotW = 170;
  const plotH = 130;
  const x0 = width - padR - plotW;
  const y0 = 70;

  // Frame.
  ctx.strokeStyle = colors.fg3;
  ctx.lineWidth = 1;
  ctx.strokeRect(x0, y0, plotW, plotH);

  // Axes labels.
  ctx.fillStyle = colors.fg2;
  ctx.font = "10px monospace";
  ctx.textAlign = "center";
  ctx.fillText("χ vs T  (Curie 1/T)", x0 + plotW / 2, y0 - 6);
  ctx.textAlign = "left";
  ctx.fillText("T →", x0 + plotW - 26, y0 + plotH + 12);
  ctx.save();
  ctx.translate(x0 - 8, y0 + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center";
  ctx.fillText("χ", 0, 0);
  ctx.restore();

  // Curve χ = C/T, with C chosen to fit.
  const Tmin = 0.1;
  const Tmax = 6;
  const C = 1; // scene units
  // chi(Tmin) = 10 sets the visual max.
  const chiMax = C / Tmin;
  ctx.strokeStyle = "#FF6ADE";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  const N = 120;
  for (let i = 0; i <= N; i++) {
    const T = Tmin + ((Tmax - Tmin) * i) / N;
    const chi = C / T;
    const px = x0 + ((T - Tmin) / (Tmax - Tmin)) * plotW;
    const py = y0 + plotH - (chi / chiMax) * plotH;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Current-T marker.
  const pxNow =
    x0 +
    ((Math.min(Tmax, Math.max(Tmin, currentT)) - Tmin) / (Tmax - Tmin)) *
      plotW;
  const chiNow = C / Math.max(Tmin, currentT);
  const pyNow = y0 + plotH - (chiNow / chiMax) * plotH;
  ctx.strokeStyle = "rgba(255, 214, 107, 0.6)";
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(pxNow, y0);
  ctx.lineTo(pxNow, y0 + plotH);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "#FFD66B";
  ctx.shadowColor = "rgba(255, 214, 107, 0.8)";
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(pxNow, pyNow, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
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
      <span className="w-20 text-right text-[var(--color-fg-1)]">
        {value.toFixed(2)} {unit}
      </span>
    </label>
  );
}
