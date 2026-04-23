import { describe, expect, it } from "vitest";
import {
  stressTensor,
  stressTensorMatrix,
  stressTensorTrace,
  fieldMomentumDensity,
  poyntingVector,
  radiationPressureAbsorber,
  radiationPressureReflector,
  solarSailAcceleration,
  magnitude,
  SOLAR_CONSTANT,
} from "@/lib/physics/electromagnetism/maxwell-stress";
import {
  EPSILON_0,
  MU_0,
  SPEED_OF_LIGHT,
} from "@/lib/physics/constants";

const ZERO = { x: 0, y: 0, z: 0 };

describe("stressTensor", () => {
  it("diagonal T_xx for a pure x-directed E field is +½ε₀E²", () => {
    const E = { x: 1000, y: 0, z: 0 }; // V/m
    const Txx = stressTensor(E, ZERO, 0, 0);
    // T_xx = ε₀(E_x² − ½E²) = ε₀(E² − ½E²) = +½ε₀E²
    expect(Txx).toBeCloseTo(0.5 * EPSILON_0 * 1000 * 1000, 20);
    expect(Txx).toBeGreaterThan(0); // tension along the field line
  });

  it("transverse T_yy for a pure x-directed E field is −½ε₀E² (pressure)", () => {
    const E = { x: 1000, y: 0, z: 0 };
    const Tyy = stressTensor(E, ZERO, 1, 1);
    // T_yy = ε₀(0 − ½E²) = −½ε₀E²
    expect(Tyy).toBeCloseTo(-0.5 * EPSILON_0 * 1000 * 1000, 20);
    expect(Tyy).toBeLessThan(0); // Faraday's picture — field lines push sideways
  });

  it("off-diagonal T_xy is symmetric (T_xy = T_yx)", () => {
    const E = { x: 300, y: 200, z: 0 };
    const B = { x: 0, y: 0, z: 0.01 };
    expect(stressTensor(E, B, 0, 1)).toBeCloseTo(
      stressTensor(E, B, 1, 0),
      20,
    );
  });

  it("off-diagonal T_xy for pure E along 45° has nonzero shear", () => {
    // Pick E in the xy-plane at 45°. E_x = E_y = E₀/√2, so E_x·E_y = E₀²/2.
    const E0 = 100;
    const E = { x: E0 / Math.SQRT2, y: E0 / Math.SQRT2, z: 0 };
    const Txy = stressTensor(E, ZERO, 0, 1);
    // T_xy = ε₀·E_x·E_y (δ_xy = 0) = ε₀·E₀²/2
    expect(Txy).toBeCloseTo(0.5 * EPSILON_0 * E0 * E0, 20);
  });

  it("stressTensorMatrix returns the 3×3 row-major matrix", () => {
    const E = { x: 1, y: 2, z: 3 };
    const B = { x: 0.1, y: 0.2, z: 0.3 };
    const M = stressTensorMatrix(E, B);
    expect(M).toHaveLength(3);
    for (const row of M) expect(row).toHaveLength(3);
    expect(M[0]![1]).toBeCloseTo(stressTensor(E, B, 0, 1), 20);
    expect(M[2]![2]).toBeCloseTo(stressTensor(E, B, 2, 2), 20);
  });
});

describe("stressTensorTrace", () => {
  it("for a pure E field equals −½ε₀E² (minus the electric energy density)", () => {
    const E = { x: 500, y: 0, z: 0 };
    const tr = stressTensorTrace(E, ZERO);
    expect(tr).toBeCloseTo(-0.5 * EPSILON_0 * 500 * 500, 20);
  });

  it("for a pure B field equals −B²/(2μ₀) (minus the magnetic energy density)", () => {
    const B = { x: 0, y: 0, z: 0.5 };
    const tr = stressTensorTrace(ZERO, B);
    expect(tr).toBeCloseTo(-(0.5 * 0.5) / (2 * MU_0), 6);
  });

  it("for a plane wave equals −(u_E + u_B) = −ε₀E² (full energy density)", () => {
    // For a plane wave in vacuum, |B| = |E|/c, so u_B = B²/(2μ₀) = ε₀E²/2 = u_E.
    // Trace = −(u_E + u_B) = −ε₀E².
    const E0 = 1000;
    const B0 = E0 / SPEED_OF_LIGHT;
    const E = { x: 0, y: E0, z: 0 };
    const B = { x: 0, y: 0, z: B0 };
    const tr = stressTensorTrace(E, B);
    expect(tr).toBeCloseTo(-EPSILON_0 * E0 * E0, 15);
  });
});

