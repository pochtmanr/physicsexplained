"use client";

import { useEffect, useRef, useState } from "react";
import {
  h00FromPotential,
  weakFieldG00,
  newtonianPotential,
} from "@/lib/physics/relativity/newtonian-limit";
import { G_SI, SPEED_OF_LIGHT } from "@/lib/physics/constants";

/**
 * WEAK-FIELD EXPANSION SCENE — §08 THE NEWTONIAN LIMIT
 *
 * Slider: ε = Φ/c² (dimensionless strain). At ε = 0 the metric is flat η.
 * At small ε the perturbation h_{00} = −2ε is tiny. At ε → 1 the linear
 * approximation formally breaks and the metric becomes degenerate.
 *
 * The canvas shows:
 *   - A 4×4 metric matrix with g_{00} highlighted in amber (the perturbed
 *     component) and the spatial diagonal in cyan (unchanged at this order).
 *   - A "physical scale" gauge mapping ε to familiar objects.
 *   - Numeric readout of h_{00} and g_{00}.
 */

const W = 540;
const H = 340;
const BG = "#0f172a";

// Reference potentials Φ/c² for physical anchors
const ANCHORS = [
  { label: "Earth surface", eps: 6.25e7 / (SPEED_OF_LIGHT * SPEED_OF_LIGHT) },
  { label: "Solar surface", eps: 1.905e11 / (SPEED_OF_LIGHT * SPEED_OF_LIGHT) },
  { label: "Neutron star", eps: 0.15 },
  { label: "Black hole horizon (formal)", eps: 0.5 },
];

function drawMatrix(
  ctx: CanvasRenderingContext2D,
  g00: number,
  cx: number,
  cy: number,
  cellSize: number,
  eps: number,
) {
  const labels = ["0", "1", "2", "3"];
  const off = cellSize * 2.6;

  // Row and column index labels
  ctx.fillStyle = "rgba(148,163,184,0.6)";
  ctx.font = "11px monospace";
  for (let i = 0; i < 4; i++) {
    ctx.fillText(labels[i], cx + i * cellSize - off + cellSize / 2 - 4, cy - off - 8);
    ctx.fillText(labels[i], cx - off - 18, cy + i * cellSize - off + cellSize / 2 + 4);
  }

  // Matrix bracket lines
  ctx.strokeStyle = "rgba(148,163,184,0.4)";
  ctx.lineWidth = 1.5;
  const x0 = cx - off;
  const y0 = cy - off;
  const totalSide = cellSize * 4;
  // Left bracket
  ctx.beginPath();
  ctx.moveTo(x0 - 6, y0);
  ctx.lineTo(x0 - 14, y0);
  ctx.lineTo(x0 - 14, y0 + totalSide);
  ctx.lineTo(x0 - 6, y0 + totalSide);
  ctx.stroke();
  // Right bracket
  ctx.beginPath();
  ctx.moveTo(x0 + totalSide + 6, y0);
  ctx.lineTo(x0 + totalSide + 14, y0);
  ctx.lineTo(x0 + totalSide + 14, y0 + totalSide);
  ctx.lineTo(x0 + totalSide + 6, y0 + totalSide);
  ctx.stroke();

  // Draw cells
  for (let mu = 0; mu < 4; mu++) {
    for (let nu = 0; nu < 4; nu++) {
      const px = cx + nu * cellSize - off;
      const py = cy + mu * cellSize - off;

      let value: string;
      let cellColor: string;

      if (mu === 0 && nu === 0) {
        // g_{00} = 1 - 2ε — highlighted
        value = g00.toFixed(6);
        const intensity = Math.min(1, eps / 0.5);
        cellColor = `rgba(251,146,60,${0.08 + intensity * 0.25})`;
        ctx.strokeStyle = `rgba(251,146,60,${0.3 + intensity * 0.5})`;
      } else if (mu === nu) {
        // spatial diagonal: −1
        value = "−1";
        cellColor = "rgba(103,232,249,0.05)";
        ctx.strokeStyle = "rgba(103,232,249,0.2)";
      } else {
        // off-diagonal: 0
        value = "0";
        cellColor = "rgba(255,255,255,0.02)";
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
      }

      // Cell background
      ctx.fillStyle = cellColor;
      ctx.fillRect(px, py, cellSize - 2, cellSize - 2);
      ctx.lineWidth = 0.8;
      ctx.strokeRect(px, py, cellSize - 2, cellSize - 2);

      // Cell text
      ctx.fillStyle =
        mu === 0 && nu === 0
          ? "#fb923c"
          : mu === nu
          ? "#67e8f9"
          : "rgba(148,163,184,0.4)";
      ctx.font = mu === 0 && nu === 0 ? "bold 10px monospace" : "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText(value, px + (cellSize - 2) / 2, py + (cellSize - 2) / 2 + 4);
    }
  }
  ctx.textAlign = "left";
}

