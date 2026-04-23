/**
 * RL circuits (FIG.28, §06.3).
 *
 * A series RL circuit driven by a constant source `V0` obeys the first-order
 * ordinary differential equation
 *
 *   V0 = I·R + L · dI/dt
 *
 * Kirchhoff's voltage law, applied to the loop, equates the source EMF to
 * the sum of the resistive drop `I·R` and the inductor's back-EMF
 * `V_L = L · dI/dt`. Solving with the initial condition `I(0) = 0` gives
 * the exponential approach
 *
 *   I(t) = (V0/R) · (1 − e^(−t·R/L))
 *
 * with characteristic timescale `τ_L = L/R` — the RL time constant.
 * Symmetrically, once the source is removed and the current is allowed to
 * freewheel through a short, the current decays as
 *
 *   I(t) = I₀ · e^(−t·R/L)
 *
 * The inductor is a current-flywheel: it resists change in whatever
 * direction the change points. The reservoir holds energy `½ L I²`, the
 * magnetic mirror of the capacitor's `½ C V²`.
 *
 * The practical reveal in §06.3 is the **flyback spike**. Open a switch
 * in an inductive branch and you force `dI/dt` to an enormous negative
 * value in whatever tiny time it takes the arc to form. `V_L = L · dI/dt`
 * can reach kilovolts across a millihenry coil. Every spark plug on
 * every car engine is built around that equation.
 */

/**
 * RL time constant.
 *
 *   τ_L = L / R
 *
 * The characteristic timescale of current rise (or decay) in a series RL
 * circuit. At `t = τ`, the current has reached 63.2 % of its asymptotic
 * value (or decayed to 36.8 %). Bigger `L` or smaller `R` → slower.
 *
 * Units: `L` in henrys, `R` in ohms, return in seconds.
 */
export function rlTimeConstant(L: number, R: number): number {
  if (R <= 0) {
    throw new Error(`rlTimeConstant: R must be positive (got ${R}).`);
  }
  return L / R;
}

/**
 * Current in a series RL circuit switched onto a constant source `V0` at
 * `t = 0` with zero initial current:
 *
 *   I(t) = (V0 / R) · (1 − e^(−t · R / L))
 *
 * Exponential approach to the steady-state value `V0 / R` with time
 * constant `τ = L/R`. Mirror of the RC capacitor-voltage rise.
 *
 * Units: `V0` in volts, `R` in ohms, `L` in henrys, `t` in seconds,
 * return in amperes.
 */
export function rlCurrent(V0: number, R: number, L: number, t: number): number {
  return (V0 / R) * (1 - Math.exp(-(t * R) / L));
}

/**
 * Decay of current after the source is removed and the inductor is
 * short-circuited (a "freewheeling" path is left intact so the current
 * can continue to flow):
 *
 *   I(t) = I₀ · e^(−t · R / L)
 *
 * The symmetric half of the RL story. An inductor with stored energy
 * wants to keep its current; the resistor dissipates it as heat at rate
 * `I²R` until the reservoir drains.
 *
 * Units: `I0` in amperes, `R` in ohms, `L` in henrys, `t` in seconds,
 * return in amperes.
 */
export function rlDecay(I0: number, R: number, L: number, t: number): number {
  return I0 * Math.exp(-(t * R) / L);
}

/**
 * Back-EMF across the inductor during a current ramp from rest to steady
 * state with a constant source `V0`:
 *
 *   V_L(t) = L · dI/dt = V0 · e^(−t · R / L)
 *
 * At `t = 0` the inductor presents the full source voltage in opposition
 * (the current hasn't risen yet, so all the source voltage drops across
 * `L`). As the current climbs, the resistive drop `I·R` eats more of
 * the source and the back-EMF decays exponentially.
 *
 * Units: `V0` in volts, `R` in ohms, `L` in henrys, `t` in seconds,
 * return in volts.
 */
export function backEMF(V0: number, R: number, L: number, t: number): number {
  return V0 * Math.exp(-(t * R) / L);
}

/**
 * Energy stored in an inductor at steady-state current `I_steady`:
 *
 *   U = ½ · L · I²
 *
 * The magnetic mirror of the capacitor's `½ C V²`. Every joule in an
 * ideal inductor sits in the magnetic field it has built around itself;
 * remove the source with a freewheel and that reservoir drains through
 * the resistor as `I²R` losses.
 *
 * Units: `L` in henrys, `Isteady` in amperes, return in joules.
 */
export function inductorEnergy(L: number, Isteady: number): number {
  return 0.5 * L * Isteady * Isteady;
}
