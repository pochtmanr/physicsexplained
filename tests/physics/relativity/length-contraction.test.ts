import { describe, expect, it } from "vitest";
import {
  contractedLength,
  restLength,
  perpendicularLength,
  muonFrameTraversalTime,
  muonSurvivalFromMuonFrame,
} from "@/lib/physics/relativity/length-contraction";
import { gamma } from "@/lib/physics/relativity/types";
import { muonSurvivalFraction } from "@/lib/physics/relativity/time-dilation";

const C = 2.99792458e8;

describe("contractedLength", () => {
  it("is the identity at β = 0 (rest frame is rest frame)", () => {
    expect(contractedLength(1, 0)).toBeCloseTo(1, 12);
    expect(contractedLength(42.5, 0)).toBeCloseTo(42.5, 12);
  });

  it("equals L0 / γ at β = 0.6 (γ = 1.25)", () => {
    expect(contractedLength(1, 0.6)).toBeCloseTo(0.8, 10);
    expect(contractedLength(10, 0.6)).toBeCloseTo(8, 10);
  });

  it("contracts a 10-km atmosphere to ~1 km at β = 0.995 (γ ≈ 10.01)", () => {
    const L = contractedLength(10_000, 0.995);
    expect(L).toBeCloseTo(10_000 / gamma(0.995), 8);
    expect(L).toBeGreaterThan(998);
    expect(L).toBeLessThan(1000);
  });

  it("throws RangeError at |β| ≥ 1", () => {
    expect(() => contractedLength(1, 1)).toThrow(RangeError);
    expect(() => contractedLength(1, -1.0001)).toThrow(RangeError);
  });
});

describe("restLength", () => {
  it("is the identity at β = 0", () => {
    expect(restLength(7, 0)).toBeCloseTo(7, 12);
  });

  it("inverts contractedLength: rest → contracted → rest is round-trip", () => {
    for (const beta of [0.1, 0.3, 0.6, 0.866, 0.99]) {
      const L0 = 5;
      const Llab = contractedLength(L0, beta);
      expect(restLength(Llab, beta)).toBeCloseTo(L0, 9);
    }
  });
});

describe("contraction is sign-symmetric in β", () => {
  it("β and −β give the same contracted length", () => {
    for (const beta of [0.2, 0.5, 0.9]) {
      expect(contractedLength(3, beta)).toBeCloseTo(
        contractedLength(3, -beta),
        12,
      );
    }
  });
});

describe("perpendicular dimensions are unchanged", () => {
  it("transverse extent is preserved at every β in (-1, 1)", () => {
    for (const beta of [0, 0.3, 0.6, 0.9, -0.5]) {
      expect(perpendicularLength(2.5, beta)).toBe(2.5);
    }
  });
});

describe("muon survival agrees across frames", () => {
  it("muon-frame and lab-frame survival fractions match for atmospheric muons", () => {
    const L0 = 10_000; // 10 km atmosphere in Earth's frame
    const beta = 0.995;
    const tau = 2.2e-6;

    const labFrame = muonSurvivalFraction(L0, beta, tau, C);
    const muonFrame = muonSurvivalFromMuonFrame(L0, beta, tau, C);

    // Both frames must compute the same physical fraction.
    expect(muonFrame).toBeCloseTo(labFrame, 12);
    // And it should be ≈ 0.35 (≈ 1.5 half-lives at the contracted distance).
    expect(muonFrame).toBeGreaterThan(0.34);
    expect(muonFrame).toBeLessThan(0.36);
  });

  it("muon-frame traversal time of contracted 1-km atmosphere ≈ 3.35 μs", () => {
    const L0 = 10_000;
    const beta = 0.995;
    const t = muonFrameTraversalTime(L0, beta, C);
    expect(t).toBeGreaterThan(3.3e-6);
    expect(t).toBeLessThan(3.4e-6);
    // ≈ 1.52 half-lives of 2.2 μs.
    expect(t / 2.2e-6).toBeCloseTo(1.522, 2);
  });
});
