"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.6;
const MAX_HEIGHT = 300;

export interface EnergyDiagramSceneProps {
  length?: number;
  theta0?: number;
}

export function EnergyDiagramScene({
  length = 1,
  theta0 = 0.5,
}: EnergyDiagramSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef({ width: 480, height: 300 });
  const [size, setSize] = useState({ width: 480, height: 300 });
  const colors = useThemeColors();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          const h = Math.min(w * RATIO, MAX_HEIGHT);
          sizeRef.current = { width: w, height: h };
          setSize({ width: w, height: h });
        }
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Normalized: U(theta) = 1 - cos(theta), total E = 1 - cos(theta0)
  const E = 1 - Math.cos(theta0);
  const omega = Math.sqrt(9.80665 / length);

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (t) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const { width, height } = sizeRef.current;

      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      ctx.clearRect(0, 0, width, height);

      const padL = 50;
      const padR = 30;
      const padT = 30;
      const padB = 40;
      const plotW = width - padL - padR;
      const plotH = height - padT - padB;

      // Map theta to x, U to y
      const thetaMin = -Math.PI;
      const thetaMax = Math.PI;
      const uMax = 2.5;

      const toX = (theta: number) =>
        padL + ((theta - thetaMin) / (thetaMax - thetaMin)) * plotW;
      const toY = (u: number) => padT + plotH - (u / uMax) * plotH;

      // Draw axes
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padL, padT);
      ctx.lineTo(padL, padT + plotH);
      ctx.lineTo(padL + plotW, padT + plotH);
      ctx.stroke();

      // Axis labels
      ctx.fillStyle = colors.fg2;
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("θ", padL + plotW / 2, height - 8);
      ctx.save();
      ctx.translate(14, padT + plotH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText("U / mgL", 0, 0);
      ctx.restore();

      // Potential well U(theta) = 1 - cos(theta)
      ctx.strokeStyle = "#5BE9FF";
      ctx.lineWidth = 2;
      ctx.beginPath();
      const steps = 200;
      for (let i = 0; i <= steps; i++) {
        const theta = thetaMin + (thetaMax - thetaMin) * (i / steps);
        const u = 1 - Math.cos(theta);
        const px = toX(theta);
        const py = toY(u);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Total energy line (red dashed)
      ctx.strokeStyle = "#FF6B6B";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(padL, toY(E));
      ctx.lineTo(padL + plotW, toY(E));
      ctx.stroke();
      ctx.setLineDash([]);

      // Energy label
      ctx.fillStyle = "#FF6B6B";
      ctx.font = "11px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`E = ${E.toFixed(2)}`, padL + plotW - 60, toY(E) - 6);

      // Animated ball (small-angle approx)
      const ballTheta = theta0 * Math.cos(omega * t);
      const ballU = 1 - Math.cos(ballTheta);
      const bx = toX(ballTheta);
      const by = toY(ballU);

      // KE shading: fill between ball and energy line
      const energyY = toY(E);
      if (by > energyY) {
        ctx.fillStyle = "rgba(91, 233, 255, 0.15)";
        ctx.fillRect(bx - 8, energyY, 16, by - energyY);
      }

      // Draw ball with glow
      ctx.shadowColor = "rgba(91, 233, 255, 0.6)";
      ctx.shadowBlur = 12;
      ctx.fillStyle = "#5BE9FF";
      ctx.beginPath();
      ctx.arc(bx, by, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Labels
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("−π", toX(-Math.PI), padT + plotH + 16);
      ctx.fillText("0", toX(0), padT + plotH + 16);
      ctx.fillText("π", toX(Math.PI), padT + plotH + 16);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas ref={canvasRef} style={{ width: size.width, height: size.height }} className="block" />
    </div>
  );
}
