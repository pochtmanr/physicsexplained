"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  FONT_HUD_SMALL,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  drawSectionTitle,
  hexToRgba,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import type { SchwarzschildRegion } from "@/lib/physics/relativity/penrose-diagrams";

/**
 * FIG.46c — The Schwarzschild Penrose diagram, region by region.
 *
 * The maximally-extended (Kruskal) Schwarzschild geometry compactified to a
 * finite picture: two exterior universes (I, III), a black-hole interior (II)
 * capped by the future singularity, and a white-hole interior (IV) floored by
 * the past singularity. Click a region to highlight it and read who can send
 * signals where. The singularities are drawn as horizontal squiggles at the
 * top and bottom — spacelike surfaces, i.e. moments of time, not places.
 */

const PAD = 22;

const REGION_INFO: Record<
  SchwarzschildRegion,
  { name: string; blurb: string }
> = {
  I: {
    name: "I — our universe",
    blurb:
      "The asymptotically flat exterior we live in. Light can escape to ℐ⁺. You can fall through the future horizon into II — but never into the white hole IV.",
  },
  II: {
    name: "II — black-hole interior",
    blurb:
      "Inside the future horizon. Every future-directed path ends on the singularity above. No signal from here ever returns to I or III. r decreases toward the future.",
  },
  III: {
    name: "III — the other universe",
    blurb:
      "A second exterior, causally disconnected from I. You cannot send a signal between I and III: the throat between them is non-traversable.",
  },
  IV: {
    name: "IV — white hole",
    blurb:
      "The time-reverse of a black hole. Things can only come OUT of the past singularity into I or III. Nothing can fall in. No astrophysical analogue is known.",
  },
};

const ORDER: SchwarzschildRegion[] = ["I", "II", "III", "IV"];

export function SchwarzschildRegionsScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [selected, setSelected] = useState<SchwarzschildRegion>("I");

  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.7,
    maxHeight: SCENE_HEIGHT_DEFAULT + 40,
    minHeight: 340,
  });

  const geomRef = useRef({ cx: 0, cy: 0, unit: 1 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    geomRef.current = computeGeom(width, height);
    draw(ctx, tokens, selected, geomRef.current, width, height);
  }, [tokens, selected, width, height]);

  const info = useMemo(() => REGION_INFO[selected], [selected]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const { cx, cy, unit } = geomRef.current;
    // Kruskal-ish: V to the up-right, U to the up-left. Diagram axes:
    // screen X grows right = V−U direction; screen up = V+U.
    const dx = (sx - cx) / unit;
    const dy = (cy - sy) / unit; // up positive
    const V = (dy + dx) / 2;
    const U = (dy - dx) / 2;
    const region: SchwarzschildRegion =
      V >= 0 && U < 0 ? "I" : V > 0 && U >= 0 ? "II" : V < 0 && U > 0 ? "III" : "IV";
    setSelected(region);
  };

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block", cursor: "pointer" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Penrose diagram of the maximally extended Schwarzschild black hole with four regions: two exterior universes, a black-hole interior, and a white-hole interior. Click a region to highlight it and read its causal description."
        onClick={handleClick}
      />
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-[var(--color-fg-3)]">
        {ORDER.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setSelected(r)}
            className="rounded-sm border px-2 py-0.5"
            style={{
              borderColor: selected === r ? "var(--color-cyan)" : "var(--color-fg-4)",
              color: selected === r ? "var(--color-cyan)" : "var(--color-fg-3)",
            }}
          >
            {REGION_INFO[r].name}
          </button>
        ))}
      </div>
      <p className="mt-2 max-w-prose font-mono text-xs leading-relaxed text-[var(--color-fg-2)]">
        {info.blurb}
      </p>
    </div>
  );
}

function computeGeom(W: number, H: number) {
  const availW = W - PAD * 2;
  const availH = H - PAD * 2 - 20;
  // The diamond spans |U|, |V| ≤ L. Diagram width = 2L (in V−U), height = 2L.
  const L = 1;
  const unit = Math.min(availW / (2 * L * 1.05), availH / (2 * L * 1.05));
  const cx = W / 2;
  const cy = PAD + 20 + availH / 2;
  return { cx, cy, unit };
}

