"use client";

import { useEffect, useRef, useState } from "react";

/**
 * FIG.37a — The EFE money shot.
 *
 * Split-screen Canvas 2D visualization of G_{μν} = (8πG/c⁴) T_{μν}.
 *
 * LEFT PANEL: A mass sphere with adjustable density (ρ from 0 → solar density
 *   → neutron-star density). The sphere glows more intensely as ρ increases,
 *   visually encoding the stress-energy tensor T_{μν}.
 *
 * RIGHT PANEL: The resulting Ricci-scalar curvature drawn as a heatmap on the
 *   same spatial domain. Color intensity tracks the matter content — as ρ rises,
 *   the curvature heatmap deepens from dark to incandescent amber.
 *
 * CENTER: The equation G_{μν} = (8πG/c⁴) T_{μν} with a glowing arrow that
 *   brightens as the slider moves, connecting matter on the left to geometry
 *   on the right.
 *
 * The visual unity: pull on T, the geometry responds.
 */

const W = 720;
const H = 380;
const PAD = 16;
const CENTER_W = 130;
const PANEL_W = (W - PAD * 2 - CENTER_W) / 2;

// Density scale: 0 = vacuum, 0.5 = solar core, 1.0 = neutron-star
const DENSITIES: { label: string; value: number }[] = [
  { label: "vacuum", value: 0 },
  { label: "air", value: 0.05 },
  { label: "water", value: 0.10 },
  { label: "iron", value: 0.18 },
  { label: "white dwarf", value: 0.45 },
  { label: "solar core", value: 0.55 },
  { label: "neutron star", value: 1.0 },
];

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Map a density (0–1) to an RGBA color for the curvature heatmap.
 *  Black → deep purple → amber/white, mimicking thermal emission. */
function heatColor(
  intensity: number,
): [number, number, number, number] {
  if (intensity <= 0) return [8, 4, 20, 255];
  if (intensity < 0.3) {
    const t = intensity / 0.3;
    return [
      Math.round(lerp(8, 80, t)),
      Math.round(lerp(4, 10, t)),
      Math.round(lerp(20, 120, t)),
      255,
    ];
  }
  if (intensity < 0.65) {
    const t = (intensity - 0.3) / 0.35;
    return [
      Math.round(lerp(80, 220, t)),
      Math.round(lerp(10, 80, t)),
      Math.round(lerp(120, 20, t)),
      255,
    ];
  }
  const t = (intensity - 0.65) / 0.35;
  return [
    Math.round(lerp(220, 255, t)),
    Math.round(lerp(80, 220, t)),
    Math.round(lerp(20, 100, t)),
    255,
  ];
}

