/**
 * §59 THE PENROSE-HAWKING SINGULARITY THEOREMS — pure-TS helpers.
 *
 * The engine behind the theorems is the Raychaudhuri equation, which governs
 * how a congruence (a smooth bundle) of geodesics expands or contracts as it
 * is followed forward. For a hypersurface-orthogonal congruence with vanishing
 * vorticity (ω = 0), the expansion scalar θ obeys
 *
 *   dθ/dλ = −(1/n) θ²  −  σ_{ab} σ^{ab}  −  R_{ab} k^a k^b
 *
 * where λ is the affine parameter, n is the number of transverse dimensions
 * (n = 2 for null congruences in 4D, n = 3 for timelike), σ is the shear, and
 * R_{ab} k^a k^b is the "focusing term" sourced by curvature. Every term on the
 * right is ≤ 0 once an energy condition forces R_{ab} k^a k^b ≥ 0. Therefore θ
 * can only decrease, and the θ² term makes the decrease run away: once θ goes
 * negative, θ → −∞ in finite affine parameter. That blow-up is a *caustic* —
 * neighbouring geodesics crossing — and it is the seed of geodesic
 * incompleteness in the theorems.
 *
 * This module is React-free and dependency-free so it can be unit-tested and
 * shared by the canvas scenes. All quantities are in geometrized, dimensionless
 * units (affine parameter λ unitless, θ in inverse-λ).
 */

/** Number of transverse dimensions for a geodesic congruence in 4D spacetime. */
export type CongruenceKind = "null" | "timelike";

/** Transverse dimension count n in the Raychaudhuri θ² coefficient. */
export function transverseDim(kind: CongruenceKind): number {
  return kind === "null" ? 2 : 3;
}

/**
 * The right-hand side of the Raychaudhuri equation for a vorticity-free
 * congruence:  dθ/dλ = −(1/n) θ² − shear² − ricci.
 *
 * `ricci` is R_{ab} k^a k^b (the focusing term); `shear2` is σ_{ab} σ^{ab} ≥ 0.
 * Under any of the standard energy conditions `ricci ≥ 0`, so every term is
 * non-positive and θ is monotonically non-increasing.
 */
export function raychaudhuriRHS(
  theta: number,
  kind: CongruenceKind,
  ricci: number,
  shear2 = 0,
): number {
  const n = transverseDim(kind);
  return -(theta * theta) / n - shear2 - ricci;
}

/** A single sample of the congruence state along the affine parameter. */
export interface ThetaSample {
  /** Affine parameter λ. */
  lambda: number;
  /** Expansion scalar θ(λ). NaN once the caustic (θ → −∞) is passed. */
  theta: number;
  /** True on and after the step where θ diverged (caustic / focal point). */
  focused: boolean;
}

/**
 * Integrate the Raychaudhuri equation forward with explicit RK4, holding the
 * focusing term R_{ab}k^a k^b and shear constant (the constant-curvature tube
 * idealization used by the focusing scene). Integration stops once θ crosses
 * below `divergeAt` (a large negative sentinel standing in for −∞), which marks
 * the focal point.
 *
 * Returns the sampled trajectory including the divergence marker.
 */
