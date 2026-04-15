# Physics MCP — Gap Analysis

The vision: the MCP should be powerful enough that **"create a new module / topic / dictionary term / physicist"** is a single atomic call. The token-heavy work of writing content is what Claude does — the MCP exists so Claude doesn't have to spend tokens reasoning about file shapes, locale fan-out, or registry structure.

Today the MCP has 5 tools. This document tracks what is missing or broken.

---

## What the MCP exposes today

| Tool | Verb | Scope |
|---|---|---|
| `list_slugs` | read | `term \| physicist \| topic \| branch \| locale` |
| `get_terminology` | read | English term → per-locale translations |
| `add_topic` | write | scaffold a topic page + register it in `branches.ts` + seed `home.json` |
| `update_topic` | write | patch any subset of `{title, subtitle, eyebrow, module, readingMinutes, status}` on an existing topic; English chrome syncs automatically, other locales only when `chrome[locale]` is supplied |
| `translate_topic` | write | write `content.<locale>.mdx` + per-locale `home.json` chrome for an existing topic |
| `add_dictionary_term` | write | append a glossary term across all locales |
| `add_locale` | write | register a locale and copy `messages/en/*.json` verbatim |

Everything else is hand-edits.

---

## Gaps — by surface

### 1. Modules

The biggest missing primitive. Modules are typed first-class entities (`Module { slug, title, index }`) but the MCP cannot create, list, or update them.

**Missing:**
- `add_module(branchSlug, slug, title, index?)` — append a Module to a branch's `modules` array, auto-assigning `index` if omitted
- `list_modules(branchSlug)` — return modules for a branch
- `update_module(branchSlug, slug, patch)` — rename a module's title or change its index

**Why it matters:** Today, to create "Module 3" Claude must hand-edit `lib/content/branches.ts`. Reordering modules (e.g., inserting a foundations module before existing ones) requires both a module reorder AND a topic reordering, both manual.

### 2. Topics

`add_topic`, `update_topic`, `translate_topic` exist. Deletion + status helper are still missing.

**Missing:**
- `delete_topic(branchSlug, slug)` — remove the topic folder, the entry from `branches.ts`, and the `home.json` keys across every locale.
- `set_topic_status(branchSlug, slug, status)` — convenience wrapper around `update_topic`. Marginal value since `update_topic` already handles it.

**Schema constraint resolved:** `add_topic.readingMinutes` and `update_topic.patch.readingMinutes` now accept `0` as the "not yet written" sentinel. UI hides the badge when `readingMinutes === 0`.

**Open improvement:** `translate_topic` writes `content.<locale>.mdx` but does NOT wire it into `page.tsx`. Today every topic's `page.tsx` only renders `<EnContent />`. The fix is a one-time refactor of the MDX skeleton template to dynamic-import `./content.${locale}.mdx` with an English fallback — touches `buildPageTsx()` in `mdx-skeleton.ts`. Until then, translated content sits on disk unrendered.

### 3. Dictionary

`add_dictionary_term` exists. Updates and translation gaps are not covered.

**Missing:**
- `update_dictionary_term(slug, patch)` — edit category, payloads, related topics/physicists for an existing term.
- `translate_dictionary_term(slug, locale, payload)` — fill in a missing-locale payload for an existing term without touching the English source. Today the only path is to re-add the term, which is destructive.
- `delete_dictionary_term(slug)` — symmetric removal across all locales.
- `add_term_relation(slug, { relatedTopics?, relatedPhysicists? })` — append to relation arrays without rewriting the whole term.

### 4. Physicists

**Completely absent.** `list_slugs(kind: "physicist")` is the only tool. There is no way to add, update, translate, or delete a physicist via the MCP. Given the `Physicist` type is one of the richest in the project (bio, contributions, major works, related topics), this is a major gap.

**Missing:**
- `add_physicist(slug, payloads, contributions?, majorWorks?, relatedTopics?)` — write `lib/content/physicists.ts` entry + per-locale messages.
- `update_physicist(slug, patch)`
- `translate_physicist(slug, locale, payload)`
- `delete_physicist(slug)`

### 5. Branches

Branches are currently hardcoded into `BranchSlug` (a TypeScript union literal). New branches require a type change AND a `BRANCHES` array entry. No MCP support.

**Missing:**
- `update_branch(slug, patch)` — change title, subtitle, description, status. Common when promoting `coming-soon` → `live`.
- `add_branch(...)` is harder because it requires changing the `BranchSlug` literal union. Either lift the union to `string` or expose a tool that mutates the union.

### 6. Locales

`add_locale` registers a locale and copies `messages/en/*.json` verbatim, but it does not translate. That is intentional ("use your own tools to translate") — so this gap is documentation, not a missing tool.

**Worth adding:**
- `delete_locale(code)` — symmetric removal from `i18n/config.ts` and `messages/<code>/`.
- `list_missing_translations(code)` — diff `messages/<code>/*.json` against `messages/en/*.json` and report missing keys.

### 7. Cross-cutting / housekeeping

- **Idempotency** — `add_*` should be safe to retry. Today, calling `add_topic` twice with the same slug will likely double-write.
- **Validation hooks** — after a write, the MCP could run `tsc --noEmit` on the touched files and report errors back. Today Claude has to remember to run the typechecker.
- **Dry-run mode** — `dryRun: true` flag on every write that returns the planned changes without applying them. Useful when doing batch operations.

---

## Priority for filling the gaps

A reasonable build order, highest-leverage first:

1. **`add_module` + `list_modules` + `update_module`** — unblocks every "create module N" workflow
2. **`update_topic` + `set_topic_status`** — needed the moment any reordering happens
3. **`translate_topic`** — content scales by locale × topic; this is the multiplier
4. **Physicist suite** — entire surface missing today
5. **`update_dictionary_term` + `translate_dictionary_term`** — fills the asymmetry with `add_dictionary_term`
6. **`update_branch`** — small surface, big quality-of-life
7. **Cross-cutting (idempotency, validation, dry-run)** — applied to all of the above

---

## Open questions for the MCP server

- Where does the MCP server source live? The gap fixes happen there, not in this repo.
- Is there a test suite for the MCP tools? New tools should be testable without a live project.
- Should `readingMinutes` become optional in both `Topic` and the MCP schema? Today's `0` sentinel works but leaks an implementation detail into data.
