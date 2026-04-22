/**
 * Ferromagnetism — the cooperative regime.
 *
 * Iron's atoms don't just bias toward an applied field the way a paramagnet's
 * do; they lock onto each other. Inside a single magnetic domain every atomic
 * moment already points the same way. Bulk magnetisation emerges from how
 * those domains rearrange as the external field is cycled — and because
 * rearrangement is hindered by pinning sites, the macroscopic response
 * carries a history. That history is the hysteresis loop.
 *
 * We ship a single-scalar soft-hysteresis model (no tensors, no angle-
 * dependent anisotropy) modelled on the Session 2 ferroelectric precedent.
 * The loop is traced by two saturating tanh branches — "ascending" and
 * "descending" — that intersect the saturation tips and give a physically
 * reasonable remanence ratio (Mr / Msat ≈ 0.38 for the soft-iron default,
 * not the idealised square loop you see in textbook cartoons).
 *
 * Above the Curie temperature the cooperation fails and ferromagnetism
 * dissolves into paramagnetism governed by the Curie-Weiss law,
 *
 *   χ(T) = C / (T − T_c),
 *
 * which diverges as T approaches T_c from above. Below T_c the order
 * parameter — the spontaneous magnetisation — grows like √(1 − T/T_c),
 * the canonical mean-field exponent of Landau theory.
 */

/** Parameters for the soft-loop hysteresis model. */
export interface HysteresisParams {
  /** Saturation magnetisation magnitude (A/m). */
  Msat: number;
  /** Coercive field magnitude (A/m). Positive. */
  Hc: number;
  /**
   * Remanence ratio Mr / Msat in (0, 1). The Session 2 soft-loop precedent
   * used 0.38 for realistic soft-iron shapes; hard magnets go higher.
   */
  remanence: number;
}

/**
 * Soft-iron hysteresis. Given the current applied field H and the previous
 * (H, M) point on the trajectory, return the new magnetisation.
 *
 * Each branch is a shifted tanh that saturates at ±Msat and crosses M = 0
 * at H = ±Hc (coercive field). The "ascending" branch (field increasing)
 * sits to the left of zero, the "descending" branch sits to the right, so
 * at H = 0 the material lands at ±Mr = ±remanence·Msat depending on which
 * branch it is on. The branch is selected from the sign of (H − H_prev):
 * field going up → ascending; field going down → descending.
 *
 * Sharpness k is chosen so tanh saturates to ~99% of Msat by the time |H|
 * reaches a few Hc — the standard atanh(0.99) trick.
 */
export function ferromagneticM(
  H: number,
  prev: { H: number; M: number },
  params: HysteresisParams,
): number {
  const { Msat, Hc, remanence } = params;
  if (Msat <= 0) throw new Error("ferromagneticM: Msat must be positive");
  if (Hc <= 0) throw new Error("ferromagneticM: Hc must be positive");
  if (remanence <= 0 || remanence >= 1) {
    throw new Error("ferromagneticM: remanence must be in (0, 1)");
  }
  // Choose k so that M crosses zero at H = ∓Hc on the appropriate branch.
  // Ascending branch (going up): M_up(H) = Msat · tanh(k·(H + Hc_shift))
  // where Hc_shift makes the zero crossing occur at H = −Hc.
  // Equivalently, shift the tanh so it passes through (H = 0, M = Mr).
  // We parametrise via the "steepness past Hc": atanh(remanence) / Hc.
  const k = Math.atanh(remanence) / Hc;
  // Ascending branch (H increasing): starts at −Msat for H = −∞, crosses 0
  // at H = +Hc. At H = 0 the material still reads −Mr.
  const Mup = (h: number) => Msat * Math.tanh(k * (h - Hc));
  // Descending branch (H decreasing): starts at +Msat for H = +∞, crosses 0
  // at H = −Hc. At H = 0 the material still reads +Mr.
  const Mdown = (h: number) => Msat * Math.tanh(k * (h + Hc));

  const goingUp = H >= prev.H;
  const branch = goingUp ? Mup(H) : Mdown(H);
  // Clamp to ±Msat in case of numerical drift.
  return Math.max(-Msat, Math.min(Msat, branch));
}

