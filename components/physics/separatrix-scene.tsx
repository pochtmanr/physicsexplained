"use client";

import { useEffect, useRef } from "react";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

type JXG = typeof import("jsxgraph");

export interface SeparatrixSceneProps {
  width?: number;
  height?: number;
}

export function SeparatrixScene({
  width = 480,
  height = 400,
}: SeparatrixSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<any>(null);
  const jxgRef = useRef<JXG | null>(null);
  const colors = useThemeColors();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const JXG = (await import("jsxgraph")).default;
      jxgRef.current = JXG as unknown as JXG;

      if (cancelled || !containerRef.current) return;
      if (!containerRef.current.id) {
        containerRef.current.id = `separatrix-${Math.random().toString(36).slice(2)}`;
      }

      const board = JXG.JSXGraph.initBoard(containerRef.current.id, {
        boundingbox: [-Math.PI - 0.3, 4.8, Math.PI + 0.3, -4.8],
        axis: true,
        showNavigation: false,
        showCopyright: false,
        keepAspectRatio: false,
        defaultAxes: {
          x: {
            name: "θ",
            withLabel: true,
            strokeColor: colors.fg2,
            label: { strokeColor: colors.fg2 },
            ticks: {
              strokeColor: colors.fg3,
              label: { strokeColor: colors.fg2 },
            },
          },
          y: {
            name: "θ̇",
            withLabel: true,
            strokeColor: colors.fg2,
            label: { strokeColor: colors.fg2 },
            ticks: {
              strokeColor: colors.fg3,
              label: { strokeColor: colors.fg2 },
            },
          },
        },
      });

      // Helper: thetaDot = sqrt(2*(E - (1 - cos(theta))))
      // For upper branch (positive), lower branch (negative)
      const plotOrbit = (
        E: number,
        color: string,
        strokeWidth: number,
        dash?: number,
      ) => {
        const nPts = 400;
        // Collect points where expression is non-negative
        const upper: [number, number][] = [];
        const lower: [number, number][] = [];

        for (let i = 0; i <= nPts; i++) {
          const theta = -Math.PI + (2 * Math.PI * i) / nPts;
          const val = 2 * (E - (1 - Math.cos(theta)));
          if (val >= 0) {
            const v = Math.sqrt(val);
            upper.push([theta, v]);
            lower.push([theta, -v]);
          }
        }

        if (upper.length < 2) return;

        const opts: Record<string, unknown> = {
          strokeColor: color,
          strokeWidth,
        };
        if (dash !== undefined) opts.dash = dash;

        board.create(
          "curve",
          [upper.map((p) => p[0]), upper.map((p) => p[1])],
          opts,
        );
        board.create(
          "curve",
          [lower.map((p) => p[0]), lower.map((p) => p[1])],
          opts,
        );
      };

      // Libration orbits (low energy, cyan, thin)
      for (const E of [0.2, 0.5, 1.0, 1.5, 1.8]) {
        plotOrbit(E, "#5BE9FF", 1.2);
      }

      // Separatrix (E = 2, red, thick)
      plotOrbit(2, "#FF6B6B", 2.5);

      // Rotation orbits (high energy, green, thin)
      for (const E of [2.5, 3.5, 5.0]) {
        plotOrbit(E, "#4ADE80", 1.2);
      }

      // Labels
      board.create("text", [0, 0.6, "libration"], {
        fontSize: 12,
        strokeColor: "#5BE9FF",
        anchorX: "middle",
      });
      board.create("text", [0, 3.8, "rotation"], {
        fontSize: 12,
        strokeColor: "#4ADE80",
        anchorX: "middle",
      });
      board.create("text", [2.0, 2.6, "separatrix"], {
        fontSize: 12,
        strokeColor: "#FF6B6B",
        anchorX: "middle",
      });

      boardRef.current = board;
    })();

    return () => {
      cancelled = true;
      if (boardRef.current && jxgRef.current) {
        try {
          (jxgRef.current as any).JSXGraph.freeBoard(boardRef.current);
        } catch {
          // noop
        }
      }
    };
  }, [colors]);

  return (
    <div
      ref={containerRef}
      className="jxgbox mx-auto"
      style={{ width, height, backgroundColor: "transparent" }}
    />
  );
}
