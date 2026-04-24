// JSON Schema definitions the model sees. Keep in sync with lib/ask/toolset.ts.
export interface JsonToolDef {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export const TOOL_SCHEMAS: JsonToolDef[] = [
  {
    name: "searchSiteContent",
    description: "Full-text search across site topics, physicists, and glossary. Returns up to 5 hits by default.",
    parameters: {
      type: "object",
      properties: {
        q: { type: "string", description: "Search query" },
        kind: { type: "string", enum: ["topic", "physicist", "glossary"] },
        limit: { type: "integer", minimum: 1, maximum: 10 },
      },
      required: ["q"],
    },
  },
  {
    name: "getContentEntry",
    description: "Fetch the full stored blocks for one topic, physicist, or glossary entry by slug.",
    parameters: {
      type: "object",
      properties: {
        kind: { type: "string", enum: ["topic", "physicist", "glossary"] },
        slug: { type: "string" },
      },
      required: ["kind", "slug"],
    },
  },
  {
    name: "searchGlossary",
    description: "Glossary-scoped FTS. Returns slug, term, shortDefinition, category.",
    parameters: {
      type: "object",
      properties: { q: { type: "string" }, limit: { type: "integer", minimum: 1, maximum: 20 } },
      required: ["q"],
    },
  },
  {
    name: "listGlossaryByCategory",
    description: "List glossary entries in one category (e.g. 'instrument', 'concept').",
    parameters: { type: "object", properties: { category: { type: "string" } }, required: ["category"] },
  },
  {
    name: "searchScenes",
    description: "Search the curated scene catalog. Returns id, label, description, paramsSchema.",
    parameters: {
      type: "object",
      properties: { q: { type: "string" }, limit: { type: "integer", minimum: 1, maximum: 10 } },
      required: ["q"],
    },
  },
  {
    name: "showScene",
    description:
      "Render an existing scene inline. Call searchScenes first to discover id + params. Returns a `fence` string — include it verbatim in your final answer.",
    parameters: {
      type: "object",
      properties: { sceneId: { type: "string" }, params: { type: "object" } },
      required: ["sceneId"],
    },
  },
  {
    name: "plotFunction",
    description:
      "Plot y = f(variable) using mathjs syntax. Every symbol in `expr` that is NOT the `variable` and NOT a builtin (pi, e, sin, cos, tan, exp, log, sqrt, abs, etc.) MUST be supplied in `params` with a concrete numeric value, or you must inline the number directly. Example: for a damped oscillator with amplitude 1, damping 0.2, frequency 2, pass `expr=\"A*exp(-gamma*t)*cos(omega*t)\", variable=\"t\", domain=[0,30], params={\"A\":1,\"gamma\":0.2,\"omega\":2}` — or equivalently `expr=\"1*exp(-0.2*t)*cos(2*t)\"` with no params. Returns a `fence` string — include it verbatim in your final answer.",
    parameters: {
      type: "object",
      properties: {
        expr: { type: "string", maxLength: 200 },
        variable: { type: "string", enum: ["t", "x", "theta"] },
        domain: { type: "array", items: { type: "number" }, minItems: 2, maxItems: 2 },
        params: { type: "object", additionalProperties: { type: "number" } },
        ylabel: { type: "string" },
        xlabel: { type: "string" },
        overlays: { type: "array", items: { type: "object" }, maxItems: 3 },
      },
      required: ["expr", "variable", "domain"],
    },
  },
  {
    name: "plotParametric",
    description:
      "Plot parametric curve (x(t), y(t)). Same rule as plotFunction: every non-builtin symbol in `x` or `y` other than `variable` must be numeric or provided in `params`. Returns a `fence` string — include it verbatim.",
    parameters: {
      type: "object",
      properties: {
        x: { type: "string" }, y: { type: "string" },
        variable: { type: "string", enum: ["t"] },
        domain: { type: "array", items: { type: "number" }, minItems: 2, maxItems: 2 },
        params: { type: "object", additionalProperties: { type: "number" } },
      },
      required: ["x", "y", "variable", "domain"],
    },
  },
  {
    name: "webSearch",
    description: "External web search. Use only when site content doesn't cover the topic.",
    parameters: {
      type: "object",
      properties: { q: { type: "string" }, limit: { type: "integer", minimum: 1, maximum: 10 } },
      required: ["q"],
    },
  },
  {
    name: "fetchUrl",
    description: "Fetch excerpt from an allowlisted URL (wikipedia.org, arxiv.org, nist.gov, *.edu).",
    parameters: { type: "object", properties: { url: { type: "string", format: "uri" } }, required: ["url"] },
  },
];
