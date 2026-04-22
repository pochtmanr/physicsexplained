"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.7;
const MAX_HEIGHT = 480;

interface Material {
  name: string;
  chi: number; // dimensionless volume susceptibility (SI, typical room-T value)
  kind: "dia" | "para" | "ferro";
}

// Approximate SI volume susceptibilities at room temperature, drawn from
// standard references (Ashcroft & Mermin, CRC handbook). Iron is 3–4 orders
// of magnitude higher — it's a ferromagnet and we flag it specially.
const MATERIALS: Material[] = [
  { name: "bismuth",       chi: -1.66e-4, kind: "dia"   },
  { name: "graphite",      chi: -1.6e-5,  kind: "dia"   },
  { name: "water",         chi: -9.04e-6, kind: "dia"   },
  { name: "copper",        chi: -9.8e-6,  kind: "dia"   },
  { name: "vacuum",        chi: 0,        kind: "dia"   },
  { name: "aluminum",      chi: +2.2e-5,  kind: "para"  },
  { name: "platinum",      chi: +2.8e-4,  kind: "para"  },
  { name: "manganese",     chi: +9.6e-4,  kind: "para"  },
  { name: "oxygen (gas)",  chi: +1.9e-6,  kind: "para"  },
  { name: "oxygen (liq.)", chi: +3.5e-3,  kind: "para"  },
  { name: "gadolinium",    chi: +4.8e-1,  kind: "para"  },
  { name: "iron (ferro)",  chi: +2e5,     kind: "ferro" },
];

/**
 * A symmetric log-scale bar chart of χ_m for a dozen common materials.
 * Negative χ (diamagnets) grow leftward in cyan; positive χ (paramagnets)
 * grow rightward in magenta; iron is flagged off-scale amber with a caption
 * pointing to §04.3 (ferromagnetism).
 *
 * Hover a bar → numeric χ appears in the HUD.
 */
export function SusceptibilitySpectrumScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 700, height: 460 });
  const hoverRef = useRef<number | null>(null);
  const barBoundsRef = useRef<
    Array<{ x: number; y: number; w: number; h: number }>
  >([]);

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
    onFrame: () => {
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

      const padL = 130; // room for material labels
      const padR = 28;
      const padT = 46;
      const padB = 42;
      const plotW = width - padL - padR;
      const plotH = height - padT - padB;

      // Symmetric-log (symlog) mapping: in log-space around 0. The idea is
      // to make both "tiny negative" and "tiny positive" χ visible on the
      // same axis, with iron clipped at +MAX but clearly labeled.
      const LINTHRESH = 1e-6; // below this, axis is approximately linear
      const LOG_MAX = 5; // decades above LINTHRESH plotted on each side
      const symlog = (x: number) => {
        const s = Math.sign(x);
        const a = Math.abs(x);
        if (a <= LINTHRESH) return s * (a / LINTHRESH);
        return s * (1 + Math.log10(a / LINTHRESH));
      };
      const MAX_SL = 1 + LOG_MAX; // max "symlog units" on each side
      const xOfChi = (chi: number) => {
        const sl = symlog(chi);
        const clamped = Math.max(-MAX_SL, Math.min(MAX_SL, sl));
        return padL + ((clamped + MAX_SL) / (2 * MAX_SL)) * plotW;
      };

      // Axis (mid vertical line at χ = 0).
      const x0 = xOfChi(0);
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x0, padT);
      ctx.lineTo(x0, padT + plotH);
      ctx.stroke();

      // Decade grid lines on the log portion.
      ctx.setLineDash([2, 3]);
      ctx.strokeStyle = "rgba(86, 104, 127, 0.35)";
      for (let d = 1; d <= LOG_MAX; d++) {
        const chiP = LINTHRESH * Math.pow(10, d);
        const chiN = -LINTHRESH * Math.pow(10, d);
        const xp = xOfChi(chiP);
        const xn = xOfChi(chiN);
        ctx.beginPath();
        ctx.moveTo(xp, padT);
        ctx.lineTo(xp, padT + plotH);
        ctx.moveTo(xn, padT);
        ctx.lineTo(xn, padT + plotH);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Axis tick labels.
      ctx.fillStyle = colors.fg3;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      for (let d = 1; d <= LOG_MAX; d += 2) {
        const chiP = LINTHRESH * Math.pow(10, d);
        const chiN = -LINTHRESH * Math.pow(10, d);
        ctx.fillText(
          `+10⁻${6 - d}`,
          xOfChi(chiP),
          padT + plotH + 14,
        );
        ctx.fillText(
          `−10⁻${6 - d}`,
          xOfChi(chiN),
          padT + plotH + 14,
        );
      }
      ctx.fillText("0", x0, padT + plotH + 14);
      ctx.fillStyle = colors.fg2;
      ctx.font = "11px monospace";
      ctx.fillText(
        "volume susceptibility χ_m (dimensionless, symlog)",
        padL + plotW / 2,
        padT + plotH + 30,
      );

      // Bars.
      const n = MATERIALS.length;
      const rowH = plotH / n;
      const barH = Math.min(18, rowH - 6);
      barBoundsRef.current = [];
      for (let i = 0; i < n; i++) {
        const m = MATERIALS[i]!;
        const yCenter = padT + (i + 0.5) * rowH;
        const yTop = yCenter - barH / 2;
        const xEnd = xOfChi(m.chi);
        const barX = Math.min(x0, xEnd);
        const barW = Math.abs(xEnd - x0);

        // Save bounds for hover detection.
        barBoundsRef.current.push({
          x: barX,
          y: yTop,
          w: Math.max(barW, 2),
          h: barH,
        });

        let fill = "#6FB8C6"; // cyan for dia
        if (m.kind === "para") fill = "#FF6ADE"; // magenta for para
        if (m.kind === "ferro") fill = "#FFD66B"; // amber for ferro (flagged)

        ctx.fillStyle = fill;
        ctx.shadowColor = fill;
        ctx.shadowBlur = 6;
        ctx.fillRect(barX, yTop, Math.max(barW, 2), barH);
        ctx.shadowBlur = 0;

        // Material label on the left.
        ctx.fillStyle = colors.fg1;
        ctx.font = "11px monospace";
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillText(m.name, padL - 8, yCenter);
        ctx.textBaseline = "alphabetic";

        // Off-scale mark for iron (ferro).
        if (m.kind === "ferro") {
          ctx.fillStyle = "#FFD66B";
          ctx.font = "11px monospace";
          ctx.textAlign = "left";
          ctx.fillText("→ off-scale  (see §04 ferromagnetism)", xEnd + 6, yCenter + 3);
        }
      }

      // Title / legend.
      ctx.fillStyle = colors.fg1;
      ctx.font = "13px monospace";
      ctx.textAlign = "left";
      ctx.fillText(
        "χ_m at room temperature — the spectrum of quiet magnetism",
        padL,
        20,
      );

      ctx.textAlign = "right";
      ctx.font = "10px monospace";
      ctx.fillStyle = "#6FB8C6";
      ctx.fillText("● diamagnet (χ < 0)", width - padR, 20);
      ctx.fillStyle = "#FF6ADE";
      ctx.fillText("● paramagnet (χ > 0)", width - padR, 34);

      // Hover readout.
      const hoverIdx = hoverRef.current;
      if (hoverIdx !== null) {
        const m = MATERIALS[hoverIdx];
        if (m) {
          ctx.textAlign = "left";
          ctx.fillStyle = colors.fg1;
          ctx.font = "12px monospace";
          ctx.fillText(
            `${m.name}:  χ_m = ${formatChi(m.chi)}  (${m.kind})`,
            padL,
            padT - 6,
          );
        }
      } else {
        ctx.textAlign = "left";
        ctx.fillStyle = colors.fg3;
        ctx.font = "11px monospace";
        ctx.fillText("hover a bar for the numeric value", padL, padT - 6);
      }
    },
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const bounds = barBoundsRef.current;
    for (let i = 0; i < bounds.length; i++) {
      const b = bounds[i]!;
      // Generous y hit-zone so a whole row triggers.
      const yTop = b.y - 8;
      const yBot = b.y + b.h + 8;
      if (mx >= b.x - 6 && mx <= b.x + b.w + 6 && my >= yTop && my <= yBot) {
        hoverRef.current = i;
        return;
      }
    }
    hoverRef.current = null;
  };

  const handleMouseLeave = () => {
    hoverRef.current = null;
  };

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      <p className="mt-2 px-2 text-xs font-mono text-[var(--color-fg-3)]">
        most materials cluster in a narrow band around zero — a few parts per million, plus or minus; iron is a different animal
      </p>
    </div>
  );
}

function formatChi(chi: number): string {
  if (chi === 0) return "0";
  const a = Math.abs(chi);
  const sign = chi < 0 ? "−" : "+";
  if (a >= 1) return `${sign}${a.toFixed(2)}`;
  if (a >= 1e-3) return `${sign}${(a * 1e3).toFixed(2)}·10⁻³`;
  if (a >= 1e-6) return `${sign}${(a * 1e6).toFixed(2)}·10⁻⁶`;
  return `${sign}${a.toExponential(2)}`;
}
