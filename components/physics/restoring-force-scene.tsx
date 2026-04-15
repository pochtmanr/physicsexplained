"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.5;
const MAX_HEIGHT = 280;

export function RestoringForceScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const jxgBoxRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<any>(null);
  const massRef = useRef<any>(null);
  const jxgRef = useRef<any>(null);
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
      jxgRef.current = JXG;
      if (cancelled || !jxgBoxRef.current) return;
      if (!jxgBoxRef.current.id) jxgBoxRef.current.id = `rf-${Math.random().toString(36).slice(2)}`;

      const board = JXG.JSXGraph.initBoard(jxgBoxRef.current.id, {
        boundingbox: [-3.5, 2.5, 3.5, -2.5],
        axis: false, showNavigation: false, showCopyright: false, keepAspectRatio: false,
      });

      // Equilibrium dashed line
      board.create("segment", [[0, -2], [0, 2]], { strokeColor: colors.fg3, strokeWidth: 1, dash: 2, fixed: true, highlight: false });
      board.create("text", [0.15, 1.8, "x = 0"], { fontSize: 11, strokeColor: colors.fg2, fixed: true });

      // Horizontal axis
      board.create("segment", [[-3.2, 0], [3.2, 0]], { strokeColor: colors.fg3, strokeWidth: 1, fixed: true, highlight: false });

      // Wall
      board.create("segment", [[-2.8, -1.2], [-2.8, 1.2]], { strokeColor: colors.fg2, strokeWidth: 3, fixed: true, highlight: false });

      // Mass point
      const mass = board.create("point", [1.5, 0], { name: "", size: 12, fillColor: colors.fg0, strokeColor: colors.fg0, fixed: true, showInfobox: false });

      // Spring curve (zig-zag from wall to mass)
      board.create("curve", [
        (s: number) => {
          const wallX = -2.8;
          const massX = mass.X();
          return wallX + s * (massX - wallX);
        },
        (s: number) => {
          if (s < 0.05 || s > 0.95) return 0;
          const phase = (s - 0.05) / 0.9;
          return 0.3 * Math.sin(phase * 8 * 2 * Math.PI);
        },
        0, 1,
      ], { strokeColor: colors.fg1, strokeWidth: 1.5, numberPointsHigh: 200 });

      // Force arrow
      board.create("arrow", [
        [() => mass.X(), 0.6],
        [() => mass.X() - mass.X() * 0.5, 0.6],
      ], { strokeColor: "#FF4FD8", strokeWidth: 3, lastArrow: { type: 2, size: 6 } });

      // Force label
      board.create("text", [
        () => mass.X() - mass.X() * 0.25, 1.1,
        () => `F = ${(-mass.X()).toFixed(1)}`,
      ], { fontSize: 12, strokeColor: "#FF4FD8", fixed: true, anchorX: "middle" });

      boardRef.current = board;
      massRef.current = mass;
    })();
    return () => {
      cancelled = true;
      if (boardRef.current && jxgRef.current) try { jxgRef.current.JSXGraph.freeBoard(boardRef.current); } catch {}
    };
  }, [colors]);

  useAnimationFrame({
    elementRef: jxgBoxRef,
    onFrame: (t) => {
      if (!massRef.current) return;
      massRef.current.moveTo([1.5 * Math.cos(2 * Math.PI * t / 3), 0], 0);
    },
  });

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
