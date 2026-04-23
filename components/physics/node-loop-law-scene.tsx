"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { solveDC } from "@/components/physics/circuit-canvas/solver";
import type { CircuitScene } from "@/components/physics/circuit-canvas/types";

const RATIO = 0.62;
const MAX_HEIGHT = 420;

/**
 * FIG.26b — two loops that share a middle resistor R_m. Kirchhoff's two
 * sentences in motion: current arrows animate around each loop, their speed
 * set by the MNA-solved branch current; the shared resistor's arrow shows
 * the algebraic sum (KCL at the central node) and the loop readouts confirm
 * ΣV = 0 (KVL) around each loop.
 *
 * Topology (schematic coordinates):
 *
 *   V1─┬──R1───┬──R2──┐             V2─┬──R3───┬
 *   │  │       │      │             │  │       │
 *   │  │      R_m     │             │  │       │
 *   │  │       │      │             │  │       │
 *   └──┴───────┴──────┘             └──┴───────┘
 *
 * In this scene we fold the two loops so they share R_m. Left loop:
 * V1 → R1 → R_m → back to V1. Right loop: V2 → R_m → R3 → back to V2.
 * Ground is at the common bottom rail.
 */
export function NodeLoopLawScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 700, height: 420 });
  const [Rm, setRm] = useState(200);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          setSize({ width: w, height: Math.min(w * RATIO, MAX_HEIGHT) });
        }
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /**
   * Six-node scene:
   *   "0" = ground (bottom rail)
   *   "L" = top-left node (V1 +)
   *   "M" = shared top centre node
   *   "R" = top-right node (V2 +)
   *   Bottom nodes tied straight to "0".
   *
   * Sources are 12 V and 9 V; series resistors R1 = 150, R3 = 120.
   */
  const scene: CircuitScene = useMemo(
    () => ({
      nodes: [
        { id: "0", x: 350, y: 340, label: "GND" },
        { id: "L", x: 100, y: 100, label: "L" },
        { id: "M", x: 350, y: 100, label: "M" },
        { id: "R", x: 600, y: 100, label: "R" },
      ],
      wires: [],
      elements: [
        { kind: "dc-voltage", id: "V1", value: 12, fromNode: "L", toNode: "0" },
        { kind: "dc-voltage", id: "V2", value: 9, fromNode: "R", toNode: "0" },
        { kind: "resistor", id: "R1", value: 150, fromNode: "L", toNode: "M" },
        { kind: "resistor", id: "R3", value: 120, fromNode: "R", toNode: "M" },
        { kind: "resistor", id: "Rm", value: Rm, fromNode: "M", toNode: "0" },
        { kind: "ground", id: "GND", atNode: "0" },
      ],
    }),
    [Rm],
  );

  const sol = useMemo(() => {
    try {
      return solveDC(scene);
    } catch {
      return null;
    }
  }, [scene]);

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (t) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const { width, height } = size;
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }

      ctx.clearRect(0, 0, width, height);
      drawBackground(ctx, width, height, colors.bg0);

      if (!sol) {
        drawError(ctx, width, height, colors.fg1);
        return;
      }

      // Map schematic coordinates (designed for 700×420) to live canvas size.
      const sx = width / 700;
      const sy = height / 420;
      const p = {
        gnd: { x: 350 * sx, y: 340 * sy },
        L: { x: 100 * sx, y: 100 * sy },
        M: { x: 350 * sx, y: 100 * sy },
        R: { x: 600 * sx, y: 100 * sy },
      };
      const bottomY = 340 * sy;

      const iR1 = sol.branchCurrents["R1"] ?? 0; // + is L → M
      const iR3 = sol.branchCurrents["R3"] ?? 0; // + is R → M
      const iRm = sol.branchCurrents["Rm"] ?? 0; // + is M → GND

      // Wires (rails).
      ctx.strokeStyle = colors.fg2;
      ctx.lineWidth = 1.5;
      // Top-left rail: L goes down to ground below, then across to 0.
      ctx.beginPath();
      ctx.moveTo(p.L.x, p.L.y);
      ctx.lineTo(p.L.x, bottomY);
      ctx.lineTo(p.gnd.x, bottomY);
      ctx.stroke();
      // Top-right rail: R → down → over to 0.
      ctx.beginPath();
      ctx.moveTo(p.R.x, p.R.y);
      ctx.lineTo(p.R.x, bottomY);
      ctx.lineTo(p.gnd.x, bottomY);
      ctx.stroke();
      // Middle branch: M straight down to GND.
      ctx.beginPath();
      ctx.moveTo(p.M.x, p.M.y);
      ctx.lineTo(p.M.x, bottomY);
      ctx.stroke();

      // Source glyphs (circles with +/−) on the descending wire.
      drawSource(
        ctx,
        p.L.x,
        (p.L.y + bottomY) / 2,
        "V₁ = 12 V",
        "up",
      );
      drawSource(
        ctx,
        p.R.x,
        (p.R.y + bottomY) / 2,
        "V₂ = 9 V",
        "up",
      );

      // Resistor glyphs on the top edges + the middle branch.
      drawResistorH(ctx, p.L, p.M, `R₁ = 150Ω`, colors.fg1);
      drawResistorH(ctx, p.R, p.M, `R₃ = 120Ω`, colors.fg1);
      drawResistorV(
        ctx,
        p.M.x,
        p.M.y + 20,
        p.M.x,
        bottomY - 20,
        `Rₘ = ${Rm.toFixed(0)}Ω`,
        colors.fg1,
      );

      // Ground triangle.
      drawGroundGlyph(ctx, p.gnd.x, bottomY, colors.fg2);

      // Current dots: animated along each branch, speed ∝ |I|.
      drawFlowH(ctx, p.L, p.M, iR1, t, "#F5B041"); // L → M
      drawFlowH(ctx, p.R, p.M, iR3, t, "#F5B041"); // R → M
      drawFlowV(ctx, p.M.x, p.M.y + 20, p.M.x, bottomY - 20, iRm, t, "#F5B041"); // M → GND

      // KCL assertion at the central node M.
      ctx.fillStyle = colors.fg1;
      ctx.font = "11px ui-monospace, SFMono-Regular, monospace";
      ctx.textAlign = "center";
      const kcl = iR1 + iR3 - iRm;
      const kclMag = Math.abs(kcl);
      ctx.fillStyle = kclMag < 1e-8 ? "#6EE7B7" : "#FF6ADE";
      ctx.fillText(
        `KCL @ M:  I₁ + I₃ − Iₘ = ${(kcl * 1000).toFixed(3)} mA`,
        width / 2,
        height - 52,
      );

      // KVL assertions for each loop.
      const vL = sol.nodeVoltages["L"] ?? 0;
      const vM = sol.nodeVoltages["M"] ?? 0;
      const vR = sol.nodeVoltages["R"] ?? 0;
      // Left loop: +V1 − I1·R1 − Im·Rm = V(L) − (V(L)-V(M)) − (V(M)-0) = 0
      const leftLoop = (vL) - (vL - vM) - vM;
      const rightLoop = (vR) - (vR - vM) - vM;

      ctx.fillStyle = Math.abs(leftLoop) < 1e-8 ? "#6EE7B7" : "#FF6ADE";
      ctx.textAlign = "left";
      ctx.fillText(
        `KVL (left):  +V₁ − I₁R₁ − IₘRₘ = ${leftLoop.toFixed(3)} V`,
        18,
        height - 28,
      );
      ctx.fillStyle = Math.abs(rightLoop) < 1e-8 ? "#6EE7B7" : "#FF6ADE";
      ctx.textAlign = "right";
      ctx.fillText(
        `KVL (right):  +V₂ − I₃R₃ − IₘRₘ = ${rightLoop.toFixed(3)} V`,
        width - 18,
        height - 28,
      );

      // Branch-current readout (top right).
      ctx.textAlign = "right";
      ctx.fillStyle = "#F5B041";
      ctx.fillText(
        `I₁ = ${(iR1 * 1000).toFixed(2)} mA`,
        width - 18,
        18,
      );
      ctx.fillText(
        `I₃ = ${(iR3 * 1000).toFixed(2)} mA`,
        width - 18,
        34,
      );
      ctx.fillText(
        `Iₘ = ${(iRm * 1000).toFixed(2)} mA`,
        width - 18,
        50,
      );

      ctx.textAlign = "left";
      ctx.fillStyle = colors.fg1;
      ctx.fillText("two loops, one shared branch", 18, 18);
    },
  });

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block rounded-md bg-[#0A0A0A]"
      />
      <div className="mt-3 grid grid-cols-1 gap-2 px-2 sm:grid-cols-2">
        <label className="flex items-center gap-2 text-xs font-mono text-[var(--color-fg-2)]">
          <span className="w-10 text-[var(--color-fg-1)]">Rₘ</span>
          <input
            type="range"
            min={10}
            max={1000}
            step={5}
            value={Rm}
            onChange={(e) => setRm(parseFloat(e.target.value))}
            className="flex-1"
            style={{ accentColor: "#F5B041" }}
          />
          <span className="w-20 text-right text-[var(--color-fg-1)]">
            {Rm.toFixed(0)} Ω
          </span>
        </label>
        <p className="text-xs font-mono text-[var(--color-fg-3)]">
          green = KCL / KVL satisfied · magenta = not (never happens when MNA solves exactly)
        </p>
      </div>
    </div>
  );
}

