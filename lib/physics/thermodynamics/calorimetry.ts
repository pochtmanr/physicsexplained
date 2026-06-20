/**
 * FIG.03 HEAT CAPACITY AND CALORIMETRY — pure-TS helpers.
 *
 * Joseph Black, Glasgow, 1760s: a pound of water and a pound of mercury given
 * equal heat end up at very different temperatures — the mercury some thirty
 * times hotter. Different substances have different *capacities* for heat.
 *
 * - Specific heat capacity c [J/(g·K)] — the heat to raise one gram by one
 *   kelvin. Water's 4.186 is anomalously large (hydrogen bonding); lead's is
 *   0.13. Q = m c ΔT.
 * - Molar heat capacity [J/(mol·K)] — per mole rather than per gram. The
 *   Dulong–Petit law: most simple crystalline solids sit near 3R ≈ 24.9, a
 *   classical-equipartition result (preview of FIG.17).
 * - C_v vs C_p — for an ideal gas they differ by exactly R, because a gas
 *   heated at constant pressure also does expansion work: C_p − C_v = R.
 * - Method of mixtures — drop a hot solid into cool water in an insulated
 *   calorimeter; energy conservation fixes the final temperature.
 *
 * React-free, typed. Specific heats are in J/(g·K); masses in grams for the
 * mixture solver (only ratios matter, so any consistent mass unit works).
 */

/** Universal gas constant, J/(mol·K) (CODATA, exact since 2019 SI). */
export const R_GAS = 8.314462618;

/** Dulong–Petit molar heat capacity of a simple solid, ≈ 3R [J/(mol·K)]. */
export const DULONG_PETIT = 3 * R_GAS;

/** A tabulated substance with its specific heat and a teaching note. */
export interface Substance {
  /** Display name. */
  name: string;
  /** Specific heat capacity, J/(g·K). */
  specificHeat: number;
  /** One real-world consequence of this value. */
  consequence: string;
}

/**
 * Specific heats of ~8 common substances, J/(g·K). Values are the standard
 * textbook figures near room temperature. Water's entry dwarfs the metals —
 * the visual point of the bar-chart scene.
 */
export const SPECIFIC_HEATS: readonly Substance[] = [
  { name: "Water", specificHeat: 4.186, consequence: "Oceans buffer Earth's climate." },
  { name: "Ice", specificHeat: 2.09, consequence: "Glaciers warm slowly in spring." },
  { name: "Air", specificHeat: 1.005, consequence: "A light, fast-responding heat carrier." },
  { name: "Aluminium", specificHeat: 0.897, consequence: "Cookware heats and cools quickly." },
  { name: "Iron", specificHeat: 0.449, consequence: "A skillet heats fast and scorches." },
  { name: "Copper", specificHeat: 0.385, consequence: "Cores in pans spread heat evenly." },
  { name: "Mercury", specificHeat: 0.14, consequence: "A responsive thermometer fluid." },
  { name: "Lead", specificHeat: 0.13, consequence: "A musket ball warms in the hand." },
];

/**
 * Heat exchanged for a temperature change: Q = m c ΔT.
 *
 * @param mass mass, g
 * @param specificHeat c, J/(g·K)
 * @param deltaT temperature change, K (signed)
 * @returns heat, J (positive = absorbed)
 */
export function heat(mass: number, specificHeat: number, deltaT: number): number {
  if (mass < 0 || specificHeat <= 0) {
    throw new RangeError("mass ≥ 0 and specific heat > 0 required");
  }
  return mass * specificHeat * deltaT;
}

/**
 * Molar heat capacity from specific heat and molar mass:
 * C_molar = c · M, with c in J/(g·K) and M in g/mol → J/(mol·K).
 */
export function molarHeatCapacity(specificHeat: number, molarMass: number): number {
  if (specificHeat <= 0 || molarMass <= 0) {
    throw new RangeError("specific heat and molar mass must be positive");
  }
  return specificHeat * molarMass;
}

/** A body taking part in a mixture: mass, specific heat, initial temperature. */
export interface MixtureBody {
  /** Mass, g. */
  mass: number;
  /** Specific heat, J/(g·K). */
  specificHeat: number;
  /** Initial temperature, °C or K (consistent across the set). */
  temperature: number;
}

/**
 * Method of mixtures: the equilibrium temperature of an insulated mix.
 *
 * Conservation of energy, Σ mᵢ cᵢ (T_eq − Tᵢ) = 0, gives the heat-capacity-
 * weighted mean
 *
 *   T_eq = Σ (mᵢ cᵢ Tᵢ) / Σ (mᵢ cᵢ).
 *
 * For the two-body case this is the classic m_s c_s ΔT_s = m_w c_w ΔT_w.
 *
 * @param bodies the bodies brought into thermal contact
 * @returns the final shared temperature (same unit as inputs)
 * @throws Error for empty input or non-positive total heat capacity
 */
export function methodOfMixtures(bodies: readonly MixtureBody[]): number {
  if (bodies.length === 0) {
    throw new Error("methodOfMixtures: need at least one body");
  }
  let weighted = 0;
  let total = 0;
  for (const b of bodies) {
    const c = b.mass * b.specificHeat;
    if (c <= 0) {
      throw new Error("methodOfMixtures: each body needs positive m·c");
    }
    weighted += c * b.temperature;
    total += c;
  }
  return weighted / total;
}

// ── Ideal-gas C_v vs C_p ────────────────────────────────────────────────────

/** Molar C_v of an ideal gas with f active degrees of freedom: (f/2) R. */
export function cvIdeal(degreesOfFreedom: number): number {
  if (degreesOfFreedom <= 0) {
    throw new RangeError("degrees of freedom must be positive");
  }
  return (degreesOfFreedom / 2) * R_GAS;
}

/** Mayer's relation: C_p = C_v + R for an ideal gas. */
export function cpFromCv(cv: number): number {
  return cv + R_GAS;
}

/** Adiabatic index γ = C_p / C_v. */
export function gammaFromCv(cv: number): number {
  if (cv <= 0) throw new RangeError("C_v must be positive");
  return cpFromCv(cv) / cv;
}

/** Monatomic ideal gas: C_v = (3/2)R, C_p = (5/2)R, γ = 5/3. */
export const MONATOMIC = {
  cv: cvIdeal(3),
  cp: cpFromCv(cvIdeal(3)),
  gamma: gammaFromCv(cvIdeal(3)),
} as const;

/** Diatomic ideal gas at room T: C_v = (5/2)R, C_p = (7/2)R, γ = 7/5. */
export const DIATOMIC = {
  cv: cvIdeal(5),
  cp: cpFromCv(cvIdeal(5)),
  gamma: gammaFromCv(cvIdeal(5)),
} as const;
