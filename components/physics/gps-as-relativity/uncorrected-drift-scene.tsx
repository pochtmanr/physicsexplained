"use client";

import { useEffect, useRef, useState } from "react";
import {
  SECONDS_PER_DAY,
  uncorrectedDriftKmPerDay,
  uncorrectedDriftMeters,
} from "@/lib/physics/relativity/gps-corrections";

/**
 * §05.3 UNCORRECTED DRIFT
 *
 * If the +38.5 μs/day net correction is not applied, the satellite's
 * timing offset accumulates and the receiver's position fix walks
 * outward at c × Δt ≈ 11.5 km/day. The drift compounds linearly.
 *
 * Display:
 *   • A schematic top-down map. The "true" position sits at the
 *     center; an expanding amber circle shows the magnitude of the
 *     uncorrected position fix at the chosen elapsed time.
 *   • Three labelled milestones around the rim: 1 hour (~480 m),
 *     1 day (~11.5 km), 1 week (~80 km).
 *   • A timeline slider below — "play" sweeps from t = 0 to t = 1
 *     week and the amber circle grows accordingly.
 *
 * Numerical note: the per-day rate is ≈ 11.5 km. After 1 day the
 * receiver believes it is anywhere within an 11.5 km radius. After
 * a week, ~80 km — far enough that GPS would not work for any
 * practical purpose.
 */

const BG = "#0A0C12";
const TEXT_DIM = "rgba(255,255,255,0.65)";
const TEXT_BRIGHT = "rgba(255,255,255,0.92)";
const TEXT_FAINT = "rgba(255,255,255,0.45)";
const AMBER = "#FFB36B";
const CYAN = "#67E8F9";
const RED = "#F87171";

const T_MAX_S = 7 * SECONDS_PER_DAY; // one week
const PLAYBACK_MS = 8000; // 8 seconds of real time spans the full week

const DRIFT_PER_DAY_KM = uncorrectedDriftKmPerDay();
const DRIFT_PER_DAY_M = DRIFT_PER_DAY_KM * 1000;

