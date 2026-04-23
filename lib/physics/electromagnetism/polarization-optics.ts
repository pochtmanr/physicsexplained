/**
 * Polarisation phenomena in optics (§09.9 / FIG.50).
 *
 * Light is a transverse electromagnetic wave — E ⊥ B ⊥ k̂. In the plane
 * perpendicular to the direction of travel, E still has two degrees of
 * freedom: which direction inside that plane does the field actually
 * point, and with what phase relation does its two components vary in
 * time? That choice is the wave's *polarisation*, and it is not visible
 * to your eye — but it is unmistakable to any piece of anisotropic
 * matter. This module exposes four pure helpers covering the classical
 * polarisation phenomena:
 *
 *   malusLaw(I0, θ)               — linear polariser transmission,
 *                                   I = I₀ cos²θ   (Malus, 1809).
 *   brewsterAngleDeg(n₁, n₂)      — the incidence angle at which the
 *                                   reflected beam is purely s-polarised,
 *                                   θ_B = arctan(n₂ / n₁)   (Brewster, 1815).
 *   waveplatePhaseShift(d, ne,    — retardation Δφ = (2π/λ)·(n_e − n_o)·d
 *                       no, λ)     across a birefringent plate of thickness
 *                                   d. A quarter-wave plate has Δφ = π/2.
 *   birefringenceSplit(no, ne,    — lateral displacement of the e-ray from
 *                       d, θ)      the o-ray emerging from a uniaxial slab
 *                                   of thickness d at external incidence θ.
 *
 * All angles are in degrees at the public boundary; internals use radians.
 * All calculations are pure — no side effects, no globals — so they can be
 * called from both server and client components.
 */

const DEG = Math.PI / 180;

/**
 * Malus's law — the intensity that survives a linear polariser whose
 * transmission axis makes angle θ with the incoming linear polarisation:
 *
 *   I(θ) = I₀ · cos²θ
 *
 * Malus discovered this in 1809 while watching sunset reflections off the
 * Luxembourg palace through a calcite crystal and noticing that the two
 * images came and went as he rotated his viewpoint. It is the simplest
 * non-trivial polarisation law, and it falls straight out of projecting
 * an E-vector onto a chosen axis and then squaring (intensity is |E|²,
 * power flows as E·E).
 *
 * At θ = 0°  you get I₀ (aligned — everything passes).
 * At θ = 45° you get I₀/2 (half the amplitude, quarter on each axis —
 *                          but remember the polariser only keeps one axis).
 * At θ = 90° you get 0     (crossed polarisers — total extinction).
 *
 * For an *unpolarised* beam going through a single linear polariser the
 * transmitted intensity is I₀/2 independent of angle — the averaging over
 * random input polarisations collapses the cos² factor to its mean of 1/2.
 *
 * @param i0       incident intensity (any positive unit; W/m², arb., …)
 * @param angleDeg angle between analyser axis and input polarisation (deg)
 * @returns transmitted intensity in the same units as `i0`
 */
export function malusLaw(i0: number, angleDeg: number): number {
  if (i0 < 0) {
    throw new Error(`malusLaw: intensity I₀ must be ≥ 0 (got ${i0}).`);
  }
  const c = Math.cos(angleDeg * DEG);
  return i0 * c * c;
}

/**
 * Brewster's angle in *degrees* for a ray travelling from medium n₁ into
 * medium n₂:
 *
 *   θ_B = arctan(n₂ / n₁)
 *
 * At θ_B the reflected beam is *purely s-polarised* — the p-channel
 * vanishes because the classical radiation-reaction argument says a
 * p-polarised dipole cannot radiate along its own oscillation direction,
 * and at Brewster that direction is exactly the reflected-ray direction.
 * Air → crown glass (n = 1.5) gives 56.31°; air → water 53.06°;
 * air → diamond 67.54°. Photographers meet this angle every time they
 * slap a polariser on a lens to kill glare off water or glass.
 *
 * This is the same formula exposed in `fresnel.ts::brewsterAngle` but in
 * degrees — the polarisation topic pages work in human-readable degrees
 * throughout, so it's worth a dedicated entry point with unit-clear naming.
 *
 * @param n1 refractive index of the incidence medium (> 0)
 * @param n2 refractive index of the transmission medium (> 0)
 */
export function brewsterAngleDeg(n1: number, n2: number): number {
  if (n1 <= 0 || n2 <= 0) {
    throw new Error(
      `brewsterAngleDeg: indices must be positive (got n₁=${n1}, n₂=${n2}).`,
    );
  }
  return Math.atan(n2 / n1) / DEG;
}

/**
 * Retardation (phase shift) introduced by a birefringent waveplate of
 * thickness `thickness`, with extraordinary index `n_e` and ordinary
 * index `n_o`, for vacuum wavelength `lambda`:
 *
 *   Δφ = (2π / λ) · (n_e − n_o) · d
 *
 * A **quarter-wave plate** is cut so Δφ = π/2; it turns linearly
 * polarised light (at 45° to the crystal axes) into circularly polarised
 * light, and vice versa. A **half-wave plate** has Δφ = π; it flips
 * linear polarisation through 2α around the fast axis (rotating α into
 * −α, the polarisation-equivalent of a mirror).
 *
 * Sign convention: the return value can be negative if n_e < n_o (a
 * "negative" uniaxial crystal like calcite). Only the absolute value
 * matters for intensity; the sign tells you whether the e-ray leads or
 * lags the o-ray.
 *
 * @param thickness plate thickness d (metres)
 * @param n_e       extraordinary-ray index
 * @param n_o       ordinary-ray index
 * @param lambda    vacuum wavelength (metres)
 * @returns phase shift Δφ in radians
 */
