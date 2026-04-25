"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  ELEMENTARY_CHARGE,
  EPSILON_0,
  SPEED_OF_LIGHT,
} from "@/lib/physics/constants";
import { gamma } from "@/lib/physics/electromagnetism/relativity";
import { equivalenceCheck } from "@/lib/physics/electromagnetism/relativistic-magnetism";
import {
  BetaSlider,
  drawArrow,
  formatBeta,
  formatSci,
  SCENE_D,
  SCENE_N0,
  useSharedBeta,
} from "./two-wire-lab-frame-scene";

/**
 * FIG.61b — Two-wire setup, drawn in the ELECTRON REST FRAME.
 *
 * Cyan electrons sit still. Magenta lattice ions drift LEFT at −β. As β
 * climbs, the lattice's dot spacing visibly contracts by 1/γ; the cyan
 * spacing stays the same. The asymmetry — more magenta dots per unit
 * length than cyan — is the new + line charge density on each wire. That
 * net density produces a Coulomb attraction (radial magenta E-field arrows
 * in the gap) of exactly the same magnitude as the lab-frame magnetic
 * force in §11.4a.
 *
 * The HUD reports ρ_net = e·n0·(γ − 1/γ), the rest-frame Coulomb force per
 * length, and (after the 1/γ transverse-force correction) the lab-frame
 * value, which equals F_mag.
 */

const RATIO = 0.55;
const MAX_HEIGHT = 360;