// Milestones — render fixed annotations on the rim
const MILESTONES = [
  { tSec: 3600, label: "1 hour", color: TEXT_DIM },
  { tSec: 86400, label: "1 day", color: AMBER },
  { tSec: 7 * 86400, label: "1 week", color: RED },
] as const;

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const [t, setT] = useState(86400); // start at 1 day so the figure reads
  const [playing, setPlaying] = useState(false);
  const playStartRef = useRef<{ ts: number; t0: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    draw(ctx, W, H, t);
  }, [t]);

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
    <div className="flex flex-col gap-3">
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: 420, display: "block" }}
        className="rounded-md border border-white/10 bg-[#0A0C12]"
        aria-label="A schematic top-down map showing how a GPS position fix drifts outward over time without the +38 microsecond per day correction. After one hour, ~480 meters; after one day, ~11.5 kilometers; after one week, ~80 kilometers."
      />

      <div className="grid grid-cols-1 gap-3 font-mono text-[11px] text-white/70 sm:grid-cols-3">
        <div className="rounded-md border border-white/15 bg-white/[0.03] p-3">
          <div className="text-white/85">elapsed</div>
          <div className="mt-1 opacity-80">t = {formatTime(t)}</div>
        </div>
        <div className="rounded-md border border-amber-300/20 bg-amber-300/[0.04] p-3">
          <div className="text-amber-300/85">drift radius</div>
          <div className="mt-1 opacity-80">{formatDistance(driftMeters)}</div>
        </div>
        <div className="rounded-md border border-cyan-300/20 bg-cyan-300/[0.04] p-3">
          <div className="text-cyan-300/85">rate</div>
          <div className="mt-1 opacity-80">
            {DRIFT_PER_DAY_KM.toFixed(2)} km / day
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-white/70">
        <button
          type="button"
          onClick={() => {
            if (t >= T_MAX_S) setT(0);
            setPlaying((p) => !p);
          }}
          className="rounded border border-white/20 bg-white/5 px-3 py-1 hover:bg-white/10"
        >
          {playing ? "pause" : t >= T_MAX_S ? "replay" : "play"}
        </button>
        <button
          type="button"
          onClick={() => {
            setPlaying(false);
            setT(0);
          }}
          className="rounded border border-white/20 bg-white/5 px-3 py-1 hover:bg-white/10"
        >
          reset
        </button>
      </div>

      <label className="flex items-center gap-3 font-mono text-xs text-white/70">
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
        />
        <span className="w-20 text-right">{formatTime(t)}</span>
      </label>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  tSec: number,
) {
  // Background
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // Title
  ctx.save();
  ctx.font = "bold 14px ui-monospace, monospace";
  ctx.fillStyle = TEXT_BRIGHT;
  ctx.textAlign = "center";
  ctx.fillText(
    "Without the +38 μs/day correction, your position fix walks away from you",
    W / 2,
    24,
  );
  ctx.font = "10.5px ui-monospace, monospace";
  ctx.fillStyle = TEXT_FAINT;
  ctx.fillText(
    `drift  =  c × Δt  ≈  ${DRIFT_PER_DAY_KM.toFixed(2)} km / day  (linear in elapsed time)`,
    W / 2,
    42,
  );
  ctx.restore();

  // Map area
  const mapTop = 60;
  const mapBottom = H - 80;
  const mapH = mapBottom - mapTop;
  const cx = W / 2;
  const cy = mapTop + mapH / 2;
  const maxRadiusPx = Math.min(W * 0.42, mapH * 0.46);

  // Use 1-week drift as the maximum visible radius
  const driftAtTMax = uncorrectedDriftMeters(T_MAX_S); // ~80 km
  const driftNow = uncorrectedDriftMeters(tSec);
  const radiusPx = (driftNow / driftAtTMax) * maxRadiusPx;

  // Map grid
  drawMapGrid(ctx, cx, cy, maxRadiusPx + 30);

  // Reference rings at milestones
  for (const m of MILESTONES) {
    const driftM = uncorrectedDriftMeters(m.tSec);
    const r = (driftM / driftAtTMax) * maxRadiusPx;
    ctx.save();
    ctx.strokeStyle = `${m.color === TEXT_DIM ? "rgba(255,255,255,0.35)" : m.color}`;
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Label on the rim at 45°
    const lx = cx + r * Math.cos(-Math.PI / 4);
    const ly = cy + r * Math.sin(-Math.PI / 4);
    ctx.save();
    ctx.font = "10px ui-monospace, monospace";
    ctx.fillStyle = m.color;
    ctx.textAlign = "left";
    ctx.fillText(
      `${m.label}  ·  ${formatDistance(driftM)}`,
      lx + 6,
      ly - 4,
    );
    ctx.restore();
  }

  // Animated "now" disk (filled amber, increasing radius)
  ctx.save();
  ctx.fillStyle = AMBER;
  ctx.globalAlpha = 0.18;
  ctx.beginPath();
  ctx.arc(cx, cy, radiusPx, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.85;
  ctx.strokeStyle = AMBER;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, radiusPx, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // True position marker (cyan dot)
  ctx.save();
  ctx.fillStyle = CYAN;
  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.font = "11px ui-monospace, monospace";
  ctx.fillStyle = CYAN;
  ctx.textAlign = "center";
  ctx.fillText("true position", cx, cy + 22);
  ctx.restore();

  // "Believed position" — wandering point on the drift circle (deterministic
  // angle from t so it doesn't jitter)
  const wanderAngle = (tSec / T_MAX_S) * Math.PI * 2 - Math.PI / 3;
  const bx = cx + radiusPx * Math.cos(wanderAngle);
  const by = cy + radiusPx * Math.sin(wanderAngle);
  ctx.save();
  ctx.fillStyle = AMBER;
  ctx.beginPath();
  ctx.arc(bx, by, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Connector
  ctx.setLineDash([2, 3]);
  ctx.strokeStyle = AMBER;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(bx, by);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.font = "11px ui-monospace, monospace";
  ctx.fillStyle = AMBER;
  ctx.textAlign = "center";
  // Place label outside disk
  const labelDir = Math.atan2(by - cy, bx - cx);
  const lx2 = bx + Math.cos(labelDir) * 14;
  const ly2 = by + Math.sin(labelDir) * 14 + 4;
  ctx.fillText("receiver thinks here", lx2, ly2);
  ctx.restore();

  // Bottom caption — current readout
  const capY = H - 28;
  ctx.save();
  ctx.font = "12px ui-monospace, monospace";
  ctx.fillStyle = AMBER;
  ctx.textAlign = "center";
  ctx.fillText(
    `t = ${formatTime(tSec)}   →   drift  ≈  ${formatDistance(driftNow)}`,
    W / 2,
    capY,
  );
  ctx.restore();
}

function drawMapGrid(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rExtent: number,
) {
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  // crosshairs
  ctx.beginPath();
  ctx.moveTo(cx - rExtent, cy);
  ctx.lineTo(cx + rExtent, cy);
  ctx.moveTo(cx, cy - rExtent);
  ctx.lineTo(cx, cy + rExtent);
  ctx.stroke();
  // a few square grid lines
  for (let i = 1; i <= 4; i++) {
    const off = (rExtent / 4) * i;
    ctx.strokeRect(cx - off, cy - off, 2 * off, 2 * off);
  }
  ctx.restore();
}
