/**
 * FIG.01 WHAT IS TEMPERATURE? — pure-TS helpers.
 *
 * Two unrelated jobs live here, both needed by the topic's scenes.
 *
 * 1. Scale conversions. Three thermometric scales coexist: Celsius (1742,
 *    centigrade between the freezing and boiling points of water), Fahrenheit
 *    (1714, 32 °F freezing / 212 °F boiling), and the Kelvin absolute scale
 *    (1848), whose zero is the unattainable floor of thermal motion. The
 *    affine relations are
 *
 *      °F = (9/5) °C + 32          K = °C + 273.15
 *
 *    Kelvin is the only scale a physicist writes without apology because it
 *    is a true ratio scale: 200 K really is twice as hot — twice the mean
 *    thermal energy — as 100 K, a statement that is meaningless in °C or °F.
 *
 * 2. Thermal equilibrium. The operational *definition* of temperature is the
 *    quantity that equalises when two bodies touch. Two blocks brought into
 *    contact exchange heat until they share one temperature; isolated, that
 *    shared value is the heat-capacity-weighted mean of their starting
 *    temperatures (energy is conserved, no heat escapes). The relaxation
 *    toward it follows Newton's law of cooling — each body's temperature
 *    approaches the common value exponentially, with a rate set by the
 *    thermal coupling across the interface.
 *
 * React-free, typed. Conversions take/return plain numbers in the named unit.
 */

/** Absolute zero expressed in degrees Celsius (exact, SI definition of K). */
export const ABSOLUTE_ZERO_C = -273.15;

// ── Scale conversions ──────────────────────────────────────────────────────

/** Celsius → Fahrenheit: °F = (9/5)·°C + 32. */
export function celsiusToFahrenheit(c: number): number {
  return (c * 9) / 5 + 32;
}

/** Fahrenheit → Celsius: °C = (5/9)·(°F − 32). */
export function fahrenheitToCelsius(f: number): number {
  return ((f - 32) * 5) / 9;
}

/** Celsius → Kelvin: K = °C + 273.15. Throws below absolute zero. */
export function celsiusToKelvin(c: number): number {
  const k = c - ABSOLUTE_ZERO_C;
  if (k < 0) {
    throw new RangeError(`temperature below absolute zero: ${c} °C`);
  }
  return k;
}

/** Kelvin → Celsius: °C = K − 273.15. Throws for negative kelvin. */
export function kelvinToCelsius(k: number): number {
  if (k < 0) {
    throw new RangeError(`kelvin cannot be negative: ${k} K`);
  }
  return k + ABSOLUTE_ZERO_C;
}

/** Fahrenheit → Kelvin, via Celsius. */
export function fahrenheitToKelvin(f: number): number {
  return celsiusToKelvin(fahrenheitToCelsius(f));
}

/** Kelvin → Fahrenheit, via Celsius. */
export function kelvinToFahrenheit(k: number): number {
  return celsiusToFahrenheit(kelvinToCelsius(k));
}

/** All three scales for one Celsius input — convenient for a tri-scale readout. */
export interface ScaleReadout {
  celsius: number;
  fahrenheit: number;
  kelvin: number;
}

/** Build a {°C, °F, K} readout from a Celsius value. */
export function readoutFromCelsius(c: number): ScaleReadout {
  return {
    celsius: c,
    fahrenheit: celsiusToFahrenheit(c),
    kelvin: celsiusToKelvin(c),
  };
}

// ── Thermal equilibrium ─────────────────────────────────────────────────────

/** A body that can exchange heat: a thermal mass (heat capacity) at some T. */
export interface ThermalBody {
  /** Heat capacity C = m·c, in J/K. Only ratios matter for the equilibrium T. */
  heatCapacity: number;
  /** Current temperature, in any consistent unit (°C or K). */
  temperature: number;
}

/**
 * Equilibrium temperature of an isolated set of bodies in mutual contact.
 *
 * Energy conservation with no heat lost to the surroundings gives the
 * heat-capacity-weighted mean
 *
 *   T_eq = Σ Cᵢ Tᵢ / Σ Cᵢ.
 *
 * @param bodies one or more thermal bodies (same temperature unit)
 * @returns the shared final temperature in that unit
 * @throws Error if no bodies are given or total heat capacity is non-positive
 */
export function equilibriumTemperature(bodies: readonly ThermalBody[]): number {
  if (bodies.length === 0) {
    throw new Error("equilibriumTemperature: need at least one body");
  }
  let weighted = 0;
  let total = 0;
  for (const b of bodies) {
    if (b.heatCapacity <= 0) {
      throw new Error("equilibriumTemperature: heat capacity must be positive");
    }
    weighted += b.heatCapacity * b.temperature;
    total += b.heatCapacity;
  }
  return weighted / total;
}

/**
 * Newton's law of cooling: exponential approach to an ambient temperature.
 *
 *   T(t) = T_env + (T₀ − T_env) · e^{−k t}
 *
 * The temperature relaxes toward T_env, closing the initial gap by a factor
 * e each time t advances by the time-constant 1/k.
 *
 * @param t0 initial temperature
 * @param tEnv ambient / target temperature
 * @param k cooling rate constant (1/time), must be ≥ 0
 * @param t elapsed time (same unit as 1/k), must be ≥ 0
 * @returns temperature at time t
 * @throws RangeError for negative k or t
 */
export function newtonCooling(
  t0: number,
  tEnv: number,
  k: number,
  t: number,
): number {
  if (k < 0) throw new RangeError(`cooling rate must be ≥ 0 (got ${k})`);
  if (t < 0) throw new RangeError(`time must be ≥ 0 (got ${t})`);
  return tEnv + (t0 - tEnv) * Math.exp(-k * t);
}

/**
 * Two bodies in thermal contact, each relaxing toward their shared
 * equilibrium. Each curve is an exponential governed by Newton's law with the
 * common equilibrium temperature as its target, so both arrive together while
 * conserving energy at every instant. Returns the pair of temperatures at t.
 *
 * @param a first body
 * @param b second body
 * @param k interface coupling rate (1/time), must be ≥ 0
 * @param t elapsed time, must be ≥ 0
 * @returns { tA, tB, tEq } the two temperatures and their common target
 */
export function contactRelaxation(
  a: ThermalBody,
  b: ThermalBody,
  k: number,
  t: number,
): { tA: number; tB: number; tEq: number } {
  const tEq = equilibriumTemperature([a, b]);
  return {
    tA: newtonCooling(a.temperature, tEq, k, t),
    tB: newtonCooling(b.temperature, tEq, k, t),
    tEq,
  };
}
