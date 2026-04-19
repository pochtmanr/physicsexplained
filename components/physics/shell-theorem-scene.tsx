"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

export function ShellTheoremScene() {
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
          setSize({ width: w, height: Math.min(w * 0.65, 400) });
        }
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  const { width, height } = size;

  const shellRadius = Math.min(width, height) * 0.28;
  const cx = width / 2;
  const cy = height / 2;

  // Particle position as fraction of canvas width from center
  const [particleX, setParticleX] = useState(0.35);
  const draggingRef = useRef(false);
  const [readout, setReadout] = useState({ r: 0, F: 0, inside: false });

  const getParticlePos = useCallback(
    (frac: number) => ({
      x: cx + frac * width,
      y: cy,
    }),
    [cx, width, cy],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const pos = getParticlePos(particleX);
      if (Math.hypot(mx - pos.x, my - pos.y) < 20) {
        draggingRef.current = true;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      }
    },
    [getParticlePos, particleX],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingRef.current) return;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mx = e.clientX - rect.left;
      const frac = (mx - cx) / width;
      setParticleX(Math.max(-0.45, Math.min(0.45, frac)));
    },
    [cx, width],
  );

  const handlePointerUp = useCallback(() => {
    draggingRef.current = false;
  }, []);

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (_t) => {
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

      const pPos = getParticlePos(particleX);
      const distFromCenter = Math.abs(particleX * width);
      const inside = distFromCenter < shellRadius;

      // Draw shell as a ring of mass elements
      const numDots = 36;
      ctx.strokeStyle = "rgba(91, 233, 255, 0.25)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, shellRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Mass elements on the shell
      for (let i = 0; i < numDots; i++) {
        const angle = (i / numDots) * Math.PI * 2;
        const dotX = cx + Math.cos(angle) * shellRadius;
        const dotY = cy + Math.sin(angle) * shellRadius;
        ctx.fillStyle = "rgba(91, 233, 255, 0.6)";
        ctx.beginPath();
        ctx.arc(dotX, dotY, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Center mark
      ctx.fillStyle = colors.fg3;
      ctx.beginPath();
      ctx.arc(cx, cy, 2, 0, Math.PI * 2);
      ctx.fill();

      // Particle
      ctx.shadowColor = inside
        ? "rgba(255, 79, 216, 0.6)"
        : "rgba(91, 233, 255, 0.8)";
      ctx.shadowBlur = 12;
      ctx.fillStyle = inside ? "#FF4FD8" : "#5BE9FF";
      ctx.beginPath();
      ctx.arc(pPos.x, pPos.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Force arrow
      if (!inside && distFromCenter > 5) {
        const rNorm = distFromCenter / shellRadius;
        const forceMag = 1 / (rNorm * rNorm);
        const maxLen = 80;
        const arrowLen = Math.min(maxLen, forceMag * 30);
        const dirX = pPos.x > cx ? -1 : 1;

        const tipX = pPos.x + dirX * arrowLen;
        const tipY = pPos.y;

        ctx.strokeStyle = "#5BE9FF";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(pPos.x, pPos.y);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();

        // Arrowhead
        const headSize = 8;
        const angle = dirX > 0 ? 0 : Math.PI;
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(
          tipX - headSize * Math.cos(angle - Math.PI / 6),
          tipY - headSize * Math.sin(angle - Math.PI / 6),
        );
        ctx.lineTo(
          tipX - headSize * Math.cos(angle + Math.PI / 6),
          tipY - headSize * Math.sin(angle + Math.PI / 6),
        );
        ctx.closePath();
        ctx.fillStyle = "#5BE9FF";
        ctx.fill();

        setReadout({
          r: rNorm,
          F: forceMag,
          inside: false,
        });
      } else if (inside) {
        // No force arrow inside — just show "F = 0" label near particle
        ctx.fillStyle = "#FF4FD8";
        ctx.font = "bold 14px monospace";
        ctx.textAlign = "center";
        ctx.fillText("F = 0", pPos.x, pPos.y - 18);

        setReadout({
          r: distFromCenter / shellRadius,
          F: 0,
          inside: true,
        });
      }

      // Labels
      ctx.fillStyle = colors.fg2;
      ctx.font = "12px monospace";
      ctx.textAlign = "center";
      ctx.fillText("shell", cx, cy - shellRadius - 10);

      // Drag hint
      ctx.fillStyle = colors.fg3;
      ctx.font = "11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("drag the particle", pPos.x, pPos.y + 24);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, cursor: "grab" }}
        className="block"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
      <div className="pointer-events-none mt-1 flex justify-end px-2">
        <div className="rounded-sm border border-[var(--color-fg-4)] bg-[var(--color-bg-0)]/70 px-2 py-1 font-mono text-xs text-[var(--color-fg-1)] backdrop-blur-sm">
          r/R = {readout.r.toFixed(2)} ·{" "}
          {readout.inside ? (
            <span className="text-[#FF4FD8]">F = 0 (inside)</span>
          ) : (
            <span>F ~ 1/r² = {readout.F.toFixed(2)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
