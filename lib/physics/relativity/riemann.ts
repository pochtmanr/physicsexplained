/**
 * §08 THE RIEMANN TENSOR — pure-TS helpers.
 *
 * The Riemann curvature tensor R^ρ_{σμν} measures the failure of covariant
 * derivatives to commute: [∇_μ, ∇_ν] V^ρ = R^ρ_{σμν} V^σ.
 *
 * Explicit formula (built entirely from Christoffel symbols):
 *   R^ρ_{σμν} = ∂_μ Γ^ρ_{νσ} − ∂_ν Γ^ρ_{μσ} + Γ^ρ_{μλ} Γ^λ_{νσ} − Γ^ρ_{νλ} Γ^λ_{μσ}
 *
 * This module provides:
 *   • riemannTensor                  — numerical R^ρ_{σμν} via central differences.
 *   • riemannIndependentComponentCount — n²(n²−1)/12 algebraically independent entries.
 *   • lowerRiemann                   — contract first index with metric: R_{ρσμν}.
 */

import { christoffelSymbols } from "./christoffel";

/** Riemann tensor R^ρ_{σμν} computed numerically from a metric function.
 *  R^ρ_{σμν} = ∂_μ Γ^ρ_{νσ} − ∂_ν Γ^ρ_{μσ} + Γ^ρ_{μλ} Γ^λ_{νσ} − Γ^ρ_{νλ} Γ^λ_{μσ}.
 *  Returns a 4-index array R[ρ][σ][μ][ν] of size n×n×n×n.
 *  Numerical accuracy ~1e-3 with default eps. */
export function riemannTensor(
  metric: (x: readonly number[]) => readonly (readonly number[])[],
  x: readonly number[],
  eps = 1e-3,
): readonly (readonly (readonly (readonly number[])[])[])[]{
  const n = x.length;
  const Gamma = christoffelSymbols(metric, x);
  // Compute partial derivatives of Christoffel symbols numerically.
  const dGamma: number[][][][] = [];
  for (let mu = 0; mu < n; mu++) {
    const xPlus = [...x];
    const xMinus = [...x];
    xPlus[mu] += eps;
    xMinus[mu] -= eps;
    const GammaPlus = christoffelSymbols(metric, xPlus);
    const GammaMinus = christoffelSymbols(metric, xMinus);
    const slice: number[][][] = [];
    for (let rho = 0; rho < n; rho++) {
      const r1: number[][] = [];
      for (let sigma = 0; sigma < n; sigma++) {
        const r2: number[] = [];
        for (let nu = 0; nu < n; nu++) {
          r2.push((GammaPlus[rho][nu][sigma] - GammaMinus[rho][nu][sigma]) / (2 * eps));
        }
        r1.push(r2);
      }
      slice.push(r1);
    }
    dGamma.push(slice); // dGamma[mu][rho][sigma][nu] = ∂_μ Γ^ρ_{νσ}
  }

  const R: number[][][][] = [];
  for (let rho = 0; rho < n; rho++) {
    const Rrho: number[][][] = [];
    for (let sigma = 0; sigma < n; sigma++) {
      const Rsig: number[][] = [];
      for (let mu = 0; mu < n; mu++) {
        const row: number[] = [];
        for (let nu = 0; nu < n; nu++) {
          let acc = dGamma[mu][rho][sigma][nu] - dGamma[nu][rho][sigma][mu];
          for (let lam = 0; lam < n; lam++) {
            acc += Gamma[rho][mu][lam] * Gamma[lam][nu][sigma];
            acc -= Gamma[rho][nu][lam] * Gamma[lam][mu][sigma];
          }
          row.push(acc);
        }
        Rsig.push(row);
      }
      Rrho.push(Rsig);
    }
    R.push(Rrho);
  }
  return R;
}

/** Independent component count for the Riemann tensor in n dimensions.
 *  Formula: n²(n²−1)/12. Returns 0 in 1D, 1 in 2D, 6 in 3D, 20 in 4D. */
export function riemannIndependentComponentCount(n: number): number {
  if (n < 1 || !Number.isInteger(n))
    throw new RangeError(`riemannIndependentComponentCount: requires positive integer (got ${n})`);
  return Math.floor((n * n * (n * n - 1)) / 12);
}

/** Lower the contravariant index of the Riemann tensor: R_{ρσμν} = g_{ρλ} R^λ_{σμν}. */
export function lowerRiemann(
  g: readonly (readonly number[])[],
  R: readonly (readonly (readonly (readonly number[])[])[])[],
): number[][][][] {
  const n = g.length;
  const Rlower: number[][][][] = [];
  for (let rho = 0; rho < n; rho++) {
    const A: number[][][] = [];
    for (let sigma = 0; sigma < n; sigma++) {
      const B: number[][] = [];
      for (let mu = 0; mu < n; mu++) {
        const row: number[] = [];
        for (let nu = 0; nu < n; nu++) {
          let acc = 0;
          for (let lam = 0; lam < n; lam++) acc += g[rho][lam] * R[lam][sigma][mu][nu];
          row.push(acc);
        }
        B.push(row);
      }
      A.push(B);
    }
    Rlower.push(A);
  }
  return Rlower;
}
