/**
 * §55 THE FRIEDMANN EQUATIONS — pure-TS helpers.
 *
 * The two Friedmann equations govern the time evolution of the scale factor
 * a(t) in a homogeneous, isotropic universe (the FLRW model). Written with the
 * Hubble rate H = ȧ/a they are:
 *
 *   (1)  H² = (8πG/3) ρ − k c²/a² + Λc²/3      (energy / first Friedmann eq.)
 *   (2)  ä/a = −(4πG/3)(ρ + 3p/c²) + Λc²/3      (acceleration / second eq.)
 *
 * Rather than carry SI constants around, this module works in DIMENSIONLESS
 * cosmology variables — the standard practice in observational cosmology. We
 * normalise the scale factor to a = 1 today, measure the Hubble rate in units
 * of H₀, and express each energy component as a present-day density parameter
 *   Ω_i = ρ_i(today) / ρ_crit,   ρ_crit = 3H₀²/(8πG).
 * The cosmological constant becomes Ω_Λ and spatial curvature becomes a
 * "curvature density" Ω_k ≡ −kc²/(a₀²H₀²), fixed by the flatness sum
 *   Ω_m + Ω_r + Ω_Λ + Ω_k = 1.
 *
 * In these variables the first Friedmann equation is the famous E(a):
 *
 *   H(a)/H₀ = E(a) = sqrt( Ω_r a⁻⁴ + Ω_m a⁻³ + Ω_k a⁻² + Ω_Λ ).
 *
 * Each term carries the redshift scaling of one ingredient: radiation dilutes
 * as a⁻⁴ (volume × wavelength stretch), pressureless matter as a⁻³ (volume
 * only), curvature as a⁻², and the vacuum (Λ) stays constant. This single
 * function decides the fate of the universe — whether it recollapses, coasts,
 * or accelerates forever.
 *
 * This file is intentionally React-free, dependency-free, and fully typed so it
 * can be unit-tested in isolation and imported by the topic's canvas scenes.
 */

// ─── Density parameters ──────────────────────────────────────────────────────

/** Present-day density parameters of a flat-or-curved FLRW model. All are
 *  measured relative to the critical density ρ_crit = 3H₀²/(8πG). */
export interface CosmoParams {
  /** Matter (dark + baryonic), scales as a⁻³. */
  omegaM: number;
  /** Radiation (photons + relativistic neutrinos), scales as a⁻⁴. */
  omegaR: number;
  /** Cosmological constant / dark energy, constant in a. */
  omegaLambda: number;
}

/** Curvature density parameter Ω_k = 1 − Ω_m − Ω_r − Ω_Λ.
 *  Ω_k > 0 ↔ open (k = −1); Ω_k = 0 ↔ flat (k = 0); Ω_k < 0 ↔ closed (k = +1).
 *  The sign convention follows H²/H₀² = … + Ω_k a⁻², i.e. Ω_k = −k c²/(a₀²H₀²). */
export function curvatureDensity(p: CosmoParams): number {
  return 1 - p.omegaM - p.omegaR - p.omegaLambda;
}

/** Discrete spatial curvature k ∈ {−1, 0, +1} implied by Ω_k.
 *  `tol` guards against floating-point noise near flatness. */
export function curvatureSign(p: CosmoParams, tol = 1e-9): -1 | 0 | 1 {
  const ok = curvatureDensity(p);
  if (ok > tol) return -1; // open
  if (ok < -tol) return 1; // closed
  return 0; // flat
}

// ─── The expansion rate E(a) = H(a)/H₀ ───────────────────────────────────────

/** Dimensionless Hubble factor E(a) = H(a)/H₀ from the first Friedmann eq.
 *  Returns NaN-safe positive root; if the argument under the root is negative
 *  (a turning point in a recollapsing universe) it returns 0, signalling that
 *  expansion has halted (ȧ = 0). */
export function expansionRate(a: number, p: CosmoParams): number {
  if (a <= 0) return Infinity;
  const ok = curvatureDensity(p);
  const arg =
    p.omegaR / (a * a * a * a) +
    p.omegaM / (a * a * a) +
    ok / (a * a) +
    p.omegaLambda;
  return arg <= 0 ? 0 : Math.sqrt(arg);
}

/** E(z) as a function of redshift, with 1 + z = 1/a. Convenience wrapper used
 *  by distance/age integrals in sibling cosmology topics. */
export function expansionRateZ(z: number, p: CosmoParams): number {
  return expansionRate(1 / (1 + z), p);
}

/** Total energy density (in units of ρ_crit,0) at scale factor a — the sum of
 *  the three physical components, EXCLUDING the curvature term (curvature is a
 *  geometric term in the Friedmann equation, not an energy density). */
