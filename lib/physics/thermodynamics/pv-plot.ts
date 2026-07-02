/**
 * PV-DIAGRAM HELPERS — the shared geometry of the first/second-law branch.
 *
 * Clapeyron, 1834: take Carnot's prose and draw it. Pressure up, volume across,
 * every quasi-static process a curve, every cycle a closed loop, and the work a
 * gas does the *area under its path*. This module is the reusable engine behind
 * that picture — imported by the PV-diagram, cycle, isothermal/adiabatic, and
 * (later) Carnot-engine scenes, so it is deliberately general and scene-free.
 *
 * Three jobs:
 *
 * 1. Curve generators. Each canonical process — isobaric, isochoric, isothermal,
 *    adiabatic — is sampled from a start state to an end volume (or end pressure)
 *    as an array of {V, P} points ready to stroke on a canvas. They are written
 *    in terms of the *start state* rather than n and T, because nRT = P·V fixes
 *    the relevant constant and a renderer rarely has n to hand.
 *
 * 2. Work integrals. W = ∫ P dV is the area under a path; a cycle's net work
 *    ∮ P dV is the signed area it encloses. Both are computed numerically (the
 *    trapezoid / shoelace rules) so they apply to *any* path, not just the four
 *    analytic ones. Sign convention is the physics convention: V increasing
 *    (expansion) gives positive work done *by* the gas; a clockwise loop on the
 *    (V, P) plane gives positive net work — an engine.
 *
 * 3. Pixel mapping. A small affine map between data space (V, P) and canvas
 *    pixels, with the P axis inverted (pixels grow downward). Scenes use it to
 *    place points, strokes, and the shaded work area without re-deriving it.
 *
 * React-free, typed. SI units throughout (V in m³, P in Pa, work in J), though
 * every routine is unit-agnostic as long as the caller is consistent.
 */

import { R_GAS } from "@/lib/physics/thermodynamics/calorimetry";

export { R_GAS };

/** A state of the gas on the PV plane. */
export interface PvPoint {
  /** Volume (m³). */
  V: number;
  /** Pressure (Pa). */
  P: number;
}

/** The four canonical quasi-static processes. */
export type ProcessKind =
  | "isobaric"
  | "isochoric"
  | "isothermal"
  | "adiabatic";

/** Human labels for the four processes. */
export const PROCESS_LABELS: Record<ProcessKind, string> = {
  isobaric: "isobaric (P constant)",
  isochoric: "isochoric (V constant)",
  isothermal: "isothermal (T constant)",
  adiabatic: "adiabatic (Q = 0)",
};

/** Pressure of n moles of ideal gas at temperature T in volume V: P = nRT/V. */
export function idealPressure(n: number, T: number, V: number): number {
  if (V <= 0) throw new RangeError("volume must be positive");
  return (n * R_GAS * T) / V;
}

/** Temperature of n moles of ideal gas at the state (P, V): T = PV/(nR). */
export function idealTemperature(n: number, P: number, V: number): number {
  if (n <= 0) throw new RangeError("mole count must be positive");
  return (P * V) / (n * R_GAS);
}

// ── Curve generators ────────────────────────────────────────────────────────
//
// Each returns `steps + 1` points from the start state to the end state,
// inclusive of both ends. `steps` controls smoothness only.

function assertSteps(steps: number): void {
  if (!Number.isFinite(steps) || steps < 1) {
    throw new RangeError("steps must be a positive integer");
  }
}

/** Isobaric leg: pressure held at `start.P`, volume swept to `V2`. */
export function isobaricCurve(
  start: PvPoint,
  V2: number,
  steps = 48,
): PvPoint[] {
  assertSteps(steps);
  const out: PvPoint[] = [];
  for (let i = 0; i <= steps; i++) {
    const V = start.V + ((V2 - start.V) * i) / steps;
    out.push({ V, P: start.P });
  }
  return out;
}

/** Isochoric leg: volume held at `start.V`, pressure swept to `P2`. */
export function isochoricCurve(
  start: PvPoint,
  P2: number,
  steps = 48,
): PvPoint[] {
  assertSteps(steps);
  const out: PvPoint[] = [];
  for (let i = 0; i <= steps; i++) {
    const P = start.P + ((P2 - start.P) * i) / steps;
    out.push({ V: start.V, P });
  }
  return out;
}

/**
 * Isothermal leg: PV = const = start.P·start.V (a hyperbola). Volume swept to
 * `V2`; pressure follows P(V) = P₁V₁ / V.
 */
export function isothermalCurve(
  start: PvPoint,
  V2: number,
  steps = 48,
): PvPoint[] {
  assertSteps(steps);
  if (start.V <= 0 || V2 <= 0) throw new RangeError("volumes must be positive");
  const c = start.P * start.V;
  const out: PvPoint[] = [];
  for (let i = 0; i <= steps; i++) {
    const V = start.V + ((V2 - start.V) * i) / steps;
    out.push({ V, P: c / V });
  }
  return out;
}

