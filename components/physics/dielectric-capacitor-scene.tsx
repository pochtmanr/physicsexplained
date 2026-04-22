"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  parallelPlateCapacitance,
  energyStored,
} from "@/lib/physics/capacitance";
import { capacitanceWithDielectric } from "@/lib/physics/electromagnetism/dielectrics";

type Hold = "Q" | "V";

const RATIO = 0.6;
const MAX_HEIGHT = 380;
const AREA = 0.01; // 100 cm²
const GAP = 1e-3; // 1 mm

/**
 * Parallel-plate capacitor with a slab of dielectric that slides into the
 * gap. Sliders for κ (1 → 80, water-grade) and slab insertion fraction
 * (0 = pulled out, 1 = fully inserted). A toggle picks which condition is
 * held fixed:
 *
 *   Hold Q (disconnected): inserting the dielectric drops V (and U), the
 *   visible signature of the slab being *pulled in*.
 *   Hold V (still connected to a battery): inserting raises U and pulls
 *   more free charge onto the plates.
 *
 * The "effective κ" is interpolated linearly with insertion fraction —
 * pedagogical, not the textbook fringe-field treatment.
 */
export function DielectricCapacitorScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [kappa, setKappa] = useState(4);
  const [insertion, setInsertion] = useState(0.6); // 0..1
  const [hold, setHold] = useState<Hold>("Q");
  const Q0 = 1e-9; // 1 nC reference free charge (Hold Q mode)
  const V0 = 9; // 9 V reference voltage (Hold V mode)
  const [size, setSize] = useState({ width: 640, height: 380 });

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
    onFrame: () => {
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

      // Effective κ as the slab slides in (linear interpolation)
      const kappaEff = 1 + (kappa - 1) * insertion;
      const C0 = parallelPlateCapacitance(AREA, GAP, 1);
      const C = capacitanceWithDielectric(C0, kappaEff);

      let V: number;
      let Q: number;
      let U: number;
      if (hold === "Q") {
        Q = Q0;
        V = Q / C; // V drops as κ rises
        U = (Q * Q) / (2 * C); // U drops as κ rises
      } else {
        V = V0;
        Q = C * V; // Q rises as κ rises
        U = energyStored(C, V); // U rises as κ rises
      }

      // Layout
      const padX = 60;
      const topPad = 70;
      const bottomPad = 90;
      const plotW = width - padX * 2;
      const plotH = height - topPad - bottomPad;
      const cyMid = topPad + plotH / 2;
      const visualGap = Math.min(plotH * 0.55, 110);
      const yTop = cyMid - visualGap / 2;
      const yBot = cyMid + visualGap / 2;
      const plateLeft = padX;
      const plateRight = width - padX;
      const plateW = plateRight - plateLeft;

      // Slab geometry: width = insertion * plateW, anchored to the right edge
      const slabW = Math.max(0, insertion * plateW);
      const slabLeft = plateRight - slabW;

      // Dielectric tint
      if (slabW > 0) {
        const tintAlpha = Math.min(0.28, 0.05 + 0.02 * (kappa - 1));
        ctx.fillStyle = `rgba(255, 106, 222, ${tintAlpha.toFixed(3)})`;
        ctx.fillRect(slabLeft, yTop, slabW, visualGap);
        // Slab outline
        ctx.strokeStyle = colors.fg3;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(slabLeft, yTop, slabW, visualGap);
        ctx.setLineDash([]);
        // κ label centred on the slab
        ctx.fillStyle = colors.fg1;
        ctx.font = "11px monospace";
        ctx.textAlign = "center";
        ctx.fillText(
          `κ = ${kappa.toFixed(1)}`,
          slabLeft + slabW / 2,
          cyMid + 4,
        );
      }

      // Field arrows. Magnitude scales with V/d; we tint vacuum portion
      // brighter, dielectric portion dimmer (since E is reduced inside).
      const arrowCount = Math.max(4, Math.floor(plateW / 38));
      const ag = plateW / (arrowCount + 1);
      const fieldDir = 1; // V > 0 by construction in this scene
      for (let i = 1; i <= arrowCount; i++) {
        const ax = plateLeft + i * ag;
        const insideSlab = ax >= slabLeft;
        // E inside slab = E_vacuum / kappaEff_local; here kappaEff_local
        // is just `kappa` where the slab is, 1 outside.
        const localKappa = insideSlab ? kappa : 1;
        const alpha = Math.min(0.85, 0.25 + 0.55 / localKappa);
        ctx.strokeStyle = `rgba(111, 184, 198, ${alpha.toFixed(3)})`;
        ctx.fillStyle = `rgba(111, 184, 198, ${alpha.toFixed(3)})`;
        ctx.lineWidth = 1.2;
        const yA = yTop + 6;
        const yB = yBot - 6;
        const yStart = fieldDir > 0 ? yA : yB;
        const yEnd = fieldDir > 0 ? yB : yA;
        ctx.beginPath();
        ctx.moveTo(ax, yStart);
        ctx.lineTo(ax, yEnd);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(ax, yEnd);
        ctx.lineTo(ax - 4, yEnd - fieldDir * 6);
        ctx.lineTo(ax + 4, yEnd - fieldDir * 6);
        ctx.closePath();
        ctx.fill();
      }

      // Plates (top: + magenta, bottom: − cyan)
      drawPlate(ctx, plateLeft, plateRight, yTop, "+");
      drawPlate(ctx, plateLeft, plateRight, yBot, "−");

      // HUD
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`C₀ = ${formatCap(C0)}`, padX - 40, 24);
      ctx.fillText(`κ_eff = ${kappaEff.toFixed(2)}`, padX - 40, 42);

      ctx.textAlign = "right";
      ctx.fillText(`C = ${formatCap(C)}`, width - padX + 40, 24);
      ctx.fillText(
        hold === "Q"
          ? `Q held: ${formatCharge(Q)} → V = ${V.toFixed(3)} V`
          : `V held: ${V.toFixed(2)} V → Q = ${formatCharge(Q)}`,
        width - padX + 40,
        42,
      );

      // Energy readout (centred bottom)
      ctx.fillStyle = colors.fg1;
      ctx.textAlign = "center";
      ctx.font = "12px monospace";
      ctx.fillText(`U = ${formatEnergy(U)}`, width / 2, height - 60);
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.fillText(
        hold === "Q"
          ? "fixed Q: U drops as the slab slides in — work done BY the field, ON the slab"
          : "fixed V: U rises — the battery pumps in extra free charge",
        width / 2,
        height - 44,
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
      <div className="mt-2 flex flex-col gap-2 px-2 font-mono text-xs">
        <div className="flex items-center gap-3">
          <span className="text-[var(--color-fg-3)]">HOLD</span>
          {(["Q", "V"] as Hold[]).map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => setHold(h)}
              className={`rounded border px-3 py-1 transition-colors ${
                hold === h
                  ? "border-[var(--color-cyan)] text-[var(--color-cyan)]"
                  : "border-[var(--color-fg-4)] text-[var(--color-fg-3)] hover:text-[var(--color-fg-1)]"
              }`}
            >
              {h === "Q" ? "Q (disconnected)" : "V (battery on)"}
            </button>
          ))}
        </div>
        <SliderRow
          label="κ"
          value={kappa}
          min={1}
          max={80}
          step={0.5}
          formatter={(v) => v.toFixed(1)}
          onChange={setKappa}
        />
        <SliderRow
          label="slab"
          value={insertion}
          min={0}
          max={1}
          step={0.01}
          formatter={(v) => `${(v * 100).toFixed(0)}% in`}
          onChange={setInsertion}
        />
      </div>
    </div>
  );
}

