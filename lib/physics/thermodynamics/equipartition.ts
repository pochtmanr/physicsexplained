/**
 * FIG.17 EQUIPARTITION AND DEGREES OF FREEDOM — pure-TS helpers.
 *
 * Maxwell's equipartition theorem (1860): in thermal equilibrium every
 * *quadratic* degree of freedom in the energy carries an average of ½kT. Count
 * the quadratic terms f and the whole thermodynamics of an ideal substance
 * follows:
 *
 *   ⟨E⟩ = (f/2) N k_B T          internal energy
 *   C_v = (f/2) N k_B            heat capacity at constant volume
 *   γ   = C_p/C_v = (f+2)/f      adiabatic exponent
 *
 * Degrees of freedom: monatomic gas f = 3 (translation only); diatomic gas
 * f = 5 at room temperature (+2 rotational), rising to f = 7 when vibration
 * unfreezes; a crystalline solid f = 6 per atom (3 kinetic + 3 potential),
 * giving the Dulong–Petit value C_v = 3R.
 *
 * The theorem also *fails*, and each failure is a crack through which quantum
 * mechanics enters. The most legible failure is the heat capacity of H₂, which
 * climbs a staircase as temperature rises and successive modes thaw out:
 * (3/2)R below ~100 K, (5/2)R around room temperature, (7/2)R above ~1000 K.
 * `cvOfT` models that staircase by switching each quantum mode on with an
 * Einstein activation factor of its characteristic temperature.
 *
 * SI units: temperatures in kelvin, heat capacities in J/(mol·K). React-free.
 */

/** Universal gas constant, J/(mol·K) (CODATA, exact since the 2019 SI). */
export const R_GAS = 8.314462618;

/** Boltzmann constant, J/K (exact since the 2019 SI). */
export const K_B = 1.380649e-23;

/** Molar heat capacity at constant volume from f quadratic DOF: (f/2)R. */
export function cvMolar(f: number): number {
  return (f / 2) * R_GAS;
}

/** Adiabatic exponent γ = C_p/C_v = (f+2)/f. */
export function gamma(f: number): number {
  return (f + 2) / f;
}

/** Average energy per molecule with f quadratic DOF: (f/2)k_BT  [J]. */
export function energyPerMolecule(f: number, T: number): number {
  return (f / 2) * K_B * T;
}

/**
 * Einstein heat-capacity factor for a single quantum mode of characteristic
 * temperature θ, normalised so it saturates at 1 (one mode = +R per mole):
 *
 *   x = θ/T,   c(x) = x² e^x / (e^x − 1)²
 *
 * Monotonically increasing in T: → 0 as T → 0 (mode frozen), → 1 as T → ∞
 * (mode fully classical). Numerically guarded for large and small x.
 */
export function einsteinFactor(theta: number, T: number): number {
  if (T <= 0) return 0;
  const x = theta / T;
  if (x < 1e-6) return 1; // T ≫ θ: fully thawed
  if (x > 40) return x * x * Math.exp(-x); // (1 − e^−x)² ≈ 1; avoids overflow
  const ex = Math.exp(x);
  const d = ex - 1;
  return (x * x * ex) / (d * d);
}

/** Characteristic rotational temperature of H₂ (the lower step), K. */
export const THETA_ROT_H2 = 85.4;

/** Characteristic vibrational temperature of H₂ (the upper step), K. */
export const THETA_VIB_H2 = 6332;

/**
 * Molar heat capacity C_v(T) of hydrogen gas, J/(mol·K), as a smooth staircase.
 *
 *   C_v/R = 3/2  (translation, always on)
 *         + einsteinFactor(θ_rot, T)   (2 rotational DOF → +R when thawed)
 *         + einsteinFactor(θ_vib, T)   (2 vibrational DOF → +R when thawed)
 *
 * Treating rotation as a single Einstein mode is a teaching simplification (the
 * true rotational curve has a small overshoot) but it reproduces the (3/2)R →
 * (5/2)R → (7/2)R staircase and is monotonically non-decreasing in T.
 */
export function cvOfT(T: number): number {
  const perR = 1.5 + einsteinFactor(THETA_ROT_H2, T) + einsteinFactor(THETA_VIB_H2, T);
  return perR * R_GAS;
}

/** A degrees-of-freedom case for the scene readouts. */
export interface DofCase {
  /** Display name. */
  name: string;
  /** Quadratic degrees of freedom. */
  f: number;
  /** One-line description of where the DOF come from. */
  note: string;
}

/** The three canonical cases shown in the degrees-of-freedom scene. */
export const DOF_CASES: readonly DofCase[] = [
  { name: "He (monatomic)", f: 3, note: "3 translational" },
  { name: "N₂ (diatomic, room T)", f: 5, note: "3 translational + 2 rotational" },
  { name: "N₂ (diatomic, hot)", f: 7, note: "+ 2 vibrational" },
  { name: "Crystal atom", f: 6, note: "3 kinetic + 3 potential (Dulong–Petit)" },
];
