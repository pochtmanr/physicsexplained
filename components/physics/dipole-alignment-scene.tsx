"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  dipoleAlignment,
  polarizationFromField,
} from "@/lib/physics/electromagnetism/polarization";

/**
 * THE MONEY SHOT for FIG.08.
 *
 * A grid of atoms — each rendered as a small magenta nucleus and a cyan
 * electron cloud joined by a connecting line — lives inside a slab. A
 * slider sets the external field strength E_ext. As you turn it up, the
 * dipoles lean: the nuclei pull one way, the clouds the other, and the
 * average alignment ⟨cos θ⟩ climbs toward 1.
 *
 * The HUD shows the live polarization magnitude P = ε₀·χ_e·E and the
 * live mean alignment. Bound surface charges (+P and −P) glow on the
 * left and right faces of the slab so the reader can see the macroscopic
 * effect of the microscopic leaning all at once.
 */

const MAGENTA = "#FF6ADE";
const CYAN = "#6FB8C6";
const AMBER = "#FFD66B";
const CHI_E = 4; // a typical "soft" dielectric — gives a visible response

interface Atom {
  cx: number; // grid centre, in canvas px
  cy: number;
  /** Initial random orientation when E = 0 (radians) */
  jitterAngle: number;
}

export function DipoleAlignmentScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const reducedMotion = useReducedMotion();
  const [size, setSize] = useState({ width: 640, height: 380 });
  const [eFieldKvm, setEFieldKvm] = useState(2.0); // kV/m, slider value
  const atomsRef = useRef<Atom[] | null>(null);

  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          setSize({ width: w, height: Math.min(Math.max(w * 0.58, 320), 420) });
        }
      }
    });
    ro.observe(c);
    return () => ro.disconnect();
  }, []);

  // Build a stable atom grid — sized to the canvas, regenerated only on resize.
  useEffect(() => {
    const cols = 9;
    const rows = 5;
    const slabLeft = size.width * 0.12;
    const slabRight = size.width * 0.88;
    const slabTop = size.height * 0.22;
    const slabBottom = size.height * 0.78;
    const dx = (slabRight - slabLeft) / (cols - 1);
    const dy = (slabBottom - slabTop) / (rows - 1);
    const atoms: Atom[] = [];
    // Deterministic pseudo-random for stable jitter (so unit tests / SSR snapshots stay stable)
    let seed = 7;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        atoms.push({
          cx: slabLeft + c * dx,
          cy: slabTop + r * dy,
          jitterAngle: (rand() * 2 - 1) * Math.PI, // any angle
        });
      }
    }
    atomsRef.current = atoms;
  }, [size]);

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

      const eField = eFieldKvm * 1000; // V/m
      const pMag = polarizationFromField(CHI_E, eField);

      // Slab outline
      const slabLeft = width * 0.12;
      const slabRight = width * 0.88;
      const slabTop = height * 0.22;
      const slabBottom = height * 0.78;
      const slabW = slabRight - slabLeft;

      // Slab background — faint cyan tint
      ctx.fillStyle = "rgba(111, 184, 198, 0.04)";
      ctx.fillRect(slabLeft, slabTop, slabW, slabBottom - slabTop);
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(slabLeft, slabTop, slabW, slabBottom - slabTop);
      ctx.setLineDash([]);

      // External field arrows above and below (pointing right)
      const eStrength = Math.min(1, eFieldKvm / 6);
      drawExternalField(ctx, slabLeft, slabRight, slabTop, slabBottom, eStrength, colors.fg3);

      // Bound surface charges on the left and right faces — visible only when P > 0
      // P points along +x because E points along +x, so the right face is +σ_b, left is −σ_b.
      const surfaceAlpha = Math.min(1, eStrength * 1.2);
      if (surfaceAlpha > 0.01) {
        // Right face: positive bound charge
        ctx.shadowColor = `rgba(255, 106, 222, ${0.7 * surfaceAlpha})`;
        ctx.shadowBlur = 14;
        ctx.strokeStyle = `rgba(255, 106, 222, ${0.95 * surfaceAlpha})`;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(slabRight, slabTop);
        ctx.lineTo(slabRight, slabBottom);
        ctx.stroke();
        // Left face: negative bound charge
        ctx.shadowColor = `rgba(111, 184, 198, ${0.7 * surfaceAlpha})`;
        ctx.shadowBlur = 14;
        ctx.strokeStyle = `rgba(111, 184, 198, ${0.95 * surfaceAlpha})`;
        ctx.beginPath();
        ctx.moveTo(slabLeft, slabTop);
        ctx.lineTo(slabLeft, slabBottom);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // σ labels
        ctx.fillStyle = MAGENTA;
        ctx.globalAlpha = surfaceAlpha;
        ctx.font = "11px monospace";
        ctx.textAlign = "left";
        ctx.fillText("+σ_b", slabRight + 6, slabTop + 14);
        ctx.fillStyle = CYAN;
        ctx.textAlign = "right";
        ctx.fillText("−σ_b", slabLeft - 6, slabTop + 14);
        ctx.globalAlpha = 1;
      }

      // Compute per-atom alignment with smooth animated relaxation toward field direction
      const atoms = atomsRef.current;
      if (!atoms) return;
      // alignment fraction: 0 at E=0 (random), → 1 at saturation. Use a smooth saturating curve.
      const alignFraction = 1 - Math.exp(-eFieldKvm / 1.5);
      const wobble = reducedMotion ? 0 : 0.08 * Math.sin(t * 1.6);
      let alignSum = 0;
      const dipoleHalfLen = Math.min(slabW / 18, 14);

      for (const atom of atoms) {
        // Dipole orientation: blend from atom's random jitter toward 0 (along +x)
        // alignFraction = 0 → fully random; alignFraction = 1 → fully aligned
        // Interpolate the angle, then add a small breathing wobble.
        const targetAngle = 0; // along +x
        const ang = atom.jitterAngle * (1 - alignFraction) + targetAngle * alignFraction + wobble;
        alignSum += dipoleAlignment(ang);

        const dx = Math.cos(ang) * dipoleHalfLen;
        const dy = Math.sin(ang) * dipoleHalfLen;

        // Connecting line (the "stretched atom")
        ctx.strokeStyle = "rgba(180, 200, 220, 0.4)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(atom.cx - dx, atom.cy - dy);
        ctx.lineTo(atom.cx + dx, atom.cy + dy);
        ctx.stroke();

        // Negative end (electron cloud) — cyan
        ctx.fillStyle = CYAN;
        ctx.beginPath();
        ctx.arc(atom.cx - dx, atom.cy - dy, 3.2, 0, Math.PI * 2);
        ctx.fill();

        // Positive end (nucleus) — magenta
        ctx.fillStyle = MAGENTA;
        ctx.beginPath();
        ctx.arc(atom.cx + dx, atom.cy + dy, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }

      const meanAlignment = alignSum / atoms.length;

      // HUD — live readouts
      const pad = 12;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillStyle = colors.fg2;
      ctx.fillText("E_ext", pad, pad + 10);
      ctx.fillStyle = AMBER;
      ctx.fillText(`${eFieldKvm.toFixed(2)} kV/m`, pad, pad + 26);

      ctx.fillStyle = colors.fg2;
      ctx.fillText("⟨cos θ⟩", pad + 110, pad + 10);
      ctx.fillStyle = colors.fg0;
      ctx.fillText(meanAlignment.toFixed(3), pad + 110, pad + 26);

      ctx.fillStyle = colors.fg2;
      ctx.textAlign = "right";
      ctx.fillText("P = ε₀·χ_e·E", width - pad, pad + 10);
      ctx.fillStyle = MAGENTA;
      ctx.fillText(`${pMag.toExponential(2)} C/m²`, width - pad, pad + 26);

      // χ_e indicator
      ctx.fillStyle = colors.fg2;
      ctx.textAlign = "left";
      ctx.fillText(`χ_e = ${CHI_E.toFixed(0)}`, pad, height - 8);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-2 flex flex-wrap items-center gap-3 px-2">
        <label className="flex items-center gap-2 font-mono text-xs text-[var(--color-fg-1)]">
          <span className="text-[var(--color-fg-3)]">E_ext</span>
          <input
            type="range"
            min={0}
            max={6}
            step={0.05}
            value={eFieldKvm}
            onChange={(e) => setEFieldKvm(Number(e.target.value))}
            className="w-48 accent-[#FFD66B]"
          />
          <span className="tabular-nums">{eFieldKvm.toFixed(2)} kV/m</span>
        </label>
        <span className="text-xs font-mono text-[var(--color-fg-3)]">
          slide to ramp the external field — watch the dipoles lean and the bound surface charges glow
        </span>
      </div>
    </div>
  );
}

