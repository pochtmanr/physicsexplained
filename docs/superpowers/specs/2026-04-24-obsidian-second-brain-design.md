# Obsidian "Roman Brain" Vault — Design

**Date:** 2026-04-24
**Owner:** Roman Pochtman
**Status:** Design — awaiting review before implementation plan

## Purpose

Stand up an Obsidian vault that acts as Roman's cross-project "wider-image" knowledge layer — strategy, brand, market signals, ideas, plans, finances, stakeholders — across all three startups (Doppler, Simnetiq, Creator AI), the physics.explained project, personal life, and shared founder context.

The vault is the "Jarvis" layer: a curated, living knowledge base the user browses visually and Claude reads/writes via file tools. It is explicitly **not** a code wiki, **not** a task manager, and **not** a replacement for MemPalace.

## Non-goals

- Storing code snippets or infrastructure details (those remain in MemPalace and project repos).
- Being a daily journal (user does not journal daily; daily notes are disabled).
- Replacing MemPalace for Claude's working memory.
- Being a kanban / task board (user manages tasks in head + Telegram).
- Auto-publishing drafts anywhere without human review.

## Architecture — two memory layers

| Layer | Audience | Content | Update cadence |
|---|---|---|---|
| **MemPalace** (unchanged) | Claude — programmatic recall | Compressed facts, preferences, rules, pointers, code references | When a rule/fact changes |
| **Obsidian vault** (new) | Roman — browse/curate; Claude — read/write | Long-form: brand docs, plans, research, drafts, post calendars, finance overviews, articles saved from web, book notes, paper summaries | Batch updates every few days (user-initiated), reads as-needed, scheduled nightly/weekly/monthly agents for synthesis + health |

**Split rule:** MemPalace holds pointers + rules; Obsidian holds the substance. When asked about brand voice, Claude queries MemPalace → gets pointer → reads the Obsidian doc.

**No migration.** The two layers coexist independently. No mining of MemPalace into Obsidian at bootstrap — avoids drift risk, keeps each layer's job clean.

**No-code rule.** Any code snippet, infra detail, or credential belongs in MemPalace (reference) or project repo (substance), never Obsidian. If a user asks Claude to save code to Obsidian, Claude refuses and redirects.

## Physical layout

```
~/Vaults/roman/                       (private git repo)
├── .gitattributes                    (git-crypt filters on secrets/ paths)
├── _meta/
│   ├── CLAUDE.md                     (vault-level operating rules)
│   ├── SOUL.md                       (identity — loaded L0 every session)
│   ├── CRITICAL_FACTS.md             (~120 tokens, always loaded)
│   ├── templates/                    (person, brand doc, post, research, decision, idea)
│   └── schema.md                     (frontmatter conventions, naming rules)
├── doppler/
│   ├── raw/                          (immutable: articles, screenshots, X threads, PDFs)
│   ├── wiki/                         (Claude-synthesized pages)
│   ├── brand/                        (voice, logos, colors, guidelines)
│   ├── marketing/                    (campaigns, post calendars, drafts, published)
│   ├── finance/                      (revenue notes, expense overview — numbers only, no account credentials)
│   ├── people/                       (stakeholders, partners, customers)
│   ├── decisions/                    (logged decisions with context)
│   ├── ideas/                        (captured, pre-graduation)
│   ├── library/                      (book notes + paper summaries — Claude-synthesized from raw/books/ and raw/papers/)
│   ├── secrets/                      (git-crypt encrypted)
│   ├── index.md
│   └── log.md
├── simnetiq/                         (same shape as doppler/)
├── creator-ai/                       (same shape)
├── physics/                          (same shape)
├── roman/                            (personal: health, goals, journal-when-wanted, finances)
├── shared/                           (cross-startup: tax, legal, founder agreements with David + Dimitry)
└── claude/                           (meta: collected skills, prompt patterns, workflow notes, this spec)
```

**Structure pattern:** A+C hybrid.
- **A (wings at top):** folder per startup/area mirrors MemPalace wings (`doppler`, `simnetiq`, `creator-ai`, `physics`, `roman`, `shared`, `claude`, `_meta`).
- **C (wiki pattern inside):** each wing uses LLM-Wiki layout — `raw/` + `wiki/` + `index.md` + `log.md`. Raw sources immutable, derived pages in wiki, index as navigation spine, log as chronological audit trail.

## Working cadence

The vault is **batch-updated**, not continuously live. Expected rhythm:

