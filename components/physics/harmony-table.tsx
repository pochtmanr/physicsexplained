"use client";

import { useEffect, useRef } from "react";

const PLANETS = [
  { name: "Mercury", a: 0.387, T: 0.2408 },
  { name: "Earth", a: 1.0, T: 1.0 },
  { name: "Mars", a: 1.524, T: 1.881 },
  { name: "Jupiter", a: 5.203, T: 11.862 },
] as const;

export function HarmonyTable() {
  const plotRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<any>(null);
  const jxgRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const JXG = (await import("jsxgraph")).default;
      jxgRef.current = JXG;
      if (cancelled || !plotRef.current) return;
      if (!plotRef.current.id) {
        plotRef.current.id = `harmony-${Math.random().toString(36).slice(2)}`;
      }

      const board = JXG.JSXGraph.initBoard(plotRef.current.id, {
        boundingbox: [-1.5, 2.5, 2, -1.5], // log10 space
        axis: true,
        showNavigation: false,
        showCopyright: false,
        defaultAxes: {
          x: { name: "log₁₀ a (AU)", withLabel: true, strokeColor: "#5B6B86" },
          y: { name: "log₁₀ T (yr)", withLabel: true, strokeColor: "#5B6B86" },
        },
      });

      // Line T = a^(3/2) in log-log is log T = 1.5 log a
      board.create(
        "functiongraph",
        [(x: number) => 1.5 * x, -1.5, 2],
        { strokeColor: "#5BE9FF", strokeWidth: 1.5 },
      );

      // Data points
      for (const p of PLANETS) {
        const x = Math.log10(p.a);
        const y = Math.log10(p.T);
        board.create("point", [x, y], {
          name: p.name,
          size: 4,
          fillColor: "#FF4FD8",
          strokeColor: "#FF4FD8",
          fixed: true,
          label: {
            offset: [8, 8],
            fontSize: 11,
            strokeColor: "#9FB0C8",
            cssClass: "font-mono",
          },
        });
      }

      boardRef.current = board;
    })();
    return () => {
      cancelled = true;
      if (boardRef.current && jxgRef.current) {
        try {
          jxgRef.current.JSXGraph.freeBoard(boardRef.current);
        } catch {
          // noop
        }
      }
    };
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <table className="w-full border-collapse font-mono text-sm">
        <thead>
          <tr className="border-b border-[var(--color-fg-3)]">
            <th className="py-2 text-left uppercase text-[var(--color-fg-2)]">
              Planet
            </th>
            <th className="py-2 text-right uppercase text-[var(--color-fg-2)]">
              a (AU)
            </th>
            <th className="py-2 text-right uppercase text-[var(--color-fg-2)]">
              T (yr)
            </th>
            <th className="py-2 text-right uppercase text-[var(--color-cyan)]">
              T² / a³
            </th>
          </tr>
        </thead>
        <tbody>
          {PLANETS.map((p) => {
            const ratio = (p.T * p.T) / (p.a * p.a * p.a);
            return (
              <tr
                key={p.name}
                className="border-b border-[var(--color-fg-3)]/40"
              >
                <td className="py-2 text-[var(--color-fg-0)]">{p.name}</td>
                <td className="py-2 text-right text-[var(--color-fg-1)]">
                  {p.a.toFixed(3)}
                </td>
                <td className="py-2 text-right text-[var(--color-fg-1)]">
                  {p.T.toFixed(3)}
                </td>
                <td className="py-2 text-right font-semibold text-[var(--color-cyan)]">
                  {ratio.toFixed(3)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div
        ref={plotRef}
        className="jxgbox mx-auto"
        style={{ width: 560, height: 360, backgroundColor: "transparent" }}
      />
    </div>
  );
}
