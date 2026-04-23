/**
 * CircuitCanvas solver — Modified Nodal Analysis (MNA).
 *
 * Three modes:
 *   - solveDC:        DC steady state. Capacitors open, inductors short.
 *   - solveTransient: backward-Euler companion models for C and L.
 *   - solveACPhasor:  complex-impedance MNA at a given angular frequency.
 *
 * Conventions:
 *   - Ground is node id "0", always at 0 V.
 *   - Branch currents keyed by element id, sign = from → to.
 *   - Voltage sources: fromNode is +, toNode is −. Branch current is
 *     the current flowing INTO the + terminal (conventional MNA).
 *   - Resistor branch current is computed post-hoc as (V_from − V_to) / R.
 *
 * Dense Gauss–Jordan with partial pivoting — no external dep.
 */

import type {
  CircuitScene,
  SolutionSnapshot,
  Passive,
  Source,
  Switch,
  CircuitElement,
} from "./types";

// ---------- Linear algebra (real) ----------

/** In-place Gauss-Jordan with partial pivoting. Returns x such that A x = b. */
function solveLinearReal(A: number[][], b: number[]): number[] {
  const n = b.length;
  // Build augmented matrix copy.
  const M: number[][] = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    // Partial pivot: find row with largest |M[row][col]| in rows col..n-1.
    let pivot = col;
    let best = Math.abs(M[col][col]);
    for (let row = col + 1; row < n; row++) {
      const v = Math.abs(M[row][col]);
      if (v > best) {
        best = v;
        pivot = row;
      }
    }
    if (best < 1e-14) {
      throw new Error(`solveLinearReal: singular matrix at column ${col}`);
    }
    if (pivot !== col) {
      const tmp = M[col];
      M[col] = M[pivot];
      M[pivot] = tmp;
    }
    // Normalize pivot row.
    const piv = M[col][col];
    for (let j = col; j <= n; j++) M[col][j] /= piv;
    // Eliminate other rows.
    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = M[row][col];
      if (factor === 0) continue;
      for (let j = col; j <= n; j++) {
        M[row][j] -= factor * M[col][j];
      }
    }
  }
  return M.map((row) => row[n]);
}

// ---------- Complex arithmetic ----------

interface C {
  re: number;
  im: number;
}

const cZero: C = { re: 0, im: 0 };
const cAdd = (a: C, b: C): C => ({ re: a.re + b.re, im: a.im + b.im });
const cSub = (a: C, b: C): C => ({ re: a.re - b.re, im: a.im - b.im });
const cMul = (a: C, b: C): C => ({
  re: a.re * b.re - a.im * b.im,
  im: a.re * b.im + a.im * b.re,
});
const cDiv = (a: C, b: C): C => {
  const denom = b.re * b.re + b.im * b.im;
  return {
    re: (a.re * b.re + a.im * b.im) / denom,
    im: (a.im * b.re - a.re * b.im) / denom,
  };
};
const cAbs = (a: C): number => Math.hypot(a.re, a.im);
const cNeg = (a: C): C => ({ re: -a.re, im: -a.im });

/** Gauss-Jordan on a complex system A x = b. */
function solveLinearComplex(A: C[][], b: C[]): C[] {
  const n = b.length;
  const M: C[][] = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    let best = cAbs(M[col][col]);
    for (let row = col + 1; row < n; row++) {
      const v = cAbs(M[row][col]);
      if (v > best) {
        best = v;
        pivot = row;
      }
    }
    if (best < 1e-14) {
      throw new Error(`solveLinearComplex: singular matrix at column ${col}`);
    }
    if (pivot !== col) {
      const tmp = M[col];
      M[col] = M[pivot];
      M[pivot] = tmp;
    }
    const piv = M[col][col];
    for (let j = col; j <= n; j++) M[col][j] = cDiv(M[col][j], piv);
    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = M[row][col];
      if (factor.re === 0 && factor.im === 0) continue;
      for (let j = col; j <= n; j++) {
        M[row][j] = cSub(M[row][j], cMul(factor, M[col][j]));
      }
    }
  }
  return M.map((row) => row[n]);
}

// ---------- Scene utilities ----------

