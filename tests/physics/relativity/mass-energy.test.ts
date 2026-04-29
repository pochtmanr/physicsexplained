import { describe, expect, it } from "vitest";
import { SPEED_OF_LIGHT } from "@/lib/physics/constants";
import {
  restEnergy,
  massDeficitFromEnergy,
  bindingEnergyCurve,
} from "@/lib/physics/relativity/mass-energy";

describe("restEnergy", () => {
  it("1 kg has rest energy c² ≈ 8.988 × 10¹⁶ J", () => {
    expect(restEnergy(1)).toBeCloseTo(8.987551787e16, -10);
  });

  it("scales linearly in mass", () => {
    expect(restEnergy(2.5)).toBeCloseTo(2.5 * restEnergy(1), 4);
  });

  it("at zero mass, rest energy is zero (massless particles aren't massless via this formula — they need momentum)", () => {
    expect(restEnergy(0)).toBe(0);
  });

  it("proton rest energy is ≈ 938 MeV (within 0.1%)", () => {
    // Proton mass ≈ 1.67262192e-27 kg. Convert to MeV: divide J by 1.602e-13.
    const m_p = 1.67262192e-27;
    const E_J = restEnergy(m_p);
    const E_MeV = E_J / 1.602176634e-13;
    expect(E_MeV).toBeGreaterThan(938);
    expect(E_MeV).toBeLessThan(939);
  });
});

describe("massDeficitFromEnergy", () => {
  it("1 J of binding-energy release corresponds to Δm ≈ 1.113 × 10⁻¹⁷ kg", () => {
    expect(massDeficitFromEnergy(1)).toBeCloseTo(1.112650056e-17, 22);
  });

  it("inverts restEnergy exactly", () => {
    const m = 3.14e-27;
    expect(massDeficitFromEnergy(restEnergy(m))).toBeCloseTo(m, 35);
  });

  it("28 MeV of He-4 binding energy ≈ 5 × 10⁻²⁹ kg deficit (≈ 0.030 u)", () => {
    // 1 eV = 1.602176634e-19 J  →  1 MeV = 1.602176634e-13 J
    const E_J = 28 * 1.602176634e-13;
    const dm = massDeficitFromEnergy(E_J);
    // 0.030 u × 1.66054e-27 kg/u ≈ 4.98e-29 kg
    expect(dm).toBeGreaterThan(4.9e-29);
    expect(dm).toBeLessThan(5.1e-29);
  });

  it("respects an explicit `c` argument (unit-flexible API)", () => {
    // With c = 1 (natural units), Δm = ΔE.
    expect(massDeficitFromEnergy(42, 1)).toBe(42);
  });
});

describe("bindingEnergyCurve", () => {
  const curve = bindingEnergyCurve();

  it("starts at H-1 with B/A = 0 (a single proton has no binding)", () => {
    expect(curve[0].isotope).toBe("H-1");
    expect(curve[0].A).toBe(1);
    expect(curve[0].B_per_A_MeV).toBe(0);
  });

  it("Fe-56 is the maximum-binding entry — the universe's energy minimum per nucleon", () => {
    const peak = curve.reduce((best, p) =>
      p.B_per_A_MeV > best.B_per_A_MeV ? p : best,
    );
    expect(peak.isotope).toBe("Fe-56");
    expect(peak.A).toBe(56);
    expect(peak.B_per_A_MeV).toBeGreaterThan(8.7);
    expect(peak.B_per_A_MeV).toBeLessThan(8.9);
  });

  it("includes the canonical fusion + fission anchor isotopes", () => {
    const labels = curve.map((p) => p.isotope);
    expect(labels).toContain("H-2"); // fusion fuel
    expect(labels).toContain("He-4"); // fusion product, alpha particle
    expect(labels).toContain("Fe-56"); // peak
    expect(labels).toContain("U-235"); // fission fuel
    expect(labels).toContain("U-238"); // most abundant uranium isotope
  });

  it("rises monotonically from D-2 up to Fe-56 (the fusion side of the curve)", () => {
    const upToIron = curve.filter((p) => p.A >= 2 && p.A <= 56);
    for (let i = 1; i < upToIron.length; i++) {
      expect(upToIron[i].B_per_A_MeV).toBeGreaterThanOrEqual(
        upToIron[i - 1].B_per_A_MeV,
      );
    }
  });

  it("falls monotonically from Fe-56 down to U-238 (the fission side of the curve)", () => {
    const fromIron = curve.filter((p) => p.A >= 56);
    for (let i = 1; i < fromIron.length; i++) {
      expect(fromIron[i].B_per_A_MeV).toBeLessThanOrEqual(
        fromIron[i - 1].B_per_A_MeV,
      );
    }
  });

  it("covers the full nuclear chart from A = 1 to A ≥ 235", () => {
    const minA = Math.min(...curve.map((p) => p.A));
    const maxA = Math.max(...curve.map((p) => p.A));
    expect(minA).toBe(1);
    expect(maxA).toBeGreaterThanOrEqual(235);
  });

  it("U-235 sits below Fe-56 by ≈ 1.2 MeV/nucleon — the area fission can release", () => {
    const fe = curve.find((p) => p.isotope === "Fe-56")!;
    const u = curve.find((p) => p.isotope === "U-235")!;
    const gap = fe.B_per_A_MeV - u.B_per_A_MeV;
    expect(gap).toBeGreaterThan(1.0);
    expect(gap).toBeLessThan(1.5);
  });

  it("uses SPEED_OF_LIGHT as the bridge between MeV/nucleon and kg via E = mc² (sanity)", () => {
    // Sanity round-trip: 8.79 MeV/nucleon at A=56 → total He energy in J.
    const fe = curve.find((p) => p.isotope === "Fe-56")!;
    const totalBinding_MeV = fe.B_per_A_MeV * fe.A;
    expect(totalBinding_MeV).toBeGreaterThan(490);
    expect(totalBinding_MeV).toBeLessThan(495);
    // Mass-equivalent of that binding energy:  1 MeV = 1.602176634e-13 J
    const E_J = totalBinding_MeV * 1.602176634e-13;
    const dm = massDeficitFromEnergy(E_J, SPEED_OF_LIGHT);
    expect(dm).toBeGreaterThan(0); // binding energy → real mass deficit
    expect(dm).toBeLessThan(1e-27); // smaller than a single nucleon mass
  });
});
