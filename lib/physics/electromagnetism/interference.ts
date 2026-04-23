/**
 * Interference of two coherent waves — §09.7.
 *
 * Two plane waves with the same frequency, crossing the same point in space,
 * do not fight for the medium — the medium simply carries their *sum*. If the
 * complex amplitudes are E₁ and E₂, the resulting instantaneous field is
 * E₁ + E₂. What a photodetector reads, though, is intensity:
 *
 *   I ∝ |E₁ + E₂|² = |E₁|² + |E₂|² + 2|E₁||E₂| cos(Δφ)
 *
 * The cross term 2|E₁||E₂| cos(Δφ) is the **interference term**. It
 * oscillates with the relative phase Δφ, and it is what turns a uniform pair
 * of beams into bright/dark fringes. Constructive interference happens when
 * cos Δφ = +1 (Δφ = 2πm); the intensity climbs to (|E₁| + |E₂|)². Destructive
 * happens when cos Δφ = −1 (Δφ = (2m+1)π); the intensity falls to
 * (|E₁| − |E₂|)², which is zero for equal amplitudes.
 *
 * Relative phase shows up two ways in optics:
 *
 *   1. **Path difference**  ΔL between two coherent rays — they left the same
 *      source, took different routes, and the extra geometry bought one of
 *      them ΔL more optical path. Δφ = 2π · (ΔL / λ), so ΔL = mλ is bright.
 *
 *   2. **Reflection phase jumps**  A wave reflecting off a medium of *higher*
 *      refractive index picks up an extra π — a half-wavelength phase flip —
 *      while a bounce off a lower-index medium picks up nothing. Thin-film
 *      and Newton's-ring arithmetic is almost entirely about tracking this.
 *
 * Newton's rings are the compact canonical demo: a plano-convex lens sits
 * atop a flat of glass, forming a thin air wedge whose thickness grows from
 * zero at the contact point outward as t(r) = r² / (2R), where R is the
 * lens's radius of curvature. Dark rings appear where the round-trip through
 * the air gap plus the reflection phase jump land at destructive
 * interference:
 *
 *   r_m = sqrt(m · λ · R)        (radius of the m-th dark ring)
 *
 * Finally, coherence is not infinite. A real source has a finite spectral
 * width Δλ; the wavetrains it emits have a finite length L_c = λ² / Δλ,
 * called the **coherence length**. Two beams with path difference larger
 * than L_c average over every phase and the cross term washes out. This is
 * why white-light interference fringes are visible only very close to zero
 * path difference, while laser fringes stay crisp across many metres.
 *
 * Kernel contents:
 *   - twoSourceIntensity   — |E₁ + E₂|² with a relative phase Δφ.
 *   - thinFilmPhase        — round-trip phase ΔΦ of the two reflections off a
 *                            thin film, with the π-jump rule baked in.
 *   - newtonRingRadius     — r_m = √(m λ R) for the m-th dark ring.
 *   - coherenceLength      — L_c = λ² / Δλ_FWHM.
 */

/**
 * Intensity at the overlap of two coherent plane waves with real amplitudes
 * E₁ and E₂ and relative phase Δφ:
 *
 *   I = E₁² + E₂² + 2 · E₁ · E₂ · cos(Δφ)
 *
 * The constant of proportionality that turns this into W/m² (ε₀ c / 2 and
 * friends) is factored out — callers care about the *ratio* to reference
 * intensity almost always. At Δφ = 0 and E₁ = E₂ = E the intensity is
 * 4·E² (the classic "two coherent beams interfere bright to 4×, not 2×").
 * At Δφ = π it vanishes exactly for equal amplitudes.
 */
export function twoSourceIntensity(
  E1: number,
  E2: number,
  deltaPhi: number,
): number {
  return E1 * E1 + E2 * E2 + 2 * E1 * E2 * Math.cos(deltaPhi);
}

