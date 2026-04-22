import { describe, it, expect } from "vitest";
import {
  D33_QUARTZ,
  D33_PZT,
  directPiezoEffect,
  inversePiezoEffect,
  electricDisplacementInPiezo,
  ferroelectricHysteresis,
  remanentPolarisation,
  sweepHysteresisLoop,
  type HysteresisParams,
} from "@/lib/physics/electromagnetism/piezo";
import { EPSILON_0 } from "@/lib/physics/constants";

describe("directPiezoEffect", () => {
  it("Q/A = d₃₃ · σ — quartz under 1 MPa tension", () => {
    const stress = 1e6; // 1 MPa
    const sigma = directPiezoEffect(stress, D33_QUARTZ);
    expect(sigma).toBeCloseTo(D33_QUARTZ * stress, 24);
    expect(sigma).toBeCloseTo(2.3e-6, 12); // ~2.3 µC/m²
  });

  it("zero stress → zero polarisation", () => {
    expect(directPiezoEffect(0, D33_QUARTZ)).toBe(0);
  });

  it("flips sign with stress (compression vs tension)", () => {
    const stress = 5e5;
    expect(directPiezoEffect(-stress, D33_PZT)).toBeCloseTo(
      -directPiezoEffect(stress, D33_PZT),
      24,
    );
  });

  it("scales linearly: 3× the stress gives 3× the surface charge", () => {
    const base = directPiezoEffect(1e5, D33_PZT);
    expect(directPiezoEffect(3e5, D33_PZT)).toBeCloseTo(3 * base, 24);
  });
});

describe("inversePiezoEffect", () => {
  it("strain = d₃₃ · V / L — 100 V across 1 mm of PZT", () => {
    const V = 100;
    const L = 1e-3; // 1 mm
    const strain = inversePiezoEffect(V, D33_PZT, L);
    // E = 1e5 V/m, strain = 374e-12 * 1e5 = 3.74e-5
    expect(strain).toBeCloseTo(3.74e-5, 12);
  });

  it("zero voltage → zero strain", () => {
    expect(inversePiezoEffect(0, D33_QUARTZ, 1e-3)).toBe(0);
  });

  it("inverse and direct effects share d₃₃ (Maxwell relation)", () => {
    // The same coefficient that maps stress → charge density also maps
    // electric field → strain. Verify by using the value and the units:
    // d₃₃ in C/N is numerically equal to d₃₃ in m/V.
    const E = 1e5; // V/m
    const strain = inversePiezoEffect(E * 1, D33_PZT, 1); // L=1 → V=E
    const stress = 1e5; // Pa, same numerical value
    const sigma = directPiezoEffect(stress, D33_PZT);
    expect(strain).toBeCloseTo(sigma, 24);
  });

  it("rejects non-positive thickness", () => {
    expect(() => inversePiezoEffect(10, D33_QUARTZ, 0)).toThrow();
    expect(() => inversePiezoEffect(10, D33_QUARTZ, -1e-3)).toThrow();
  });
});

describe("electricDisplacementInPiezo", () => {
  it("D = d₃₃·σ + ε·E — both terms add", () => {
    const stress = 1e6;
    const E = 1e4;
    const D = electricDisplacementInPiezo(stress, E, D33_PZT);
    expect(D).toBeCloseTo(D33_PZT * stress + EPSILON_0 * E, 24);
  });

  it("collapses to the direct effect when E = 0", () => {
    const stress = 5e5;
    expect(electricDisplacementInPiezo(stress, 0, D33_QUARTZ)).toBeCloseTo(
      directPiezoEffect(stress, D33_QUARTZ),
      24,
    );
  });

  it("collapses to D = ε·E when stress is zero (ordinary dielectric)", () => {
    const E = 2e4;
    expect(electricDisplacementInPiezo(0, E, D33_PZT)).toBeCloseTo(
      EPSILON_0 * E,
      24,
    );
  });
});

