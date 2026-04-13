"use client";

import { useEffect, useRef } from "react";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { periodRatio } from "@/lib/physics/elliptic";

type JXG = typeof import("jsxgraph");

export interface PeriodVsAmplitudeSceneProps {
  width?: number;
  height?: number;
}

const ANNOTATIONS: Array<{ deg: number; label: string }> = [
  { deg: 15, label: "+0.5%" },
  { deg: 45, label: "+4%" },
  { deg: 90, label: "+18%" },
  { deg: 150, label: "+76%" },
];

export function PeriodVsAmplitudeScene({
  width = 480,
  height = 360,
}: PeriodVsAmplitudeSceneProps) {
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
        containerRef.current.id = `period-amp-${Math.random().toString(36).slice(2)}`;
      }

      const board = JXG.JSXGraph.initBoard(containerRef.current.id, {
        boundingbox: [-10, 5.5, 185, 0.8],
        axis: true,
        showNavigation: false,
        showCopyright: false,
        keepAspectRatio: false,
        defaultAxes: {
          x: {
            name: "θ₀ (deg)",
            withLabel: true,
            strokeColor: colors.fg2,
            label: { strokeColor: colors.fg2 },
            ticks: {
              strokeColor: colors.fg3,
              label: { strokeColor: colors.fg2 },
            },
          },
          y: {
            name: "T / T₀",
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

      // Reference line at T/T₀ = 1 (dashed)
      board.create(
        "functiongraph",
        [() => 1, 0, 180],
        { strokeColor: colors.fg3, strokeWidth: 1, dash: 2 },
      );

      // T(θ₀)/T₀ curve
      board.create(
        "functiongraph",
        [
          (deg: number) => {
            if (deg <= 0 || deg >= 180) return NaN;
            const rad = (deg * Math.PI) / 180;
            return periodRatio(rad);
          },
          0.1,
          179.5,
        ],
        { strokeColor: "#5BE9FF", strokeWidth: 2.5 },
      );

      // Annotated points
      for (const { deg, label } of ANNOTATIONS) {
        const rad = (deg * Math.PI) / 180;
        const ratio = periodRatio(rad);

        board.create("point", [deg, ratio], {
          name: "",
          fixed: true,
          size: 3,
          fillColor: "#FF6B6B",
          strokeColor: "#FF6B6B",
          showInfobox: false,
        });

        board.create("text", [deg + 3, ratio + 0.15, `${deg}° (${label})`], {
          fontSize: 11,
          strokeColor: colors.fg1,
        });
      }

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
