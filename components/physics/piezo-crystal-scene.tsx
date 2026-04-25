"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  D33_QUARTZ,
  directPiezoEffect,
  inversePiezoEffect,
} from "@/lib/physics/electromagnetism/piezo";

const RATIO = 0.62;
const MAX_HEIGHT = 380;

type Mode = "direct" | "inverse";

/**
 * A schematic α-quartz lattice — three rings of charges around a hexagonal
 * polar axis. Two modes:
 *
 *   • DIRECT  — the user squeezes (or pulls) the crystal with the slider. The
 *               lattice deforms, the +/− charge centroids separate, and a
 *               surface charge density σ = d₃₃ · σ_stress appears on the polar
 *               (top/bottom) faces. HUD reports σ in C/m².
 *
 *   • INVERSE — the user applies a voltage. The lattice elongates by a strain
 *               δL/L = d₃₃ · V/L. Surface arrows show the polar faces moving
 *               apart. HUD reports the strain.
 *
 * Numbers use D33_QUARTZ ≈ 2.3 pC/N. Stresses up to ±10 MPa, voltages up to
 * ±1000 V. The visual deformation is exaggerated by ~10⁵ so it's actually
 * visible — quartz only flexes by parts per million in real life.
 */
export function PiezoCrystalScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 640, height: 380 });
  const [mode, setMode] = useState<Mode>("direct");
  const [stressMPa, setStressMPa] = useState(0); // signed, MPa
  const [voltageV, setVoltageV] = useState(0); // signed, V
  // Crystal thickness for the inverse calculation (1 mm thick wafer).
  const THICKNESS_M = 1e-3;

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

      const cx = width / 2;
      const cy = height / 2;
      const baseR = Math.min(width, height) * 0.16;

      // ── Compute the strain to display ──
      // Direct: stress σ → strain δL/L = σ / Y (use Y = 70 GPa for quartz),
      //         and surface charge σ_s = d₃₃ · σ.
      // Inverse: voltage V → strain = d₃₃ · V/L. No surface charge in the
      //          "free crystal" sense, but the polar faces visibly move.
      const Y_QUARTZ = 7e10; // Pa (Young's modulus along c-axis)

      let strain = 0;
      let surfaceCharge = 0; // C/m²
      let badge = "";

      if (mode === "direct") {
        const stress = stressMPa * 1e6;
        strain = -stress / Y_QUARTZ; // tension (σ>0) elongates → negative compression
        // For lattice display, "strain along polar axis" — positive = elongate
        const lattice_strain = stress / Y_QUARTZ;
        strain = lattice_strain;
        surfaceCharge = directPiezoEffect(stress, D33_QUARTZ);
        badge = `σ_face = ${formatChargeDensity(surfaceCharge)}`;
      } else {
        strain = inversePiezoEffect(voltageV, D33_QUARTZ, THICKNESS_M);
        badge = `δL/L = ${formatStrain(strain)}`;
      }

      // Exaggerate strain for visibility — real quartz strains are ~10⁻⁶
      const VISUAL_GAIN = 4e5;
      const stretch = 1 + Math.tanh(strain * VISUAL_GAIN) * 0.22;

      // ── Draw the hexagonal cell ──
      // Six outer atoms (alternating + and −) on a hex; one central +.
      // Stretch only along the vertical (polar) axis.
      const ringR = baseR;
      const ringRy = ringR * stretch;
      const ringRx = ringR / Math.sqrt(stretch); // Poisson-ish, just for looks

      const atoms: Array<{ x: number; y: number; sign: 1 | -1 }> = [];
      for (let i = 0; i < 6; i++) {
        const theta = (i / 6) * Math.PI * 2 - Math.PI / 2;
        atoms.push({
          x: cx + ringRx * Math.cos(theta),
          y: cy + ringRy * Math.sin(theta),
          sign: i % 2 === 0 ? +1 : -1,
        });
      }

      // ── Crystal outline (a slim rectangle aligned with polar axis) ──
      const crystalW = ringRx * 2.4;
      const crystalH = ringRy * 2.6;
      const crystalX = cx - crystalW / 2;
      const crystalY = cy - crystalH / 2;
      ctx.strokeStyle = colors.fg2;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.strokeRect(crystalX, crystalY, crystalW, crystalH);
      ctx.setLineDash([]);

      // ── Polar-axis label arrow on the right ──
      ctx.strokeStyle = colors.fg2;
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      const axisX = crystalX + crystalW + 14;
      drawArrow(ctx, axisX, cy + 18, axisX, cy - 18, colors.fg2, 1);
      ctx.textAlign = "left";
      ctx.fillText("ẑ (polar)", axisX + 5, cy - 18);

      // ── Bonds between centre and each outer atom ──
      ctx.strokeStyle = "rgba(86, 104, 127, 0.5)";
      ctx.lineWidth = 1;
      for (const a of atoms) {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(a.x, a.y);
        ctx.stroke();
      }

      // ── Outer atoms ──
      for (const a of atoms) {
        drawAtom(ctx, a.x, a.y, a.sign, 9);
      }
      // Central atom (slightly larger, always +)
      drawAtom(ctx, cx, cy, +1, 11);

      // ── Surface charge layers on the polar faces (direct mode only) ──
      if (mode === "direct" && Math.abs(surfaceCharge) > 1e-12) {
        const layerThick = 5;
        const intensity = Math.min(1, Math.abs(surfaceCharge) / 25e-6);
        const topSign = surfaceCharge > 0 ? +1 : -1;
        const topColor =
          topSign > 0
            ? `rgba(255, 106, 222, ${0.25 + 0.6 * intensity})`
            : `rgba(111, 184, 198, ${0.25 + 0.6 * intensity})`;
        const botColor =
          topSign > 0
            ? `rgba(111, 184, 198, ${0.25 + 0.6 * intensity})`
            : `rgba(255, 106, 222, ${0.25 + 0.6 * intensity})`;
        ctx.fillStyle = topColor;
        ctx.fillRect(crystalX, crystalY, crystalW, layerThick);
        ctx.fillStyle = botColor;
        ctx.fillRect(
          crystalX,
          crystalY + crystalH - layerThick,
          crystalW,
          layerThick,
        );
        // Sign labels
        ctx.font = "bold 12px monospace";
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.fillStyle = topSign > 0 ? "#FF6ADE" : "#6FB8C6";
        ctx.fillText(
          topSign > 0 ? "+" : "−",
          cx,
          crystalY - 8,
        );
        ctx.fillStyle = topSign > 0 ? "#6FB8C6" : "#FF6ADE";
        ctx.fillText(
          topSign > 0 ? "−" : "+",
          cx,
          crystalY + crystalH + 8,
        );
        ctx.textBaseline = "alphabetic";
        ctx.textAlign = "left";
      }

      // ── Voltage source indicators (inverse mode) ──
      if (mode === "inverse" && Math.abs(voltageV) > 0.5) {
        ctx.font = "bold 14px monospace";
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        const topSign = voltageV > 0 ? "+" : "−";
        const botSign = voltageV > 0 ? "−" : "+";
        ctx.fillStyle = "#FFD66B";
        ctx.fillText(topSign, cx, crystalY - 10);
        ctx.fillText(botSign, cx, crystalY + crystalH + 10);
        // Strain arrows on the sides
        const elongated = strain > 0;
        const arrowMag = 14;
        const ay = elongated ? crystalY - 4 : crystalY + 4;
        const by = elongated
          ? crystalY + crystalH + 4
          : crystalY + crystalH - 4;
        drawArrow(
          ctx,
          crystalX - 14,
          cy,
          crystalX - 14,
          ay - (elongated ? arrowMag : -arrowMag),
          "#FFD66B",
          1.4,
        );
        drawArrow(
          ctx,
          crystalX - 14,
          cy,
          crystalX - 14,
          by + (elongated ? arrowMag : -arrowMag),
          "#FFD66B",
          1.4,
        );
        ctx.textBaseline = "alphabetic";
        ctx.textAlign = "left";
      }

      // ── External force arrows (direct mode) ──
      if (mode === "direct" && Math.abs(stressMPa) > 0.05) {
        const compress = stressMPa < 0;
        const fx = cx;
        const lenMag = 28;
        const inward = compress;
        // Top face arrow
        const topStart = inward ? crystalY - lenMag - 6 : crystalY - 6;
        const topEnd = inward ? crystalY - 6 : crystalY - lenMag - 6;
        drawArrow(ctx, fx, topStart, fx, topEnd, "#FFD66B", 1.6);
        const botStart = inward
          ? crystalY + crystalH + lenMag + 6
          : crystalY + crystalH + 6;
        const botEnd = inward
          ? crystalY + crystalH + 6
          : crystalY + crystalH + lenMag + 6;
        drawArrow(ctx, fx, botStart, fx, botEnd, "#FFD66B", 1.6);
      }

      // ── HUD ──
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillText(
        mode === "direct" ? "DIRECT effect — stress → charge" : "INVERSE effect — voltage → strain",
        12,
        18,
      );
      ctx.textAlign = "right";
      ctx.fillStyle = "#FFD66B";
      ctx.fillText(badge, width - 12, 18);
      ctx.fillStyle = colors.fg2;
      ctx.fillText("d₃₃ (quartz) = 2.3 pC/N", width - 12, 36);
      ctx.textAlign = "left";
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-2 flex flex-wrap items-center gap-4 px-2 font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[var(--color-fg-3)]">mode:</span>
          <button
            type="button"
            onClick={() => setMode("direct")}
            className={`rounded border px-2 py-1 ${
              mode === "direct"
                ? "border-[#FFD66B] text-[#FFD66B]"
                : "border-[var(--color-fg-4)] text-[var(--color-fg-1)]"
            }`}
          >
            direct
          </button>
          <button
            type="button"
            onClick={() => setMode("inverse")}
            className={`rounded border px-2 py-1 ${
              mode === "inverse"
                ? "border-[#FFD66B] text-[#FFD66B]"
                : "border-[var(--color-fg-4)] text-[var(--color-fg-1)]"
            }`}
          >
            inverse
          </button>
        </div>
        {mode === "direct" ? (
          <label className="flex items-center gap-2 text-[var(--color-fg-1)]">
            <span>stress σ</span>
            <input
              type="range"
              min={-10}
              max={10}
              step={0.1}
              value={stressMPa}
              onChange={(e) => setStressMPa(parseFloat(e.target.value))}
              className="w-44 accent-[#FF6ADE]"
            />
            <span className="w-20 text-right text-[var(--color-fg-3)]">
              {stressMPa.toFixed(1)} MPa
            </span>
          </label>
        ) : (
          <label className="flex items-center gap-2 text-[var(--color-fg-1)]">
            <span>voltage V</span>
            <input
              type="range"
              min={-1000}
              max={1000}
              step={5}
              value={voltageV}
              onChange={(e) => setVoltageV(parseFloat(e.target.value))}
              className="w-44 accent-[#FFD66B]"
            />
            <span className="w-20 text-right text-[var(--color-fg-3)]">
              {voltageV.toFixed(0)} V
            </span>
          </label>
        )}
      </div>
    </div>
  );
}

