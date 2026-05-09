/**
 * §07 CHRISTOFFEL SYMBOLS AND PARALLEL TRANSPORT — pure-TS helpers.
 *
 * The Christoffel symbols (Γ^ρ_{μν}) are the connection coefficients that
 * encode how tangent vectors are parallel-transported from point to point on a
 * curved manifold. They are computed from the metric and its first derivatives.
 *
 * This module provides:
 *   • christoffelSymbols  — numerical Γ^ρ_{μν} via central differences.
 *   • invertMetric        — generic n×n Gauss-Jordan matrix inverse.
 *   • parallelTransportStep — one Euler step of the parallel-transport ODE.
 *   • sphericalHolonomyAngle — closed-form holonomy angle for a spherical loop.
 *   • sphericalMetric     — diagonal metric on (θ, φ) for a sphere of radius R.
 */

/** Christoffel symbol of the second kind, Γ^ρ_{μν}. Computed numerically from a
 *  metric function g(x) (R^n -> n×n matrix) at point x. Uses central differences. */
export function christoffelSymbols(
  metric: (x: readonly number[]) => readonly (readonly number[])[],
  x: readonly number[],
  eps = 1e-4,
): readonly (readonly (readonly number[])[])[] {
  const n = x.length;
  const g = metric(x);
  // Compute partial derivatives ∂_λ g_{μν} via central differences.
  const dg: number[][][] = [];
  for (let lam = 0; lam < n; lam++) {
    const xPlus = [...x];
    const xMinus = [...x];
    xPlus[lam] += eps;
    xMinus[lam] -= eps;
    const gPlus = metric(xPlus);
    const gMinus = metric(xMinus);
    const grad: number[][] = [];
    for (let mu = 0; mu < n; mu++) {
      const row: number[] = [];
      for (let nu = 0; nu < n; nu++) {
        row.push((gPlus[mu][nu] - gMinus[mu][nu]) / (2 * eps));
      }
      grad.push(row);
    }
    dg.push(grad);
  }
  // Inverse metric — small-n closed form fallbacks
  const gInv = invertMetric(g);

  // Γ^ρ_{μν} = (1/2) g^{ρσ}(∂_μ g_{νσ} + ∂_ν g_{μσ} − ∂_σ g_{μν})
  const Gamma: number[][][] = [];
  for (let rho = 0; rho < n; rho++) {
    const Grho: number[][] = [];
    for (let mu = 0; mu < n; mu++) {
      const row: number[] = [];
      for (let nu = 0; nu < n; nu++) {
        let acc = 0;
        for (let sigma = 0; sigma < n; sigma++) {
          acc += 0.5 * gInv[rho][sigma] * (dg[mu][nu][sigma] + dg[nu][mu][sigma] - dg[sigma][mu][nu]);
        }
        row.push(acc);
      }
      Grho.push(row);
    }
    Gamma.push(Grho);
  }
  return Gamma;
}

/** Generic n×n matrix inverse via Gauss-Jordan. Throws if singular. */
export function invertMetric(g: readonly (readonly number[])[]): number[][] {
  const n = g.length;
  const a: number[][] = g.map((row, i) => [...row, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);
  for (let i = 0; i < n; i++) {
    let pivot = a[i][i];
    if (Math.abs(pivot) < 1e-12) {
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(a[k][i]) > 1e-12) {
          [a[i], a[k]] = [a[k], a[i]];
          pivot = a[i][i];
          break;
        }
      }
      if (Math.abs(pivot) < 1e-12) throw new RangeError(`invertMetric: singular metric at row ${i}`);
    }
    for (let j = 0; j < 2 * n; j++) a[i][j] /= pivot;
    for (let k = 0; k < n; k++) {
      if (k !== i) {
        const factor = a[k][i];
        for (let j = 0; j < 2 * n; j++) a[k][j] -= factor * a[i][j];
      }
    }
  }
  return a.map((row) => row.slice(n));
}

/** Parallel-transport step: given a vector V^μ at parameter λ, transport it to λ+dλ along
 *  a curve x(λ) with tangent dx/dλ. dV^μ = -Γ^μ_{αβ} (dx^α/dλ) V^β dλ. Euler integration. */
export function parallelTransportStep(
  V: readonly number[],
  Gamma: readonly (readonly (readonly number[])[])[],
  dxdlambda: readonly number[],
  dlambda: number,
): readonly number[] {
  const n = V.length;
  const result: number[] = new Array(n).fill(0);
  for (let mu = 0; mu < n; mu++) {
    let dV = 0;
    for (let alpha = 0; alpha < n; alpha++) {
      for (let beta = 0; beta < n; beta++) {
        dV -= Gamma[mu][alpha][beta] * dxdlambda[alpha] * V[beta];
      }
    }
    result[mu] = V[mu] + dV * dlambda;
  }
  return result;
}

/** Holonomy on a sphere of radius R: a closed loop enclosing area A rotates a parallel-
 *  transported vector by angle A/R². Closed-form for spherical triangles. */
export function sphericalHolonomyAngle(enclosedArea: number, R: number): number {
  return enclosedArea / (R * R);
}

/** Spherical metric on (θ, φ): g = diag(R², R² sin²θ). */
export function sphericalMetric(R: number): (x: readonly number[]) => readonly (readonly number[])[] {
  return (x) => {
    const theta = x[0];
    return [
      [R * R, 0],
      [0, R * R * Math.sin(theta) * Math.sin(theta)],
    ];
  };
}
