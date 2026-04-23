import { describe, expect, it } from "vitest";
import {
  poyntingVector,
  poyntingMagnitude,
  fieldEnergyDensity,
  planeWaveIntensity,
  planeWaveB0,
  ohmicDissipation,
  coaxAxialPoynting,
  coaxTransportedPower,
} from "@/lib/physics/electromagnetism/poynting";
import {
  EPSILON_0,
  MU_0,
  SPEED_OF_LIGHT,
} from "@/lib/physics/constants";

describe("poyntingVector", () => {
  it("is zero when E and B are parallel", () => {
    const E = { x: 3, y: 0, z: 0 };
    const B = { x: 2, y: 0, z: 0 };
    const S = poyntingVector(E, B);
    expect(S.x).toBeCloseTo(0, 12);
    expect(S.y).toBeCloseTo(0, 12);
    expect(S.z).toBeCloseTo(0, 12);
  });

  it("points along +ẑ when E = x̂·E and B = ŷ·B (right-hand rule)", () => {
    const E = { x: 5, y: 0, z: 0 };
    const B = { x: 0, y: 2, z: 0 };
    const S = poyntingVector(E, B);
    expect(S.x).toBeCloseTo(0, 12);
    expect(S.y).toBeCloseTo(0, 12);
    expect(S.z).toBeCloseTo((5 * 2) / MU_0, 6);
    expect(S.z).toBeGreaterThan(0);
  });

  it("reverses sign when E and B swap (antisymmetry of the cross product)", () => {
    const E = { x: 1, y: 0, z: 0 };
    const B = { x: 0, y: 1, z: 0 };
    const a = poyntingVector(E, B);
    const b = poyntingVector(B, E);
    expect(b.x).toBeCloseTo(-a.x, 12);
    expect(b.y).toBeCloseTo(-a.y, 12);
    expect(b.z).toBeCloseTo(-a.z, 12);
  });
});

describe("poyntingMagnitude", () => {
  it("equals |E|·|B|/μ₀ when E and B are orthogonal", () => {
    const E = { x: 4, y: 0, z: 0 };
    const B = { x: 0, y: 3, z: 0 };
    // |E||B|/μ₀ = 12/μ₀
    expect(poyntingMagnitude(E, B)).toBeCloseTo(12 / MU_0, 6);
  });

  it("is zero when either field is zero", () => {
    const zero = { x: 0, y: 0, z: 0 };
    const B = { x: 0, y: 0.5, z: 0 };
    expect(poyntingMagnitude(zero, B)).toBeCloseTo(0, 12);
    expect(poyntingMagnitude(B, zero)).toBeCloseTo(0, 12);
  });
});

describe("fieldEnergyDensity", () => {
  it("reduces to ½ε₀E² when B = 0", () => {
    const E = { x: 1000, y: 0, z: 0 };
    const B = { x: 0, y: 0, z: 0 };
    expect(fieldEnergyDensity(E, B)).toBeCloseTo(
      0.5 * EPSILON_0 * 1e6,
      12,
    );
  });

  it("reduces to B²/(2μ₀) when E = 0", () => {
    const E = { x: 0, y: 0, z: 0 };
    const B = { x: 0, y: 1, z: 0 };
    expect(fieldEnergyDensity(E, B)).toBeCloseTo(1 / (2 * MU_0), 6);
  });

  it("sums the electric and magnetic reservoirs", () => {
    const E = { x: 1, y: 0, z: 0 };
    const B = { x: 0, y: 1, z: 0 };
    const expected = 0.5 * EPSILON_0 + 1 / (2 * MU_0);
    expect(fieldEnergyDensity(E, B)).toBeCloseTo(expected, 12);
  });
});

describe("planeWaveIntensity", () => {
  it("is ½ E₀² / (μ₀ c)", () => {
    const E0 = 1000;
    expect(planeWaveIntensity(E0)).toBeCloseTo(
      (E0 * E0) / (2 * MU_0 * SPEED_OF_LIGHT),
      6,
    );
  });

  it("quadruples when E₀ doubles", () => {
    const a = planeWaveIntensity(100);
    const b = planeWaveIntensity(200);
    expect(b / a).toBeCloseTo(4, 10);
  });

  it("at E₀ ≈ 1 kV/m lands near the solar constant's order of magnitude", () => {
    // Earth's solar constant ≈ 1361 W/m². A plane wave with E₀ = 1 kV/m
    // has intensity ~ 1.33 kW/m². Same ballpark — sunlight *is* this thing.
    const I = planeWaveIntensity(1000);
    expect(I).toBeGreaterThan(1000);
    expect(I).toBeLessThan(2000);
  });
});

describe("planeWaveB0", () => {
  it("matches the vacuum ratio E₀ / c", () => {
    expect(planeWaveB0(3e6)).toBeCloseTo(3e6 / SPEED_OF_LIGHT, 12);
  });

  it("scales linearly with E₀", () => {
    expect(planeWaveB0(2) / planeWaveB0(1)).toBeCloseTo(2, 12);
  });
});

describe("ohmicDissipation", () => {
  it("is the dot product J · E", () => {
    const J = { x: 2, y: 0, z: 0 };
    const E = { x: 3, y: 0, z: 0 };
    expect(ohmicDissipation(J, E)).toBeCloseTo(6, 12);
  });

  it("is zero when J is perpendicular to E (no net work on carriers)", () => {
    const J = { x: 1, y: 0, z: 0 };
    const E = { x: 0, y: 1, z: 0 };
    expect(ohmicDissipation(J, E)).toBeCloseTo(0, 12);
  });
});

describe("coaxAxialPoynting", () => {
  it("throws on invalid geometry", () => {
    expect(() => coaxAxialPoynting(1, 1, 0, 1, 0.5)).toThrow();
    expect(() => coaxAxialPoynting(1, 1, 1, 1, 1)).toThrow();
    expect(() => coaxAxialPoynting(1, 1, 1, 2, 0.5)).toThrow();
  });

  it("integrates over the annular gap to recover V·I", () => {
    const V = 12; // volts
    const I = 3; // amps
    const a = 1e-3;
    const b = 5e-3;
    // Numerical integration: ∫_a^b 2π r · S_z(r) dr should equal V·I.
    let total = 0;
    const N = 2000;
    const dr = (b - a) / N;
    for (let k = 0; k < N; k++) {
      const r = a + (k + 0.5) * dr;
      total += 2 * Math.PI * r * coaxAxialPoynting(V, I, a, b, r) * dr;
    }
    expect(total).toBeCloseTo(V * I, 4);
  });

  it("falls off as 1/r² inside the gap", () => {
    const V = 10;
    const I = 1;
    const a = 1e-3;
    const b = 1e-2;
    const r1 = 2e-3;
    const r2 = 4e-3;
    const s1 = coaxAxialPoynting(V, I, a, b, r1);
    const s2 = coaxAxialPoynting(V, I, a, b, r2);
    // doubling r → quarter flux
    expect(s1 / s2).toBeCloseTo(4, 6);
  });
});

describe("coaxTransportedPower", () => {
  it("returns V · I", () => {
    expect(coaxTransportedPower(12, 3)).toBeCloseTo(36, 12);
  });
});
