/**
 * §58 DARK MATTER AND DARK ENERGY — pure-TS helpers.
 *
 * This file is React-free and self-contained for the dark-matter-and-dark-energy
 * topic. It provides three families of toy models used by the scenes and the
 * essay:
 *
 *   1. Galaxy rotation curves — the visible-mass (disk) prediction that falls
 *      off as v ∝ 1/√r past the luminous edge, versus the observed flat curve
 *      that an extra dark-matter halo produces. (Rubin, 1970s.)
 *   2. The cosmic energy budget — the density fractions Ω_r, Ω_m, Ω_Λ as
 *      functions of redshift z, where radiation scales as (1+z)⁴, matter as
 *      (1+z)³, and the cosmological constant stays fixed. (z = 1100 → today.)
 *   3. Type Ia supernova distance modulus μ(z) for decelerating, coasting and
 *      accelerating universes — the 1998 discovery plot. (Riess, Perlmutter.)
 *
 * The numbers are deliberately toy-model order-of-magnitude: they reproduce the
 * qualitative crossings and shapes that the figures teach, not a production
 * cosmology solver. Where a closed form is unavailable (luminosity distance) we
 * integrate with a fixed-step rule so the result is deterministic and testable.
 */

/** Gravitational constant in convenient galactic units is folded into the toy
 *  amplitude; the scenes only need shapes, not SI magnitudes. */

// ─── 1. Galaxy rotation curves ──────────────────────────────────────────────

/**
 * Newtonian circular speed from the enclosed mass M(<r):
 *   v(r) = sqrt(G · M(<r) / r).
 * Returned in arbitrary (km/s-like) units; `gUnit` folds in G and the mass
 * normalization. Guard r = 0.
 */
export function circularSpeed(enclosedMass: number, r: number, gUnit = 1): number {
  if (r <= 0) return 0;
  return Math.sqrt((gUnit * enclosedMass) / r);
}

/**
 * Enclosed luminous (disk) mass inside radius r for an exponential disk of
 * scale length `rd` and total mass `mDisk`. For an exponential surface density
 * the enclosed fraction is 1 − (1 + r/rd)·e^(−r/rd). Past a few scale lengths
 * essentially all the light is enclosed, so M(<r) saturates and v ∝ 1/√r.
 */
export function diskEnclosedMass(r: number, mDisk: number, rd: number): number {
  if (r <= 0 || rd <= 0) return 0;
  const x = r / rd;
  return mDisk * (1 - (1 + x) * Math.exp(-x));
}

/**
 * Enclosed mass of a dark-matter halo with a flat-rotation-curve density
 * profile (isothermal-sphere-like): ρ ∝ 1/(r² + rc²). Its enclosed mass grows
 * ~linearly with r at large radius, which is exactly what makes v(r) flat.
 *   M(<r) = mHaloScale · (r − rc·atan(r/rc)).
 * `rc` is the core radius; `mHaloScale` sets the asymptotic flat speed.
 */
export function haloEnclosedMass(r: number, mHaloScale: number, rc: number): number {
  if (r <= 0 || rc <= 0) return 0;
  return mHaloScale * (r - rc * Math.atan(r / rc));
}

/**
 * Disk-only rotation curve speed at radius r (the "visible-mass prediction").
 */
export function diskRotationSpeed(
  r: number,
  mDisk: number,
  rd: number,
  gUnit = 1,
): number {
  return circularSpeed(diskEnclosedMass(r, mDisk, rd), r, gUnit);
}

/**
 * Total rotation speed with disk + halo, added in quadrature on the enclosed
 * masses (since v² ∝ M_enclosed). This is the curve that fits Rubin's data:
 * the halo lifts the falling disk curve up onto a flat plateau.
 */
export function totalRotationSpeed(
  r: number,
  mDisk: number,
  rd: number,
  mHaloScale: number,
  rc: number,
  gUnit = 1,
): number {
  const mTotal = diskEnclosedMass(r, mDisk, rd) + haloEnclosedMass(r, mHaloScale, rc);
  return circularSpeed(mTotal, r, gUnit);
}

// ─── 2. Cosmic energy budget vs redshift ────────────────────────────────────

