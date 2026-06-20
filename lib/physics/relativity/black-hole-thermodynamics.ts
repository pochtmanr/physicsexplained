/**
 * §48 BLACK-HOLE THERMODYNAMICS — pure-TS helpers.
 *
 * In 1971 Stephen Hawking proved the AREA THEOREM: in any classical process
 * obeying the energy conditions, the total area of black-hole event horizons
 * cannot decrease, dA ≥ 0. The resemblance to the second law of
 * thermodynamics (dS ≥ 0) was not lost on Jacob Bekenstein, who in 1972–73
 * argued that a black hole must carry a real entropy proportional to its
 * horizon area. Hawking's 1974 calculation of the temperature fixed the
 * proportionality constant exactly:
 *
 *   S_BH = (k_B c³ / 4 G ℏ) · A  =  (k_B / 4) · (A / ℓ_P²)
 *
 * where ℓ_P = √(ℏG/c³) is the Planck length. The entropy is one quarter of
 * the horizon area measured in Planck units — the single most quoted formula
 * of quantum gravity.
 *
 * This file is React-free. Two modes of units are used, kept deliberately
 * separate so the scenes never have to choose a mass scale:
 *
 *   • GEOMETRIZED (G = c = 1): all radii and areas in units of M. Used by the
 *     area-theorem checker, exactly as the Kerr helpers do.
 *   • SI: real kilograms, joules per kelvin, kelvin. Used by the entropy-scale
 *     bars and the temperature readouts.
 *
 * No shared constants file is edited; the handful of SI constants this topic
 * needs are declared here as a self-contained copy.
 */

// ─── Self-contained SI constants (CODATA 2018 / SI-2019) ─────────────────────

/** Gravitational constant, m³ kg⁻¹ s⁻². */
export const G_SI = 6.6743e-11;
/** Speed of light in vacuum, m/s (exact). */
export const C_SI = 2.99792458e8;
/** Reduced Planck constant ℏ = h/2π, J·s. */
export const HBAR_SI = 1.054571817e-34;
/** Boltzmann constant, J/K (exact, SI-2019). */
export const KB_SI = 1.380649e-23;
/** One solar mass, kg (IAU). */
export const M_SUN_KG = 1.98892e30;

/** Planck length ℓ_P = √(ℏG/c³), metres (≈ 1.616 × 10⁻³⁵ m). */
export const PLANCK_LENGTH = Math.sqrt((HBAR_SI * G_SI) / (C_SI * C_SI * C_SI));

/** Planck area ℓ_P², m² (≈ 2.61 × 10⁻⁷⁰ m²). */
export const PLANCK_AREA = PLANCK_LENGTH * PLANCK_LENGTH;

// ─── Geometrized helpers (units of M, G = c = 1) ─────────────────────────────

/** Clamp a dimensionless spin a* = a/M into the physical range [0, 1].
 *  Folds negatives to their magnitude; maps non-finite input to 0; super-
 *  extremal spins (|a*| > 1, a naked singularity) are pinned to the extremal
 *  value 1, matching the Kerr helpers. */
export function clampSpin(aStar: number): number {
  if (!Number.isFinite(aStar)) return aStar === Infinity ? 1 : 0;
  const a = Math.abs(aStar);
  return a > 1 ? 1 : a;
}

/** Outer event-horizon radius r_+ = M(1 + √(1 − a*²)), in units of M.
 *  Schwarzschild value 2M at a* = 0; extremal value M at a* = 1. */
export function horizonRadius(aStar: number): number {
  const a = clampSpin(aStar);
  return 1 + Math.sqrt(1 - a * a);
}

/**
 * Horizon area of a Kerr black hole of mass M (in units of M) and spin a*.
 *
 *   A = 8π M² (1 + √(1 − a*²))         [in units of M²]
 *
 * At a* = 0 this is 16π M² (the Schwarzschild value 4π r_s² with r_s = 2M);
 * at a* = 1 (extremal) it falls to 8π M². Area is monotonically decreasing in
 * spin at fixed M — spinning a hole up at fixed mass shrinks its horizon.
 */
export function horizonArea(massM: number, aStar: number): number {
  const a = clampSpin(aStar);
  return 8 * Math.PI * massM * massM * (1 + Math.sqrt(1 - a * a));
}

/**
 * Irreducible mass M_irr = √(A / 16π), in units of M.
 *
 * For a hole of mass M and spin a*, M_irr = M·√((1 + √(1 − a*²))/2). It is the
 * mass that survives after every joule of rotational energy is extracted (the
 * Penrose process / superradiance), leaving a Schwarzschild hole. Because area
 * never decreases, M_irr never decreases — it is the thermodynamically
 * "locked-in" mass.
 */
export function irreducibleMass(massM: number, aStar: number): number {
  return Math.sqrt(horizonArea(massM, aStar) / (16 * Math.PI));
}

