# Obsidian "Roman Brain" Vault — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold `~/Vaults/roman/` as a private, git-crypt-protected Obsidian vault covering all startups + personal knowledge, wired so any Claude session can read/write it via file tools or MCP, with the `obsidian-second-brain` skill installed and overridden to respect user-specific rules.

**Architecture:** Local git repo at `~/Vaults/roman/` → private GitHub repo `roman-vault` → git-crypt encrypts `**/secrets/**` paths → `mcp-obsidian` MCP server exposes vault to Claude → `obsidian-second-brain` skill provides 24 commands + thinking tools + scheduled agents → vault's own `_meta/CLAUDE.md` overrides the skill's defaults for wing names, wiki pattern, no-code rule, disabled daily notes.

**Tech Stack:** git, git-crypt, GitHub (private repo), Homebrew (for git-crypt install), Claude Code CLI (MCP + skill + triggers), `mcp-obsidian` (npm via npx), Obsidian (desktop app, already installed), Markdown + YAML frontmatter.

**Spec:** `docs/superpowers/specs/2026-04-24-obsidian-second-brain-design.md`

**Context for executor:**
- All tasks modify files OUTSIDE the physics repo except Task 12 (Phase 2 runbook). The plan's file edits on `~/Vaults/roman/`, `~/.claude/CLAUDE.md`, and MemPalace are not tracked in the physics repo.
- Every `cd` target is explicit per task — do not assume CWD carries over.
- "The user" below refers to Roman, who is available to create the GitHub repo and approve pushes.
- Smoke tests are shell-based (not unit tests). They verify directory/file existence, git-crypt lock/unlock, and an end-to-end Claude read-through-MCP test.

---

## File structure this plan creates

```
~/Vaults/roman/                       NEW — private git repo
├── .git/
├── .gitignore                        ignore Obsidian junk
├── .gitattributes                    git-crypt filter: */secrets/** encrypted
├── .git-crypt/                       git-crypt key material (not committed to remote)
├── _meta/
│   ├── CLAUDE.md                     vault-level operating rules (overrides skill)
│   ├── SOUL.md                       identity
│   ├── CRITICAL_FACTS.md             always-loaded tiny fact file
│   ├── schema.md                     frontmatter + naming conventions
│   └── templates/
│       ├── person.md
│       ├── brand-doc.md
│       ├── post.md
│       ├── research.md
│       ├── decision.md
│       ├── idea.md
│       ├── book.md
│       └── paper.md
├── index.md                          root index
├── log.md                            root log
├── doppler/  simnetiq/  creator-ai/  physics/       (startup wings)
│   ├── raw/{articles,books,papers,screenshots}/
│   ├── wiki/
│   ├── brand/ marketing/ finance/ people/ decisions/ ideas/ library/
│   ├── secrets/                      (git-crypt encrypted)
│   ├── index.md
│   └── log.md
├── roman/                            (personal wing — slightly different shape)
│   ├── raw/
│   ├── wiki/
│   ├── health/ goals/ finances/ library/ journal/ people/
│   ├── secrets/
│   ├── index.md
│   └── log.md
├── shared/                           (cross-startup: founder agreements, tax, legal)
│   ├── raw/  wiki/  decisions/  people/  secrets/
│   ├── index.md
│   └── log.md
└── claude/                           (meta: skills snippets, prompt patterns, workflow)
    ├── raw/  wiki/  skills/ prompts/ workflows/
    ├── index.md
    └── log.md

~/.claude/CLAUDE.md                   MODIFY — add Obsidian pointer block
MemPalace drawer: roman/references/obsidian_vault.md     CREATE
Claude Code MCP config: adds obsidian-vault server       MODIFY
Claude Code triggers: 3 scheduled agents (nightly/weekly/monthly)   CREATE
```

---

## Task 1: Prerequisites check + install git-crypt

**Files:**
- No file changes. Tooling verification only.

- [ ] **Step 1: Check required CLI tools**

Run:
```bash
which git gh claude node npx 2>&1
```

Expected: all five print a path. If any missing, stop and ask the user to install (`brew install git gh node`; `claude` is the Claude Code CLI already present).

- [ ] **Step 2: Check git-crypt**

Run:
```bash
which git-crypt
```

Expected: prints `/opt/homebrew/bin/git-crypt` or similar. If "not found":

- [ ] **Step 3: Install git-crypt if missing**

Run:
```bash
brew install git-crypt
```

Expected: Homebrew installs `git-crypt`. Verify: `git-crypt --version` prints a version string.

- [ ] **Step 4: Verify GitHub auth**

Run:
```bash
gh auth status
```

Expected: shows logged-in user. If not: `gh auth login` (user-interactive, tell the user to run this manually with `! gh auth login`).

- [ ] **Step 5: No commit in this task** — prerequisite verification only.

---

## Task 2: Create vault repo skeleton

**Files:**
- Create: `~/Vaults/roman/.gitignore`
- Create: `~/Vaults/roman/.gitattributes`
- Create: `~/Vaults/roman/README.md`

- [ ] **Step 1: Create the vault directory and init git**

Run:
```bash
mkdir -p "$HOME/Vaults/roman"
cd "$HOME/Vaults/roman"
git init -b main
```

Expected: `Initialized empty Git repository in /Users/romanpochtman/Vaults/roman/.git/`

- [ ] **Step 2: Write .gitignore**

Create `$HOME/Vaults/roman/.gitignore`:
```
# Obsidian workspace & cache
.obsidian/workspace*
.obsidian/cache
.obsidian/plugins/*/data.json
.trash/

# macOS
.DS_Store

# Claude Code local
.claude/local/

# Temp
*.tmp
*.bak
```

- [ ] **Step 3: Init git-crypt and write .gitattributes**

Run:
```bash
cd "$HOME/Vaults/roman"
git-crypt init
```

Expected: `Generating key...`

Create `$HOME/Vaults/roman/.gitattributes`:
```
*/secrets/** filter=git-crypt diff=git-crypt
**/secrets/** filter=git-crypt diff=git-crypt
secrets/** filter=git-crypt diff=git-crypt
```

