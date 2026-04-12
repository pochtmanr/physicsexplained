"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";

export interface EllipseConstructionProps {
  /** Semi-major axis */
  a?: number;
  /** Eccentricity */
  e?: number;
  /** Orbit period in wall-time seconds for the tracer */
  T?: number;
  width?: number;
  height?: number;
}

export function EllipseConstruction({
  a = 1,
  e = 0.5,
  T = 12,
  width = 620,
  height = 380,
}: EllipseConstructionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<any>(null);
  const ptRef = useRef<any>(null);
  const seg1Ref = useRef<any>(null);
  const seg2Ref = useRef<any>(null);
  const jxgRef = useRef<any>(null);

  const [readout, setReadout] = useState({ d1: 0, d2: 0 });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const JXG = (await import("jsxgraph")).default;
      jxgRef.current = JXG;

      if (cancelled || !containerRef.current) return;
      if (!containerRef.current.id) {
        containerRef.current.id = `ellipse-${Math.random().toString(36).slice(2)}`;
      }

      const c = a * e;
      const b = a * Math.sqrt(1 - e * e);
      const pad = 1.3;

      const board = JXG.JSXGraph.initBoard(containerRef.current.id, {
        boundingbox: [-a * pad - c, b * pad, a * pad - c, -b * pad],
        axis: false,
        showNavigation: false,
        showCopyright: false,
        keepAspectRatio: true,
      });

      // Draw ellipse
      board.create(
        "curve",
        [
          (t: number) => a * Math.cos(t) - c,
          (t: number) => b * Math.sin(t),
          0,
          2 * Math.PI,
        ],
        { strokeColor: "#5BE9FF", strokeWidth: 2 },
      );

      // Foci: F1 is the sun-focus at origin (which is +c from ellipse center)
      // With our ellipse centered at (-c, 0), origin is the right focus.
      board.create("point", [0, 0], {
        name: "F₁",
        fixed: true,
        size: 4,
        fillColor: "#5BE9FF",
        strokeColor: "#5BE9FF",
        label: {
          offset: [8, 8],
          fontSize: 12,
          strokeColor: "#9FB0C8",
          cssClass: "font-mono",
        },
      });
      board.create("point", [-2 * c, 0], {
        name: "F₂",
        fixed: true,
        size: 4,
        fillColor: "#5B6B86",
        strokeColor: "#5B6B86",
        label: {
          offset: [8, 8],
          fontSize: 12,
          strokeColor: "#9FB0C8",
          cssClass: "font-mono",
        },
      });

      // Tracer point P
      const pt = board.create("point", [a - c, 0], {
        name: "P",
        fixed: true,
        size: 5,
        fillColor: "#E6EDF7",
        strokeColor: "#E6EDF7",
        showInfobox: false,
        label: { fontSize: 12, strokeColor: "#E6EDF7" },
      });

      const seg1 = board.create(
        "segment",
        [[0, 0], pt],
        { strokeColor: "#5BE9FF", strokeWidth: 1.5 },
      );
      const seg2 = board.create(
        "segment",
        [[-2 * c, 0], pt],
        { strokeColor: "#5B6B86", strokeWidth: 1.5 },
      );

      boardRef.current = board;
      ptRef.current = pt;
      seg1Ref.current = seg1;
      seg2Ref.current = seg2;
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
  }, [a, e]);

  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (t) => {
      if (!ptRef.current) return;
      const c = a * e;
      const b = a * Math.sqrt(1 - e * e);
      // Parametric ellipse, uniform angular speed (for visualization, not Keplerian)
      const phase = (t / T) * 2 * Math.PI;
      const px = a * Math.cos(phase) - c;
      const py = b * Math.sin(phase);
      ptRef.current.moveTo([px, py], 0);
      // Update readout
      const d1 = Math.hypot(px - 0, py - 0);
      const d2 = Math.hypot(px - -2 * c, py - 0);
      setReadout({ d1, d2 });
    },
  });

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        ref={containerRef}
        className="jxgbox"
        style={{ width, height, backgroundColor: "transparent" }}
      />
      <div
        className="flex flex-wrap justify-center gap-x-3 gap-y-1 font-mono text-xs text-[var(--color-fg-1)]"
        style={{ maxWidth: width }}
      >
        <span>|PF₁| = {readout.d1.toFixed(3)}</span>
        <span>|PF₂| = {readout.d2.toFixed(3)}</span>
        <span>sum = {(readout.d1 + readout.d2).toFixed(3)}</span>
      </div>
    </div>
  );
}
