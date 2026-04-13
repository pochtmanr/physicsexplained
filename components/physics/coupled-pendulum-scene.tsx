"use client";

import { useRef, useState } from "react";
import {
  coupledBeats,
  coupledMode1,
  coupledMode2,
} from "@/lib/physics/coupled-oscillator";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

type CoupledMode = "beats" | "mode1" | "mode2";

export interface CoupledPendulumSceneProps {
  width?: number;
  height?: number;
}

export function CoupledPendulumScene({
  width = 480,
  height = 360,
}: CoupledPendulumSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const colors = useThemeColors();
  const [mode, setMode] = useState<CoupledMode>("beats");

  const omega0 = 2.5;
  const omegaC = 1.2;
  const Amp = 0.4;
  const params = { omega0, omegaC };

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (t) => {
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

      let result: { theta1: number; theta2: number };
      if (mode === "mode1") {
        result = coupledMode1(t, Amp, params);
      } else if (mode === "mode2") {
        result = coupledMode2(t, Amp, params);
      } else {
        result = coupledBeats(t, Amp, params);
      }

      const { theta1, theta2 } = result;

      ctx.clearRect(0, 0, width, height);

      // Pendulum layout
      const spacing = 160;
      const pivotY = 40;
      const rodLen = 180;
      const cx = width / 2;
      const piv1X = cx - spacing / 2;
      const piv2X = cx + spacing / 2;

      // Ceiling bar
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(piv1X - 30, pivotY);
      ctx.lineTo(piv2X + 30, pivotY);
      ctx.stroke();

      // Compute bob positions
      const bob1X = piv1X + rodLen * Math.sin(theta1);
      const bob1Y = pivotY + rodLen * Math.cos(theta1);
      const bob2X = piv2X + rodLen * Math.sin(theta2);
      const bob2Y = pivotY + rodLen * Math.cos(theta2);

      // Spring connection at rod midpoint
      const springFrac = 0.5;
      const sp1X = piv1X + rodLen * springFrac * Math.sin(theta1);
      const sp1Y = pivotY + rodLen * springFrac * Math.cos(theta1);
      const sp2X = piv2X + rodLen * springFrac * Math.sin(theta2);
      const sp2Y = pivotY + rodLen * springFrac * Math.cos(theta2);

      // Draw spring (zigzag)
      const nCoils = 10;
      const dx = (sp2X - sp1X) / nCoils;
      const dy = (sp2Y - sp1Y) / nCoils;
      // Perpendicular direction
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const perpX = (-dy / len) * 6;
      const perpY = (dx / len) * 6;

      ctx.strokeStyle = "#FF6B6B";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sp1X, sp1Y);
      for (let i = 1; i < nCoils; i++) {
        const bx = sp1X + dx * i;
        const by = sp1Y + dy * i;
        const dir = i % 2 === 0 ? 1 : -1;
        ctx.lineTo(bx + perpX * dir, by + perpY * dir);
      }
      ctx.lineTo(sp2X, sp2Y);
      ctx.stroke();

      // Draw both pendulums
      for (const [pivX, bobX, bobY] of [
        [piv1X, bob1X, bob1Y],
        [piv2X, bob2X, bob2Y],
      ] as const) {
        // Rod
        ctx.strokeStyle = colors.fg0;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(pivX, pivotY);
        ctx.lineTo(bobX, bobY);
        ctx.stroke();

        // Pivot dot
        ctx.fillStyle = colors.fg2;
        ctx.beginPath();
        ctx.arc(pivX, pivotY, 3, 0, Math.PI * 2);
        ctx.fill();

        // Bob with glow
        ctx.shadowColor = "rgba(91, 233, 255, 0.6)";
        ctx.shadowBlur = 16;
        ctx.fillStyle = "#5BE9FF";
        ctx.beginPath();
        ctx.arc(bobX, bobY, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    },
  });

  const buttons: { label: string; value: CoupledMode }[] = [
    { label: "Mode 1", value: "mode1" },
    { label: "Mode 2", value: "mode2" },
    { label: "Beats", value: "beats" },
  ];

  return (
    <div ref={containerRef} style={{ width }} className="mx-auto pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height }}
        className="block"
      />
      <div className="mt-2 flex justify-center gap-2">
        {buttons.map((btn) => (
          <button
            key={btn.value}
            onClick={() => setMode(btn.value)}
            className={`rounded px-3 py-1 text-sm transition-colors ${
              mode === btn.value
                ? "border border-[var(--color-cyan)] text-[var(--color-cyan)]"
                : "border border-[var(--color-fg-3)] text-[var(--color-fg-2)]"
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}
