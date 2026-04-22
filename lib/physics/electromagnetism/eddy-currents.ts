/**
 * Eddy currents — the induced loop currents that appear inside bulk conductors
 * when the magnetic flux through them changes.
 *
 * The formulas here are phenomenological / thin-sheet approximations. They
 * capture the scaling behaviour (which is what the demos care about) rather
 * than the exact boundary-value solution of Maxwell's equations in a
 * specific geometry.
 */

/**
 * Terminal velocity of a bar magnet falling through a vertical conducting tube.
 *
 *   v_term  =  m · g  /  (k · σ · B_eff²)
 *
 * Where:
 *   - m      : magnet mass (kg)
 *   - g      : gravitational acceleration (m/s²)
 *   - σ      : electrical conductivity of the tube wall (S/m)
 *   - B_eff  : characteristic field strength at the tube wall (T)
 *   - k      : geometry factor (m³). Lumps tube radius, wall thickness,
 *              and magnet shape into a single dimensionful constant.
 *
 * Derivation sketch: the induced EMF around each horizontal ring of the tube
 * scales as  v · B_eff · (2π r), the ring resistance scales as 1/(σ · t · r),
 * so the dissipated power scales as v² · B_eff² · σ · t · r². Equating that
 * to the gravitational power  m·g·v  gives  v_term ∝ m g / (σ B² · geom).
 *
 * The falling-magnet-in-copper-tube demo is the canonical visual for this
 * law: a strong magnet takes seconds to slide through a short copper pipe.
 */
export function tubeTerminalVelocity(
  mass: number,
  g: number,
  sigma: number,
  Beff: number,
  k: number,
): number {
  if (sigma <= 0 || Beff === 0 || k <= 0) {
    throw new Error("sigma, |B_eff|, and k must all be positive");
  }
  return (mass * g) / (k * sigma * Beff * Beff);
}

/**
 * Eddy-current power dissipated per unit volume in a thin conducting sheet
 * carrying a sinusoidal flux  B(t) = B0 sin(ωt):
 *
 *   P / V  =  (π² · B0² · d² · f²) / (6 · ρ)
 *
 * Where:
 *   - B0 : peak field amplitude (T)
 *   - d  : sheet (lamination) thickness (m)
 *   - f  : drive frequency (Hz)
 *   - ρ  : electrical resistivity of the sheet material (Ω·m)
 *
 * The d² scaling is the whole reason transformer cores are laminated out of
 * thin insulated sheets instead of built as a solid block: cut d in half
 * and eddy losses drop by 4×.
 */
export function eddyPowerDensity(
  B0: number,
  d: number,
  f: number,
  rho: number,
): number {
  if (rho <= 0) throw new Error("rho must be positive");
  return (Math.PI * Math.PI * B0 * B0 * d * d * f * f) / (6 * rho);
}

/**
 * Linear drag coefficient for a conducting disk moving (or rotating) through a
 * transverse magnetic field — the eddy-current brake.
 *
 *   c  =  σ · t · B² · A_eff          (drag: F_drag = −c · v)
 *
 * Where:
 *   - σ     : disk conductivity (S/m)
 *   - t     : disk thickness (m)
 *   - B     : applied field (T)
 *   - A_eff : effective area the field threads through (m²)
 *
 * The B² dependence means an electromagnetic brake tuned for regenerative
 * braking gains *four times* more stopping force when its magnet strength
 * doubles — the same law that makes MRI magnets so expensive.
 */
export function brakeDragCoefficient(
  sigma: number,
  thickness: number,
  B: number,
  areaEff: number,
): number {
  if (sigma < 0 || thickness < 0 || areaEff < 0) {
    throw new Error("sigma, thickness, and area must be non-negative");
  }
  return sigma * thickness * B * B * areaEff;
}

/**
 * Time constant of an eddy-current brake slowing a rotor of moment of inertia
 * I with effective moment-arm r_eff:
 *
 *   τ  =  I / (c · r_eff²)
 *
 * The angular velocity decays as  ω(t) = ω₀ · exp(−t/τ) — exponential spin-
 * down, the qualitative signature of a linear drag.
 */
export function brakeTimeConstant(
  inertia: number,
  dragCoefficient: number,
  rEff: number,
): number {
  if (dragCoefficient <= 0 || rEff <= 0) {
    throw new Error("dragCoefficient and rEff must be positive");
  }
  return inertia / (dragCoefficient * rEff * rEff);
}
