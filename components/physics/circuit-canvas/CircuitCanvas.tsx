"use client";
import { useEffect, useRef, useState } from "react";
import type {
  CircuitScene,
  CircuitNode,
  CircuitElement,
  Passive,
  Source,
  Wire,
  SolutionSnapshot,
  AnalysisMode,
  RightHandRuleBadge,
} from "./types";
import { solveDC, solveTransient, solveACPhasor } from "./solver";

export interface CircuitCanvasProps {
  scene: CircuitScene;
  mode: AnalysisMode;
  /** Angular frequency (rad/s) for AC mode; ignored otherwise. */
  omega?: number;
  /** Transient total time (seconds) and step. */
  totalTime?: number;
  dt?: number;
  /** Optional overlay badge. */
  rightHandRule?: RightHandRuleBadge;
  /** Palette override — falls back to the EM branch palette. */
  palette?: {
    bg?: string; // default "#0A0A0A"
    wire?: string; // default "rgba(255,255,255,0.85)"
    voltagePositive?: string; // magenta
    voltageNegative?: string; // cyan
    current?: string; // amber
    inducedCurrent?: string; // green-cyan
  };
  /** HUD: which solution keys to display as live numeric readouts. */
  hudKeys?: Array<{ label: string; kind: "voltage" | "current"; id: string }>;
  className?: string;
  /** Canvas pixel dimensions. */
  width?: number;
  height?: number;
}

const DEFAULT_PALETTE = {
  bg: "#0A0A0A",
  wire: "rgba(255,255,255,0.85)",
  voltagePositive: "#E946A6", // magenta
  voltageNegative: "#4DD0E1", // cyan
  current: "#F5B041", // amber
  inducedCurrent: "#6EE7B7", // green-cyan
};

export function CircuitCanvas({
  scene,
  mode,
  omega = 0,
  totalTime = 1e-2,
  dt = 1e-5,
  rightHandRule,
  palette,
  hudKeys,
  className,
  width = 640,
  height = 420,
}: CircuitCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [solution, setSolution] = useState<SolutionSnapshot | null>(null);
  const pal = { ...DEFAULT_PALETTE, ...(palette ?? {}) };

  // DC + AC: solve once.
  useEffect(() => {
    try {
      if (mode === "dc") setSolution(solveDC(scene));
      else if (mode === "ac-phasor") setSolution(solveACPhasor(scene, omega));
    } catch (e) {
      // Solver threw — leave solution null; the draw loop handles the nullcase.
      // eslint-disable-next-line no-console
      console.error("CircuitCanvas solver error:", e);
      setSolution(null);
    }
    // transient renders per-step via rAF below
  }, [scene, mode, omega]);

  // Transient: animate through each solved step.
  useEffect(() => {
    if (mode !== "transient") return;
    let steps: SolutionSnapshot[];
    try {
      steps = solveTransient(scene, totalTime, dt);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("CircuitCanvas transient error:", e);
      return;
    }
    let frame = 0;
    let rafId = 0;
    const draw = () => {
      const snap = steps[Math.min(frame, steps.length - 1)];
      setSolution(snap);
      frame++;
      if (frame < steps.length) rafId = requestAnimationFrame(draw);
    };
    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [scene, mode, totalTime, dt]);

  // Draw loop.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear.
    ctx.fillStyle = pal.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawScene(ctx, scene, solution, pal);
    if (rightHandRule) drawRightHandBadge(ctx, canvas, rightHandRule, pal);
    if (hudKeys && solution) drawHud(ctx, canvas, hudKeys, solution, pal);
  }, [solution, palette, rightHandRule, hudKeys, scene, pal]);

  return (
    <div className={className} data-circuit-canvas>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="w-full rounded-md"
        style={{ background: pal.bg }}
      />
    </div>
  );
}

// ---------- Drawing helpers ----------

type Palette = typeof DEFAULT_PALETTE;

