/**
 * FIG.21 FLUCTUATIONS AND DISSIPATION — the size of equilibrium fluctuations,
 * their 1/√N scaling, and Johnson–Nyquist thermal noise. Pure TS, SI units, no
 * React.
 *
 * In the canonical ensemble the energy is not fixed; it fluctuates, and the
 * variance of those fluctuations is itself a thermodynamic quantity tied to the
 * heat capacity:
 *
 *     ⟨(ΔE)²⟩ = k_B T² C_v
 *
 * The relative size of the wobble shrinks as 1/√N — invisible at N = 10²³,
 * dominant for a nanostructure. The same thermal randomness appears as a voltage
 * across any resistor (Johnson 1927, Nyquist 1928): V²_noise = 4 k_B T R Δf. It
 * is the first and simplest case of the fluctuation–dissipation theorem — the
 * very jiggling that also drove Brown's pollen.
 *
 * Reuses K_B from distributions.ts.
 */

import { K_B } from "@/lib/physics/thermodynamics/distributions";

/**
 * Variance of the energy of a canonical system, ⟨(ΔE)²⟩ = k_B T² C_v  [J²].
 * A remarkable identity: the *size* of equilibrium fluctuations (left) is fixed
 * by the *response* to heating (right, the heat capacity) — fluctuation and
 * dissipation, two faces of one coin. Requires C_v ≥ 0; returns ≥ 0.
 */
export function energyVariance(T: number, cv: number): number {
  return K_B * T * T * cv;
}

/** Standard deviation of the energy, √⟨(ΔE)²⟩  [J]. */
export function energyStdDev(T: number, cv: number): number {
  return Math.sqrt(energyVariance(T, cv));
}

/**
 * Relative energy fluctuation σ_E/⟨E⟩ of a monatomic ideal gas of N molecules,
 * = √(2/3N). The hallmark 1/√N law: quadrupling N halves the relative wobble.
 * For N = 10²³ it is ~10⁻¹², utterly negligible; for N = 100 it is a few
 * percent and rising. N must be ≥ 1.
 */
export function relativeEnergyFluctuation(N: number): number {
  return Math.sqrt(2 / (3 * N));
}

/**
 * The bare 1/√N scaling factor, exposed for scenes and tests that want the
 * generic law independent of any particular system. N must be ≥ 1.
 */
export function invSqrtN(N: number): number {
  return 1 / Math.sqrt(N);
}

/**
 * Johnson–Nyquist RMS noise voltage across a resistor R at temperature T over a
 * measurement bandwidth Δf:  V_rms = √(4 k_B T R Δf)  [V]. Independent of the
 * resistor's material or construction — it depends only on R, T and Δf, which is
 * why Nyquist could derive it from thermodynamics alone. Rises as √T and √R.
 */
export function johnsonNyquistVoltage(T: number, R: number, bandwidth: number): number {
  return Math.sqrt(4 * K_B * T * R * bandwidth);
}

/** Mean-square noise voltage V² = 4 k_B T R Δf  [V²] — the quantity Nyquist derived. */
export function johnsonNyquistVoltageSquared(
  T: number,
  R: number,
  bandwidth: number,
): number {
  return 4 * K_B * T * R * bandwidth;
}

/**
 * Maximum noise power a resistor can deliver to a matched load, P = k_B T Δf
 * [W] — independent of R. The thermodynamic noise floor of every amplifier.
 */
export function availableNoisePower(T: number, bandwidth: number): number {
  return K_B * T * bandwidth;
}
