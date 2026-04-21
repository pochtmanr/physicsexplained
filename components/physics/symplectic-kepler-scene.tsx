"use client";

import { useEffect, useRef, useState } from "react";
import {
  ellipticOrbitInitial,
  eulerStep,
  keplerEnergy,
  leapfrogStep,
  type OrbitState,
} from "@/lib/physics/hamilton";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.55;
const MAX_HEIGHT = 360;
const STEP_DT = 0.015; // integration step (reduced units; orbit period = 2π)
const STEPS_PER_FRAME_BASE = 2;
const TRAIL_LENGTH = 1200;

/**
 * Two side-by-side integrations of the same Kepler orbit:
 * forward-Euler on the left, symplectic leapfrog on the right.
 *
 * Both start at the same periapsis with identical (q, p) but evolve under
 * different numerical schemes. Euler's orbit drifts outward — the planet
 * spirals away because energy is not preserved. Leapfrog's orbit stays
 * pinned to the same ellipse forever.
 *
 * This is the pedagogical whole point of symplectic integrators: the
 * NASA/JPL solar-system ephemerides have run for 40+ years of wall-clock
 * time without drift because they are Hamiltonian by construction.
 */
export function SymplecticKeplerScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 640, height: 360 });

  const eulerState = useRef<OrbitState>(ellipticOrbitInitial(1, 0.5));
  const leapState = useRef<OrbitState>(ellipticOrbitInitial(1, 0.5));
  const eulerTrail = useRef<Array<[number, number]>>([]);
  const leapTrail = useRef<Array<[number, number]>>([]);
  const simT = useRef(0);
  const E0Ref = useRef(keplerEnergy(ellipticOrbitInitial(1, 0.5)));

  const reset = () => {
    eulerState.current = ellipticOrbitInitial(1, 0.5);
    leapState.current = ellipticOrbitInitial(1, 0.5);
    eulerTrail.current = [];
    leapTrail.current = [];
    simT.current = 0;
  };

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
    onFrame: (_t, dt) => {
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

      // Advance physics. Clamp dt so a slow tab doesn't produce a huge jump.
      // Target ~60 fps equivalent of STEPS_PER_FRAME_BASE steps per frame.
      const wanted = Math.max(1, Math.round((dt / (1 / 60)) * STEPS_PER_FRAME_BASE));
      const steps = Math.min(wanted, 8);
      for (let i = 0; i < steps; i++) {
        eulerState.current = eulerStep(eulerState.current, STEP_DT);
        leapState.current = leapfrogStep(leapState.current, STEP_DT);
        simT.current += STEP_DT;
        eulerTrail.current.push([eulerState.current.q[0], eulerState.current.q[1]]);
        leapTrail.current.push([leapState.current.q[0], leapState.current.q[1]]);
      }
      if (eulerTrail.current.length > TRAIL_LENGTH) {
        eulerTrail.current.splice(0, eulerTrail.current.length - TRAIL_LENGTH);
      }
      if (leapTrail.current.length > TRAIL_LENGTH) {
        leapTrail.current.splice(0, leapTrail.current.length - TRAIL_LENGTH);
      }

      ctx.clearRect(0, 0, width, height);

      // Two panels, side by side.
      const panelW = width / 2;
      const panelH = height;

      const drawPanel = (
        xOff: number,
        label: string,
        subLabel: string,
        trail: Array<[number, number]>,
        state: OrbitState,
        color: string,
      ) => {
        const cx = xOff + panelW / 2;
        const cy = panelH / 2;
        // Scale: the semi-major axis is 1 reduced unit. Show up to ±2.4.
        const viewSpan = 2.4;
        const scale = Math.min(panelW, panelH) / (2 * viewSpan);

        // Frame
        ctx.strokeStyle = colors.fg3;
        ctx.lineWidth = 1;
        ctx.strokeRect(xOff + 4, 4, panelW - 8, panelH - 8);

        // Faint reference ellipse (the true closed orbit, a=1, e=0.5)
        const a = 1;
        const e = 0.5;
        const b = a * Math.sqrt(1 - e * e);
        ctx.strokeStyle = colors.fg3;
        ctx.setLineDash([3, 4]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(cx - a * e * scale, cy, a * scale, b * scale, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Central "sun" at focus (origin in sim coords → canvas center)
        ctx.shadowColor = "rgba(255, 200, 100, 0.7)";
        ctx.shadowBlur = 12;
        ctx.fillStyle = "#FFC864";
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Trail
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        for (let i = 0; i < trail.length; i++) {
          const pt = trail[i]!;
          const px = cx + pt[0] * scale;
          const py = cy - pt[1] * scale;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Planet
        const px = cx + state.q[0] * scale;
        const py = cy - state.q[1] * scale;
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Labels
        ctx.fillStyle = colors.fg1;
        ctx.font = "13px monospace";
        ctx.textAlign = "left";
        ctx.fillText(label, xOff + 14, 22);
        ctx.fillStyle = colors.fg2;
        ctx.font = "11px monospace";
        ctx.fillText(subLabel, xOff + 14, 38);

        // Energy readout
        const E = keplerEnergy(state);
        const drift = E - E0Ref.current;
        ctx.fillStyle = colors.fg2;
        ctx.font = "11px monospace";
        ctx.textAlign = "right";
        ctx.fillText(
          `ΔH = ${drift >= 0 ? "+" : ""}${drift.toFixed(4)}`,
          xOff + panelW - 14,
          panelH - 14,
        );
      };

      drawPanel(
        0,
        "Forward Euler",
        "non-symplectic — drifts",
        eulerTrail.current,
        eulerState.current,
        "#FF6ADE",
      );
      drawPanel(
        panelW,
        "Leapfrog",
        "symplectic — closed",
        leapTrail.current,
        leapState.current,
        "#6FB8C6",
      );

      // Divider
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(panelW, 4);
      ctx.lineTo(panelW, panelH - 4);
      ctx.stroke();

      // Orbit counter (shared clock)
      const orbits = simT.current / (2 * Math.PI);
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`t = ${orbits.toFixed(1)} orbits`, width / 2, panelH - 14);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-2 flex items-center justify-end px-2">
        <button
          type="button"
          onClick={reset}
          className="font-mono text-xs uppercase tracking-wider text-[var(--color-fg-2)] hover:text-[var(--color-fg-0)]"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
