# Physics.explained Authoring & Translation MCP Server

**Date:** 2026-04-14
**Status:** Design approved, ready for implementation plan
**Owner:** Roman Pochtman

## Context

Physics.explained (`/Users/romanpochtman/Developer/physics`) is a Next.js 15 multilingual physics-explainer site. Currently 2 locales (en/he), 7 long-form MDX articles in classical-mechanics, ~36 React canvas visualization components, 35 dictionary terms, 30+ physicists. Hebrew content was added today via parallel agent translations + a `page.tsx` wrapper + sibling `content.{en,he}.mdx` pattern (variant c).

**Pain that motivates this MCP:** every authoring session in Claude Code burns ~45k tokens just *reading* the data files (`glossary.ts` ~15k, `physicists.ts` ~8k, `branches.ts` ~3k, message JSONs ~10k, component prop reading ~5k, prior-article reference ~5k) before Claude writes a single line. When new locales (Russian, German planned) are added, translating 7+ articles + 35 dictionary entries + chrome JSON in-context is impractical — it eats the window or requires multiple sessions.

## Goals

1. **Token efficiency:** keep Claude Code's context window small during authoring sessions by exposing data via narrow tools instead of full-file reads.
2. **Atomic content insertion:** adding a new article or dictionary term touches 3-5 files; one tool call should write all of them or none.
3. **Translation orchestration:** when a new locale is added, all existing articles, dictionary entries, and chrome JSONs translate in parallel via the MCP's own Anthropic API calls — *outside* Claude Code's context window.
4. **Preserve correctness:** translations must keep all JSX, slugs, hrefs, math, code identifiers character-identical to source. House terminology (Hebrew physics glossary built today) must be enforced.

## Non-goals

- Translating React canvas components' inline `ctx.fillText` labels (Roman has decided visualizations stay English).
- Realtime collaborative editing.
- Web UI / admin panel (MCP-only surface).
- Background queue / Redis / persistence — every tool call is stateless.
- Auto-deploying / publishing — MCP writes files; Roman commits and deploys.

## Architecture

**Where it lives:** Standalone npm package `@physics-explained/mcp-server` at sibling path `/Users/romanpochtman/Developer/physics-mcp/`. NOT inside the physics repo. Reasons:
- Keeps physics deploy artifact clean (no MCP runtime in production)
- Versioned independently
- Can later be pointed at sister content sites
- Installable to other Claudes (your laptop, future contributors)

**Stack:**
- TypeScript (strict)
- `@modelcontextprotocol/sdk` (stdio transport)
- `@anthropic-ai/sdk` for translation
- `zod` for tool input validation
- Node.js 22+

**Process model:** stdio MCP server, spawned by Claude Code per session via user's `~/.claude/.mcp.json`. No HTTP, no daemon, no persistent state.

**Configuration:** Two env vars only:
- `PHYSICS_REPO_PATH` — absolute path to physics repo (e.g., `/Users/romanpochtman/Developer/physics`)
- `ANTHROPIC_API_KEY` — used for translation calls; separate from Claude Code's session key

