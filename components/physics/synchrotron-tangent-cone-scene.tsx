"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { emissionConeHalfAngleRad } from "@/lib/physics/electromagnetism/synchrotron";

const AMBER = "rgba(255, 180, 80,";
const ORANGE = "rgba(255, 140, 80,";
const CYAN = "rgba(120, 220, 255,";
const MAGENTA = "rgba(255, 106, 222,";

const WIDTH = 720;
const HEIGHT = 450;
const RATIO = HEIGHT / WIDTH;
const MAX_HEIGHT = 520;

const GAMMAS = [1, 10, 100, 1000] as const;

// The "true" cone half-angle Δθ = 1/γ is unreadable past γ = 10. We paint a
// visually exaggerated cone whose *geometry* lets the reader compare the four
// regimes on a log-scale. The numeric readout always shows the real value.
const VISUAL_MIN_RAD = 0.008; // the γ = 1000 case stays visible
const VISUAL_MAX_RAD = 1.0;   // the γ = 1 case fills a doughnut

function visualConeRad(gamma: number): number {
  // Map log(γ) in [0, 3] to the visual range [VISUAL_MAX_RAD, VISUAL_MIN_RAD].
  const logG = Math.log10(gamma);
  const t = Math.min(1, logG / 3);
  return VISUAL_MAX_RAD * Math.pow(VISUAL_MIN_RAD / VISUAL_MAX_RAD, t);
}

/**
 * FIG.55a — Synchrotron tangent cone.
 *
 * An electron in a circular storage-ring orbit. The instantaneous emission
 * cone is drawn tangent to the velocity, with half-angle Δθ = 1/γ. The reader
 * toggles γ ∈ {1, 10, 100, 1000}. At γ = 1 the pattern is the non-relativistic
 * doughnut tangential to the orbit; at γ = 1000 it collapses to a pencil-thin
 * searchlight beam that sweeps round the ring once per revolution.
 *
 * Cone half-angle on screen is a logarithmic caricature — the real 1/γ would
 * be a single pixel for γ = 1000. The numeric readout shows the true value.
 */