export function TwoWireElectronFrameScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const beta = useSharedBeta();

  const betaRef = useRef(beta);
  useEffect(() => {
    betaRef.current = beta;
  }, [beta]);

  const [size, setSize] = useState({ width: 640, height: 360 });
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

      const b = betaRef.current;
      const g = gamma(b);

      // ── geometry ───────────────────────────────────────────────────────
      const padX = 64;
      const cy1 = height * 0.32;
      const cy2 = height * 0.74;
      const wireL = padX;
      const wireR = width - padX;
      const wireLen = wireR - wireL;

      // Cyan (electron) spacing — at-rest density, fixed across β.
      const cyanCount = 14;
      const cyanSpacing = wireLen / cyanCount;
      // Magenta (lattice) spacing — visually contracted by 1/γ. We map γ to a
      // pixel-density factor; the *visible* contraction caps at γ ≈ 8 for
      // legibility on a 640px canvas, but the HUD formulas use the true γ.
      const visibleG = Math.min(g, 8);
      const magentaSpacing = cyanSpacing / visibleG;

      // Lattice drifts to the left at −β. Pixel-space drift speed: tied to β.
      const vPx = 30 + 90 * b;
      const driftOffset = (-((t * vPx) % magentaSpacing) + magentaSpacing) %
        magentaSpacing;

      // ── wires ─────────────────────────────────────────────────────────
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1.4;
      for (const cy of [cy1, cy2]) {
        ctx.beginPath();
        ctx.moveTo(wireL - 14, cy);
        ctx.lineTo(wireR + 14, cy);
        ctx.stroke();
      }

      // ── magenta lattice (contracted!) drifting left ───────────────────
      const magentaCount = Math.ceil(wireLen / magentaSpacing) + 2;
      for (const cy of [cy1, cy2]) {
        for (let i = -1; i < magentaCount; i++) {
          const x = wireL + i * magentaSpacing - driftOffset;
          if (x < wireL - 4 || x > wireR + 4) continue;
          // trailing ghost (rightward, opposite of motion)
          ctx.fillStyle = "rgba(255, 106, 222, 0.22)";
          ctx.beginPath();
          ctx.arc(x + 5, cy - 5, 2.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "rgba(255, 106, 222, 0.95)";
          ctx.beginPath();
          ctx.arc(x, cy - 5, 3.4, 0, Math.PI * 2);
          ctx.fill();
        }

        // ── cyan electrons — at rest, fixed positions ────────────────────
        for (let i = 0; i < cyanCount + 1; i++) {
          const x = wireL + i * cyanSpacing;
          if (x < wireL - 4 || x > wireR + 4) continue;
          ctx.fillStyle = "rgba(111, 184, 198, 0.95)";
          ctx.beginPath();
          ctx.arc(x, cy + 5, 3.0, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ── current arrow on each wire (lattice drifts LEFT in this frame) ─
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText("← lattice", wireR + 6, cy1 - 12);
      ctx.fillText("← lattice", wireR + 6, cy2 - 12);

      // ── magenta E-field arrows in the gap (Coulomb attraction cue) ────
      const gapMid = (cy1 + cy2) / 2;
      const arrowAlpha = 0.35 + 0.55 * Math.min(1, b * 4);
      const Earrows = 6;
      for (let k = 0; k < Earrows; k++) {
        const x = wireL + ((k + 0.5) / Earrows) * wireLen;
        // top wire pulled DOWN (its own E-field drags the bottom wire
        // toward it; equivalently, both wires feel an attractive E-force)
        drawArrow(
          ctx,
          x,
          cy1 + 14,
          x,
          gapMid - 4,
          `rgba(255, 106, 222, ${arrowAlpha.toFixed(3)})`,
          1.6,
        );
        drawArrow(
          ctx,
          x,
          cy2 - 14,
          x,
          gapMid + 4,
          `rgba(255, 106, 222, ${arrowAlpha.toFixed(3)})`,
          1.6,
        );
      }

      // ── separation marker d ───────────────────────────────────────────
      ctx.strokeStyle = colors.fg3;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(wireL - 24, cy1);
      ctx.lineTo(wireL - 24, cy2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = colors.fg2;
      ctx.textAlign = "right";
      ctx.fillText("d", wireL - 30, (cy1 + cy2) / 2);

      // ── HUD numbers ───────────────────────────────────────────────────
      const v = b * SPEED_OF_LIGHT;
      const I = SCENE_N0 * ELEMENTARY_CHARGE * v;
      const { fMag, fElec } = equivalenceCheck(I, SCENE_N0, v, SCENE_D);
      // ρ_net = e·n0·(γ − 1/γ), evaluated stably as e·n0·β²γ.
      const rhoNet = ELEMENTARY_CHARGE * SCENE_N0 * b * b * g;
      void EPSILON_0; // εₒ is buried inside fElec via the helper

      ctx.fillStyle = colors.fg1;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillText("ELECTRON FRAME — lattice contracts → wires charge up", 14, 22);
      ctx.textAlign = "right";
      ctx.fillStyle = colors.fg2;
      ctx.fillText("ρ_net = e·n₀·(γ − 1/γ)", width - 14, 22);

      ctx.textAlign = "left";
      ctx.fillStyle = colors.fg2;
      ctx.fillText(`β = ${formatBeta(b)}    γ = ${g.toFixed(4)}`, 14, 40);

      ctx.textAlign = "right";
      ctx.fillStyle = colors.fg1;
      ctx.fillText(
        `ρ_net = ${formatSci(rhoNet)} C/m    F_elec = ${formatSci(fElec)} N/m`,
        width - 14,
        height - 12,
      );

      // ── footer key + invariance hint ──────────────────────────────────
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText(
        `lattice spacing × 1/γ${visibleG !== g ? " (visual cap at γ=8)" : ""}`,
        14,
        height - 26,
      );
      ctx.fillText(`F_elec = F_mag = ${formatSci(fMag)} N/m`, 14, height - 12);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <BetaSlider />
      <div className="mt-1 px-2 text-xs text-[var(--color-fg-3)]">
        Same physics, new viewpoint. Cyan electrons sit still; magenta lattice
        drifts left and length-contracts by 1/γ. The crowding of magenta over
        cyan IS the net + density; the magenta arrows in the gap are the new
        Coulomb pull. Slide β past 0.3 and watch the contraction click.
      </div>
    </div>
  );
}