function nodeById(scene: CircuitScene, id: string): CircuitNode | undefined {
  return scene.nodes.find((n) => n.id === id);
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  scene: CircuitScene,
  sol: SolutionSnapshot | null,
  pal: Palette,
) {
  ctx.save();

  // Wires first so they sit under glyphs.
  for (const wire of scene.wires) drawWire(ctx, scene, wire, pal);

  // Elements.
  for (const el of scene.elements) drawElement(ctx, scene, el, pal);

  // Node dots + labels.
  ctx.fillStyle = pal.wire;
  ctx.font = "10px ui-monospace, SFMono-Regular, monospace";
  for (const n of scene.nodes) {
    ctx.beginPath();
    ctx.arc(n.x, n.y, 3, 0, Math.PI * 2);
    ctx.fill();
    if (n.label) {
      ctx.fillText(n.label, n.x + 6, n.y - 6);
    }
  }

  ctx.restore();
}

function drawWire(
  ctx: CanvasRenderingContext2D,
  scene: CircuitScene,
  wire: Wire,
  pal: Palette,
) {
  const from = nodeById(scene, wire.fromNode);
  const to = nodeById(scene, wire.toNode);
  if (!from || !to) return;
  ctx.strokeStyle = pal.wire;
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  if (wire.via) {
    for (const p of wire.via) ctx.lineTo(p.x, p.y);
  }
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
}

function drawElement(
  ctx: CanvasRenderingContext2D,
  scene: CircuitScene,
  el: CircuitElement,
  pal: Palette,
) {
  switch (el.kind) {
    case "resistor":
      drawResistor(ctx, scene, el, pal);
      break;
    case "capacitor":
      drawCapacitor(ctx, scene, el, pal);
      break;
    case "inductor":
      drawInductor(ctx, scene, el, pal);
      break;
    case "dc-voltage":
    case "dc-current":
    case "ac-voltage":
    case "ac-current":
      drawSource(ctx, scene, el, pal);
      break;
    case "ground":
      drawGround(ctx, scene, el.atNode, pal);
      break;
    case "switch":
      drawSwitch(ctx, scene, el, pal);
      break;
    default:
      // Meters, transformers, transmission-lines: not drawn by primitive.
      // Topic agents that need them provide their own overlay.
      break;
  }
}

/** Helper: returns endpoints + direction unit vector + perpendicular for a 2-node glyph. */
function endpoints(
  scene: CircuitScene,
  fromId: string,
  toId: string,
): null | {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  ux: number;
  uy: number;
  px: number;
  py: number;
  len: number;
  mx: number;
  my: number;
} {
  const a = nodeById(scene, fromId);
  const b = nodeById(scene, toId);
  if (!a || !b) return null;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  if (len < 1e-6) return null;
  const ux = dx / len;
  const uy = dy / len;
  // Perpendicular (rotate 90°).
  const px = -uy;
  const py = ux;
  return {
    x1: a.x,
    y1: a.y,
    x2: b.x,
    y2: b.y,
    ux,
    uy,
    px,
    py,
    len,
    mx: (a.x + b.x) / 2,
    my: (a.y + b.y) / 2,
  };
}

function drawResistor(
  ctx: CanvasRenderingContext2D,
  scene: CircuitScene,
  el: Passive,
  pal: Palette,
) {
  const ep = endpoints(scene, el.fromNode, el.toNode);
  if (!ep) return;
  const { x1, y1, x2, y2, ux, uy, px, py, len } = ep;
  const glyphLen = Math.min(60, len * 0.6);
  const start = (len - glyphLen) / 2;
  // Lead-in line.
  ctx.strokeStyle = pal.wire;
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 + ux * start, y1 + uy * start);
  ctx.stroke();
  // Zigzag: 6 segments alternating perpendicular offsets.
  const bumps = 6;
  const seg = glyphLen / bumps;
  const amp = 6;
  ctx.beginPath();
  let cx = x1 + ux * start;
  let cy = y1 + uy * start;
  ctx.moveTo(cx, cy);
  for (let i = 0; i < bumps; i++) {
    const side = i % 2 === 0 ? 1 : -1;
    cx += ux * seg;
    cy += uy * seg;
    const bx = cx + px * amp * side;
    const by = cy + py * amp * side;
    ctx.lineTo(bx, by);
  }
  // Close to axis at the end.
  const endX = x1 + ux * (start + glyphLen);
  const endY = y1 + uy * (start + glyphLen);
  ctx.lineTo(endX, endY);
  ctx.stroke();
  // Lead-out.
  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  // Label.
  labelAtMid(ctx, ep.mx, ep.my, `${el.id}=${fmtOhms(el.value)}`, pal);
}

