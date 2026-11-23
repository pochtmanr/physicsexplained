"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  SCENE_CANVAS_CLASS,
  SceneControlGroup,
  SceneControls,
  ScenePanel,
  SceneReadout,
  SceneStage,
  drawFocusRing,
  drawLabel,
  hexToRgba,
  syncCanvas,
  useFigureLinkTarget,
  useSceneHover,
  useScenePlayback,
  useSceneSize,
  useSceneTokens,
  type ScenePlayback,
} from "@/components/physics/_shared";

/** Side of the square drawing at full inline size, in px. */
const BASE_SIZE = 360;
/** Pixels per metre at full inline size. */
const PX_PER_M = 100;
/** Turntable radius (m). */
const TURNTABLE_R = 1.5;
/** Where the rider sits, from the centre (m). */
const RIDER_R = 0.9;
/** Ball speed outward along a fixed line in the lab frame (m/s). */
const BALL_SPEED = 0.6;
/** Carousel spin rate (rad/s). */
const OMEGA = 0.9;
/** Length of one ball flight (s). */
const FLIGHT_TIME = 4;
/** Trail samples per second of flight. */
const TRAIL_SAMPLES_PER_S = 60;

type Frame = "rider" | "outside";

/**
 * FIG.06a — a ball rolled outward across a spinning carousel, seen from
 * outside (a straight line) and from the rider's seat (a curve).
 *
 * Everything is a function of time: the carousel turns through Ω·t, the ball
 * travels BALL_SPEED·t along a fixed lab line, and the rider's view is the
 * same picture turned back by Ω·t. So the scene can be scrubbed, and switching
 * frames mid-flight shows the whole path at once.
 */
