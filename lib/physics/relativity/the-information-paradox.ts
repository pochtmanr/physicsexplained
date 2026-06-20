/**
 * §60 THE INFORMATION PARADOX — pure-TS helpers.
 *
 * In 1976 Stephen Hawking argued that black-hole evaporation destroys
 * information: a hole formed from a pure quantum state radiates exactly
 * thermal (maximally mixed) particles, so when it finishes evaporating the
 * pure state has become a mixed one. That is forbidden in ordinary quantum
 * mechanics, where evolution is UNITARY (it preserves the purity of states).
 * Hawking radiation says the final state is thermal; unitarity says it cannot
 * be. Both cannot be exactly true.
 *
 * Don Page (1993) sharpened the conflict into a single curve. Track the
 * entanglement (von Neumann) entropy S_rad of the emitted radiation as the
 * hole evaporates:
 *
 *   - Hawking's bookkeeping: S_rad rises monotonically, in lockstep with the
 *     number of emitted quanta, and ends at its maximum when the hole is gone.
 *     A pure state has S = 0, so a nonzero final S_rad is exactly the
 *     information loss.
 *   - Unitarity's bookkeeping (the "Page curve"): S_rad must rise, turn over
 *     at the PAGE TIME (when about half the entropy has been radiated), and
 *     fall back to zero as the hole disappears, so the final state is pure.
 *
 * The von Neumann entropy of a subsystem can never exceed the entropy of the
 * smaller of the two complementary pieces. Early on the radiation is the
 * small piece (S_rad grows); late on the remaining hole is the small piece
 * (S_rad must shrink, bounded by the falling Bekenstein–Hawking entropy of
 * what is left). The Page curve is the minimum of those two bounds. The 2019
 * island/replica-wormhole computations reproduced it directly from a
 * gravitational path integral — the first time the falling branch fell out of
 * a calculation rather than being assumed.
 *
 * This file is self-contained: it defines its own copy of every constant it
 * needs (no shared physics module is edited). All functions are React-free,
 * use natural-ish bit/qubit units unless noted, and are validated in
 * the-information-paradox.test.ts.
 */

// ─── Constants (local copies; SI where dimensional) ──────────────────────────

/** Speed of light, m/s (exact). */
export const C = 2.99792458e8;
/** Gravitational constant, m³ kg⁻¹ s⁻². */
export const G = 6.6743e-11;
/** Reduced Planck constant ℏ = h/2π, J·s. */
export const HBAR = 1.054571817e-34;
/** Boltzmann constant, J/K (exact, SI 2019). */
export const K_B = 1.380649e-23;
/** Solar mass, kg. */
export const M_SUN = 1.98892e30;

// ─── Black-hole coarse-grained entropy ───────────────────────────────────────

/** Schwarzschild radius r_s = 2GM/c² (m). */
export function schwarzschildRadius(M_kg: number): number {
  return (2 * G * M_kg) / (C * C);
}

/**
 * Bekenstein–Hawking entropy in NATS, S_BH = A c³ / (4 G ℏ), with horizon
 * area A = 4π r_s². This is the coarse-grained "thermodynamic" entropy of the
 * hole — the number of internal microstates it can hide — and it is the
 * ceiling on how much information the hole can store. It scales as M².
 */
export function bekensteinHawkingEntropy(M_kg: number): number {
  const rs = schwarzschildRadius(M_kg);
  const A = 4 * Math.PI * rs * rs;
  return (A * Math.pow(C, 3)) / (4 * G * HBAR);
}

/** Same entropy expressed in BITS (divide nats by ln 2). */
export function bekensteinHawkingEntropyBits(M_kg: number): number {
  return bekensteinHawkingEntropy(M_kg) / Math.LN2;
}

// ─── The two entropy bookkeepings ────────────────────────────────────────────

/**
 * Hawking's entanglement entropy of the radiation, normalized to the total
 * initial entropy. The emitted entropy grows in lockstep with the radiated
 * fraction f ∈ [0, 1] of the hole's entropy and never turns over:
 *
 *   S_Hawking(f) = f         (monotonically rising to 1)
 *
 * f = 0 is "no radiation yet"; f = 1 is "fully evaporated". A pure initial
 * state should end at S = 0, so the endpoint S = 1 is precisely the lost
 * information.
 */
export function hawkingRadiationEntropy(f: number): number {
  return clamp01(f);
}

/**
 * The PAGE CURVE: the entanglement entropy a UNITARY theory must produce,
 * again normalized to the total initial entropy and as a function of the
 * radiated fraction f ∈ [0, 1].
 *
 * It is the minimum of the two coarse-grained bounds:
 *   - the radiation's own entropy, ≈ f (small early), and
 *   - the remaining hole's entropy, ≈ 1 − f (small late).
 *
 *   S_Page(f) = min(f, 1 − f)
 *
 * It rises to a maximum of 1/2 at the Page time (f = 1/2) then falls back to
 * 0, so the final state is pure.
 */
export function pageCurveEntropy(f: number): number {
  const x = clamp01(f);
  return Math.min(x, 1 - x);
}

