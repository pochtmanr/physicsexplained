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
  drawArrow,
  drawFocusRing,
  drawLabel,
  syncCanvas,
  useSceneHover,
  useScenePlayback,
  useSceneSize,
  useSceneTokens,
} from "@/components/physics/_shared";
import {
  rigidAngularMomentum,
  rotationalKE,
  skaterOmega,
} from "@/lib/physics/angular";

const RATIO = 0.6;
/** Inline height cap; the skater's line widths grow with the canvas beyond it. */
const MAX_HEIGHT = 360;

// Simplified I model: body + two outstretched arm masses on extending limbs.
// When arms go from fully out (1.3 m) to fully in (0.6 m), I drops.
const BODY_I = 0.1;
const ARM_MASS = 2 * 3.5; // kg, two arms' worth
const armLengthAt = (pullIn: number) => 0.6 + (1 - pullIn) * 0.7; // metres (effective)
const inertiaAt = (pullIn: number) => BODY_I + ARM_MASS * armLengthAt(pullIn) ** 2;
// Constant angular momentum L (initial state: arms fully out, ω = 2 rad/s).
const L0 = inertiaAt(0) * 2.0;

/**
 * FIG.07a — a stylised figure skater viewed from above. Arms extend or
 * retract on command, which changes the moment of inertia; ω adjusts to keep
 * L = I·ω constant.
 *
 * The arms can move while she spins, so the angle is stepped from where it
 * is (`simulation`) instead of being read off ω·t.
 */
