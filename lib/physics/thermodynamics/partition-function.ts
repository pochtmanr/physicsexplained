/**
 * FIG.19 THE PARTITION FUNCTION — the canonical partition function Z and the
 * thermodynamics that falls out of it by differentiation. Pure TS, SI units,
 * no React.
 *
 * For a system in thermal contact with a reservoir at temperature T (the
 * canonical ensemble), the probability of a microstate of energy E_i is the
 * Boltzmann distribution
 *
 *     p_i = exp(−βE_i) / Z ,     β = 1/k_BT ,
 *
 * and the normalising sum
 *
 *     Z = Σ_i exp(−βE_i)
 *
 * is the partition function — the generating function of statistical mechanics.
 * Every equilibrium observable is a derivative of ln Z:
 *
 *     F   = −k_BT ln Z                     (Helmholtz free energy)
 *     ⟨E⟩ = −∂ ln Z / ∂β = k_BT² ∂ ln Z/∂T (mean energy)
 *     S   = (⟨E⟩ − F)/T = k_B ln Z + ⟨E⟩/T (entropy)
 *     C_v = ∂⟨E⟩/∂T                         (heat capacity)
 *     P   = k_BT ∂ ln Z/∂V                  (pressure)
 *
 * This module supplies Z (and the observables) for the three textbook models —
 * the two-level system, the quantum harmonic oscillator, and the ideal gas —
 * plus generic differentiation helpers that turn any Z(T) into ⟨E⟩, S and C_v,
 * so a scene can demonstrate that Z really is the single generator.
 *
 * Reuses K_B (and the Boltzmann factor) from distributions.ts. The harmonic
 * oscillator results are reused by FIG.28 (heat capacity of solids).
 */

import { K_B } from "@/lib/physics/thermodynamics/distributions";

/** Reduced Planck constant ħ, J·s (exact since the 2019 SI). */
export const H_BAR = 1.054571817e-34;

/** Planck constant h, J·s (exact since the 2019 SI). */
export const H_PLANCK = 6.62607015e-34;

// ───────────────────────────────────────────────────────────────────────────
// Two-level system: a single degree of freedom with energies 0 and ε.
// The simplest non-trivial Z, and the origin of the Schottky anomaly — a hump
// in C_v(T) that appears whenever a system has a finite energy gap.
// ───────────────────────────────────────────────────────────────────────────

/** Partition function of a two-level system, Z = 1 + exp(−ε/k_BT). */
export function zTwoLevel(T: number, eps: number): number {
  return 1 + Math.exp(-eps / (K_B * T));
}

/**
 * Populations [p₀, p₁] of the ground (0) and excited (ε) levels from the
 * Boltzmann factors. They sum to 1, tend to [1, 0] as T → 0 (all in the
 * ground state) and to [½, ½] as T → ∞ (equal occupation — saturation).
 */
export function levelPopulationsTwoLevel(T: number, eps: number): [number, number] {
  const b = Math.exp(-eps / (K_B * T));
  const Z = 1 + b;
  return [1 / Z, b / Z];
}

/** Mean energy ⟨E⟩ = ε·exp(−βε)/(1+exp(−βε)). Tends to 0 (cold) and ε/2 (hot). */
export function meanEnergyTwoLevel(T: number, eps: number): number {
  const b = Math.exp(-eps / (K_B * T));
  return (eps * b) / (1 + b);
}

/**
 * Heat capacity C_v = k_B x² eˣ/(eˣ+1)² with x = ε/k_BT — the Schottky anomaly.
 * It vanishes at both extremes (no states to excite when cold, both levels
 * saturated when hot) and peaks near x ≈ 2.40, i.e. k_BT ≈ 0.42 ε.
 */
export function cvTwoLevel(T: number, eps: number): number {
  const x = eps / (K_B * T);
  const ex = Math.exp(x);
  const denom = (ex + 1) * (ex + 1);
  return (K_B * x * x * ex) / denom;
}

// ───────────────────────────────────────────────────────────────────────────
// Quantum harmonic oscillator: equally spaced levels E_n = nħω (n = 0, 1, …),
// measured from the ground state. The geometric series sums in closed form;
// the results are the Planck/Einstein heat-capacity formulas reused by FIG.28.
// ───────────────────────────────────────────────────────────────────────────

