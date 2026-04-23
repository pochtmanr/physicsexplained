"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  solarGravityAcceleration,
  solarSailAcceleration,
} from "@/lib/physics/electromagnetism/radiation-pressure";

const RATIO = 0.55;
const MAX_HEIGHT = 400;

const AMBER = "rgba(255, 214, 107,";
const CYAN = "rgba(120, 220, 255,";
const MAGENTA = "rgba(255, 106, 222,";
const LILAC = "rgba(200, 160, 255,";

/**
 * FIG.40b — solar sail at interactive {area, mass, reflectivity, distance}.
 *
 * Sun at left; sail and spacecraft bus on the right. Photon-dot stream
 * emerges from the sun, strikes the sail, and peels back. Two force
 * arrows live near the sail: magenta for radiation-pressure acceleration,
 * cyan for solar gravity (pulling back toward the sun). Readers tune the
 * four parameters and watch the magenta/cyan ratio — the "can this sail
 * escape the sun" diagnostic.
 *
 * HUD reports:
 *   a_sail = (1+ρ)·I(r)·A/(m·c)
 *   g_sun  = GM/r²
 *   A/m   (area-to-mass ratio, m²/kg — the figure of merit for sailing)
 *   ratio a_sail/g_sun (>1 means sail out-pushes gravity)
 */
export function SolarSailScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 780, height: 400 });

  const [areaM2, setAreaM2] = useState(100);
  const [massKg, setMassKg] = useState(1);
  const [reflectivity, setReflectivity] = useState(0.9);
  const [distanceAU, setDistanceAU] = useState(1);

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

      // Compute the physics
      const aSail = solarSailAcceleration(
        areaM2,
        massKg,
        reflectivity,
        distanceAU,
      );
      const gSun = solarGravityAcceleration(distanceAU);
      const aRatio = aSail / gSun;
      const AoverM = areaM2 / massKg;

      // ─────── Scene layout ───────
      const sunX = width * 0.13;
      const sailX = width * 0.72;
      const cy = height * 0.5;

      // ─────── Sun ───────
      const sunR = 26 + 8 * Math.sin(t * 0.8); // slight pulse
      const sunGrad = ctx.createRadialGradient(sunX, cy, 4, sunX, cy, sunR);
      sunGrad.addColorStop(0, "rgba(255, 240, 180, 1)");
      sunGrad.addColorStop(0.6, "rgba(255, 200, 80, 0.7)");
      sunGrad.addColorStop(1, "rgba(255, 140, 40, 0)");
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(sunX, cy, sunR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255, 220, 110, 1)";
      ctx.beginPath();
      ctx.arc(sunX, cy, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText("SUN", sunX, cy + sunR + 14);

      // ─────── Photon stream (sun → sail) ───────
      // Density scales with 1/r² intensity visually (more dots at small r)
      const streamCount = Math.min(
        36,
        Math.max(6, Math.floor(14 / (distanceAU * distanceAU))),
      );
      const streamSpeed = 90;
      for (let i = 0; i < streamCount; i++) {
        const offset = (i / streamCount) * (sailX - sunX - 30);
        const xx =
          sunX + 14 + ((t * streamSpeed + offset) % (sailX - sunX - 30));
        const yShift = (Math.sin(i * 1.3) + Math.cos(i * 2.1)) * 28;
        const yy = cy + yShift;
        // Fade out as it approaches the sail (to hide the pop)
        const distFrac = (xx - sunX) / (sailX - sunX);
        const alpha = 0.3 + 0.5 * (1 - distFrac);
        ctx.fillStyle = `${AMBER} ${alpha.toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(xx, yy, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }

      // ─────── Sail ───────
      // Size of sail on-screen scales mildly with log(area) so the viewer sees
      // something move when the slider moves.
      const sailH = Math.max(80, Math.min(200, 50 + 15 * Math.log10(areaM2)));
      const sailW = 8;
      // Tilt slightly for a 3/4 perspective feel
      ctx.save();
      ctx.translate(sailX, cy);
      // Sail rectangle with gradient (reflectivity affects brightness)
      const sailGrad = ctx.createLinearGradient(-sailW, 0, sailW, 0);
      const brightness = 0.5 + 0.4 * reflectivity;
      sailGrad.addColorStop(
        0,
        `rgba(220, 220, 240, ${(brightness * 0.9).toFixed(2)})`,
      );
      sailGrad.addColorStop(1, `rgba(120, 140, 180, ${brightness.toFixed(2)})`);
      ctx.fillStyle = sailGrad;
      ctx.fillRect(-sailW / 2, -sailH / 2, sailW, sailH);
      // Sail edge
      ctx.strokeStyle = `${CYAN} 0.5)`;
      ctx.lineWidth = 1;
      ctx.strokeRect(-sailW / 2, -sailH / 2, sailW, sailH);
      ctx.restore();

      // Spacecraft bus behind the sail (small gray rectangle)
      ctx.fillStyle = "#505665";
      ctx.fillRect(sailX + 12, cy - 8, 18, 16);
      ctx.strokeStyle = "#1f2430";
      ctx.lineWidth = 1;
      ctx.strokeRect(sailX + 12, cy - 8, 18, 16);
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText("SAIL", sailX, cy + sailH / 2 + 14);

      // ─────── Force arrows ───────
      // Scale the visual arrow lengths relative to a_sail and g_sun so that
      // the ratio is visible. Cap at 90px so the stronger never clips off.
      const maxA = Math.max(aSail, gSun);
      const scale = 90 / Math.max(maxA, 1e-12);
      const aVisible = Math.min(100, aSail * scale);
      const gVisible = Math.min(100, gSun * scale);

      // Radiation pressure arrow: magenta, pushing sail away from sun (right)
      drawArrow(
        ctx,
        sailX + 34,
        cy - 24,
        sailX + 34 + aVisible,
        cy - 24,
        `${MAGENTA} 0.95)`,
        "a_sail",
        2.6,
      );
      // Gravity arrow: cyan, pulling sail toward sun (left)
      drawArrow(
        ctx,
        sailX + 34,
        cy + 24,
        sailX + 34 - gVisible,
        cy + 24,
        `${CYAN} 0.95)`,
        "g_sun",
        2.6,
      );

      // ─────── Photon recoil (reflected) ───────
      // A few magenta dots fading back to the left near the sail surface
      for (let i = 0; i < 5; i++) {
        const ageFrac = ((t * 0.8 + i * 0.2) % 1);
        const xx = sailX - 8 - ageFrac * 90;
        const yy = cy + ((i - 2) * 14);
        const alpha = (1 - ageFrac) * 0.65 * reflectivity;
        ctx.fillStyle = `${LILAC} ${alpha.toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(xx, yy, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }

      // ─────── HUD ───────
      ctx.font = "11px monospace";
      ctx.fillStyle = colors.fg1;
      ctx.textAlign = "left";
      ctx.fillText("Solar-sail pressure vs gravity", 12, 20);

      ctx.font = "10px monospace";
      ctx.fillStyle = `${MAGENTA} 0.95)`;
      ctx.fillText(`a_sail = ${fmtAcc(aSail)}`, 12, 38);
      ctx.fillStyle = `${CYAN} 0.95)`;
      ctx.fillText(`g_sun  = ${fmtAcc(gSun)}`, 12, 52);
      ctx.fillStyle = colors.fg2;
      ctx.fillText(`A/m = ${AoverM.toFixed(1)} m²/kg`, 12, 66);

      ctx.textAlign = "right";
      ctx.fillStyle = aRatio > 1 ? `${MAGENTA} 1)` : colors.fg2;
      ctx.fillText(
        aRatio > 1
          ? `a_sail / g_sun = ${aRatio.toFixed(2)}  (can escape)`
          : `a_sail / g_sun = ${aRatio.toExponential(2)}  (gravity wins)`,
        width - 12,
        20,
      );
      ctx.fillStyle = colors.fg2;
      ctx.fillText(`r = ${distanceAU.toFixed(2)} AU`, width - 12, 38);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-2 grid grid-cols-1 gap-2 px-2 font-mono text-xs md:grid-cols-2">
        <SliderRow
          label="Area"
          value={areaM2}
          onChange={setAreaM2}
          min={1}
          max={10000}
          step={1}
          display={`${areaM2} m²`}
          logScale
        />
        <SliderRow
          label="Mass"
          value={massKg}
          onChange={setMassKg}
          min={0.01}
          max={100}
          step={0.01}
          display={`${massKg.toFixed(2)} kg`}
          logScale
        />
        <SliderRow
          label="ρ (reflectivity)"
          value={reflectivity}
          onChange={setReflectivity}
          min={0}
          max={1}
          step={0.01}
          display={reflectivity.toFixed(2)}
        />
        <SliderRow
          label="r (AU)"
          value={distanceAU}
          onChange={setDistanceAU}
          min={0.3}
          max={5}
          step={0.05}
          display={`${distanceAU.toFixed(2)} AU`}
        />
      </div>
    </div>
  );
}

