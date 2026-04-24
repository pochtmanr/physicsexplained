"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.58;
const MAX_HEIGHT = 380;

/**
 * FIG.54a — Hertz's 1888 apparatus.
 *
 * Schematic of the Karlsruhe experiment that turned Maxwell's 1862
 * mathematical prediction into a measurable phenomenon. On the left, a
 * Ruhmkorff induction coil drives a spark gap between two brass spheres
 * — the transmitter. The spark oscillates at ~50 MHz, sending an EM
 * wave out through the lab. On the right, a simple open loop of wire
 * with a tiny secondary spark gap — the receiver. When the wave arrives
 * it drives a matching oscillation in the loop, and a faint spark jumps
 * the gap. Hertz saw it in a darkened room and confirmed Maxwell's
 * waves are real.
 *
 * The scene animates:
 *   · the primary spark striking periodically on the transmitter side
 *   · expanding concentric wavefronts sweeping across the scene
 *   · a delayed secondary spark on the receiver loop when a wavefront
 *     passes (propagation delay at scaled-up time)
 *   · a voltage trace at the bottom showing the receiver response
 */
export function Hertz1888ApparatusScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 640, height: 380 });

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

      // Layout bands: main apparatus on top 70%, voltage trace on bottom 30%.
      const apparatusH = height * 0.68;
      const traceTop = apparatusH;
      const traceH = height - traceTop;

      const txX = width * 0.2;
      const rxX = width * 0.8;
      const axisY = apparatusH * 0.55;

      // Separation for propagation-delay storytelling (scaled units).
      const separation = rxX - txX;

      // Spark-repetition period — slow enough to see each wave cross.
      const period = 1.8; // seconds
      const phase = (t % period) / period; // 0..1

      // Primary spark fires at phase = 0; wavefronts expand from phase 0..1.
      const sparkPhase = Math.max(0, 1 - phase * 8); // flash at start
      const waveFrontR = phase * separation * 1.3; // scaled propagation

      // ── Background rails for instruments ──
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(16, axisY);
      ctx.lineTo(width - 16, axisY);
      ctx.stroke();
      ctx.setLineDash([]);

      // ── Wavefronts (expanding circles from TX) ──
      const nFronts = 5;
      for (let k = 0; k < nFronts; k++) {
        const frontPhase = phase - k * 0.17;
        if (frontPhase < 0 || frontPhase > 1.1) continue;
        const rr = frontPhase * separation * 1.3;
        const alpha = Math.max(0, 0.45 - frontPhase * 0.4);
        ctx.strokeStyle = `rgba(140, 200, 255, ${alpha.toFixed(3)})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(txX, axisY, rr, 0, Math.PI * 2);
        ctx.stroke();
      }

      // ── Transmitter: induction-coil + spark gap ──
      // Coil body
      ctx.strokeStyle = colors.fg2;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(txX - 42, axisY + 22, 28, 40);
      ctx.fillStyle = colors.fg3;
      ctx.font = "9px monospace";
      ctx.textAlign = "center";
      ctx.fillText("induction", txX - 28, axisY + 74);
      ctx.fillText("coil", txX - 28, axisY + 84);

      // Wire from coil to the two brass spheres (spark-gap ends).
      ctx.strokeStyle = colors.fg2;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(txX - 28, axisY + 22);
      ctx.lineTo(txX - 28, axisY);
      ctx.lineTo(txX - 14, axisY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(txX - 28, axisY + 62);
      ctx.lineTo(txX - 28, axisY + 12);
      ctx.moveTo(txX + 14, axisY);
      ctx.lineTo(txX + 14, axisY);
      ctx.stroke();

      // Two brass spheres (TX dipole ends)
      ctx.fillStyle = "#FF6ADE";
      ctx.beginPath();
      ctx.arc(txX - 12, axisY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(txX + 12, axisY, 6, 0, Math.PI * 2);
      ctx.fill();

      // Primary spark — a jagged amber arc across the gap
      if (sparkPhase > 0.05) {
        ctx.strokeStyle = `rgba(255, 220, 120, ${(sparkPhase).toFixed(3)})`;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        const segments = 5;
        let sx = txX - 6;
        let sy = axisY;
        ctx.moveTo(sx, sy);
        for (let i = 1; i <= segments; i++) {
          const nx = txX - 6 + (i / segments) * 12;
          const ny = axisY + (Math.random() - 0.5) * 4;
          ctx.lineTo(nx, ny);
          sx = nx;
          sy = ny;
          void sx;
          void sy;
        }
        ctx.stroke();
        // halo
        ctx.fillStyle = `rgba(255, 220, 120, ${(sparkPhase * 0.25).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(txX, axisY, 14, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── Receiver: loop antenna with tiny gap ──
      const loopR = 26;
      ctx.strokeStyle = "#78DCFF";
      ctx.lineWidth = 2;
      ctx.beginPath();
      // Draw loop with a small break at top for the micro-gap
      ctx.arc(rxX, axisY, loopR, -Math.PI / 2 + 0.18, -Math.PI / 2 - 0.18 + 2 * Math.PI);
      ctx.stroke();

      // Micro-gap ends
      const gapA = -Math.PI / 2 + 0.18;
      const gapB = -Math.PI / 2 - 0.18 + 2 * Math.PI;
      const gax = rxX + loopR * Math.cos(gapA);
      const gay = axisY + loopR * Math.sin(gapA);
      const gbx = rxX + loopR * Math.cos(gapB - 2 * Math.PI);
      const gby = axisY + loopR * Math.sin(gapB - 2 * Math.PI);
      ctx.fillStyle = "#78DCFF";
      ctx.beginPath();
      ctx.arc(gax, gay, 2.5, 0, Math.PI * 2);
      ctx.arc(gbx, gby, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Receiver spark — fires with a small propagation delay (when the
      // wavefront reaches the RX position).
      const arrivalPhase = separation / (separation * 1.3); // ≈ 0.77
      const rxWindow = Math.max(0, 1 - Math.abs(phase - arrivalPhase) * 12);
      if (rxWindow > 0.05) {
        const sparkAlpha = rxWindow;
        ctx.strokeStyle = `rgba(255, 200, 120, ${sparkAlpha.toFixed(3)})`;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(gax, gay);
        const midX = (gax + gbx) / 2 + (Math.random() - 0.5) * 1.5;
        const midY = (gay + gby) / 2 - 1;
        ctx.lineTo(midX, midY);
        ctx.lineTo(gbx, gby);
        ctx.stroke();
        ctx.fillStyle = `rgba(255, 220, 120, ${(sparkAlpha * 0.3).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc((gax + gbx) / 2, gay - 2, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── Labels ──
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillText("TRANSMITTER", txX, axisY - 34);
      ctx.fillText("spark gap dipole", txX, axisY - 20);
      ctx.fillText("RECEIVER", rxX, axisY - 34);
      ctx.fillText("loop antenna", rxX, axisY - 20);

      // Arrow for the wave
      ctx.fillStyle = colors.fg3;
      ctx.font = "9px monospace";
      ctx.fillText("EM wave at c", (txX + rxX) / 2, axisY + 90);

      // ── Voltage trace at bottom ──
      // Envelope: a damped oscillation riding on each arrival.
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(16, traceTop + traceH * 0.5);
      ctx.lineTo(width - 16, traceTop + traceH * 0.5);
      ctx.stroke();

      ctx.strokeStyle = "#78DCFF";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const N = 200;
      for (let i = 0; i < N; i++) {
        const x = 16 + (i / (N - 1)) * (width - 32);
        const localPhase = i / (N - 1);
        // Pulse arrives around arrivalPhase, rings at the LC frequency,
        // decays over ~0.15 of the period.
        const offset = localPhase - arrivalPhase - (phase - arrivalPhase);
        const dt = localPhase - phase;
        void offset;
        const envelope = Math.exp(
          -Math.pow((localPhase - phase + 0.05) / 0.1, 2) * 4,
        );
        const v = envelope * Math.sin(localPhase * 110) * 0.8;
        const y = traceTop + traceH * 0.5 - v * traceH * 0.38;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        void dt;
      }
      ctx.stroke();

      // Trace label
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText("V(t) at receiver loop", 20, traceTop + 12);
      ctx.textAlign = "right";
      ctx.fillStyle = colors.fg3;
      ctx.fillText("Karlsruhe · 1888 · ~50 MHz", width - 20, traceTop + 12);

      // ── Header HUD ──
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`Hertz's spark-gap experiment`, 14, 18);
      ctx.textAlign = "right";
      ctx.fillStyle = colors.fg2;
      ctx.fillText(`Maxwell → 1862   Hertz → 1888`, width - 14, 18);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
    </div>
  );
}
