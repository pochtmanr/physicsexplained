import { create, all } from "mathjs";
import { createHash } from "node:crypto";
import type { ProblemStep } from "@/lib/content/types";
import { normalizeStudentExpr } from "./normalize";

const math = create(all, { number: "number" });

export interface VerifyInput {
  step: ProblemStep;
  studentExpr: string;
  /**
   * The problem's concrete numerical inputs (e.g. `{ v: 25, t: 8 }`).
   * When supplied, the verifier evaluates BOTH the canonical and the
   * student expression at these concrete values and accepts on match.
   *
   * This is the path used by the live problem-page UX: the student is
   * expected to compute and type a numerical answer (e.g. `200`) for
   * the problem-stated inputs, not a symbolic formula. Symbolic
   * formulas still match (since `v * t` evaluated at v=25, t=8 = 200),
   * so we don't lose the algebraic-equivalence affordance — we just
   * stop *requiring* it.
   *
   * When omitted, the verifier falls back to its original behavior:
   * sample 5 deterministic points across `step.inputDomain` and require
   * the student expression to match the canonical at every probe. That
   * mode is still used by the symbolic-equivalence unit tests.
   */
  concreteInputs?: Record<string, number>;
}

export interface VerifyResult {
  ok: boolean;
  studentValue: number;
  canonicalValue: number;
  diff: number;
  parseError?: string;
}

const SAMPLE_COUNT = 5;

/**
 * Deterministic seeded pseudo-random in [0,1).
 * Mulberry32 — small, fast, good distribution.
 */
function seededRng(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFor(step: ProblemStep): number {
  const h = createHash("sha256").update(step.id).digest();
  return h.readUInt32LE(0);
}

function midpoints(step: ProblemStep): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, [lo, hi]] of Object.entries(step.inputDomain)) {
    out[k] = (lo + hi) / 2;
  }
  return out;
}

function sampleScopes(step: ProblemStep): Record<string, number>[] {
  const rng = seededRng(seedFor(step));
  const scopes: Record<string, number>[] = [];
  for (let i = 0; i < SAMPLE_COUNT; i++) {
    const scope: Record<string, number> = {};
    for (const [k, [lo, hi]] of Object.entries(step.inputDomain)) {
      scope[k] = lo + (hi - lo) * rng();
    }
    scopes.push(scope);
  }
  return scopes;
}

/**
 * Build the scope used when concreteInputs is supplied. Only the keys
 * referenced by the step's inputDomain are pulled through, so unrelated
 * problem-level inputs don't leak into a step that doesn't need them.
 */
function concreteScopeForStep(
  step: ProblemStep,
  concreteInputs: Record<string, number>,
): Record<string, number> {
  const scope: Record<string, number> = {};
  for (const k of Object.keys(step.inputDomain)) {
    if (k in concreteInputs) scope[k] = concreteInputs[k];
  }
  return scope;
}

export function verifyStep({
  step,
  studentExpr,
  concreteInputs,
}: VerifyInput): VerifyResult {
  const normalized = normalizeStudentExpr(studentExpr);
  if (!normalized) {
    return { ok: false, studentValue: NaN, canonicalValue: NaN, diff: NaN, parseError: "empty input" };
  }

  let studentNode, canonicalNode;
  try {
    studentNode = math.parse(normalized);
  } catch (e) {
    return { ok: false, studentValue: NaN, canonicalValue: NaN, diff: NaN, parseError: (e as Error).message };
  }
  try {
    canonicalNode = math.parse(step.canonicalExpr);
  } catch (e) {
    // Canonical is author-controlled; if it doesn't parse, that's a bug.
    return { ok: false, studentValue: NaN, canonicalValue: NaN, diff: NaN, parseError: `canonical parse failed: ${(e as Error).message}` };
  }

  const studentFn = studentNode.compile();
  const canonicalFn = canonicalNode.compile();

  // Concrete-inputs path: evaluate canonical + student at the problem's
  // stated numerical inputs and accept on numerical match. This is what
  // lets a student type "200" for v=25 m/s, t=8 s.
  if (concreteInputs) {
    const scope = concreteScopeForStep(step, concreteInputs);
    let cv: number, sv: number;
    try {
      cv = canonicalFn.evaluate(scope);
      sv = studentFn.evaluate(scope);
    } catch (e) {
      return { ok: false, studentValue: NaN, canonicalValue: NaN, diff: NaN, parseError: (e as Error).message };
    }
    const denom = Math.max(Math.abs(cv), 1e-12);
    const ok = Math.abs(cv - sv) / denom <= step.toleranceRel;
    return {
      ok,
      studentValue: Number(sv),
      canonicalValue: Number(cv),
      diff: Math.abs(Number(sv) - Number(cv)),
    };
  }

  // Symbolic-equivalence path (no concrete inputs supplied): probe at
  // midpoints + 5 deterministic random scopes. Used by the verifier's
  // own algebraic-equivalence test suite.
  const mid = midpoints(step);
  let canonicalValue: number, studentValue: number;
  try {
    canonicalValue = canonicalFn.evaluate(mid);
    studentValue = studentFn.evaluate(mid);
  } catch (e) {
    return { ok: false, studentValue: NaN, canonicalValue: NaN, diff: NaN, parseError: (e as Error).message };
  }

  let ok = true;
  for (const scope of sampleScopes(step)) {
    let cv: number, sv: number;
    try {
      cv = canonicalFn.evaluate(scope);
      sv = studentFn.evaluate(scope);
    } catch {
      ok = false;
      break;
    }
    const denom = Math.max(Math.abs(cv), 1e-12);
    if (Math.abs(cv - sv) / denom > step.toleranceRel) {
      ok = false;
      break;
    }
  }

  return {
    ok,
    studentValue: Number(studentValue),
    canonicalValue: Number(canonicalValue),
    diff: Math.abs(Number(studentValue) - Number(canonicalValue)),
  };
}
