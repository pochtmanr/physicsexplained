"use client";

import { useEffect, useRef, useState } from "react";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";
import { periodRatio } from "@/lib/physics/elliptic";

type JXG = typeof import("jsxgraph");

const RATIO = 0.75;
const MAX_HEIGHT = 360;

const ANNOTATIONS: Array<{ deg: number; label: string }> = [
  { deg: 15, label: "+0.5%" },
  { deg: 45, label: "+4%" },
  { deg: 90, label: "+18%" },
  { deg: 150, label: "+76%" },
];

export function PeriodVsAmplitudeScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const jxgBoxRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<any>(null);
  const jxgRef = useRef<JXG | null>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 480, height: 360 });

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
        jxgBoxRef.current.id = `period-amp-${Math.random().toString(36).slice(2)}`;
      }

      const board = JXG.JSXGraph.initBoard(jxgBoxRef.current.id, {
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
        { strokeColor: "#6FB8C6", strokeWidth: 2.5 },
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
    <div ref={containerRef} className="w-full pb-4">
      <div
        ref={jxgBoxRef}
        className="jxgbox"
        style={{ width: size.width, height: size.height, backgroundColor: "transparent" }}
      />
    </div>
  );
}
