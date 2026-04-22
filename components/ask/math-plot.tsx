"use client";
import { useEffect, useRef } from "react";
import { compile } from "mathjs";

type FnArgs = {
  kind: "function"; expr: string; variable: "t" | "x" | "theta";
  domain: [number, number]; params?: Record<string, number>;
  ylabel?: string; xlabel?: string;
  overlays?: Array<{ expr: string; params?: Record<string, number> }>;
};
type ParamArgs = {
  kind: "parametric"; x: string; y: string; variable: "t";
  domain: [number, number]; params?: Record<string, number>;
};
type Args = FnArgs | ParamArgs;

export function MathPlot({ args }: { args: Args | Record<string, unknown> }) {
  const ref = useRef<HTMLDivElement>(null);
  const key = JSON.stringify(args);

  useEffect(() => {
    let disposed = false;
    (async () => {
      try {
        const JXGModule = await import("jsxgraph");
        const JXG = (JXGModule as unknown as { default: typeof JXGModule }).default ?? JXGModule;
        if (disposed || !ref.current) return;
        ref.current.innerHTML = "";
        const board = JXG.JSXGraph.initBoard(ref.current, {
          boundingbox: [-10, 6, 10, -6],
          axis: true, showNavigation: false, keepAspectRatio: false,
        });
        const a = args as Args;
        if (a.kind === "function") {
          plotFn(board, a);
          (a.overlays ?? []).forEach((o) => plotFn(board, { ...a, expr: o.expr, params: { ...a.params, ...o.params } }));
        } else if (a.kind === "parametric") {
          plotParam(board, a);
        }
      } catch (e) {
        console.error("MathPlot render error", e);
      }
    })();
    return () => { disposed = true; };
  }, [key]);

  return <div ref={ref} className="w-full h-64 my-3 border rounded jxgbox" />;
}

function plotFn(board: unknown, a: FnArgs) {
  const fn = compile(a.expr);
  (board as { create: (t: string, args: unknown[], opts: Record<string, unknown>) => unknown }).create(
    "functiongraph",
    [
      (v: number) => fn.evaluate({ ...(a.params ?? {}), [a.variable]: v }),
      a.domain[0], a.domain[1],
    ],
    { strokeWidth: 2 },
  );
}

function plotParam(board: unknown, a: ParamArgs) {
  const fx = compile(a.x); const fy = compile(a.y);
  (board as { create: (t: string, args: unknown[], opts: Record<string, unknown>) => unknown }).create(
    "curve",
    [
      (t: number) => fx.evaluate({ ...(a.params ?? {}), [a.variable]: t }),
      (t: number) => fy.evaluate({ ...(a.params ?? {}), [a.variable]: t }),
      a.domain[0], a.domain[1],
    ],
    { strokeWidth: 2 },
  );
}