function drawCapacitor(
  ctx: CanvasRenderingContext2D,
  scene: CircuitScene,
  el: Passive,
  pal: Palette,
) {
  const ep = endpoints(scene, el.fromNode, el.toNode);
  if (!ep) return;
  const { x1, y1, x2, y2, ux, uy, px, py, len, mx, my } = ep;
  const gap = 8;
  const plateHalf = 12;
  // Lead-in + lead-out up to the plates.
  const p1x = mx - ux * (gap / 2);
  const p1y = my - uy * (gap / 2);
  const p2x = mx + ux * (gap / 2);
  const p2y = my + uy * (gap / 2);
  ctx.strokeStyle = pal.wire;
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(p1x, p1y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(p2x, p2y);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  // Two plates (perpendicular line segments).
  ctx.lineWidth = 1.75;
  ctx.beginPath();
  ctx.moveTo(p1x + px * plateHalf, p1y + py * plateHalf);
  ctx.lineTo(p1x - px * plateHalf, p1y - py * plateHalf);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(p2x + px * plateHalf, p2y + py * plateHalf);
  ctx.lineTo(p2x - px * plateHalf, p2y - py * plateHalf);
  ctx.stroke();
  labelAtMid(ctx, mx + px * 18, my + py * 18, `${el.id}=${fmtFarads(el.value)}`, pal);
  // Silence "len unused" warning — used implicitly via mx/my.
  void len;
}

function drawInductor(
  ctx: CanvasRenderingContext2D,
  scene: CircuitScene,
  el: Passive,
  pal: Palette,
) {
  const ep = endpoints(scene, el.fromNode, el.toNode);
  if (!ep) return;
  const { x1, y1, x2, y2, ux, uy, len, mx, my } = ep;
  const glyphLen = Math.min(60, len * 0.6);
  const start = (len - glyphLen) / 2;
  const loops = 4;
  const loopLen = glyphLen / loops;
  const radius = loopLen / 2;
  ctx.strokeStyle = pal.wire;
  ctx.lineWidth = 1.25;
  // Lead-in.
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 + ux * start, y1 + uy * start);
  ctx.stroke();
  // Loops: 4 semicircles all bulging to one side (perpendicular direction).
  const baseAngle = Math.atan2(uy, ux);
  for (let i = 0; i < loops; i++) {
    const cx = x1 + ux * (start + loopLen * i + radius);
    const cy = y1 + uy * (start + loopLen * i + radius);
    ctx.beginPath();
    // Arc from angle (baseAngle + π) to (baseAngle + 2π) bulging "above" (perpendicular).
    // Easier: use bezier via two control points.
    ctx.arc(cx, cy, radius, baseAngle + Math.PI, baseAngle, false);
    ctx.stroke();
  }
  // Lead-out.
  ctx.beginPath();
  ctx.moveTo(x1 + ux * (start + glyphLen), y1 + uy * (start + glyphLen));
  ctx.lineTo(x2, y2);
  ctx.stroke();
  labelAtMid(ctx, mx, my + 18, `${el.id}=${fmtHenries(el.value)}`, pal);
}

