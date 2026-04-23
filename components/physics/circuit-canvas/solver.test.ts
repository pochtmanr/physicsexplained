import { describe, expect, it } from "vitest";
import { solveDC, solveTransient, solveACPhasor, thevenin } from "./solver";
import type { CircuitScene } from "./types";

describe("solveDC", () => {
  it("Ohm's law: V = IR on a single-loop resistor", () => {
    const scene: CircuitScene = {
      nodes: [
        { id: "0", x: 0, y: 0 },
        { id: "A", x: 100, y: 0 },
      ],
      wires: [],
      elements: [
        { kind: "ground", id: "g", atNode: "0" },
        { kind: "dc-voltage", id: "V1", value: 10, fromNode: "A", toNode: "0" },
        { kind: "resistor", id: "R1", value: 1000, fromNode: "A", toNode: "0" },
      ],
    };
    const sol = solveDC(scene);
    expect(sol.nodeVoltages["A"]).toBeCloseTo(10, 6);
    expect(sol.branchCurrents["R1"]).toBeCloseTo(0.01, 6); // 10 / 1000
  });

  it("Kirchhoff's voltage law on a 3-resistor ladder: series R = R1+R2+R3", () => {
    // V = 12, R1=100, R2=200, R3=300. I = 12/600 = 0.02 A. V across R2 = 4 V.
    const scene: CircuitScene = {
      nodes: [
        { id: "0", x: 0, y: 0 },
        { id: "A", x: 100, y: 0 },
        { id: "B", x: 200, y: 0 },
        { id: "C", x: 300, y: 0 },
      ],
      wires: [],
      elements: [
        { kind: "ground", id: "g", atNode: "0" },
        { kind: "dc-voltage", id: "V1", value: 12, fromNode: "A", toNode: "0" },
        { kind: "resistor", id: "R1", value: 100, fromNode: "A", toNode: "B" },
        { kind: "resistor", id: "R2", value: 200, fromNode: "B", toNode: "C" },
        { kind: "resistor", id: "R3", value: 300, fromNode: "C", toNode: "0" },
      ],
    };
    const sol = solveDC(scene);
    expect(sol.branchCurrents["R1"]).toBeCloseTo(0.02, 6);
    expect(sol.nodeVoltages["B"] - sol.nodeVoltages["C"]).toBeCloseTo(4, 6);
  });

  it("Thevenin equivalent of a voltage divider matches V_open = V·R2/(R1+R2)", () => {
    const scene: CircuitScene = {
      nodes: [
        { id: "0", x: 0, y: 0 },
        { id: "A", x: 100, y: 0 },
        { id: "B", x: 200, y: 0 },
      ],
      wires: [],
      elements: [
        { kind: "ground", id: "g", atNode: "0" },
        { kind: "dc-voltage", id: "V1", value: 10, fromNode: "A", toNode: "0" },
        { kind: "resistor", id: "R1", value: 1000, fromNode: "A", toNode: "B" },
        { kind: "resistor", id: "R2", value: 1000, fromNode: "B", toNode: "0" },
      ],
    };
    const { vOpen, rThevenin } = thevenin(scene, "B", "0");
    expect(vOpen).toBeCloseTo(5, 6);
    expect(rThevenin).toBeCloseTo(500, 6); // R1 || R2 = 500
  });
});

describe("solveTransient (RC)", () => {
  it("matches analytical v_c(t) = V(1 − e^(−t/τ)) within 1% at t = τ", () => {
    const R = 1000,
      C = 1e-6; // τ = 1 ms
    const scene: CircuitScene = {
      nodes: [
        { id: "0", x: 0, y: 0 },
        { id: "A", x: 100, y: 0 },
        { id: "B", x: 200, y: 0 },
      ],
      wires: [],
      elements: [
        { kind: "ground", id: "g", atNode: "0" },
        { kind: "dc-voltage", id: "V1", value: 5, fromNode: "A", toNode: "0" },
        { kind: "resistor", id: "R1", value: R, fromNode: "A", toNode: "B" },
        { kind: "capacitor", id: "C1", value: C, fromNode: "B", toNode: "0" },
      ],
    };
    const steps = solveTransient(scene, 5e-3, 1e-5); // 5τ duration, 0.01τ step
    const tau = R * C;
    const idxAtTau = Math.round(tau / 1e-5);
    const analytical = 5 * (1 - Math.exp(-1));
    expect(steps[idxAtTau].nodeVoltages["B"]).toBeCloseTo(analytical, 1);
  });
});

describe("solveTransient (RL)", () => {
  it("matches analytical i_L(t) = (V/R)(1 − e^(−t/τ)) at t = τ", () => {
    const R = 10,
      L = 0.1; // τ = 10 ms
    const scene: CircuitScene = {
      nodes: [
        { id: "0", x: 0, y: 0 },
        { id: "A", x: 100, y: 0 },
        { id: "B", x: 200, y: 0 },
      ],
      wires: [],
      elements: [
        { kind: "ground", id: "g", atNode: "0" },
        { kind: "dc-voltage", id: "V1", value: 12, fromNode: "A", toNode: "0" },
        { kind: "resistor", id: "R1", value: R, fromNode: "A", toNode: "B" },
        { kind: "inductor", id: "L1", value: L, fromNode: "B", toNode: "0" },
      ],
    };
    const steps = solveTransient(scene, 50e-3, 1e-4);
    const tau = L / R;
    const idxAtTau = Math.round(tau / 1e-4);
    const analytical = (12 / R) * (1 - Math.exp(-1));
    expect(steps[idxAtTau].branchCurrents["L1"]).toBeCloseTo(analytical, 1);
  });
});

describe("solveACPhasor (RLC resonance)", () => {
  it("finds resonance at ω₀ = 1/√(LC) where current is maximal and in phase with V", () => {
    const R = 10,
      L = 1e-3,
      C = 1e-6; // ω₀ = 1/√(1e-9) = ~31623 rad/s
    const scene: CircuitScene = {
      nodes: [
        { id: "0", x: 0, y: 0 },
        { id: "A", x: 100, y: 0 },
        { id: "B", x: 200, y: 0 },
        { id: "C", x: 300, y: 0 },
      ],
      wires: [],
      elements: [
        { kind: "ground", id: "g", atNode: "0" },
        { kind: "ac-voltage", id: "V1", value: 1, omega: 0, phase: 0, fromNode: "A", toNode: "0" },
        { kind: "resistor", id: "R1", value: R, fromNode: "A", toNode: "B" },
        { kind: "inductor", id: "L1", value: L, fromNode: "B", toNode: "C" },
        { kind: "capacitor", id: "C1", value: C, fromNode: "C", toNode: "0" },
      ],
    };
    const omega0 = 1 / Math.sqrt(L * C);
    const off = solveACPhasor({ ...scene, elements: scene.elements }, omega0 * 0.5);
    const res = solveACPhasor({ ...scene, elements: scene.elements }, omega0);
    expect(Math.abs(res.branchCurrents["R1"])).toBeGreaterThan(Math.abs(off.branchCurrents["R1"]));
  });
});
