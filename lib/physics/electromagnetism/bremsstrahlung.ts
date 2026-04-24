/**
 * §10.5 — Bremsstrahlung (braking radiation).
 *
 * When a charged particle decelerates in the Coulomb field of a heavy
 * nucleus it radiates a continuous spectrum of photons. The German word
 * "bremsstrahlung" literally means "braking radiation." This is the
 * physics of every medical, dental, industrial, and security X-ray tube:
 * electrons accelerated through a potential difference U slam into a
 * heavy-metal anode (tungsten, molybdenum), decelerate over nuclear
 * length-scales, and emit photons spanning every energy up to a sharp
 * upper cutoff.
 *
 *   E_max = e · U                                          (Duane-Hunt)
 *
 * Duane and Hunt discovered this cutoff experimentally in 1915 and it
 * was one of the early confirmations of the quantum relation E = h f:
 * the most energetic photon a tube can emit carries the full kinetic
 * energy of one electron, converted in one braking event. Nothing in
 * classical EM forbids a higher-energy photon; quantum mechanics does.
 *
 * For the spectral shape, Kramers in 1923 derived the thick-target
 * approximation
 *
 *   dN/dE ∝ (E_max − E) / E                                (Kramers 1923)
 *
 * which diverges as 1/E at low energies (a real divergence, cut off in
 * practice by absorption of soft X-rays in the tube window and in the
 * anode itself) and falls linearly to zero at the Duane-Hunt edge. For
 * a *thin* target, where the electron crosses the foil without losing
 * appreciable kinetic energy, the Bethe-Heitler cross-section gives a
 * gentler logarithmic shape
 *
 *   dN/dE ∝ ln(E_max / E)                                 (Bethe-Heitler)
 *
 * still singular at E → 0 but far less steep than Kramers. Real X-ray
 * tubes produce the thick-target shape; thin-target spectra appear in
 * scattering experiments and in electron-beam traversals of foils.
 *
 * The relativistic angular distribution of a bremsstrahlung photon
 * emitted by an electron of Lorentz factor γ, measured from the
 * instantaneous velocity direction, goes as
 *
 *   dP/dΩ ∝ sin²θ / (1 − β cos θ)⁴
 *
 * which reduces to the Larmor sin²θ lobe at γ → 1 and beams forward
 * into a cone of opening angle ~1/γ at γ ≫ 1 (the same relativistic
 * beaming that dominates §10.4 synchrotron radiation).
 *
 * Astrophysical flavour: hot plasmas at T ~ 10⁷ K and above (the
 * intracluster medium of galaxy clusters, accretion flows around compact
 * objects, laboratory tokamak edges) radiate via electron-ion bremsstrahlung
 * with a characteristic exponential spectrum I(E) ∝ e^{−E / kT}. Fitting
 * this shape to the X-ray continuum of Perseus or Coma tells you the
 * gas temperature directly — no absorption lines needed.
 *
 * Cross-refs: §10.1 (Larmor — the dP/dΩ ∝ sin²θ base), §10.4
 * (synchrotron — magnetic-field deceleration, same Larmor physics
 * applied differently), §07.4 (Poynting vector — energy flux that the
 * photons carry off).
 */

import {
  ELEMENTARY_CHARGE,
  SPEED_OF_LIGHT,
} from "@/lib/physics/constants";

/** Planck constant, J·s (exact, SI 2019 redefinition). Used for the
 *  Duane-Hunt minimum-wavelength relation. */
const PLANCK_H = 6.62607015e-34;

/**
 * Duane-Hunt maximum photon energy emitted by an X-ray tube.
 *
 *   E_max = e · U
 *
 * `voltageV` — accelerating potential in volts. Returns the cutoff
 * energy in joules. For a 50-kV tube this is 8.01e-15 J, which divided
 * by ELEMENTARY_CHARGE gives 50 000 eV. One electron deposits all of
 * its kinetic energy into one photon in the limiting braking event;
 * the photon cannot carry more than that.
 */
