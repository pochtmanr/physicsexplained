"use client";

import { useEffect, useRef, useState } from "react";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { larmorPower } from "@/lib/physics/electromagnetism/larmor";
import { ELEMENTARY_CHARGE } from "@/lib/physics/constants";

/**
 * FIG.52b — Log-log plot of Larmor radiated power P vs |a| for an
 * electron, spanning a ∈ [10⁰, 10²⁴] m/s².
 *
 *   P = e² a² / (6π ε₀ c³) ≈ 5.71 × 10⁻⁵⁴ · a² W  (electron)
 *
 * On a log-log axis, log P = 2 · log a + const — a straight line of slope
 * 2. The scene draws that line plus annotated benchmark points from the
 * physical world:
 *   · car 0–100 km/h in 10 s                              a ≈ 2.8 m/s²
 *   · bullet leaving a rifle barrel                       a ≈ 5 × 10⁵ m/s²
 *   · electron in hydrogen ground state (v²/r)            a ≈ 9 × 10²² m/s²
 *   · LHC beam-bend (synchrotron)                          a ≈ 10²⁰ m/s²
 *   · 1 MV/m linac (electron, parallel)                    a ≈ 1.8 × 10¹⁷ m/s²
 *
 * Palette: amber line (radiated light), lilac dots for benchmarks,
 * monochrome HUD.
 *
 * Static plot — no animation. useAnimationFrame is not required here,
 * but the component still uses the scene conventions (ResizeObserver,
 * theme colors, kebab-case-slug-matching named export).
 */

const RATIO = 0.56;
const MAX_HEIGHT = 400;

const A_LO = 1; // log10 → 0
const A_HI = 1e24; // log10 → 24

interface Benchmark {
  a: number; // m/s²
  label: string;
}

const BENCHMARKS: Benchmark[] = [
  { a: 2.78, label: "car 0–100 km/h" },
  { a: 5e5, label: "rifle muzzle" },
  { a: 1.8e17, label: "1 MV/m linac (e⁻)" },
  { a: 1e20, label: "LHC beam-bend" },
  { a: 9e22, label: "e⁻ in hydrogen" },
];

export function LarmorPowerVsAccelerationScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 640, height: 360 });

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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = size;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const marginL = 58;
    const marginR = 24;
    const marginT = 28;
    const marginB = 48;
    const plotW = width - marginL - marginR;
    const plotH = height - marginT - marginB;

    const logA_lo = Math.log10(A_LO);
    const logA_hi = Math.log10(A_HI);

    // P spans: at a = 1, P ≈ 5.71e-54; at a = 1e24, P ≈ 5.71e-6. Pad.
    const pAtLo = larmorPower(ELEMENTARY_CHARGE, A_LO);
    const pAtHi = larmorPower(ELEMENTARY_CHARGE, A_HI);
    const logP_lo = Math.log10(pAtLo) - 2;
    const logP_hi = Math.log10(pAtHi) + 2;

    const xOf = (logA: number) =>
      marginL + plotW * ((logA - logA_lo) / (logA_hi - logA_lo));
    const yOf = (logP: number) =>
      marginT + plotH * (1 - (logP - logP_lo) / (logP_hi - logP_lo));

    // ── grid ──
    ctx.strokeStyle = colors.fg3;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);
    for (let k = Math.ceil(logA_lo); k <= Math.floor(logA_hi); k += 3) {
      const x = xOf(k);
      ctx.beginPath();
      ctx.moveTo(x, marginT);
      ctx.lineTo(x, marginT + plotH);
      ctx.stroke();
    }
    for (
      let k = Math.ceil(logP_lo);
      k <= Math.floor(logP_hi);
      k += 6
    ) {
      const y = yOf(k);
      ctx.beginPath();
      ctx.moveTo(marginL, y);
      ctx.lineTo(marginL + plotW, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // ── axes ──
    ctx.strokeStyle = colors.fg2;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(marginL, marginT);
    ctx.lineTo(marginL, marginT + plotH);
    ctx.lineTo(marginL + plotW, marginT + plotH);
    ctx.stroke();

    // x-axis labels
    ctx.fillStyle = colors.fg2;
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    for (let k = 0; k <= 24; k += 6) {
      const x = xOf(k);
      ctx.fillText(`10^${k}`, x, marginT + plotH + 14);
    }
    // y-axis labels
    ctx.textAlign = "right";
    for (let k = Math.ceil(logP_lo); k <= Math.floor(logP_hi); k += 12) {
      const y = yOf(k);
      ctx.fillText(`10^${k}`, marginL - 6, y + 3);
    }

    // axis titles
    ctx.textAlign = "center";
    ctx.fillStyle = colors.fg1;
    ctx.font = "11px monospace";
    ctx.fillText("|a|  (m/s²)", marginL + plotW / 2, marginT + plotH + 32);
    ctx.save();
    ctx.translate(14, marginT + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("P  (W,  electron)", 0, 0);
    ctx.restore();

    // ── main line: P(a) = (5.71e-54) · a²  — slope 2 on log-log ──
    ctx.strokeStyle = "rgba(255, 180, 80, 0.9)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    const steps = 200;
    for (let i = 0; i <= steps; i++) {
      const logA = logA_lo + ((logA_hi - logA_lo) * i) / steps;
      const aVal = 10 ** logA;
      const P = larmorPower(ELEMENTARY_CHARGE, aVal);
      const logP = Math.log10(P);
      const x = xOf(logA);
      const y = yOf(logP);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // ── slope-2 annotation — small right-triangle ──
    const annotA = 1e6; // pick a point on the line
    const annotLogA = Math.log10(annotA);
    const annotP = larmorPower(ELEMENTARY_CHARGE, annotA);
    const annotLogP = Math.log10(annotP);
    const triSize = 30;
    const x0 = xOf(annotLogA);
    const y0 = yOf(annotLogP);
    ctx.strokeStyle = "rgba(200, 160, 255, 0.6)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x0 + triSize, y0);
    ctx.lineTo(x0 + triSize, y0 - 2 * triSize);
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = "rgba(200, 160, 255, 0.85)";
    ctx.font = "10px monospace";
    ctx.textAlign = "left";
    ctx.fillText("slope = 2", x0 + triSize + 4, y0 - triSize);
    ctx.fillText("(P ∝ a²)", x0 + triSize + 4, y0 - triSize + 11);

    // ── benchmark dots ──
    for (const b of BENCHMARKS) {
      const logA = Math.log10(b.a);
      if (logA < logA_lo || logA > logA_hi) continue;
      const P = larmorPower(ELEMENTARY_CHARGE, b.a);
      const logP = Math.log10(P);
      const x = xOf(logA);
      const y = yOf(logP);
      // vertical guide
      ctx.strokeStyle = "rgba(200, 160, 255, 0.25)";
      ctx.setLineDash([1, 3]);
      ctx.beginPath();
      ctx.moveTo(x, marginT + plotH);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.setLineDash([]);
      // dot
      ctx.fillStyle = "#C8A0FF";
      ctx.beginPath();
      ctx.arc(x, y, 3.2, 0, Math.PI * 2);
      ctx.fill();
      // label
      ctx.fillStyle = colors.fg1;
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      // push label to left if near right edge
      const labX = x > marginL + plotW * 0.72 ? x - 6 : x + 6;
      const labAlign = x > marginL + plotW * 0.72 ? "right" : "left";
      ctx.textAlign = labAlign as CanvasTextAlign;
      ctx.fillText(b.label, labX, y - 6);
    }

    // ── HUD ──
    ctx.fillStyle = colors.fg1;
    ctx.font = "12px monospace";
    ctx.textAlign = "left";
    ctx.fillText("P  =  q² a² / (6π ε₀ c³)", marginL, 18);
    ctx.textAlign = "right";
    ctx.fillStyle = colors.fg2;
    ctx.fillText("electron,  log-log", width - marginR, 18);
  }, [size, colors]);

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-1 px-2 text-xs text-[var(--color-fg-3)]">
        One prefactor, twenty-four decades. An electron accelerating at
        atomic-orbit pace radiates roughly a hundred-millionth of a watt;
        a car on a motorway radiates about 10⁻⁵² of one.
      </div>
    </div>
  );
}
