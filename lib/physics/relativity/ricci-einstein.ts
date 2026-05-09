/**
 * §08 RICCI TENSOR, RICCI SCALAR, AND EINSTEIN TENSOR — pure-TS helpers.
 *
 * Contractions of the Riemann tensor that encode curvature information in
 * progressively simpler objects:
 *
 *   R_{μν}   = R^λ_{μλν}                        — Ricci tensor  (0,2), symmetric, 10 indep. in 4D
 *   R        = g^{μν} R_{μν}                     — Ricci scalar  (0,0)
 *   G_{μν}   = R_{μν} − (1/2) R g_{μν}          — Einstein tensor (0,2), symmetric, divergence-free
 *
 * The divergence-free property ∇^μ G_{μν} = 0 follows from the contracted
 * second Bianchi identity and is what allows G_{μν} to be equated to the
 * conserved stress-energy tensor T_{μν} in the Einstein field equations.
 */

import { riemannTensor } from "./riemann";
import { invertMetric } from "./christoffel";

/** Ricci tensor R_{μν} = R^λ_{μλν} — contracts the first and third indices of Riemann.
 *  The result is a symmetric (0,2) tensor with 10 independent components in 4D.
 *  Returns an n×n matrix. */
export function ricciTensor(
  metric: (x: readonly number[]) => readonly (readonly number[])[],
  x: readonly number[],
  eps = 1e-3,
): readonly (readonly number[])[] {
  const R = riemannTensor(metric, x, eps);
  const n = x.length;
  const Ric: number[][] = [];
  for (let mu = 0; mu < n; mu++) {
    const row: number[] = [];
    for (let nu = 0; nu < n; nu++) {
      let acc = 0;
      for (let lam = 0; lam < n; lam++) acc += R[lam][mu][lam][nu];
      row.push(acc);
    }
    Ric.push(row);
  }
  return Ric;
}

/** Ricci scalar R = g^{μν} R_{μν}.
 *  The simplest scalar invariant of curvature at each point of the manifold.
 *  Positive R indicates sphere-like (positive) curvature; negative R indicates
 *  saddle-like (hyperbolic) curvature; R = 0 for flat spaces. */
export function ricciScalar(
  metric: (x: readonly number[]) => readonly (readonly number[])[],
  x: readonly number[],
  eps = 1e-3,
): number {
  const Ric = ricciTensor(metric, x, eps);
  const g = metric(x);
  const gInv = invertMetric(g);
  const n = g.length;
  let acc = 0;
  for (let mu = 0; mu < n; mu++) {
    for (let nu = 0; nu < n; nu++) acc += gInv[mu][nu] * Ric[mu][nu];
  }
  return acc;
}

/** Einstein tensor G_{μν} = R_{μν} − (1/2) R g_{μν}.
 *  The unique symmetric, divergence-free, linear-in-second-derivative combination
 *  of the Ricci tensor and the metric. The geometric side of the Einstein field
 *  equations: G_{μν} = 8π T_{μν} (in units with G = c = 1).
 *
 *  In 2D, R_{μν} = (R/2) g_{μν} identically, so G_{μν} = 0 in 2D. */
export function einsteinTensor(
  metric: (x: readonly number[]) => readonly (readonly number[])[],
  x: readonly number[],
  eps = 1e-3,
): readonly (readonly number[])[] {
  const Ric = ricciTensor(metric, x, eps);
  const R = ricciScalar(metric, x, eps);
  const g = metric(x);
  const n = g.length;
  const G: number[][] = [];
  for (let mu = 0; mu < n; mu++) {
    const row: number[] = [];
    for (let nu = 0; nu < n; nu++) row.push(Ric[mu][nu] - 0.5 * R * g[mu][nu]);
    G.push(row);
  }
  return G;
}

/** Verify the contracted second Bianchi identity numerically: ∇^μ G_{μν} ≈ 0.
 *  Returns the maximum |∇^μ G_{μν}| over ν as a residual measure (numerical noise floor).
 *
 *  Note: this is a sanity-check helper only. A full covariant divergence computation
 *  requires Christoffel corrections; here we implement a finite-difference partial
 *  divergence as a lower bound on how well the identity is satisfied numerically. */
export function einsteinDivergenceResidual(
  metric: (x: readonly number[]) => readonly (readonly number[])[],
  x: readonly number[],
  eps = 1e-3,
): number {
  const n = x.length;
  const g = metric(x);
  const gInv = invertMetric(g);

  // ∂_μ G_{μν} via finite differences (partial divergence — ignoring Christoffel terms).
  // For highly symmetric metrics the Christoffel corrections are small and this gives
  // a useful numerical sanity check.
  const divG: number[] = new Array(n).fill(0);
  for (let nu = 0; nu < n; nu++) {
    for (let mu = 0; mu < n; mu++) {
      const xPlus = [...x];
      const xMinus = [...x];
      xPlus[mu] += eps;
      xMinus[mu] -= eps;
      const GPlus = einsteinTensor(metric, xPlus, eps);
      const GMinus = einsteinTensor(metric, xMinus, eps);
      // raise the μ index: ∂_μ (g^{μα} G_{αν})
      for (let alpha = 0; alpha < n; alpha++) {
        divG[nu] += gInv[mu][alpha] * (GPlus[alpha][nu] - GMinus[alpha][nu]) / (2 * eps);
      }
    }
  }

  return Math.max(...divG.map(Math.abs));
}
