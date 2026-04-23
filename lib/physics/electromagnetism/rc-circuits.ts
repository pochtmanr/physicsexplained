/**
 * RC circuits (FIG.27, §06).
 *
 * A series RC loop — battery V₀, resistor R, capacitor C, switch — is the
 * canonical first-order linear system in electronics. From Kirchhoff's loop
 * rule together with Q = C·V and i = dQ/dt one extracts:
 *
 *   V_c(t)  = V₀ · (1 − e^(−t/τ))        charging from zero
 *   V_c(t)  = V₀ · e^(−t/τ)              discharging from V₀
 *   i(t)    = (V₀/R) · e^(−t/τ)          charge current (decays)
 *   τ       = R · C                      time constant (seconds)
 *
 * The constant τ is not an arbitrary parameter — it is the ratio of how
 * fast charge is packed in (C, a big tank) to how fast the resistor lets
 * charge through (R, the hose). Bigger tank, slower fill; narrower hose,
 * slower fill. After one τ the capacitor is at 63.2 % of the target; after
 * 5τ it is within 0.7 % — "essentially done" for engineering purposes.
 *
 * The energy bookkeeping is the final twist. When a capacitor is charged
 * from 0 to V₀ through any resistor R, the energy stored on the cap is
 * ½·C·V₀². The energy dissipated as heat in R during that same charge is
 * *also* ½·C·V₀², independent of the value of R itself. Half the battery's
 * output always becomes heat on the way in — a result first pinned down by
 * <PhysicistLink slug="james-prescott-joule">Joule</PhysicistLink> and the
 * reason every real capacitor-charging circuit gets warm.
 */

/**
 * Capacitor voltage while charging from 0 toward V₀ through R:
 *
 *   V_c(t) = V₀ · (1 − e^(−t/τ)),   τ = R·C.
 *
 * At t = 0 the voltage is 0. At t = τ it is (1 − 1/e) ≈ 0.632·V₀.
 * At t = 5τ it is within 1 % of V₀. It never quite reaches V₀ in finite
 * time — that is the whole point of the exponential.
 *
 * Units: `V0` in volts, `R` in ohms, `C` in farads, `t` in seconds, return
 * in volts. No sign convention on `t` — negative times return voltages
 * above V₀ and are unphysical; callers are expected to clamp t ≥ 0.
 */
export function rcCharge(V0: number, R: number, C: number, t: number): number {
  if (R <= 0) throw new Error(`rcCharge: R must be positive (got ${R}).`);
  if (C <= 0) throw new Error(`rcCharge: C must be positive (got ${C}).`);
  return V0 * (1 - Math.exp(-t / (R * C)));
}

/**
 * Capacitor voltage while discharging from V₀ through R (source disconnected,
 * cap left to bleed off into the resistor):
 *
 *   V_c(t) = V₀ · e^(−t/τ),   τ = R·C.
 *
 * The symmetric twin of `rcCharge` — at t = τ the voltage has fallen to
 * 1/e ≈ 36.8 % of its starting value.
 *
 * Units: `V0` in volts, `R` in ohms, `C` in farads, `t` in seconds, return
 * in volts.
 */
export function rcDischarge(
  V0: number,
  R: number,
  C: number,
  t: number,
): number {
  if (R <= 0) throw new Error(`rcDischarge: R must be positive (got ${R}).`);
  if (C <= 0) throw new Error(`rcDischarge: C must be positive (got ${C}).`);
  return V0 * Math.exp(-t / (R * C));
}

/**
 * RC time constant:
 *
 *   τ = R · C
 *
 * Units: `R` in ohms, `C` in farads, return in seconds. One of the most
 * reached-for engineering formulas on earth — debounce circuits, ADC
 * anti-aliasing, PWM smoothing, flash capacitors, the RC low-pass.
 */
export function rcTimeConstant(R: number, C: number): number {
  if (R <= 0) throw new Error(`rcTimeConstant: R must be positive (got ${R}).`);
  if (C <= 0) throw new Error(`rcTimeConstant: C must be positive (got ${C}).`);
  return R * C;
}

/**
 * Instantaneous current during a charge from 0 toward V₀:
 *
 *   i(t) = (V₀ / R) · e^(−t/τ)
 *
 * At t = 0 the capacitor is empty — no back-voltage to oppose the battery —
 * so the current jumps to its maximum V₀/R (Ohm's law, purely resistive
 * limit). As V_c climbs, less voltage is left to drive R, and i decays
 * with the same time constant.
 *
 * During a discharge the current has the same magnitude envelope but
 * flows in the opposite direction; callers can negate if signed current
 * is desired.
 *
 * Units: `V0` in volts, `R` in ohms, `C` in farads, `t` in seconds, return
 * in amperes.
 */
export function rcChargeCurrent(
  V0: number,
  R: number,
  C: number,
  t: number,
): number {
  if (R <= 0) throw new Error(`rcChargeCurrent: R must be positive (got ${R}).`);
  if (C <= 0) throw new Error(`rcChargeCurrent: C must be positive (got ${C}).`);
  return (V0 / R) * Math.exp(-t / (R * C));
}

/**
 * Energy stored on a capacitor charged to voltage V:
 *
 *   U_C = ½ · C · V²
 *
 * Units: `C` in farads, `V` in volts, return in joules.
 */
export function capacitorEnergy(C: number, V: number): number {
  if (C < 0) throw new Error(`capacitorEnergy: C must be non-negative (got ${C}).`);
  return 0.5 * C * V * V;
}

/**
 * Total energy dissipated in the resistor during a charge from 0 to V₀:
 *
 *   W_R = ∫₀^∞ i(t)² · R dt = ½ · C · V₀²
 *
 * Derivation: i(t) = (V₀/R) · e^(−t/τ), so i²R = (V₀²/R) · e^(−2t/τ).
 * Integrating from 0 to ∞ gives (V₀²/R) · (τ/2) = V₀² · C / 2.
 *
 * The striking result: this is exactly the energy stored on the capacitor
 * at the end of the charge. Half the battery's ∫V·i dt output ends up on
 * the cap; the other half becomes heat in R. The result is independent of
 * the specific value of R — R only sets how long it takes, not how much is
 * lost. Lowering R to speed things up doesn't save a single joule.
 *
 * Units: `C` in farads, `V0` in volts, return in joules.
 */
export function rcChargeEnergyDissipated(C: number, V0: number): number {
  if (C < 0) throw new Error(
    `rcChargeEnergyDissipated: C must be non-negative (got ${C}).`,
  );
  return 0.5 * C * V0 * V0;
}

/**
 * Total energy delivered by the battery over a full charge (0 → V₀):
 *
 *   W_battery = V₀ · Q_final = V₀ · (C · V₀) = C · V₀²
 *
 * The sum of `capacitorEnergy(C, V0)` + `rcChargeEnergyDissipated(C, V0)`
 * is exactly `C·V₀²`, confirming energy conservation: half stored, half
 * dissipated.
 *
 * Units: `C` in farads, `V0` in volts, return in joules.
 */
export function rcChargeBatteryEnergy(C: number, V0: number): number {
  if (C < 0) throw new Error(
    `rcChargeBatteryEnergy: C must be non-negative (got ${C}).`,
  );
  return C * V0 * V0;
}
