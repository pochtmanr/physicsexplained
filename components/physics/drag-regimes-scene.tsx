"use client";

import { useEffect, useRef, useState } from "react";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  dragCrossoverVelocity,
  sampleDragRegimes,
} from "@/lib/physics/friction";

const RATIO = 0.62;
const MAX_HEIGHT = 420;

export function DragRegimesScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  // b: linear (Stokes) coefficient. k: quadratic coefficient.
  // Defaults put the crossover near v ≈ 1 m/s, which matches a hand-sized
  // object in air — easy to point at in the narration.
  const [b, setB] = useState(0.05);
  const [k, setK] = useState(0.05);
  const [size, setSize] = useState({ width: 720, height: 420 });

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
      ctx.scale(dpr, dpr);
    }

    ctx.clearRect(0, 0, width, height);

    const vMin = 0.01;
    const vMax = 100;
    const samples = sampleDragRegimes({
      linearCoefficient: b,
      quadraticCoefficient: k,
      vMin,
      vMax,
      samples: 240,
    });

    const padL = 56;
    const padR = 20;
    const padT = 28;
    const padB = 44;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    const logVMin = Math.log10(vMin);
    const logVMax = Math.log10(vMax);
    // Force range — always use a fixed window so the axes don't jump as the
    // sliders move. The max force from either component at v = 100 is
    // k·10000 + b·100 ≈ 500 for defaults, so we give it headroom.
    const logFMin = -4;
    const logFMax = 5;

    const toPx = (v: number, f: number) => {
      const lv = Math.log10(Math.max(v, 1e-9));
      const lf = Math.log10(Math.max(f, 1e-12));
      return {
        px: padL + ((lv - logVMin) / (logVMax - logVMin)) * plotW,
        py:
          padT + plotH - ((lf - logFMin) / (logFMax - logFMin)) * plotH,
      };
    };

    // Grid — one line per decade, light
    ctx.strokeStyle = colors.fg3;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.4;
    for (let lv = Math.ceil(logVMin); lv <= Math.floor(logVMax); lv++) {
      const { px } = toPx(Math.pow(10, lv), 1);
      ctx.beginPath();
      ctx.moveTo(px, padT);
      ctx.lineTo(px, padT + plotH);
      ctx.stroke();
    }
    for (let lf = Math.ceil(logFMin); lf <= Math.floor(logFMax); lf++) {
      const { py } = toPx(1, Math.pow(10, lf));
      ctx.beginPath();
      ctx.moveTo(padL, py);
      ctx.lineTo(padL + plotW, py);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Axes
    ctx.strokeStyle = colors.fg2;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padL, padT);
    ctx.lineTo(padL, padT + plotH);
    ctx.lineTo(padL + plotW, padT + plotH);
    ctx.stroke();

    // Axis decade labels
    ctx.fillStyle = colors.fg2;
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    for (let lv = Math.ceil(logVMin); lv <= Math.floor(logVMax); lv++) {
      const { px } = toPx(Math.pow(10, lv), 1);
      ctx.fillText(`10^${lv}`, px, padT + plotH + 14);
    }
    ctx.textAlign = "right";
    for (let lf = Math.ceil(logFMin); lf <= Math.floor(logFMax); lf += 2) {
      const { py } = toPx(1, Math.pow(10, lf));
      ctx.fillText(`10^${lf}`, padL - 6, py + 4);
    }

    // Axis titles
    ctx.fillStyle = colors.fg1;
    ctx.font = "11px monospace";
    ctx.textAlign = "center";
    ctx.fillText("velocity  v  (m/s)", padL + plotW / 2, padT + plotH + 30);
    ctx.save();
    ctx.translate(18, padT + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.fillText("drag force  F  (N)", 0, 0);
    ctx.restore();

    // Linear (Stokes) asymptote — slope 1 on log-log
    ctx.strokeStyle = "#E4C27A";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    samples.forEach((s, i) => {
      const { px, py } = toPx(s.v, s.linear);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();

    // Quadratic asymptote — slope 2 on log-log
    ctx.strokeStyle = "#FF6BCB";
    ctx.beginPath();
    samples.forEach((s, i) => {
      const { px, py } = toPx(s.v, s.quadratic);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // Total drag — what the object actually feels
    ctx.strokeStyle = "#5BE9FF";
    ctx.lineWidth = 2.25;
    ctx.beginPath();
    samples.forEach((s, i) => {
      const { px, py } = toPx(s.v, s.total);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();

    // Crossover marker — where linear and quadratic are equal
    const vCross = dragCrossoverVelocity(b, k);
    if (vCross > vMin && vCross < vMax) {
      const crossF = b * vCross;
      const { px, py } = toPx(vCross, crossF);
      ctx.fillStyle = "#5BE9FF";
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#5BE9FF";
      ctx.globalAlpha = 0.35;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(px, padT + plotH);
      ctx.lineTo(px, py);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      ctx.fillStyle = colors.fg1;
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        `Re ≈ 1   (v_× = ${vCross.toFixed(2)} m/s)`,
        px,
        padT + plotH + 30 - 32,
      );
    }

    // Legend
    ctx.font = "11px monospace";
    ctx.textAlign = "left";
    const legendX = padL + 12;
    let ly = padT + 10;
    const swatch = (color: string, dashed: boolean) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      if (dashed) ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(legendX, ly);
      ctx.lineTo(legendX + 22, ly);
      ctx.stroke();
      ctx.setLineDash([]);
    };
    swatch("#E4C27A", true);
    ctx.fillStyle = colors.fg1;
    ctx.fillText("F_lin = b·v   (Stokes)", legendX + 30, ly + 4);
    ly += 18;
    swatch("#FF6BCB", true);
    ctx.fillText("F_quad = k·v²   (Newton)", legendX + 30, ly + 4);
    ly += 18;
    swatch("#5BE9FF", false);
    ctx.fillText("F_total = b·v + k·v²", legendX + 30, ly + 4);
  }, [b, k, size, colors]);

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-2 flex flex-col gap-2 px-2">
        <div className="flex items-center gap-3">
          <label className="w-28 text-sm text-[var(--color-fg-2)]">
            Stokes b
          </label>
          <input
            type="range"
            min={0.001}
            max={1}
            step={0.001}
            value={b}
            onChange={(e) => setB(parseFloat(e.target.value))}
            className="flex-1 accent-[#5BE9FF]"
          />
          <span className="w-16 text-right text-sm font-mono text-[var(--color-fg-1)]">
            {b.toFixed(3)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <label className="w-28 text-sm text-[var(--color-fg-2)]">
            Newton k
          </label>
          <input
            type="range"
            min={0.001}
            max={1}
            step={0.001}
            value={k}
            onChange={(e) => setK(parseFloat(e.target.value))}
            className="flex-1 accent-[#5BE9FF]"
          />
          <span className="w-16 text-right text-sm font-mono text-[var(--color-fg-1)]">
            {k.toFixed(3)}
          </span>
        </div>
        <p className="px-1 text-xs text-[var(--color-fg-2)]">
          Low v — the Stokes line dominates (slope 1). High v — the Newton line
          takes over (slope 2). The cyan total follows whichever term is larger.
          Reynolds number ≈ 1 marks the knee.
        </p>
      </div>
    </div>
  );
}
