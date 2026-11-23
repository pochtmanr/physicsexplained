"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
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
  useSceneHover,
  useScenePlayback,
  useSceneSize,
  useSceneTokens,
} from "@/components/physics/_shared";
import { acceleration } from "@/lib/physics/newton";

/** Length of the track, in metres; the run ends when the ball reaches it. */
const TRACK_METRES = 10;
/** Inline height cap; objects grow past it in full view. */
const MAX_HEIGHT = 340;
/** Pixels per metre (at scale 1) from which the track gains 1 m marks. Never inline. */
const FINE_TRACK_PX_PER_METRE = 100;

interface Run {
  /** Distance from the start, metres. */
  x: number;
  /** Speed, m/s. */
  v: number;
}

const atRest = (): Run => ({ x: 0, v: 0 });

/** Horizontal arrow from x0 to x1 at height y, head at x1. */
function arrow(
  ctx: CanvasRenderingContext2D,
  x0: number,
  x1: number,
  y: number,
  color: string,
  lineWidth: number,
  headLength: number,
  headHalf: number,
) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.lineTo(x1, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x1 - headLength, y - headHalf);
  ctx.lineTo(x1 - headLength, y + headHalf);
  ctx.closePath();
  ctx.fill();
}

/**
 * FIG.03b — a constant force on a ball that starts at rest: a = F/m.
 *
 * Force and mass can be changed while the ball moves, so its position and
 * speed are stepped from where they are (`simulation`), exactly for a
 * constant acceleration over each step, instead of restarting the run.
 */