export function SynchrotronTangentConeScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();

  const [size, setSize] = useState({ width: WIDTH, height: HEIGHT });
  const [gamma, setGamma] = useState<number>(100);

  const thetaRef = useRef(0);
  const frameStateRef = useRef({ gamma });
  useEffect(() => {
    frameStateRef.current = { gamma };
  }, [gamma]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) setSize({ width: w, height: Math.min(w * RATIO, MAX_HEIGHT) });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (_t, dt) => {
      // Angular speed — slow for γ = 1 (so the doughnut is readable), fast for
      // large γ (a lighthouse-fast sweep).
      const g = frameStateRef.current.gamma;
      const omega = 0.6 + 0.35 * Math.log10(g);
      thetaRef.current = (thetaRef.current + omega * dt) % (Math.PI * 2);
    },
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;

    const render = () => {
      const { width, height } = size;
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
      }
      ctx.clearRect(0, 0, width, height);

      const cx = width * 0.5;
      const cy = height * 0.54;
      const R = Math.min(width, height) * 0.32;

      // Orbit ring
      ctx.strokeStyle = `${CYAN} 0.32)`;
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Magnetic-field region tint (into the page — the classic "×" pattern)
      ctx.fillStyle = `${CYAN} 0.035)`;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.92, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText("B into page", cx, cy + 4);
      // Tiny × marks
      ctx.strokeStyle = `${CYAN} 0.45)`;
      const xs = [cx - R * 0.55, cx + R * 0.55, cx - R * 0.25, cx + R * 0.3];
      const ys = [cy - R * 0.25, cy + R * 0.3, cy + R * 0.55, cy - R * 0.55];
      for (let i = 0; i < xs.length; i += 1) {
        const px = xs[i];
        const py = ys[i];
        ctx.beginPath();
        ctx.moveTo(px - 3, py - 3);
        ctx.lineTo(px + 3, py + 3);
        ctx.moveTo(px + 3, py - 3);
        ctx.lineTo(px - 3, py + 3);
        ctx.stroke();
      }

      // Electron position + velocity tangent vector
      const theta = thetaRef.current;
      // Orbit in screen coords — clockwise so velocity is rotated +π/2 from
      // position vector (visually: motion along tangent).
      const ex = cx + R * Math.cos(theta);
      const ey = cy + R * Math.sin(theta);
      const vdirX = -Math.sin(theta);
      const vdirY = Math.cos(theta);

      // Emission cone
      const coneRad = visualConeRad(gamma);
      const coneLen = Math.min(width, height) * 0.6;

      // Cone fill (wedge)
      const tipX = ex;
      const tipY = ey;
      const leftX = ex + coneLen * (vdirX * Math.cos(coneRad) - vdirY * Math.sin(coneRad));
      const leftY = ey + coneLen * (vdirX * Math.sin(coneRad) + vdirY * Math.cos(coneRad));
      const rightX = ex + coneLen * (vdirX * Math.cos(-coneRad) - vdirY * Math.sin(-coneRad));
      const rightY = ey + coneLen * (vdirX * Math.sin(-coneRad) + vdirY * Math.cos(-coneRad));

      const grad = ctx.createRadialGradient(tipX, tipY, 0, tipX, tipY, coneLen);
      grad.addColorStop(0, `${ORANGE} 0.55)`);
      grad.addColorStop(0.55, `${AMBER} 0.22)`);
      grad.addColorStop(1, `${AMBER} 0.0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(leftX, leftY);
      // Arc the far edge for a rounded cone mouth
      const midAng = Math.atan2(vdirY, vdirX);
      ctx.arc(tipX, tipY, coneLen, midAng + coneRad, midAng - coneRad, true);
      ctx.lineTo(rightX, rightY);
      ctx.closePath();
      ctx.fill();

      // Cone outline
      ctx.strokeStyle = `${ORANGE} 0.85)`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(leftX, leftY);
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(rightX, rightY);
      ctx.stroke();

      // Velocity tangent arrow
      ctx.strokeStyle = `${CYAN} 0.9)`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      const arrowLen = 34;
      const ax = ex + vdirX * arrowLen;
      const ay = ey + vdirY * arrowLen;
      ctx.lineTo(ax, ay);
      // Arrowhead
      const headSize = 6;
      const perpX = -vdirY;
      const perpY = vdirX;
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax - vdirX * headSize + perpX * headSize * 0.5,
                 ay - vdirY * headSize + perpY * headSize * 0.5);
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax - vdirX * headSize - perpX * headSize * 0.5,
                 ay - vdirY * headSize - perpY * headSize * 0.5);
      ctx.stroke();

      // Electron dot
      ctx.fillStyle = `${MAGENTA} 0.95)`;
      ctx.beginPath();
      ctx.arc(ex, ey, 5, 0, Math.PI * 2);
      ctx.fill();

      // HUD
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillStyle = colors.fg1;
      ctx.fillText("SYNCHROTRON · tangent emission cone", 12, 18);
      ctx.fillStyle = colors.fg2;
      ctx.fillText("electron on a ring of radius R, B into page", 12, 34);

      ctx.textAlign = "right";
      ctx.fillStyle = `${ORANGE} 0.95)`;
      const realDelta = emissionConeHalfAngleRad(gamma);
      ctx.fillText(`γ = ${gamma}`, width - 12, 18);
      ctx.fillText(
        `Δθ = 1/γ = ${formatAngle(realDelta)}`,
        width - 12,
        34,
      );
      ctx.fillStyle = colors.fg2;
      ctx.fillText(
        gamma === 1
          ? "non-relativistic: full doughnut"
          : gamma >= 100
            ? "searchlight sweeps once per orbit"
            : "beam is collimating",
        width - 12,
        50,
      );

      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [size, colors, gamma]);

  const displayDeg = useMemo(() => emissionConeHalfAngleRad(gamma), [gamma]);

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-3 flex flex-wrap items-center gap-2 px-2 font-mono text-[11px]">
        <span className="text-[var(--color-fg-3)]">Lorentz factor γ</span>
        <div className="flex overflow-hidden border border-[var(--color-fg-4)]">
          {GAMMAS.map((g) => (
            <button
              key={g}
              type="button"
              className={`px-2 py-0.5 ${
                gamma === g
                  ? "bg-[var(--color-fg-4)] text-[var(--color-fg-1)]"
                  : "text-[var(--color-fg-2)] hover:text-[var(--color-fg-1)]"
              }`}
              onClick={() => setGamma(g)}
            >
              {g}
            </button>
          ))}
        </div>
        <span className="ml-2 text-[var(--color-fg-3)]">
          real Δθ ={" "}
          <span style={{ color: "rgb(255, 140, 80)" }}>
            {formatAngle(displayDeg)}
          </span>
        </span>
      </div>
      <p className="px-2 pt-2 text-xs text-[var(--color-fg-3)]">
        The rendered cone angle is a logarithmic caricature — at γ = 1000 the
        true 1/γ = 1 mrad would be a single pixel. Numeric readout is exact.
      </p>
    </div>
  );
}

function formatAngle(rad: number): string {
  if (rad >= 0.1) return `${rad.toFixed(3)} rad`;
  if (rad >= 1e-3) return `${(rad * 1e3).toFixed(2)} mrad`;
  return `${(rad * 1e6).toFixed(1)} μrad`;
}
