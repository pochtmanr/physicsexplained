/**
 * FIG.20 FREE ENERGIES AND MAXWELL'S DEMON — the four thermodynamic potentials,
 * their Legendre relations, and the Szilard-engine / Landauer bookkeeping that
 * rescues the second law from the demon. Pure TS, SI units, no React.
 *
 * Internal energy U is the "raw" potential, with natural variables entropy S and
 * volume V (dU = T dS − P dV). The other three are Legendre transforms that
 * trade an awkward variable (S, V) for the easy conjugate one (T, P):
 *
 *   H = U + PV          enthalpy            natural (S, P)   dH = T dS + V dP
 *   F = U − TS          Helmholtz free E.   natural (T, V)   dF = −S dT − P dV
 *   G = U − TS + PV     Gibbs free energy   natural (T, P)   dG = −S dT + V dP
 *
 * Each is minimized at equilibrium under the conditions where its natural
 * variables are the ones held fixed — which is why G governs chemistry at fixed
 * (T, P) and F governs a system at fixed (T, V).
 *
 * Reuses K_B from distributions.ts. The Landauer limit k_BT ln 2 is the bridge
 * from thermodynamics to the physics of information.
 */

import { K_B } from "@/lib/physics/thermodynamics/distributions";

/** Natural log of 2 — the entropy of one erased bit, in units of k_B. */
export const LN2 = Math.LN2;

// ───────────────────────────────────────────────────────────────────────────
// The four potentials. Each takes the relevant state variables and returns a
// value in joules; all four are consistent by construction (G = H − TS = F + PV).
// ───────────────────────────────────────────────────────────────────────────

/** Enthalpy H = U + PV  [J]. Heat exchanged at constant pressure. */
export function enthalpy(U: number, P: number, V: number): number {
  return U + P * V;
}

/** Helmholtz free energy F = U − TS  [J]. Useful work available at fixed T, V. */
export function helmholtzFreeEnergy(U: number, T: number, S: number): number {
  return U - T * S;
}

/** Gibbs free energy G = U − TS + PV  [J]. Spontaneity criterion at fixed T, P. */
export function gibbsFreeEnergy(
  U: number,
  T: number,
  S: number,
  P: number,
  V: number,
): number {
  return U - T * S + P * V;
}

/**
 * Sign of a process's Gibbs-energy change ΔG = ΔH − TΔS at fixed T, P:
 * −1 spontaneous (ΔG < 0), +1 non-spontaneous, 0 at equilibrium. The single
 * inequality that decides the direction of every chemical reaction.
 */
export function gibbsSpontaneity(dH: number, dS: number, T: number): -1 | 0 | 1 {
  const dG = dH - T * dS;
  if (dG < 0) return -1;
  if (dG > 0) return 1;
  return 0;
}

// ───────────────────────────────────────────────────────────────────────────
// Metadata for the four-potentials quadrant scene. One shape, four corners.
// ───────────────────────────────────────────────────────────────────────────

export interface Potential {
  /** Single-letter symbol. */
  symbol: string;
  /** Full name. */
  name: string;
  /** Defining combination in terms of U. */
  definition: string;
  /** The two natural (held-fixed-at-equilibrium) variables. */
  natural: [string, string];
  /** The fundamental differential relation. */
  differential: string;
  /** When it is the right potential to minimize. */
  use: string;
}

export const POTENTIALS: readonly Potential[] = [
  {
    symbol: "U",
    name: "Internal energy",
    definition: "U",
    natural: ["S", "V"],
    differential: "dU = T dS − P dV",
    use: "An isolated system at fixed entropy and volume.",
  },
  {
    symbol: "H",
    name: "Enthalpy",
    definition: "U + PV",
    natural: ["S", "P"],
    differential: "dH = T dS + V dP",
    use: "Heat budgets at constant pressure — reactions open to the atmosphere.",
  },
  {
    symbol: "F",
    name: "Helmholtz free energy",
    definition: "U − TS",
    natural: ["T", "V"],
    differential: "dF = −S dT − P dV",
    use: "Work available from a system held at fixed temperature and volume.",
  },
  {
    symbol: "G",
    name: "Gibbs free energy",
    definition: "U − TS + PV",
    natural: ["T", "P"],
    differential: "dG = −S dT + V dP",
    use: "Spontaneity at fixed temperature and pressure — all of chemistry.",
  },
];

/**
 * A Legendre transform swaps a natural variable for its conjugate by adding (or
 * subtracting) their product: e.g. F = U − TS replaces S with T, H = U + PV
 * replaces V with P. Given a potential value and the conjugate product X·Y, the
 * transform adds the product when `add` is true (U → H) and subtracts it
 * otherwise (U → F). A thin helper that names the operation the four share.
 */
export function legendreTransform(
  potential: number,
  conjugateProduct: number,
  add: boolean,
): number {
  return add ? potential + conjugateProduct : potential - conjugateProduct;
}

// ───────────────────────────────────────────────────────────────────────────
// Szilard engine & Landauer's principle — the thermodynamics of one bit.
// ───────────────────────────────────────────────────────────────────────────

/**
 * Work a one-molecule Szilard engine extracts in a single isothermal expansion
 * from half the box to the whole box: W = k_BT ln 2  [J]. This is the energy the
 * demon appears to get "for free" once it knows which side the molecule is on.
 */
export function szilardWork(T: number): number {
  return K_B * T * LN2;
}

/**
 * Landauer limit: the minimum energy dissipated to erase one bit of information,
 * k_BT ln 2  [J] (Landauer, 1961). Resetting the demon's one-bit memory to a
 * standard state costs at least this much — exactly what the engine extracted.
 */
export function landauerLimit(T: number): number {
  return K_B * T * LN2;
}

/**
 * Net work per full Szilard cycle once the measurement is erased:
 * W_extracted − W_erase = k_BT ln 2 − k_BT ln 2 = 0. The demon breaks even; the
 * second law survives. Returns ~0 (to floating-point) for any T.
 */
export function szilardNetWork(T: number): number {
  return szilardWork(T) - landauerLimit(T);
}
