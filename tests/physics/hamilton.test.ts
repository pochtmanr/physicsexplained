import { describe, it, expect } from "vitest";
import {
  circularOrbitInitial,
  ellipticOrbitInitial,
  eulerStep,
  integrateOrbit,
  keplerAngularMomentum,
  keplerEnergy,
  leapfrogStep,
} from "@/lib/physics/hamilton";

describe("hamilton — Kepler energy and angular momentum", () => {
  it("circular orbit at r=1 has energy −0.5 and L = 1", () => {
    const s = circularOrbitInitial(1);
    expect(keplerEnergy(s)).toBeCloseTo(-0.5, 12);
    expect(keplerAngularMomentum(s)).toBeCloseTo(1, 12);
  });

  it("elliptic orbit at periapsis has H = −1/(2a) regardless of e", () => {
    for (const e of [0.1, 0.3, 0.5, 0.7]) {
      const a = 1;
      const s = ellipticOrbitInitial(a, e);
      expect(keplerEnergy(s)).toBeCloseTo(-1 / (2 * a), 10);
    }
  });
});

describe("hamilton — leapfrog is symplectic, Euler is not", () => {
  it("leapfrog conserves energy over 20 orbits to < 1e-3", () => {
    const s0 = circularOrbitInitial(1);
    const E0 = keplerEnergy(s0);
    // One circular orbit at r=1 has period 2π. 20 orbits × 200 steps = 4000.
    const dt = (2 * Math.PI * 20) / 4000;
    const samples = integrateOrbit("leapfrog", s0, dt, 4000);
    const Efinal = keplerEnergy(samples[samples.length - 1]!.state);
    expect(Math.abs(Efinal - E0)).toBeLessThan(1e-3);
  });

  it("Euler drifts in energy over the same span by orders of magnitude more", () => {
    const s0 = circularOrbitInitial(1);
    const E0 = keplerEnergy(s0);
    const dt = (2 * Math.PI * 20) / 4000;
    const samplesE = integrateOrbit("euler", s0, dt, 4000);
    const samplesL = integrateOrbit("leapfrog", s0, dt, 4000);
    const driftE = Math.abs(keplerEnergy(samplesE[samplesE.length - 1]!.state) - E0);
    const driftL = Math.abs(keplerEnergy(samplesL[samplesL.length - 1]!.state) - E0);
    // Euler drifts outward → E grows toward 0 → positive, non-trivial drift.
    expect(driftE).toBeGreaterThan(0.01);
    // And leapfrog must beat Euler by at least two orders of magnitude.
    expect(driftE / Math.max(driftL, 1e-12)).toBeGreaterThan(100);
  });

  it("leapfrog conserves angular momentum exactly (to ~1e-12) for circular orbit", () => {
    // Angular momentum is an exact invariant of the leapfrog scheme for
    // central-force problems in 2D, up to floating-point error.
    const s0 = circularOrbitInitial(1);
    const L0 = keplerAngularMomentum(s0);
    const dt = 0.01;
    let s = s0;
    for (let i = 0; i < 1000; i++) s = leapfrogStep(s, dt);
    expect(Math.abs(keplerAngularMomentum(s) - L0)).toBeLessThan(1e-10);
  });

  it("a single Euler step from a circular orbit raises r slightly", () => {
    const s0 = circularOrbitInitial(1);
    const s1 = eulerStep(s0, 0.01);
    const r1 = Math.sqrt(s1.q[0] ** 2 + s1.q[1] ** 2);
    // Euler's forward extrapolation pushes the planet off the circle outward.
    expect(r1).toBeGreaterThan(1);
  });
});
