"use client";

import { useEffect, useRef, useState } from "react";
import { gaussianPacket } from "@/lib/physics/dispersion";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

/**
 * A Gaussian pulse propagating under omega(k) = v0 * k + 0.5 * beta * k^2.
 *
 * The slider controls beta (the curvature of the dispersion relation). At
 * beta = 0 the pulse translates rigidly; crank it up and the envelope
 * broadens as it moves, with v_g = dω/dk = v0 + beta * k0 depending on the
 * component. Higher-k content outruns lower-k content and the packet smears.
 */

const RATIO = 0.55;
const MAX_HEIGHT = 340;

export interface DispersionSceneProps {
  width?: number;
  height?: number;
}

export function DispersionScene(_props: DispersionSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const colors = useThemeColors();

  const [beta, setBeta] = useState(0.2);
  const betaRef = useRef(beta);
  useEffect(() => {
    betaRef.current = beta;
  }, [beta]);

  const [size, setSize] = useState({ width: 480, height: 260 });
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

  const { width, height } = size;

  // Animation: loop a pulse across the domain. tLoop in [0, T_loop).
  const T_LOOP = 14; // seconds of loop
  const startRef = useRef<number | null>(null);

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (t) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }

      ctx.clearRect(0, 0, width, height);

      const margin = 22;
      const plotW = width - 2 * margin;
      const plotH = height - 2 * margin - 24;
      const topY = margin;
      const botY = topY + plotH;
      const midY = topY + plotH / 2;

      // Local wrapped time so the pulse keeps coming back.
      if (startRef.current === null) startRef.current = t;
      const tLocal = ((t - startRef.current) % T_LOOP + T_LOOP) % T_LOOP;

      // Simulation: x in [0, L]. Pulse starts at x0 = 4, v0 = 2.
      const L = 40;
      const x0 = 4;
      const v0 = 2;
      const sigma0 = 0.9;
      const k0 = 6;
      const currentBeta = betaRef.current;

      // omega(k) = v0 * k + 0.5 * beta * (k - k0)^2 keeps v_p0 = v0 and adds
      // curvature at the carrier — matches the analytic dispersion
      // formulas in lib/physics/dispersion.ts.
      const omega = (k: number) =>
        v0 * k + 0.5 * currentBeta * (k - k0) * (k - k0);

      const xs: number[] = [];
      const nx = Math.max(160, Math.floor(plotW * 0.8));
      for (let i = 0; i <= nx; i++) xs.push((L * i) / nx);

      // Sample the packet at this wrapped time.
      // Shift initial centre to x0.
      const samples = gaussianPacket(
        xs.map((x) => x - x0),
        tLocal,
        {
          k0,
          sigma: sigma0,
          omega,
          nModes: 129,
          spectrumHalfWidthSigmas: 3.5,
        },
      );

      // Scales
      const yFactor = plotH * 0.42;
      const toPx = (x: number) => margin + (plotW * x) / L;

      // Axis
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(margin, midY);
      ctx.lineTo(margin + plotW, midY);
      ctx.stroke();

      // "medium" label bar
      const mediumStart = 10;
      const mediumEnd = L;
      ctx.fillStyle = "rgba(111, 184, 198, 0.06)";
      ctx.fillRect(
        toPx(mediumStart),
        topY,
        toPx(mediumEnd) - toPx(mediumStart),
        plotH,
      );
      ctx.strokeStyle = colors.fg3;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(toPx(mediumStart), topY);
      ctx.lineTo(toPx(mediumStart), botY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        "← vacuum  |  dispersive medium →",
        toPx(mediumStart),
        botY + 14,
      );

      // Envelope fill
      ctx.fillStyle = "rgba(111, 184, 198, 0.14)";
      ctx.beginPath();
      ctx.moveTo(toPx(xs[0]!), midY);
      for (let i = 0; i < xs.length; i++) {
        ctx.lineTo(toPx(xs[i]!), midY - samples[i]!.envelope * yFactor);
      }
      for (let i = xs.length - 1; i >= 0; i--) {
        ctx.lineTo(toPx(xs[i]!), midY + samples[i]!.envelope * yFactor);
      }
      ctx.closePath();
      ctx.fill();

      // Envelope dashed outline
      ctx.strokeStyle = "rgba(111, 184, 198, 0.55)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      for (const sign of [1, -1]) {
        ctx.beginPath();
        for (let i = 0; i < xs.length; i++) {
          const px = toPx(xs[i]!);
          const py = midY - sign * samples[i]!.envelope * yFactor;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Carrier
      ctx.strokeStyle = "#6FB8C6";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let i = 0; i < xs.length; i++) {
        const px = toPx(xs[i]!);
        const py = midY - samples[i]!.re * yFactor;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Readout
      ctx.fillStyle = colors.fg1;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText(
        `beta = d²ω/dk² = ${currentBeta.toFixed(2)}`,
        margin + 4,
        topY + 12,
      );
      ctx.textAlign = "right";
      ctx.fillText(
        `t = ${tLocal.toFixed(1)}`,
        margin + plotW - 4,
        topY + 12,
      );
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas ref={canvasRef} style={{ width, height }} className="block" />
      <div className="mt-2 flex items-center gap-3 px-2">
        <label className="text-sm text-[var(--color-fg-3)]">
          Dispersion β
        </label>
        <input
          type="range"
          min={0}
          max={0.8}
          step={0.02}
          value={beta}
          onChange={(e) => {
            setBeta(parseFloat(e.target.value));
            startRef.current = null; // restart loop so the change is legible
          }}
          className="flex-1 accent-[#6FB8C6]"
        />
        <span className="w-12 text-right text-sm font-mono text-[var(--color-fg-1)]">
          {beta.toFixed(2)}
        </span>
      </div>
      <div className="mt-1 px-2 text-xs text-[var(--color-fg-3)]">
        β = 0 is vacuum. Larger β is heavier glass. Watch the pulse broaden.
      </div>
    </div>
  );
}
