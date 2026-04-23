"use client";

/**
 * AbbeDiagramScene — the "Abbe diagram" beloved of optical-glass catalogues.
 * One point per glass, plotted with n_d on the vertical axis and V_d on the
 * horizontal. The Schott glass catalogue lives in roughly the rectangle
 * drawn here; crown glasses cluster top-right (high n, weak dispersion),
 * flints bottom-left (low n, strong dispersion wait — low V means strong).
 *
 * Hover any dot: the readout panel reveals name, chemistry, and the exact
 * n_d / V_d / (n_F − n_C).
 */

import { useMemo, useState } from "react";
import { abbeNumber } from "@/lib/physics/electromagnetism/optical-dispersion";

const WIDTH = 640;
const HEIGHT = 400;

/**
 * Representative optical glasses from the Schott catalogue (all values match
 * handbook figures to three decimals). V_d is computed from (n_d, n_F, n_C)
 * via the Abbe formula — keeps the numbers self-consistent instead of
 * hard-coding both.
 */
const GLASSES: Array<{
  name: string;
  family: string;
  chemistry: string;
  n_d: number;
  n_F: number;
  n_C: number;
}> = [
  // Crown glasses — high V, moderate n.
  { name: "N-FK5", family: "fluor crown", chemistry: "B₂O₃·Na₂O·K₂O·CaF₂", n_d: 1.4874, n_F: 1.4924, n_C: 1.4853 },
  { name: "N-BK7", family: "borosilicate crown", chemistry: "B₂O₃·SiO₂·Na₂O·K₂O", n_d: 1.5168, n_F: 1.5224, n_C: 1.5143 },
  { name: "N-K5", family: "crown", chemistry: "SiO₂·K₂O·Na₂O", n_d: 1.5224, n_F: 1.5285, n_C: 1.5198 },
  { name: "N-ZK7", family: "zinc crown", chemistry: "SiO₂·ZnO·B₂O₃", n_d: 1.5085, n_F: 1.5134, n_C: 1.5064 },
  // Fluorite — very high V, low n.
  { name: "CaF₂", family: "fluorite", chemistry: "CaF₂ (single crystal)", n_d: 1.4338, n_F: 1.4370, n_C: 1.4325 },
  // Flints — lower V, higher n.
  { name: "N-F2", family: "flint", chemistry: "SiO₂·PbO·Na₂O·K₂O", n_d: 1.6200, n_F: 1.6321, n_C: 1.6150 },
  { name: "N-SF2", family: "dense flint", chemistry: "SiO₂·PbO (higher PbO)", n_d: 1.6477, n_F: 1.6618, n_C: 1.6421 },
  { name: "N-SF11", family: "dense flint", chemistry: "SiO₂·PbO (~40% PbO)", n_d: 1.7847, n_F: 1.8065, n_C: 1.7760 },
  { name: "N-SF57", family: "extra-dense flint", chemistry: "SiO₂·PbO (very high PbO)", n_d: 1.8467, n_F: 1.8721, n_C: 1.8366 },
  // Lanthanum — high n, respectable V.
  { name: "N-LaK10", family: "lanthanum crown", chemistry: "SiO₂·La₂O₃·B₂O₃", n_d: 1.7200, n_F: 1.7330, n_C: 1.7147 },
  { name: "N-LaSF9", family: "lanthanum dense flint", chemistry: "SiO₂·La₂O₃·Nb₂O₅", n_d: 1.8503, n_F: 1.8698, n_C: 1.8425 },
];

type GlassRow = typeof GLASSES[number] & { V_d: number };

