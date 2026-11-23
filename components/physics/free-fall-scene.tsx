"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import {
  SCENE_CANVAS_CLASS,
  SceneControlGroup,
  SceneControls,
  SceneReadout,
  SceneSlider,
  drawLabel,
  hexToRgba,
  syncCanvas,
  useScenePlayback,
  useSceneSize,
  useSceneTokens,
} from "@/components/physics/_shared";
import {
  FEATHER_TAU,
  HAMMER_TAU,
  stepFall,
  stepFallToFloor,
  tauAtAir,
  timeToFloor,
  type FallState,
} from "@/lib/physics/free-fall-drag";

/** Drop height in metres. */
const FALL_HEIGHT = 2.2;
/** The drop lasts well under a second in vacuum, so it is shown at half speed. */
const PLAYBACK_RATE = 0.5;

/** Half the drawn height of either object, so both rest with their base on the floor. */
const OBJECT_HALF_HEIGHT = 12;
/** Ruler marks below the release height, as heights above the floor in metres. */
const RULER_MARKS = [0, 0.5, 1, 1.5, 2];

interface Faller extends FallState {
  /** Scene time at which it touched the floor, or null while still falling. */
  landedAt: number | null;
  /** Speed just before touching down (m/s); 0 until it lands. */
  impactSpeed: number;
}

interface Drop {
  hammer: Faller;
  feather: Faller;
}

const atRelease = (): Drop => ({
  hammer: { x: 0, v: 0, landedAt: null, impactSpeed: 0 },
  feather: { x: 0, v: 0, landedAt: null, impactSpeed: 0 },
});

/** Advance one object, noting the moment it lands. */
function advance(body: Faller, dt: number, elapsed: number, tau: number): Faller {
  if (body.landedAt !== null) return body;
  const { state, landedAfter } = stepFallToFloor(body, dt, tau, FALL_HEIGHT);
  if (landedAfter === null) return { ...state, landedAt: null, impactSpeed: 0 };
  return {
    ...state,
    landedAt: elapsed + landedAfter,
    impactSpeed: stepFall(body, landedAfter, tau).v,
  };
}

/**
 * FIG.01c — hammer and feather. Reference scene for the scene kit: playback
 * through `useScenePlayback`, the standard control bar, a parameter slider
 * and HTML readouts. Copy this file when converting another animated scene.
 *
 * The air can be changed while the objects fall, so the motion is stepped
 * from the current position and speed (`simulation`) instead of being read
 * off a formula that assumes the same air since release.
 */
