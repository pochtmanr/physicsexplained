import { describe, expect, it } from "vitest";
import {
  malusLaw,
  brewsterAngleDeg,
  waveplatePhaseShift,
  birefringenceSplit,
  threePolariserTransmission,
} from "@/lib/physics/electromagnetism/polarization-optics";

describe("Malus's law — I = I₀ cos²θ", () => {
  it("passes all the light at θ = 0° and extinguishes it at θ = 90°", () => {
    expect(malusLaw(1, 0)).toBeCloseTo(1, 12);
    expect(malusLaw(1, 90)).toBeCloseTo(0, 12);
  });

  it("halves the intensity at θ = 45° (cos²45° = 1/2)", () => {
    expect(malusLaw(1, 45)).toBeCloseTo(0.5, 12);
    expect(malusLaw(8, 45)).toBeCloseTo(4, 12);
  });

  it("is even in θ — Malus(+θ) == Malus(−θ)", () => {
    for (const angle of [10, 30, 55, 80]) {
      expect(malusLaw(1, angle)).toBeCloseTo(malusLaw(1, -angle), 12);
    }
  });

  it("rejects negative I₀ with a clear error", () => {
    expect(() => malusLaw(-1, 0)).toThrow(/must be ≥ 0/);
  });
});

describe("Brewster's angle — θ_B = arctan(n₂/n₁)", () => {
  it("air → crown glass (n = 1.5) gives θ_B ≈ 56.31°", () => {
    expect(brewsterAngleDeg(1.0, 1.5)).toBeCloseTo(56.31, 2);
  });

  it("air → water (n = 1.33) gives θ_B ≈ 53.06°", () => {
    expect(brewsterAngleDeg(1.0, 1.33)).toBeCloseTo(53.06, 2);
  });

  it("glass → air inverts: θ_B ≈ 33.69° (complementary to air → glass)", () => {
    const fwd = brewsterAngleDeg(1.0, 1.5);
    const back = brewsterAngleDeg(1.5, 1.0);
    expect(fwd + back).toBeCloseTo(90, 6);
    expect(back).toBeCloseTo(33.69, 2);
  });

  it("rejects non-positive indices", () => {
    expect(() => brewsterAngleDeg(0, 1.5)).toThrow();
    expect(() => brewsterAngleDeg(1.0, -1)).toThrow();
  });
});

describe("Birefringence — calcite splits a single ray into two", () => {
  const N_O = 1.658;
  const N_E = 1.486;
  const THICKNESS_MM = 1.0; // millimetre

  it("splits a 1 mm calcite slab by 0.1–0.2 mm at moderate incidence", () => {
    // At θ = 60°, the ray is well clear of normal incidence and the split
    // is clearly visible by eye — on the order of a tenth of a mm for a
    // one-mm-thick slab.
    const dx = Math.abs(birefringenceSplit(N_O, N_E, THICKNESS_MM, 60));
    expect(dx).toBeGreaterThan(0.08);
    expect(dx).toBeLessThan(0.20);
  });

  it("gives zero split at normal incidence (θ = 0°)", () => {
    expect(birefringenceSplit(N_O, N_E, THICKNESS_MM, 0)).toBeCloseTo(0, 12);
  });

  it("split grows with incidence angle", () => {
    const d30 = Math.abs(birefringenceSplit(N_O, N_E, THICKNESS_MM, 30));
    const d60 = Math.abs(birefringenceSplit(N_O, N_E, THICKNESS_MM, 60));
    const d75 = Math.abs(birefringenceSplit(N_O, N_E, THICKNESS_MM, 75));
    expect(d30).toBeLessThan(d60);
    expect(d60).toBeLessThan(d75);
  });

  it("vanishes when n_o = n_e (no birefringence → one ray)", () => {
    expect(birefringenceSplit(1.5, 1.5, THICKNESS_MM, 45)).toBeCloseTo(0, 12);
  });
});

describe("Waveplate — retardation Δφ = (2π/λ)·Δn·d", () => {
  it("quarter-wave plate for quartz (Δn ≈ 0.009) at λ = 550 nm: d ≈ 15.3 µm", () => {
    // Solve Δφ = π/2 for d.
    const lambda = 550e-9; // m
    const dn = 0.009;
    const d = lambda / (4 * dn);
    // Sanity: the closed-form answer is ~15.28 µm.
    expect(d * 1e6).toBeCloseTo(15.28, 1);
    const phi = waveplatePhaseShift(d, 1.553, 1.544, lambda);
    // n_e − n_o = 0.009 → same Δn, so Δφ = π/2 exactly.
    expect(phi).toBeCloseTo(Math.PI / 2, 6);
  });

  it("half-wave plate has Δφ = π (twice the quarter-wave thickness)", () => {
    const lambda = 550e-9;
    const d = lambda / (2 * 0.009); // ≈ 30.56 µm
    const phi = waveplatePhaseShift(d, 1.553, 1.544, lambda);
    expect(phi).toBeCloseTo(Math.PI, 6);
  });

  it("sign of Δφ tracks sign of (n_e − n_o)", () => {
    // Negative uniaxial crystal (calcite-like) — n_e < n_o → Δφ < 0.
    const lambda = 589e-9;
    const phi = waveplatePhaseShift(1e-6, 1.486, 1.658, lambda);
    expect(phi).toBeLessThan(0);
  });
});

describe("Three-polariser trick — crossed pair blocks, but inserting 45° lets I₀/8 through", () => {
  it("two crossed polarisers extinguish unpolarised light completely", () => {
    // Unpolarised light passing a first polariser has intensity I₀/2
    // and is linearly polarised along that polariser's axis. A second
    // polariser at 90° transmits (I₀/2)·cos²(90°) = 0.
    const I0 = 1;
    const afterP1 = I0 / 2;
    const afterP2 = malusLaw(afterP1, 90);
    expect(afterP2).toBeCloseTo(0, 12);
  });

  it("inserting a third polariser at 45° between crossed pair gives I₀/8", () => {
    const I0 = 1;
    const afterP1 = I0 / 2;          // unpolarised → polarised, intensity halved
    const afterP45 = malusLaw(afterP1, 45); // cos²45° = 1/2 → I₀/4
    const afterP90 = malusLaw(afterP45, 45); // another 45° rotation → I₀/8
    expect(afterP45).toBeCloseTo(I0 / 4, 12);
    expect(afterP90).toBeCloseTo(I0 / 8, 12);
  });

  it("threePolariserTransmission: endpoints 0° and 90° block everything, peak at 45° is 1/8", () => {
    // Crossed-pair endpoints — the middle polariser is parallel to one of
    // the outer ones, so one of the two Malus projections yields zero.
    expect(threePolariserTransmission(0)).toBeCloseTo(0, 12);
    expect(threePolariserTransmission(90)).toBeCloseTo(0, 12);
    // The famous 1/8 peak at 45°.
    expect(threePolariserTransmission(45)).toBeCloseTo(1 / 8, 12);
    // Symmetric about 45°: T(30°) == T(60°).
    expect(threePolariserTransmission(30)).toBeCloseTo(
      threePolariserTransmission(60),
      12,
    );
    // Never exceeds 1/8 (analytic peak of ⅛·sin²(2θ)).
    for (let a = 0; a <= 90; a += 5) {
      expect(threePolariserTransmission(a)).toBeLessThanOrEqual(1 / 8 + 1e-12);
    }
  });
});
