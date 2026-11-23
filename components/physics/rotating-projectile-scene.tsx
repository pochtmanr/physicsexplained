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
  drawArrow,
  drawFocusRing,
  drawLabel,
  hexToRgba,
  syncCanvas,
  useSceneHover,
  useScenePlayback,
  useSceneSize,
  useSceneTokens,
  type ScenePlayback,
} from "@/components/physics/_shared";
import { coriolisAccel2D } from "@/lib/physics/rotating-frame";

/** One panel at full inline size, in px; the two sit side by side. */
const PANEL_W = 220;
const PANEL_H = 260;
const PANEL_GAP = 12;
const GROUP_W = PANEL_W * 2 + PANEL_GAP;
/** Room kept between the flight and a panel's edges (px, inline). */
const PLOT_MARGIN = 10;
/** Largest pixels per metre at full inline size; smaller when the flight needs room. */
const PX_PER_M = 18;
const G = 9.81; // m/s²
const V0X = 6.0; // m/s — horizontal launch
const V0Y = -8.5; // m/s — upward (canvas y grows downward)
const FLIGHT_TIME = 1.85; // s
/** Integration step for the rotating-frame path (s). */
const STEP = 1 / 600;

interface Path {
  x: Float64Array;
  y: Float64Array;
  vx: Float64Array;
  vy: Float64Array;
}

/**
 * The rotating-frame flight for one Ω: gravity plus the Coriolis term,
 * stepped at a fixed small step (velocity first, then position) from the
 * launch. Computed once per Ω, so the scene can draw any moment of it.
 */
function rotatingPath(omega: number): Path {
  const n = Math.ceil(FLIGHT_TIME / STEP) + 1;
  const path: Path = {
    x: new Float64Array(n),
    y: new Float64Array(n),
    vx: new Float64Array(n),
    vy: new Float64Array(n),
  };
  let x = 0;
  let y = 0;
  let vx = V0X;
  let vy = V0Y;
  for (let i = 0; i < n; i++) {
    path.x[i] = x;
    path.y[i] = y;
    path.vx[i] = vx;
    path.vy[i] = vy;
    const aC = coriolisAccel2D({ omegaZ: omega }, { x: vx, y: vy });
    // +G pulls towards +y, which is down on the canvas.
    vx += aC.x * STEP;
    vy += (aC.y + G) * STEP;
    x += vx * STEP;
    y += vy * STEP;
  }
  return path;
}

/** Index of the path sample at time `time`. */
const sampleAt = (path: Path, time: number) =>
  Math.min(path.x.length - 1, Math.max(0, Math.round(time / STEP)));

/** The inertial-frame flight: a parabola. */
const inertialAt = (time: number) => ({
  x: V0X * time,
  y: V0Y * time + 0.5 * G * time * time,
});

