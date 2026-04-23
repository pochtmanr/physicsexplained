"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { skinDepthCopper } from "@/lib/physics/electromagnetism/skin-depth";

const RATIO = 0.6;
const MAX_HEIGHT = 420;

const AMBER = "rgba(255, 180, 80,";
const LILAC = "rgba(200, 160, 255,";

/**
 * FIG.43b — cross-section of a round copper conductor.
 *
 * At DC the current density J is uniform across the cross-section: every
 * concentric ring glows the same. At high AC frequency, J is pushed to the
 * surface — the classic skin effect. We model the radial profile as
 *
 *   J(r) = J_surface · exp(−(a−r)/δ)
 *
 * which is the thin-skin limit of the exact Bessel-function solution. The
 * scene visualises this by colour-mapping concentric rings from dim (core)
 * to bright (surface). A DC toggle flattens the profile so the reader can
 * see the difference.
 *
 * A frequency slider shows how the "conducting skin" becomes a pencil-thin
 * sheath as f climbs: at 50 Hz in a 4 mm-radius wire δ ≈ 9 mm so the wire
 * is effectively uniform; at 100 MHz δ drops to ~6.5 μm and the core is
 * electromagnetically dark.
 */
export function CrossSectionScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 680, height: 420 });
  const [logF, setLogF] = useState(7); // 10 MHz default
  const [isDC, setIsDC] = useState(false);

  // Physical radius of the model conductor (for visual anchoring):
  // 4 mm — roughly 8-gauge copper wire.
  const WIRE_RADIUS_M = 4e-3;

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

      // ─── Compute δ and the ratio δ / a ─────────────────────────────────
      const freqHz = Math.pow(10, logF);
      const deltaPhys = isDC ? Infinity : skinDepthCopper(freqHz);
      // Relative depth as a fraction of the wire radius.
      const deltaOverA = deltaPhys / WIRE_RADIUS_M;

      // Circle layout — dominant left panel, HUD right.
      const cx = width * 0.36;
      const cy = height * 0.5;
      const R = Math.min(width * 0.32, height * 0.44);

      // ─── Ring-by-ring current density ──────────────────────────────────
      // We draw N concentric annuli from r = 0 to r = R, colouring each
      // by J(r)/J_surface = exp(−(R − r)/δ_visual), where δ_visual is
      // δ_phys mapped into the on-screen radius R by the same ratio as
      // the physical wire radius. isDC ⇒ uniform.
      const N = 60;
      const shimmer = 0.08 * Math.sin(t * 1.6);
      for (let i = N - 1; i >= 0; i--) {
        const rOuter = (R * (i + 1)) / N;
        const rInner = (R * i) / N;
        const rMid = (rOuter + rInner) / 2;
        const rel = rMid / R; // 0 at centre, 1 at surface
        const depthFromSurface = 1 - rel; // fraction of radius from surface

        // J profile
        let J: number;
        if (isDC) {
          J = 1;
        } else if (deltaOverA >= 1.5) {
          // δ much larger than a → almost uniform but slight surface bias.
          J = Math.exp(-(depthFromSurface) / deltaOverA);
        } else {
          J = Math.exp(-(depthFromSurface) / deltaOverA);
        }

        // Animate a subtle pulsing so it looks alive.
        const pulse = 1 + shimmer * rel;
        const alpha = Math.max(0.04, Math.min(0.98, J * pulse));

        // Colour: warm amber near surface, darker toward core. For DC
        // render with a single mid-amber so it is visibly uniform.
        ctx.fillStyle = `${AMBER} ${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(cx, cy, rOuter, 0, Math.PI * 2);
        ctx.fill();
      }

      // Outer stroke — the physical conductor boundary.
      ctx.strokeStyle = colors.fg2;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.stroke();

      // Inner dashed circle at r = R − δ (the edge of the conducting sheath).
      if (!isDC && deltaOverA < 1) {
        const rSheath = R * (1 - deltaOverA);
        ctx.strokeStyle = `${LILAC} 0.9)`;
        ctx.lineWidth = 1.3;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.arc(cx, cy, rSheath, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.font = "10px monospace";
        ctx.fillStyle = `${LILAC} 0.95)`;
        ctx.textAlign = "center";
        ctx.fillText("δ shell", cx, cy - rSheath - 8);
      }

      // Cross-hatch grid to give the cross-section texture.
      ctx.strokeStyle = colors.fg3;
      ctx.setLineDash([1, 6]);
      for (let k = -4; k <= 4; k++) {
        ctx.beginPath();
        ctx.moveTo(cx + k * (R / 5), cy - R);
        ctx.lineTo(cx + k * (R / 5), cy + R);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // ─── Right-side HUD ────────────────────────────────────────────────
      const hudX = width * 0.72;
      const hudY = height * 0.25;
      ctx.fillStyle = colors.fg2;
      ctx.font = "bold 12px monospace";
      ctx.textAlign = "left";
      ctx.fillText(isDC ? "MODE: DC" : "MODE: AC", hudX, hudY);

      ctx.font = "10px monospace";
      ctx.fillStyle = colors.fg3;
      ctx.fillText(`wire radius a = 4.00 mm`, hudX, hudY + 20);

      const prettyFreq = (() => {
        if (freqHz >= 1e9) return `${(freqHz / 1e9).toFixed(2)} GHz`;
        if (freqHz >= 1e6) return `${(freqHz / 1e6).toFixed(2)} MHz`;
        if (freqHz >= 1e3) return `${(freqHz / 1e3).toFixed(2)} kHz`;
        return `${freqHz.toFixed(1)} Hz`;
      })();
      const prettyDelta = (() => {
        if (deltaPhys === Infinity) return "∞ (DC)";
        if (deltaPhys >= 1) return `${deltaPhys.toFixed(2)} m`;
        if (deltaPhys >= 1e-3) return `${(deltaPhys * 1e3).toFixed(2)} mm`;
        if (deltaPhys >= 1e-6) return `${(deltaPhys * 1e6).toFixed(2)} µm`;
        return `${(deltaPhys * 1e9).toFixed(2)} nm`;
      })();

      if (!isDC) {
        ctx.fillText(`frequency   f = ${prettyFreq}`, hudX, hudY + 36);
      }
      ctx.fillStyle = `${LILAC} 0.95)`;
      ctx.font = "bold 11px monospace";
      ctx.fillText(`δ = ${prettyDelta}`, hudX, hudY + 54);

      ctx.fillStyle = colors.fg3;
      ctx.font = "10px monospace";
      if (isDC) {
        ctx.fillText("J uniform across cross-section", hudX, hudY + 74);
      } else {
        const ratio = deltaOverA;
        if (ratio >= 1) {
          ctx.fillText("δ ≳ a — almost uniform still", hudX, hudY + 74);
        } else if (ratio >= 0.2) {
          ctx.fillText("J biased toward surface", hudX, hudY + 74);
        } else {
          ctx.fillText("J crushed into thin surface sheath", hudX, hudY + 74);
        }
      }

      // Small legend
      ctx.fillStyle = colors.fg3;
      ctx.font = "9px monospace";
      ctx.fillText("amber = current density |J(r)|", hudX, height - 44);
      ctx.fillText("lilac ring = r = a − δ", hudX, height - 30);
      ctx.fillText("(inside that ring, J has fallen by 1/e)", hudX, height - 16);
    },
  });

  const freqHz = Math.pow(10, logF);
  const prettyFreq = (() => {
    if (freqHz >= 1e9) return `${(freqHz / 1e9).toFixed(2)} GHz`;
    if (freqHz >= 1e6) return `${(freqHz / 1e6).toFixed(2)} MHz`;
    if (freqHz >= 1e3) return `${(freqHz / 1e3).toFixed(2)} kHz`;
    return `${freqHz.toFixed(1)} Hz`;
  })();

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-3 grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2 px-2 text-sm">
        <label className="text-[var(--color-fg-3)]">Frequency</label>
        <input
          type="range"
          min={1.7}
          max={10}
          step={0.01}
          value={logF}
          onChange={(e) => setLogF(parseFloat(e.target.value))}
          disabled={isDC}
          className="accent-[rgb(255,180,80)] disabled:opacity-40"
        />
        <span className="w-24 text-right font-mono text-[var(--color-fg-1)]">
          {isDC ? "—" : prettyFreq}
        </span>
      </div>
      <div className="mt-2 flex gap-3 px-2 font-mono text-[11px] text-[var(--color-fg-3)]">
        <button
          type="button"
          onClick={() => setIsDC(false)}
          className={`border px-2 py-0.5 ${
            !isDC
              ? "border-[rgb(255,180,80)] text-[var(--color-fg-1)]"
              : "border-[var(--color-fg-4)] hover:border-[rgb(255,180,80)]"
          }`}
        >
          AC
        </button>
        <button
          type="button"
          onClick={() => setIsDC(true)}
          className={`border px-2 py-0.5 ${
            isDC
              ? "border-[rgb(200,160,255)] text-[var(--color-fg-1)]"
              : "border-[var(--color-fg-4)] hover:border-[rgb(200,160,255)]"
          }`}
        >
          DC
        </button>
      </div>
    </div>
  );
}
