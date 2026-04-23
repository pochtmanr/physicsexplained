"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { skinDepthCopper } from "@/lib/physics/electromagnetism/skin-depth";

const RATIO = 0.48;
const MAX_HEIGHT = 360;

const AMBER = "rgba(255, 180, 80,";
const LILAC = "rgba(200, 160, 255,";
const CYAN = "rgba(120, 220, 255,";

/**
 * FIG.43c — coax cable side view, AC vs DC current distribution.
 *
 * A coaxial cable has an inner conductor (centre) and an outer shield. At
 * DC, current is spread uniformly through the full copper cross-section of
 * both conductors — the whole tube glows.
 *
 * At RF the current crowds:
 *   · on the OUTSIDE of the inner conductor (surface facing the dielectric);
 *   · on the INSIDE of the outer shield (surface facing the dielectric).
 *
 * Both currents live a skin-depth deep, on the facing surfaces. That is
 * why a coax shield works: whatever EM field is present outside the cable
 * cannot penetrate the shield inward, and whatever signal is on the inner
 * conductor cannot radiate outward. The shield thickness just has to be
 * comfortably more than δ at the working frequency — at 1 GHz, a 20-μm
 * copper foil is already ten skin-depths, enough for ~87 dB of isolation.
 *
 * Scene: long rectangle side-view of the coax. Inner conductor is a thin
 * rectangle down the middle, shield is two rectangles above/below, with
 * the dielectric gap between. Current-density gradient is shown by a
 * coloured band on each conductor. Frequency slider + AC/DC toggle.
 */