export function densityOfA(a: number, p: CosmoParams): number {
  return (
    p.omegaR / (a * a * a * a) +
    p.omegaM / (a * a * a) +
    p.omegaLambda
  );
}

/** Per-component reduced densities ρ_i/ρ_crit,0 at scale factor a.
 *  Useful for the "component scaling race" plot: radiation a⁻⁴, matter a⁻³,
 *  Λ constant. */
export function componentDensities(
  a: number,
  p: CosmoParams,
): { radiation: number; matter: number; lambda: number } {
  return {
    radiation: p.omegaR / (a * a * a * a),
    matter: p.omegaM / (a * a * a),
    lambda: p.omegaLambda,
  };
}

/** Scale factor at matter–radiation equality, ρ_m = ρ_r ⇒ a_eq = Ω_r/Ω_m.
 *  Returns Infinity if there is no radiation. For the concordance model
 *  (Ω_r ≈ 9.0e-5, Ω_m ≈ 0.31) this is ≈ 2.9e-4, i.e. z_eq ≈ 3400. */
export function equalityScaleMatterRadiation(p: CosmoParams): number {
  if (p.omegaR <= 0) return Infinity;
  return p.omegaR / p.omegaM;
}

/** Scale factor at matter–Λ equality, ρ_m = ρ_Λ ⇒ a = (Ω_m/Ω_Λ)^{1/3}.
 *  For the concordance model (Ω_m ≈ 0.31, Ω_Λ ≈ 0.69) this is ≈ 0.77,
 *  i.e. z ≈ 0.30. */
export function equalityScaleMatterLambda(p: CosmoParams): number {
  if (p.omegaLambda <= 0) return Infinity;
  return Math.cbrt(p.omegaM / p.omegaLambda);
}

// ─── The acceleration equation ───────────────────────────────────────────────

/** Deceleration parameter q ≡ −ä a/ȧ² as a function of a.
 *  Radiation contributes pressure p = ρc²/3, matter is pressureless, and Λ has
 *  p = −ρc². Collecting these in the second Friedmann equation gives
 *    q(a) = [ Ω_r a⁻⁴ + ½ Ω_m a⁻³ − Ω_Λ ] / E(a)².
 *  q > 0 ⇒ decelerating; q < 0 ⇒ accelerating; q = 0 ⇒ coasting. */
export function decelerationParameter(a: number, p: CosmoParams): number {
  const e2 =
    p.omegaR / (a * a * a * a) +
    p.omegaM / (a * a * a) +
    curvatureDensity(p) / (a * a) +
    p.omegaLambda;
  if (e2 <= 0) return NaN;
  const num =
    p.omegaR / (a * a * a * a) +
    0.5 * p.omegaM / (a * a * a) -
    p.omegaLambda;
  return num / e2;
}

/** Present-day deceleration parameter q₀ = Ω_r + ½Ω_m − Ω_Λ (a = 1).
 *  For the concordance model q₀ ≈ −0.55: the universe is accelerating today. */
export function decelerationParameterToday(p: CosmoParams): number {
  return decelerationParameter(1, p);
}

/** Reduced acceleration ä/(a H₀²) = −½(ρ + 3p)/ρ_crit,0 + Ω_Λ, in dimensionless
 *  form. Positive ⇒ accelerating expansion. */
export function reducedAcceleration(a: number, p: CosmoParams): number {
  // ä/(a H₀²) = Ω_Λ − Ω_m/(2a³) − Ω_r/a⁴   (matter ½, radiation full weight)
  return (
    p.omegaLambda -
    0.5 * p.omegaM / (a * a * a) -
    p.omegaR / (a * a * a * a)
  );
}

/** Scale factor at the deceleration→acceleration transition (ä = 0), matter +
 *  Λ only (radiation negligible by then): a_acc = (Ω_m/(2Ω_Λ))^{1/3}.
 *  Concordance: a ≈ 0.61, z ≈ 0.63 — the famous "cosmic jerk". Returns NaN if
 *  the model never accelerates (Ω_Λ ≤ 0). */
export function accelerationOnsetScale(p: CosmoParams): number {
  if (p.omegaLambda <= 0) return NaN;
  return Math.cbrt(p.omegaM / (2 * p.omegaLambda));
}

/** Convert a scale factor to redshift, 1 + z = 1/a. */
export function scaleToRedshift(a: number): number {
  return 1 / a - 1;
}

// ─── Integrating the scale factor a(t) ───────────────────────────────────────

export interface ScaleFactorSample {
  /** Cosmic time in units of 1/H₀ (the Hubble time). */
  t: number;
  /** Scale factor, normalised to a = 1 today. */
  a: number;
}

