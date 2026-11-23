"use client";

import { useRef, useState } from "react";
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
  syncCanvas,
  type ScenePlayback,
  useSceneHover,
  useScenePlayback,
  useSceneSize,
  useSceneTokens,
} from "@/components/physics/_shared";

/** Seconds for the centre of mass to cross the scene. */
const DURATION = 10;
/** Spin rate of the rod about the centre of mass, rad/s. */
const OMEGA = 1.6;
/** Rod length in metres; the light mass is 1 kg. */
const ROD = 1;
const MASS_LIGHT = 1;
/** Largest heavy-to-light mass ratio the slider allows. */
const RATIO_MAX = 4;
/** Inline height cap; the drawing grows past it in full view. */
const MAX_HEIGHT = 360;

/**
 * FIG.06a — two unequal masses on a rigid rod, spinning about their common
 * centre of mass while it glides along a straight line. The masses trace
 * loops of different radii; the centre of mass does not.
 *
 * Balance: m₁·r₁ = m₂·r₂ (the centre of mass divides the rod inversely to
 * the masses). Everything is a function of time, so the mass ratio can be
 * changed at any moment.
 */
export function CenterOfMassScene() {
  const t = useTranslations("scenes.centerOfMass");
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.6,
    maxHeight: MAX_HEIGHT,
    minHeight: 160,
    initialWidth: 640,
    // The path stretches to any width and the rod grows with the height.
    fullView: "fill",
  });
  const [ratio, setRatio] = useState(3); // m₁ / m₂
  const playbackRef = useRef<ScenePlayback | null>(null);

  const massHeavy = MASS_LIGHT * ratio;
  // Distances from the centre of mass, in metres.
  const r1 = (MASS_LIGHT / (massHeavy + MASS_LIGHT)) * ROD;
  const r2 = (massHeavy / (massHeavy + MASS_LIGHT)) * ROD;

  // Text and offsets scale with `u`; the rod and masses with `o`, which also
  // follows the canvas height.
  const scale = tokens.scale;
  const u = (n: number) => n * scale;
  const objectScale = Math.min(2.6, Math.max(scale, height / MAX_HEIGHT));
  const o = (n: number) => n * objectScale;

  const radiusOf = (m: number) => o(8 * Math.pow(m / MASS_LIGHT, 0.51));
  const rHeavy = radiusOf(massHeavy);
  const rLight = radiusOf(MASS_LIGHT);
  // The light mass swings furthest: at most RATIO_MAX / (RATIO_MAX + 1) of the
  // rod from the centre. Size the rod so it stays inside the canvas at every
  // ratio, and keep the path far enough from the sides.
  const reach = RATIO_MAX / (RATIO_MAX + 1);
  const margin = u(6);
  const rodPx = Math.max(
    0,
    Math.min(
      o(220),
      width * 0.35,
      (height / 2 - margin - rLight) / reach,
      (width * 0.35 - margin - rLight) / reach,
    ),
  );
  const pad = Math.max(width * 0.15, rodPx * reach + rLight + margin);
  const comY = height / 2;

  const poseAt = (time: number) => {
    const comX = pad + (time / DURATION) * (width - 2 * pad);
    const angle = OMEGA * time;
    return {
      comX,
      heavyX: comX - Math.cos(angle) * r1 * rodPx,
      heavyY: comY - Math.sin(angle) * r1 * rodPx,
      lightX: comX + Math.cos(angle) * r2 * rodPx,
      lightY: comY + Math.sin(angle) * r2 * rodPx,
    };
  };

  // A mass means its distance from the centre of mass; the dot or its path
  // means the centre of mass.
  const hover = useSceneHover(canvasRef, (px, py) => {
    const p = poseAt(playbackRef.current?.getTime() ?? 0);
    const near = u(9);
    if (Math.hypot(px - p.comX, py - comY) <= o(5) + near) return "com";
    if (Math.hypot(px - p.lightX, py - p.lightY) <= rLight + near) return "r2";
    if (Math.hypot(px - p.heavyX, py - p.heavyY) <= rHeavy + near) return "r1";
    if (Math.abs(py - comY) <= near && px >= pad && px <= width - pad) return "com";
    return null;
  });
  const { activeKey } = hover;

  const playback = useScenePlayback({
    elementRef: containerRef,
    duration: DURATION,
    draw: (time) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = syncCanvas(canvas, width, height);
      if (!ctx) return;
      const bounds = { width, height };
      const p = poseAt(time);

      // Caption, under everything that moves.
      drawLabel(ctx, "m₁·r₁ = m₂·r₂", u(16), u(18), {
        bounds,
        color: activeKey === "balance" ? tokens.textBright : tokens.textLabel,
        font: tokens.fontHudSmall,
      });

      // Straight path of the centre of mass
      const comFocused = activeKey === "com";
      ctx.strokeStyle = comFocused ? tokens.magenta : tokens.gridHeavy;
      ctx.lineWidth = comFocused ? u(1.5) : 1;
      ctx.setLineDash([u(3), u(5)]);
      ctx.beginPath();
      ctx.moveTo(pad, comY);
      ctx.lineTo(width - pad, comY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Rod
      ctx.strokeStyle = tokens.textDim;
      ctx.lineWidth = o(2);
      ctx.beginPath();
      ctx.moveTo(p.heavyX, p.heavyY);
      ctx.lineTo(p.lightX, p.lightY);
      ctx.stroke();

      // The arm of each mass, while its distance (or the balance) is pointed at.
      const arm = (x: number, y: number, label: string, side: number) => {
        ctx.strokeStyle = tokens.cyan;
        ctx.lineWidth = o(3);
        ctx.beginPath();
        ctx.moveTo(p.comX, comY);
        ctx.lineTo(x, y);
        ctx.stroke();
        // Name on a plate beside the middle of the arm.
        const mx = (p.comX + x) / 2;
        const my = (comY + y) / 2;
        const len = Math.hypot(x - p.comX, y - comY) || 1;
        const nx = (-(y - comY) / len) * side;
        const ny = ((x - p.comX) / len) * side;
        drawLabel(ctx, label, mx + nx * u(14), my + ny * u(14), {
          bounds,
          color: tokens.cyan,
          align: "center",
          font: tokens.fontHudSmall,
          plate: tokens.bg,
          scale,
        });
      };
      if (activeKey === "r1" || activeKey === "balance" || activeKey === "ratio") {
        arm(p.heavyX, p.heavyY, "r₁", 1);
      }
      if (activeKey === "r2" || activeKey === "balance") arm(p.lightX, p.lightY, "r₂", 1);

      // Masses, labelled in units of the light one.
      const mass = (x: number, y: number, r: number, text: string) => {
        ctx.fillStyle = tokens.textDim;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.save();
        ctx.fillStyle = tokens.bg;
        ctx.font = tokens.fontHudSmall;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.direction = "ltr";
        ctx.fillText(text, x, y);
        ctx.restore();
      };
      mass(p.heavyX, p.heavyY, rHeavy, ratio === 1 ? "m" : `${ratio}m`);
      mass(p.lightX, p.lightY, rLight, "m");
      if (activeKey === "r1" || activeKey === "ratio") {
        drawFocusRing(ctx, p.heavyX, p.heavyY, rHeavy + u(5), tokens.cyan, scale);
      }
      if (activeKey === "r2") {
        drawFocusRing(ctx, p.lightX, p.lightY, rLight + u(5), tokens.cyan, scale);
      }

      // Centre-of-mass marker
      ctx.save();
      ctx.fillStyle = tokens.magenta;
      ctx.shadowColor = tokens.magenta;
      ctx.shadowBlur = u(10);
      ctx.beginPath();
      ctx.arc(p.comX, comY, o(5), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      if (comFocused) drawFocusRing(ctx, p.comX, comY, o(5) + u(6), tokens.magenta, scale);

      drawLabel(ctx, t("com"), p.comX, comY - o(5) - u(9), {
        bounds,
        color: tokens.magenta,
        align: "center",
        baseline: "bottom",
        font: tokens.fontHudSmall,
        direction: "inherit",
      });
    },
  });
  // The hit test above runs between renders and needs the live clock.
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
              { label: "r₁", value: `${r1.toFixed(2)} m`, guideKey: "r1" },
              { label: "r₂", value: `${r2.toFixed(2)} m`, guideKey: "r2" },
              {
                label: "m₁·r₁ = m₂·r₂",
                value: `${(massHeavy * r1).toFixed(2)} kg·m`,
                guideKey: "balance",
              },
            ]}
          />
        </ScenePanel>
        <SceneControlGroup>
          <SceneSlider
            label={t("ratio")}
            guideKey="ratio"
            value={ratio}
            min={1}
            max={RATIO_MAX}
            step={1}
            onChange={setRatio}
            display={ratio.toFixed(0)}
          />
        </SceneControlGroup>
      </div>
    </div>
  );
}