export interface DensityComponents {
  /** Present-day radiation density fraction Ω_r,0 (photons + neutrinos). */
  omegaR: number;
  /** Present-day matter density fraction Ω_m,0 (baryons + dark matter). */
  omegaM: number;
  /** Present-day dark-energy / cosmological-constant fraction Ω_Λ,0. */
  omegaLambda: number;
}

/** Concordance (ΛCDM) present-day fractions, rounded for teaching. */
export const CONCORDANCE: DensityComponents = {
  omegaR: 9.0e-5,
  omegaM: 0.315,
  omegaLambda: 0.685,
};

/**
 * Unnormalized density of each component at redshift z, relative to its
 * present-day value, using the scaling laws:
 *   radiation ∝ (1+z)⁴, matter ∝ (1+z)³, Λ ∝ const.
 * Returns the three E²-contributions [r, m, Λ]. Their sum is the dimensionless
 * Friedmann function E²(z) = H²(z)/H₀² for a flat universe.
 */
export function componentDensities(
  z: number,
  c: DensityComponents = CONCORDANCE,
): { r: number; m: number; lambda: number } {
  const a1 = 1 + z;
  return {
    r: c.omegaR * a1 * a1 * a1 * a1,
    m: c.omegaM * a1 * a1 * a1,
    lambda: c.omegaLambda,
  };
}

/**
 * Fractional energy budget at redshift z — what share of the total each
 * component holds. Sums to 1 by construction. This drives the morphing pie/bar
 * scene: radiation-dominated at z≳3400, matter-dominated through structure
 * formation, Λ-dominated only recently (z≲0.3).
 */
export function budgetFractions(
  z: number,
  c: DensityComponents = CONCORDANCE,
): { r: number; m: number; lambda: number } {
  const d = componentDensities(z, c);
  const tot = d.r + d.m + d.lambda;
  if (tot <= 0) return { r: 0, m: 0, lambda: 0 };
  return { r: d.r / tot, m: d.m / tot, lambda: d.lambda / tot };
}

/**
 * Matter–radiation equality redshift, where Ω_m(1+z)³ = Ω_r(1+z)⁴, i.e.
 *   1 + z_eq = Ω_m / Ω_r.
 */
export function matterRadiationEquality(c: DensityComponents = CONCORDANCE): number {
  return c.omegaM / c.omegaR - 1;
}

/**
 * Matter–Λ equality redshift, where Ω_m(1+z)³ = Ω_Λ, i.e.
 *   1 + z_mΛ = (Ω_Λ / Ω_m)^(1/3).
 * Below this the expansion accelerates.
 */
export function matterLambdaEquality(c: DensityComponents = CONCORDANCE): number {
  return Math.cbrt(c.omegaLambda / c.omegaM) - 1;
}

// ─── 3. Supernova distance modulus — the 1998 plot ──────────────────────────

/**
 * Dimensionless Friedmann function E(z) = H(z)/H₀ for a flat universe with the
 * given component fractions (Ω_r usually negligible at SN redshifts but kept).
 */
export function dimensionlessHubble(
  z: number,
  c: DensityComponents = CONCORDANCE,
): number {
  const d = componentDensities(z, c);
  return Math.sqrt(d.r + d.m + d.lambda);
}

/**
 * Dimensionless comoving distance D_C(z) = ∫₀ᶻ dz'/E(z') for a flat universe,
 * integrated with the trapezoidal rule on `steps` subintervals. Multiply by the
 * Hubble distance c/H₀ to get a physical comoving distance.
 */
export function comovingDistanceDimensionless(
  z: number,
  c: DensityComponents = CONCORDANCE,
  steps = 512,
): number {
  if (z <= 0) return 0;
  const h = z / steps;
  let sum = 0;
  for (let i = 0; i <= steps; i++) {
    const zi = i * h;
    const w = i === 0 || i === steps ? 0.5 : 1;
    sum += w / dimensionlessHubble(zi, c);
  }
  return sum * h;
}

/**
 * Luminosity distance in units of the Hubble distance c/H₀ for a flat universe:
 *   D_L = (1+z) · D_C.
 */
