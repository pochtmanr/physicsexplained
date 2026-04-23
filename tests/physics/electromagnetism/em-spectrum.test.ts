import { describe, expect, it } from "vitest";
import {
  SPECTRUM_BANDS,
  bandOf,
  frequencyFromWavelength,
  photonEnergy,
  photonEnergyInEV,
  wavelengthFromFrequency,
  wavenumber,
} from "@/lib/physics/electromagnetism/em-spectrum";
import { SPEED_OF_LIGHT } from "@/lib/physics/constants";

describe("frequencyFromWavelength / wavelengthFromFrequency", () => {
  it("round-trips 550 nm to ~5.45×10¹⁴ Hz", () => {
    const lambda = 550e-9;
    const f = frequencyFromWavelength(lambda);
    // c / 550e-9 = 299792458 / 5.5e-7 ≈ 5.4508e14
    expect(f).toBeGreaterThan(5.44e14);
    expect(f).toBeLessThan(5.46e14);
    // λ = c/f reverses exactly
    expect(wavelengthFromFrequency(f)).toBeCloseTo(lambda, 18);
  });

  it("uses c exactly: f·λ = c for arbitrary inputs", () => {
    const lambda = 3e-2;
    const f = frequencyFromWavelength(lambda);
    expect(f * lambda).toBeCloseTo(SPEED_OF_LIGHT, 6);
  });

  it("throws on non-positive wavelength or frequency", () => {
    expect(() => frequencyFromWavelength(0)).toThrow();
    expect(() => frequencyFromWavelength(-1)).toThrow();
    expect(() => wavelengthFromFrequency(0)).toThrow();
    expect(() => wavelengthFromFrequency(-1)).toThrow();
  });
});

describe("photonEnergy / photonEnergyInEV", () => {
  it("yields ≈ 2.25 eV for a 550 nm green-yellow photon", () => {
    const eV = photonEnergyInEV(550e-9);
    // hc/λ in eV: 1239.84 / 550 ≈ 2.2543
    expect(eV).toBeGreaterThan(2.24);
    expect(eV).toBeLessThan(2.27);
  });

  it("matches the hc/λ = 1239.84 nm·eV rule of thumb across bands", () => {
    // X-ray at 0.1 nm → ~12.4 keV
    const xray = photonEnergyInEV(1e-10);
    expect(xray).toBeGreaterThan(1.23e4);
    expect(xray).toBeLessThan(1.25e4);
    // Microwave at 12 cm (WiFi 2.4 GHz) → ~1e-5 eV
    const microwave = photonEnergyInEV(0.125);
    expect(microwave).toBeGreaterThan(9e-6);
    expect(microwave).toBeLessThan(1.1e-5);
  });

  it("scales inversely with wavelength", () => {
    const e1 = photonEnergy(1e-6);
    const e2 = photonEnergy(2e-6);
    expect(e1 / e2).toBeCloseTo(2, 12);
  });
});

describe("wavenumber", () => {
  it("returns 2π/λ exactly — 2π×10⁶ rad/m at λ = 1 µm", () => {
    expect(wavenumber(1e-6)).toBeCloseTo(2 * Math.PI * 1e6, 6);
  });

  it("throws on non-positive wavelength", () => {
    expect(() => wavenumber(0)).toThrow();
    expect(() => wavenumber(-1)).toThrow();
  });
});

describe("bandOf", () => {
  it("labels 500 nm as Visible", () => {
    expect(bandOf(500e-9)).toBe("Visible");
  });

  it("labels 1 cm as Microwave", () => {
    expect(bandOf(1e-2)).toBe("Microwave");
  });

  it("labels recognisable anchors across the whole spectrum", () => {
    expect(bandOf(10)).toBe("Radio"); // 10 m — shortwave radio
    expect(bandOf(1e-4)).toBe("Infrared"); // 100 µm — far IR
    expect(bandOf(1e-7)).toBe("Ultraviolet"); // 100 nm — UV
    expect(bandOf(1e-10)).toBe("X-ray"); // 0.1 nm — hard X-ray
    expect(bandOf(1e-13)).toBe("Gamma"); // 0.1 pm — gamma
  });

  it("returns null for non-positive or out-of-range wavelengths", () => {
    expect(bandOf(0)).toBeNull();
    expect(bandOf(-1)).toBeNull();
    expect(bandOf(1e10)).toBeNull();
  });
});

describe("SPECTRUM_BANDS", () => {
  it("covers seven bands in descending wavelength order", () => {
    expect(SPECTRUM_BANDS.length).toBe(7);
    for (let i = 1; i < SPECTRUM_BANDS.length; i++) {
      const prev = SPECTRUM_BANDS[i - 1]!;
      const curr = SPECTRUM_BANDS[i]!;
      expect(prev.wavelengthMaxM).toBeGreaterThanOrEqual(curr.wavelengthMaxM);
      // Adjacent bands should touch or overlap (no gaps).
      expect(prev.wavelengthMinM).toBeLessThanOrEqual(curr.wavelengthMaxM);
    }
  });
});
