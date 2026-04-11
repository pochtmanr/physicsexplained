import { describe, it, expect } from "vitest";
import { integrate } from "@/lib/physics/ode";

describe("ode.integrate", () => {
  it("solves dy/dt = y (exponential growth) to high accuracy", () => {
    // dy/dt = y, y(0) = 1 => y(t) = e^t
    const samples = integrate({
      y0: [1],
      rhs: (_t, y) => [y[0]],
      tEnd: 1,
      nSamples: 11,
    });

    expect(samples.length).toBe(11);
    const last = samples[samples.length - 1]!;
    expect(last.t).toBeCloseTo(1, 10);
    expect(last.y[0]).toBeCloseTo(Math.E, 6);
  });

  it("solves simple harmonic oscillator and preserves energy", () => {
    // y = [x, v], dx/dt = v, dv/dt = -x  (omega = 1, period = 2pi)
    // x(0)=1, v(0)=0 => x(t)=cos(t), v(t)=-sin(t)
    const samples = integrate({
      y0: [1, 0],
      rhs: (_t, y) => [y[1], -y[0]],
      tEnd: 2 * Math.PI,
      nSamples: 101,
    });

    const last = samples[samples.length - 1]!;
    expect(last.t).toBeCloseTo(2 * Math.PI, 10);
    expect(last.y[0]).toBeCloseTo(1, 6);   // back to x=1
    expect(last.y[1]).toBeCloseTo(0, 6);   // back to v=0
  });
});
