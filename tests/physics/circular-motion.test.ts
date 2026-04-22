// tests/physics/circular-motion.test.ts
import { describe, expect, it } from "vitest";
import {
  centripetalAccel,
  angularFromPeriod,
  orbitalVelocity,
} from "@/lib/physics/circular-motion";

describe("circular-motion", () => {
  it("centripetalAccel = v^2 / r", () => {
    expect(centripetalAccel(10, 2)).toBeCloseTo(50, 6);
  });

  it("angularFromPeriod(T) = 2π/T", () => {
    expect(angularFromPeriod(1)).toBeCloseTo(2 * Math.PI, 6);
  });

  it("orbitalVelocity gives v such that v^2/r = GM/r^2", () => {
    const GM = 3.986e14; // Earth
    const r = 6.771e6;   // LEO radius
    const v = orbitalVelocity(r, GM);
    expect(v).toBeCloseTo(Math.sqrt(GM / r), 0);
    // Sanity: centripetal a == g at LEO
    expect(centripetalAccel(v, r)).toBeCloseTo(GM / (r * r), 3);
  });
});
