/**
 * FIG.10 ENTROPY AS HEAT-OVER-TEMPERATURE — pure-TS helpers.
 *
 * Clausius, 1854: for any reversible cycle ∮ dQ/T = 0, so dQ_rev/T is an exact
 * differential — the differential of a state function he named entropy, S:
 *
 *   dS = dQ_rev/T.
 *
 * Entropy change between two states is ∫ dQ_rev/T along *any* reversible path
 * joining them. This module gives ΔS for the canonical ideal-gas processes, the
 * entropy of mixing, and ΔS_universe for reversible versus irreversible heat
 * transfer — the quantity that holds steady on reversible trips and grows on
 * every other one.
 *
 * Self-contained; temperatures absolute (kelvin), entropies in J/K.
 */

/** Universal gas constant, J/(mol·K). */
export const R_GAS = 8.314462618;

/**
 * Isothermal reversible expansion of an ideal gas: ΔS = nR·ln(V₂/V₁).
 * Positive on expansion, negative on compression; the surroundings change by
 * the opposite amount, so ΔS_universe = 0 for the reversible process.
 */
export function dsIsothermal(n: number, v1: number, v2: number): number {
  if (n <= 0 || v1 <= 0 || v2 <= 0) {
    throw new RangeError("n and volumes must be positive");
  }
  return n * R_GAS * Math.log(v2 / v1);
}

/** Constant-volume heating: ΔS = n·C_v·ln(T₂/T₁). */
export function dsIsochoric(n: number, cv: number, t1: number, t2: number): number {
  if (n <= 0 || cv <= 0 || t1 <= 0 || t2 <= 0) {
    throw new RangeError("n, C_v and temperatures must be positive");
  }
  return n * cv * Math.log(t2 / t1);
}

/** Constant-pressure heating: ΔS = n·C_p·ln(T₂/T₁). */
export function dsIsobaric(n: number, cp: number, t1: number, t2: number): number {
  if (n <= 0 || cp <= 0 || t1 <= 0 || t2 <= 0) {
    throw new RangeError("n, C_p and temperatures must be positive");
  }
  return n * cp * Math.log(t2 / t1);
}

/**
 * Reversible adiabatic (isentropic) process: no heat crosses the boundary, so
 * dS = dQ_rev/T = 0. The entropy is unchanged — adiabats are isentropes.
 */
export function dsAdiabaticReversible(): number {
  return 0;
}

/** Two ideal-gas samples brought together to mix. */
export interface MixingInput {
  /** Moles of gas A. */
  nA: number;
  /** Moles of gas B. */
  nB: number;
}

/**
 * Entropy of mixing for two ideal gases that interdiffuse to fill the combined
 * volume in proportion to their amounts:
 *
 *   ΔS_mix = −R (n_A ln x_A + n_B ln x_B),  x_i = n_i/(n_A + n_B).
 *
 * Always positive (the log of a fraction is negative): the gases gain access to
 * more configurations even though no heat is added. For equal moles this is
 * (n_A + n_B)·R·ln 2. (Same-gas mixing is the Gibbs-paradox case and is not
 * modelled here — these are taken to be distinguishable species.)
 */
export function entropyOfMixing({ nA, nB }: MixingInput): number {
  if (nA <= 0 || nB <= 0) throw new RangeError("both amounts must be positive");
  const total = nA + nB;
  const xA = nA / total;
  const xB = nB / total;
  return -R_GAS * (nA * Math.log(xA) + nB * Math.log(xB));
}

/** Entropy ledger for heat Q moving from a hot body to a cold one. */
export interface HeatTransferEntropy {
  /** Entropy lost by the hot reservoir, J/K (negative). */
  dsHot: number;
  /** Entropy gained by the cold reservoir, J/K (positive). */
  dsCold: number;
  /** Net entropy of the universe, J/K (≥ 0). */
  dsUniverse: number;
}

/**
 * Direct (irreversible) conduction of heat Q from T_h to T_c. The hot reservoir
 * loses Q/T_h, the cold gains Q/T_c, and since T_c < T_h the universe gains
 *
 *   ΔS = Q(1/T_c − 1/T_h) > 0.
 *
 * Routing the same Q through a reversible Carnot engine instead gives
 * ΔS_universe = 0 (see {@link reversibleHeatTransferEntropy}); the difference is
 * the entropy the direct path wastes.
 */
export function heatTransferDsUniverse(
  q: number,
  tHot: number,
  tCold: number,
): HeatTransferEntropy {
  if (q <= 0) throw new RangeError("q must be positive");
  if (tCold <= 0 || tHot <= 0) throw new RangeError("temperatures must be positive");
  if (tCold >= tHot) throw new RangeError("require tCold < tHot");
  const dsHot = -q / tHot;
  const dsCold = q / tCold;
  return { dsHot, dsCold, dsUniverse: dsHot + dsCold };
}

/**
 * Reversible transfer of heat from T_h to T_c through a Carnot engine: every
 * exchange happens across a vanishing temperature difference, so the entropy
 * leaving the hot reservoir exactly equals that entering the cold one and
 * ΔS_universe = 0. Returned as a ledger for symmetry with the direct case.
 */
export function reversibleHeatTransferEntropy(
  qHot: number,
  tHot: number,
  tCold: number,
): HeatTransferEntropy {
  if (qHot <= 0) throw new RangeError("qHot must be positive");
  if (tCold <= 0 || tHot <= 0) throw new RangeError("temperatures must be positive");
  if (tCold >= tHot) throw new RangeError("require tCold < tHot");
  const dsHot = -qHot / tHot;
  const qCold = qHot * (tCold / tHot); // Carnot engine rejects this to cold
  const dsCold = qCold / tCold;
  return { dsHot, dsCold, dsUniverse: dsHot + dsCold }; // = 0 exactly
}

/**
 * Free (Joule) expansion of an ideal gas into vacuum from V₁ to V₂. No work is
 * done and no heat flows, yet entropy rises by the same nR·ln(V₂/V₁) as the
 * reversible isothermal expansion — entropy is a state function, blind to the
 * path. ΔS_universe equals this, since the surroundings are untouched.
 */
export function freeExpansionDs(n: number, v1: number, v2: number): number {
  if (v2 <= v1) throw new RangeError("free expansion requires V₂ > V₁");
  return dsIsothermal(n, v1, v2);
}

/**
 * A normalized ΔS(t) curve for the mixing animation: entropy climbs from 0 to
 * the final mixing value following 1 − e^(−t/τ), the saturating approach of a
 * diffusion process. Returns `samples` points with t in [0, 1] (fraction of the
 * run) and `ds` the entropy reached, in J/K.
 *
 * @param finalDs the saturation value, e.g. from {@link entropyOfMixing}
 * @param samples number of points (≥ 2)
 * @param tau time constant as a fraction of the run (default 0.25)
 */
export function mixingTimeSeries(
  finalDs: number,
  samples = 60,
  tau = 0.25,
): { t: number; ds: number }[] {
  if (samples < 2) throw new RangeError("need at least 2 samples");
  if (tau <= 0) throw new RangeError("tau must be positive");
  const out: { t: number; ds: number }[] = [];
  for (let i = 0; i < samples; i++) {
    const t = i / (samples - 1);
    out.push({ t, ds: finalDs * (1 - Math.exp(-t / tau)) });
  }
  return out;
}