// Map (U, V) Kruskal coords to screen. X_screen = (V − U), up = (V + U).
function kProject(
  U: number,
  V: number,
  cx: number,
  cy: number,
  unit: number,
): [number, number] {
  const x = cx + (V - U) * unit;
  const y = cy - (V + U) * unit;
  return [x, y];
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  selected: SchwarzschildRegion,
  geom: { cx: number; cy: number; unit: number },
  W: number,
  H: number,
) {
  const { cx, cy, unit } = geom;
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  drawSectionTitle(ctx, PAD, PAD - 8, "MAXIMALLY-EXTENDED SCHWARZSCHILD", tokens.textMute);

  // The diagram is a square (rotated diamond) in screen space. We shade each
  // of the four triangular regions, then drawDiagramFrame draws the
  // authoritative boundaries, horizons, singularities, and labels on top. The
  // shading geometry uses the same cap/half-width that the frame uses so the
  // fills line up exactly with the drawn singularities and horizons.
  const halfW = 1.0 * unit;
  const capUp = cy - 1.45 * unit;
  const capDn = cy + 1.45 * unit;
  const iZeroR: [number, number] = [cx + 2.0 * unit, cy];
  const iZeroL: [number, number] = [cx - 2.0 * unit, cy];
  const center: [number, number] = [cx, cy];

  // Region triangles, matching the I/II/III/IV layout drawn by the frame.
  const tris: Record<SchwarzschildRegion, [number, number][]> = {
    I: [center, [cx + halfW, capUp], iZeroR, [cx + halfW, capDn]],
    II: [center, [cx - halfW, capUp], [cx + halfW, capUp]],
    III: [center, [cx - halfW, capUp], iZeroL, [cx - halfW, capDn]],
    IV: [center, [cx - halfW, capDn], [cx + halfW, capDn]],
  };

  for (const r of ORDER) {
    const poly = tris[r];
    ctx.beginPath();
    ctx.moveTo(poly[0][0], poly[0][1]);
    for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i][0], poly[i][1]);
    ctx.closePath();
    const isSel = r === selected;
    const base = r === "II" ? tokens.red : r === "IV" ? tokens.purple : tokens.cyan;
    ctx.fillStyle = hexToRgba(base, isSel ? 0.22 : 0.05);
    ctx.fill();
  }

  drawDiagramFrame(ctx, tokens, cx, cy, unit);
}

/** Authoritative frame: boundaries, horizons, singularities, labels. */
function drawDiagramFrame(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  cx: number,
  cy: number,
  unit: number,
) {
  const L = 1;
  const center = kProject(0, 0, cx, cy, unit);

  // The standard Schwarzschild Penrose diagram caps regions II and IV with a
  // HORIZONTAL spacelike singularity (a moment of time, not a place), drawn as
  // a squiggle at the top (future, r = 0) and bottom (past). The two exteriors
  // reach their spatial infinities i⁰ at the left and right; the horizons are
  // the two 45° null lines crossing at the central bifurcation point.
  const capUp = cy - 1.45 * unit;
  const capDn = cy + 1.45 * unit;
  const halfW = 1.0 * unit;

  // future singularity (red squiggle)
  drawSquiggle(ctx, cx - halfW, cx + halfW, capUp, tokens.red);
  // past singularity (purple squiggle)
  drawSquiggle(ctx, cx - halfW, cx + halfW, capDn, tokens.purple);

  // The four null infinity edges (ℐ) running from the singularity caps down to
  // the two spatial infinities i⁰ at left & right.
  const iZeroR: [number, number] = [cx + 2.0 * L * unit, cy];
  const iZeroL: [number, number] = [cx - 2.0 * L * unit, cy];

  ctx.strokeStyle = hexToRgba(tokens.amber, 0.85);
  ctx.lineWidth = 1.6;
  // right exterior: ℐ⁺ from cap-up-right to i⁰R, ℐ⁻ from i⁰R to cap-dn-right
  ctx.beginPath();
  ctx.moveTo(cx + halfW, capUp);
  ctx.lineTo(iZeroR[0], iZeroR[1]);
  ctx.lineTo(cx + halfW, capDn);
  // left exterior
  ctx.moveTo(cx - halfW, capUp);
  ctx.lineTo(iZeroL[0], iZeroL[1]);
  ctx.lineTo(cx - halfW, capDn);
  ctx.stroke();

  // ── horizons: the two 45° lines crossing at center, reaching the caps ────
  ctx.strokeStyle = hexToRgba(tokens.amber, 0.95);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - halfW, capUp);
  ctx.lineTo(cx + halfW, capDn);
  ctx.moveTo(cx + halfW, capUp);
  ctx.lineTo(cx - halfW, capDn);
  ctx.stroke();

  // bifurcation point
  ctx.fillStyle = tokens.textBright;
  ctx.beginPath();
  ctx.arc(center[0], center[1], 3, 0, Math.PI * 2);
  ctx.fill();

  // ── labels ───────────────────────────────────────────────────────────────
  ctx.font = "bold 13px ui-monospace, monospace";
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillStyle = tokens.cyan;
  ctx.fillText("I", cx + 0.95 * L * unit, cy);
  ctx.fillText("III", cx - 0.95 * L * unit, cy);
  ctx.fillStyle = tokens.red;
  ctx.fillText("II", cx, cy - 0.75 * L * unit);
  ctx.fillStyle = tokens.purple;
  ctx.fillText("IV", cx, cy + 0.75 * L * unit);

  ctx.font = FONT_HUD_SMALL;
  ctx.fillStyle = tokens.textMute;
  ctx.fillText("singularity  r = 0", cx, capUp - 12);
  ctx.fillText("past singularity", cx, capDn + 12);
  ctx.fillStyle = tokens.textFaint;
  ctx.textAlign = "left";
  ctx.fillText("i⁰", iZeroR[0] + 4, iZeroR[1]);
  ctx.textAlign = "right";
  ctx.fillText("i⁰", iZeroL[0] - 4, iZeroL[1]);

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

function drawSquiggle(
  ctx: CanvasRenderingContext2D,
  x0: number,
  x1: number,
  y: number,
  color: string,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  const n = 18;
  const amp = 4;
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    const yy = y + (i % 2 === 0 ? -amp : amp);
    if (i === 0) ctx.moveTo(x, yy);
    else ctx.lineTo(x, yy);
  }
  ctx.stroke();
}
