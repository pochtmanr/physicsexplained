"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  FONT_HUD_SMALL,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  drawHudReadout,
  drawSectionTitle,
  hexToRgba,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import {
  tracePhoton,
  tracedBendAngle,
} from "@/lib/physics/relativity/light-deflection-and-lensing";

/**
 * FIG.41a — Photon trajectories past a mass.
 *
 * A grid of light rays travels left→right past a central mass. The selected
 * ray's impact parameter b is set by a slider; a toggle switches between the
 * GR deflection (α = 4GM/c²b) and the pre-1915 Newtonian half-value
 * (α = 2GM/c²b), so the famous factor of two is visible directly. The bend
 * angle is read out live in (scaled) arcsecond-style units.
 *
 * Geometry is in scene-units; the mass strength rsEff is exaggerated so the
 * bending is visible on screen — the teaching point is the *ratio* GR:Newton
 * and the 1/b falloff, both of which are scale-invariant.
 */

const PAD = 18;
const RS_EFF = 0.85; // exaggerated 2GM/c² in scene units (visibility, not scale)
const X_HALF = 9; // integrate from -9 to +9 scene units
const STEPS = 600;

type Mode = "gr" | "newtonian";

export function PhotonDeflectionScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [b, setB] = useState(2.4);
  const [mode, setMode] = useState<Mode>("gr");
  const [showOther, setShowOther] = useState(true);
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.56,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 320,
  });

  const selected = useMemo(
    () => tracePhoton(b, RS_EFF, -X_HALF, X_HALF, STEPS, mode),
    [b, mode],
  );
  const other = useMemo(
    () =>
      tracePhoton(
        b,
        RS_EFF,
        -X_HALF,
        X_HALF,
        STEPS,
        mode === "gr" ? "newtonian" : "gr",
      ),
    [b, mode],
  );
  const bendSelected = useMemo(() => tracedBendAngle(selected), [selected]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, tokens, width, height, {
      b,
      mode,
      showOther,
      selected,
      other,
      bendSelected,
    });
  }, [tokens, width, height, b, mode, showOther, selected, other, bendSelected]);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Light rays passing a central mass and bending toward it. A slider sets the impact parameter of the highlighted ray; a toggle switches between the general-relativistic deflection (4GM/c²b) and the Newtonian half-value (2GM/c²b)."
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-44 shrink-0">
          impact parameter b: {b.toFixed(2)}
        </span>
        <input
          type="range"
          min={0.7}
          max={6}
          step={0.05}
          value={b}
          onChange={(e) => setB(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-amber)" }}
        />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-xs">
        {(["gr", "newtonian"] as Mode[]).map((m) => {
          const active = mode === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className="border px-2 py-1"
              style={{
                borderColor: active
                  ? m === "gr"
                    ? "var(--color-amber)"
                    : "var(--color-cyan)"
                  : "var(--color-fg-4)",
                color: active
                  ? m === "gr"
                    ? "var(--color-amber)"
                    : "var(--color-cyan)"
                  : "var(--color-fg-3)",
              }}
            >
              {m === "gr" ? "GR · 4GM/c²b" : "Newton · 2GM/c²b"}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setShowOther((s) => !s)}
          className="border px-2 py-1"
          style={{
            borderColor: showOther ? "var(--color-fg-2)" : "var(--color-fg-4)",
            color: showOther ? "var(--color-fg-1)" : "var(--color-fg-3)",
          }}
        >
          {showOther ? "ghost: on" : "ghost: off"}
        </button>
      </div>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  W: number,
  H: number,
  s: {
    b: number;
    mode: Mode;
    showOther: boolean;
    selected: Array<{ x: number; y: number }>;
    other: Array<{ x: number; y: number }>;
    bendSelected: number;
  },
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  const plotX0 = PAD;
  const plotY0 = PAD + 18;
  const plotW = W - PAD * 2;
  const plotH = H - PAD * 2 - 18;
  const cx = plotX0 + plotW / 2;
  const cy = plotY0 + plotH / 2;

  // world→screen: x in [-X_HALF, X_HALF] → plot width; y up positive
  const sx = plotW / (2 * X_HALF);
  const sy = sx; // isotropic so the bend angle looks honest
  const toX = (x: number) => cx + x * sx;
  const toY = (y: number) => cy - y * sy;

  drawSectionTitle(ctx, plotX0, plotY0 - 16, "LIGHT BENDING PAST A MASS", tokens.textMute);

  // faint horizontal grid lines (undeflected ray paths)
  ctx.strokeStyle = tokens.grid;
  ctx.lineWidth = 1;
  for (let k = -3; k <= 3; k++) {
    const y = toY(k * 2);
    ctx.beginPath();
    ctx.moveTo(plotX0, y);
    ctx.lineTo(plotX0 + plotW, y);
    ctx.stroke();
  }

  // ── background fan of context rays (impact parameters around the selection)
  const fanBs = [-5.5, -4, -2.8, 2.8, 4, 5.5];
  for (const fb of fanBs) {
    const pts = tracePhoton(fb, RS_EFF, -X_HALF, X_HALF, 240, s.mode);
    strokePath(ctx, pts, toX, toY, hexToRgba(tokens.textFaint, 0.45), 1);
  }

  // ── central mass
  const massR = Math.max(10, RS_EFF * sx * 0.9);
  const grad = ctx.createRadialGradient(cx, cy, massR * 0.2, cx, cy, massR * 2.4);
  grad.addColorStop(0, hexToRgba(tokens.amber, 0.9));
  grad.addColorStop(0.4, hexToRgba(tokens.amber, 0.25));
  grad.addColorStop(1, hexToRgba(tokens.amber, 0));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, massR * 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = tokens.textBright;
  ctx.beginPath();
  ctx.arc(cx, cy, massR, 0, Math.PI * 2);
  ctx.fill();

  // ── ghost (the other theory's path for the same b)
  if (s.showOther) {
    const ghostColor =
      s.mode === "gr"
        ? hexToRgba(tokens.cyan, 0.55)
        : hexToRgba(tokens.amber, 0.55);
    strokePathDashed(ctx, s.other, toX, toY, ghostColor, 1.5);
  }

  // ── selected ray (solid, accent of the active theory)
  const selColor = s.mode === "gr" ? tokens.amber : tokens.cyan;
  strokePath(ctx, s.selected, toX, toY, selColor, 2.2);

  // undeflected reference dashed line at impact parameter b
  ctx.save();
  ctx.setLineDash([3, 4]);
  ctx.strokeStyle = hexToRgba(selColor, 0.4);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(toX(-X_HALF), toY(s.b));
  ctx.lineTo(toX(X_HALF), toY(s.b));
  ctx.stroke();
  ctx.restore();

  // impact-parameter bracket near the entry point
  ctx.strokeStyle = hexToRgba(tokens.textMute, 0.7);
  ctx.lineWidth = 1;
  const bx = toX(-X_HALF) + 14;
  ctx.beginPath();
  ctx.moveTo(bx, toY(0));
  ctx.lineTo(bx, toY(s.b));
  ctx.stroke();
  ctx.fillStyle = tokens.textMute;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("b", bx + 4, toY(s.b / 2));

  // ── HUD — report the on-screen bend in degrees (the scene exaggerates the
  // mass for visibility, so this is an honest readout of the drawn geometry,
  // not a claim about the real 1.75″ solar value).
  const alphaDeg = Math.abs(s.bendSelected) * (180 / Math.PI);
  let hy = plotY0 + 4;
  hy = drawHudReadout(
    ctx,
    plotX0 + 6,
    hy,
    "theory: ",
    s.mode === "gr" ? "GR (×2)" : "Newton (×1)",
    tokens.textDim,
    selColor,
  );
  hy = drawHudReadout(
    ctx,
    plotX0 + 6,
    hy,
    "bend α ≈ ",
    `${alphaDeg.toFixed(2)}° (b=${s.b.toFixed(2)})`,
    tokens.textDim,
    selColor,
  );
  drawHudReadout(
    ctx,
    plotX0 + 6,
    hy,
    "α ∝ ",
    "1/b — closer ray, sharper bend",
    tokens.textDim,
    tokens.textMute,
  );
  ctx.textBaseline = "alphabetic";
}

function strokePath(
  ctx: CanvasRenderingContext2D,
  pts: Array<{ x: number; y: number }>,
  toX: (x: number) => number,
  toY: (y: number) => number,
  color: string,
  lw: number,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.beginPath();
  pts.forEach((p, i) => {
    const X = toX(p.x);
    const Y = toY(p.y);
    if (i === 0) ctx.moveTo(X, Y);
    else ctx.lineTo(X, Y);
  });
  ctx.stroke();
}

function strokePathDashed(
  ctx: CanvasRenderingContext2D,
  pts: Array<{ x: number; y: number }>,
  toX: (x: number) => number,
  toY: (y: number) => number,
  color: string,
  lw: number,
) {
  ctx.save();
  ctx.setLineDash([5, 5]);
  strokePath(ctx, pts, toX, toY, color, lw);
  ctx.restore();
}
