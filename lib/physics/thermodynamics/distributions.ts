/**
 * Probability distributions of statistical mechanics — a SHARED, extensible
 * helper for the kinetic-theory and statistical-mechanics modules.
 *
 * FIG.16 introduces the first two: the Gaussian (normal) law that Maxwell argued
 * each velocity *component* must follow, and the Maxwell–Boltzmann *speed*
 * distribution that results when three independent Gaussian components are
 * combined. The Boltzmann factor exp(−E/kT) — the seed of all of statistical
 * mechanics — lives here too.
 *
 * Later sprint sessions (8–9) extend this module with the quantum distributions
 * (Bose–Einstein, Fermi–Dirac); the extension point is marked below. Keep every
 * function pure, typed, SI, and React-free.
 */

/** Boltzmann constant, J/K (exact since the 2019 SI). */
export const K_B = 1.380649e-23;

/**
 * Normal (Gaussian) probability density at x for mean μ and standard
 * deviation σ:  (1/σ√2π) · exp(−(x−μ)²/2σ²).
 *
 * Maxwell's 1859 symmetry argument: the x, y, z velocity components of a gas
 * molecule are independent and identically distributed, and the only isotropic
 * distribution with independent components is the Gaussian. Each component is
 * N(0, kT/m).
 */
export function gaussian(x: number, mu: number, sigma: number): number {
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
}

/**
 * Maxwell–Boltzmann *speed* probability density at speed v for a gas of
 * molecular mass m at temperature T:
 *
 *   f(v) = 4π (m / 2πkT)^{3/2} · v² · exp(−m v² / 2kT)
 *
 * The v² factor is the surface area of the velocity-space sphere of radius v —
 * the "phase-space volume" of states with that speed; the exponential is the
 * Boltzmann suppression of high kinetic energy. f(v) is normalised:
 * ∫₀^∞ f(v) dv = 1. Speeds in m/s, m in kg, T in K.
 */
export function maxwellBoltzmannSpeed(v: number, T: number, m: number): number {
  if (v <= 0) return 0;
  const a = m / (2 * Math.PI * K_B * T);
  return 4 * Math.PI * Math.pow(a, 1.5) * v * v * Math.exp((-m * v * v) / (2 * K_B * T));
}

/**
 * The Boltzmann factor exp(−E/kT): the relative probability of a microstate of
 * energy E for a system in thermal contact with a reservoir at temperature T.
 * Dimensionless; E in joules, T in kelvin. exp(−0) = 1 at E = 0.
 */
export function boltzmannFactor(E: number, T: number): number {
  return Math.exp(-E / (K_B * T));
}

// ───────────────────────────────────────────────────────────────────────────
// Bose–Einstein / Fermi–Dirac — added by sessions 8–9.
//
// The quantum occupation numbers ⟨n⟩ = 1 / (exp((E−μ)/kT) ∓ 1) belong here,
// reusing K_B above. Left as a documented extension point so the kinetic-theory
// and quantum-statistics topics share one distributions module.
// ───────────────────────────────────────────────────────────────────────────