export interface IntegrateOptions {
  /** Initial scale factor (small but nonzero to avoid the singularity). */
  a0?: number;
  /** Time step in units of 1/H₀. */
  dt?: number;
  /** Maximum number of steps before bailing out. */
  maxSteps?: number;
  /** Stop once a exceeds this (for accelerating/coasting models). */
  aMax?: number;
}

/**
 * Integrate the FIRST Friedmann equation ȧ = a·H₀·E(a) forward in time with a
 * fixed-step RK4 scheme (dimensionless time τ = H₀ t). The integration tracks
 * the sign of ȧ: in a recollapsing (closed, Λ-free) universe E(a) reaches 0 at
 * the turning point a_max, after which the universe contracts — we flip the
 * sign and continue until a returns toward the initial value (a Big Crunch).
 *
 * Returns samples of (t, a). This is a pedagogical integrator, not a precision
 * cosmology code: fixed step, no event detection beyond the turning point.
 */
export function integrateScaleFactor(
  p: CosmoParams,
  opts: IntegrateOptions = {},
): ScaleFactorSample[] {
  const a0 = opts.a0 ?? 1e-3;
  const dt = opts.dt ?? 2e-3;
  const maxSteps = opts.maxSteps ?? 200000;
  const aMax = opts.aMax ?? 8;

  const samples: ScaleFactorSample[] = [{ t: 0, a: a0 }];
  let a = a0;
  let t = 0;
  let direction = 1; // +1 expanding, −1 contracting

  // ȧ = direction · a · E(a)
  const adot = (av: number) => direction * av * expansionRate(av, p);

  for (let step = 0; step < maxSteps; step++) {
    // Detect a turning point: E(a) = 0 while expanding ⇒ recollapse begins.
    if (direction > 0 && expansionRate(a, p) === 0 && a > a0 * 1.5) {
      direction = -1;
    }

    // RK4 step on a(t).
    const k1 = adot(a);
    const k2 = adot(a + 0.5 * dt * k1);
    const k3 = adot(a + 0.5 * dt * k2);
    const k4 = adot(a + dt * k3);
    a = a + (dt / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
    t += dt;

    if (!Number.isFinite(a) || a <= 0) break;
    samples.push({ t, a });

    if (direction > 0 && a >= aMax) break;
    if (direction < 0 && a <= a0) break; // Big Crunch
  }

  return samples;
}

/**
 * Classify the qualitative fate of an FLRW model from its density parameters.
 *  - "recollapse": closed, matter-dominated, Λ too weak to halt contraction;
 *  - "accelerate": Λ eventually dominates and ä > 0 at late times;
 *  - "coast": marginal — expands forever but decelerating toward ȧ → const.
 * The decision uses the late-time behaviour of E(a): if Ω_Λ > 0 the universe
 * accelerates; if Ω_Λ = 0 and Ω_k ≥ 0 (flat/open) it coasts/expands forever;
 * if Ω_Λ = 0 and Ω_k < 0 (closed) it recollapses.
 */
export function universeFate(
  p: CosmoParams,
): "recollapse" | "coast" | "accelerate" {
  if (p.omegaLambda > 1e-9) {
    // With positive Λ, check whether matter+curvature ever stops expansion
    // before Λ takes over. For the regimes this topic explores (Ω_Λ ≳ 0.1),
    // Λ always wins ⇒ accelerate. A pathological closed model with tiny Λ can
    // still recollapse; we approximate by requiring E(a) > 0 for all a ≥ 1.
    const ok = curvatureDensity(p);
    if (ok >= 0) return "accelerate";
    // closed with small Λ: test the minimum of E²(a) for a > 1
    // E²(a) = Ω_m/a³ + Ω_k/a² + Ω_Λ; minimise over a.
    // dE²/da = −3Ω_m/a⁴ − 2Ω_k/a³ = 0 → a* = −(3Ω_m)/(2Ω_k) (Ω_k<0 ⇒ a*>0)
    const aStar = (-3 * p.omegaM) / (2 * ok);
    if (aStar > 0) {
      const e2min =
        p.omegaM / (aStar * aStar * aStar) +
        ok / (aStar * aStar) +
        p.omegaLambda;
      if (e2min < 0) return "recollapse";
    }
    return "accelerate";
  }
  // Λ = 0
  const ok = curvatureDensity(p);
  if (ok < -1e-9) return "recollapse"; // closed matter universe
  return "coast"; // flat or open, expands forever (decelerating)
}

/** Concordance (ΛCDM) parameters, rounded to the values quoted in the essay:
 *  Ω_m ≈ 0.31, Ω_Λ ≈ 0.69, Ω_r ≈ 9.0e-5, hence Ω_k ≈ 0 (spatially flat). */
export const CONCORDANCE: CosmoParams = {
  omegaM: 0.31,
  omegaR: 9.0e-5,
  omegaLambda: 0.6899,
};
