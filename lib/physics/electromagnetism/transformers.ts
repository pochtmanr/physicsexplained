/**
 * Transformers (FIG.31, §06).
 *
 * A transformer is two coils sharing a magnetic flux path — usually a
 * laminated iron core. A changing current in the primary (N_p turns) drives
 * a changing flux through the core; that same flux threads the secondary
 * (N_s turns) and, by Faraday's law, induces an EMF there. Because the
 * same dΦ/dt appears in each coil's EMF equation, the per-turn voltage is
 * the same on both sides:
 *
 *   V_p / N_p = V_s / N_s   ⟹   V_s / V_p = N_s / N_p           (EQ.01)
 *
 * The *turns ratio* n = N_s / N_p is the single knob that defines an
 * ideal transformer. Voltage scales by n; current, by the conservation of
 * power P = V·I, must scale by 1/n:
 *
 *   I_s / I_p = N_p / N_s = 1/n                                  (EQ.02)
 *
 * Real coupling is never perfect. The *coupling coefficient* k ∈ [0, 1]
 * measures what fraction of the primary flux links the secondary. The
 * mutual inductance follows from the self-inductances:
 *
 *   M = k · √(L_p · L_s)                                         (EQ.03)
 *
 * k = 1 is the ideal (every field line from the primary threads the
 * secondary); k = 0 is geometric decoupling. Real power transformers run
 * k ≳ 0.99 thanks to closed magnetic cores.
 *
 * The *why grids run at high voltage* story uses one inequality: resistive
 * line losses are P_loss = I² · R. At a fixed delivered power P_load and a
 * source voltage V_source, the line current is I = P_load / V_source, so
 *
 *   P_loss = (P_load / V_source)² · R_line                       (EQ.04)
 *
 * Losses fall as the *square* of the transmission voltage. Double the
 * voltage → quarter the loss. This is why the European grid runs 400 kV
 * transmission: at 400 V distribution the same line would bleed a million
 * times more heat.
 */

/**
 * Ideal transformer voltage ratio.
 *
 *   V_s = n · V_p,    n = N_s / N_p
 *
 * A step-up transformer has n > 1 (more secondary turns than primary); a
 * step-down has n < 1.
 *
 * Units: `Vp` and the return value share the same voltage unit.
 */
export function voltageRatio(turnsRatio: number, Vp: number): number {
  return turnsRatio * Vp;
}

/**
 * Ideal transformer current ratio (consequence of power conservation).
 *
 *   I_s = I_p / n,    n = N_s / N_p
 *
 * A step-up transformer (n > 1) cuts the current by 1/n on the secondary.
 * That is why high-voltage transmission lines carry small currents — the
 * same delivered power rides on a higher voltage and a lower I²R loss.
 *
 * Units: `Ip` and the return value share the same current unit.
 */
export function currentRatio(turnsRatio: number, Ip: number): number {
  if (turnsRatio === 0) {
    throw new Error("currentRatio: turns ratio must be nonzero");
  }
  return Ip / turnsRatio;
}

/**
 * Mutual inductance between two coils from their self-inductances and the
 * coupling coefficient k:
 *
 *   M = k · √(L_p · L_s)
 *
 * k ∈ [0, 1]. k = 1 is a perfectly coupled (ideal) transformer; k = 0 is
 * two magnetically decoupled coils.
 *
 * Units: `Lp`, `Ls` in henries; returns `M` in henries. Both self-
 * inductances must be non-negative and k must lie in [0, 1].
 */
export function mutualInductance(k: number, Lp: number, Ls: number): number {
  if (k < 0 || k > 1) {
    throw new Error(
      `mutualInductance: coupling coefficient k must be in [0, 1] (got ${k}).`,
    );
  }
  if (Lp < 0 || Ls < 0) {
    throw new Error(
      `mutualInductance: self-inductances must be non-negative (got Lp=${Lp}, Ls=${Ls}).`,
    );
  }
  return k * Math.sqrt(Lp * Ls);
}

/**
 * Resistive power loss in a transmission line delivering `loadPower` at
 * source voltage `sourceVoltage` through a line of total resistance
 * `lineResistance`:
 *
 *   I        = loadPower / sourceVoltage
 *   P_loss   = I² · R_line = (loadPower / sourceVoltage)² · R_line
 *
 * Assumes a purely resistive line and unity power factor. For a given
 * delivered power, P_loss falls as 1/V² — the quadratic payoff for
 * stepping voltage up before transmission.
 *
 * Units: `loadPower` in watts, `sourceVoltage` in volts, `lineResistance`
 * in ohms; returns watts.
 */
export function lineLoss(
  loadPower: number,
  sourceVoltage: number,
  lineResistance: number,
): number {
  if (sourceVoltage === 0) {
    throw new Error("lineLoss: sourceVoltage must be nonzero");
  }
  if (lineResistance < 0) {
    throw new Error(
      `lineLoss: lineResistance must be non-negative (got ${lineResistance}).`,
    );
  }
  const I = loadPower / sourceVoltage;
  return I * I * lineResistance;
}

/**
 * How much the resistive line loss scales when the transmission voltage
 * is multiplied by `f`:
 *
 *   P_loss(f·V) / P_loss(V) = 1 / f²
 *
 * This function returns the multiplicative *scale factor* applied to the
 * loss — so scaling voltage by 2× gives 0.25, by 10× gives 0.01, and by
 * 1/2× gives 4. Equivalent to the reciprocal of f².
 *
 * Units: dimensionless in, dimensionless out.
 */
export function lineLossScaleFactor(f: number): number {
  if (f === 0) {
    throw new Error("lineLossScaleFactor: voltage scale factor must be nonzero");
  }
  return 1 / (f * f);
}

/**
 * Convenience wrapper: apparent primary-side impedance seen when a load
 * impedance `Z_load` is connected to the secondary of an ideal transformer
 * with turns ratio n = N_s / N_p:
 *
 *   Z_reflected = Z_load / n²
 *
 * A 10:1 step-down (n = 0.1) makes an 8 Ω loudspeaker look like 800 Ω to
 * the primary — the basis of impedance-matching output transformers in
 * tube amplifiers.
 *
 * Units: `Zload` in ohms; returns ohms.
 */
export function reflectedImpedance(
  turnsRatio: number,
  Zload: number,
): number {
  if (turnsRatio === 0) {
    throw new Error("reflectedImpedance: turns ratio must be nonzero");
  }
  if (Zload < 0) {
    throw new Error(
      `reflectedImpedance: Zload must be non-negative (got ${Zload}).`,
    );
  }
  return Zload / (turnsRatio * turnsRatio);
}