export function AbbeDiagramScene() {
  const data: GlassRow[] = useMemo(
    () =>
      GLASSES.map((g) => ({
        ...g,
        V_d: abbeNumber(g.n_d, g.n_F, g.n_C),
      })),
    [],
  );

  const [hovered, setHovered] = useState<string | null>(null);
  const active = data.find((d) => d.name === hovered) ?? null;

  // Plot bounds — Abbe diagrams conventionally run V_d 20 → 95 left-to-right
  // with V_d DECREASING along +x (so high-dispersion flints are on the right).
  const V_LEFT = 95;
  const V_RIGHT = 18;
  const N_BOT = 1.42;
  const N_TOP = 1.90;
  const padL = 56;
  const padR = 18;
  const padT = 20;
  const padB = 44;
  const plotW = WIDTH - padL - padR;
  const plotH = HEIGHT - padT - padB;

  const xOf = (V: number) =>
    padL + plotW * ((V_LEFT - V) / (V_LEFT - V_RIGHT));
  const yOf = (n: number) =>
    padT + plotH * (1 - (n - N_BOT) / (N_TOP - N_BOT));

  const familyColor = (family: string): string => {
    if (family.includes("fluorite")) return "#9AE6B4";
    if (family.includes("lanthanum")) return "#F6AD55";
    if (family.includes("flint")) return "#FC8181";
    return "#6FB8C6"; // crowns
  };

  return (
    <div className="w-full">
      <div className="relative" style={{ width: WIDTH, maxWidth: "100%" }}>
        <svg
          width={WIDTH}
          height={HEIGHT}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          style={{ maxWidth: "100%", height: "auto", background: "#0b0d10", display: "block" }}
        >
          {/* Axes */}
          <line x1={padL} y1={HEIGHT - padB} x2={WIDTH - padR} y2={HEIGHT - padB} stroke="rgba(200,200,210,0.45)" strokeWidth={1} />
          <line x1={padL} y1={padT} x2={padL} y2={HEIGHT - padB} stroke="rgba(200,200,210,0.45)" strokeWidth={1} />

          {/* V_d grid */}
          {[90, 80, 70, 60, 50, 40, 30, 20].map((V) => (
            <g key={`vx-${V}`}>
              <line x1={xOf(V)} y1={padT} x2={xOf(V)} y2={HEIGHT - padB} stroke="rgba(200,200,210,0.08)" />
              <text x={xOf(V)} y={HEIGHT - padB + 16} textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize={10} fill="rgba(200,200,210,0.65)">
                {V}
              </text>
            </g>
          ))}
          {/* n_d grid */}
          {[1.45, 1.55, 1.65, 1.75, 1.85].map((n) => (
            <g key={`ny-${n}`}>
              <line x1={padL} y1={yOf(n)} x2={WIDTH - padR} y2={yOf(n)} stroke="rgba(200,200,210,0.08)" />
              <text x={padL - 8} y={yOf(n) + 4} textAnchor="end" fontFamily="ui-monospace, monospace" fontSize={10} fill="rgba(200,200,210,0.65)">
                {n.toFixed(2)}
              </text>
            </g>
          ))}

          {/* Axis labels */}
          <text
            x={padL + plotW / 2}
            y={HEIGHT - 8}
            textAnchor="middle"
            fontFamily="ui-monospace, monospace"
            fontSize={11}
            fill="rgba(200,200,210,0.8)"
          >
            Abbe number V_d  (higher V → weaker dispersion)
          </text>
          <text
            transform={`translate(${padL - 38}, ${padT + plotH / 2}) rotate(-90)`}
            textAnchor="middle"
            fontFamily="ui-monospace, monospace"
            fontSize={11}
            fill="rgba(200,200,210,0.8)"
          >
            refractive index n_d  (587.6 nm)
          </text>

          {/* Points */}
          {data.map((g) => {
            const x = xOf(g.V_d);
            const y = yOf(g.n_d);
            const isActive = hovered === g.name;
            return (
              <g key={g.name}>
                <circle
                  cx={x}
                  cy={y}
                  r={isActive ? 8 : 5}
                  fill={familyColor(g.family)}
                  fillOpacity={isActive ? 1 : 0.9}
                  stroke={isActive ? "#fff" : "rgba(11,13,16,0.7)"}
                  strokeWidth={isActive ? 1.2 : 1}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={() => setHovered(g.name)}
                  onMouseLeave={() => setHovered((h) => (h === g.name ? null : h))}
                  onPointerDown={() => setHovered(g.name)}
                />
                <text
                  x={x + 8}
                  y={y - 6}
                  fontFamily="ui-monospace, monospace"
                  fontSize={9.5}
                  fill="rgba(200,200,210,0.85)"
                  pointerEvents="none"
                >
                  {g.name}
                </text>
              </g>
            );
          })}

          {/* Readout panel */}
          <g transform={`translate(${WIDTH - padR - 210}, ${padT + 4})`}>
            <rect width={200} height={72} fill="rgba(11,13,16,0.82)" stroke="rgba(200,200,210,0.28)" rx={4} />
            {active ? (
              <>
                <text x={10} y={18} fill="#fff" fontFamily="ui-monospace, monospace" fontSize={11} fontWeight={600}>
                  {active.name} · {active.family}
                </text>
                <text x={10} y={34} fill="rgba(200,200,210,0.85)" fontFamily="ui-monospace, monospace" fontSize={10}>
                  {active.chemistry}
                </text>
                <text x={10} y={50} fill="rgba(200,200,210,0.85)" fontFamily="ui-monospace, monospace" fontSize={10}>
                  n_d = {active.n_d.toFixed(4)}  ·  V_d = {active.V_d.toFixed(1)}
                </text>
                <text x={10} y={64} fill="rgba(200,200,210,0.65)" fontFamily="ui-monospace, monospace" fontSize={10}>
                  n_F − n_C = {(active.n_F - active.n_C).toFixed(4)}
                </text>
              </>
            ) : (
              <text x={10} y={38} fill="rgba(200,200,210,0.65)" fontFamily="ui-monospace, monospace" fontSize={11}>
                hover a point for glass data
              </text>
            )}
          </g>
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4 px-2 font-mono text-xs text-[var(--color-fg-3)]">
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: "#6FB8C6" }} /> crown
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: "#FC8181" }} /> flint
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: "#F6AD55" }} /> lanthanum
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: "#9AE6B4" }} /> fluorite
        </span>
      </div>
    </div>
  );
}
