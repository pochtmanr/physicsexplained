"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.85;
const MAX_HEIGHT = 420;

type SystemType = "pendulum" | "spring" | "lc";

export function UniversalOscillatorScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const colors = useThemeColors();
  const [system, setSystem] = useState<SystemType>("pendulum");
  const [size, setSize] = useState({ width: 480, height: 420 });

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

  const { width, height } = size;

  const traceRef = useRef<Array<{ t: number; x: number }>>([]);

  const omega = 2;
  const A = 1;

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

      const x = A * Math.cos(omega * t);

      // Update trace
      traceRef.current.push({ t, x });
      const traceWindow = 6;
      traceRef.current = traceRef.current.filter(
        (p) => p.t > t - traceWindow,
      );

      ctx.clearRect(0, 0, width, height);

      const topH = height * 0.55;

      // --- Draw physical system (top half) ---
      if (system === "pendulum") {
        drawPendulum(ctx, x, topH);
      } else if (system === "spring") {
        drawSpring(ctx, x, topH);
      } else {
        drawLCCircuit(ctx, x, topH);
      }

      // --- Shared sinusoid trace (bottom half) ---
      const traceTop = topH + 10;
      const traceBottom = height - 10;
      const traceH = traceBottom - traceTop;
      const traceMid = traceTop + traceH / 2;
      const traceLeft = 30;
      const traceRight = width - 10;
      const traceW = traceRight - traceLeft;

      // Axis line
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(traceLeft, traceMid);
      ctx.lineTo(traceRight, traceMid);
      ctx.stroke();

      // Trace
      ctx.strokeStyle = "#5BE9FF";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      let started = false;
      for (const p of traceRef.current) {
        const px =
          traceLeft + (traceW * (p.t - (t - traceWindow))) / traceWindow;
        const py = traceMid - (p.x / A) * (traceH / 2) * 0.85;
        if (!started) {
          ctx.moveTo(px, py);
          started = true;
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();

      // Label
      ctx.fillStyle = colors.fg2;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillText("x(t) = A cos(\u03C9t)", traceLeft, traceTop - 2);
    },
  });

  function drawPendulum(
    ctx: CanvasRenderingContext2D,
    x: number,
    regionH: number,
  ) {
    const pivotX = width / 2;
    const pivotY = 30;
    const rodLen = regionH - 70;
    const angle = x * 0.4; // scale to visible angle
    const bobX = pivotX + rodLen * Math.sin(angle);
    const bobY = pivotY + rodLen * Math.cos(angle);

    // Rod
    ctx.strokeStyle = colors.fg0;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(bobX, bobY);
    ctx.stroke();

    // Pivot
    ctx.fillStyle = colors.fg2;
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, 3, 0, Math.PI * 2);
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

  function drawSpring(
    ctx: CanvasRenderingContext2D,
    x: number,
    regionH: number,
  ) {
    const wallX = 40;
    const midY = regionH / 2;
    const restLen = width * 0.45;
    const blockW = 30;
    const blockH = 30;
    const displacement = x * 60; // scale
    const blockX = wallX + restLen + displacement;

    // Wall
    ctx.strokeStyle = colors.fg2;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(wallX, midY - 40);
    ctx.lineTo(wallX, midY + 40);
    ctx.stroke();
    // Hatch marks
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(wallX, midY + i * 12);
      ctx.lineTo(wallX - 8, midY + i * 12 + 8);
      ctx.stroke();
    }

    // Zigzag spring
    const springStart = wallX;
    const springEnd = blockX - blockW / 2;
    const springLen = springEnd - springStart;
    const nCoils = 12;
    const coilW = springLen / nCoils;
    const coilAmp = 10;

    ctx.strokeStyle = colors.fg1;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(springStart, midY);
    for (let i = 0; i < nCoils; i++) {
      const sx = springStart + coilW * i;
      const dir = i % 2 === 0 ? -1 : 1;
      ctx.lineTo(sx + coilW / 2, midY + dir * coilAmp);
      ctx.lineTo(sx + coilW, midY);
    }
    ctx.stroke();

    // Block
    ctx.fillStyle = colors.fg3;
    ctx.fillRect(
      blockX - blockW / 2,
      midY - blockH / 2,
      blockW,
      blockH,
    );

    // Mass glow dot
    ctx.shadowColor = "rgba(91, 233, 255, 0.6)";
    ctx.shadowBlur = 12;
    ctx.fillStyle = "#5BE9FF";
    ctx.beginPath();
    ctx.arc(blockX, midY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  function drawLCCircuit(
    ctx: CanvasRenderingContext2D,
    x: number,
    regionH: number,
  ) {
    const cx = width / 2;
    const cy = regionH / 2;
    const boxW = 200;
    const boxH = 100;
    const left = cx - boxW / 2;
    const right = cx + boxW / 2;
    const top = cy - boxH / 2;
    const bottom = cy + boxH / 2;

    ctx.strokeStyle = colors.fg1;
    ctx.lineWidth = 1.5;

    // Top wire
    ctx.beginPath();
    ctx.moveTo(left, top);
    ctx.lineTo(right, top);
    ctx.stroke();

    // Bottom wire
    ctx.beginPath();
    ctx.moveTo(left, bottom);
    ctx.lineTo(right, bottom);
    ctx.stroke();

    // Left wire (capacitor side)
    ctx.beginPath();
    ctx.moveTo(left, top);
    ctx.lineTo(left, cy - 15);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(left, cy + 15);
    ctx.lineTo(left, bottom);
    ctx.stroke();

    // Capacitor plates
    const plateW = 30;
    const gap = 30;
    const charge = x; // -1 to 1

    // Top plate
    ctx.strokeStyle = colors.fg0;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(left - plateW / 2, cy - gap / 2);
    ctx.lineTo(left + plateW / 2, cy - gap / 2);
    ctx.stroke();

    // Bottom plate
    ctx.beginPath();
    ctx.moveTo(left - plateW / 2, cy + gap / 2);
    ctx.lineTo(left + plateW / 2, cy + gap / 2);
    ctx.stroke();

    // Charge indicator (colored fill between plates)
    const chargeAlpha = Math.abs(charge) * 0.6;
    const chargeColor =
      charge > 0
        ? `rgba(91, 233, 255, ${chargeAlpha})`
        : `rgba(255, 107, 107, ${chargeAlpha})`;
    ctx.fillStyle = chargeColor;
    ctx.fillRect(
      left - plateW / 2 + 2,
      cy - gap / 2 + 2,
      plateW - 4,
      gap - 4,
    );

    // Right wire (inductor side)
    ctx.strokeStyle = colors.fg1;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(right, top);
    ctx.lineTo(right, cy - 20);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(right, cy + 20);
    ctx.lineTo(right, bottom);
    ctx.stroke();

    // Inductor coil (arcs)
    const nLoops = 4;
    const loopH = 40 / nLoops;
    ctx.strokeStyle = colors.fg0;
    ctx.lineWidth = 1.5;
    for (let i = 0; i < nLoops; i++) {
      const loopY = cy - 20 + loopH * i;
      ctx.beginPath();
      ctx.arc(right, loopY + loopH / 2, loopH / 2, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
    }

    // Labels
    ctx.fillStyle = colors.fg2;
    ctx.font = "12px monospace";
    ctx.textAlign = "center";
    ctx.fillText("C", left, bottom + 18);
    ctx.fillText("L", right + 16, cy + 4);
  }

  const buttons: { label: string; value: SystemType }[] = [
    { label: "Pendulum", value: "pendulum" },
    { label: "Spring", value: "spring" },
    { label: "LC Circuit", value: "lc" },
  ];

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height }}
        className="block"
      />
      <div className="mt-2 flex justify-center gap-2">
        {buttons.map((btn) => (
          <button
            key={btn.value}
            onClick={() => {
              setSystem(btn.value);
              traceRef.current = [];
            }}
            className={`rounded px-3 py-1 text-sm transition-colors ${
              system === btn.value
                ? "border border-[var(--color-cyan)] text-[var(--color-cyan)]"
                : "border border-[var(--color-fg-4)] text-[var(--color-fg-3)]"
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}
