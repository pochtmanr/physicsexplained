"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

/**
 * FIG.34a — Maxwell's four equations, side by side.
 *
 * A 4-row table. Row = one equation. Columns:
 *   1) integral form
 *   2) differential form
 *   3) one-sentence plain-words summary
 *   4) iconic example (hover/active row lights its highlight + updates footer)
 *
 * Rotates the "active row" on a slow 3-second beat and draws a soft accent bar
 * on the active row. Tapping a row pins the selection. Bottom footer shows the
 * canonical example for the active row (Gauss → point charge; no-monopole →
 * compass needle; Faraday → transformer; Ampère–Maxwell → light itself).
 *
 * Colour key:
 *   magenta `#FF6ADE`           — sources of E (Gauss line)
 *   cyan    `#7ADCFF`           — no-monopole line
 *   green   `rgba(120,255,170)` — induction (Faraday line)
 *   lilac   `rgba(200,160,255)` — displacement current (Ampère–Maxwell line)
 */

const ACCENTS = [
  "#FF6ADE", // Gauss — sources of E
  "#7ADCFF", // no monopoles
  "rgba(120, 255, 170, 0.95)", // Faraday
  "rgba(200, 160, 255, 0.95)", // Ampère–Maxwell
] as const;

const ROWS = [
  {
    integral: "\u222E E \u00B7 dA  =  Q_enc / \u03B5\u2080",
    differential: "\u2207 \u00B7 E  =  \u03C1 / \u03B5\u2080",
    plain: "Charges are the sources of E.",
    example: "Gauss \u2192 point charge: flux out of every sphere is the same.",
  },
  {
    integral: "\u222E B \u00B7 dA  =  0",
    differential: "\u2207 \u00B7 B  =  0",
    plain: "Magnetic field lines never end.",
    example: "No monopoles \u2192 a compass needle has two poles, not one.",
  },
  {
    integral: "\u222E E \u00B7 d\u2113  =  \u2212 d\u03A6_B / dt",
    differential: "\u2207 \u00D7 E  =  \u2212 \u2202B / \u2202t",
    plain: "A changing B makes an E that curls around it.",
    example: "Faraday \u2192 every transformer on the grid.",
  },
  {
    integral:
      "\u222E B \u00B7 d\u2113  =  \u03BC\u2080 ( I_enc + \u03B5\u2080 d\u03A6_E / dt )",
    differential:
      "\u2207 \u00D7 B  =  \u03BC\u2080 ( J + \u03B5\u2080 \u2202E / \u2202t )",
    plain: "Currents and changing E both make B curl.",
    example: "Amp\u00E8re\u2013Maxwell \u2192 light itself.",
  },
] as const;

export function MaxwellTableScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 720, height: 420 });
  const [pinned, setPinned] = useState<number | null>(null);
  const autoIdxRef = useRef(0);
  const tRef = useRef(0);

  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          setSize({ width: w, height: Math.min(Math.max(w * 0.58, 380), 500) });
        }
      }
    });
    ro.observe(c);
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

      tRef.current += dt;
      if (tRef.current > 3) {
        tRef.current = 0;
        autoIdxRef.current = (autoIdxRef.current + 1) % ROWS.length;
      }
      const active = pinned ?? autoIdxRef.current;

      ctx.clearRect(0, 0, width, height);

      // Layout
      const padX = 18;
      const headerY = 10;
      const headerH = 28;
      const footerH = 54;
      const rowsTop = headerY + headerH + 6;
      const rowsBottom = height - footerH - 10;
      const rowH = (rowsBottom - rowsTop) / ROWS.length;

      const col1X = padX + 24; // integral
      const col2X = padX + width * 0.44; // differential
      const col3X = padX + width * 0.72; // plain summary
      // col4 is a small icon column at the right
      const iconX = width - padX - 22;

      // Header
      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillText("INTEGRAL FORM", col1X, headerY + 14);
      ctx.fillText("DIFFERENTIAL FORM", col2X, headerY + 14);
      ctx.fillText("IN PLAIN WORDS", col3X, headerY + 14);
      ctx.fillText("ICON", iconX - 14, headerY + 14);
      // header rule
      ctx.strokeStyle = colors.fg3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padX, headerY + headerH);
      ctx.lineTo(width - padX, headerY + headerH);
      ctx.stroke();

      // Rows
      ctx.font = "12px monospace";
      for (let i = 0; i < ROWS.length; i++) {
        const row = ROWS[i];
        const yTop = rowsTop + i * rowH;
        const yMid = yTop + rowH / 2;
        const isActive = i === active;

        // Highlight bar on active row
        if (isActive) {
          ctx.fillStyle = "rgba(255,255,255,0.04)";
          ctx.fillRect(padX, yTop + 2, width - 2 * padX, rowH - 4);
          // left accent stripe
          ctx.fillStyle = ACCENTS[i];
          ctx.fillRect(padX, yTop + 2, 3, rowH - 4);
        }

        // Separator line under each row (except the last)
        if (i < ROWS.length - 1) {
          ctx.strokeStyle = colors.fg3;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(padX, yTop + rowH);
          ctx.lineTo(width - padX, yTop + rowH);
          ctx.stroke();
        }

        // Row number bubble
        ctx.fillStyle = isActive ? ACCENTS[i] : colors.fg3;
        ctx.beginPath();
        ctx.arc(padX + 12, yMid, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = isActive ? "#0A0A0F" : colors.fg1;
        ctx.font = "bold 11px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(i + 1), padX + 12, yMid + 1);

        // Integral form
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.font = "13px monospace";
        ctx.fillStyle = isActive ? colors.fg0 : colors.fg1;
        ctx.fillText(row.integral, col1X, yMid);

        // Differential form
        ctx.font = "13px monospace";
        ctx.fillStyle = isActive ? colors.fg0 : colors.fg1;
        ctx.fillText(row.differential, col2X, yMid);

        // Plain words
        ctx.font = "11px monospace";
        ctx.fillStyle = isActive ? colors.fg0 : colors.fg2;
        wrapText(ctx, row.plain, col3X, yMid, width - padX - col3X - 40, 13);

        // Icon column — draw a 20x20 glyph
        drawIcon(ctx, iconX, yMid, i, isActive, ACCENTS[i], colors.fg2);
      }

      // Footer — canonical example
      const footerY = height - footerH + 6;
      ctx.strokeStyle = colors.fg3;
      ctx.beginPath();
      ctx.moveTo(padX, footerY);
      ctx.lineTo(width - padX, footerY);
      ctx.stroke();

      ctx.fillStyle = colors.fg2;
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillText("EXAMPLE", padX, footerY + 14);

      ctx.fillStyle = ACCENTS[active];
      ctx.font = "12px monospace";
      ctx.fillText(ROWS[active].example, padX, footerY + 32);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-2">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
        onClick={(e) => {
          const rect = canvasRef.current?.getBoundingClientRect();
          if (!rect) return;
          const y = e.clientY - rect.top;
          const headerH = 28 + 10;
          const footerH = 54 + 10;
          const rowsTop = headerH;
          const rowsBottom = size.height - footerH;
          if (y < rowsTop || y > rowsBottom) {
            setPinned(null);
            return;
          }
          const rowH = (rowsBottom - rowsTop) / ROWS.length;
          const idx = Math.max(
            0,
            Math.min(ROWS.length - 1, Math.floor((y - rowsTop) / rowH)),
          );
          setPinned((cur) => (cur === idx ? null : idx));
        }}
      />
      <div className="mt-1 px-2 font-mono text-[10px] text-[var(--color-fg-3)]">
        tap a row to pin it; tap again to release
      </div>
    </div>
  );
}

