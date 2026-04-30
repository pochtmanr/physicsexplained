"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  EARTH_RADIUS_M,
  GPS_ORBIT_RADIUS_M,
  gpsOrbitalSpeed,
  grCorrectionSecondsPerDay,
  netCorrectionMicrosecondsPerDay,
  srCorrectionSecondsPerDay,
} from "@/lib/physics/relativity/gps-corrections";

/**
 * §05.3 GPS ORBIT — FIG.23, the §05 money shot.
 *
 * Top-down Canvas 2D view of Earth and a GPS satellite on a circular
 * orbit at 20,200 km altitude. Two clock readouts:
 *   • ground clock (sea level)
 *   • satellite clock (orbiting)
 * Below the orbit, a stacked bar:
 *   • SR contribution: red descending (slows by ~7 μs/day)
 *   • GR contribution: green ascending (speeds by ~46 μs/day)
 *   • net: amber band (+38 μs/day)
 *
 * The orbital position slider (or play/pause) is purely cosmetic — for a
 * circular orbit the corrections are constant. The visual is the
 * permanent fact: at every angle, the satellite clock gains 38 μs/day
 * relative to the ground.
 *
 * Scene-color conventions:
 *   • cyan/blue — ground reference frame (stationary)
 *   • amber — satellite trajectory (the "moving" frame, but colour-coded
 *     amber per the §03 light/photon/satellite convention)
 *   • red — SR slowing
 *   • green — GR speeding
 */

const BG = "#0A0C12";
const TEXT_DIM = "rgba(255,255,255,0.65)";
const TEXT_BRIGHT = "rgba(255,255,255,0.92)";
const CYAN = "#67E8F9";
const AMBER = "#FFB36B";
const RED = "#F87171";
const GREEN = "#4ADE80";
const EARTH_BLUE = "#3B82F6";
const EARTH_GREEN = "#22C55E";

const ORBIT_PERIOD_MS = 16_000; // 16s per orbit on screen — purely cosmetic

const ORBITAL_SPEED_MS = gpsOrbitalSpeed();
const SR_US_PER_DAY = srCorrectionSecondsPerDay(ORBITAL_SPEED_MS) * 1e6; // ≈ −7.21
const GR_US_PER_DAY = grCorrectionSecondsPerDay(GPS_ORBIT_RADIUS_M) * 1e6; // ≈ +45.72
const NET_US_PER_DAY = netCorrectionMicrosecondsPerDay(); // ≈ +38.51

// Visual orbit ratio: GPS_ORBIT_RADIUS / EARTH_RADIUS ≈ 4.17. We squash it
// slightly for the canvas (use ratio 3.0) so both Earth and orbit are visible
// at readable sizes.
const VISUAL_ORBIT_RATIO = 3.0;

