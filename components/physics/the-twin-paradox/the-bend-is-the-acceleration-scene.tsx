"use client";

import { useEffect, useRef, useState } from "react";
import {
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_TALL,
  applyDpr,
  hexToRgba,
  useSceneSize,
  useSceneTokens,
} from "@/components/physics/_shared/scene-tokens";

/**
 * §03.5 THE BEND IS THE ACCELERATION — annotated zoom on the turnaround.
 *
 * A close-up Minkowski (x, ct) plot focused on the turnaround event of the
 * traveling twin. The kink is labeled. The scene's caption: this is the
 * only place in the trip where the twins' frames differ in any meaningful
 * way; everything else is symmetric. The asymmetry is the geometry of the
 * kink, not a force.
 *
 * Slider: turnaround "softening" radius. The kink can be drawn as a sharp
 * corner (idealised) or a finite arc (physical, what you'd get for any real
 * acceleration phase). The proper-time accumulated along the smoothed corner
 * is *less* than along a straight line of the same chord — the bend itself
 * doesn't add proper time, it loses it. The slider lets the reader watch
 * the corner soften without changing the shorter-path conclusion.
 */

const PAD = 36;

export function TheBendIsTheAccelerationScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const { width: WIDTH, height: HEIGHT } = useSceneSize(containerRef, {
    ratio: 0.75,
    maxHeight: SCENE_HEIGHT_TALL,
  });
  // softening radius in (x, ct) units; 0 = sharp corner.
  const [softening, setSoftening] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, WIDTH, HEIGHT);
    if (!ctx) return;
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = tokens.bg;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Plot region.
    const xRange: [number, number] = [-0.5, 2.5];
    const tRange: [number, number] = [0, 4];
    const plotW = WIDTH - 2 * PAD;
    const plotH = HEIGHT - 2 * PAD;
    const xToPx = (x: number) =>
      PAD + ((x - xRange[0]) / (xRange[1] - xRange[0])) * plotW;
    const tToPx = (t: number) =>
      HEIGHT - PAD - ((t - tRange[0]) / (tRange[1] - tRange[0])) * plotH;

    // Grid
    ctx.strokeStyle = tokens.grid;
    ctx.lineWidth = 1;
    for (let x = Math.ceil(xRange[0]); x <= Math.floor(xRange[1]); x++) {
      ctx.beginPath();
      ctx.moveTo(xToPx(x), tToPx(tRange[0]));
      ctx.lineTo(xToPx(x), tToPx(tRange[1]));
      ctx.stroke();
    }
    for (let t = Math.ceil(tRange[0]); t <= Math.floor(tRange[1]); t++) {
      ctx.beginPath();
      ctx.moveTo(xToPx(xRange[0]), tToPx(t));
      ctx.lineTo(xToPx(xRange[1]), tToPx(t));
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = tokens.axes;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(xToPx(0), tToPx(tRange[0]));
    ctx.lineTo(xToPx(0), tToPx(tRange[1]));
    ctx.moveTo(xToPx(xRange[0]), tToPx(0));
    ctx.lineTo(xToPx(xRange[1]), tToPx(0));
    ctx.stroke();
    ctx.fillStyle = tokens.textMute;
    ctx.font = "10px ui-monospace, monospace";
    ctx.fillText("x", xToPx(xRange[1]) - 12, tToPx(0) - 6);
    ctx.fillText("ct", xToPx(0) + 6, tToPx(tRange[1]) + 12);

    // Home twin (cyan) — vertical
    ctx.strokeStyle = tokens.cyan;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(xToPx(0), tToPx(0));
    ctx.lineTo(xToPx(0), tToPx(4));
    ctx.stroke();
    ctx.fillStyle = tokens.cyan;
    ctx.font = "11px ui-monospace, monospace";
    ctx.fillText("home", xToPx(0) - 38, tToPx(3.5));

    // Traveler (orange): outbound (0,0) → turnaround (1.6, 2) → inbound (0, 4).
    const turnaroundX = 1.6;
    const turnaroundT = 2;
    const r = Math.max(0, Math.min(0.9, softening));
    const legLen = Math.sqrt(turnaroundX * turnaroundX + turnaroundT * turnaroundT);
    const fr = r / legLen;
    const aX = turnaroundX * (1 - fr);
    const aT = turnaroundT * (1 - fr);
    const bX = turnaroundX * (1 - fr);
    const bT = turnaroundT * (1 + fr);

    ctx.strokeStyle = tokens.orange;
    ctx.lineWidth = 2.75;
    ctx.beginPath();
    ctx.moveTo(xToPx(0), tToPx(0));
    ctx.lineTo(xToPx(aX), tToPx(aT));
    if (r > 1e-3) {
      ctx.quadraticCurveTo(
        xToPx(turnaroundX),
        tToPx(turnaroundT),
        xToPx(bX),
        tToPx(bT),
      );
    } else {
      ctx.lineTo(xToPx(turnaroundX), tToPx(turnaroundT));
    }
    ctx.lineTo(xToPx(0), tToPx(4));
    ctx.stroke();
    ctx.fillStyle = tokens.orange;
    ctx.fillText("traveler", xToPx(turnaroundX) + 8, tToPx(turnaroundT));

    // Reunion + start dots
    ctx.fillStyle = tokens.textBright;
    for (const ev of [
      { x: 0, t: 0, label: "departure" },
      { x: 0, t: 4, label: "reunion" },
    ]) {
      ctx.beginPath();
      ctx.arc(xToPx(ev.x), tToPx(ev.t), 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = tokens.textDim;
      ctx.font = "10px ui-monospace, monospace";
      ctx.fillText(ev.label, xToPx(ev.x) + 8, tToPx(ev.t) + 4);
      ctx.fillStyle = tokens.textBright;
    }

    // Annotation arrow pointing at the kink
    const kinkPx = xToPx(turnaroundX);
    const kinkPy = tToPx(turnaroundT);
    ctx.strokeStyle = hexToRgba(tokens.amber, 0.9);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const labelX = kinkPx + 90;
    const labelY = kinkPy - 10;
    ctx.moveTo(labelX, labelY);
    ctx.lineTo(kinkPx + 12, kinkPy - 4);
    ctx.stroke();
    // Arrowhead
    ctx.beginPath();
    ctx.moveTo(kinkPx + 12, kinkPy - 4);
    ctx.lineTo(kinkPx + 20, kinkPy - 12);
    ctx.moveTo(kinkPx + 12, kinkPy - 4);
    ctx.lineTo(kinkPx + 22, kinkPy - 2);
    ctx.stroke();

    ctx.fillStyle = tokens.amber;
    ctx.font = "11px ui-monospace, monospace";
    ctx.fillText("THE BEND", labelX + 4, labelY - 4);
    ctx.fillStyle = tokens.textDim;
    ctx.font = "10px ui-monospace, monospace";
    ctx.fillText("= acceleration", labelX + 4, labelY + 10);
    ctx.fillText("= the asymmetry", labelX + 4, labelY + 22);

    // HUD
    ctx.fillStyle = tokens.textDim;
    ctx.font = "11px ui-monospace, monospace";
    ctx.fillText(
      `softening radius r = ${r.toFixed(2)}`,
      PAD,
      HEIGHT - 10,
    );
  }, [softening, tokens, WIDTH, HEIGHT]);

  return (
    <div ref={containerRef} className="flex w-full flex-col items-center gap-3">
      <canvas
        ref={canvasRef}
        style={{ width: WIDTH, height: HEIGHT, display: "block" }}
        className={SCENE_CANVAS_CLASS}
      />
      <label className="flex w-full items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-32">corner radius r</span>
        <input
          type="range"
          min={0}
          max={0.9}
          step={0.01}
          value={softening}
          onChange={(e) => setSoftening(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-amber)" }}
        />
        <span className="w-16">{softening.toFixed(2)}</span>
      </label>
      <p className="w-full text-center font-mono text-[11px] text-[var(--color-fg-3)]">
        The bend is the only frame-asymmetric event in the round trip. Soften
        the corner — the kink remains a kink. The geometry is what aged the
        traveler less, not a force.
      </p>
    </div>
  );
}