/** Collect all unique node ids from the scene. */
function collectNodeIds(scene: CircuitScene): string[] {
  const set = new Set<string>();
  for (const n of scene.nodes) set.add(n.id);
  for (const e of scene.elements) {
    if ("fromNode" in e) set.add(e.fromNode);
    if ("toNode" in e) set.add(e.toNode);
    if (e.kind === "ground") set.add(e.atNode);
    if (e.kind === "transformer") {
      set.add(e.primaryFrom);
      set.add(e.primaryTo);
      set.add(e.secondaryFrom);
      set.add(e.secondaryTo);
    }
  }
  return Array.from(set);
}

/** Build node index: ground ("0") → 0, others → 1..N-1. Returns map. */
function buildNodeIndex(scene: CircuitScene): Map<string, number> {
  const ids = collectNodeIds(scene);
  const hasGround = ids.includes("0");
  if (!hasGround) {
    // Still accept scenes that imply ground through Ground elements but not node id "0".
    // The Ground element's atNode becomes the reference.
    const gnd = scene.elements.find((e) => e.kind === "ground");
    if (gnd && gnd.kind === "ground") {
      // Remap: treat gnd.atNode as node "0".
      // Caller should already be using "0" by convention, so this path is rare.
    }
  }
  const sorted = ["0", ...ids.filter((id) => id !== "0").sort()];
  const map = new Map<string, number>();
  sorted.forEach((id, i) => map.set(id, i));
  return map;
}

const isPassive = (e: CircuitElement): e is Passive =>
  e.kind === "resistor" || e.kind === "capacitor" || e.kind === "inductor";
const isSource = (e: CircuitElement): e is Source =>
  e.kind === "dc-voltage" ||
  e.kind === "dc-current" ||
  e.kind === "ac-voltage" ||
  e.kind === "ac-current";

// ---------- DC solver ----------

/**
 * DC MNA. Extra branch variables for:
 *   - every voltage source (DC or AC — AC treated as its amplitude × cos(phase))
 *   - every inductor (short-circuit → 0-ohm voltage source at 0 V)
 *   - every closed switch (0-ohm voltage source at 0 V)
 *
 * Capacitors are open-circuited (no stamp).
 * Current sources contribute directly to the RHS b vector.
 */
