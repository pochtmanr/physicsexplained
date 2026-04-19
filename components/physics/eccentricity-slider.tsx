"use client";

import { useEffect, useRef, useState } from "react";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.68;
const MAX_HEIGHT = 380;

export function EccentricitySlider() {
  const containerRef = useRef<HTMLDivElement>(null);
  const jxgBoxRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<any>(null);
  const jxgRef = useRef<any>(null);
  const colors = useThemeColors();
  const [size, setSize] = useState({ width: 480, height: 380 });

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
      if (!jxgBoxRef.current.id) jxgBoxRef.current.id = `ecs-${Math.random().toString(36).slice(2)}`;

      const a = 3;
      const board = JXG.JSXGraph.initBoard(jxgBoxRef.current.id, {
        boundingbox: [-5, 4.5, 5, -4.5], axis: false, showNavigation: false, showCopyright: false, keepAspectRatio: true,
      });

      const slider = board.create("slider", [[-3.5, -3.5], [3.5, -3.5], [0, 0.5, 0.95]], {
        name: "e", snapWidth: 0.01, strokeColor: "#6FB8C6", fillColor: "#6FB8C6",
        label: { fontSize: 12, strokeColor: colors.fg1 },
      });

      board.create("curve", [
        (t: number) => a * Math.cos(t),
        (t: number) => { const e = slider.Value(); return a * Math.sqrt(1 - e * e) * Math.sin(t); },
        0, 2 * Math.PI,
      ], { strokeColor: "#6FB8C6", strokeWidth: 2 });

      board.create("point", [() => a * slider.Value(), 0], { name: "F₁", fixed: true, size: 4, fillColor: "#6FB8C6", strokeColor: "#6FB8C6", label: { offset: [8, 8], fontSize: 11, strokeColor: colors.fg1 } });
      board.create("point", [() => -a * slider.Value(), 0], { name: "F₂", fixed: true, size: 4, fillColor: colors.fg2, strokeColor: colors.fg2, label: { offset: [8, 8], fontSize: 11, strokeColor: colors.fg1 } });
      board.create("point", [0, 0], { name: "", fixed: true, size: 2, fillColor: colors.fg3, strokeColor: colors.fg3 });

      board.create("text", [-4.5, 3.8, () => {
        const e = slider.Value(); const b = a * Math.sqrt(1 - e * e);
        return `e = ${e.toFixed(2)}  b/a = ${(b / a).toFixed(2)}`;
      }], { fontSize: 12, strokeColor: colors.fg1, fixed: true, cssClass: "font-mono" });

      boardRef.current = board;
    })();
    return () => {
      cancelled = true;
      if (boardRef.current && jxgRef.current) try { jxgRef.current.JSXGraph.freeBoard(boardRef.current); } catch {}
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
