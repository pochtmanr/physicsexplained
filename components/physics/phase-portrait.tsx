"use client";

import { useEffect, useRef } from "react";
import {
  smallAngleTheta,
  smallAngleThetaDot,
} from "@/lib/physics/pendulum";
import { useAnimationFrame } from "@/lib/animation/use-animation-frame";

type JXG = typeof import("jsxgraph");

export interface PhasePortraitProps {
  theta0: number;
  length: number;
  width?: number;
  height?: number;
}

export function PhasePortrait({
  theta0,
  length,
  width = 480,
  height = 360,
}: PhasePortraitProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<any>(null);
  const pointRef = useRef<any>(null);
  const jxgRef = useRef<JXG | null>(null);

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
          x: { name: "x (rad)", withLabel: true, strokeColor: "#5B6B86" },
          y: { name: "v (rad/s)", withLabel: true, strokeColor: "#5B6B86" },
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
  }, [theta0, length]);

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
      className="jxgbox mx-auto"
      style={{ width, height, backgroundColor: "transparent" }}
    />
  );
}
