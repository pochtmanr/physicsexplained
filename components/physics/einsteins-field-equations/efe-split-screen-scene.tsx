"use client";

import { useEffect, useRef, useState } from "react";
import {
  FONT_HUD_SMALL,
  SCENE_CANVAS_CLASS,
  SCENE_HEIGHT_DEFAULT,
  applyDpr,
  hexToRgba,
  drawHudReadout,
  drawSectionTitle,
  drawArrow,
  useSceneSize,
  useSceneTick,
  useSceneTokens,
  type SceneTokens,
} from "@/components/physics/_shared/scene-tokens";

/**
 * FIG.37a — The EFE money shot.
 *
 * Split-screen Canvas 2D visualization of G_{μν} = (8πG/c⁴) T_{μν}.
 *
 * LEFT PANEL: A mass sphere whose radial gradient shifts CYAN (vacuum) →
 *   AMBER (solar core) → near-white (neutron star) as ρ increases. Subtle
 *   pulsing glow at high density.
 *
 * RIGHT PANEL: Ricci-scalar curvature heatmap on the same spatial domain.
 *   BG (no curvature) → GREEN tint (mild) → MAGENTA (strong).
 *
 * CENTER: The equation rendered LARGE in textBright. "=" pulses GREEN as
 *   the slider moves. drawArrow connects left panel → equation → right panel
 *   in AMBER.
 *
 * Density slider with labeled stops: vacuum → neutron star.
 * HUD via drawHudReadout: T_{00} in CYAN, Ricci scalar in MAGENTA.
 * drawSectionTitle: "MATTER (T)" left, "GEOMETRY (G)" right.
 */

const PAD = 16;

// Physical density scale: 0 = vacuum, 1.0 = neutron star
const DENSITIES: { label: string; value: number; t00: number }[] = [
  { label: "vacuum",      value: 0,    t00: 0 },
  { label: "air",         value: 0.05, t00: 1.2 },
  { label: "water",       value: 0.10, t00: 1e3 },
  { label: "iron",        value: 0.18, t00: 7.87e3 },
  { label: "white dwarf", value: 0.45, t00: 1e9 },
  { label: "solar core",  value: 0.55, t00: 1.5e5 },
  { label: "neutron star",value: 1.0,  t00: 5e17 },
];

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Heatmap: BG → GREEN tint → MAGENTA as intensity rises. */
function heatColor(intensity: number): [number, number, number] {
  if (intensity <= 0) {
    // parse BG = "#0A0C12"
    return [10, 12, 18];
  }
  // BG → GREEN tint (0 → 0.4)
  if (intensity < 0.4) {
    const t = intensity / 0.4;
    // GREEN = "#86EFAC" → rgb(134,239,172)
    return [
      Math.round(lerp(10, 134, t)),
      Math.round(lerp(12, 239, t)),
      Math.round(lerp(18, 172, t)),
    ];
  }
  // GREEN → MAGENTA (0.4 → 1.0): "#86EFAC" → "#FF6ADE" → rgb(255,106,222)
  const t = (intensity - 0.4) / 0.6;
  return [
    Math.round(lerp(134, 255, t)),
    Math.round(lerp(239, 106, t)),
    Math.round(lerp(172, 222, t)),
  ];
}

/** Sphere body color: CYAN → AMBER → near-white as rho rises. */
function sphereCoreColor(rho: number): [number, number, number] {
  // CYAN "#67E8F9" = rgb(103,232,249)
  // AMBER "#FFB36B" = rgb(255,179,107)
  // near-white rgb(255,245,230)
  if (rho < 0.55) {
    const t = rho / 0.55;
    return [
      Math.round(lerp(103, 255, t)),
      Math.round(lerp(232, 179, t)),
      Math.round(lerp(249, 107, t)),
    ];
  }
  const t = (rho - 0.55) / 0.45;
  return [
    Math.round(lerp(255, 255, t)),
    Math.round(lerp(179, 245, t)),
    Math.round(lerp(107, 230, t)),
  ];
}

function densityEntryAt(rho: number) {
  return (
    DENSITIES.slice()
      .reverse()
      .find((d) => rho >= d.value) ?? DENSITIES[0]
  );
}

function formatT00(t00: number): string {
  if (t00 === 0) return "0";
  const exp = Math.floor(Math.log10(t00));
  const mant = t00 / Math.pow(10, exp);
  if (exp === 0) return t00.toFixed(2);
  return `${mant.toFixed(2)} × 10^${exp}`;
}