export function solveDC(scene: CircuitScene): SolutionSnapshot {
  const nodeIdx = buildNodeIndex(scene);
  const N = nodeIdx.size; // includes ground
  const nNodes = N - 1; // unknowns: node voltages except ground

  // Extra branch-current unknowns.
  interface BranchVar {
    elementId: string;
    kind: "voltage-source" | "inductor-short" | "switch";
    fromNode: string;
    toNode: string;
    /** Imposed voltage across the branch (V_from − V_to). */
    vAcross: number;
  }
  const branchVars: BranchVar[] = [];

  for (const e of scene.elements) {
    if (e.kind === "dc-voltage") {
      branchVars.push({
        elementId: e.id,
        kind: "voltage-source",
        fromNode: e.fromNode,
        toNode: e.toNode,
        vAcross: e.value,
      });
    } else if (e.kind === "ac-voltage") {
      // DC analysis of an AC source: use instantaneous value at t=0 (amplitude·cos(phase)).
      const v = e.value * Math.cos(e.phase ?? 0);
      branchVars.push({
        elementId: e.id,
        kind: "voltage-source",
        fromNode: e.fromNode,
        toNode: e.toNode,
        vAcross: v,
      });
    } else if (e.kind === "inductor") {
      branchVars.push({
        elementId: e.id,
        kind: "inductor-short",
        fromNode: e.fromNode,
        toNode: e.toNode,
        vAcross: 0,
      });
    } else if (e.kind === "switch" && e.closed) {
      branchVars.push({
        elementId: e.id,
        kind: "switch",
        fromNode: e.fromNode,
        toNode: e.toNode,
        vAcross: 0,
      });
    }
  }

  const nBranches = branchVars.length;
  const nUnknowns = nNodes + nBranches;
  const A: number[][] = Array.from({ length: nUnknowns }, () =>
    new Array(nUnknowns).fill(0),
  );
  const b: number[] = new Array(nUnknowns).fill(0);

  // Helper: index of a node in unknown vector (ground → -1 means clamped to 0).
  const nodeRow = (id: string): number => {
    const i = nodeIdx.get(id);
    if (i === undefined) throw new Error(`DC: unknown node ${id}`);
    return i === 0 ? -1 : i - 1;
  };

  // Stamp resistors (admittance G = 1/R).
  for (const e of scene.elements) {
    if (e.kind === "resistor") {
      const G = 1 / e.value;
      const i = nodeRow(e.fromNode);
      const j = nodeRow(e.toNode);
      if (i >= 0) A[i][i] += G;
      if (j >= 0) A[j][j] += G;
      if (i >= 0 && j >= 0) {
        A[i][j] -= G;
        A[j][i] -= G;
      }
    }
    // Capacitors: open circuit at DC — no stamp.
    // Current sources.
    if (e.kind === "dc-current") {
      const i = nodeRow(e.fromNode);
      const j = nodeRow(e.toNode);
      // Convention: current flows from fromNode to toNode externally, so
      // current LEAVES fromNode and ENTERS toNode. KCL: sum of currents out = 0.
      // Source injects current INTO toNode (positive terminal of source points there).
      // Actually, convention varies. We use: current flows OUT of fromNode into external circuit.
      if (i >= 0) b[i] -= e.value;
      if (j >= 0) b[j] += e.value;
    }
  }

  // Stamp branch-variable rows (voltage-source style).
  for (let k = 0; k < nBranches; k++) {
    const br = branchVars[k];
    const row = nNodes + k;
    const i = nodeRow(br.fromNode);
    const j = nodeRow(br.toNode);
    // KCL: the branch current enters the KCL sums at its two nodes with ±1.
    //   fromNode KCL: +I_branch leaving → +1 column
    //   toNode KCL:   −I_branch leaving → −1 column
    if (i >= 0) A[i][nNodes + k] += 1;
    if (j >= 0) A[j][nNodes + k] -= 1;
    // Branch equation: V_from − V_to = vAcross
    if (i >= 0) A[row][i] += 1;
    if (j >= 0) A[row][j] -= 1;
    b[row] = br.vAcross;
  }

  // Solve.
  let x: number[];
  if (nUnknowns === 0) {
    x = [];
  } else {
    x = solveLinearReal(A, b);
  }

  // Extract node voltages.
  const nodeVoltages: Record<string, number> = { "0": 0 };
  for (const [id, idx] of nodeIdx) {
    if (id === "0") continue;
    nodeVoltages[id] = x[idx - 1] ?? 0;
  }

  // Extract branch currents: first from the branch-var unknowns.
  const branchCurrents: Record<string, number> = {};
  for (let k = 0; k < nBranches; k++) {
    branchCurrents[branchVars[k].elementId] = x[nNodes + k];
  }
  // Resistor currents: (V_from − V_to) / R.
  for (const e of scene.elements) {
    if (e.kind === "resistor") {
      const v = nodeVoltages[e.fromNode] - nodeVoltages[e.toNode];
      branchCurrents[e.id] = v / e.value;
    }
    // Capacitor at DC: zero current.
    if (e.kind === "capacitor") {
      branchCurrents[e.id] = 0;
    }
    // Current sources: by definition.
    if (e.kind === "dc-current") {
      branchCurrents[e.id] = e.value;
    }
  }

  return { nodeVoltages, branchCurrents };
}

// ---------- Transient solver (backward Euler) ----------

/**
 * Backward-Euler transient. Companion models:
 *   Capacitor: G_eq = C/h, I_eq current-source FROM toNode TO fromNode with value G_eq · v_prev
 *     where v_prev = V(fromNode) − V(toNode) at previous step.
 *     Equivalent: resistor G_eq plus current source injecting G_eq·v_prev from '−' to '+' terminal.
 *   Inductor: G_eq = h/L, I_eq = i_prev + G_eq · v_prev where v_prev is across (from − to) at prev step.
 *     Direction: the companion-model current source pushes current FROM fromNode TO toNode
 *     with value (i_prev + G_eq · v_prev) — equivalent Norton form.
 *
 * Returns one SolutionSnapshot per integration step, length = ceil(totalTime / dt) + 1 (step 0 = initial).
 */