- **User-initiated updates every few days** — Roman asks Claude "update the vault" (with context: what we did, what he read, what changed). Claude pulls conversation + recent work into the right wing pages in one pass.
- **Scheduled agents** handle background maintenance (nightly digest, weekly review, monthly health).
- **Reads happen as needed** — when Claude is asked a strategic question, it queries the vault; when Roman wants to explore brand strategy, he opens Obsidian and browses.
- **Ad-hoc ingestion** — `/obsidian-ingest <url|path>` anytime Roman drops in an article, book chapter, or paper.

This is explicitly **not** "Claude saves every exchange in real time." The vault reflects a curated digest of a few days' thinking, not raw transcripts.

## Books and dense study materials

Distinct workflow from web-article ingestion. Books and papers are long, structured, and worth returning to over weeks.

**Storage pattern per wing:**
- `raw/books/<slug>/` — original material: PDFs, highlights exported from Readwise/Kindle, chapter-by-chapter notes Roman takes as he reads.
- `raw/papers/<slug>.pdf` or `.md` — academic papers, dense reports.
- `library/<slug>.md` — Claude-maintained synthesis page: one-line premise, key arguments, open questions, how it intersects with other vault pages (backlinks), current read status ("reading", "finished", "shelved").

**Personal reading** (not tied to a startup) lives in `roman/library/` — self-improvement books, philosophy, psychology.

**Workflow:**
- Roman drops source into `raw/books/<slug>/` (can be progressive — chapter by chapter).
- `/obsidian-ingest raw/books/<slug>/` updates/creates `library/<slug>.md` and cross-links into relevant concept pages.
- After finish: `/obsidian-emerge` run focused on the book surfaces what was synthesized across existing vault content.
- `raw/books/<slug>/` stays immutable; re-derivation from source is always possible.

## Git + secrets

- Vault is a private GitHub repo (`roman-vault`). History preserved, synced across machines.
- `git-crypt` with a local key encrypts any file path matching `*/secrets/**`. Unlocked on Roman's primary Mac, stays encrypted everywhere else.
- `.env`-style credentials **never** go in the vault. This `secrets/` exists for infra notes (e.g., "Marzban panel URL pattern") that are sensitive but not rotating secrets. Rotating secrets live in 1Password/Bitwarden, untouched by this project.

## Claude access — integration points

1. **Global instructions** — add pointer in `~/.claude/CLAUDE.md`:
   > "Obsidian vault at `~/Vaults/roman/` — wider-image knowledge. Browse via file tools or obsidian MCP. See `_meta/CLAUDE.md` inside the vault for rules."
2. **MCP server** — install `mcp-obsidian` user-scoped, pointed at `~/Vaults/roman/`. Falls back to plain file tools if MCP unavailable.
3. **MemPalace reference drawer** — add `roman/references/obsidian_vault.md` with wing list and read/write rules. Every Claude cold-start gets this pointer.
4. **Vault-level CLAUDE.md** (`_meta/CLAUDE.md`) — overrides the installed skill's defaults (see §Tooling below).

Net effect: every Claude session, in any repo, knows the vault exists and when to touch it.

## Tooling — the obsidian-second-brain skill

Install `eugeniughelbur/obsidian-second-brain` user-scoped. The skill ships 24 slash commands + 4 scheduled agents + thinking tools. The vault-level `_meta/CLAUDE.md` overrides its defaults:

- **Wing names:** use ours (`doppler/`, `simnetiq/`, etc.), not the skill's default (`Projects/People/Daily/`).
- **Wiki pattern:** enable `raw/` + `wiki/` inside each wing, not the skill's flat layout.
- **No-code rule:** refuse to save code snippets; redirect user to MemPalace.
- **Daily notes:** disabled (user does not journal daily).
- **People notes:** enabled (stakeholders, partners, customers per wing).
- **Kanban:** disabled (user manages tasks elsewhere).
- **Bi-temporal facts:** enabled on people and decisions (tracks when a fact was true vs when the vault learned it).

Commands expected to be used most:
- `/obsidian-ingest <url|path>` — drop in an article/screenshot/thread; Claude rewrites 5–15 pages across relevant wings.
- `/obsidian-save` — save current conversation's insights into the right notes.
- `/obsidian-find <query>` — smart search across vault.
- `/obsidian-challenge` — red-team current claim against vault history.
- `/obsidian-emerge` — pattern detection across recent notes.
- `/obsidian-connect A B` — bridge two topics.
- `/obsidian-world` — identity + current-state loader for new sessions.
- `/obsidian-health` — audit contradictions, orphans, stale claims.