function drawPlate(
  ctx: CanvasRenderingContext2D,
  xL: number,
  xR: number,
  y: number,
  sign: "+" | "−",
) {
  const isPos = sign === "+";
  ctx.fillStyle = isPos ? "#FF6ADE" : "#6FB8C6";
  ctx.shadowColor = isPos
    ? "rgba(255, 106, 222, 0.4)"
    : "rgba(111, 184, 198, 0.4)";
  ctx.shadowBlur = 10;
  ctx.fillRect(xL, y - 3, xR - xL, 6);
  ctx.shadowBlur = 0;
  const w = xR - xL;
  const n = Math.max(4, Math.floor(w / 32));
  const step = w / (n + 1);
  ctx.fillStyle = "#0B1018";
  ctx.font = "bold 11px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let i = 1; i <= n; i++) ctx.fillText(sign, xL + i * step, y);
  ctx.textBaseline = "alphabetic";
}

function formatCap(C: number): string {
  if (C >= 1e-6) return `${(C * 1e6).toFixed(3)} µF`;
  if (C >= 1e-9) return `${(C * 1e9).toFixed(3)} nF`;
  return `${(C * 1e12).toFixed(3)} pF`;
}

function formatCharge(Q: number): string {
  if (Q >= 1e-6) return `${(Q * 1e6).toFixed(3)} µC`;
  if (Q >= 1e-9) return `${(Q * 1e9).toFixed(3)} nC`;
  return `${(Q * 1e12).toFixed(3)} pC`;
}

function formatEnergy(U: number): string {
  if (U === 0) return "0 J";
  if (U >= 1e-6) return `${(U * 1e6).toFixed(3)} µJ`;
  if (U >= 1e-9) return `${(U * 1e9).toFixed(3)} nJ`;
  if (U >= 1e-12) return `${(U * 1e12).toFixed(3)} pJ`;
  return `${U.toExponential(2)} J`;
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  formatter,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  formatter: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <label className="w-12 text-[var(--color-fg-3)]">{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 accent-[#6FB8C6]"
      />
      <span className="w-24 text-right text-[var(--color-fg-1)]">
        {formatter(value)}
      </span>
    </div>
  );
}
