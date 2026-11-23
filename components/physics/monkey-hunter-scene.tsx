"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { G_EARTH } from "@/lib/physics/projectile";
import { Button } from "@/components/ui/button";
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
  syncCanvas,
  type ScenePlayback,
  useSceneHover,
  useScenePlayback,
  useSceneSize,
  useSceneTokens,
  useSceneView,
} from "@/components/physics/_shared";

/** Inline height cap; the monkey and cannon grow with the canvas beyond it. */
const MAX_HEIGHT = 440;

// Fixed world geometry for the scene (tuned for a 0–12 m horizontal range).
const MONKEY = { x: 9, y: 5 };
const CANNON = { x: 0, y: 0 };
const DX = MONKEY.x - CANNON.x;
const DY = MONKEY.y - CANNON.y;
/** The cannon is always aimed straight at the monkey. */
const AIM_ANGLE = Math.atan2(DY, DX);
const AIM_DEG = (AIM_ANGLE * 180) / Math.PI;
/** World window, in metres. */
const WORLD = { xMin: -1, xMax: 13, yMin: -0.5, yMax: 7 };
/** Height of the branch above the monkey's hanging point. */
const BRANCH_ABOVE = 0.35;
/** Time for the monkey to fall from the branch to the ground. */
const MONKEY_GROUND_T = Math.sqrt((2 * MONKEY.y) / G_EARTH);

/** Everything about one shot that follows from the dart speed. */
function shot(speed: number) {
  // dart: x = v·cosθ·t, y = v·sinθ·t − ½gt²
  const vx = speed * Math.cos(AIM_ANGLE);
  const vy = speed * Math.sin(AIM_ANGLE);
  // When the dart crosses x = Dx, and where the monkey is then. The dart is
  // at the same height, since both have fallen ½gt² below the aim line.
  const tCross = DX / vx;
  const interceptY = MONKEY.y - 0.5 * G_EARTH * tCross * tCross;
  const willHit = tCross > 0 && interceptY > 0;
  const dartGroundT = (2 * vy) / G_EARTH + 0.001;
  const endT = willHit ? tCross : Math.min(dartGroundT, MONKEY_GROUND_T);
  return { vx, vy, tCross, interceptY, willHit, endT };
}

/**
 * FIG.02c — the monkey and the hunter. The dart is fired straight at the
 * monkey, which lets go at the same instant; both fall ½gt² below where they
 * would otherwise be, so the dart meets the monkey at any speed fast enough
 * to get there before the ground.
 */