## Automation

Cron-scheduled agents, all Europe/Berlin:

| Agent | Cron | What it does |
|---|---|---|
| Nightly digest | 23:00 daily | Per wing with activity: reconcile contradictions, append end-of-day summary, move completed items. |
| Weekly review | Sunday 18:00 | Per wing: generate `reviews/YYYY-Www.md` summarizing the week. |
| Monthly health | 1st of month, 09:00 | Run `/obsidian-health` across all wings. Report only — no auto-fix. |

**Off:** morning daily notes, aggressive auto-saves. **On:** session-wrap save reminders.

## Bootstrap plan

**Phase 1 — scaffolding (Claude, ~30 min, no user involvement):**
- Create `~/Vaults/roman/` as private git repo.
- Init `git-crypt`, configure `.gitattributes` for `secrets/` paths.
- Write `_meta/CLAUDE.md`, `SOUL.md`, `CRITICAL_FACTS.md`, `schema.md`, and page templates.
- Create empty wings with `raw/`, `wiki/`, subfolders, `index.md`, `log.md`.
- Install `mcp-obsidian` user-scoped; wire to vault path.
- Install `eugeniughelbur/obsidian-second-brain` skill user-scoped.
- Add vault pointer to `~/.claude/CLAUDE.md`.
- Add MemPalace drawer `roman/references/obsidian_vault.md`.
- Commit initial state.

**Phase 2 — guided seed (Roman + Claude, ~20–30 min per active wing):**
Wings targeted for initial seeding: **physics, simnetiq, doppler.** Creator AI and shared skipped until actively needed.

Per-wing voice-friendly session:
- Brand voice + visual identity.
- Current plans (next quarter).
- Active people (partners, stakeholders, notable customers).
- Recent wins and losses worth logging.
- Any saved articles / X threads / LinkedIn posts the user has sitting around — ingest those now.

Output: each active wing has 15–30 real pages after its session.

**Phase 3 — live use:**
- `/obsidian-ingest <url>` whenever user reads something worth keeping.
- Scheduled agents run nightly/weekly/monthly.
- Claude proactively reminds at session wrap: "save anything?"

## Success criteria

- After Phase 1: vault scaffolds exist, Claude can read/write from any repo via file tools or MCP, skill is installed and respects overrides.
- After Phase 2: physics/simnetiq/doppler wings each have ≥15 substantive pages, linked via `index.md` and reflected in `log.md`.
- After 2 weeks of Phase 3: Obsidian graph view shows at least one hub per active wing + visible cross-wing links (e.g., a `shared/` founder-agreement page linked from both `doppler/` and `simnetiq/`).
- At 1 month: `/obsidian-emerge` produces at least one non-obvious pattern or synthesis page the user finds valuable.
- First book or dense-paper ingested into `library/` and cross-linked to ≥2 existing wiki pages within month 1.

## Open questions

- Which exact `~/.claude/CLAUDE.md` section receives the vault pointer — top-level "Memory" block or new "Knowledge" block? (Defer to implementation plan.)
- Whether `mcp-obsidian` is actually installable on macOS via the command in the skill's quick-start, or if we need a Homebrew-bundled alternative. (Verify during Phase 1.)
- Whether to set up vault sync to a second Mac now or wait until Phase 3 (multi-device demand emerges). (Defer — solve when felt.)

## Risks + mitigations

| Risk | Mitigation |
|---|---|
| Vault rots from lack of feeding | Monthly `/obsidian-health` surfaces staleness. Scheduled weekly review forces at least weekly touch per active wing. |
| Claude over-synthesizes weak patterns | Monthly health report flags low-signal synthesis pages; user prunes. |
| Ingest token costs get heavy | Per-ingest budget: cap at touching ≤10 pages unless user explicitly says "deep ingest". |
| Drift between MemPalace pointer and Obsidian doc | Pointer only references paths + wings, not content. Renaming a page requires updating the pointer — add to schema. |
| Secrets leak into git | git-crypt enforced via `.gitattributes`; pre-commit hook greps for common secret patterns. |

## What this spec does not cover

- Exact text of `_meta/CLAUDE.md` (drafted during implementation).
- Exact template file contents (drafted during implementation).
- Exact `mcp-obsidian` install command (verified during Phase 1).
- Phase 2 interview scripts (generated per wing at session time).

Those live in the implementation plan.