- [ ] **Step 4: Export git-crypt key to a safe location**

Run:
```bash
mkdir -p "$HOME/.git-crypt-keys"
chmod 700 "$HOME/.git-crypt-keys"
cd "$HOME/Vaults/roman"
git-crypt export-key "$HOME/.git-crypt-keys/roman-vault.key"
chmod 600 "$HOME/.git-crypt-keys/roman-vault.key"
```

Expected: key file exists at `~/.git-crypt-keys/roman-vault.key`. Tell the user: **"Back up `~/.git-crypt-keys/roman-vault.key` to 1Password now. Without it, encrypted files cannot be recovered on another machine."**

- [ ] **Step 5: Write README.md**

Create `$HOME/Vaults/roman/README.md`:
```markdown
# Roman Vault

Personal second brain — strategy, brand, marketing, ideas, reading, plans.

Not a code repo. Not a secrets vault (rotating secrets live in 1Password).

## Wings

- `doppler/` — Doppler VPN
- `simnetiq/` — Simnetiq eSIM
- `creator-ai/` — Creator AI
- `physics/` — physics.explained
- `roman/` — personal
- `shared/` — cross-startup (founder agreements, tax, legal)
- `claude/` — meta: skills, prompts, workflows

## Conventions

See `_meta/CLAUDE.md`.

## Unlock (new machine)

```
git clone git@github.com:<user>/roman-vault.git ~/Vaults/roman
cd ~/Vaults/roman
git-crypt unlock ~/.git-crypt-keys/roman-vault.key
```
```

- [ ] **Step 6: First commit**

Run:
```bash
cd "$HOME/Vaults/roman"
git add .gitignore .gitattributes README.md
git commit -m "chore: init vault with git-crypt and gitignore"
```

Expected: one commit on main.

---

## Task 3: Scaffold _meta/ (operating rules, identity, schema, templates)

**Files:**
- Create: `~/Vaults/roman/_meta/CLAUDE.md`
- Create: `~/Vaults/roman/_meta/SOUL.md`
- Create: `~/Vaults/roman/_meta/CRITICAL_FACTS.md`
- Create: `~/Vaults/roman/_meta/schema.md`
- Create: `~/Vaults/roman/_meta/templates/{person,brand-doc,post,research,decision,idea,book,paper}.md`

- [ ] **Step 1: Create _meta/CLAUDE.md**

