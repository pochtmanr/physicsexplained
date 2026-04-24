import { describe, expect, it } from "vitest";
import {
  dipoleAngularIntensity,
  dipoleFarFieldE,
  dipoleNearFieldE,
  dipoleTotalPower,
  transitionRadius,
} from "@/lib/physics/electromagnetism/dipole-radiation";
import { MU_0, SPEED_OF_LIGHT } from "@/lib/physics/constants";

describe("dipoleTotalPower — Larmor-for-dipoles", () => {
  it("matches the closed form μ₀ p₀² ω⁴ / (12π c)", () => {
    const p0 = 1e-20; // C·m — molecular-scale dipole
    const omega = 2 * Math.PI * 1e14; // rad/s — visible-light frequency
    const expected =
      (MU_0 * p0 * p0 * omega * omega * omega * omega) /
      (12 * Math.PI * SPEED_OF_LIGHT);
    const got = dipoleTotalPower(p0, omega);
    expect(Math.abs(got - expected) / expected).toBeLessThan(1e-12);
  });

  it("scales as ω⁴ (Rayleigh law — why the sky is blue)", () => {
    const p0 = 1e-20;
    const omega1 = 1e14;
    const omega2 = 2 * omega1;
    const P1 = dipoleTotalPower(p0, omega1);
    const P2 = dipoleTotalPower(p0, omega2);
    // Doubling ω multiplies power by 2⁴ = 16.
    expect(P2 / P1).toBeCloseTo(16, 10);
  });
});

describe("dipoleAngularIntensity — doughnut pattern", () => {
  it("integrates over the full sphere to recover the total power", () => {
    const p0 = 3.2e-20;
    const omega = 7.5e13;

    // Numerically integrate ∫₀^π ∫₀^{2π} (dP/dΩ) sin θ dθ dφ.
    // The azimuthal integral contributes 2π trivially (no φ dependence).
    const N = 2000;
    const dTheta = Math.PI / N;
    let sum = 0;
    for (let i = 0; i < N; i++) {
      const theta = (i + 0.5) * dTheta;
      const dPdO = dipoleAngularIntensity(p0, omega, theta);
      sum += dPdO * Math.sin(theta) * dTheta;
    }
    const integrated = sum * 2 * Math.PI;
    const expected = dipoleTotalPower(p0, omega);
    // Midpoint rule at N=2000 — should be within 1e-6 relative.
    expect(Math.abs(integrated - expected) / expected).toBeLessThan(1e-6);
  });

  it("peaks broadside (θ = π/2) and vanishes along the axis (θ = 0, π)", () => {
    const p0 = 1e-20;
    const omega = 1e14;
    const Iaxis0 = dipoleAngularIntensity(p0, omega, 0);
    const IaxisPi = dipoleAngularIntensity(p0, omega, Math.PI);
    const Ibroad = dipoleAngularIntensity(p0, omega, Math.PI / 2);
    expect(Iaxis0).toBeCloseTo(0, 30);
    expect(IaxisPi).toBeCloseTo(0, 30);
    expect(Ibroad).toBeGreaterThan(0);
    // Peak-to-null ratio is unbounded; just sanity-check it's large.
    expect(Ibroad).toBeGreaterThan(1e20 * Math.max(Iaxis0, IaxisPi) + 1e-100);
  });
});

