"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  GPS_ORBIT_RADIUS_M,
  gpsOrbitalSpeed,
  grCorrectionSecondsPerDay,
  netCorrectionMicrosecondsPerDay,
  srCorrectionSecondsPerDay,
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
 * §05.3 GPS ORBIT — top-down view of Earth + GPS satellite. Bars show SR
 * slowing (~−7 μs/day), GR speeding (~+46 μs/day), net (~+38 μs/day).
 */

const ORBIT_PERIOD_MS = 16_000;

const ORBITAL_SPEED_MS = gpsOrbitalSpeed();
const SR_US_PER_DAY = srCorrectionSecondsPerDay(ORBITAL_SPEED_MS) * 1e6;
const GR_US_PER_DAY = grCorrectionSecondsPerDay(GPS_ORBIT_RADIUS_M) * 1e6;
const NET_US_PER_DAY = netCorrectionMicrosecondsPerDay();

const VISUAL_ORBIT_RATIO = 3.0;

export function GpsOrbitScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokens = useSceneTokens();
  const rafRef = useRef<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [angleDeg, setAngleDeg] = useState(0);

  const { width: W, height: H } = useSceneSize(containerRef, {
    ratio: 0.65,
    maxHeight: SCENE_HEIGHT_TALL + 20,
    minHeight: 380,
  });

  const orbitalSpeedKmS = useMemo(() => ORBITAL_SPEED_MS / 1000, []);
  const beta = useMemo(() => ORBITAL_SPEED_MS / 2.99792458e8, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, W, H);
    if (!ctx) return;

    let startTs: number | null = null;
    const lastAngleAtPauseDeg = angleDeg;

    const tick = (ts: number) => {
      if (startTs === null) startTs = ts;
      let currentAngleDeg: number;
      if (paused) {
        currentAngleDeg = angleDeg;
      } else {
        const elapsed = ts - startTs;
        currentAngleDeg =
          (lastAngleAtPauseDeg + (elapsed / ORBIT_PERIOD_MS) * 360) % 360;
      }
      draw(ctx, tokens, W, H, currentAngleDeg);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [paused, angleDeg, tokens, W, H]);

  return (
    <div ref={containerRef} className="flex w-full flex-col gap-3 pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: W, height: H, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="A top-down view of Earth with a GPS satellite orbiting at 20,200 km altitude. Bars below show the SR clock-slowing (-7 microseconds per day) and GR clock-speeding (+46 microseconds per day) corrections, with a net of +38 microseconds per day."
      />

      <div className="grid grid-cols-1 gap-3 font-mono text-[11px] text-[var(--color-fg-2)] sm:grid-cols-3">
        <div
          className="rounded-md border p-3"
          style={{
            borderColor: "color-mix(in srgb, var(--color-red) 30%, transparent)",
            background: "color-mix(in srgb, var(--color-red) 6%, transparent)",
          }}
        >
          <div style={{ color: "var(--color-red)" }}>SR · kinematic dilation</div>
          <div className="mt-1 opacity-80">
            Δτ_SR ≈ {SR_US_PER_DAY.toFixed(2)} μs/day
          </div>
          <div className="opacity-60">moving clock runs slow</div>
        </div>
        <div
          className="rounded-md border p-3"
          style={{
            borderColor: "color-mix(in srgb, var(--color-mint) 30%, transparent)",
            background: "color-mix(in srgb, var(--color-mint) 6%, transparent)",
          }}
        >
          <div style={{ color: "var(--color-mint)" }}>GR · gravitational dilation</div>
          <div className="mt-1 opacity-80">
            Δτ_GR ≈ +{GR_US_PER_DAY.toFixed(2)} μs/day
          </div>
          <div className="opacity-60">higher Φ → clock runs fast</div>
        </div>
        <div
          className="rounded-md border p-3"
          style={{
            borderColor: "color-mix(in srgb, var(--color-amber) 30%, transparent)",
            background: "color-mix(in srgb, var(--color-amber) 6%, transparent)",
          }}
        >
          <div style={{ color: "var(--color-amber)" }}>NET · receiver correction</div>
          <div className="mt-1 opacity-80">
            Δτ ≈ +{NET_US_PER_DAY.toFixed(2)} μs/day
          </div>
          <div className="opacity-60">programmed into every GPS</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <Button variant="ghost" size="sm" onClick={() => setPaused((p) => !p)}>
          {paused ? "play" : "pause"}
        </Button>
        <span className="opacity-70">
          v ≈ {orbitalSpeedKmS.toFixed(2)} km/s · β ≈ {beta.toExponential(2)}
        </span>
      </div>

      <label className="flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
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
          style={{ accentColor: "var(--color-amber)" }}
          disabled={!paused}
        />
        <span className="w-16 text-right">{Math.round(angleDeg)}°</span>
      </label>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  W: number,
  H: number,
  angleDeg: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const orbitPanelH = H * 0.62;
  const orbitCx = W / 2;
  const orbitCy = orbitPanelH / 2 + 8;

  const orbitRadiusPx = Math.min(W * 0.32, orbitPanelH * 0.42);
  const earthRadiusPx = orbitRadiusPx / VISUAL_ORBIT_RATIO;

  drawStars(ctx, tokens, W, orbitPanelH, orbitCx, orbitCy, orbitRadiusPx);

  ctx.save();
  ctx.strokeStyle = tokens.panelBorder;
  ctx.setLineDash([3, 4]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(orbitCx, orbitCy, orbitRadiusPx, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  drawEarth(ctx, tokens, orbitCx, orbitCy, earthRadiusPx);

  // Ground observer marker
  const groundX = orbitCx;
  const groundY = orbitCy - earthRadiusPx;
  ctx.save();
  ctx.fillStyle = tokens.cyan;
  ctx.beginPath();
  ctx.arc(groundX, groundY, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = tokens.textBright;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.font = "11px ui-monospace, monospace";
  ctx.fillStyle = tokens.cyan;
  ctx.textAlign = "center";
  ctx.fillText("ground clock", groundX, groundY - 10);
  ctx.restore();

  // Satellite
  const angleRad = (angleDeg * Math.PI) / 180 - Math.PI / 2;
  const satX = orbitCx + orbitRadiusPx * Math.cos(angleRad);
  const satY = orbitCy + orbitRadiusPx * Math.sin(angleRad);

  ctx.save();
  ctx.strokeStyle = hexToRgba(tokens.amber, 0.35);
  ctx.lineWidth = 2;
  ctx.beginPath();
  const trailStart = angleRad - Math.PI / 2;
  ctx.arc(orbitCx, orbitCy, orbitRadiusPx, trailStart, angleRad);
  ctx.stroke();
  ctx.restore();

  drawSatellite(ctx, tokens, satX, satY, angleRad);

  ctx.save();
  ctx.font = "11px ui-monospace, monospace";
  ctx.fillStyle = tokens.amber;
  ctx.textAlign = "center";
  const labelOffset = 18;
  const lx = satX + Math.cos(angleRad) * labelOffset * 1.4;
  const ly = satY + Math.sin(angleRad) * labelOffset * 1.4;
  ctx.fillText("satellite clock", lx, ly);
  ctx.restore();

  // Altitude bracket
  ctx.save();
  ctx.strokeStyle = tokens.textMute;
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 3]);
  ctx.beginPath();
  ctx.moveTo(orbitCx + earthRadiusPx, orbitCy);
  ctx.lineTo(orbitCx + orbitRadiusPx, orbitCy);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = "10px ui-monospace, monospace";
  ctx.fillStyle = tokens.textDim;
  ctx.textAlign = "left";
  ctx.fillText("altitude  20 200 km", orbitCx + earthRadiusPx + 8, orbitCy - 6);
  ctx.fillText(
    `r = R⊕ + h ≈ 26 571 km`,
    orbitCx + earthRadiusPx + 8,
    orbitCy + 10,
  );
  ctx.restore();

  // Title
  ctx.save();
  ctx.font = "bold 14px ui-monospace, monospace";
  ctx.fillStyle = tokens.textBright;
  ctx.textAlign = "center";
  ctx.fillText(
    "GPS satellite — two relativistic corrections, all day, every day",
    W / 2,
    22,
  );
  ctx.restore();

  const barPanelTop = orbitPanelH + 8;
  drawCorrectionBars(ctx, tokens, W, barPanelTop, H - barPanelTop - 8);
}

function drawEarth(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  cx: number,
  cy: number,
  r: number,
) {
  ctx.save();
  // Theme-stable Earth ocean: blue family, but pick from token blue.
  const baseBlue = tokens.blue;
  const grad = ctx.createRadialGradient(
    cx - r * 0.3,
    cy - r * 0.3,
    r * 0.1,
    cx,
    cy,
    r,
  );
  grad.addColorStop(0, hexToRgba(baseBlue, 0.95));
  grad.addColorStop(0.7, baseBlue);
  grad.addColorStop(1, hexToRgba(baseBlue, 0.65));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Continents using mint/green
  ctx.fillStyle = tokens.mint;
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.15, cy + r * 0.05, r * 0.22, r * 0.35, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + r * 0.25, cy - r * 0.25, r * 0.32, r * 0.18, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.45, cy - r * 0.1, r * 0.18, r * 0.32, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.strokeStyle = hexToRgba(tokens.textBright, 0.2);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawSatellite(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  x: number,
  y: number,
  angleRad: number,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angleRad);
  ctx.fillStyle = tokens.amber;
  ctx.fillRect(-5, -5, 10, 10);
  ctx.fillStyle = tokens.blue;
  ctx.fillRect(-16, -3, 10, 6);
  ctx.fillRect(6, -3, 10, 6);
  ctx.strokeStyle = hexToRgba(tokens.textBright, 0.35);
  ctx.lineWidth = 0.5;
  ctx.strokeRect(-16, -3, 10, 6);
  ctx.strokeRect(6, -3, 10, 6);
  ctx.shadowColor = tokens.amber;
  ctx.shadowBlur = 12;
  ctx.fillStyle = tokens.amber;
  ctx.beginPath();
  ctx.arc(0, 0, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawStars(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  W: number,
  panelH: number,
  cx: number,
  cy: number,
  rExclude: number,
) {
  ctx.save();
  ctx.fillStyle = tokens.textMute;
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
  tokens: SceneTokens,
  W: number,
  top: number,
  height: number,
) {
  const padX = 36;
  const axisY = top + height / 2;
  const axisLeft = padX;
  const axisRight = W - padX;

  ctx.save();
  ctx.fillStyle = hexToRgba(tokens.textBright, 0.04);
  ctx.fillRect(8, top + 2, W - 16, height - 4);
  ctx.restore();

  const maxAbs = 50;
  const halfH = (height - 32) / 2;

  ctx.save();
  ctx.strokeStyle = tokens.axes;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(axisLeft, axisY);
  ctx.lineTo(axisRight, axisY);
  ctx.stroke();
  ctx.restore();

  const barWidth = 64;
  const slot = (axisRight - axisLeft) / 4;
  const srX = axisLeft + slot * 1 - barWidth / 2;
  const grX = axisLeft + slot * 2 - barWidth / 2;
  const netX = axisLeft + slot * 3 - barWidth / 2;

  const srH = (Math.abs(SR_US_PER_DAY) / maxAbs) * halfH;
  ctx.fillStyle = tokens.red;
  ctx.fillRect(srX, axisY, barWidth, srH);
  const grH = (Math.abs(GR_US_PER_DAY) / maxAbs) * halfH;
  ctx.fillStyle = tokens.mint;
  ctx.fillRect(grX, axisY - grH, barWidth, grH);
  const netH = (Math.abs(NET_US_PER_DAY) / maxAbs) * halfH;
  ctx.fillStyle = tokens.amber;
  ctx.fillRect(netX, axisY - netH, barWidth, netH);

  ctx.save();
  ctx.font = "11px ui-monospace, monospace";
  ctx.textAlign = "center";

  ctx.fillStyle = tokens.red;
  ctx.fillText("SR", srX + barWidth / 2, axisY - 4);
  ctx.fillStyle = tokens.textDim;
  ctx.fillText(`${SR_US_PER_DAY.toFixed(1)} μs/day`, srX + barWidth / 2, axisY + srH + 14);

  ctx.fillStyle = tokens.mint;
  ctx.fillText("GR", grX + barWidth / 2, axisY + 14);
  ctx.fillStyle = tokens.textDim;
  ctx.fillText(`+${GR_US_PER_DAY.toFixed(1)} μs/day`, grX + barWidth / 2, axisY - grH - 4);

  ctx.fillStyle = tokens.amber;
  ctx.fillText("NET", netX + barWidth / 2, axisY + 14);
  ctx.fillStyle = tokens.textDim;
  ctx.fillText(`+${NET_US_PER_DAY.toFixed(1)} μs/day`, netX + barWidth / 2, axisY - netH - 4);
  ctx.restore();

  ctx.save();
  ctx.font = "10px ui-monospace, monospace";
  ctx.fillStyle = tokens.textDim;
  ctx.textAlign = "right";
  ctx.fillText("0", axisLeft - 4, axisY + 4);
  ctx.restore();

  ctx.save();
  ctx.font = "10px ui-monospace, monospace";
  ctx.fillStyle = tokens.textDim;
  ctx.textAlign = "center";
  ctx.fillText(
    "SR slows the satellite clock; GR speeds it up; GR wins by ~6×.",
    W / 2,
    top + height - 6,
  );
  ctx.restore();
}
