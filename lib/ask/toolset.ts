import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { parse as parseMath, compile as compileMath } from "mathjs";
import { getSceneEntry } from "./scene-catalog";

export interface ToolsetDeps {
  db: SupabaseClient;
  locale: string;
  webSearch: (q: string, limit: number) => Promise<Array<{ url: string; title: string; snippet: string }>>;
  fetchUrl?: (url: string) => Promise<{ title: string; text_excerpt: string }>;
}

const Kind = z.enum(["topic", "physicist", "glossary"]);

const DENY_NODES = new Set(["FunctionAssignmentNode", "AssignmentNode", "ImportNode", "BlockNode"]);

function safeMathExpr(expr: string): { ok: true } | { ok: false; reason: string } {
  if (expr.length > 200) return { ok: false, reason: "Expression too long (max 200 chars)" };
  try {
    const root = parseMath(expr);
    let bad: string | null = null;
    root.traverse((node) => { if (DENY_NODES.has(node.type)) bad ??= node.type; });
    if (bad) return { ok: false, reason: `Expression contains disallowed node ${bad}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: `Parse error: ${(e as Error).message}` };
  }
}

// Evaluate the expression with a representative scope (domain midpoint +
// provided params). This catches the common failure mode where the model
// writes `A*exp(-gamma*t)*cos(omega*t)` but omits `params: {A, gamma, omega}`
// — mathjs throws "Undefined symbol X" which we surface back so the model can
// retry with concrete numeric values instead of silently producing an empty
// plot in the browser.
function evaluationProbe(
  expr: string,
  variable: string,
  domain: [number, number],
  params: Record<string, number> = {},
): { ok: true } | { ok: false; reason: string } {
  try {
    const midpoint = (domain[0] + domain[1]) / 2;
    const scope: Record<string, number> = { ...params, [variable]: midpoint };
    const value = compileMath(expr).evaluate(scope);
    if (typeof value !== "number" || !Number.isFinite(value)) {
      // Not necessarily fatal (e.g. tan(pi/2) is Inf at one sample), but at the
      // midpoint a well-formed physics plot should be finite. Treat as soft
      // pass — only the strict undefined-symbol path below is retryable.
    }
    return { ok: true };
  } catch (e) {
    const msg = (e as Error).message ?? "";
    const m = /Undefined\s+symbol\s+([A-Za-z_][A-Za-z0-9_]*)/i.exec(msg);
    if (m) {
      return {
        ok: false,
        reason: `Undefined symbol "${m[1]}" in expression "${expr}". Either inline a numeric value (e.g. use 0.1 instead of gamma) or add it to params like params={"${m[1]}":0.1}.`,
      };
    }
    return { ok: false, reason: `Cannot evaluate "${expr}": ${msg}` };
  }
}

function fenceAttrs(obj: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    parts.push(`${k}=${JSON.stringify(v)}`);
  }
  return parts.length ? "{" + parts.join(" ") + "}" : "";
}

function buildSceneFence(id: string, params: Record<string, unknown>): string {
  const attrs = Object.entries(params).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(" ");
  return `:::scene{id=${JSON.stringify(id)}${attrs ? " " + attrs : ""}}\n:::`;
}

export function makeToolset(deps: ToolsetDeps) {
  const { db, locale } = deps;

  const tools = {
    async searchSiteContent(args: { q: string; kind?: z.infer<typeof Kind>; limit?: number }) {
      const q = z.string().min(1).max(200).parse(args.q);
      const limit = Math.min(args.limit ?? 5, 10);
      // Intentionally NOT selecting `blocks`. That column is a large JSONB
      // payload; pulling it for every FTS hit blew 500KB+ over the wire per
      // call and then turned into tens of thousands of tool_result tokens fed
      // back to the model. The model only needs slug/title/subtitle to decide
      // whether to cite or to call getContentEntry next.
      let query = db
        .from("content_entries")
        .select("kind,slug,title,subtitle")
        .eq("locale", locale);
      if (args.kind) query = query.eq("kind", args.kind);
      const { data, error } = await query
        .textSearch("search_doc", q, { type: "websearch", config: "simple" })
        .limit(limit);
      if (error) throw error;
      return (data ?? []).map((r) => ({
        kind: r.kind,
        slug: r.slug,
        title: r.title,
        subtitle: r.subtitle ?? null,
      }));
    },

    async getContentEntry(args: { kind: z.infer<typeof Kind>; slug: string }) {
      const { kind, slug } = z.object({ kind: Kind, slug: z.string().min(1).max(200) }).parse(args);
      const { data, error } = await db
        .from("content_entries")
        .select("kind,slug,title,subtitle,blocks,aside_blocks,meta")
        .eq("kind", kind).eq("slug", slug).eq("locale", locale)
        .maybeSingle();
      if (error) throw error;
      return data;
    },

    async searchGlossary(args: { q: string; limit?: number }) {
      const q = z.string().min(1).max(200).parse(args.q);
      const limit = Math.min(args.limit ?? 10, 20);
      const { data, error } = await db
        .from("content_entries")
        .select("slug,title,meta")
        .eq("kind", "glossary").eq("locale", locale)
        .textSearch("search_doc", q, { type: "websearch", config: "simple" })
        .limit(limit);
      if (error) throw error;
      return (data ?? []).map((r) => ({
        slug: r.slug,
        term: r.title,
        shortDefinition: ((r.meta as { shortDefinition?: string } | null) ?? {}).shortDefinition ?? "",
        category: ((r.meta as { category?: string } | null) ?? {}).category ?? "concept",
      }));
    },

    async listGlossaryByCategory(args: { category: string }) {
      const category = z.string().min(1).max(40).parse(args.category);
      const { data, error } = await db
        .from("content_entries")
        .select("slug,title,meta")
        .eq("kind", "glossary").eq("locale", locale);
      if (error) throw error;
      return (data ?? [])
        .filter((r) => ((r.meta as { category?: string } | null) ?? {}).category === category)
        .map((r) => ({
          slug: r.slug,
          term: r.title,
          shortDefinition: ((r.meta as { shortDefinition?: string } | null) ?? {}).shortDefinition ?? "",
        }));
    },

    async searchScenes(args: { q: string; limit?: number }) {
      const q = z.string().min(1).max(200).parse(args.q);
      const limit = Math.min(args.limit ?? 5, 10);
      const { data, error } = await db
        .from("scene_catalog")
        .select("id,label,description,params_schema")
        .textSearch("search_doc", q, { type: "websearch", config: "simple" })
        .limit(limit);
      if (error) throw error;
      return (data ?? []).map((r) => ({
        id: r.id, label: r.label, description: r.description, paramsSchema: r.params_schema,
      }));
    },

    async showScene(args: { sceneId: string; params?: Record<string, unknown> }) {
      const parsed = z.object({ sceneId: z.string(), params: z.record(z.string(), z.unknown()).optional() }).safeParse(args);
      if (!parsed.success) return { ok: false as const, error: { message: parsed.error.message, retryable: true } };
      const entry = getSceneEntry(parsed.data.sceneId);
      if (!entry) return { ok: false as const, error: { message: `Unknown sceneId. Call searchScenes first.`, retryable: true } };
      const p = entry.paramsSchema.safeParse(parsed.data.params ?? {});
      if (!p.success) return { ok: false as const, error: { message: `Invalid params: ${p.error.message}`, retryable: true } };
      const fence = buildSceneFence(parsed.data.sceneId, p.data as Record<string, unknown>);
      return { ok: true as const, sceneId: parsed.data.sceneId, params: p.data, fence };
    },

    async plotFunction(args: {
      expr: string;
      variable: "t" | "x" | "theta";
      domain: [number, number];
      params?: Record<string, number>;
      ylabel?: string; xlabel?: string;
      overlays?: Array<{ expr: string; params?: Record<string, number> }>;
    }) {
      const schema = z.object({
        expr: z.string().min(1).max(200),
        variable: z.enum(["t", "x", "theta"]),
        domain: z.tuple([z.number(), z.number()]),
        params: z.record(z.string(), z.number()).optional(),
        ylabel: z.string().max(40).optional(),
        xlabel: z.string().max(40).optional(),
        overlays: z.array(z.object({ expr: z.string().max(200), params: z.record(z.string(), z.number()).optional() })).max(3).optional(),
      });
      const parsed = schema.safeParse(args);
      if (!parsed.success) return { ok: false as const, error: { message: parsed.error.message, retryable: true } };
      const allExprs = [
        { expr: parsed.data.expr, params: parsed.data.params ?? {} },
        ...(parsed.data.overlays ?? []).map((o) => ({
          expr: o.expr,
          params: { ...(parsed.data.params ?? {}), ...(o.params ?? {}) },
        })),
      ];
      for (const { expr, params } of allExprs) {
        const c = safeMathExpr(expr);
        if (!c.ok) return { ok: false as const, error: { message: c.reason, retryable: true } };
        const probe = evaluationProbe(expr, parsed.data.variable, parsed.data.domain, params);
        if (!probe.ok) return { ok: false as const, error: { message: probe.reason, retryable: true } };
      }
      const plotId = "p_" + Math.random().toString(36).slice(2, 10);
      const fence = `:::plot${fenceAttrs({ kind: "function", plotId, ...parsed.data })}\n:::`;
      return { ok: true as const, plotId, fence };
    },

    async plotParametric(args: {
      x: string; y: string;
      variable: "t";
      domain: [number, number];
      params?: Record<string, number>;
    }) {
      const schema = z.object({
        x: z.string().max(200),
        y: z.string().max(200),
        variable: z.literal("t"),
        domain: z.tuple([z.number(), z.number()]),
        params: z.record(z.string(), z.number()).optional(),
      });
      const parsed = schema.safeParse(args);
      if (!parsed.success) return { ok: false as const, error: { message: parsed.error.message, retryable: true } };
      for (const e of [parsed.data.x, parsed.data.y]) {
        const c = safeMathExpr(e);
        if (!c.ok) return { ok: false as const, error: { message: c.reason, retryable: true } };
        const probe = evaluationProbe(e, parsed.data.variable, parsed.data.domain, parsed.data.params ?? {});
        if (!probe.ok) return { ok: false as const, error: { message: probe.reason, retryable: true } };
      }
      const plotId = "pp_" + Math.random().toString(36).slice(2, 10);
      const fence = `:::plot${fenceAttrs({ kind: "parametric", plotId, ...parsed.data })}\n:::`;
      return { ok: true as const, plotId, fence };
    },

    async webSearch(args: { q: string; limit?: number }) {
      const q = z.string().min(1).max(200).parse(args.q);
      const limit = Math.min(args.limit ?? 5, 10);
      try {
        const r = await deps.webSearch(q, limit);
        return { ok: true as const, results: r };
      } catch (e) {
        return { ok: false as const, error: { message: (e as Error).message, retryable: false } };
      }
    },

    async fetchUrl(args: { url: string }) {
      if (!deps.fetchUrl) return { ok: false as const, error: { message: "fetchUrl not available", retryable: false } };
      const url = z.string().url().parse(args.url);
      try {
        const r = await deps.fetchUrl(url);
        return { ok: true as const, ...r };
      } catch (e) {
        return { ok: false as const, error: { message: (e as Error).message, retryable: false } };
      }
    },
  };

  return tools;
}

export type Toolset = ReturnType<typeof makeToolset>;