**Translation execution model:** Synchronous, in-process. `translate_article` blocks until done (~5-15s per article on Sonnet 4.6). Bulk operations (`add_locale`) fire all per-article translations via `Promise.all` and stream progress to Claude via [MCP progress notifications](https://modelcontextprotocol.io/specification/draft/server/utilities/progress) — Claude shows a live "translating 4/7 articles…" indicator.

**Translation model:** `claude-sonnet-4-6` by default (latest Sonnet, fast + cheap). Configurable per-call via optional `model` arg.

**File operations:** All writes go through a small `commitFiles(files: { path, content }[])` helper that writes to a tmp dir then atomically renames into place. Either every file in a transaction lands or none — no orphan state on partial failure.

**Commit behavior:** Default = leave changes uncommitted on disk. The MCP returns the list of touched files in its tool response so Claude can show a diff. Roman commits when ready.

## Tool surface

### MVP (7 tools — ship first)

| Tool | Purpose |
|---|---|
| `list_slugs(kind)` | Returns `string[]` for `kind ∈ {term, physicist, topic, branch, locale}`. Cheap context — replaces reads of full data files. |
| `get_terminology(en, locale?)` | Returns `{ he: "...", ru: "...", ... }` or single-string if `locale` specified. Reads from a curated terminology table baked into the MCP, seeded from the Hebrew translations done 2026-04-14. |
| `add_topic(input)` | Creates folder, writes `page.tsx` wrapper + `content.en.mdx` skeleton, updates `lib/content/branches.ts`, appends to `messages/<locale>/home.json` topic items for every existing locale. Atomic. Input includes branchSlug, slug, module, eyebrow, title, subtitle, readingMinutes, asideLinks. |
| `add_dictionary_term(input)` | Appends entry to `lib/content/glossary.ts` and to `messages/<locale>/glossary.json` for every locale (Hebrew uses passed `he` payload, others auto-translate via internal call to `translate_glossary_entry`). Atomic. |
| `translate_article({ slug, fromLocale, toLocale, model? })` | Reads `content.<from>.mdx`, calls Anthropic API with the baked-in physics-translation system prompt + terminology table, writes `content.<to>.mdx`. |
| `translate_glossary({ toLocale, slugs? })` | Translates all (or specified) dictionary entries to the target locale. Writes to `messages/<toLocale>/glossary.json`. |
| `add_locale({ code, dir, label })` | Adds locale to `i18n/config.ts`, scaffolds `messages/<code>/` from `messages/en/`, fires `translate_article` for all articles + `translate_glossary` + `translate_messages` in parallel. Streams progress. |

### v2 (later, additive — no architecture change)

| Tool | Purpose |
|---|---|
| `get_component_schema(name)` | Returns JSON schema for `<TopicHeader>`, `<Section>`, `<SceneCard>`, etc. Generated at MCP build time from TS source. |
| `add_physicist(input)` | Analogous to `add_dictionary_term` but for `lib/content/physicists.ts`. |
| `translate_messages({ toLocale, namespace? })` | Translates `messages/en/<namespace>.json` (home, legal, about, common, physicists). Covers chrome strings. |
| `validate_article(path)` | Parses MDX, checks every `<Term slug>` / `<PhysicistLink slug>` exists, reports missing references. |
| `lint_translations({ slug?, locale? })` | Verifies all locales for a slug have matching JSX structure (same component count, same prop identifiers, same KaTeX strings). Diff-style report. |

## Translation pipeline detail

Each `translate_article` call:

1. Reads `content.<fromLocale>.mdx` from disk
2. Constructs system prompt = base physics-translation rules + per-locale terminology table (loaded from `terminology/<toLocale>.json` shipped with the MCP)
3. Calls Anthropic API with `claude-sonnet-4-6` (or override), single shot, no streaming (output goes to file not Claude's terminal)
4. Validates response: same line count of imports, every JSX tag in source has corresponding tag in output (regex check), all `slug=`, `href=`, `type=` prop values character-identical
5. If validation fails: retry once with explicit error in system prompt; if second attempt fails, return failure with diff so Roman can fix manually
6. On success: writes via `commitFiles` (atomic temp + rename)
7. Returns `{ ok: true, path, sourceTokens, outputTokens, durationMs }`

The terminology tables live IN the MCP package (`terminology/he.json`, `terminology/ru.json`, etc.), seeded from today's Hebrew work. New locales start empty; the user populates the terminology table as they translate (or Claude Code edits it).

## Atomicity contract

Every write tool that touches multiple files commits all-or-nothing:

```ts
type FileOp = { path: string; content: string };
async function commitFiles(ops: FileOp[]): Promise<void> {
  const tmpDir = await mkdtemp(join(tmpdir(), "physics-mcp-"));
  // Write all to tmp
  for (const op of ops) {
    const tmpPath = join(tmpDir, basename(op.path));
    await writeFile(tmpPath, op.content);
  }
  // Atomic rename (same filesystem assumed)
  for (const op of ops) {
    const tmpPath = join(tmpDir, basename(op.path));
    await rename(tmpPath, op.path);
  }
}
```

Note: `rename` is atomic per-file but the loop is not strictly atomic across files. For true cross-file atomicity, a second iteration is required: stage tmp files alongside targets (e.g., `target.path + ".tmp"`), then rename loop. Either approach is acceptable for MVP since the failure window is sub-millisecond and the tools' callers (Claude) can detect partial state via filesystem inspection. Document the limitation in the README.

## Error handling

- **Bad input:** zod validation rejects at tool entry with structured error.
- **Translation API failure:** retry once on transient errors (rate limit, 5xx); fail loudly on auth / permanent errors.
- **Disk failure:** propagate as MCP error; partial state is detectable by listing the affected directory.
- **Slug already exists** (in `add_topic` / `add_dictionary_term`): error out with "use update_* tool instead" — never silently overwrite.

## Open questions for implementation

1. **Update vs add:** spec covers `add_*` only. Eventually need `update_topic`, `update_dictionary_term`. Defer to v2.
2. **Removing items:** `remove_topic` could orphan content files. Defer; manual deletion is fine for now.
3. **Test strategy:** unit-test pure helpers (parsers, validators) with vitest; integration-test tool handlers against a fixture physics repo; snapshot-test translation output for stability. No live API calls in CI — mock the Anthropic SDK.
4. **Distribution:** publish to npm (private or public). For solo-Roman use, `npm link` from local checkout is fine until v1.

## Files in this MCP repo (target structure)

```
physics-mcp/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                  # MCP server entry
│   ├── tools/
│   │   ├── list-slugs.ts
│   │   ├── get-terminology.ts
│   │   ├── add-topic.ts
│   │   ├── add-dictionary-term.ts
│   │   ├── translate-article.ts
│   │   ├── translate-glossary.ts
│   │   └── add-locale.ts
│   ├── lib/
│   │   ├── repo-paths.ts          # resolves PHYSICS_REPO_PATH paths
│   │   ├── commit-files.ts        # atomic write helper
│   │   ├── translation-prompt.ts  # builds system prompt per locale
│   │   ├── data-loaders.ts        # parses branches.ts, glossary.ts, etc.
│   │   └── jsx-validator.ts       # post-translation structure check
│   └── terminology/
│       ├── he.json                # seeded from 2026-04-14 work
│       └── (future locales)
├── tests/
│   ├── fixtures/                  # mini physics repo
│   └── tools/
└── README.md
```

## Implementation phases

1. **Phase 1 (MVP):** scaffolding + 7 MVP tools + tests. Wire to Claude Code via `~/.claude/.mcp.json`. Use it to write one new article and verify token savings vs baseline.
2. **Phase 2:** v2 tool list (validate, lint, schema, physicist, messages).
3. **Phase 3:** add Russian locale end-to-end via `add_locale("ru", "ltr", "Русский")`. Iterate on translation prompt quality.
4. **Phase 4:** publish to npm; add German.
