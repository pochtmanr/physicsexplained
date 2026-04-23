"use client";
import { useEffect, useRef } from "react";
import { compile } from "mathjs";
import { SceneCard } from "@/components/layout/scene-card";
import { useThemeColors, type ThemeColors } from "@/lib/hooks/use-theme-colors";

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

const PALETTE_KEYS: Array<keyof ThemeColors> = ["cyan", "magenta", "fg1"];

export function MathPlot({ args }: { args: Args | Record<string, unknown> }) {
  const ref = useRef<HTMLDivElement>(null);
  const colors = useThemeColors();
  const a = args as Args;
  const key = JSON.stringify({ args, t: colors.cyan + colors.fg2 });

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
          axis: true,
          showNavigation: false,
          showCopyright: false,
          keepAspectRatio: false,
          defaultAxes: {
            x: { strokeColor: colors.fg2, ticks: { strokeColor: colors.fg2, label: { color: colors.fg2 } } },
            y: { strokeColor: colors.fg2, ticks: { strokeColor: colors.fg2, label: { color: colors.fg2 } } },
          },
        } as Record<string, unknown>);

        // Transparent JSXGraph background — let SceneCard's bg show through.
        const inner = ref.current.querySelector("svg, .JXGtext")?.parentElement;
        if (inner) (inner as HTMLElement).style.background = "transparent";
        ref.current.style.background = "transparent";

        if (a.kind === "function") {
          plotFn(board, a, colors.cyan);
          (a.overlays ?? []).forEach((o, i) => {
            const colorKey = PALETTE_KEYS[(i + 1) % PALETTE_KEYS.length];
            plotFn(
              board,
              { ...a, expr: o.expr, params: { ...a.params, ...o.params } },
              String(colors[colorKey]),
            );
          });
        } else if (a.kind === "parametric") {
          plotParam(board, a, colors.cyan);
        }
      } catch (e) {
        console.error("MathPlot render error", e);
      }
    })();
    return () => { disposed = true; };
  }, [key]);

  return (
    <SceneCard caption={buildCaption(a)} className="my-4">
      <div ref={ref} className="w-full h-72 jxgbox" />
    </SceneCard>
  );
}

function buildCaption(a: Args): string {
  if (a.kind === "function") {
    const main = `y = ${a.expr}`;
    const overlays = (a.overlays ?? []).map((o) => o.expr).join(", ");
    const formula = overlays ? `${main}, ${overlays}` : main;
    return `Plot — ${formula} · ${a.variable} ∈ [${a.domain[0]}, ${a.domain[1]}]`;
  }
  return `Plot — x = ${a.x}, y = ${a.y} · t ∈ [${a.domain[0]}, ${a.domain[1]}]`;
}

function plotFn(board: unknown, a: FnArgs, stroke: string) {
  const fn = compile(a.expr);
  (board as { create: (t: string, args: unknown[], opts: Record<string, unknown>) => unknown }).create(
    "functiongraph",
    [
      (v: number) => fn.evaluate({ ...(a.params ?? {}), [a.variable]: v }),
      a.domain[0], a.domain[1],
    ],
    { strokeWidth: 2, strokeColor: stroke },
  );
}

function plotParam(board: unknown, a: ParamArgs, stroke: string) {
  const fx = compile(a.x); const fy = compile(a.y);
  (board as { create: (t: string, args: unknown[], opts: Record<string, unknown>) => unknown }).create(
    "curve",
    [
      (t: number) => fx.evaluate({ ...(a.params ?? {}), [a.variable]: t }),
      (t: number) => fy.evaluate({ ...(a.params ?? {}), [a.variable]: t }),
      a.domain[0], a.domain[1],
    ],
    { strokeWidth: 2, strokeColor: stroke },
  );
}
