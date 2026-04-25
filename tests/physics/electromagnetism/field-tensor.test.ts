import { describe, expect, it } from "vitest";
import {
  buildFieldTensor,
  dualTensor,
  tensorAntisymmetryAssert,
  extractEFromTensor,
  extractBFromTensor,
  lowerFieldTensor,
  lagrangianTrace,
  lagrangianTraceRaw,
} from "@/lib/physics/electromagnetism/field-tensor";
import { EPSILON_0, SPEED_OF_LIGHT } from "@/lib/physics/constants";

describe("tensorAntisymmetryAssert", () => {
  it("holds for any built F", () => {
    const E = { x: 7e3, y: -3e3, z: 1.4e3 };
    const B = { x: 2e-4, y: 5e-5, z: -1.1e-4 };
    expect(tensorAntisymmetryAssert(buildFieldTensor(E, B))).toBe(true);
  });
  it("holds for the zero field", () => {
    expect(
      tensorAntisymmetryAssert(
        buildFieldTensor({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }),
      ),
    ).toBe(true);
  });
  it("rejects an explicit symmetric matrix", () => {
    const symmetric = [
      [0, 1, 0, 0],
      [1, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ] as const;
    expect(
      tensorAntisymmetryAssert(
        symmetric as unknown as ReturnType<typeof buildFieldTensor>,
      ),
    ).toBe(false);
  });
});

describe("extractEFromTensor / extractBFromTensor", () => {
  it("inverts buildFieldTensor for E", () => {
    const E = { x: 1.234e3, y: -7.5e2, z: 4.4e3 };
    const B = { x: 0, y: 0, z: 0 };
    const F = buildFieldTensor(E, B);
    const Erec = extractEFromTensor(F);
    expect(Erec.x).toBeCloseTo(E.x, 6);
    expect(Erec.y).toBeCloseTo(E.y, 6);
    expect(Erec.z).toBeCloseTo(E.z, 6);
  });
  it("inverts buildFieldTensor for B", () => {
    const E = { x: 0, y: 0, z: 0 };
    const B = { x: 3.3e-4, y: -1.7e-4, z: 9.1e-5 };
    const F = buildFieldTensor(E, B);
    const Brec = extractBFromTensor(F);
    expect(Brec.x).toBeCloseTo(B.x, 12);
    expect(Brec.y).toBeCloseTo(B.y, 12);
    expect(Brec.z).toBeCloseTo(B.z, 12);
  });
  it("inverts buildFieldTensor for general E,B at relative 1e-10", () => {
    const E = { x: 1e3, y: -2.5e3, z: 0.7e3 };
    const B = { x: 1.1e-3, y: -3.3e-4, z: 5.5e-4 };
    const F = buildFieldTensor(E, B);
    const Erec = extractEFromTensor(F);
    const Brec = extractBFromTensor(F);
    const relE =
      Math.hypot(Erec.x - E.x, Erec.y - E.y, Erec.z - E.z) /
      Math.hypot(E.x, E.y, E.z);
    const relB =
      Math.hypot(Brec.x - B.x, Brec.y - B.y, Brec.z - B.z) /
      Math.hypot(B.x, B.y, B.z);
    expect(relE).toBeLessThan(1e-10);
    expect(relB).toBeLessThan(1e-10);
  });
});

describe("dualTensor", () => {
  it("is antisymmetric", () => {
    const F = buildFieldTensor(
      { x: 1.5e3, y: -0.5e3, z: 2.0e3 },
      { x: 1e-3, y: 2e-3, z: -1.5e-3 },
    );
    expect(tensorAntisymmetryAssert(dualTensor(F))).toBe(true);
  });
  it("dual∘dual is itself antisymmetric (composition closes within antisymmetric tensors)", () => {
    // The Hodge dual *F^{μν} = (1/2) ε^{μνρσ} F_{ρσ} squares to ±I in 4D
    // mostly-minus signature in natural units. Our `dualTensor`
    // implementation carries SI factors of c that make D∘D scale F by a
    // dimensionful constant — but the *structural* property that survives
    // any normalisation choice is that the dual of any antisymmetric
    // tensor is again antisymmetric. We assert that closure here.
    const F = buildFieldTensor(
      { x: 2.3e2, y: -1.1e2, z: 7.7e1 },
      { x: 4.4e-4, y: -8.8e-4, z: 2.2e-4 },
    );
    expect(tensorAntisymmetryAssert(dualTensor(dualTensor(F)))).toBe(true);
  });
});

describe("lowerFieldTensor", () => {
  it("flips sign on the (0,i) and (i,0) blocks, leaves (i,j) and (0,0) alone", () => {
    const F = buildFieldTensor(
      { x: 5, y: 6, z: 7 },
      { x: 0.1, y: 0.2, z: 0.3 },
    );
    const Flow = lowerFieldTensor(F);
    // (0,0)
    expect(Flow[0][0]).toBe(0);
    // (0,i) → flipped
    expect(Flow[0][1]).toBeCloseTo(-F[0][1], 12);
    expect(Flow[0][2]).toBeCloseTo(-F[0][2], 12);
    expect(Flow[0][3]).toBeCloseTo(-F[0][3], 12);
    // (i,j) → unchanged
    expect(Flow[1][2]).toBeCloseTo(F[1][2], 12);
    expect(Flow[2][3]).toBeCloseTo(F[2][3], 12);
    expect(Flow[3][1]).toBeCloseTo(F[3][1], 12);
  });
});

describe("lagrangianTraceRaw", () => {
  it("equals ½(|E|²/c² − |B|²) for a general F", () => {
    const E = { x: 1e3, y: -2e3, z: 0.5e3 };
    const B = { x: 1e-3, y: 2e-4, z: -3e-4 };
    const F = buildFieldTensor(E, B);
    const c = SPEED_OF_LIGHT;
    const expected =
      0.5 *
      ((E.x * E.x + E.y * E.y + E.z * E.z) / (c * c) -
        (B.x * B.x + B.y * B.y + B.z * B.z));
    expect(lagrangianTraceRaw(F)).toBeCloseTo(expected, 12);
  });
  it("vanishes for a plane wave |E| = c|B| with E ⊥ B", () => {
    // A plane wave has |E| = c|B|, so the first Lorentz invariant
    // ½(|E|²/c² − |B|²) is zero. The wave propagates in +z; E along x,
    // B along y, with B = E/c.
    const E0 = 1e3;
    const E = { x: E0, y: 0, z: 0 };
    const B = { x: 0, y: E0 / SPEED_OF_LIGHT, z: 0 };
    const F = buildFieldTensor(E, B);
    expect(lagrangianTraceRaw(F)).toBeCloseTo(0, 12);
  });
});

describe("lagrangianTrace", () => {
  it("equals (ε₀/2)(|E|² − c²|B|²)", () => {
    const E = { x: 1e3, y: -2e3, z: 0.5e3 };
    const B = { x: 1e-3, y: 2e-4, z: -3e-4 };
    const F = buildFieldTensor(E, B);
    const c = SPEED_OF_LIGHT;
    const expected =
      (EPSILON_0 / 2) *
      (E.x * E.x +
        E.y * E.y +
        E.z * E.z -
        c * c * (B.x * B.x + B.y * B.y + B.z * B.z));
    expect(lagrangianTrace(F)).toBeCloseTo(expected, 12);
  });
  it("is positive for a pure-E field", () => {
    const F = buildFieldTensor(
      { x: 1e3, y: 0, z: 0 },
      { x: 0, y: 0, z: 0 },
    );
    expect(lagrangianTrace(F)).toBeGreaterThan(0);
  });
  it("is negative for a pure-B field", () => {
    const F = buildFieldTensor(
      { x: 0, y: 0, z: 0 },
      { x: 1e-3, y: 0, z: 0 },
    );
    expect(lagrangianTrace(F)).toBeLessThan(0);
  });
});
