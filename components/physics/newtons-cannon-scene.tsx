"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  SCENE_CANVAS_CLASS,
  SceneControlGroup,
  SceneControls,
  ScenePanel,
  SceneReadout,
  SceneSlider,
  SceneStage,
  drawFocusRing,
  drawLabel,
  hexToRgba,
  syncCanvas,
  type ScenePlayback,
  useSceneHover,
  useScenePlayback,
  useSceneSize,
  useSceneTokens,
} from "@/components/physics/_shared";
import { orbitalVelocity } from "@/lib/physics/circular-motion";

/** Drawing size at which the figure has its reference proportions. */
const REF_W = 480;
const REF_H = 360;

// Toy units: pick GM and Earth radius so that v_orb ≈ 1.0 in scene units.
// That keeps the slider intuitive and the integration well-conditioned.
const EARTH_R = 1.0;        // scene units
const GM = 1.0;             // scene units (so v_orb = √(GM/R) = 1.0)
const PIXELS_PER_UNIT = 80; // EARTH_R = 80 px on screen at the reference size
const CANNON_HEIGHT = 0.04; // small ledge above the surface to launch from
const DT = 0.005;           // integration step (scene-time)
const N_STEPS = 4000;       // max integration steps per trajectory
const REAL_V_ORBITAL_KMS = 7.9; // for the displayed real-world readout
/** Seconds for the cannonball to walk the whole trajectory once. */
const CYCLE = 6;

// RK4 step for r̈ = -GM r / |r|³
function rk4Step(
  x: number,
  y: number,
  vx: number,
  vy: number,
  dt: number,
): { x: number; y: number; vx: number; vy: number } {
  const accel = (px: number, py: number) => {
    const r = Math.hypot(px, py);
    const r3 = r * r * r;
    return { ax: (-GM * px) / r3, ay: (-GM * py) / r3 };
  };
  const a1 = accel(x, y);
  const k1x = vx,
    k1y = vy,
    k1vx = a1.ax,
    k1vy = a1.ay;
  const a2 = accel(x + 0.5 * dt * k1x, y + 0.5 * dt * k1y);
  const k2x = vx + 0.5 * dt * k1vx,
    k2y = vy + 0.5 * dt * k1vy,
    k2vx = a2.ax,
    k2vy = a2.ay;
  const a3 = accel(x + 0.5 * dt * k2x, y + 0.5 * dt * k2y);
  const k3x = vx + 0.5 * dt * k2vx,
    k3y = vy + 0.5 * dt * k2vy,
    k3vx = a3.ax,
    k3vy = a3.ay;
  const a4 = accel(x + dt * k3x, y + dt * k3y);
  const k4x = vx + dt * k3vx,
    k4y = vy + dt * k3vy,
    k4vx = a4.ax,
    k4vy = a4.ay;

  return {
    x: x + (dt / 6) * (k1x + 2 * k2x + 2 * k3x + k4x),
    y: y + (dt / 6) * (k1y + 2 * k2y + 2 * k3y + k4y),
    vx: vx + (dt / 6) * (k1vx + 2 * k2vx + 2 * k3vx + k4vx),
    vy: vy + (dt / 6) * (k1vy + 2 * k2vy + 2 * k3vy + k4vy),
  };
}

interface IntegrationResult {
  pts: Array<{ x: number; y: number }>;
  hitGround: boolean;
}

function integrateTrajectory(v0: number): IntegrationResult {
  // Cannon mounted on top of the disk (north pole), launches horizontally to +x
  const x0 = 0;
  const y0 = EARTH_R + CANNON_HEIGHT;
  let x = x0,
    y = y0,
    vx = v0,
    vy = 0;
  const pts: Array<{ x: number; y: number }> = [{ x, y }];
  let hitGround = false;
  for (let i = 0; i < N_STEPS; i++) {
    const next = rk4Step(x, y, vx, vy, DT);
    x = next.x;
    y = next.y;
    vx = next.vx;
    vy = next.vy;
    pts.push({ x, y });
    if (Math.hypot(x, y) <= EARTH_R) {
      hitGround = true;
      break;
    }
    // Stop once we've come back near the launch point — closes the orbit cleanly
    if (i > 200 && Math.hypot(x - x0, y - y0) < 0.03) break;
    // Bail out if it escapes far away
    if (Math.hypot(x, y) > 6 * EARTH_R) break;
  }
  return { pts, hitGround };
}

