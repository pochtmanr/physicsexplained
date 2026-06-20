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
import { Button } from "@/components/ui/button";

/**
 * FIG.41b — The 1919 eclipse measurement.
 *
 * A field of background stars near the Sun's limb. With the Sun absent
 * (the comparison "night" plate, taken months later) the stars sit at their
 * true positions. With the Sun present (the eclipse plate, May 29 1919) each
 * star's light is bent outward, so the star appears shifted *away* from the
 * Sun by α = 4GM/(c²b) — largest at the limb, falling as 1/b.
 *
 * The real shift at the limb is 1.75″ — invisible at any honest scale against
 * a stellar field — so a "magnify" slider exaggerates the displacement the way
 * Eddington's measuring engine effectively did. A toggle blinks between the
 * eclipse and comparison plates; displacement arrows show the apparent motion.
 */

const PAD = 18;
const LIMB_DEFLECTION_ARCSEC = 1.75; // headline GR value at b = R_sun

interface Star {
  /** true angular position, in solar-radius units from Sun center */
  x: number;
  y: number;
  mag: number; // 0..1 brightness
}

// A fixed pseudo-random field (deterministic — no flicker between renders).
const STARS: Star[] = (() => {
  let seed = 41;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  const out: Star[] = [];
  for (let i = 0; i < 80; i++) {
    const x = (rnd() - 0.5) * 9;
    const y = (rnd() - 0.5) * 6;
    const r = Math.hypot(x, y);
    if (r < 1.05) continue; // can't see stars behind the Sun's disk
    out.push({ x, y, mag: 0.4 + rnd() * 0.6 });
  }
  return out;
})();

/** Apparent (shifted) position of a star under solar deflection.
 *  Shift magnitude = 1.75″ × (R_sun / b), directed radially outward, scaled
 *  by `magnify` for visibility. Returns scene-unit offset added to (x,y). */
function shiftedPosition(
  star: Star,
  magnify: number,
): { x: number; y: number; shiftArcsec: number } {
  const r = Math.hypot(star.x, star.y);
  const shiftArcsec = LIMB_DEFLECTION_ARCSEC / r; // ∝ 1/b, =1.75″ at limb (r=1)
  // convert the (magnified) arcsec shift into the same solar-radius units used
  // for plotting: at the limb, 1.75″ ≈ a tiny fraction of R_sun; we let the
  // slider scale it up to a visible fraction.
  const shiftUnits = (shiftArcsec / LIMB_DEFLECTION_ARCSEC) * 0.06 * magnify;
  return {
    x: star.x + (star.x / r) * shiftUnits,
    y: star.y + (star.y / r) * shiftUnits,
    shiftArcsec,
  };
}