function drawSource(
  ctx: CanvasRenderingContext2D,
  scene: CircuitScene,
  el: Source,
  pal: Palette,
) {
  const ep = endpoints(scene, el.fromNode, el.toNode);
  if (!ep) return;
  const { x1, y1, x2, y2, ux, uy, len, mx, my } = ep;
  const r = 14;
  // Lead-in / lead-out.
  ctx.strokeStyle = pal.wire;
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(mx - ux * r, my - uy * r);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(mx + ux * r, my + uy * r);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  // Circle.
  ctx.beginPath();
  ctx.arc(mx, my, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = pal.wire;
  ctx.font = "11px ui-monospace, SFMono-Regular, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (el.kind === "dc-voltage" || el.kind === "dc-current") {
    // + on the fromNode side, − on toNode side.
    const plusX = mx - ux * (r * 0.45);
    const plusY = my - uy * (r * 0.45);
    const minusX = mx + ux * (r * 0.45);
    const minusY = my + uy * (r * 0.45);
    ctx.fillStyle = pal.voltagePositive;
    ctx.fillText("+", plusX, plusY);
    ctx.fillStyle = pal.voltageNegative;
    ctx.fillText("−", minusX, minusY);
  } else {
    // AC: sine glyph.
    ctx.strokeStyle = pal.wire;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    const steps = 18;
    for (let i = 0; i <= steps; i++) {
      const f = i / steps;
      const tx = mx + (f - 0.5) * r * 1.5 * ux;
      const ty = my + (f - 0.5) * r * 1.5 * uy;
      const offset = Math.sin(f * Math.PI * 2) * r * 0.4;
      const dx2 = tx + -uy * offset;
      const dy2 = ty + ux * offset;
      if (i === 0) ctx.moveTo(dx2, dy2);
      else ctx.lineTo(dx2, dy2);
    }
    ctx.stroke();
  }
  ctx.textAlign = "start";
  ctx.textBaseline = "alphabetic";
  // Label outside the circle.
  ctx.fillStyle = pal.wire;
  ctx.fillText(
    `${el.id}=${fmtSource(el)}`,
    mx + -uy * (r + 12),
    my + ux * (r + 12),
  );
  void len;
}

function drawGround(
  ctx: CanvasRenderingContext2D,
  scene: CircuitScene,
  atNodeId: string,
  pal: Palette,
) {
  const n = nodeById(scene, atNodeId);
  if (!n) return;
  // Three descending horizontal lines below the node.
  ctx.strokeStyle = pal.wire;
  ctx.lineWidth = 1.25;
  const widths = [14, 10, 6];
  const spacing = 4;
  // Short vertical stub.
  ctx.beginPath();
  ctx.moveTo(n.x, n.y);
  ctx.lineTo(n.x, n.y + 8);
  ctx.stroke();
  for (let i = 0; i < widths.length; i++) {
    const w = widths[i];
    const y = n.y + 8 + i * spacing;
    ctx.beginPath();
    ctx.moveTo(n.x - w, y);
    ctx.lineTo(n.x + w, y);
    ctx.stroke();
  }
}

