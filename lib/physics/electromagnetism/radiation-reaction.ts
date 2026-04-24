/**
 * §10.6 — Radiation reaction.
 *
 * An accelerating point charge radiates power P = q² a² / (6π ε₀ c³) (§10.1,
 * Larmor). By energy conservation that energy must come from *somewhere* —
 * and the only reservoir available is the charge's own kinetic energy. So
 * the charge must feel a force, exerted on itself by its own radiated field,
 * that drains that kinetic energy. Call it F_rad. The clean question is:
 * what is F_rad?
 *
 * Abraham (1903) and Lorentz (1904) computed the leading-order answer by
 * integrating the self-force of a small charged sphere of radius a → 0 and
 * demanding that the rate of work done by F_rad equal (the time-average
 * of) the Larmor radiated power. The result is
 *
 *     F_rad  =  (μ₀ q² / 6π c) · ȧ      (Abraham-Lorentz, 1903-1904)
 *
 * where ȧ = d³x/dt³ is the *jerk* — the third time-derivative of position.
 * Note what happened: the force depends on the derivative of acceleration,
 * not on acceleration itself. Newton's second law F = m·a becomes a
 * *third-order* ordinary differential equation once this term is added in:
 *
 *     m ẍ  =  F_ext(t)  +  (μ₀ q² / 6π c) · x⃛
 *
 * This is the seam. A third-order ODE needs *three* initial conditions
 * (position, velocity, acceleration), not two, and has qualitatively
 * different solution structure from Newton's laws. Three specific
 * pathologies immediately appear:
 *
 *   (i)  Runaway solutions. Set F_ext = 0. The equation becomes
 *           ȧ = a / τ₀,    τ₀ = q² / (6π ε₀ m c³)
 *        whose general solution is a(t) = a₀ · exp(t/τ₀). A free charge
 *        with nonzero initial acceleration sees that acceleration grow
 *        *exponentially* — without any external force. Textbook
 *        pathology. τ₀ for the electron is 6.27 × 10⁻²⁴ s, the light-
 *        crossing time of the classical electron radius.
 *
 *   (ii) Pre-acceleration. Select the initial conditions that kill the
 *        runaway (the "physical" boundary condition ȧ(∞) = 0) and the
 *        equation now predicts that when a force F_ext is switched on at
 *        t = 0, the charge starts to accelerate slightly *before* t = 0,
 *        with the pre-acceleration decaying over a timescale τ₀. Cause
 *        precedes effect by less than τ₀ ≈ 10⁻²⁴ s — short, but explicit
 *        violation of classical causality.
 *
 *  (iii) Self-energy divergence. The electrostatic energy of a point
 *        charge is ∫ (ε₀/2)|E|² dV, which diverges at r → 0. The
 *        electromagnetic "mass" of a classical point electron is
 *        formally infinite. One interpretation of the Abraham-Lorentz
 *        coefficient q²/(6π ε₀ m c³) is that it is the finite ratio left
 *        over after the divergent self-energy has been absorbed into the
 *        bare mass — but this is renormalisation, not resolution.
 *
 * Landau and Lifshitz (1962, Classical Theory of Fields, §76) proposed a
 * practical workaround. For physically reasonable external forces whose
 * timescale τ_ext ≫ τ₀, the exact ALD equation is accurately approximated
 * by its reduced-order form:
 *
 *     a  ≈  F_ext / m          (Newton, leading order)
 *     ȧ  ≈  Ḟ_ext / m          (differentiate)
 *
 * so the radiation-reaction force becomes
 *
 *     F_rr  ≈  (μ₀ q² / 6π c) · (Ḟ_ext / m)  =  (τ₀/m) · Ḟ_ext
 *
 * This is a *second-order* ODE again, runaway-free, pre-acceleration-free,
 * and numerically well-behaved for any smooth external force. It is what
 * most modern work (laser-plasma physics, ultra-intense field regimes)
 * uses. BUT — and the tone of the topic prose makes this plain — the
 * Landau-Lifshitz reduction is a practical approximation, not a
 * fundamental resolution. The underlying third-order equation is still
 * sitting there; LL simply throws away the runaway branch by construction.
 *
 * Dirac (1938) extended the Abraham-Lorentz force to a fully Lorentz-
 * covariant relativistic equation — the Abraham-Lorentz-Dirac (ALD)
 * equation — with the same pathologies in covariant form. No classical
 * fix. QED resolves the divergences via renormalisation at the cost of
 * admitting that the bare electron mass is formally infinite and must
 * be regularised. At the classical level, radiation reaction remains an
 * open problem — and this topic is the honest admission of it.
 *
 * Cross-refs: §10.1 (Larmor — the radiated power that must be "paid
 * back"), §10.2 (dipole radiation — the simplest case of a reaction
 * force on a source), §11 (Lorentz covariance — where the Dirac version
 * of the ALD equation belongs), §12.1 (gauge-theory origins — the
 * classical seam is what motivates renormalisation in QED).
 */

import {
  ELEMENTARY_CHARGE,
  EPSILON_0,
  MU_0,
  SPEED_OF_LIGHT,
} from "@/lib/physics/constants";

/** Electron rest mass, kg (CODATA 2018). Needed for the canonical
 *  electron τ₀ and classical electron radius referenced throughout the
 *  topic prose. */
const ELECTRON_MASS = 9.1093837015e-31;

