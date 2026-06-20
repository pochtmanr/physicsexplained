/**
 * FIG.04 PHASE CHANGES AND LATENT HEAT — pure-TS helpers.
 *
 * Joseph Black watched ice melt for half an hour while his thermometer held at
 * 0 °C: the heat going in was *latent*, hidden in the rearrangement of bonds
 * rather than spent on temperature. This module captures two pictures.
 *
 * 1. The heating curve. Pour heat steadily into a block of H₂O starting as ice
 *    below freezing and its temperature traces five regions — ice warming,
 *    the ice→water plateau (latent heat of fusion), water warming, the
 *    water→steam plateau (latent heat of vaporisation), steam warming. The two
 *    plateaus are flat: temperature stands still while Q keeps climbing. For
 *    water the fusion plateau costs 334 kJ/kg and the vaporisation plateau a
 *    huge 2260 kJ/kg — the reason sweat cools and steam scalds.
 *
 * 2. A minimal P–T phase diagram. Solid, liquid, and vapour regions meet at
 *    the triple point; the liquid–vapour boundary ends at the critical point.
 *    The boundaries follow a Clausius–Clapeyron form ln P = a − b/T fitted to
 *    the triple and critical points. Water's solid–liquid line slopes the
 *    "wrong" way (negative dP/dT — pressure lowers the melting point, which is
 *    why ice skates); CO₂'s slopes the normal positive way.
 *
 * This is deliberately small and self-contained — session 7 (Clausius–
 * Clapeyron, FIG.24) extends the boundary model. React-free, typed. SI units:
 * J, kg, K, Pa. Temperatures in the heating curve are in °C for readability.
 */

// ── Water thermal properties (heating curve) ────────────────────────────────

/** Specific heat of ice, J/(kg·K). */
export const C_ICE = 2090;
/** Specific heat of liquid water, J/(kg·K). */
export const C_WATER = 4186;
/** Specific heat of steam, J/(kg·K). */
export const C_STEAM = 2010;
/** Latent heat of fusion of water, J/kg. */
export const L_FUSION = 334_000;
/** Latent heat of vaporisation of water, J/kg. */
export const L_VAPORISATION = 2_260_000;
/** Melting point of water at 1 atm, °C. */
export const MELT_C = 0;
/** Boiling point of water at 1 atm, °C. */
export const BOIL_C = 100;

/** Whether a heating-curve segment changes temperature or phase. */
export type SegmentKind = "sensible" | "latent";

/** One leg of the heating curve, in cumulative-heat coordinates. */
export interface HeatingSegment {
  /** Human label, e.g. "ice warming" or "melting". */
  name: string;
  kind: SegmentKind;
  /** Cumulative heat at the segment's start / end, J. */
  qStart: number;
  qEnd: number;
  /** Temperature at the segment's start / end, °C (equal across a plateau). */
  tStart: number;
  tEnd: number;
}

/**
 * Build the five-region H₂O heating curve for a given mass, from a starting
 * temperature below freezing up through superheated steam.
 *
 * @param massKg mass of water substance, kg (> 0)
 * @param startC starting temperature, °C (default −20; must be < 0 for the full
 *   five-region curve, but any value < BOIL_C is accepted)
 * @param endC final steam temperature, °C (default 120; must be > 100)
 * @returns ordered segments with cumulative-heat breakpoints
 * @throws RangeError for non-positive mass or an out-of-order range
 */
