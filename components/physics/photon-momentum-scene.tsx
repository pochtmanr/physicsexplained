"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  photonMomentum,
  photonMomentumFromWavelength,
} from "@/lib/physics/electromagnetism/radiation-pressure";

const RATIO = 0.52;
const MAX_HEIGHT = 380;

const AMBER = "rgba(255, 214, 107,";
const CYAN = "rgba(120, 220, 255,";
const MAGENTA = "rgba(255, 106, 222,";

type Mode = "absorb" | "reflect";

/**
 * FIG.40a — one photon, two surfaces.
 *
 * Left panel: a single amber photon (momentum arrow p = E/c) strikes a
 * black absorbing surface, vanishes, and the surface picks up a magenta
 * recoil arrow equal to +p.
 *
 * Right panel: the same photon strikes a mirror, reverses momentum
 * (now pointing left), and the mirror picks up a magenta recoil arrow
 * equal to +2p — because the photon now carries −p, so Δp_surface = 2p.
 *
 * The reader toggles between modes to see the factor-of-2 live. HUD
 * shows p, Δp_surface, and the implied pressure for one photon per m²·s
 * as a sanity-check bridge to P = I/c and P = 2I/c.
 */
export function PhotonMomentumScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 720, height: 380 });
  const [mode, setMode] = useState<Mode>("absorb");
  const [wavelengthNm, setWavelengthNm] = useState(550);

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

      // 3-second cycle: photon travels 0.0→0.6s, impact at 0.6s, recoil
      // arrow lingers 0.6→3.0s.
      const cycle = 3.0;
      const frac = (t % cycle) / cycle;
      const phase: "incoming" | "impact" | "recoil" =
        frac < 0.2 ? "incoming" : frac < 0.24 ? "impact" : "recoil";

      const surfaceX = width * 0.68;
      const cy = height / 2;

      // ─────── Surface ───────
      const surfaceH = Math.min(height * 0.7, 240);
      if (mode === "absorb") {
        // Charcoal slab with small texture dots
        ctx.fillStyle = "#1a1d22";
        ctx.fillRect(surfaceX, cy - surfaceH / 2, 22, surfaceH);
        ctx.strokeStyle = `${CYAN} 0.25)`;
        ctx.lineWidth = 1;
        ctx.strokeRect(surfaceX, cy - surfaceH / 2, 22, surfaceH);
        ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
        for (let i = 0; i < 20; i++) {
          const dx = Math.random() * 20;
          const dy = Math.random() * surfaceH;
          ctx.fillRect(surfaceX + dx, cy - surfaceH / 2 + dy, 1, 1);
        }
        ctx.fillStyle = colors.fg2;
        ctx.font = "10px monospace";
        ctx.textAlign = "center";
        ctx.fillText("absorber", surfaceX + 11, cy + surfaceH / 2 + 16);
      } else {
        // Mirror — silvered gradient
        const grad = ctx.createLinearGradient(surfaceX, 0, surfaceX + 22, 0);
        grad.addColorStop(0, "#E0E0F0");
        grad.addColorStop(1, "#606070");
        ctx.fillStyle = grad;
        ctx.fillRect(surfaceX, cy - surfaceH / 2, 22, surfaceH);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(surfaceX, cy - surfaceH / 2);
        ctx.lineTo(surfaceX, cy + surfaceH / 2);
        ctx.stroke();
        ctx.fillStyle = colors.fg2;
        ctx.font = "10px monospace";
        ctx.textAlign = "center";
        ctx.fillText("mirror", surfaceX + 11, cy + surfaceH / 2 + 16);
      }

      // ─────── Photon trajectory ───────
      const startX = 40;
      const travelLen = surfaceX - startX - 4;
      let photonX: number;
      const photonY = cy;

      if (phase === "incoming") {
        photonX = startX + (frac / 0.2) * travelLen;
      } else if (phase === "impact") {
        photonX = surfaceX - 4;
      } else {
        // recoil phase — if reflect, photon is flying back
        if (mode === "reflect") {
          const recoilFrac = (frac - 0.24) / 0.76;
          photonX = surfaceX - 4 - recoilFrac * travelLen;
        } else {
          photonX = -100; // absorbed; out of view
        }
      }

      // Draw photon as a small amber wavelet + arrow
      if (photonX > 0 && photonX < width) {
        const photonDir = phase === "recoil" && mode === "reflect" ? -1 : 1;
        drawPhoton(ctx, photonX, photonY, photonDir, t);
      }

      // ─────── Momentum arrows ───────
      // Photon momentum p = E/c. Use arbitrary visual length `pLen`.
      const pLen = 48;
      const photonMomentumColor = `${AMBER} 0.95)`;

      // Incoming phase: show p-arrow beside photon
      if (phase === "incoming" && photonX > 0) {
        drawArrowLabel(
          ctx,
          photonX - pLen / 2 - 4,
          photonY - 36,
          photonX + pLen / 2 - 4,
          photonY - 36,
          photonMomentumColor,
          "p = E/c",
        );
      }

      // Recoil phase: show the photon's *post-interaction* momentum and
      // the surface's recoil arrow.
      if (phase === "recoil") {
        if (mode === "reflect" && photonX > 0) {
          // photon's new momentum: −p
          drawArrowLabel(
            ctx,
            photonX + pLen / 2,
            photonY - 36,
            photonX - pLen / 2,
            photonY - 36,
            photonMomentumColor,
            "−p",
          );
        }
        // surface recoil arrow
        const dpLen = mode === "reflect" ? 2 * pLen : pLen;
        const surfaceArrowX0 = surfaceX + 28;
        drawArrowLabel(
          ctx,
          surfaceArrowX0,
          cy,
          surfaceArrowX0 + dpLen,
          cy,
          `${MAGENTA} 0.95)`,
          mode === "reflect" ? "Δp = 2p" : "Δp = p",
        );
      }

      // ─────── Labels ───────
      ctx.font = "12px monospace";
      ctx.fillStyle = colors.fg1;
      ctx.textAlign = "left";
      ctx.fillText(
        mode === "reflect"
          ? "Perfect reflector — momentum reverses, surface picks up 2p"
          : "Perfect absorber — photon gone, surface picks up p",
        12,
        20,
      );

      // HUD
      const PLANCK = 6.62607015e-34;
      const SPEED = 2.99792458e8;
      const lambda = wavelengthNm * 1e-9;
      const energy = (PLANCK * SPEED) / lambda;
      const p = photonMomentumFromWavelength(lambda);
      const pCheck = photonMomentum(energy);
      void pCheck; // identical by construction; keeps the symmetry visible

      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.fillText(`λ = ${wavelengthNm.toFixed(0)} nm`, 12, height - 46);
      ctx.fillText(
        `E = hc/λ = ${energy.toExponential(2)} J`,
        12,
        height - 32,
      );
      ctx.fillText(
        `p = h/λ = ${p.toExponential(2)} kg·m/s`,
        12,
        height - 18,
      );
      ctx.textAlign = "right";
      ctx.fillStyle = `${MAGENTA} 0.9)`;
      ctx.fillText(
        mode === "reflect"
          ? "Δp_surface = 2p  →  P = 2I/c"
          : "Δp_surface = p   →  P = I/c",
        width - 12,
        height - 18,
      );
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-2 flex flex-wrap items-center gap-3 px-2 font-mono text-xs">
        <button
          type="button"
          onClick={() => setMode("absorb")}
          className={`rounded border px-3 py-1 transition-colors ${
            mode === "absorb"
              ? "border-[var(--color-cyan)] text-[var(--color-cyan)]"
              : "border-[var(--color-fg-4)] text-[var(--color-fg-3)] hover:border-[var(--color-fg-3)]"
          }`}
        >
          ABSORBER
        </button>
        <button
          type="button"
          onClick={() => setMode("reflect")}
          className={`rounded border px-3 py-1 transition-colors ${
            mode === "reflect"
              ? "border-[var(--color-cyan)] text-[var(--color-cyan)]"
              : "border-[var(--color-fg-4)] text-[var(--color-fg-3)] hover:border-[var(--color-fg-3)]"
          }`}
        >
          MIRROR
        </button>
        <div className="ml-auto flex items-center gap-3">
          <label className="text-[var(--color-fg-3)]">λ</label>
          <input
            type="range"
            min={200}
            max={1500}
            step={10}
            value={wavelengthNm}
            onChange={(e) => setWavelengthNm(parseFloat(e.target.value))}
            className="w-40"
            style={{ accentColor: "#FFD66B" }}
          />
          <span className="w-20 text-right text-[var(--color-fg-1)]">
            {wavelengthNm} nm
          </span>
        </div>
      </div>
    </div>
  );
}