/**
 * Total phase difference between the two reflected rays from a thin film of
 * thickness `d` and refractive index `n_film`, illuminated by light of
 * vacuum wavelength `lambda` and sandwiched between media of index
 * `n_before` (where the incident ray lives) and `n_after`.
 *
 * Two rays leave the system: the one that reflects off the top surface of
 * the film, and the one that refracts in, bounces off the bottom surface,
 * and refracts back out. The optical path difference of the second is
 * 2 · n_film · d (normal-incidence approximation — the §09.7 topic stays at
 * near-normal incidence to keep the algebra clean). That converts to a
 * phase of
 *
 *   Δφ_path = (2π / λ) · 2 · n_film · d
 *
 * On top of the path difference, each reflection can pick up an extra π:
 *
 *   - The first reflection (on top of the film) picks up π iff
 *     n_film > n_before.
 *   - The second reflection (bottom surface, from inside the film) picks up
 *     π iff n_after > n_film.
 *
 * The *relative* phase between the two reflected rays is the difference:
 *
 *   Δφ_reflection = (0 or ±π depending on which reflections flip)
 *
 * We return ΔΦ = Δφ_path + Δφ_reflection, measured in radians, reduced to
 * the principal interval (−π, π] — that is the number a detector cares
 * about when deciding "bright or dark?". For a soap bubble (air/water/air,
 * only the top reflection flips) a film thickness of λ/(4·n_film) gives a
 * round-trip path of λ/2 — a π shift — plus the π from the top reflection,
 * making ΔΦ = 2π ≡ 0: **constructive**. That is why the thinnest part of a
 * bubble looks bright in its own colour.
 */
export function thinFilmPhase(
  d: number,
  n_film: number,
  lambda: number,
  n_before: number,
  n_after: number,
): number {
  if (lambda <= 0) {
    throw new Error("thinFilmPhase: wavelength must be > 0");
  }
  const pathPhase = ((2 * Math.PI) / lambda) * 2 * n_film * d;
  const topFlip = n_film > n_before ? Math.PI : 0;
  const bottomFlip = n_after > n_film ? Math.PI : 0;
  const reflectionPhase = bottomFlip - topFlip;
  const total = pathPhase + reflectionPhase;
  // Reduce to (−π, π].
  const twoPi = 2 * Math.PI;
  let reduced = total % twoPi;
  if (reduced > Math.PI) reduced -= twoPi;
  if (reduced <= -Math.PI) reduced += twoPi;
  return reduced;
}

/**
 * Radius of the m-th dark ring in Newton's-rings geometry:
 *
 *   r_m = sqrt(m · λ · R)
 *
 * Derivation: the air wedge under a plano-convex lens of radius of
 * curvature R has thickness t(r) ≈ r²/(2R) at distance r from the contact
 * point. The bottom-surface reflection picks up π (air → glass), the top
 * does not (glass → air). Destructive interference therefore demands
 * 2·t = m·λ, and solving for r gives r_m = √(m·λ·R). The *bright* rings sit
 * at r = √((m + ½)·λ·R). The contact point itself is dark (the m = 0 case).
 *
 * Units: `lambda` and `R` must share units; the returned radius comes back
 * in those same units.
 */
export function newtonRingRadius(m: number, lambda: number, R: number): number {
  if (m < 0) {
    throw new Error("newtonRingRadius: ring index m must be ≥ 0");
  }
  if (lambda <= 0 || R <= 0) {
    throw new Error("newtonRingRadius: λ and R must be > 0");
  }
  return Math.sqrt(m * lambda * R);
}

/**
 * Coherence length — the path difference over which two halves of a source's
 * output stay in phase well enough to interfere. Defined as
 *
 *   L_c = λ² / Δλ_FWHM
 *
 * for a source centred at wavelength `lambda` with full-width-at-half-max
 * spectral bandwidth `spectralFWHM` (same length units). A low-power HeNe
 * laser at 632.8 nm with a 1.5 pm (1.5×10⁻¹² m) line width has
 * L_c ≈ 27 cm — enough to see fringes across most table-top setups. A
 * single-mode stabilised HeNe can push L_c to hundreds of metres. A
 * white-light LED with Δλ ≈ 100 nm has L_c ≈ 4 μm, which is why you have to
 * squint to see the "white-light fringe" in a Michelson interferometer.
 *
 * Equivalent formulation: the temporal coherence time is τ_c = λ²/(c·Δλ),
 * and L_c = c · τ_c — "how long the wavetrain stays in phase, expressed as a
 * length by multiplying by c."
 */
export function coherenceLength(
  lambda: number,
  spectralFWHM: number,
): number {
  if (lambda <= 0) {
    throw new Error("coherenceLength: wavelength must be > 0");
  }
  if (spectralFWHM <= 0) {
    throw new Error("coherenceLength: spectral FWHM must be > 0");
  }
  return (lambda * lambda) / spectralFWHM;
}
