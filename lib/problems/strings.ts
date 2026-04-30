// lib/problems/strings.ts — server-only loader for localized problem strings.
import { getServiceClient } from "@/lib/supabase-server";

export interface ProblemStrings {
  statement: string;
  steps: Record<string, { prompt: string; hint?: string; commonMistakes?: readonly string[] }>;
  walkthrough?: string;
}

export async function getProblemStringsForLocale(problemId: string, locale: string): Promise<ProblemStrings | null> {
  const db = getServiceClient();
  const { data } = await db.from("problem_strings")
    .select("statement, steps_json, walkthrough")
    .eq("problem_id", problemId).eq("locale", locale).maybeSingle();
  if (!data) return null;
  return {
    statement: data.statement,
    steps: (data.steps_json ?? {}) as ProblemStrings["steps"],
    walkthrough: data.walkthrough ?? undefined,
  };
}
