"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { SPEED_OF_LIGHT } from "@/lib/physics/constants";
import { hertzWavelength } from "@/lib/physics/relativity/maxwell-c";
import {
  applyDpr,
  hexToRgba,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  useSceneSize,
  useSceneTokens,
} from "@/components/physics/_shared/scene-tokens";

/**
 * FIG.02c — Heinrich Hertz's 1887 dipole-and-spark-gap experiment.
 *
 * On the left: a dipole transmitter, two metal balls separated by a small
 * gap, driven by an induction coil at radio frequency. A spark crosses
 * the gap; current oscillation in the dipole launches an electromagnetic
 * wave (Maxwell's prediction made flesh).
 *
 * In the middle of the canvas: the propagating wavefront, drawn as
 * concentric amber rings expanding at speed c, with electric (cyan) and
 * magnetic (magenta) field oscillations indicated transversely.
 *
 * On the right: a small loop receiver with its own spark gap. When the
 * EM wave reaches the loop, a corresponding micro-spark fires across the
 * receiver gap — Hertz's confirmation that the wave was real and
 * carried the same speed Maxwell predicted.
 *
 * The frequency slider modulates the wavelength λ = c / f, with λ
 * displayed in real units in the HUD.
 *
 * Palette:
 *   amber   — the EM wave / sparks
 *   cyan    — E-field oscillation, transmitter and receiver structures
 *   magenta — B-field oscillation
 */

