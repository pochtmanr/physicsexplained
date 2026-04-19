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

const RATIO = 0.75;
const MAX_HEIGHT = 360;

export function TaylorExpansionScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<any>(null);
  const jxgRef = useRef<JXG | null>(null);
  const curvesRef = useRef<any[]>([]);
  const jxgBoxRef = useRef<HTMLDivElement>(null);
  const colors = useThemeColors();
  const [maxOrder, setMaxOrder] = useState(1);
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
        jxgBoxRef.current.id = `taylor-${Math.random().toString(36).slice(2)}`;
      }

      const board = JXG.JSXGraph.initBoard(jxgBoxRef.current.id, {
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
    <div ref={containerRef} className="w-full pb-4">
      <div className="flex flex-col items-center gap-2">
      <div
        ref={jxgBoxRef}
        className="jxgbox"
        style={{ width: size.width, height: size.height, backgroundColor: "transparent" }}
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            const idx = ORDERS.findIndex((o) => o >= maxOrder);
            if (idx > 0) setMaxOrder(ORDERS[idx - 1]!);
          }}
          disabled={maxOrder <= ORDERS[0]!}
          className="rounded border border-[var(--color-fg-4)] px-3 py-1 text-sm text-[var(--color-fg-1)] disabled:opacity-30"
        >
          &minus; term
        </button>
        <span className="text-sm text-[var(--color-fg-3)]">
          order {displayOrder}
        </span>
        <button
          type="button"
          onClick={() => {
            const idx = ORDERS.findIndex((o) => o >= maxOrder);
            if (idx < ORDERS.length - 1) setMaxOrder(ORDERS[idx + 1]!);
          }}
          disabled={maxOrder >= ORDERS[ORDERS.length - 1]!}
          className="rounded border border-[var(--color-fg-4)] px-3 py-1 text-sm text-[var(--color-fg-1)] disabled:opacity-30"
        >
          + term
        </button>
      </div>
      </div>
    </div>
  );
}
