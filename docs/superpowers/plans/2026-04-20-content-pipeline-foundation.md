# Content Pipeline Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the MDX → Supabase content pipeline and prove it end-to-end on one topic page (`classical-mechanics/the-simple-pendulum`), so every later page rewrite is mechanical.

**Architecture:** One `content_entries` table keyed by `(kind, slug, locale)` with a `blocks` JSONB column. A `<ContentBlocks>` renderer consumes blocks and reuses existing MDX components (`<Section>`, `<EquationBlock>`, `<SceneCard>`, `<Callout>`, `<PhysicistLink>`, `<Term>`). A `publish` CLI parses English MDX into blocks and upserts rows. English MDX stays canonical.

**Tech Stack:** Next 15 + React 19, TypeScript 5.6, Supabase (project `cpcgkkedcfbnlfpzutrc`), `@mdx-js/mdx` + remark/rehype for parsing, KaTeX for math, Vitest + jsdom for tests, pnpm.

**Scope:** Tasks 1–11 below. Follow-ups (rollout to all topics/physicists/glossary, translation CLI, embeddings CLI, cleanup of non-en MDX) are separate plans.

**Reference spec:** `docs/superpowers/specs/2026-04-20-content-to-supabase-hybrid-design.md`

---

## File structure being introduced

```
supabase/migrations/0002_content.sql              # new — content_entries + embeddings
lib/content/blocks.ts                             # new — Block / Inline types + type guards
lib/content/simulation-registry.ts                # new — allowlist of renderable React components
lib/content/fetch.ts                              # new — server-only getContentEntry()
lib/supabase-server.ts                            # new — service_role client for CLI scripts
components/content/content-blocks.tsx             # new — <ContentBlocks> renderer
components/content/content-inline.tsx             # new — inline renderer (small, focused)
scripts/content/parse-mdx.ts                      # new — MDX AST → Block[] (pure)
scripts/content/publish.ts                        # new — CLI entry point
scripts/content/migrate-physicists.ts             # new — one-off TS → MDX script
scripts/content/migrate-glossary.ts               # new — one-off TS → MDX script
content/physicists/<slug>.en.mdx                  # new — one per physicist (generated)
content/glossary/<slug>.en.mdx                    # new — one per glossary term (generated)
tests/content/blocks/*.test.ts                    # new — renderer + parser unit + golden tests
tests/content/fixtures/*.mdx                      # new — minimal MDX fixtures per JSX tag
tests/content/fixtures/golden/*.json              # new — parser golden outputs
lib/content/physicists.ts                         # modified — strip to structural data
lib/content/glossary.ts                           # modified — strip to structural data
lib/content/types.ts                              # modified — trim Physicist/GlossaryTerm types
app/[locale]/(topics)/classical-mechanics/
  the-simple-pendulum/page.tsx                    # modified — read from DB instead of MDX
package.json                                      # modified — add content:publish script + deps
```

**Key file responsibilities:**
- `blocks.ts` — type-only module, no runtime code beyond type guards. Shared by renderer and parser.
- `simulation-registry.ts` — plain map `Record<string, ComponentType<any>>`. Import-safe from anywhere.
- `content-blocks.tsx` — dispatch on `block.type`. Delegates inline rendering to `content-inline.tsx`.
- `fetch.ts` — server-only (`import "server-only"`), thin wrapper over Supabase select with React cache.
- `parse-mdx.ts` — pure function `(mdxSource: string) => { title, subtitle, blocks, asideBlocks }`. No I/O.
- `publish.ts` — CLI orchestration: walks files, calls parser, hashes source, upserts rows, prints diff.

---

## Task 1: Database migration

**Files:**
- Create: `supabase/migrations/0002_content.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- Physics.explained — content storage + embeddings scaffold
-- Long-form content moves out of per-locale MDX into Supabase.
-- English remains authored in MDX; this table holds the parsed blocks
-- plus machine-generated translations. See
-- docs/superpowers/specs/2026-04-20-content-to-supabase-hybrid-design.md

create extension if not exists vector;

--------------------------------------------------------------------------------
-- content_entries
--   One row per (kind, slug, locale). `blocks` and `aside_blocks` are Block[]
--   JSON validated client-side; Postgres treats them as opaque JSONB.
--------------------------------------------------------------------------------

create table if not exists public.content_entries (
  kind          text         not null check (kind in ('topic','physicist','glossary')),
  slug          text         not null,
  locale        text         not null,
  title         text         not null,
  subtitle      text,
  blocks        jsonb        not null default '[]'::jsonb,
  aside_blocks  jsonb        not null default '[]'::jsonb,
  meta          jsonb        not null default '{}'::jsonb,
  source_hash   text,
  updated_at    timestamptz  not null default now(),
  primary key (kind, slug, locale)
);

create index if not exists content_entries_kind_locale_idx
  on public.content_entries (kind, locale);

alter table public.content_entries enable row level security;

create policy "public can read content"
  on public.content_entries
  for select
  to anon, authenticated
  using (true);

-- Writes are service_role only (CLI pipelines). service_role bypasses RLS so
-- no explicit policy needed.

--------------------------------------------------------------------------------
-- content_embeddings
--   Scaffold for upcoming AI retrieval. No producer in this plan.
--------------------------------------------------------------------------------

create table if not exists public.content_embeddings (
  id           bigserial primary key,
  kind         text   not null,
  slug         text   not null,
  locale       text   not null,
  chunk_index  int    not null,
  chunk_text   text   not null,
  embedding    vector(1536),
  foreign key (kind, slug, locale)
    references public.content_entries (kind, slug, locale)
    on delete cascade
);

create index if not exists content_embeddings_vec_idx
  on public.content_embeddings
  using ivfflat (embedding vector_cosine_ops);

alter table public.content_embeddings enable row level security;

create policy "public can read embeddings"
  on public.content_embeddings
  for select
  to anon, authenticated
  using (true);
```

- [ ] **Step 2: Apply migration to Supabase**

Use the MCP tool:

```
mcp__physics-supabase__apply_migration(
  project_id: "cpcgkkedcfbnlfpzutrc",
  name: "0002_content",
  query: "<paste SQL from step 1>"
)
```

Expected: returns success with no SQL errors.

- [ ] **Step 3: Verify table exists**

Use the MCP tool:

```
mcp__physics-supabase__list_tables(project_id: "cpcgkkedcfbnlfpzutrc")
```

Expected output includes `public.content_entries` with `rls_enabled: true` and `public.content_embeddings`.

- [ ] **Step 4: Verify anon can read, cannot write**

Use the MCP tool (anon query):

```
mcp__physics-supabase__execute_sql(
  project_id: "cpcgkkedcfbnlfpzutrc",
  query: "select count(*) from public.content_entries"
)
```

