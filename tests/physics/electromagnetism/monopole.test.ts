import { describe, expect, it } from "vitest";
import {
  diracQuantizationCondition,
  diracMonopoleUnit,
  magneticChargeDensityFromTensor,
  dualMaxwellEquationLabels,
} from "@/lib/physics/electromagnetism/monopole";
import { ELEMENTARY_CHARGE, H_BAR } from "@/lib/physics/constants";
import type { FieldTensor } from "@/lib/physics/electromagnetism/relativity";

describe("monopole", () => {
  it("Dirac quantization eg = n · 2πℏ for the smallest unit (n=1)", () => {
    const g = diracMonopoleUnit();
    const { eg, n } = diracQuantizationCondition(ELEMENTARY_CHARGE, g);
    expect(eg).toBeCloseTo(2 * Math.PI * H_BAR, 30);
    expect(n).toBeCloseTo(1, 12);
  });

  it("doubling the monopole charge gives n=2", () => {
    const g = 2 * diracMonopoleUnit();
    const { n } = diracQuantizationCondition(ELEMENTARY_CHARGE, g);
    expect(n).toBeCloseTo(2, 12);
  });

  it("magneticChargeDensityFromTensor returns zero for zero gradient (standard Maxwell)", () => {
    const F: FieldTensor = [
      [0, 1, 0, 0],
      [-1, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    const J = magneticChargeDensityFromTensor(F);
    expect(J).toEqual([0, 0, 0, 0]);
  });

  it("dualMaxwellEquationLabels returns 4 standard + 2 electric + 2 magnetic strings", () => {
    const labels = dualMaxwellEquationLabels();
    expect(labels.standard).toHaveLength(4);
    expect(labels.withMonopoles.electric).toHaveLength(2);
    expect(labels.withMonopoles.magnetic).toHaveLength(2);
  });
});
