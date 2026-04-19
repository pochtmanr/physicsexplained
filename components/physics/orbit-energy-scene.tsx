"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

export interface OrbitEnergySceneProps {}

/**
 * Visualizes how orbital shape changes with eccentricity:
 * e < 1  → ellipse  (E < 0, bound)
 * e = 1  → parabola (E = 0, marginally unbound)
 * e > 1  → hyperbola (E > 0, unbound)
 *
 * Uses the conic section polar equation: r(θ) = p / (1 + e cos θ)
 * where p = a(1 - e²) for e < 1, p = q (perihelion distance) for e = 1,
 * and p = a(e² - 1) for e > 1.
 */
export function OrbitEnergyScene({}: OrbitEnergySceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const colors = useThemeColors();
  const [ecc, setEcc] = useState(0.5);
  const eccRef = useRef(0.5);
  const [size, setSize] = useState({ width: 600, height: 420 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          setSize({ width: w, height: Math.min(w * 0.7, 420) });
        }
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  const handleSlider = useCallback((ev: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(ev.target.value);
    setEcc(val);
    eccRef.current = val;
  }, []);

  // Fixed perihelion distance so orbits share the same closest approach
  const q = 0.4; // perihelion in display units
  // For an animated body on the orbit
  const animThetaRef = useRef(0);

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (_t, dt) => {
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

      const e = eccRef.current;
      ctx.clearRect(0, 0, width, height);

      const scale = Math.min(width, height) * 0.35;
      const cx = width * 0.45;
      const cy = height * 0.5;

      // Conic section: r(theta) = p / (1 + e*cos(theta))
      // p chosen so perihelion distance q = p/(1+e) → p = q*(1+e)
      const p = q * (1 + e);

      // Determine max theta range for drawing
      let thetaMax = Math.PI;
      if (e >= 1) {
        // For hyperbola/parabola, curve only exists where 1 + e*cos(theta) > 0
        // → cos(theta) > -1/e → theta < acos(-1/e)
        thetaMax = e > 1 ? Math.acos(-1 / e) - 0.02 : Math.PI - 0.05;
      }

      // Draw the conic
      ctx.strokeStyle = "#6FB8C6";
      ctx.lineWidth = 2;
      ctx.beginPath();
      const steps = 400;
      let first = true;
      for (let i = 0; i <= steps; i++) {
        const theta = -thetaMax + (2 * thetaMax * i) / steps;
        const denom = 1 + e * Math.cos(theta);
        if (denom <= 0.01) continue;
        const r = p / denom;
        const x = cx + r * Math.cos(theta) * scale;
        const y = cy - r * Math.sin(theta) * scale;
        if (x < -50 || x > width + 50 || y < -50 || y > height + 50) {
          first = true;
          continue;
        }
        if (first) {
          ctx.moveTo(x, y);
          first = false;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // Sun at focus (origin)
      ctx.shadowColor = "rgba(111, 184, 198, 0.8)";
      ctx.shadowBlur = 18;
      ctx.fillStyle = "#6FB8C6";
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Animate a body along the orbit
      // Use angular velocity ~ 1/r^2 (Kepler's 2nd law: dtheta/dt ~ h/r^2)
      const h = Math.sqrt(p); // specific angular momentum (GM=1 units)
      const rCurrent = p / (1 + e * Math.cos(animThetaRef.current));
      const dThetaDt = h / (rCurrent * rCurrent);
      animThetaRef.current += dThetaDt * dt * 0.8;

      // For bound orbits, wrap around. For unbound, bounce back.
      if (e < 1) {
        if (animThetaRef.current > Math.PI) {
          animThetaRef.current -= 2 * Math.PI;
        }
      } else {
        // For hyperbola/parabola, if we exceed max theta, reset to -thetaMax
        if (animThetaRef.current > thetaMax * 0.95) {
          animThetaRef.current = -thetaMax * 0.95;
        }
      }

      const rBody = p / (1 + e * Math.cos(animThetaRef.current));
      const bx = cx + rBody * Math.cos(animThetaRef.current) * scale;
      const by = cy - rBody * Math.sin(animThetaRef.current) * scale;

      // Only draw body if on-screen
      if (bx > -10 && bx < width + 10 && by > -10 && by < height + 10) {
        ctx.fillStyle = colors.fg0;
        ctx.beginPath();
        ctx.arc(bx, by, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Orbit type label and energy
      let label = "";
      let energyStr = "";
      if (e < 0.999) {
        const aSma = q / (1 - e);
        const E = -1 / (2 * aSma); // GM = 1
        label = "ELLIPSE";
        energyStr = `E = ${E.toFixed(3)} < 0`;
      } else if (e <= 1.001) {
        label = "PARABOLA";
        energyStr = "E = 0";
      } else {
        const aHyp = q / (e - 1);
        const E = 1 / (2 * aHyp);
        label = "HYPERBOLA";
        energyStr = `E = +${E.toFixed(3)} > 0`;
      }

      // Draw labels
      ctx.fillStyle = colors.fg1;
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(label, 16, 28);
      ctx.font = "12px monospace";
      ctx.fillStyle = e < 0.999 ? "#6FB8C6" : e <= 1.001 ? "#FFCF56" : "#FF4FD8";
      ctx.fillText(energyStr, 16, 48);

      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.fillText(`e = ${e.toFixed(2)}`, 16, 68);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas ref={canvasRef} style={{ width: size.width, height: size.height }} className="block" />
      <div className="mt-3 flex items-center gap-3 px-4 pb-2">
        <label className="font-mono text-xs text-[var(--color-fg-3)]">
          e
        </label>
        <input
          type="range"
          min={0}
          max={1.5}
          step={0.01}
          value={ecc}
          onChange={handleSlider}
          className="flex-1 accent-[#6FB8C6]"
        />
        <span className="w-12 font-mono text-xs text-[var(--color-fg-1)]">
          {ecc.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
