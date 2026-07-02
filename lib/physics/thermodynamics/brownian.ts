/**
 * FIG.18 BROWNIAN MOTION — pure-TS helpers for the diffusion scenes.
 *
 * Robert Brown, 1827, watched pollen grains jitter in water and could not say
 * why. Einstein, 1905, explained it: the grain is bombarded from all sides by
 * invisible water molecules, and the imbalance from instant to instant kicks it
 * on a random walk. The mean-square displacement grows *linearly* in time —
 *
 *   ⟨x²⟩ = 2 D t            (one Cartesian axis)
 *   ⟨r²⟩ = ⟨x²⟩ + ⟨y²⟩ = 4 D t   (the full 2D displacement)
 *
 * — with the diffusion coefficient set by temperature and drag through the
 * Einstein–Stokes relation D = k_B T / (6πηr). Perrin, 1908, measured ⟨r²⟩ for
 * resin spheres, read off D, and inverted the relation to get k_B — and hence
 * Avogadro's number — independently of every other method. That measurement
 * ended the debate over whether atoms were real.
 *
 * Reuses the seeded generators in `./random`. SI units: T in kelvin, η in Pa·s,
 * r in metres, D in m²/s. React-free, typed.
 */

import { gaussian, type Rng } from "./random";

/** Boltzmann constant, J/K (exact since the 2019 SI). */
export const K_B = 1.380649e-23;

/**
 * Einstein–Stokes diffusion coefficient of a sphere of radius r in a fluid of
 * viscosity η at temperature T:  D = k_B T / (6πηr)  [m²/s].
 */
export function einsteinStokesD(T: number, eta: number, r: number): number {
  return (K_B * T) / (6 * Math.PI * eta * r);
}

/**
 * Perrin's inversion: recover Boltzmann's constant from a *measured* diffusion
 * coefficient, given the (independently known) temperature, viscosity, and bead
 * radius.  k_B = 6πηr D / T. Avogadro's number then follows as R/k_B.
 */
export function kBFromD(D: number, T: number, eta: number, r: number): number {
  return (6 * Math.PI * eta * r * D) / T;
}

/**
 * Diffusion coefficient implied by a random walk whose per-step displacement on
 * each axis is Gaussian with standard deviation `stepStd`, taken every `dt`.
 *
 * After n steps the per-axis variance is n·stepStd², i.e. ⟨x²⟩ = n·stepStd².
 * Matching ⟨x²⟩ = 2 D t with t = n·dt gives D = stepStd² / (2 dt).
 */
export function diffusionFromStep(stepStd: number, dt = 1): number {
  return (stepStd * stepStd) / (2 * dt);
}

/** A single random kick: independent Gaussian displacement on each axis. */
export function gaussianStep2D(
  rng: Rng,
  stepStd: number,
): { dx: number; dy: number } {
  return { dx: gaussian(rng) * stepStd, dy: gaussian(rng) * stepStd };
}

/** A trajectory: parallel arrays of x and y positions, length steps + 1. */
export interface Walk2D {
  xs: number[];
  ys: number[];
}

/**
 * Simulate one 2D random walk of `steps` Gaussian kicks of size `stepStd`,
 * starting at the origin. Returns the full trajectory (steps + 1 points).
 */
export function simulateWalk2D(rng: Rng, steps: number, stepStd: number): Walk2D {
  const xs = [0];
  const ys = [0];
  let x = 0;
  let y = 0;
  for (let i = 0; i < steps; i++) {
    const { dx, dy } = gaussianStep2D(rng, stepStd);
    x += dx;
    y += dy;
    xs.push(x);
    ys.push(y);
  }
  return { xs, ys };
}

/**
 * Ensemble mean-square displacement ⟨r²⟩ at each step index, averaged over
 * `walkers` independent walks of `steps` kicks of size `stepStd`. Index k holds
 * ⟨r²⟩ after k steps; it should grow linearly as ⟨r²⟩ = 4 D (k·dt). Returns an
 * array of length steps + 1 (index 0 is exactly 0).
 */
export function ensembleMSD(
  rng: Rng,
  walkers: number,
  steps: number,
  stepStd: number,
): number[] {
  const sumSq = new Array(steps + 1).fill(0);
  for (let w = 0; w < walkers; w++) {
    let x = 0;
    let y = 0;
    for (let i = 1; i <= steps; i++) {
      const { dx, dy } = gaussianStep2D(rng, stepStd);
      x += dx;
      y += dy;
      sumSq[i] += x * x + y * y;
    }
  }
  return sumSq.map((s) => s / walkers);
}
