/**
 * §43 THE CLASSICAL TESTS — A WHOLE THEORY ON TRIAL — pure-TS helpers.
 *
 * General relativity was published on November 25, 1915. In the 110 years
 * since, the same four-component metric has been put on trial by four
 * independent kinds of measurement:
 *
 *   1. Perihelion precession — the orbit of Mercury (retrodiction, 1915).
 *   2. Light deflection      — Eddington's eclipse expedition (1919).
 *   3. Gravitational redshift — Pound & Rebka at Harvard (1960).
 *   4. Shapiro delay          — radar to Venus (1964) → Cassini (2002).
 *
 * Each test probes a different layer of the theory, each has a textbook
 * GR prediction, and each has a measured value that agrees. This module
 * codifies the four tests, the precision history of each (1915 → 2020 on a
 * log scale), and the Parametrized Post-Newtonian (PPN) framework that turns
 * "does GR pass?" into a continuous number.
 *
 * The file is intentionally self-contained: it duplicates the few small
 * constants it needs rather than importing a shared physics module, so the
 * topic owns its own arithmetic.
 *
 * Conventions:
 *   • Precision is reported as a FRACTIONAL agreement — the size of the
 *     allowed deviation from the GR prediction (smaller = tighter).
 *   • Years are calendar years of the canonical published result.
 *   • PPN parameters are dimensionless; in GR γ = β = 1 exactly.
 */

/** Which structural layer of the theory a given test probes. */
export type TheoryLayer =
  | "equivalence-principle"
  | "metric"
  | "field-equations";

/** A single classical test of general relativity. */
export interface ClassicalTest {
  /** Stable id used for selection in scenes. */
  readonly id: "perihelion" | "deflection" | "redshift" | "shapiro";
  /** Display name. */
  readonly name: string;
  /** The GR prediction, as a short human string with units. */
  readonly prediction: string;
  /** The canonical measured value, as a short human string with units. */
  readonly measurement: string;
  /** Year of the first decisive confirmation. */
  readonly firstYear: number;
  /** Best fractional agreement achieved to date (smaller = tighter). */
  readonly bestPrecision: number;
  /** Which layer of the theory the test most directly probes. */
  readonly layer: TheoryLayer;
  /** One-line gloss of what the number means physically. */
  readonly probes: string;
}

/**
 * The four classical tests, in the order they were confirmed.
 *
 * Numbers, briefly:
 *   • Perihelion: GR adds 42.98″/century to Mercury's perihelion advance,
 *     closing the 43″ gap Le Verrier found in 1859. Modern radar ranging
 *     confirms the GR term to ~10⁻³.
 *   • Deflection: GR predicts 1.75″ for a ray grazing the Sun's limb (twice
 *     the Newtonian-photon value). Eddington's 1919 plates gave ~30% error;
 *     VLBI radio astrometry now reaches ~10⁻⁴.
 *   • Redshift: a photon climbing Earth's field is redshifted by gh/c².
 *     Pound-Rebka (1960) measured the 2.5×10⁻¹⁵ shift over 22.5 m to ~10%;
 *     Gravity Probe A (1976) reached 7×10⁻⁵; optical clocks now ~10⁻⁵.
 *   • Shapiro: a radar echo grazing the Sun is delayed ~200 μs. The 1964
 *     Venus experiment confirmed it; the 2002 Cassini superior-conjunction
 *     measurement reached 2.3×10⁻⁵ on the PPN parameter γ.
 */
export function classicalTests(): readonly ClassicalTest[] {
  return [
    {
      id: "perihelion",
      name: "Perihelion precession",
      prediction: "42.98″/century",
      measurement: "43.1 ± 0.5″/century",
      firstYear: 1915,
      bestPrecision: 1e-3,
      layer: "field-equations",
      probes:
        "The nonlinear, higher-order structure of the Schwarzschild metric — the part Newton's 1/r potential cannot reproduce.",
    },
    {
      id: "deflection",
      name: "Light deflection",
      prediction: "1.75″ at the solar limb",
      measurement: "1.61 ± 0.40″ (1919)",
      firstYear: 1919,
      bestPrecision: 1e-4,
      layer: "metric",
      probes:
        "The spatial curvature of the metric (the PPN parameter γ): a photon feels both the time and the space parts, doubling the Newtonian value.",
    },
    {
      id: "redshift",
      name: "Gravitational redshift",
      prediction: "Δν/ν = gh/c² = 2.5×10⁻¹⁵",
      measurement: "agreement to 10% (1960)",
      firstYear: 1960,
      bestPrecision: 1e-5,
      layer: "equivalence-principle",
      probes:
        "The equivalence principle alone — clocks run slower deeper in a potential. No field equation is needed to predict it.",
    },
    {
      id: "shapiro",
      name: "Shapiro time delay",
      prediction: "~200 μs round trip past the Sun",
      measurement: "γ = 1 to 2.3×10⁻⁵ (Cassini)",
      firstYear: 1964,
      bestPrecision: 2.3e-5,
      layer: "metric",
      probes:
        "The same γ as deflection, but through coordinate light-travel time rather than bending — an independent handle on spatial curvature.",
    },
  ];
}

