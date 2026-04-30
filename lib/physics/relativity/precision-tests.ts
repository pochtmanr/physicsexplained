/**
 * §05.4 PRECISION TESTS OF SPECIAL RELATIVITY — pure-TS helpers.
 *
 * Special relativity has been the most-tested theory in physics since 1887.
 * Every test has agreed. The bound on Lorentz-violating coefficients has
 * tightened from one part in 10⁹ (Michelson-Morley 1887) to one part in
 * 10¹⁸ (modern optical-clock comparisons), nine orders of magnitude in
 * 138 years.
 *
 * This file provides the canonical timeline of precision tests, the modern
 * SME (Standard-Model Extension) coefficient bounds compiled from the
 * literature, and the order-of-magnitude estimate for a "natural"
 * quantum-gravity-induced violation that the bounds rule out by 14+
 * orders of magnitude.
 *
 * Conventions:
 *   • All bounds are dimensionless (fractional anisotropy, e.g. Δc/c).
 *   • Years are calendar years of the canonical published result.
 *   • c (SI exact) is taken from `@/lib/physics/constants`.
 */

import { SPEED_OF_LIGHT } from "@/lib/physics/constants";

/** A single canonical experiment in the SR-precision timeline. */
export interface PrecisionTestEntry {
  /** Calendar year of the canonical published result. */
  readonly year: number;
  /** Experiment label, including the team where conventional. */
  readonly experiment: string;
  /** Order-of-magnitude bound on the relevant Lorentz-violating coefficient
   *  (fractional, dimensionless). Smaller = tighter constraint. */
  readonly bound: number;
  /** One-line description of the experimental technique. */
  readonly technique: string;
}

/**
 * Canonical timeline of precision Lorentz-invariance tests, ordered
 * chronologically. The bounds are order-of-magnitude figures compiled from
 * the standard reviews (Will, *Theory and Experiment in Gravitational
 * Physics*; Mattingly, *Modern Tests of Lorentz Invariance*; Kostelecký +
 * Russell, *Data Tables for Lorentz and CPT Violation*).
 *
 * Notes on the entries:
 *   • Michelson-Morley 1887 — the original interferometer, no fringe shift
 *     to 1 part in 10⁹ in Δc/c.
 *   • Kennedy-Thorndike 1932 — asymmetric arm interferometer, sensitive to
 *     boost-direction-dependent variations Galileo-equivalence misses.
 *   • Hughes-Drever 1959–60 — Li-7 NMR isotropy, the first qualitative leap
 *     in precision (parts in 10¹⁵), an entirely different observable.
 *   • Brillet-Hall 1979 — refined Michelson-Morley with He-Ne lasers; for
 *     this specific isotropy bound it was a slight regression vs.
 *     Hughes-Drever (different observable, not directly comparable).
 *   • Modern optical-clock comparisons (Sr, Yb, Al⁺ lattice clocks) have
 *     pushed the bound to parts in 10¹⁸ since 2015.
 */
export function precisionTestTimeline(): readonly PrecisionTestEntry[] {
  return [
    {
      year: 1887,
      experiment: "Michelson-Morley",
      bound: 1e-9,
      technique: "interferometer",
    },
    {
      year: 1932,
      experiment: "Kennedy-Thorndike",
      bound: 1e-9,
      technique: "asymmetric interferometer",
    },
    {
      year: 1960,
      experiment: "Hughes-Drever",
      bound: 1e-15,
      technique: "Li-7 NMR isotropy",
    },
    {
      year: 1979,
      experiment: "Brillet-Hall",
      bound: 5e-9,
      technique: "He-Ne laser interferometer (refined Michelson-Morley)",
    },
    {
      year: 2015,
      experiment: "Optical atomic clocks (Sr/Yb comparison)",
      bound: 1e-18,
      technique: "lattice-clock frequency comparison",
    },
  ] as const;
}