export function heatingCurve(
  massKg: number,
  startC = -20,
  endC = 120,
): HeatingSegment[] {
  if (massKg <= 0) throw new RangeError("mass must be positive");
  if (startC >= MELT_C || endC <= BOIL_C) {
    throw new RangeError("need startC < 0 °C and endC > 100 °C");
  }

  const segs: HeatingSegment[] = [];
  let q = 0;
  const push = (
    name: string,
    kind: SegmentKind,
    dq: number,
    tStart: number,
    tEnd: number,
  ) => {
    segs.push({ name, kind, qStart: q, qEnd: q + dq, tStart, tEnd });
    q += dq;
  };

  // 1. ice warming startC → 0 °C
  push("ice warming", "sensible", massKg * C_ICE * (MELT_C - startC), startC, MELT_C);
  // 2. melting plateau at 0 °C
  push("melting", "latent", massKg * L_FUSION, MELT_C, MELT_C);
  // 3. water warming 0 → 100 °C
  push("water warming", "sensible", massKg * C_WATER * (BOIL_C - MELT_C), MELT_C, BOIL_C);
  // 4. vaporisation plateau at 100 °C
  push("boiling", "latent", massKg * L_VAPORISATION, BOIL_C, BOIL_C);
  // 5. steam warming 100 → endC
  push("steam warming", "sensible", massKg * C_STEAM * (endC - BOIL_C), BOIL_C, endC);

  return segs;
}

/** Total heat to traverse the whole curve, J. */
export function totalHeat(segments: readonly HeatingSegment[]): number {
  return segments.length === 0 ? 0 : segments[segments.length - 1].qEnd;
}

/**
 * Temperature at a given cumulative heat Q along a heating curve. Linear within
 * each sensible segment; flat across each latent plateau. Q is clamped to the
 * curve's range.
 *
 * @param segments curve from {@link heatingCurve}
 * @param q cumulative heat, J
 * @returns temperature, °C
 */
export function temperatureAtHeat(
  segments: readonly HeatingSegment[],
  q: number,
): number {
  if (segments.length === 0) throw new Error("empty heating curve");
  const qMax = totalHeat(segments);
  const qq = Math.max(0, Math.min(q, qMax));
  for (const s of segments) {
    if (qq <= s.qEnd) {
      if (s.kind === "latent" || s.qEnd === s.qStart) return s.tStart;
      const frac = (qq - s.qStart) / (s.qEnd - s.qStart);
      return s.tStart + frac * (s.tEnd - s.tStart);
    }
  }
  return segments[segments.length - 1].tEnd;
}

// ── Latent-heat bookkeeping ─────────────────────────────────────────────────

/** Heat to melt a mass at its melting point (no temperature change), J. */
export function energyToMelt(massKg: number, latentFusion = L_FUSION): number {
  if (massKg < 0) throw new RangeError("mass must be ≥ 0");
  return massKg * latentFusion;
}

/** Heat to vaporise a mass at its boiling point, J. */
export function energyToVaporise(
  massKg: number,
  latentVaporisation = L_VAPORISATION,
): number {
  if (massKg < 0) throw new RangeError("mass must be ≥ 0");
  return massKg * latentVaporisation;
}

// ── Minimal P–T phase diagram ───────────────────────────────────────────────

/** A point on the P–T plane. */
export interface PTPoint {
  /** Temperature, K. */
  tempK: number;
  /** Pressure, Pa. */
  pressurePa: number;
}

/** The three condensed/vapour phases (supercritical reported separately). */
export type Phase = "solid" | "liquid" | "vapor" | "supercritical";

/** A substance's phase-diagram landmarks and the sign of its melting line. */
export interface PhaseDiagramModel {
  name: string;
  triplePoint: PTPoint;
  criticalPoint: PTPoint;
  /** Sign of the solid–liquid boundary slope dP/dT: −1 for water, +1 normal. */
  fusionSlopeSign: 1 | -1;
}

/** Water: anomalous negative-slope melting line (ice is less dense than water). */
export const WATER: PhaseDiagramModel = {
  name: "Water",
  triplePoint: { tempK: 273.16, pressurePa: 611.657 },
  criticalPoint: { tempK: 647.096, pressurePa: 22.064e6 },
  fusionSlopeSign: -1,
};

/** Carbon dioxide: normal positive-slope melting line. */
export const CO2: PhaseDiagramModel = {
  name: "CO₂",
  triplePoint: { tempK: 216.58, pressurePa: 5.185e5 },
  criticalPoint: { tempK: 304.13, pressurePa: 7.375e6 },
  fusionSlopeSign: 1,
};

