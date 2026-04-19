"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

interface Fragment {
  angle: number;
  dist: number;
  speed: number;
  size: number;
  phase: number;
}

/**
 * Visualizes the Roche limit: a moon approaching a planet gets tidally
 * stretched, and past the Roche limit it fragments into a ring.
 * Fully responsive — fills container width.
 */
export function RocheLimitScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const colors = useThemeColors();

  const [moonDist, setMoonDist] = useState(0.7);
  const [size, setSize] = useState({ width: 600, height: 400 });
  const fragmentsRef = useRef<Fragment[]>([]);
  const wasDisruptedRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          setSize({ width: w, height: Math.min(w * 0.6, 420) });
        }
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  const { width, height } = size;

  const generateFragments = useCallback((count: number) => {
    const frags: Fragment[] = [];
    for (let i = 0; i < count; i++) {
      frags.push({
        angle: Math.random() * Math.PI * 2,
        dist: 0.9 + Math.random() * 0.2,
        speed: 0.2 + Math.random() * 0.5,
        size: 1.5 + Math.random() * 2.5,
        phase: Math.random() * Math.PI * 2,
      });
    }
    return frags;
  }, []);

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
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const planetX = width * 0.25;
      const planetY = height / 2;
      const planetR = Math.min(width, height) * 0.16;
      const moonR = planetR * 0.18;

      const rocheRatio = 2.44;
      const rocheR = planetR * rocheRatio;

      const minMoonDist = planetR + moonR + 5;
      const maxMoonDist = width * 0.6;
      const actualDist =
        minMoonDist + moonDist * (maxMoonDist - minMoonDist);
      const moonX = planetX + actualDist;
      const moonY = planetY;

      const isDisrupted = actualDist < rocheR;

      if (isDisrupted && !wasDisruptedRef.current) {
        fragmentsRef.current = generateFragments(40);
      }
      wasDisruptedRef.current = isDisrupted;

      // Roche limit circle (dashed)
      ctx.strokeStyle = "#FF6B6B";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(planetX, planetY, rocheR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "#FF6B6B";
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillText("Roche limit", planetX, planetY - rocheR - 8);

      // Planet ring (behind)
      ctx.strokeStyle = "rgba(111, 184, 198, 0.2)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(
        planetX,
        planetY,
        planetR * 1.6,
        planetR * 0.15,
        0,
        Math.PI,
        Math.PI * 2,
      );
      ctx.stroke();

      // Planet body
      const grad = ctx.createRadialGradient(
        planetX - planetR * 0.2,
        planetY - planetR * 0.2,
        planetR * 0.1,
        planetX,
        planetY,
        planetR,
      );
      grad.addColorStop(0, "rgba(111, 184, 198, 0.25)");
      grad.addColorStop(0.7, "rgba(111, 184, 198, 0.1)");
      grad.addColorStop(1, "rgba(111, 184, 198, 0.03)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(planetX, planetY, planetR, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "rgba(111, 184, 198, 0.5)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(planetX, planetY, planetR, 0, Math.PI * 2);
      ctx.stroke();

      // Planet ring (front)
      ctx.strokeStyle = "rgba(111, 184, 198, 0.2)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(
        planetX,
        planetY,
        planetR * 1.6,
        planetR * 0.15,
        0,
        0,
        Math.PI,
      );
      ctx.stroke();

      ctx.fillStyle = colors.fg2;
      ctx.font = "12px monospace";
      ctx.textAlign = "center";
      ctx.fillText("planet", planetX, planetY + planetR + 22);

      if (!isDisrupted) {
        const stretchFactor =
          1 + Math.pow(rocheR / actualDist, 3) * 1.5;
        const squeezeFactor = 1 / Math.sqrt(stretchFactor);

        ctx.save();
        ctx.translate(moonX, moonY);
        ctx.scale(stretchFactor, squeezeFactor);

        ctx.shadowColor = "rgba(159, 176, 200, 0.5)";
        ctx.shadowBlur = 10;
        ctx.fillStyle = colors.fg1;
        ctx.beginPath();
        ctx.arc(0, 0, moonR, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.restore();

        ctx.fillStyle = colors.fg2;
        ctx.font = "12px monospace";
        ctx.textAlign = "center";
        ctx.fillText("moon", moonX, moonY + moonR * squeezeFactor + 18);
      } else {
        const spread = Math.min(
          1,
          (rocheR - actualDist) / (rocheR * 0.4),
        );

        for (const frag of fragmentsRef.current) {
          const fragAngle = frag.angle + t * frag.speed;
          const baseR = actualDist;
          const spreadR =
            baseR + (frag.dist - 1) * planetR * spread * 2;
          const fx = planetX + spreadR * Math.cos(fragAngle);
          const fy =
            planetY + spreadR * Math.sin(fragAngle) * 0.3;

          ctx.fillStyle = colors.fg1;
          ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 2 + frag.phase);
          ctx.beginPath();
          ctx.arc(
            fx,
            fy,
            frag.size * (0.5 + 0.5 * spread),
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }
        ctx.globalAlpha = 1;

        ctx.fillStyle = "#FF6B6B";
        ctx.font = "12px monospace";
        ctx.textAlign = "center";
        ctx.fillText("fragments", moonX, moonY + moonR + 18);
      }

      // Status readout
      const distRatio = (actualDist / planetR).toFixed(2);
      const rocheRatioDisplay = rocheRatio.toFixed(2);

      ctx.fillStyle = isDisrupted ? "#FF6B6B" : "#6FB8C6";
      ctx.font = "bold 13px monospace";
      ctx.textAlign = "right";
      ctx.fillText(isDisrupted ? "DISRUPTED" : "INTACT", width - 12, 24);

      ctx.fillStyle = colors.fg2;
      ctx.font = "12px monospace";
      ctx.textAlign = "right";
      ctx.fillText(`d/R = ${distRatio}`, width - 12, 42);
      ctx.fillText(`Roche = ${rocheRatioDisplay} R`, width - 12, 58);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas ref={canvasRef} style={{ width, height }} className="block" />
      <div className="mt-2 flex items-center gap-3 px-2">
        <label className="text-sm text-[var(--color-fg-3)]">
          Moon distance
        </label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.005}
          value={moonDist}
          onChange={(e) => setMoonDist(parseFloat(e.target.value))}
          className="flex-1 accent-[#6FB8C6]"
        />
        <span className="w-10 text-right font-mono text-sm text-[var(--color-fg-1)]">
          {moonDist.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