export function integrateExpansion(opts: {
  theta0: number;
  kind: CongruenceKind;
  ricci: number;
  shear2?: number;
  lambdaMax: number;
  steps: number;
  divergeAt?: number;
}): ThetaSample[] {
  const {
    theta0,
    kind,
    ricci,
    shear2 = 0,
    lambdaMax,
    steps,
    divergeAt = -1e4,
  } = opts;
  const h = lambdaMax / steps;
  const out: ThetaSample[] = [{ lambda: 0, theta: theta0, focused: false }];
  let theta = theta0;
  for (let i = 1; i <= steps; i++) {
    const k1 = raychaudhuriRHS(theta, kind, ricci, shear2);
    const k2 = raychaudhuriRHS(theta + (h / 2) * k1, kind, ricci, shear2);
    const k3 = raychaudhuriRHS(theta + (h / 2) * k2, kind, ricci, shear2);
    const k4 = raychaudhuriRHS(theta + h * k3, kind, ricci, shear2);
    theta = theta + (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
    const lambda = i * h;
    if (theta <= divergeAt || !Number.isFinite(theta)) {
      out.push({ lambda, theta: divergeAt, focused: true });
      break;
    }
    out.push({ lambda, theta, focused: false });
  }
  return out;
}

/**
 * Focusing theorem (closed-form bound). For a congruence with initial
 * expansion θ₀ < 0 and focusing term R_{ab}k^a k^b ≥ 0 (energy condition) and
 * non-negative shear, a focal point — θ → −∞ — occurs within affine parameter
 *
 *   λ_focal ≤ n / |θ₀|.
 *
 * This is the sharp Raychaudhuri bound when shear and curvature are dropped
 * (they only make focusing happen *sooner*). Returns Infinity when θ₀ ≥ 0,
 * because a non-contracting congruence need never focus.
 */
export function focalParameterBound(theta0: number, kind: CongruenceKind): number {
  if (theta0 >= 0) return Infinity;
  return transverseDim(kind) / Math.abs(theta0);
}

// ─── Trapped-surface / Schwarzschild light-cone helpers ─────────────────────

/**
 * Radial coordinate speed dr/dt of a radial light ray in Schwarzschild
 * coordinates, in units of r_s (so the horizon is at rHat = 1). For the
 * outgoing (+) and ingoing (−) families,
 *
 *   dr/dt = ± c (1 − r_s/r).
 *
 * We return the value in units of c, i.e. ±(1 − 1/rHat). Outside the horizon
 * (rHat > 1) the outgoing ray has dr/dt > 0 (moves outward); at the horizon it
 * is 0 (frozen); inside (rHat < 1) it is *negative* — the outgoing wavefront is
 * dragged inward. That sign flip is the coordinate signature of a trapped
 * surface.
 */
export function radialLightSpeed(
  rHat: number,
  direction: "outgoing" | "ingoing",
): number {
  const f = 1 - 1 / rHat;
  return direction === "outgoing" ? f : -f;
}

/**
 * Is a 2-sphere of areal radius rHat (in units of r_s) trapped? A surface is
 * (future) trapped when *both* the ingoing and outgoing orthogonal null
 * congruences have negative expansion — equivalently, when even the outgoing
 * radial light ray fails to increase r. In Schwarzschild that is exactly the
 * region inside the horizon, rHat < 1. On the horizon (rHat = 1) the outgoing
 * expansion is zero: the surface is *marginally* trapped.
 */
export function isTrapped(rHat: number): boolean {
  return rHat < 1;
}

/** Outgoing null expansion θ₊ ∝ (1 − 1/rHat) for a Schwarzschild 2-sphere,
 *  returned in arbitrary units that share the sign of the true expansion.
 *  Positive outside the horizon, zero on it, negative inside. */
export function outgoingExpansionSign(rHat: number): number {
  return Math.sign(1 - 1 / rHat);
}

// ─── Energy conditions (pointwise scalar tests) ─────────────────────────────

/**
 * Energy-condition checks for a perfect fluid with energy density ρ and
 * isotropic pressure p (in matching geometrized units). These are the
 * pointwise inequalities the focusing argument needs. Each returns whether the
 * condition holds at this point.
 *
 *   - NEC (null):     ρ + p ≥ 0
 *   - WEC (weak):     ρ ≥ 0 AND ρ + p ≥ 0
 *   - SEC (strong):   ρ + p ≥ 0 AND ρ + 3p ≥ 0   (this is the one Penrose/Hawking use)
 *   - DEC (dominant): ρ ≥ |p|
 */
export type EnergyCondition = "NEC" | "WEC" | "SEC" | "DEC";

export function satisfiesEnergyCondition(
  condition: EnergyCondition,
  rho: number,
  p: number,
): boolean {
  switch (condition) {
    case "NEC":
      return rho + p >= 0;
    case "WEC":
      return rho >= 0 && rho + p >= 0;
    case "SEC":
      return rho + p >= 0 && rho + 3 * p >= 0;
    case "DEC":
      return rho >= Math.abs(p);
  }
}

// ─── Theorem hypotheses bookkeeping ─────────────────────────────────────────

/**
 * The three load-bearing hypotheses of the Penrose 1965 theorem (and, with the
 * obvious cosmological re-reading, the Hawking versions). If all three hold,
 * the spacetime is null-geodesically incomplete: a singularity in the precise
 * sense of an inextensible geodesic of finite affine length.
 */
export interface TheoremHypotheses {
  /** A closed trapped surface exists (gravitational collapse has gone far enough). */
  trappedSurface: boolean;
  /** An energy condition holds, so curvature focuses rather than defocuses. */
  energyCondition: boolean;
  /** A non-compact Cauchy surface / global hyperbolicity (no closed timelike curves, sensible initial data). */
  globalHyperbolicity: boolean;
}

/** Does the Penrose theorem's conclusion (geodesic incompleteness) follow? */
export function impliesIncompleteness(h: TheoremHypotheses): boolean {
  return h.trappedSurface && h.energyCondition && h.globalHyperbolicity;
}

/**
 * For a given set of hypotheses, name the loophole that a *failure* of the
 * conclusion would have to exploit — i.e. which hypothesis is missing. Returns
 * null when the theorem already fires.
 */
export function missingHypothesis(
  h: TheoremHypotheses,
): keyof TheoremHypotheses | null {
  if (!h.trappedSurface) return "trappedSurface";
  if (!h.energyCondition) return "energyCondition";
  if (!h.globalHyperbolicity) return "globalHyperbolicity";
  return null;
}
