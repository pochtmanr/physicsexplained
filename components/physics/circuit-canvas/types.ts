/**
 * CircuitCanvas — canonical type definitions.
 *
 * §06 topic agents MUST import from this file. No local copies, no fallbacks.
 * If a new field or kind is required, extend this file via the orchestrator,
 * not in the topic agent.
 */

/** A node in the circuit graph (electrical junction). Ground is node 0 by convention. */
export interface CircuitNode {
  id: string;
  x: number; // canvas coordinate
  y: number;
  label?: string; // e.g. "V_in", "A", "B"
}

/** A 2-terminal linear passive component. */
export type PassiveKind = "resistor" | "capacitor" | "inductor";

export interface Passive {
  kind: PassiveKind;
  id: string;
  /** Ohms for resistor, Farads for capacitor, Henries for inductor. */
  value: number;
  fromNode: string;
  toNode: string;
}

/** DC voltage/current source or AC source. */
export type SourceKind = "dc-voltage" | "dc-current" | "ac-voltage" | "ac-current";

export interface Source {
  kind: SourceKind;
  id: string;
  /** For DC: the constant value. For AC: the amplitude. */
  value: number;
  /** AC only — angular frequency in rad/s. */
  omega?: number;
  /** AC only — phase offset in radians. */
  phase?: number;
  fromNode: string; // + terminal
  toNode: string; // − terminal
}

/** Ground reference (always node id "0" by solver convention). */
export interface Ground {
  kind: "ground";
  id: string;
  atNode: string;
}

/** Ideal switch (binary). */
export interface Switch {
  kind: "switch";
  id: string;
  closed: boolean;
  fromNode: string;
  toNode: string;
}

/** Ideal voltmeter / ammeter — affects nothing, reads value. */
export interface Meter {
  kind: "voltmeter" | "ammeter";
  id: string;
  /** For voltmeter: across (fromNode, toNode). For ammeter: through the branch between them. */
  fromNode: string;
  toNode: string;
}

/** Two-winding ideal transformer (extension hook for §06.6). */
export interface IdealTransformer {
  kind: "transformer";
  id: string;
  /** Turns ratio N_s/N_p. */
  turnsRatio: number;
  /** Coupling coefficient 0..1 (1 = ideal). */
  couplingCoefficient: number;
  primaryFrom: string;
  primaryTo: string;
  secondaryFrom: string;
  secondaryTo: string;
}

/** Distributed-parameter transmission line (extension hook for §06.7). Solver handles
 *  only the lumped limit here; full LC-ladder integration lives in the topic agent's lib. */
export interface TransmissionLine {
  kind: "transmission-line";
  id: string;
  /** Per-unit-length inductance (H/m) and capacitance (F/m). */
  lPerMeter: number;
  cPerMeter: number;
  /** Total length in metres. */
  length: number;
  fromNode: string;
  toNode: string;
}

export type CircuitElement =
  | Passive
  | Source
  | Ground
  | Switch
  | Meter
  | IdealTransformer
  | TransmissionLine;

/** A wire/edge for visual layout only — the graph topology is encoded by nodes referenced in elements. */
export interface Wire {
  id: string;
  fromNode: string;
  toNode: string;
  /** Optional polyline overrides for routing; defaults to straight line. */
  via?: Array<{ x: number; y: number }>;
}

export interface CircuitScene {
  nodes: CircuitNode[];
  wires: Wire[];
  elements: CircuitElement[];
}

/** Solver result for a single solved time step (or phasor). */
export interface SolutionSnapshot {
  /** Node voltages keyed by node id (ground node always 0). */
  nodeVoltages: Record<string, number>;
  /** Branch currents keyed by element id (sign convention: from → to). */
  branchCurrents: Record<string, number>;
  /** For AC analysis: phase angle at each node, in radians. */
  nodePhases?: Record<string, number>;
}

/** Analysis mode. */
export type AnalysisMode = "dc" | "transient" | "ac-phasor";

/** Right-hand-rule badge overlay config (every §06 scene may enable this). */
export interface RightHandRuleBadge {
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  showCurrent?: boolean;
  showVoltage?: boolean;
}
