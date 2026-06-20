/**
 * FIG.08 HEAT ENGINES AND SADI CARNOT — pure-TS helpers.
 *
 * Sadi Carnot, Paris, 1824: *Réflexions sur la puissance motrice du feu*. He
 * asked whether there is a ceiling on how much work an engine can wring from a
 * given flow of heat, and found one — set by the two temperatures alone, not by
 * the machine or its working substance.
 *
 * A heat engine draws heat Q_h from a hot reservoir at T_h, converts some to
 * work W, and dumps the remainder Q_c into a cold reservoir at T_c. Its
 * efficiency is η = W/Q_h. The Carnot cycle — isothermal expansion, adiabatic
 * expansion, isothermal compression, adiabatic compression, all reversible —
 * achieves the maximum:
 *
 *   η_Carnot = 1 − T_c/T_h.
 *
 * This module is deliberately self-contained: it carries its own minimal
 * ideal-gas relations (PV = nRT, adiabatic TV^(γ−1) = const) rather than
 * importing a shared pv-plot helper, so it builds in isolation.
 *
 * Temperatures are absolute (kelvin). React-free, typed.
 */

/** Universal gas constant, J/(mol·K) (CODATA, exact since 2019 SI). */
export const R_GAS = 8.314462618;

/**
 * Carnot (maximum) efficiency of any engine running between two reservoirs:
 * η = 1 − T_c/T_h, with both temperatures in kelvin.
 *
 * @param tHot hot-reservoir temperature, K
 * @param tCold cold-reservoir temperature, K
 * @returns efficiency in [0, 1)
 * @throws RangeError unless 0 < tCold < tHot
 */
export function carnotEfficiency(tHot: number, tCold: number): number {
  if (tCold <= 0 || tHot <= 0) {
    throw new RangeError("temperatures must be positive (kelvin)");
  }
  if (tCold >= tHot) {
    throw new RangeError("require tCold < tHot");
  }
  return 1 - tCold / tHot;
}

/** A single corner of the Carnot cycle in the P–V plane. */
export interface CarnotState {
  /** Pressure, Pa. */
  p: number;
  /** Volume, m³. */
  v: number;
  /** Temperature, K. */
  t: number;
}

/** Parameters defining a concrete Carnot cycle for an ideal gas. */
export interface CarnotParams {
  /** Amount of gas, mol. */
  nMoles: number;
  /** Adiabatic index γ = C_p/C_v (e.g. 5/3 monatomic, 7/5 diatomic). */
  gamma: number;
  /** Hot-reservoir temperature, K. */
  tHot: number;
  /** Cold-reservoir temperature, K. */
  tCold: number;
  /** Starting volume V₁ at the top of the hot isotherm, m³. */
  vStart: number;
  /** Isothermal expansion ratio r = V₂/V₁ (> 1). */
  expansionRatio: number;
}

/**
 * The four corner states of the Carnot cycle, in cycle order:
 *
 *   1 → 2  isothermal expansion at T_h   (absorbs Q_h)
 *   2 → 3  adiabatic expansion           (T_h → T_c)
 *   3 → 4  isothermal compression at T_c (releases Q_c)
 *   4 → 1  adiabatic compression         (T_c → T_h)
 *
 * Volumes follow from PV = nRT and the adiabatic relation TV^(γ−1) = const.
 * The two adiabats force V₃/V₄ = V₂/V₁, so the cycle closes exactly.
 */
export function carnotCycleStates(params: CarnotParams): [
  CarnotState,
  CarnotState,
  CarnotState,
  CarnotState,
] {
  const { nMoles, gamma, tHot, tCold, vStart, expansionRatio } = params;
  if (nMoles <= 0 || vStart <= 0) {
    throw new RangeError("nMoles and vStart must be positive");
  }
  if (gamma <= 1) throw new RangeError("gamma must exceed 1");
  if (expansionRatio <= 1) throw new RangeError("expansionRatio must exceed 1");
  carnotEfficiency(tHot, tCold); // validates the temperatures

  const expo = 1 / (gamma - 1);
  const ratio = Math.pow(tHot / tCold, expo); // V₃/V₂ = V₄/V₁

  const v1 = vStart;
  const v2 = v1 * expansionRatio;
  const v3 = v2 * ratio;
  const v4 = v1 * ratio;

  const press = (t: number, v: number) => (nMoles * R_GAS * t) / v;

  return [
    { p: press(tHot, v1), v: v1, t: tHot },
    { p: press(tHot, v2), v: v2, t: tHot },
    { p: press(tCold, v3), v: v3, t: tCold },
    { p: press(tCold, v4), v: v4, t: tCold },
  ];
}

/** Energy accounting for one Carnot cycle. All heats/work in joules. */
export interface CarnotHeats {
  /** Heat absorbed from the hot reservoir, J (> 0). */
  qHot: number;
  /** Heat rejected to the cold reservoir, J (> 0). */
  qCold: number;
  /** Net work done by the gas over the cycle, J (> 0). */
  work: number;
  /** Efficiency W/Q_h, which equals 1 − T_c/T_h. */
  efficiency: number;
}

/**
 * Heat and work for a Carnot cycle. Only the isothermal legs exchange heat:
 *
 *   Q_h = nR·T_h·ln(V₂/V₁) = nR·T_h·ln r,
 *   Q_c = nR·T_c·ln(V₃/V₄) = nR·T_c·ln r,
 *   W   = Q_h − Q_c = nR·ln r·(T_h − T_c).
 *
 * Dividing, W/Q_h = (T_h − T_c)/T_h = 1 − T_c/T_h — the work readout and the
 * temperature formula agree by construction, the point of the cycle scene.
 */
