/**
 * Viscous flow — Newton's shear law, Poiseuille pipe flow, and the
 * Reynolds number.
 *
 * All helpers use SI units: viscosity in Pa·s, density in kg/m^3, length and
 * radius in metres, velocity in m/s, pressure in Pa, volumetric flow rate in
 * m^3/s, shear stress in Pa.
 *
 * Reference values (dynamic viscosity at roughly 20 °C):
 *   - air    ≈ 1.8e-5 Pa·s
 *   - water  ≈ 1.0e-3 Pa·s
 *   - blood  ≈ 3.5e-3 Pa·s (shear-thinning, this is a nominal value)
 *   - olive oil ≈ 0.08 Pa·s
 *   - honey  ≈ 10    Pa·s
 *   - pitch  ≈ 2e8   Pa·s (the famous pitch-drop experiment)
 */

/** Dynamic viscosity of water at 20 °C, in Pa·s. */
export const ETA_WATER = 1.0e-3;

/** Dynamic viscosity of air at 20 °C, in Pa·s. */
export const ETA_AIR = 1.8e-5;

/** Dynamic viscosity of honey at 20 °C, in Pa·s (order of magnitude). */
export const ETA_HONEY = 10;

/**
 * Newton's shear-stress law for a Newtonian fluid:
 *   tau = eta · du/dy
 *
 * The shear stress between neighbouring layers of fluid equals the dynamic
 * viscosity times the velocity gradient across them. This is the defining
 * equation of "Newtonian" — fluids for which eta is a constant (water, air,
 * oil, honey, blood above a shear threshold). Ketchup, cornstarch slurry and
 * many polymer melts are not Newtonian; their effective eta depends on shear
 * rate, history, or both.
 */
export function shearStress(viscosity: number, velocityGradient: number): number {
  return viscosity * velocityGradient;
}

/**
 * Reynolds number for a body of characteristic length L moving at speed v
 * through a fluid of density rho and dynamic viscosity eta:
 *
 *   Re = rho · v · L / eta
 *
 * Dimensionless. Interpreted as the ratio of inertial to viscous forces.
 * Re ≪ 1 is the viscous world — creeping flow, Stokes drag, swimming bacteria.
 * Re ≫ 1 is the inertial world — vortex streets, turbulence, aircraft wakes.
 * For pipe flow the transition from laminar to turbulent sits near Re ≈ 2300.
 */
export function reynoldsNumber(
  density: number,
  velocity: number,
  length: number,
  viscosity: number,
): number {
  if (viscosity <= 0) {
    throw new Error("viscosity must be positive");
  }
  if (length < 0) {
    throw new Error("length must be non-negative");
  }
  if (density < 0) {
    throw new Error("density must be non-negative");
  }
  return (density * velocity * length) / viscosity;
}

/**
 * Qualitative flow regime labels keyed to Reynolds-number bands. The
 * thresholds below are the textbook defaults for flow through a straight
 * circular pipe; external flows (over a sphere, around an airfoil) use
 * different but similarly ordered numbers.
 */
export type FlowRegime =
  | "creeping"
  | "laminar"
  | "transitional"
  | "turbulent";

export function classifyPipeFlow(Re: number): FlowRegime {
  if (Re < 1) return "creeping";
  if (Re < 2300) return "laminar";
  if (Re < 4000) return "transitional";
  return "turbulent";
}

/**
 * Poiseuille velocity profile. Steady, laminar flow of a Newtonian fluid
 * through a straight circular pipe of radius R driven by a pressure gradient
 * dp/dx gives a parabolic profile:
 *
 *   u(r) = (dp/dx) / (4·eta) · (R^2 − r^2)
 *
 * By convention we pass the magnitude of the pressure drop per unit length
 * as a positive number (dpdx > 0 means pressure falls in the direction of
 * flow). Maximum velocity sits on the axis (r = 0); zero velocity at the
 * wall (r = R) — the no-slip condition.
 */
export function poiseuilleVelocity(
  r: number,
  radius: number,
  dpdx: number,
  viscosity: number,
): number {
  if (viscosity <= 0) {
    throw new Error("viscosity must be positive");
  }
  if (radius <= 0) {
    throw new Error("radius must be positive");
  }
  const rr = Math.min(Math.abs(r), radius);
  return (dpdx / (4 * viscosity)) * (radius * radius - rr * rr);
}

/**
 * Peak (centreline) velocity of a Poiseuille profile. Twice the mean
 * velocity, which is a tidy experimental signature of laminar pipe flow.
 */
export function poiseuilleCentrelineVelocity(
  radius: number,
  dpdx: number,
  viscosity: number,
): number {
  return poiseuilleVelocity(0, radius, dpdx, viscosity);
}

/**
 * Volumetric flow rate Q through a circular pipe of radius R driven by a
 * pressure drop dp across a length L (so dpdx = dp/L):
 *
 *   Q = pi · R^4 · dp / (8 · eta · L)
 *
 * The fourth-power dependence on radius is the punchline of Poiseuille's
 * 1840 thesis work on blood flow: halving a capillary's radius cuts its
 * throughput sixteen-fold. It is why vasoconstriction works, why plaque is
 * dangerous, and why resistance in a branched circulatory tree is
 * dominated by its smallest vessels.
 */
export function poiseuilleFlowRate(
  radius: number,
  pressureDrop: number,
  length: number,
  viscosity: number,
): number {
  if (viscosity <= 0) {
    throw new Error("viscosity must be positive");
  }
  if (length <= 0) {
    throw new Error("length must be positive");
  }
  if (radius < 0) {
    throw new Error("radius must be non-negative");
  }
  return (Math.PI * radius ** 4 * pressureDrop) / (8 * viscosity * length);
}

/**
 * Mean (area-averaged) velocity through a Poiseuille pipe:
 *
 *   <u> = Q / (pi · R^2) = R^2 · dpdx / (8 · eta) = u_max / 2.
 */
export function poiseuilleMeanVelocity(
  radius: number,
  dpdx: number,
  viscosity: number,
): number {
  if (viscosity <= 0) {
    throw new Error("viscosity must be positive");
  }
  if (radius < 0) {
    throw new Error("radius must be non-negative");
  }
  return (radius * radius * dpdx) / (8 * viscosity);
}

/**
 * Kinematic viscosity nu = eta / rho. Units: m^2/s. Shows up whenever the
 * governing equation has been rescaled — Navier-Stokes, the boundary-layer
 * equations, Stokes' second problem. Water: ~1e-6 m^2/s. Air: ~1.5e-5 m^2/s.
 * Note that air, despite having a much smaller dynamic viscosity than water,
 * has a larger kinematic viscosity because its density is so much lower.
 */
export function kinematicViscosity(
  dynamicViscosity: number,
  density: number,
): number {
  if (density <= 0) {
    throw new Error("density must be positive");
  }
  return dynamicViscosity / density;
}
