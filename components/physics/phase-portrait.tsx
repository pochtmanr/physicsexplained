"use client";

import { useEffect, useRef, useState } from "react";
import {
  smallAngleTheta,
  smallAngleThetaDot,
} from "@/lib/physics/pendulum";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

type JXG = typeof import("jsxgraph");

export interface PhasePortraitProps {
  theta0: number;
  length: number;
}

export function PhasePortrait({
  theta0,
  length,
}: PhasePortraitProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<any>(null);
  const pointRef = useRef<any>(null);
  const jxgRef = useRef<JXG | null>(null);
  const [size, setSize] = useState({ width: 480, height: 360 });
  const colors = useThemeColors();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          const h = Math.min(w * 0.75, 360);
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

  // Initialize JSXGraph board on mount
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const JXG = (await import("jsxgraph")).default;
      jxgRef.current = JXG as unknown as JXG;

      if (cancelled || !containerRef.current) return;
      if (!containerRef.current.id) {
        containerRef.current.id = `phase-portrait-${Math.random().toString(36).slice(2)}`;
      }

      const omega = Math.sqrt(9.80665 / length);
      const vMax = theta0 * omega;
      const margin = 1.3;

      const board = JXG.JSXGraph.initBoard(containerRef.current.id, {
        boundingbox: [-theta0 * margin, vMax * margin, theta0 * margin, -vMax * margin],
        axis: true,
        showNavigation: false,
        showCopyright: false,
        keepAspectRatio: false,
        defaultAxes: {
          x: {
            name: "x (rad)",
            withLabel: true,
            strokeColor: colors.fg2,
            label: { strokeColor: colors.fg2 },
            ticks: {
              strokeColor: colors.fg3,
              label: { strokeColor: colors.fg2 },
            },
          },
          y: {
            name: "v (rad/s)",
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

      // Background ellipse trace (the full phase-space orbit)
      board.create(
        "curve",
        [
          (t: number) => theta0 * Math.cos(t),
          (t: number) => -theta0 * omega * Math.sin(t),
          0,
          2 * Math.PI,
        ],
        { strokeColor: "#5BE9FF", strokeWidth: 2, strokeOpacity: 0.6 },
      );

      // Animating point
      const pt = board.create("point", [theta0, 0], {
        name: "",
        fixed: true,
        size: 5,
        fillColor: "#5BE9FF",
        strokeColor: "#5BE9FF",
        showInfobox: false,
      });

      boardRef.current = board;
      pointRef.current = pt;
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
  }, [theta0, length, colors]);

  // Drive the point via the animation frame hook
  useAnimationFrame({
    elementRef: containerRef,
    onFrame: (t) => {
      const theta = smallAngleTheta({ t, theta0, L: length });
      const thetaDot = smallAngleThetaDot({ t, theta0, L: length });
      if (pointRef.current) {
        pointRef.current.moveTo([theta, thetaDot], 0);
      }
    },
  });

  return (
    <div
      ref={containerRef}
      className="jxgbox w-full pb-4"
      style={{ width: size.width, height: size.height, backgroundColor: "transparent" }}
    />
  );
}