/** A point in a test's precision history (year, fractional agreement). */
export interface PrecisionPoint {
  readonly year: number;
  /** Fractional agreement at that epoch (smaller = better). */
  readonly precision: number;
  /** Short label for the milestone. */
  readonly label: string;
}

/**
 * Precision history per test, 1915 → ~2020, for the log-scale chart.
 * Each list is ordered by year; precision is the fractional bound at that
 * epoch and decreases monotonically as instruments improve.
 */
export function precisionHistory(): Record<
  ClassicalTest["id"],
  readonly PrecisionPoint[]
> {
  return {
    perihelion: [
      { year: 1915, precision: 1e-1, label: "Einstein (retrodiction)" },
      { year: 1947, precision: 1e-2, label: "Clemence ephemeris" },
      { year: 1990, precision: 1e-3, label: "radar ranging" },
    ],
    deflection: [
      { year: 1919, precision: 3e-1, label: "Eddington eclipse" },
      { year: 1973, precision: 1e-2, label: "VLBI (early)" },
      { year: 2004, precision: 1e-4, label: "VLBI astrometry" },
    ],
    redshift: [
      { year: 1960, precision: 1e-1, label: "Pound–Rebka" },
      { year: 1976, precision: 7e-5, label: "Gravity Probe A" },
      { year: 2018, precision: 1e-5, label: "optical clocks" },
    ],
    shapiro: [
      { year: 1964, precision: 5e-2, label: "Venus radar" },
      { year: 1979, precision: 1e-3, label: "Viking Mars" },
      { year: 2002, precision: 2.3e-5, label: "Cassini" },
    ],
  };
}

/**
 * PPN parameters. In Newtonian gravity γ = β = 0 (no space curvature, no
 * nonlinearity); in general relativity both equal exactly 1. Real
 * measurements bound |γ−1| and |β−1| near zero.
 */
export interface PpnParameters {
  /** How much space curvature a unit rest mass produces. GR: 1. */
  readonly gamma: number;
  /** How much nonlinearity there is in the superposition of gravity. GR: 1. */
  readonly beta: number;
}

/** The exact GR values of the two main PPN parameters. */
export const GR_PPN: PpnParameters = { gamma: 1, beta: 1 };

/**
 * Light deflection at the solar limb, parametrized by γ.
 *
 *   δθ = (1 + γ)/2 · (4GM☉)/(c² R☉)
 *
 * The leading factor (4GM/c²R) is 1.75″; the (1+γ)/2 prefactor is 1 in GR
 * (γ = 1) and ½ for a Newtonian photon (γ = 0). Returns arcseconds.
 */
export function deflectionArcsec(gamma: number): number {
  const FULL_GR_LIMB_ARCSEC = 1.7509; // 4GM☉/(c²R☉) in arcseconds
  return ((1 + gamma) / 2) * FULL_GR_LIMB_ARCSEC;
}

/**
 * Fractional Shapiro-delay coefficient relative to GR, parametrized by γ.
 * The measured round-trip delay scales as (1+γ)/2 times the GR value, so
 * this returns the multiplier (1 in GR, ½ for a γ=0 "Newtonian" photon).
 */
export function shapiroCoefficient(gamma: number): number {
  return (1 + gamma) / 2;
}

/**
 * Gravitational redshift between two heights in a uniform field g over a
 * vertical separation h: Δν/ν = g h / c². Returns the fractional frequency
 * shift (positive = redshift for an upward-climbing photon).
 */
export function gravitationalRedshiftFraction(g: number, h: number): number {
  const C = 299_792_458; // m/s, exact
  return (g * h) / (C * C);
}

/**
 * Map a fractional precision (e.g. 1e-5) to a number of "nines" of
 * agreement — a friendly log10 readout. precision 1e-5 → 5 nines.
 * Clamped at 0 for precision ≥ 1.
 */
export function ninesOfAgreement(precision: number): number {
  if (precision <= 0) return Infinity;
  if (precision >= 1) return 0;
  return -Math.log10(precision);
}

/**
 * Whether a measured PPN pair is consistent with GR within a tolerance on
 * each parameter. Used to phrase "GR has never failed" quantitatively.
 */
export function isConsistentWithGr(
  measured: PpnParameters,
  tol = 1e-3,
): boolean {
  return (
    Math.abs(measured.gamma - GR_PPN.gamma) <= tol &&
    Math.abs(measured.beta - GR_PPN.beta) <= tol
  );
}
