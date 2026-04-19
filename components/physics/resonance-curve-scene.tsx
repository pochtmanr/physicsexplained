"use client";

import { useEffect, useRef, useState } from "react";
import { drivenAmplitude } from "@/lib/physics/damped-oscillator";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

type JXG = typeof import("jsxgraph");

const RATIO = 0.75;
const MAX_HEIGHT = 360;

export function ResonanceCurveScene() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<any>(null);
  const curveRef = useRef<any>(null);
  const jxgRef = useRef<JXG | null>(null);
  const colors = useThemeColors();
  const [Q, setQ] = useState(10);
  const [size, setSize] = useState({ width: 480, height: 360 });

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
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
    ro.observe(wrapper);
    return () => ro.disconnect();
  }, []);

  // Initialize JSXGraph board
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const JXG = (await import("jsxgraph")).default;
      jxgRef.current = JXG as unknown as JXG;

      if (cancelled || !containerRef.current) return;
      if (!containerRef.current.id) {
        containerRef.current.id = `resonance-${Math.random().toString(36).slice(2)}`;
      }

      const board = JXG.JSXGraph.initBoard(containerRef.current.id, {
        boundingbox: [-0.1, 12, 2.2, -0.5],
        axis: true,
        showNavigation: false,
        showCopyright: false,
        keepAspectRatio: false,
        defaultAxes: {
          x: {
            name: "ω_D",
            withLabel: true,
            strokeColor: colors.fg2,
            label: { strokeColor: colors.fg2 },
            ticks: {
              strokeColor: colors.fg3,
              label: { strokeColor: colors.fg2 },
            },
          },
          y: {
            name: "A",
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

  // Update curve when Q changes
  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;

    // Remove old curve
    if (curveRef.current) {
      board.removeObject(curveRef.current);
    }

    const omega0 = 1;
    const F0 = 1;
    const gamma = omega0 / Q;
    const params = { omega0, gamma };

    const curve = board.create(
      "functiongraph",
      [
        (omegaD: number) => drivenAmplitude(omegaD, F0, params),
        0.01,
        2.2,
      ],
      { strokeColor: "#6FB8C6", strokeWidth: 2 },
    );

    curveRef.current = curve;
  }, [Q]);

  return (
    <div ref={wrapperRef} className="w-full pb-4">
      <div
        ref={containerRef}
        className="jxgbox"
        style={{ width: size.width, height: size.height, backgroundColor: "transparent" }}
      />
      <div className="mt-2 flex items-center gap-3 px-2">
        <label className="text-sm text-[var(--color-fg-3)]">Q</label>
        <input
          type="range"
          min={1}
          max={50}
          step={1}
          value={Q}
          onChange={(e) => setQ(parseInt(e.target.value, 10))}
          className="flex-1 accent-[#6FB8C6]"
        />
        <span className="w-10 text-right text-sm font-mono text-[var(--color-fg-1)]">
          {Q}
        </span>
      </div>
    </div>
  );
}
