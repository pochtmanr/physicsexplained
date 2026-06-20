/**
 * §50 LINEARIZED GRAVITY — pure-TS helpers.
 *
 * In the weak-field regime the metric is a small perturbation of flat
 * Minkowski spacetime,
 *
 *   g_{μν} = η_{μν} + h_{μν},   |h_{μν}| ≪ 1.
 *
 * Linearizing the Einstein field equations and adopting the
 * transverse-traceless (TT) gauge reduces them to a flat-space wave
 * equation for the perturbation,
 *
 *   □ h̄_{μν} = -(16πG/c⁴) T_{μν},
 *
 * whose vacuum solutions are plane waves traveling at the speed of light.
 * A TT plane wave propagating along z has only two independent components,
 * the "+" and "×" polarizations, living in the transverse (x, y) plane.
 *
 * This file is React-free and purely numeric. It provides:
 *   - a scalar plane-wave displacement field h(t) at fixed phase,
 *   - the dispersion relation / phase speed (always c),
 *   - the TT strain matrix for a "+"/"×" mixture,
 *   - the deformation of a ring of free test masses (used by the scenes),
 *   - the standard EM ↔ GR analogy table data.
 */

import { SPEED_OF_LIGHT } from "@/lib/physics/constants";

/** A gravitational-wave polarization basis label. */
export type Polarization = "plus" | "cross";

/**
 * Scalar plane wave h(t, z) = A cos(k z − ω t + φ).
 *
 * Convenience evaluator for a single Cartesian component of the TT
 * perturbation, used to drive the "ripple on a flat grid" scene. `omega`
 * and `k` are tied by the vacuum dispersion relation ω = c k, so the wave
 * always travels at the speed of light; see `phaseSpeed`.
 */
export function planeWave(
  amplitude: number,
  k: number,
  omega: number,
  z: number,
  t: number,
  phase = 0,
): number {
  return amplitude * Math.cos(k * z - omega * t + phase);
}

/**
 * Vacuum dispersion relation: ω = c k. A linearized gravitational wave is
 * massless, so its phase speed is exactly c, independent of frequency —
 * there is no dispersion (unlike, e.g., a wave on a stiff string).
 */
export function angularFrequencyFromWavenumber(
  k: number,
  c = SPEED_OF_LIGHT,
): number {
  return c * k;
}

/** Wavenumber k = ω / c from angular frequency. */
export function wavenumberFromAngularFrequency(
  omega: number,
  c = SPEED_OF_LIGHT,
): number {
  return omega / c;
}

/**
 * Phase speed ω / k of a linearized gravitational wave. Always returns c
 * (within floating-point) when the inputs satisfy the dispersion relation.
 * Returns `c` exactly when `k === 0` is guarded against by the caller.
 */
export function phaseSpeed(omega: number, k: number): number {
  if (k === 0) return 0;
  return omega / k;
}

/** Reduced wavelength: λ = 2π / k. */
export function wavelength(k: number): number {
  return (2 * Math.PI) / k;
}

/**
 * The transverse-traceless strain matrix in the (x, y) plane for a wave
 * propagating along z, evaluated at phase `phase` (= ω t for an observer
 * at z = 0). The "+" mode stretches along x while squeezing along y; the
 * "×" mode does the same along the 45° diagonals.
 *
 *   h_ij(t) = [[ h+ cos(ωt),  h× cos(ωt) ],
 *              [ h× cos(ωt), -h+ cos(ωt) ]]
 *
 * The matrix is symmetric and traceless by construction — the defining
 * property of the TT gauge.
 *
 * Returns the 2×2 matrix as [[xx, xy], [yx, yy]].
 */
export function ttStrainMatrix(
  hPlus: number,
  hCross: number,
  phase: number,
): [[number, number], [number, number]] {
  const cp = Math.cos(phase);
  const xx = hPlus * cp;
  const yy = -hPlus * cp;
  const xy = hCross * cp;
  return [
    [xx, xy],
    [xy, yy],
  ];
}

/** A 2-D point, used for ring deformation. */
export interface Point2 {
  x: number;
  y: number;
}

