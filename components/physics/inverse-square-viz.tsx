"use client";

import { useEffect, useRef, useState } from "react";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

const RATIO = 0.65;
const MAX_HEIGHT = 360;

export function InverseSquareViz() {
  const containerRef = useRef<HTMLDivElement>(null);
  const jxgBoxRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<any>(null);
  const jxgRef = useRef<any>(null);
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
      jxgRef.current = JXG;
      if (cancelled || !jxgBoxRef.current) return;
      if (!jxgBoxRef.current.id) jxgBoxRef.current.id = `isv-${Math.random().toString(36).slice(2)}`;

      const board = JXG.JSXGraph.initBoard(jxgBoxRef.current.id, {
        boundingbox: [-5, 5, 5, -5], axis: false, showNavigation: false, showCopyright: false, keepAspectRatio: true,
      });

      board.create("point", [0, 0], { name: "Source", fixed: true, size: 6, fillColor: "#5BE9FF", strokeColor: "#5BE9FF", label: { offset: [10, 10], fontSize: 11, strokeColor: colors.fg1 } });

      for (const r of [1, 2, 3]) {
        const opacity = 1 / (r * r);
        board.create("circle", [[0, 0], r], { strokeColor: "#5BE9FF", strokeOpacity: 0.3, strokeWidth: 1, fillColor: "#5BE9FF", fillOpacity: opacity * 0.15, fixed: true, highlight: false });
        board.create("text", [r + 0.15, 0.3, `${r}r`], { fontSize: 10, strokeColor: colors.fg2, fixed: true });
      }

      const tp = board.create("point", [2, 1.5], { name: "", size: 5, fillColor: "#FF4FD8", strokeColor: "#FF4FD8", showInfobox: false });
      board.create("segment", [[0, 0], tp], { strokeColor: "#FF4FD8", strokeWidth: 1.5, dash: 2 });
      board.create("text", [() => tp.X() + 0.3, () => tp.Y() + 0.3, () => {
        const r = Math.hypot(tp.X(), tp.Y());
        const F = r > 0.1 ? 1 / (r * r) : 99;
        return `r = ${r.toFixed(2)}\nF = ${F.toFixed(2)}`;
      }], { fontSize: 11, strokeColor: "#FF4FD8", fixed: true, cssClass: "font-mono whitespace-pre" });

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
