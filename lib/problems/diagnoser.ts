import { createHash } from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import type { ProblemStep } from "@/lib/content/types";
import { normalizeStudentExpr } from "./normalize";
import { getServiceClient } from "@/lib/supabase-server";

export interface DiagnoseInput {
  problemStatement: string;
  step: ProblemStep;
  stepPrompt: string;
  commonMistakes: readonly string[];
  studentExpr: string;
  canonicalValue: number;
  studentValue: number;
  locale: string;
}

export interface DiagnoseResult {
  text: string;
  cacheKey: string;
  cacheHit: boolean;
  promptTokens: number;
  completionTokens: number;
}

interface CachedDiagnosis {
  diagnosisText: string;
  promptTokens: number;
  completionTokens: number;
}

interface DiagnoserDeps {
  anthropicCreate: (args: {
    model: string;
    max_tokens: number;
    temperature: number;
    system: string;
    messages: { role: "user"; content: string }[];
  }) => Promise<{ content: Array<{ type: string; text?: string }>; usage: { input_tokens: number; output_tokens: number } }>;
  cacheGet: (key: string) => Promise<CachedDiagnosis | null>;
  cachePut: (key: string, value: CachedDiagnosis) => Promise<void>;
}

const SYSTEM_PROMPT = `You are a physics tutor diagnosing a single wrong step in a homework problem. The student's algebra has been numerically verified as incorrect. Write ONE paragraph (≤80 words), no LaTeX, no preamble, no encouragement fluff. Identify what went wrong and what to try instead. Refer to the listed common mistakes if they match.`;

let deps: DiagnoserDeps = makeDefaultDeps();

function makeDefaultDeps(): DiagnoserDeps {
  return {
    anthropicCreate: async (args) => {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const res = await client.messages.create(args);
      return res as unknown as { content: Array<{ type: string; text?: string }>; usage: { input_tokens: number; output_tokens: number } };
    },
    cacheGet: async (key) => {
      const db = getServiceClient();
      const { data } = await db
        .from("diagnosis_cache")
        .select("diagnosis_text, prompt_tokens, completion_tokens")
        .eq("cache_key", key)
        .maybeSingle();
      if (!data) return null;
      return {
        diagnosisText: data.diagnosis_text,
        promptTokens: data.prompt_tokens,
        completionTokens: data.completion_tokens,
      };
    },
    cachePut: async (key, value) => {
      const db = getServiceClient();
      await db.from("diagnosis_cache").insert({
        cache_key: key,
        diagnosis_text: value.diagnosisText,
        prompt_tokens: value.promptTokens,
        completion_tokens: value.completionTokens,
      });
    },
  };
}

/** Test-only: inject mocked dependencies. */
export function _resetDiagnoserDeps(d: Partial<DiagnoserDeps>) {
  deps = { ...makeDefaultDeps(), ...d };
}

function makeCacheKey(stepId: string, normalizedExpr: string): string {
  return createHash("sha256").update(`${stepId}:${normalizedExpr}`).digest("hex");
}

function buildUserMessage(input: DiagnoseInput): string {
  return [
    `Problem: ${input.problemStatement}`,
    `Step ${input.step.id} (${input.step.varName}): ${input.stepPrompt}`,
    `Canonical expression: ${input.step.canonicalExpr}`,
    `Student expression: ${input.studentExpr}`,
    `Numeric values at default inputs: canonical = ${input.canonicalValue}, student = ${input.studentValue}`,
    `Common mistakes for this step: ${input.commonMistakes.join("; ")}`,
    `Locale: ${input.locale}`,
  ].join("\n");
}

export async function diagnoseStep(input: DiagnoseInput): Promise<DiagnoseResult> {
  const normalized = normalizeStudentExpr(input.studentExpr);
  const cacheKey = makeCacheKey(input.step.id, normalized);

  const cached = await deps.cacheGet(cacheKey);
  if (cached) {
    return {
      text: cached.diagnosisText,
      cacheKey,
      cacheHit: true,
      promptTokens: cached.promptTokens,
      completionTokens: cached.completionTokens,
    };
  }

  const res = await deps.anthropicCreate({
    model: "claude-sonnet-4-6",
    max_tokens: 200,
    temperature: 0.2,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserMessage(input) }],
  });

  const text = res.content
    .filter((b) => b.type === "text")
    .map((b) => b.text ?? "")
    .join("")
    .trim();

  const value: CachedDiagnosis = {
    diagnosisText: text,
    promptTokens: res.usage.input_tokens,
    completionTokens: res.usage.output_tokens,
  };
  await deps.cachePut(cacheKey, value);

  return {
    text,
    cacheKey,
    cacheHit: false,
    promptTokens: value.promptTokens,
    completionTokens: value.completionTokens,
  };
}
