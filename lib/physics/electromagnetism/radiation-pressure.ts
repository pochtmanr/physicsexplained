/**
 * Radiation pressure — the cash-out of §07.5's stress-tensor promise.
 *
 * §07.5 showed that electromagnetic fields carry momentum; the stress
 * tensor booked the flow. This module turns that bookkeeping into force
 * per unit area on anything the wave hits. A plane wave of intensity
 * I (W/m²) carries momentum flux I/c (kg·m⁻¹·s⁻²), which is a pressure.
 *
 *   Absorber:    P = I / c          (all momentum delivered, once)
 *   Reflector:   P = 2 I / c        (momentum reversed — twice the push)
 *   Partial:     P = (1 + ρ) I / c  (ρ = 0 absorbs, ρ = 1 reflects)
 *
 * Maxwell predicted this in 1862 (*On Physical Lines of Force*, Part III).
 * It took 39 years before anyone could measure it. In 1901 the American
 * physicist Ernest F. Nichols and Gordon Ferrie Hull rigged a torsion
 * balance — a pair of tiny vanes (one silvered, one blackened) suspended
 * on a fine quartz fibre inside an evacuated glass bulb — and watched a
 * focused arc-lamp beam deflect it by a measurable fraction of a degree.
 * The number agreed with Maxwell's prediction to within a few percent.
 *
 * Common misconception: the Crookes radiometer (the little glass bulb with
 * four black-and-white vanes that spins in sunlight) is *not* driven by
 * radiation pressure. Crookes operated at ~10 Pa of residual gas, which is
 * far too much for photon pressure to dominate — and in fact the vanes
 * rotate the wrong way for radiation pressure (blackened side trailing,
 * not leading). The Crookes effect is thermal: the warmer blackened side
 * transfers more momentum to residual gas molecules than the reflective
 * side does. Nichols's torsion balance was a genuinely harder apparatus
 * because it had to beat the same thermal-transpiration artefact down to
 * irrelevance, not embrace it.
 *
 * Modern application: solar sails. IKAROS (JAXA, 2010) and LightSail 2
 * (Planetary Society, 2019) both demonstrated sustained acceleration by
 * sunlight alone, with highly reflective aluminized-polymer membranes.
 *
 * For the quantum flavour of the same story see `photonMomentum` and
 * `comptonWavelengthShift` below — both classical radiation pressure and
 * single-photon momentum are two viewing angles on one conservation law.
 */

import { SPEED_OF_LIGHT } from "@/lib/physics/constants";

/** Solar luminosity, W — CODATA / IAU 2015. */
const SOLAR_LUMINOSITY = 3.828e26;

/** One astronomical unit, metres (IAU 2012). */
const AU_METRES = 1.495978707e11;

/** Planck's constant, J·s (SI 2019 exact). */
const PLANCK = 6.62607015e-34;

/** Electron rest mass, kg (CODATA 2018). */
const ELECTRON_MASS = 9.1093837015e-31;

/**
 * Solar constant — intensity of sunlight at 1 AU, W/m².
 *
 *   I_sun(1 AU) = L_sun / (4π·R²_AU) ≈ 1361 W/m²
 *
 * Re-derived here (rather than hard-coded at 1361) so callers depend on
 * the same single source of truth as `solarSailAcceleration`.
 */
export const SOLAR_CONSTANT_1AU =
  SOLAR_LUMINOSITY / (4 * Math.PI * AU_METRES * AU_METRES);

/**
 * Radiation pressure on a perfect absorber at normal incidence.
 *
 *   P = I / c
 *
 * An absorber soaks up every incoming photon; each delivers momentum
 * p = E/c, and the wave delivers energy at rate I per unit area, so the
 * rate of momentum delivery per unit area — which is the pressure — is
 * I/c.
 *
 * At Earth's orbit (I ≈ 1361 W/m²) this is ≈ 4.54 µPa on a black sheet.
 * Tiny compared to atmospheric pressure (10⁵ Pa), but relentless and free.
 */
export function radiationPressureAbsorbing(intensity: number): number {
  if (intensity < 0) {
    throw new Error("radiationPressureAbsorbing: intensity must be ≥ 0");
  }
  return intensity / SPEED_OF_LIGHT;
}

/**
 * Radiation pressure on a perfect reflector at normal incidence.
 *
 *   P = 2 I / c
 *
 * A mirror sends every photon back the way it came; by conservation of
 * momentum the mirror absorbs twice each photon's momentum — once to stop
 * it, once to send it back. Factor of 2 versus the absorber.
 *
 * Solar sails chase this factor of 2 with aluminized membranes: ρ ≈ 0.9
 * is typical for IKAROS-class hardware, giving (1 + ρ) ≈ 1.9 near the
 * reflector limit.
 */
export function radiationPressureReflecting(intensity: number): number {
  if (intensity < 0) {
    throw new Error("radiationPressureReflecting: intensity must be ≥ 0");
  }
  return 2 * radiationPressureAbsorbing(intensity);
}

/**
 * Radiation pressure on a surface of reflectivity ρ ∈ [0, 1] at normal
 * incidence.
 *
 *   P = (1 + ρ) · I / c
 *
 * ρ = 0 recovers the absorber; ρ = 1 recovers the perfect reflector;
 * interpolates linearly in between. This is the form most real solar sail
 * analyses use — IKAROS's sail ran ρ ≈ 0.9.
 */
