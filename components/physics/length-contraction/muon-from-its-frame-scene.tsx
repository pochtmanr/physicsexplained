"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { SPEED_OF_LIGHT } from "@/lib/physics/constants";
import { gamma } from "@/lib/physics/relativity/types";
import {
  contractedLength,
  muonFrameTraversalTime,
  muonSurvivalFromMuonFrame,
} from "@/lib/physics/relativity/length-contraction";

/**
 * FIG.07b — The muon shower, in the muon's own rest frame.
 *
 *  • In Earth's frame: a 10-km atmosphere, a muon zipping through at 0.995c.
 *    §02.1 explains the survival via time dilation.
 *  • In the muon's frame: the muon stands still. The atmosphere — and
 *    Earth — rush up at 0.995c, contracted to ~1 km. The traversal takes
 *    ~3.35 μs of the muon's proper time, which is ~1.5 half-lives.
 *    Survival ≈ 0.348. Same answer, different bookkeeping.
 *
 * Visual: the muon (cyan dot, fixed at canvas centre) waits while a marked
 * "atmosphere bar" of contracted length L₀/γ slides DOWN past it at βc.
 * Above the bar drifts a tiny "Earth surface" marker; once it reaches the
 * muon, the muon has passed through. A live readout shows the atmosphere's
 * contracted length, the elapsed proper time, and the surviving fraction.
 *
 * The point is not the animation; it is the equation in the HUD: the muon
 * frame and lab frame compute the SAME number, by entirely different
 * reasoning.
 */

const RATIO = 0.6;
const MAX_HEIGHT = 460;

const ATMOSPHERE_HEIGHT_M = 10_000; // proper (Earth-frame) height
const HALF_LIFE_S = 2.2e-6;

export function MuonFromItsFrameScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();

  const [beta, setBeta] = useState(0.995);
  const betaRef = useRef(beta);
  useEffect(() => {
    betaRef.current = beta;
  }, [beta]);

  const [size, setSize] = useState({ width: 720, height: 440 });
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

      const b = betaRef.current;
      const g = gamma(b);
      const Lcontracted = contractedLength(ATMOSPHERE_HEIGHT_M, b);
      const tProper = muonFrameTraversalTime(
        ATMOSPHERE_HEIGHT_M,
        b,
        SPEED_OF_LIGHT,
      );
      const survival = muonSurvivalFromMuonFrame(
        ATMOSPHERE_HEIGHT_M,
        b,
        HALF_LIFE_S,
        SPEED_OF_LIGHT,
      );

      // --- Vertical layout: atmosphere bar slides DOWN past the muon. ---
      // The "viewport" represents the muon's view of a strip of atmosphere
      // sliding past. We pace the slide so a full traversal takes ~6 sec
      // of wall time (visual pacing, not real time scale).
      const cycleSec = 6;
      const phase = (t / cycleSec) % 1;

      const cx = width * 0.5;
      const muonY = height * 0.55;

      // The atmosphere bar (contracted height) — visual span proportional
      // to L_contracted / 10_000 so the contraction is visible. At β=0.995,
      // L_contracted ≈ 1000 m — 10% of the proper height.
      const fullVisualBarHeight = height * 0.7; // when L_contracted = 10000
      const visualBarHeight =
        fullVisualBarHeight * (Lcontracted / ATMOSPHERE_HEIGHT_M);

      // Top of the bar starts above the muon, slides down past it.
      const startY = -visualBarHeight - 20;
      const endY = height + 20;
      const barTop = startY + (endY - startY) * phase;
      const barBottom = barTop + visualBarHeight;

      // Draw atmosphere bar: vertical magenta strip with rungs.
      const barLeft = cx - 70;
      const barRight = cx + 70;

      ctx.fillStyle = "rgba(255, 106, 222, 0.06)";
      ctx.fillRect(barLeft, barTop, barRight - barLeft, visualBarHeight);
      ctx.strokeStyle = colors.magenta;
      ctx.lineWidth = 1.4;
      ctx.strokeRect(barLeft, barTop, barRight - barLeft, visualBarHeight);

      // rungs every 1/10 of the contracted height (each rung = 100 m
      // of proper Earth-frame, contracted)
      const rungs = 10;
      ctx.strokeStyle = "rgba(255, 106, 222, 0.45)";
      ctx.lineWidth = 0.6;
      for (let i = 1; i < rungs; i++) {
        const y = barTop + (visualBarHeight * i) / rungs;
        ctx.beginPath();
        ctx.moveTo(barLeft + 6, y);
        ctx.lineTo(barRight - 6, y);
        ctx.stroke();
      }

      // Bar label — top is "TOP OF ATMOSPHERE", bottom is "GROUND"
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      if (barTop > -10 && barTop < height) {
        ctx.fillText("top of atmosphere", cx, barTop - 6);
      }
      if (barBottom > 0 && barBottom < height + 10) {
        ctx.fillText("ground", cx, barBottom + 14);
      }

      // arrow showing motion (atmosphere moving DOWN past muon)
      ctx.strokeStyle = colors.magenta;
      ctx.lineWidth = 1;
      const arrowX = barRight + 18;
      const arrowYTop = height * 0.32;
      const arrowYBot = height * 0.5;
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowYTop);
      ctx.lineTo(arrowX, arrowYBot);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowYBot);
      ctx.lineTo(arrowX - 4, arrowYBot - 6);
      ctx.lineTo(arrowX + 4, arrowYBot - 6);
      ctx.closePath();
      ctx.fillStyle = colors.magenta;
      ctx.fill();
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText("βc", arrowX + 8, (arrowYTop + arrowYBot) / 2);

      // --- Muon (cyan dot, fixed) ---
      ctx.fillStyle = colors.cyan;
      ctx.beginPath();
      ctx.arc(cx, muonY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = colors.cyan;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, muonY, 11, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = colors.fg1;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText("μ⁻ (rest frame)", cx + 18, muonY + 4);

      // muon's local horizontal axis (its rest frame's "x")
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 0.6;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(20, muonY);
      ctx.lineTo(width - 20, muonY);
      ctx.stroke();
      ctx.setLineDash([]);

      // --- Left HUD: numbers ---
      const hud = [
        `frame:        muon's rest frame`,
        `β  = ${b.toFixed(4)}`,
        `γ  = ${g.toFixed(3)}`,
        `L₀ atmosphere = 10 000 m  (Earth frame)`,
        `L  contracted = ${Lcontracted.toFixed(0)} m  (= L₀/γ)`,
        `traversal     = ${(tProper * 1e6).toFixed(2)} μs  (= L/βc)`,
        `half-lives    = ${(tProper / HALF_LIFE_S).toFixed(2)}`,
        `survival      = ${(survival * 100).toFixed(1)} %`,
      ];
      ctx.fillStyle = colors.fg1;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      hud.forEach((line, i) => {
        ctx.fillText(line, 12, 18 + i * 14);
      });

      // --- Bottom note ---
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        "no time dilation in this frame — only a contracted atmosphere whooshing past",
        cx,
        height - 8,
      );
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-3">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block bg-[#0A0C12]"
      />
      <div className="mt-3 flex items-center gap-3 px-2 font-mono text-xs text-white/70">
        <label htmlFor="beta-muon" className="shrink-0">
          β = {beta.toFixed(4)}
        </label>
        <input
          id="beta-muon"
          type="range"
          min={0.5}
          max={0.999}
          step={0.0005}
          value={beta}
          onChange={(e) => setBeta(parseFloat(e.target.value))}
          className="w-full accent-[#FF6ADE]"
        />
      </div>
    </div>
  );
}