export function waveplatePhaseShift(
  thickness: number,
  n_e: number,
  n_o: number,
  lambda: number,
): number {
  if (thickness <= 0) {
    throw new Error(
      `waveplatePhaseShift: thickness must be positive (got ${thickness}).`,
    );
  }
  if (lambda <= 0) {
    throw new Error(
      `waveplatePhaseShift: wavelength must be positive (got ${lambda}).`,
    );
  }
  return ((2 * Math.PI) / lambda) * (n_e - n_o) * thickness;
}

/**
 * Lateral displacement of the *extraordinary* ray relative to the
 * *ordinary* ray at the exit face of a uniaxial slab — the visible
 * "double-image" effect you get when you place a calcite rhomb on top of
 * printed text.
 *
 * The ordinary ray obeys plain Snell's law with index n_o: an incoming
 * ray at external angle θ refracts to internal angle
 *
 *   θ_o = arcsin(sinθ / n_o).
 *
 * The extraordinary ray obeys Snell's law with index n_e at normal
 * incidence, and in the small-angle / principal-plane approximation used
 * here we take it to refract as
 *
 *   θ_e = arcsin(sinθ / n_e).
 *
 * The lateral displacement of the two exit points — measured parallel
 * to the slab face — is
 *
 *   Δx = d · [ tan(θ_o) − tan(θ_e) ].
 *
 * For calcite (n_o = 1.658, n_e = 1.486) at 30° incidence and d = 1 mm,
 * this gives |Δx| ≈ 0.12 mm — exactly the level of splitting you see
 * with the naked eye. At θ = 0° the two rays emerge superposed so Δx = 0;
 * away from normal incidence |Δx| grows roughly linearly with θ in this
 * geometric model.
 *
 * This is a *geometric* stand-in for the full anisotropic ray-tracing
 * calculation (whose proper treatment uses the index ellipsoid and is a
 * topic unto itself). It gives the right scale and the right sign, which
 * is what the scene component needs for a FIG.50 visual.
 *
 * @param n_o       ordinary-ray refractive index
 * @param n_e       extraordinary-ray refractive index
 * @param thickness slab thickness d (metres)
 * @param thetaDeg  external incidence angle (deg), measured from the
 *                  slab normal
 * @returns Δx in the same units as `thickness`. Positive means the
 *          e-ray sits on the same side of the o-ray as the incident ray.
 */
export function birefringenceSplit(
  n_o: number,
  n_e: number,
  thickness: number,
  thetaDeg: number,
): number {
  if (n_o <= 0 || n_e <= 0) {
    throw new Error(
      `birefringenceSplit: indices must be positive (got n_o=${n_o}, n_e=${n_e}).`,
    );
  }
  if (thickness <= 0) {
    throw new Error(
      `birefringenceSplit: thickness must be positive (got ${thickness}).`,
    );
  }
  const theta = thetaDeg * DEG;
  const sinT = Math.sin(theta);
  // Both indices should produce a real refracted angle for any |sinθ| ≤ 1,
  // since n_o and n_e are ≥ 1 in normal optical crystals.
  const sinO = sinT / n_o;
  const sinE = sinT / n_e;
  if (Math.abs(sinO) > 1 || Math.abs(sinE) > 1) {
    throw new Error(
      `birefringenceSplit: evanescent regime — sin θ exceeds min(n_o,n_e).`,
    );
  }
  const thetaO = Math.asin(sinO);
  const thetaE = Math.asin(sinE);
  return thickness * (Math.tan(thetaO) - Math.tan(thetaE));
}

/**
 * Three-polariser transmission for the classic "middle polariser" demo.
 *
 * Stack (in order along the beam):
 *   unpolarised input   → polariser₀ at 0°
 *                       → polariser₁ at `angle2Deg`
 *                       → polariser₂ at 90°
 *
 * The transmitted fraction (I_out / I_in) is computed by applying Malus
 * at every interface and including the initial 1/2 factor for the
 * unpolarised-to-linear collapse at polariser₀:
 *
 *   I_out / I_in = ½ · cos²(angle2Deg) · cos²(90° − angle2Deg)
 *                = ½ · cos²(angle2Deg) · sin²(angle2Deg)
 *                = ⅛ · sin²(2·angle2Deg).
 *
 * The closed-form expression on the last line makes the answer easy to
 * check by eye: it is zero at 0° and 90° (the crossed-pair case) and it
 * peaks at `angle2Deg = 45°` with the famous value 1/8. That non-zero
 * peak is the "light coming through crossed polarisers by adding a
 * polariser" surprise — the middle element is not a filter, it is a
 * *projection* that re-casts the polarisation state into a basis the
 * final polariser can partially transmit.
 *
 * @param angle2Deg transmission-axis angle of the middle polariser (deg),
 *                  measured from the first polariser's axis.
 * @returns transmission fraction in [0, 1/8]
 */
export function threePolariserTransmission(angle2Deg: number): number {
  // Normalise the angle reach — the function is periodic (period 180°),
  // so we don't need to reject values: any angle is physically meaningful.
  const a = angle2Deg * DEG;
  const c1 = Math.cos(a); // angle between P₀ (0°) and P₁
  const c2 = Math.cos((90 - angle2Deg) * DEG); // angle between P₁ and P₂ (90°)
  return 0.5 * c1 * c1 * c2 * c2;
}