/**
 * Abraham-Lorentz radiation-reaction force, non-relativistic form.
 *
 *   F_rad = (μ₀ q² / 6π c) · ȧ
 *
 * where ȧ (SI: m/s³) is the *jerk* — the time-derivative of acceleration.
 * The coefficient (μ₀ q² / 6π c) is a charge-species-specific constant; for
 * the electron it is roughly 5.7 × 10⁻⁵⁴ N·s³/m.
 *
 * The sign convention: if ȧ > 0 (acceleration increasing) the radiation-
 * reaction force is directed along the jerk. The fact that F_rad depends
 * on ȧ and not a is what lifts Newton's second law to a third-order ODE.
 */
export function abrahamLorentzForce(q: number, jerk: number): number {
  const q2 = q * q;
  return ((MU_0 * q2) / (6 * Math.PI * SPEED_OF_LIGHT)) * jerk;
}

/**
 * Characteristic radiation-reaction timescale.
 *
 *   τ₀  =  q² / (6π ε₀ m c³)
 *
 * For the electron (q = e, m = mₑ) this evaluates to τ₀ ≈ 6.27 × 10⁻²⁴ s.
 * Geometrically τ₀ is the light-crossing time of the classical electron
 * radius — divide r_e ≈ 2.82 × 10⁻¹⁵ m by c and (up to a factor of 2/3)
 * you land here. It sets:
 *
 *   — the e-folding time of the runaway solution a(t) = a₀·exp(t/τ₀);
 *   — the upper bound on the duration of pre-acceleration in the
 *     physical-boundary-condition branch;
 *   — the timescale below which classical electrodynamics breaks down
 *     and quantum electrodynamics must take over.
 *
 * Throws on zero or negative mass.
 */
export function radiationReactionTimescale(q: number, m: number): number {
  if (m <= 0) {
    throw new Error("radiationReactionTimescale: m must be > 0");
  }
  const q2 = q * q;
  return (
    q2 /
    (6 * Math.PI * EPSILON_0 * m * SPEED_OF_LIGHT ** 3)
  );
}

/**
 * Runaway-solution acceleration.
 *
 *   a(t) = a₀ · exp(t / τ₀)
 *
 * This is the general solution of the *free* Abraham-Lorentz equation
 * (no external force) with nonzero initial acceleration. There is no
 * source of energy driving the charge; yet the acceleration grows
 * without bound. That is the pathology. The only way to avoid it is
 * to impose the boundary condition a(∞) = 0 (equivalently ȧ(0) = 0
 * by hand), which selects the trivial a(t) ≡ 0 branch — and which, once
 * an external force is restored, forces pre-acceleration in exchange.
 *
 * Throws on tau0 ≤ 0.
 */
export function runawaySolution(
  t: number,
  a0: number,
  tau0: number,
): number {
  if (tau0 <= 0) {
    throw new Error("runawaySolution: tau0 must be > 0");
  }
  return a0 * Math.exp(t / tau0);
}

/**
 * Landau-Lifshitz reduced-order radiation-reaction force.
 *
 *   F_rr  ≈  (τ₀ / m) · Ḟ_ext  =  (q² / 6π ε₀ m c³) · Ḟ_ext
 *
 * For a physically reasonable external force F_ext(t) whose timescale is
 * much longer than τ₀, the Abraham-Lorentz jerk ȧ is accurately replaced
 * by the external-force rate Ḟ_ext/m. The equation of motion becomes a
 * second-order ODE with a bounded additional term — no runaways, no
 * pre-acceleration, and numerical integration is stable.
 *
 * This is the form used in practice in laser-plasma physics and ultra-
 * intense field simulations. It does NOT resolve the fundamental
 * third-order pathology; it sidesteps it by declaring the runaway branch
 * out-of-bounds. Zero external jerk → zero radiation-reaction force.
 */
export function landauLifshitzForce(
  q: number,
  m: number,
  _Fext: number,
  FextDot: number,
): number {
  if (m <= 0) {
    throw new Error("landauLifshitzForce: m must be > 0");
  }
  const tau0 = radiationReactionTimescale(q, m);
  // (The F_ext argument is carried for symmetry with fuller corrections
  //  that include an |F_ext|² · v / (m c²) term; at lowest order in β it
  //  drops out, as here.)
  void _Fext;
  return (tau0 / m) * FextDot;
}

/**
 * Classical electron radius, m.
 *
 *   r_e  =  q² / (4π ε₀ m c²)  ≈  2.818 × 10⁻¹⁵ m  for the electron
 *
 * NOT the literal radius of the electron (the electron is pointlike to
 * the best current limits, ≲ 10⁻²² m). The classical electron radius is
 * the radius at which the electrostatic self-energy of a uniformly
 * charged sphere of charge q equals its rest energy m·c². Below r_e, the
 * field energy exceeds the rest energy — which is the divergence that
 * feeds the Abraham-Lorentz pathology.
 *
 * Called with no argument returns the electron value. (Exposed as a
 * parameter-free helper because the §10.6 prose and the timescale scene
 * both quote "classical electron radius = 2.82 × 10⁻¹⁵ m" as a number.)
 */
export function classicalElectronRadius(): number {
  const q2 = ELEMENTARY_CHARGE * ELEMENTARY_CHARGE;
  return (
    q2 /
    (4 * Math.PI * EPSILON_0 * ELECTRON_MASS * SPEED_OF_LIGHT ** 2)
  );
}