/**
 * Surface gravity κ of a Kerr black hole, in units of 1/M (G = c = 1).
 *
 *   κ = √(M² − a²) / (2M r_+) = (r_+ − r_−) / (2(r_+² + a²))
 *
 * For Schwarzschild (a* = 0) this is κ = 1/(4M); it falls to ZERO at
 * extremality (a* = 1) — the statement of the THIRD law (you cannot reach a
 * zero-temperature, extremal hole in finitely many steps). κ is constant over
 * the horizon (the ZEROTH law) and plays the role of temperature:
 * T = ℏκ / 2π k_B c.
 */
export function surfaceGravity(massM: number, aStar: number): number {
  const a = clampSpin(aStar) * massM;
  const rPlus = massM + Math.sqrt(massM * massM - a * a);
  return Math.sqrt(massM * massM - a * a) / (2 * massM * rPlus);
}

/**
 * The area theorem check for an irreversible merger.
 *
 * Two holes of masses M₁, M₂ and spins a₁, a₂ coalesce into a single hole.
 * Energy radiated as gravitational waves (a fraction `radiatedFraction` of the
 * total mass) leaves with the merged hole; we assume the remnant is
 * Schwarzschild for a conservative lower bound on its area, since adding spin
 * at fixed mass would only shrink it (the checker passes most easily when the
 * remnant is non-spinning). Returns the three areas and whether
 * A_final ≥ A₁ + A₂ holds — it always does for radiatedFraction below the
 * area-theorem bound, which is the whole point.
 */
export interface MergerResult {
  areaIn: number; // A₁ + A₂
  areaFinal: number; // A of the remnant
  massFinal: number; // M_f in the same mass units as inputs
  satisfies: boolean; // A_final ≥ A₁ + A₂ ?
}

export function mergerAreaCheck(
  m1: number,
  a1: number,
  m2: number,
  a2: number,
  radiatedFraction = 0,
  remnantSpin = 0,
): MergerResult {
  const area1 = horizonArea(m1, a1);
  const area2 = horizonArea(m2, a2);
  const areaIn = area1 + area2;
  const f = Math.min(Math.max(radiatedFraction, 0), 1);
  const massFinal = (m1 + m2) * (1 - f);
  const areaFinal = horizonArea(massFinal, remnantSpin);
  return {
    areaIn,
    areaFinal,
    massFinal,
    satisfies: areaFinal >= areaIn - 1e-9 * areaIn,
  };
}

/**
 * Maximum mass fraction that may be radiated by a head-on merger of two
 * EQUAL, non-spinning Schwarzschild holes without violating the area theorem.
 *
 * Each input hole has area A = 16π M²; two give 32π M². The remnant of mass
 * M_f = 2M(1 − f) has area ≥ 16π M_f² = 64π M²(1 − f)², so the theorem demands
 * (1 − f)² ≥ 1/2, i.e. f ≤ 1 − 1/√2 ≈ 0.293. Real mergers radiate only a few
 * percent — far inside the bound, with entropy to spare.
 */
export function maxRadiatedFractionEqualMerger(): number {
  return 1 - 1 / Math.SQRT2;
}

// ─── SI helpers (kilograms, kelvin, joules per kelvin) ───────────────────────

/** Schwarzschild radius r_s = 2GM/c², metres. */
export function schwarzschildRadiusSI(massKg: number): number {
  return (2 * G_SI * massKg) / (C_SI * C_SI);
}

/** Schwarzschild horizon area A = 4π r_s² = 16π G²M²/c⁴, m². */
export function horizonAreaSI(massKg: number): number {
  const rs = schwarzschildRadiusSI(massKg);
  return 4 * Math.PI * rs * rs;
}

/**
 * Bekenstein–Hawking entropy of a Schwarzschild hole, in J/K.
 *
 *   S = k_B c³ A / (4 G ℏ) = (k_B / 4)(A / ℓ_P²)
 *
 * A solar-mass hole carries S ≈ 1.0 × 10⁵⁴ J/K, or ≈ 10⁷⁷ in units of k_B —
 * vastly more than the ≈ 10⁵⁸ k_B of the gas and radiation that formed it.
 * Black holes are the most entropic objects in the universe.
 */
export function bekensteinHawkingEntropySI(massKg: number): number {
  const A = horizonAreaSI(massKg);
  return (KB_SI * Math.pow(C_SI, 3) * A) / (4 * G_SI * HBAR_SI);
}

/** Bekenstein–Hawking entropy in dimensionless units of k_B (S/k_B):
 *  the count of horizon Planck cells, S/k_B = A / 4ℓ_P². */
export function entropyInBits(massKg: number): number {
  return horizonAreaSI(massKg) / (4 * PLANCK_AREA);
}

/**
 * Hawking temperature of a Schwarzschild hole, in kelvin.
 *
 *   T = ℏ c³ / (8π G M k_B)
 *
 * A solar-mass hole is at T ≈ 6.2 × 10⁻⁸ K — far colder than the 2.725 K CMB,
 * which is why astrophysical holes absorb today rather than evaporate. T ∝ 1/M:
 * small holes are hot.
 */
export function hawkingTemperatureSI(massKg: number): number {
  return (HBAR_SI * Math.pow(C_SI, 3)) / (8 * Math.PI * G_SI * massKg * KB_SI);
}