function drawIcon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  idx: number,
  active: boolean,
  accent: string,
  subdued: string,
) {
  ctx.save();
  ctx.strokeStyle = active ? accent : subdued;
  ctx.fillStyle = active ? accent : subdued;
  ctx.lineWidth = 1.4;

  if (idx === 0) {
    // Gauss — point charge with field lines pointing outward through a sphere
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.stroke();
    // center dot
    ctx.beginPath();
    ctx.arc(cx, cy, 2, 0, Math.PI * 2);
    ctx.fill();
    // four outward arrows
    const arr = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const;
    for (const [dx, dy] of arr) {
      const tipX = cx + dx * 13;
      const tipY = cy + dy * 13;
      const tailX = cx + dx * 4;
      const tailY = cy + dy * 4;
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(tipX, tipY);
      ctx.stroke();
    }
  } else if (idx === 1) {
    // No monopoles — a bar with N and S
    ctx.strokeRect(cx - 11, cy - 5, 22, 10);
    ctx.font = "9px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("N", cx - 6, cy + 1);
    ctx.fillText("S", cx + 6, cy + 1);
  } else if (idx === 2) {
    // Faraday — curl arrow
    ctx.beginPath();
    ctx.arc(cx, cy, 9, 0.3, Math.PI * 1.7);
    ctx.stroke();
    // arrow head tangent at end angle
    const a = Math.PI * 1.7;
    const tipX = cx + Math.cos(a) * 9;
    const tipY = cy + Math.sin(a) * 9;
    const tanX = -Math.sin(a);
    const tanY = Math.cos(a);
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(
      tipX - tanX * 5 - Math.cos(a) * 3,
      tipY - tanY * 5 - Math.sin(a) * 3,
    );
    ctx.lineTo(
      tipX - tanX * 5 + Math.cos(a) * 3,
      tipY - tanY * 5 + Math.sin(a) * 3,
    );
    ctx.closePath();
    ctx.fill();
  } else {
    // Ampère–Maxwell — curl + displacement arrow (wavy E → B curl)
    ctx.beginPath();
    ctx.arc(cx + 3, cy, 8, 0.3, Math.PI * 1.6);
    ctx.stroke();
    // displacement-current hint: a small straight arrow
    ctx.beginPath();
    ctx.moveTo(cx - 11, cy + 8);
    ctx.lineTo(cx - 11, cy - 8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 11, cy - 8);
    ctx.lineTo(cx - 13, cy - 4);
    ctx.moveTo(cx - 11, cy - 8);
    ctx.lineTo(cx - 9, cy - 4);
    ctx.stroke();
  }
  ctx.restore();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth) {
      if (line) lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  const totalH = lines.length * lineHeight;
  let yy = y - totalH / 2 + lineHeight / 2;
  for (const l of lines) {
    ctx.fillText(l, x, yy);
    yy += lineHeight;
  }
}
