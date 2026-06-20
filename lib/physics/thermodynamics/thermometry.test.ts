import { describe, it, expect } from "vitest";
import {
  ABSOLUTE_ZERO_C,
  celsiusToFahrenheit,
  fahrenheitToCelsius,
  celsiusToKelvin,
  kelvinToCelsius,
  fahrenheitToKelvin,
  kelvinToFahrenheit,
  readoutFromCelsius,
  equilibriumTemperature,
  newtonCooling,
  contactRelaxation,
} from "@/lib/physics/thermodynamics/thermometry";

describe("scale conversions", () => {
  it("freezing point of water across scales", () => {
    expect(celsiusToFahrenheit(0)).toBeCloseTo(32, 6);
    expect(celsiusToKelvin(0)).toBeCloseTo(273.15, 6);
  });

  it("boiling point of water across scales", () => {
    expect(celsiusToFahrenheit(100)).toBeCloseTo(212, 6);
    expect(celsiusToKelvin(100)).toBeCloseTo(373.15, 6);
  });

  it("−40 is the same in °C and °F", () => {
    expect(celsiusToFahrenheit(-40)).toBeCloseTo(-40, 6);
    expect(fahrenheitToCelsius(-40)).toBeCloseTo(-40, 6);
  });

  it("round-trips C↔F and C↔K", () => {
    for (const c of [-273.15, -40, 0, 37, 100, 1000]) {
      expect(fahrenheitToCelsius(celsiusToFahrenheit(c))).toBeCloseTo(c, 6);
      if (c >= ABSOLUTE_ZERO_C) {
        expect(kelvinToCelsius(celsiusToKelvin(c))).toBeCloseTo(c, 6);
      }
    }
  });

  it("F↔K compose correctly (body temperature)", () => {
    expect(fahrenheitToKelvin(98.6)).toBeCloseTo(310.15, 2);
    expect(kelvinToFahrenheit(310.15)).toBeCloseTo(98.6, 2);
  });

  it("rejects sub-absolute-zero temperatures", () => {
    expect(() => celsiusToKelvin(-300)).toThrow(RangeError);
    expect(() => kelvinToCelsius(-1)).toThrow(RangeError);
  });

  it("readout bundles all three scales", () => {
    const r = readoutFromCelsius(25);
    expect(r.celsius).toBe(25);
    expect(r.fahrenheit).toBeCloseTo(77, 6);
    expect(r.kelvin).toBeCloseTo(298.15, 6);
  });
});

describe("equilibrium temperature", () => {
  it("equal heat capacities give the arithmetic mean", () => {
    const t = equilibriumTemperature([
      { heatCapacity: 100, temperature: 20 },
      { heatCapacity: 100, temperature: 80 },
    ]);
    expect(t).toBeCloseTo(50, 6);
  });

  it("weights by heat capacity", () => {
    // a body with 3× the capacity pulls the mean toward itself
    const t = equilibriumTemperature([
      { heatCapacity: 300, temperature: 20 },
      { heatCapacity: 100, temperature: 100 },
    ]);
    expect(t).toBeCloseTo(40, 6);
  });

  it("rejects empty input and non-positive capacity", () => {
    expect(() => equilibriumTemperature([])).toThrow();
    expect(() =>
      equilibriumTemperature([{ heatCapacity: 0, temperature: 10 }]),
    ).toThrow();
  });
});

describe("Newton cooling", () => {
  it("starts at T₀ and decays toward T_env", () => {
    expect(newtonCooling(90, 20, 0.5, 0)).toBeCloseTo(90, 6);
    expect(newtonCooling(90, 20, 0.5, 1000)).toBeCloseTo(20, 6);
  });

  it("closes the gap by 1/e per time-constant", () => {
    const t0 = 100;
    const env = 0;
    const k = 0.25;
    // at t = 1/k the remaining gap is (t0−env)/e
    const v = newtonCooling(t0, env, k, 1 / k);
    expect(v).toBeCloseTo(100 / Math.E, 6);
  });

  it("rejects negative rate or time", () => {
    expect(() => newtonCooling(50, 20, -1, 1)).toThrow(RangeError);
    expect(() => newtonCooling(50, 20, 1, -1)).toThrow(RangeError);
  });
});

describe("contact relaxation", () => {
  it("both bodies converge to the shared equilibrium", () => {
    const a = { heatCapacity: 100, temperature: 0 };
    const b = { heatCapacity: 100, temperature: 100 };
    const early = contactRelaxation(a, b, 0.4, 0);
    expect(early.tA).toBeCloseTo(0, 6);
    expect(early.tB).toBeCloseTo(100, 6);
    expect(early.tEq).toBeCloseTo(50, 6);

    const late = contactRelaxation(a, b, 0.4, 1000);
    expect(late.tA).toBeCloseTo(50, 4);
    expect(late.tB).toBeCloseTo(50, 4);
  });
});