export function radiationPressurePartial(
  intensity: number,
  reflectivity: number,
): number {
  if (intensity < 0) {
    throw new Error("radiationPressurePartial: intensity must be ≥ 0");
  }
  if (reflectivity < 0 || reflectivity > 1) {
    throw new Error(
      "radiationPressurePartial: reflectivity must be in [0, 1]",
    );
  }
  return ((1 + reflectivity) * intensity) / SPEED_OF_LIGHT;
}

/**
 * Solar-sail acceleration at a given distance from the Sun.
 *
 *   a = (1 + ρ) · I(r) · A / (m · c),   I(r) = L_sun / (4π r²)
 *
 * Args (distinct order from §07.5's `maxwell-stress.ts` version — this
 * module takes sail-first arguments because scene callers think in sail
 * geometry):
 *   area          sail area, m²
 *   mass          spacecraft mass, kg
 *   reflectivity  ρ ∈ [0, 1]
 *   distanceAU    distance from Sun in astronomical units
 *
 * Returns acceleration in m/s². At 1 AU with m = 1 kg, A = 100 m², ρ = 0.9
 * this gives a ≈ 8.6 × 10⁻⁶ m/s² — small, but it acts continuously, so
 * over a year that is a Δv of ~270 m/s with no propellant mass penalty.
 * Very low m/A ratios (< 10 g/m²) push this into the 10⁻⁴ m/s² regime
 * achievable by IKAROS-class membrane designs.
 */
export function solarSailAcceleration(
  area: number,
  mass: number,
  reflectivity: number,
  distanceAU: number,
): number {
  if (area <= 0) {
    throw new Error("solarSailAcceleration: area must be > 0");
  }
  if (mass <= 0) {
    throw new Error("solarSailAcceleration: mass must be > 0");
  }
  if (reflectivity < 0 || reflectivity > 1) {
    throw new Error(
      "solarSailAcceleration: reflectivity must be in [0, 1]",
    );
  }
  if (distanceAU <= 0) {
    throw new Error("solarSailAcceleration: distanceAU must be > 0");
  }
  const r = distanceAU * AU_METRES;
  const I = SOLAR_LUMINOSITY / (4 * Math.PI * r * r);
  return ((1 + reflectivity) * I * area) / (mass * SPEED_OF_LIGHT);
}

/**
 * Acceleration of gravity from the Sun at a given distance, for the
 * comparison plot in `SolarSailScene`.
 *
 *   g_sun(r) = GM_sun / r²
 *
 * At 1 AU this is 5.93 × 10⁻³ m/s² — three orders of magnitude larger than
 * solar-sail acceleration for typical m/A. That gap is why solar sailing
 * is slow-but-cumulative rather than launch-ready.
 */
const GM_SUN = 1.32712440018e20; // m³/s² — IAU 2012
export function solarGravityAcceleration(distanceAU: number): number {
  if (distanceAU <= 0) {
    throw new Error("solarGravityAcceleration: distanceAU must be > 0");
  }
  const r = distanceAU * AU_METRES;
  return GM_SUN / (r * r);
}

/**
 * Photon momentum magnitude given photon energy.
 *
 *   p = E / c
 *
 * This is the quantum re-telling of radiation pressure: an electromagnetic
 * wave of energy flux I per unit area is a flux of photons each carrying
 * momentum E/c, and the classical result P = I/c is the expectation value
 * of that photon picture.
 *
 * Visible light at λ = 550 nm has photon energy E = hc/λ ≈ 3.6 × 10⁻¹⁹ J,
 * so p ≈ 1.2 × 10⁻²⁷ kg·m/s — about 10⁻³ of an electron's thermal momentum
 * at room temperature, single-photon-measurable with modern optomechanics.
 */
export function photonMomentum(photonEnergy: number): number {
  if (photonEnergy < 0) {
    throw new Error("photonMomentum: photonEnergy must be ≥ 0");
  }
  return photonEnergy / SPEED_OF_LIGHT;
}

/**
 * Photon momentum from wavelength (convenience).
 *
 *   p = h / λ
 *
 * Equivalent to `photonMomentum(h c / λ)`; this is the form de Broglie
 * wrote in 1924 when generalising to matter waves.
 */
export function photonMomentumFromWavelength(wavelength: number): number {
  if (wavelength <= 0) {
    throw new Error(
      "photonMomentumFromWavelength: wavelength must be > 0",
    );
  }
  return PLANCK / wavelength;
}

/**
 * Compton wavelength shift — the quantum flavour of radiation-pressure
 * scattering.
 *
 *   Δλ = (h / m_e c) · (1 − cos θ)
 *
 * When a high-energy photon scatters off a free electron at angle θ, the
 * scattered photon's wavelength is longer by Δλ. The prefactor h/(m_e c)
 * ≈ 2.43 × 10⁻¹² m is the Compton wavelength of the electron.
 *
 * NOTE — this is a *quantum* process: it cannot be derived from classical
 * Maxwell electrodynamics and requires treating light as discrete photons
 * with individual (E, p). Compton's 1923 X-ray scattering experiment was
 * one of the decisive demonstrations that electromagnetic radiation
 * delivers momentum in quanta, not just the continuous classical flux
 * that Maxwell predicted and Nichols measured. We include it here for
 * completeness alongside `photonMomentum`; the rest of §08.3 is classical.
 *
 * Args: scattering angle θ in radians.
 * Returns wavelength shift Δλ in metres.
 */
export function comptonWavelengthShift(theta: number): number {
  const comptonWavelength = PLANCK / (ELECTRON_MASS * SPEED_OF_LIGHT);
  return comptonWavelength * (1 - Math.cos(theta));
}
