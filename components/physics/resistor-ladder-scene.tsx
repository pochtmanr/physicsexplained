"use client";

import { useMemo, useState } from "react";
import { CircuitCanvas } from "@/components/physics/circuit-canvas/CircuitCanvas";
import type { CircuitScene } from "@/components/physics/circuit-canvas/types";
import { solveDC } from "@/components/physics/circuit-canvas/solver";

const V_IN = 12; // volts
const R1 = 100; // ohms
const R3 = 300; // ohms

/**
 * FIG.26a — a three-resistor series ladder (R1=100 Ω, R2=slider, R3=300 Ω)
 * across a 12 V source. The CircuitCanvas MNA solver updates node voltages
 * live as R2 changes; the HUD prints the loop current I and the voltages
 * across each resistor. Watching V₂ = I·R₂ grow linearly with R₂ while I
 * shrinks hyperbolically is the cleanest way to see Ohm and KVL together.
 */
export function ResistorLadderScene() {
  const [R2, setR2] = useState(200);

  const scene: CircuitScene = useMemo(
    () => ({
      nodes: [
        { id: "0", x: 40, y: 320, label: "GND" },
        { id: "A", x: 40, y: 80, label: "A" },
        { id: "B", x: 180, y: 80, label: "B" },
        { id: "C", x: 340, y: 80, label: "C" },
        { id: "D", x: 500, y: 80, label: "D" },
      ],
      wires: [
        // A ↔ battery top already drawn by source glyph. Top-right wire D → down → back to 0.
        { id: "w-D-GND", fromNode: "D", toNode: "0", via: [{ x: 500, y: 320 }] },
      ],
      elements: [
        { kind: "dc-voltage", id: "V1", value: V_IN, fromNode: "A", toNode: "0" },
        { kind: "resistor", id: "R1", value: R1, fromNode: "A", toNode: "B" },
        { kind: "resistor", id: "R2", value: R2, fromNode: "B", toNode: "C" },
        { kind: "resistor", id: "R3", value: R3, fromNode: "C", toNode: "D" },
        { kind: "ground", id: "GND", atNode: "0" },
      ],
    }),
    [R2],
  );

  // Solve synchronously for the HUD — the canvas re-solves internally for drawing.
  const sol = useMemo(() => {
    try {
      return solveDC(scene);
    } catch {
      return null;
    }
  }, [scene]);

  const I = sol?.branchCurrents["R1"] ?? 0;
  const vAB = (sol?.nodeVoltages["A"] ?? 0) - (sol?.nodeVoltages["B"] ?? 0);
  const vBC = (sol?.nodeVoltages["B"] ?? 0) - (sol?.nodeVoltages["C"] ?? 0);
  const vCD = (sol?.nodeVoltages["C"] ?? 0) - (sol?.nodeVoltages["D"] ?? 0);

  return (
    <div className="w-full pb-4">
      <CircuitCanvas
        scene={scene}
        mode="dc"
        width={560}
        height={360}
        className="w-full"
        hudKeys={[
          { label: "V(A)", kind: "voltage", id: "A" },
          { label: "V(B)", kind: "voltage", id: "B" },
          { label: "V(C)", kind: "voltage", id: "C" },
          { label: "I(R1)", kind: "current", id: "R1" },
        ]}
      />
      <div className="mt-3 grid grid-cols-1 gap-2 px-2 sm:grid-cols-2">
        <label className="flex items-center gap-2 text-xs font-mono text-[var(--color-fg-2)]">
          <span className="w-10 text-[var(--color-fg-1)]">R₂</span>
          <input
            type="range"
            min={10}
            max={2000}
            step={10}
            value={R2}
            onChange={(e) => setR2(parseFloat(e.target.value))}
            className="flex-1"
            style={{ accentColor: "#F5B041" }}
          />
          <span className="w-20 text-right text-[var(--color-fg-1)]">
            {R2.toFixed(0)} Ω
          </span>
        </label>
        <div className="text-xs font-mono text-[var(--color-fg-2)]">
          I = {(I * 1000).toFixed(2)} mA ·
          V₁ = {vAB.toFixed(2)} V ·
          V₂ = {vBC.toFixed(2)} V ·
          V₃ = {vCD.toFixed(2)} V
        </div>
      </div>
      <p className="mt-2 px-2 text-xs font-mono text-[var(--color-fg-3)]">
        KVL: V₁ + V₂ + V₃ = {(vAB + vBC + vCD).toFixed(2)} V ≈ V_in = {V_IN} V
      </p>
    </div>
  );
}
