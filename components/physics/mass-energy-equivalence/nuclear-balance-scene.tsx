"use client";

import { useEffect, useRef } from "react";

/**
 * NuclearBalanceScene — FIG.17c
 *
 * Schematic: an alpha particle (He-4) has 4 nucleons, each ~939 MeV/c².
 * Total bare mass  =  4 × 939   = 3 756 MeV/c²
 * Actual He-4 mass =           3 727.4 MeV/c²  (from AME-2020)
 * Binding energy   =              28.3 MeV  (the "missing" mass)
 *
 * The deficit IS the binding energy that holds the nucleus together.
 * It literally came off the balance when the protons and neutrons bound.
 *
 * Two stylised balance pans:
 *   LEFT  — 4 loose nucleons stacked, total = 3756 MeV/c²
 *   RIGHT — the He-4 nucleus,          total = 3727 MeV/c²
 * The LEFT pan dips lower (heavier). A readout shows the 28 MeV gap.
 *
 * Canvas 2D, dark bg. PascalCase export: NuclearBalanceScene.
 */

const NUCLEON_MASS_MEV = 939; // MeV/c²  (average of proton + neutron)
const HE4_MASS_MEV = 3727.4; // MeV/c²  (AME-2020, rounded)
const BARE_TOTAL_MEV = 4 * NUCLEON_MASS_MEV; // 3756 MeV/c²
const BINDING_MEV = BARE_TOTAL_MEV - HE4_MASS_MEV; // 28.6 MeV

const BG = "#0A0C12";
const PROTON_COLOR = "#67E8F9"; // cyan
const NEUTRON_COLOR = "#A78BFA"; // violet
const SCALE_COLOR = "rgba(255,255,255,0.7)";
const AMBER = "#FFB36B";
const RED_PALE = "#FCA5A5";
const TEXT_DIM = "rgba(255,255,255,0.65)";
const TEXT_BRIGHT = "rgba(255,255,255,0.92)";
const GREEN = "#86EFAC";

export function NuclearBalanceScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
    draw(ctx, W, H);
  }, []);

  return (
    <div className="relative w-full">
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: 380, display: "block" }}
        className="rounded-md border border-white/10 bg-[#0A0C12]"
        aria-label="A balance scale. Left pan holds 4 bare nucleons at 3756 MeV/c². Right pan holds one He-4 nucleus at 3727 MeV/c². The left pan sits lower because of the 28 MeV binding-energy deficit."
      />
    </div>
  );
}

function drawNucleon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  color: string,
  label: string,
) {
  ctx.save();
  const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
  grad.addColorStop(0, color);
  grad.addColorStop(1, "rgba(0,0,0,0.7)");
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 1;
  ctx.stroke();
  if (label) {
    ctx.font = `bold ${Math.round(r * 0.75)}px ui-monospace, monospace`;
    ctx.fillStyle = "rgba(0,0,0,0.85)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, cx, cy);
  }
  ctx.restore();
}

