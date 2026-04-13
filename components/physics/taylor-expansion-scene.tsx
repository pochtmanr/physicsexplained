"use client";

import { useEffect, useRef, useState } from "react";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

type JXG = typeof import("jsxgraph");

function taylorSin(x: number, order: number): number {
  let result = 0;
  let term = x;
  for (let n = 1; n <= order; n += 2) {
    result += term;
    term *= (-x * x) / ((n + 1) * (n + 2));
  }
  return result;
}

const ORDERS = [1, 3, 5, 7] as const;
const ORDER_COLORS = ["#5BE9FF", "#4ADE80", "#FACC15", "#FF6B6B"] as const;

export interface TaylorExpansionSceneProps {
  width?: number;
  height?: number;
}

export function TaylorExpansionScene({
  width = 480,
  height = 360,
}: TaylorExpansionSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<any>(null);
  const jxgRef = useRef<JXG | null>(null);
  const curvesRef = useRef<any[]>([]);
  const colors = useThemeColors();
  const [maxOrder, setMaxOrder] = useState(1);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const JXG = (await import("jsxgraph")).default;
      jxgRef.current = JXG as unknown as JXG;

      if (cancelled || !containerRef.current) return;
      if (!containerRef.current.id) {
        containerRef.current.id = `taylor-${Math.random().toString(36).slice(2)}`;
      }

      const board = JXG.JSXGraph.initBoard(containerRef.current.id, {
        boundingbox: [-0.5, 2.5, 4, -2.5],
        axis: true,
        showNavigation: false,
        showCopyright: false,
        keepAspectRatio: false,
        defaultAxes: {
          x: {
            name: "θ",
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

      // Exact sin curve (dashed)
      board.create(
        "functiongraph",
        [(x: number) => Math.sin(x), -0.5, 4],
        {
          strokeColor: colors.fg1,
          strokeWidth: 2,
          dash: 2,
          name: "sin θ",
          withLabel: true,
          label: { strokeColor: colors.fg1, offset: [5, 10] },
        },
      );

      // Taylor polynomial curves
      const curves: any[] = [];
      for (let i = 0; i < ORDERS.length; i++) {
        const order = ORDERS[i]!;
        const color = ORDER_COLORS[i]!;
        const curve = board.create(
          "functiongraph",
          [(x: number) => taylorSin(x, order), -0.5, 4],
          {
            strokeColor: color,
            strokeWidth: 2,
            name: `n=${order}`,
            withLabel: true,
            label: { strokeColor: color, offset: [5, -10 - i * 12] },
            visible: false,
          },
        );
        curves.push(curve);
      }

      curvesRef.current = curves;
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

  // Update curve visibility when maxOrder changes
  useEffect(() => {
    for (let i = 0; i < ORDERS.length; i++) {
      const curve = curvesRef.current[i];
      if (!curve) continue;
      const order = ORDERS[i]!;
      if (order <= maxOrder) {
        curve.show();
      } else {
        curve.hide();
      }
    }
    if (boardRef.current) {
      boardRef.current.update();
    }
  }, [maxOrder]);

  const currentIdx = ORDERS.findIndex((o) => o >= maxOrder);
  const displayOrder = currentIdx >= 0 ? ORDERS[currentIdx]! : ORDERS[ORDERS.length - 1]!;

  return (
    <div className="mx-auto flex flex-col items-center gap-2" style={{ width }}>
      <div
        ref={containerRef}
        className="jxgbox"
        style={{ width, height, backgroundColor: "transparent" }}
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            const idx = ORDERS.findIndex((o) => o >= maxOrder);
            if (idx > 0) setMaxOrder(ORDERS[idx - 1]!);
          }}
          disabled={maxOrder <= ORDERS[0]!}
          className="rounded border border-[var(--color-fg-3)] px-3 py-1 text-sm text-[var(--color-fg-1)] disabled:opacity-30"
        >
          &minus; term
        </button>
        <span className="text-sm text-[var(--color-fg-2)]">
          order {displayOrder}
        </span>
        <button
          type="button"
          onClick={() => {
            const idx = ORDERS.findIndex((o) => o >= maxOrder);
            if (idx < ORDERS.length - 1) setMaxOrder(ORDERS[idx + 1]!);
          }}
          disabled={maxOrder >= ORDERS[ORDERS.length - 1]!}
          className="rounded border border-[var(--color-fg-3)] px-3 py-1 text-sm text-[var(--color-fg-1)] disabled:opacity-30"
        >
          + term
        </button>
      </div>
    </div>
  );
}