export function duaneHuntEnergy(voltageV: number): number {
  if (voltageV < 0) {
    throw new Error("duaneHuntEnergy: voltageV must be ≥ 0");
  }
  return ELEMENTARY_CHARGE * voltageV;
}

/**
 * Duane-Hunt minimum wavelength of the continuous X-ray spectrum.
 *
 *   λ_min = h c / (e U)
 *
 * The shortest wavelength the tube can emit. At U = 50 kV, λ_min ≈
 * 24.8 pm — squarely in the hard-X-ray range. Equivalent forms: the
 * photon energy at λ_min equals the kinetic energy of one electron.
 */
export function duaneHuntWavelengthM(voltageV: number): number {
  if (voltageV <= 0) {
    throw new Error("duaneHuntWavelengthM: voltageV must be > 0");
  }
  return (PLANCK_H * SPEED_OF_LIGHT) / (ELEMENTARY_CHARGE * voltageV);
}

/**
 * Kramers 1923 thick-target continuous-spectrum shape.
 *
 *   dN/dE ∝ (E_max − E) / E   for 0 < E ≤ E_max
 *          = 0                 for E > E_max (Duane-Hunt cutoff)
 *
 * The numerical prefactor depends on the anode atomic number Z, the
 * tube current, and other engineering parameters; this helper returns
 * the *shape* only, normalised so the caller can multiply by whatever
 * prefactor is convenient for plotting.
 *
 * Both `E_keV` and `E_max_keV` are in kilo-electron-volts. The function
 * returns 0 for E ≤ 0 and for E > E_max; between them it follows the
 * Kramers formula.
 */
export function kramersSpectrum(E_keV: number, E_max_keV: number): number {
  if (E_max_keV <= 0) return 0;
  if (E_keV <= 0) return 0;
  if (E_keV > E_max_keV) return 0;
  return (E_max_keV - E_keV) / E_keV;
}

/**
 * Bethe-Heitler thin-target bremsstrahlung spectrum shape.
 *
 *   dN/dE ∝ ln(E_max / E)  for 0 < E < E_max
 *          = 0              otherwise
 *
 * The thin-target limit: an electron crosses a foil without losing
 * appreciable energy, so every deceleration event samples the full
 * kinetic energy. The logarithmic shape is gentler at low E than the
 * Kramers 1/E divergence; both are singular at E → 0 but differ in
 * steepness.
 */
export function thinTargetSpectrum(E_keV: number, E_max_keV: number): number {
  if (E_max_keV <= 0) return 0;
  if (E_keV <= 0) return 0;
  if (E_keV >= E_max_keV) return 0;
  return Math.log(E_max_keV / E_keV);
}

/**
 * Relativistic bremsstrahlung angular distribution (per unit solid
 * angle, shape only).
 *
 *   dP/dΩ ∝ sin²θ / (1 − β cos θ)⁴
 *
 * θ is measured from the instantaneous electron velocity direction at
 * the deflection event. At γ → 1 (β → 0) the denominator → 1 and the
 * distribution reduces to the non-relativistic Larmor sin²θ lobe; at
 * γ ≫ 1 the (1 − β cos θ)⁴ factor sharpens the distribution into a
 * forward cone of opening angle ~1/γ (relativistic beaming, shared
 * with §10.4 synchrotron).
 *
 * Accepts `gamma ≥ 1`. Returns a non-negative dimensionless shape
 * factor; the overall prefactor is suppressed.
 */
export function bremsstrahlungAngularDistribution(
  thetaRad: number,
  gamma: number,
): number {
  if (gamma < 1) {
    throw new Error(
      "bremsstrahlungAngularDistribution: gamma must be ≥ 1, got " + gamma,
    );
  }
  const beta = Math.sqrt(1 - 1 / (gamma * gamma));
  const s = Math.sin(thetaRad);
  const denom = 1 - beta * Math.cos(thetaRad);
  // At γ = 1, beta = 0, denom = 1 for every θ → reduces exactly to sin²θ.
  return (s * s) / (denom * denom * denom * denom);
}