export function CoaxSkinEffectScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 720, height: 360 });
  const [logF, setLogF] = useState(9); // 1 GHz
  const [isDC, setIsDC] = useState(false);

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

      // Physical scales for the HUD. Inner conductor radius 0.5 mm, shield
      // thickness 0.3 mm — typical RG-58-ish coax.
      const INNER_RADIUS_M = 5e-4;
      const SHIELD_THICKNESS_M = 3e-4;

      const freqHz = Math.pow(10, logF);
      const deltaPhys = isDC ? Infinity : skinDepthCopper(freqHz);

      // ─── Side-view geometry ────────────────────────────────────────────
      const padX = 40;
      const padY = 40;
      const cableX0 = padX;
      const cableX1 = width - padX;
      const cableW = cableX1 - cableX0;
      const cy = height / 2;

      // Relative on-screen thicknesses.
      const innerH = 34;
      const shieldH = 26;
      const gapH = 20;

      const shieldTopY0 = cy - innerH / 2 - gapH - shieldH;
      const shieldTopY1 = cy - innerH / 2 - gapH;
      const innerY0 = cy - innerH / 2;
      const innerY1 = cy + innerH / 2;
      const shieldBotY0 = cy + innerH / 2 + gapH;
      const shieldBotY1 = cy + innerH / 2 + gapH + shieldH;

      // Physical→on-screen scale for inner conductor radius.
      const innerHalf = innerH / 2;
      const deltaOnInner = isDC
        ? innerHalf
        : innerHalf * (deltaPhys / INNER_RADIUS_M);
      const deltaOnShield = isDC
        ? shieldH
        : shieldH * (deltaPhys / SHIELD_THICKNESS_M);

      // Animated dots representing current flow.
      const dotPhase = (t * 80) % 40;

      // ─── Inner conductor: gradient peaked on the OUTSIDE surfaces
      // (facing the dielectric). For DC, just a uniform amber band.
      const drawInner = () => {
        const strips = 18;
        const stripH = innerH / strips;
        for (let i = 0; i < strips; i++) {
          const y = innerY0 + i * stripH;
          const yMid = y + stripH / 2;
          const distFromNearestSurface = Math.min(
            yMid - innerY0,
            innerY1 - yMid,
          );
          let J: number;
          if (isDC) {
            J = 1;
          } else {
            J = Math.exp(-distFromNearestSurface / deltaOnInner);
          }
          ctx.fillStyle = `${AMBER} ${Math.min(0.95, Math.max(0.05, J)).toFixed(3)})`;
          ctx.fillRect(cableX0, y, cableW, stripH);
        }
      };

      // ─── Shield: gradient peaked on the INSIDE surface (facing the gap).
      const drawShield = (y0: number, y1: number, innerFace: "bottom" | "top") => {
        const strips = 12;
        const H = y1 - y0;
        const stripH = H / strips;
        for (let i = 0; i < strips; i++) {
          const y = y0 + i * stripH;
          const yMid = y + stripH / 2;
          const distFromInner =
            innerFace === "bottom" ? y1 - yMid : yMid - y0;
          let J: number;
          if (isDC) {
            J = 1;
          } else {
            J = Math.exp(-distFromInner / deltaOnShield);
          }
          ctx.fillStyle = `${LILAC} ${Math.min(0.9, Math.max(0.04, J)).toFixed(3)})`;
          ctx.fillRect(cableX0, y, cableW, stripH);
        }
      };

      // Dielectric gap (faint)
      ctx.fillStyle = `rgba(80, 80, 100, 0.15)`;
      ctx.fillRect(cableX0, shieldTopY1, cableW, innerY0 - shieldTopY1);
      ctx.fillRect(cableX0, innerY1, cableW, shieldBotY0 - innerY1);

      drawShield(shieldTopY0, shieldTopY1, "bottom");
      drawInner();
      drawShield(shieldBotY0, shieldBotY1, "top");

      // ─── Flow dots on the surfaces (just visual cues of current direction)
      if (!isDC) {
        ctx.fillStyle = `${AMBER} 0.95)`;
        for (let k = 0; k < 10; k++) {
          const x = cableX0 + ((dotPhase + k * 72) % cableW);
          // Outer surface of inner conductor (top)
          ctx.beginPath();
          ctx.arc(x, innerY0 + 3, 2, 0, Math.PI * 2);
          ctx.fill();
          // Outer surface of inner conductor (bottom)
          ctx.beginPath();
          ctx.arc(x, innerY1 - 3, 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = `${LILAC} 0.95)`;
        for (let k = 0; k < 10; k++) {
          // Shield return current flows the other way.
          const x = cableX1 - ((dotPhase + k * 72) % cableW);
          ctx.beginPath();
          ctx.arc(x, shieldTopY1 - 3, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(x, shieldBotY0 + 3, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // DC: modest drift dots sprinkled everywhere.
        ctx.fillStyle = `${AMBER} 0.7)`;
        for (let k = 0; k < 8; k++) {
          const x = cableX0 + ((dotPhase + k * 88) % cableW);
          ctx.beginPath();
          ctx.arc(x, cy, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Outlines
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.strokeRect(cableX0, shieldTopY0, cableW, shieldH);
      ctx.strokeRect(cableX0, innerY0, cableW, innerH);
      ctx.strokeRect(cableX0, shieldBotY0, cableW, shieldH);

      // Labels
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText("outer shield", cableX0, shieldTopY0 - 6);
      ctx.fillText("inner conductor", cableX0, innerY0 - 6);
      ctx.fillText("outer shield", cableX0, shieldBotY1 + 14);
      ctx.textAlign = "right";
      ctx.fillStyle = colors.fg3;
      ctx.fillText("dielectric", cableX1, shieldTopY1 + 14);

      // ─── HUD: freq + δ + verdict
      const prettyFreq = (() => {
        if (freqHz >= 1e9) return `${(freqHz / 1e9).toFixed(2)} GHz`;
        if (freqHz >= 1e6) return `${(freqHz / 1e6).toFixed(2)} MHz`;
        if (freqHz >= 1e3) return `${(freqHz / 1e3).toFixed(2)} kHz`;
        return `${freqHz.toFixed(1)} Hz`;
      })();
      const prettyDelta = (() => {
        if (deltaPhys === Infinity) return "∞ (DC)";
        if (deltaPhys >= 1e-3) return `${(deltaPhys * 1e3).toFixed(3)} mm`;
        if (deltaPhys >= 1e-6) return `${(deltaPhys * 1e6).toFixed(2)} µm`;
        return `${(deltaPhys * 1e9).toFixed(2)} nm`;
      })();

      ctx.textAlign = "left";
      ctx.font = "10px monospace";
      ctx.fillStyle = colors.fg3;
      ctx.fillText(
        isDC ? "MODE: DC" : `MODE: AC @ ${prettyFreq}`,
        padX,
        padY - 18,
      );
      ctx.fillText(`δ = ${prettyDelta}  ·  shield t ≈ 0.3 mm`, padX, padY - 4);

      if (!isDC && deltaPhys < SHIELD_THICKNESS_M) {
        ctx.fillStyle = `${CYAN} 0.95)`;
        ctx.fillText(
          `shield is ${(SHIELD_THICKNESS_M / deltaPhys).toFixed(0)} skin-depths thick → well shielded`,
          padX,
          height - 12,
        );
      } else if (!isDC) {
        ctx.fillStyle = `${AMBER} 0.9)`;
        ctx.fillText(
          `δ ≳ shield thickness → field leaks through`,
          padX,
          height - 12,
        );
      } else {
        ctx.fillStyle = colors.fg3;
        ctx.fillText(
          "DC: full cross-section conducts; shield is just a low-resistance return",
          padX,
          height - 12,
        );
      }
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
