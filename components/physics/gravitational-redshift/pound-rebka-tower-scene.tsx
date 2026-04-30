"use client";

import { useEffect, useRef, useState } from "react";
import {
  POUND_REBKA_PREDICTED,
  compensatingDopplerVelocity,
  gravitationalRedshiftFractional,
} from "@/lib/physics/relativity/gravitational-redshift";

/**
 * PoundRebkaTowerScene — FIG.27a · §06 MONEY SHOT.
 *
 * The Jefferson Physical Laboratory at Harvard, side-view cross-section.
 * Co-57 source at the top, Fe-57 absorber at the bottom, 22.5 m of tower
 * between them. A 14.4 keV gamma photon climbs OUT of the gravity well —
 * its frequency drops by Δν/ν = gh/c² ≈ 2.46 × 10⁻¹⁵.
 *
 * An animated photon descends the tower (the absorber's view: incoming
 * photon, blueshifted by the climb-into-the-well of the photon's emitter
 * frame). HUD readouts show:
 *   • predicted shift  (gh/c²)
 *   • equivalent compensating Doppler velocity v = gh/c
 *   • measured value (Pound-Rebka 1960)
 *
 * Canvas 2D, dark bg. PascalCase export: PoundRebkaTowerScene.
 */

const TOWER_HEIGHT_M = 22.5;
const PREDICTED = POUND_REBKA_PREDICTED; // ≈ 2.4538e-15
const V_COMP = compensatingDopplerVelocity(TOWER_HEIGHT_M); // ≈ 7.36e-7 m/s

const BG = "#0A0C12";
const TEXT_BRIGHT = "rgba(255,255,255,0.92)";
const TEXT_DIM = "rgba(255,255,255,0.65)";
const TEXT_MUTE = "rgba(255,255,255,0.45)";
const BRICK = "rgba(180,140,100,0.55)";
const BRICK_DARK = "rgba(120,90,60,0.45)";
const STEEL = "rgba(220,220,235,0.35)";
const AMBER = "#FFB36B";
const CYAN = "#67E8F9";
const PHOTON_RED = "#F87171"; // redshifted gamma at top
const PHOTON_BLUE = "#7DD3FC"; // blueshifted gamma at bottom
const GREEN = "#86EFAC";