function drawExternalField(
  ctx: CanvasRenderingContext2D,
  xLeft: number,
  xRight: number,
  yTop: number,
  yBottom: number,
  strength: number,
  faintColor: string,
) {
  if (strength <= 0.01) {
    // Faint placeholder showing the direction even at zero field
    ctx.strokeStyle = faintColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.moveTo(xLeft - 30, yTop - 16);
    ctx.lineTo(xRight + 30, yTop - 16);
    ctx.stroke();
    ctx.setLineDash([]);
    return;
  }
  const alpha = 0.35 + 0.55 * strength;
  ctx.strokeStyle = `rgba(255, 214, 107, ${alpha})`;
  ctx.fillStyle = `rgba(255, 214, 107, ${alpha})`;
  ctx.lineWidth = 1.2 + 1.2 * strength;
  const arrowSpacing = 70;
  for (const y of [yTop - 16, yBottom + 16]) {
    let x = xLeft - 20;
    while (x < xRight + 30) {
      const x1 = x;
      const x2 = Math.min(x + arrowSpacing - 14, xRight + 28);
      ctx.beginPath();
      ctx.moveTo(x1, y);
      ctx.lineTo(x2, y);
      ctx.stroke();
      // arrowhead
      const ah = 5;
      ctx.beginPath();
      ctx.moveTo(x2 + ah, y);
      ctx.lineTo(x2 - 1, y - ah * 0.7);
      ctx.lineTo(x2 - 1, y + ah * 0.7);
      ctx.closePath();
      ctx.fill();
      x += arrowSpacing;
    }
  }
  // Label
  ctx.font = "10px monospace";
  ctx.fillStyle = `rgba(255, 214, 107, ${alpha})`;
  ctx.textAlign = "left";
  ctx.fillText("E_ext →", xRight + 6, yBottom + 20);
}
