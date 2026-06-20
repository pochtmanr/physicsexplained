/**
 * §57 THE CMB AND BIG BANG NUCLEOSYNTHESIS — pure-TS helpers.
 *
 * Two physical stories live in this file:
 *
 *  1. The cosmic microwave background (CMB) is a near-perfect blackbody at
 *     T₀ = 2.725 K. Its spectrum is the Planck law; COBE/FIRAS measured it in
 *     1990 with error bars far smaller than the line width on any plot.
 *
 *  2. Big Bang nucleosynthesis (BBN): in the first ~3 minutes the universe
 *     forged the light elements. The mass fraction of helium-4, Y_p ≈ 0.25,
 *     is set almost entirely by the neutron-to-proton ratio frozen in at
 *     T ≈ 0.7 MeV, and depends only weakly (logarithmically) on the baryon
 *     density. That near-constancy is why BBN pinned the baryon count of the
 *     universe decades before the Planck satellite measured it from the CMB.
 *
 * This file is React-free and self-contained: it defines its own physical
 * constants in SI so the scenes and tests can import pure functions.
 */

// ─── Local physical constants (SI) ───────────────────────────────────────────
/** Speed of light, m/s. */
export const C_LIGHT = 2.99792458e8;
/** Planck constant, J·s. */
export const H_PLANCK = 6.62607015e-34;
/** Boltzmann constant, J/K. */
export const K_BOLTZMANN = 1.380649e-23;
/** Present-day CMB temperature, kelvin (Fixsen 2009, from COBE/FIRAS+WMAP). */
export const T_CMB = 2.725;
/** Wien displacement constant b = h c / (x_max k), m·K, with x_max ≈ 2.821439. */
export const WIEN_B = 2.897771955e-3;

// ─── Planck blackbody spectrum ───────────────────────────────────────────────

/**
 * Spectral radiance of a blackbody by frequency:
 *
 *   B_ν(T) = (2 h ν³ / c²) · 1 / (exp(hν/kT) − 1)     [W·sr⁻¹·m⁻²·Hz⁻¹]
 *
 * This is the Planck law. The CMB matches it to better than 50 parts per
 * million across the FIRAS band — the most perfect blackbody ever measured.
 */
export function planckByFrequency(nu: number, T: number = T_CMB): number {
  if (nu <= 0 || T <= 0) return 0;
  const x = (H_PLANCK * nu) / (K_BOLTZMANN * T);
  // Guard against overflow in the exponential at large x.
  const denom = Math.expm1(x);
  if (!isFinite(denom) || denom <= 0) return 0;
  return (2 * H_PLANCK * Math.pow(nu, 3)) / (C_LIGHT * C_LIGHT) / denom;
}

/**
 * Spectral radiance of a blackbody by wavelength:
 *
 *   B_λ(T) = (2 h c² / λ⁵) · 1 / (exp(hc/λkT) − 1)     [W·sr⁻¹·m⁻²·m⁻¹]
 */
export function planckByWavelength(lambda: number, T: number = T_CMB): number {
  if (lambda <= 0 || T <= 0) return 0;
  const x = (H_PLANCK * C_LIGHT) / (lambda * K_BOLTZMANN * T);
  const denom = Math.expm1(x);
  if (!isFinite(denom) || denom <= 0) return 0;
  return (2 * H_PLANCK * C_LIGHT * C_LIGHT) / Math.pow(lambda, 5) / denom;
}

/**
 * Frequency of peak spectral radiance B_ν, from Wien's displacement law in
 * frequency form: ν_peak = x_max · k T / h with x_max ≈ 2.821439. Returns Hz.
 * For T = 2.725 K this is ≈ 1.60 × 10¹¹ Hz (160 GHz).
 */
export function peakFrequency(T: number = T_CMB): number {
  const X_MAX = 2.8214393721; // root of (x−3)eˣ + 3 = 0
  return (X_MAX * K_BOLTZMANN * T) / H_PLANCK;
}

/**
 * Wavelength of peak spectral radiance B_λ, from Wien's displacement law:
 *   λ_peak = b / T.
 * For T = 2.725 K this is ≈ 1.06 × 10⁻³ m (≈ 1.06 mm, microwave).
 */
export function peakWavelength(T: number = T_CMB): number {
  return WIEN_B / T;
}

// ─── Cosmological redshift / scaling of the CMB ──────────────────────────────

