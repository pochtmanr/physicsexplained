"use client";
import { useEffect, useRef } from "react";
import { compile, type EvalFunction } from "mathjs";
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
        // Derive the viewport from the actual plot so the x-axis matches the
        // domain the user asked for, and the y-axis is scaled to the sampled
        // range of the expression. Previously a fixed [-10, 6, 10, -6] box
        // clipped any domain outside [-10, 10] and flattened tall curves.
        const bbox = computeBoundingBox(a);
        const board = JXG.JSXGraph.initBoard(ref.current, {
          boundingbox: bbox,
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

// JSXGraph boundingbox = [xMin, yMax, xMax, yMin].
// Sample the plot over its domain to derive a viewport that actually contains
// it. Returns a sensible fallback if all samples fail to evaluate.
const SAMPLES = 200;
const Y_PAD_FRAC = 0.1;
const Y_MIN_HALFSPAN = 0.5; // Ensures constant functions still render with visible axes.
const FALLBACK_BBOX: [number, number, number, number] = [-10, 6, 10, -6];

function computeBoundingBox(a: Args): [number, number, number, number] {
  const [d0, d1] = a.domain;
  const xMin = Math.min(d0, d1);
  const xMax = Math.max(d0, d1);
  if (!Number.isFinite(xMin) || !Number.isFinite(xMax) || xMax === xMin) return FALLBACK_BBOX;

  try {
    if (a.kind === "function") {
      const fn = compile(a.expr);
      const overlays = (a.overlays ?? []).map((o) => compile(o.expr));
      const ys: number[] = [];
      sampleRange(xMin, xMax, (x) => {
        pushFiniteEval(ys, fn, { ...(a.params ?? {}), [a.variable]: x });
        overlays.forEach((ofn, i) => {
          const overlayParams = { ...(a.params ?? {}), ...(a.overlays?.[i].params ?? {}), [a.variable]: x };
          pushFiniteEval(ys, ofn, overlayParams);
        });
      });
      const { lo, hi } = padRange(ys);
      return [xMin, hi, xMax, lo];
    }

    // Parametric — derive both axes from sampled (x(t), y(t)).
    const fx = compile(a.x);
    const fy = compile(a.y);
    const xs: number[] = [];
    const ys: number[] = [];
    sampleRange(xMin, xMax, (t) => {
      pushFiniteEval(xs, fx, { ...(a.params ?? {}), [a.variable]: t });
      pushFiniteEval(ys, fy, { ...(a.params ?? {}), [a.variable]: t });
    });
    const x = padRange(xs);
    const y = padRange(ys);
    return [x.lo, y.hi, x.hi, y.lo];
  } catch {
    return FALLBACK_BBOX;
  }
}

function sampleRange(lo: number, hi: number, visit: (v: number) => void): void {
  const step = (hi - lo) / SAMPLES;
  for (let i = 0; i <= SAMPLES; i++) visit(lo + i * step);
}

function pushFiniteEval(out: number[], fn: EvalFunction, scope: Record<string, number>): void {
  try {
    const v = fn.evaluate(scope);
    if (typeof v === "number" && Number.isFinite(v)) out.push(v);
  } catch {
    // Divide-by-zero, domain errors, etc. — skip.
  }
}

function padRange(values: number[]): { lo: number; hi: number } {
  if (values.length === 0) return { lo: -1, hi: 1 };
  let lo = Infinity;
  let hi = -Infinity;
  for (const v of values) {
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  const span = hi - lo;
  if (span < Y_MIN_HALFSPAN * 2) {
    const mid = (hi + lo) / 2;
    lo = mid - Y_MIN_HALFSPAN;
    hi = mid + Y_MIN_HALFSPAN;
  } else {
    const pad = span * Y_PAD_FRAC;
    lo -= pad;
    hi += pad;
  }
  return { lo, hi };
}