function drawSwitch(
  ctx: CanvasRenderingContext2D,
  scene: CircuitScene,
  el: { closed: boolean; fromNode: string; toNode: string; id: string },
  pal: Palette,
) {
  const ep = endpoints(scene, el.fromNode, el.toNode);
  if (!ep) return;
  const { x1, y1, x2, y2, ux, uy, len, mx, my } = ep;
  const gap = 20;
  const p1x = mx - ux * (gap / 2);
  const p1y = my - uy * (gap / 2);
  const p2x = mx + ux * (gap / 2);
  const p2y = my + uy * (gap / 2);
  ctx.strokeStyle = pal.wire;
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(p1x, p1y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(p2x, p2y);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  // Terminal dots.
  ctx.fillStyle = pal.wire;
  ctx.beginPath();
  ctx.arc(p1x, p1y, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(p2x, p2y, 2, 0, Math.PI * 2);
  ctx.fill();
  // Arm: closed → along axis; open → rotated 30°.
  ctx.beginPath();
  if (el.closed) {
    ctx.moveTo(p1x, p1y);
    ctx.lineTo(p2x, p2y);
  } else {
    // Rotate the arm endpoint 30° off-axis.
    const angle = Math.PI / 6;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const armLen = Math.hypot(p2x - p1x, p2y - p1y);
    const rx = ux * cos - uy * sin;
    const ry = ux * sin + uy * cos;
    ctx.moveTo(p1x, p1y);
    ctx.lineTo(p1x + rx * armLen, p1y + ry * armLen);
  }
  ctx.stroke();
  labelAtMid(ctx, mx, my - 14, `${el.id}:${el.closed ? "on" : "off"}`, pal);
  void len;
}

function drawRightHandBadge(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  cfg: RightHandRuleBadge,
  pal: Palette,
) {
  const pos = cfg.position ?? "bottom-right";
  const size = 54;
  const pad = 12;
  let ox = 0;
  let oy = 0;
  if (pos === "top-left") {
    ox = pad;
    oy = pad;
  } else if (pos === "top-right") {
    ox = canvas.width - size - pad;
    oy = pad;
  } else if (pos === "bottom-left") {
    ox = pad;
    oy = canvas.height - size - pad;
  } else {
    ox = canvas.width - size - pad;
    oy = canvas.height - size - pad;
  }
  ctx.save();
  ctx.translate(ox + size / 2, oy + size / 2);
  ctx.strokeStyle = pal.wire;
  ctx.fillStyle = pal.wire;
  ctx.lineWidth = 1.25;
  // 3 axes.
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(18, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -18);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-12, 10);
  ctx.stroke();
  // Curl arrow.
  ctx.strokeStyle = pal.current;
  ctx.beginPath();
  ctx.arc(0, 0, 10, -Math.PI / 2, Math.PI, false);
  ctx.stroke();
  // Axis letters.
  ctx.font = "9px ui-monospace, SFMono-Regular, monospace";
  ctx.fillStyle = pal.wire;
  ctx.fillText("x", 20, 3);
  ctx.fillText("y", 2, -20);
  ctx.fillText("z", -18, 12);
  ctx.restore();
}

function drawHud(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  keys: Array<{ label: string; kind: "voltage" | "current"; id: string }>,
  sol: SolutionSnapshot,
  pal: Palette,
) {
  ctx.save();
  ctx.font = "11px ui-monospace, SFMono-Regular, monospace";
  ctx.textBaseline = "top";
  const pad = 10;
  const lineH = 14;
  let x = canvas.width - 170;
  let y = pad;
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(x - 6, y - 4, 170 - pad, lineH * keys.length + 8);
  ctx.fillStyle = pal.wire;
  for (const k of keys) {
    const v =
      k.kind === "voltage" ? sol.nodeVoltages[k.id] : sol.branchCurrents[k.id];
    const text = `${k.label.padEnd(8)} ${fmtSci(v)}`;
    ctx.fillStyle = k.kind === "voltage" ? pal.voltagePositive : pal.current;
    ctx.fillText(text, x, y);
    y += lineH;
  }
  ctx.restore();
}

// ---------- Formatting helpers ----------

function labelAtMid(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  pal: Palette,
) {
  ctx.save();
  ctx.font = "10px ui-monospace, SFMono-Regular, monospace";
  ctx.fillStyle = pal.wire;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
  ctx.restore();
}

function fmtOhms(v: number): string {
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}MΩ`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}kΩ`;
  return `${v.toFixed(0)}Ω`;
}
function fmtFarads(v: number): string {
  if (v >= 1e-3) return `${(v * 1e3).toFixed(1)}mF`;
  if (v >= 1e-6) return `${(v * 1e6).toFixed(1)}µF`;
  if (v >= 1e-9) return `${(v * 1e9).toFixed(1)}nF`;
  return `${(v * 1e12).toFixed(1)}pF`;
}
function fmtHenries(v: number): string {
  if (v >= 1) return `${v.toFixed(2)}H`;
  if (v >= 1e-3) return `${(v * 1e3).toFixed(1)}mH`;
  return `${(v * 1e6).toFixed(1)}µH`;
}
function fmtSource(el: Source): string {
  if (el.kind === "dc-voltage") return `${el.value}V`;
  if (el.kind === "dc-current") return `${el.value}A`;
  if (el.kind === "ac-voltage") return `${el.value}V~`;
  return `${el.value}A~`;
}
function fmtSci(v: number | undefined): string {
  if (v === undefined || !Number.isFinite(v)) return "—";
  const abs = Math.abs(v);
  if (abs === 0) return "0";
  if (abs >= 1e3 || abs < 1e-3) return v.toExponential(2);
  return v.toFixed(3);
}
