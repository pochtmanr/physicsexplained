import { describe, expect, it } from "vitest";
import {
  lorentzInvariantEDotB,
  lorentzInvariantE2MinusC2B2,
  transformInvariantsCheck,
  classifyEMField,
} from "@/lib/physics/electromagnetism/em-lorentz-transform";
import {
  transformFields,
  gamma,
} from "@/lib/physics/electromagnetism/relativity";
import { SPEED_OF_LIGHT } from "@/lib/physics/constants";

const C = SPEED_OF_LIGHT;

// Relative-tolerance comparator: |a - b| ≤ rel · max(|a|, |b|, atol).
function relClose(a: number, b: number, rel = 1e-6, atol = 1e-30): boolean {
  const scale = Math.max(Math.abs(a), Math.abs(b), atol);
  return Math.abs(a - b) <= rel * scale;
}

describe("lorentzInvariantEDotB", () => {
  it("zero for orthogonal E and B", () => {
    expect(
      lorentzInvariantEDotB({ x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }),
    ).toBeCloseTo(0, 12);
  });

  it("sum of component products on a known example", () => {
    const E = { x: 2, y: 3, z: 5 };
    const B = { x: 7, y: 11, z: 13 };
    // 2*7 + 3*11 + 5*13 = 14 + 33 + 65 = 112
    expect(lorentzInvariantEDotB(E, B)).toBe(112);
  });

  it("scales linearly in each argument", () => {
    const E = { x: 1, y: 2, z: 3 };
    const B = { x: 4, y: 5, z: 6 };
    const v0 = lorentzInvariantEDotB(E, B);
    const Es = { x: 2, y: 4, z: 6 };
    expect(lorentzInvariantEDotB(Es, B)).toBeCloseTo(2 * v0, 10);
  });
});

describe("lorentzInvariantE2MinusC2B2", () => {
  it("returns |E|² alone when B = 0", () => {
    const E = { x: 0, y: 1e3, z: 0 };
    const B = { x: 0, y: 0, z: 0 };
    expect(lorentzInvariantE2MinusC2B2(E, B)).toBeCloseTo(1e6, 6);
  });

  it("returns −c²|B|² alone when E = 0", () => {
    const E = { x: 0, y: 0, z: 0 };
    const B = { x: 0, y: 0, z: 1e-5 };
    const expected = -C * C * 1e-10;
    expect(lorentzInvariantE2MinusC2B2(E, B)).toBeCloseTo(expected, 6);
  });

  it("EM-wave: E ⊥ B with |E| = c|B| gives I₂ = 0", () => {
    // Plane wave: |E| = c|B|, so |E|² − c²|B|² = 0 exactly.
    const Bmag = 1e-9;
    const E = { x: 0, y: C * Bmag, z: 0 };
    const B = { x: 0, y: 0, z: Bmag };
    expect(Math.abs(lorentzInvariantE2MinusC2B2(E, B))).toBeLessThan(1e-12);
  });
});

describe("INVARIANCE under Lorentz boost", () => {
  it("preserves both invariants for a generic config at β = 0.5", () => {
    const E = { x: 0, y: 1e3, z: 0 };
    const B = { x: 0, y: 0, z: 1e-5 };
    const beta = 0.5;
    const r = transformInvariantsCheck(E, B, beta);
    expect(relClose(r.invariant1Lab, r.invariant1Boost, 1e-6)).toBe(true);
    expect(relClose(r.invariant2Lab, r.invariant2Boost, 1e-6)).toBe(true);
  });

  it("preserves both invariants on a fully 3D non-orthogonal config", () => {
    const E = { x: 1.2e3, y: -7.4e2, z: 5.1e2 };
    const B = { x: 3e-5, y: 8e-6, z: -1.4e-5 };
    for (const beta of [-0.9, -0.4, 0.1, 0.6, 0.85]) {
      const r = transformInvariantsCheck(E, B, beta);
      expect(relClose(r.invariant1Lab, r.invariant1Boost, 1e-6)).toBe(true);
      expect(relClose(r.invariant2Lab, r.invariant2Boost, 1e-6)).toBe(true);
    }
  });
});

describe("Pure-E lab → mixed E', B' boosted", () => {
  it("B'_z = -γβ E_y / c when boost is along +x and only E_y is present", () => {
    const Ey = 1e3;
    const E = { x: 0, y: Ey, z: 0 };
    const B = { x: 0, y: 0, z: 0 };
    const beta = 0.5;
    const g = gamma(beta);
    const { B: Bp } = transformFields(E, B, beta);

    // Closed form: B'_z = γ(B_z − v E_y / c²) = -γ v E_y / c² = -γβ E_y / c.
    const expected = (-g * beta * Ey) / C;
    expect(relClose(Bp.z, expected, 1e-12)).toBe(true);
    expect(Bp.z).not.toBe(0);
  });

  it("E·B = 0 in lab → E'·B' = 0 in boosted frame (preserves I₁ = 0)", () => {
    const E = { x: 0, y: 1e3, z: 0 };
    const B = { x: 0, y: 0, z: 0 };
    const r = transformInvariantsCheck(E, B, 0.7);
    // I₁ stays zero through the boost.
    expect(Math.abs(r.invariant1Boost)).toBeLessThan(1e-9);
  });
});

describe("classifyEMField", () => {
  it("classifies a pure-E lab field as electric-like", () => {
    const E = { x: 0, y: 1e3, z: 0 };
    const B = { x: 0, y: 0, z: 0 };
    expect(classifyEMField(E, B)).toBe("electric-like");
  });

  it("classifies a pure-B lab field as magnetic-like", () => {
    const E = { x: 0, y: 0, z: 0 };
    const B = { x: 0, y: 0, z: 1e-5 };
    expect(classifyEMField(E, B)).toBe("magnetic-like");
  });

  it("classifies E ∦ B as mixed", () => {
    const E = { x: 1, y: 1, z: 0 };
    const B = { x: 1, y: 0, z: 0 };
    expect(classifyEMField(E, B)).toBe("mixed");
  });
});