type Regime = "suborbital" | "circular" | "elliptical";

function regimeOf(v0: number, vOrb: number): Regime {
  const ratio = v0 / vOrb;
  if (ratio < 0.985) return "suborbital";
  if (ratio < 1.015) return "circular";
  return "elliptical";
}

/**
 * FIG.04d — Newton's cannon. A ball fired horizontally from a mountain top
 * falls back to the ground below orbital speed, circles the Earth at it, and
 * swings out on an ellipse above it.
 */
export function NewtonsCannonScene() {
  const t = useTranslations("scenes.newtonsCannon");
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: REF_H / REF_W,
    maxHeight: REF_H,
    minHeight: 240,
    initialWidth: REF_W,
    // The Earth stays centred and is sized from both directions.
    fullView: "fill",
  });
  const playbackRef = useRef<ScenePlayback | null>(null);

  const vOrbScene = useMemo(() => orbitalVelocity(EARTH_R, GM), []);
  // Slider in units of v_orb — range [0.6, 1.25] covers all three regimes.
  const [vRatio, setVRatio] = useState(0.85);
  const v0 = vRatio * vOrbScene;
  const trajectory = useMemo(() => integrateTrajectory(v0), [v0]);
  const regime = regimeOf(v0, vOrbScene);

  const scale = tokens.scale;
  const u = (n: number) => n * scale;
  // The Earth keeps its 480 × 360 proportions and grows with a larger canvas
  // in full view. Inline this is at most 1.
  const objectScale = Math.min(2.6, width / REF_W, height / REF_H);
  const o = (n: number) => n * objectScale;
  const ppu = PIXELS_PER_UNIT * objectScale;

  const cx = width / 2;
  // Earth slightly below the middle, so the cannon fits above it.
  const cy = height / 2 + o(20);
  const toPx = (p: { x: number; y: number }) => ({ x: cx + p.x * ppu, y: cy - p.y * ppu });
  const cannon = toPx({ x: 0, y: EARTH_R + CANNON_HEIGHT });
  const ballAt = (time: number) => {
    const pts = trajectory.pts;
    const frac = (time % CYCLE) / CYCLE;
    return toPx(pts[Math.min(pts.length - 1, Math.floor(frac * pts.length))]!);
  };

  // The ball or the cannon (the muzzle speed), the path (which regime), the
  // Earth (the speed of a circular orbit at its surface).
  const hover = useSceneHover(canvasRef, (x, y) => {
    const ball = ballAt(playbackRef.current?.getTime() ?? 0);
    if (Math.hypot(x - ball.x, y - ball.y) <= o(4) + u(9)) return "muzzle";
    if (Math.hypot(x - cannon.x, y - cannon.y) <= o(12) + u(6)) return "muzzle";
    const reach2 = u(9) * u(9);
    for (const p of trajectory.pts) {
      const q = toPx(p);
      const dx = q.x - x;
      const dy = q.y - y;
      if (dx * dx + dy * dy <= reach2) return "regime";
    }
    if (Math.hypot(x - cx, y - cy) <= EARTH_R * ppu) return "vOrb";
    return null;
  });
  const { activeKey } = hover;

  const playback = useScenePlayback({
    elementRef: containerRef,
    draw: (time) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = syncCanvas(canvas, width, height);
      if (!ctx) return;
      const bounds = { width, height };

      // Earth disk (outline and faint fill)
      const earthFocused = activeKey === "vOrb";
      ctx.fillStyle = hexToRgba(tokens.cyan, 0.1);
      ctx.beginPath();
      ctx.arc(cx, cy, EARTH_R * ppu, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = tokens.cyan;
      ctx.lineWidth = u(1.5);
      ctx.stroke();

      drawLabel(ctx, t("earth"), cx, cy, {
        bounds,
        color: earthFocused ? tokens.textBright : tokens.textLabel,
        align: "center",
        direction: "inherit",
        font: tokens.fontHudSmall,
      });

      // The circular orbit at launch height, shown with v_orb.
      if (earthFocused) {
        ctx.strokeStyle = tokens.cyan;
        ctx.lineWidth = u(1.5);
        ctx.setLineDash([u(4), u(3)]);
        ctx.beginPath();
        ctx.arc(cx, cy, (EARTH_R + CANNON_HEIGHT) * ppu, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        drawLabel(ctx, `v_orb = √(GM/R)`, cx, cy + EARTH_R * ppu * 0.45, {
          bounds,
          color: tokens.cyan,
          align: "center",
          font: tokens.fontLabel,
          plate: tokens.bg1,
          scale,
        });
      }

      // Cannon at the top of the Earth, pointing right
      ctx.fillStyle = tokens.textDim;
      ctx.beginPath();
      ctx.moveTo(cannon.x - o(8), cannon.y + o(2));
      ctx.lineTo(cannon.x + o(12), cannon.y - o(4));
      ctx.lineTo(cannon.x + o(12), cannon.y + o(4));
      ctx.lineTo(cannon.x - o(8), cannon.y + o(8));
      ctx.closePath();
      ctx.fill();

      // Trajectory (magenta if it hits the ground, cyan if it orbits)
      const stroke = trajectory.hitGround ? tokens.magenta : tokens.cyan;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = activeKey === "regime" ? u(3) : u(1.5);
      ctx.beginPath();
      trajectory.pts.forEach((p, i) => {
        const q = toPx(p);
        if (i === 0) ctx.moveTo(q.x, q.y);
        else ctx.lineTo(q.x, q.y);
      });
      ctx.stroke();
      ctx.lineWidth = 1;

      // Cannonball, walking the path once per cycle
      const ball = ballAt(time);
      ctx.fillStyle = stroke;
      ctx.shadowColor = stroke;
      ctx.shadowBlur = u(10);
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, o(4), 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      if (activeKey === "muzzle") {
        drawFocusRing(ctx, ball.x, ball.y, o(4) + u(7), stroke, scale);
        drawFocusRing(ctx, cannon.x + o(2), cannon.y + o(2), o(12) + u(4), tokens.textBright, scale);
      }
    },
  });
  // The hit test runs between renders and needs the live clock.
  playbackRef.current = playback;

  const regimeColor = regime === "suborbital" ? "var(--color-magenta)" : "var(--color-cyan)";

  return (
    <div ref={containerRef} className="scene-root w-full pb-4">
      <div className="mx-auto" style={{ width }}>
        <SceneStage>
          <canvas
            ref={canvasRef}
            role="img"
            aria-label={t("aria")}
            className={SCENE_CANVAS_CLASS}
            style={{ width, height }}
          />
        </SceneStage>
        <ScenePanel>
          <SceneControls playback={playback} />
          <SceneReadout
            items={[
              { label: "v₀ / v_orb", value: vRatio.toFixed(3), guideKey: "muzzle" },
              { label: "v_orb = √(GM/R)", value: vOrbScene.toFixed(3), guideKey: "vOrb" },
              { label: t("realEarth"), value: `≈ ${REAL_V_ORBITAL_KMS} km/s`, guideKey: "real" },
              { label: t("path"), value: t(regime), color: regimeColor, guideKey: "regime" },
            ]}
          />
        </ScenePanel>
        <SceneControlGroup>
          <SceneSlider
            label={t("muzzle")}
            guideKey="muzzle"
            value={vRatio}
            min={0.6}
            max={1.25}
            step={0.005}
            onChange={setVRatio}
            display={`${vRatio.toFixed(3)} v_orb`}
          />
        </SceneControlGroup>
      </div>
    </div>
  );
}
