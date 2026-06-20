/**
 * FIG.07 ISOTHERMAL AND ADIABATIC PROCESSES — pure-TS helpers.
 *
 * Two limiting ways for a gas to change volume:
 *
 * - **Isothermal** (T fixed, held by a slow exchange with a reservoir). For an
 *   ideal gas U = U(T), so ΔU = 0 and the first law gives Q = W. The work is
 *   W = nRT·ln(V₂/V₁) and the path on a PV plot is the hyperbola PV = const.
 *
 * - **Adiabatic** (Q = 0, fast or perfectly insulated). No heat crosses the
 *   boundary, so ΔU = −W: the gas cools as it expands, heats as it is
 *   compressed. The path is the steeper hyperbola PVᵞ = const, equivalently
 *   TVᵞ⁻¹ = const, with γ = C_p/C_v.
 *
 * Also here: the free-expansion (Joule) result — a gas expanding into vacuum
 * does no work and exchanges no heat, and for an ideal gas its temperature does
 * not change, the cleanest proof that U depends on T alone.
 *
 * Rendering coordinates come from `pv-plot.ts`; this module owns the analytic
 * work and final-state formulas. React-free, typed. SI units (V m³, P Pa, T K,
 * energy J).
 */

import { R_GAS } from "@/lib/physics/thermodynamics/calorimetry";
import { MONATOMIC, DIATOMIC } from "@/lib/physics/thermodynamics/calorimetry";
import type { PvPoint } from "@/lib/physics/thermodynamics/pv-plot";

export { R_GAS, MONATOMIC, DIATOMIC };

// ── Isothermal ──────────────────────────────────────────────────────────────

/**
 * Work done by n moles of ideal gas in a reversible isothermal change from V₁
 * to V₂ at temperature T: W = nRT·ln(V₂/V₁). Positive for expansion. Because
 * ΔU = 0 along an isotherm, the heat absorbed equals this work, Q = W.
 */
export function isothermalWork(
  n: number,
  T: number,
  V1: number,
  V2: number,
): number {
  if (n <= 0 || T <= 0) throw new RangeError("n and T must be positive");
  if (V1 <= 0 || V2 <= 0) throw new RangeError("volumes must be positive");
  return n * R_GAS * T * Math.log(V2 / V1);
}

/** Along an isotherm ΔU = 0, so the heat absorbed equals the work done. */
export function isothermalHeat(
  n: number,
  T: number,
  V1: number,
  V2: number,
): number {
  return isothermalWork(n, T, V1, V2); // Q = W
}

/** Final pressure on an isotherm: P₂ = P₁V₁/V₂ (Boyle's law). */
export function isothermalFinalPressure(
  P1: number,
  V1: number,
  V2: number,
): number {
  if (V2 <= 0) throw new RangeError("V2 must be positive");
  return (P1 * V1) / V2;
}

// ── Adiabatic ───────────────────────────────────────────────────────────────

/** Final pressure on an adiabat: P₂ = P₁ (V₁/V₂)ᵞ. */
export function adiabaticFinalPressure(
  P1: number,
  V1: number,
  V2: number,
  gamma: number,
): number {
  if (V1 <= 0 || V2 <= 0) throw new RangeError("volumes must be positive");
  if (gamma <= 1) throw new RangeError("gamma must exceed 1");
  return P1 * Math.pow(V1 / V2, gamma);
}

/** Final temperature on an adiabat: T₂ = T₁ (V₁/V₂)ᵞ⁻¹. */
export function adiabaticFinalTemperature(
  T1: number,
  V1: number,
  V2: number,
  gamma: number,
): number {
  if (V1 <= 0 || V2 <= 0) throw new RangeError("volumes must be positive");
  if (gamma <= 1) throw new RangeError("gamma must exceed 1");
  return T1 * Math.pow(V1 / V2, gamma - 1);
}

