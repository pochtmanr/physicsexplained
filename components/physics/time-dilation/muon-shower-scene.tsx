"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { gamma } from "@/lib/physics/relativity/types";
import {
  classicalSurvivalFraction,
  muonSurvivalFraction,
} from "@/lib/physics/relativity/time-dilation";
import { SPEED_OF_LIGHT } from "@/lib/physics/constants";

/**
 * §02.1 MONEY SHOT — atmospheric muon shower.
 *
 * Cosmic-ray muons are created at ~10 km altitude with rest-frame half-life
 * τ = 2.2 μs. At β = 0.995, classical reasoning predicts ~660 m of travel
 * before half decay; only ~7% should reach sea level. Detectors observe
 * ~7× that survival rate. γ ≈ 10 explains it exactly: in the lab the muon's
 * internal clock runs slow, so 22 μs of lab time corresponds to only 2.2 μs
 * of proper time — exactly one half-life.
 *
 * The scene drops 300 muons from the top of a 10 km column. Each muon
 * travels at 0.995c. A proper-time clock on each muon advances at 1/γ the
 * rate of the lab clock. Each muon decays at a random proper time drawn
 * from `2^(-t_proper/τ)`. The HUD reports lab clock, proper clock, γ,
 * surviving population, and the classical-vs-relativistic counts.
 */

const RATIO = 0.6;
const MAX_HEIGHT = 540;
const N_MUONS = 300;
const ALT_M = 10_000; // 10 km column
const BETA = 0.995;
const TAU = 2.2e-6; // seconds — rest-frame muon half-life
const RUN_LAB_DURATION = 1.05 * (ALT_M / (BETA * SPEED_OF_LIGHT)); // ~35 μs
const ANIMATION_SPEED = RUN_LAB_DURATION / 5; // play full descent in ~5 s
const MARGIN_X = 110;
const MARGIN_Y = 32;

interface Muon {
  /** Proper-time half-life sample: muon decays once t_proper exceeds this. */
  decayProperTime: number;
  /** Horizontal jitter in [-1, 1] for visual spread. */
  xJitter: number;
}

