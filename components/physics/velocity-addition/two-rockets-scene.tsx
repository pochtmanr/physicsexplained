"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { SPEED_OF_LIGHT } from "@/lib/physics/constants";
import {
  galileanLimit,
  twoRocketEarthFrameVelocity,
} from "@/lib/physics/relativity/velocity-addition";

/**
 * FIG.09a — Two rockets, Earth's frame.
 *
 * Earth observer sits at the origin of a horizontal track. Rocket A flies
 * at velocity βA·c in the +x direction. Once Rocket A is in flight it
 * launches Rocket B forward at velocity βB·c **as measured in Rocket A's
 * frame**. The reader controls both βA and βB with sliders and reads off
 * what Earth measures for Rocket B's speed.
 *
 * Two answers are displayed side-by-side:
 *   • Galilean prediction:  u_classical = vA + vB           (cyan)
 *   • Relativistic answer: u = (vA + vB) / (1 + vA vB / c²) (magenta)
 *
 * The default canonical case βA = βB = 0.6 produces the §02.4 money
 * number: Galileo says 1.2 c (forbidden), Einstein says 0.882 c. The
 * reader can push both sliders to 0.99 and watch the relativistic answer
 * still asymptote to c without ever reaching it.
 *
 * Palette:
 *   amber    — Earth-frame baseline / time-axis tick marks
 *   cyan     — Rocket A worldline + Galilean prediction track
 *   magenta  — Rocket B worldline + relativistic answer track
 */

const RATIO = 0.5;
const MAX_HEIGHT = 360;

export function TwoRocketsScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();

  const [betaA, setBetaA] = useState(0.6);
  const [betaB, setBetaB] = useState(0.6);
  const betaARef = useRef(betaA);
  const betaBRef = useRef(betaB);
  useEffect(() => {
    betaARef.current = betaA;
  }, [betaA]);
  useEffect(() => {
    betaBRef.current = betaB;
  }, [betaB]);

  const [size, setSize] = useState({ width: 720, height: 360 });
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
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
      }
      ctx.clearRect(0, 0, width, height);

      const c = SPEED_OF_LIGHT;
      const vA = betaARef.current * c;
      const vB = betaBRef.current * c;
      const uEinstein = twoRocketEarthFrameVelocity(vA, vB, c);
      const uGalilean = galileanLimit(vA, vB);

      // Track baseline
      const padX = 40;
      const padY = 60;
      const trackY = height * 0.55;
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padX, trackY);
      ctx.lineTo(width - padX, trackY);
      ctx.stroke();

      // Earth marker (left edge)
      ctx.fillStyle = "#FFC857";
      ctx.beginPath();
      ctx.arc(padX, trackY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px ui-monospace, SFMono-Regular, monospace";
      ctx.fillText("EARTH", padX - 6, trackY + 22);

      // c-marker (right edge represents x = c · t for animation period)
      const usable = width - 2 * padX;
      // Light-line mark — the wall the rockets cannot cross.
      ctx.strokeStyle = "#FFC857";
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padX + usable, trackY - 30);
      ctx.lineTo(padX + usable, trackY + 30);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#FFC857";
      ctx.fillText("c", padX + usable + 6, trackY + 4);

      // Animate three travellers — anim phase resets every 4 s.
      const period = 4;
      const tau = ((t / 1000) % period) / period; // 0..1

      // Rocket A: cyan, moves at βA · usable per period.
      const xA = padX + tau * betaARef.current * usable;
      ctx.fillStyle = colors.cyan;
      ctx.beginPath();
      ctx.arc(xA, trackY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colors.fg2;
      ctx.fillText("A", xA - 4, trackY - 12);

      // Rocket B (relativistic): magenta. Moves at uEinstein / c · usable.
      const xBe = padX + tau * (uEinstein / c) * usable;
      ctx.fillStyle = colors.magenta;
      ctx.beginPath();
      ctx.arc(xBe, trackY + 16, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colors.fg2;
      ctx.fillText("B (Einstein)", xBe - 24, trackY + 38);

      // Rocket B (Galilean ghost): cyan dashed, may walk OFF the right
      // edge (which is the c wall). When it does, we plot it leaving the
      // track to make the violation visceral.
      const xBgRaw = padX + tau * (uGalilean / c) * usable;
      ctx.strokeStyle = colors.cyan;
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(Math.min(xBgRaw, width - 6), trackY - 16, 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = colors.fg2;
      ctx.fillText(
        "B (Galilean ghost)",
        Math.min(xBgRaw, width - 6) - 36,
        trackY - 24,
      );

      // HUD readout
      ctx.fillStyle = colors.fg2;
      ctx.font = "12px ui-monospace, SFMono-Regular, monospace";
      const x0 = padX;
      let yh = 22;
      ctx.fillText(
        `Rocket A:           v_A = ${betaARef.current.toFixed(3)} c`,
        x0,
        yh,
      );
      yh += 16;
      ctx.fillText(
        `Rocket B in A:      v'_B = ${betaBRef.current.toFixed(3)} c`,
        x0,
        yh,
      );

      // Right side: numerical answers
      ctx.font = "12px ui-monospace, SFMono-Regular, monospace";
      const galStr = `Galilean: ${(uGalilean / c).toFixed(3)} c${
        uGalilean / c > 1 ? "  ⚠ > c" : ""
      }`;
      const einStr = `Einstein: ${(uEinstein / c).toFixed(3)} c`;
      const galX = width - padX - ctx.measureText(galStr).width;
      const einX = width - padX - ctx.measureText(einStr).width;
      ctx.fillStyle = colors.cyan;
      ctx.fillText(galStr, galX, 22);
      ctx.fillStyle = colors.magenta;
      ctx.fillText(einStr, einX, 38);

      void padY; // (reserved for future axis scaffolding)
    },
  });

  return (
    <div ref={containerRef} className="w-full">
      <div
        className="relative w-full overflow-hidden rounded-md bg-[#0A0C12]"
        style={{ height: size.height }}
      >
        <canvas ref={canvasRef} className="block h-full w-full" />
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block font-mono text-xs text-white/70">
          <div className="mb-1 flex items-center justify-between">
            <span>Rocket A speed (Earth frame): β_A</span>
            <span className="opacity-60">{betaA.toFixed(3)} c</span>
          </div>
          <input
            type="range"
            min={0}
            max={0.99}
            step={0.001}
            value={betaA}
            onChange={(e) => setBetaA(parseFloat(e.target.value))}
            className="w-full accent-cyan-400"
          />
        </label>
        <label className="block font-mono text-xs text-white/70">
          <div className="mb-1 flex items-center justify-between">
            <span>Rocket B speed (in A&rsquo;s frame): β&prime;_B</span>
            <span className="opacity-60">{betaB.toFixed(3)} c</span>
          </div>
          <input
            type="range"
            min={0}
            max={0.99}
            step={0.001}
            value={betaB}
            onChange={(e) => setBetaB(parseFloat(e.target.value))}
            className="w-full accent-fuchsia-400"
          />
        </label>
      </div>
      <p className="mt-2 font-mono text-[11px] text-white/50">
        Galileo (cyan ghost) says Earth sees Rocket B at v_A + v&prime;_B —
        which crosses c at β_A + β&prime;_B = 1. Einstein (magenta) says
        u = (v_A + v&prime;_B) / (1 + v_A v&prime;_B/c²) — strictly &lt; c
        for any sub-luminal pair. Default 0.6 c + 0.6 c → 0.882 c, not 1.2 c.
      </p>
    </div>
  );
}
