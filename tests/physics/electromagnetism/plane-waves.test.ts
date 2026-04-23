import { describe, expect, it } from "vitest";
import {
  isTransverse,
  jonesVector,
  planeWaveAtPoint,
  polarizationState,
  poyntingVector,
} from "@/lib/physics/electromagnetism/plane-waves";
import { cross, type Vec3 } from "@/lib/physics/electromagnetism/lorentz";
import { MU_0, SPEED_OF_LIGHT } from "@/lib/physics/constants";

const X: Vec3 = { x: 1, y: 0, z: 0 };
const ORIGIN: Vec3 = { x: 0, y: 0, z: 0 };

describe("planeWaveAtPoint", () => {
  it("reduces to E₀ at (r = 0, t = 0, phase = 0)", () => {
    const E0: Vec3 = { x: 0, y: 1, z: 0 };
    const k: Vec3 = { x: 1, y: 0, z: 0 };
    const E = planeWaveAtPoint(ORIGIN, 0, k, 1, E0, 0);
    expect(E.x).toBeCloseTo(0, 12);
    expect(E.y).toBeCloseTo(1, 12);
    expect(E.z).toBeCloseTo(0, 12);
  });

  it("repeats at integer multiples of λ in space", () => {
    const E0: Vec3 = { x: 0, y: 0.5, z: 0 };
    const kMag = 2.5;
    const k: Vec3 = { x: kMag, y: 0, z: 0 };
    const lambda = (2 * Math.PI) / kMag;
    const r0: Vec3 = { x: 0.3, y: 0, z: 0 };
    const r1: Vec3 = { x: 0.3 + lambda, y: 0, z: 0 };
    const E_a = planeWaveAtPoint(r0, 0, k, 0, E0, 0);
    const E_b = planeWaveAtPoint(r1, 0, k, 0, E0, 0);
    expect(E_b.y).toBeCloseTo(E_a.y, 12);
  });
});

describe("isTransverse — E · k = 0 for any plane wave in vacuum", () => {
  it("any E in the y-z plane is transverse to k = x̂", () => {
    // (a) The core reveal: E ⊥ k for every direction in the yz-plane.
    for (const phi of [0, 0.3, 0.78, 1.2, Math.PI, -0.4]) {
      const E: Vec3 = { x: 0, y: Math.cos(phi), z: Math.sin(phi) };
      expect(isTransverse(X, E)).toBe(true);
    }
  });

  it("rejects a field with a longitudinal (along-k) component", () => {
    const E: Vec3 = { x: 0.5, y: 1, z: 0 }; // 50 % longitudinal
    expect(isTransverse(X, E)).toBe(false);
  });

  it("handles non-axis-aligned k", () => {
    const k: Vec3 = { x: 1, y: 1, z: 0 };
    // Take any vector perpendicular to k, e.g. (1, −1, 0) or ẑ.
    const E: Vec3 = { x: 1, y: -1, z: 0 };
    expect(isTransverse(k, E)).toBe(true);
    const Ez: Vec3 = { x: 0, y: 0, z: 1 };
    expect(isTransverse(k, Ez)).toBe(true);
  });
});

describe("B = k̂ × E / c in vacuum — locked triad", () => {
  it("produces B along ẑ for E along ŷ, k along x̂", () => {
    // k̂ × ŷ = ẑ, so B = ẑ · (E₀/c).
    const E: Vec3 = { x: 0, y: 1, z: 0 };
    const kHat: Vec3 = { x: 1, y: 0, z: 0 };
    const c = SPEED_OF_LIGHT;
    const kHatCrossE = cross(kHat, E);
    const B: Vec3 = {
      x: kHatCrossE.x / c,
      y: kHatCrossE.y / c,
      z: kHatCrossE.z / c,
    };
    expect(B.x).toBeCloseTo(0, 18);
    expect(B.y).toBeCloseTo(0, 18);
    expect(B.z).toBeCloseTo(1 / c, 18);
  });

  it("|B| = |E| / c for any E ⊥ k", () => {
    const kHat: Vec3 = { x: 1, y: 0, z: 0 };
    const c = SPEED_OF_LIGHT;
    for (const phi of [0, 0.7, 1.9, -0.5]) {
      const E: Vec3 = { x: 0, y: 3 * Math.cos(phi), z: 3 * Math.sin(phi) };
      const kxE = cross(kHat, E);
      const B: Vec3 = { x: kxE.x / c, y: kxE.y / c, z: kxE.z / c };
      const Emag = Math.hypot(E.x, E.y, E.z);
      const Bmag = Math.hypot(B.x, B.y, B.z);
      expect(Bmag).toBeCloseTo(Emag / c, 18);
    }
  });
});