/** Remanent magnetisation (value of M at H = 0 on either branch). */
export function remanentMagnetisation(params: HysteresisParams): number {
  return params.remanence * params.Msat;
}

/**
 * Walk the hysteresis loop through a full triangular sweep
 *
 *   0 → +Hmax → −Hmax → +Hmax
 *
 * and return the (H, M) trace. Useful for plotting and for the loop-closure
 * regression test.
 */
export function sweepHysteresisLoop(
  params: HysteresisParams,
  Hmax: number,
  steps = 256,
): Array<{ H: number; M: number }> {
  if (Hmax <= params.Hc) {
    throw new Error("sweepHysteresisLoop: Hmax must exceed Hc");
  }
  const trace: Array<{ H: number; M: number }> = [];
  // Anchor at H = +Hmax on the ascending branch (just saturated).
  // Ascending branch: M = Msat · tanh(k·(H − Hc)) → ≈ +Msat for H ≫ Hc.
  const Mstart = params.Msat * Math.tanh(
    (Math.atanh(params.remanence) / params.Hc) * (Hmax - params.Hc),
  );
  let previousH = Hmax;
  let previousM = Mstart;
  trace.push({ H: previousH, M: previousM });

  const segments: Array<[number, number]> = [
    [Hmax, -Hmax], // descending
    [-Hmax, Hmax], // ascending
  ];

  for (const [from, to] of segments) {
    for (let i = 1; i <= steps; i++) {
      const H = from + ((to - from) * i) / steps;
      const M = ferromagneticM(H, { H: previousH, M: previousM }, params);
      trace.push({ H, M });
      previousH = H;
      previousM = M;
    }
  }
  return trace;
}

/**
 * Curie-Weiss susceptibility of a ferromagnet in the paramagnetic regime
 * above the Curie temperature.
 *
 *   χ(T) = C / (T − T_c)
 *
 * where C is the material-specific Curie constant (with units of Kelvin in
 * the mks convention we use here — see `magnetic-materials.ts` for the
 * para version). Diverges as T → T_c+, which is the signature of the
 * underlying second-order phase transition.
 */
export function curieWeiss(curieConstant: number, T: number, Tc: number): number {
  if (T <= Tc) {
    throw new Error("curieWeiss: defined only for T > T_c");
  }
  return curieConstant / (T - Tc);
}

/**
 * Mean-field spontaneous magnetisation below the Curie temperature.
 *
 *   M(T) / Msat ≈ √(1 − T / T_c)   for T < T_c,
 *   M(T)       = 0                  for T ≥ T_c.
 *
 * The square-root shape is the Landau mean-field critical exponent β = 1/2.
 * Real ferromagnets deviate (β ≈ 0.36 for 3-D Ising), but √ is the textbook
 * shape and reads cleanly on a plot.
 */
export function spontaneousMagnetisation(
  T: number,
  Tc: number,
  Msat: number,
): number {
  if (Tc <= 0) throw new Error("spontaneousMagnetisation: Tc must be positive");
  if (T >= Tc) return 0;
  if (T < 0) throw new Error("spontaneousMagnetisation: T must be ≥ 0");
  return Msat * Math.sqrt(1 - T / Tc);
}

/**
 * Hysteresis loss per cycle per unit volume, estimated from the area
 * enclosed by a sampled loop. Uses the shoelace formula on the (H, M) trace.
 * Returns a non-negative number (absolute value).
 *
 * Units: (A/m) · (A/m) = (A/m)² — multiply by μ₀ externally to convert to
 * J/m³ if you want. The scene uses the raw area as a visual density.
 */
export function hysteresisLoopArea(
  trace: Array<{ H: number; M: number }>,
): number {
  if (trace.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < trace.length; i++) {
    const a = trace[i]!;
    const b = trace[(i + 1) % trace.length]!;
    sum += a.H * b.M - b.H * a.M;
  }
  return Math.abs(sum) / 2;
}
