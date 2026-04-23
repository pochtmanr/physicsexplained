"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  zResistor,
  zInductor,
  zCapacitor,
  zSeries,
  cabs,
  cphase,
  powerFactor,
  averagePower,
} from "@/lib/physics/electromagnetism/ac-phasors";

const RATIO = 0.48;
const MAX_HEIGHT = 360;
const F = 50;
const OMEGA = 2 * Math.PI * F;
const V_RMS = 230; // volts — European mains
const R_LAMP = 40; // bulb resistance Ω — gives a sane brightness range
const L_VAL = 120e-3; // henries (for the R+L branch)
const C_VAL = 60e-6; // farads (for the R+C branch)

/**
 * FIG.30c — three bulbs, one source, three power factors.
 *
 * Each of three branches carries the same 230 V rms AC from the same
 * source, but the series load differs:
 *
 *   Branch A:  R only              — cos(φ) = 1       (brightest)
 *   Branch B:  R in series with L  — cos(φ) < 1       (dimmer)
 *   Branch C:  R in series with C  — cos(φ) < 1       (dimmer)
 *
 * All three bulbs are physically identical (same R_lamp). The real power
 * each dissipates is P = V_rms · I_rms · cos(φ). Brightness is rendered
 * proportional to that real power. The scene makes the power-factor
 * penalty legible at a glance — this is why grid operators bill industrial
 * users for poor cos(φ).
 */
export function PowerFactorScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 700, height: 340 });
  const tRef = useRef(0);

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
    onFrame: (_t, dt) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      tRef.current += dt;

      const { width, height } = size;
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }
      ctx.clearRect(0, 0, width, height);

      // Three branch impedances
      const ZA = zResistor(R_LAMP);
      const ZB = zSeries([zResistor(R_LAMP), zInductor(OMEGA, L_VAL)]);
      const ZC = zSeries([zResistor(R_LAMP), zCapacitor(OMEGA, C_VAL)]);

      const branches = [ZA, ZB, ZC];
      const labels = ["R only", "R + L", "R + C"];

      // Real power in each branch: |I|_rms = V_rms / |Z|, P = V·I·cos(φ)
      const powers = branches.map((Z) => {
        const Irms = V_RMS / cabs(Z);
        const phi = cphase(Z);
        return { Z, phi, Irms, P: averagePower(V_RMS, Irms, phi) };
      });
      const Pmax = Math.max(...powers.map((p) => p.P));

      const panelW = width / 3;
      for (let i = 0; i < 3; i++) {
        drawBranch(
          ctx,
          colors,
          i * panelW,
          0,
          panelW,
          height,
          labels[i] ?? "",
          powers[i]!,
          Pmax,
          tRef.current,
        );
      }

      // Top title
      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillText(
        "FIG.30c — three bulbs, same 230 V rms, three power factors",
        12,
        18,
      );
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block rounded-md"
      />
      <p className="mt-2 px-2 text-xs font-mono text-[var(--color-fg-3)]">
        same voltage drives three loads — only the resistive branch reaches
        full brightness; reactive branches waste current shuffling energy
        in and out of their fields
      </p>
    </div>
  );
}

