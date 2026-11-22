"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
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
  fallDistance,
  fallSpeed,
  fallTime,
  tauAtAir,
} from "@/lib/physics/free-fall-drag";

/** Drop height in metres. */
const FALL_HEIGHT = 2.2;
/** The drop lasts well under a second in vacuum, so it is shown at half speed. */
const PLAYBACK_RATE = 0.5;

/**
 * FIG.01c — hammer and feather. Reference scene for the scene kit: playback
 * through `useScenePlayback`, the standard control bar, a parameter slider
 * and HTML readouts. Copy this file when converting another animated scene.
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

  const hammerTau = tauAtAir(HAMMER_TAU, airPct / 100);
  const featherTau = tauAtAir(FEATHER_TAU, airPct / 100);
  const hammerLands = fallTime(FALL_HEIGHT, hammerTau);
  const featherLands = fallTime(FALL_HEIGHT, featherTau);
  const duration = Math.max(hammerLands, featherLands);

  const playback = useScenePlayback({
    elementRef: containerRef,
    duration,
    rate: PLAYBACK_RATE,
    draw: (time) => {
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

      const hammerM = Math.min(fallDistance(time, hammerTau), FALL_HEIGHT);
      const featherM = Math.min(fallDistance(time, featherTau), FALL_HEIGHT);
      // Objects are drawn standing on the floor, so offset by their half-height.
      const hammerY = topY + (hammerM / FALL_HEIGHT) * (fallPx - 12);
      const featherY = topY + (featherM / FALL_HEIGHT) * (fallPx - 10);

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

      // Release line
      ctx.strokeStyle = tokens.gridHeavy;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(padX, topY);
      ctx.lineTo(width - padX, topY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Column divider
      ctx.beginPath();
      ctx.moveTo(width / 2, topY - 10);
      ctx.lineTo(width / 2, floorY);
      ctx.stroke();

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

      // Hammer: handle + head
      ctx.fillStyle = tokens.textDim;
      ctx.beginPath();
      ctx.roundRect(hammerX - 10, hammerY - 12, 20, 24, 3);
      ctx.fill();
      ctx.fillRect(hammerX - 16, hammerY - 14, 32, 8);

      // Feather: teardrop vane + spine
      ctx.fillStyle = tokens.amber;
      ctx.beginPath();
      ctx.moveTo(featherX, featherY - 16);
      ctx.quadraticCurveTo(featherX + 10, featherY - 4, featherX, featherY + 10);
      ctx.quadraticCurveTo(featherX - 10, featherY - 4, featherX, featherY - 16);
      ctx.fill();
      ctx.strokeStyle = tokens.bg;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(featherX, featherY - 14);
      ctx.lineTo(featherX, featherY + 9);
      ctx.stroke();
    },
  });

  // A new air density is a new experiment: back to the top and drop again.
  const changeAir = (pct: number) => {
    setAirPct(pct);
    playback.restart();
  };

  const featherSpeed = fallSpeed(Math.min(playback.time, featherLands), featherTau);

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
              value: `${featherSpeed.toFixed(2)} m/s`,
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
            display={`${airPct} %`}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button active={airPct === 0} onClick={() => changeAir(0)}>
              {t("vacuum")}
            </Button>
            <Button active={airPct === 100} onClick={() => changeAir(100)}>
              {t("normalAir")}
            </Button>
            <span className="text-xs text-[var(--color-fg-3)]">
              {airPct === 0 ? t("noteVacuum") : t("noteAir")}
            </span>
          </div>
        </SceneControlGroup>
      </div>
    </div>
  );
}