export function PoundRebkaTowerScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tick, setTick] = useState(0);

  // Animation: a single photon descends the tower, frequency shifting on the way.
  useEffect(() => {
    let raf = 0;
    let start = performance.now();
    const loop = (t: number) => {
      const elapsed = (t - start) / 1000;
      // 4-second cycle: photon falls from top to bottom, then resets.
      const phase = (elapsed % 4) / 4; // 0..1
      setTick(phase);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    draw(ctx, W, H, tick);
  }, [tick]);

  return (
    <div className="relative w-full">
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: 460, display: "block" }}
        className="rounded-md border border-white/10 bg-[#0A0C12]"
        aria-label="Cross-section of Harvard's 22.5-meter Jefferson Physical Laboratory tower. A Co-57 gamma source at the top emits 14.4 keV photons that fall to an Fe-57 absorber at the bottom, blueshifting by Δν/ν = gh/c² ≈ 2.46 × 10⁻¹⁵."
      />
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  phase: number,
) {
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // Layout: tower occupies central column; HUD on right.
  const towerW = 130;
  const towerX = W * 0.28;
  const topY = 56;
  const botY = H - 80;
  const tH = botY - topY;

  // ── ground line ──
  ctx.save();
  ctx.strokeStyle = TEXT_MUTE;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(20, botY);
  ctx.lineTo(W - 20, botY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // ── tower body (brick) ──
  ctx.save();
  ctx.fillStyle = BRICK_DARK;
  ctx.fillRect(towerX - towerW / 2, topY, towerW, tH);
  // brick rows
  ctx.strokeStyle = BRICK;
  ctx.lineWidth = 1;
  for (let y = topY + 12; y < botY; y += 14) {
    ctx.beginPath();
    ctx.moveTo(towerX - towerW / 2, y);
    ctx.lineTo(towerX + towerW / 2, y);
    ctx.stroke();
  }
  // outer outline
  ctx.strokeStyle = BRICK;
  ctx.lineWidth = 2;
  ctx.strokeRect(towerX - towerW / 2, topY, towerW, tH);
  // hollow shaft (where the gamma travels) — narrow inner column
  const shaftW = 36;
  ctx.fillStyle = BG;
  ctx.fillRect(towerX - shaftW / 2, topY + 14, shaftW, tH - 28);
  ctx.strokeStyle = STEEL;
  ctx.lineWidth = 1;
  ctx.strokeRect(towerX - shaftW / 2, topY + 14, shaftW, tH - 28);
  ctx.restore();

  // ── source at top: Co-57 ──
  const sourceY = topY + 18;
  ctx.save();
  // source mount
  ctx.fillStyle = STEEL;
  ctx.fillRect(towerX - 18, sourceY - 8, 36, 8);
  // source disc
  const sgrad = ctx.createRadialGradient(
    towerX,
    sourceY + 6,
    1,
    towerX,
    sourceY + 6,
    10,
  );
  sgrad.addColorStop(0, "#FCA5A5");
  sgrad.addColorStop(1, "rgba(248,113,113,0.2)");
  ctx.fillStyle = sgrad;
  ctx.beginPath();
  ctx.arc(towerX, sourceY + 6, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PHOTON_RED;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.font = "bold 11px ui-monospace, monospace";
  ctx.fillStyle = PHOTON_RED;
  ctx.textAlign = "left";
  ctx.fillText("Co-57", towerX + 22, sourceY + 4);
  ctx.font = "10px ui-monospace, monospace";
  ctx.fillStyle = TEXT_DIM;
  ctx.fillText("source · 14.4 keV γ", towerX + 22, sourceY + 17);
  ctx.restore();

  // ── absorber at bottom: Fe-57 ──
  const absorberY = botY - 18;
  ctx.save();
  ctx.fillStyle = STEEL;
  ctx.fillRect(towerX - 18, absorberY, 36, 8);
  const agrad = ctx.createRadialGradient(
    towerX,
    absorberY - 4,
    1,
    towerX,
    absorberY - 4,
    10,
  );
  agrad.addColorStop(0, "#BFDBFE");
  agrad.addColorStop(1, "rgba(125,211,252,0.2)");
  ctx.fillStyle = agrad;
  ctx.beginPath();
  ctx.arc(towerX, absorberY - 4, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PHOTON_BLUE;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.font = "bold 11px ui-monospace, monospace";
  ctx.fillStyle = PHOTON_BLUE;
  ctx.textAlign = "left";
  ctx.fillText("Fe-57", towerX + 22, absorberY - 4);
  ctx.font = "10px ui-monospace, monospace";
  ctx.fillStyle = TEXT_DIM;
  ctx.fillText("absorber · resonance", towerX + 22, absorberY + 9);
  ctx.restore();

  // ── animated photon descending ──
  const photonY = sourceY + 6 + phase * (absorberY - 4 - sourceY - 6);
  // colour blend: red at top, blue at bottom (visualisation only — real
  // shift is 10⁻¹⁵, invisible; the gradient is allegorical, not literal)
  const r = Math.round(248 + (125 - 248) * phase);
  const g = Math.round(113 + (211 - 113) * phase);
  const b = Math.round(113 + (252 - 113) * phase);
  const photonColour = `rgb(${r}, ${g}, ${b})`;

  ctx.save();
  // Trail (sinusoidal wavy line — wavelength compresses as it descends)
  ctx.strokeStyle = photonColour;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  const trailTopY = sourceY + 12;
  const trailBotY = photonY;
  // wavelength shrinks as we go down (visual exaggeration)
  const N = 80;
  for (let i = 0; i <= N; i++) {
    const tt = i / N;
    const yy = trailTopY + tt * (trailBotY - trailTopY);
    // amplitude shrinks slightly toward bottom; phase accelerates
    const wavelength = 14 - 4 * tt;
    const xx = towerX + 5 * Math.sin((yy / wavelength) * Math.PI * 2);
    if (i === 0) ctx.moveTo(xx, yy);
    else ctx.lineTo(xx, yy);
  }
  ctx.stroke();

  // Photon head (small bright dot)
  const grad = ctx.createRadialGradient(towerX, photonY, 0, towerX, photonY, 8);
  grad.addColorStop(0, photonColour);
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(towerX, photonY, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // ── tower height annotation ──
  ctx.save();
  const annX = towerX - towerW / 2 - 18;
  ctx.strokeStyle = AMBER;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(annX, topY);
  ctx.lineTo(annX, botY);
  ctx.stroke();
  // tick marks
  ctx.beginPath();
  ctx.moveTo(annX - 4, topY);
  ctx.lineTo(annX + 4, topY);
  ctx.moveTo(annX - 4, botY);
  ctx.lineTo(annX + 4, botY);
  ctx.stroke();
  ctx.font = "bold 11px ui-monospace, monospace";
  ctx.fillStyle = AMBER;
  ctx.textAlign = "center";
  ctx.save();
  ctx.translate(annX - 10, (topY + botY) / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(`h = ${TOWER_HEIGHT_M} m`, 0, 0);
  ctx.restore();
  ctx.restore();

  // ── photon climbs OUT label (top) ──
  ctx.save();
  ctx.font = "10px ui-monospace, monospace";
  ctx.fillStyle = TEXT_MUTE;
  ctx.textAlign = "center";
  ctx.fillText("Jefferson Physical Lab · Harvard 1960", towerX, topY - 30);
  ctx.font = "bold 12px ui-monospace, monospace";
  ctx.fillStyle = TEXT_BRIGHT;
  ctx.fillText("the 22.5-meter tower", towerX, topY - 14);
  ctx.restore();

  // ── HUD on the right ──
  const hudX = W * 0.55;
  const hudY = topY + 12;
  const hudW = W - hudX - 20;

  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  ctx.fillRect(hudX, hudY, hudW, 220);
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  ctx.strokeRect(hudX, hudY, hudW, 220);

  // headline
  ctx.font = "bold 12px ui-monospace, monospace";
  ctx.fillStyle = TEXT_BRIGHT;
  ctx.textAlign = "left";
  ctx.fillText("PREDICTED — from the equivalence principle", hudX + 14, hudY + 22);

  ctx.font = "11px ui-monospace, monospace";
  ctx.fillStyle = TEXT_DIM;
  ctx.fillText("Δν / ν  =  g h / c²", hudX + 14, hudY + 42);

  ctx.fillStyle = AMBER;
  ctx.font = "bold 13px ui-monospace, monospace";
  ctx.fillText(
    `         =  ${PREDICTED.toExponential(2)}`,
    hudX + 14,
    hudY + 60,
  );

  ctx.fillStyle = TEXT_DIM;
  ctx.font = "10px ui-monospace, monospace";
  ctx.fillText(
    "9.80665 m/s² × 22.5 m / (3 × 10⁸ m/s)²",
    hudX + 14,
    hudY + 76,
  );

  // separator
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.beginPath();
  ctx.moveTo(hudX + 14, hudY + 92);
  ctx.lineTo(hudX + hudW - 14, hudY + 92);
  ctx.stroke();

  // measured
  ctx.font = "bold 12px ui-monospace, monospace";
  ctx.fillStyle = TEXT_BRIGHT;
  ctx.fillText("MEASURED — Pound & Rebka 1960", hudX + 14, hudY + 110);

  ctx.font = "11px ui-monospace, monospace";
  ctx.fillStyle = GREEN;
  ctx.fillText(
    "(2.57 ± 0.26) × 10⁻¹⁵",
    hudX + 14,
    hudY + 130,
  );

  ctx.fillStyle = TEXT_DIM;
  ctx.font = "10px ui-monospace, monospace";
  ctx.fillText(
    "predicted within 10% — Pound-Snider 1965 → 1%",
    hudX + 14,
    hudY + 146,
  );

  // separator
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.beginPath();
  ctx.moveTo(hudX + 14, hudY + 162);
  ctx.lineTo(hudX + hudW - 14, hudY + 162);
  ctx.stroke();

  // compensating Doppler velocity
  ctx.font = "bold 12px ui-monospace, monospace";
  ctx.fillStyle = TEXT_BRIGHT;
  ctx.fillText("COMPENSATING DOPPLER", hudX + 14, hudY + 180);
  ctx.font = "11px ui-monospace, monospace";
  ctx.fillStyle = CYAN;
  ctx.fillText(
    `v = g h / c  ≈  ${(V_COMP * 1e6).toFixed(2)} μm/s`,
    hudX + 14,
    hudY + 198,
  );
  ctx.restore();

  // ── footer caption ──
  ctx.save();
  ctx.font = "11px ui-monospace, monospace";
  ctx.fillStyle = TEXT_MUTE;
  ctx.textAlign = "center";
  ctx.fillText(
    "First laboratory test of GR · derivable from EP alone · no field equations needed",
    W / 2,
    H - 22,
  );
  ctx.restore();
}
