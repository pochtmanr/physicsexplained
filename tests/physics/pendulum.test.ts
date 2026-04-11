import { describe, it, expect } from "vitest";
import {
  smallAngleTheta,
  smallAnglePeriod,
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