export function FreeFallScene() {
  const t = useTranslations("scenes.freeFall");
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.75,
    maxHeight: 420,
    minHeight: 260,
    initialWidth: 500,
    fullView: "ratio",
  });
  /** Air density as a percentage of normal air: 0 = vacuum, 100 = sea level. */
  const [airPct, setAirPct] = useState(100);

  const reducedMotion = useReducedMotion();
  const dropRef = useRef<Drop>(atRelease());
  /** The air was changed after the drop finished and has not been replayed yet. */
  const staleRunRef = useRef(false);

  const hammerTau = tauAtAir(HAMMER_TAU, airPct / 100);
  const featherTau = tauAtAir(FEATHER_TAU, airPct / 100);

  const playback = useScenePlayback({
    elementRef: containerRef,
    rate: PLAYBACK_RATE,
    simulation: {
      step: (dt, elapsed) => {
        const drop = dropRef.current;
        dropRef.current = {
          hammer: advance(drop.hammer, dt, elapsed, hammerTau),
          feather: advance(drop.feather, dt, elapsed, featherTau),
        };
      },
      reset: () => {
        dropRef.current = atRelease();
      },
      isDone: () =>
        dropRef.current.hammer.landedAt !== null && dropRef.current.feather.landedAt !== null,
    },
    draw: () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = syncCanvas(canvas, width, height);
      if (!ctx) return;
      const bounds = { width, height };

      const padX = 30;
      const topY = 44;
      const floorY = height - 16;
      const fallPx = floorY - topY;
      const hammerX = width * 0.3;
      const featherX = width * 0.7;

      // Objects are drawn standing on the floor, so their centres travel the
      // drop height less their half-height. One scale for both and the ruler.
      const pxPerMetre = (fallPx - OBJECT_HALF_HEIGHT) / FALL_HEIGHT;
      const { hammer, feather } = dropRef.current;
      const hammerY = topY + hammer.x * pxPerMetre;
      const featherY = topY + feather.x * pxPerMetre;

      // Air: faint tint over the drop zone, denser with more air.
      if (airPct > 0) {
        ctx.fillStyle = hexToRgba(tokens.blue, 0.02 + 0.08 * (airPct / 100));
        ctx.fillRect(padX, topY, width - padX * 2, fallPx);
      }

      // Floor
      ctx.strokeStyle = tokens.axes;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padX, floorY);
      ctx.lineTo(width - padX, floorY);
      ctx.stroke();

      // Release line, at the height the objects' bases start from.
      const releaseY = floorY - FALL_HEIGHT * pxPerMetre;
      ctx.strokeStyle = tokens.axes;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(padX, releaseY);
      ctx.lineTo(width - padX, releaseY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Column divider
      ctx.strokeStyle = tokens.gridHeavy;
      ctx.beginPath();
      ctx.moveTo(width / 2, topY - 10);
      ctx.lineTo(width / 2, floorY);
      ctx.stroke();

      // Height ruler: where the base of an object is, in metres above the floor.
      for (const mark of RULER_MARKS) {
        const y = floorY - mark * pxPerMetre;
        ctx.strokeStyle = tokens.axes;
        ctx.beginPath();
        ctx.moveTo(padX, y);
        ctx.lineTo(padX + 5, y);
        ctx.stroke();
        // The floor's own number sits just above the floor line.
        drawLabel(ctx, String(mark), padX + 9, mark === 0 ? y - 8 : y, {
          bounds,
          color: tokens.textLabel,
          font: tokens.fontHudSmall,
        });
      }
      // The release height carries the unit for the whole scale.
      drawLabel(ctx, `${FALL_HEIGHT} m`, padX + 9, releaseY - 10, {
        bounds,
        color: tokens.textLabel,
        font: tokens.fontHudSmall,
      });

      drawLabel(ctx, t("hammer"), hammerX, topY - 22, {
        bounds,
        color: tokens.textDim,
        align: "center",
        direction: "inherit",
      });
      drawLabel(ctx, t("feather"), featherX, topY - 22, {
        bounds,
        color: tokens.textDim,
        align: "center",
        direction: "inherit",
      });

      // Hammer, head down: a wide head on the floor side, a thin handle above.
      ctx.fillStyle = tokens.textDim;
      ctx.beginPath();
      ctx.roundRect(hammerX - 15, hammerY + 1, 30, 11, 2);
      ctx.fill();
      ctx.fillRect(hammerX - 3, hammerY - 14, 6, 16);

      // Feather: teardrop vane + spine
      ctx.fillStyle = tokens.amber;
      ctx.beginPath();
      ctx.moveTo(featherX, featherY - 14);
      ctx.quadraticCurveTo(featherX + 10, featherY - 2, featherX, featherY + 12);
      ctx.quadraticCurveTo(featherX - 10, featherY - 2, featherX, featherY - 14);
      ctx.fill();
      ctx.strokeStyle = tokens.bg;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(featherX, featherY - 12);
      ctx.lineTo(featherX, featherY + 11);
      ctx.stroke();
    },
  });

  // Changing the air never restarts a drop in progress: the next step uses the
  // new drag, so the objects speed up or slow down from where they are.
  const changeAir = (pct: number) => {
    if (pct === airPct) return;
    setAirPct(pct);
    if (playback.status === "ended") staleRunRef.current = true;
  };

  // A finished drop has nothing left to show the change on, so drop again —
  // once, when the reader lets go, not on every step of a drag.
  const commitAir = () => {
    if (!staleRunRef.current) return;
    staleRunRef.current = false;
    // The reader may have started a new drop themselves in the meantime.
    if (playback.status === "ended") showFreshDrop();
  };

  // The finished drop was made in different air, so its numbers no longer
  // apply. Drop again, or with reduced motion go back to the top and wait,
  // where the readouts forecast the new drop.
  const showFreshDrop = () => {
    if (reducedMotion) playback.seek(0);
    else playback.replay();
  };

  /** A button press is a change and its release in one. */
  const pickAir = (pct: number) => {
    if (pct === airPct) return;
    setAirPct(pct);
    if (playback.status === "ended") showFreshDrop();
  };

  // Readouts follow the live state; the component re-renders as the playback
  // clock ticks. A landing time is measured once the object is down and
  // forecast from its current position and speed until then.
  const { hammer, feather } = dropRef.current;
  const landingTime = (body: Faller, tau: number) =>
    body.landedAt ?? playback.getTime() + timeToFloor(body, FALL_HEIGHT, tau);
  const hammerLands = landingTime(hammer, hammerTau);
  const featherLands = landingTime(feather, featherTau);

  return (
    <div ref={containerRef} className="w-full pb-4">
      <div className="mx-auto" style={{ width }}>
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={t("aria")}
          className={SCENE_CANVAS_CLASS}
          style={{ width, height }}
        />
        <SceneControls playback={playback} note={t("slowMotion")} />
        <SceneReadout
          items={[
            { label: t("hammerLands"), value: `${hammerLands.toFixed(2)} s` },
            {
              label: t("featherLands"),
              value: `${featherLands.toFixed(2)} s`,
              color: "var(--color-amber)",
            },
            {
              label: t("featherSpeed"),
              // Once down, keep showing the speed it arrived with.
              value: `${(feather.landedAt === null ? feather.v : feather.impactSpeed).toFixed(2)} m/s`,
              color: "var(--color-amber)",
            },
          ]}
        />
        <SceneControlGroup>
          <SceneSlider
            label={t("air")}
            value={airPct}
            min={0}
            max={100}
            step={5}
            onChange={changeAir}
            onCommit={commitAir}
            display={`${airPct} %`}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button active={airPct === 0} onClick={() => pickAir(0)}>
              {t("vacuum")}
            </Button>
            <Button active={airPct === 100} onClick={() => pickAir(100)}>
              {t("normalAir")}
            </Button>
            <span className="text-xs text-[var(--color-fg-2)]">
              {airPct === 0 ? t("noteVacuum") : t("noteAir")}
            </span>
          </div>
        </SceneControlGroup>
      </div>
    </div>
  );
}
