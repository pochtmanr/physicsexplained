"use client";

import { useEffect, useRef, useState } from "react";
import type { Worldline } from "@/lib/physics/relativity/types";
import { SpacetimeDiagramCanvas } from "@/components/physics/_shared";
import { Button } from "@/components/ui/button";
import {
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  hexToRgba,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import {
  isCausallyConnected,
  lightConeBoundary,
  quadrant,
} from "@/lib/physics/relativity/light-cone";

/**
 * FIG.13a — The light cone of an event at the origin.
 *
 * Click anywhere inside the diagram to drop an event. Each event is auto-
 * classified by `quadrant()` and `isCausallyConnected()`:
 *
 *   • cyan dot       — timelike-future (causally reachable from apex)
 *   • magenta dot    — timelike-past   (causally reaches the apex)
 *   • amber dot      — null (on the cone)
 *   • dim dot        — spacelike (elsewhere; no signal connects)
 */

interface DroppedEvent {
  x: number;
  ct: number;
}

const X_RANGE: [number, number] = [-3, 3];
const T_RANGE: [number, number] = [-3, 3];
const MARGIN = 36;

function colorFor(ev: DroppedEvent, tokens: SceneTokens): string {
  const apex = { t: 0, x: 0, y: 0, z: 0 };
  const q = quadrant(apex, { t: ev.ct, x: ev.x, y: 0, z: 0 }, 1);
  switch (q) {
    case "timelike-future":
      return tokens.cyan;
    case "timelike-past":
      return tokens.magenta;
    case "null-future":
    case "null-past":
      return tokens.amber;
    case "spacelike":
      return tokens.textMute;
    default:
      return tokens.textBright;
  }
}

function classifyLabel(ev: DroppedEvent): string {
  const apex = { t: 0, x: 0, y: 0, z: 0 };
  const q = quadrant(apex, { t: ev.ct, x: ev.x, y: 0, z: 0 }, 1);
  const reachable = isCausallyConnected(
    apex,
    { t: ev.ct, x: ev.x, y: 0, z: 0 },
    1,
  );
  switch (q) {
    case "timelike-future":
      return `timelike-future · reachable from origin`;
    case "timelike-past":
      return `timelike-past · could have reached origin`;
    case "null-future":
      return `null-future · on the light cone`;
    case "null-past":
      return `null-past · on the light cone`;
    case "spacelike":
      return `spacelike · elsewhere${reachable ? "" : " · no causal signal"}`;
    default:
      return `origin`;
  }
}

export function LightConeScene() {
  const [events, setEvents] = useState<DroppedEvent[]>([
    { x: 1, ct: 2 },
    { x: 2, ct: 0.5 },
    { x: -1.5, ct: -1.5 },
  ]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();

  const { width: W, height: H } = useSceneSize(containerRef, {
    ratio: 0.7,
    maxHeight: SCENE_HEIGHT_DEFAULT + 40,
    minHeight: 320,
  });

  useEffect(() => {
    const canvas = overlayRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, W, H);
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);

    const plotW = W - 2 * MARGIN;
    const plotH = H - 2 * MARGIN;
    const [xMin, xMax] = X_RANGE;
    const [tMin, tMax] = T_RANGE;
    const xToPx = (x: number) => MARGIN + ((x - xMin) / (xMax - xMin)) * plotW;
    const tToPx = (t: number) =>
      H - MARGIN - ((t - tMin) / (tMax - tMin)) * plotH;

    // Shade future and past cones with amber tint.
    ctx.fillStyle = hexToRgba(tokens.amber, 0.07);
    ctx.beginPath();
    ctx.moveTo(xToPx(0), tToPx(0));
    ctx.lineTo(xToPx(xMin), tToPx(-xMin));
    ctx.lineTo(xToPx(xMax), tToPx(xMax));
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(xToPx(0), tToPx(0));
    ctx.lineTo(xToPx(xMin), tToPx(xMin));
    ctx.lineTo(xToPx(xMax), tToPx(-xMax));
    ctx.closePath();
    ctx.fill();

    for (const ev of events) {
      ctx.fillStyle = colorFor(ev, tokens);
      ctx.beginPath();
      ctx.arc(xToPx(ev.x), tToPx(ev.ct), 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [events, W, H, tokens]);

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    const wrap = wrapperRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const plotW = W - 2 * MARGIN;
    const plotH = H - 2 * MARGIN;
    const [xMin, xMax] = X_RANGE;
    const [tMin, tMax] = T_RANGE;
    if (px < MARGIN || px > W - MARGIN || py < MARGIN || py > H - MARGIN) return;
    const x = xMin + ((px - MARGIN) / plotW) * (xMax - xMin);
    const ct = tMin + ((H - MARGIN - py) / plotH) * (tMax - tMin);
    setEvents((prev) => [...prev, { x, ct }]);
  }

  function clearEvents() {
    setEvents([]);
  }

  const apexMarker: Worldline = {
    events: [
      { t: -0.06, x: 0, y: 0, z: 0 },
      { t: 0.06, x: 0, y: 0, z: 0 },
    ],
    color: tokens.textBright,
    label: "apex",
  };

  return (
    <div ref={containerRef} className="flex w-full flex-col gap-3 pb-4">
      <div
        ref={wrapperRef}
        className="relative cursor-crosshair select-none"
        style={{ width: W, height: H }}
        onClick={handleClick}
      >
        <SpacetimeDiagramCanvas
          worldlines={[apexMarker]}
          xRange={X_RANGE}
          tRange={T_RANGE}
          width={W}
          height={H}
          lightCone
        />
        <canvas
          ref={overlayRef}
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
        />
      </div>
      <div className="flex items-start justify-between gap-3">
        <div className="font-mono text-xs text-[var(--color-fg-2)]">
          <p className="mb-1 text-[var(--color-fg-1)]">
            Click anywhere in the diagram to drop an event. Each is classified
            by its interval relative to the apex (origin).
          </p>
          {events.length === 0 ? (
            <p className="opacity-60">No events yet.</p>
          ) : (
            <ul className="space-y-0.5">
              {events.map((ev, i) => {
                const s2 = ev.ct * ev.ct - ev.x * ev.x;
                return (
                  <li key={i} style={{ color: colorFor(ev, tokens) }}>
                    ({ev.x.toFixed(2)}, {ev.ct.toFixed(2)}) · s² = {s2.toFixed(2)}
                    {" · "}
                    {classifyLabel(ev)}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <Button onClick={clearEvents} className="shrink-0">
          clear
        </Button>
      </div>
      <p className="font-mono text-[10px] text-[var(--color-fg-3)]">
        amber shading · light cones (future above, past below). lightConeBoundary(t, x) = c|t| − |x|, sign tells you the quadrant.
      </p>
      <span className="hidden">
        {events.map((ev, i) => (
          <span key={i}>{lightConeBoundary(ev.ct, ev.x, 1)}</span>
        ))}
      </span>
    </div>
  );
}
