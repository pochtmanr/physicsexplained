import { describe, expect, it } from "vitest";
import {
  gaugeTransformation,
  u1PhaseRotation,
  nonAbelianCommutator,
} from "@/lib/physics/electromagnetism/gauge-theory";
import type { FieldTensor } from "@/lib/physics/electromagnetism/relativity";

describe("gauge-theory", () => {
  describe("gaugeTransformation", () => {
    it("adds ∂_μΛ component-wise", () => {
      const A = [1, 2, 3, 4] as const;
      const dLambda = [0.1, 0.2, 0.3, 0.4] as const;
      const Aprime = gaugeTransformation(A, dLambda);
      expect(Aprime).toEqual([1.1, 2.2, 3.3, 4.4]);
    });
  });

  describe("u1PhaseRotation", () => {
    it("rotates by θ in the complex plane", () => {
      const psi = { re: 1, im: 0 };
      const rot = u1PhaseRotation(psi, Math.PI / 2);
      expect(rot.re).toBeCloseTo(0, 12);
      expect(rot.im).toBeCloseTo(1, 12);
    });

    it("preserves |psi|^2 (probability)", () => {
      const psi = { re: 0.6, im: 0.8 };
      const rot = u1PhaseRotation(psi, 1.337);
      const norm2 = rot.re * rot.re + rot.im * rot.im;
      expect(norm2).toBeCloseTo(1, 12);
    });
  });

  describe("nonAbelianCommutator", () => {
    it("returns zero tensor for two diagonal (Abelian-like) tensors", () => {
      const A: FieldTensor = [
        [1, 0, 0, 0],
        [0, 2, 0, 0],
        [0, 0, 3, 0],
        [0, 0, 0, 4],
      ];
      const B: FieldTensor = [
        [5, 0, 0, 0],
        [0, 6, 0, 0],
        [0, 0, 7, 0],
        [0, 0, 0, 8],
      ];
      const comm = nonAbelianCommutator(A, B);
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          expect(comm[i][j]).toBeCloseTo(0, 12);
        }
      }
    });

    it("is non-zero for two non-commuting tensors (e.g. Pauli-like rotations in upper-left 2×2)", () => {
      const A: FieldTensor = [
        [0, 1, 0, 0],
        [1, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];
      const B: FieldTensor = [
        [0, 0, 0, 0],
        [0, 0, 1, 0],
        [0, 1, 0, 0],
        [0, 0, 0, 0],
      ];
      const comm = nonAbelianCommutator(A, B);
      const allZero = comm.every((row) => row.every((v) => Math.abs(v) < 1e-12));
      expect(allZero).toBe(false);
    });
  });
});