/** Clausius–Clapeyron fit ln P = a − b/T through two (T, P) anchors. */
function clausiusFit(p0: PTPoint, p1: PTPoint): { a: number; b: number } {
  const b =
    (Math.log(p1.pressurePa) - Math.log(p0.pressurePa)) /
    (1 / p0.tempK - 1 / p1.tempK);
  const a = Math.log(p0.pressurePa) + b / p0.tempK;
  return { a, b };
}

/**
 * Liquid–vapour coexistence pressure at temperature T (triple → critical),
 * from the Clausius–Clapeyron fit through the triple and critical points.
 *
 * @param model substance
 * @param tempK temperature, K
 * @returns saturation vapour pressure, Pa
 */
export function vaporizationPressure(
  model: PhaseDiagramModel,
  tempK: number,
): number {
  const { a, b } = clausiusFit(model.triplePoint, model.criticalPoint);
  return Math.exp(a - b / tempK);
}

/**
 * Solid–vapour coexistence pressure below the triple point. Sublimation is
 * steeper than vaporisation (its latent heat is larger by the latent heat of
 * fusion); we approximate that with a slope scaled up from the vaporisation
 * fit, anchored to pass through the triple point.
 *
 * @param model substance
 * @param tempK temperature, K (below the triple-point temperature)
 * @returns sublimation pressure, Pa
 */
export function sublimationPressure(
  model: PhaseDiagramModel,
  tempK: number,
): number {
  const { b } = clausiusFit(model.triplePoint, model.criticalPoint);
  const bSub = b * 1.25; // sublimation latent ≈ 1.25 × vaporisation
  const Tt = model.triplePoint.tempK;
  // anchored at the triple point: ln P = ln P_t − bSub (1/T − 1/T_t)
  const a = Math.log(model.triplePoint.pressurePa) + bSub / Tt;
  return Math.exp(a - bSub / tempK);
}

/** Stiffness of the (near-vertical) solid–liquid line, Pa per K of shift. */
function fusionStiffness(model: PhaseDiagramModel): number {
  // Spread the melting line across the plotted pressure range so it stays
  // steep but visibly tilted by the slope sign.
  return model.criticalPoint.pressurePa / 8;
}

/**
 * Melting temperature at pressure P — the solid–liquid boundary, near-vertical
 * and tilted by {@link PhaseDiagramModel.fusionSlopeSign}. Passes through the
 * triple point.
 *
 * @param model substance
 * @param pressurePa pressure, Pa
 * @returns melting temperature, K
 */
export function meltingTemperature(
  model: PhaseDiagramModel,
  pressurePa: number,
): number {
  const k = fusionStiffness(model);
  const Tt = model.triplePoint.tempK;
  const Pt = model.triplePoint.pressurePa;
  // P = Pt + sign · k · (T − Tt)  ⟹  T = Tt + sign · (P − Pt) / k
  return Tt + (model.fusionSlopeSign * (pressurePa - Pt)) / k;
}

/**
 * Classify a (T, P) point into solid / liquid / vapor / supercritical for a
 * substance, using the three boundary curves above.
 *
 * @param model substance
 * @param point the temperature/pressure to classify
 * @returns the phase at that point
 */
export function classifyPhase(
  model: PhaseDiagramModel,
  point: PTPoint,
): Phase {
  const { tempK: T, pressurePa: P } = point;
  const Tc = model.criticalPoint.tempK;
  const Pc = model.criticalPoint.pressurePa;
  const Tt = model.triplePoint.tempK;

  if (T >= Tc && P >= Pc) return "supercritical";

  if (T < Tt) {
    // below triple temperature: solid–vapour split by the sublimation curve
    return P >= sublimationPressure(model, T) ? "solid" : "vapor";
  }

  // at or above triple temperature
  if (T < Tc) {
    if (P < vaporizationPressure(model, T)) return "vapor";
    // condensed: solid vs liquid across the melting line
    return T < meltingTemperature(model, P) ? "solid" : "liquid";
  }

  // T ≥ Tc but P < Pc → gas-like
  return "vapor";
}
