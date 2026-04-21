/**
 * Standing waves and modes.
 *
 * Analytic eigenmodes for three classical boundary-value problems:
 *   1. A string fixed at both ends — y_n(x, t) = sin(n π x / L) cos(ω_n t),
 *      ω_n = n π c / L.
 *   2. A square membrane fixed on its boundary —
 *      y_{m,n}(x, y) = sin(m π x / L) sin(n π y / L).
 *      Eigenfrequencies go as sqrt(m² + n²).
 *   3. Air columns in open and closed organ pipes — harmonic series
 *      differ: open-open has all integers, closed-open has only odd ones.
 *
 * Plus the Fourier decomposition that started it all: any shape f(x)
 * that vanishes at both ends of [0, L] can be written as
 *
 *   f(x) = Σ b_n sin(n π x / L),   b_n = (2/L) ∫₀ᴸ f(x) sin(n π x / L) dx.
 *
 * Everything here is analytic or a short sum — no PDE solves.
 */

/** Shape of a single string eigenmode at amplitude 1, no time dependence. */
export function stringMode(x: number, n: number, L: number): number {
  return Math.sin((n * Math.PI * x) / L);
}

/**
 * Angular frequency of the nth mode of a string fixed at both ends.
 * c is the wave speed on the string (depends on tension and mass density).
 */
export function stringModeOmega(n: number, L: number, c: number): number {
  return (n * Math.PI * c) / L;
}

/** Frequency in Hz of the nth mode. */
export function stringModeFrequency(n: number, L: number, c: number): number {
  return (n * c) / (2 * L);
}

/**
 * Time-dependent mode: y_n(x, t) = A sin(n π x / L) cos(ω_n t + φ).
 */
export function stringModeAt(
  x: number,
  t: number,
  n: number,
  L: number,
  c: number,
  amplitude = 1,
  phase = 0,
): number {
  const k = (n * Math.PI) / L;
  const omega = stringModeOmega(n, L, c);
  return amplitude * Math.sin(k * x) * Math.cos(omega * t + phase);
}

/**
 * x-coordinates of nodes for mode n on a string of length L.
 * Endpoints are always nodes; mode n adds (n - 1) interior nodes.
 */
export function stringNodes(n: number, L: number): number[] {
  const xs: number[] = [];
  for (let i = 0; i <= n; i++) xs.push((i * L) / n);
  return xs;
}

/**
 * Fourier-sine coefficient of the nth mode for the triangular plucked-string
 * shape with the pluck at fractional position p ∈ (0, 1) and peak height 1.
 *
 * Analytic result (a classic Bernoulli/Fourier exercise):
 *   b_n = 2 / (n² π² p (1 − p)) · sin(n π p).
 *
 * Missing modes fall out naturally — a pluck at the midpoint (p = 0.5)
 * kills every even harmonic.
 */
export function pluckedStringCoefficient(n: number, p: number): number {
  if (n < 1) return 0;
  if (p <= 0 || p >= 1) return 0;
  const prefactor = 2 / (n * n * Math.PI * Math.PI * p * (1 - p));
  return prefactor * Math.sin(n * Math.PI * p);
}

/**
 * Reconstruct the plucked-string shape from the first N Fourier components.
 * Returns y(x) at normalised position s = x / L ∈ [0, 1].
 */
export function pluckedStringShape(
  s: number,
  p: number,
  N: number,
): number {
  let y = 0;
  for (let n = 1; n <= N; n++) {
    const bn = pluckedStringCoefficient(n, p);
    y += bn * Math.sin(n * Math.PI * s);
  }
  return y;
}

/**
 * Exact triangular pluck profile (the shape the infinite series converges to).
 * Peak at s = p with height 1, linear otherwise, zero at s = 0, 1.
 */
export function triangularPluck(s: number, p: number): number {
  if (s <= 0 || s >= 1) return 0;
  if (s < p) return s / p;
  return (1 - s) / (1 - p);
}

// ---------- Square membrane (Chladni square plate approximation) ----------

/** Amplitude of eigenmode (m, n) on the unit square at (x, y) ∈ [0, 1]². */
export function squareMembraneMode(
  x: number,
  y: number,
  m: number,
  n: number,
): number {
  return Math.sin(m * Math.PI * x) * Math.sin(n * Math.PI * y);
}

/**
 * Chladni-style mode on a free square plate, modelled as the symmetric
 * superposition of two clamped-membrane eigenmodes:
 *
 *   φ_{m,n}(x, y) = sin(m π x) sin(n π y) − sin(n π x) sin(m π y).
 *
 * This is the standard toy form used for Chladni-pattern visuals — the
 * nodal lines are exact for this combined eigenfunction and match the
 * symmetric patterns Chladni himself drew. For m = n the function is
 * identically zero, so the caller should pick m ≠ n.
 */
export function chladniSquareMode(
  x: number,
  y: number,
  m: number,
  n: number,
): number {
  return (
    Math.sin(m * Math.PI * x) * Math.sin(n * Math.PI * y) -
    Math.sin(n * Math.PI * x) * Math.sin(m * Math.PI * y)
  );
}

/**
 * Eigenfrequency of (m, n) mode on a square membrane of side L at wave speed c.
 * ω = (π c / L) √(m² + n²).
 */
export function squareMembraneOmega(
  m: number,
  n: number,
  L: number,
  c: number,
): number {
  return ((Math.PI * c) / L) * Math.sqrt(m * m + n * n);
}

// ---------- Organ pipes ----------

export type PipeKind = "open-open" | "closed-open";

/**
 * Harmonics a pipe supports. The fundamental frequency differs by the
 * boundary conditions at the ends:
 *
 *   open–open pipe:  f_n = n c / (2 L),   n = 1, 2, 3, 4, …
 *   closed–open pipe: f_n = (2n − 1) c / (4 L), n = 1, 2, 3, … (odd only)
 *
 * Returns the first `count` harmonic frequencies in Hz.
 * c is sound speed (≈ 343 m/s at 20 °C).
 */
export function pipeHarmonics(
  kind: PipeKind,
  L: number,
  c: number,
  count: number,
): number[] {
  const out: number[] = [];
  if (kind === "open-open") {
    for (let n = 1; n <= count; n++) out.push((n * c) / (2 * L));
  } else {
    for (let n = 1; n <= count; n++) out.push(((2 * n - 1) * c) / (4 * L));
  }
  return out;
}

/**
 * Fundamental frequency of a pipe.
 */
export function pipeFundamental(kind: PipeKind, L: number, c: number): number {
  return pipeHarmonics(kind, L, c, 1)[0]!;
}