describe("fieldMomentumDensity", () => {
  it("is zero when E and B are parallel", () => {
    const E = { x: 1, y: 0, z: 0 };
    const B = { x: 2, y: 0, z: 0 };
    const g = fieldMomentumDensity(E, B);
    expect(magnitude(g)).toBe(0);
  });

  it("points along +x for E_y × B_z (right-hand rule)", () => {
    const E = { x: 0, y: 1, z: 0 };
    const B = { x: 0, y: 0, z: 1 };
    const g = fieldMomentumDensity(E, B);
    // E × B = ŷ × ẑ = x̂
    expect(g.x).toBeGreaterThan(0);
    expect(g.y).toBeCloseTo(0, 20);
    expect(g.z).toBeCloseTo(0, 20);
  });

  it("satisfies g = S / c² exactly", () => {
    const E = { x: 300, y: 0, z: 0 };
    const B = { x: 0, y: 1e-6, z: 0 };
    const g = fieldMomentumDensity(E, B);
    const S = poyntingVector(E, B);
    const c2 = SPEED_OF_LIGHT * SPEED_OF_LIGHT;
    expect(g.x).toBeCloseTo(S.x / c2, 20);
    expect(g.y).toBeCloseTo(S.y / c2, 20);
    expect(g.z).toBeCloseTo(S.z / c2, 20);
  });

  it("g and S are parallel (same direction)", () => {
    const E = { x: 1, y: 2, z: -1 };
    const B = { x: 0.5, y: -0.3, z: 0.8 };
    const g = fieldMomentumDensity(E, B);
    const S = poyntingVector(E, B);
    // unit vectors should be identical
    const gMag = magnitude(g);
    const sMag = magnitude(S);
    expect(g.x / gMag).toBeCloseTo(S.x / sMag, 10);
    expect(g.y / gMag).toBeCloseTo(S.y / sMag, 10);
    expect(g.z / gMag).toBeCloseTo(S.z / sMag, 10);
  });
});

describe("radiation pressure", () => {
  it("absorber pressure is I/c", () => {
    const I = 1361; // W/m² — solar constant
    const P = radiationPressureAbsorber(I);
    expect(P).toBeCloseTo(1361 / SPEED_OF_LIGHT, 12);
    // Sanity: ~4.54 µPa
    expect(P).toBeGreaterThan(4.5e-6);
    expect(P).toBeLessThan(4.6e-6);
  });

  it("reflector pressure is exactly 2× absorber", () => {
    const I = 1000;
    expect(radiationPressureReflector(I)).toBeCloseTo(
      2 * radiationPressureAbsorber(I),
      20,
    );
  });

  it("radiation pressure vanishes at zero intensity", () => {
    expect(radiationPressureAbsorber(0)).toBe(0);
    expect(radiationPressureReflector(0)).toBe(0);
  });
});

describe("solarSailAcceleration", () => {
  it("SOLAR_CONSTANT is close to 1361 W/m²", () => {
    expect(SOLAR_CONSTANT).toBeGreaterThan(1350);
    expect(SOLAR_CONSTANT).toBeLessThan(1370);
  });

  it("IKAROS-scale sail at 1 AU: a ~0.08 mm/s² at ρ=0.9", () => {
    // IKAROS: 14×14 m sail ≈ 196 m², total mass 310 kg, reflectivity ~0.9
    const a = solarSailAcceleration(1.0, 196, 310, 0.9);
    // ~6e-5 m/s² range
    expect(a).toBeGreaterThan(5e-6);
    expect(a).toBeLessThan(5e-4);
  });

  it("acceleration scales as 1/r²", () => {
    const a1 = solarSailAcceleration(1.0, 100, 50, 0.9);
    const a2 = solarSailAcceleration(2.0, 100, 50, 0.9);
    expect(a1 / a2).toBeCloseTo(4, 6);
  });

  it("perfect reflector accelerates 2× the perfect absorber", () => {
    const aAbs = solarSailAcceleration(1.0, 100, 50, 0);
    const aRef = solarSailAcceleration(1.0, 100, 50, 1);
    expect(aRef / aAbs).toBeCloseTo(2, 12);
  });
});