/**
 * Adiabatic leg: PVᵞ = const = start.P·start.Vᵞ (a steeper hyperbola). Volume
 * swept to `V2`; pressure follows P(V) = P₁ (V₁/V)ᵞ.
 *
 * @param gamma adiabatic exponent γ = C_p/C_v (e.g. 5/3 monatomic, 7/5 diatomic)
 */
export function adiabaticCurve(
  start: PvPoint,
  V2: number,
  gamma: number,
  steps = 48,
): PvPoint[] {
  assertSteps(steps);
  if (start.V <= 0 || V2 <= 0) throw new RangeError("volumes must be positive");
  if (gamma <= 1) throw new RangeError("gamma must exceed 1");
  const out: PvPoint[] = [];
  for (let i = 0; i <= steps; i++) {
    const V = start.V + ((V2 - start.V) * i) / steps;
    out.push({ V, P: start.P * Math.pow(start.V / V, gamma) });
  }
  return out;
}

/**
 * Dispatch a process curve by kind. For isobaric/isothermal/adiabatic the
 * sweep target is a volume `V2`; for isochoric it is a pressure `P2` (pass it
 * as the `target`). `gamma` is required only for the adiabat.
 */
export function processCurve(
  kind: ProcessKind,
  start: PvPoint,
  target: number,
  opts: { gamma?: number; steps?: number } = {},
): PvPoint[] {
  const steps = opts.steps ?? 48;
  switch (kind) {
    case "isobaric":
      return isobaricCurve(start, target, steps);
    case "isochoric":
      return isochoricCurve(start, target, steps);
    case "isothermal":
      return isothermalCurve(start, target, steps);
    case "adiabatic": {
      if (opts.gamma === undefined) {
        throw new Error("adiabatic process needs a gamma");
      }
      return adiabaticCurve(start, target, opts.gamma, steps);
    }
  }
}

// ── Work integrals ──────────────────────────────────────────────────────────

/**
 * Work done *by* the gas along a path: W = ∫ P dV, by the trapezoid rule over
 * the supplied points. Positive when the net motion is expansion (V increasing),
 * negative for compression. Endpoint order matters; the path is integrated as
 * given.
 */
export function workUnderCurve(points: readonly PvPoint[]): number {
  if (points.length < 2) return 0;
  let w = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    w += ((a.P + b.P) / 2) * (b.V - a.V);
  }
  return w;
}

/**
 * Net work of a closed cycle: ∮ P dV, the signed area the loop encloses, by the
 * shoelace formula. The loop is closed automatically (last point joined to the
 * first). With V on the horizontal axis and P on the vertical, a **clockwise**
 * loop returns a **positive** value — net work out, a heat engine — and a
 * counter-clockwise loop a negative value — net work in, a refrigerator.
 */
export function cycleNetWork(loop: readonly PvPoint[]): number {
  if (loop.length < 3) return 0;
  let twiceArea = 0;
  for (let i = 0; i < loop.length; i++) {
    const a = loop[i];
    const b = loop[(i + 1) % loop.length];
    // ∮ P dV via the trapezoid/shoelace identity; clockwise ⟹ positive.
    twiceArea += (a.P + b.P) * (b.V - a.V);
  }
  return twiceArea / 2;
}

// ── Pixel mapping ───────────────────────────────────────────────────────────

/** Data-space domain shown on the plot. */
export interface PvDomain {
  vMin: number;
  vMax: number;
  pMin: number;
  pMax: number;
}

/** A pixel rectangle (the plot area inside any axis padding). */
export interface PixelRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** An affine map between data space (V, P) and canvas pixels. */
export interface PvMapping {
  /** Data point → pixel coordinates (P axis inverted). */
  toPx(point: PvPoint): { x: number; y: number };
  /** Pixel coordinates → data point. */
  toData(x: number, y: number): PvPoint;
  /** The domain and rect this mapping was built from. */
  domain: PvDomain;
  rect: PixelRect;
}

/**
 * Build the affine map for a PV plot. Volume increases left→right; pressure
 * increases bottom→top (so pixel-y is inverted). Both axes are linear.
 */
export function createPvMapping(domain: PvDomain, rect: PixelRect): PvMapping {
  const { vMin, vMax, pMin, pMax } = domain;
  const vSpan = vMax - vMin || 1;
  const pSpan = pMax - pMin || 1;
  return {
    domain,
    rect,
    toPx(point: PvPoint) {
      const x = rect.left + ((point.V - vMin) / vSpan) * rect.width;
      const y = rect.top + (1 - (point.P - pMin) / pSpan) * rect.height;
      return { x, y };
    },
    toData(x: number, y: number) {
      const V = vMin + ((x - rect.left) / rect.width) * vSpan;
      const P = pMin + (1 - (y - rect.top) / rect.height) * pSpan;
      return { V, P };
    },
  };
}

/**
 * Evenly spaced tick values across an inclusive [min, max] range — handy for
 * drawing axis gridlines. Returns `count + 1` values.
 */
export function axisTicks(min: number, max: number, count = 4): number[] {
  if (count < 1) throw new RangeError("count must be ≥ 1");
  const out: number[] = [];
  for (let i = 0; i <= count; i++) out.push(min + ((max - min) * i) / count);
  return out;
}
