"use client";

import { useEffect, useRef, useState } from "react";
import {
  SECONDS_PER_DAY,
  uncorrectedDriftKmPerDay,
  uncorrectedDriftMeters,
} from "@/lib/physics/relativity/gps-corrections";
import {
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_TALL,
  applyDpr,
  hexToRgba,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import { Button } from "@/components/ui/button";

/**
 * §05.3 UNCORRECTED DRIFT
 *
 * Without the +38.5 μs/day correction the GPS position fix walks outward at
 * c × Δt ≈ 11.5 km/day.
 */

const T_MAX_S = 7 * SECONDS_PER_DAY;
const PLAYBACK_MS = 8000;

const DRIFT_PER_DAY_KM = uncorrectedDriftKmPerDay();

interface Milestone {
  tSec: number;
  label: string;
  kind: "muted" | "amber" | "red";
}

const MILESTONES: readonly Milestone[] = [
  { tSec: 3600, label: "1 hour", kind: "muted" },
  { tSec: 86400, label: "1 day", kind: "amber" },
  { tSec: 7 * 86400, label: "1 week", kind: "red" },
];

function formatDistance(m: number): string {
  if (m < 1000) return `${m.toFixed(0)} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

function formatTime(sec: number): string {
  if (sec < 3600) return `${(sec / 60).toFixed(0)} min`;
  if (sec < 86400) return `${(sec / 3600).toFixed(1)} h`;
  return `${(sec / 86400).toFixed(2)} d`;
}

export function UncorrectedDriftScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokens = useSceneTokens();
  const rafRef = useRef<number | null>(null);
  const [t, setT] = useState(86400);
  const [playing, setPlaying] = useState(false);
  const playStartRef = useRef<{ ts: number; t0: number } | null>(null);

  const { width: W, height: H } = useSceneSize(containerRef, {
    ratio: 0.55,
    maxHeight: SCENE_HEIGHT_TALL,
    minHeight: 360,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, W, H);
    if (!ctx) return;
    draw(ctx, tokens, W, H, t);
  }, [t, tokens, W, H]);

  useEffect(() => {
    if (!playing) {
      playStartRef.current = null;
      return;
    }
    const tick = (ts: number) => {
      if (playStartRef.current === null) {
        playStartRef.current = { ts, t0: t >= T_MAX_S ? 0 : t };
      }
      const elapsed = ts - playStartRef.current.ts;
      const tSimSec =
        playStartRef.current.t0 + (elapsed / PLAYBACK_MS) * T_MAX_S;
      if (tSimSec >= T_MAX_S) {
        setT(T_MAX_S);
        setPlaying(false);
        return;
      }
      setT(tSimSec);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, t]);

  const driftMeters = uncorrectedDriftMeters(t);

  return (
    <div ref={containerRef} className="flex w-full flex-col gap-3 pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: W, height: H, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="A schematic top-down map showing how a GPS position fix drifts outward over time without the +38 microsecond per day correction. After one hour, ~480 meters; after one day, ~11.5 kilometers; after one week, ~80 kilometers."
      />

      <div className="grid grid-cols-1 gap-3 font-mono text-[11px] text-[var(--color-fg-2)] sm:grid-cols-3">
        <div
          className="rounded-md border p-3"
          style={{
            borderColor: "var(--color-fg-4)",
            background: "color-mix(in srgb, var(--color-fg-4) 8%, transparent)",
          }}
        >
          <div className="text-[var(--color-fg-1)]">elapsed</div>
          <div className="mt-1 opacity-80">t = {formatTime(t)}</div>
        </div>
        <div
          className="rounded-md border p-3"
          style={{
            borderColor: "color-mix(in srgb, var(--color-amber) 30%, transparent)",
            background: "color-mix(in srgb, var(--color-amber) 6%, transparent)",
          }}
        >
          <div style={{ color: "var(--color-amber)" }}>drift radius</div>
          <div className="mt-1 opacity-80">{formatDistance(driftMeters)}</div>
        </div>
        <div
          className="rounded-md border p-3"
          style={{
            borderColor: "color-mix(in srgb, var(--color-cyan) 30%, transparent)",
            background: "color-mix(in srgb, var(--color-cyan) 6%, transparent)",
          }}
        >
          <div style={{ color: "var(--color-cyan)" }}>rate</div>
          <div className="mt-1 opacity-80">
            {DRIFT_PER_DAY_KM.toFixed(2)} km / day
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (t >= T_MAX_S) setT(0);
            setPlaying((p) => !p);
          }}
        >
          {playing ? "pause" : t >= T_MAX_S ? "replay" : "play"}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setPlaying(false);
            setT(0);
          }}
        >
          reset
        </Button>
      </div>

      <label className="flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-20">elapsed</span>
        <input
          type="range"
          min={0}
          max={T_MAX_S}
          step={60}
          value={t}
          onChange={(e) => {
            setPlaying(false);
            setT(parseFloat(e.target.value));
          }}
          className="flex-1"
          style={{ accentColor: "var(--color-amber)" }}
        />
        <span className="w-20 text-right">{formatTime(t)}</span>
      </label>
    </div>
  );
}

function milestoneColor(tokens: SceneTokens, kind: Milestone["kind"]): string {
  switch (kind) {
    case "muted":
      return tokens.textMute;
    case "amber":
      return tokens.amber;
    case "red":
      return tokens.red;
  }
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  W: number,
  H: number,
  tSec: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.font = "bold 14px ui-monospace, monospace";
  ctx.fillStyle = tokens.textBright;
  ctx.textAlign = "center";
  ctx.fillText(
    "Without the +38 μs/day correction, your position fix walks away from you",
    W / 2,
    24,
  );
  ctx.font = "10.5px ui-monospace, monospace";
  ctx.fillStyle = tokens.textMute;
  ctx.fillText(
    `drift  =  c × Δt  ≈  ${DRIFT_PER_DAY_KM.toFixed(2)} km / day  (linear in elapsed time)`,
    W / 2,
    42,
  );
  ctx.restore();

  const mapTop = 60;
  const mapBottom = H - 80;
  const mapH = mapBottom - mapTop;
  const cx = W / 2;
  const cy = mapTop + mapH / 2;
  const maxRadiusPx = Math.min(W * 0.42, mapH * 0.46);

  const driftAtTMax = uncorrectedDriftMeters(T_MAX_S);
  const driftNow = uncorrectedDriftMeters(tSec);
  const radiusPx = (driftNow / driftAtTMax) * maxRadiusPx;

  drawMapGrid(ctx, tokens, cx, cy, maxRadiusPx + 30);

  for (const m of MILESTONES) {
    const driftM = uncorrectedDriftMeters(m.tSec);
    const r = (driftM / driftAtTMax) * maxRadiusPx;
    const color = milestoneColor(tokens, m.kind);
    ctx.save();
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    const lx = cx + r * Math.cos(-Math.PI / 4);
    const ly = cy + r * Math.sin(-Math.PI / 4);
    ctx.save();
    ctx.font = "10px ui-monospace, monospace";
    ctx.fillStyle = color;
    ctx.textAlign = "left";
    ctx.fillText(`${m.label}  ·  ${formatDistance(driftM)}`, lx + 6, ly - 4);
    ctx.restore();
  }

  // Animated drift disk
  ctx.save();
  ctx.fillStyle = tokens.amber;
  ctx.globalAlpha = 0.18;
  ctx.beginPath();
  ctx.arc(cx, cy, radiusPx, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.85;
  ctx.strokeStyle = tokens.amber;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, radiusPx, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // True position
  ctx.save();
  ctx.fillStyle = tokens.cyan;
  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = tokens.textBright;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.font = "11px ui-monospace, monospace";
  ctx.fillStyle = tokens.cyan;
  ctx.textAlign = "center";
  ctx.fillText("true position", cx, cy + 22);
  ctx.restore();

  // Believed position
  const wanderAngle = (tSec / T_MAX_S) * Math.PI * 2 - Math.PI / 3;
  const bx = cx + radiusPx * Math.cos(wanderAngle);
  const by = cy + radiusPx * Math.sin(wanderAngle);
  ctx.save();
  ctx.fillStyle = tokens.amber;
  ctx.beginPath();
  ctx.arc(bx, by, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = tokens.textBright;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.setLineDash([2, 3]);
  ctx.strokeStyle = tokens.amber;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(bx, by);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.font = "11px ui-monospace, monospace";
  ctx.fillStyle = tokens.amber;
  ctx.textAlign = "center";
  const labelDir = Math.atan2(by - cy, bx - cx);
  const lx2 = bx + Math.cos(labelDir) * 14;
  const ly2 = by + Math.sin(labelDir) * 14 + 4;
  ctx.fillText("receiver thinks here", lx2, ly2);
  ctx.restore();

  const capY = H - 28;
  ctx.save();
  ctx.font = "12px ui-monospace, monospace";
  ctx.fillStyle = tokens.amber;
  ctx.textAlign = "center";
  ctx.fillText(
    `t = ${formatTime(tSec)}   →   drift  ≈  ${formatDistance(driftNow)}`,
    W / 2,
    capY,
  );
  ctx.restore();

  // suppress unused-warning
  void hexToRgba;
}

function drawMapGrid(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  cx: number,
  cy: number,
  rExtent: number,
) {
  ctx.save();
  ctx.strokeStyle = tokens.grid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - rExtent, cy);
  ctx.lineTo(cx + rExtent, cy);
  ctx.moveTo(cx, cy - rExtent);
  ctx.lineTo(cx, cy + rExtent);
  ctx.stroke();
  for (let i = 1; i <= 4; i++) {
    const off = (rExtent / 4) * i;
    ctx.strokeRect(cx - off, cy - off, 2 * off, 2 * off);
  }
  ctx.restore();
}