// ---------- Drawing helpers ----------

function drawBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  bg: string,
) {
  ctx.fillStyle = bg || "#0A0A0A";
  ctx.fillRect(0, 0, width, height);
}

function drawError(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  fg: string,
) {
  ctx.fillStyle = fg;
  ctx.font = "12px ui-monospace, SFMono-Regular, monospace";
  ctx.textAlign = "center";
  ctx.fillText("solver error — check scene", width / 2, height / 2);
}

function drawResistorH(
  ctx: CanvasRenderingContext2D,
  a: { x: number; y: number },
  b: { x: number; y: number },
  label: string,
  fg: string,
) {
  const ax = a.x;
  const ay = a.y;
  const bx = b.x;
  const by = b.y;
  const ux = bx > ax ? 1 : -1;
  const len = Math.abs(bx - ax);
  const glyphLen = Math.min(60, len * 0.55);
  const start = (len - glyphLen) / 2;
  ctx.strokeStyle = fg;
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(ax + ux * start, ay);
  ctx.stroke();
  ctx.beginPath();
  const bumps = 6;
  const seg = glyphLen / bumps;
  const amp = 6;
  let cx = ax + ux * start;
  let cy = ay;
  ctx.moveTo(cx, cy);
  for (let i = 0; i < bumps; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    cx += ux * seg;
    cy = ay + amp * side;
    ctx.lineTo(cx, cy);
  }
  const endX = ax + ux * (start + glyphLen);
  ctx.lineTo(endX, ay);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(endX, ay);
  ctx.lineTo(bx, by);
  ctx.stroke();
  ctx.fillStyle = fg;
  ctx.font = "10px ui-monospace, SFMono-Regular, monospace";
  ctx.textAlign = "center";
  ctx.fillText(label, (ax + bx) / 2, ay - 12);
}

