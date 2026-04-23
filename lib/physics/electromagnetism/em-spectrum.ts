/**
 * The electromagnetic spectrum — one wave equation, every band.
 *
 * A plane electromagnetic wave in vacuum obeys  c = λ·f , where λ is the
 * wavelength in metres, f the frequency in hertz, and c the speed of light
 * (an exact 299 792 458 m/s since the 1983 redefinition of the metre). The
 * photon energy associated with that oscillation is E = h·f = h·c/λ, where
 * h is Planck's constant. Those three relations — c = λf, E = hf, E = hc/λ
 * — bolt wavelength, frequency, and energy into a single rigid triangle.
 *
 * There is no physical discontinuity between the bands. "Radio" shades into
 * "microwave" shades into "infrared" shades into "visible" and so on. The
 * boundaries are historical: different detectors were invented for different
 * energy scales (antennas, klystrons, bolometers, eyes, photographic film,
 * Geiger counters) and the label on a slice of the spectrum is really the
 * label on the detector that first made it legible. The band edges below
 * follow IEEE / ISO convention with a slight rounding for readability.
 *
 * Photon energies span about 25 orders of magnitude from 10⁵ m radio
 * wavelengths (~10⁻¹¹ eV, weaker than the thermal motion of a single atom)
 * to 10⁻¹⁵ m gamma rays (~GeV, comparable to the rest mass of a proton).
 * The same ∇²E − (1/c²)∂²E/∂t² = 0 describes the entire ladder.
 */

import { SPEED_OF_LIGHT } from "@/lib/physics/constants";

/** Planck's constant, J·s (exact, SI 2019 redefinition). */
export const PLANCK_CONSTANT = 6.62607015e-34;

/** Elementary charge expressed in joules per electron-volt (exact). */
const J_PER_EV = 1.602176634e-19;

/**
 * A band of the electromagnetic spectrum. `wavelengthMinM` is the shorter
 * edge, `wavelengthMaxM` the longer — so "Visible" runs 380 nm → 780 nm.
 *
 * `color` is a CSS colour string used for scene rendering. It is a single
 * representative colour per band; the visible band is drawn per-wavelength
 * with CIE-style mapping in the visible-zoom scene instead.
 */
export interface SpectrumBand {
  readonly name: string;
  readonly wavelengthMinM: number;
  readonly wavelengthMaxM: number;
  readonly color: string;
}

/**
 * Seven canonical bands, ordered from longest wavelength (Radio) to
 * shortest (Gamma). Band edges rounded to powers of ten where the
 * literature allows. `Radio` top-end clipped to 10⁵ m — theoretically
 * there is no upper limit, but sources below ~3 kHz are practically
 * impossible to excite through Earth's ionosphere anyway.
 */
export const SPECTRUM_BANDS: readonly SpectrumBand[] = [
  {
    name: "Radio",
    wavelengthMinM: 1,
    wavelengthMaxM: 1e5,
    color: "#F17A3A",
  },
  {
    name: "Microwave",
    wavelengthMinM: 1e-3,
    wavelengthMaxM: 1,
    color: "#FFB347",
  },
  {
    name: "Infrared",
    wavelengthMinM: 7.8e-7,
    wavelengthMaxM: 1e-3,
    color: "#D94C4C",
  },
  {
    name: "Visible",
    wavelengthMinM: 3.8e-7,
    wavelengthMaxM: 7.8e-7,
    color: "#8EE6B0",
  },
  {
    name: "Ultraviolet",
    wavelengthMinM: 1e-8,
    wavelengthMaxM: 3.8e-7,
    color: "#8B7EE8",
  },
  {
    name: "X-ray",
    wavelengthMinM: 1e-11,
    wavelengthMaxM: 1e-8,
    color: "#6FB8C6",
  },
  {
    name: "Gamma",
    wavelengthMinM: 1e-16,
    wavelengthMaxM: 1e-11,
    color: "#FF6ADE",
  },
];

/**
 * Frequency from wavelength via c = λ·f ⇒ f = c/λ.
 *
 * Units: λ in metres, result in hertz. Throws on non-positive input so that
 * callers don't end up with Infinity or NaN leaking into a chart axis.
 */
export function frequencyFromWavelength(lambdaM: number): number {
  if (lambdaM <= 0) {
    throw new Error("frequencyFromWavelength: wavelength must be > 0");
  }
  return SPEED_OF_LIGHT / lambdaM;
}

/**
 * Wavelength from frequency via c = λ·f ⇒ λ = c/f.
 *
 * Units: f in hertz, result in metres. Throws on non-positive input.
 */
export function wavelengthFromFrequency(fHz: number): number {
  if (fHz <= 0) {
    throw new Error("wavelengthFromFrequency: frequency must be > 0");
  }
  return SPEED_OF_LIGHT / fHz;
}

/**
 * Angular wavenumber, k = 2π/λ, in radians per metre. This is the spatial
 * analogue of angular frequency ω = 2π·f — phase advance per unit length —
 * and shows up everywhere in the wave equation and dispersion relations.
 */
export function wavenumber(lambdaM: number): number {
  if (lambdaM <= 0) {
    throw new Error("wavenumber: wavelength must be > 0");
  }
  return (2 * Math.PI) / lambdaM;
}

/**
 * Photon energy in joules from wavelength via E = h·c/λ.
 *
 * Derivation: the quantum relation E = h·f combined with c = λ·f gives
 * E = h·c/λ. This is the bridge from "classical wave" language (wavelength,
 * frequency) into "photon" language (joules per quantum).
 */
export function photonEnergy(lambdaM: number): number {
  if (lambdaM <= 0) {
    throw new Error("photonEnergy: wavelength must be > 0");
  }
  return (PLANCK_CONSTANT * SPEED_OF_LIGHT) / lambdaM;
}

/**
 * Photon energy in electron-volts. Convenience for quoting band energies
 * the way chemists and spectroscopists do — visible photons at ~2 eV,
 * X-rays at ~keV, gamma rays at MeV–GeV.
 */
export function photonEnergyInEV(lambdaM: number): number {
  return photonEnergy(lambdaM) / J_PER_EV;
}

/**
 * Name the band a given wavelength falls into. A wavelength exactly on a
 * boundary is awarded to the shorter-wavelength (higher-energy) band, so
 * 7.8e-7 m counts as Visible rather than Infrared. Returns null for any
 * wavelength outside the union of all defined bands.
 *
 * Iterates from longest to shortest; uses inclusive-lower, exclusive-upper
 * except for the very shortest band where both ends are inclusive so the
 * floor of the whole spectrum still resolves.
 */
export function bandOf(wavelengthM: number): string | null {
  if (!(wavelengthM > 0)) return null;
  for (let i = 0; i < SPECTRUM_BANDS.length; i++) {
    const band = SPECTRUM_BANDS[i]!;
    const isShortest = i === SPECTRUM_BANDS.length - 1;
    const inUpper = isShortest
      ? wavelengthM <= band.wavelengthMaxM
      : wavelengthM < band.wavelengthMaxM;
    if (wavelengthM >= band.wavelengthMinM && inUpper) {
      return band.name;
    }
  }
  return null;
}