export function GpsOrbitScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [angleDeg, setAngleDeg] = useState(0); // 0..360, controlled via slider when paused

  const orbitalSpeedKmS = useMemo(() => ORBITAL_SPEED_MS / 1000, []);
  const beta = useMemo(() => ORBITAL_SPEED_MS / 2.99792458e8, []);

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

    let startTs: number | null = null;
    let lastAngleAtPauseDeg = angleDeg;

    const tick = (ts: number) => {
      if (startTs === null) startTs = ts;
      let currentAngleDeg: number;
      if (paused) {
        currentAngleDeg = angleDeg;
      } else {
        const elapsed = ts - startTs;
        currentAngleDeg = (lastAngleAtPauseDeg + (elapsed / ORBIT_PERIOD_MS) * 360) % 360;
      }
      draw(ctx, W, H, currentAngleDeg);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [paused, angleDeg]);

  return (
    <div className="flex flex-col gap-3">
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: 460, display: "block" }}
        className="rounded-md border border-white/10 bg-[#0A0C12]"
        aria-label="A top-down view of Earth with a GPS satellite orbiting at 20,200 km altitude. Bars below show the SR clock-slowing (-7 microseconds per day) and GR clock-speeding (+46 microseconds per day) corrections, with a net of +38 microseconds per day."
      />

      <div className="grid grid-cols-1 gap-3 font-mono text-[11px] text-white/70 sm:grid-cols-3">
        <div className="rounded-md border border-red-300/20 bg-red-300/[0.04] p-3">
          <div className="text-red-300/85">SR · kinematic dilation</div>
          <div className="mt-1 opacity-80">
            Δτ_SR ≈ {SR_US_PER_DAY.toFixed(2)} μs/day
          </div>
          <div className="opacity-60">moving clock runs slow</div>
        </div>
        <div className="rounded-md border border-emerald-300/20 bg-emerald-300/[0.04] p-3">
          <div className="text-emerald-300/85">GR · gravitational dilation</div>
          <div className="mt-1 opacity-80">
            Δτ_GR ≈ +{GR_US_PER_DAY.toFixed(2)} μs/day
          </div>
          <div className="opacity-60">higher Φ → clock runs fast</div>
        </div>
        <div className="rounded-md border border-amber-300/20 bg-amber-300/[0.04] p-3">
          <div className="text-amber-300/85">NET · receiver correction</div>
          <div className="mt-1 opacity-80">
            Δτ ≈ +{NET_US_PER_DAY.toFixed(2)} μs/day
          </div>
          <div className="opacity-60">programmed into every GPS</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-white/70">
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          className="rounded border border-white/20 bg-white/5 px-3 py-1 hover:bg-white/10"
        >
          {paused ? "play" : "pause"}
        </button>
        <span className="opacity-70">
          v ≈ {orbitalSpeedKmS.toFixed(2)} km/s · β ≈ {beta.toExponential(2)}
        </span>
      </div>

      <label className="flex items-center gap-3 font-mono text-xs text-white/70">
        <span className="w-32">orbit angle (cosmetic)</span>
        <input
          type="range"
          min={0}
          max={360}
          step={1}
          value={Math.round(angleDeg)}
          onChange={(e) => {
            setPaused(true);
            setAngleDeg(parseFloat(e.target.value));
          }}
          className="flex-1"
          disabled={!paused}
        />
        <span className="w-16 text-right">{Math.round(angleDeg)}°</span>
      </label>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  angleDeg: number,
) {
  // Background
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // Orbit panel: top 2/3
  const orbitPanelH = H * 0.62;
  const orbitCx = W / 2;
  const orbitCy = orbitPanelH / 2 + 8;

  // Choose Earth radius in pixels so the orbit fits with margin.
  const orbitRadiusPx = Math.min(W * 0.32, orbitPanelH * 0.42);
  const earthRadiusPx = orbitRadiusPx / VISUAL_ORBIT_RATIO;

  // Background star field (subtle)
  drawStars(ctx, W, orbitPanelH, orbitCx, orbitCy, orbitRadiusPx);

  // Orbit ring
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.setLineDash([3, 4]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(orbitCx, orbitCy, orbitRadiusPx, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // Earth disk
  drawEarth(ctx, orbitCx, orbitCy, earthRadiusPx);

  // Ground observer marker (top of Earth disk)
  const groundX = orbitCx;
  const groundY = orbitCy - earthRadiusPx;
  ctx.save();
  ctx.fillStyle = CYAN;
  ctx.beginPath();
  ctx.arc(groundX, groundY, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  // Ground-clock label
  ctx.save();
  ctx.font = "11px ui-monospace, monospace";
  ctx.fillStyle = CYAN;
  ctx.textAlign = "center";
  ctx.fillText("ground clock", groundX, groundY - 10);
  ctx.restore();

  // Satellite position
  const angleRad = (angleDeg * Math.PI) / 180 - Math.PI / 2; // start at top
  const satX = orbitCx + orbitRadiusPx * Math.cos(angleRad);
  const satY = orbitCy + orbitRadiusPx * Math.sin(angleRad);

  // Faint trail behind the satellite (last 90°)
  ctx.save();
  ctx.strokeStyle = "rgba(255,179,107,0.35)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  const trailStart = angleRad - Math.PI / 2;
  ctx.arc(orbitCx, orbitCy, orbitRadiusPx, trailStart, angleRad);
  ctx.stroke();
  ctx.restore();

  // Satellite glyph
  drawSatellite(ctx, satX, satY, angleRad);

  // Satellite-clock label
  ctx.save();
  ctx.font = "11px ui-monospace, monospace";
  ctx.fillStyle = AMBER;
  ctx.textAlign = "center";
  const labelOffset = 18;
  const lx = satX + Math.cos(angleRad) * labelOffset * 1.4;
  const ly = satY + Math.sin(angleRad) * labelOffset * 1.4;
  ctx.fillText("satellite clock", lx, ly);
  ctx.restore();

  // Altitude bracket annotation
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 3]);
  ctx.beginPath();
  ctx.moveTo(orbitCx + earthRadiusPx, orbitCy);
  ctx.lineTo(orbitCx + orbitRadiusPx, orbitCy);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = "10px ui-monospace, monospace";
  ctx.fillStyle = TEXT_DIM;
  ctx.textAlign = "left";
  ctx.fillText(
    "altitude  20 200 km",
    orbitCx + earthRadiusPx + 8,
    orbitCy - 6,
  );
  ctx.fillText(
    `r = R⊕ + h ≈ 26 571 km`,
    orbitCx + earthRadiusPx + 8,
    orbitCy + 10,
  );
  ctx.restore();

  // Title
  ctx.save();
  ctx.font = "bold 14px ui-monospace, monospace";
  ctx.fillStyle = TEXT_BRIGHT;
  ctx.textAlign = "center";
  ctx.fillText("GPS satellite — two relativistic corrections, all day, every day", W / 2, 22);
  ctx.restore();

  // Correction-bar panel: bottom 1/3
  const barPanelTop = orbitPanelH + 8;
  drawCorrectionBars(ctx, W, barPanelTop, H - barPanelTop - 8);
}

function drawEarth(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
) {
  // Ocean disk gradient
  ctx.save();
  const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
  grad.addColorStop(0, "#3F8AFB");
  grad.addColorStop(0.7, EARTH_BLUE);
  grad.addColorStop(1, "#1B3A7A");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Continent blobs (decorative — not geographically accurate)
  ctx.fillStyle = EARTH_GREEN;
  ctx.globalAlpha = 0.55;
  // Africa-ish blob
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.15, cy + r * 0.05, r * 0.22, r * 0.35, -0.3, 0, Math.PI * 2);
  ctx.fill();
  // Eurasia-ish blob
  ctx.beginPath();
  ctx.ellipse(cx + r * 0.25, cy - r * 0.25, r * 0.32, r * 0.18, 0.3, 0, Math.PI * 2);
  ctx.fill();
  // Americas-ish blob
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.45, cy - r * 0.1, r * 0.18, r * 0.32, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Limb
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawSatellite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angleRad: number,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angleRad);
  // Body
  ctx.fillStyle = AMBER;
  ctx.fillRect(-5, -5, 10, 10);
  // Solar panels
  ctx.fillStyle = "#5BA8F5";
  ctx.fillRect(-16, -3, 10, 6);
  ctx.fillRect(6, -3, 10, 6);
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 0.5;
  ctx.strokeRect(-16, -3, 10, 6);
  ctx.strokeRect(6, -3, 10, 6);
  // Glow
  ctx.shadowColor = AMBER;
  ctx.shadowBlur = 12;
  ctx.fillStyle = AMBER;
  ctx.beginPath();
  ctx.arc(0, 0, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawStars(
  ctx: CanvasRenderingContext2D,
  W: number,
  panelH: number,
  cx: number,
  cy: number,
  rExclude: number,
) {
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  // Deterministic pseudo-random so the pattern is stable across renders
  let seed = 17;
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let i = 0; i < 60; i++) {
    const x = rnd() * W;
    const y = rnd() * panelH;
    const dx = x - cx;
    const dy = y - cy;
    if (Math.hypot(dx, dy) < rExclude * 1.05) continue;
    const a = 0.2 + rnd() * 0.5;
    ctx.globalAlpha = a;
    const sz = rnd() < 0.85 ? 0.9 : 1.6;
    ctx.fillRect(x, y, sz, sz);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawCorrectionBars(
  ctx: CanvasRenderingContext2D,
  W: number,
  top: number,
  height: number,
) {
  // Layout: an SR bar (red, descending below zero), a GR bar (green,
  // ascending above zero), and a net amber tick. We render a single
  // horizontal axis with zero in the middle.
  const padX = 36;
  const axisY = top + height / 2;
  const axisLeft = padX;
  const axisRight = W - padX;

  // Background
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  ctx.fillRect(8, top + 2, W - 16, height - 4);
  ctx.restore();

  // Pick scale: max amplitude = 50 μs/day for headroom
  const maxAbs = 50;
  const halfH = (height - 32) / 2;

  // Axis line
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(axisLeft, axisY);
  ctx.lineTo(axisRight, axisY);
  ctx.stroke();
  ctx.restore();

  // Bar geometry
  const barWidth = 64;
  const slot = (axisRight - axisLeft) / 4;
  const srX = axisLeft + slot * 1 - barWidth / 2;
  const grX = axisLeft + slot * 2 - barWidth / 2;
  const netX = axisLeft + slot * 3 - barWidth / 2;

  // SR bar (descending, red)
  const srH = (Math.abs(SR_US_PER_DAY) / maxAbs) * halfH;
  ctx.fillStyle = RED;
  ctx.fillRect(srX, axisY, barWidth, srH);
  // GR bar (ascending, green)
  const grH = (Math.abs(GR_US_PER_DAY) / maxAbs) * halfH;
  ctx.fillStyle = GREEN;
  ctx.fillRect(grX, axisY - grH, barWidth, grH);
  // Net bar (above zero, amber)
  const netH = (Math.abs(NET_US_PER_DAY) / maxAbs) * halfH;
  ctx.fillStyle = AMBER;
  ctx.fillRect(netX, axisY - netH, barWidth, netH);

  // Labels above/below bars
  ctx.save();
  ctx.font = "11px ui-monospace, monospace";
  ctx.textAlign = "center";

  ctx.fillStyle = RED;
  ctx.fillText("SR", srX + barWidth / 2, axisY - 4);
  ctx.fillStyle = TEXT_DIM;
  ctx.fillText(`${SR_US_PER_DAY.toFixed(1)} μs/day`, srX + barWidth / 2, axisY + srH + 14);

  ctx.fillStyle = GREEN;
  ctx.fillText("GR", grX + barWidth / 2, axisY + 14);
  ctx.fillStyle = TEXT_DIM;
  ctx.fillText(`+${GR_US_PER_DAY.toFixed(1)} μs/day`, grX + barWidth / 2, axisY - grH - 4);

  ctx.fillStyle = AMBER;
  ctx.fillText("NET", netX + barWidth / 2, axisY + 14);
  ctx.fillStyle = TEXT_DIM;
  ctx.fillText(`+${NET_US_PER_DAY.toFixed(1)} μs/day`, netX + barWidth / 2, axisY - netH - 4);
  ctx.restore();

  // 0 reference label
  ctx.save();
  ctx.font = "10px ui-monospace, monospace";
  ctx.fillStyle = TEXT_DIM;
  ctx.textAlign = "right";
  ctx.fillText("0", axisLeft - 4, axisY + 4);
  ctx.restore();

  // Caption
  ctx.save();
  ctx.font = "10px ui-monospace, monospace";
  ctx.fillStyle = TEXT_DIM;
  ctx.textAlign = "center";
  ctx.fillText(
    "SR slows the satellite clock; GR speeds it up; GR wins by ~6×.",
    W / 2,
    top + height - 6,
  );
  ctx.restore();
}
