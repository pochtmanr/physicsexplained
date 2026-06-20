/**
 * §61 WHAT RELATIVITY DOESN'T SAY — pure-TS helpers.
 *
 * This closing topic is conceptual, but two of its scenes need real numbers:
 *
 *  (a) The domain map — a log-log mass-vs-size chart on which every theory of
 *      physics occupies a wedge. The boundaries are set by physical length
 *      scales: the Schwarzschild radius r_s = 2GM/c² (general relativity becomes
 *      strong) and the Compton wavelength λ_C = ħ/(Mc) (quantum mechanics
 *      becomes unavoidable). Where these two curves cross is the Planck point —
 *      the mass and length at which a system is BOTH a black hole AND a quantum
 *      object, where neither GR nor quantum field theory can be trusted alone.
 *
 *  (b) The invariant myth-buster — a fixed classification of physical
 *      quantities into "frame-dependent" (changes when you boost) and
 *      "absolute" (the same for every observer). Relativity is named for the
 *      first list, but it is built on the second.
 *
 * All helpers are framework-free, SI units, and self-contained: this file
 * defines its own copies of the fundamental constants so it never imports a
 * shared physics module.
 */

// ─── Fundamental constants (SI) ─────────────────────────────────────────────

/** Newton's gravitational constant, m³ kg⁻¹ s⁻². */
export const G_NEWTON = 6.6743e-11;
/** Speed of light in vacuum, m s⁻¹. */
export const C_LIGHT = 2.99792458e8;
/** Reduced Planck constant ħ = h/2π, J s. */
export const H_BAR_J = 1.054571817e-34;

// ─── Planck units (the natural scale where GR and QM collide) ───────────────

/** Planck mass m_P = √(ħc/G) ≈ 2.176 × 10⁻⁸ kg.
 *  The unique mass built from ħ, c, and G alone — about the mass of a flea egg,
 *  yet enormous for a single particle (10¹⁹ proton masses). */
export function planckMass(
  hbar = H_BAR_J,
  c = C_LIGHT,
  G = G_NEWTON,
): number {
  return Math.sqrt((hbar * c) / G);
}

/** Planck length ℓ_P = √(ħG/c³) ≈ 1.616 × 10⁻³⁵ m.
 *  The length at which a system's Schwarzschild radius equals its Compton
 *  wavelength — below it the very notion of a smooth spacetime is suspect. */
export function planckLength(
  hbar = H_BAR_J,
  c = C_LIGHT,
  G = G_NEWTON,
): number {
  return Math.sqrt((hbar * G) / Math.pow(c, 3));
}

/** Planck time t_P = ℓ_P / c ≈ 5.39 × 10⁻⁴⁴ s. */
export function planckTime(
  hbar = H_BAR_J,
  c = C_LIGHT,
  G = G_NEWTON,
): number {
  return planckLength(hbar, c, G) / c;
}

/** Planck energy E_P = m_P c² ≈ 1.96 × 10⁹ J ≈ 1.22 × 10¹⁹ GeV.
 *  Fifteen orders of magnitude beyond the LHC's reach — the reason quantum
 *  gravity has no direct laboratory probe. */
export function planckEnergy(
  hbar = H_BAR_J,
  c = C_LIGHT,
  G = G_NEWTON,
): number {
  return planckMass(hbar, c, G) * c * c;
}

// ─── Domain-map boundary curves ─────────────────────────────────────────────

/** Schwarzschild radius r_s = 2GM/c² for a mass M (kg), in metres.
 *  The "GR-strong" boundary: a system smaller than its own r_s is a black hole.
 *  As a curve on the mass–size plane it is a straight line of slope +1 in
 *  log-log coordinates (size ∝ mass). */
export function schwarzschildRadius(
  M_kg: number,
  G = G_NEWTON,
  c = C_LIGHT,
): number {
  return (2 * G * M_kg) / (c * c);
}

