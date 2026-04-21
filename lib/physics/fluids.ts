/**
 * Fluid statics — pressure, hydrostatic equilibrium, and buoyancy.
 *
 * All helpers use SI units: pressure in pascals (Pa), density in kg/m^3,
 * depth in metres, g in m/s^2, forces in newtons, volumes in m^3.
 */

/** Standard surface gravity in m/s^2. */
export const G_STANDARD = 9.80665;

/** Standard atmospheric pressure at sea level in pascals (101 325 Pa). */
export const P_ATM = 101_325;

/** Density of fresh water at 4 °C in kg/m^3. */
export const RHO_WATER = 1000;

/** Density of mercury at 0 °C in kg/m^3. */
export const RHO_MERCURY = 13_595;

/**
 * Absolute pressure at depth h below a fluid surface that itself sits at p0.
 *
 * The hydrostatic equation dp/dz = -rho·g integrates, for constant density
 * and gravity, to p(h) = p0 + rho·g·h, where h is measured downward from the
 * free surface.
 */
export function hydrostaticPressure(
  depth: number,
  density: number = RHO_WATER,
  surfacePressure: number = P_ATM,
  g: number = G_STANDARD,
): number {
  if (depth < 0) {
    throw new Error("depth must be non-negative");
  }
  if (density < 0) {
    throw new Error("density must be non-negative");
  }
  return surfacePressure + density * g * depth;
}

/**
 * Gauge pressure at depth h — the amount by which absolute pressure exceeds
 * the ambient surface pressure. This is what a diver's depth gauge reads.
 */
export function gaugePressure(
  depth: number,
  density: number = RHO_WATER,
  g: number = G_STANDARD,
): number {
  if (depth < 0) {
    throw new Error("depth must be non-negative");
  }
  return density * g * depth;
}

/**
 * Equivalent fluid column height that balances a given pressure.
 * h = p / (rho · g). A 760 mm mercury column gives one atmosphere;
 * the same atmosphere takes about 10.33 m of water.
 */
export function columnHeightForPressure(
  pressure: number,
  density: number,
  g: number = G_STANDARD,
): number {
  if (pressure < 0) {
    throw new Error("pressure must be non-negative");
  }
  if (density <= 0) {
    throw new Error("density must be positive");
  }
  return pressure / (density * g);
}

/**
 * Archimedes' principle. The upward buoyant force on a body fully immersed
 * in a fluid equals the weight of the fluid it displaces:
 *   F_b = rho_fluid · V_displaced · g.
 */
export function buoyantForce(
  displacedVolume: number,
  fluidDensity: number,
  g: number = G_STANDARD,
): number {
  if (displacedVolume < 0) {
    throw new Error("displacedVolume must be non-negative");
  }
  if (fluidDensity < 0) {
    throw new Error("fluidDensity must be non-negative");
  }
  return fluidDensity * displacedVolume * g;
}

/**
 * Fraction of a floating body that sits submerged at equilibrium.
 *
 * At static equilibrium, buoyant force balances weight:
 *   rho_fluid · V_sub · g = rho_body · V_total · g
 * so V_sub / V_total = rho_body / rho_fluid. If that ratio exceeds 1 the
 * body sinks — we clamp at 1 and mark `floats: false`.
 */
export interface SubmergedResult {
  /** Fraction of the body volume below the waterline (0..1). */
  submergedFraction: number;
  /** True if the body density is strictly less than the fluid density. */
  floats: boolean;
}

export function submergedFraction(
  bodyDensity: number,
  fluidDensity: number,
): SubmergedResult {
  if (bodyDensity < 0 || fluidDensity <= 0) {
    throw new Error("densities must be positive");
  }
  const ratio = bodyDensity / fluidDensity;
  if (ratio >= 1) {
    return { submergedFraction: 1, floats: false };
  }
  return { submergedFraction: ratio, floats: true };
}

/**
 * Pascal's principle applied to a hydraulic press.
 *
 * A force F_in on a small piston of area A_in creates a pressure
 * p = F_in / A_in that propagates unchanged through the fluid. A larger
 * piston of area A_out therefore lifts F_out = p · A_out = F_in · (A_out / A_in).
 * Energy is conserved: the big piston moves less far by the same ratio.
 */
export function hydraulicOutputForce(
  inputForce: number,
  inputArea: number,
  outputArea: number,
): number {
  if (inputArea <= 0 || outputArea <= 0) {
    throw new Error("piston areas must be positive");
  }
  return inputForce * (outputArea / inputArea);
}
