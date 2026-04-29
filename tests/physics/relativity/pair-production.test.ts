import { describe, expect, it } from "vitest";
import {
  pairProductionThresholdLeadingOrder,
  singlePhotonPairProductionAllowed,
  thresholdHeadOnAtRestTarget,
} from "@/lib/physics/relativity/pair-production";
import { SPEED_OF_LIGHT, ELECTRON_MASS } from "@/lib/physics/constants";

describe("pairProductionThresholdLeadingOrder", () => {
  it("equals exactly 2 * ELECTRON_MASS * SPEED_OF_LIGHT² in SI", () => {
    const expected = 2 * ELECTRON_MASS * SPEED_OF_LIGHT * SPEED_OF_LIGHT;
    expect(pairProductionThresholdLeadingOrder()).toBeCloseTo(expected, 20);
  });

  it("is approximately 1.637e-13 J (≈ 1.022 MeV)", () => {
    const val = pairProductionThresholdLeadingOrder();
    // 1.022 MeV × 1.602e-13 J/MeV ≈ 1.637e-13 J
    expect(val).toBeGreaterThan(1.636e-13);
    expect(val).toBeLessThan(1.638e-13);
  });

  it("is positive", () => {
    expect(pairProductionThresholdLeadingOrder()).toBeGreaterThan(0);
  });

  it("accepts custom c and me (natural units c=1, me=0.511)", () => {
    // In units where c = 1 and m_e = 0.511 MeV/c², threshold = 1.022 MeV
    const val = pairProductionThresholdLeadingOrder(1, 0.511);
    expect(val).toBeCloseTo(1.022, 10);
  });
});

describe("singlePhotonPairProductionAllowed", () => {
  it("always returns false — forbidden by four-momentum conservation", () => {
    expect(singlePhotonPairProductionAllowed()).toBe(false);
  });

  it("returns a boolean (not undefined or null)", () => {
    expect(typeof singlePhotonPairProductionAllowed()).toBe("boolean");
  });
});

describe("thresholdHeadOnAtRestTarget", () => {
  it("M=4, m1=m2=1 in natural units (c=1) gives exactly 7", () => {
    // E_th = (M² − m1² − m2²)c² / (2 m2) = (16 − 1 − 1) / 2 = 7
    const val = thresholdHeadOnAtRestTarget(4, 1, 1, 1);
    expect(val).toBeCloseTo(7, 12);
  });

  it("throws RangeError when M < m1 + m2", () => {
    expect(() => thresholdHeadOnAtRestTarget(1, 1, 1, 1)).toThrow(RangeError);
    expect(() => thresholdHeadOnAtRestTarget(1.5, 1, 1, 1)).toThrow(RangeError);
  });

  it("is positive when M > m1 + m2", () => {
    const val = thresholdHeadOnAtRestTarget(3, 1, 1, 1);
    expect(val).toBeGreaterThan(0);
  });

  it("M = m1 + m2 is the boundary (should be >= 0 — no energy cost)", () => {
    // (M² − m1² − m2²) / (2 m2) = ((m1+m2)² − m1² − m2²) / (2 m2) = 2 m1 m2 / (2 m2) = m1
    // E_th = m1 c² — the moving particle must supply its own rest energy + overlap
    const val = thresholdHeadOnAtRestTarget(2, 1, 1, 1);
    expect(val).toBeCloseTo(1, 12);
  });

  it("reproduces leading-order pair production for photon + heavy nucleus, c=1 natural units", () => {
    // γ + nucleus → e⁺ + e⁻ + nucleus
    // m1 = 0 (photon), m2 = M_N (nucleus), M = M_N + 2 m_e
    // E_th ≈ 2 m_e c² to leading order in m_e / M_N
    const me = 0.511; // MeV/c²
    const MN = 938.3; // proton mass in MeV/c² as nucleus proxy
    const M = MN + 2 * me;
    const val = thresholdHeadOnAtRestTarget(M, 0, MN, 1);
    // Leading order: 2 * 0.511 = 1.022 MeV; correction ≈ 2 * me² / MN ≈ 0.000558 MeV
    expect(val).toBeGreaterThan(1.022);
    expect(val).toBeLessThan(1.024);
  });
});