describe("dipoleFarFieldE — sin θ transverse amplitude", () => {
  it("peaks broadside and is zero on the dipole axis at fixed phase", () => {
    const p0 = 1e-20;
    const omega = 1e14;
    const r = 1; // 1 m — comfortably in the far zone for ω = 1e14
    const tRet = 0; // cos(ω · (tRet − r/c)) is then fixed
    const Eaxis0 = dipoleFarFieldE(p0, omega, r, 0, tRet);
    const EaxisPi = dipoleFarFieldE(p0, omega, r, Math.PI, tRet);
    const Ebroad = dipoleFarFieldE(p0, omega, r, Math.PI / 2, tRet);
    // sin(0) = 0 exactly; sin(π) leaks a tiny float remainder.
    expect(Math.abs(Ebroad)).toBeGreaterThan(0);
    expect(Math.abs(Eaxis0)).toBeLessThan(1e-6 * Math.abs(Ebroad));
    expect(Math.abs(EaxisPi)).toBeLessThan(1e-6 * Math.abs(Ebroad));
  });

  it("falls off as 1/r at fixed θ, tRet", () => {
    const p0 = 1e-20;
    const omega = 1e14;
    const theta = Math.PI / 2;
    // Pick a retarded time where cos(ω (tRet - r/c)) = 1 at BOTH radii.
    // Easiest: choose r₂ = r₁ + λ so the phase shift is 2π. Then cos is the same.
    const lambda = (2 * Math.PI * SPEED_OF_LIGHT) / omega;
    const r1 = 10 * lambda;
    const r2 = r1 + lambda;
    const tRet1 = r1 / SPEED_OF_LIGHT; // makes cos(ω(tRet - r/c)) = cos(0) = 1
    const tRet2 = r2 / SPEED_OF_LIGHT;
    const E1 = dipoleFarFieldE(p0, omega, r1, theta, tRet1);
    const E2 = dipoleFarFieldE(p0, omega, r2, theta, tRet2);
    // |E₁| · r₁ should equal |E₂| · r₂ (1/r scaling).
    expect(Math.abs(Math.abs(E1) * r1 - Math.abs(E2) * r2)).toBeLessThan(
      1e-12 * Math.abs(E1) * r1,
    );
  });
});

describe("dipoleNearFieldE — quasi-static 1/r³ dipole pattern", () => {
  it("falls off as 1/r³ at fixed θ, tRet", () => {
    const p0 = 1e-20;
    const omega = 1e14;
    const theta = Math.PI / 4;
    const tRet = 0; // cos(ω·0) = 1
    const r1 = 1e-9; // 1 nm — well inside transition radius ~3 μm
    const r2 = 2 * r1;
    const n1 = dipoleNearFieldE(p0, omega, r1, theta, tRet);
    const n2 = dipoleNearFieldE(p0, omega, r2, theta, tRet);
    // (r₁³ · E₁) should equal (r₂³ · E₂).
    const scaleR = r1 * r1 * r1 / (r2 * r2 * r2);
    expect(n2.Er / n1.Er).toBeCloseTo(scaleR, 10);
    expect(n2.Etheta / n1.Etheta).toBeCloseTo(scaleR, 10);
  });

  it("radial component dominates on axis, transverse dominates broadside", () => {
    const p0 = 1e-20;
    const omega = 1e14;
    const r = 1e-9;
    const tRet = 0;
    const onAxis = dipoleNearFieldE(p0, omega, r, 0, tRet);
    const broadside = dipoleNearFieldE(p0, omega, r, Math.PI / 2, tRet);
    // On-axis (θ=0): E_r = 2k p/r³, E_θ = 0 exactly (sin 0 = 0).
    expect(onAxis.Etheta).toBe(0);
    expect(onAxis.Er).not.toBe(0);
    // Broadside (θ=π/2): E_r = 0 (cos π/2 is near-zero in float), E_θ = k p/r³.
    expect(Math.abs(broadside.Er)).toBeLessThan(
      1e-6 * Math.abs(broadside.Etheta),
    );
    // E_θ broadside = k p / r³ = ½ · (on-axis E_r) in magnitude.
    expect(Math.abs(broadside.Etheta)).toBeCloseTo(
      Math.abs(onAxis.Er) / 2,
      10,
    );
  });
});

describe("transitionRadius — where near meets far", () => {
  it("satisfies ω · r_transition = c exactly", () => {
    for (const omega of [1e5, 1e10, 2 * Math.PI * 1e9, 7.2e13]) {
      const rt = transitionRadius(omega);
      expect(Math.abs(omega * rt - SPEED_OF_LIGHT)).toBeLessThan(
        1e-12 * SPEED_OF_LIGHT,
      );
    }
  });

  it("returns λ/(2π) — one radian of wavefront propagation", () => {
    const omega = 2 * Math.PI * 1e9; // 1 GHz
    const lambda = (2 * Math.PI * SPEED_OF_LIGHT) / omega;
    const rt = transitionRadius(omega);
    expect(rt).toBeCloseTo(lambda / (2 * Math.PI), 12);
  });
});