export function EFESplitScreenScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tokens = useSceneTokens();
  const [rho, setRho] = useState(0.35);
  const tickRef = useSceneTick(true);
  const { width, height } = useSceneSize(containerRef, {
    ratio: 0.55,
    maxHeight: SCENE_HEIGHT_DEFAULT,
    minHeight: 320,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = applyDpr(canvas, width, height);
    if (!ctx) return;

    let raf = 0;
    const loop = () => {
      const t = tickRef.current / 1000;
      draw(ctx, tokens, rho, t, width, height);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [rho, tokens, tickRef, width, height]);

  const densityEntry = densityEntryAt(rho);

  return (
    <div ref={containerRef} className="relative w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block" }}
        className={SCENE_CANVAS_CLASS}
        aria-label="Split-screen visualization of Einstein's field equations G_{μν} = (8πG/c⁴) T_{μν}. Left panel shows a mass sphere representing the stress-energy tensor T. Right panel shows the resulting Ricci-scalar curvature heatmap. A density slider adjusts from vacuum to neutron star."
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[var(--color-fg-2)]">
        <span className="w-48 shrink-0">
          ρ: {(rho * 100).toFixed(0)}% — {densityEntry.label}
        </span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={rho}
          onChange={(e) => setRho(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-magenta)" }}
        />
      </div>
      <div className="mt-1 flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs text-[var(--color-fg-3)]">
        {DENSITIES.map((d) => (
          <button
            key={d.label}
            type="button"
            className="cursor-pointer hover:text-[var(--color-fg-1)]"
            onClick={() => setRho(d.value)}
          >
            {d.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  tokens: SceneTokens,
  rho: number,
  t: number,
  W: number,
  H: number,
) {
  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, W, H);

  // Layout adapts to actual rendered width — center pill is a fixed
  // fraction of the canvas, panels share the rest.
  const centerW = Math.max(120, Math.min(180, W * 0.22));
  const panelW = (W - PAD * 2 - centerW) / 2;
  const leftX0 = PAD;
  const rightX0 = PAD + panelW + centerW;
  const panelY0 = PAD + 24; // leave room for section titles
  const panelH = H - PAD * 2 - 24;
  const centerX = PAD + panelW;
  const PANEL_W = panelW;
  const CENTER_W = centerW;

  // ── LEFT PANEL border ────────────────────────────────────────────────────
  ctx.strokeStyle = tokens.panelBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(leftX0, panelY0, PANEL_W, panelH);

  // Section title
  drawSectionTitle(ctx, leftX0 + 6, panelY0 - 18, "MATTER  (T)", tokens.textMute);

  // Mass sphere — color shifts CYAN → AMBER → near-white
  const sphereCX = leftX0 + PANEL_W / 2;
  const sphereCY = panelY0 + panelH / 2 + 4;
  const baseR = 28;
  const sphereR = baseR + rho * 26;
  const [cr, cg, cb] = sphereCoreColor(rho);

  // Pulsing glow at high density
  const pulse = rho > 0.5 ? 0.5 + 0.5 * Math.sin(t * 2.5) : 0;
  const glowLayers = 6;
  for (let i = glowLayers; i >= 1; i--) {
    const glowExtra = rho * 14 + pulse * 6;
    const r = sphereR + i * glowExtra;
    const alpha = ((rho * 0.22 + pulse * 0.08) / i);
    const gGlow = ctx.createRadialGradient(sphereCX, sphereCY, sphereR * 0.5, sphereCX, sphereCY, r);
    gGlow.addColorStop(0, `rgba(${cr},${cg},${cb},${alpha.toFixed(3)})`);
    gGlow.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
    ctx.fillStyle = gGlow;
    ctx.beginPath();
    ctx.arc(sphereCX, sphereCY, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Sphere body: radial gradient from core color to dark edge
  const sphereGrad = ctx.createRadialGradient(
    sphereCX - sphereR * 0.28,
    sphereCY - sphereR * 0.28,
    sphereR * 0.04,
    sphereCX,
    sphereCY,
    sphereR,
  );
  const coreAlpha = Math.min(1, 0.55 + rho * 0.45);
  sphereGrad.addColorStop(0, `rgba(255,255,255,${(coreAlpha * 0.9).toFixed(2)})`);
  sphereGrad.addColorStop(0.25, `rgba(${cr},${cg},${cb},${coreAlpha.toFixed(2)})`);
  sphereGrad.addColorStop(1, `rgba(20,30,60,0.95)`);
  ctx.fillStyle = sphereGrad;
  ctx.beginPath();
  ctx.arc(sphereCX, sphereCY, sphereR, 0, Math.PI * 2);
  ctx.fill();

  // Density label on left panel
  const densityEntry = densityEntryAt(rho);
  ctx.fillStyle = tokens.textMute;
  ctx.font = FONT_HUD_SMALL;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(densityEntry.label, sphereCX, panelY0 + panelH - 22);

  // ── RIGHT PANEL border ───────────────────────────────────────────────────
  ctx.strokeStyle = tokens.panelBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(rightX0, panelY0, PANEL_W, panelH);

  // Section title (right-aligned)
  drawSectionTitle(ctx, rightX0 + 6, panelY0 - 18, "GEOMETRY  (G)", tokens.textMute);

  // Curvature heatmap
  const gridCols = 36;
  const gridRows = 24;
  const heatAreaH = panelH - 32;
  const cellW = PANEL_W / gridCols;
  const cellH = heatAreaH / gridRows;
  const heatCX = rightX0 + PANEL_W / 2;
  const heatCY = panelY0 + 8 + heatAreaH / 2;

  for (let row = 0; row < gridRows; row++) {
    for (let col = 0; col < gridCols; col++) {
      const px = rightX0 + col * cellW;
      const py = panelY0 + 8 + row * cellH;
      const cx = rightX0 + (col + 0.5) * cellW;
      const cy = panelY0 + 8 + (row + 0.5) * cellH;
      const dx = (cx - heatCX) / (PANEL_W * 0.42);
      const dy = (cy - heatCY) / (heatAreaH * 0.42);
      const dist2 = dx * dx + dy * dy;
      const rawIntensity = rho / (dist2 * 3.5 + 0.28);
      const intensity = Math.min(1, rawIntensity);
      const [r, g, b] = heatColor(intensity);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(px, py, Math.ceil(cellW) + 1, Math.ceil(cellH) + 1);
    }
  }

  // Curvature cross marker
  ctx.strokeStyle = `rgba(255,255,255,${Math.min(0.7, rho * 1.1)})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(heatCX - 7, heatCY);
  ctx.lineTo(heatCX + 7, heatCY);
  ctx.moveTo(heatCX, heatCY - 7);
  ctx.lineTo(heatCX, heatCY + 7);
  ctx.stroke();

  // ── CENTER: equation ──────────────────────────────────────────────────────
  const eqCX = centerX + CENTER_W / 2;
  const eqMidY = panelY0 + panelH / 2;
  const eqGlow = 0.3 + rho * 0.7; // "=" brightness

  // Pill background — square corners to match the panels (consistency with
  // the EM/CM frame language: SceneCard provides the only rounded element).
  const pillX = centerX + 4;
  const pillY = panelY0 + panelH / 2 - 66;
  const pillW = CENTER_W - 8;
  const pillH = 132;
  ctx.fillStyle = hexToRgba(tokens.bg, 0.94);
  ctx.fillRect(pillX, pillY, pillW, pillH);
  ctx.strokeStyle = tokens.panelBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(pillX, pillY, pillW, pillH);

  // G_{μν}
  ctx.font = "bold 15px ui-monospace, monospace";
  ctx.fillStyle = tokens.textBright;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("G_{μν}", eqCX, eqMidY - 40);

  // "=" with GREEN glow
  const eqGlowColor = hexToRgba(tokens.green, eqGlow);
  // Shadow glow on "="
  ctx.save();
  ctx.shadowColor = tokens.green;
  ctx.shadowBlur = 8 + rho * 14;
  ctx.font = "bold 16px ui-monospace, monospace";
  ctx.fillStyle = eqGlowColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("=", eqCX, eqMidY - 20);
  ctx.restore();

  // 8πG/c⁴
  ctx.font = "11px ui-monospace, monospace";
  ctx.fillStyle = hexToRgba(tokens.amber, 0.75 + rho * 0.25);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("8πG/c⁴", eqCX, eqMidY);

  // ·
  ctx.fillStyle = tokens.textDim;
  ctx.fillText("·", eqCX, eqMidY + 16);

  // T_{μν}
  ctx.font = "bold 15px ui-monospace, monospace";
  ctx.fillStyle = hexToRgba(tokens.cyan, 0.75 + rho * 0.25);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("T_{μν}", eqCX, eqMidY + 38);

  ctx.textBaseline = "alphabetic";

  // ── AMBER arrows connecting panels to equation ────────────────────────────
  const arrowY = eqMidY - 12;
  const arrowAlpha = 0.35 + rho * 0.65;
  const arrowColor = hexToRgba(tokens.amber, arrowAlpha);

  // Left panel → equation (pointing right toward center)
  drawArrow(
    ctx,
    leftX0 + PANEL_W - 2,
    arrowY,
    centerX + 8,
    arrowY,
    arrowColor,
    1.5,
    7,
  );

  // Equation → right panel (pointing right)
  drawArrow(
    ctx,
    centerX + CENTER_W - 8,
    arrowY,
    rightX0 + 2,
    arrowY,
    arrowColor,
    1.5,
    7,
  );

  // Arrow glow at high density
  if (rho > 0.1) {
    const glowAlpha = rho * 0.3;
    const gGlow = ctx.createRadialGradient(eqCX, arrowY, 0, eqCX, arrowY, 30);
    gGlow.addColorStop(0, hexToRgba(tokens.amber, glowAlpha));
    gGlow.addColorStop(1, hexToRgba(tokens.amber, 0));
    ctx.fillStyle = gGlow;
    ctx.beginPath();
    ctx.arc(eqCX, arrowY, 30, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── HUD readouts ─────────────────────────────────────────────────────────
  const hudX = leftX0 + 6;
  const hudY0 = panelY0 + 6;

  const t00 = densityEntry.t00;
  const ricciVal = rho < 0.01
    ? "≈ 0"
    : `${(rho * 8.4e-10 * 1e10).toFixed(2)} × 10^-10 m⁻²`;

  drawHudReadout(
    ctx,
    hudX,
    hudY0,
    "T_{00} ≈ ",
    formatT00(t00) + " J/m³",
    tokens.textDim,
    tokens.cyan,
  );
  drawHudReadout(
    ctx,
    rightX0 + 6,
    hudY0,
    "R ≈ ",
    ricciVal,
    tokens.textDim,
    tokens.magenta,
  );
}