describe("ferroelectricHysteresis", () => {
  const params: HysteresisParams = {
    Esat: 1e6, // 1 MV/m
    Psat: 0.26, // C/m² (BaTiO₃-ish)
    Ecoercive: 1.5e5, // 150 kV/m
  };

  it("starts at +Psat, walks down to E = 0, P stays near +Psat (remanent)", () => {
    // We're on the "down" branch (coming from +Esat).
    let previousE = params.Esat * 1.001;
    let previousP = params.Psat;
    for (let i = 1; i <= 64; i++) {
      const E = params.Esat - (params.Esat * i) / 64;
      previousP = ferroelectricHysteresis(
        E,
        { previousE, previousP },
        params,
      );
      previousE = E;
    }
    // At E = 0 on the down branch, P = remanent
    const Pr = remanentPolarisation(params);
    expect(previousP).toBeCloseTo(Pr, 6);
    // Remanent should be a nontrivial fraction of Psat (strictly positive,
    // strictly less than saturation).
    expect(Pr).toBeGreaterThan(0);
    expect(Pr).toBeLessThan(params.Psat);
  });

  it("crosses zero at E = −Ecoercive on the down branch", () => {
    // Walk from +Esat down through −Ecoercive
    let previousE = params.Esat * 1.001;
    let previousP = params.Psat;
    let crossingE: number | null = null;
    for (let i = 1; i <= 512; i++) {
      const E = params.Esat - (2 * params.Esat * i) / 512;
      const P = ferroelectricHysteresis(
        E,
        { previousE, previousP },
        params,
      );
      if (crossingE === null && previousP > 0 && P <= 0) {
        // Linear interpolation between previousE and E
        const frac = previousP / (previousP - P);
        crossingE = previousE + frac * (E - previousE);
      }
      previousE = E;
      previousP = P;
    }
    expect(crossingE).not.toBeNull();
    expect(crossingE!).toBeCloseTo(-params.Ecoercive, -3); // within 1 kV/m
  });

  it("up branch crosses zero at E = +Ecoercive", () => {
    let previousE = -params.Esat * 1.001;
    let previousP = -params.Psat;
    let crossingE: number | null = null;
    for (let i = 1; i <= 512; i++) {
      const E = -params.Esat + (2 * params.Esat * i) / 512;
      const P = ferroelectricHysteresis(
        E,
        { previousE, previousP },
        params,
      );
      if (crossingE === null && previousP < 0 && P >= 0) {
        const frac = -previousP / (P - previousP);
        crossingE = previousE + frac * (E - previousE);
      }
      previousE = E;
      previousP = P;
    }
    expect(crossingE).not.toBeNull();
    expect(crossingE!).toBeCloseTo(+params.Ecoercive, -3);
  });

  it("loop closes: full sweep returns to starting P at starting E", () => {
    const trace = sweepHysteresisLoop(params, 1024);
    const first = trace[0]!;
    const last = trace[trace.length - 1]!;
    // The triangular sweep starts at E = +Esat and ends at E = +Esat.
    expect(last.E).toBeCloseTo(first.E, 6);
    expect(last.P).toBeCloseTo(first.P, 6);
  });

  it("loop is symmetric under (E, P) → (−E, −P)", () => {
    // Sample on the down branch at +0.5·Ecoercive
    const Edown = 0.5 * params.Ecoercive;
    let pE = params.Esat * 1.001;
    let pP = params.Psat;
    // Walk from +Esat down to Edown
    const N = 256;
    for (let i = 1; i <= N; i++) {
      const E = params.Esat + ((Edown - params.Esat) * i) / N;
      pP = ferroelectricHysteresis(E, { previousE: pE, previousP: pP }, params);
      pE = E;
    }
    const Pdown = pP;

    // Now sample on the up branch at −0.5·Ecoercive
    const Eup = -0.5 * params.Ecoercive;
    let qE = -params.Esat * 1.001;
    let qP = -params.Psat;
    for (let i = 1; i <= N; i++) {
      const E = -params.Esat + ((Eup - -params.Esat) * i) / N;
      qP = ferroelectricHysteresis(E, { previousE: qE, previousP: qP }, params);
      qE = E;
    }
    const Pup = qP;

    expect(Pup).toBeCloseTo(-Pdown, 8);
  });

  it("rejects invalid parameters", () => {
    expect(() =>
      ferroelectricHysteresis(
        0,
        { previousE: 0, previousP: 0 },
        { Esat: 0, Psat: 1, Ecoercive: 0.1 },
      ),
    ).toThrow();
    expect(() =>
      ferroelectricHysteresis(
        0,
        { previousE: 0, previousP: 0 },
        { Esat: 1, Psat: -1, Ecoercive: 0.1 },
      ),
    ).toThrow();
  });
});

describe("remanentPolarisation", () => {
  it("returns a value between 0 and Psat", () => {
    const params: HysteresisParams = {
      Esat: 1e6,
      Psat: 0.3,
      Ecoercive: 1e5,
    };
    const Pr = remanentPolarisation(params);
    expect(Pr).toBeGreaterThan(0);
    expect(Pr).toBeLessThan(params.Psat);
  });

  it("→ 0 as Ecoercive → 0 (no memory)", () => {
    const params: HysteresisParams = {
      Esat: 1e6,
      Psat: 0.3,
      Ecoercive: 0,
    };
    expect(remanentPolarisation(params)).toBe(0);
  });

  it("→ Psat as Ecoercive → Esat (rectangular loop)", () => {
    const params: HysteresisParams = {
      Esat: 1e6,
      Psat: 0.3,
      Ecoercive: 1e6,
    };
    expect(remanentPolarisation(params)).toBeCloseTo(0.99 * 0.3, 6);
  });
});