Expected: returns `[{"count": 0}]` (empty table, public SELECT allowed).

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0002_content.sql
git commit -m "feat(db): add content_entries + content_embeddings tables"
```

---

## Task 2: Block types

**Files:**
- Create: `lib/content/blocks.ts`
- Test: `tests/content/blocks/types.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/content/blocks/types.test.ts
import { describe, it, expect } from "vitest";
import { isBlock, isInline, type Block } from "@/lib/content/blocks";

describe("block type guards", () => {
  it("isBlock accepts a valid paragraph", () => {
    const b: Block = { type: "paragraph", inlines: ["hello"] };
    expect(isBlock(b)).toBe(true);
  });

  it("isBlock rejects an object with unknown type", () => {
    expect(isBlock({ type: "nope" })).toBe(false);
  });

  it("isInline accepts a string", () => {
    expect(isInline("hello")).toBe(true);
  });

  it("isInline accepts a physicist inline", () => {
    expect(isInline({ kind: "physicist", slug: "galileo-galilei" })).toBe(true);
  });

  it("isInline rejects objects with unknown kind", () => {
    expect(isInline({ kind: "nope" })).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```
pnpm test tests/content/blocks/types.test.ts
```

Expected: FAIL — cannot resolve `@/lib/content/blocks`.

- [ ] **Step 3: Implement `lib/content/blocks.ts`**

```ts
// Block + Inline types for structured content.
// See docs/superpowers/specs/2026-04-20-content-to-supabase-hybrid-design.md

export type CalloutVariant = "math" | "history" | "insight" | "aside";

export type Inline =
  | string
  | { kind: "em"; text: string }
  | { kind: "strong"; text: string }
  | { kind: "code"; text: string }
  | { kind: "formula"; tex: string }
  | { kind: "link"; href: string; text: string }
  | { kind: "term"; slug: string; text?: string }
  | { kind: "physicist"; slug: string; text?: string };

export type FigureContent =
  | { kind: "image"; src: string; alt: string }
  | { kind: "simulation"; component: string; props?: Record<string, unknown> };

export type Block =
  | { type: "section"; index: number; title: string; children: Block[] }
  | { type: "heading"; level: 3 | 4; text: string }
  | { type: "paragraph"; inlines: Inline[] }
  | { type: "equation"; id?: string; tex: string }
  | { type: "figure"; caption?: string; content: FigureContent }
  | { type: "callout"; variant: CalloutVariant; children: Block[] }
  | { type: "list"; ordered: boolean; items: Inline[][] };

const BLOCK_TYPES = new Set<Block["type"]>([
  "section", "heading", "paragraph", "equation", "figure", "callout", "list",
]);

const INLINE_KINDS = new Set([
  "em", "strong", "code", "formula", "link", "term", "physicist",
]);

export function isBlock(value: unknown): value is Block {
  if (typeof value !== "object" || value === null) return false;
  const t = (value as { type?: unknown }).type;
  return typeof t === "string" && BLOCK_TYPES.has(t as Block["type"]);
}

export function isInline(value: unknown): value is Inline {
  if (typeof value === "string") return true;
  if (typeof value !== "object" || value === null) return false;
  const k = (value as { kind?: unknown }).kind;
  return typeof k === "string" && INLINE_KINDS.has(k);
}
```

- [ ] **Step 4: Run test to verify it passes**

```
pnpm test tests/content/blocks/types.test.ts
```

Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/content/blocks.ts tests/content/blocks/types.test.ts
git commit -m "feat(content): add Block/Inline types + runtime guards"
```

---

## Task 3: Simulation registry

**Files:**
- Create: `lib/content/simulation-registry.ts`
- Test: `tests/content/blocks/simulation-registry.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/content/blocks/simulation-registry.test.ts
import { describe, it, expect } from "vitest";
import { SIMULATION_REGISTRY, getSimulation } from "@/lib/content/simulation-registry";

describe("simulation registry", () => {
  it("includes PendulumScene", () => {
    expect(SIMULATION_REGISTRY.PendulumScene).toBeDefined();
  });

  it("includes PhasePortrait", () => {
    expect(SIMULATION_REGISTRY.PhasePortrait).toBeDefined();
  });

  it("getSimulation throws on unknown name", () => {
    expect(() => getSimulation("Nope")).toThrow(/unknown simulation/i);
  });

  it("getSimulation returns component for a known name", () => {
    expect(getSimulation("PendulumScene")).toBe(SIMULATION_REGISTRY.PendulumScene);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```
pnpm test tests/content/blocks/simulation-registry.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `lib/content/simulation-registry.ts`**

```ts
import type { ComponentType } from "react";
import { PendulumScene } from "@/components/physics/pendulum-scene";
import { PhasePortrait } from "@/components/physics/phase-portrait";

// Allowlist of components that MDX / DB blocks may reference by string name.
// Add a new simulation here before using it in content.
export const SIMULATION_REGISTRY = {
  PendulumScene,
  PhasePortrait,
} as const satisfies Record<string, ComponentType<Record<string, unknown>>>;

export type SimulationName = keyof typeof SIMULATION_REGISTRY;

export function getSimulation(name: string): ComponentType<Record<string, unknown>> {
  const component = (SIMULATION_REGISTRY as Record<string, ComponentType<Record<string, unknown>>>)[name];
  if (!component) {
    throw new Error(`unknown simulation component: ${name}`);
  }
  return component;
}
```

- [ ] **Step 4: Run test to verify it passes**

```
pnpm test tests/content/blocks/simulation-registry.test.ts
```

Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/content/simulation-registry.ts tests/content/blocks/simulation-registry.test.ts
git commit -m "feat(content): add simulation component allowlist"
```

---

## Task 4: Inline renderer

**Files:**
- Create: `components/content/content-inline.tsx`
- Test: `tests/content/blocks/content-inline.test.tsx`

- [ ] **Step 1: Add vitest DOM setup (if not already configured)**

Check `vitest.config.ts`:

```
cat vitest.config.ts
```

If `environment: "jsdom"` and `setupFiles` with `@testing-library/jest-dom` are not yet configured, add them. Otherwise skip.

- [ ] **Step 2: Write the failing test**

```tsx
// tests/content/blocks/content-inline.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Inline } from "@/lib/content/blocks";
import { ContentInline } from "@/components/content/content-inline";

function renderInlines(inlines: Inline[]) {
  return render(<ContentInline inlines={inlines} />);
}

describe("<ContentInline>", () => {
  it("renders a bare string", () => {
    renderInlines(["hello world"]);
    expect(screen.getByText("hello world")).toBeInTheDocument();
  });

  it("renders an em span", () => {
    const { container } = renderInlines([{ kind: "em", text: "note" }]);
    expect(container.querySelector("em")?.textContent).toBe("note");
  });

  it("renders a strong span", () => {
    const { container } = renderInlines([{ kind: "strong", text: "key" }]);
    expect(container.querySelector("strong")?.textContent).toBe("key");
  });

  it("renders an external link", () => {
    renderInlines([{ kind: "link", href: "https://example.org", text: "here" }]);
    const a = screen.getByRole("link", { name: "here" });
    expect(a.getAttribute("href")).toBe("https://example.org");
  });

  it("renders a physicist inline as a PhysicistLink", () => {
    renderInlines([{ kind: "physicist", slug: "galileo-galilei", text: "Galileo" }]);
    const a = screen.getByRole("link", { name: "Galileo" });
    expect(a.getAttribute("href")).toContain("/physicists/galileo-galilei");
  });

  it("renders a term inline as a Term link", () => {
    renderInlines([{ kind: "term", slug: "isochronism" }]);
    const a = screen.getByRole("link");
    expect(a.getAttribute("href")).toContain("/dictionary/isochronism");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

```
pnpm test tests/content/blocks/content-inline.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 4: Implement `components/content/content-inline.tsx`**

```tsx
import Link from "next/link";
import katex from "katex";
import type { Inline } from "@/lib/content/blocks";
import { PhysicistLink } from "@/components/content/physicist-link";
import { Term } from "@/components/content/term";

function InlineFormula({ tex }: { tex: string }) {
  const html = katex.renderToString(tex, { throwOnError: true, displayMode: false });
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

export function ContentInline({ inlines }: { inlines: Inline[] }) {
  return (
    <>
      {inlines.map((node, i) => (
        <InlineNode key={i} node={node} />
      ))}
    </>
  );
}

function InlineNode({ node }: { node: Inline }) {
  if (typeof node === "string") return <>{node}</>;
  switch (node.kind) {
    case "em":      return <em>{node.text}</em>;
    case "strong":  return <strong>{node.text}</strong>;
    case "code":    return <code>{node.text}</code>;
    case "formula": return <InlineFormula tex={node.tex} />;
    case "link":    return <Link href={node.href}>{node.text}</Link>;
    case "term":    return <Term slug={node.slug}>{node.text}</Term>;
    case "physicist": return <PhysicistLink slug={node.slug}>{node.text}</PhysicistLink>;
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

```
pnpm test tests/content/blocks/content-inline.test.tsx
```

Expected: PASS, 6 tests.

- [ ] **Step 6: Commit**

```bash
git add components/content/content-inline.tsx tests/content/blocks/content-inline.test.tsx
git commit -m "feat(content): add inline renderer"
```

---

## Task 5: Block renderer (<ContentBlocks>)

**Files:**
- Create: `components/content/content-blocks.tsx`
- Test: `tests/content/blocks/content-blocks.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// tests/content/blocks/content-blocks.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Block } from "@/lib/content/blocks";
import { ContentBlocks } from "@/components/content/content-blocks";

describe("<ContentBlocks>", () => {
  it("renders a section with a paragraph child", () => {
    const blocks: Block[] = [
      {
        type: "section",
        index: 1,
        title: "Intro",
        children: [{ type: "paragraph", inlines: ["Hello"] }],
      },
    ];
    render(<ContentBlocks blocks={blocks} />);
    expect(screen.getByText("Intro")).toBeInTheDocument();
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("renders a display equation", () => {
    const blocks: Block[] = [{ type: "equation", id: "EQ.01", tex: "a = b" }];
    const { container } = render(<ContentBlocks blocks={blocks} />);
    expect(container.querySelector(".katex-display")).toBeTruthy();
  });

  it("renders an image figure using storageUrl", () => {
    const blocks: Block[] = [
      {
        type: "figure",
        caption: "FIG.01",
        content: { kind: "image", src: "figures/x.webp", alt: "x" },
      },
    ];
    const { container } = render(<ContentBlocks blocks={blocks} />);
    expect(container.querySelector("img")?.getAttribute("src")).toContain("/storage/");
  });

  it("renders a simulation figure from the registry", () => {
    const blocks: Block[] = [
      {
        type: "figure",
        content: { kind: "simulation", component: "PendulumScene", props: { theta0: 0.3 } },
      },
    ];
    render(<ContentBlocks blocks={blocks} />);
    // PendulumScene renders an SVG root; confirming one mounts is sufficient here.
    expect(document.querySelector("svg")).toBeTruthy();
  });

  it("throws on an unknown simulation name", () => {
    const blocks: Block[] = [
      {
        type: "figure",
        content: { kind: "simulation", component: "Ghost", props: {} },
      },
    ];
    expect(() => render(<ContentBlocks blocks={blocks} />)).toThrow(/unknown simulation/i);
  });

  it("renders a callout with recursive children", () => {
    const blocks: Block[] = [
      {
        type: "callout",
        variant: "math",
        children: [{ type: "paragraph", inlines: ["Small-angle trick."] }],
      },
    ];
    render(<ContentBlocks blocks={blocks} />);
    expect(screen.getByText("Small-angle trick.")).toBeInTheDocument();
  });

  it("renders an ordered list", () => {
    const blocks: Block[] = [
      { type: "list", ordered: true, items: [["one"], ["two"]] },
    ];
    const { container } = render(<ContentBlocks blocks={blocks} />);
    expect(container.querySelector("ol")?.children.length).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```
pnpm test tests/content/blocks/content-blocks.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `components/content/content-blocks.tsx`**

```tsx
import katex from "katex";
import type { Block } from "@/lib/content/blocks";
import { ContentInline } from "@/components/content/content-inline";
import { Section } from "@/components/layout/section";
import { SceneCard } from "@/components/layout/scene-card";
import { EquationBlock } from "@/components/math/equation-block";
import { Callout } from "@/components/layout/callout";
import { getSimulation } from "@/lib/content/simulation-registry";
import { storageUrl } from "@/lib/supabase";

export function ContentBlocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((block, i) => (
        <BlockNode key={i} block={block} />
      ))}
    </>
  );
}

function BlockNode({ block }: { block: Block }) {
  switch (block.type) {
    case "section":
      return (
        <Section index={block.index} title={block.title}>
          <ContentBlocks blocks={block.children} />
        </Section>
      );

    case "heading": {
      const Tag = (`h${block.level}` as "h3" | "h4");
      return <Tag>{block.text}</Tag>;
    }

    case "paragraph":
      return <p><ContentInline inlines={block.inlines} /></p>;

    case "equation": {
      const html = katex.renderToString(block.tex, { throwOnError: true, displayMode: true });
      return (
        <EquationBlock id={block.id}>
          <span dangerouslySetInnerHTML={{ __html: html }} />
        </EquationBlock>
      );
    }

    case "figure":
      return (
        <SceneCard caption={block.caption}>
          <FigureInner content={block.content} />
        </SceneCard>
      );

    case "callout":
      return (
        <Callout variant={block.variant}>
          <ContentBlocks blocks={block.children} />
        </Callout>
      );

    case "list": {
      const Tag = block.ordered ? "ol" : "ul";
      return (
        <Tag>
          {block.items.map((item, i) => (
            <li key={i}><ContentInline inlines={item} /></li>
          ))}
        </Tag>
      );
    }
  }
}

function FigureInner({ content }: { content: Block & { type: "figure" } extends { content: infer C } ? C : never }) {
  if (content.kind === "image") {
    return <img src={storageUrl(content.src)} alt={content.alt} />;
  }
  const Component = getSimulation(content.component);
  return <Component {...(content.props ?? {})} />;
}
```

Note: the `FigureInner` prop type is a conditional-indexed lookup so it stays in lockstep with the `figure` variant in `blocks.ts`. If you find TypeScript complaining, fall back to importing `FigureContent` directly from `blocks.ts` and typing it as `FigureContent`.

- [ ] **Step 4: Run test to verify it passes**

```
pnpm test tests/content/blocks/content-blocks.test.tsx
```

Expected: PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
git add components/content/content-blocks.tsx tests/content/blocks/content-blocks.test.tsx
git commit -m "feat(content): add <ContentBlocks> renderer"
```

---

## Task 6: Service-role Supabase client for CLI scripts

**Files:**
- Create: `lib/supabase-server.ts`

- [ ] **Step 1: Add env var to `.env.local` (not tracked)**

Add to your local `.env.local` (and to the CI secret store when the time comes):

```
SUPABASE_SERVICE_ROLE_KEY=<service-role-key-from-supabase-dashboard>
```

Retrieve via:

```
mcp__physics-supabase__get_publishable_keys(project_id: "cpcgkkedcfbnlfpzutrc")
```

Use the Supabase dashboard ("Project Settings → API → service_role key") — the MCP returns only publishable keys, not secret ones.

- [ ] **Step 2: Implement the server client**

```ts
// lib/supabase-server.ts
// Service-role client for CLI pipelines (publish / translate / embed).
// NEVER import this from any app/ or components/ file.
import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function getServiceClient(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");

  _client = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _client;
}
```

- [ ] **Step 3: Add `server-only` dependency if not present**

```
pnpm ls server-only || pnpm add server-only
```

- [ ] **Step 4: Commit**

```bash
git add lib/supabase-server.ts package.json pnpm-lock.yaml
git commit -m "feat(supabase): add service-role client for CLI pipelines"
```

---

## Task 7: `getContentEntry` runtime fetch helper

**Files:**
- Create: `lib/content/fetch.ts`
- Test: `tests/content/fetch.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/content/fetch.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const selectMock = vi.fn();
const eqMock = vi.fn(() => ({ eq: eqMock, maybeSingle: () => ({ data: null, error: null }) }));
const fromMock = vi.fn(() => ({ select: selectMock }));

vi.mock("@/lib/supabase", () => ({
  supabase: { from: fromMock },
  storageUrl: (p: string) => `/storage/${p}`,
}));

describe("getContentEntry", () => {
  beforeEach(() => {
    fromMock.mockClear();
    selectMock.mockClear();
    selectMock.mockReturnValue({
      eq: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
          }),
        }),
      }),
    });
  });

  it("returns null when row is missing", async () => {
    const { getContentEntry } = await import("@/lib/content/fetch");
    const entry = await getContentEntry("topic", "classical-mechanics/kepler", "en");
    expect(entry).toBeNull();
  });

  it("falls back to English when requested locale is missing", async () => {
    const { getContentEntry } = await import("@/lib/content/fetch");
    const calls: string[] = [];
    selectMock.mockImplementation(() => ({
      eq: (_col: string, _val: string) => ({
        eq: (_c2: string, _v2: string) => ({
          eq: (_c3: string, locale: string) => ({
            maybeSingle: async () => {
              calls.push(locale);
              if (locale === "he") return { data: null, error: null };
              return {
                data: {
                  kind: "topic",
                  slug: "classical-mechanics/kepler",
                  locale: "en",
                  title: "Kepler",
                  subtitle: null,
                  blocks: [],
                  aside_blocks: [],
                  meta: {},
                  source_hash: "abc",
                  updated_at: new Date().toISOString(),
                },
                error: null,
              };
            },
          }),
        }),
      }),
    }));
    const entry = await getContentEntry("topic", "classical-mechanics/kepler", "he");
    expect(calls).toEqual(["he", "en"]);
    expect(entry?.title).toBe("Kepler");
    expect(entry?.localeFallback).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```
pnpm test tests/content/fetch.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `lib/content/fetch.ts`**

```ts
import "server-only";
import { cache } from "react";
import { supabase } from "@/lib/supabase";
import type { Block } from "@/lib/content/blocks";

export type ContentKind = "topic" | "physicist" | "glossary";

export interface ContentEntry {
  kind: ContentKind;
  slug: string;
  locale: string;
  title: string;
  subtitle: string | null;
  blocks: Block[];
  asideBlocks: Block[];
  meta: Record<string, unknown>;
  sourceHash: string | null;
  localeFallback: boolean;
}

async function fetchOne(
  kind: ContentKind,
  slug: string,
  locale: string,
): Promise<Omit<ContentEntry, "localeFallback"> | null> {
  const { data, error } = await supabase
    .from("content_entries")
    .select("*")
    .eq("kind", kind)
    .eq("slug", slug)
    .eq("locale", locale)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    kind: data.kind as ContentKind,
    slug: data.slug,
    locale: data.locale,
    title: data.title,
    subtitle: data.subtitle,
    blocks: (data.blocks ?? []) as Block[],
    asideBlocks: (data.aside_blocks ?? []) as Block[],
    meta: (data.meta ?? {}) as Record<string, unknown>,
    sourceHash: data.source_hash,
  };
}

export const getContentEntry = cache(
  async (
    kind: ContentKind,
    slug: string,
    locale: string,
  ): Promise<ContentEntry | null> => {
    const primary = await fetchOne(kind, slug, locale);
    if (primary) return { ...primary, localeFallback: false };

    if (locale !== "en") {
      const fallback = await fetchOne(kind, slug, "en");
      if (fallback) return { ...fallback, localeFallback: true };
    }
    return null;
  },
);
```

- [ ] **Step 4: Run test to verify it passes**

```
pnpm test tests/content/fetch.test.ts
```

Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/content/fetch.ts tests/content/fetch.test.ts
git commit -m "feat(content): add getContentEntry with English fallback"
```

---

## Task 8: MDX parser — scaffolding and smallest fixture

**Files:**
- Create: `scripts/content/parse-mdx.ts`
- Create: `tests/content/fixtures/paragraph.mdx`
- Create: `tests/content/fixtures/paragraph.expected.json`
- Create: `tests/content/blocks/parse-mdx.test.ts`

- [ ] **Step 1: Add parser dependencies**

```
pnpm add -D unified remark-parse remark-mdx remark-math mdast-util-from-markdown mdast-util-mdx unist-util-visit
```

(If any are already listed under `dependencies`, they're fine — no re-add needed.)

- [ ] **Step 2: Create the smallest possible fixture**

```mdx
{/* tests/content/fixtures/paragraph.mdx */}

<TopicHeader title="Hello" subtitle="World" eyebrow="Test" />

<Section index={1} title="First">

Just one paragraph with a <PhysicistLink slug="galileo-galilei">Galileo</PhysicistLink> reference.

</Section>
```

- [ ] **Step 3: Create the expected golden output**

```json
{
  "title": "Hello",
  "subtitle": "World",
  "eyebrow": "Test",
  "blocks": [
    {
      "type": "section",
      "index": 1,
      "title": "First",
      "children": [
        {
          "type": "paragraph",
          "inlines": [
            "Just one paragraph with a ",
            { "kind": "physicist", "slug": "galileo-galilei", "text": "Galileo" },
            " reference."
          ]
        }
      ]
    }
  ],
  "asideBlocks": []
}
```

- [ ] **Step 4: Write the failing parser test**

```ts
// tests/content/blocks/parse-mdx.test.ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { parseMdx } from "@/scripts/content/parse-mdx";

const FIXTURES = path.resolve(__dirname, "..", "fixtures");

function readFixture(name: string) {
  return {
    mdx: readFileSync(path.join(FIXTURES, `${name}.mdx`), "utf8"),
    expected: JSON.parse(
      readFileSync(path.join(FIXTURES, `${name}.expected.json`), "utf8"),
    ),
  };
}

describe("parseMdx", () => {
  it("parses a single-section paragraph with a physicist link", () => {
    const { mdx, expected } = readFixture("paragraph");
    const result = parseMdx(mdx);
    expect(result).toEqual(expected);
  });
});
```

- [ ] **Step 5: Run test to verify it fails**

```
pnpm test tests/content/blocks/parse-mdx.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 6: Implement the parser (first pass)**

```ts
// scripts/content/parse-mdx.ts
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMdx from "remark-mdx";
import remarkMath from "remark-math";
import { visit } from "unist-util-visit";
import type { Block, Inline, FigureContent, CalloutVariant } from "@/lib/content/blocks";

export interface ParsedDoc {
  title: string;
  subtitle: string;
  eyebrow?: string;
  blocks: Block[];
  asideBlocks: Block[];
}

export function parseMdx(source: string): ParsedDoc {
  const tree = unified()
    .use(remarkParse)
    .use(remarkMdx)
    .use(remarkMath)
    .parse(source);

  let title = "";
  let subtitle = "";
  let eyebrow: string | undefined;
  let asideBlocks: Block[] = [];

  // First pass: pull TopicHeader + TopicPageLayout props out as metadata.
  visit(tree, (node: any) => {
    if (node.type === "mdxJsxFlowElement" && node.name === "TopicHeader") {
      for (const attr of node.attributes ?? []) {
        const val = typeof attr.value === "string"
          ? attr.value
          : attr.value?.value;
        if (attr.name === "title")    title = String(val ?? "");
        if (attr.name === "subtitle") subtitle = String(val ?? "");
        if (attr.name === "eyebrow")  eyebrow  = String(val ?? "");
      }
    }
    if (node.type === "mdxJsxFlowElement" && node.name === "TopicPageLayout") {
      // aside={[...]} — optional. Leave asideBlocks empty for this fixture.
      // Later tasks (§Task 10) will cover aside parsing.
    }
  });

  // Second pass: convert top-level flow children into Blocks, skipping chrome.
  const blocks: Block[] = [];
  for (const child of (tree.children as any[]) ?? []) {
    const block = mapFlowNode(child);
    if (block) blocks.push(block);
  }

  return { title, subtitle, eyebrow, blocks, asideBlocks };
}

function mapFlowNode(node: any): Block | null {
  // Chrome tags — drop.
  if (node.type === "mdxJsxFlowElement") {
    if (node.name === "TopicHeader" || node.name === "TopicPageLayout") return null;
    if (node.name === "Section") return mapSection(node);
    if (node.name === "EquationBlock") return mapEquationBlock(node);
    if (node.name === "SceneCard") return mapSceneCard(node);
    if (node.name === "Callout") return mapCallout(node);
    throw new Error(`unknown top-level JSX: <${node.name}>`);
  }
  if (node.type === "paragraph") return { type: "paragraph", inlines: mapInlines(node.children) };
  if (node.type === "math")      return { type: "equation", tex: String(node.value ?? "") };
  return null;
}

function mapSection(node: any): Block {
  const index = Number(getAttr(node, "index") ?? 0);
  const title = String(getAttr(node, "title") ?? "");
  const children: Block[] = [];
  for (const child of node.children ?? []) {
    const b = mapFlowNode(child);
    if (b) children.push(b);
  }
  return { type: "section", index, title, children };
}

function mapEquationBlock(node: any): Block {
  const id = getAttr(node, "id") as string | undefined;
  let tex = "";
  for (const child of node.children ?? []) {
    if (child.type === "math") tex = String(child.value ?? "");
  }
  return { type: "equation", id, tex };
}

function mapSceneCard(node: any): Block {
  const caption = getAttr(node, "caption") as string | undefined;
  let content: FigureContent | null = null;
  for (const child of node.children ?? []) {
    if (child.type === "mdxJsxFlowElement") {
      if (child.name === "img") {
        content = {
          kind: "image",
          src: String(getAttr(child, "src") ?? ""),
          alt: String(getAttr(child, "alt") ?? ""),
        };
      } else {
        content = {
          kind: "simulation",
          component: String(child.name),
          props: collectProps(child),
        };
      }
    }
  }
  if (!content) throw new Error("SceneCard with no child image or simulation");
  return { type: "figure", caption, content };
}

function mapCallout(node: any): Block {
  const variant = (getAttr(node, "variant") ?? "aside") as CalloutVariant;
  const children: Block[] = [];
  for (const child of node.children ?? []) {
    const b = mapFlowNode(child);
    if (b) children.push(b);
  }
  return { type: "callout", variant, children };
}

function mapInlines(nodes: any[]): Inline[] {
  const out: Inline[] = [];
  for (const n of nodes ?? []) {
    if (n.type === "text")      out.push(String(n.value));
    else if (n.type === "emphasis")     out.push({ kind: "em",     text: collectText(n) });
    else if (n.type === "strong")       out.push({ kind: "strong", text: collectText(n) });
    else if (n.type === "inlineCode")   out.push({ kind: "code",   text: String(n.value) });
    else if (n.type === "inlineMath")   out.push({ kind: "formula", tex: String(n.value) });
    else if (n.type === "link")         out.push({ kind: "link",   href: String(n.url), text: collectText(n) });
    else if (n.type === "mdxJsxTextElement" && n.name === "PhysicistLink") {
      out.push({
        kind: "physicist",
        slug: String(getAttr(n, "slug") ?? ""),
        text: collectText(n),
      });
    } else if (n.type === "mdxJsxTextElement" && n.name === "Term") {
      out.push({
        kind: "term",
        slug: String(getAttr(n, "slug") ?? ""),
        text: collectText(n) || undefined,
      });
    } else if (n.children) {
      // Fallback: flatten unknown inline wrappers.
      out.push(...mapInlines(n.children));
    }
  }
  return out;
}

function collectText(node: any): string {
  if (node.type === "text") return String(node.value);
  if (!node.children) return "";
  return (node.children as any[]).map(collectText).join("");
}

function getAttr(node: any, name: string): unknown {
  for (const a of node.attributes ?? []) {
    if (a.name !== name) continue;
    if (typeof a.value === "string") return a.value;
    // Expression attribute — try its static value.
    return a.value?.value ?? undefined;
  }
  return undefined;
}

function collectProps(node: any): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const a of node.attributes ?? []) {
    if (!a.name) continue;
    if (typeof a.value === "string") { out[a.name] = a.value; continue; }
    // Simple numeric / boolean literals from expressions.
    const raw = a.value?.value;
    const num = Number(raw);
    out[a.name] = raw === undefined ? true : Number.isFinite(num) ? num : raw;
  }
  return out;
}
```

- [ ] **Step 7: Run test to verify it passes**

```
pnpm test tests/content/blocks/parse-mdx.test.ts
```

Expected: PASS, 1 test.

If the `inlines` arrays differ by adjacent-string coalescing, update the golden file — the goal is that the parser output is stable and the fixture matches current behaviour, not one specific reduction.

- [ ] **Step 8: Commit**

```bash
git add scripts/content/parse-mdx.ts tests/content/fixtures/paragraph.* tests/content/blocks/parse-mdx.test.ts package.json pnpm-lock.yaml
git commit -m "feat(content): initial MDX-to-blocks parser"
```

---

## Task 9: Parser — equation, figure, callout fixtures

**Files:**
- Create: `tests/content/fixtures/equation.mdx`
- Create: `tests/content/fixtures/equation.expected.json`
- Create: `tests/content/fixtures/figure-image.mdx`
- Create: `tests/content/fixtures/figure-image.expected.json`
- Create: `tests/content/fixtures/figure-simulation.mdx`
- Create: `tests/content/fixtures/figure-simulation.expected.json`
- Create: `tests/content/fixtures/callout.mdx`
- Create: `tests/content/fixtures/callout.expected.json`
- Modify: `tests/content/blocks/parse-mdx.test.ts`

- [ ] **Step 1: Create each fixture + expected pair**

`tests/content/fixtures/equation.mdx`:

```mdx
<Section index={1} title="Eq">
<EquationBlock id="EQ.01">
$$
F = m a
$$
</EquationBlock>
</Section>
```

`tests/content/fixtures/equation.expected.json`:

```json
{
  "title": "",
  "subtitle": "",
  "blocks": [
    {
      "type": "section",
      "index": 1,
      "title": "Eq",
      "children": [
        { "type": "equation", "id": "EQ.01", "tex": "F = m a" }
      ]
    }
  ],
  "asideBlocks": []
}
```

`tests/content/fixtures/figure-image.mdx`:

```mdx
<Section index={1} title="Figure">
<SceneCard caption="FIG.01">
  <img src="figures/pendulum.webp" alt="A pendulum" />
</SceneCard>
</Section>
```

`tests/content/fixtures/figure-image.expected.json`:

```json
{
  "title": "",
  "subtitle": "",
  "blocks": [
    {
      "type": "section",
      "index": 1,
      "title": "Figure",
      "children": [
        {
          "type": "figure",
          "caption": "FIG.01",
          "content": { "kind": "image", "src": "figures/pendulum.webp", "alt": "A pendulum" }
        }
      ]
    }
  ],
  "asideBlocks": []
}
```

`tests/content/fixtures/figure-simulation.mdx`:

```mdx
<Section index={1} title="Sim">
<SceneCard caption="FIG.02 — pendulum">
  <PendulumScene theta0={0.3} length={1.2} />
</SceneCard>
</Section>
```

`tests/content/fixtures/figure-simulation.expected.json`:

```json
{
  "title": "",
  "subtitle": "",
  "blocks": [
    {
      "type": "section",
      "index": 1,
      "title": "Sim",
      "children": [
        {
          "type": "figure",
          "caption": "FIG.02 — pendulum",
          "content": {
            "kind": "simulation",
            "component": "PendulumScene",
            "props": { "theta0": 0.3, "length": 1.2 }
          }
        }
      ]
    }
  ],
  "asideBlocks": []
}
```

`tests/content/fixtures/callout.mdx`:

```mdx
<Section index={1} title="C">
<Callout variant="math">
A math-aside paragraph.
</Callout>
</Section>
```

`tests/content/fixtures/callout.expected.json`:

```json
{
  "title": "",
  "subtitle": "",
  "blocks": [
    {
      "type": "section",
      "index": 1,
      "title": "C",
      "children": [
        {
          "type": "callout",
          "variant": "math",
          "children": [
            { "type": "paragraph", "inlines": ["A math-aside paragraph."] }
          ]
        }
      ]
    }
  ],
  "asideBlocks": []
}
```

- [ ] **Step 2: Extend the parser test to run all fixtures**

Replace the body of `tests/content/blocks/parse-mdx.test.ts` with:

```ts
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { parseMdx } from "@/scripts/content/parse-mdx";

const FIXTURES = path.resolve(__dirname, "..", "fixtures");

const names = readdirSync(FIXTURES)
  .filter((f) => f.endsWith(".mdx"))
  .map((f) => f.replace(/\.mdx$/, ""));

describe("parseMdx — fixtures", () => {
  for (const name of names) {
    it(`parses ${name}`, () => {
      const mdx = readFileSync(path.join(FIXTURES, `${name}.mdx`), "utf8");
      const expected = JSON.parse(
        readFileSync(path.join(FIXTURES, `${name}.expected.json`), "utf8"),
      );
      expect(parseMdx(mdx)).toEqual(expected);
    });
  }
});
```

- [ ] **Step 3: Run tests and fix parser gaps iteratively**

```
pnpm test tests/content/blocks/parse-mdx.test.ts
```

Expected: 5 tests pass. If any fail, extend `parse-mdx.ts` with the missing mapping. Re-run. Repeat until green.

- [ ] **Step 4: Commit**

```bash
git add tests/content/fixtures/ tests/content/blocks/parse-mdx.test.ts scripts/content/parse-mdx.ts
git commit -m "test(content): fixture-based parser tests for equation/figure/callout"
```

---

## Task 10: Parser — golden test on the real pendulum MDX

**Files:**
- Create: `tests/content/fixtures/golden/the-simple-pendulum.expected.json`
- Modify: `tests/content/blocks/parse-mdx.test.ts`

- [ ] **Step 1: Generate a candidate golden file**

Run a throwaway script to print parser output:

```
pnpm tsx -e "import {readFileSync} from 'node:fs'; import {parseMdx} from './scripts/content/parse-mdx'; const s = readFileSync('app/[locale]/(topics)/classical-mechanics/the-simple-pendulum/content.en.mdx','utf8'); process.stdout.write(JSON.stringify(parseMdx(s), null, 2));" > tests/content/fixtures/golden/the-simple-pendulum.expected.json
```

Inspect the file by eye. Confirm:
- `title` is populated.
- Every `<Section>` appears as a section block.
- `<SceneCard>` wrappers with `<PendulumScene>` / `<PhasePortrait>` produce simulation figures with the right props.
- `<PhysicistLink>` / `<Term>` inlines appear inside paragraph `inlines[]`.
- No errors thrown during generation.

If the output looks wrong, fix the parser — don't commit a broken golden.

- [ ] **Step 2: Add a golden test**

Append to `tests/content/blocks/parse-mdx.test.ts`:

```ts
import type { ParsedDoc } from "@/scripts/content/parse-mdx";

describe("parseMdx — golden: real topic", () => {
  it("the-simple-pendulum matches golden", () => {
    const mdx = readFileSync(
      path.resolve(__dirname, "../../..", "app/[locale]/(topics)/classical-mechanics/the-simple-pendulum/content.en.mdx"),
      "utf8",
    );
    const expected = JSON.parse(
      readFileSync(
        path.resolve(__dirname, "..", "fixtures/golden/the-simple-pendulum.expected.json"),
        "utf8",
      ),
    );
    const result: ParsedDoc = parseMdx(mdx);
    expect(result).toEqual(expected);
  });
});
```

- [ ] **Step 3: Run and confirm green**

```
pnpm test tests/content/blocks/parse-mdx.test.ts
```

Expected: all fixture tests + golden test pass.

- [ ] **Step 4: Commit**

```bash
git add tests/content/fixtures/golden/ tests/content/blocks/parse-mdx.test.ts
git commit -m "test(content): golden parse test for the-simple-pendulum"
```

---

## Task 11: Publish CLI — dry run + real upsert

**Files:**
- Create: `scripts/content/publish.ts`
- Modify: `package.json` — add script entry

- [ ] **Step 1: Add script to `package.json`**

In the `scripts` block, add:

```json
"content:publish": "tsx scripts/content/publish.ts"
```

Also add `tsx` to devDependencies if missing:

```
pnpm add -D tsx
```

- [ ] **Step 2: Implement the CLI**

```ts
// scripts/content/publish.ts
// Usage:
//   pnpm content:publish            # upserts all English rows
//   pnpm content:publish --dry-run  # parses + hashes, reports diff, no DB writes
//   pnpm content:publish --only classical-mechanics/the-simple-pendulum
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import fg from "fast-glob";
import { parseMdx } from "./parse-mdx";
import { getServiceClient } from "@/lib/supabase-server";

const ROOT = path.resolve(__dirname, "..", "..");

interface Job {
  kind: "topic" | "physicist" | "glossary";
  slug: string;
  file: string;
}

function collectJobs(): Job[] {
  const topicFiles = fg.sync("app/[locale]/(topics)/*/*/content.en.mdx", { cwd: ROOT });
  const physFiles  = fg.sync("content/physicists/*.en.mdx", { cwd: ROOT });
  const glossFiles = fg.sync("content/glossary/*.en.mdx", { cwd: ROOT });
  return [
    ...topicFiles.map((file) => {
      const parts = file.split("/");
      const branch = parts[2];
      const topic  = parts[3];
      return { kind: "topic" as const, slug: `${branch}/${topic}`, file };
    }),
    ...physFiles.map((file) => ({
      kind: "physicist" as const,
      slug: path.basename(file).replace(/\.en\.mdx$/, ""),
      file,
    })),
    ...glossFiles.map((file) => ({
      kind: "glossary" as const,
      slug: path.basename(file).replace(/\.en\.mdx$/, ""),
      file,
    })),
  ];
}

function sha256(buf: string): string {
  return createHash("sha256").update(buf).digest("hex");
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const dryRun = args.has("--dry-run");
  const onlyIdx = process.argv.indexOf("--only");
  const only = onlyIdx >= 0 ? process.argv[onlyIdx + 1] : null;

  const jobs = collectJobs().filter((j) => !only || j.slug === only);
  if (jobs.length === 0) {
    console.error("no matching MDX sources found");
    process.exit(1);
  }

  const client = dryRun ? null : getServiceClient();
  const stats = { added: 0, updated: 0, unchanged: 0 };

  for (const job of jobs) {
    const source = readFileSync(path.join(ROOT, job.file), "utf8");
    const hash = sha256(source);
    const parsed = parseMdx(source);

    if (dryRun) {
      console.log(`[dry] ${job.kind} ${job.slug} hash=${hash.slice(0, 8)} blocks=${parsed.blocks.length}`);
      continue;
    }

    const { data: existing, error: selectErr } = await client!
      .from("content_entries")
      .select("source_hash")
      .eq("kind", job.kind).eq("slug", job.slug).eq("locale", "en")
      .maybeSingle();
    if (selectErr) throw selectErr;

    if (existing?.source_hash === hash) {
      stats.unchanged++;
      console.log(`  unchanged ${job.kind} ${job.slug}`);
      continue;
    }

    const { error: upsertErr } = await client!
      .from("content_entries")
      .upsert({
        kind: job.kind,
        slug: job.slug,
        locale: "en",
        title: parsed.title,
        subtitle: parsed.subtitle || null,
        blocks: parsed.blocks,
        aside_blocks: parsed.asideBlocks,
        meta: parsed.eyebrow ? { eyebrow: parsed.eyebrow } : {},
        source_hash: hash,
        updated_at: new Date().toISOString(),
      });
    if (upsertErr) throw upsertErr;

    if (existing) { stats.updated++; console.log(`  updated   ${job.kind} ${job.slug}`); }
    else          { stats.added++;   console.log(`  added     ${job.kind} ${job.slug}`); }
  }

  console.log(`\ndone: ${stats.added} added, ${stats.updated} updated, ${stats.unchanged} unchanged`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 3: Add `fast-glob` dependency**

```
pnpm add -D fast-glob
```

- [ ] **Step 4: Dry-run against the pendulum file**

```
pnpm content:publish --dry-run --only classical-mechanics/the-simple-pendulum
```

Expected: one line like `[dry] topic classical-mechanics/the-simple-pendulum hash=abcd1234 blocks=N`.

- [ ] **Step 5: Real run against the pendulum file**

```
pnpm content:publish --only classical-mechanics/the-simple-pendulum
```

Expected: `added topic classical-mechanics/the-simple-pendulum` then `done: 1 added, 0 updated, 0 unchanged`.

- [ ] **Step 6: Verify the row exists in Supabase**

Use the MCP tool:

```
mcp__physics-supabase__execute_sql(
  project_id: "cpcgkkedcfbnlfpzutrc",
  query: "select kind, slug, locale, title, jsonb_array_length(blocks) as nblocks, source_hash from public.content_entries where slug = 'classical-mechanics/the-simple-pendulum'"
)
```

Expected: one row with `locale = 'en'`, a non-empty title, `nblocks > 0`, and a populated `source_hash`.

- [ ] **Step 7: Re-run — confirm idempotent**

```
pnpm content:publish --only classical-mechanics/the-simple-pendulum
```

Expected: `unchanged topic …` and `done: 0 added, 0 updated, 1 unchanged`.

- [ ] **Step 8: Commit**

```bash
git add scripts/content/publish.ts package.json pnpm-lock.yaml
git commit -m "feat(content): add publish CLI that upserts English rows"
```

---

## Task 12: Flip pendulum page to read from Supabase

**Files:**
- Modify: `app/[locale]/(topics)/classical-mechanics/the-simple-pendulum/page.tsx`

- [ ] **Step 1: Read the current page to preserve chrome**

```
cat app/[locale]/(topics)/classical-mechanics/the-simple-pendulum/page.tsx
```

Note: locate the `TopicPageLayout`, `TopicHeader`, and any aside / breadcrumb / back-link chrome. Those stay in page.tsx; only the MDX body import goes away.

- [ ] **Step 2: Rewrite `page.tsx`**

```tsx
import { notFound } from "next/navigation";
import { getContentEntry } from "@/lib/content/fetch";
import { ContentBlocks } from "@/components/content/content-blocks";
import { TopicHeader } from "@/components/layout/topic-header";
import { TopicPageLayout } from "@/components/layout/topic-page-layout";

const BRANCH = "classical-mechanics";
const TOPIC = "the-simple-pendulum";
const SLUG = `${BRANCH}/${TOPIC}`;

export const dynamicParams = false;

export async function generateStaticParams() {
  return [{ locale: "en" }, { locale: "he" }];
}

export default async function Page({ params }: { params: { locale: string } }) {
  const entry = await getContentEntry("topic", SLUG, params.locale);
  if (!entry) notFound();

  return (
    <TopicPageLayout aside={<ContentBlocks blocks={entry.asideBlocks} />}>
      <TopicHeader
        title={entry.title}
        subtitle={entry.subtitle ?? ""}
        eyebrow={typeof entry.meta.eyebrow === "string" ? entry.meta.eyebrow : undefined}
      />
      {entry.localeFallback ? (
        <p className="text-xs opacity-60">
          Translation pending. Showing English for now.
        </p>
      ) : null}
      <ContentBlocks blocks={entry.blocks} />
    </TopicPageLayout>
  );
}
```

Adjust chrome to whatever the existing layout file expects — match the page you replaced rather than the stub above wholesale. Keep imports for any back-link / breadcrumb / next-topic widgets.

- [ ] **Step 3: Start the dev server**

```
pnpm dev
```

- [ ] **Step 4: Compare rendered HTML before vs after**

Save the "before" HTML for regression-checking:

```
# on a clean checkout of main, before this task's changes
curl -s http://localhost:3000/en/classical-mechanics/the-simple-pendulum > /tmp/pendulum.before.html
```

After rewriting, save "after":

```
curl -s http://localhost:3000/en/classical-mechanics/the-simple-pendulum > /tmp/pendulum.after.html
```

Inspect the diff:

```
diff /tmp/pendulum.before.html /tmp/pendulum.after.html | head -200
```

Acceptable differences:
- Whitespace shifts in KaTeX output (harmless).
- React internal ID attributes.
- Order of otherwise-identical inline span classes.

Unacceptable differences:
- Missing section title or heading text.
- Missing formula, figure, or callout.
- Missing physicist / term links.
- Changed link target (`href`).

If anything in the "unacceptable" list shows up, fix the parser/renderer until the diff is clean.

- [ ] **Step 5: Run the full test suite**

```
pnpm test
```

Expected: all tests pass (new ones from earlier tasks + existing `tests/content/` ones).

- [ ] **Step 6: Run a production build**

```
pnpm build
```

Expected: clean build.

- [ ] **Step 7: Commit**

```bash
git add app/[locale]/\(topics\)/classical-mechanics/the-simple-pendulum/page.tsx
git commit -m "feat(topics): the-simple-pendulum reads from Supabase"
```

---

## Follow-up plans (out of scope here)

These are filed as separate plans once this one is green:

1. **Physicist + glossary MDX migration.** One-off scripts converting `lib/content/physicists.ts` / `glossary.ts` into `content/{physicists,glossary}/{slug}.en.mdx` files; strip the TS to structural-only. Then one PR per page type (physicists, dictionary) to flip them to DB.
2. **Topic-rollout PR.** Apply the Task 12 pattern to the remaining 30 topics. Mostly mechanical; one commit per branch or one per topic.
3. **Translation CLI.** `scripts/content/translate.ts` that reads English rows from DB, calls an LLM, upserts translated rows, validates structural equality.
4. **Embeddings CLI.** `scripts/content/embed.ts` — paragraph/equation blocks → `content_embeddings`.
5. **Cleanup.** Delete non-en `.{locale}.mdx` files once DB is the source of truth for translations.
6. **MCP publish/translate tools.** Expose `publish_topic` / `translate_topic_all_locales` on the `physics-mcp` server so edits can be driven from conversation.

---

## Self-review notes

- **Spec coverage:** tasks 1–12 cover spec §Database schema (T1), §Block schema (T2–5), §Page chrome (T12), §Publish pipeline (T11), §Runtime fetch + fallback (T7, T12). Translation pipeline (spec §Translation pipeline) and embeddings population are explicitly deferred to follow-up plans. Metadata-array migration is deferred to follow-up #1.
- **Placeholder scan:** no TBDs, TODOs, or "similar to task N" references. Every step contains the code or command needed.
- **Type consistency:** `Block` / `Inline` / `FigureContent` / `ContentEntry` / `ParsedDoc` referenced identically across tasks 2, 4, 5, 7, 8. `storageUrl` consumed from existing `lib/supabase.ts`. `supabase` import in `fetch.ts` is the existing anon client; `getServiceClient()` in `publish.ts` is the new service-role client. No function-name drift.