/**
 * Smooth (rounded) Page curve used for plotting. The sharp min(f, 1−f) has a
 * kink at the Page time; a real evaporation rounds it. We blend the two
 * branches with a soft-min controlled by `sharpness` (larger = sharper). This
 * is cosmetic — it agrees with min(f,1−f) away from the corner and never
 * exceeds it by more than ~ln 2 / sharpness.
 */
export function pageCurveSmooth(f: number, sharpness = 24): number {
  const x = clamp01(f);
  const a = x;
  const b = 1 - x;
  // soft-min(a,b) = −(1/k) ln(e^{−k a} + e^{−k b})
  const k = sharpness;
  const m = Math.min(a, b);
  // factor out the min for numerical stability
  const soft =
    m - Math.log(Math.exp(-k * (a - m)) + Math.exp(-k * (b - m))) / k;
  return soft;
}

/** The radiated fraction at the Page time — always 1/2 for the symmetric model. */
export const PAGE_FRACTION = 0.5;

/**
 * Page time as a fraction of the total evaporation lifetime. Because the
 * hole's entropy S ∝ M² and most of the lifetime is spent at large mass, the
 * hole has radiated HALF of its entropy after roughly 0.54 of its lifetime in
 * the simplest model. We expose the entropy-half point; callers that work in
 * lifetime units can map through the M(t) law. Here we keep the entropy
 * parametrization (f), for which the Page point is exactly PAGE_FRACTION.
 */
export function pageFraction(): number {
  return PAGE_FRACTION;
}

/**
 * Information available in the radiation, normalized: the mutual information
 * the radiation carries about the initial state. In Hawking's picture it stays
 * 0 until the very end (no information comes out); in the Page picture it is
 * the difference between the thermodynamic (rising-then-symmetric) bound and
 * the actual entanglement entropy:
 *
 *   I_Page(f) = S_thermal(f) − S_Page(f)
 *
 * where S_thermal(f) = f tracks the count of emitted quanta. This is 0 before
 * the Page time and rises afterward — information only starts leaking out once
 * the hole has passed the halfway point.
 */
export function informationInRadiation(f: number): number {
  const x = clamp01(f);
  return Math.max(0, x - pageCurveEntropy(x));
}

/**
 * Energy radiated as a fraction of the initial mass-energy, as a function of
 * the radiated ENTROPY fraction f. Since S ∝ M² and the radiated energy is
 * ΔM = M0 − M, with M = M0·√(1 − f) (entropy S ∝ M² ⇒ remaining entropy
 * fraction 1−f = (M/M0)²), we get:
 *
 *   E_out(f) / (M0 c²) = 1 − √(1 − f)
 *
 * This is the "bookkeeping" curve for scene (b): early on, a lot of entropy
 * leaves per unit energy; near the end, energy pours out fast while little
 * entropy remains — which is exactly why information must come out late.
 */
export function energyRadiatedFraction(f: number): number {
  const x = clamp01(f);
  return 1 - Math.sqrt(1 - x);
}

/** Remaining hole mass as a fraction of M0, given radiated entropy fraction f. */
export function remainingMassFraction(f: number): number {
  return Math.sqrt(1 - clamp01(f));
}

// ─── Positions on the paradox (scene c data model) ──────────────────────────

export interface ParadoxPosition {
  readonly id: string;
  readonly label: string;
  /** Does the final state stay pure (unitarity preserved)? */
  readonly unitary: boolean;
  /** Is the equivalence principle at the horizon kept intact? */
  readonly smoothHorizon: boolean;
  /** One-line cost the position has to pay. */
  readonly cost: string;
}

/**
 * The classic menu of resolutions, each with the price it pays. Used by the
 * scene-c "map". No physics is computed here; it is a typed, ordered catalog
 * the UI renders and lets the reader compare.
 */
export const PARADOX_POSITIONS: readonly ParadoxPosition[] = [
  {
    id: "information-lost",
    label: "Information is destroyed",
    unitary: false,
    smoothHorizon: true,
    cost: "Gives up unitarity; breaks energy conservation in any local form.",
  },
  {
    id: "escapes-in-radiation",
    label: "Information escapes in the radiation",
    unitary: true,
    smoothHorizon: true,
    cost: "Needs the radiation to be subtly non-thermal — and a Page curve.",
  },
  {
    id: "remnant",
    label: "A stable Planck-scale remnant keeps it",
    unitary: true,
    smoothHorizon: true,
    cost: "Tiny remnants must store unbounded entropy; infinite-production problems.",
  },
  {
    id: "baby-universe",
    label: "It hides in a disconnected baby universe",
    unitary: false,
    smoothHorizon: true,
    cost: "Information is inaccessible forever; effectively lost to our universe.",
  },
  {
    id: "firewall",
    label: "A firewall replaces the smooth horizon",
    unitary: true,
    smoothHorizon: false,
    cost: "Violates the equivalence principle — an infalling observer burns up.",
  },
  {
    id: "islands",
    label: "Islands / replica wormholes",
    unitary: true,
    smoothHorizon: true,
    cost: "Requires gravitational replica saddles; mechanism of transfer still debated.",
  },
];

// ─── helpers ────────────────────────────────────────────────────────────────

function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0;
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}