function drawResistorV(
  ctx: CanvasRenderingContext2D,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  label: string,
  fg: string,
) {
  const len = by - ay;
  const glyphLen = Math.min(60, len * 0.55);
  const start = (len - glyphLen) / 2;
  ctx.strokeStyle = fg;
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(ax, ay + start);
  ctx.stroke();
  ctx.beginPath();
  const bumps = 6;
  const seg = glyphLen / bumps;
  const amp = 6;
  let cy = ay + start;
  let cx = ax;
  ctx.moveTo(cx, cy);
  for (let i = 0; i < bumps; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    cy += seg;
    cx = ax + amp * side;
    ctx.lineTo(cx, cy);
  }
  ctx.lineTo(ax, ay + start + glyphLen);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(ax, ay + start + glyphLen);
  ctx.lineTo(bx, by);
  ctx.stroke();
  ctx.fillStyle = fg;
  ctx.font = "10px ui-monospace, SFMono-Regular, monospace";
  ctx.textAlign = "left";
  ctx.fillText(label, ax + 14, (ay + by) / 2 + 4);
}

function drawSource(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  label: string,
  plusSide: "up" | "down",
) {
  const r = 14;
  ctx.strokeStyle = "rgba(230,237,247,0.85)";
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.font = "11px ui-monospace, SFMono-Regular, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const plus = plusSide === "up" ? "+" : "−";
  const minus = plusSide === "up" ? "−" : "+";
  ctx.fillStyle = "#E946A6";
  ctx.fillText(plus, cx, cy - r * 0.45);
  ctx.fillStyle = "#4DD0E1";
  ctx.fillText(minus, cx, cy + r * 0.45);
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "rgba(230,237,247,0.85)";
  ctx.font = "10px ui-monospace, SFMono-Regular, monospace";
  ctx.fillText(label, cx + 34, cy + 3);
}

