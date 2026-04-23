import { describe, expect, it } from "vitest";
import {
  EPSILON_0,
  MU_0,
  SPEED_OF_LIGHT,
} from "@/lib/physics/constants";
import {
  gaussRhs,
  noMonopoleRhs,
  faradayRhs,
  ampereMaxwellRhs,
  c,
  cResidual,
} from "@/lib/physics/electromagnetism/four-equations";

describe("gaussRhs — ∮E·dA = Q_enc / ε₀", () => {
  it("returns zero when there is no enclosed charge", () => {
    expect(gaussRhs(0)).toBe(0);
  });

  it("matches Q / ε₀ for a unit point charge", () => {
    expect(gaussRhs(1)).toBeCloseTo(1 / EPSILON_0, 6);
  });

  it("is linear in the enclosed charge (scale by 5)", () => {
    const single = gaussRhs(1e-9);
    const quintuple = gaussRhs(5e-9);
    expect(quintuple / single).toBeCloseTo(5, 12);
  });

  it("flips sign when the enclosed charge flips sign", () => {
    expect(gaussRhs(-2e-9)).toBeCloseTo(-gaussRhs(2e-9), 20);
  });
});

describe("noMonopoleRhs — ∮B·dA = 0", () => {
  it("returns exactly zero, regardless of call", () => {
    expect(noMonopoleRhs()).toBe(0);
  });
});

describe("faradayRhs — ∮E·dℓ = −dΦ_B/dt", () => {
  it("is zero for steady flux", () => {
    expect(faradayRhs(0)).toBeCloseTo(0, 20);
  });

  it("is negative when the flux is rising (Lenz)", () => {
    expect(faradayRhs(0.25)).toBeCloseTo(-0.25, 12);
  });

  it("is positive when the flux is falling", () => {
    expect(faradayRhs(-0.4)).toBeCloseTo(0.4, 12);
  });
});

describe("ampereMaxwellRhs — ∮B·dℓ = μ₀(I_enc + ε₀ dΦ_E/dt)", () => {
  it("reduces to μ₀ I_enc when the electric flux is steady", () => {
    // Pure Ampère — the §03 result.
    expect(ampereMaxwellRhs(1, 0)).toBeCloseTo(MU_0, 20);
    expect(ampereMaxwellRhs(10, 0)).toBeCloseTo(10 * MU_0, 20);
  });

  it("reduces to μ₀ε₀ dΦ_E/dt when no conduction current threads the loop", () => {
    // The displacement-current-only case — a charging-capacitor surface
    // that misses the wire but catches the E-field between the plates.
    expect(ampereMaxwellRhs(0, 1)).toBeCloseTo(MU_0 * EPSILON_0, 20);
  });

  it("sums the two contributions linearly", () => {
    const sum = ampereMaxwellRhs(3, 2);
    const conduction = ampereMaxwellRhs(3, 0);
    const displacement = ampereMaxwellRhs(0, 2);
    expect(sum).toBeCloseTo(conduction + displacement, 20);
  });
});

describe("c — speed of light from μ₀ and ε₀", () => {
  it("matches the SI-defined exact value of c to within one part in 10⁸", () => {
    expect(cResidual()).toBeLessThan(1e-8);
  });

  it("lands within 1 m/s of 299 792 458 m/s", () => {
    expect(Math.abs(c() - SPEED_OF_LIGHT)).toBeLessThan(1);
  });

  it("is self-consistent: c² · μ₀ · ε₀ ≈ 1", () => {
    const product = c() * c() * MU_0 * EPSILON_0;
    expect(product).toBeCloseTo(1, 10);
  });
});