/**
 * Work done by an ideal gas in a reversible adiabatic change:
 * W = (P₁V₁ − P₂V₂)/(γ − 1). Since Q = 0, ΔU = −W, so an adiabatic expansion
 * (W > 0) cools the gas. The two pressures are related by PVᵞ = const.
 */
export function adiabaticWork(
  P1: number,
  V1: number,
  V2: number,
  gamma: number,
): number {
  if (gamma <= 1) throw new RangeError("gamma must exceed 1");
  const P2 = adiabaticFinalPressure(P1, V1, V2, gamma);
  return (P1 * V1 - P2 * V2) / (gamma - 1);
}

/**
 * Adiabatic temperature change from a compression ratio r = V₁/V₂ (r > 1 is
 * compression): T₂/T₁ = rᵞ⁻¹. Useful for the diesel-ignition aside (r ≈ 20).
 */
export function adiabaticTemperatureRatio(
  compressionRatio: number,
  gamma: number,
): number {
  if (compressionRatio <= 0) throw new RangeError("ratio must be positive");
  if (gamma <= 1) throw new RangeError("gamma must exceed 1");
  return Math.pow(compressionRatio, gamma - 1);
}

// ── Comparison helper for the isothermal-vs-adiabatic scene ──────────────────

/** A summary of one process leg from a common start to a common final volume. */
export interface ProcessOutcome {
  /** Final pressure, Pa. */
  P2: number;
  /** Final temperature, K. */
  T2: number;
  /** Work done by the gas, J. */
  W: number;
}

/**
 * Compare an isothermal and an adiabatic change of the same n moles of ideal
 * gas from the same start state (P₁, V₁, T₁) to the same final volume V₂.
 * Returns both outcomes. For a compression (V₂ < V₁) the adiabat always ends
 * hotter and at higher pressure than the isotherm; for an expansion it ends
 * cooler and lower.
 */
export function compareProcesses(
  n: number,
  T1: number,
  P1: number,
  V1: number,
  V2: number,
  gamma: number,
): { isothermal: ProcessOutcome; adiabatic: ProcessOutcome } {
  const isothermal: ProcessOutcome = {
    P2: isothermalFinalPressure(P1, V1, V2),
    T2: T1, // constant by definition
    W: isothermalWork(n, T1, V1, V2),
  };
  const adiabatic: ProcessOutcome = {
    P2: adiabaticFinalPressure(P1, V1, V2, gamma),
    T2: adiabaticFinalTemperature(T1, V1, V2, gamma),
    W: adiabaticWork(P1, V1, V2, gamma),
  };
  return { isothermal, adiabatic };
}

// ── Free expansion (Joule) ───────────────────────────────────────────────────

/**
 * Joule's free expansion: a gas expands into an evacuated chamber. No work is
 * done (nothing pushes back) and no heat is exchanged (the vessel is isolated),
 * so ΔU = 0. For an ideal gas U = U(T), hence the temperature is unchanged.
 * Returns the constant outcome; ΔT is exactly 0 for the ideal case.
 */
export function freeExpansion(T1: number): {
  W: number;
  Q: number;
  deltaU: number;
  T2: number;
} {
  return { W: 0, Q: 0, deltaU: 0, T2: T1 };
}

// ── Lifting condensation level (cloud-formation aside) ───────────────────────

/** Dry adiabatic lapse rate of the atmosphere, ≈ 9.8 K per km of ascent. */
export const DRY_ADIABATIC_LAPSE_RATE = 9.8; // K/km

/**
 * Temperature of a dry air parcel after rising `km` kilometres, cooling at the
 * dry adiabatic lapse rate. A crude but faithful model of why rising air cools
 * and eventually reaches its dew point — the cloud base.
 */
export function parcelTemperatureAfterAscent(T0: number, km: number): number {
  return T0 - DRY_ADIABATIC_LAPSE_RATE * km;
}

/** Re-export the PvPoint type so scene code can import it from one module. */
export type { PvPoint };