Create `$HOME/Vaults/roman/_meta/CLAUDE.md`:
```markdown
# Vault Operating Rules (overrides obsidian-second-brain skill defaults)

## Identity

Vault owner: Roman Pochtman. Founder of Doppler VPN, Simnetiq eSIM, Creator AI. Physics.explained operator. Based Europe/Berlin.

## Hard rules (cannot be overridden by conversation)

1. **No code in this vault.** If asked to save a code snippet, infra detail, or credentials: refuse and redirect to MemPalace (pointer only) or the relevant project repo. Code lives in git-tracked project repos, not here.
2. **Raw is immutable.** Files under any `*/raw/**` path are NEVER modified or deleted. If a synthesis needs updating, re-derive from raw.
3. **Secrets stay encrypted.** Files under any `*/secrets/**` path MUST land git-crypt encrypted. Never include raw credential strings; reference them (e.g. "token stored in 1Password under 'Doppler — Marzban API'").
4. **Propagation is required.** Every write updates: the target page, `<wing>/index.md`, `<wing>/log.md`. For cross-wing impact, also root `index.md` + `log.md`.
5. **Bi-temporal facts on people + decisions.** When a person's role/company changes, append to the `timeline:` frontmatter array — never overwrite.

## Wing structure

Top-level wings: `doppler/`, `simnetiq/`, `creator-ai/`, `physics/`, `roman/`, `shared/`, `claude/`, `_meta/`.

Inside each startup wing (doppler, simnetiq, creator-ai, physics):
- `raw/` (sources: articles, books, papers, screenshots) — immutable
- `wiki/` (Claude-synthesized pages)
- `brand/`, `marketing/`, `finance/`, `people/`, `decisions/`, `ideas/`, `library/`, `secrets/`
- `index.md`, `log.md`

Inside `roman/`: `raw/`, `wiki/`, `health/`, `goals/`, `finances/`, `library/`, `journal/`, `people/`, `secrets/`, `index.md`, `log.md`.
Inside `shared/`: `raw/`, `wiki/`, `decisions/`, `people/`, `secrets/`, `index.md`, `log.md`.
Inside `claude/`: `raw/`, `wiki/`, `skills/`, `prompts/`, `workflows/`, `index.md`, `log.md`.

## Skill defaults to override

The `obsidian-second-brain` skill defaults assume a flat `Projects/People/Daily/` vault. We use wings + wiki pattern.

- **Daily notes: DISABLED.** Roman does not journal daily. Do NOT auto-create `Daily/YYYY-MM-DD.md`.
- **Kanban boards: DISABLED.** Tasks are managed in Telegram / Roman's head. Do NOT touch `Boards/`.
- **People notes: ENABLED** (per wing, in `<wing>/people/`).
- **Decision records: ENABLED** (per wing, in `<wing>/decisions/`).
- **Ingest target paths:** web article → `<wing>/raw/articles/` + `<wing>/wiki/`; book → `<wing>/raw/books/<slug>/` + `<wing>/library/<slug>.md`; paper → `<wing>/raw/papers/<slug>.md` + `<wing>/library/<slug>.md`.
- **Index and log: `index.md` + `log.md` per wing AND at vault root.** Use `## [YYYY-MM-DD] action | description` format in logs.
- **Synthesis pages: `<wing>/wiki/synthesis/` or `<wing>/wiki/concepts/`** when patterns emerge across 3+ sources.

## Working cadence (informational, not enforced)

- Vault is **batch-updated** every few days, user-initiated ("update the vault").
- Scheduled agents run nightly (23:00 Berlin), weekly (Sunday 18:00), monthly (1st 09:00).
- Morning daily notes OFF.

## What Claude does when asked to "update the vault"

1. Review current conversation and recent work (git log on related repos if applicable).
2. Identify wing(s) affected.
3. For each affected wing: create or update the relevant page(s) under `wiki/` or subfolder, append entry to `<wing>/log.md`, update `<wing>/index.md` if new page.
4. If cross-wing impact: update root `index.md` + `log.md`.
5. Report: which pages touched, why.

## What Claude does when asked to "ingest <source>"

1. Classify: article / book / paper / screenshot / thread.
2. Determine target wing(s) (may be multiple).
3. Place source in `<wing>/raw/<kind>/`.
4. Create or update `<wing>/wiki/<slug>.md` with synthesis.
5. Update or create cross-links in relevant `brand/`, `marketing/`, `ideas/`, etc.
6. Update `<wing>/index.md` + `<wing>/log.md`.
7. Limit: touch ≤10 pages per ingest unless user says "deep ingest".

## MemPalace boundary

- MemPalace = Claude's working memory (code, facts, rules, pointers).
- This vault = wider-image knowledge (strategy, brand, ideas).
- When a vault page is created that MemPalace should know about (e.g. brand voice doc), optionally add a one-line pointer to MemPalace via `mempalace_add_drawer` in the `roman` wing, `references` room.
- Do NOT duplicate substance between layers.
```

- [ ] **Step 2: Create _meta/SOUL.md**

Create `$HOME/Vaults/roman/_meta/SOUL.md`:
```markdown
---
name: Roman Pochtman
role: Founder, technical lead
location: Dortmund, Germany
timezone: Europe/Berlin
---

# Soul

Roman Pochtman — technical founder running three parallel startups + one open-source project.

## What I work on

- **Doppler VPN** — iOS + Android + Telegram bots + landing + mini app. Marzban VLESS-Reality. With David (30%) and Dimitry (30%).
- **Simnetiq** — eSIM marketplace. Landing + admin + mobile.
- **Creator AI** — AI content platform.
- **physics.explained** — interactive physics learning site.

## How I work

- Terse over verbose. No filler, no "Great question."
- Telegram voice for thinking; Claude Code for execution.
- Direct, impatient with hedging. Prefer decisions over options.
- Resourceful before asking — read files, search, check MemPalace.
- Europe/Berlin hours but irregular.

## What I value

- Leverage. One person doing the work of five by building tools, hiring agents, automating.
- Clarity. Every decision traceable to a reason.
- Not being told the same thing twice.

## What I'm bad at

- Remembering which decisions I already made.
- Context-switching across startups without losing thread.
- Reading everything I save. ← the vault helps here.
```

- [ ] **Step 3: Create _meta/CRITICAL_FACTS.md**

Create `$HOME/Vaults/roman/_meta/CRITICAL_FACTS.md`:
```markdown
<!-- always loaded; keep <150 tokens -->

- Timezone: Europe/Berlin
- Location: Dortmund, Germany
- Current active wings: physics, simnetiq, doppler (creator-ai dormant)
- Three startups: Doppler VPN (with David 30%, Dimitry 30%), Simnetiq, Creator AI
- Brand voice: terse, direct, no filler
- Comms: Telegram voice (@rpochtman), email pochtmanrca@gmail.com
```

- [ ] **Step 4: Create _meta/schema.md**

Create `$HOME/Vaults/roman/_meta/schema.md`:
```markdown
# Vault Schema

## Frontmatter conventions

All wiki pages start with YAML frontmatter. Minimum fields:

```yaml
---
title: <human-readable title>
created: YYYY-MM-DD
updated: YYYY-MM-DD
wing: <doppler|simnetiq|creator-ai|physics|roman|shared|claude>
type: <brand|marketing|idea|decision|person|book|paper|research|synthesis|concept>
status: <draft|active|archived|graduated>
tags: [list, of, tags]
---
```

People pages add:
```yaml
role: <current role>
company: <current company>
timeline:
  - fact: "<role/company>"
    from: YYYY-MM-DD
    until: <YYYY-MM-DD | present>
    learned: YYYY-MM-DD
    source: "[[YYYY-MM-DD]]"
```

Decision pages add:
```yaml
decided: YYYY-MM-DD
decision: <one-line summary>
context: <what was happening>
alternatives: [list]
revisit: <YYYY-MM-DD | never>
```

Book pages add:
```yaml
author: <full name>
subtitle: <if any>
started: YYYY-MM-DD
finished: <YYYY-MM-DD | null>
status: <reading|finished|shelved>
rating: <1-5 | null>
```

## File naming

- Lowercase, hyphen-separated: `marketing-plan-q2.md`, `tiago-forte.md`.
- People: `first-last.md` (Latin-script preferred).
- Books: `<author-last>-<short-title-slug>.md` (e.g. `forte-building-a-second-brain.md`).
- Raw sources: keep original filename if meaningful, else `YYYY-MM-DD-<topic-slug>.<ext>`.

## Links

- Always use Obsidian `[[wikilink]]` syntax for internal links — Obsidian resolves them and keeps graph view working.
- Cross-wing links: `[[../simnetiq/brand/voice|Simnetiq brand voice]]` (relative path; Obsidian handles).

## Log format

```
## [YYYY-MM-DD] <action> | <one-line description>
<optional 1-2 lines of context>
```

Actions: `ingest`, `write`, `update`, `synthesize`, `reconcile`, `review`, `lint`, `delete`.

## Index format

Grouped by folder inside each wing:

```
## brand/
- [[brand/voice|Voice guide]] — tone of voice + don't-do list
- [[brand/colors|Colors]] — hex codes + when to use

## marketing/
- [[marketing/plan-q2|Q2 plan]] — Apr-Jun campaign outline
```
```

- [ ] **Step 5: Create templates**

Create `$HOME/Vaults/roman/_meta/templates/person.md`:
```markdown
---
title: <Name>
created: <DATE>
updated: <DATE>
wing: <WING>
type: person
status: active
role: <current role>
company: <current company>
timeline:
  - fact: "<role> at <company>"
    from: <DATE>
    until: present
    learned: <DATE>
    source: "[[<DATE>]]"
---

# <Name>

## Context
How I know them, where they fit.

## History
Key interactions, decisions involving them.

## Current
What they're working on, what they asked for last.

## Links
- [[related-page]]
```

Create `$HOME/Vaults/roman/_meta/templates/brand-doc.md`:
```markdown
---
title: <title>
created: <DATE>
updated: <DATE>
wing: <WING>
type: brand
status: active
tags: [brand]
---

# <Title>

## Premise
One line: what this is and why it exists.

## Rules
- Do
- Don't

## Examples
- Good: ...
- Bad: ...

## Source
Where this came from (decision, research, founder preference).
```

Create `$HOME/Vaults/roman/_meta/templates/post.md`:
```markdown
---
title: <title>
created: <DATE>
updated: <DATE>
wing: <WING>
type: marketing
status: draft
platform: <x|linkedin|instagram|telegram>
target_date: <YYYY-MM-DD>
---

# <Title>

## Hook
One-line hook.

## Body
Full post draft.

## CTA
Call to action.

## Source
What inspired this (idea page, event, article).
```

Create `$HOME/Vaults/roman/_meta/templates/research.md`:
```markdown
---
title: <topic>
created: <DATE>
updated: <DATE>
wing: <WING>
type: research
status: active
tags: [research]
sources_count: 0
---

# <Topic>

## Question
What we're trying to understand.

## Findings
- Finding 1 ([source](...))
- Finding 2

## Open questions
- ...

## Synthesis
What it means for us.
```

Create `$HOME/Vaults/roman/_meta/templates/decision.md`:
```markdown
---
title: <decision one-liner>
created: <DATE>
updated: <DATE>
wing: <WING>
type: decision
status: active
decided: <DATE>
decision: <one-line summary>
alternatives: []
revisit: <YYYY-MM-DD | never>
---

# <Decision>

## Context
What was happening, what prompted this.

## Options considered
1. <option> — pro/con
2. <option> — pro/con

## Choice
What we picked and why.

## Trigger to revisit
Conditions that would make us reopen this.
```

Create `$HOME/Vaults/roman/_meta/templates/idea.md`:
```markdown
---
title: <idea>
created: <DATE>
updated: <DATE>
wing: <WING>
type: idea
status: draft
tags: [idea]
---

# <Idea>

## One-liner
What it is in one sentence.

## Why interesting
What problem it solves, who cares.

## Why might not work
Honest pushback.

## Next step
Smallest action to test it.
```

Create `$HOME/Vaults/roman/_meta/templates/book.md`:
```markdown
---
title: <Book title>
author: <Full name>
subtitle: <optional>
created: <DATE>
updated: <DATE>
wing: <WING>
type: book
status: reading
started: <DATE>
finished: null
rating: null
tags: [book]
---

# <Title> — <Author>

## Premise
One line: what the book argues.

## Key arguments
- Argument 1 — supporting evidence / example.
- Argument 2
- Argument 3

## Quotes worth keeping
> quote
— location

## How it intersects with other vault pages
- [[related-page]] — why it's relevant.

## Open questions
- ...

## Status notes
Reading log, impressions per chapter.
```

Create `$HOME/Vaults/roman/_meta/templates/paper.md`:
```markdown
---
title: <Paper title>
authors: [<name1>, <name2>]
created: <DATE>
updated: <DATE>
wing: <WING>
type: paper
status: read
year: <YYYY>
venue: <journal/conf>
tags: [paper]
---

# <Title>

## Premise
One-paragraph abstract in your own words.

## Method
How they did it.

## Findings
- Finding 1
- Finding 2

## Limitations
What the paper admits (or doesn't admit) as weaknesses.

## Relevance
Why I read this, what I'll do with it.
```

- [ ] **Step 6: Smoke-test the scaffold**

Run:
```bash
ls "$HOME/Vaults/roman/_meta/" && ls "$HOME/Vaults/roman/_meta/templates/"
```

Expected: 4 top-level files (CLAUDE.md, SOUL.md, CRITICAL_FACTS.md, schema.md) + 8 template files.

- [ ] **Step 7: Commit**

Run:
```bash
cd "$HOME/Vaults/roman"
git add _meta/
git commit -m "feat: scaffold _meta/ with CLAUDE.md, SOUL.md, schema, templates"
```

Expected: one commit.

---

## Task 4: Scaffold all 7 wings

**Files:**
- Create: `~/Vaults/roman/{doppler,simnetiq,creator-ai,physics}/` with startup-wing subtree
- Create: `~/Vaults/roman/roman/` with personal subtree
- Create: `~/Vaults/roman/shared/` with shared subtree
- Create: `~/Vaults/roman/claude/` with meta subtree
- Create: `index.md` + `log.md` per wing
- Create: `~/Vaults/roman/index.md` + `log.md` at root

- [ ] **Step 1: Create the scaffolder (ephemeral)**

Create `/tmp/scaffold-vault.sh`:
```bash
#!/usr/bin/env bash
set -euo pipefail
VAULT="${1:-$HOME/Vaults/roman}"
TODAY="$(date +%Y-%m-%d)"

make_index() {
  local wing="$1"
  cat > "$VAULT/$wing/index.md" <<EOF
# ${wing} — index

Generated on ${TODAY}. See \`_meta/schema.md\` for format.

## wiki/
(none yet)

## raw/
(none yet)
EOF
}

make_log() {
  local wing="$1"
  cat > "$VAULT/$wing/log.md" <<EOF
# ${wing} — log

## [${TODAY}] init | wing scaffolded
EOF
}

startup_wing() {
  local wing="$1"
  mkdir -p "$VAULT/$wing"/{raw/articles,raw/books,raw/papers,raw/screenshots,wiki,brand,marketing,finance,people,decisions,ideas,library,secrets}
  make_index "$wing"
  make_log "$wing"
  touch "$VAULT/$wing/secrets/.gitkeep"
}

for w in doppler simnetiq creator-ai physics; do
  startup_wing "$w"
done

# personal wing
mkdir -p "$VAULT/roman"/{raw,wiki,health,goals,finances,library,journal,people,secrets}
make_index "roman"
make_log "roman"
touch "$VAULT/roman/secrets/.gitkeep"

# shared wing
mkdir -p "$VAULT/shared"/{raw,wiki,decisions,people,secrets}
make_index "shared"
make_log "shared"
touch "$VAULT/shared/secrets/.gitkeep"

# claude wing (meta — no secrets needed)
mkdir -p "$VAULT/claude"/{raw,wiki,skills,prompts,workflows}
make_index "claude"
make_log "claude"

# root index + log
cat > "$VAULT/index.md" <<EOF
# Roman Vault — root index

## Wings
- [[doppler/index]]
- [[simnetiq/index]]
- [[creator-ai/index]]
- [[physics/index]]
- [[roman/index]]
- [[shared/index]]
- [[claude/index]]

## Meta
- [[_meta/CLAUDE.md|Operating rules]]
- [[_meta/SOUL.md|Identity]]
- [[_meta/schema.md|Schema]]
EOF

cat > "$VAULT/log.md" <<EOF
# Roman Vault — root log

## [${TODAY}] init | vault scaffolded (wings: doppler, simnetiq, creator-ai, physics, roman, shared, claude)
EOF

echo "Scaffold complete at $VAULT"
```

Make executable:
```bash
chmod +x /tmp/scaffold-vault.sh
```

- [ ] **Step 2: Run the scaffolder**

Run:
```bash
/tmp/scaffold-vault.sh "$HOME/Vaults/roman"
```

Expected: `Scaffold complete at /Users/romanpochtman/Vaults/roman`

- [ ] **Step 3: Smoke-test all wings exist**

Run:
```bash
for w in doppler simnetiq creator-ai physics roman shared claude; do
  test -f "$HOME/Vaults/roman/$w/index.md" && test -f "$HOME/Vaults/roman/$w/log.md" && echo "OK: $w" || echo "FAIL: $w"
done
test -f "$HOME/Vaults/roman/index.md" && test -f "$HOME/Vaults/roman/log.md" && echo "OK: root" || echo "FAIL: root"
```

Expected: 8 "OK" lines.

- [ ] **Step 4: Verify git-crypt filter catches secrets/**

Run:
```bash
cd "$HOME/Vaults/roman"
echo "test-secret-content" > doppler/secrets/test.md
git add doppler/secrets/test.md
git status
git ls-files --others --exclude-standard
# Confirm it would be encrypted:
git check-attr filter -- doppler/secrets/test.md
```

Expected: `doppler/secrets/test.md: filter: git-crypt`. If so, remove the test file:
```bash
git rm -f doppler/secrets/test.md
```

- [ ] **Step 5: Commit**

Run:
```bash
cd "$HOME/Vaults/roman"
git add .
git commit -m "feat: scaffold 7 wings (doppler, simnetiq, creator-ai, physics, roman, shared, claude) + root index/log"
```

Expected: one commit. Check `git ls-files | wc -l` — should be ~50+ files.

---

## Task 5: Create private GitHub repo and push

**Files:**
- No local file changes. Git remote only.

- [ ] **Step 1: Create private GitHub repo**

Run:
```bash
gh repo create roman-vault --private --description "Roman's personal second brain — strategy, brand, marketing, ideas, reading, plans." --source "$HOME/Vaults/roman" --remote origin --push
```

Expected: repo created at `https://github.com/<user>/roman-vault`, remote `origin` added, initial push succeeds.

If this fails (e.g., `--source` incompatibility with current gh version), fall back:
```bash
gh repo create roman-vault --private --description "Roman's personal second brain"
cd "$HOME/Vaults/roman"
git remote add origin "git@github.com:$(gh api user --jq .login)/roman-vault.git"
git push -u origin main
```

- [ ] **Step 2: Verify push**

Run:
```bash
cd "$HOME/Vaults/roman"
git log --oneline origin/main | head -5
```

Expected: lists the 3 commits from tasks 2, 3, 4.

- [ ] **Step 3: Tell the user to back up the git-crypt key**

Print to user:
> "Vault pushed to private repo `roman-vault`. IMPORTANT: back up `~/.git-crypt-keys/roman-vault.key` to 1Password right now. Without it you cannot decrypt `secrets/` on another machine or after a reinstall."

- [ ] **Step 4: No commit needed** — remote-only action.

---

## Task 6: Install mcp-obsidian MCP server

**Files:**
- Modifies: Claude Code user MCP config (managed by `claude` CLI).

- [ ] **Step 1: Add the MCP server**

Run:
```bash
claude mcp add obsidian-vault -s user -- npx -y mcp-obsidian "$HOME/Vaults/roman"
```

Expected: prints success message. If `mcp-obsidian` package doesn't exist or npx fails, check the skill README for current package name — candidates: `mcp-obsidian`, `@modelcontextprotocol/server-obsidian`, `obsidian-mcp`.

- [ ] **Step 2: List MCPs to verify**

Run:
```bash
claude mcp list
```

Expected: `obsidian-vault` appears in the list, user scope.

- [ ] **Step 3: Smoke-test the MCP**

Spawn a fresh Claude session (or use the current one after MCP reload) and run a minimal query that exercises the MCP:
```
List files in the obsidian-vault MCP at path "/" limited to 20 entries.
```

Expected: returns `_meta/`, `doppler/`, `simnetiq/`, etc. If MCP connection fails, verify `which npx` + `which node` and re-add.

- [ ] **Step 4: Document the exact working install command in claude/ wing**

After verifying which package name worked, append to `$HOME/Vaults/roman/claude/workflows/mcp-obsidian-install.md`:
```markdown
# MCP: obsidian-vault

Install (user scope):
\`\`\`
claude mcp add obsidian-vault -s user -- npx -y <working-package-name> "$HOME/Vaults/roman"
\`\`\`

Verify: \`claude mcp list\` shows \`obsidian-vault\`.

Last tested: <DATE>
```

(Fill in the working package name from Step 1.)

- [ ] **Step 5: Commit the MCP install note in the vault**

Run:
```bash
cd "$HOME/Vaults/roman"
git add claude/workflows/mcp-obsidian-install.md
git commit -m "docs(claude): record working mcp-obsidian install command"
```

---

## Task 7: Install obsidian-second-brain skill

**Files:**
- Modifies: `~/.claude/` skill directory (managed by the skill's installer).
- Create: `~/Vaults/roman/claude/skills/obsidian-second-brain.md` (note about install).

- [ ] **Step 1: Clone the skill repo**

Run:
```bash
git clone https://github.com/eugeniughelbur/obsidian-second-brain.git /tmp/obsidian-second-brain
cd /tmp/obsidian-second-brain
cat install.sh | head -40
```

Expected: prints the first 40 lines of install.sh. Review it to confirm it's a local skill install, NOT the `quick-install.sh` that also bootstraps a new vault (we already have our own vault).

- [ ] **Step 2: Run install.sh**

Run:
```bash
cd /tmp/obsidian-second-brain
bash install.sh
```

Expected: installs skill files under `~/.claude/skills/` or `~/.claude/plugins/`. If the installer prompts for vault path or preset, cancel and use manual copy:
```bash
# Manual install fallback — copy commands only, skip bootstrap/presets:
mkdir -p ~/.claude/skills/obsidian-second-brain
cp -r /tmp/obsidian-second-brain/{SKILL.md,commands,hooks,references,scripts} ~/.claude/skills/obsidian-second-brain/
```

- [ ] **Step 3: Verify skill is loaded**

Restart Claude Code or run:
```bash
claude /help
```

Expected: `/obsidian-save`, `/obsidian-ingest`, `/obsidian-find`, `/obsidian-emerge`, etc. appear in the skill/command list.

- [ ] **Step 4: Record install in vault**

Create `$HOME/Vaults/roman/claude/skills/obsidian-second-brain.md`:
```markdown
---
title: obsidian-second-brain skill
created: <DATE>
updated: <DATE>
wing: claude
type: skill
status: active
---

# obsidian-second-brain

Installed from: https://github.com/eugeniughelbur/obsidian-second-brain

## Install method

<manual | install.sh | quick-install.sh>

## Commands enabled
- /obsidian-save, /obsidian-ingest, /obsidian-find
- /obsidian-challenge, /obsidian-emerge, /obsidian-connect, /obsidian-graduate
- /obsidian-world, /obsidian-health
- (daily, kanban commands present but disabled via _meta/CLAUDE.md)

## Overrides
See [[../../_meta/CLAUDE|_meta/CLAUDE.md]] for all vault-level overrides.

## Upgrade

\`\`\`
cd /tmp/obsidian-second-brain && git pull && bash install.sh
\`\`\`
```

- [ ] **Step 5: Commit**

Run:
```bash
cd "$HOME/Vaults/roman"
git add claude/skills/
git commit -m "docs(claude): record obsidian-second-brain skill install"
```

---

## Task 8: Wire the vault into global Claude context

**Files:**
- Modify: `~/.claude/CLAUDE.md` — add Obsidian pointer block.
- MemPalace: add drawer `roman/references/obsidian_vault.md`.

- [ ] **Step 1: Add vault pointer to ~/.claude/CLAUDE.md**

Read the current file:
```bash
cat ~/.claude/CLAUDE.md
```

Locate the `## Memory — MemPalace ONLY` section. Insert this new section AFTER the MemPalace block (and before `## About Roman` or next section):

```markdown
## Obsidian Vault

Personal knowledge layer at `~/Vaults/roman/`. Private git repo, git-crypt on `*/secrets/**`.

**Purpose:** wider-image knowledge — strategy, brand, marketing, ideas, plans, research, books. NOT code (code goes to MemPalace/project repos).

**Wings:** `doppler/`, `simnetiq/`, `creator-ai/`, `physics/`, `roman/`, `shared/`, `claude/`, `_meta/`.

**Structure per wing:** `raw/` (immutable sources) + `wiki/` (Claude-synthesized) + subject folders + `index.md` + `log.md`.

**Rules:** see `~/Vaults/roman/_meta/CLAUDE.md`. Key constraints:
1. No code in this vault.
2. Raw is immutable.
3. Secrets stay in `*/secrets/**` (git-crypt encrypted).
4. Propagate every write to `index.md` + `log.md`.

**When to read it:** strategic/brand/marketing/planning questions, or when user says "check the vault".
**When to write:** user asks "update the vault" or `/obsidian-ingest <source>`.
**Access:** `mcp-obsidian` MCP server (named `obsidian-vault`) or direct file tools.
```

Use the Edit tool with the MemPalace section header as unique context.

- [ ] **Step 2: Verify**

Run:
```bash
grep -A 2 "## Obsidian Vault" ~/.claude/CLAUDE.md
```

Expected: the header + first 2 lines appear.

- [ ] **Step 3: Add MemPalace reference drawer**

Use `mempalace_add_drawer` (or equivalent CLI) with:
- wing: `roman`
- room: `references`
- drawer name: `obsidian_vault`
- content:

```
# Obsidian Vault — reference

Location: `~/Vaults/roman/` (private GitHub: `roman-vault`).

## What it holds
Wider-image knowledge: strategy, brand, marketing, ideas, plans, research, books.

## Wings
- doppler, simnetiq, creator-ai, physics — per-startup
- roman — personal (health, goals, finances, journal, library)
- shared — cross-startup (founder agreements, tax, legal)
- claude — meta (skills, prompts, workflows)

## Per-wing structure
raw/ (immutable sources) + wiki/ (Claude-synthesized) + subject folders (brand, marketing, finance, people, decisions, ideas, library, secrets) + index.md + log.md.

## Boundary with MemPalace
- MemPalace: pointers, facts, rules, code references (this layer).
- Obsidian: substance — long-form, browsable, curated.
- No code in Obsidian. No long-form prose in MemPalace beyond pointers.

## Access
- MCP: `obsidian-vault` (mcp-obsidian, user-scoped).
- Direct: file tools against `~/Vaults/roman/`.
- Rules: `~/Vaults/roman/_meta/CLAUDE.md`.

## When to query this layer
Strategic / brand / marketing / planning / reading-list questions. User says "check the vault" or "what do we have on X".
```

- [ ] **Step 4: Verify MemPalace drawer**

Run the MemPalace search:
```
mempalace_search("obsidian vault", wing="roman")
```

Expected: returns the new drawer.

- [ ] **Step 5: No vault commit** — these changes land in `~/.claude/` and MemPalace, not the vault repo.

---

## Task 9: Scheduled agents (nightly, weekly, monthly)

**Files:**
- Creates: 3 Claude Code triggers (via `CronCreate` tool).

- [ ] **Step 1: Nightly digest trigger**

Create trigger:
- **Name:** `obsidian-nightly-digest`
- **Cron:** `0 23 * * *` (23:00 daily, system local time = Europe/Berlin on Roman's Mac)
- **Prompt:**
```
Run nightly digest for ~/Vaults/roman/. For each wing with any log entry in the last 24h:

1. Read today's log.md entries.
2. Append a "## [<today>] digest" section summarizing (3-5 bullets): what was ingested, what was decided, open questions left.
3. Scan wiki/ for pages modified today; flag any contradictions with older pages.

Report: per-wing summary in 1-2 sentences. Do not create daily notes. Do not modify raw/. Touch ≤5 pages per wing.
```

- [ ] **Step 2: Weekly review trigger**

Create trigger:
- **Name:** `obsidian-weekly-review`
- **Cron:** `0 18 * * 0` (Sunday 18:00)
- **Prompt:**
```
Run weekly review for ~/Vaults/roman/. For each wing with activity this ISO week:

1. Read <wing>/log.md for entries in the past 7 days.
2. Create <wing>/wiki/reviews/YYYY-Www.md using the research template.
3. Sections: what was ingested, what was decided, patterns noticed, next week's open threads.
4. Link from the last day's log entry and from <wing>/index.md.

Skip wings with no activity. Touch ≤8 pages per wing.
```

- [ ] **Step 3: Monthly health trigger**

Create trigger:
- **Name:** `obsidian-monthly-health`
- **Cron:** `0 9 1 * *` (1st of month at 09:00)
- **Prompt:**
```
Run monthly health check on ~/Vaults/roman/. Use /obsidian-health across all wings.

Output a single report at <root>/claude/workflows/health/YYYY-MM.md listing:
- Contradictions found (pages that disagree)
- Stale claims (>60 days, status=active)
- Orphan pages (no inbound links)
- Missing concept pages (mentioned ≥3 times, no page exists)

REPORT ONLY. Do not auto-fix anything. Tag with `#health-check`.
```

- [ ] **Step 4: Verify triggers**

Run `CronList` (or `claude` equivalent). Expected: 3 triggers listed.

- [ ] **Step 5: Smoke-test nightly manually**

Run `CronRun obsidian-nightly-digest` (if tool exists) or simulate:
- Create a sample log entry in `doppler/log.md`: `## [<today>] write | brand voice draft`.
- Manually execute the nightly prompt text in a Claude session.
- Expect: digest section appended to `doppler/log.md`.
- Revert the test write.

- [ ] **Step 6: Commit**

Run:
```bash
cd "$HOME/Vaults/roman"
git add .
git commit -m "chore: scheduled agents configured (nightly/weekly/monthly)"
```

(Empty commit OK if no file changes — the triggers live in Claude Code config, not the vault. Skip this commit if `git status` is clean.)

---

## Task 10: End-to-end smoke test

**Files:**
- Create (test-only): `~/Vaults/roman/simnetiq/wiki/smoke-test.md`

- [ ] **Step 1: Simulate "update the vault" request**

In a fresh Claude session, prompt:
```
Update the vault. We discussed: Simnetiq's brand tone should stay minimal — one-sentence post hooks, no emoji, no corporate speak. Log this as a decision.
```

Expected behavior: Claude creates `simnetiq/decisions/<DATE>-brand-tone.md` using the decision template, appends to `simnetiq/log.md`, updates `simnetiq/index.md`.

- [ ] **Step 2: Verify on disk**

Run:
```bash
ls "$HOME/Vaults/roman/simnetiq/decisions/"
tail -5 "$HOME/Vaults/roman/simnetiq/log.md"
cat "$HOME/Vaults/roman/simnetiq/decisions/"*brand-tone*.md
```

Expected: new file exists, log has appended entry, file contents match the decision template with frontmatter.

- [ ] **Step 3: Simulate "check the vault" read**

In a fresh Claude session, prompt:
```
What's Simnetiq's brand tone, per the vault?
```

Expected: Claude reads `simnetiq/index.md` or searches for brand tone, returns the content of the decision created in step 1. If Claude doesn't find it — check `~/.claude/CLAUDE.md` has the Obsidian pointer (Task 8 step 1).

- [ ] **Step 4: Clean up smoke-test file (optional)**

If the test decision was made up, delete it:
```bash
cd "$HOME/Vaults/roman"
git rm simnetiq/decisions/*brand-tone*.md
# Revert the log.md append manually by editing.
git commit -m "chore: remove smoke-test decision"
```

If the tone note is actually useful to keep: leave it, commit it with a real message.

- [ ] **Step 5: Push**

Run:
```bash
cd "$HOME/Vaults/roman"
git push
```

Expected: remote updated.

---

## Task 11: Open the vault in Obsidian + install recommended plugins

**Files:**
- Modifies: `~/Vaults/roman/.obsidian/` (created by Obsidian on first open; workspace files gitignored).

- [ ] **Step 1: Tell the user to open Obsidian**

Print:
> "Open Obsidian.app, click 'Open folder as vault', choose `~/Vaults/roman/`. Obsidian will initialize `.obsidian/` with defaults."

- [ ] **Step 2: Wait for user confirmation**

Pause; wait for user to say "done."

- [ ] **Step 3: Recommend plugins to install (manual, via Obsidian Settings → Community plugins)**

- **Dataview** — query frontmatter to build dynamic tables (e.g., list all active decisions).
- **Obsidian Web Clipper** — browser extension (not plugin) to clip articles into `raw/`.
- **Templater** — for template variable expansion (current date, wing inference).
- **Advanced Tables** — quality-of-life for markdown table editing.

Skip: Kanban (disabled by our overrides), Daily Notes (disabled).

- [ ] **Step 4: Verify Obsidian can read templates**

In Obsidian, open Settings → Templates → Template folder location → set to `_meta/templates`.

Expected: Obsidian picks up the 8 templates. User can invoke via `Cmd+T` on a new note.

- [ ] **Step 5: No commit** — `.obsidian/workspace*` is gitignored.

---

## Task 12: Phase 2 runbook (guided seed sessions)

**Files:**
- Create: `~/Vaults/roman/claude/workflows/phase-2-guided-seed.md`

- [ ] **Step 1: Write the runbook**

Create `$HOME/Vaults/roman/claude/workflows/phase-2-guided-seed.md`:
```markdown
---
title: Phase 2 — guided seed sessions
created: <DATE>
updated: <DATE>
wing: claude
type: workflow
status: active
---

# Phase 2 — guided seed

After scaffolding (Phase 1), the vault is empty. Phase 2 populates active wings via voice-friendly conversation between Roman and Claude.

## When
After Phase 1 is verified (Task 10 smoke test passed). One wing per session. 20–30 min each.

## Wings to seed initially
1. physics
2. simnetiq
3. doppler

(Skip creator-ai, shared, roman, claude until actively needed.)

## Per-wing script (Claude asks, Roman answers; Claude writes)

### 1. Identity (~5 min)
- "What's <wing>'s one-sentence premise?"
- "Who is the customer/user in one sentence?"
- "What does success look like in 6 months?"

→ Claude writes to `<wing>/wiki/premise.md`.

### 2. Brand voice (~5 min)
- "Describe the tone. What are three words for it?"
- "What's one thing the brand would NEVER say?"
- "Show me a good example post and a bad example."

→ Claude writes to `<wing>/brand/voice.md` using the brand-doc template.

### 3. People (~5 min)
- "Who matters most to this wing — partners, stakeholders, key customers?" (name, role, context, last contact)

→ Claude writes `<wing>/people/<first-last>.md` per person using the person template.

### 4. Current plans (~5 min)
- "What's the biggest thing you want to ship in the next quarter?"
- "What's blocking it?"
- "What decisions did you already make that we should log?"

→ Claude writes `<wing>/decisions/<slug>.md` per decision + `<wing>/wiki/plans-q<N>.md`.

### 5. Saved material backlog (~5 min)
- "Any articles, threads, screenshots, book notes you've been meaning to file?"
- Roman drops URLs / paths / text; Claude runs `/obsidian-ingest` per item.

→ Lands in `<wing>/raw/...` + `<wing>/wiki/...`

## Outputs per wing

After a seed session, each active wing should have:
- 1 premise page
- 1 brand voice page
- 2–5 people pages
- 1+ plans page + 1–3 decision pages
- Whatever backlog was ingested
- All linked from `<wing>/index.md`
- Log entries in `<wing>/log.md` for each write

Total: 15–30 real pages per wing.

## Iteration

If a wing feels under-seeded after its session, schedule another round in 1–2 weeks once it's been used a bit. Don't try to pre-populate everything.
```

- [ ] **Step 2: Commit runbook**

Run:
```bash
cd "$HOME/Vaults/roman"
git add claude/workflows/phase-2-guided-seed.md
git commit -m "docs(claude): phase 2 guided seed runbook"
git push
```

Expected: one commit pushed.

- [ ] **Step 3: Report to user**

Print summary:
> "Phase 1 complete. Vault ready at `~/Vaults/roman/`. Skill + MCP + triggers + global pointer + MemPalace drawer in place. Phase 2 runbook at `claude/workflows/phase-2-guided-seed.md`. When you're ready, say 'seed physics' (or simnetiq/doppler) to run a guided seed session."

---

## Self-review checklist (run after full plan executes)

- [ ] `~/Vaults/roman/` exists as a git repo.
- [ ] Remote `origin` points to `github.com/<user>/roman-vault` (private).
- [ ] `_meta/CLAUDE.md`, `SOUL.md`, `CRITICAL_FACTS.md`, `schema.md`, 8 templates all present.
- [ ] All 7 wings exist with correct subtree per wing type.
- [ ] Every wing has `index.md` + `log.md`.
- [ ] `git check-attr filter -- doppler/secrets/anything` returns `filter: git-crypt`.
- [ ] `~/.git-crypt-keys/roman-vault.key` exists AND user confirmed 1Password backup.
- [ ] `claude mcp list` shows `obsidian-vault` user-scoped.
- [ ] `obsidian-second-brain` skill commands available (`/obsidian-ingest` etc.).
- [ ] `~/.claude/CLAUDE.md` contains `## Obsidian Vault` block.
- [ ] MemPalace drawer `roman/references/obsidian_vault` returns on search.
- [ ] 3 triggers (nightly/weekly/monthly) listed in `CronList`.
- [ ] End-to-end smoke test passed (Task 10).
- [ ] Phase 2 runbook committed.

## Risks during execution

| Risk | Mitigation |
|---|---|
| `mcp-obsidian` npm package doesn't exist / different name | Step 6.1 has fallback list of alternate package names. Verify by running `claude mcp list` after add. |
| Skill `install.sh` wants to bootstrap a vault we already have | Step 7.2 has manual fallback: copy SKILL.md + commands/hooks directly. |
| User's `~/.claude/CLAUDE.md` has custom structure our insertion breaks | Use `Edit` with MemPalace section header as unique anchor; verify with `grep` after. |
| git-crypt key lost = encrypted secrets unrecoverable | Step 2.4 exports key; Step 5.3 hard-prompts user to back it up to 1Password before any sensitive content goes in. |
| GitHub repo creation fails due to gh version incompatibility | Step 5.1 has fallback for older gh. |
| Triggers need timezone-specific config | Cron uses system local time on Roman's Mac (Europe/Berlin); verify `date` output matches expected. |
| Plan touches files outside the physics repo's worktree | Plan is cross-cutting; explicitly not a single-repo implementation. Executor should not try to commit anything to the physics repo except this plan itself. |