export function WeakFieldExpansionScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // ε = |Φ|/c²  (slider covers 0 to 0.5 in log-ish fashion)
  const [eps, setEps] = useState(1e-9); // start near Earth surface

  const Phi = -eps * SPEED_OF_LIGHT * SPEED_OF_LIGHT;
  const h00 = h00FromPotential(Phi);
  const g00 = weakFieldG00(Phi);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);

    // Title
    ctx.fillStyle = "rgba(148,163,184,0.85)";
    ctx.font = "bold 12px monospace";
    ctx.fillText("METRIC IN THE WEAK-FIELD LIMIT", 16, 22);

    // Matrix label
    ctx.fillStyle = "rgba(148,163,184,0.55)";
    ctx.font = "11px monospace";
    ctx.fillText("g_{μν} = η_{μν} + h_{μν}", 16, 42);

    // Draw the 4×4 matrix
    const CELL = 56;
    drawMatrix(ctx, g00, 220, 190, CELL, eps);

    // ─── Right panel: readout + scale gauge ───────────────────────────────────
    const rx = 340;

    ctx.fillStyle = "rgba(251,146,60,0.9)";
    ctx.font = "bold 11px monospace";
    ctx.fillText("h_{00} = −2Φ/c²", rx, 80);

    ctx.fillStyle = "rgba(251,146,60,0.75)";
    ctx.font = "12px monospace";
    const h00Str = Math.abs(h00) < 1e-3 ? h00.toExponential(3) : h00.toFixed(6);
    ctx.fillText(`= ${h00Str}`, rx, 100);

    ctx.fillStyle = "rgba(103,232,249,0.9)";
    ctx.font = "bold 11px monospace";
    ctx.fillText("g_{00} = 1 + h_{00}", rx, 126);

    ctx.fillStyle = "rgba(103,232,249,0.75)";
    ctx.font = "12px monospace";
    ctx.fillText(`= ${g00.toFixed(9)}`, rx, 146);

    // ε label
    ctx.fillStyle = "rgba(163,230,53,0.9)";
    ctx.font = "bold 11px monospace";
    const epsStr = eps < 1e-3 ? eps.toExponential(2) : eps.toFixed(4);
    ctx.fillText(`ε = |Φ|/c² = ${epsStr}`, rx, 175);

    // Regime label
    ctx.fillStyle = "rgba(148,163,184,0.5)";
    ctx.font = "10px monospace";
    if (eps < 1e-5) {
      ctx.fillText("Regime: Weak field — GPS correction", rx, 195);
      ctx.fillText("Linear approx. excellent", rx, 209);
    } else if (eps < 0.01) {
      ctx.fillText("Regime: Solar/stellar fields", rx, 195);
      ctx.fillText("Linear approx. good", rx, 209);
    } else if (eps < 0.3) {
      ctx.fillText("Regime: Neutron star / strong field", rx, 195);
      ctx.fillText("Higher-order terms matter", rx, 209);
    } else {
      ctx.fillStyle = "rgba(239,68,68,0.75)";
      ctx.fillText("Regime: Near horizon — linear", rx, 195);
      ctx.fillText("approx. BREAKS DOWN", rx, 209);
    }

    // Warning stripe at ε ≥ 0.4
    if (eps >= 0.4) {
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
      ctx.fillStyle = "rgba(239,68,68,0.8)";
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "center";
      ctx.fillText("⚠  h_{μν} ≫ 1  — linearisation invalid", W / 2, H - 16);
      ctx.textAlign = "left";
    }

    // Physical anchor dots on a tiny scale bar at the bottom-left
    const barX = 16;
    const barY = H - 30;
    const barW = 180;
    ctx.fillStyle = "rgba(148,163,184,0.3)";
    ctx.fillRect(barX, barY, barW, 3);
    ANCHORS.forEach(({ label, eps: ae }) => {
      const xPos = barX + Math.min(ae / 0.5, 1) * barW;
      ctx.fillStyle = "#a3e635";
      ctx.fillRect(xPos - 1, barY - 4, 2, 11);
      ctx.fillStyle = "rgba(163,230,53,0.7)";
      ctx.font = "9px monospace";
      // stagger labels
      const yOff = label.startsWith("E") ? -8 : label.startsWith("S") ? 16 : label.startsWith("N") ? -8 : 16;
      ctx.fillText(label, xPos + 2, barY + yOff);
    });

    // Current position marker on bar
    const markerX = barX + Math.min(eps / 0.5, 1) * barW;
    ctx.fillStyle = "#fb923c";
    ctx.beginPath();
    ctx.arc(markerX, barY + 1.5, 5, 0, Math.PI * 2);
    ctx.fill();

  }, [eps, g00, h00]);

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="max-w-full rounded-lg border border-white/10"
        style={{ background: BG }}
      />
      <div className="flex w-full max-w-[540px] flex-col gap-2 font-mono text-xs text-white/70">
        <div className="flex items-center gap-3">
          <label htmlFor="eps-slider" className="w-28 shrink-0 text-right">
            ε = |Φ|/c²
          </label>
          <input
            id="eps-slider"
            type="range"
            min={0}
            max={0.5}
            step={0.001}
            value={eps}
            onChange={(e) => setEps(parseFloat(e.target.value))}
            className="flex-1"
          />
          <span className="w-20 text-right">
            {eps < 1e-3 ? eps.toExponential(2) : eps.toFixed(3)}
          </span>
        </div>
        <p className="text-white/40">
          At ε = 0: flat spacetime, g = η. At small ε: h_{"{00}"} = −2ε, g_{"{00}"} ≈ 1 − 2ε. At ε → ½: the linear approximation breaks.
        </p>
      </div>
    </div>
  );
}
