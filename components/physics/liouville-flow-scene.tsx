"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.7;
const MAX_HEIGHT = 420;

type Mode = "sho" | "pendulum" | "shear";

/**
 * Liouville flow: a coloured blob of N initial conditions in phase space
 * evolves under a Hamiltonian flow. The blob's area stays constant even as
 * its shape is stretched, twisted, or wrapped around the origin.
 *
 * - "sho"       H = p^2/2 + q^2/2        (circular flow)
 * - "pendulum"  H = p^2/2 + (1 - cos q)  (libration + separatrix)
 * - "shear"     dq/dt = p, dp/dt = 0     (pure stretch — area still preserved)
 */
export function LiouvilleFlowScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 640, height: 420 });
  const [mode, setMode] = useState<Mode>("pendulum");

  // Each particle: [q, p, originalIndex]
  const particlesRef = useRef<Array<[number, number, number]>>([]);
  const lastRef = useRef<number | null>(null);
  const tRef = useRef(0);
  const modeRef = useRef<Mode>(mode);
  const resetToken = useRef(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const w = e.contentRect.width;
        if (w > 0) setSize({ width: w, height: Math.min(w * RATIO, MAX_HEIGHT) });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const seedBlob = () => {
    // A small disc of points around (q0, p0). Fill-like packing.
    const q0 = 1.4;
    const p0 = 0.3;
    const r = 0.35;
    const out: Array<[number, number, number]> = [];
    let idx = 0;
    // Concentric rings for a dense-looking disc
    const rings = 14;
    for (let ring = 0; ring < rings; ring++) {
      const rr = (r * (ring + 1)) / rings;
      const n = Math.max(1, Math.round(ring * 6 + 1));
      for (let i = 0; i < n; i++) {
        const a = (2 * Math.PI * i) / n;
        out.push([q0 + rr * Math.cos(a), p0 + rr * Math.sin(a), idx++]);
      }
    }
    return out;
  };

  const reset = () => {
    particlesRef.current = seedBlob();
    tRef.current = 0;
    resetToken.current++;
  };

  useEffect(() => {
    modeRef.current = mode;
    reset();
  }, [mode]);

  useEffect(() => {
    reset();
  }, []);

  // Hamiltonian vector field  (q̇, ṗ) = (∂H/∂p, −∂H/∂q)
  const step = (q: number, p: number, dt: number): [number, number] => {
    // Symplectic leapfrog for SHO / pendulum; Euler is fine for shear.
    const m = modeRef.current;
    if (m === "shear") {
      return [q + p * dt, p];
    }
    // force(q) = −∂H/∂q
    const force = (qq: number) =>
      m === "sho" ? -qq : -Math.sin(qq);

    // Kick-Drift-Kick (velocity Verlet)
    let pn = p + 0.5 * dt * force(q);
    const qn = q + dt * pn;
    pn = pn + 0.5 * dt * force(qn);
    return [qn, pn];
  };

  useAnimationFrame({
    elementRef: canvasRef,
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

      const rawDt = lastRef.current === null ? 0 : Math.min(t - lastRef.current, 0.05);
      lastRef.current = t;
      tRef.current += rawDt;

      // Auto-reset every ~22 s so the viewer always catches the stretch
      if (tRef.current > 22) {
        reset();
      }

      // Substep for accuracy
      const sub = 4;
      const dt = rawDt / sub;
      const arr = particlesRef.current;
      for (let s = 0; s < sub; s++) {
        for (let i = 0; i < arr.length; i++) {
          const [q, p, idx] = arr[i]!;
          const [qn, pn] = step(q, p, dt);
          arr[i] = [qn, pn, idx];
        }
      }

      // --- draw ---
      ctx.clearRect(0, 0, width, height);

      const ox = width / 2;
      const oy = height / 2;
      // world bounds
      const xRange = modeRef.current === "pendulum" ? Math.PI + 0.4 : 2.6;
      const yRange = modeRef.current === "pendulum" ? 2.8 : 2.6;
      const sx = (width * 0.46) / xRange;
      const sy = (height * 0.42) / yRange;

      // axes
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ox - width * 0.46, oy);
      ctx.lineTo(ox + width * 0.46, oy);
      ctx.moveTo(ox, oy - height * 0.42);
      ctx.lineTo(ox, oy + height * 0.42);
      ctx.stroke();

      // axis labels
      ctx.font = "11px monospace";
      ctx.fillStyle = colors.fg2;
      ctx.textAlign = "left";
      ctx.fillText("q  (position)", ox + width * 0.42, oy - 6);
      ctx.textAlign = "left";
      ctx.fillText("p  (momentum)", ox + 6, oy - height * 0.4);

      // Background orbit scaffold — faint level sets of H
      ctx.strokeStyle = colors.fg3;
      ctx.globalAlpha = 0.25;
      ctx.lineWidth = 1;
      if (modeRef.current === "pendulum") {
        for (const E of [0.3, 0.7, 1.2, 1.7, 1.95]) {
          ctx.beginPath();
          let started = false;
          for (let k = 0; k <= 200; k++) {
            const qv = -Math.PI + (2 * Math.PI * k) / 200;
            const v = 2 * (E - (1 - Math.cos(qv)));
            if (v < 0) {
              started = false;
              continue;
            }
            const pv = Math.sqrt(v);
            const x = ox + qv * sx;
            const y = oy - pv * sy;
            if (!started) {
              ctx.moveTo(x, y);
              started = true;
            } else ctx.lineTo(x, y);
          }
          ctx.stroke();
          // lower branch
          ctx.beginPath();
          started = false;
          for (let k = 0; k <= 200; k++) {
            const qv = -Math.PI + (2 * Math.PI * k) / 200;
            const v = 2 * (E - (1 - Math.cos(qv)));
            if (v < 0) {
              started = false;
              continue;
            }
            const pv = -Math.sqrt(v);
            const x = ox + qv * sx;
            const y = oy - pv * sy;
            if (!started) {
              ctx.moveTo(x, y);
              started = true;
            } else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      } else if (modeRef.current === "sho") {
        for (const R of [0.5, 1.0, 1.5, 2.0]) {
          ctx.beginPath();
          for (let k = 0; k <= 80; k++) {
            const a = (2 * Math.PI * k) / 80;
            const x = ox + R * Math.cos(a) * sx;
            const y = oy - R * Math.sin(a) * sy;
            if (k === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;

      // Draw the blob — particles coloured cyan, wrap q into [-pi, pi] for pendulum
      for (let i = 0; i < arr.length; i++) {
        let [q, p] = arr[i]!;
        if (modeRef.current === "pendulum") {
          // wrap
          q = ((q + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
        }
        const x = ox + q * sx;
        const y = oy - p * sy;
        ctx.fillStyle = "#6FB8C6";
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.arc(x, y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Time readout + caption
      ctx.font = "11px monospace";
      ctx.fillStyle = colors.fg2;
      ctx.textAlign = "left";
      ctx.fillText(`t = ${tRef.current.toFixed(2)}`, 16, 22);
      ctx.fillText("area of the blob is conserved — Liouville's theorem", 16, height - 14);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas ref={canvasRef} style={{ width: size.width, height: size.height }} className="block" />
      <div className="mt-3 flex flex-wrap items-center gap-2 px-2">
        <span className="font-mono text-xs text-[var(--color-fg-3)]">flow</span>
        {(["sho", "pendulum", "shear"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`font-mono text-xs px-2 py-1 border transition ${
              mode === m
                ? "border-[#6FB8C6] text-[#6FB8C6]"
                : "border-[var(--color-fg-3)] text-[var(--color-fg-2)] hover:text-[var(--color-fg-1)]"
            }`}
          >
            {m === "sho" ? "harmonic" : m === "pendulum" ? "pendulum" : "shear"}
          </button>
        ))}
        <button
          onClick={() => reset()}
          className="font-mono text-xs px-2 py-1 border border-[var(--color-fg-3)] text-[var(--color-fg-2)] hover:text-[var(--color-fg-1)] ml-auto"
        >
          reset
        </button>
      </div>
    </div>
  );
}
