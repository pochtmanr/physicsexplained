"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  ManifoldCanvas,
  drawHudReadout,
  useSceneTokens,
} from "@/components/physics/_shared";
import { sphereEmbedding } from "@/lib/physics/relativity/manifolds";
import type { ManifoldEmbedding } from "@/components/physics/_shared";

/**
 * FIG.33a — Great-circle geodesic on a 2-sphere.
 *
 * A unit sphere is rendered with latitude-longitude grid lines.
 * Two endpoints are highlighted in GREEN with a glow. The great-circle
 * arc between them is drawn as a thick AMBER line.
 *
 * Sliders:
 *   • "End latitude" — colatitude θ₂ of the second point [0.1, π-0.1].
 *   • "End longitude" — φ₂ of the second point [0, 2π].
 *   • "Rotate view"   — orbit the sphere.
 *
 * Idle rotation (~30 s cycle) plays when the user isn't dragging the
 * rotate-view slider. The arc-length HUD readout is shown in AMBER.
 */

const EMBED: ManifoldEmbedding = sphereEmbedding(1);

// Fixed start: equator at φ = 0.
const THETA_START = Math.PI / 2;
const PHI_START = 0;

function computeGeodesic(theta2: number, phi2: number): { u: number; v: number }[] {
  const p1x = Math.sin(THETA_START) * Math.cos(PHI_START);
  const p1y = Math.sin(THETA_START) * Math.sin(PHI_START);
  const p1z = Math.cos(THETA_START);
  const p2x = Math.sin(theta2) * Math.cos(phi2);
  const p2y = Math.sin(theta2) * Math.sin(phi2);
  const p2z = Math.cos(theta2);

  let nx = p1y * p2z - p1z * p2y;
  let ny = p1z * p2x - p1x * p2z;
  let nz = p1x * p2y - p1y * p2x;
  const nlen = Math.hypot(nx, ny, nz);
  if (nlen < 1e-9) {
    return Array.from({ length: 65 }, (_, i) => ({
      u: (i / 64) * Math.PI,
      v: PHI_START,
    }));
  }
  nx /= nlen;
  ny /= nlen;
  nz /= nlen;

  const t1x = ny * p1z - nz * p1y;
  const t1y = nz * p1x - nx * p1z;
  const t1z = nx * p1y - ny * p1x;

  const cosAngle = p1x * p2x + p1y * p2y + p1z * p2z;
  const sinAngle = t1x * p2x + t1y * p2y + t1z * p2z;
  const arcAngle = Math.atan2(sinAngle, cosAngle);

  const STEPS = 64;
  const result: { u: number; v: number }[] = [];
  for (let i = 0; i <= STEPS; i++) {
    const s = (i / STEPS) * arcAngle;
    const x = p1x * Math.cos(s) + t1x * Math.sin(s);
    const y = p1y * Math.cos(s) + t1y * Math.sin(s);
    const z = p1z * Math.cos(s) + t1z * Math.sin(s);
    const theta = Math.acos(Math.max(-1, Math.min(1, z)));
    const phi = Math.atan2(y, x);
    result.push({ u: theta, v: phi });
  }
  return result;
}

/** Great-circle arc-length on a unit sphere (= central angle in radians). */
function arcLength(theta2: number, phi2: number): number {
  const cosAngle =
    Math.sin(THETA_START) * Math.sin(theta2) * Math.cos(phi2 - PHI_START) +
    Math.cos(THETA_START) * Math.cos(theta2);
  return Math.acos(Math.max(-1, Math.min(1, cosAngle)));
}

