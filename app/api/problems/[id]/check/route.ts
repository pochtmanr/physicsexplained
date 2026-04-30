// app/api/problems/[id]/check/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyStep } from "@/lib/problems/verify";
import { diagnoseStep } from "@/lib/problems/diagnoser";
import { getProblem } from "@/lib/content/problems";
import { getSsrClient, getServiceClient } from "@/lib/supabase-server";
import { getProblemStringsForLocale } from "@/lib/problems/strings";
import type { Problem } from "@/lib/content/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  stepId: z.string().min(1).max(80),
  studentExpr: z.string().min(1).max(2000),
  locale: z.string().min(2).max(5),
});

interface ProblemStrings {
  statement: string;
  steps: Record<string, { prompt: string; hint?: string; commonMistakes?: readonly string[] }>;
}

interface CheckRouteDeps {
  getProblem: (id: string) => Problem | undefined;
  getProblemStrings: (problemId: string, locale: string) => Promise<ProblemStrings | null>;
  getUser: () => Promise<{ id: string } | null>;
  getQuota: (userId: string) => Promise<{ plan: string; diagnosesUsedToday: number }>;
  bumpDiagnosesQuota: (userId: string) => Promise<void>;
  insertAttempt: (row: { userId: string; problemId: string; stepId: string; studentExpr: string; correct: boolean }) => Promise<{ id: string }>;
  diagnoseStep: typeof diagnoseStep;
  insertDiagnosis: (row: { attemptId: string; cacheKey: string; cacheHit: boolean }) => Promise<void>;
}

let deps: CheckRouteDeps = makeDefaultDeps();

function makeDefaultDeps(): CheckRouteDeps {
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

export function _resetCheckRouteDeps(d: Partial<Record<keyof CheckRouteDeps, any>>) {
  deps = { ...makeDefaultDeps(), ...d };
}

const FREE_DIAGNOSES_PER_DAY = 5;

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: problemId } = await ctx.params;

  let body: z.infer<typeof BodySchema>;
  try { body = BodySchema.parse(await req.json()); }
  catch (e) { return NextResponse.json({ error: "BAD_REQUEST", message: (e as Error).message }, { status: 400 }); }

  const user = await deps.getUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const problem = deps.getProblem(problemId);
  if (!problem) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const step = problem.steps.find((s) => s.id === body.stepId);
  if (!step) return NextResponse.json({ error: "BAD_STEP_ID" }, { status: 400 });

  const verify = verifyStep({ step, studentExpr: body.studentExpr });
  const attempt = await deps.insertAttempt({
    userId: user.id, problemId, stepId: body.stepId,
    studentExpr: body.studentExpr, correct: verify.ok,
  });

  if (verify.ok) {
    return NextResponse.json({ verify });
  }

  // Wrong step → maybe diagnose.
  const quota = await deps.getQuota(user.id);
  const isFree = quota.plan === "free";
  if (isFree && quota.diagnosesUsedToday >= FREE_DIAGNOSES_PER_DAY) {
    return NextResponse.json({ verify, quotaExhausted: true });
  }

  const strings = await deps.getProblemStrings(problemId, body.locale);
  const stepStrings = strings?.steps[body.stepId];
  if (!strings || !stepStrings) {
    return NextResponse.json({ error: "STRINGS_MISSING" }, { status: 500 });
  }

  const diag = await deps.diagnoseStep({
    problemStatement: strings.statement,
    step,
    stepPrompt: stepStrings.prompt,
    commonMistakes: stepStrings.commonMistakes ?? [],
    studentExpr: body.studentExpr,
    canonicalValue: verify.canonicalValue,
    studentValue: verify.studentValue,
    locale: body.locale,
  });

  await deps.insertDiagnosis({ attemptId: attempt.id, cacheKey: diag.cacheKey, cacheHit: diag.cacheHit });

  if (!diag.cacheHit) {
    await deps.bumpDiagnosesQuota(user.id);
  }

  return NextResponse.json({ verify, diagnosis: diag.text });
}