export function SkaterSpinScene() {
  const t = useTranslations("scenes.skaterSpin");
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokens = useSceneTokens();
  const { width, height } = useSceneSize(containerRef, {
    ratio: RATIO,
    maxHeight: MAX_HEIGHT,
    minHeight: 220,
    initialWidth: 640,
    // The skater is sized from the shorter side and stays centred, so the
    // full view can use any shape.
    fullView: "fill",
  });
  const [pullIn, setPullIn] = useState(0); // 0 = arms out, 1 = arms in
  const thetaRef = useRef(0);

  const armLength = armLengthAt(pullIn);
  const I = inertiaAt(pullIn);
  const omega = skaterOmega(I, L0);
  const L = rigidAngularMomentum(I, omega);
  const ke = rotationalKE(I, omega);

  // Text and offsets use `u`; line widths of the skater use `o`, so she does
  // not turn into hairlines on a tall canvas. Her size already follows the
  // canvas through `S`.
  const scale = tokens.scale;
  const u = (n: number) => n * scale;
  const objectScale = Math.min(2.6, Math.max(scale, height / MAX_HEIGHT));
  const o = (n: number) => n * objectScale;

  const cx = width / 2;
  const cy = height * 0.48;
  const S = Math.min(width, height) * 0.3;
  const torsoR = S * 0.14;
  const handR = S * 0.04;
  const armPx = armLength * S * 0.6;

  // A hand (the masses that set I), an arm (what the slider moves), the axis
  // (L) or the torso (how fast she turns).
  const hover = useSceneHover(canvasRef, (px, py) => {
    const th = thetaRef.current;
    const ax = Math.cos(th);
    const ay = Math.sin(th);
    const dx = px - cx;
    const dy = py - cy;
    const r = Math.hypot(dx, dy);
    for (const side of [-1, 1]) {
      if (Math.hypot(px - (cx + side * armPx * ax), py - (cy + side * armPx * ay)) <= handR + u(9)) {
        return "inertia";
      }
    }
    if (r <= u(9)) return "angularMomentum";
    if (r <= torsoR + u(3)) return "omega";
    const along = Math.abs(dx * ax + dy * ay);
    const across = Math.abs(-dx * ay + dy * ax);
    if (along <= armPx && across <= u(9)) return "pullIn";
    return null;
  });
  const { activeKey } = hover;

  const playback = useScenePlayback({
    elementRef: containerRef,
    simulation: {
      step: (dt) => {
        thetaRef.current += omega * dt;
      },
      reset: () => {
        thetaRef.current = 0;
      },
      isDone: () => false,
    },
    draw: () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = syncCanvas(canvas, width, height);
      if (!ctx) return;
      const bounds = { width, height };
      const theta = thetaRef.current;

      // Ice hatching background
      ctx.strokeStyle = tokens.textMute;
      ctx.lineWidth = 1;
      ctx.setLineDash([u(2), u(8)]);
      for (let i = -4; i <= 4; i++) {
        ctx.beginPath();
        ctx.moveTo(cx - S * 1.2, cy + i * S * 0.15);
        ctx.lineTo(cx + S * 1.2, cy + i * S * 0.15);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // The circle the hands sweep, while I is pointed at.
      if (activeKey === "inertia") {
        ctx.strokeStyle = tokens.amber;
        ctx.lineWidth = u(1.5);
        ctx.setLineDash([u(4), u(3)]);
        ctx.beginPath();
        ctx.arc(cx, cy, armPx, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Rotation arrow round the torso, while ω is pointed at.
      if (activeKey === "omega") {
        const rr = torsoR + u(10);
        const a0 = theta + Math.PI * 0.15;
        const a1 = a0 + Math.PI * 0.7;
        ctx.strokeStyle = tokens.cyan;
        ctx.lineWidth = u(2);
        ctx.beginPath();
        ctx.arc(cx, cy, rr, a0, a1);
        ctx.stroke();
        const tipX = cx + rr * Math.cos(a1);
        const tipY = cy + rr * Math.sin(a1);
        drawArrow(
          ctx,
          tipX + rr * 0.3 * Math.sin(a1),
          tipY - rr * 0.3 * Math.cos(a1),
          tipX,
          tipY,
          tokens.cyan,
          u(2),
          u(7),
        );
      }

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(theta);

      // Torso
      ctx.fillStyle = tokens.cyan;
      ctx.beginPath();
      ctx.arc(0, 0, torsoR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = tokens.textBright;
      ctx.lineWidth = o(1);
      ctx.stroke();

      // Arms — two line segments from torso
      const armsFocused = activeKey === "pullIn";
      ctx.strokeStyle = armsFocused ? tokens.cyan : tokens.textBright;
      ctx.lineWidth = o(armsFocused ? 6 : 4);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-armPx, 0);
      ctx.moveTo(0, 0);
      ctx.lineTo(armPx, 0);
      ctx.stroke();
      ctx.lineCap = "butt";

      // Hand masses (weights)
      ctx.fillStyle = tokens.amber;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(side * armPx, 0, handR, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      // Axis: L points out of the page, drawn as ⊙ while it is pointed at.
      if (activeKey === "angularMomentum") {
        ctx.fillStyle = tokens.bg1;
        ctx.beginPath();
        ctx.arc(cx, cy, u(7), 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = tokens.mint;
        ctx.lineWidth = u(2);
        ctx.stroke();
        ctx.fillStyle = tokens.mint;
        ctx.beginPath();
        ctx.arc(cx, cy, u(2.5), 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = tokens.textDim;
        ctx.beginPath();
        ctx.arc(cx, cy, u(3), 0, Math.PI * 2);
        ctx.fill();
      }

      // Hands ringed while I is pointed at.
      if (activeKey === "inertia") {
        for (const side of [-1, 1]) {
          drawFocusRing(
            ctx,
            cx + side * armPx * Math.cos(theta),
            cy + side * armPx * Math.sin(theta),
            handR + u(6),
            tokens.amber,
            scale,
          );
        }
      }

      // Names of the emphasised quantity, on plates, below the skater.
      const labelY = Math.min(height - u(12), cy + armPx + handR + u(18));
      const plate = (text: string, color: string) =>
        drawLabel(ctx, text, cx, labelY, {
          bounds,
          color,
          align: "center",
          font: tokens.fontLabel,
          plate: tokens.bg1,
          scale,
        });
      if (activeKey === "inertia") plate(`r = ${armLength.toFixed(2)} m   I = ${I.toFixed(2)} kg·m²`, tokens.amber);
      if (activeKey === "pullIn") plate(`r = ${armLength.toFixed(2)} m`, tokens.cyan);
      if (activeKey === "omega") plate(`ω = ${omega.toFixed(2)} rad/s`, tokens.cyan);
      if (activeKey === "angularMomentum") plate(`L = ${L.toFixed(2)} kg·m²/s ⊙`, tokens.mint);
    },
  });

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
                label: "I",
                value: `${I.toFixed(2)} kg·m²`,
                color: "var(--color-amber)",
                guideKey: "inertia",
              },
              { label: "ω", value: `${omega.toFixed(2)} rad/s`, guideKey: "omega" },
              {
                label: "L = I·ω",
                value: `${L.toFixed(2)} kg·m²/s`,
                color: "var(--color-mint)",
                guideKey: "angularMomentum",
              },
              { label: "KE = ½·I·ω²", value: `${ke.toFixed(2)} J`, guideKey: "energy" },
            ]}
          />
        </ScenePanel>
        <SceneControlGroup>
          <SceneSlider
            label={t("pullIn")}
            guideKey="pullIn"
            value={pullIn}
            min={0}
            max={1}
            step={0.01}
            onChange={setPullIn}
            display={`r = ${armLength.toFixed(2)} m`}
          />
        </SceneControlGroup>
      </div>
    </div>
  );
}