export function solveTransient(
  scene: CircuitScene,
  totalTime: number,
  dt: number,
): SolutionSnapshot[] {
  if (dt <= 0) throw new Error("solveTransient: dt must be positive");
  if (totalTime <= 0) throw new Error("solveTransient: totalTime must be positive");

  const nodeIdx = buildNodeIndex(scene);
  const N = nodeIdx.size;
  const nNodes = N - 1;

  // Collect reactive elements and their state.
  const caps = scene.elements.filter((e): e is Passive => e.kind === "capacitor");
  const inds = scene.elements.filter((e): e is Passive => e.kind === "inductor");
  // Voltage sources become extra branch variables.
  const vsources = scene.elements.filter(
    (e): e is Source => e.kind === "dc-voltage" || e.kind === "ac-voltage",
  );
  const closedSwitches = scene.elements.filter(
    (e): e is Switch => e.kind === "switch" && e.closed,
  );

  const nBranches = vsources.length + closedSwitches.length;
  const nUnknowns = nNodes + nBranches;

  // Initial conditions: all capacitor voltages and inductor currents start at 0.
  const capV: number[] = caps.map(() => 0);
  const indI: number[] = inds.map(() => 0);

  const nodeRow = (id: string): number => {
    const i = nodeIdx.get(id);
    if (i === undefined) throw new Error(`transient: unknown node ${id}`);
    return i === 0 ? -1 : i - 1;
  };

  const nSteps = Math.ceil(totalTime / dt) + 1;
  const snapshots: SolutionSnapshot[] = [];

  // Initial snapshot (t=0): all zero.
  {
    const nv: Record<string, number> = {};
    for (const id of nodeIdx.keys()) nv[id] = 0;
    const bc: Record<string, number> = {};
    for (const e of scene.elements) bc[e.id] = 0;
    snapshots.push({ nodeVoltages: nv, branchCurrents: bc });
  }

  for (let step = 1; step < nSteps; step++) {
    const t = step * dt;
    const A: number[][] = Array.from({ length: nUnknowns }, () =>
      new Array(nUnknowns).fill(0),
    );
    const b: number[] = new Array(nUnknowns).fill(0);

    // Resistors.
    for (const e of scene.elements) {
      if (e.kind === "resistor") {
        const G = 1 / e.value;
        const i = nodeRow(e.fromNode);
        const j = nodeRow(e.toNode);
        if (i >= 0) A[i][i] += G;
        if (j >= 0) A[j][j] += G;
        if (i >= 0 && j >= 0) {
          A[i][j] -= G;
          A[j][i] -= G;
        }
      }
    }

    // Capacitor companion: G_eq = C/h, current source = G_eq · v_prev (from '+' terminal toward external circuit).
    // In MNA stamping: treat as resistor G_eq plus current source injection.
    // Companion source injects I_eq INTO fromNode (and OUT of toNode) where
    // I_eq = G_eq · v_prev (since backward Euler: i_n = C (v_n − v_prev)/h ⇒
    //   i_n = G_eq · v_n − G_eq · v_prev; moving const to RHS: at the fromNode KCL
    //   we add −G_eq · v_prev (current flowing FROM the cap into node is positive;
    //   companion injects +G_eq·v_prev into fromNode).
    caps.forEach((c, k) => {
      const G = c.value / dt;
      const i = nodeRow(c.fromNode);
      const j = nodeRow(c.toNode);
      if (i >= 0) A[i][i] += G;
      if (j >= 0) A[j][j] += G;
      if (i >= 0 && j >= 0) {
        A[i][j] -= G;
        A[j][i] -= G;
      }
      const Ieq = G * capV[k];
      if (i >= 0) b[i] += Ieq;
      if (j >= 0) b[j] -= Ieq;
    });

    // Inductor companion: G_eq = h/L, I_eq = i_prev + G_eq · v_prev where v_prev = v_from − v_to.
    // i_n = i_prev + (h/L) · v_n  (backward Euler: di/dt = v/L ⇒ i_n − i_prev = h v_n / L)
    // Wait — backward Euler uses v_n:  i_n = i_prev + (h/L) v_n  ⇒ as Norton:
    //   i_n = G_eq · v_n + i_prev. So companion is G_eq (resistor) with a current source
    //   of value i_prev pushing from fromNode to toNode (consistent with inductor current direction).
    // Stamp: at fromNode KCL, current leaving via inductor = i_n.
    //   Resistor stamp contributes G_eq · (v_from − v_to) leaving from fromNode.
    //   The extra i_prev current leaving fromNode is a source: b[fromNode] -= i_prev.
    inds.forEach((l, k) => {
      const G = dt / l.value;
      const i = nodeRow(l.fromNode);
      const j = nodeRow(l.toNode);
      if (i >= 0) A[i][i] += G;
      if (j >= 0) A[j][j] += G;
      if (i >= 0 && j >= 0) {
        A[i][j] -= G;
        A[j][i] -= G;
      }
      const Iprev = indI[k];
      // i_n flows from fromNode to toNode; i_prev part is a constant → at fromNode KCL,
      // current LEAVING fromNode includes +i_prev; at toNode, current ENTERING is +i_prev.
      if (i >= 0) b[i] -= Iprev;
      if (j >= 0) b[j] += Iprev;
    });

    // Current sources.
    for (const e of scene.elements) {
      if (e.kind === "dc-current") {
        const i = nodeRow(e.fromNode);
        const j = nodeRow(e.toNode);
        if (i >= 0) b[i] -= e.value;
        if (j >= 0) b[j] += e.value;
      } else if (e.kind === "ac-current") {
        const val = e.value * Math.sin((e.omega ?? 0) * t + (e.phase ?? 0));
        const i = nodeRow(e.fromNode);
        const j = nodeRow(e.toNode);
        if (i >= 0) b[i] -= val;
        if (j >= 0) b[j] += val;
      }
    }

    // Voltage-source branch variables.
    vsources.forEach((vs, k) => {
      const row = nNodes + k;
      const i = nodeRow(vs.fromNode);
      const j = nodeRow(vs.toNode);
      if (i >= 0) A[i][nNodes + k] += 1;
      if (j >= 0) A[j][nNodes + k] -= 1;
      if (i >= 0) A[row][i] += 1;
      if (j >= 0) A[row][j] -= 1;
      let v: number;
      if (vs.kind === "dc-voltage") v = vs.value;
      else v = vs.value * Math.sin((vs.omega ?? 0) * t + (vs.phase ?? 0));
      b[row] = v;
    });

    // Closed switches: act as 0-V sources.
    closedSwitches.forEach((sw, k) => {
      const row = nNodes + vsources.length + k;
      const i = nodeRow(sw.fromNode);
      const j = nodeRow(sw.toNode);
      const bIdx = nNodes + vsources.length + k;
      if (i >= 0) A[i][bIdx] += 1;
      if (j >= 0) A[j][bIdx] -= 1;
      if (i >= 0) A[row][i] += 1;
      if (j >= 0) A[row][j] -= 1;
      b[row] = 0;
    });

    // Solve.
    let x: number[] = [];
    if (nUnknowns > 0) x = solveLinearReal(A, b);

    // Extract voltages + currents.
    const nodeVoltages: Record<string, number> = { "0": 0 };
    for (const [id, idx] of nodeIdx) {
      if (id === "0") continue;
      nodeVoltages[id] = x[idx - 1] ?? 0;
    }

    const branchCurrents: Record<string, number> = {};
    // Voltage-source branches:
    vsources.forEach((vs, k) => {
      branchCurrents[vs.id] = x[nNodes + k];
    });
    closedSwitches.forEach((sw, k) => {
      branchCurrents[sw.id] = x[nNodes + vsources.length + k];
    });
    // Resistors.
    for (const e of scene.elements) {
      if (e.kind === "resistor") {
        branchCurrents[e.id] =
          (nodeVoltages[e.fromNode] - nodeVoltages[e.toNode]) / e.value;
      }
    }
    // Capacitors: i = G_eq (v_n − v_prev).
    caps.forEach((c, k) => {
      const vNow = nodeVoltages[c.fromNode] - nodeVoltages[c.toNode];
      const G = c.value / dt;
      branchCurrents[c.id] = G * (vNow - capV[k]);
      // Update state.
      capV[k] = vNow;
    });
    // Inductors: i_n = G_eq · v_n + i_prev.
    inds.forEach((l, k) => {
      const vNow = nodeVoltages[l.fromNode] - nodeVoltages[l.toNode];
      const G = dt / l.value;
      const iNow = G * vNow + indI[k];
      branchCurrents[l.id] = iNow;
      indI[k] = iNow;
    });
    // Current sources.
    for (const e of scene.elements) {
      if (e.kind === "dc-current") branchCurrents[e.id] = e.value;
      else if (e.kind === "ac-current") {
        branchCurrents[e.id] =
          e.value * Math.sin((e.omega ?? 0) * t + (e.phase ?? 0));
      }
    }

    snapshots.push({ nodeVoltages, branchCurrents });
  }

  return snapshots;
}