export function EFESplitScreenScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rho, setRho] = useState(0.35);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = "#050508";
    ctx.fillRect(0, 0, W, H);

    const leftX0 = PAD;
    const rightX0 = PAD + PANEL_W + CENTER_W;
    const panelY0 = PAD;
    const panelH = H - PAD * 2;
    const centerX = PAD + PANEL_W;

    // ── LEFT PANEL: matter / stress-energy T_{μν} ──────────────────────────
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    ctx.strokeRect(leftX0, panelY0, PANEL_W, panelH);

    // Panel header
    ctx.fillStyle = "#67E8F9";
    ctx.font = "bold 10px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("MATTER · T_{μν}", leftX0 + PANEL_W / 2, panelY0 + 18);

    // Mass sphere — radius and glow intensity scale with ρ
    const sphereCX = leftX0 + PANEL_W / 2;
    const sphereCY = panelY0 + panelH / 2 + 8;
    const baseR = 28;
    const sphereR = baseR + rho * 22;

    // Glow rings
    const glowLayers = 6;
    for (let i = glowLayers; i >= 1; i--) {
      const r = sphereR + i * 12 * rho;
      const alpha = (rho * 0.28) / i;
      const g = ctx.createRadialGradient(sphereCX, sphereCY, sphereR * 0.5, sphereCX, sphereCY, r);
      g.addColorStop(0, `rgba(103,232,249,${alpha.toFixed(3)})`);
      g.addColorStop(1, "rgba(103,232,249,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(sphereCX, sphereCY, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Sphere body gradient — cool blue-white at center, deeper at edge
    const sphereGrad = ctx.createRadialGradient(
      sphereCX - sphereR * 0.3,
      sphereCY - sphereR * 0.3,
      sphereR * 0.05,
      sphereCX,
      sphereCY,
      sphereR,
    );
    const coreIntensity = Math.min(1, 0.3 + rho * 0.7);
    sphereGrad.addColorStop(0, `rgba(255,255,255,${coreIntensity.toFixed(2)})`);
    sphereGrad.addColorStop(0.4, `rgba(103,232,249,${(coreIntensity * 0.85).toFixed(2)})`);
    sphereGrad.addColorStop(1, `rgba(30,60,120,0.9)`);
    ctx.fillStyle = sphereGrad;
    ctx.beginPath();
    ctx.arc(sphereCX, sphereCY, sphereR, 0, Math.PI * 2);
    ctx.fill();

    // Density label
    const densityLabel =
      DENSITIES.slice()
        .reverse()
        .find((d) => rho >= d.value)?.label ?? "vacuum";
    ctx.fillStyle = "rgba(103,232,249,0.85)";
    ctx.font = "10px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText(`ρ = ${(rho * 100).toFixed(0)}%  (${densityLabel})`, sphereCX, panelY0 + panelH - 28);
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.font = "9px ui-monospace, monospace";
    ctx.fillText("mass-energy source", sphereCX, panelY0 + panelH - 14);

    // ── RIGHT PANEL: curvature heatmap / G_{μν} ────────────────────────────
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    ctx.strokeRect(rightX0, panelY0, PANEL_W, panelH);

    ctx.fillStyle = "#C084FC";
    ctx.font = "bold 10px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("CURVATURE · G_{μν}", rightX0 + PANEL_W / 2, panelY0 + 18);

    // Draw curvature heatmap on a grid
    const gridCols = 32;
    const gridRows = 22;
    const cellW = PANEL_W / gridCols;
    const cellH = (panelH - 48) / gridRows;
    const heatCX = rightX0 + PANEL_W / 2;
    const heatCY = panelY0 + 28 + ((panelH - 48) / 2);

    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        const px = rightX0 + col * cellW;
        const py = panelY0 + 28 + row * cellH;
        const cx = rightX0 + (col + 0.5) * cellW;
        const cy = panelY0 + 28 + (row + 0.5) * cellH;
        const dx = (cx - heatCX) / (PANEL_W * 0.45);
        const dy = (cy - heatCY) / ((panelH - 48) * 0.4);
        const dist2 = dx * dx + dy * dy;
        // Curvature falls off as ~1/(r² + ε) — the Ricci scalar for a mass source
        const rawIntensity = rho / (dist2 * 4 + 0.3);
        const intensity = Math.min(1, rawIntensity);
        const [r, g, b, a] = heatColor(intensity);
        ctx.fillStyle = `rgba(${r},${g},${b},${a / 255})`;
        ctx.fillRect(px, py, Math.ceil(cellW) + 1, Math.ceil(cellH) + 1);
      }
    }

    // Curvature peak marker (white cross at max-curvature center)
    ctx.strokeStyle = `rgba(255,255,255,${Math.min(0.8, rho * 1.2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(heatCX - 8, heatCY);
    ctx.lineTo(heatCX + 8, heatCY);
    ctx.moveTo(heatCX, heatCY - 8);
    ctx.moveTo(heatCX, heatCY + 8);
    ctx.stroke();

    ctx.fillStyle = "rgba(192,132,252,0.8)";
    ctx.font = "9px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("spacetime curvature", rightX0 + PANEL_W / 2, panelY0 + panelH - 28);
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.font = "9px ui-monospace, monospace";
    ctx.fillText("Ricci scalar R (spatial cross-section)", rightX0 + PANEL_W / 2, panelY0 + panelH - 14);

    // ── CENTER: equation with glowing arrow ───────────────────────────────
    const arrowAlpha = 0.3 + rho * 0.7;
    const eqCX = centerX + CENTER_W / 2;
    const eqMidY = panelY0 + panelH / 2;

    // Equation text background pill
    ctx.fillStyle = "rgba(10,10,18,0.92)";
    ctx.beginPath();
    ctx.roundRect(centerX + 4, panelY0 + panelH / 2 - 52, CENTER_W - 8, 105, 8);
    ctx.fill();

    // Equation lines
    ctx.fillStyle = `rgba(255,255,255,${(0.65 + rho * 0.35).toFixed(2)})`;
    ctx.font = "bold 11px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("G_{μν}", eqCX, eqMidY - 30);

    ctx.fillStyle = `rgba(255,255,255,${(0.5 + rho * 0.4).toFixed(2)})`;
    ctx.font = "11px ui-monospace, monospace";
    ctx.fillText("=", eqCX, eqMidY - 14);

    ctx.fillStyle = `rgba(255,230,80,${(0.55 + rho * 0.45).toFixed(2)})`;
    ctx.font = "bold 10px ui-monospace, monospace";
    ctx.fillText("8πG/c⁴", eqCX, eqMidY + 2);

    ctx.fillStyle = `rgba(255,255,255,${(0.5 + rho * 0.4).toFixed(2)})`;
    ctx.font = "11px ui-monospace, monospace";
    ctx.fillText("·", eqCX, eqMidY + 16);

    ctx.fillStyle = `rgba(103,232,249,${(0.65 + rho * 0.35).toFixed(2)})`;
    ctx.font = "bold 11px ui-monospace, monospace";
    ctx.fillText("T_{μν}", eqCX, eqMidY + 32);

    // Left arrow (T → equation)
    const arrowY = eqMidY - 8;
    const arrowColor = `rgba(255,210,60,${arrowAlpha.toFixed(2)})`;
    ctx.strokeStyle = arrowColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(centerX + 4, arrowY);
    ctx.lineTo(leftX0 + PANEL_W - 4, arrowY);
    ctx.stroke();
    // arrowhead pointing left (into T panel)
    ctx.fillStyle = arrowColor;
    ctx.beginPath();
    ctx.moveTo(leftX0 + PANEL_W, arrowY);
    ctx.lineTo(leftX0 + PANEL_W - 8, arrowY - 4);
    ctx.lineTo(leftX0 + PANEL_W - 8, arrowY + 4);
    ctx.closePath();
    ctx.fill();

    // Right arrow (equation → G)
    ctx.strokeStyle = arrowColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(centerX + CENTER_W - 4, arrowY);
    ctx.lineTo(rightX0 + 4, arrowY);
    ctx.stroke();
    ctx.fillStyle = arrowColor;
    ctx.beginPath();
    ctx.moveTo(rightX0, arrowY);
    ctx.lineTo(rightX0 + 8, arrowY - 4);
    ctx.lineTo(rightX0 + 8, arrowY + 4);
    ctx.closePath();
    ctx.fill();

    // Glow pulse on arrow proportional to rho
    if (rho > 0.05) {
      const glowR = 4 + rho * 8;
      const gGlow = ctx.createRadialGradient(eqCX, arrowY, 0, eqCX, arrowY, glowR * 4);
      gGlow.addColorStop(0, `rgba(255,210,60,${(rho * 0.4).toFixed(2)})`);
      gGlow.addColorStop(1, "rgba(255,210,60,0)");
      ctx.fillStyle = gGlow;
      ctx.beginPath();
      ctx.arc(eqCX, arrowY, glowR * 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Caption at top of center column
    ctx.fillStyle = "rgba(255,255,255,0.30)";
    ctx.font = "8px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("κ = 8πG/c⁴", eqCX, panelY0 + 14);
  }, [rho]);

  const densityLabel =
    DENSITIES.slice()
      .reverse()
      .find((d) => rho >= d.value)?.label ?? "vacuum";

  return (
    <div className="flex flex-col gap-3 p-2">
      <canvas
        ref={canvasRef}
        className="rounded-md border border-white/10 bg-black/60"
      />
      <div className="flex flex-col gap-2 px-1">
        <label className="flex items-center gap-3 font-mono text-xs text-white/70">
          <span className="w-44 shrink-0">
            density: {(rho * 100).toFixed(0)}% ({densityLabel})
          </span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={rho}
            onChange={(e) => setRho(parseFloat(e.target.value))}
            className="flex-1"
          />
        </label>
        <p className="font-mono text-xs text-white/40">
          Left: matter density controls the stress-energy tensor T_&#123;μν&#125;. Right: the
          Ricci-scalar curvature heatmap responds in real time. Center: the coupling
          κ = 8πG/c⁴ connects them. Pull on T — the geometry answers.
        </p>
      </div>
    </div>
  );
}
