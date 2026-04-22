import { EPSILON_0 } from "@/lib/physics/constants";

/**
 * Piezoelectricity and ferroelectricity — material responses with memory.
 *
 *   - The direct piezo effect:   stress → polarisation (charge per area).
 *   - The inverse piezo effect:  voltage → strain.
 *   - Ferroelectric hysteresis:  P depends not only on E but on history.
 *
 * The d_33 coefficient is the diagonal element of the piezoelectric tensor
 * along the polar axis. For α-quartz d_33 ≈ 2.3 × 10⁻¹² C/N (or m/V — same
 * units, because that's what the off-diagonal symmetry of the constitutive
 * relations enforces). Sign convention: a positive d_33 means a compressive
 * stress along the polar axis (σ < 0 by the engineering convention) produces
 * polarisation pointing in the +ẑ direction. We'll keep things simple: pass
 * stress as a signed scalar (positive = tension, negative = compression),
 * and the returned polarisation/charge density carries the same sign as
 * d_33 · σ.
 */

/** d_33 for α-quartz in C/N. */
export const D33_QUARTZ = 2.3e-12;

/** d_33 for PZT (lead zirconate titanate) — common in transducers. C/N. */
export const D33_PZT = 374e-12;

/** d_33 for barium titanate, the canonical ferroelectric. C/N. */
export const D33_BATIO3 = 191e-12;

/**
 * The direct piezoelectric effect: a mechanical stress applied along the
 * polar axis of a piezo crystal produces a surface charge density (which,
 * because D = P + ε₀E and there's no applied field, is also the polarisation).
 *
 *   Q / A = D = d₃₃ · σ
 *
 * Units: stress σ in Pa = N/m². d₃₃ in C/N. Q/A in C/m².
 *
 * @param stress Signed stress along the polar axis (Pa). Positive = tension,
 *   negative = compression.
 * @param d33 Piezoelectric coefficient (C/N).
 * @returns Surface charge density on the polar faces (C/m²).
 */
export function directPiezoEffect(stress: number, d33: number): number {
  return d33 * stress;
}

/**
 * The inverse piezoelectric effect: applying a voltage across a piezo
 * crystal produces a strain along the same axis.
 *
 *   strain = δL / L = d₃₃ · E = d₃₃ · (V / L)
 *
 * The constitutive coefficient is the same d₃₃ as in the direct effect — a
 * thermodynamic identity (Maxwell relation) forces them equal.
 *
 * @param voltage Voltage applied across the crystal thickness (V).
 * @param d33 Piezoelectric coefficient (C/N, equivalent to m/V).
 * @param thickness Crystal thickness along the polar axis (m). Must be > 0.
 * @returns Dimensionless strain δL / L.
 */
export function inversePiezoEffect(
  voltage: number,
  d33: number,
  thickness: number,
): number {
  if (thickness <= 0) {
    throw new Error("inversePiezoEffect: thickness must be positive");
  }
  const E = voltage / thickness;
  return d33 * E;
}

/**
 * Full constitutive relation for a 1-D piezo, capturing both effects at once:
 *
 *   D = d₃₃ · σ  +  ε · E
 *
 * (with ε the dielectric permittivity at constant stress). This is EQ.01 of
 * the topic prose. Defaults to ε = ε₀.
 */
export function electricDisplacementInPiezo(
  stress: number,
  electricField: number,
  d33: number,
  epsilon: number = EPSILON_0,
): number {
  return d33 * stress + epsilon * electricField;
}

// ---------------------------------------------------------------------------
// Ferroelectric hysteresis
// ---------------------------------------------------------------------------

export interface HysteresisParams {
  /** Saturation field magnitude — beyond this, P is essentially flat. V/m. */
  Esat: number;
  /** Saturation polarisation magnitude. C/m². */
  Psat: number;
  /** Coercive field magnitude — where each branch crosses zero P. V/m. */
  Ecoercive: number;
}

export interface HysteresisState {
  /** The previous applied field (V/m). Determines branch direction. */
  previousE: number;
  /** The previous polarisation (C/m²). */
  previousP: number;
}