export function luminosityDistanceDimensionless(
  z: number,
  c: DensityComponents = CONCORDANCE,
  steps = 512,
): number {
  return (1 + z) * comovingDistanceDimensionless(z, c, steps);
}

/** Hubble distance c/H₀ in megaparsecs, for H₀ in km/s/Mpc (c = 299792.458). */
export function hubbleDistanceMpc(h0 = 70): number {
  return 299792.458 / h0;
}

/**
 * Distance modulus μ = 5·log₁₀(D_L / 10 pc) for a flat universe, in magnitudes.
 * D_L is computed from the dimensionless luminosity distance times c/H₀.
 * The shape of μ(z) — not its absolute zero point — is what 1998 measured: at
 * fixed z, an accelerating (high-Ω_Λ) universe puts supernovae *farther* and
 * therefore *fainter* than a decelerating one.
 */
export function distanceModulus(
  z: number,
  c: DensityComponents = CONCORDANCE,
  h0 = 70,
  steps = 512,
): number {
  const dlMpc = luminosityDistanceDimensionless(z, c, steps) * hubbleDistanceMpc(h0);
  const dlPc = dlMpc * 1e6;
  return 5 * Math.log10(dlPc / 10);
}

/** Three named cosmologies used by the discovery-plot scene. */
export const COSMOLOGIES = {
  /** Empty / coasting universe (Ω_m = Ω_Λ = 0): the reference line. */
  empty: { omegaR: 0, omegaM: 0, omegaLambda: 0 } as DensityComponents,
  /** Decelerating, matter-only flat universe (Ω_m = 1). */
  decelerating: { omegaR: 0, omegaM: 1, omegaLambda: 0 } as DensityComponents,
  /** Accelerating concordance universe (Ω_m ≈ 0.3, Ω_Λ ≈ 0.7). */
  accelerating: { omegaR: 0, omegaM: 0.3, omegaLambda: 0.7 } as DensityComponents,
};

/**
 * Residual distance modulus Δμ(z) of a model relative to the empty/coasting
 * reference. This is the y-axis of the famous 1998 plot: accelerating models
 * sit *above* zero (fainter SNe), decelerating models *below*. Note: the empty
 * model uses an analytic luminosity distance D_L = (1+z)·ln(1+z) so the
 * reference is well-defined.
 */
export function distanceModulusResidual(
  z: number,
  model: DensityComponents,
  h0 = 70,
  steps = 512,
): number {
  const muModel = distanceModulus(z, model, h0, steps);
  const dlEmptyMpc = (1 + z) * Math.log(1 + z) * hubbleDistanceMpc(h0);
  const muEmpty = 5 * Math.log10((dlEmptyMpc * 1e6) / 10);
  return muModel - muEmpty;
}

// ─── 4. The cosmological constant & the vacuum-energy problem ────────────────

/**
 * Observed cosmological constant Λ in inverse-metres-squared (≈ 1.1×10⁻⁵² m⁻²).
 * Λ = 3 Ω_Λ H₀²/c². Returns the value for H₀ in km/s/Mpc.
 */
export function cosmologicalConstant(
  omegaLambda = 0.685,
  h0 = 67.4,
): number {
  const c = 2.99792458e8; // m/s
  const mpc = 3.0856775815e22; // m
  const h0SI = (h0 * 1000) / mpc; // s⁻¹
  return (3 * omegaLambda * h0SI * h0SI) / (c * c);
}

/**
 * The vacuum-energy discrepancy: the ratio of the naive quantum-field-theory
 * prediction for the vacuum energy density (cut off at the Planck scale) to the
 * observed dark-energy density. Famously ~10¹²⁰ — "the worst prediction in the
 * history of physics." Returns log₁₀ of the ratio given the two densities in
 * the same units. Defaults reproduce the canonical ~120 orders of magnitude.
 */
export function vacuumEnergyDiscrepancyLog10(
  predictedDensity = 1e113, // J/m³, Planck-scale QFT estimate
  observedDensity = 6e-10, // J/m³, observed dark-energy density
): number {
  return Math.log10(predictedDensity / observedDensity);
}
