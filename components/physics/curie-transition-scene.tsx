"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  spontaneousMagnetisation,
  curieWeiss,
} from "@/lib/physics/electromagnetism/ferromagnetism";

const RATIO = 0.58;
const MAX_HEIGHT = 400;

const MSAT = 1.0;

/**
 * M(T)/Msat below T_c (mean-field √(1 − T/T_c)), and the paramagnetic
 * Curie-Weiss susceptibility above T_c (χ = C/(T − T_c)) shown as a dotted
 * tail. Slider over T_c. An animated marker sweeps temperature to pin
 * "you are here." Caption anchor: "the phase transition you can see in
 * your hand."
 */
export function CurieTransitionScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 640, height: 380 });
  const [Tc, setTc] = useState(1043); // K — iron

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

      const padL = 56;
      const padR = 24;
      const padT = 28;
      const padB = 40;
      const plotW = width - padL - padR;
      const plotH = height - padT - padB;

      // Temperature axis: 0 .. 2·Tc so both sides are visible.
      const Tmax = 2 * Tc;
      const xOf = (T: number) => padL + (T / Tmax) * plotW;
      // Y axis: 0 .. 1.15 Msat
      const yMax = 1.15;
      const yOf = (y: number) => padT + (1 - y / yMax) * plotH;

      // Gridlines
      ctx.strokeStyle = "rgba(86, 104, 127, 0.22)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 1; i <= 4; i++) {
        const gx = padL + (i / 4) * plotW;
        ctx.moveTo(gx, padT);
        ctx.lineTo(gx, padT + plotH);
      }
      for (let i = 1; i <= 4; i++) {
        const gy = padT + (i / 5) * plotH;
        ctx.moveTo(padL, gy);
        ctx.lineTo(padL + plotW, gy);
      }
      ctx.stroke();

      // Axis frame
      ctx.strokeStyle = colors.fg3;
      ctx.strokeRect(padL, padT, plotW, plotH);

      // T_c vertical line
      ctx.strokeStyle = "rgba(255, 214, 107, 0.7)";
      ctx.lineWidth = 1.4;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(xOf(Tc), padT);
      ctx.lineTo(xOf(Tc), padT + plotH);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(255, 214, 107, 0.9)";
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText("T_c", xOf(Tc), padT - 6);

      // ── Spontaneous M(T) below T_c — magenta (order) ──
      ctx.strokeStyle = "#FF6ADE";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      const steps = 200;
      for (let i = 0; i <= steps; i++) {
        const T = (i / steps) * Tc;
        const M = spontaneousMagnetisation(T, Tc, MSAT);
        const px = xOf(T);
        const py = yOf(M);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // ── Curie-Weiss χ(T)/χ_ref above T_c — cyan dotted tail ──
      // Normalise χ so χ(2·T_c) = 0.5 in plotted units for visual clarity.
      const chiRef = curieWeiss(1.0, 2 * Tc, Tc); // = 1 / Tc
      ctx.strokeStyle = "rgba(120, 220, 255, 0.9)";
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      let first = true;
      for (let i = 1; i <= steps; i++) {
        const T = Tc + (i / steps) * (Tmax - Tc);
        if (T <= Tc + 1e-6) continue;
        const chi = curieWeiss(1.0, T, Tc); // ~1/(T−Tc)
        const y = Math.min(1.05, (chi / chiRef) * 0.5);
        const px = xOf(T);
        const py = yOf(y);
        if (first) {
          ctx.moveTo(px, py);
          first = false;
        } else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Legend
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      const legendY = padT + 12;
      ctx.fillStyle = "#FF6ADE";
      ctx.fillRect(padL + 8, legendY - 8, 10, 2);
      ctx.fillStyle = colors.fg1;
      ctx.fillText("M(T) / M_sat  (ordered phase)", padL + 24, legendY - 2);
      ctx.fillStyle = "rgba(120, 220, 255, 0.9)";
      ctx.fillRect(padL + 8, legendY + 8, 10, 2);
      ctx.fillStyle = colors.fg1;
      ctx.fillText("χ(T) Curie-Weiss  (paramagnetic tail)", padL + 24, legendY + 14);

      // Animated traveller along the temperature axis
      const sweepT = 14;
      const phase = (t % sweepT) / sweepT;
      // Ping-pong
      const u = phase < 0.5 ? phase * 2 : 2 - phase * 2;
      const Tnow = u * Tmax;
      let yNow: number;
      let colorNow: string;
      if (Tnow <= Tc) {
        yNow = spontaneousMagnetisation(Tnow, Tc, MSAT);
        colorNow = "#FF6ADE";
      } else {
        const chi = curieWeiss(1.0, Tnow, Tc);
        yNow = Math.min(1.05, (chi / chiRef) * 0.5);
        colorNow = "rgba(120, 220, 255, 0.95)";
      }
      ctx.fillStyle = colorNow;
      ctx.shadowColor = colorNow;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(xOf(Tnow), yOf(yNow), 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Axis labels
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillText("temperature T (K)", padL + plotW / 2, padT + plotH + 28);
      ctx.save();
      ctx.translate(14, padT + plotH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText("order parameter / χ  (arb.)", 0, 0);
      ctx.restore();

      // Tick labels on the T axis
      ctx.fillStyle = colors.fg3;
      ctx.font = "9px monospace";
      ctx.textAlign = "center";
      for (let i = 0; i <= 4; i++) {
        const T = (i / 4) * Tmax;
        ctx.fillText(`${Math.round(T)}`, padL + (i / 4) * plotW, padT + plotH + 14);
      }

      // HUD
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      const phaseLabel = Tnow <= Tc ? "ordered" : "paramagnetic";
      ctx.fillText(
        `T = ${Tnow.toFixed(0)} K   T_c = ${Tc.toFixed(0)} K   phase = ${phaseLabel}`,
        padL,
        14,
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
      <div className="mt-3 flex items-center gap-3 px-1 font-mono text-[11px] opacity-70">
        <label htmlFor="tc-slider">Curie temperature T_c (K)</label>
        <input
          id="tc-slider"
          type="range"
          min={300}
          max={1400}
          step={10}
          value={Tc}
          onChange={(e) => setTc(Number(e.target.value))}
          className="flex-1 max-w-[260px]"
        />
        <span className="tabular-nums">{Tc}</span>
      </div>
    </div>
  );
}
