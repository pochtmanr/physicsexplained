import { describe, expect, it } from "vitest";
import {
  fourPotentialFromPhiA,
  gaugeTransformLeavesFInvariant,
  lagrangianDensity,
  lagrangianFieldKineticTerm,
  lorenzGaugeResidual,
  sumFmunuFmunu,
} from "@/lib/physics/electromagnetism/four-potential";
import {
  buildFieldTensor,
  type FourCurrent,
  type FourPotential,
  type Vec4,
} from "@/lib/physics/electromagnetism/relativity";
import {
  EPSILON_0,
  MU_0,
  SPEED_OF_LIGHT,
} from "@/lib/physics/constants";

describe("fourPotentialFromPhiA", () => {
  it("packs (φ, A) into A^μ = (φ/c, A_x, A_y, A_z)", () => {
    const phi = 12; // V
    const A = { x: 1, y: 2, z: 3 }; // Wb/m
    const out = fourPotentialFromPhiA(phi, A);
    expect(out[0]).toBeCloseTo(phi / SPEED_OF_LIGHT, 12);
    expect(out[1]).toBe(1);
    expect(out[2]).toBe(2);
    expect(out[3]).toBe(3);
  });

  it("zero φ and zero A gives the zero four-vector", () => {
    const out = fourPotentialFromPhiA(0, { x: 0, y: 0, z: 0 });
    expect(out[0]).toBe(0);
    expect(out[1]).toBe(0);
    expect(out[2]).toBe(0);
    expect(out[3]).toBe(0);
  });
});

describe("lorenzGaugeResidual", () => {
  it("is exactly zero when (1/c²)·∂φ/∂t + ∇·A = 0", () => {
    // Construct an explicit balanced pair: divA = +5, dPhi/dt/c² = −5.
    const r = lorenzGaugeResidual(5, -5);
    expect(r).toBe(0);
  });

  it("is the sum of its two arguments otherwise", () => {
    expect(lorenzGaugeResidual(2, 3)).toBeCloseTo(5, 12);
    expect(lorenzGaugeResidual(-1, 4)).toBeCloseTo(3, 12);
  });
});

describe("sumFmunuFmunu", () => {
  it("gives 2(|B|² − |E|²/c²) for arbitrary E, B (Lorentz invariant)", () => {
    const E = { x: 1e3, y: 0, z: 0 };
    const B = { x: 0, y: 0, z: 1e-5 };
    const F = buildFieldTensor(E, B);
    const s = sumFmunuFmunu(F);
    const c = SPEED_OF_LIGHT;
    const E2 = E.x * E.x + E.y * E.y + E.z * E.z;
    const B2 = B.x * B.x + B.y * B.y + B.z * B.z;
    const expected = 2 * (B2 - E2 / (c * c));
    expect(s).toBeCloseTo(expected, 18);
  });

  it("vanishes for a free wave with |E| = c|B|, E ⊥ B", () => {
    const Bmag = 1e-6;
    const Emag = SPEED_OF_LIGHT * Bmag;
    // E along x̂, B along ŷ — wave propagating along ẑ
    const E = { x: Emag, y: 0, z: 0 };
    const B = { x: 0, y: Bmag, z: 0 };
    const F = buildFieldTensor(E, B);
    const s = sumFmunuFmunu(F);
    // |E|²/c² = Bmag² and |B|² = Bmag², so the invariant is 2(B² − B²) = 0.
    expect(Math.abs(s)).toBeLessThan(1e-20);
  });
});

