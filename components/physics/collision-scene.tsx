"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  pairKE,
  pairP,
  restitutionCollision,
} from "@/lib/physics/momentum";

const RATIO = 0.55;
const MAX_HEIGHT = 340;

export function CollisionScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [restitution, setRestitution] = useState(1);
  const [massRatio, setMassRatio] = useState(1); // m_B / m_A
  const [size, setSize] = useState({ width: 640, height: 340 });
  const startRef = useRef<number | null>(null);

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

  useEffect(() => {
    startRef.current = null;
  }, [restitution, massRatio]);

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

      if (startRef.current === null) startRef.current = t;
      const tLocal = t - startRef.current;

      ctx.clearRect(0, 0, width, height);

      const mA = 1;
      const mB = massRatio;
      const vA0 = 2; // m/s rightward
      const vB0 = 0;

      // Positions in metres
      const track = 6; // metres
      const startXA = 0.5;
      const startXB = track * 0.55;

      const { vA: vAf, vB: vBf } = restitutionCollision(
        mA,
        vA0,
        mB,
        vB0,
        restitution,
      );

      // Time to collision (their gap closes at vA0)
      const gap0 = startXB - startXA - 0.6;
      const tCol = gap0 / vA0;
      const cycleEnd = tCol + 2.5;
      if (tLocal > cycleEnd) startRef.current = t;

      let xA = 0;
      let xB = 0;
      if (tLocal < tCol) {
        xA = startXA + vA0 * tLocal;
        xB = startXB;
      } else {
        const dt = tLocal - tCol;
        xA = startXA + vA0 * tCol + vAf * dt;
        xB = startXB + vBf * dt;
      }

      const padX = 40;
      const trackY = height * 0.45;
      const mToPxX = (width - 2 * padX) / track;

      // Track
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padX, trackY + 30);
      ctx.lineTo(width - padX, trackY + 30);
      ctx.stroke();

      // Draw bodies as squares, size scales with cbrt(mass)
      const rA = 20 + Math.cbrt(mA) * 6;
      const rB = 20 + Math.cbrt(mB) * 6;
      const pxA = padX + xA * mToPxX;
      const pxB = padX + xB * mToPxX;

      ctx.fillStyle = "#E4C27A";
      ctx.fillRect(pxA - rA / 2, trackY + 30 - rA, rA, rA);
      ctx.fillStyle = "#6FB8C6";
      ctx.fillRect(pxB - rB / 2, trackY + 30 - rB, rB, rB);

      // Labels
      ctx.font = "12px monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = colors.fg1;
      ctx.fillText(`m_A = 1.0`, pxA, trackY + 52);
      ctx.fillText(`m_B = ${mB.toFixed(2)}`, pxB, trackY + 52);

      // Header: current momenta, KE, and conservation
      const pNow = pairP(
        mA,
        tLocal < tCol ? vA0 : vAf,
        mB,
        tLocal < tCol ? vB0 : vBf,
      );
      const keNow = pairKE(
        mA,
        tLocal < tCol ? vA0 : vAf,
        mB,
        tLocal < tCol ? vB0 : vBf,
      );
      const ke0 = pairKE(mA, vA0, mB, vB0);
      const keLostPct = Math.max(0, 1 - keNow / ke0) * 100;

      ctx.textAlign = "left";
      ctx.fillStyle = colors.fg1;
      ctx.font = "13px monospace";
      ctx.fillText(`p_total = ${pNow.toFixed(2)} kg·m/s    (constant)`, padX, 24);
      ctx.fillText(
        `KE_now  = ${keNow.toFixed(2)} J   (−${keLostPct.toFixed(0)}% to heat/sound)`,
        padX,
        42,
      );

      // Velocity arrows (post-collision phase)
      const arrowY = trackY + 30 - Math.max(rA, rB) - 14;
      const drawArrow = (
        x: number,
        v: number,
        color: string,
      ) => {
        if (Math.abs(v) < 1e-3) return;
        const len = v * 20;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, arrowY);
        ctx.lineTo(x + len, arrowY);
        ctx.stroke();
        ctx.beginPath();
        const dir = Math.sign(len);
        ctx.moveTo(x + len, arrowY);
        ctx.lineTo(x + len - 6 * dir, arrowY - 4);
        ctx.lineTo(x + len - 6 * dir, arrowY + 4);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
      };
      drawArrow(pxA, tLocal < tCol ? vA0 : vAf, "#E4C27A");
      drawArrow(pxB, tLocal < tCol ? vB0 : vBf, "#6FB8C6");
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-2 flex flex-col gap-3 px-2">
        <div className="flex items-center gap-3">
          <label className="w-24 text-sm text-[var(--color-fg-3)]">
            restitution e
          </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={restitution}
            onChange={(e) => setRestitution(parseFloat(e.target.value))}
            className="flex-1 accent-[#6FB8C6]"
          />
          <span className="w-12 text-right text-sm font-mono text-[var(--color-fg-1)]">
            {restitution.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <label className="w-24 text-sm text-[var(--color-fg-3)]">
            mass ratio m_B / m_A
          </label>
          <input
            type="range"
            min={0.25}
            max={4}
            step={0.05}
            value={massRatio}
            onChange={(e) => setMassRatio(parseFloat(e.target.value))}
            className="flex-1 accent-[#6FB8C6]"
          />
          <span className="w-12 text-right text-sm font-mono text-[var(--color-fg-1)]">
            {massRatio.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
