import { describe, expect, it } from "vitest";
import {
  fresnelRs,
  fresnelRp,
  fresnelTs,
  fresnelTp,
  fresnelAll,
  reflectance,
  transmittanceS,
  transmittanceP,
  brewsterAngle,
  criticalAngle,
} from "@/lib/physics/electromagnetism/fresnel";

const deg = (d: number) => (d * Math.PI) / 180;

describe("Fresnel — normal incidence", () => {
  it("|r_s| = |r_p| at θ = 0, and both negative when n₁ < n₂", () => {
    const rs = fresnelRs(0, 1.0, 1.5);
    const rp = fresnelRp(0, 1.0, 1.5);
    // Same magnitude — at normal incidence the s/p distinction is moot.
    expect(Math.abs(rs)).toBeCloseTo(Math.abs(rp), 10);
    // Convention: sign is negative when entering a denser medium.
    expect(rs).toBeLessThan(0);
    expect(rp).toBeLessThan(0);
    // Magnitude is (n2 − n1)/(n2 + n1) = 0.5/2.5 = 0.2.
    expect(Math.abs(rs)).toBeCloseTo(0.2, 10);
  });

  it("R_s + T_s = 1 at normal incidence (energy conservation)", () => {
    const n1 = 1.0;
    const n2 = 1.5;
    const theta = 0;
    const { ts, thetaT } = fresnelAll(theta, n1, n2);
    const R = reflectance(fresnelRs(theta, n1, n2));
    const T = transmittanceS(ts, n1, n2, theta, thetaT);
    expect(R + T).toBeCloseTo(1, 10);
  });
});

describe("Fresnel — Brewster's angle", () => {
  it("r_p vanishes at θ_B = arctan(n₂/n₁) for air → glass (~56.3°)", () => {
    const n1 = 1.0;
    const n2 = 1.5;
    const thetaB = brewsterAngle(n1, n2);
    expect((thetaB * 180) / Math.PI).toBeCloseTo(56.31, 1);
    const rp = fresnelRp(thetaB, n1, n2);
    expect(rp).toBeCloseTo(0, 8);
  });

  it("r_s is nonzero at Brewster — the reflected beam is purely s-polarised", () => {
    const n1 = 1.0;
    const n2 = 1.5;
    const thetaB = brewsterAngle(n1, n2);
    const rs = fresnelRs(thetaB, n1, n2);
    expect(Math.abs(rs)).toBeGreaterThan(0.1);
  });
});

describe("Fresnel — grazing incidence", () => {
  it("|r_s| and |r_p| both approach 1 at θ → 90° (perfect reflection)", () => {
    const rs = fresnelRs(deg(89.99), 1.0, 1.5);
    const rp = fresnelRp(deg(89.99), 1.0, 1.5);
    // In the Verdet/Hecht sign convention used here, r_s → −1 while
    // r_p → +1 at grazing — same reflectance, opposite phase.
    expect(rs).toBeLessThan(-0.99);
    expect(rp).toBeGreaterThan(0.99);
    // Reflectance — which is |r|² and therefore sign-independent — heads
    // to unity on both channels.
    expect(reflectance(rs)).toBeGreaterThan(0.99);
    expect(reflectance(rp)).toBeGreaterThan(0.99);
  });
});

describe("Fresnel — total internal reflection", () => {
  it("glass → air at 45° (beyond θ_c ≈ 41.8°) signals TIR: |r| = 1, t = 0", () => {
    const n1 = 1.5;
    const n2 = 1.0;
    const thetaC = criticalAngle(n1, n2)!;
    expect((thetaC * 180) / Math.PI).toBeCloseTo(41.81, 1);

    const theta = deg(45);
    expect(theta).toBeGreaterThan(thetaC);

    const rs = fresnelRs(theta, n1, n2);
    const rp = fresnelRp(theta, n1, n2);
    const ts = fresnelTs(theta, n1, n2);
    const tp = fresnelTp(theta, n1, n2);
    // The tracer flags TIR by returning rs = rp = -1 and ts = tp = 0.
    expect(Math.abs(rs)).toBeCloseTo(1, 10);
    expect(Math.abs(rp)).toBeCloseTo(1, 10);
    expect(ts).toBe(0);
    expect(tp).toBe(0);
  });
});

describe("Fresnel — energy conservation across the interface", () => {
  it("R_s + T_s = 1 AND R_p + T_p = 1 at every sub-critical angle", () => {
    const n1 = 1.0;
    const n2 = 1.5;
    for (const degTheta of [10, 25, 42, 56.3, 70, 85]) {
      const theta = deg(degTheta);
      const { rs, rp, ts, tp, thetaT } = fresnelAll(theta, n1, n2);
      const Rs = reflectance(rs);
      const Rp = reflectance(rp);
      const Ts = transmittanceS(ts, n1, n2, theta, thetaT);
      const Tp = transmittanceP(tp, n1, n2, theta, thetaT);
      expect(Rs + Ts).toBeCloseTo(1, 8);
      expect(Rp + Tp).toBeCloseTo(1, 8);
    }
  });
});

describe("Brewster — physicists' quickcheck for water & diamond", () => {
  it("air → water (n = 1.33) gives θ_B ≈ 53.06°", () => {
    const thetaB = (brewsterAngle(1.0, 1.33) * 180) / Math.PI;
    expect(thetaB).toBeCloseTo(53.06, 1);
  });
  it("air → diamond (n = 2.42) gives θ_B ≈ 67.54°", () => {
    const thetaB = (brewsterAngle(1.0, 2.42) * 180) / Math.PI;
    expect(thetaB).toBeCloseTo(67.54, 1);
  });
});
