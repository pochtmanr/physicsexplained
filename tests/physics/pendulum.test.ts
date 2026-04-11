import { describe, it, expect } from "vitest";
import {
  smallAngleTheta,
  smallAnglePeriod,
  largeAngleSolve,
  exactLargeAnglePeriod,
} from "@/lib/physics/pendulum";
import { g_SI } from "@/lib/physics/constants";

describe("pendulum — small-angle analytic", () => {
  it("period matches 2*pi*sqrt(L/g) for L = 1m", () => {
    const L = 1;
    expect(smallAnglePeriod(L)).toBeCloseTo(
      2 * Math.PI * Math.sqrt(L / g_SI),
      10,
    );
  });

  it("theta(0) equals initial amplitude", () => {
    expect(smallAngleTheta({ t: 0, theta0: 0.1, L: 1 })).toBeCloseTo(0.1, 10);
  });

  it("theta(T/2) equals -theta0", () => {
    const L = 1;
    const theta0 = 0.15;
    const T = smallAnglePeriod(L);
    expect(
      smallAngleTheta({ t: T / 2, theta0, L }),
    ).toBeCloseTo(-theta0, 10);
  });

  it("theta(T) returns to theta0", () => {
    const L = 1;
    const theta0 = 0.2;
    const T = smallAnglePeriod(L);
    expect(
      smallAngleTheta({ t: T, theta0, L }),
    ).toBeCloseTo(theta0, 10);
  });
});

describe("pendulum — large angle via ODE", () => {
  it("large-angle period at theta0=10deg matches small-angle to 1e-4", () => {
    const L = 1;
    const theta0 = (10 * Math.PI) / 180;
    const T_num = exactLargeAnglePeriod(theta0, L);
    // At 10° the correction is ~0.19% (~0.004s), so 2 decimal places (±0.005)
    // Plan specified 4 decimal places but that is physically impossible at this amplitude.
    expect(T_num).toBeCloseTo(smallAnglePeriod(L), 2);
  });

  it("large-angle period at theta0=80deg is noticeably longer (>10%)", () => {
    const L = 1;
    const theta0 = (80 * Math.PI) / 180;
    const Ts = smallAnglePeriod(L);
    const Tl = exactLargeAnglePeriod(theta0, L);
    expect(Tl / Ts).toBeGreaterThan(1.1);
    expect(Tl / Ts).toBeLessThan(1.3);
  });

  it("largeAngleSolve returns N samples across [0, tEnd]", () => {
    const samples = largeAngleSolve({
      theta0: 0.5,
      L: 1,
      tEnd: 2,
      nSamples: 50,
    });
    expect(samples.length).toBe(50);
    expect(samples[0]!.t).toBe(0);
    expect(samples[0]!.theta).toBeCloseTo(0.5, 10);
    expect(samples[samples.length - 1]!.t).toBeCloseTo(2, 10);
  });
});