/** Partition function Z = 1/(1 − exp(−ħω/k_BT)) (energies measured from n=0). */
export function zHarmonic(T: number, omega: number): number {
  const x = (H_BAR * omega) / (K_B * T);
  return 1 / (1 - Math.exp(-x));
}

/** Mean energy ⟨E⟩ = ħω/(exp(ħω/k_BT) − 1) (Planck). Tends to k_BT as T → ∞. */
export function meanEnergyHarmonic(T: number, omega: number): number {
  const hw = H_BAR * omega;
  return hw / (Math.exp(hw / (K_B * T)) - 1);
}

/**
 * Heat capacity C_v = k_B x² eˣ/(eˣ−1)² with x = ħω/k_BT — the Einstein curve.
 * It rises to the classical equipartition value k_B per oscillator at high T
 * and is exponentially frozen out (∝ x²e⁻ˣ) at low T, the quantum signature
 * that resolved the specific-heat puzzle of solids.
 */
export function cvHarmonic(T: number, omega: number): number {
  const x = (H_BAR * omega) / (K_B * T);
  const ex = Math.exp(x);
  const denom = (ex - 1) * (ex - 1);
  return (K_B * x * x * ex) / denom;
}

// ───────────────────────────────────────────────────────────────────────────
// Ideal gas: the translational partition function and the Sackur–Tetrode
// entropy. The thermal de Broglie wavelength λ sets the only length scale.
// ───────────────────────────────────────────────────────────────────────────

/** Thermal de Broglie wavelength λ = h/√(2πmk_BT)  [m]; shrinks as √T grows. */
export function thermalWavelength(T: number, m: number): number {
  return H_PLANCK / Math.sqrt(2 * Math.PI * m * K_B * T);
}

/**
 * Single-particle translational partition function z₁ = V/λ³ — the number of
 * thermal de Broglie cells that fit in the box. The N-particle partition
 * function is Z = z₁ᴺ/N! (the Gibbs factor that makes entropy extensive).
 */
export function zIdealTranslational(T: number, m: number, V: number): number {
  const lam = thermalWavelength(T, m);
  return V / (lam * lam * lam);
}

/**
 * Sackur–Tetrode entropy of a monatomic ideal gas:
 *   S = N k_B [ ln(V / (N λ³)) + 5/2 ].
 * The first absolute entropy ever written for a gas, and a direct triumph of
 * counting microstates with Z. Requires V/(Nλ³) > 0; valid in the dilute,
 * non-degenerate regime V ≫ Nλ³.
 */
export function sackurTetrode(T: number, m: number, V: number, N: number): number {
  const lam = thermalWavelength(T, m);
  return N * K_B * (Math.log(V / (N * lam * lam * lam)) + 2.5);
}

// ───────────────────────────────────────────────────────────────────────────
// Generic observables from a partition function — "Z is the generator."
// Given ln Z as a function of T, every observable is a derivative. These let a
// scene drive F, ⟨E⟩, S and C_v for ANY model from one callback, and let the
// tests confirm the analytic two-level/oscillator results from first principles.
// ───────────────────────────────────────────────────────────────────────────

/** Helmholtz free energy F = −k_BT ln Z from a value of Z. */
export function freeEnergyFromZ(Z: number, T: number): number {
  return -K_B * T * Math.log(Z);
}

/**
 * Mean energy ⟨E⟩ = k_BT² d(ln Z)/dT by a centred finite difference. `lnZ` must
 * be defined in a neighbourhood of T; the step scales with T for stability.
 */
export function meanEnergyFromLnZ(lnZ: (T: number) => number, T: number): number {
  const dT = T * 1e-5;
  const slope = (lnZ(T + dT) - lnZ(T - dT)) / (2 * dT);
  return K_B * T * T * slope;
}

/** Entropy S = k_B ln Z + ⟨E⟩/T from a ln Z callback. */
export function entropyFromLnZ(lnZ: (T: number) => number, T: number): number {
  const E = meanEnergyFromLnZ(lnZ, T);
  return K_B * lnZ(T) + E / T;
}

/** Heat capacity C_v = d⟨E⟩/dT by a centred finite difference of ⟨E⟩(T). */
export function heatCapacityFromLnZ(lnZ: (T: number) => number, T: number): number {
  const dT = T * 1e-3;
  return (meanEnergyFromLnZ(lnZ, T + dT) - meanEnergyFromLnZ(lnZ, T - dT)) / (2 * dT);
}