function drawPhoton(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dir: 1 | -1,
  t: number,
) {
  // Small amber wavelet — 3 cycles of sinusoid with a leading dot.
  ctx.strokeStyle = `${AMBER} 0.95)`;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  const waveLen = 22;
  const amp = 5;
  for (let dx = -waveLen; dx <= 0; dx += 1) {
    const xx = x + dir * dx;
    const yy = y + Math.sin((dx / waveLen) * Math.PI * 3 + t * 6) * amp;
    if (dx === -waveLen) ctx.moveTo(xx, yy);
    else ctx.lineTo(xx, yy);
  }
  ctx.stroke();
  // leading dot
  ctx.fillStyle = `${AMBER} 1.0)`;
  ctx.beginPath();
  ctx.arc(x, y, 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawArrowLabel(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  label: string,
) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  const dx = x1 - x0;
  const dy = y1 - y0;
  const L = Math.hypot(dx, dy) || 1;
  const ux = dx / L;
  const uy = dy / L;
  const head = 7;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - ux * head - uy * head * 0.5, y1 - uy * head + ux * head * 0.5);
  ctx.lineTo(x1 - ux * head + uy * head * 0.5, y1 - uy * head - ux * head * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.font = "10px monospace";
  ctx.textAlign = "center";
  ctx.fillText(label, (x0 + x1) / 2, y0 - 8);
}