/**
 * Smooth tanh-based ferroelectric hysteresis model.
 *
 * The trick: the P–E loop is the union of two saturating curves, an "up"
 * branch (the material was last walked from −Esat toward +Esat) and a
 * "down" branch (the reverse). Each branch is a shifted tanh that
 *
 *   - saturates at ±Psat for |E| ≫ Esat,
 *   - crosses zero polarisation at E = ∓Ecoercive (coercive field),
 *   - has its remanent polarisation P_r at E = 0:
 *
 *       P_r = Psat · tanh(Ecoercive / k)
 *
 *     where k = Esat / atanh(0.99) is chosen so the tanh saturates to
 *     ~99% of Psat at |E| = Esat.
 *
 * Branch selection comes from the input history: if the field is going up
 * (E ≥ previousE), use the up branch; otherwise the down branch. Once the
 * trajectory crosses to the opposite branch's curve, we follow that. This
 * makes the major loop close to numerical precision after one full sweep
 * −Esat → +Esat → −Esat.
 *
 * Note: this is a textbook major-loop model; minor loops (interior reversals)
 * will not be perfectly self-consistent, which is fine for the demo.
 */
export function ferroelectricHysteresis(
  E: number,
  state: HysteresisState,
  params: HysteresisParams,
): number {
  const { Esat, Psat, Ecoercive } = params;
  if (Esat <= 0 || Psat <= 0 || Ecoercive < 0) {
    throw new Error("ferroelectricHysteresis: invalid params");
  }

  // Choose curve sharpness so tanh hits ~99% of Psat by |E| = Esat.
  const k = Esat / Math.atanh(0.99);

  // The UP branch is traced while E is increasing (walking from −Esat toward
  // +Esat). The material starts at −Psat; it stays negative until E pushes
  // past +Ecoercive, then climbs to +Psat. Zero crossing at E = +Ecoercive.
  const Pup = (e: number) => Psat * Math.tanh((e - Ecoercive) / k);
  // The DOWN branch is traced while E is decreasing (from +Esat toward
  // −Esat). Material starts at +Psat, stays positive until E < −Ecoercive,
  // then drops to −Psat. Zero crossing at E = −Ecoercive.
  const Pdown = (e: number) => Psat * Math.tanh((e + Ecoercive) / k);

  const goingUp = E >= state.previousE;
  return goingUp ? Pup(E) : Pdown(E);
}

/** Remanent polarisation P_r — the value of P at E = 0 on either branch. */
export function remanentPolarisation(params: HysteresisParams): number {
  const { Esat, Psat, Ecoercive } = params;
  const k = Esat / Math.atanh(0.99);
  return Psat * Math.tanh(Ecoercive / k);
}

/**
 * Drive a ferroelectric through a complete triangular E sweep
 *
 *     0 → +Esat → −Esat → +Esat → 0
 *
 * collecting (E, P) pairs along the way. Useful for plotting and for the
 * loop-closure test (the final P at E = 0 should match the starting P).
 */
export function sweepHysteresisLoop(
  params: HysteresisParams,
  steps = 256,
): Array<{ E: number; P: number }> {
  const { Esat, Psat, Ecoercive } = params;
  const k = Esat / Math.atanh(0.99);
  const trace: Array<{ E: number; P: number }> = [];

  // Anchor: at E = +Esat the material has just been driven up the UP branch,
  // so P = Psat·tanh((Esat − Ecoercive)/k). Use that as the initial point
  // and as the "previous" state so the first step (downward) follows the
  // DOWN branch from +Esat.
  const Pstart = Psat * Math.tanh((Esat - Ecoercive) / k);
  let previousE = Esat;
  let previousP = Pstart;
  trace.push({ E: previousE, P: previousP });

  const segments: Array<[number, number]> = [
    [Esat, -Esat],
    [-Esat, Esat],
  ];

  for (const [from, to] of segments) {
    for (let i = 1; i <= steps; i++) {
      const E = from + ((to - from) * i) / steps;
      const P = ferroelectricHysteresis(
        E,
        { previousE, previousP },
        params,
      );
      trace.push({ E, P });
      previousE = E;
      previousP = P;
    }
  }
  return trace;
}