interface SliderRowProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  display: string;
  logScale?: boolean;
}

function SliderRow({
  label,
  value,
  onChange,
  min,
  max,
  step,
  display,
  logScale = false,
}: SliderRowProps) {
  // For log scale, the slider track is in log units; map to linear range.
  const sliderMin = logScale ? Math.log10(min) : min;
  const sliderMax = logScale ? Math.log10(max) : max;
  const sliderValue = logScale ? Math.log10(value) : value;
  const sliderStep = logScale ? 0.01 : step;
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = parseFloat(e.target.value);
    onChange(logScale ? Math.pow(10, raw) : raw);
  };
  return (
    <div className="flex items-center gap-3">
      <label className="w-28 text-[var(--color-fg-3)]">{label}</label>
      <input
        type="range"
        min={sliderMin}
        max={sliderMax}
        step={sliderStep}
        value={sliderValue}
        onChange={handleChange}
        className="flex-1"
        style={{ accentColor: "#FF6ADE" }}
      />
      <span className="w-20 text-right text-[var(--color-fg-1)]">{display}</span>
    </div>
  );
}

function fmtAcc(a: number): string {
  if (a >= 1) return `${a.toFixed(2)} m/s²`;
  if (a >= 1e-3) return `${(a * 1e3).toFixed(2)} mm/s²`;
  if (a >= 1e-6) return `${(a * 1e6).toFixed(2)} µm/s²`;
  return `${(a * 1e9).toFixed(2)} nm/s²`;
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  label: string,
  lineWidth = 2,
) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  const dx = x1 - x0;
  const dy = y1 - y0;
  const L = Math.hypot(dx, dy);
  if (L < 2) return;
  const ux = dx / L;
  const uy = dy / L;
  const head = 8;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - ux * head - uy * head * 0.5, y1 - uy * head + ux * head * 0.5);
  ctx.lineTo(x1 - ux * head + uy * head * 0.5, y1 - uy * head - ux * head * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.font = "10px monospace";
  ctx.textAlign = dx > 0 ? "left" : "right";
  ctx.fillText(label, x1 + (dx > 0 ? 6 : -6), y1 + 4);
}