/**
 * Apply the linearized TT strain to a single test-mass position. To first
 * order, a free mass initially at displacement (x₀, y₀) from a reference
 * mass is moved to
 *
 *   x = x₀ + ½ (h_xx x₀ + h_xy y₀)
 *   y = y₀ + ½ (h_yx x₀ + h_yy y₀)
 *
 * The factor ½ is the standard result of integrating the geodesic-deviation
 * equation for a slowly-varying field: the *fractional* separation change
 * δL/L equals ½ h, which is why "strain" is defined as h/2 in detector
 * conventions, while the metric perturbation itself is h.
 */
export function deformPoint(
  p: Point2,
  strain: [[number, number], [number, number]],
): Point2 {
  const [[hxx, hxy], [hyx, hyy]] = strain;
  return {
    x: p.x + 0.5 * (hxx * p.x + hxy * p.y),
    y: p.y + 0.5 * (hyx * p.x + hyy * p.y),
  };
}

/**
 * Generate the deformed positions of a ring of `n` free test masses of
 * radius `radius`, under a "+"/"×" mixture at the given phase. Returns the
 * displaced ring. With zero amplitude this returns the undistorted circle.
 */
export function ringResponse(
  n: number,
  radius: number,
  hPlus: number,
  hCross: number,
  phase: number,
): Point2[] {
  const strain = ttStrainMatrix(hPlus, hCross, phase);
  const out: Point2[] = [];
  for (let i = 0; i < n; i++) {
    const theta = (2 * Math.PI * i) / n;
    const p = { x: radius * Math.cos(theta), y: radius * Math.sin(theta) };
    out.push(deformPoint(p, strain));
  }
  return out;
}

/**
 * One row of the EM ↔ linearized-GR analogy. Each row pairs an
 * electromagnetic object with its gravitational counterpart and a short
 * note on how the analogy holds (and where it breaks).
 */
export interface AnalogyRow {
  key: string;
  /** What the row is about, e.g. "Field potential". */
  concept: string;
  /** The electromagnetic object. */
  em: string;
  /** The gravitational object. */
  gr: string;
  /** A one-line note. */
  note: string;
}

/**
 * The canonical EM ↔ linearized-GR dictionary. Returns a fresh array so
 * callers can render or reorder it freely.
 */
export function analogyTable(): AnalogyRow[] {
  return [
    {
      key: "field",
      concept: "Field variable",
      em: "Four-potential Aμ",
      gr: "Metric perturbation h̄μν",
      note: "EM has a vector potential; GR a symmetric rank-2 tensor.",
    },
    {
      key: "gauge",
      concept: "Gauge freedom",
      em: "Aμ → Aμ + ∂μ χ",
      gr: "h̄μν → h̄μν + ∂μ ξν + ∂ν ξμ",
      note: "Both reflect unphysical redundancy in the description.",
    },
    {
      key: "condition",
      concept: "Gauge condition",
      em: "Lorenz: ∂μ Aμ = 0",
      gr: "Lorenz: ∂μ h̄μν = 0",
      note: "Both turn the field equation into a clean wave equation.",
    },
    {
      key: "wave",
      concept: "Wave equation",
      em: "□ Aμ = −μ₀ Jμ",
      gr: "□ h̄μν = −(16πG/c⁴) Tμν",
      note: "Same d'Alembertian operator; both propagate at c.",
    },
    {
      key: "source",
      concept: "Lowest radiating source",
      em: "Oscillating dipole",
      gr: "Oscillating quadrupole",
      note: "Charge → mass: no monopole or dipole gravitational radiation.",
    },
    {
      key: "spin",
      concept: "Field quantum spin",
      em: "Spin-1 (photon), 2 modes",
      gr: "Spin-2 (graviton), 2 modes",
      note: "Spin sets the polarization symmetry: 180° vs 90°.",
    },
  ];
}

/**
 * The strain amplitude h ≈ (1/r)(2G/c⁴) d²Q/dt² produces a fractional
 * length change δL/L = h/2 over a baseline L. Convenience converter from a
 * dimensionless strain to the absolute length change of a detector arm.
 */
export function armLengthChange(strain: number, armLength: number): number {
  return 0.5 * strain * armLength;
}