function drawAtom(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  sign: 1 | -1,
  r: number,
) {
  const isPos = sign > 0;
  const fill = isPos ? "#FF6ADE" : "#6FB8C6";
  ctx.shadowColor = isPos
    ? "rgba(255, 106, 222, 0.55)"
    : "rgba(111, 184, 198, 0.55)";
  ctx.shadowBlur = 10;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#1A1D24";
  ctx.font = `bold ${Math.max(10, r)}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(isPos ? "+" : "−", x, y + 1);
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  lineWidth: number,
) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  if (len < 0.5) return;
  const ux = dx / len;
  const uy = dy / len;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  const ah = 6;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - ux * ah - uy * ah * 0.5, y1 - uy * ah + ux * ah * 0.5);
  ctx.lineTo(x1 - ux * ah + uy * ah * 0.5, y1 - uy * ah - ux * ah * 0.5);
  ctx.closePath();
  ctx.fill();
}

function formatChargeDensity(sigma: number): string {
  const a = Math.abs(sigma);
  if (a === 0) return "0 C/m²";
  if (a >= 1e-3) return `${(sigma * 1e3).toFixed(2)} mC/m²`;
  if (a >= 1e-6) return `${(sigma * 1e6).toFixed(2)} µC/m²`;
  if (a >= 1e-9) return `${(sigma * 1e9).toFixed(2)} nC/m²`;
  return `${sigma.toExponential(2)} C/m²`;
}

function formatStrain(eps: number): string {
  const a = Math.abs(eps);
  if (a === 0) return "0";
  if (a >= 1e-3) return `${(eps * 1e3).toFixed(2)} ‰`;
  if (a >= 1e-6) return `${(eps * 1e6).toFixed(2)} ppm`;
  return `${eps.toExponential(2)}`;
}
