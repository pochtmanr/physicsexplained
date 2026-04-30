/**
 * §06.1 INERTIAL vs GRAVITATIONAL MASS — pure-TS helpers.
 *
 * Two definitions, one number.
 *   • Inertial mass m_i appears in F = m_i a (resistance to acceleration).
 *   • Gravitational mass m_g appears in F = m_g g (coupling to gravity).
 *   • The Eötvös parameter η = (m_g − m_i)/m_i quantifies their (non-)equality.
 *
 * From Galileo's 1589 Pisa observation (η ≲ 10⁻³ inferred) to the MICROSCOPE
 * 2017 satellite (η ≲ 1.4 × 10⁻¹⁵), the experimental bound on |η| has tightened
 * by 14 orders of magnitude in 400 years — and remains exactly zero within
 * every measurement ever made. Einstein's equivalence principle declares this
 * is not a coincidence to be explained but the geometric content of gravity.
 *
 * Conventions:
 *   • m_grav, m_inertial in kg (or any consistent unit; η is dimensionless).
 *   • bound entries are upper limits on |η| (dimensionless).
 */

/**
 * Eötvös parameter η = (m_g − m_i) / m_i.
 *
 * Zero iff the weak equivalence principle holds exactly. A non-zero η would
 * mean different materials fall at slightly different rates in the same
 * gravitational field — Galileo's Pisa observation, made quantitative.
 *
 * @example
 *   eotvosParameter(1.0, 1.0) === 0
 *   eotvosParameter(1.001, 1.0) === 0.001  // 0.1% violation
 *
 * @throws RangeError if m_inertial ≤ 0 (no observable definition of η).
 */
export function eotvosParameter(m_grav: number, m_inertial: number): number {
  if (m_inertial <= 0) {
    throw new RangeError(
      `m_inertial must be positive (got ${m_inertial})`,
    );
  }
  return (m_grav - m_inertial) / m_inertial;
}

/**
 * Differential acceleration between two test masses A and B in a uniform
 * gravitational field, expressed in units of g.
 *
 *   Δa / g = η_A − η_B
 *
 * If WEP holds (η_A = η_B = 0), Δa/g = 0 exactly. The Eötvös torsion balance
 * and the MICROSCOPE satellite both measure this quantity directly: a torque
 * (Eötvös) or a residual capacitance offset (MICROSCOPE) proportional to the
 * differential acceleration of two test masses of different composition.
 */
export function differentialAcceleration(
  eta_A: number,
  eta_B: number,
): number {
  return eta_A - eta_B;
}

/** A single historical experimental bound on |η|. */
export interface WEPBoundEntry {
  /** Year of the result. */
  readonly year: number;
  /** Experiment label (PI / institution). */
  readonly experiment: string;
  /** Upper bound on |η|, dimensionless. */
  readonly bound: number;
}

/**
 * Historical bounds on the Eötvös parameter |η|, ordered chronologically.
 *
 * Each entry is the published 1-σ upper limit on the fractional deviation
 * of m_g from m_i, as measured by the named experiment. The progression is
 * a 14-order-of-magnitude tightening over four centuries — one of the
 * longest sustained experimental campaigns in physics.
 *
 * Sources:
 *   • Galileo (1589, inferred): Pisa tower drop, dropped balls of different
 *     composition. No published bound; 10⁻³ is the bound implied by the
 *     resolution of his timing.
 *   • Bessel (1832): pendulum-period comparison across different bobs,
 *     |η| ≲ 2 × 10⁻⁵.
 *   • Eötvös (1889): torsion balance, |η| ≲ 10⁻⁸.
 *   • Eötvös, Pekár, Fekete (1922): refined torsion balance, |η| ≲ 3 × 10⁻⁹.
 *   • Roll, Krotkov, Dicke (1964): Princeton torsion balance with the Sun
 *     as the source mass, |η| ≲ 10⁻¹¹.
 *   • Adelberger (Eöt-Wash group, 1999): rotating torsion balance with
 *     Earth as the source, |η| ≲ 10⁻¹³.
 *   • MICROSCOPE (CNES, 2017+): two cylinders of platinum and titanium in
 *     low Earth orbit, |η| ≲ 1.4 × 10⁻¹⁵ (final 2022 result).
 */
export function wepBoundTimeline(): readonly WEPBoundEntry[] {
  return [
    { year: 1589, experiment: "Galileo (Pisa, inferred)", bound: 1e-3 },
    { year: 1832, experiment: "Bessel pendulum", bound: 2e-5 },
    { year: 1889, experiment: "Eötvös", bound: 1e-8 },
    { year: 1922, experiment: "Eötvös-Pekár-Fekete", bound: 3e-9 },
    { year: 1964, experiment: "Roll-Krotkov-Dicke", bound: 1e-11 },
    { year: 1999, experiment: "Adelberger (Eöt-Wash)", bound: 1e-13 },
    { year: 2017, experiment: "MICROSCOPE (CNES)", bound: 1.4e-15 },
  ] as const;
}
