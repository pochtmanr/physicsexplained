"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  SCENE_CANVAS_CLASS,
  SceneControlGroup,
  ScenePanel,
  SceneReadout,
  SceneSlider,
  SceneStage,
  applyDpr,
  drawLabel,
  useSceneHover,
  useSceneSize,
  useSceneTokens,
} from "@/components/physics/_shared";
import { foucaultRotationPeriodHours } from "@/lib/physics/rotating-frame";

/** Side of the square drawing at full inline size, in px. */
const BASE_SIZE = 380;
/** Radius from the pole (centre) to the equator at full inline size, in px. */
const GLOBE_R = 160;
/** Latitudes drawn as faint reference rings. */
const REFERENCE_LATS = [30, 60];
/** Northern wind arrows: latitudes, at each of the four cardinal angles. */
const NORTH_LATS = [60, 45, 30];
const ARROW_ANGLES = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
/**
 * The southern arrows are drawn on a band near the rim (radius ≈ 28 px
 * inside the equator) with the curl reversed: a schematic of the other
 * hemisphere on the same picture.
 */
const SOUTH_BAND_LAT = 10;
/** Angle around the centre each wind arrow sweeps. */
const ARROW_ARC = 0.55;
/** How far outward an arrow travels over its sweep, at full inline size (px). */
const ARROW_RADIAL_SPAN = 26;
const ARROW_STEPS = 14;
/** Degrees per hour of the Earth's turn (360° / 24 h). */
const EARTH_DEG_PER_HOUR = 15;

/**
 * Polar projection seen from above the North Pole: the pole at the centre,
 * the equator on the rim, distance from the centre GLOBE_R · (1 − sin lat).
 */
function latitudeToRadius(latDeg: number, globeR: number): number {
  return globeR * (1 - Math.sin((latDeg * Math.PI) / 180));
}