/** FIG.06d — the same launch seen from an inertial frame and from a rotating one. */
export function RotatingProjectileScene() {
  const t = useTranslations("scenes.rotatingProjectile");
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: PANEL_H / GROUP_W,
    maxHeight: PANEL_H,
    minHeight: 200,
    initialWidth: GROUP_W,
    // The two panels keep their shape and are centred in the canvas, so the
    // full view can use the whole width of the cards.
    fullView: "fill",
  });
  const [omega, setOmega] = useState(1.5); // rad/s
  const path = useMemo(() => rotatingPath(omega), [omega]);

  // `u` for text, offsets and hairlines; the panels and what is drawn in them
  // grow with the canvas (`k` for positions, `o` for sizes). Inline k ≤ 1
  // and o = 1.
  const u = (n: number) => n * tokens.scale;
  const k = Math.min(width / GROUP_W, height / PANEL_H);
  const objectScale = Math.min(2.6, Math.max(tokens.scale, k));
  const o = (n: number) => n * objectScale;
  const panelW = PANEL_W * k;
  const panelH = PANEL_H * k;
  const groupLeft = (width - GROUP_W * k) / 2;
  const panelTop = (height - panelH) / 2;
  const panels = [
    { key: "g", left: groupLeft },
    { key: "coriolis", left: groupLeft + (PANEL_W + PANEL_GAP) * k },
  ] as const;
  // The launch point sits at the centre of the area under the title, and the
  // scale is chosen so the whole flight in both frames fits around it. A
  // path bent by a large Ω can run left or below the launch, so both
  // directions get the same room.
  const plotTop = panelTop + Math.max(12 * k, u(26));
  const plotBottom = panelTop + panelH - PLOT_MARGIN * k;
  const extent = useMemo(() => {
    let ex = V0X * FLIGHT_TIME;
    let ey = (V0Y * V0Y) / (2 * G);
    for (let i = 0; i < path.x.length; i++) {
      ex = Math.max(ex, Math.abs(path.x[i]!));
      ey = Math.max(ey, Math.abs(path.y[i]!));
    }
    const end = inertialAt(FLIGHT_TIME);
    return { x: Math.max(ex, Math.abs(end.x)), y: Math.max(ey, Math.abs(end.y)) };
  }, [path]);
  const pxPerM = Math.min(
    PX_PER_M * k,
    (panelW / 2 - PLOT_MARGIN * k) / extent.x,
    ((plotBottom - plotTop) / 2 - PLOT_MARGIN * k) / extent.y,
  );
  const originAt = (left: number) => ({
    x: left + panelW / 2,
    y: (plotTop + plotBottom) / 2,
  });
  const toPx = (left: number, p: { x: number; y: number }) => {
    const origin = originAt(left);
    return { x: origin.x + p.x * pxPerM, y: origin.y + p.y * pxPerM };
  };

  const playbackRef = useRef<ScenePlayback | null>(null);
  // The launch point means the launch velocity; anywhere else in a panel
  // means what shapes the path drawn there (gravity alone, or the Coriolis
  // term on top of it).
  const hover = useSceneHover(canvasRef, (px, py) => {
    if (py < panelTop || py > panelTop + panelH) return null;
    for (const panel of panels) {
      if (px < panel.left || px > panel.left + panelW) continue;
      const origin = originAt(panel.left);
      if (Math.hypot(px - origin.x, py - origin.y) <= u(14)) return "v0";
      return panel.key;
    }
    return null;
  });
  const { activeKey } = hover;
  const focus =
    activeKey === "g" ? "g" : activeKey === "coriolis" || activeKey === "omega" ? "coriolis" : null;

  const playback = useScenePlayback({
    elementRef: containerRef,
    duration: FLIGHT_TIME,
    draw: (time) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = syncCanvas(canvas, width, height);
      if (!ctx) return;
      const bounds = { width, height };
      const last = sampleAt(path, time);

      for (const panel of panels) {
        const { left } = panel;
        const origin = originAt(left);
        const isRotating = panel.key === "coriolis";
        const color = isRotating ? tokens.magenta : tokens.cyan;

        ctx.save();
        ctx.beginPath();
        ctx.rect(left, panelTop, panelW, panelH);
        ctx.clip();

        // Ground line
        ctx.strokeStyle = tokens.axes;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(left + 8 * k, origin.y);
        ctx.lineTo(left + panelW - 8 * k, origin.y);
        ctx.stroke();

        // Vertical through the launch point, starting below the title.
        ctx.strokeStyle = tokens.gridHeavy;
        ctx.beginPath();
        ctx.moveTo(origin.x, plotTop);
        ctx.lineTo(origin.x, plotBottom);
        ctx.stroke();

        // Path so far; the one pointed at is heavier, the other steps back.
        ctx.strokeStyle = color;
        ctx.lineWidth = o(focus === panel.key ? 3 : 1.8);
        ctx.globalAlpha = focus !== null && focus !== panel.key ? 0.35 : 1;
        ctx.beginPath();
        if (isRotating) {
          for (let i = 0; i <= last; i++) {
            const p = toPx(left, { x: path.x[i]!, y: path.y[i]! });
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          }
        } else {
          const n = Math.max(2, Math.ceil(time * 120));
          for (let i = 0; i <= n; i++) {
            const p = toPx(left, inertialAt((i / n) * time));
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          }
        }
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Current position
        const cur = isRotating
          ? toPx(left, { x: path.x[last]!, y: path.y[last]! })
          : toPx(left, inertialAt(time));
        ctx.fillStyle = color;
        ctx.shadowColor = hexToRgba(color, 0.55);
        ctx.shadowBlur = o(8);
        ctx.beginPath();
        ctx.arc(cur.x, cur.y, o(5), 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        if (focus === panel.key) {
          drawFocusRing(ctx, cur.x, cur.y, o(5) + u(6), color, tokens.scale);
        }
        // The Coriolis term's direction at the ball: square to its velocity.
        if (isRotating && activeKey === "coriolis") {
          const a = coriolisAccel2D({ omegaZ: omega }, { x: path.vx[last]!, y: path.vy[last]! });
          const mag = Math.hypot(a.x, a.y);
          if (mag > 0) {
            const len = o(5) + u(26);
            drawArrow(ctx, cur.x, cur.y, cur.x + (a.x / mag) * len, cur.y + (a.y / mag) * len, color, u(2), u(8));
          }
        }
        // Launch velocity, the same in both frames.
        if (activeKey === "v0") {
          const len = o(44) / Math.hypot(V0X, V0Y);
          drawArrow(ctx, origin.x, origin.y, origin.x + V0X * len, origin.y + V0Y * len, tokens.textBright, u(2), u(8));
          drawLabel(ctx, "v₀", origin.x + V0X * len + u(10), origin.y + V0Y * len, {
            bounds,
            color: tokens.textBright,
            font: tokens.fontHudSmall,
            plate: tokens.bg1,
            scale: tokens.scale,
          });
        }

        // Title, on a plate so the paths can pass under it.
        drawLabel(ctx, isRotating ? t("rotatingTitle") : t("inertialTitle"), left + u(10), panelTop + u(14), {
          bounds,
          color: focus === panel.key ? tokens.textBright : tokens.textDim,
          font: tokens.fontHudSmall,
          direction: "inherit",
        });
        ctx.restore();
      }
    },
  });
  playbackRef.current = playback;

  const now = sampleAt(path, playback.time);
  const aC = coriolisAccel2D({ omegaZ: omega }, { x: path.vx[now]!, y: path.vy[now]! });

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
          <SceneControls playback={playback} scrub scrubKey="scrub" />
          <SceneReadout
            items={[
              {
                label: "v₀",
                value: `(${V0X.toFixed(1)}, ${(-V0Y).toFixed(1)}) m/s`,
                guideKey: "v0",
              },
              {
                label: "g",
                value: `${G.toFixed(2)} m/s²`,
                color: "var(--color-cyan)",
                guideKey: "g",
              },
              {
                label: "|a_C|",
                value: `${Math.hypot(aC.x, aC.y).toFixed(2)} m/s²`,
                color: "var(--color-magenta)",
                guideKey: "coriolis",
              },
            ]}
          />
        </ScenePanel>
        <SceneControlGroup>
          <SceneSlider
            label="Ω"
            ariaLabel={t("omega")}
            guideKey="omega"
            value={omega}
            min={-3}
            max={3}
            step={0.05}
            onChange={setOmega}
            display={`${omega.toFixed(2)} rad/s`}
          />
        </SceneControlGroup>
      </div>
    </div>
  );
}
