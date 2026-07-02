/**
 * FIG.05 INTERNAL ENERGY AND THE FIRST LAW — pure-TS helpers.
 *
 * The first law of thermodynamics is energy conservation written for systems
 * that exchange both heat and work:
 *
 *   ΔU = Q − W
 *
 * with the **physics sign convention** used throughout this branch:
 *   - Q > 0 when heat flows *into* the system,
 *   - W > 0 when the system does work *on* its surroundings.
 *
 * The internal energy U is a state function — it depends only on the current
 * state, never on the path taken to reach it — so ΔU between two states is
 * fixed even though Q and W individually are not. Heat and work are the two
 * channels through which that stored energy is changed; neither is itself
 * "stored". This module does the accounting for the three teaching modes of the
 * accounting scene (engine, heating, friction) and exposes the first-law test
 * that forbids perpetual motion of the first kind.
 *
 * React-free, typed. Energies in joules.
 */

/** The first-law balance for one step: ΔU = Q − W. */
export interface FirstLawAccount {
  /** Heat added to the system, J (signed: + in). */
  Q: number;
  /** Work done by the system, J (signed: + out). */
  W: number;
  /** Resulting change in internal energy, J. */
  deltaU: number;
}

/**
 * The first law: ΔU = Q − W.
 *
 * @param Q heat added to the system (J, positive = in)
 * @param W work done by the system (J, positive = out)
 */
export function firstLaw(Q: number, W: number): FirstLawAccount {
  return { Q, W, deltaU: Q - W };
}

/** Solve for the missing term given any two of {ΔU, Q, W}. */
export function heatFrom(deltaU: number, W: number): number {
  return deltaU + W; // Q = ΔU + W
}

/** Solve for work given ΔU and Q. */
export function workFrom(deltaU: number, Q: number): number {
  return Q - deltaU; // W = Q − ΔU
}

/** The three teaching modes of the first-law accounting scene. */
export type ProcessMode = "engine" | "heating" | "friction";

/** Human description of each mode. */
export const MODE_LABELS: Record<ProcessMode, string> = {
  engine: "heat in, work out (engine)",
  heating: "heat in only (heating)",
  friction: "work in only (friction)",
};

/**
 * Build the Q and W for a teaching mode from two non-negative magnitudes, then
 * apply the first law. Magnitudes are the *sizes* of the heat and work flows;
 * the mode decides their signs.
 *
 * - **engine**   — heat flows in (+qIn), the system does work out (+wOut).
 * - **heating**  — heat flows in (+qIn), no work is done (W = 0): all of Q
 *                  raises U.
 * - **friction** — no heat (Q = 0), work is done *on* the system, so the
 *                  system's work output is negative (−wOut); U rises by |wOut|.
 *
 * @param mode which teaching mode
 * @param qIn  magnitude of heat flow, J (≥ 0)
 * @param wOut magnitude of work flow, J (≥ 0)
 */
export function modeAccount(
  mode: ProcessMode,
  qIn: number,
  wOut: number,
): FirstLawAccount {
  if (qIn < 0 || wOut < 0) {
    throw new RangeError("flow magnitudes must be non-negative");
  }
  switch (mode) {
    case "engine":
      return firstLaw(qIn, wOut);
    case "heating":
      return firstLaw(qIn, 0);
    case "friction":
      return firstLaw(0, -wOut);
  }
}

/**
 * Perpetual motion of the first kind: a machine that, over a complete cycle
 * (ΔU = 0, the working substance returns to its starting state), delivers more
 * work than the heat it absorbs. The first law forbids it: a cycle can only
 * output the work it is fed in heat, W_net = Q_net. Returns true if the claimed
 * machine would violate the first law.
 *
 * @param qNetIn net heat absorbed over the cycle (J)
 * @param wNetOut net work delivered over the cycle (J)
 * @param tol numerical tolerance (J)
 */
export function violatesFirstLaw(
  qNetIn: number,
  wNetOut: number,
  tol = 1e-9,
): boolean {
  // Over a cycle ΔU = 0 ⟹ Q_net − W_net = 0. Any surplus work is free energy.
  return wNetOut - qNetIn > tol;
}
