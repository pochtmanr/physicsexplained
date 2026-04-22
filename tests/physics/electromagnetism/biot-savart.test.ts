import { describe, expect, it } from "vitest";
import {
  biotSavartElement,
  finiteSegmentField,
  loopAxisField,
  straightWireField,
} from "@/lib/physics/electromagnetism/biot-savart";
import { MU_0 } from "@/lib/physics/constants";

describe("biotSavartElement", () => {
  it("returns zero when r is zero (singularity guard)", () => {
    const dB = biotSavartElement(
      1,
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 0, z: 0 },
    );
    expect(dB).toEqual({ x: 0, y: 0, z: 0 });
  });

  it("right-hand rule: dl=x̂, r=ŷ → dB along +ẑ", () => {
    // For dl = (dx, 0, 0) at the origin with r pointing to (0, d, 0), we have
    //   dl × r̂ = dx · ŷ × ... wait, dl × r where r = (0, d, 0):
    //   (dx, 0, 0) × (0, d, 0) = (0·0 − 0·d, 0·0 − dx·0, dx·d − 0·0) = (0, 0, dx·d)
    // So dB points along +ẑ for I > 0.
    const dB = biotSavartElement(
      1, // 1 A
      { x: 1e-3, y: 0, z: 0 }, // 1 mm element along +x̂
      { x: 0, y: 0.1, z: 0 }, // field point 10 cm in +ŷ
    );
    expect(dB.x).toBeCloseTo(0, 18);
    expect(dB.y).toBeCloseTo(0, 18);
    expect(dB.z).toBeGreaterThan(0);
    // Magnitude check: μ₀ I dl / (4π r²) since dl ⊥ r
    const expected = (MU_0 * 1 * 1e-3) / (4 * Math.PI * 0.1 * 0.1);
    expect(dB.z).toBeCloseTo(expected, 18);
  });

  it("vanishes when dl is parallel to r (cross product is zero)", () => {
    const dB = biotSavartElement(
      5,
      { x: 1e-3, y: 0, z: 0 },
      { x: 0.5, y: 0, z: 0 },
    );
    expect(dB.x).toBeCloseTo(0, 18);
    expect(dB.y).toBeCloseTo(0, 18);
    expect(dB.z).toBeCloseTo(0, 18);
  });
});

describe("straightWireField", () => {
  it("returns the textbook μ₀I/(2πd) value", () => {
    // 1 A at 1 cm gives 2 × 10⁻⁵ T (a classic Halliday problem).
    expect(straightWireField(1, 0.01)).toBeCloseTo(2e-5, 6);
  });

  it("falls as 1/d (doubling distance halves the field)", () => {
    const near = straightWireField(10, 0.05);
    const far = straightWireField(10, 0.1);
    expect(far / near).toBeCloseTo(0.5, 12);
  });
});

describe("finiteSegmentField", () => {
  it("matches the long-wire formula when θ₁ → −π/2, θ₂ → +π/2", () => {
    const I = 7.3;
    const d = 0.042;
    const finite = finiteSegmentField(I, d, -Math.PI / 2, Math.PI / 2);
    const infinite = straightWireField(I, d);
    expect(finite).toBeCloseTo(infinite, 12);
  });

  it("a symmetric finite segment gives less field than an infinite one", () => {
    const I = 2;
    const d = 0.1;
    const finite = finiteSegmentField(I, d, -Math.PI / 4, Math.PI / 4);
    const infinite = straightWireField(I, d);
    expect(finite).toBeLessThan(infinite);
    // sin(π/4) − sin(−π/4) = √2, while the infinite case integrates to 2,
    // so the ratio is √2 / 2 ≈ 0.7071.
    expect(finite / infinite).toBeCloseTo(Math.SQRT2 / 2, 6);
  });
});

describe("loopAxisField", () => {
  it("peaks at z = 0 with B₀ = μ₀I/(2R)", () => {
    const I = 3;
    const R = 0.05;
    const center = loopAxisField(I, R, 0);
    expect(center).toBeCloseTo((MU_0 * I) / (2 * R), 12);
  });

  it("the centre is the maximum (any z away gives a smaller field)", () => {
    const I = 1;
    const R = 0.1;
    const center = loopAxisField(I, R, 0);
    expect(loopAxisField(I, R, 0.01)).toBeLessThan(center);
    expect(loopAxisField(I, R, 0.05)).toBeLessThan(center);
    expect(loopAxisField(I, R, 0.5)).toBeLessThan(center);
  });

  it("falls as 1/z³ for z ≫ R (on-axis dipole limit)", () => {
    const I = 1;
    const R = 0.01;
    // pick z₁ and z₂ both ≫ R, then check B(z₁)/B(z₂) ≈ (z₂/z₁)³
    const z1 = 1.0; // 100 R
    const z2 = 2.0; // 200 R
    const ratio = loopAxisField(I, R, z1) / loopAxisField(I, R, z2);
    expect(ratio).toBeCloseTo((z2 / z1) ** 3, 2);
  });

  it("equals the explicit μ₀IR²/(2z³) far-field expression at large z", () => {
    const I = 4;
    const R = 0.01;
    const z = 1.0;
    const farField = (MU_0 * I * R * R) / (2 * z * z * z);
    expect(loopAxisField(I, R, z)).toBeCloseTo(farField, 6);
  });
});