export function MuonShowerScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ width: 700, height: 460 });
  const muons = useMemo<Muon[]>(() => {
    const arr: Muon[] = [];
    for (let i = 0; i < N_MUONS; i++) {
      // Sample a decay proper-time from N₀ · 2^(−t/τ).
      // Equivalent: t = -τ · log2(U) for U ∈ (0,1].
      const u = Math.random();
      const decay = -TAU * Math.log2(u || 1e-12);
      const xJitter = Math.random() * 2 - 1;
      arr.push({ decayProperTime: decay, xJitter });
    }
    return arr;
  }, []);

  // Resize
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
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      ctx.clearRect(0, 0, width, height);

      // Lab time loops every 5 seconds for replay.
      const tLab =
        ((t * ANIMATION_SPEED) % RUN_LAB_DURATION + RUN_LAB_DURATION) %
        RUN_LAB_DURATION;
      const g = gamma(BETA);
      const tProper = tLab / g;

      // ─── Atmosphere column ─────────────────────────────────────────────
      const colX0 = MARGIN_X;
      const colX1 = width - MARGIN_X;
      const colWidth = colX1 - colX0;
      const colY0 = MARGIN_Y;
      const colY1 = height - MARGIN_Y - 20;
      const colHeight = colY1 - colY0;

      // Background gradient (sky → ground)
      const grad = ctx.createLinearGradient(0, colY0, 0, colY1);
      grad.addColorStop(0, "rgba(60,90,150,0.20)");
      grad.addColorStop(1, "rgba(120,80,40,0.18)");
      ctx.fillStyle = grad;
      ctx.fillRect(colX0, colY0, colWidth, colHeight);

      // Column borders
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(colX0, colY0);
      ctx.lineTo(colX0, colY1);
      ctx.moveTo(colX1, colY0);
      ctx.lineTo(colX1, colY1);
      ctx.stroke();

      // Altitude grid (every 2 km)
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.font = "10px ui-monospace, monospace";
      ctx.textAlign = "right";
      for (let km = 0; km <= 10; km += 2) {
        const y = colY0 + (1 - km / 10) * colHeight;
        ctx.beginPath();
        ctx.moveTo(colX0 - 6, y);
        ctx.lineTo(colX1, y);
        ctx.stroke();
        ctx.fillText(`${km} km`, colX0 - 10, y + 3);
      }

      // Top label, bottom label
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(103, 232, 249, 0.85)";
      ctx.fillText("muons created here", (colX0 + colX1) / 2, colY0 - 10);
      ctx.fillStyle = "rgba(255, 214, 107, 0.85)";
      ctx.fillText("sea level — detector", (colX0 + colX1) / 2, colY1 + 14);

      // ─── Muons ─────────────────────────────────────────────────────────
      // Position of a still-living muon at lab time tLab:
      //   y = colY0 + (β·c·tLab / ALT_M) · colHeight
      const distance = BETA * SPEED_OF_LIGHT * tLab;
      const yFrac = Math.min(1, distance / ALT_M);
      const muonY = colY0 + yFrac * colHeight;

      let alive = 0;
      for (const m of muons) {
        const survived = tProper < m.decayProperTime;
        if (!survived) {
          // Show a faint X where it decayed
          const decayLab = m.decayProperTime * g;
          const decayDist = Math.min(
            ALT_M,
            BETA * SPEED_OF_LIGHT * decayLab,
          );
          const decayY = colY0 + (decayDist / ALT_M) * colHeight;
          const xPos = (colX0 + colX1) / 2 + m.xJitter * (colWidth * 0.4);
          ctx.fillStyle = "rgba(255,106,222,0.18)";
          ctx.beginPath();
          ctx.arc(xPos, decayY, 1.3, 0, Math.PI * 2);
          ctx.fill();
          continue;
        }
        alive++;
        const xPos = (colX0 + colX1) / 2 + m.xJitter * (colWidth * 0.4);
        // Living muon: cyan dot at current y
        ctx.fillStyle = "#67E8F9";
        ctx.beginPath();
        ctx.arc(xPos, muonY, 2.1, 0, Math.PI * 2);
        ctx.fill();
      }

      // ─── Predicted-classical population (the wrong answer) ─────────────
      // Show a separate "ghost" cohort whose decay rate uses lab time
      // (no dilation). For this we don't need to track each ghost — just
      // compute the expected fraction.
      const classicalFrac = classicalSurvivalFraction(
        Math.min(distance, ALT_M),
        BETA,
        TAU,
        SPEED_OF_LIGHT,
      );
      const relFrac = muonSurvivalFraction(
        Math.min(distance, ALT_M),
        BETA,
        TAU,
        SPEED_OF_LIGHT,
      );

      // ─── HUD ───────────────────────────────────────────────────────────
      ctx.font = "12px ui-monospace, monospace";
      ctx.textAlign = "left";
      const hudX = 12;
      let hy = 18;
      const lh = 16;

      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.fillText(`β = ${BETA}`, hudX, hy);
      hy += lh;
      ctx.fillText(`γ = ${g.toFixed(3)}`, hudX, hy);
      hy += lh;
      ctx.fillStyle = "#67E8F9";
      ctx.fillText(`lab clock     = ${(tLab * 1e6).toFixed(2)} μs`, hudX, hy);
      hy += lh;
      ctx.fillStyle = "#FF6ADE";
      ctx.fillText(`proper clock  = ${(tProper * 1e6).toFixed(3)} μs`, hudX, hy);
      hy += lh;
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.fillText(`τ (half-life) = ${(TAU * 1e6).toFixed(1)} μs`, hudX, hy);
      hy += lh + 4;

      ctx.fillStyle = "#67E8F9";
      ctx.fillText(`alive (rel)   = ${alive}/${N_MUONS}`, hudX, hy);
      hy += lh;
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.fillText(
        `predicted rel = ${(relFrac * N_MUONS).toFixed(0)}  (${(relFrac * 100).toFixed(1)}%)`,
        hudX,
        hy,
      );
      hy += lh;
      ctx.fillStyle = "#FFB36B";
      ctx.fillText(
        `classical     = ${(classicalFrac * N_MUONS).toFixed(0)}  (${(classicalFrac * 100).toFixed(1)}%)`,
        hudX,
        hy,
      );
      hy += lh;
      const ratio = relFrac / Math.max(1e-30, classicalFrac);
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.fillText(`excess factor = ×${ratio < 1e6 ? ratio.toFixed(0) : ratio.toExponential(1)}`, hudX, hy);

      // Bottom-right: status caption
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.textAlign = "right";
      ctx.fillText(
        "both observers agree on the count — only the bookkeeping differs",
        width - 14,
        height - 10,
      );
      ctx.textAlign = "left";
    },
  });

  return (
    <div ref={containerRef} className="flex flex-col gap-2">
      <canvas
        ref={canvasRef}
        className="rounded-md border border-white/10 bg-[#0A0C12]"
        style={{ width: size.width, height: size.height }}
      />
      <p className="font-mono text-[11px] text-white/55">
        300 muons, 10 km column, β = 0.995. Cyan dots = living muons; faint
        magenta dots mark where each muon decayed. The cyan reading is what
        sea-level detectors actually see; the orange reading is the
        no-dilation prediction. The disagreement is the experimental fact.
      </p>
    </div>
  );
}
