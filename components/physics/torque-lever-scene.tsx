"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.55;
const MAX_HEIGHT = 340;

/**
 * Interactive lever-and-torque scene. A massless horizontal rod pivots at
 * the centre; weights hang from adjustable positions on each side. The
 * scene shows the net torque and the rod's resulting angular motion when
 * released.
 */
export function TorqueLeverScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [leftArm, setLeftArm] = useState(2); // metres
  const [rightArm, setRightArm] = useState(1); // metres
  const [leftMass, setLeftMass] = useState(1); // kg
  const [rightMass, setRightMass] = useState(2); // kg
  const [size, setSize] = useState({ width: 640, height: 340 });
  const thetaRef = useRef(0);
  const omegaRef = useRef(0);
  const lastRef = useRef<number | null>(null);

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

  // Reset rod when user changes knobs
  useEffect(() => {
    thetaRef.current = 0;
    omegaRef.current = 0;
    lastRef.current = null;
  }, [leftArm, rightArm, leftMass, rightMass]);

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

      if (lastRef.current === null) lastRef.current = t;
      const dt = t - lastRef.current;
      lastRef.current = t;

      // Moment of inertia about pivot: treat masses as point at ends of massless arms
      const I = leftMass * leftArm ** 2 + rightMass * rightArm ** 2;
      // Torque about pivot (positive = counter-clockwise): right-side mass tries
      // to rotate clockwise (negative), left-side mass tries to rotate ccw (positive).
      const g = 9.80665;
      const cosT = Math.cos(thetaRef.current);
      const tau = g * cosT * (leftMass * leftArm - rightMass * rightArm);
      const alpha = I > 1e-6 ? tau / I : 0;

      // Integrate with mild damping so the lever settles
      const damping = 1.2;
      omegaRef.current += (alpha - damping * omegaRef.current) * dt;
      thetaRef.current += omegaRef.current * dt;

      // Clamp to avoid flipping past vertical
      const maxTheta = (Math.PI / 180) * 55;
      if (thetaRef.current > maxTheta) {
        thetaRef.current = maxTheta;
        omegaRef.current = 0;
      }
      if (thetaRef.current < -maxTheta) {
        thetaRef.current = -maxTheta;
        omegaRef.current = 0;
      }

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height * 0.55;
      const pxPerMetre = Math.min(width, height) * 0.12;

      // Pivot triangle
      ctx.fillStyle = colors.fg2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx - 20, cy + 40);
      ctx.lineTo(cx + 20, cy + 40);
      ctx.closePath();
      ctx.fill();

      // Rod
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-thetaRef.current);
      const armLeftPx = -leftArm * pxPerMetre;
      const armRightPx = rightArm * pxPerMetre;
      ctx.strokeStyle = colors.fg0;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(armLeftPx, 0);
      ctx.lineTo(armRightPx, 0);
      ctx.stroke();

      // Left mass
      const rL = 10 + Math.cbrt(leftMass) * 4;
      ctx.fillStyle = "#E4C27A";
      ctx.beginPath();
      ctx.arc(armLeftPx, rL, rL, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = colors.fg0;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Right mass
      const rR = 10 + Math.cbrt(rightMass) * 4;
      ctx.fillStyle = "#5BE9FF";
      ctx.beginPath();
      ctx.arc(armRightPx, rR, rR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Gravity arrows on each
      ctx.strokeStyle = "#FF6B6B";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(armLeftPx, rL + rL * 0.8);
      ctx.lineTo(armLeftPx, rL + rL * 0.8 + leftMass * 10);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(armRightPx, rR + rR * 0.8);
      ctx.lineTo(armRightPx, rR + rR * 0.8 + rightMass * 10);
      ctx.stroke();

      ctx.restore();

      // Readouts
      ctx.font = "13px monospace";
      ctx.fillStyle = colors.fg1;
      ctx.textAlign = "left";
      ctx.fillText(
        `τ_left  = m·g·r = ${(leftMass * g * leftArm).toFixed(2)} N·m  (ccw)`,
        20,
        22,
      );
      ctx.fillText(
        `τ_right = m·g·r = ${(rightMass * g * rightArm).toFixed(2)} N·m  (cw)`,
        20,
        40,
      );
      ctx.textAlign = "right";
      const netTau = (leftMass * leftArm - rightMass * rightArm) * g;
      ctx.fillStyle = Math.abs(netTau) < 0.01 ? "#5BE9FF" : "#FF6B6B";
      ctx.fillText(
        `net τ = ${netTau.toFixed(2)} N·m  ${Math.abs(netTau) < 0.01 ? "(balanced)" : ""}`,
        width - 20,
        22,
      );
      ctx.fillStyle = colors.fg2;
      ctx.fillText(`I = ${I.toFixed(2)} kg·m²`, width - 20, 40);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-2 grid grid-cols-1 gap-2 px-2 md:grid-cols-2">
        <SliderRow
          label="left arm (m)"
          value={leftArm}
          min={0.3}
          max={3}
          step={0.05}
          onChange={setLeftArm}
        />
        <SliderRow
          label="right arm (m)"
          value={rightArm}
          min={0.3}
          max={3}
          step={0.05}
          onChange={setRightArm}
        />
        <SliderRow
          label="left mass (kg)"
          value={leftMass}
          min={0.5}
          max={5}
          step={0.1}
          onChange={setLeftMass}
        />
        <SliderRow
          label="right mass (kg)"
          value={rightMass}
          min={0.5}
          max={5}
          step={0.1}
          onChange={setRightMass}
        />
      </div>
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <label className="w-32 text-sm text-[var(--color-fg-3)]">{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 accent-[#5BE9FF]"
      />
      <span className="w-12 text-right text-sm font-mono text-[var(--color-fg-1)]">
        {value.toFixed(2)}
      </span>
    </div>
  );
}