/**
 * The CMB temperature scales as T(z) = T₀ (1 + z) because the photon gas
 * cools adiabatically with expansion (a ∝ 1/(1+z), and T ∝ 1/a for radiation).
 * At recombination (z ≈ 1100) the universe was T ≈ 3000 K — cool enough for
 * neutral hydrogen, hot enough that the spectrum still peaked in the visible.
 */
export function cmbTemperatureAtRedshift(z: number, T0: number = T_CMB): number {
  return T0 * (1 + z);
}

/**
 * Redshift since last scattering for a blackbody now at T_now that was emitted
 * at T_emit: 1 + z = T_emit / T_now. The CMB last scattered at ~3000 K and is
 * observed at 2.725 K, giving z ≈ 1100.
 */
export function redshiftFromTemperatures(T_emit: number, T_now: number = T_CMB): number {
  if (T_now <= 0) return Infinity;
  return T_emit / T_now - 1;
}

// ─── Big Bang nucleosynthesis: the helium fraction ───────────────────────────

/**
 * Neutron-to-proton ratio frozen out of equilibrium when the weak interactions
 * can no longer keep up with the expansion, at the freeze-out temperature
 * T_f ≈ 0.7–0.8 MeV. In equilibrium n/p = exp(−Δm c² / kT) with the
 * neutron–proton mass difference Δm c² = Q = 1.293 MeV. We evaluate that
 * Boltzmann factor at the freeze-out temperature (in MeV).
 */
export function neutronProtonRatio(T_freeze_MeV: number): number {
  const Q_MEV = 1.29333; // (m_n − m_p) c² in MeV
  if (T_freeze_MeV <= 0) return 0;
  return Math.exp(-Q_MEV / T_freeze_MeV);
}

/**
 * Primordial helium-4 mass fraction from the neutron fraction at the onset of
 * nucleosynthesis. Essentially every surviving neutron ends up paired with a
 * proton inside a ⁴He nucleus, so with X_n = n / (n + p) the helium mass
 * fraction is
 *
 *   Y_p = 2 X_n          (two nucleons of ⁴He are neutrons, two are protons,
 *                         and there are equal numbers of each).
 *
 * Equivalently, with r = n/p at the time deuterium becomes stable,
 *   Y_p = 2r / (1 + r).
 * The classic back-of-envelope: freeze-out gives r ≈ 1/6, neutron decay
 * during the ~3-minute wait drops it to ≈ 1/7, and Y_p ≈ 2(1/7)/(1+1/7) = 0.25.
 */
export function heliumMassFraction(neutronProtonAtBBN: number): number {
  const r = neutronProtonAtBBN;
  if (r < 0) return 0;
  return (2 * r) / (1 + r);
}

/**
 * Decay of the neutron-to-proton ratio while free neutrons β-decay during the
 * wait between weak freeze-out (t ≈ 1 s) and the start of fusion (t ≈ 180 s),
 * with the free-neutron lifetime τ_n ≈ 879 s:
 *
 *   r(t) = r₀ · exp(−t / τ_n)  applied to the neutron count, then re-expressed
 *   as a ratio against the (growing) proton count.
 *
 * We model the neutron *fraction* X_n = r/(1+r) decaying as exp(−t/τ_n) and
 * convert back to a ratio, since decayed neutrons become protons.
 */
export function neutronProtonAfterDecay(
  r0: number,
  t_seconds: number,
  tau_n: number = 879.4,
): number {
  const Xn0 = r0 / (1 + r0);
  const Xn = Xn0 * Math.exp(-t_seconds / tau_n);
  // X_n is a fraction of all nucleons; convert back to n/p ratio.
  return Xn / (1 - Xn);
}

/**
 * A compact phenomenological estimate of Y_p as a function of the baryon-to-
 * photon ratio η₁₀ = η × 10¹⁰ (the standard BBN control parameter). Real BBN
 * codes integrate a reaction network; the observed value Y_p ≈ 0.247 sits at
 * η₁₀ ≈ 6.1. The dependence is famously *weak* — roughly logarithmic — which
 * is exactly why a measured helium abundance pins the baryon density only
 * loosely but robustly, and why the much sharper deuterium abundance is the
 * precision "baryometer."
 *
 *   Y_p ≈ 0.2484 + 0.0016 · ln(η₁₀ / 6.1)
 *
 * Valid roughly for η₁₀ ∈ [1, 12]; clamps to a physical band.
 */
export function heliumFractionFromBaryon(eta10: number): number {
  if (eta10 <= 0) return 0;
  const y = 0.2484 + 0.0016 * Math.log(eta10 / 6.1);
  return Math.min(0.27, Math.max(0.21, y));
}
