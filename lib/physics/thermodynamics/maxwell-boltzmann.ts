/**
 * FIG.16 THE MAXWELL–BOLTZMANN DISTRIBUTION — characteristic speeds, the tail
 * (fast) fraction, and the Arrhenius factor. Pure TS, SI units, no React.
 *
 * From f(v) = 4π(m/2πkT)^{3/2} v² exp(−mv²/2kT) (see distributions.ts) three
 * speeds fall out, always in the same order:
 *
 *   v_mp  = √(2kT/m)      most probable — the peak of f(v)
 *   ⟨v⟩   = √(8kT/πm)     mean
 *   v_rms = √(3kT/m)      root-mean-square — sets the kinetic energy
 *
 *   v_mp : ⟨v⟩ : v_rms  =  √2 : √(8/π) : √3  ≈  1 : 1.128 : 1.225
 *
 * The chemistry of the gas enters only through m; the physics only through T.
 */

import { K_B, maxwellBoltzmannSpeed } from "@/lib/physics/thermodynamics/distributions";

/** Unified atomic mass unit, kg. */
export const AMU = 1.66053906660e-27;

/** A gas species with its molecular mass in atomic mass units. */
export interface Species {
  /** Display name. */
  name: string;
  /** Molecular mass in u (e.g. N₂ = 28). */
  amu: number;
}

/** Species used across the speed scenes, lightest → heaviest. */
export const SPECIES: readonly Species[] = [
  { name: "H₂", amu: 2.016 },
  { name: "He", amu: 4.003 },
  { name: "N₂", amu: 28.01 },
  { name: "Ar", amu: 39.95 },
  { name: "Xe", amu: 131.3 },
];

/** Molecular mass of a species in kilograms. */
export function speciesMass(s: Species): number {
  return s.amu * AMU;
}

/** Most probable speed v_mp = √(2kT/m)  [m/s]. */
export function vMostProbable(T: number, m: number): number {
  return Math.sqrt((2 * K_B * T) / m);
}

/** Mean speed ⟨v⟩ = √(8kT/πm)  [m/s]. */
export function vMean(T: number, m: number): number {
  return Math.sqrt((8 * K_B * T) / (Math.PI * m));
}

/** Root-mean-square speed v_rms = √(3kT/m)  [m/s]. */
export function vRms(T: number, m: number): number {
  return Math.sqrt((3 * K_B * T) / m);
}

/**
 * Fraction of molecules with speed above `vThreshold` — the area under the tail
 * of f(v). Computed by composite-trapezoid integration of the (analytically
 * normalised) speed density, dividing the tail integral by the total so any
 * residual quadrature error cancels. Returns a value clamped to [0, 1].
 *
 * This tail is what governs escape from a planet's atmosphere, evaporation, and
 * the temperature sensitivity of reaction rates.
 */
export function fastFraction(vThreshold: number, T: number, m: number): number {
  const vMax = 6 * vRms(T, m);
  const N = 3000;
  const dv = vMax / N;
  let total = 0;
  let tail = 0;
  for (let i = 0; i <= N; i++) {
    const v = i * dv;
    const w = i === 0 || i === N ? 0.5 : 1;
    const f = maxwellBoltzmannSpeed(v, T, m) * w * dv;
    total += f;
    if (v >= vThreshold) tail += f;
  }
  if (total <= 0) return 0;
  return Math.min(1, Math.max(0, tail / total));
}

/**
 * Arrhenius factor exp(−E_a/kT): the fraction of collisions energetic enough to
 * clear an activation barrier E_a — the high-energy tail of the Boltzmann
 * distribution, and the reason reaction rates climb so steeply with
 * temperature. Dimensionless; E_a in joules, T in kelvin.
 */
export function arrheniusFactor(Ea: number, T: number): number {
  return Math.exp(-Ea / (K_B * T));
}