describe("lagrangianDensity", () => {
  it("returns 0 for E = 0, B = 0, J = 0", () => {
    const F = buildFieldTensor({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 });
    const A: FourPotential = [0, 0, 0, 0];
    const J: FourCurrent = [0, 0, 0, 0];
    expect(lagrangianDensity(F, A, J)).toBeCloseTo(0, 18);
  });

  it("static Coulomb-only field reduces to (ε₀/2)|E|² (J = 0)", () => {
    // Pure E in x̂, no B, no source.
    const E = { x: 1e3, y: 0, z: 0 };
    const B = { x: 0, y: 0, z: 0 };
    const F = buildFieldTensor(E, B);
    const A: FourPotential = [0, 0, 0, 0];
    const J: FourCurrent = [0, 0, 0, 0];
    const L = lagrangianDensity(F, A, J);
    // L_field = − (1/4 μ₀) · 2(|B|² − |E|²/c²) = (1/2 μ₀ c²) |E|² = (ε₀/2)|E|².
    const expected = (EPSILON_0 / 2) * (E.x * E.x);
    expect(L).toBeCloseTo(expected, 6);
    // Cross-check via μ₀c² identity: (1/(2μ₀c²))|E|² = (ε₀/2)|E|².
    const alt = (1 / (2 * MU_0 * SPEED_OF_LIGHT * SPEED_OF_LIGHT)) *
      (E.x * E.x);
    expect(L).toBeCloseTo(alt, 6);
  });

  it("free wave (|E| = c|B|, E ⊥ B) has near-zero kinetic term", () => {
    const Bmag = 1e-6;
    const Emag = SPEED_OF_LIGHT * Bmag;
    const E = { x: Emag, y: 0, z: 0 };
    const B = { x: 0, y: Bmag, z: 0 };
    const F = buildFieldTensor(E, B);
    const J: FourCurrent = [0, 0, 0, 0];
    const A: FourPotential = [0, 0, 0, 0];
    const L = lagrangianDensity(F, A, J);
    // |L| should be tiny relative to either of (1/μ₀)|B|² or ε₀|E|² alone.
    const scale = (Bmag * Bmag) / MU_0;
    expect(Math.abs(L) / scale).toBeLessThan(1e-12);
  });

  it("source-coupling: φρ − A⃗·J⃗ shifts L predictably (linear in J)", () => {
    const F = buildFieldTensor({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 });
    const phi = 5; // V
    const Avec = { x: 0.1, y: 0.2, z: 0.3 }; // Wb/m
    const A = fourPotentialFromPhiA(phi, Avec);
    const rho = 1e-3; // C/m³
    const Jvec = { x: 0.4, y: -0.5, z: 0.6 }; // A/m²
    const J: FourCurrent = [
      SPEED_OF_LIGHT * rho,
      Jvec.x,
      Jvec.y,
      Jvec.z,
    ];
    const L = lagrangianDensity(F, A, J);
    // L = −(A·J), with field part zero.
    // A·J = (φ/c)(cρ) − A⃗·J⃗ = φρ − A⃗·J⃗.
    const expectedAdotJ =
      phi * rho - (Avec.x * Jvec.x + Avec.y * Jvec.y + Avec.z * Jvec.z);
    expect(L).toBeCloseTo(-expectedAdotJ, 12);
  });
});

describe("lagrangianFieldKineticTerm", () => {
  it("is exactly the field part — equals L when J = 0, A = 0", () => {
    const E = { x: 2e3, y: 1e3, z: 0 };
    const B = { x: 0, y: 1e-5, z: -2e-5 };
    const F = buildFieldTensor(E, B);
    const k = lagrangianFieldKineticTerm(F);
    const A: FourPotential = [0, 0, 0, 0];
    const J: FourCurrent = [0, 0, 0, 0];
    expect(lagrangianDensity(F, A, J)).toBeCloseTo(k, 18);
  });
});

describe("gaugeTransformLeavesFInvariant", () => {
  it("F^{μν} is invariant under A_μ → A_μ + ∂_μΛ (closed-form result)", () => {
    const phi = 10;
    const A = fourPotentialFromPhiA(phi, { x: 1, y: 2, z: 3 });
    const lambdaGradient: Vec4 = [0.5, 0.1, -0.2, 0.3];
    const E = { x: 1e3, y: 0, z: 0 };
    const B = { x: 0, y: 1e-5, z: 0 };
    const F = buildFieldTensor(E, B);
    const r = gaugeTransformLeavesFInvariant(A, lambdaGradient, F);
    expect(r.sameField).toBe(true);
    // A actually shifted in all components.
    expect(r.Aafter[0]).not.toBe(A[0]);
  });

  it("zero gradient leaves A unchanged (sanity)", () => {
    const A = fourPotentialFromPhiA(7, { x: 1, y: 1, z: 1 });
    const F = buildFieldTensor(
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 0, z: 0 },
    );
    const r = gaugeTransformLeavesFInvariant(A, [0, 0, 0, 0], F);
    expect(r.Aafter[0]).toBeCloseTo(A[0], 12);
    expect(r.Aafter[1]).toBeCloseTo(A[1], 12);
    expect(r.Aafter[2]).toBeCloseTo(A[2], 12);
    expect(r.Aafter[3]).toBeCloseTo(A[3], 12);
    expect(r.sameField).toBe(true);
  });
});