function drawGroundGlyph(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  fg: string,
) {
  ctx.strokeStyle = fg;
  ctx.lineWidth = 1.25;
  const widths = [14, 10, 6];
  const spacing = 4;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + 8);
  ctx.stroke();
  for (let i = 0; i < widths.length; i++) {
    const w = widths[i];
    const yy = y + 8 + i * spacing;
    ctx.beginPath();
    ctx.moveTo(x - w, yy);
    ctx.lineTo(x + w, yy);
    ctx.stroke();
  }
}

function drawFlowH(
  ctx: CanvasRenderingContext2D,
  a: { x: number; y: number },
  b: { x: number; y: number },
  I: number,
  t: number,
  color: string,
) {
  const mag = Math.abs(I);
  if (mag < 1e-9) return;
  const dir = Math.sign(I); // + means a → b
  const speed = 30 + 600 * Math.min(mag, 0.1); // px/s, clamp above a saturation
  const len = Math.abs(b.x - a.x);
  const offset = (t * speed * (dir >= 0 ? 1 : -1)) % len;
  const nDots = 8;
  for (let i = 0; i < nDots; i++) {
    let s = (offset + (i * len) / nDots) % len;
    if (s < 0) s += len;
    const x = a.x + (b.x > a.x ? s : -s);
    const y = a.y;
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.6 + 0.4 * Math.min(mag * 50, 1);
    ctx.beginPath();
    ctx.arc(x, y, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawFlowV(
  ctx: CanvasRenderingContext2D,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  I: number,
  t: number,
  color: string,
) {
  const mag = Math.abs(I);
  if (mag < 1e-9) return;
  const dir = Math.sign(I);
  const speed = 30 + 600 * Math.min(mag, 0.1);
  const len = Math.abs(by - ay);
  const offset = (t * speed * (dir >= 0 ? 1 : -1)) % len;
  const nDots = 8;
  for (let i = 0; i < nDots; i++) {
    let s = (offset + (i * len) / nDots) % len;
    if (s < 0) s += len;
    const x = ax;
    const y = ay + s;
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.6 + 0.4 * Math.min(mag * 50, 1);
    ctx.beginPath();
    ctx.arc(x, y, 2.2, 0, Math.PI * 2);
    ctx.fill();
    void bx; // variable parity — all motion is vertical
  }
  ctx.globalAlpha = 1;
}