export function CarouselScene() {
  const t = useTranslations("scenes.carousel");
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 1,
    maxHeight: BASE_SIZE,
    minHeight: 260,
    initialWidth: BASE_SIZE,
    // The disc is centred in whatever shape it gets, so the full view uses
    // the whole width instead of leaving margins beside the cards.
    fullView: "fill",
  });
  const [frame, setFrame] = useState<Frame>("outside");
  const { props: frameLink } = useFigureLinkTarget("frame", "scene");

  // Text, offsets and hairlines use `u`; the carousel and the balls on it
  // grow with the canvas (`k` for positions, `o` for sizes). Inline k ≤ 1
  // and o = 1, so the drawing is the one it always was.
  const u = (n: number) => n * tokens.scale;
  const k = Math.min(width, height) / BASE_SIZE;
  const objectScale = Math.min(2.6, Math.max(tokens.scale, k));
  const o = (n: number) => n * objectScale;
  const cx = width / 2;
  const cy = height / 2;
  const pxPerM = PX_PER_M * k;
  const rimR = TURNTABLE_R * pxPerM;

  /** Positions on the canvas at time `time`, in the frame being shown. */
  const layoutAt = (time: number) => {
    const angle = OMEGA * time;
    const ballR = BALL_SPEED * time;
    if (frame === "outside") {
      return {
        diskAngle: angle,
        ball: { x: cx + ballR * pxPerM, y: cy },
        rider: {
          x: cx + RIDER_R * pxPerM * Math.cos(angle),
          y: cy + RIDER_R * pxPerM * Math.sin(angle),
        },
      };
    }
    // Rider's view: everything turned back by the carousel angle.
    return {
      diskAngle: 0,
      ball: {
        x: cx + ballR * pxPerM * Math.cos(-angle),
        y: cy + ballR * pxPerM * Math.sin(-angle),
      },
      rider: { x: cx + RIDER_R * pxPerM, y: cy },
    };
  };

  const playbackRef = useRef<ScenePlayback | null>(null);
  const hover = useSceneHover(canvasRef, (px, py) => {
    const { ball, rider } = layoutAt(playbackRef.current?.getTime() ?? 0);
    if (Math.hypot(px - ball.x, py - ball.y) <= o(6) + u(9)) return "ballDistance";
    if (Math.hypot(px - rider.x, py - rider.y) <= o(7) + u(9)) return "riderRadius";
    if (Math.hypot(px - cx, py - cy) <= rimR + u(9)) return "omega";
    return null;
  });
  const { activeKey } = hover;

  const playback = useScenePlayback({
    elementRef: containerRef,
    duration: FLIGHT_TIME,
    draw: (time) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = syncCanvas(canvas, width, height);
      if (!ctx) return;
      const bounds = { width, height };
      const { diskAngle, ball, rider } = layoutAt(time);

      // --- Turntable ---
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(diskAngle);

      ctx.fillStyle = tokens.bg1;
      ctx.beginPath();
      ctx.arc(0, 0, rimR, 0, Math.PI * 2);
      ctx.fill();
      // The spin rate's guide entry picks out the rim that carries it.
      const rimFocused = activeKey === "omega";
      ctx.strokeStyle = rimFocused ? tokens.cyan : tokens.axes;
      ctx.lineWidth = o(rimFocused ? 3 : 2);
      ctx.beginPath();
      ctx.arc(0, 0, rimR, 0, Math.PI * 2);
      ctx.stroke();

      // Spokes (8) make the rotation visible in the outside view.
      ctx.strokeStyle = tokens.gridHeavy;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        ctx.moveTo(0, 0);
        ctx.lineTo(rimR * Math.cos(a), rimR * Math.sin(a));
      }
      ctx.stroke();

      // Reference radius through the rider's seat.
      ctx.strokeStyle = tokens.cyan;
      ctx.lineWidth = o(2);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(rimR, 0);
      ctx.stroke();
      ctx.restore();

      // --- Ball path in the frame shown ---
      if (time > 0) {
        ctx.strokeStyle = tokens.magenta;
        ctx.lineWidth = o(1.5);
        ctx.globalAlpha = 0.55;
        ctx.beginPath();
        if (frame === "outside") {
          ctx.moveTo(cx, cy);
          ctx.lineTo(ball.x, ball.y);
        } else {
          const n = Math.max(2, Math.ceil(time * TRAIL_SAMPLES_PER_S));
          for (let i = 0; i <= n; i++) {
            const tau = (i / n) * time;
            const r = BALL_SPEED * tau * pxPerM;
            const x = cx + r * Math.cos(-OMEGA * tau);
            const y = cy + r * Math.sin(-OMEGA * tau);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Construction line for a distance from the centre, with its value.
      const radius = (to: { x: number; y: number }, color: string, metres: number) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = u(1.5);
        ctx.setLineDash([u(4), u(3)]);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
        ctx.setLineDash([]);
        drawLabel(ctx, `r = ${metres.toFixed(2)} m`, (cx + to.x) / 2, (cy + to.y) / 2 - u(12), {
          bounds,
          color,
          align: "center",
          font: tokens.fontHudSmall,
          plate: tokens.bg1,
          scale: tokens.scale,
        });
      };

      // --- Rider ---
      ctx.fillStyle = tokens.cyan;
      ctx.shadowColor = hexToRgba(tokens.cyan, 0.55);
      ctx.shadowBlur = o(8);
      ctx.beginPath();
      ctx.arc(rider.x, rider.y, o(7), 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // --- Ball ---
      ctx.fillStyle = tokens.magenta;
      ctx.shadowColor = hexToRgba(tokens.magenta, 0.55);
      ctx.shadowBlur = o(10);
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, o(6), 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Centre marker
      ctx.fillStyle = tokens.textDim;
      ctx.beginPath();
      ctx.arc(cx, cy, o(3), 0, Math.PI * 2);
      ctx.fill();

      if (activeKey === "riderRadius") {
        radius(rider, tokens.cyan, RIDER_R);
        drawFocusRing(ctx, rider.x, rider.y, o(7) + u(6), tokens.cyan, tokens.scale);
      }
      if (activeKey === "ballDistance" && time > 0) {
        radius(ball, tokens.magenta, BALL_SPEED * time);
      }
      if (activeKey === "ballDistance") {
        drawFocusRing(ctx, ball.x, ball.y, o(6) + u(6), tokens.magenta, tokens.scale);
      }
      if (rimFocused) {
        drawLabel(ctx, `Ω = ${OMEGA.toFixed(2)} rad/s`, cx, cy - rimR - u(12), {
          bounds,
          color: tokens.cyan,
          align: "center",
          font: tokens.fontHudSmall,
          plate: tokens.bg1,
          scale: tokens.scale,
        });
      }
    },
  });
  playbackRef.current = playback;

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
                label: t("omega"),
                value: `${OMEGA.toFixed(2)} rad/s`,
                guideKey: "omega",
              },
              {
                label: t("riderRadius"),
                value: `${RIDER_R.toFixed(2)} m`,
                color: "var(--color-cyan)",
                guideKey: "riderRadius",
              },
              {
                label: t("ballDistance"),
                value: `${(BALL_SPEED * playback.time).toFixed(2)} m`,
                color: "var(--color-magenta)",
                guideKey: "ballDistance",
              },
            ]}
          />
        </ScenePanel>
        <SceneControlGroup>
          <div className="figure-link flex flex-wrap items-center gap-2" {...frameLink}>
            <span className="text-sm text-[var(--color-fg-2)]">{t("frame")}</span>
            <Button active={frame === "outside"} onClick={() => setFrame("outside")}>
              {t("outside")}
            </Button>
            <Button active={frame === "rider"} onClick={() => setFrame("rider")}>
              {t("rider")}
            </Button>
            <span className="text-xs text-[var(--color-fg-2)]">
              {frame === "outside" ? t("noteOutside") : t("noteRider")}
            </span>
          </div>
        </SceneControlGroup>
      </div>
    </div>
  );
}