export function carnotHeats(params: CarnotParams): CarnotHeats {
  const { nMoles, tHot, tCold, expansionRatio } = params;
  carnotCycleStates(params); // validates inputs
  const lnR = Math.log(expansionRatio);
  const qHot = nMoles * R_GAS * tHot * lnR;
  const qCold = nMoles * R_GAS * tCold * lnR;
  const work = qHot - qCold;
  return { qHot, qCold, work, efficiency: work / qHot };
}

/** A sampled point on a P–V curve. */
export interface PVPoint {
  /** Volume, m³. */
  v: number;
  /** Pressure, Pa. */
  p: number;
}

/**
 * Sample the closed P–V path of the cycle for drawing: each leg is traced from
 * its start state to its end state. Isotherms follow p = nRT/V; adiabats follow
 * p·V^γ = const. Returns 4·samplesPerLeg points, closing back on state 1.
 */
export function carnotPVPath(
  params: CarnotParams,
  samplesPerLeg = 48,
): PVPoint[] {
  if (samplesPerLeg < 2) throw new RangeError("need at least 2 samples per leg");
  const states = carnotCycleStates(params);
  const { gamma } = params;
  const out: PVPoint[] = [];

  for (let leg = 0; leg < 4; leg++) {
    const a = states[leg];
    const b = states[(leg + 1) % 4];
    const isothermal = a.t === b.t;
    const cAdiabat = a.p * Math.pow(a.v, gamma); // p·V^γ on adiabatic legs
    const last = leg === 3;
    const n = last ? samplesPerLeg : samplesPerLeg; // dense for all
    for (let i = 0; i < n; i++) {
      const f = i / (n - 1);
      const v = a.v + (b.v - a.v) * f;
      const p = isothermal
        ? (params.nMoles * R_GAS * a.t) / v
        : cAdiabat / Math.pow(v, gamma);
      out.push({ v, p });
    }
  }
  return out;
}

/** Inputs for the temperature–entropy rectangle. */
export interface TSRectParams {
  /** Hot-reservoir temperature, K. */
  tHot: number;
  /** Cold-reservoir temperature, K. */
  tCold: number;
  /** Entropy at the cold/compressed corner, J/K. */
  sLow: number;
  /** Entropy at the hot/expanded corner, J/K (> sLow). */
  sHigh: number;
}

/**
 * The Carnot cycle is a rectangle in the T–S plane: the isotherms are
 * horizontal lines at T_h and T_c, the reversible adiabats are vertical lines
 * (constant entropy). The enclosed area (S_high − S_low)(T_h − T_c) equals the
 * net work. Returns the four corners in cycle order, closing on the first.
 */
export function carnotTSRectangle(
  params: TSRectParams,
): [TSPoint, TSPoint, TSPoint, TSPoint] {
  const { tHot, tCold, sLow, sHigh } = params;
  if (sHigh <= sLow) throw new RangeError("require sHigh > sLow");
  carnotEfficiency(tHot, tCold);
  return [
    { s: sLow, t: tHot }, // start of hot isotherm
    { s: sHigh, t: tHot }, // end of hot isotherm
    { s: sHigh, t: tCold }, // end of adiabatic expansion
    { s: sLow, t: tCold }, // end of cold isotherm
  ];
}

/** A point in the temperature–entropy plane. */
export interface TSPoint {
  /** Entropy, J/K. */
  s: number;
  /** Temperature, K. */
  t: number;
}

/** Net work enclosed by a T–S rectangle: area = ΔS·ΔT. */
export function tsRectangleArea(params: TSRectParams): number {
  return (params.sHigh - params.sLow) * (params.tHot - params.tCold);
}

/** A real-world engine measured against its Carnot ceiling. */
export interface EngineComparison {
  /** Display name. */
  name: string;
  /** Measured real-world efficiency, fraction in [0, 1]. */
  actualEfficiency: number;
  /** Effective hot-side temperature, K. */
  tHot: number;
  /** Effective cold-side temperature, K. */
  tCold: number;
  /** Whether the device is genuinely a heat engine (bounded by Carnot). */
  isHeatEngine: boolean;
  /** One-line teaching note shown on hover. */
  note: string;
}

/** The Carnot ceiling for a comparison entry, 1 − T_c/T_h. */
export function carnotLimitOf(c: EngineComparison): number {
  return carnotEfficiency(c.tHot, c.tCold);
}

/**
 * Real engines against the Carnot limit. Every genuine heat engine sits below
 * its ceiling; muscle is included as the instructive exception — it is *not* a
 * heat engine (it converts chemical energy directly), so it sidesteps the
 * Carnot bound that body-vs-air temperatures would impose.
 */
export const ENGINE_COMPARISONS: readonly EngineComparison[] = [
  {
    name: "Coal power plant",
    actualEfficiency: 0.4,
    tHot: 810,
    tCold: 300,
    isHeatEngine: true,
    note: "Supercritical steam at ~540 °C; about 40% of the coal's heat reaches the grid, against a Carnot ceiling near 63%.",
  },
  {
    name: "Car engine",
    actualEfficiency: 0.25,
    tHot: 2300,
    tCold: 300,
    isHeatEngine: true,
    note: "Petrol burns near 2300 K, but friction, brief expansion, and hot exhaust leave only ~25% as motion.",
  },
  {
    name: "Steam turbine",
    actualEfficiency: 0.45,
    tHot: 820,
    tCold: 300,
    isHeatEngine: true,
    note: "A large turbine recovers ~45% — the closest mass-market machine to its Carnot limit.",
  },
  {
    name: "Human muscle",
    actualEfficiency: 0.25,
    tHot: 310,
    tCold: 295,
    isHeatEngine: false,
    note: "Not a heat engine: muscle converts chemical energy directly, sidestepping the Carnot limit (a mere ~5% between body heat and the air).",
  },
];
