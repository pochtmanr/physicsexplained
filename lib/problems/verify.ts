import { create, all } from "mathjs";
import { createHash } from "node:crypto";
import type { ProblemStep } from "@/lib/content/types";
import { normalizeStudentExpr } from "./normalize";

const math = create(all, { number: "number" });

export interface VerifyInput {
  step: ProblemStep;
  studentExpr: string;
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

export function verifyStep({ step, studentExpr }: VerifyInput): VerifyResult {
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

  // Always evaluate at midpoints first so the returned numeric values are
  // stable for diagnoser display.
  const mid = midpoints(step);
  let canonicalValue: number, studentValue: number;
  try {
    canonicalValue = canonicalFn.evaluate(mid);
    studentValue = studentFn.evaluate(mid);
  } catch (e) {
    return { ok: false, studentValue: NaN, canonicalValue: NaN, diff: NaN, parseError: (e as Error).message };
  }

  // Then probe at SAMPLE_COUNT random points.
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