describe("Poynting vector points along k̂ for a plane wave in vacuum", () => {
  it("S = E × B / μ₀ is parallel to k̂ when B = k̂ × E / c", () => {
    // (c) Using the paired E, B that satisfy Maxwell's vacuum locking.
    const kHat: Vec3 = { x: 1, y: 0, z: 0 };
    const E: Vec3 = { x: 0, y: 2, z: 0 };
    const c = SPEED_OF_LIGHT;
    const kxE = cross(kHat, E);
    const B: Vec3 = { x: kxE.x / c, y: kxE.y / c, z: kxE.z / c };

    const S = poyntingVector(E, B, MU_0);

    // The y and z components should vanish; the x-component should be
    // strictly positive.
    const Smag = Math.hypot(S.x, S.y, S.z);
    expect(S.x / Smag).toBeCloseTo(1, 12);
    expect(S.y / Smag).toBeCloseTo(0, 12);
    expect(S.z / Smag).toBeCloseTo(0, 12);
    expect(S.x).toBeGreaterThan(0);
  });

  it("S magnitude equals |E|² / (μ₀·c)", () => {
    const kHat: Vec3 = { x: 1, y: 0, z: 0 };
    const E0 = 5;
    const E: Vec3 = { x: 0, y: E0, z: 0 };
    const c = SPEED_OF_LIGHT;
    const kxE = cross(kHat, E);
    const B: Vec3 = { x: kxE.x / c, y: kxE.y / c, z: kxE.z / c };
    const S = poyntingVector(E, B, MU_0);
    const Smag = Math.hypot(S.x, S.y, S.z);
    expect(Smag).toBeCloseTo((E0 * E0) / (MU_0 * c), 8);
  });
});

describe("polarizationState classifier", () => {
  it("phaseDelta = 0 with equal amplitudes → linear", () => {
    expect(
      polarizationState({
        Ex_amplitude: 1,
        Ey_amplitude: 1,
        phaseDelta: 0,
      }),
    ).toBe("linear");
  });

  it("phaseDelta = π is also linear (opposite diagonal)", () => {
    expect(
      polarizationState({
        Ex_amplitude: 1,
        Ey_amplitude: 1,
        phaseDelta: Math.PI,
      }),
    ).toBe("linear");
  });

  it("phaseDelta = π/2 with |Ex| = |Ey| → circular", () => {
    expect(
      polarizationState({
        Ex_amplitude: 1,
        Ey_amplitude: 1,
        phaseDelta: Math.PI / 2,
      }),
    ).toBe("circular");
  });

  it("phaseDelta = −π/2 with |Ex| = |Ey| → circular (opposite handedness)", () => {
    expect(
      polarizationState({
        Ex_amplitude: 1,
        Ey_amplitude: 1,
        phaseDelta: -Math.PI / 2,
      }),
    ).toBe("circular");
  });

  it("phaseDelta = π/2 with unequal amplitudes → elliptical", () => {
    expect(
      polarizationState({
        Ex_amplitude: 2,
        Ey_amplitude: 1,
        phaseDelta: Math.PI / 2,
      }),
    ).toBe("elliptical");
  });

  it("arbitrary phase → elliptical", () => {
    expect(
      polarizationState({
        Ex_amplitude: 1,
        Ey_amplitude: 1,
        phaseDelta: Math.PI / 3,
      }),
    ).toBe("elliptical");
  });

  it("zero Ey amplitude → linear (horizontal)", () => {
    expect(
      polarizationState({
        Ex_amplitude: 1,
        Ey_amplitude: 0,
        phaseDelta: Math.PI / 2, // irrelevant
      }),
    ).toBe("linear");
  });
});

describe("jonesVector round-trip", () => {
  it("circular: (ellipticity = 1, orientation = 0) → equal amplitudes, δ = π/2", () => {
    const { Ex, Ey, phase } = jonesVector(1, 0);
    expect(Ex).toBeCloseTo(Ey, 12);
    expect(phase).toBeCloseTo(Math.PI / 2, 12);

    // And the classifier must agree.
    const state = polarizationState({
      Ex_amplitude: Ex,
      Ey_amplitude: Ey,
      phaseDelta: phase,
    });
    expect(state).toBe("circular");
  });

  it("linear: (ellipticity = 0, orientation = 0) → |Ex| = 1, |Ey| = 0", () => {
    const { Ex, Ey, phase } = jonesVector(0, 0);
    expect(Ex).toBeCloseTo(1, 12);
    expect(Ey).toBeCloseTo(0, 12);
    expect(phase).toBe(0);
    const state = polarizationState({
      Ex_amplitude: Ex,
      Ey_amplitude: Ey,
      phaseDelta: phase,
    });
    expect(state).toBe("linear");
  });

  it("linear rotated 45°: (ellipticity = 0, orientation = π/4) → |Ex| = |Ey|", () => {
    const { Ex, Ey, phase } = jonesVector(0, Math.PI / 4);
    expect(Ex).toBeCloseTo(Math.SQRT1_2, 12);
    expect(Ey).toBeCloseTo(Math.SQRT1_2, 12);
    expect(phase).toBe(0);
    const state = polarizationState({
      Ex_amplitude: Ex,
      Ey_amplitude: Ey,
      phaseDelta: phase,
    });
    expect(state).toBe("linear");
  });

  it("elliptical: (ellipticity = 0.5, orientation = 0) → unequal amps, δ = π/2", () => {
    const { Ex, Ey, phase } = jonesVector(0.5, 0);
    expect(phase).toBeCloseTo(Math.PI / 2, 12);
    expect(Ex).not.toBeCloseTo(Ey, 6);
    const state = polarizationState({
      Ex_amplitude: Ex,
      Ey_amplitude: Ey,
      phaseDelta: phase,
    });
    expect(state).toBe("elliptical");
  });
});