/** FIG.06c — winds on the rotating Earth, and the Foucault period at a latitude. */
export function CoriolisGlobeScene() {
  const t = useTranslations("scenes.coriolisGlobe");
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: 1,
    maxHeight: BASE_SIZE,
    minHeight: 260,
    initialWidth: BASE_SIZE,
    // The globe is centred in whatever shape it gets.
    fullView: "fill",
  });
  const [latitude, setLatitude] = useState(45);

  // `u` for text, offsets and hairlines; the globe grows with the canvas
  // (`k` for positions, `o` for line weights and arrowheads). Inline o = 1.
  const u = (n: number) => n * tokens.scale;
  const k = Math.min(width, height) / BASE_SIZE;
  const objectScale = Math.min(2.6, Math.max(tokens.scale, k));
  const o = (n: number) => n * objectScale;
  const cx = width / 2;
  const cy = height / 2;
  const globeR = GLOBE_R * k;
  const ringR = latitudeToRadius(latitude, globeR);

  // The chosen latitude ring stands for the latitude and the two numbers
  // that follow from it.
  const hover = useSceneHover(canvasRef, (px, py) => {
    const d = Math.hypot(px - cx, py - cy);
    if (Math.abs(d - ringR) <= u(9)) return "latitude";
    return null;
  });
  const { activeKey, pointer } = hover;
  const ringFocused =
    activeKey === "latitude" || activeKey === "period" || activeKey === "rate";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    const bounds = { width, height };

    // Equator (outer circle)
    ctx.strokeStyle = tokens.axes;
    ctx.lineWidth = o(2);
    ctx.beginPath();
    ctx.arc(cx, cy, globeR, 0, Math.PI * 2);
    ctx.stroke();

    // Reference latitude rings
    ctx.strokeStyle = tokens.gridHeavy;
    ctx.lineWidth = 1;
    ctx.setLineDash([u(2), u(3)]);
    ctx.beginPath();
    for (const lat of REFERENCE_LATS) {
      const r = latitudeToRadius(lat, globeR);
      ctx.moveTo(cx + r, cy);
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // The chosen latitude (cyan, dashed); heavier while it is pointed at.
    ctx.strokeStyle = tokens.cyan;
    ctx.lineWidth = o(ringFocused ? 2.5 : 1.5);
    ctx.setLineDash([u(4), u(3)]);
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(ringR, 0.5), 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Pole marker and labels
    ctx.fillStyle = tokens.textDim;
    ctx.beginPath();
    ctx.arc(cx, cy, o(3), 0, Math.PI * 2);
    ctx.fill();
    drawLabel(ctx, t("northPole"), cx + o(3) + u(3), cy - u(10), {
      bounds,
      color: tokens.textLabel,
      font: tokens.fontHudSmall,
      direction: "inherit",
    });
    drawLabel(ctx, t("equator"), cx, cy + globeR + u(14), {
      bounds,
      color: tokens.textLabel,
      align: "center",
      font: tokens.fontHudSmall,
      direction: "inherit",
    });

    // Wind arrows: a short spiral outward (towards the equator), curling
    // right in the north and left in the south.
    const arrow = (startAngle: number, latDeg: number, sign: 1 | -1, color: string) => {
      const r = latitudeToRadius(latDeg, globeR);
      const span = ARROW_RADIAL_SPAN * k;
      ctx.strokeStyle = color;
      ctx.lineWidth = o(1.5);
      ctx.beginPath();
      let prevX = 0;
      let prevY = 0;
      for (let i = 0; i <= ARROW_STEPS; i++) {
        const f = i / ARROW_STEPS;
        const a = startAngle + sign * ARROW_ARC * f;
        const rr = r + span * f;
        const x = cx + rr * Math.cos(a);
        const y = cy + rr * Math.sin(a);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        if (i === ARROW_STEPS - 1) {
          prevX = x;
          prevY = y;
        }
      }
      ctx.stroke();
      const aTip = startAngle + sign * ARROW_ARC;
      const tipX = cx + (r + span) * Math.cos(aTip);
      const tipY = cy + (r + span) * Math.sin(aTip);
      const tang = Math.atan2(tipY - prevY, tipX - prevX);
      const head = o(6);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(tipX - head * Math.cos(tang - Math.PI / 6), tipY - head * Math.sin(tang - Math.PI / 6));
      ctx.lineTo(tipX - head * Math.cos(tang + Math.PI / 6), tipY - head * Math.sin(tang + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
    };
    for (const lat of NORTH_LATS) {
      for (const a of ARROW_ANGLES) arrow(a, lat, 1, tokens.cyan);
    }
    for (const a of ARROW_ANGLES) arrow(a, SOUTH_BAND_LAT, -1, tokens.magenta);

    // The chosen latitude names itself on a plate while it is pointed at,
    // at the pointer if the pointer is on it, else at the top of the ring.
    if (ringFocused) {
      const angle = pointer ? Math.atan2(pointer.y - cy, pointer.x - cx) : -Math.PI / 2;
      const lx = cx + ringR * Math.cos(angle);
      const ly = cy + ringR * Math.sin(angle);
      drawLabel(ctx, `${latitude}°`, lx, ly - u(12), {
        bounds,
        color: tokens.cyan,
        align: "center",
        font: tokens.fontHudSmall,
        plate: tokens.bg1,
        scale: tokens.scale,
      });
    }
    // `o`, `u` and `t` are recomputed every render from the values listed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens, width, height, latitude, ringFocused, pointer]);

  const period = foucaultRotationPeriodHours(latitude);
  const finite = Number.isFinite(period);
  const rate = EARTH_DEG_PER_HOUR * Math.sin((latitude * Math.PI) / 180);

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
          <SceneReadout
            items={[
              {
                label: t("period"),
                value: finite ? `${period.toFixed(2)} h` : t("never"),
                color: finite ? "var(--color-cyan)" : "var(--color-magenta)",
                guideKey: "period",
              },
              {
                label: t("rate"),
                value: `${rate.toFixed(1)}°/h`,
                guideKey: "rate",
              },
            ]}
          />
        </ScenePanel>
        <SceneControlGroup>
          <SceneSlider
            label={t("latitude")}
            guideKey="latitude"
            value={latitude}
            min={0}
            max={90}
            step={1}
            onChange={setLatitude}
            display={`${latitude}°`}
          />
          <span className="text-xs text-[var(--color-fg-2)]">{t("note")}</span>
        </SceneControlGroup>
      </div>
    </div>
  );
}