/** Reduced Compton wavelength λ_C = ħ/(Mc) for a mass M (kg), in metres.
 *  The "QM-unavoidable" boundary: probing a particle on a scale below λ_C
 *  costs enough energy to create new particles. As a curve it is a straight
 *  line of slope −1 in log-log coordinates (size ∝ 1/mass). */
export function comptonWavelength(
  M_kg: number,
  hbar = H_BAR_J,
  c = C_LIGHT,
): number {
  return hbar / (M_kg * c);
}

/**
 * Classify where a (mass, size) point sits relative to the two boundary curves.
 * Returns one of:
 *  - "black-hole"     : size ≤ Schwarzschild radius (inside the GR-strong wedge)
 *  - "quantum"        : size ≤ Compton wavelength (inside the QM wedge)
 *  - "quantum-gravity": both at once — the Planck corner, no good theory
 *  - "classical"      : larger than both — everyday GR-or-Newton regime
 */
export function domainRegime(
  M_kg: number,
  size_m: number,
): "black-hole" | "quantum" | "quantum-gravity" | "classical" {
  const rs = schwarzschildRadius(M_kg);
  const lc = comptonWavelength(M_kg);
  const isBH = size_m <= rs;
  const isQM = size_m <= lc;
  if (isBH && isQM) return "quantum-gravity";
  if (isBH) return "black-hole";
  if (isQM) return "quantum";
  return "classical";
}

// ─── The invariant myth-buster (scene b) ────────────────────────────────────

export interface QuantityVerdict {
  /** Display name of the quantity. */
  name: string;
  /** true = the SAME for every inertial observer; false = changes under boost. */
  invariant: boolean;
  /** One-line reason. */
  reason: string;
}

/**
 * The canonical scoreboard. Special relativity is popularly summarized as
 * "everything is relative" — but the theory's entire content is the SECOND
 * column: the quantities that DON'T change. Frame-dependence is the noise;
 * invariance is the physics.
 */
export const INVARIANCE_TABLE: readonly QuantityVerdict[] = [
  {
    name: "Time interval between two events",
    invariant: false,
    reason: "Moving clocks run slow — Δt depends on the observer's speed.",
  },
  {
    name: "Length of a moving rod",
    invariant: false,
    reason: "Lengths contract along the direction of motion by a factor 1/γ.",
  },
  {
    name: "Simultaneity of two separated events",
    invariant: false,
    reason: "Observers in relative motion disagree on what 'now' means.",
  },
  {
    name: "Energy and momentum (separately)",
    invariant: false,
    reason: "Both transform under a boost; only their combination is fixed.",
  },
  {
    name: "Spacetime interval Δs² = −c²Δt² + Δx²",
    invariant: true,
    reason: "Every observer computes the same interval between two events.",
  },
  {
    name: "Proper time τ along a worldline",
    invariant: true,
    reason: "The time a clock actually reads is frame-independent.",
  },
  {
    name: "Rest mass m (the magnitude of 4-momentum)",
    invariant: true,
    reason: "m²c² = E²/c² − p² is the same in every frame.",
  },
  {
    name: "The speed of light c",
    invariant: true,
    reason: "Postulate one of relativity — identical for all observers.",
  },
  {
    name: "Causal order of timelike-separated events",
    invariant: true,
    reason: "If A can cause B, no boost can reverse the order.",
  },
];

/** Count how many quantities in the table are invariant. */
export function invariantCount(
  table: readonly QuantityVerdict[] = INVARIANCE_TABLE,
): number {
  return table.filter((q) => q.invariant).length;
}

/**
 * The order-of-magnitude gap between the energy scale of our best accelerators
 * and the Planck energy — the number that explains why quantum gravity has no
 * data. Returns log10(E_Planck / E_probe).
 */
export function planckGapDecades(
  E_probe_J: number,
  hbar = H_BAR_J,
  c = C_LIGHT,
  G = G_NEWTON,
): number {
  return Math.log10(planckEnergy(hbar, c, G) / E_probe_J);
}
