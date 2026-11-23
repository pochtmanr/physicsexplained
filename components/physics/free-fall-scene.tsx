"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
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

/**
 * Half the drawn height of either object at scale 1, so both rest with their
 * base on the floor.
 */
const OBJECT_HALF_HEIGHT = 12;
/** Readout and control keys that are about each object (see figure-guides.ts). */
const HAMMER_KEYS = ["hammerLands"];
const FEATHER_KEYS = ["featherLands", "featherSpeed"];
/** Ruler marks below the release height, as heights above the floor in metres. */
const RULER_MARKS = [0, 0.5, 1, 1.5, 2];
/** Unnumbered ruler marks between them, drawn only where the scale is large enough. */
const RULER_MINOR_STEP = 0.1;
/** Pixels per metre (at scale 1) from which the ruler gains minor marks and height lines. */
const FINE_RULER_PX_PER_METRE = 200;

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
    // The two columns and the ruler adapt to any shape, so the full view uses
    // the whole width instead of leaving empty margins beside the drawing.
    fullView: "fill",
  });
  /** Air density as a percentage of normal air: 0 = vacuum, 100 = sea level. */
  const [airPct, setAirPct] = useState(100);

  const reducedMotion = useReducedMotion();
  const dropRef = useRef<Drop>(atRelease());
  /** The air was changed after the drop finished and has not been replayed yet. */
  const staleRunRef = useRef(false);

  const hammerTau = tauAtAir(HAMMER_TAU, airPct / 100);
  const featherTau = tauAtAir(FEATHER_TAU, airPct / 100);

  // Every pixel size goes through `u`, so text and objects grow together in
  // full view on a large screen (docs/figure-full-view.md).
  const scale = tokens.scale;
  const u = (n: number) => n * scale;

  // The hammer and feather also grow with the drop height, so they do not
  // shrink to specks on a tall canvas. Inline (height ≤ 420) this is 1.
  const objectScale = Math.min(2.6, Math.max(scale, height / 420));
  const o = (n: number) => n * objectScale;

  const padX = u(30);
  // The column titles keep their place under the top edge. The drop zone
  // starts far enough below them for an object waiting at the release line,
  // which stands 14 units above its centre: 44 px inline, more once the
  // objects outgrow the text in full view.
  const titleY = u(22);
  const topY = u(23) + o(21);
  const floorY = height - u(16);
  const fallPx = floorY - topY;
  const hammerX = width * 0.3;
  const featherX = width * 0.7;
  // Objects are drawn standing on the floor, so their centres travel the
  // drop height less their half-height. One scale for both and the ruler.
  const pxPerMetre = (fallPx - o(OBJECT_HALF_HEIGHT)) / FALL_HEIGHT;
  // A large drop has room for a finer ruler, and its columns are far from the
  // numbers, so the heights are carried across. Never the case inline.
  const fineRuler = pxPerMetre >= u(FINE_RULER_PX_PER_METRE);

  // Pointing at an object (or its name above the column) means its landing time.
  const hover = useSceneHover(canvasRef, (px, py) => {
    const { hammer, feather } = dropRef.current;
    const near = (x: number, fallen: number) => {
      const y = topY + fallen * pxPerMetre;
      return (
        Math.hypot(px - x, py - y) <= o(30) || (Math.abs(px - x) <= u(44) && py <= titleY + u(14))
      );
    };
    if (near(hammerX, hammer.x)) return "hammerLands";
    if (near(featherX, feather.x)) return "featherLands";
    return null;
  });
  const { activeKey } = hover;
  const hammerFocused = activeKey !== null && HAMMER_KEYS.includes(activeKey);
  const featherFocused = activeKey !== null && FEATHER_KEYS.includes(activeKey);

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

      const { hammer, feather } = dropRef.current;
      const hammerY = topY + hammer.x * pxPerMetre;
      const featherY = topY + feather.x * pxPerMetre;

      // Air: faint tint over the drop zone, denser with more air.
      if (airPct > 0) {
        ctx.fillStyle = hexToRgba(tokens.blue, 0.02 + 0.08 * (airPct / 100));
        ctx.fillRect(padX, topY, width - padX * 2, fallPx);
      }
      // The air slider's guide entry picks out the region it fills.
      if (activeKey === "air") {
        ctx.strokeStyle = tokens.blue;
        ctx.lineWidth = u(1.5);
        ctx.setLineDash([u(4), u(3)]);
        ctx.strokeRect(padX, topY, width - padX * 2, fallPx);
        ctx.setLineDash([]);
      }

      // Floor: as heavy as the objects standing on it, and thickened downwards
      // so its top edge stays where their bases come to rest.
      const floorWidth = o(1);
      ctx.strokeStyle = tokens.axes;
      ctx.lineWidth = floorWidth;
      ctx.beginPath();
      ctx.moveTo(padX, floorY + (floorWidth - 1) / 2);
      ctx.lineTo(width - padX, floorY + (floorWidth - 1) / 2);
      ctx.stroke();

      // Release line, at the height the objects' bases start from.
      const releaseY = floorY - FALL_HEIGHT * pxPerMetre;
      ctx.strokeStyle = tokens.axes;
      ctx.lineWidth = u(1);
      ctx.setLineDash([u(3), u(3)]);
      ctx.beginPath();
      ctx.moveTo(padX, releaseY);
      ctx.lineTo(width - padX, releaseY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Column divider
      ctx.strokeStyle = tokens.gridHeavy;
      ctx.beginPath();
      ctx.moveTo(width / 2, topY - u(10));
      ctx.lineTo(width / 2, floorY);
      ctx.stroke();

      // Height ruler: where the base of an object is, in metres above the floor.
      if (fineRuler) {
        ctx.strokeStyle = tokens.axes;
        ctx.beginPath();
        for (let i = 1; i * RULER_MINOR_STEP < FALL_HEIGHT; i++) {
          if (i % 5 === 0) continue; // a numbered mark
          const y = floorY - i * RULER_MINOR_STEP * pxPerMetre;
          ctx.moveTo(padX, y);
          ctx.lineTo(padX + u(3), y);
        }
        ctx.stroke();
      }
      for (const mark of RULER_MARKS) {
        const y = floorY - mark * pxPerMetre;
        ctx.strokeStyle = tokens.axes;
        ctx.beginPath();
        ctx.moveTo(padX, y);
        ctx.lineTo(padX + u(5), y);
        ctx.stroke();
        // The floor's own number sits just above the floor line.
        const box = drawLabel(ctx, String(mark), padX + u(9), mark === 0 ? y - u(8) : y, {
          bounds,
          color: tokens.textLabel,
          font: tokens.fontHudSmall,
        });
        // Height line across both columns, starting clear of the number.
        if (fineRuler && mark > 0) {
          ctx.strokeStyle = hexToRgba(tokens.axes, 0.35);
          ctx.beginPath();
          ctx.moveTo(box.x + box.width + u(6), y);
          ctx.lineTo(width - padX, y);
          ctx.stroke();
        }
      }
      // The release height carries the unit for the whole scale.
      drawLabel(ctx, `${FALL_HEIGHT} m`, padX + u(9), releaseY - u(10), {
        bounds,
        color: tokens.textLabel,
        font: tokens.fontHudSmall,
      });

      // Column titles: the larger label size, and bright while their object
      // is pointed at.
      drawLabel(ctx, t("hammer"), hammerX, titleY, {
        bounds,
        color: hammerFocused ? tokens.textBright : tokens.textDim,
        align: "center",
        direction: "inherit",
        font: tokens.fontHudLarge,
      });
      drawLabel(ctx, t("feather"), featherX, titleY, {
        bounds,
        color: featherFocused ? tokens.textBright : tokens.textDim,
        align: "center",
        direction: "inherit",
        font: tokens.fontHudLarge,
      });

      // Hammer, head down: a wide head on the floor side, a thin handle above.
      ctx.fillStyle = tokens.textDim;
      ctx.beginPath();
      ctx.roundRect(hammerX - o(15), hammerY + o(1), o(30), o(11), o(2));
      ctx.fill();
      ctx.fillRect(hammerX - o(3), hammerY - o(14), o(6), o(16));
      if (hammerFocused) drawFocusRing(ctx, hammerX, hammerY, o(21), tokens.textBright, scale);

      // Feather: teardrop vane + spine
      ctx.fillStyle = tokens.amber;
      ctx.beginPath();
      ctx.moveTo(featherX, featherY - o(14));
      ctx.quadraticCurveTo(featherX + o(10), featherY - o(2), featherX, featherY + o(12));
      ctx.quadraticCurveTo(featherX - o(10), featherY - o(2), featherX, featherY - o(14));
      ctx.fill();
      ctx.strokeStyle = tokens.bg;
      ctx.lineWidth = o(1);
      ctx.beginPath();
      ctx.moveTo(featherX, featherY - o(12));
      ctx.lineTo(featherX, featherY + o(11));
      ctx.stroke();
      if (featherFocused) drawFocusRing(ctx, featherX, featherY, o(21), tokens.amber, scale);
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
          <SceneControls playback={playback} note={t("slowMotion")} noteKey="slowMotion" />
          <SceneReadout
            items={[
              {
                label: t("hammerLands"),
                value: `${hammerLands.toFixed(2)} s`,
                guideKey: "hammerLands",
              },
              {
                label: t("featherLands"),
                value: `${featherLands.toFixed(2)} s`,
                color: "var(--color-amber)",
                guideKey: "featherLands",
              },
              {
                label: t("featherSpeed"),
                // Once down, keep showing the speed it arrived with.
                value: `${(feather.landedAt === null ? feather.v : feather.impactSpeed).toFixed(2)} m/s`,
                color: "var(--color-amber)",
                guideKey: "featherSpeed",
              },
            ]}
          />
        </ScenePanel>
        <SceneControlGroup>
          <SceneSlider
            label={t("air")}
            guideKey="air"
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