// ---------- AC phasor solver ----------

/**
 * AC phasor at angular frequency omega.
 *   Resistor: Y = 1/R
 *   Capacitor: Y = jωC
 *   Inductor: Y = 1/(jωL) = −j/(ωL)
 * Voltage sources become extra complex branch variables (amplitude·e^{jφ}).
 */
export function solveACPhasor(
  scene: CircuitScene,
  omega: number,
): SolutionSnapshot {
  const nodeIdx = buildNodeIndex(scene);
  const N = nodeIdx.size;
  const nNodes = N - 1;

  const vsources = scene.elements.filter(
    (e): e is Source => e.kind === "ac-voltage" || e.kind === "dc-voltage",
  );
  const nBranches = vsources.length;
  const nUnknowns = nNodes + nBranches;

  const nodeRow = (id: string): number => {
    const i = nodeIdx.get(id);
    if (i === undefined) throw new Error(`AC: unknown node ${id}`);
    return i === 0 ? -1 : i - 1;
  };

  const A: C[][] = Array.from({ length: nUnknowns }, () =>
    Array.from({ length: nUnknowns }, () => ({ re: 0, im: 0 })),
  );
  const b: C[] = new Array(nUnknowns).fill(null).map(() => ({ re: 0, im: 0 }));

  const stampY = (y: C, fromId: string, toId: string) => {
    const i = nodeRow(fromId);
    const j = nodeRow(toId);
    if (i >= 0) A[i][i] = cAdd(A[i][i], y);
    if (j >= 0) A[j][j] = cAdd(A[j][j], y);
    if (i >= 0 && j >= 0) {
      A[i][j] = cSub(A[i][j], y);
      A[j][i] = cSub(A[j][i], y);
    }
  };

  for (const e of scene.elements) {
    if (e.kind === "resistor") {
      stampY({ re: 1 / e.value, im: 0 }, e.fromNode, e.toNode);
    } else if (e.kind === "capacitor") {
      // Y = jωC
      stampY({ re: 0, im: omega * e.value }, e.fromNode, e.toNode);
    } else if (e.kind === "inductor") {
      // Y = 1/(jωL) = −j/(ωL). If omega == 0, the inductor is a short — treat as tiny R.
      if (omega === 0) {
        // At DC limit: inductor → short. Add a very large admittance.
        stampY({ re: 1e9, im: 0 }, e.fromNode, e.toNode);
      } else {
        stampY({ re: 0, im: -1 / (omega * e.value) }, e.fromNode, e.toNode);
      }
    } else if (e.kind === "dc-current") {
      // DC current source in AC analysis contributes only at ω=0; here ignored unless omega==0.
      if (omega === 0) {
        const i = nodeRow(e.fromNode);
        const j = nodeRow(e.toNode);
        if (i >= 0) b[i] = cSub(b[i], { re: e.value, im: 0 });
        if (j >= 0) b[j] = cAdd(b[j], { re: e.value, im: 0 });
      }
    } else if (e.kind === "ac-current") {
      // Phasor = amplitude · e^{jφ}
      const phi = e.phase ?? 0;
      const val: C = { re: e.value * Math.cos(phi), im: e.value * Math.sin(phi) };
      const i = nodeRow(e.fromNode);
      const j = nodeRow(e.toNode);
      if (i >= 0) b[i] = cSub(b[i], val);
      if (j >= 0) b[j] = cAdd(b[j], val);
    }
  }

  // Voltage-source branches.
  vsources.forEach((vs, k) => {
    const row = nNodes + k;
    const i = nodeRow(vs.fromNode);
    const j = nodeRow(vs.toNode);
    const one: C = { re: 1, im: 0 };
    const neg: C = { re: -1, im: 0 };
    if (i >= 0) A[i][nNodes + k] = cAdd(A[i][nNodes + k], one);
    if (j >= 0) A[j][nNodes + k] = cAdd(A[j][nNodes + k], neg);
    if (i >= 0) A[row][i] = cAdd(A[row][i], one);
    if (j >= 0) A[row][j] = cAdd(A[row][j], neg);
    let phasor: C;
    if (vs.kind === "dc-voltage") {
      phasor = { re: vs.value, im: 0 };
    } else {
      const phi = vs.phase ?? 0;
      phasor = { re: vs.value * Math.cos(phi), im: vs.value * Math.sin(phi) };
    }
    b[row] = phasor;
  });

  let x: C[] = [];
  if (nUnknowns > 0) x = solveLinearComplex(A, b);

  const nodeVoltages: Record<string, number> = { "0": 0 };
  const nodePhases: Record<string, number> = { "0": 0 };
  for (const [id, idx] of nodeIdx) {
    if (id === "0") continue;
    const v = x[idx - 1] ?? cZero;
    nodeVoltages[id] = cAbs(v);
    nodePhases[id] = Math.atan2(v.im, v.re);
  }

  const branchCurrents: Record<string, number> = {};
  // Voltage-source branch currents (magnitude).
  vsources.forEach((vs, k) => {
    const iBr = x[nNodes + k] ?? cZero;
    branchCurrents[vs.id] = cAbs(iBr);
  });
  // Resistor / capacitor / inductor currents: I = Y · (V_from − V_to).
  for (const e of scene.elements) {
    if (e.kind === "resistor" || e.kind === "capacitor" || e.kind === "inductor") {
      const vFrom = e.fromNode === "0" ? cZero : x[(nodeIdx.get(e.fromNode) as number) - 1];
      const vTo = e.toNode === "0" ? cZero : x[(nodeIdx.get(e.toNode) as number) - 1];
      const dv = cSub(vFrom, vTo);
      let y: C;
      if (e.kind === "resistor") y = { re: 1 / e.value, im: 0 };
      else if (e.kind === "capacitor") y = { re: 0, im: omega * e.value };
      else {
        // inductor
        if (omega === 0) y = { re: 1e9, im: 0 };
        else y = { re: 0, im: -1 / (omega * e.value) };
      }
      const i = cMul(y, dv);
      branchCurrents[e.id] = cAbs(i);
    }
  }

  return { nodeVoltages, branchCurrents, nodePhases };
}