function draw(ctx: CanvasRenderingContext2D, W: number, H: number) {
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  const midX = W / 2;

  // Balance geometry
  const pivotX = midX;
  const pivotY = H * 0.28;
  const beamHalfLen = W * 0.28;

  // Left pan (heavier — bare nucleons) dips down; right pan rises
  const tiltPx = 22; // pixels of vertical tilt
  const leftBeamY = pivotY + tiltPx;
  const rightBeamY = pivotY - tiltPx;

  const panW = 110;
  const panH = 12;
  const stringLen = 40;
  const leftPanX = pivotX - beamHalfLen;
  const rightPanX = pivotX + beamHalfLen;
  const leftPanY = leftBeamY + stringLen;
  const rightPanY = rightBeamY + stringLen;

  // ── SCALE STAND ──
  ctx.save();
  // Vertical pole
  ctx.strokeStyle = SCALE_COLOR;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(pivotX, pivotY);
  ctx.lineTo(pivotX, H * 0.85);
  ctx.stroke();
  // Horizontal base
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(pivotX - 60, H * 0.85);
  ctx.lineTo(pivotX + 60, H * 0.85);
  ctx.stroke();
  // Pivot circle
  ctx.beginPath();
  ctx.arc(pivotX, pivotY, 7, 0, Math.PI * 2);
  ctx.fillStyle = AMBER;
  ctx.fill();
  ctx.restore();

  // ── BEAM ──
  ctx.save();
  ctx.strokeStyle = SCALE_COLOR;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(leftPanX, leftBeamY);
  ctx.lineTo(rightPanX, rightBeamY);
  ctx.stroke();
  ctx.restore();

  // ── STRINGS ──
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 1.5;
  // Left strings
  ctx.beginPath();
  ctx.moveTo(leftPanX - panW / 2 + 8, leftBeamY);
  ctx.lineTo(leftPanX - panW / 2 + 8, leftPanY - panH / 2);
  ctx.moveTo(leftPanX + panW / 2 - 8, leftBeamY);
  ctx.lineTo(leftPanX + panW / 2 - 8, leftPanY - panH / 2);
  ctx.stroke();
  // Right strings
  ctx.beginPath();
  ctx.moveTo(rightPanX - panW / 2 + 8, rightBeamY);
  ctx.lineTo(rightPanX - panW / 2 + 8, rightPanY - panH / 2);
  ctx.moveTo(rightPanX + panW / 2 - 8, rightBeamY);
  ctx.lineTo(rightPanX + panW / 2 - 8, rightPanY - panH / 2);
  ctx.stroke();
  ctx.restore();

  // ── PANS ──
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.strokeStyle = SCALE_COLOR;
  ctx.lineWidth = 2;
  // Left pan
  ctx.beginPath();
  ctx.ellipse(leftPanX, leftPanY, panW / 2, panH / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Right pan
  ctx.beginPath();
  ctx.ellipse(rightPanX, rightPanY, panW / 2, panH / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // ── LEFT PAN: 4 loose nucleons ──
  const r = 18;
  const nucLayout = [
    { cx: leftPanX - 22, cy: leftPanY - r * 2 - 8, color: PROTON_COLOR, label: "p" },
    { cx: leftPanX + 22, cy: leftPanY - r * 2 - 8, color: NEUTRON_COLOR, label: "n" },
    { cx: leftPanX - 22, cy: leftPanY - r * 4 - 14, color: PROTON_COLOR, label: "p" },
    { cx: leftPanX + 22, cy: leftPanY - r * 4 - 14, color: NEUTRON_COLOR, label: "n" },
  ];
  for (const n of nucLayout) {
    drawNucleon(ctx, n.cx, n.cy, r, n.color, n.label);
  }

  // ── RIGHT PAN: He-4 nucleus (compact cluster) ──
  const heR = 16;
  const heCx = rightPanX;
  const heCy = rightPanY - 52;
  const heLayout = [
    { dx: -heR * 0.6, dy: -heR * 0.6, color: PROTON_COLOR, label: "p" },
    { dx: heR * 0.6, dy: -heR * 0.6, color: NEUTRON_COLOR, label: "n" },
    { dx: -heR * 0.6, dy: heR * 0.6, color: PROTON_COLOR, label: "p" },
    { dx: heR * 0.6, dy: heR * 0.6, color: NEUTRON_COLOR, label: "n" },
  ];
  // Binding glow
  ctx.save();
  const glow = ctx.createRadialGradient(heCx, heCy, 0, heCx, heCy, heR * 2.4);
  glow.addColorStop(0, "rgba(134,239,172,0.25)");
  glow.addColorStop(1, "rgba(134,239,172,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(heCx, heCy, heR * 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  for (const n of heLayout) {
    drawNucleon(ctx, heCx + n.dx, heCy + n.dy, heR, n.color, n.label);
  }

  // "He-4" label below right nucleus
  ctx.save();
  ctx.font = "bold 13px ui-monospace, monospace";
  ctx.fillStyle = GREEN;
  ctx.textAlign = "center";
  ctx.fillText("He-4", heCx, heCy + heR * 3);
  ctx.restore();

  // ── PAN MASS LABELS ──
  ctx.save();
  ctx.font = "bold 12px ui-monospace, monospace";
  ctx.textAlign = "center";
  // Left
  ctx.fillStyle = RED_PALE;
  ctx.fillText(`4 × 939 = ${BARE_TOTAL_MEV} MeV/c²`, leftPanX, leftPanY + 28);
  ctx.fillStyle = TEXT_DIM;
  ctx.font = "11px ui-monospace, monospace";
  ctx.fillText("(4 bare nucleons)", leftPanX, leftPanY + 44);
  // Right
  ctx.fillStyle = GREEN;
  ctx.font = "bold 12px ui-monospace, monospace";
  ctx.fillText(`${HE4_MASS_MEV} MeV/c²`, rightPanX, rightPanY + 28);
  ctx.fillStyle = TEXT_DIM;
  ctx.font = "11px ui-monospace, monospace";
  ctx.fillText("(bound He-4)", rightPanX, rightPanY + 44);
  ctx.restore();

  // ── DEFICIT ANNOTATION (centre) ──
  const annY = (leftPanY + rightPanY) / 2 + 70;
  ctx.save();
  ctx.strokeStyle = AMBER;
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(leftPanX, leftPanY + 28);
  ctx.lineTo(midX, annY);
  ctx.moveTo(rightPanX, rightPanY + 28);
  ctx.lineTo(midX, annY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  ctx.save();
  ctx.font = "bold 14px ui-monospace, monospace";
  ctx.fillStyle = AMBER;
  ctx.textAlign = "center";
  ctx.fillText(
    `Δm = ${BINDING_MEV.toFixed(1)} MeV/c² — binding energy`,
    midX,
    annY + 18,
  );
  ctx.font = "11px ui-monospace, monospace";
  ctx.fillStyle = TEXT_DIM;
  ctx.fillText(
    "The mass literally came off the balance when the nucleus formed.",
    midX,
    annY + 36,
  );
  ctx.restore();

  // ── LEGEND ──
  const legY = 18;
  ctx.save();
  ctx.font = "11px ui-monospace, monospace";
  ctx.fillStyle = PROTON_COLOR;
  ctx.textAlign = "left";
  ctx.fillText("p  proton  (938.3 MeV/c²)", 20, legY);
  ctx.fillStyle = NEUTRON_COLOR;
  ctx.fillText("n  neutron  (939.6 MeV/c²)", 20, legY + 16);
  ctx.fillStyle = TEXT_DIM;
  ctx.textAlign = "right";
  ctx.fillText("§04 · mass-energy-equivalence", W - 16, legY);
  ctx.restore();

  // ── TITLE ──
  ctx.save();
  ctx.font = "bold 14px ui-monospace, monospace";
  ctx.fillStyle = TEXT_BRIGHT;
  ctx.textAlign = "center";
  ctx.fillText(
    "The nuclear balance: bound He-4 weighs less than 4 loose nucleons",
    midX,
    H - 16,
  );
  ctx.restore();
}