export function EclipseStarfieldScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [magnify, setMagnify] = useState(6);
  const [sunPresent, setSunPresent] = useState(true);
  const [showArrows, setShowArrows] = useState(true);
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.6,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 320,
  });

  const limbStar = useMemo(
    () =>
      STARS.reduce((best, s) =>
        Math.hypot(s.x, s.y) < Math.hypot(best.x, best.y) ? s : best,
      ),
    [],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;
    draw(ctx, tokens, width, height, {
      magnify,
      sunPresent,
      showArrows,
      limbStar,
    });
  }, [tokens, width, height, magnify, sunPresent, showArrows, limbStar]);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="A star field near the Sun. Toggling the Sun on shifts each star radially outward by an amount proportional to 1.75 arcseconds divided by its distance from the Sun's center; a magnify slider exaggerates the otherwise-invisible shift; displacement arrows show the apparent outward motion."
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-44 shrink-0">magnify shift: ×{magnify.toFixed(0)}</span>
        <input
          type="range"
          min={1}
          max={14}
          step={1}
          value={magnify}
          onChange={(e) => setMagnify(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-magenta)" }}
        />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-xs">
        <Button active={sunPresent} onClick={() => setSunPresent((s) => !s)}>
          {sunPresent ? "eclipse plate (Sun present)" : "comparison plate (no Sun)"}
        </Button>
        <Button active={showArrows} onClick={() => setShowArrows((s) => !s)}>
          {showArrows ? "displacement arrows: on" : "displacement arrows: off"}
        </Button>
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
    magnify: number;
    sunPresent: boolean;
    showArrows: boolean;
    limbStar: Star;
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
  const unit = Math.min(plotW / 9, plotH / 6); // px per solar-radius unit
  const toX = (x: number) => cx + x * unit;
  const toY = (y: number) => cy - y * unit;

  drawSectionTitle(
    ctx,
    plotX0,
    plotY0 - 16,
    "PRÍNCIPE · 29 MAY 1919",
    tokens.textMute,
  );

  // ── the Sun's disk (only on the eclipse plate)
  const sunR = unit; // R_sun = 1 unit
  if (s.sunPresent) {
    const corona = ctx.createRadialGradient(cx, cy, sunR * 0.6, cx, cy, sunR * 2.6);
    corona.addColorStop(0, hexToRgba(tokens.amber, 0.55));
    corona.addColorStop(0.5, hexToRgba(tokens.amber, 0.12));
    corona.addColorStop(1, hexToRgba(tokens.amber, 0));
    ctx.fillStyle = corona;
    ctx.beginPath();
    ctx.arc(cx, cy, sunR * 2.6, 0, Math.PI * 2);
    ctx.fill();
    // eclipsed disk (Moon) — dark with a bright rim
    ctx.fillStyle = hexToRgba(tokens.textFaint, 0.25);
    ctx.beginPath();
    ctx.arc(cx, cy, sunR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = hexToRgba(tokens.amber, 0.85);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, sunR, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    // faint marker where the Sun would be, for reference
    ctx.strokeStyle = hexToRgba(tokens.textFaint, 0.4);
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.arc(cx, cy, sunR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // ── stars
  for (const star of STARS) {
    const trueX = toX(star.x);
    const trueY = toY(star.y);

    if (s.sunPresent) {
      const sh = shiftedPosition(star, s.magnify);
      const appX = toX(sh.x);
      const appY = toY(sh.y);

      // faint ghost at true position
      drawStar(ctx, trueX, trueY, 1.4, hexToRgba(tokens.textFaint, 0.5));

      // displacement arrow true → apparent
      if (s.showArrows) {
        ctx.strokeStyle = hexToRgba(tokens.magenta, 0.8);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(trueX, trueY);
        ctx.lineTo(appX, appY);
        ctx.stroke();
      }

      // apparent (observed) star
      drawStar(ctx, appX, appY, 1.6 + star.mag * 1.8, hexToRgba(tokens.cyan, 0.85 + 0.15 * star.mag));
    } else {
      drawStar(ctx, trueX, trueY, 1.6 + star.mag * 1.8, hexToRgba(tokens.cyan, 0.85 + 0.15 * star.mag));
    }
  }

  // ── HUD
  const limbR = Math.hypot(s.limbStar.x, s.limbStar.y);
  const limbShift = LIMB_DEFLECTION_ARCSEC / limbR;
  let hy = plotY0 + 4;
  hy = drawHudReadout(
    ctx,
    plotX0 + 6,
    hy,
    "plate: ",
    s.sunPresent ? "eclipse (Sun in field)" : "comparison (months later)",
    tokens.textDim,
    s.sunPresent ? tokens.amber : tokens.cyan,
  );
  hy = drawHudReadout(
    ctx,
    plotX0 + 6,
    hy,
    "limb shift: ",
    "1.75″ at b = R☉",
    tokens.textDim,
    tokens.magenta,
  );
  drawHudReadout(
    ctx,
    plotX0 + 6,
    hy,
    "nearest star: ",
    `${limbShift.toFixed(2)}″ at b = ${limbR.toFixed(1)} R☉`,
    tokens.textDim,
    tokens.textMute,
  );

  // scale note
  ctx.fillStyle = tokens.textFaint;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.fillText(
    `shifts magnified ×${s.magnify.toFixed(0)} — true 1.75″ ≈ 1/1900 of the disk`,
    plotX0 + plotW - 4,
    plotY0 + plotH - 2,
  );
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}
