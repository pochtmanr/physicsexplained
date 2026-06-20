"use client";

import { useEffect, useRef, useState } from "react";
import {
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  hexToRgba,
  drawHudReadout,
  drawSectionTitle,
  useSceneSize,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";
import { precessingEllipsePoint } from "@/lib/physics/relativity/mercurys-perihelion";

/**
 * FIG.40a — The rosette.
 *
 * A bound orbit that does not close. The body traces a Kepler ellipse whose
 * line of apsides advances a small angle every revolution. The true advance is
 * far too small to see (≈ 0.1″ per orbit for Mercury), so an EXAGGERATION
 * slider multiplies it; an ON/OFF toggle removes the GR term entirely so the
 * ellipse closes on itself (the Newtonian prediction). The accumulated apsidal
 * angle is reported live, scaled back to arcsec/orbit at true scale.
 */

const TWO_PI = Math.PI * 2;

// Visualization eccentricity is bumped above Mercury's 0.206 so the ellipse
// shape and the marching perihelion read clearly on screen.
const VIS_E = 0.45;
const VIS_A = 1; // arbitrary units; scaled to canvas

export function PrecessingEllipseScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [exaggeration, setExaggeration] = useState(40);
  const [grOn, setGrOn] = useState(true);
  const [running, setRunning] = useState(true);
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.62,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 320,
  });

  const stateRef = useRef({ theta: 0, apside: 0, lastT: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;

    let raf = 0;
    const loop = (now: number) => {
      const st = stateRef.current;
      if (st.lastT === 0) st.lastT = now;
      const dt = Math.min(0.05, (now - st.lastT) / 1000);
      st.lastT = now;

      if (running) {
        // Angular speed via vis-viva-like sweep: faster near perihelion.
        const r =
          (VIS_A * (1 - VIS_E * VIS_E)) / (1 + VIS_E * Math.cos(st.theta));
        const speed = 1.8 / (r * r); // ∝ 1/r² (conserved areal velocity)
        const prevTheta = st.theta;
        st.theta += speed * dt;
        // Advance the apside line once per completed revolution, smoothly.
        const advancePerOrbit = grOn ? exaggeration * 0.0035 : 0;
        st.apside += (advancePerOrbit / TWO_PI) * (st.theta - prevTheta);
        if (st.theta > TWO_PI * 8) {
          st.theta -= TWO_PI * 8;
        }
      }

      draw(ctx, tokens, width, height, st.theta, st.apside, exaggeration, grOn);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [tokens, width, height, exaggeration, grOn, running]);

  // True (un-exaggerated) advance reported for honesty: 43″/cy ÷ ~415 orbits/cy.
  const mercuryArcsecPerOrbit = 0.1037;

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="A precessing Kepler ellipse. The orbiting body traces a rosette because its line of apsides advances each revolution. An exaggeration slider scales the relativistic advance into visibility, and a toggle switches the general-relativistic term on and off."
      />
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-44 shrink-0">
          exaggeration: ×{exaggeration.toFixed(0)}
        </span>
        <input
          type="range"
          min={1}
          max={200}
          step={1}
          value={exaggeration}
          onChange={(e) => setExaggeration(parseFloat(e.target.value))}
          className="min-w-[140px] flex-1"
          style={{ accentColor: "var(--color-cyan)" }}
        />
        <button
          type="button"
          onClick={() => setGrOn((v) => !v)}
          className="cursor-pointer border px-2 py-1"
          style={{
            borderColor: grOn ? "var(--color-cyan)" : "var(--color-fg-4)",
            color: grOn ? "var(--color-cyan)" : "var(--color-fg-3)",
          }}
        >
          GR term: {grOn ? "ON" : "OFF"}
        </button>
        <button
          type="button"
          onClick={() => setRunning((v) => !v)}
          className="cursor-pointer border px-2 py-1"
          style={{
            borderColor: "var(--color-fg-4)",
            color: "var(--color-fg-3)",
          }}
        >
          {running ? "pause" : "play"}
        </button>
      </div>
      <p className="mt-2 font-mono text-[11px] text-[var(--color-fg-3)]">
        At true scale Mercury advances only ≈ {mercuryArcsecPerOrbit.toFixed(3)}
        ″ per orbit — the rosette here is magnified ×{exaggeration.toFixed(0)} to
        be visible.
      </p>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  W: number,
  H: number,
  theta: number,
  apside: number,
  exaggeration: number,
  grOn: boolean,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  drawSectionTitle(
    ctx,
    14,
    12,
    grOn ? "PRECESSING ORBIT (GR)" : "CLOSED ELLIPSE (NEWTON)",
    tokens.textMute,
  );

  const cx = W / 2;
  const cy = H / 2 + 8;
  // Scale the orbit (focus at sun) to fit; aphelion = a(1+e).
  const scale =
    (Math.min(W, H) * 0.5 - 30) / (VIS_A * (1 + VIS_E));

  // ── Sun at the focus ────────────────────────────────────────────────────
  const sunR = 7;
  const sunGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, sunR * 4);
  sunGlow.addColorStop(0, hexToRgba(tokens.amber, 0.9));
  sunGlow.addColorStop(1, hexToRgba(tokens.amber, 0));
  ctx.fillStyle = sunGlow;
  ctx.beginPath();
  ctx.arc(cx, cy, sunR * 4, 0, TWO_PI);
  ctx.fill();
  ctx.fillStyle = tokens.amber;
  ctx.beginPath();
  ctx.arc(cx, cy, sunR, 0, TWO_PI);
  ctx.fill();

  // ── Trailing rosette (many orbits with their own advanced apside) ───────
  // Render the swept path by stepping a fictitious set of past revolutions.
  const advancePerOrbit = grOn ? exaggeration * 0.0035 : 0;
  const orbitsBack = 7;
  ctx.lineWidth = 1;
  for (let k = orbitsBack; k >= 0; k--) {
    const ap = apside - advancePerOrbit * k;
    const fade = 1 - k / (orbitsBack + 1);
    ctx.strokeStyle = hexToRgba(tokens.cyan, 0.12 + fade * 0.35);
    ctx.beginPath();
    for (let i = 0; i <= 120; i++) {
      const th = (i / 120) * TWO_PI;
      const p = precessingEllipsePoint(VIS_A, VIS_E, th, ap);
      const px = cx + p.x * scale;
      const py = cy - p.y * scale;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  // ── Current apside (perihelion direction) line ──────────────────────────
  const peri = precessingEllipsePoint(VIS_A, VIS_E, 0, apside);
  const periX = cx + peri.x * scale;
  const periY = cy - peri.y * scale;
  ctx.strokeStyle = hexToRgba(tokens.magenta, 0.8);
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(periX, periY);
  ctx.stroke();
  ctx.setLineDash([]);

  // Perihelion marker
  ctx.fillStyle = tokens.magenta;
  ctx.beginPath();
  ctx.arc(periX, periY, 4, 0, TWO_PI);
  ctx.fill();
  ctx.font = "11px ui-monospace, monospace";
  ctx.fillStyle = tokens.magenta;
  ctx.textAlign = "left";
  ctx.fillText("perihelion", periX + 7, periY - 2);

  // ── The planet on the current ellipse ───────────────────────────────────
  const body = precessingEllipsePoint(VIS_A, VIS_E, theta, apside);
  const bx = cx + body.x * scale;
  const by = cy - body.y * scale;
  const bodyGlow = ctx.createRadialGradient(bx, by, 0, bx, by, 14);
  bodyGlow.addColorStop(0, hexToRgba(tokens.textBright, 0.8));
  bodyGlow.addColorStop(1, hexToRgba(tokens.textBright, 0));
  ctx.fillStyle = bodyGlow;
  ctx.beginPath();
  ctx.arc(bx, by, 14, 0, TWO_PI);
  ctx.fill();
  ctx.fillStyle = tokens.textBright;
  ctx.beginPath();
  ctx.arc(bx, by, 4.5, 0, TWO_PI);
  ctx.fill();

  // ── HUD ─────────────────────────────────────────────────────────────────
  const apsideArcsec = ((apside / TWO_PI) * 360 * 3600).toFixed(0);
  let hy = H - 56;
  hy = drawHudReadout(
    ctx,
    14,
    hy,
    "apside advance: ",
    grOn ? `${apsideArcsec}″ (×${exaggeration.toFixed(0)})` : "0″ — closes",
    tokens.textDim,
    grOn ? tokens.magenta : tokens.textMute,
  );
  drawHudReadout(
    ctx,
    14,
    hy,
    "orbit: ",
    grOn ? "open rosette" : "closed ellipse",
    tokens.textDim,
    grOn ? tokens.cyan : tokens.green,
  );
}
