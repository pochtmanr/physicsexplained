// app/api/problems/[id]/check/deps.ts
//
// Dependency-injection seam for the check route, kept in a sibling module
// because Next.js route files may only export the route handler + a small
// allowlist of config fields (runtime, dynamic, etc.). Test code resets
// these deps via _resetCheckRouteDeps.
import { diagnoseStep } from "@/lib/problems/diagnoser";
import { getProblem } from "@/lib/content/problems";
import { getSsrClient, getServiceClient } from "@/lib/supabase-server";
import { getProblemStringsForLocale } from "@/lib/problems/strings";
import type { Problem } from "@/lib/content/types";

export interface ProblemStrings {
  statement: string;
  steps: Record<string, { prompt: string; hint?: string; commonMistakes?: readonly string[] }>;
}

export interface CheckRouteDeps {
  getProblem: (id: string) => Problem | undefined;
  getProblemStrings: (problemId: string, locale: string) => Promise<ProblemStrings | null>;
  getUser: () => Promise<{ id: string } | null>;
  getQuota: (userId: string) => Promise<{ plan: string; diagnosesUsedToday: number }>;
  bumpDiagnosesQuota: (userId: string) => Promise<void>;
  insertAttempt: (row: { userId: string; problemId: string; stepId: string; studentExpr: string; correct: boolean }) => Promise<{ id: string }>;
  diagnoseStep: typeof diagnoseStep;
  insertDiagnosis: (row: { attemptId: string; cacheKey: string; cacheHit: boolean }) => Promise<void>;
}

export function makeDefaultDeps(): CheckRouteDeps {
  return {
    getProblem,
    getProblemStrings: getProblemStringsForLocale,
    getUser: async () => {
      const ssr = await getSsrClient();
      const { data } = await ssr.auth.getUser();
      return data.user ? { id: data.user.id } : null;
    },
    getQuota: async (userId) => {
      const db = getServiceClient();
      const { data } = await db.from("user_billing")
        .select("plan, problem_diagnoses_used_today")
        .eq("user_id", userId).maybeSingle();
      return {
        plan: data?.plan ?? "free",
        diagnosesUsedToday: data?.problem_diagnoses_used_today ?? 0,
      };
    },
    bumpDiagnosesQuota: async (userId) => {
      const db = getServiceClient();
      await db.rpc("increment_problem_diagnoses_used_today", { p_user_id: userId });
    },
    insertAttempt: async (row) => {
      const db = getServiceClient();
      const { data, error } = await db.from("problem_attempts").insert({
        user_id: row.userId, problem_id: row.problemId, step_id: row.stepId,
        student_expr: row.studentExpr, correct: row.correct,
      }).select("id").single();
      if (error) throw error;
      return { id: data.id };
    },
    diagnoseStep,
    insertDiagnosis: async (row) => {
      const db = getServiceClient();
      await db.from("problem_diagnoses").insert({
        attempt_id: row.attemptId, cache_key: row.cacheKey, cache_hit: row.cacheHit,
      });
    },
  };
}

let deps: CheckRouteDeps = makeDefaultDeps();

export function getCheckRouteDeps(): CheckRouteDeps {
  return deps;
}

export function _resetCheckRouteDeps(d: Partial<CheckRouteDeps> = {}) {
  deps = { ...makeDefaultDeps(), ...d };
}
