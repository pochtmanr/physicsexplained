"use client";

import { useState } from "react";
import { useSceneTokens } from "@/components/physics/_shared/scene-tokens";
import {
  analogyTable,
  type AnalogyRow,
} from "@/lib/physics/relativity/linearized-gravity";

/**
 * FIG.50c — the EM ↔ linearized-GR dictionary, interactive.
 *
 * Linearized gravity is built deliberately in the image of electromagnetism:
 * pick a Lorenz-type gauge, and the field equation becomes a wave equation
 * with the same d'Alembertian operator. This component renders the standard
 * correspondence table as an interactive list — clicking a row reveals a
 * note on where the analogy holds and where it breaks (most importantly:
 * dipole → quadrupole, spin-1 → spin-2).
 *
 * This is an HTML/DOM scene (no canvas): a table is clearer than a drawing,
 * and it stays fully theme-aware through CSS variables.
 */

export function EmGrAnalogyScene() {
  const tokens = useSceneTokens();
  const rows = analogyTable();
  const [active, setActive] = useState<string | null>("source");

  return (
    <div className="w-full pb-4 font-mono">
      <div className="grid grid-cols-[1.1fr_1.3fr_1.3fr] gap-px text-xs">
        {/* header */}
        <div
          className="px-3 py-2 text-[10px] uppercase tracking-wider"
          style={{ color: tokens.textMute }}
        >
          concept
        </div>
        <div
          className="px-3 py-2 text-[10px] uppercase tracking-wider"
          style={{ color: tokens.magenta }}
        >
          electromagnetism
        </div>
        <div
          className="px-3 py-2 text-[10px] uppercase tracking-wider"
          style={{ color: tokens.cyan }}
        >
          linearized gravity
        </div>

        {rows.map((row: AnalogyRow) => {
          const isActive = active === row.key;
          return (
            <button
              key={row.key}
              type="button"
              onClick={() => setActive(isActive ? null : row.key)}
              className="contents text-left"
              aria-pressed={isActive}
            >
              <RowCell
                text={row.concept}
                color={tokens.textDim}
                active={isActive}
                tokens={tokens}
                lead
              />
              <RowCell
                text={row.em}
                color={tokens.textBright}
                active={isActive}
                tokens={tokens}
              />
              <RowCell
                text={row.gr}
                color={tokens.textBright}
                active={isActive}
                tokens={tokens}
              />
            </button>
          );
        })}
      </div>

      {/* note panel */}
      <div
        className="mt-3 border-l-2 px-3 py-2 text-xs"
        style={{
          borderColor: active ? tokens.amber : tokens.panelBorder,
          color: tokens.textDim,
        }}
      >
        {active
          ? rows.find((r) => r.key === active)?.note
          : "Click a row to see where the analogy holds — and where it breaks."}
      </div>

      <p className="mt-3 text-[11px]" style={{ color: tokens.textMute }}>
        Same operator, same gauge logic, same speed c. The decisive
        differences: EM radiates from a dipole (spin-1, two transverse modes
        180° apart); gravity radiates from a quadrupole (spin-2, two modes 90°
        apart).
      </p>
    </div>
  );
}

function RowCell({
  text,
  color,
  active,
  tokens,
  lead = false,
}: {
  text: string;
  color: string;
  active: boolean;
  tokens: ReturnType<typeof useSceneTokens>;
  lead?: boolean;
}) {
  return (
    <div
      className="px-3 py-2"
      style={{
        color: lead ? tokens.textMute : color,
        background: active ? tokens.bg1 : "transparent",
        borderTop: `1px solid ${tokens.panelBorder}`,
      }}
    >
      {text}
    </div>
  );
}
