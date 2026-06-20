"use client";

import { useEffect, useRef, useState } from "react";
import {
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import { Button } from "@/components/ui/button";

/**
 * §03.1 WORLDLINE CONSTRUCTION — interactive: click on the diagram to add
 * events; the scene draws straight-line segments between consecutive clicks
 * and reports the slope of each segment as β = dx / d(ct).
 *
 * Pedagogy: the reader builds a piecewise-linear worldline by clicking and
 * watches the slope of each segment numerically. A vertical click pair gives
 * β = 0 (stationary). A 45° pair gives β = ±1 (light-speed). Subluminal
 * worldlines stay between 45° lines — and the scene flashes a red border on
 * the offending segment if the user constructs a superluminal one.
 *
 * Custom Canvas 2D — does not use SpacetimeDiagramCanvas because we need
 * mouse-event handling on the canvas itself.
 */

interface Event {
  /** ct (vertical), in plot units. */
  ct: number;
  /** x (horizontal), in plot units. */
  x: number;
}

const MARGIN = 36;
const X_RANGE: [number, number] = [-2.5, 2.5];
const T_RANGE: [number, number] = [0, 4];

export function WorldlineConstructionScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [events, setEvents] = useState<Event[]>([]);
  const { width: W, height: H } = useSceneSize(containerRef, {
    ratio: 0.7,
    maxHeight: SCENE_HEIGHT_DEFAULT + 40,
    minHeight: 320,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, W, H);
    if (!ctx) return;
    draw(ctx, tokens, W, H, events);
  }, [events, tokens, W, H]);

  function pxToX(px: number) {
    const plotW = W - 2 * MARGIN;
    return X_RANGE[0] + ((px - MARGIN) / plotW) * (X_RANGE[1] - X_RANGE[0]);
  }
  function pxToT(py: number) {
    const plotH = H - 2 * MARGIN;
    return T_RANGE[0] + ((H - MARGIN - py) / plotH) * (T_RANGE[1] - T_RANGE[0]);
  }

  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const x = pxToX(px);
    const ct = pxToT(py);
    if (x < X_RANGE[0] || x > X_RANGE[1] || ct < T_RANGE[0] || ct > T_RANGE[1]) {
      return;
    }
    setEvents((prev) => [...prev, { x, ct }]);
  }

  function handleClear() {
    setEvents([]);
  }

  // Compute slopes for the HUD readout.
  const segments = events.slice(1).map((p2, i) => {
    const p1 = events[i];
    const dct = p2.ct - p1.ct;
    const dx = p2.x - p1.x;
    const slope = dct === 0 ? Infinity : dx / dct;
    return { i, slope };
  });

  return (
    <div ref={containerRef} className="flex w-full flex-col gap-3 pb-4">
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        style={{ width: W, height: H, display: "block" }}
        className={`${SCENE_CANVAS_CLASS} cursor-crosshair`}
      />
      <div className="flex items-center justify-between gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span>
          click to add events · {events.length} placed · 45° lines = light cone
        </span>
        <Button size="sm" onClick={handleClear}>
          clear
        </Button>
      </div>
      {segments.length > 0 ? (
        <div className="rounded-md border border-[var(--color-fg-4)] p-3 font-mono text-[11px] text-[var(--color-fg-2)]">
          <div className="mb-1 text-[var(--color-fg-3)]">SEGMENT SLOPES (= β = v/c)</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 sm:grid-cols-3">
            {segments.map(({ i, slope }) => {
              const supra = Math.abs(slope) > 1;
              const text = !Number.isFinite(slope)
                ? "∞ (instantaneous jump)"
                : `β = ${slope.toFixed(3)}`;
              return (
                <div
                  key={i}
                  style={{ color: supra ? "var(--color-red)" : "var(--color-cyan)" }}
                >
                  seg {i + 1}: {text}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-md border border-[var(--color-fg-4)] p-3 font-mono text-[11px] text-[var(--color-fg-3)]">
          place at least two events to read off slopes.
        </div>
      )}
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  W: number,
  H: number,
  events: Event[],
) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const plotW = W - 2 * MARGIN;
  const plotH = H - 2 * MARGIN;
  const xToPx = (x: number) =>
    MARGIN + ((x - X_RANGE[0]) / (X_RANGE[1] - X_RANGE[0])) * plotW;
  const tToPx = (t: number) =>
    H - MARGIN - ((t - T_RANGE[0]) / (T_RANGE[1] - T_RANGE[0])) * plotH;

  // Grid
  ctx.strokeStyle = tokens.grid;
  ctx.lineWidth = 1;
  for (let x = Math.ceil(X_RANGE[0]); x <= Math.floor(X_RANGE[1]); x++) {
    ctx.beginPath();
    ctx.moveTo(xToPx(x), tToPx(T_RANGE[0]));
    ctx.lineTo(xToPx(x), tToPx(T_RANGE[1]));
    ctx.stroke();
  }
  for (let t = Math.ceil(T_RANGE[0]); t <= Math.floor(T_RANGE[1]); t++) {
    ctx.beginPath();
    ctx.moveTo(xToPx(X_RANGE[0]), tToPx(t));
    ctx.lineTo(xToPx(X_RANGE[1]), tToPx(t));
    ctx.stroke();
  }

  // Lab axes
  ctx.strokeStyle = tokens.axes;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(xToPx(0), tToPx(T_RANGE[0]));
  ctx.lineTo(xToPx(0), tToPx(T_RANGE[1]));
  ctx.moveTo(xToPx(X_RANGE[0]), tToPx(0));
  ctx.lineTo(xToPx(X_RANGE[1]), tToPx(0));
  ctx.stroke();

  // Light cone
  ctx.strokeStyle = tokens.amber;
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.moveTo(xToPx(X_RANGE[0]), tToPx(-X_RANGE[0]));
  ctx.lineTo(xToPx(X_RANGE[1]), tToPx(X_RANGE[1]));
  ctx.moveTo(xToPx(X_RANGE[0]), tToPx(X_RANGE[0]));
  ctx.lineTo(xToPx(X_RANGE[1]), tToPx(-X_RANGE[1]));
  ctx.stroke();
  ctx.setLineDash([]);

  // Worldline segments — cyan if subluminal, red if superluminal.
  for (let i = 0; i < events.length - 1; i++) {
    const p1 = events[i];
    const p2 = events[i + 1];
    const dct = p2.ct - p1.ct;
    const dx = p2.x - p1.x;
    const slope = dct === 0 ? Infinity : dx / dct;
    const superluminal = Math.abs(slope) > 1;
    ctx.strokeStyle = superluminal ? tokens.red : tokens.cyan;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(xToPx(p1.x), tToPx(p1.ct));
    ctx.lineTo(xToPx(p2.x), tToPx(p2.ct));
    ctx.stroke();
  }

  // Event dots
  for (const ev of events) {
    ctx.fillStyle = tokens.textBright;
    ctx.beginPath();
    ctx.arc(xToPx(ev.x), tToPx(ev.ct), 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Axis labels
  ctx.fillStyle = tokens.textMute;
  ctx.font = "11px ui-monospace, monospace";
  ctx.fillText("x", xToPx(X_RANGE[1]) - 14, tToPx(0) - 6);
  ctx.fillText("ct", xToPx(0) + 6, tToPx(T_RANGE[1]) + 14);
}
