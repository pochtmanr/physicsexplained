"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.55;
const MAX_HEIGHT = 360;

/**
 * FIG.37c — a plane-wave packet travelling to the right with uniform E (up)
 * and B (into the page). Arrows at sample points along the packet show:
 *   • E (magenta, vertical)
 *   • B (cyan, into page ⊗)
 *   • S = (1/μ₀) E×B (amber, along propagation)
 *   • g = ε₀·E×B = S/c² (lilac, along propagation, scaled up for visibility)
 *
 * Key visual: S and g point the same way, because g = S/c². The purpose
 * is to make "the wave carries momentum in its direction of travel"
 * visible on the page.
 */
export function FieldMomentumScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 640, height: 360 });

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

      const midY = height / 2;

      // ─── Draw the traveling wave envelope (gaussian packet) ───
      const omega = 2.5;
      const k = 0.03;
      const speedPxPerSec = 70;
      const packetCentre = 120 + ((t * speedPxPerSec) % (width - 180));

      // Faint guide line
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.moveTo(20, midY);
      ctx.lineTo(width - 20, midY);
      ctx.stroke();
      ctx.setLineDash([]);

      // E-field envelope (sine × gaussian)
      ctx.strokeStyle = "rgba(255, 106, 222, 0.85)"; // magenta
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let x = 20; x < width - 20; x += 2) {
        const env = Math.exp(-Math.pow((x - packetCentre) / 110, 2));
        const phase = k * x - omega * t;
        const E = env * 45 * Math.sin(phase);
        if (x === 20) ctx.moveTo(x, midY - E);
        else ctx.lineTo(x, midY - E);
      }
      ctx.stroke();

      // Arrows at sample points: E (up/down), B (⊗/⊙), S, g
      const samplePositions = [0.15, 0.32, 0.5, 0.68, 0.85];
      for (const s of samplePositions) {
        const x = 20 + s * (width - 40);
        const env = Math.exp(-Math.pow((x - packetCentre) / 110, 2));
        const phase = k * x - omega * t;
        const sig = Math.sin(phase);
        const amp = env * sig;
        // Only show arrows when amplitude is meaningful
        if (Math.abs(amp) < 0.08) continue;

        const Elen = amp * 45;
        // E vertical (magenta)
        drawArrow(
          ctx,
          x,
          midY,
          x,
          midY - Elen,
          "rgba(255, 106, 222, 0.95)",
          1.8,
        );
        if (Math.abs(Elen) > 14) {
          ctx.fillStyle = "rgba(255, 106, 222, 0.9)";
          ctx.font = "10px monospace";
          ctx.textAlign = "left";
          ctx.fillText("E", x + 4, midY - Elen + (Elen > 0 ? -4 : 10));
        }

        // B: into-page when amp > 0 (⊗), out-of-page when amp < 0 (⊙)
        const bSign = amp > 0 ? 1 : -1;
        const bx = x + 14;
        const by = midY + (amp > 0 ? -14 : 14);
        drawBSymbol(ctx, bx, by, bSign, Math.min(1, Math.abs(amp) * 3));

        // S and g: both along +x (right) when E up and B into page
        // (E × B = ŷ × (−ẑ) = −x̂·(−1) = x̂ pointing right when amp > 0)
        const sLen = 28 * Math.abs(amp) * (amp > 0 ? 1 : 1); // magnitude only — S·ĉ = |E×B|/μ₀
        // arrow direction always along propagation (+x); length tracks |S|
        drawArrow(
          ctx,
          x,
          midY + 32,
          x + sLen,
          midY + 32,
          "rgba(255, 214, 107, 0.95)",
          1.8,
        );
        // g arrow directly below S (same direction), slightly smaller to
        // reinforce "g = S/c² — same direction, tiny magnitude"
        drawArrow(
          ctx,
          x,
          midY + 48,
          x + sLen * 0.7,
          midY + 48,
          "rgba(200, 160, 255, 0.95)",
          1.6,
        );
      }

      // ─── Legend ───
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(255, 106, 222, 0.95)";
      ctx.fillText("↕ E", 20, height - 44);
      ctx.fillStyle = "rgba(120, 220, 255, 0.95)";
      ctx.fillText("⊗ B (into page)", 60, height - 44);
      ctx.fillStyle = "rgba(255, 214, 107, 0.95)";
      ctx.fillText("→ S = (1/μ₀) E×B", 200, height - 44);
      ctx.fillStyle = "rgba(200, 160, 255, 0.95)";
      ctx.fillText("→ g = ε₀ E×B = S/c²", 370, height - 44);

      // HUD
      ctx.font = "12px monospace";
      ctx.fillStyle = colors.fg1;
      ctx.textAlign = "left";
      ctx.fillText("Plane-wave packet — energy and momentum travel together", 12, 20);
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.fillText("g and S point the same way; |g| = |S|/c² is tiny but real", 12, 36);

      // Propagation label
      ctx.textAlign = "right";
      ctx.fillText("→ ĉ (propagation)", width - 12, 20);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
    </div>
  );
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  width: number,
) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  const dx = x1 - x0;
  const dy = y1 - y0;
  const L = Math.hypot(dx, dy);
  if (L < 3) return;
  const ux = dx / L;
  const uy = dy / L;
  const head = 6;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - ux * head - uy * head * 0.5, y1 - uy * head + ux * head * 0.5);
  ctx.lineTo(x1 - ux * head + uy * head * 0.5, y1 - uy * head - ux * head * 0.5);
  ctx.closePath();
  ctx.fill();
}

function drawBSymbol(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  sign: number,
  alpha: number,
) {
  const a = Math.min(1, alpha).toFixed(2);
  ctx.strokeStyle = `rgba(120, 220, 255, ${a})`;
  ctx.fillStyle = `rgba(120, 220, 255, ${a})`;
  ctx.lineWidth = 1.2;
  const R = 6;
  ctx.beginPath();
  ctx.arc(x, y, R, 0, Math.PI * 2);
  ctx.stroke();
  if (sign > 0) {
    // ⊗ — into page
    ctx.beginPath();
    ctx.moveTo(x - R * 0.55, y - R * 0.55);
    ctx.lineTo(x + R * 0.55, y + R * 0.55);
    ctx.moveTo(x + R * 0.55, y - R * 0.55);
    ctx.lineTo(x - R * 0.55, y + R * 0.55);
    ctx.stroke();
  } else {
    // ⊙ — out of page
    ctx.beginPath();
    ctx.arc(x, y, R * 0.28, 0, Math.PI * 2);
    ctx.fill();
  }
}
