// lib/problems/ocr.ts
import Anthropic from "@anthropic-ai/sdk";
import { getServiceClient } from "@/lib/supabase-server";
import { PROBLEMS } from "@/lib/content/problems";
import { EQUATIONS } from "@/lib/content/equations";

export interface OcrInput {
  imageBytes: Buffer;
  mimeType: string;
  locale: string;
}

export type OcrResult =
  | { kind: "match"; problemId: string; topicSlug: string; score: number; statement: string }
  | { kind: "fallthrough"; statement: string; topicGuess: string | null }
  | { kind: "error"; message: string };

interface VisionPayload {
  statement: string;
  topicGuess: string | null;
  inputs: Record<string, string>;
  equations: string[];
}

interface OcrDeps {
  anthropicCreate: (args: {
    model: string;
    max_tokens: number;
    system: string;
    messages: Array<{ role: "user"; content: Array<unknown> }>;
  }) => Promise<{ content: Array<{ type: string; text?: string }>; usage: { input_tokens: number; output_tokens: number } }>;
  catalogMatch: (payload: VisionPayload, locale: string) => Promise<Array<{ id: string; primary_topic_slug: string; score: number }>>;
  topicSlugs: readonly string[];
  equationSlugs: readonly string[];
}

const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
const MATCH_THRESHOLD = 0.7;

let deps: OcrDeps = makeDefaultDeps();

function makeDefaultDeps(): OcrDeps {
  return {
    anthropicCreate: async (args) => {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const res = await client.messages.create(args as Parameters<Anthropic["messages"]["create"]>[0]);
      return res as unknown as { content: Array<{ type: string; text?: string }>; usage: { input_tokens: number; output_tokens: number } };
    },
    catalogMatch: async (payload, locale) => {
      const db = getServiceClient();
      const { data, error } = await db.rpc("match_problem_from_ocr", {
        p_statement: payload.statement,
        p_input_keys: Object.keys(payload.inputs),
        p_equation_slugs: payload.equations,
        p_locale: locale,
      });
      if (error) throw error;
      return (data as Array<{ id: string; primary_topic_slug: string; score: number }>) ?? [];
    },
    topicSlugs: PROBLEMS.map((p) => p.primaryTopicSlug),
    equationSlugs: EQUATIONS.map((e) => e.slug),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function _resetOcrDeps(d: Partial<Record<keyof OcrDeps, any>>) {
  deps = { ...makeDefaultDeps(), ...d } as OcrDeps;
}

function buildSystemPrompt(locale: string): string {
  const topicList = deps.topicSlugs.join(", ");
  const equationList = deps.equationSlugs.join(", ");
  return [
    `You are a physics homework parser. Given an image of a physics problem, extract:`,
    `(1) verbatim problem statement (translate to locale=${locale} if needed),`,
    `(2) topicGuess from this list: [${topicList}] or null if no good fit,`,
    `(3) inputs as { name: "value units" } pairs,`,
    `(4) equations from this list: [${equationList}].`,
    `Return ONLY a single JSON object matching: { "statement": string, "topicGuess": string|null, "inputs": object, "equations": string[] }. No prose, no markdown fences.`,
  ].join("\n");
}

function parseVisionResponse(text: string): VisionPayload | null {
  // Strip markdown fences if the model added them.
  const cleaned = text.replace(/^```(?:json)?\s*|\s*```$/gi, "").trim();
  try {
    const obj = JSON.parse(cleaned);
    if (typeof obj.statement !== "string") return null;
    return {
      statement: obj.statement,
      topicGuess: typeof obj.topicGuess === "string" ? obj.topicGuess : null,
      inputs: obj.inputs && typeof obj.inputs === "object" ? obj.inputs : {},
      equations: Array.isArray(obj.equations) ? obj.equations.filter((e: unknown) => typeof e === "string") : [],
    };
  } catch {
    return null;
  }
}

export async function extractAndMatch(input: OcrInput): Promise<OcrResult> {
  if (!ALLOWED_MIME.has(input.mimeType)) {
    return { kind: "error", message: `Unsupported MIME type: ${input.mimeType}` };
  }

  const res = await deps.anthropicCreate({
    model: "claude-sonnet-4-6",
    max_tokens: 800,
    system: buildSystemPrompt(input.locale),
    messages: [{
      role: "user",
      content: [
        {
          type: "image",
          source: { type: "base64", media_type: input.mimeType, data: input.imageBytes.toString("base64") },
        },
        { type: "text", text: "Parse this homework problem." },
      ],
    }],
  });

  const text = res.content.filter((b) => b.type === "text").map((b) => b.text ?? "").join("").trim();
  const payload = parseVisionResponse(text);
  if (!payload) {
    return { kind: "error", message: "Vision response was not valid JSON" };
  }

  const matches = await deps.catalogMatch(payload, input.locale);
  const best = matches.sort((a, b) => b.score - a.score)[0];
  if (!best || best.score < MATCH_THRESHOLD) {
    return { kind: "fallthrough", statement: payload.statement, topicGuess: payload.topicGuess };
  }
  return { kind: "match", problemId: best.id, topicSlug: best.primary_topic_slug, score: best.score, statement: payload.statement };
}
