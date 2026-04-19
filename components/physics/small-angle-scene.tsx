"use client";

import { useEffect, useRef, useState } from "react";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

type JXG = typeof import("jsxgraph");

const RATIO = 0.5;
const MAX_HEIGHT = 280;

export function SmallAngleScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const jxgBoxRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<any>(null);
  const jxgRef = useRef<JXG | null>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 480, height: 280 });

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
        jxgBoxRef.current.id = `small-angle-${Math.random().toString(36).slice(2)}`;
      }

      const board = JXG.JSXGraph.initBoard(jxgBoxRef.current.id, {
        boundingbox: [-0.3, 1.5, Math.PI + 0.3, -1.5],
        axis: true,
        showNavigation: false,
        showCopyright: false,
        keepAspectRatio: false,
        defaultAxes: {
          x: {
            name: "θ (rad)",
            withLabel: true,
            strokeColor: colors.fg2,
            label: { strokeColor: colors.fg2 },
            ticks: {
              strokeColor: colors.fg3,
              label: { strokeColor: colors.fg2 },
            },
          },
          y: {
            name: "",
            withLabel: false,
            strokeColor: colors.fg2,
            ticks: {
              strokeColor: colors.fg3,
              label: { strokeColor: colors.fg2 },
            },
          },
        },
      });

      // θ line (cyan)
      board.create(
        "functiongraph",
        [(x: number) => x, 0, Math.PI],
        { strokeColor: "#6FB8C6", strokeWidth: 2, name: "θ", withLabel: true,
          label: { strokeColor: "#6FB8C6", offset: [5, 10] } },
      );

      // sin(θ) curve (red)
      board.create(
        "functiongraph",
        [(x: number) => Math.sin(x), 0, Math.PI],
        { strokeColor: "#FF6B6B", strokeWidth: 2, name: "sin θ", withLabel: true,
          label: { strokeColor: "#FF6B6B", offset: [5, -10] } },
      );

      // Slider for θ₀
      const slider = board.create(
        "slider",
        [[0.5, -1.1], [2.5, -1.1], [0.01, 0.3, Math.PI]],
        {
          name: "θ₀",
          strokeColor: "#6FB8C6",
          fillColor: "#6FB8C6",
          label: { strokeColor: colors.fg1 },
        },
      );

      // Tracking point on θ line
      const ptTheta = board.create(
        "point",
        [() => slider.Value(), () => slider.Value()],
        {
          name: "",
          fixed: true,
          size: 4,
          fillColor: "#6FB8C6",
          strokeColor: "#6FB8C6",
          showInfobox: false,
        },
      );

      // Tracking point on sin(θ) curve
      const ptSin = board.create(
        "point",
        [() => slider.Value(), () => Math.sin(slider.Value())],
        {
          name: "",
          fixed: true,
          size: 4,
          fillColor: "#FF6B6B",
          strokeColor: "#FF6B6B",
          showInfobox: false,
        },
      );

      // Vertical segment between the two points
      board.create("segment", [ptTheta, ptSin], {
        strokeColor: colors.fg3,
        strokeWidth: 1,
        dash: 2,
      });

      // Error percentage text
      board.create(
        "text",
        [
          0.3,
          1.3,
          () => {
            const val = slider.Value();
            const err = Math.abs((val - Math.sin(val)) / Math.sin(val)) * 100;
            return `error: ${err.toFixed(1)}%`;
          },
        ],
        { fontSize: 14, strokeColor: colors.fg1 },
      );

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
