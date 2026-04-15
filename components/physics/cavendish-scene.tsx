"use client";

import { useRef, useState, useEffect } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

/**
 * Torsion balance visualisation for the Cavendish experiment.
 *
 * A horizontal arm with two small test masses is suspended from a thin wire.
 * Two large attracting masses sit nearby. The gravitational torque twists the
 * wire until it balances the restoring torque. Readout shows G and M_Earth.
 */
export function CavendishScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 600, height: 400 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          setSize({ width: w, height: Math.min(w * 0.65, 420) });
        }
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  const { width, height } = size;

  // Large-mass slider: 0.5 to 4 (arbitrary units representing 50-400 kg)
  const [bigMass, setBigMass] = useState(2);

  // Physics parameters (in arbitrary visual units)
  const smallMass = 0.73; // kg (Cavendish used 0.73 kg)
  const armLen = 90; // half-arm in px
  const wireK = 3.0; // torsion constant (arb)
  const separation = 50; // distance between small and large mass centers in px

  // Equilibrium twist angle: torque_grav = torque_restore
  // F_grav = G * M * m / d^2  —  torque = F * L  —  theta = torque / kappa
  // We use scaled units so that G_visual * M * m * L / (d^2 * kappa) gives a visible angle
  const gVisual = 12;
  const forceMag = (gVisual * bigMass * smallMass) / (separation * separation);
  const torque = forceMag * armLen;
  const eqAngle = torque / wireK;
  const maxAngle = Math.PI / 8;
  const clampedAngle = Math.min(eqAngle, maxAngle);

  // Smoothly animate toward equilibrium
  const angleRef = useRef(0);

  // Compute readout values
  // Map visual to real: G_real = 6.674e-11, bigMass slider 2 => 158 kg (Cavendish)
  const bigMassKg = bigMass * 79; // scale: 2 => 158 kg
  const G_real = 6.6743e-11;
  const g_real = 9.80665;
  const R_earth = 6.371e6;
  const M_earth = (g_real * R_earth * R_earth) / G_real;

  const [readoutState, setReadoutState] = useState({
    angleDeg: 0,
    G: G_real,
    MEarth: M_earth,
  });

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (_t, dt) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }
      ctx.clearRect(0, 0, width, height);

      // Animate toward equilibrium
      const target = clampedAngle;
      const speed = 3;
      angleRef.current += (target - angleRef.current) * Math.min(1, speed * dt);
      const angle = angleRef.current;

      const cx = width / 2;
      const cy = height / 2 - 10;

      // Wire (vertical line from top)
      ctx.strokeStyle = colors.fg2;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, 30);
      ctx.lineTo(cx, cy);
      ctx.stroke();

      // Wire support bracket at top
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 20, 30);
      ctx.lineTo(cx + 20, 30);
      ctx.stroke();

      // Arm (rotated by angle)
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const arm1X = cx + cosA * armLen;
      const arm1Y = cy + sinA * armLen;
      const arm2X = cx - cosA * armLen;
      const arm2Y = cy - sinA * armLen;

      ctx.strokeStyle = colors.fg1;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(arm1X, arm1Y);
      ctx.lineTo(arm2X, arm2Y);
      ctx.stroke();

      // Small masses (at arm ends)
      const smallR = 6;
      ctx.fillStyle = "#5BE9FF";
      ctx.shadowColor = "rgba(91, 233, 255, 0.6)";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(arm1X, arm1Y, smallR, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(arm2X, arm2Y, smallR, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Large masses (fixed, positioned to attract small masses)
      const bigR = 8 + bigMass * 3;
      const big1X = cx + armLen + separation * 0.6;
      const big1Y = cy + separation * 0.8;
      const big2X = cx - armLen - separation * 0.6;
      const big2Y = cy - separation * 0.8;

      ctx.fillStyle = "#FF4FD8";
      ctx.shadowColor = "rgba(255, 79, 216, 0.6)";
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(big1X, big1Y, bigR, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(big2X, big2Y, bigR, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Labels
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillText("m", arm1X, arm1Y - 14);
      ctx.fillText("m", arm2X, arm2Y - 14);
      ctx.fillText("M", big1X, big1Y - bigR - 8);
      ctx.fillText("M", big2X, big2Y - bigR - 8);

      // Twist angle indicator arc
      if (Math.abs(angle) > 0.002) {
        const arcR = 30;
        ctx.strokeStyle = "rgba(91, 233, 255, 0.4)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, arcR, 0, -angle, angle > 0);
        ctx.stroke();

        ctx.fillStyle = colors.fg2;
        ctx.font = "10px monospace";
        ctx.textAlign = "left";
        const deg = ((angle * 180) / Math.PI).toFixed(2);
        ctx.fillText(`θ = ${deg}°`, cx + arcR + 4, cy + 4);
      }

      // Dashed lines showing gravitational attraction
      ctx.strokeStyle = "rgba(91, 233, 255, 0.15)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(arm1X, arm1Y);
      ctx.lineTo(big1X, big1Y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(arm2X, arm2Y);
      ctx.lineTo(big2X, big2Y);
      ctx.stroke();
      ctx.setLineDash([]);

      const angleDeg = (angle * 180) / Math.PI;
      setReadoutState({
        angleDeg,
        G: G_real,
        MEarth: M_earth,
      });
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-2 flex items-center gap-3 px-2">
        <label className="text-sm text-[var(--color-fg-2)]">
          Large mass (M)
        </label>
        <input
          type="range"
          min={0.5}
          max={4}
          step={0.1}
          value={bigMass}
          onChange={(e) => setBigMass(parseFloat(e.target.value))}
          className="flex-1 accent-[#FF4FD8]"
        />
        <span className="w-16 text-right font-mono text-sm text-[var(--color-fg-1)]">
          {(bigMass * 79).toFixed(0)} kg
        </span>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 px-2 font-mono text-xs text-[var(--color-fg-1)]">
        <div>
          <span className="text-[var(--color-fg-2)]">twist </span>
          {readoutState.angleDeg.toFixed(2)}°
        </div>
        <div>
          <span className="text-[var(--color-fg-2)]">G </span>
          {readoutState.G.toExponential(3)}
        </div>
        <div>
          <span className="text-[var(--color-fg-2)]">M⊕ </span>
          {readoutState.MEarth.toExponential(3)} kg
        </div>
      </div>
    </div>
  );
}