export function GreatCircleGeodesicScene() {
  const tokens = useSceneTokens();
  const [theta2, setTheta2] = useState(Math.PI / 4);
  const [phi2, setPhi2] = useState(Math.PI);
  const [rotY, setRotY] = useState(0.7);
  const [interacting, setInteracting] = useState(false);
  const rafRef = useRef<number>(0);
  const rotYRef = useRef(rotY);

  // Idle slow rotation when user isn't touching the rotate slider.
  useEffect(() => {
    rotYRef.current = rotY;
  }, [rotY]);

  useEffect(() => {
    if (interacting) {
      cancelAnimationFrame(rafRef.current);
      return;
    }
    const PERIOD = 30_000; // ms per full revolution
    let startTime: number | null = null;
    let startRot = rotYRef.current;

    const loop = (t: number) => {
      if (startTime === null) startTime = t;
      const elapsed = t - startTime;
      const delta = (elapsed / PERIOD) * 2 * Math.PI;
      const next = startRot + delta;
      rotYRef.current = next;
      setRotY(next);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [interacting]);

  const geodesicPath = useMemo(() => computeGeodesic(theta2, phi2), [theta2, phi2]);
  const arcLenVal = useMemo(() => arcLength(theta2, phi2), [theta2, phi2]);

  // Endpoint dots rendered as near-zero tangent arrows (visual dots via ManifoldCanvas).
  // GREEN with glow effect via the palette highlight prop is not directly available for
  // two separate points — we pass both as tangentArrows with GREEN color.
  const dotArrows = useMemo(
    () => [
      {
        base: { u: THETA_START, v: PHI_START },
        vector: [0.001, 0] as [number, number],
        color: tokens.green,
        label: "start",
      },
      {
        base: { u: theta2, v: phi2 },
        vector: [0.001, 0] as [number, number],
        color: tokens.green,
        label: "end",
      },
    ],
    [theta2, phi2, tokens.green],
  );

  return (
    <div className="relative w-full">
      <ManifoldCanvas
        embedding={EMBED}
        uRange={[0, Math.PI]}
        vRange={[0, 2 * Math.PI]}
        uSteps={14}
        vSteps={20}
        geodesic={geodesicPath}
        tangentArrows={dotArrows}
        rotationY={rotY}
        onRotationChange={setRotY}
        rotationMin={-Math.PI}
        rotationMax={Math.PI}
        width={500}
        height={380}
        palette={{ highlight: tokens.amber, background: tokens.bg }}
        aria-label="Unit sphere showing a great-circle geodesic arc between two green endpoint dots. The amber arc is the shortest path on the sphere between the chosen endpoints."
      />

      {/* Arc-length HUD readout — rendered in a canvas overlay */}
      <ArcLengthHud arcLen={arcLenVal} amberColor={tokens.amber} dimColor={tokens.textDim} />

      {/* Controls */}
      <div className="mt-3 flex flex-col gap-2">
        <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
          <span className="w-36 shrink-0">End colatitude θ₂</span>
          <input
            type="range"
            min={0.1}
            max={Math.PI - 0.1}
            step={0.01}
            value={theta2}
            onChange={(e) => setTheta2(parseFloat(e.target.value))}
            onMouseDown={() => setInteracting(true)}
            onMouseUp={() => setInteracting(false)}
            onTouchStart={() => setInteracting(true)}
            onTouchEnd={() => setInteracting(false)}
            className="flex-1"
          />
          <span className="w-12 text-right">{theta2.toFixed(2)}</span>
        </div>

        <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
          <span className="w-36 shrink-0">End longitude φ₂</span>
          <input
            type="range"
            min={0}
            max={2 * Math.PI}
            step={0.01}
            value={phi2}
            onChange={(e) => setPhi2(parseFloat(e.target.value))}
            onMouseDown={() => setInteracting(true)}
            onMouseUp={() => setInteracting(false)}
            onTouchStart={() => setInteracting(true)}
            onTouchEnd={() => setInteracting(false)}
            className="flex-1"
          />
          <span className="w-12 text-right">{phi2.toFixed(2)}</span>
        </div>

        <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
          <span className="w-36 shrink-0">Rotate view</span>
          <input
            type="range"
            min={-Math.PI}
            max={Math.PI}
            step={0.01}
            value={rotY}
            onChange={(e) => setRotY(parseFloat(e.target.value))}
            onMouseDown={() => setInteracting(true)}
            onMouseUp={() => setInteracting(false)}
            onTouchStart={() => setInteracting(true)}
            onTouchEnd={() => setInteracting(false)}
            className="flex-1"
          />
          <span className="w-12 text-right">{rotY.toFixed(2)}</span>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex gap-6 font-mono text-xs text-[var(--color-fg-3)]">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-4 rounded" style={{ background: tokens.amber }} />
          great-circle geodesic
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: tokens.green }} />
          endpoints
        </span>
      </div>
    </div>
  );
}

/** Tiny overlay canvas that renders the arc-length HUD readout in AMBER. */
function ArcLengthHud({
  arcLen,
  amberColor,
  dimColor,
}: {
  arcLen: number;
  amberColor: string;
  dimColor: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const W = 180;
    const H = 28;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    drawHudReadout(ctx, 8, 6, "arc-length: ", `${arcLen.toFixed(4)} rad`, dimColor, amberColor);
  }, [arcLen, amberColor, dimColor]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute left-2 top-2"
      aria-hidden="true"
    />
  );
}