export function MonkeyHunterScene() {
  const t = useTranslations("scenes.monkeyHunter");
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokens = useSceneTokens();
  const { expanded } = useSceneView();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.62,
    maxHeight: MAX_HEIGHT,
    minHeight: 220,
    initialWidth: 640,
    // In full view the scene keeps true proportions and the extra room
    // becomes sky and ground, so any shape works.
    fullView: "fill",
  });
  const [speed, setSpeed] = useState(16);
  const playbackRef = useRef<ScenePlayback | null>(null);
  const { vx, vy, tCross, interceptY, willHit, endT } = shot(speed);

  // Every pixel size goes through `u`; the monkey, cannon and dart through
  // `o`, so they grow with a tall canvas (docs/figure-full-view.md).
  const scale = tokens.scale;
  const u = (n: number) => n * scale;
  const objectScale = Math.min(2.6, Math.max(scale, height / MAX_HEIGHT));
  const o = (n: number) => n * objectScale;

  // Layout. Inline the world window is stretched to the plot as it always
  // was; in full view a metre is the same length both ways, the ground stays
  // at the same height and the spare room goes to the sides and the sky.
  const padL = u(30);
  const padR = u(30);
  const padT = u(20);
  const padB = u(30);
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;
  const spanX = WORLD.xMax - WORLD.xMin;
  const spanY = WORLD.yMax - WORLD.yMin;
  const mx = expanded ? Math.min(plotW / spanX, plotH / spanY) : plotW / spanX;
  const my = expanded ? mx : plotH / spanY;
  const left = padL + (plotW - spanX * mx) / 2;
  const bottom = padT + plotH;
  const toPx = (x: number, y: number) => ({
    px: left + (x - WORLD.xMin) * mx,
    py: bottom - (y - WORLD.yMin) * my,
  });
  const cannonPx = toPx(CANNON.x, CANNON.y);
  const monkeyHome = toPx(MONKEY.x, MONKEY.y);

  /** Monkey and dart at scene time `time` (seconds since the trigger). */
  const stateAt = (time: number) => {
    const tr = Math.min(Math.max(time, 0), endT);
    const monkeyY = time > 0 ? Math.max(0, MONKEY.y - 0.5 * G_EARTH * tr * tr) : MONKEY.y;
    const dartY = vy * tr - 0.5 * G_EARTH * tr * tr;
    return {
      tr,
      fired: time > 0,
      monkey: toPx(MONKEY.x, monkeyY),
      dart: toPx(vx * tr, Math.max(dartY, 0)),
      /** Where the dart would be without gravity: on the aim line. */
      aimPoint: toPx(vx * tr, vy * tr),
      drop: 0.5 * G_EARTH * tr * tr,
    };
  };

  // What lies under the pointer: the monkey or the dart (both have fallen
  // the same distance), the cannon or the aim line.
  const hover = useSceneHover(canvasRef, (px, py) => {
    const s = stateAt(playbackRef.current?.getTime() ?? 0);
    if (Math.hypot(px - s.monkey.px, py - s.monkey.py) <= o(18)) return "drop";
    if (s.fired && Math.hypot(px - s.dart.px, py - s.dart.py) <= o(4) + u(9)) return "drop";
    if (Math.hypot(px - cannonPx.px, py - cannonPx.py) <= o(30)) return "aim";
    if (distToSegment(px, py, cannonPx.px, cannonPx.py, monkeyHome.px, monkeyHome.py) <= u(9)) {
      return "aim";
    }
    return null;
  });
  const { activeKey } = hover;

  const playback = useScenePlayback({
    elementRef: containerRef,
    duration: endT,
    draw: (time) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = syncCanvas(canvas, width, height);
      if (!ctx) return;
      const bounds = { width, height };
      const s = stateAt(time);

      // Ground line, the full width of the plot.
      const groundY = toPx(0, 0).py;
      ctx.strokeStyle = tokens.gridHeavy;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padL, groundY);
      ctx.lineTo(padL + plotW, groundY);
      ctx.stroke();

      // Branch above the monkey.
      const branchY = toPx(0, MONKEY.y + BRANCH_ABOVE).py;
      ctx.strokeStyle = tokens.axes;
      ctx.lineWidth = o(3);
      ctx.beginPath();
      ctx.moveTo(toPx(MONKEY.x - 1.2, 0).px, branchY);
      ctx.lineTo(toPx(MONKEY.x + 0.8, 0).px, branchY);
      ctx.stroke();

      // Dashed aim line: cannon → where the monkey hung.
      const aimFocused = activeKey === "aim";
      ctx.strokeStyle = aimFocused ? tokens.cyan : tokens.gridHeavy;
      ctx.lineWidth = aimFocused ? u(1.5) : 1;
      ctx.setLineDash([u(4), u(4)]);
      ctx.beginPath();
      ctx.moveTo(cannonPx.px, cannonPx.py);
      ctx.lineTo(monkeyHome.px, monkeyHome.py);
      ctx.stroke();
      ctx.setLineDash([]);
      if (aimFocused) {
        ctx.beginPath();
        ctx.arc(cannonPx.px, cannonPx.py, o(34) + u(6), -AIM_ANGLE, 0);
        ctx.stroke();
        const r = o(34) + u(18);
        drawLabel(
          ctx,
          `θ = ${AIM_DEG.toFixed(1)}°`,
          cannonPx.px + r * Math.cos(AIM_ANGLE / 2),
          cannonPx.py - r * Math.sin(AIM_ANGLE / 2),
          { bounds, color: tokens.cyan, font: tokens.fontLabel, plate: tokens.bg1, scale },
        );
      }

      // The speed slider shows the whole path this speed would give.
      if (activeKey === "speed") {
        ctx.strokeStyle = tokens.cyan;
        ctx.globalAlpha = 0.5;
        ctx.lineWidth = u(1.5);
        ctx.setLineDash([u(2), u(4)]);
        ctx.beginPath();
        for (let i = 0; i <= 40; i++) {
          const tt = (i / 40) * endT;
          const p = toPx(vx * tt, Math.max(vy * tt - 0.5 * G_EARTH * tt * tt, 0));
          if (i === 0) ctx.moveTo(p.px, p.py);
          else ctx.lineTo(p.px, p.py);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
      }

      // Rope, only while the monkey still hangs.
      if (!s.fired) {
        ctx.strokeStyle = tokens.axes;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(s.monkey.px, branchY);
        ctx.lineTo(s.monkey.px, s.monkey.py - o(10));
        ctx.stroke();
      }

      // Cannon: a barrel rotated to the aim angle on a block.
      ctx.save();
      ctx.translate(cannonPx.px, cannonPx.py);
      ctx.rotate(-AIM_ANGLE); // screen y is inverted
      ctx.fillStyle = tokens.axes;
      ctx.fillRect(o(-4), o(-8), o(34), o(16));
      ctx.fillStyle = tokens.gridHeavy;
      ctx.fillRect(o(-10), o(-12), o(10), o(24));
      ctx.restore();

      drawMonkey(ctx, s.monkey.px, s.monkey.py, tokens.amber, objectScale);

      // Dart and its trail, once fired.
      if (s.fired) {
        ctx.strokeStyle = tokens.cyan;
        ctx.lineWidth = u(1.5);
        ctx.beginPath();
        for (let i = 0; i <= 30; i++) {
          const tt = (i / 30) * s.tr;
          const p = toPx(vx * tt, Math.max(vy * tt - 0.5 * G_EARTH * tt * tt, 0));
          if (i === 0) ctx.moveTo(p.px, p.py);
          else ctx.lineTo(p.px, p.py);
        }
        ctx.stroke();
        ctx.fillStyle = tokens.cyan;
        ctx.beginPath();
        ctx.arc(s.dart.px, s.dart.py, o(4), 0, Math.PI * 2);
        ctx.fill();
      }

      // The fall both share: from the aim line down to the dart, and from
      // the branch down to the monkey, the same ½gt².
      if (activeKey === "drop" && s.fired && s.drop > 0) {
        ctx.strokeStyle = tokens.amber;
        ctx.lineWidth = u(1.5);
        ctx.setLineDash([u(3), u(3)]);
        ctx.beginPath();
        ctx.moveTo(s.aimPoint.px, s.aimPoint.py);
        ctx.lineTo(s.dart.px, s.dart.py);
        ctx.moveTo(monkeyHome.px + o(16), monkeyHome.py);
        ctx.lineTo(monkeyHome.px + o(16), s.monkey.py);
        ctx.stroke();
        ctx.setLineDash([]);
        drawFocusRing(ctx, s.monkey.px, s.monkey.py, o(18), tokens.amber, scale);
        drawLabel(
          ctx,
          `½gt² = ${s.drop.toFixed(2)} m`,
          monkeyHome.px + o(16) + u(6),
          (monkeyHome.py + s.monkey.py) / 2,
          { bounds, color: tokens.amber, font: tokens.fontLabel, plate: tokens.bg1, scale },
        );
      } else if (activeKey === "drop") {
        drawFocusRing(ctx, s.monkey.px, s.monkey.py, o(18), tokens.amber, scale);
      }

      // Where they meet, forecast from the speed.
      if (activeKey === "meetTime" && willHit) {
        const meet = toPx(MONKEY.x, interceptY);
        drawFocusRing(ctx, meet.px, meet.py, o(14), tokens.cyan, scale);
      }
    },
  });
  // The hit test above runs between renders and needs the live clock.
  playbackRef.current = playback;

  // A new speed keeps the shot at the same fraction of its run, so dragging
  // the slider after a shot shows where each speed meets the monkey.
  const changeSpeed = (next: number) => {
    playback.seek((playback.getTime() / endT) * shot(next).endT);
    setSpeed(next);
  };

  const now = playback.time;
  const status = !(now > 0)
    ? t("statusReady")
    : !willHit
      ? t("statusMiss")
      : now >= endT
        ? t("statusHit")
        : t("statusFlight");

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
          <SceneControls playback={playback}>
            <Button variant="primary" size="sm" onClick={playback.replay}>
              {t("fire")}
            </Button>
          </SceneControls>
          <SceneReadout
            items={[
              { label: t("aim"), value: `${AIM_DEG.toFixed(1)}°`, guideKey: "aim" },
              {
                label: t("meetTime"),
                value: willHit ? `${tCross.toFixed(2)} s` : t("noMeet"),
                color: "var(--color-cyan)",
                guideKey: "meetTime",
              },
              {
                label: t("drop"),
                value: `${stateAt(now).drop.toFixed(2)} m`,
                color: "var(--color-amber)",
                guideKey: "drop",
              },
            ]}
          />
        </ScenePanel>
        <SceneControlGroup>
          <SceneSlider
            label={t("speed")}
            guideKey="speed"
            value={speed}
            min={6}
            max={28}
            step={0.1}
            onChange={changeSpeed}
            display={`${speed.toFixed(1)} m/s`}
          />
          <p className="text-xs text-[var(--color-fg-2)]" aria-live="polite">
            {status} {t("hint")}
          </p>
        </SceneControlGroup>
      </div>
    </div>
  );
}

function distToSegment(
  px: number,
  py: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): number {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len2 = dx * dx + dy * dy;
  const k = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - x0) * dx + (py - y0) * dy) / len2));
  return Math.hypot(px - (x0 + k * dx), py - (y0 + k * dy));
}

function drawMonkey(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  s: number,
) {
  ctx.fillStyle = color;
  // body
  ctx.beginPath();
  ctx.ellipse(x, y + 2 * s, 9 * s, 11 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  // head
  ctx.beginPath();
  ctx.arc(x, y - 9 * s, 6 * s, 0, Math.PI * 2);
  ctx.fill();
  // ears
  ctx.beginPath();
  ctx.arc(x - 6 * s, y - 10 * s, 2.5 * s, 0, Math.PI * 2);
  ctx.arc(x + 6 * s, y - 10 * s, 2.5 * s, 0, Math.PI * 2);
  ctx.fill();
  // face
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.beginPath();
  ctx.arc(x - 2 * s, y - 9 * s, 0.9 * s, 0, Math.PI * 2);
  ctx.arc(x + 2 * s, y - 9 * s, 0.9 * s, 0, Math.PI * 2);
  ctx.fill();
}
