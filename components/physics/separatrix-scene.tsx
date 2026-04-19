"use client";

import { useEffect, useRef, useState } from "react";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

type JXG = typeof import("jsxgraph");

const RATIO = 0.8;
const MAX_HEIGHT = 400;

export function SeparatrixScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const jxgBoxRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<any>(null);
  const jxgRef = useRef<JXG | null>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 480, height: 400 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          const h = Math.min(w * RATIO, MAX_HEIGHT);
          setSize({ width: w, height: h });
          if (boardRef.current) {
            boardRef.current.resizeContainer(w, h);
          }
        }
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const JXG = (await import("jsxgraph")).default;
      jxgRef.current = JXG as unknown as JXG;

      if (cancelled || !jxgBoxRef.current) return;
      if (!jxgBoxRef.current.id) {
        jxgBoxRef.current.id = `separatrix-${Math.random().toString(36).slice(2)}`;
      }

      const board = JXG.JSXGraph.initBoard(jxgBoxRef.current.id, {
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
        plotOrbit(E, "#6FB8C6", 1.2);
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
        strokeColor: "#6FB8C6",
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
    <div ref={containerRef} className="w-full pb-4">
      <div
        ref={jxgBoxRef}
        className="jxgbox"
        style={{ width: size.width, height: size.height, backgroundColor: "transparent" }}
      />
    </div>
  );
}