export function FMaScene() {
  const t = useTranslations("scenes.fMa");
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.55,
    maxHeight: MAX_HEIGHT,
    minHeight: 150,
    initialWidth: 640,
    // The track stretches to any width and the ball grows with the height.
    fullView: "fill",
  });
  const [force, setForce] = useState(4); // N
  const [mass, setMass] = useState(2); // kg
  const reducedMotion = useReducedMotion();
  const runRef = useRef<Run>(atRest());
  /** A knob was changed after the run ended and it has not been replayed. */
  const staleRunRef = useRef(false);

  const a = acceleration(force, mass);

  // Text, ticks and hairlines scale with `u`; the ball and its arrow with
  // `o`, which also follows the canvas height.
  const scale = tokens.scale;
  const u = (n: number) => n * scale;
  const objectScale = Math.min(2.6, Math.max(scale, height / MAX_HEIGHT));
  const o = (n: number) => n * objectScale;

  const padX = u(30);
  const floorY = height - u(30) - o(30);
  const plotLeft = padX;
  const plotRight = width - padX;
  const trackW = plotRight - plotLeft;
  const pxPerMetre = trackW / TRACK_METRES;
  const toPx = (metres: number) => plotLeft + Math.min(metres, TRACK_METRES) * pxPerMetre;
  const ballR = o(8 + Math.sqrt(mass) * 4);
  const ballY = floorY - ballR - o(2);
  const arrowLen = o(Math.min(90, force * 10));
  const tickRowBottom = floorY + u(26);

  // The ball (its mass), the force arrow, or the track's metre marks.
  const hover = useSceneHover(canvasRef, (px, py) => {
    const ballX = toPx(runRef.current.x);
    const reach = u(9);
    if (Math.hypot(px - ballX, py - ballY) <= ballR + reach) return "mass";
    const x0 = ballX + ballR + o(2);
    if (px >= x0 && px <= x0 + arrowLen + reach && Math.abs(py - ballY) <= reach) return "force";
    if (px >= plotLeft - reach && px <= plotRight + reach && py >= floorY - u(4) && py <= tickRowBottom) {
      return "position";
    }
    return null;
  });
  const { activeKey } = hover;

  const playback = useScenePlayback({
    elementRef: containerRef,
    simulation: {
      step: (dt) => {
        const { x, v } = runRef.current;
        const nextX = x + v * dt + 0.5 * a * dt * dt;
        if (nextX >= TRACK_METRES) {
          // Arrive exactly at the end, with the speed the constant force gives there.
          runRef.current = { x: TRACK_METRES, v: Math.sqrt(v * v + 2 * a * (TRACK_METRES - x)) };
        } else {
          runRef.current = { x: nextX, v: v + a * dt };
        }
      },
      reset: () => {
        runRef.current = atRest();
      },
      isDone: () => runRef.current.x >= TRACK_METRES,
    },
    draw: () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = syncCanvas(canvas, width, height);
      if (!ctx) return;
      const bounds = { width, height };
      const { x } = runRef.current;

      // Floor
      ctx.strokeStyle = tokens.axes;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(plotLeft, floorY);
      ctx.lineTo(plotRight, floorY);
      ctx.stroke();

      // Metre marks, numbered every 2 m; single metres once there is room.
      const positionFocused = activeKey === "position";
      ctx.strokeStyle = positionFocused ? tokens.cyan : tokens.gridHeavy;
      ctx.lineWidth = positionFocused ? u(1.5) : 1;
      if (pxPerMetre >= u(FINE_TRACK_PX_PER_METRE)) {
        ctx.beginPath();
        for (let m = 1; m < TRACK_METRES; m += 2) {
          ctx.moveTo(toPx(m), floorY);
          ctx.lineTo(toPx(m), floorY + u(3));
        }
        ctx.stroke();
      }
      for (let m = 0; m <= TRACK_METRES; m += 2) {
        const px = toPx(m);
        ctx.beginPath();
        ctx.moveTo(px, floorY);
        ctx.lineTo(px, floorY + u(6));
        ctx.stroke();
        drawLabel(ctx, m === TRACK_METRES ? `${m} m` : `${m}`, px, floorY + u(18), {
          bounds,
          color: positionFocused ? tokens.cyan : tokens.textLabel,
          align: "center",
          font: tokens.fontHudSmall,
        });
      }
      ctx.lineWidth = 1;

      const ballX = toPx(x);

      // Distance covered, while the position is pointed at.
      if (positionFocused && x > 0) {
        ctx.strokeStyle = tokens.cyan;
        ctx.lineWidth = u(1.5);
        ctx.setLineDash([u(4), u(3)]);
        ctx.beginPath();
        ctx.moveTo(plotLeft, floorY - u(4));
        ctx.lineTo(ballX, floorY - u(4));
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Force arrow: length follows F.
      const forceFocused = activeKey === "force" || activeKey === "acceleration";
      const x0 = ballX + ballR + o(2);
      arrow(ctx, x0, x0 + arrowLen, ballY, tokens.cyan, o(forceFocused ? 3 : 2), o(6), o(4));

      // Ball with glow; its size follows the mass.
      ctx.shadowColor = hexToRgba(tokens.cyan, 0.5);
      ctx.shadowBlur = o(14);
      ctx.fillStyle = tokens.textBright;
      ctx.beginPath();
      ctx.arc(ballX, ballY, ballR, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      if (activeKey === "mass") {
        drawFocusRing(ctx, ballX, ballY, ballR + u(6), tokens.textBright, scale);
      }
    },
  });

  // A new force or mass never restarts a run in progress: the next step uses
  // the new acceleration. A finished run has nothing left to show the change
  // on, so it starts again once the reader lets go of the slider.
  const change = (setter: (n: number) => void, current: number) => (next: number) => {
    if (next === current) return;
    setter(next);
    if (playback.status === "ended") staleRunRef.current = true;
  };
  const commit = () => {
    if (!staleRunRef.current) return;
    staleRunRef.current = false;
    if (playback.status !== "ended") return;
    if (reducedMotion) playback.seek(0);
    else playback.replay();
  };

  const { x, v } = runRef.current;

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
              {
                label: "a = F/m",
                value: `${a.toFixed(2)} m/s²`,
                color: "var(--color-cyan)",
                guideKey: "acceleration",
              },
              { label: "v", value: `${v.toFixed(2)} m/s`, guideKey: "velocity" },
              { label: "x", value: `${x.toFixed(2)} m`, guideKey: "position" },
            ]}
          />
        </ScenePanel>
        <SceneControlGroup>
          <SceneSlider
            label={t("force")}
            guideKey="force"
            value={force}
            min={0.5}
            max={10}
            step={0.1}
            onChange={change(setForce, force)}
            onCommit={commit}
            display={`${force.toFixed(1)} N`}
          />
          <SceneSlider
            label={t("mass")}
            guideKey="mass"
            value={mass}
            min={0.5}
            max={8}
            step={0.1}
            onChange={change(setMass, mass)}
            onCommit={commit}
            display={`${mass.toFixed(1)} kg`}
          />
        </SceneControlGroup>
      </div>
    </div>
  );
}
