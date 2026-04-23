"use client";

import { useEffect, useRef, useState } from "react";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import {
  stressTensorMatrix,
} from "@/lib/physics/electromagnetism/maxwell-stress";

const RATIO = 0.62;
const MAX_HEIGHT = 400;

/**
 * FIG.37a — a cube rendered in isometric projection. The user tilts a
 * uniform E-field direction with a slider; the stress-tensor component
 * T_ij on each visible face is rendered as arrows:
 *   • diagonal T_ii → normal stress (outward = tension, inward = pressure)
 *   • off-diagonal T_ij → shear, drawn tangent to the face along ĵ
 *
 * The key visual: a field line running through the cube pulls the end
 * faces (tension) and pushes the side faces (pressure). Faraday's original
 * mechanical intuition, made literal.
 */
export function StressTensorFacesScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 640, height: 400 });
  // E-field direction in radians (rotation about z of a magnitude-1000 V/m vector)
  const [phi, setPhi] = useState(0);

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

  useEffect(() => {
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

    // ─── Field setup ───
    const E_MAG = 1000; // V/m
    const E = {
      x: E_MAG * Math.cos(phi),
      y: E_MAG * Math.sin(phi),
      z: 0,
    };
    const B = { x: 0, y: 0, z: 0 };
    const T = stressTensorMatrix(E, B); // row-major 3×3

    // ─── Isometric cube projection ───
    // Use a simple axonometric: x → (cos30, −sin30·0.5), y → (0, −1), z → (−cos30, −sin30·0.5)
    // Centre of cube on canvas:
    const cx = width / 2;
    const cy = height / 2 + 10;
    const S = Math.min(width, height) * 0.18; // cube half-side in pixels

    const project = (x: number, y: number, z: number) => ({
      px: cx + x * S * Math.cos(Math.PI / 6) - z * S * Math.cos(Math.PI / 6),
      py:
        cy -
        y * S +
        x * S * Math.sin(Math.PI / 6) * 0.5 +
        z * S * Math.sin(Math.PI / 6) * 0.5,
    });

    // Cube corners at x,y,z ∈ {-1, +1}
    const corners = [
      [-1, -1, -1], [+1, -1, -1], [+1, +1, -1], [-1, +1, -1],
      [-1, -1, +1], [+1, -1, +1], [+1, +1, +1], [-1, +1, +1],
    ].map(([x, y, z]) => project(x!, y!, z!));

    // Draw cube edges (back first, front last)
    const edges: Array<[number, number]> = [
      [0, 1], [1, 2], [2, 3], [3, 0],
      [4, 5], [5, 6], [6, 7], [7, 4],
      [0, 4], [1, 5], [2, 6], [3, 7],
    ];
    ctx.strokeStyle = colors.fg3;
    ctx.lineWidth = 1;
    for (const [a, b] of edges) {
      const pa = corners[a]!;
      const pb = corners[b]!;
      ctx.beginPath();
      ctx.moveTo(pa.px, pa.py);
      ctx.lineTo(pb.px, pb.py);
      ctx.stroke();
    }

    // Draw the field-line arrow through the centre (shows E direction)
    const eEnd = project(Math.cos(phi) * 1.4, Math.sin(phi) * 1.4, 0);
    const eStart = project(-Math.cos(phi) * 1.4, -Math.sin(phi) * 1.4, 0);
    ctx.strokeStyle = "rgba(111, 184, 198, 0.85)";
    ctx.fillStyle = "rgba(111, 184, 198, 0.85)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(eStart.px, eStart.py);
    ctx.lineTo(eEnd.px, eEnd.py);
    ctx.stroke();
    const eDx = eEnd.px - eStart.px;
    const eDy = eEnd.py - eStart.py;
    const eLen = Math.hypot(eDx, eDy) || 1;
    const eUx = eDx / eLen;
    const eUy = eDy / eLen;
    ctx.beginPath();
    ctx.moveTo(eEnd.px, eEnd.py);
    ctx.lineTo(eEnd.px - eUx * 10 - eUy * 4, eEnd.py - eUy * 10 + eUx * 4);
    ctx.lineTo(eEnd.px - eUx * 10 + eUy * 4, eEnd.py - eUy * 10 - eUx * 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(111, 184, 198, 0.9)";
    ctx.font = "11px monospace";
    ctx.textAlign = "left";
    ctx.fillText("E", eEnd.px + 8, eEnd.py - 2);

    // ─── Face arrows ───
    // For each face with outward normal î we draw three contributions:
    //   T_xi, T_yi, T_zi rendered as arrows in the (x, y, z) basis on the face.
    // We visualise only the 2 "big" faces most aligned/perpendicular to E.
    const faces: Array<{
      normal: 0 | 1 | 2;
      sign: 1 | -1;
      centre: [number, number, number];
    }> = [
      { normal: 0, sign: +1, centre: [+1, 0, 0] }, // +x face
      { normal: 0, sign: -1, centre: [-1, 0, 0] }, // -x face
      { normal: 1, sign: +1, centre: [0, +1, 0] }, // +y face (top)
      { normal: 1, sign: -1, centre: [0, -1, 0] }, // -y face (bottom)
    ];

    // Normalize arrow scale using the peak T magnitude across the whole matrix
    let Tpeak = 1e-9;
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++) Tpeak = Math.max(Tpeak, Math.abs(T[i]![j]!));

    const ARROW_PX_MAX = S * 0.9;

    for (const face of faces) {
      const [cxx, cyy, czz] = face.centre;
      const faceCentre = project(cxx, cyy, czz);

      // Draw each of the three tensor components T_{i,normal} as an arrow
      // along the ĵ-direction, starting from the face centre.
      const baseDirs: Array<{
        ux: number;
        uy: number;
        label: string;
        axis: 0 | 1 | 2;
      }> = [
        // x-axis direction in screen coords (project (1,0,0) relative)
        {
          ux: Math.cos(Math.PI / 6),
          uy: Math.sin(Math.PI / 6) * 0.5,
          label: "x",
          axis: 0,
        },
        // y-axis direction — screen up
        { ux: 0, uy: -1, label: "y", axis: 1 },
        // z-axis direction
        {
          ux: -Math.cos(Math.PI / 6),
          uy: Math.sin(Math.PI / 6) * 0.5,
          label: "z",
          axis: 2,
        },
      ];

      for (const dir of baseDirs) {
        const Tij = T[dir.axis]![face.normal]!;
        const mag = Math.abs(Tij) / Tpeak;
        if (mag < 0.01) continue;
        const len = mag * ARROW_PX_MAX;
        // Sign: positive T_{i,normal} with outward normal means momentum leaves
        // the cube face in +î direction → we draw arrow pointing +î (tension).
        // Multiply by face.sign so inward faces flip correctly.
        const s = Math.sign(Tij) * face.sign;
        const dx = dir.ux * len * s;
        const dy = dir.uy * len * s;
        const isDiag = dir.axis === face.normal;
        const color = isDiag
          ? Tij * face.sign > 0
            ? "#FF6ADE" // tension (outward)
            : "#FFD66B" // pressure (inward)
          : "rgba(200, 160, 255, 0.95)"; // lilac shear
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(faceCentre.px, faceCentre.py);
        ctx.lineTo(faceCentre.px + dx, faceCentre.py + dy);
        ctx.stroke();
        // arrowhead
        const L = Math.hypot(dx, dy) || 1;
        const ux = dx / L;
        const uy = dy / L;
        const head = 6;
        ctx.beginPath();
        ctx.moveTo(faceCentre.px + dx, faceCentre.py + dy);
        ctx.lineTo(
          faceCentre.px + dx - ux * head - uy * head * 0.5,
          faceCentre.py + dy - uy * head + ux * head * 0.5,
        );
        ctx.lineTo(
          faceCentre.px + dx - ux * head + uy * head * 0.5,
          faceCentre.py + dy - uy * head - ux * head * 0.5,
        );
        ctx.closePath();
        ctx.fill();
      }
    }

    // ─── HUD ───
    ctx.font = "12px monospace";
    ctx.fillStyle = colors.fg1;
    ctx.textAlign = "left";
    ctx.fillText("Maxwell stress on cube faces", 12, 20);
    ctx.fillStyle = colors.fg2;
    ctx.font = "10px monospace";
    ctx.fillText(
      `|E| = ${E_MAG} V/m · φ = ${((phi * 180) / Math.PI).toFixed(0)}°`,
      12,
      36,
    );

    ctx.textAlign = "right";
    ctx.fillText(
      `T_xx = ${T[0]![0]!.toExponential(2)} N/m²`,
      width - 12,
      20,
    );
    ctx.fillText(
      `T_yy = ${T[1]![1]!.toExponential(2)} N/m²`,
      width - 12,
      34,
    );
    ctx.fillText(
      `T_xy = ${T[0]![1]!.toExponential(2)} N/m²`,
      width - 12,
      48,
    );

    // Legend (bottom)
    const legY = height - 22;
    ctx.textAlign = "left";
    ctx.font = "10px monospace";
    ctx.fillStyle = "#FF6ADE";
    ctx.fillText("■ tension (field-line pull)", 12, legY);
    ctx.fillStyle = "#FFD66B";
    ctx.fillText("■ pressure (sideways push)", 200, legY);
    ctx.fillStyle = "rgba(200, 160, 255, 0.95)";
    ctx.fillText("■ shear (off-diagonal)", 400, legY);
  }, [size, phi, colors]);

  return (
    <div ref={containerRef} className="w-full pb-4">
      <canvas
        ref={canvasRef}
        style={{ width: size.width, height: size.height }}
        className="block"
      />
      <div className="mt-2 flex items-center gap-3 px-2 font-mono text-xs">
        <label className="w-14 text-[var(--color-fg-3)]">E angle</label>
        <input
          type="range"
          min={-Math.PI}
          max={Math.PI}
          step={0.01}
          value={phi}
          onChange={(e) => setPhi(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: "#6FB8C6" }}
        />
        <span className="w-16 text-right text-[var(--color-fg-1)]">
          {((phi * 180) / Math.PI).toFixed(0)}°
        </span>
      </div>
    </div>
  );
}