/** A single SME-coefficient bound, sourced from a published experiment. */
export interface SmeBoundEntry {
  /** SME-coefficient symbol, matching Kostelecký + Russell notation. */
  readonly coefficient: string;
  /** Upper bound on the magnitude of the coefficient (dimensionless). */
  readonly bound: number;
  /** Short experimental source (collaboration / instrument). */
  readonly source: string;
  /** Sector of the SME the coefficient lives in. */
  readonly sector: "photon" | "electron" | "proton" | "neutron";
}

/**
 * Representative SME (Standard-Model Extension) coefficient bounds. The SME
 * is the framework Kostelecký and collaborators systematized in the 1990s
 * to parametrize Lorentz violation across all known sectors of physics.
 * Each experiment constrains a subset of coefficients; the strongest
 * present-day photon-sector bounds are at the 10⁻¹⁸ level.
 *
 * Order-of-magnitude figures from the *Data Tables for Lorentz and CPT
 * Violation* (Kostelecký + Russell, Rev. Mod. Phys.; updated annually).
 */
export function smeBounds(): readonly SmeBoundEntry[] {
  return [
    {
      coefficient: "κ̃_e (photon, parity-even)",
      bound: 1e-18,
      source: "Sr/Yb optical clocks",
      sector: "photon",
    },
    {
      coefficient: "κ̃_o (photon, parity-odd)",
      bound: 1e-17,
      source: "rotating optical resonator",
      sector: "photon",
    },
    {
      coefficient: "c_TT (electron)",
      bound: 1e-15,
      source: "Hughes-Drever-class NMR",
      sector: "electron",
    },
    {
      coefficient: "b_T (electron, CPT-odd)",
      bound: 1e-14,
      source: "Penning trap, electron g-2",
      sector: "electron",
    },
    {
      coefficient: "c_TT (proton)",
      bound: 1e-23,
      source: "antiproton-cyclotron comparison",
      sector: "proton",
    },
    {
      coefficient: "b_T (neutron)",
      bound: 1e-31,
      source: "He-3/Xe co-magnetometer",
      sector: "neutron",
    },
  ] as const;
}

/**
 * Naïve quantum-gravity expectation for a Lorentz-violating coefficient.
 * The "standard" estimate dimensions a violation as the ratio of a typical
 * laboratory speed to the Planck speed (taken as c here, since natural
 * Planck-scale coefficients are O(1) in units where c = 1, and the
 * observable signature is the Doppler-suppressed lab speed).
 *
 * Concretely: Earth's orbital speed around the Sun (~30 km/s) divided by c
 * yields ~10⁻⁴ — the magnitude of fractional anisotropy a Lorentz-breaking
 * theory might "naturally" produce. The actual bounds are 14+ orders of
 * magnitude tighter than this. That gap is the puzzle the field calls the
 * "naturalness problem of Lorentz invariance."
 */
export function naivePlanckScaleBound(c = SPEED_OF_LIGHT): number {
  const v_orbit = 30e3; // m/s — Earth's mean orbital speed
  return v_orbit / c;
}

/**
 * The gap, in orders of magnitude, between the naïve quantum-gravity
 * expectation and the tightest current photon-sector bound.
 *
 *   gap = log₁₀(naive / bound)
 *
 * For naive ≈ 10⁻⁴ and bound ≈ 10⁻¹⁸ this is 14.
 */
export function naturalnessGapOrders(currentBound: number): number {
  if (currentBound <= 0) {
    throw new RangeError(`currentBound must be positive`);
  }
  return Math.log10(naivePlanckScaleBound() / currentBound);
}

/**
 * Improvement factor between the first canonical test (Michelson-Morley
 * 1887) and the latest entry on the timeline. Reported as orders of
 * magnitude (log₁₀ of the ratio of bounds).
 *
 *   improvement = log₁₀(bound_first / bound_latest)
 */
export function precisionImprovementOrders(): number {
  const tl = precisionTestTimeline();
  const first = tl[0];
  const latest = tl[tl.length - 1];
  return Math.log10(first.bound / latest.bound);
}
