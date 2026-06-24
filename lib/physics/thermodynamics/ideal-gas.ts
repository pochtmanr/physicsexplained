/**
 * FIG.14 THE IDEAL GAS LAW — shared pure-TS helpers for the kinetic-theory
 * module. Later sprint sessions import this file, so keep it general.
 *
 * Three centuries of laboratory arithmetic collapse into one line:
 *
 *   PV = nRT = N k_B T
 *
 * - Boyle's law (1662): at fixed T, PV = const.
 * - Charles's law (≈1787): at fixed P, V ∝ T, the straight line extrapolating
 *   to V = 0 at −273.15 °C — the first hint of absolute zero.
 * - Avogadro (1811): equal volumes at equal P, T hold equal numbers of
 *   molecules; one mole is N_A = 6.022×10²³ of them.
 * - Combined: R = 8.314 J/(mol·K) is the same for every gas at low density.
 *
 * Real gases deviate. The compressibility factor Z = PV/(nRT) measures the
 * deviation: Z = 1 is ideal, Z < 1 where attraction dominates (moderate P),
 * Z > 1 where the finite molecular size dominates (high P). The van der Waals
 * equation supplies the leading correction.
 *
 * SI units throughout: P in pascals, V in m³, T in kelvin, n in moles, N in
 * molecules. React-free, typed.
 */

/** Universal gas constant, J/(mol·K) (CODATA, exact since the 2019 SI). */
export const R_GAS = 8.314462618;

/** Boltzmann constant, J/K (exact since the 2019 SI). */
export const K_B = 1.380649e-23;

/** Avogadro constant, 1/mol (exact since the 2019 SI). R = N_A·k_B. */
export const N_A = 6.02214076e23;

/** Absolute zero on the Celsius scale, °C — where Charles's line hits V = 0. */
export const ABSOLUTE_ZERO_C = -273.15;

/** Pressure of n moles of ideal gas, PV = nRT ⇒ P = nRT/V  [Pa]. */
export function idealPressure(n: number, T: number, V: number): number {
  return (n * R_GAS * T) / V;
}

/** Volume of n moles of ideal gas at P, T: V = nRT/P  [m³]. */
export function idealVolume(n: number, P: number, T: number): number {
  return (n * R_GAS * T) / P;
}

/** Molecular form: pressure of N molecules, PV = Nk_BT ⇒ P = Nk_BT/V  [Pa]. */
export function idealPressureFromN(N: number, T: number, V: number): number {
  return (N * K_B * T) / V;
}

/**
 * Boyle isotherm: at fixed temperature the product PV is constant, so
 * P(V) = P_ref·V_ref / V. Returns the pressure at volume V given a reference
 * (P_ref, V_ref) point on the same isotherm.
 */
export function boylePressure(pRef: number, vRef: number, V: number): number {
  return (pRef * vRef) / V;
}

/**
 * Charles's law: at fixed pressure V ∝ T in *absolute* temperature. Given a
 * reference volume at a reference Celsius temperature, return the volume at a
 * new Celsius temperature. Extrapolating to V = 0 gives ABSOLUTE_ZERO_C.
 */
export function charlesVolumeCelsius(
  vRef: number,
  tRefCelsius: number,
  tCelsius: number,
): number {
  const tRefK = tRefCelsius - ABSOLUTE_ZERO_C;
  const tK = tCelsius - ABSOLUTE_ZERO_C;
  return (vRef * tK) / tRefK;
}

/** Compressibility factor Z = PV/(nRT). Z = 1 for an ideal gas. */
export function compressibility(P: number, V: number, n: number, T: number): number {
  return (P * V) / (n * R_GAS * T);
}

/**
 * Parameters of the van der Waals equation of state,
 *   (P + a n²/V²)(V − n b) = nRT,
 * with `a` [Pa·m⁶/mol²] the cohesion term and `b` [m³/mol] the excluded volume.
 */
export interface VanDerWaalsGas {
  /** Display name. */
  name: string;
  /** Cohesion parameter a, Pa·m⁶/mol². */
  a: number;
  /** Excluded-volume parameter b, m³/mol. */
  b: number;
}

/** A few common gases, standard van der Waals constants (SI). */
export const VDW_GASES: readonly VanDerWaalsGas[] = [
  { name: "He", a: 0.00346, b: 23.8e-6 },
  { name: "H₂", a: 0.0248, b: 26.6e-6 },
  { name: "N₂", a: 0.137, b: 38.7e-6 },
  { name: "CO₂", a: 0.364, b: 42.7e-6 },
];

/**
 * van der Waals pressure for n moles in volume V at temperature T:
 *   P = nRT/(V − n b) − a n²/V².
 * The first term is the ideal pressure pushed up by the excluded volume
 * (repulsion); the second subtracts the inward pull of cohesion (attraction).
 */
export function vanDerWaalsPressure(
  gas: VanDerWaalsGas,
  n: number,
  T: number,
  V: number,
): number {
  return (n * R_GAS * T) / (V - n * gas.b) - (gas.a * n * n) / (V * V);
}

/**
 * Compressibility factor Z(P) of a van der Waals gas along an isotherm.
 * Computed parametrically: sweep molar volume Vm = V/n, evaluate the vdW
 * pressure, and form Z = P·Vm/(RT). Returns {P, Z} points ordered by molar
 * volume from `vmMax` down to `vmMin` (i.e. increasing pressure), suitable for
 * plotting Z versus P. This is the data behind the ideal-vs-real-gas scene.
 */
export function vdwIsotherm(
  gas: VanDerWaalsGas,
  T: number,
  opts: { vmMin?: number; vmMax?: number; steps?: number } = {},
): { P: number; Z: number }[] {
  const vmMin = opts.vmMin ?? 1.2 * gas.b; // stay above the singularity at Vm = b
  const vmMax = opts.vmMax ?? 4e-3; // ~roomy molar volume, low pressure
  const steps = opts.steps ?? 240;
  const out: { P: number; Z: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    // log-spaced in molar volume so the high-pressure end is well sampled
    const f = i / steps;
    const vm = vmMax * Math.pow(vmMin / vmMax, f);
    const P = (R_GAS * T) / (vm - gas.b) - gas.a / (vm * vm);
    if (P <= 0) continue;
    const Z = (P * vm) / (R_GAS * T);
    out.push({ P, Z });
  }
  return out;
}