// ---------- Thevenin helper ----------

/**
 * Thevenin equivalent at (portFrom, portTo).
 *   vOpen = open-circuit voltage = V(portFrom) − V(portTo) with port left open.
 *   rThevenin = zero all independent sources, solve for the resistance seen between the two ports.
 *     Method: inject a 1 A test current from portTo into portFrom (so current flows into portFrom),
 *     read V(portFrom) − V(portTo); R_th = ΔV / 1 A.
 */
export function thevenin(
  scene: CircuitScene,
  portFrom: string,
  portTo: string,
): { vOpen: number; rThevenin: number } {
  // Open-circuit voltage — just solve DC directly, measure across the port.
  const solOpen = solveDC(scene);
  const vOpen =
    (solOpen.nodeVoltages[portFrom] ?? 0) - (solOpen.nodeVoltages[portTo] ?? 0);

  // Deactivate sources: DC voltage sources → short (0 V), DC current sources → open (removed).
  // We build a modified scene.
  const deactivated: CircuitScene = {
    nodes: scene.nodes,
    wires: scene.wires,
    elements: scene.elements
      .map((e): CircuitElement | null => {
        if (e.kind === "dc-voltage" || e.kind === "ac-voltage") {
          // Replace with zero-volt source (short) — use a dc-voltage with value 0.
          return {
            kind: "dc-voltage",
            id: e.id,
            value: 0,
            fromNode: e.fromNode,
            toNode: e.toNode,
          };
        }
        if (e.kind === "dc-current" || e.kind === "ac-current") {
          // Remove entirely (open).
          return null;
        }
        return e;
      })
      .filter((e): e is CircuitElement => e !== null),
  };

  // Add a test current source: 1 A from portTo to portFrom, meaning current injected INTO portFrom.
  const testElements: CircuitElement[] = [
    ...deactivated.elements,
    {
      kind: "dc-current",
      id: "__thevenin_test__",
      value: 1,
      fromNode: portTo, // current leaves portTo
      toNode: portFrom, // current enters portFrom
    },
  ];
  // Wait — our dc-current-source convention in solveDC is:
  //   b[fromNode] -= value (current leaves fromNode)
  //   b[toNode]   += value (current enters toNode)
  // So with fromNode=portTo, toNode=portFrom, we inject 1 A INTO portFrom and WITHDRAW 1 A from portTo.
  // That's what we want: V(portFrom) − V(portTo) = R_th · 1 = R_th.

  const testScene: CircuitScene = { ...deactivated, elements: testElements };
  const solTest = solveDC(testScene);
  const dv =
    (solTest.nodeVoltages[portFrom] ?? 0) - (solTest.nodeVoltages[portTo] ?? 0);
  const rThevenin = dv / 1;

  return { vOpen, rThevenin };
}