function drawBranch(
  ctx: CanvasRenderingContext2D,
  colors: { fg1: string; fg2: string; fg3: string },
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  p: {
    Z: { re: number; im: number };
    phi: number;
    Irms: number;
    P: number;
  },
  Pmax: number,
  t: number,
) {
  // Panel separators
  ctx.strokeStyle = "rgba(86, 104, 127, 0.35)";
  ctx.lineWidth = 1;
  if (x > 0.5) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, y + 30);
    ctx.lineTo(x + 0.5, y + h - 10);
    ctx.stroke();
  }

  const cx = x + w / 2;
  const cy = y + h / 2 - 6;

  // AC source (small circle with ~)
  const srcX = x + 18;
  const srcY = cy;
  ctx.strokeStyle = colors.fg2;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(srcX, srcY, 10, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(srcX - 6, srcY);
  ctx.quadraticCurveTo(srcX - 3, srcY - 5, srcX, srcY);
  ctx.quadraticCurveTo(srcX + 3, srcY + 5, srcX + 6, srcY);
  ctx.stroke();
  ctx.fillStyle = colors.fg3;
  ctx.font = "9px monospace";
  ctx.textAlign = "center";
  ctx.fillText("230V", srcX, srcY + 24);

  // Wire across top of panel into the load area
  const lampX = cx + 12;
  const lampY = cy;
  ctx.strokeStyle = "rgba(180, 190, 210, 0.8)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(srcX + 10, srcY);
  ctx.lineTo(lampX - 26, lampY);
  ctx.stroke();
  // Return wire
  ctx.beginPath();
  ctx.moveTo(lampX + 20, lampY);
  ctx.lineTo(x + w - 12, lampY);
  ctx.lineTo(x + w - 12, lampY + 28);
  ctx.lineTo(srcX, lampY + 28);
  ctx.lineTo(srcX, srcY + 10);
  ctx.stroke();

  // Series reactive component (drawn in the wire just left of the bulb)
  const reText = label;
  if (label === "R + L") {
    drawInductor(ctx, lampX - 55, lampY);
  } else if (label === "R + C") {
    drawCapacitor(ctx, lampX - 50, lampY);
  }

  // Lightbulb — brightness proportional to real power
  const brightness = Pmax > 0 ? p.P / Pmax : 0;
  drawBulb(ctx, lampX, lampY, brightness);

  // Label at the top of the panel
  ctx.fillStyle = colors.fg1;
  ctx.font = "bold 11px monospace";
  ctx.textAlign = "center";
  ctx.fillText(reText, cx, y + 34);

  // HUD beneath the bulb
  const padX = x + 12;
  const baseY = y + h - 58;
  ctx.font = "9px monospace";
  ctx.textAlign = "left";
  ctx.fillStyle = colors.fg2;
  ctx.fillText(`|Z| = ${cabs(p.Z).toFixed(1)} Ω`, padX, baseY);
  ctx.fillText(
    `φ    = ${((p.phi * 180) / Math.PI).toFixed(1)}°`,
    padX,
    baseY + 12,
  );
  ctx.fillText(`cos φ = ${powerFactor(p.Z).toFixed(3)}`, padX, baseY + 24);
  ctx.fillStyle = colors.fg1;
  ctx.fillText(
    `I_rms = ${p.Irms.toFixed(2)} A`,
    padX,
    baseY + 36,
  );
  // Highlight P — this is the punchline
  ctx.fillStyle = "rgba(255, 214, 107, 0.95)";
  ctx.font = "bold 10px monospace";
  ctx.fillText(`P = ${p.P.toFixed(0)} W`, padX, baseY + 50);

  // Instantaneous-current arrow in the wire, flowing with the cycle
  const phase = OMEGA * t * 0.05 - p.phi; // slowed-down phase
  const curPhase = Math.cos(phase);
  const alpha = 0.3 + 0.55 * Math.abs(curPhase);
  ctx.fillStyle = `rgba(255, 214, 107, ${alpha})`;
  const arrX = srcX + 24 + (curPhase + 1) * 4;
  ctx.beginPath();
  ctx.moveTo(arrX, lampY - 4);
  ctx.lineTo(arrX + 6, lampY);
  ctx.lineTo(arrX, lampY + 4);
  ctx.closePath();
  ctx.fill();
}

function drawBulb(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  brightness: number,
) {
  // Halo glow (proportional to brightness)
  const radius = 18;
  const haloAlpha = 0.15 + 0.7 * brightness;
  const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, radius * 2.2);
  grad.addColorStop(0, `rgba(255, 240, 180, ${haloAlpha})`);
  grad.addColorStop(1, "rgba(255, 240, 180, 0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 2.2, 0, Math.PI * 2);
  ctx.fill();

  // Bulb envelope
  ctx.strokeStyle = "rgba(200, 210, 224, 0.85)";
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.arc(cx, cy - 2, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Filament — color shifts with brightness from dim red through amber to white
  const r = Math.min(255, 180 + 75 * brightness);
  const g = Math.min(255, 100 + 140 * brightness);
  const b = Math.min(255, 40 + 170 * brightness);
  ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.5 + 0.5 * brightness})`;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(cx - 6, cy - 2);
  for (let i = 0; i <= 4; i++) {
    const fx = cx - 6 + (i / 4) * 12;
    const fy = cy - 2 + (i % 2 === 0 ? 3 : -3);
    ctx.lineTo(fx, fy);
  }
  ctx.stroke();

  // Screw base
  ctx.fillStyle = "rgba(160, 170, 185, 0.75)";
  ctx.fillRect(cx - 7, cy + 14, 14, 7);
  ctx.strokeStyle = "rgba(60, 68, 80, 0.9)";
  ctx.lineWidth = 0.8;
  for (let k = 0; k < 3; k++) {
    ctx.beginPath();
    ctx.moveTo(cx - 7, cy + 15 + k * 2);
    ctx.lineTo(cx + 7, cy + 15 + k * 2);
    ctx.stroke();
  }
}

function drawInductor(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
) {
  ctx.strokeStyle = "rgba(255, 106, 222, 0.85)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const sx = x + i * 6;
    ctx.moveTo(sx, y);
    ctx.arc(sx + 3, y, 3, Math.PI, 0, false);
  }
  ctx.stroke();
  ctx.fillStyle = "rgba(255, 106, 222, 0.9)";
  ctx.font = "9px monospace";
  ctx.textAlign = "center";
  ctx.fillText("L", x + 12, y - 8);
}

function drawCapacitor(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
) {
  ctx.strokeStyle = "rgba(120, 220, 255, 0.9)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x, y - 8);
  ctx.lineTo(x, y + 8);
  ctx.moveTo(x + 6, y - 8);
  ctx.lineTo(x + 6, y + 8);
  ctx.stroke();
  ctx.fillStyle = "rgba(120, 220, 255, 0.9)";
  ctx.font = "9px monospace";
  ctx.textAlign = "center";
  ctx.fillText("C", x + 3, y - 12);
}
