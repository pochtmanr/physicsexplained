/**
 * Combinatorial multiplicity for statistical mechanics (FIG.11).
 *
 * A *macrostate* — "k of N coins show heads", "k of N molecules sit in the
 * left half of the box" — is realised by many *microstates*. The number of
 * microstates is the multiplicity Ω. For the two-state (left/right, heads/
 * tails) problem it is the binomial coefficient C(N, k), and the macrostate
 * probability is C(N, k) / 2ᴺ.
 *
 * Because N reaches 10²³ in real gases, C(N, k) and N! overflow IEEE doubles
 * almost immediately (170! is already Infinity). Everything here therefore
 * works in *log space* via the log-gamma function, and exposes the Gaussian
 * (de Moivre–Laplace) limit that the binomial collapses onto: a peak at
 * k = N/2 whose relative width shrinks like 1/√N, which is *why* large systems
 * sit so immovably at their most-probable macrostate.
 *
 * No React, no hidden state — pure functions, unit-tested.
 */

const LN_2 = Math.LN2;

/**
 * Lanczos approximation to ln Γ(x) for x > 0 (so lnFactorial(n) = lnGamma(n+1)).
 * Accurate to ~1e-12 relative, far more than any visualisation needs.
 */
export function lnGamma(x: number): number {
  // Lanczos g = 7, n = 9 coefficients.
  const g = 7;
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  if (x < 0.5) {
    // Reflection formula: Γ(x)Γ(1−x) = π / sin(πx).
    return (
      Math.log(Math.PI / Math.sin(Math.PI * x)) - lnGamma(1 - x)
    );
  }
  x -= 1;
  let a = c[0];
  const t = x + g + 0.5;
  for (let i = 1; i < g + 2; i++) {
    a += c[i] / (x + i);
  }
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

/** ln(n!) for non-negative integer n. */
export function lnFactorial(n: number): number {
  if (n < 0) throw new RangeError(`lnFactorial requires n ≥ 0, got ${n}`);
  return lnGamma(n + 1);
}

/**
 * ln C(N, k), the natural log of the binomial coefficient. Defined and finite
 * for all 0 ≤ k ≤ N even when C(N, k) itself overflows a double.
 */
export function lnBinomial(n: number, k: number): number {
  if (k < 0 || k > n) return -Infinity; // C = 0 ⇒ ln C = −∞
  return lnFactorial(n) - lnFactorial(k) - lnFactorial(n - k);
}

/**
 * C(N, k) as an exact-ish number. Returns `Infinity` once the true value
 * exceeds Number.MAX_VALUE (~1.8e308) — callers handling large N should use
 * {@link lnBinomial} instead.
 */
export function binomial(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  return Math.round(Math.exp(lnBinomial(n, k)));
}

/**
 * Probability of the macrostate "exactly k heads" (or k molecules on the
 * left) for N fair two-state objects: C(N, k) / 2ᴺ. Numerically stable for
 * arbitrarily large N because it never forms 2ᴺ directly.
 */
export function macrostateProbability(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  return Math.exp(lnBinomial(n, k) - n * LN_2);
}

/** Mean number on the left (or heads): N/2. */
export function occupancyMean(n: number): number {
  return n / 2;
}

/**
 * Standard deviation of the left-occupancy / heads count: √(N/4) = √N/2.
 * This is the absolute width of the peak; the *relative* width
 * σ/⟨k⟩ = 1/√N is what vanishes for macroscopic N.
 */
export function occupancyStdDev(n: number): number {
  return Math.sqrt(n / 4);
}

/** Relative fluctuation σ/⟨k⟩ = 1/√N — the headline number of FIG.11. */
export function relativeFluctuation(n: number): number {
  if (n <= 0) return Infinity;
  return 1 / Math.sqrt(n);
}

/**
 * The de Moivre–Laplace / Gaussian limit of the macrostate probability:
 *
 *   P(k) ≈ √(2 / (πN)) · exp(−2(k − N/2)² / N)
 *
 * (a normal density with mean N/2 and variance N/4). For N ≳ 30 this tracks
 * {@link macrostateProbability} to within a per-cent near the peak — the
 * curve the coin-toss histogram visibly snaps onto as N grows.
 */
export function gaussianProbability(n: number, k: number): number {
  const variance = n / 4;
  const norm = 1 / Math.sqrt(2 * Math.PI * variance);
  const dev = k - n / 2;
  return norm * Math.exp(-(dev * dev) / (2 * variance));
}
