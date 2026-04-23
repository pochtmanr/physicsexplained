import { describe, expect, it } from "vitest";
import {
  ohm,
  current,
  power,
  seriesResistance,
  parallelResistance,
  voltageDivider,
  solveLadder,
  theveninEquivalent,
} from "@/lib/physics/electromagnetism/dc-circuits";
import type { CircuitScene } from "@/components/physics/circuit-canvas/types";

describe("ohm", () => {
  it("V = I·R for the textbook 2 A through 5 Ω → 10 V", () => {
    expect(ohm(2, 5)).toBeCloseTo(10, 12);
  });

  it("I = V/R is the inverse of ohm", () => {
    expect(current(12, 4)).toBeCloseTo(3, 12);
  });

  it("current throws if R = 0 (short circuit is not a function evaluation)", () => {
    expect(() => current(5, 0)).toThrow();
  });

  it("power = I²R (2 A, 5 Ω → 20 W)", () => {
    expect(power(2, 5)).toBeCloseTo(20, 12);
  });
});

describe("seriesResistance", () => {
  it("series resistors add: 100 + 200 + 300 Ω → 600 Ω", () => {
    expect(seriesResistance([100, 200, 300])).toBeCloseTo(600, 12);
  });

  it("empty series is 0 Ω (a wire)", () => {
    expect(seriesResistance([])).toBe(0);
  });
});

describe("parallelResistance", () => {
  it("two equal 100 Ω in parallel → 50 Ω", () => {
    expect(parallelResistance([100, 100])).toBeCloseTo(50, 12);
  });

  it("three equal 300 Ω in parallel → 100 Ω", () => {
    expect(parallelResistance([300, 300, 300])).toBeCloseTo(100, 12);
  });

  it("asymmetric pair: 1 Ω and 1 MΩ → ~1 Ω (dominated by the smaller)", () => {
    const r = parallelResistance([1, 1_000_000]);
    expect(r).toBeGreaterThan(0.999999);
    expect(r).toBeLessThan(1);
  });

  it("throws on non-positive input (negative R has no physical meaning here)", () => {
    expect(() => parallelResistance([100, -50])).toThrow();
    expect(() => parallelResistance([100, 0])).toThrow();
  });
});

describe("voltageDivider", () => {
  it("equal resistors halve the input (10 V, R1 = R2 = 1 kΩ → 5 V)", () => {
    expect(voltageDivider(10, 1000, 1000)).toBeCloseTo(5, 12);
  });

  it("R2 = 0 clamps V_out to 0 (output tied to ground)", () => {
    expect(voltageDivider(10, 1000, 0)).toBeCloseTo(0, 12);
  });

  it("R1 = 0 passes V_in through (bottom resistor carries full input)", () => {
    expect(voltageDivider(12, 0, 1000)).toBeCloseTo(12, 12);
  });

  it("asymmetric divider: 12 V, R1 = 3 kΩ, R2 = 1 kΩ → 3 V", () => {
    expect(voltageDivider(12, 3000, 1000)).toBeCloseTo(3, 12);
  });
});

describe("solveLadder — end-to-end MNA", () => {
  it("12 V across a 100/200/300 Ω series ladder gives I = 20 mA", () => {
    const scene: CircuitScene = {
      nodes: [
        { id: "0", x: 0, y: 200, label: "GND" },
        { id: "A", x: 0, y: 60, label: "A" },
        { id: "B", x: 160, y: 60, label: "B" },
        { id: "C", x: 320, y: 60, label: "C" },
        { id: "D", x: 480, y: 60, label: "D" },
      ],
      wires: [],
      elements: [
        { kind: "dc-voltage", id: "V1", value: 12, fromNode: "A", toNode: "0" },
        { kind: "resistor", id: "R1", value: 100, fromNode: "A", toNode: "B" },
        { kind: "resistor", id: "R2", value: 200, fromNode: "B", toNode: "C" },
        { kind: "resistor", id: "R3", value: 300, fromNode: "C", toNode: "D" },
        // Close the loop back to ground.
        { kind: "resistor", id: "Rret", value: 1e-9, fromNode: "D", toNode: "0" },
        { kind: "ground", id: "GND", atNode: "0" },
      ],
    };
    const sol = solveLadder(scene);
    // KVL around a 600 Ω series loop on a 12 V source → I = 20 mA.
    const iR1 = sol.branchCurrents["R1"];
    expect(iR1).toBeCloseTo(12 / 600, 4);
    // V across R2 = I · R2 = 0.02 · 200 = 4 V.
    const vB = sol.nodeVoltages["B"];
    const vC = sol.nodeVoltages["C"];
    expect(vB - vC).toBeCloseTo(4, 4);
  });

  it("voltage divider via full MNA agrees with the closed form", () => {
    const Vin = 9;
    const R1 = 2200;
    const R2 = 4700;
    const scene: CircuitScene = {
      nodes: [
        { id: "0", x: 0, y: 200 },
        { id: "A", x: 0, y: 60 },
        { id: "M", x: 160, y: 60 },
      ],
      wires: [],
      elements: [
        { kind: "dc-voltage", id: "V1", value: Vin, fromNode: "A", toNode: "0" },
        { kind: "resistor", id: "R1", value: R1, fromNode: "A", toNode: "M" },
        { kind: "resistor", id: "R2", value: R2, fromNode: "M", toNode: "0" },
        { kind: "ground", id: "GND", atNode: "0" },
      ],
    };
    const sol = solveLadder(scene);
    expect(sol.nodeVoltages["M"]).toBeCloseTo(
      voltageDivider(Vin, R1, R2),
      6,
    );
  });
});

describe("theveninEquivalent", () => {
  it("a 12 V source behind a voltage divider (R1=1k, R2=1k) looks like 6 V in series with 500 Ω", () => {
    const scene: CircuitScene = {
      nodes: [
        { id: "0", x: 0, y: 200 },
        { id: "A", x: 0, y: 60 },
        { id: "M", x: 160, y: 60 },
      ],
      wires: [],
      elements: [
        { kind: "dc-voltage", id: "V1", value: 12, fromNode: "A", toNode: "0" },
        { kind: "resistor", id: "R1", value: 1000, fromNode: "A", toNode: "M" },
        { kind: "resistor", id: "R2", value: 1000, fromNode: "M", toNode: "0" },
        { kind: "ground", id: "GND", atNode: "0" },
      ],
    };
    const { vOpen, rThevenin } = theveninEquivalent(scene, "M", "0");
    expect(vOpen).toBeCloseTo(6, 6);
    // R_th seen from M to GND is R1 ∥ R2 = 500 Ω.
    expect(rThevenin).toBeCloseTo(500, 4);
  });
});
