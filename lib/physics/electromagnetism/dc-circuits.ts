/**
 * DC circuits — Ohm's law and Kirchhoff's two sentences.
 *
 * The lumped-parameter world: nodes where charge cannot pile up (KCL) and
 * loops where voltage drops must sum to zero (KVL). Everything downstream —
 * series/parallel reductions, voltage dividers, Thevenin equivalents — is a
 * consequence of those two bookkeeping rules plus Ohm's V = I·R for each
 * resistor.
 *
 * The MNA machinery lives in `@/components/physics/circuit-canvas/solver`;
 * this file wraps it with the handful of closed-form helpers students reach
 * for daily.
 */

import { solveDC, thevenin } from "@/components/physics/circuit-canvas/solver";
import type {
  CircuitScene,
  SolutionSnapshot,
} from "@/components/physics/circuit-canvas/types";

// ---------- Ohm's law ----------

/** Ohm's law: V = I·R. */
export function ohm(I: number, R: number): number {
  return I * R;
}

/** Current through a resistor given the voltage across it: I = V/R. */
export function current(V: number, R: number): number {
  if (R === 0) throw new Error("current: R must be nonzero");
  return V / R;
}

/** Power dissipated by a resistor: P = I²·R = V²/R. */
export function power(I: number, R: number): number {
  return I * I * R;
}

// ---------- Series / parallel reductions ----------

/** Series combination: resistances add. R_total = ΣR_k. */
export function seriesResistance(Rs: number[]): number {
  if (Rs.length === 0) return 0;
  return Rs.reduce((a, b) => a + b, 0);
}

/** Parallel combination: reciprocals add. 1/R_total = Σ1/R_k. */
export function parallelResistance(Rs: number[]): number {
  if (Rs.length === 0) throw new Error("parallelResistance: empty list");
  if (Rs.some((r) => r <= 0)) {
    throw new Error("parallelResistance: all R must be strictly positive");
  }
  return 1 / Rs.reduce((acc, r) => acc + 1 / r, 0);
}

// ---------- Voltage divider ----------

/**
 * Voltage divider: the subcircuit inside every schematic.
 *
 *   V_in ──R1──┬──R2──GND
 *              │
 *              V_out = V_in · R2 / (R1 + R2)
 *
 * Derivation falls out of KCL + Ohm in two lines: the same current I runs
 * through both resistors, so I = V_in / (R1 + R2), and V_out = I·R2.
 */
export function voltageDivider(Vin: number, R1: number, R2: number): number {
  if (R1 + R2 === 0) {
    throw new Error("voltageDivider: R1 + R2 must be nonzero");
  }
  return (Vin * R2) / (R1 + R2);
}

// ---------- Full MNA wrappers ----------

/**
 * Solve an arbitrary DC ladder via the CircuitCanvas MNA solver. Returned
 * snapshot contains node voltages and branch currents keyed by element id.
 */
export function solveLadder(scene: CircuitScene): SolutionSnapshot {
  return solveDC(scene);
}

/**
 * Thevenin equivalent of an arbitrary two-terminal linear network seen from
 * the (portFrom, portTo) pair: a single ideal source V_open in series with a
 * single resistance R_Thev reproduces any external measurement.
 */
export function theveninEquivalent(
  scene: CircuitScene,
  portFrom: string,
  portTo: string,
): { vOpen: number; rThevenin: number } {
  return thevenin(scene, portFrom, portTo);
}
