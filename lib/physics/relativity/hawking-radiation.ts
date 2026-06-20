/**
 * §49 HAWKING RADIATION — pure-TS helpers.
 *
 * In 1974 Stephen Hawking showed that a black hole is not perfectly black.
 * Quantum fields in the curved spacetime outside the horizon are excited by
 * the horizon itself; far away an observer sees a thermal flux of particles
 * at the Hawking temperature
 *
 *   T_H = ℏ c³ / (8π G M k_B)
 *
 * The black hole therefore behaves as a blackbody. Its luminosity follows the
 * Stefan–Boltzmann law applied to the horizon area, so it radiates energy,
 * loses mass, and — crucially — gets HOTTER as it shrinks (T ∝ 1/M). The
 * runaway ends in a final flash. The evaporation lifetime scales as M³.
 *
 * This file is self-contained: it defines its own copy of every constant it
 * needs (no shared physics module is edited). All functions are React-free,
 * SI units unless noted, and validated in hawking-radiation.test.ts.
 */

// ─── Constants (local copies; SI) ────────────────────────────────────────────

/** Speed of light, m/s (exact). */
export const C = 2.99792458e8;
/** Gravitational constant, m³ kg⁻¹ s⁻². */
export const G = 6.6743e-11;
/** Reduced Planck constant ℏ = h/2π, J·s. */
export const HBAR = 1.054571817e-34;
/** Boltzmann constant, J/K (exact, SI 2019). */
export const K_B = 1.380649e-23;
/** Stefan–Boltzmann constant, W m⁻² K⁻⁴. */
export const SIGMA_SB = 5.670374419e-8;

/** Solar mass, kg. */
export const M_SUN = 1.98892e30;
/** Present-day CMB temperature, K. */
export const T_CMB = 2.725;
/** Current age of the universe, seconds (~13.8 Gyr). */
export const AGE_UNIVERSE_S = 4.35e17;

// ─── Core formulas ───────────────────────────────────────────────────────────

/** Schwarzschild radius r_s = 2GM/c² (m). The horizon of a non-rotating hole. */
export function schwarzschildRadius(M_kg: number): number {
  return (2 * G * M_kg) / (C * C);
}

/**
 * Hawking temperature T_H = ℏ c³ / (8π G M k_B), in kelvin.
 *
 * Inversely proportional to mass: a one-solar-mass hole sits at ~6.2×10⁻⁸ K,
 * far colder than the 2.725 K CMB; a small primordial hole can be white-hot.
 */
export function hawkingTemperature(M_kg: number): number {
  return (HBAR * Math.pow(C, 3)) / (8 * Math.PI * G * M_kg * K_B);
}

/** Horizon area A = 4π r_s² = 16π G²M²/c⁴ (m²). */
export function horizonArea(M_kg: number): number {
  const rs = schwarzschildRadius(M_kg);
  return 4 * Math.PI * rs * rs;
}

/**
 * Hawking luminosity from the Stefan–Boltzmann law L = σ A T⁴ (watts).
 *
 * Treats the horizon as a blackbody of area A at temperature T_H. This omits
 * greybody factors and the species-dependent number of emitted fields, so it
 * is the canonical order-of-magnitude estimate, accurate to a factor of a few.
 */
export function hawkingLuminosity(M_kg: number): number {
  const A = horizonArea(M_kg);
  const T = hawkingTemperature(M_kg);
  return SIGMA_SB * A * Math.pow(T, 4);
}

/**
 * Evaporation lifetime τ (seconds) for a hole of mass M radiating into vacuum.
 *
 * From dM/dt = −L/c² with L ∝ 1/M² one gets dM/dt ∝ −1/M², hence M(t)³ falls
 * linearly and τ = M³ · (constant). The constant here is derived from the
 * blackbody luminosity above: τ = (5120 π G² M³) / (ℏ c⁴). For one solar mass
 * this is ~6.6×10⁷⁴ s ≈ 2×10⁶⁷ yr — far longer than the age of the universe.
 */
export function evaporationLifetime(M_kg: number): number {
  return (5120 * Math.PI * Math.pow(G, 2) * Math.pow(M_kg, 3)) /
    (HBAR * Math.pow(C, 4));
}

/**
 * Remaining mass M(t) after time t for a hole that started at M0, integrating
 * dM/dt = −L/c² in the M³-linear approximation:  M(t) = M0 · (1 − t/τ0)^{1/3},
 * clamped to ≥ 0 once it has fully evaporated. τ0 = evaporationLifetime(M0).
 */
export function massAfterTime(M0_kg: number, t_s: number): number {
  const tau0 = evaporationLifetime(M0_kg);
  if (t_s >= tau0) return 0;
  return M0_kg * Math.cbrt(1 - t_s / tau0);
}

/**
 * Mass (kg) of a primordial black hole whose lifetime equals the age of the
 * universe — i.e. one just finishing its evaporation today. Inverts the τ ∝ M³
 * relation: M = (τ ℏ c⁴ / 5120 π G²)^{1/3}. Result is ~10¹¹–10¹² kg.
 */
export function massFromLifetime(tau_s: number): number {
  return Math.cbrt(
    (tau_s * HBAR * Math.pow(C, 4)) / (5120 * Math.PI * Math.pow(G, 2)),
  );
}

/**
 * Peak wavelength of the Hawking blackbody via Wien's law λ_max = b / T,
 * with b = 2.897771955×10⁻³ m·K. In meters.
 */
export function wienPeakWavelength(M_kg: number): number {
  const b = 2.897771955e-3;
  return b / hawkingTemperature(M_kg);
}

/**
 * Net heat flow today: positive if the hole RADIATES more than it absorbs from
 * the CMB, negative if it net-ABSORBS. Sign is set by comparing T_H to T_CMB.
 * Returns L_emit − L_absorb (watts), where the absorbed term uses the same
 * area at the CMB temperature: L_abs = σ A T_CMB⁴.
 */
export function netPowerVsCMB(M_kg: number, T_cmb = T_CMB): number {
  const A = horizonArea(M_kg);
  const T = hawkingTemperature(M_kg);
  const emit = SIGMA_SB * A * Math.pow(T, 4);
  const absorb = SIGMA_SB * A * Math.pow(T_cmb, 4);
  return emit - absorb;
}

/**
 * Spectral radiance of a blackbody (Planck's law) per unit wavelength,
 * B_λ(λ, T) = (2hc²/λ⁵) / (exp(hc/λk_BT) − 1), in W·sr⁻¹·m⁻³. Used to draw the
 * emission spectrum of a hole and compare it to the CMB curve.
 */
export function planckSpectralRadiance(lambda_m: number, T_K: number): number {
  const h = 2 * Math.PI * HBAR;
  const num = (2 * h * C * C) / Math.pow(lambda_m, 5);
  const x = (h * C) / (lambda_m * K_B * T_K);
  const denom = Math.expm1(x);
  if (denom <= 0 || !Number.isFinite(denom)) return 0;
  return num / denom;
}
