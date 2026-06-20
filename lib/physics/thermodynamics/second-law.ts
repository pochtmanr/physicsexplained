/**
 * FIG.09 THE SECOND LAW — pure-TS helpers.
 *
 * Two equivalent statements bar the door the first law leaves open:
 *
 * - Clausius: heat does not flow spontaneously from a colder body to a hotter
 *   one with no other effect.
 * - Kelvin–Planck: no cyclic process can take heat from a single reservoir and
 *   convert it entirely into work with no other effect.
 *
 * They are equivalent: a violator of one can be wired into a violator of the
 * other. The accounting for those hybrid machines lives here, alongside the
 * Clausius inequality ∮ dQ/T ≤ 0 (the seed from which entropy grows) and the
 * "ocean engine" that fails for want of a cold reservoir.
 *
 * Self-contained; temperatures absolute (kelvin), heats and work in joules.
 */

/** One infinitesimal heat exchange along a cycle: dQ at temperature T. */
export interface HeatStep {
  /** Heat entering the system at this step, J (signed: + in, − out). */
  dQ: number;
  /** Temperature at which the exchange happens, K (> 0). */
  T: number;
}

/**
 * The Clausius integral ∮ dQ/T over a cycle, approximated as Σ dQᵢ/Tᵢ.
 * Vanishes (to rounding) for a reversible cycle and is strictly negative for an
 * irreversible one — the Clausius inequality ∮ dQ/T ≤ 0.
 *
 * @param steps the heat exchanges making up one closed cycle
 * @returns the summed dQ/T, J/K
 */
export function clausiusIntegral(steps: readonly HeatStep[]): number {
  let sum = 0;
  for (const s of steps) {
    if (s.T <= 0) throw new RangeError("temperatures must be positive (kelvin)");
    sum += s.dQ / s.T;
  }
  return sum;
}

/** Carnot refrigerator coefficient of performance, T_c/(T_h − T_c). */
export function carnotFridgeCop(tHot: number, tCold: number): number {
  if (tCold <= 0 || tHot <= 0) throw new RangeError("temperatures must be positive");
  if (tCold >= tHot) throw new RangeError("require tCold < tHot");
  return tCold / (tHot - tCold);
}

/** Bookkeeping for a hybrid machine proving the two statements equivalent. */
export interface HybridResult {
  /** Work passed between the two halves of the hybrid, J. */
  work: number;
  /** Heat drawn from the cold reservoir, J. */
  coldExtracted: number;
  /** Heat delivered to the hot reservoir, J. */
  hotDelivered: number;
  /** Net heat that ends up moved cold → hot, J. */
  netColdToHot: number;
  /** Net work extracted from the hot reservoir alone, J. */
  netWorkFromHot: number;
  /** Which statement the combined machine violates. */
  violates: "clausius" | "kelvin";
}

/**
 * Wire a Kelvin–Planck violator (an engine that turns heat fully into work)
 * into an ordinary Carnot refrigerator: the free work W = Q_h drives the fridge,
 * pumping COP·W out of the cold reservoir and delivering W + COP·W to the hot
 * one. The hot reservoir nets +COP·W and the cold one −COP·W, so heat has moved
 * cold → hot with nothing else changed — a Clausius violation.
 */
export function kelvinViolatorImpliesClausius(
  qHot: number,
  tHot: number,
  tCold: number,
): HybridResult {
  if (qHot <= 0) throw new RangeError("qHot must be positive");
  const work = qHot; // the K–P engine converts all of Q_h to work
  const cop = carnotFridgeCop(tHot, tCold);
  const coldExtracted = cop * work;
  const hotDelivered = work + coldExtracted;
  return {
    work,
    coldExtracted,
    hotDelivered,
    netColdToHot: coldExtracted, // hot gains, cold loses this much
    netWorkFromHot: 0,
    violates: "clausius",
  };
}

/**
 * Wire a Clausius violator (which shuttles heat cold → hot for free) into an
 * ordinary Carnot engine. Choose the violator to pump exactly the engine's
 * rejected heat Q_c back from cold to hot; the cold reservoir then breaks even
 * and the hot reservoir loses W, all of it converted to work — a Kelvin–Planck
 * violation (heat from a single reservoir turned entirely into work).
 */
export function clausiusViolatorImpliesKelvin(
  qHot: number,
  tHot: number,
  tCold: number,
): HybridResult {
  if (qHot <= 0) throw new RangeError("qHot must be positive");
  if (tCold <= 0 || tHot <= 0) throw new RangeError("temperatures must be positive");
  if (tCold >= tHot) throw new RangeError("require tCold < tHot");
  const qCold = qHot * (tCold / tHot); // Carnot engine's rejected heat
  const work = qHot - qCold;
  return {
    work,
    coldExtracted: qCold, // pumped back by the Clausius device
    hotDelivered: qCold,
    netColdToHot: 0, // cold reservoir breaks even
    netWorkFromHot: work, // net work out of the hot reservoir alone
    violates: "kelvin",
  };
}

/** Result of running the "ocean engine" thought experiment. */
export interface OceanEngineResult {
  /** Carnot bound on efficiency, (T_surface − T_deep)/T_surface. */
  efficiencyBound: number;
  /** Whether any work at all can be extracted (false with no cold reservoir). */
  works: boolean;
}

/**
 * An engine that tries to run on ocean heat. With no cold reservoir
 * (T_deep = T_surface) the efficiency bound is zero and no work is possible —
 * perpetual motion of the second kind, forbidden by Kelvin–Planck. Tap a colder
 * deep layer and the bound becomes (T_surface − T_deep)/T_surface > 0; the
 * engine runs (this is real: ocean thermal energy conversion).
 *
 * @param tSurface warm surface-water temperature, K
 * @param tDeep cold deep-water temperature, K (≤ T_surface)
 */
export function oceanEngine(
  tSurface: number,
  tDeep: number,
): OceanEngineResult {
  if (tSurface <= 0 || tDeep <= 0) {
    throw new RangeError("temperatures must be positive (kelvin)");
  }
  if (tDeep > tSurface) throw new RangeError("require tDeep ≤ tSurface");
  const efficiencyBound = (tSurface - tDeep) / tSurface;
  return { efficiencyBound, works: efficiencyBound > 0 };
}
