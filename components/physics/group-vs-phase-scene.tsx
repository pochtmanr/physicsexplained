"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.48;
const MAX_HEIGHT = 340;

const MAGENTA = "rgba(255, 100, 200,";  // carrier
const CYAN = "rgba(120, 220, 255,";     // envelope
const AMBER = "rgba(255, 180, 80,";     // phase marker

/**
 * FIG.42c — group velocity vs phase velocity.
 *
 * A Gaussian wave packet (envelope × carrier) propagates along x. We draw
 * both the envelope and the modulated carrier explicitly so the reader can
 * watch the zero-crossings of the carrier (phase features) sliding through
 * the envelope (the "group").
 *
 * - Normal medium (toggle = normal): v_phase > v_group. Carrier zero-
 *   crossings drift from the trailing edge toward the leading edge of the
 *   envelope — phase markers OVERTAKE the envelope and fall off the front,
 *   while new crossings appear from the back.
 * - Anomalous medium (toggle = anomalous): v_phase < v_group. Zero-crossings
 *   drift backward through the envelope instead.
 *
 * The two velocities shown are chosen visually, not tied to any real
 * dispersion relation; the toggle just flips the sign of v_phase − v_group
 * so the visual story is unambiguous.
 */
export function GroupVsPhaseScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 720, height: 340 });
  const [mode, setMode] = useState<"normal" | "anomalous">("normal");

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

      const marginX = 40;
      const midY = height * 0.55;
      const trackLen = width - 2 * marginX;

      // ── axes ──
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(marginX, midY);
      ctx.lineTo(marginX + trackLen, midY);
      ctx.stroke();

      // ── dispersion choice → velocities ──
      // pixel-units / second. Normal: phase faster than group.
      const vGroup = trackLen / 6; // envelope crosses scene in 6 s
      const vPhase = mode === "normal" ? vGroup * 1.7 : vGroup * 0.55;

      // Envelope center wraps the scene length.
      const xC = marginX + ((t * vGroup) % trackLen);

      // Carrier: k fixed, omega = k * v_phase.
      const k = 0.12; // per pixel
      const omega = k * vPhase;

      // Envelope half-width in pixels.
      const sigma = 60;

      // ── draw envelope (dotted) ──
      ctx.strokeStyle = `${CYAN} 0.5)`;
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const amp = 70;
      for (let px = 0; px <= trackLen; px += 2) {
        const x = marginX + px;
        const dx = x - xC;
        const env = Math.exp(-(dx * dx) / (2 * sigma * sigma));
        const y = midY - amp * env;
        if (px === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      // mirror below
      ctx.beginPath();
      for (let px = 0; px <= trackLen; px += 2) {
        const x = marginX + px;
        const dx = x - xC;
        const env = Math.exp(-(dx * dx) / (2 * sigma * sigma));
        const y = midY + amp * env;
        if (px === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // ── draw carrier × envelope ──
      ctx.strokeStyle = `${MAGENTA} 0.95)`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let px = 0; px <= trackLen; px += 1) {
        const x = marginX + px;
        const dx = x - xC;
        const env = Math.exp(-(dx * dx) / (2 * sigma * sigma));
        const carrier = Math.cos(k * x - omega * t);
        const y = midY - amp * env * carrier;
        if (px === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // ── amber phase markers: zero-crossings of the carrier ──
      // Carrier = 0 when k·x − ω·t = (m + 1/2)·π, i.e. x = (ω·t + (m+1/2)·π)/k.
      ctx.fillStyle = `${AMBER} 0.95)`;
      const mMin = Math.ceil((k * marginX - omega * t) / Math.PI - 0.5);
      const mMax = Math.floor((k * (marginX + trackLen) - omega * t) / Math.PI - 0.5);
      for (let m = mMin; m <= mMax; m++) {
        const x = (omega * t + (m + 0.5) * Math.PI) / k;
        const dx = x - xC;
        const env = Math.exp(-(dx * dx) / (2 * sigma * sigma));
        if (env > 0.08) {
          ctx.beginPath();
          ctx.arc(x, midY, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ── envelope-center marker ──
      ctx.strokeStyle = `${CYAN} 0.9)`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(xC, midY - amp - 12);
      ctx.lineTo(xC, midY + amp + 12);
      ctx.stroke();
      ctx.fillStyle = `${CYAN} 0.95)`;
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "center";
      ctx.fillText("envelope (v_group)", xC, midY - amp - 16);

      // ── HUD ──
      ctx.textAlign = "left";
      ctx.fillStyle = colors.fg1;
      ctx.font = "11px monospace";
      ctx.fillText("FIG.42c — envelope (group) vs carrier zero-crossings (phase)", 12, 18);

      ctx.fillStyle = `${MAGENTA} 0.9)`;
      ctx.fillText("— carrier × envelope", 12, 36);
      ctx.fillStyle = `${CYAN} 0.9)`;
      ctx.fillText("-- envelope only", 12, 52);
      ctx.fillStyle = `${AMBER} 0.9)`;
      ctx.fillText("• phase markers (carrier zeros)", 12, 68);

      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      const ratio = vPhase / vGroup;
      ctx.fillText(
        mode === "normal"
          ? `normal dispersion: v_phase > v_group  (v_ph / v_g ≈ ${ratio.toFixed(2)})`
          : `anomalous dispersion: v_phase < v_group  (v_ph / v_g ≈ ${ratio.toFixed(2)})`,
        12,
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
      <div className="mt-3 flex flex-wrap items-center gap-3 px-2 font-mono text-xs">
        <span className="text-[var(--color-fg-3)]">medium:</span>
        <button
          type="button"
          onClick={() => setMode("normal")}
          className={
            "rounded-sm border px-2 py-1 transition-colors " +
            (mode === "normal"
              ? "border-[var(--color-fg-1)] bg-[color-mix(in_srgb,var(--color-fg-1)_10%,transparent)] text-[var(--color-fg-0)]"
              : "border-[var(--color-fg-4)] text-[var(--color-fg-2)] hover:text-[var(--color-fg-1)]")
          }
        >
          normal
        </button>
        <button
          type="button"
          onClick={() => setMode("anomalous")}
          className={
            "rounded-sm border px-2 py-1 transition-colors " +
            (mode === "anomalous"
              ? "border-[var(--color-fg-1)] bg-[color-mix(in_srgb,var(--color-fg-1)_10%,transparent)] text-[var(--color-fg-0)]"
              : "border-[var(--color-fg-4)] text-[var(--color-fg-2)] hover:text-[var(--color-fg-1)]")
          }
        >
          anomalous
        </button>
        <span className="ml-auto text-[var(--color-fg-3)]">
          packet: Gaussian envelope × cosine carrier
        </span>
      </div>
    </div>
  );
}