export function HertzSparkGapScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokens = useSceneTokens();

  const [frequencyMHz, setFrequencyMHz] = useState(50);
  const fRef = useRef(frequencyMHz);
  useEffect(() => {
    fRef.current = frequencyMHz;
  }, [frequencyMHz]);

  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.5,
    maxHeight: SCENE_HEIGHT_DEFAULT,
  });

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (t) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = applyDpr(canvas, width, height);
      if (!ctx) return;

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = tokens.bg;
      ctx.fillRect(0, 0, width, height);

      const f = fRef.current * 1e6; // Hz
      const lambda = hertzWavelength(f); // metres

      const padX = 60;
      const cy = height * 0.55;
      const txX = padX + 40;
      const rxX = width - padX - 40;
      const sep = rxX - txX;

      // Visual wavelength: scale so 1 m physical → ~ pixel-mapped fraction of canvas
      // We pick a canvas-relative "cycle" length so a few wavelengths span the gap
      const cyclesAcrossGap = 4;
      const wavelengthPx = sep / cyclesAcrossGap;
      const k = (2 * Math.PI) / wavelengthPx;
      const phase = (t / 1000) * 5 * 2 * Math.PI; // visual angular frequency

      // ── Travelling wave between TX and RX
      const amp = height * 0.18;

      // E (cyan) — vertical sinusoid
      ctx.strokeStyle = tokens.cyan;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let x = 0; x <= sep; x += 2) {
        const y = cy - amp * Math.sin(k * x - phase);
        if (x === 0) ctx.moveTo(txX + x, y);
        else ctx.lineTo(txX + x, y);
      }
      ctx.stroke();

      // B (magenta) — quarter-period offset
      ctx.strokeStyle = tokens.magenta;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      for (let x = 0; x <= sep; x += 2) {
        const y = cy + amp * 0.55 * Math.sin(k * x - phase);
        if (x === 0) ctx.moveTo(txX + x, y);
        else ctx.lineTo(txX + x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Wavelength bracket on the wave
      const lambdaStartX = txX + 20;
      const lambdaEndX = lambdaStartX + wavelengthPx;
      ctx.strokeStyle = tokens.panelBorder;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(lambdaStartX, cy + amp + 14);
      ctx.lineTo(lambdaEndX, cy + amp + 14);
      ctx.moveTo(lambdaStartX, cy + amp + 9);
      ctx.lineTo(lambdaStartX, cy + amp + 19);
      ctx.moveTo(lambdaEndX, cy + amp + 9);
      ctx.lineTo(lambdaEndX, cy + amp + 19);
      ctx.stroke();
      ctx.fillStyle = tokens.textMute;
      ctx.font = tokens.fontHud;
      const lambdaLabel = `λ = ${lambda < 1 ? `${(lambda * 100).toFixed(2)} cm` : `${lambda.toFixed(2)} m`}`;
      ctx.fillText(
        lambdaLabel,
        (lambdaStartX + lambdaEndX) / 2 - ctx.measureText(lambdaLabel).width / 2,
        cy + amp + 32,
      );

      // ── Transmitter dipole (TX) — two metal balls + spark gap
      const ballR = 10;
      ctx.fillStyle = tokens.cyan;
      ctx.beginPath();
      ctx.arc(txX, cy - 30, ballR, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(txX, cy + 30, ballR, 0, Math.PI * 2);
      ctx.fill();
      // sparking gap (amber flicker tied to phase)
      const sparkAlpha = 0.5 + 0.5 * Math.sin(phase * 2);
      ctx.strokeStyle = hexToRgba(tokens.amber, sparkAlpha);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(txX - 4, cy - ballR - 6);
      ctx.lineTo(txX + 3, cy - 3);
      ctx.lineTo(txX - 3, cy + 3);
      ctx.lineTo(txX + 4, cy + ballR + 6);
      ctx.stroke();
      ctx.fillStyle = tokens.textMute;
      ctx.fillText("TX (Hertz dipole)", txX - 50, cy + 60);

      // ── Receiver loop (RX) — circle with a small gap, fires when wave reaches it
      const loopR = 22;
      ctx.strokeStyle = tokens.cyan;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(rxX, cy, loopR, 0.18, Math.PI * 2 - 0.18);
      ctx.stroke();
      // RX spark — fires only on certain phases (when E at RX is near peak)
      const rxField = Math.sin(k * sep - phase);
      if (Math.abs(rxField) > 0.85) {
        ctx.strokeStyle = tokens.amber;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(rxX + Math.cos(0.18) * loopR, cy + Math.sin(0.18) * loopR);
        ctx.lineTo(rxX + 2, cy + 2);
        ctx.lineTo(rxX + Math.cos(-0.18) * loopR, cy - Math.sin(0.18) * loopR);
        ctx.stroke();
      }
      ctx.fillStyle = tokens.textMute;
      ctx.fillText("RX (loop receiver)", rxX - 56, cy + 50);

      // ── HUD readout
      ctx.fillStyle = tokens.textMute;
      let yh = 22;
      ctx.fillText(`f = ${(f / 1e6).toFixed(1)} MHz`, padX, yh);
      yh += 16;
      ctx.fillText(`c = ${SPEED_OF_LIGHT.toExponential(4)} m/s (Maxwell)`, padX, yh);
      yh += 16;
      ctx.fillStyle = tokens.amber;
      ctx.fillText(`λ = c / f = ${lambdaLabel.replace("λ = ", "")}`, padX, yh);
    },
  });

  return (
    <div ref={containerRef} className="w-full">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
      />
      <div className="mt-3">
        <label className="block font-mono text-xs text-[var(--color-fg-2)]">
          <div className="mb-1 flex items-center justify-between">
            <span>Driving frequency (MHz)</span>
            <span className="text-[var(--color-fg-3)]">{frequencyMHz.toFixed(0)} MHz</span>
          </div>
          <input
            type="range"
            min={5}
            max={500}
            step={1}
            value={frequencyMHz}
            onChange={(e) => setFrequencyMHz(parseFloat(e.target.value))}
            className="w-full"
            style={{ accentColor: "var(--color-amber)" }}
          />
        </label>
      </div>
      <p className="mt-2 font-mono text-[11px] text-[var(--color-fg-3)]">
        Hertz's 1887–1888 apparatus operated near 50 MHz (λ ≈ 6 m). The receiver loop
        fires a sympathetic spark whenever the electric component of the arriving
        wave is near its peak — Maxwell's electromagnetic waves, produced and
        detected on a benchtop.
      </p>
    </div>
  );
}
