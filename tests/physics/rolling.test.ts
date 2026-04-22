import { describe, expect, it } from "vitest";
import {
  rollingKE,
  inclineAcceleration,
  SHAPE_FACTOR,
  requiredStaticFriction,
} from "@/lib/physics/rolling";

describe("rolling", () => {
  it("rollingKE = ½mv² + ½Iω² with v=ωR", () => {
    // Solid sphere: I = (2/5) m R², shapeFactor k = I/(mR²) = 2/5
    // KE_total / KE_linear = 1 + k
    const m = 1, v = 3, R = 0.5;
    const I = (2 / 5) * m * R * R;
    const omega = v / R;
    const expected = 0.5 * m * v * v + 0.5 * I * omega * omega;
    expect(rollingKE(m, I, v, R)).toBeCloseTo(expected, 10);
  });

  it("solid sphere rolls down incline faster than hollow cylinder (same angle)", () => {
    const theta = Math.PI / 6;
    const aSphere = inclineAcceleration(SHAPE_FACTOR.solidSphere, theta);
    const aHollow = inclineAcceleration(SHAPE_FACTOR.hollowCylinder, theta);
    expect(aSphere).toBeGreaterThan(aHollow);
  });

  it("solid sphere incline a = (5/7) g sin θ", () => {
    const g = 9.81;
    const theta = Math.PI / 4;
    const expected = (5 / 7) * g * Math.sin(theta);
    expect(inclineAcceleration(SHAPE_FACTOR.solidSphere, theta)).toBeCloseTo(expected, 6);
  });

  it("SHAPE_FACTOR values match standard moments of inertia", () => {
    expect(SHAPE_FACTOR.solidSphere).toBeCloseTo(2 / 5, 10);
    expect(SHAPE_FACTOR.hollowSphere).toBeCloseTo(2 / 3, 10);
    expect(SHAPE_FACTOR.solidCylinder).toBeCloseTo(1 / 2, 10);
    expect(SHAPE_FACTOR.hollowCylinder).toBeCloseTo(1, 10);
  });

  it("requiredStaticFriction scales with k/(1+k) · tan θ", () => {
    // For a solid sphere (k=2/5) at θ=30°, mu_req = (2/7) tan(30°)
    const mu = requiredStaticFriction(SHAPE_FACTOR.solidSphere, Math.PI / 6);
    expect(mu).toBeCloseTo((2 / 7) * Math.tan(Math.PI / 6), 6);
  });
});
