/**
 * Skin depth — how far an EM wave penetrates a conductor before its
 * amplitude falls by a factor of e.
 *
 * Start from the Maxwell–Ampère law inside a material with conductivity σ
 * and write out the wave equation. For a plane wave E ∝ exp(i(kz − ωt))
 * you get a complex wavenumber k = α + iβ, and the imaginary part β is
 * precisely the attenuation rate. The field decays as exp(−β·z). When
 * conduction dominates displacement current (σ ≫ ωε — the **good
 * conductor** limit), β reduces to the clean expression
 *
 *   β = √(μ·σ·ω / 2)
 *
 * and the skin depth δ is the reciprocal
 *
 *   δ = 1/β = √(2 / (μ·σ·ω))
 *
 * At 50 Hz in copper (σ ≈ 5.96 × 10⁷ S/m, μ ≈ μ₀) this gives δ ≈ 9.3 mm.
 * At 1 GHz it collapses to ~2 μm. The field — and therefore the current
 * density J = σ·E — is crowded into a thin sheath at the conductor's
 * surface. This is the AC skin effect. It is why Litz wire (many thin
 * strands, individually insulated) beats solid copper at RF, why coax
 * cables work as shielded transmission lines, why a Faraday cage only has
 * to be a few skin-depths thick to kill a given band, and why the holes
 * in a microwave-oven door mesh are safe at 2.45 GHz but would leak at
 * 2.45 THz.
 *
 * Cross-link: §06.7 transmission-lines pushes this idea into R(ω) per
 * unit length — the AC resistance of a coax inner conductor grows as √f
 * because the conducting cross-section shrinks as 1/δ ∝ 1/√f.
 */

import { MU_0 } from "@/lib/physics/constants";

/** Copper conductivity at room temperature, S/m. */
export const SIGMA_CU = 5.96e7;
/** Aluminum conductivity at room temperature, S/m. */
export const SIGMA_AL = 3.77e7;
/** Mild-steel / low-carbon iron conductivity at room temperature, S/m. */
export const SIGMA_FE = 1.0e7;
/** Seawater conductivity (average, ~4 S/m). */
export const SIGMA_SEAWATER = 4.0;

/**
 * Skin depth δ in metres for a good conductor.
 *
 *   δ = √(2 / (μ·σ·ω))
 *
 * `sigma` is the DC conductivity in S/m, `omega` is the angular frequency
 * of the incident wave in rad/s, and `mu` is the material permeability in
 * H/m (defaults to μ₀ for non-magnetic metals). The "good conductor"
 * approximation σ ≫ ωε is almost always satisfied for metals below
 * optical frequencies — for copper the crossover sits in the far infrared,
 * around 10¹⁷ Hz.
 *
 * Throws on non-positive inputs: skin depth is undefined for σ ≤ 0, ω ≤ 0,
 * or μ ≤ 0 (DC has δ → ∞, a separate regime).
 */
export function skinDepth(
  sigma: number,
  omega: number,
  mu: number = MU_0,
): number {
  if (sigma <= 0) throw new Error("skinDepth: sigma must be > 0");
  if (omega <= 0) throw new Error("skinDepth: omega must be > 0 (DC limit is infinite)");
  if (mu <= 0) throw new Error("skinDepth: mu must be > 0");
  return Math.sqrt(2 / (mu * sigma * omega));
}

/**
 * Skin depth in copper at ordinary frequency f (Hz), m.
 *
 * Convenience wrapper: σ = 5.96 × 10⁷ S/m, μ = μ₀, and the caller passes
 * f in hertz instead of angular frequency in rad/s. Returns a value in
 * metres — multiply by 1e3 for mm, by 1e6 for μm.
 */
export function skinDepthCopper(freqHz: number): number {
  if (freqHz <= 0) throw new Error("skinDepthCopper: freqHz must be > 0");
  const omega = 2 * Math.PI * freqHz;
  return skinDepth(SIGMA_CU, omega);
}

/**
 * Effective AC resistance of a round conductor whose DC resistance is
 * `rdc` (ohms) given the skin depth δ (m), the perimeter-per-unit-length
 * factor `lengthPerim`, and a geometry where δ is much smaller than the
 * conductor radius.
 *
 * Model: when δ ≪ a (radius), the current lives in a thin annular shell
 * of thickness δ at the surface. The effective conducting cross-section
 * shrinks from π·a² (DC) to roughly 2π·a·δ = perimeter·δ. So
 *
 *   R_ac/R_dc ≈ (π·a²) / (perimeter·δ) = a / (2·δ)
 *
 * This function exposes the shape-agnostic form: `lengthPerim` is the DC
 * cross-sectional area divided by the wetted perimeter, with units of m.
 * For a solid round wire lengthPerim = a/2; for a flat ribbon of
 * thickness t it's t/2; etc. Callers typically compute this once from the
 * geometry.
 *
 * Returned R is in ohms, in the thin-skin limit δ ≪ lengthPerim·2.
 */
export function effectiveResistance(
  rdc: number,
  delta: number,
  lengthPerim: number,
): number {
  if (rdc <= 0) throw new Error("effectiveResistance: rdc must be > 0");
  if (delta <= 0) throw new Error("effectiveResistance: delta must be > 0");
  if (lengthPerim <= 0) throw new Error("effectiveResistance: lengthPerim must be > 0");
  return (rdc * lengthPerim) / delta;
}

/**
 * Surface impedance Z_s of a good conductor (Ω / square).
 *
 *   Z_s = (1 + i) / (σ·δ)    with   δ = √(2/(μ·σ·ω))
 *
 * This function returns the **magnitude** |Z_s| = √2 / (σ·δ) — a single
 * real number in ohms — because the scene HUDs only display magnitude.
 * The phase (π/4, i.e. R equals X in the good-conductor limit) is the
 * reason tangential E leads tangential H by 45° at a metal surface, and
 * it is what makes the Poynting vector poke a tiny bit into the metal
 * (where the wave's energy is dissipated as heat).
 */
export function surfaceImpedance(
  sigma: number,
  omega: number,
  mu: number = MU_0,
): number {
  const delta = skinDepth(sigma, omega, mu);
  return Math.SQRT2 / (sigma * delta);
}
