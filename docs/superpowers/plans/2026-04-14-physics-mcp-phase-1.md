# Physics MCP Server — Phase 1 (MVP) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a standalone stdio MCP server (`@physics-explained/mcp-server`) at `/Users/romanpochtman/Developer/physics-mcp/` that exposes 7 tools (`list_slugs`, `get_terminology`, `add_topic`, `add_dictionary_term`, `translate_article`, `translate_glossary`, `add_locale`) for authoring and translating content in the Physics.explained repo.

**Architecture:** Separate npm package outside the physics repo. Node 22+, TypeScript strict, `@modelcontextprotocol/sdk` stdio transport, `@anthropic-ai/sdk` for translation, `zod` for tool input validation, `ts-morph` for surgical edits to the TS data files (`branches.ts`, `glossary.ts`, `physicists.ts`), `vitest` for tests. All file writes go through an atomic `commitFiles()` helper that stages tmp files alongside targets then renames. Env configuration via `PHYSICS_REPO_PATH` and `ANTHROPIC_API_KEY`.

**Tech Stack:** TypeScript 5.x strict, Node 22, `@modelcontextprotocol/sdk`, `@anthropic-ai/sdk`, `zod`, `ts-morph`, `vitest`, `tsx` for dev-run.

---

## Decisions made beyond the spec

These are pragmatic defaults. Roman can reverse any of them.

1. **TS-file mutation strategy:** use `ts-morph` to parse and edit `branches.ts`, `glossary.ts`, `physicists.ts`. Rationale: regex-based mutation is fragile against quoted strings with commas / backticks / escaped chars in the prose fields; AST-based edits survive future formatting changes.
2. **Atomic multi-file writes:** stage as `<target>.tmp.<pid>` alongside targets, then `rename()` loop. If any staging write fails, unlink the staged files and throw before any rename runs. Documented limitation: the rename loop itself is non-atomic across files (< 1 ms window).
3. **Model defaults:** `claude-sonnet-4-6` for translation, max tokens 16000, temperature 0.
4. **`add_locale` scope for MVP:** translates articles + glossary only; copies `messages/<locale>/*.json` from `messages/en/*.json` verbatim (English strings). Chrome translation is deferred to v2's `translate_messages`. README documents this.
5. **`add_topic` / `add_dictionary_term` non-primary-locale handling:** for every existing locale other than `en`, the title/subtitle/eyebrow (topic) or term/definition (dictionary) are auto-translated via an inline Anthropic call using the same terminology table. Input takes English only; callers never supply bulk per-locale payloads for chrome strings.
6. **No npm publish in Phase 1.** Roman runs `npm link` from `/Users/romanpochtman/Developer/physics-mcp/` and links it into `~/.claude/mcp.json`. Publishing deferred to Phase 4.
7. **Terminology table seed:** `terminology/he.json` is generated at the end of the plan by a one-shot script that walks the existing Hebrew MDX + glossary JSON and extracts English→Hebrew slug-to-term pairs from `<Term slug>` attributes and `aside` arrays. It is then hand-reviewed and committed.
8. **MCP progress notifications:** only `add_locale` and `translate_glossary` send progress; `translate_article` is single-shot and reports duration in its response only.
9. **Anthropic SDK mocking in tests:** every test that touches translation uses a `vi.mock("@anthropic-ai/sdk")` stub. No live API calls in CI.
10. **Non-atomic article write is acceptable.** A single `translate_article` only writes one file, so `commitFiles` with a one-element op list is the same as a plain atomic rename.

---

## File structure (target repo)

```
physics-mcp/
├── .gitignore
├── .nvmrc                            # node 22
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── README.md
├── src/
│   ├── index.ts                       # MCP server entry + tool registry
│   ├── env.ts                         # reads + validates env vars
│   ├── tools/
│   │   ├── list-slugs.ts
│   │   ├── get-terminology.ts
│   │   ├── add-topic.ts
│   │   ├── add-dictionary-term.ts
│   │   ├── translate-article.ts
│   │   ├── translate-glossary.ts
│   │   └── add-locale.ts
│   └── lib/
│       ├── repo-paths.ts              # derives absolute paths from PHYSICS_REPO_PATH
│       ├── commit-files.ts            # atomic write helper
│       ├── translation-prompt.ts      # builds system prompt per target locale
│       ├── data-loaders.ts            # ts-morph parsers for branches / glossary / physicists
│       ├── jsx-validator.ts           # post-translation structural check
│       ├── anthropic-client.ts        # thin wrapper over the SDK (facilitates mocking)
│       └── mdx-skeleton.ts            # builds an MDX skeleton for a new topic
├── terminology/
│   └── he.json                        # seeded in Task 17
├── scripts/
│   └── seed-terminology.mjs           # one-shot HE seeder (Task 17)
└── tests/
    ├── fixtures/
    │   └── physics-repo/              # tiny physics repo stand-in
    ├── lib/
    │   ├── commit-files.test.ts
    │   ├── data-loaders.test.ts
    │   ├── jsx-validator.test.ts
    │   ├── translation-prompt.test.ts
    │   └── repo-paths.test.ts
    └── tools/
        ├── list-slugs.test.ts
        ├── get-terminology.test.ts
        ├── add-topic.test.ts
        ├── add-dictionary-term.test.ts
        ├── translate-article.test.ts
        ├── translate-glossary.test.ts
        └── add-locale.test.ts
```

---

## Task 1: Scaffold repo

**Files:**
- Create: `/Users/romanpochtman/Developer/physics-mcp/.gitignore`
- Create: `/Users/romanpochtman/Developer/physics-mcp/.nvmrc`
- Create: `/Users/romanpochtman/Developer/physics-mcp/package.json`
- Create: `/Users/romanpochtman/Developer/physics-mcp/tsconfig.json`
- Create: `/Users/romanpochtman/Developer/physics-mcp/vitest.config.ts`
- Create: `/Users/romanpochtman/Developer/physics-mcp/README.md` (stub)

- [ ] **Step 1: Create the directory and initialize git**

```bash
mkdir -p /Users/romanpochtman/Developer/physics-mcp
cd /Users/romanpochtman/Developer/physics-mcp
git init -b main
```

- [ ] **Step 2: Write `.gitignore`**

```
node_modules/
dist/
*.log
.env
.env.local
.DS_Store
coverage/
```

- [ ] **Step 3: Write `.nvmrc`**

```
22
```

- [ ] **Step 4: Write `package.json`**

```json
{
  "name": "@physics-explained/mcp-server",
  "version": "0.1.0",
  "description": "MCP server for authoring and translating Physics.explained content.",
  "type": "module",
  "bin": {
    "physics-mcp": "./dist/index.js"
  },
  "files": ["dist", "terminology", "README.md"],
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "dev": "tsx src/index.ts",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.27.0",
    "@modelcontextprotocol/sdk": "^1.0.0",
    "ts-morph": "^23.0.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "tsx": "^4.19.0",
    "typescript": "^5.6.0",
    "vitest": "^2.1.0"
  },
  "engines": {
    "node": ">=22"
  }
}
```

- [ ] **Step 5: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- [ ] **Step 6: Write `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globals: false,
  },
});
```

- [ ] **Step 7: Write `README.md` stub**

```markdown
# @physics-explained/mcp-server

MCP server for authoring and translating Physics.explained content.

See `/Users/romanpochtman/Developer/physics/docs/superpowers/specs/2026-04-14-physics-mcp-server-design.md` for the design doc.

## Install (local dev)

```bash
cd /Users/romanpochtman/Developer/physics-mcp
npm install
npm run build
npm link
```

## Environment

- `PHYSICS_REPO_PATH` — absolute path to the physics repo
- `ANTHROPIC_API_KEY` — used for translation calls
```

- [ ] **Step 8: Install dependencies**

```bash
cd /Users/romanpochtman/Developer/physics-mcp
npm install
```

Expected: `node_modules/` populated, no errors.

- [ ] **Step 9: Create empty `src/index.ts` to verify build**

`src/index.ts`:

```ts
// Placeholder. Replaced in Task 9.
export {};
```

- [ ] **Step 10: Verify tsc + vitest + dev commands work**

```bash
npm run typecheck
npm run test
```

Expected: typecheck passes; vitest reports "No test files found" (exit 0 once we add at least one test).

- [ ] **Step 11: Commit**

```bash
cd /Users/romanpochtman/Developer/physics-mcp
git add .
git commit -m "chore: scaffold physics-mcp with typescript strict, vitest, and mcp/anthropic sdks"
```

---

## Task 2: Env configuration (`env.ts`)

**Files:**
- Create: `src/env.ts`
- Test: `tests/lib/repo-paths.test.ts` (reused in Task 3; not this task)

- [ ] **Step 1: Write `src/env.ts`**

```ts
import { z } from "zod";

const EnvSchema = z.object({
  PHYSICS_REPO_PATH: z
    .string()
    .min(1, "PHYSICS_REPO_PATH must be set to the absolute path of the physics repo."),
  ANTHROPIC_API_KEY: z
    .string()
    .min(1, "ANTHROPIC_API_KEY must be set for translation calls."),
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = EnvSchema.safeParse(source);
  if (!parsed.success) {
    const lines = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`);
    throw new Error(`Invalid environment:\n${lines.join("\n")}`);
  }
  return parsed.data;
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: pass.

- [ ] **Step 3: Commit**

```bash
git add src/env.ts
git commit -m "feat(env): add zod-validated env loader (PHYSICS_REPO_PATH, ANTHROPIC_API_KEY)"
```

---

## Task 3: Repo paths helper (`repo-paths.ts`)

**Files:**
- Create: `src/lib/repo-paths.ts`
- Test: `tests/lib/repo-paths.test.ts`

- [ ] **Step 1: Write the failing test**

`tests/lib/repo-paths.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { createRepoPaths } from "../../src/lib/repo-paths.js";

describe("createRepoPaths", () => {
  const paths = createRepoPaths("/tmp/physics");

  it("returns absolute path to branches.ts", () => {
    expect(paths.branchesFile).toBe("/tmp/physics/lib/content/branches.ts");
  });

  it("returns absolute path to glossary.ts", () => {
    expect(paths.glossaryFile).toBe("/tmp/physics/lib/content/glossary.ts");
  });

  it("returns absolute path to physicists.ts", () => {
    expect(paths.physicistsFile).toBe("/tmp/physics/lib/content/physicists.ts");
  });

  it("returns absolute path to i18n config", () => {
    expect(paths.i18nConfigFile).toBe("/tmp/physics/i18n/config.ts");
  });

  it("returns messages dir for a locale", () => {
    expect(paths.messagesDir("en")).toBe("/tmp/physics/messages/en");
    expect(paths.messageFile("he", "glossary.json")).toBe("/tmp/physics/messages/he/glossary.json");
  });

  it("returns topic dir and content mdx path", () => {
    expect(paths.topicDir("classical-mechanics", "foo")).toBe(
      "/tmp/physics/app/[locale]/(topics)/classical-mechanics/foo",
    );
    expect(paths.topicPageTsx("classical-mechanics", "foo")).toBe(
      "/tmp/physics/app/[locale]/(topics)/classical-mechanics/foo/page.tsx",
    );
    expect(paths.topicContentMdx("classical-mechanics", "foo", "en")).toBe(
      "/tmp/physics/app/[locale]/(topics)/classical-mechanics/foo/content.en.mdx",
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm run test
```

Expected: FAIL — cannot resolve `../../src/lib/repo-paths.js`.

- [ ] **Step 3: Implement `src/lib/repo-paths.ts`**

```ts
import { join } from "node:path";

export interface RepoPaths {
  readonly root: string;
  readonly branchesFile: string;
  readonly glossaryFile: string;
  readonly physicistsFile: string;
  readonly i18nConfigFile: string;
  messagesDir(locale: string): string;
  messageFile(locale: string, file: string): string;
  topicDir(branch: string, slug: string): string;
  topicPageTsx(branch: string, slug: string): string;
  topicContentMdx(branch: string, slug: string, locale: string): string;
}

export function createRepoPaths(root: string): RepoPaths {
  const topicRoot = join(root, "app", "[locale]", "(topics)");
  return {
    root,
    branchesFile: join(root, "lib", "content", "branches.ts"),
    glossaryFile: join(root, "lib", "content", "glossary.ts"),
    physicistsFile: join(root, "lib", "content", "physicists.ts"),
    i18nConfigFile: join(root, "i18n", "config.ts"),
    messagesDir: (locale) => join(root, "messages", locale),
    messageFile: (locale, file) => join(root, "messages", locale, file),
    topicDir: (branch, slug) => join(topicRoot, branch, slug),
    topicPageTsx: (branch, slug) => join(topicRoot, branch, slug, "page.tsx"),
    topicContentMdx: (branch, slug, locale) =>
      join(topicRoot, branch, slug, `content.${locale}.mdx`),
  };
}
```

- [ ] **Step 4: Run tests and confirm pass**

```bash
npm run test
```

Expected: 6 passing.

- [ ] **Step 5: Commit**

```bash
git add src/lib/repo-paths.ts tests/lib/repo-paths.test.ts
git commit -m "feat(lib): add repo-paths helper resolving physics repo file paths"
```

---

## Task 4: Atomic commit-files helper (`commit-files.ts`)

**Files:**
- Create: `src/lib/commit-files.ts`
- Test: `tests/lib/commit-files.test.ts`

- [ ] **Step 1: Write the failing test**

`tests/lib/commit-files.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { mkdtemp, readFile, writeFile, mkdir, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { commitFiles } from "../../src/lib/commit-files.js";

async function makeTmpDir(): Promise<string> {
  return mkdtemp(join(tmpdir(), "commitfiles-test-"));
}

describe("commitFiles", () => {
  let root: string;

  beforeEach(async () => {
    root = await makeTmpDir();
  });

  it("writes multiple files atomically and returns the list of paths", async () => {
    const a = join(root, "a.txt");
    const b = join(root, "b.txt");
    const touched = await commitFiles([
      { path: a, content: "one" },
      { path: b, content: "two" },
    ]);
    expect(touched.sort()).toEqual([a, b].sort());
    expect(await readFile(a, "utf8")).toBe("one");
    expect(await readFile(b, "utf8")).toBe("two");
  });

  it("creates parent directories as needed", async () => {
    const target = join(root, "nested", "deep", "file.txt");
    await commitFiles([{ path: target, content: "hi" }]);
    expect(await readFile(target, "utf8")).toBe("hi");
  });

  it("leaves no .tmp leftovers after a successful write", async () => {
    const target = join(root, "only.txt");
    await commitFiles([{ path: target, content: "x" }]);
    await expect(stat(`${target}.tmp`)).rejects.toThrow();
  });

  it("does not mutate any target when a staging write fails", async () => {
    // Pre-create a real file we expect to remain untouched.
    const real = join(root, "existing.txt");
    await writeFile(real, "ORIGINAL");

    // Invalid path (directory does not exist AND we instruct not to create it by
    // passing an obviously bad path — using a null byte guarantees fs rejection).
    const bad = join(root, "bad\u0000name.txt");

    await expect(
      commitFiles([
        { path: real, content: "NEW" },
        { path: bad, content: "bad" },
      ]),
    ).rejects.toThrow();

    expect(await readFile(real, "utf8")).toBe("ORIGINAL");
    // Ensure no .tmp file was left next to the real target.
    await expect(stat(`${real}.tmp`)).rejects.toThrow();
  });

  it("overwrites existing files on success", async () => {
    const target = join(root, "x.txt");
    await writeFile(target, "OLD");
    await commitFiles([{ path: target, content: "NEW" }]);
    expect(await readFile(target, "utf8")).toBe("NEW");
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

```bash
npm run test
```

Expected: FAIL — cannot resolve `commit-files.js`.

- [ ] **Step 3: Implement `src/lib/commit-files.ts`**

```ts
import { mkdir, rename, unlink, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export interface FileOp {
  path: string;
  content: string;
}

/**
 * Atomic (best-effort) multi-file write.
 *
 * Strategy:
 *   1. Ensure parent dirs.
 *   2. Write every op to `<path>.tmp.<pid>`. If any write throws, unlink every
 *      staged tmp and rethrow — no target has been touched.
 *   3. Rename each tmp into place. rename() is atomic per-file; the rename
 *      loop is not cross-file atomic, but the failure window is sub-ms and
 *      callers can detect partial state by listing the target directory.
 */
export async function commitFiles(ops: readonly FileOp[]): Promise<string[]> {
  const staged: { tmp: string; target: string }[] = [];
  try {
    for (const op of ops) {
      await mkdir(dirname(op.path), { recursive: true });
      const tmp = `${op.path}.tmp.${process.pid}`;
      await writeFile(tmp, op.content);
      staged.push({ tmp, target: op.path });
    }
  } catch (err) {
    for (const { tmp } of staged) {
      await unlink(tmp).catch(() => {});
    }
    throw err;
  }

  for (const { tmp, target } of staged) {
    await rename(tmp, target);
  }
  return staged.map((s) => s.target);
}
```

- [ ] **Step 4: Run tests and confirm pass**

```bash
npm run test
```

Expected: 5 passing for commit-files; prior tests still pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/commit-files.ts tests/lib/commit-files.test.ts
git commit -m "feat(lib): add atomic commit-files helper with staged-rename strategy"
```

---

## Task 5: Data loaders (`data-loaders.ts`)

**Purpose:** read slugs and structural info from the physics repo's TS data files without importing them (which would require the whole Next.js toolchain). Uses `ts-morph` to parse the source file and walk the object-literal array.

**Files:**
- Create: `src/lib/data-loaders.ts`
- Create: `tests/fixtures/physics-repo/lib/content/branches.ts`
- Create: `tests/fixtures/physics-repo/lib/content/glossary.ts`
- Create: `tests/fixtures/physics-repo/lib/content/physicists.ts`
- Create: `tests/fixtures/physics-repo/i18n/config.ts`
- Test: `tests/lib/data-loaders.test.ts`

- [ ] **Step 1: Create fixture TS files mirroring the real shape**

`tests/fixtures/physics-repo/lib/content/branches.ts`:

```ts
export const BRANCHES = [
  {
    slug: "classical-mechanics",
    index: 1,
    title: "CLASSICAL MECHANICS",
    topics: [
      { slug: "the-simple-pendulum", title: "THE SIMPLE PENDULUM", module: "oscillations" },
      { slug: "kepler", title: "THE LAWS OF PLANETS", module: "orbital-mechanics" },
    ],
  },
  {
    slug: "electromagnetism",
    index: 2,
    title: "ELECTROMAGNETISM",
    topics: [],
  },
] as const;
```

`tests/fixtures/physics-repo/lib/content/glossary.ts`:

```ts
export const GLOSSARY = [
  { slug: "pendulum-clock", term: "pendulum clock", category: "instrument" },
  { slug: "isochronism", term: "isochronism", category: "concept" },
] as const;
```

`tests/fixtures/physics-repo/lib/content/physicists.ts`:

```ts
export const PHYSICISTS = [
  { slug: "galileo-galilei", name: "Galileo Galilei" },
  { slug: "isaac-newton", name: "Isaac Newton" },
] as const;
```

`tests/fixtures/physics-repo/i18n/config.ts`:

```ts
export const locales = ["en", "he"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
export const rtlLocales = ["he"] as const satisfies readonly Locale[];
```

- [ ] **Step 2: Write the failing test**

`tests/lib/data-loaders.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { resolve } from "node:path";
import { loadBranches, loadGlossary, loadPhysicists, loadLocales } from "../../src/lib/data-loaders.js";

const FIXTURE = resolve(__dirname, "../fixtures/physics-repo");

describe("data-loaders", () => {
  it("loadBranches reads branch slugs and their topics", () => {
    const branches = loadBranches(`${FIXTURE}/lib/content/branches.ts`);
    expect(branches.map((b) => b.slug)).toEqual(["classical-mechanics", "electromagnetism"]);
    const cm = branches.find((b) => b.slug === "classical-mechanics")!;
    expect(cm.topics.map((t) => t.slug)).toEqual(["the-simple-pendulum", "kepler"]);
  });

  it("loadGlossary returns every term slug", () => {
    const terms = loadGlossary(`${FIXTURE}/lib/content/glossary.ts`);
    expect(terms.map((t) => t.slug)).toEqual(["pendulum-clock", "isochronism"]);
  });

  it("loadPhysicists returns every physicist slug", () => {
    const people = loadPhysicists(`${FIXTURE}/lib/content/physicists.ts`);
    expect(people.map((p) => p.slug)).toEqual(["galileo-galilei", "isaac-newton"]);
  });

  it("loadLocales returns locale codes and rtl codes", () => {
    const result = loadLocales(`${FIXTURE}/i18n/config.ts`);
    expect(result.locales).toEqual(["en", "he"]);
    expect(result.rtlLocales).toEqual(["he"]);
    expect(result.defaultLocale).toBe("en");
  });
});
```

- [ ] **Step 3: Run the test and verify it fails**

```bash
npm run test
```

Expected: FAIL — cannot resolve `data-loaders.js`.

- [ ] **Step 4: Implement `src/lib/data-loaders.ts`**

```ts
import { Project, SyntaxKind, type ObjectLiteralExpression, type ArrayLiteralExpression, type VariableStatement } from "ts-morph";

interface BranchSummary {
  slug: string;
  title?: string;
  topics: readonly { slug: string; title?: string; module?: string }[];
}

interface TermSummary {
  slug: string;
  term: string;
  category?: string;
}

interface PhysicistSummary {
  slug: string;
  name: string;
}

interface LocaleSummary {
  locales: readonly string[];
  rtlLocales: readonly string[];
  defaultLocale: string;
}

function readStringProp(obj: ObjectLiteralExpression, name: string): string | undefined {
  const prop = obj.getProperty(name);
  if (!prop) return undefined;
  const init = prop.asKindOrThrow(SyntaxKind.PropertyAssignment).getInitializerIfKind(SyntaxKind.StringLiteral);
  return init?.getLiteralText();
}

function readArrayProp(obj: ObjectLiteralExpression, name: string): ArrayLiteralExpression | undefined {
  const prop = obj.getProperty(name);
  if (!prop) return undefined;
  return prop.asKindOrThrow(SyntaxKind.PropertyAssignment).getInitializerIfKind(SyntaxKind.ArrayLiteralExpression);
}

function findExportedArrayLiteral(project: Project, filePath: string, exportName: string): ArrayLiteralExpression {
  const file = project.addSourceFileAtPath(filePath);
  const decl = file
    .getVariableStatements()
    .find((s: VariableStatement) => s.getDeclarations().some((d) => d.getName() === exportName));
  if (!decl) throw new Error(`${filePath}: expected exported const ${exportName}`);
  const init = decl.getDeclarations().find((d) => d.getName() === exportName)!.getInitializer();
  if (!init) throw new Error(`${filePath}: ${exportName} has no initializer`);
  // Allow `as const` casts: unwrap AsExpression.
  const unwrapped = init.isKind(SyntaxKind.AsExpression) ? init.getExpression() : init;
  if (!unwrapped.isKind(SyntaxKind.ArrayLiteralExpression)) {
    throw new Error(`${filePath}: ${exportName} must be an array literal`);
  }
  return unwrapped.asKindOrThrow(SyntaxKind.ArrayLiteralExpression);
}

function makeProject(): Project {
  return new Project({ useInMemoryFileSystem: false, skipAddingFilesFromTsConfig: true });
}

export function loadBranches(filePath: string): BranchSummary[] {
  const array = findExportedArrayLiteral(makeProject(), filePath, "BRANCHES");
  return array.getElements().map((el) => {
    const obj = el.asKindOrThrow(SyntaxKind.ObjectLiteralExpression);
    const slug = readStringProp(obj, "slug") ?? "";
    const title = readStringProp(obj, "title");
    const topicsArr = readArrayProp(obj, "topics");
    const topics =
      topicsArr?.getElements().map((t) => {
        const to = t.asKindOrThrow(SyntaxKind.ObjectLiteralExpression);
        return {
          slug: readStringProp(to, "slug") ?? "",
          title: readStringProp(to, "title"),
          module: readStringProp(to, "module"),
        };
      }) ?? [];
    return { slug, title, topics };
  });
}

export function loadGlossary(filePath: string): TermSummary[] {
  const array = findExportedArrayLiteral(makeProject(), filePath, "GLOSSARY");
  return array.getElements().map((el) => {
    const obj = el.asKindOrThrow(SyntaxKind.ObjectLiteralExpression);
    return {
      slug: readStringProp(obj, "slug") ?? "",
      term: readStringProp(obj, "term") ?? "",
      category: readStringProp(obj, "category"),
    };
  });
}

export function loadPhysicists(filePath: string): PhysicistSummary[] {
  const array = findExportedArrayLiteral(makeProject(), filePath, "PHYSICISTS");
  return array.getElements().map((el) => {
    const obj = el.asKindOrThrow(SyntaxKind.ObjectLiteralExpression);
    return {
      slug: readStringProp(obj, "slug") ?? "",
      name: readStringProp(obj, "name") ?? "",
    };
  });
}

export function loadLocales(filePath: string): LocaleSummary {
  const project = makeProject();
  const file = project.addSourceFileAtPath(filePath);
  const readStringArray = (name: string): string[] => {
    const decl = file.getVariableStatements().find((s) => s.getDeclarations().some((d) => d.getName() === name));
    if (!decl) return [];
    const init = decl.getDeclarations().find((d) => d.getName() === name)!.getInitializer();
    if (!init) return [];
    const unwrapped = init.isKind(SyntaxKind.AsExpression) ? init.getExpression() : init;
    if (!unwrapped.isKind(SyntaxKind.ArrayLiteralExpression)) return [];
    return unwrapped
      .asKindOrThrow(SyntaxKind.ArrayLiteralExpression)
      .getElements()
      .map((e) => e.asKindOrThrow(SyntaxKind.StringLiteral).getLiteralText());
  };
  const readString = (name: string): string => {
    const decl = file.getVariableStatements().find((s) => s.getDeclarations().some((d) => d.getName() === name));
    const init = decl?.getDeclarations().find((d) => d.getName() === name)?.getInitializer();
    if (!init) return "";
    return init.asKindOrThrow(SyntaxKind.StringLiteral).getLiteralText();
  };
  return {
    locales: readStringArray("locales"),
    rtlLocales: readStringArray("rtlLocales"),
    defaultLocale: readString("defaultLocale"),
  };
}
```

- [ ] **Step 5: Run tests and confirm pass**

```bash
npm run test
```

Expected: 4 passing for data-loaders; prior tests still pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/data-loaders.ts tests/lib/data-loaders.test.ts tests/fixtures
git commit -m "feat(lib): add ts-morph data loaders for branches, glossary, physicists, locales"
```

---

## Task 6: JSX validator (`jsx-validator.ts`)

**Purpose:** after a translation, verify that every JSX tag in the source appears in the output with identical `slug=`, `href=`, `type=` prop values, and that the import block line-count matches. This is a lightweight regex check; cheaper and more predictable than a full parse.

**Files:**
- Create: `src/lib/jsx-validator.ts`
- Test: `tests/lib/jsx-validator.test.ts`

- [ ] **Step 1: Write the failing test**

`tests/lib/jsx-validator.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { validateTranslationStructure } from "../../src/lib/jsx-validator.js";

const SOURCE = `import { Foo } from "@/foo";
import { Bar } from "@/bar";

<Foo slug="a" />
<Bar href="/x/y" type="term" />
<Term slug="isochronism">isochronism</Term>
`;

describe("validateTranslationStructure", () => {
  it("accepts a valid translation with identical structural props", () => {
    const translated = `import { Foo } from "@/foo";
import { Bar } from "@/bar";

<Foo slug="a" />
<Bar href="/x/y" type="term" />
<Term slug="isochronism">איזוכרוניזם</Term>
`;
    const r = validateTranslationStructure(SOURCE, translated);
    expect(r.ok).toBe(true);
  });

  it("rejects when a slug was mutated", () => {
    const translated = `import { Foo } from "@/foo";
import { Bar } from "@/bar";

<Foo slug="b" />
<Bar href="/x/y" type="term" />
<Term slug="isochronism">איזוכרוניזם</Term>
`;
    const r = validateTranslationStructure(SOURCE, translated);
    expect(r.ok).toBe(false);
    expect(r.errors.join("\n")).toMatch(/slug/);
  });

  it("rejects when import count changes", () => {
    const translated = `import { Foo } from "@/foo";

<Foo slug="a" />
<Bar href="/x/y" type="term" />
<Term slug="isochronism">איזוכרוניזם</Term>
`;
    const r = validateTranslationStructure(SOURCE, translated);
    expect(r.ok).toBe(false);
    expect(r.errors.join("\n")).toMatch(/import/);
  });

  it("rejects when a JSX tag count changes", () => {
    const translated = `import { Foo } from "@/foo";
import { Bar } from "@/bar";

<Foo slug="a" />
<Bar href="/x/y" type="term" />
`;
    const r = validateTranslationStructure(SOURCE, translated);
    expect(r.ok).toBe(false);
    expect(r.errors.join("\n")).toMatch(/Term/);
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

```bash
npm run test
```

Expected: FAIL — cannot resolve `jsx-validator.js`.

- [ ] **Step 3: Implement `src/lib/jsx-validator.ts`**

```ts
export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

const IMPORT_RE = /^import\b/gm;
const TAG_RE = /<([A-Z][A-Za-z0-9]*)\b/g;
const STRUCTURAL_PROP_RE = /\b(slug|href|type)="([^"]*)"/g;

function countMatches(re: RegExp, s: string): number {
  return Array.from(s.matchAll(re)).length;
}

function tagCounts(src: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const m of src.matchAll(TAG_RE)) {
    const name = m[1]!;
    out[name] = (out[name] ?? 0) + 1;
  }
  return out;
}

function propBag(src: string): string[] {
  return Array.from(src.matchAll(STRUCTURAL_PROP_RE))
    .map((m) => `${m[1]}=${m[2]}`)
    .sort();
}

export function validateTranslationStructure(source: string, translated: string): ValidationResult {
  const errors: string[] = [];

  const srcImports = countMatches(IMPORT_RE, source);
  const dstImports = countMatches(IMPORT_RE, translated);
  if (srcImports !== dstImports) {
    errors.push(`import line count differs (source=${srcImports}, translated=${dstImports})`);
  }

  const srcTags = tagCounts(source);
  const dstTags = tagCounts(translated);
  for (const name of Object.keys(srcTags)) {
    if ((dstTags[name] ?? 0) !== srcTags[name]) {
      errors.push(`tag <${name}> count differs (source=${srcTags[name]}, translated=${dstTags[name] ?? 0})`);
    }
  }
  for (const name of Object.keys(dstTags)) {
    if (!(name in srcTags)) {
      errors.push(`tag <${name}> appears only in translation`);
    }
  }

  const srcProps = propBag(source);
  const dstProps = propBag(translated);
  if (srcProps.length !== dstProps.length || srcProps.some((p, i) => p !== dstProps[i])) {
    const only = (a: string[], b: string[]) => a.filter((x) => !b.includes(x));
    const missing = only(srcProps, dstProps);
    const extra = only(dstProps, srcProps);
    if (missing.length) errors.push(`missing structural props: ${missing.join(", ")}`);
    if (extra.length) errors.push(`unexpected structural props: ${extra.join(", ")}`);
  }

  return { ok: errors.length === 0, errors };
}
```

- [ ] **Step 4: Run tests and confirm pass**

```bash
npm run test
```

Expected: 4 passing for jsx-validator.

- [ ] **Step 5: Commit**

```bash
git add src/lib/jsx-validator.ts tests/lib/jsx-validator.test.ts
git commit -m "feat(lib): add jsx structural validator for translated mdx output"
```

---

## Task 7: Translation prompt builder (`translation-prompt.ts`)

**Purpose:** given a target locale and the source text, build the system/user message pair that the Anthropic call will send. Terminology comes from `terminology/<locale>.json`.

**Files:**
- Create: `src/lib/translation-prompt.ts`
- Create: `terminology/he.json` (minimal seed; full seed in Task 17)
- Test: `tests/lib/translation-prompt.test.ts`

- [ ] **Step 1: Write a minimal seed terminology file**

`terminology/he.json`:

```json
{
  "direction": "rtl",
  "label": "עברית",
  "terms": {
    "pendulum": "מטוטלת",
    "isochronism": "איזוכרוניזם",
    "restoring force": "כוח משחזר",
    "classical mechanics": "מכניקה קלאסית"
  }
}
```

- [ ] **Step 2: Write the failing test**

`tests/lib/translation-prompt.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { resolve } from "node:path";
import { buildTranslationPrompt } from "../../src/lib/translation-prompt.js";

const TERM_DIR = resolve(__dirname, "../../terminology");

describe("buildTranslationPrompt", () => {
  it("builds a system prompt that includes the house terminology", () => {
    const { system, user } = buildTranslationPrompt({
      terminologyDir: TERM_DIR,
      targetLocale: "he",
      kind: "article",
      source: "Hello <Term slug=\"isochronism\">isochronism</Term>.",
    });
    expect(system).toMatch(/Hebrew/);
    expect(system).toMatch(/איזוכרוניזם/);
    expect(user).toContain("Hello <Term");
  });

  it("explains structural invariants (JSX, slugs, hrefs)", () => {
    const { system } = buildTranslationPrompt({
      terminologyDir: TERM_DIR,
      targetLocale: "he",
      kind: "article",
      source: "",
    });
    expect(system).toMatch(/slug=/);
    expect(system).toMatch(/href=/);
    expect(system).toMatch(/import /);
  });

  it("throws a clear error if terminology file is missing", () => {
    expect(() =>
      buildTranslationPrompt({
        terminologyDir: TERM_DIR,
        targetLocale: "zz",
        kind: "article",
        source: "",
      }),
    ).toThrow(/terminology.*zz/);
  });
});
```

- [ ] **Step 3: Run the test and verify it fails**

```bash
npm run test
```

Expected: FAIL — cannot resolve `translation-prompt.js`.

- [ ] **Step 4: Implement `src/lib/translation-prompt.ts`**

```ts
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export interface TerminologyFile {
  direction: "ltr" | "rtl";
  label: string;
  terms: Record<string, string>;
}

export type TranslationKind = "article" | "glossary-entry" | "chrome";

export interface BuildPromptInput {
  terminologyDir: string;
  targetLocale: string;
  kind: TranslationKind;
  source: string;
}

export interface BuiltPrompt {
  system: string;
  user: string;
}

const LOCALE_NAMES: Record<string, string> = {
  he: "Hebrew",
  ru: "Russian",
  de: "German",
  es: "Spanish",
  fr: "French",
};

export function loadTerminology(dir: string, locale: string): TerminologyFile {
  const path = join(dir, `${locale}.json`);
  if (!existsSync(path)) {
    throw new Error(`terminology file not found for locale "${locale}" at ${path}`);
  }
  return JSON.parse(readFileSync(path, "utf8")) as TerminologyFile;
}

export function buildTranslationPrompt(input: BuildPromptInput): BuiltPrompt {
  const term = loadTerminology(input.terminologyDir, input.targetLocale);
  const languageName = LOCALE_NAMES[input.targetLocale] ?? input.targetLocale;
  const termLines = Object.entries(term.terms)
    .map(([en, local]) => `  ${en} → ${local}`)
    .join("\n");

  const kindGuidance =
    input.kind === "article"
      ? [
          "This is an MDX article. It contains TypeScript-style imports, React JSX tags, and KaTeX/math strings.",
          "You MUST preserve all imports character-for-character.",
          "You MUST preserve every JSX tag and self-closing tag count.",
          "You MUST NOT change any slug=, href=, type=, id=, or className= prop value.",
          "Translate visible text only. Do NOT translate slugs, route paths, or identifier-like strings.",
        ].join(" ")
      : input.kind === "glossary-entry"
        ? "This is a glossary entry. Translate term, shortDefinition, description, and history fields. Leave slug/category untouched."
        : "This is a chrome string (navigation, button labels). Keep {placeholder} tokens identical.";

  const system = [
    `You are a professional ${languageName} physics translator for a popular-science website.`,
    `Follow the house style: clear, conversational, no academic stiffness. Keep paragraph breaks.`,
    kindGuidance,
    "",
    "House terminology (always use these equivalents):",
    termLines || "  (none yet)",
    "",
    "Respond with ONLY the translated content. No prefaces, no explanations, no code fences.",
  ].join("\n");

  const user = input.source;

  return { system, user };
}
```

- [ ] **Step 5: Run tests and confirm pass**

```bash
npm run test
```

Expected: 3 passing for translation-prompt.

- [ ] **Step 6: Commit**

```bash
git add src/lib/translation-prompt.ts tests/lib/translation-prompt.test.ts terminology/he.json
git commit -m "feat(lib): add translation prompt builder with per-locale terminology tables"
```

---

## Task 8: Anthropic client wrapper (`anthropic-client.ts`)

**Purpose:** expose a single `translate(input)` function that tests can mock. Avoids leaking the SDK everywhere.

**Files:**
- Create: `src/lib/anthropic-client.ts`

- [ ] **Step 1: Implement `src/lib/anthropic-client.ts`**

```ts
import Anthropic from "@anthropic-ai/sdk";

export interface TranslateCallInput {
  apiKey: string;
  model?: string;
  system: string;
  user: string;
  maxTokens?: number;
}

export interface TranslateCallResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
}

const DEFAULT_MODEL = "claude-sonnet-4-6";
const DEFAULT_MAX_TOKENS = 16000;

export async function callTranslate(input: TranslateCallInput): Promise<TranslateCallResult> {
  const client = new Anthropic({ apiKey: input.apiKey });
  const response = await client.messages.create({
    model: input.model ?? DEFAULT_MODEL,
    max_tokens: input.maxTokens ?? DEFAULT_MAX_TOKENS,
    temperature: 0,
    system: input.system,
    messages: [{ role: "user", content: input.user }],
  });
  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Anthropic response contained no text block");
  }
  return {
    text: textBlock.text,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: pass.

- [ ] **Step 3: Commit**

```bash
git add src/lib/anthropic-client.ts
git commit -m "feat(lib): add anthropic client wrapper for translate calls"
```

---

## Task 9: MCP server entry (`src/index.ts`)

**Purpose:** bootstrap the stdio MCP server. Register seven tools by name; each tool handler is a separate module. This task only wires the plumbing — handlers return a stub error until filled in (Tasks 10–16).

**Files:**
- Modify: `src/index.ts` (replace placeholder)

- [ ] **Step 1: Replace `src/index.ts`**

```ts
#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { loadEnv } from "./env.js";
import { createRepoPaths } from "./lib/repo-paths.js";

import { listSlugsTool } from "./tools/list-slugs.js";
import { getTerminologyTool } from "./tools/get-terminology.js";
import { addTopicTool } from "./tools/add-topic.js";
import { addDictionaryTermTool } from "./tools/add-dictionary-term.js";
import { translateArticleTool } from "./tools/translate-article.js";
import { translateGlossaryTool } from "./tools/translate-glossary.js";
import { addLocaleTool } from "./tools/add-locale.js";

import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TERMINOLOGY_DIR = resolve(__dirname, "..", "terminology");

export interface ToolContext {
  repoPaths: ReturnType<typeof createRepoPaths>;
  terminologyDir: string;
  anthropicApiKey: string;
}

const TOOLS = [
  listSlugsTool,
  getTerminologyTool,
  addTopicTool,
  addDictionaryTermTool,
  translateArticleTool,
  translateGlossaryTool,
  addLocaleTool,
];

async function main(): Promise<void> {
  const env = loadEnv();
  const ctx: ToolContext = {
    repoPaths: createRepoPaths(env.PHYSICS_REPO_PATH),
    terminologyDir: TERMINOLOGY_DIR,
    anthropicApiKey: env.ANTHROPIC_API_KEY,
  };

  const server = new Server(
    { name: "physics-mcp", version: "0.1.0" },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputJsonSchema,
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (req, extra) => {
    const tool = TOOLS.find((t) => t.name === req.params.name);
    if (!tool) throw new Error(`Unknown tool: ${req.params.name}`);
    const result = await tool.handle(req.params.arguments ?? {}, ctx, extra);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  // Fail loudly with full stack on stderr; MCP stdout is reserved for JSON-RPC.
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Create the tool module shape file that each tool will conform to**

Create `src/tools/tool.ts`:

```ts
import type { z } from "zod";
import type { ToolContext } from "../index.js";

export interface Tool<Input> {
  name: string;
  description: string;
  inputSchema: z.ZodType<Input>;
  inputJsonSchema: Record<string, unknown>;
  handle(args: unknown, ctx: ToolContext, extra?: unknown): Promise<unknown>;
}
```

- [ ] **Step 3: Create stub handler modules so the server entry typechecks**

For each of the 7 tool files (`list-slugs.ts`, `get-terminology.ts`, `add-topic.ts`, `add-dictionary-term.ts`, `translate-article.ts`, `translate-glossary.ts`, `add-locale.ts`), create a minimal stub that throws `NOT_IMPLEMENTED`. The tasks below replace each stub in turn.

Write the same skeleton into every file, substituting the tool name. Example for `src/tools/list-slugs.ts`:

```ts
import { z } from "zod";
import type { Tool } from "./tool.js";

const Input = z.object({ kind: z.enum(["term", "physicist", "topic", "branch", "locale"]) });

export const listSlugsTool: Tool<z.infer<typeof Input>> = {
  name: "list_slugs",
  description: "STUB — not yet implemented",
  inputSchema: Input,
  inputJsonSchema: {
    type: "object",
    properties: { kind: { type: "string", enum: ["term", "physicist", "topic", "branch", "locale"] } },
    required: ["kind"],
  },
  async handle() {
    throw new Error("list_slugs not implemented yet");
  },
};
```

Repeat with tool-appropriate placeholder schemas for the other six files:
- `get-terminology.ts`: `{ en: string, locale?: string }` — throws.
- `add-topic.ts`: `z.object({}).passthrough()` — throws.
- `add-dictionary-term.ts`: `z.object({}).passthrough()` — throws.
- `translate-article.ts`: `z.object({ slug: z.string(), fromLocale: z.string(), toLocale: z.string() })` — throws.
- `translate-glossary.ts`: `z.object({ toLocale: z.string(), slugs: z.array(z.string()).optional() })` — throws.
- `add-locale.ts`: `z.object({ code: z.string(), dir: z.enum(["ltr", "rtl"]), label: z.string() })` — throws.

- [ ] **Step 4: Typecheck and build**

```bash
npm run typecheck
npm run build
```

Expected: both pass. Running `node dist/index.js` with `PHYSICS_REPO_PATH=/tmp/x ANTHROPIC_API_KEY=test` in env should print nothing (stdio server holds the connection open; `Ctrl+C` to exit).

- [ ] **Step 5: Commit**

```bash
git add src/index.ts src/tools
git commit -m "feat(server): wire stdio mcp server with 7 tool stubs and tool registry"
```

---

## Task 10: Tool — `list_slugs`

**Purpose:** cheap data-access replacing full file reads. Returns string array for `kind ∈ {term, physicist, topic, branch, locale}`.

**Files:**
- Modify: `src/tools/list-slugs.ts`
- Test: `tests/tools/list-slugs.test.ts`

- [ ] **Step 1: Write the failing test**

`tests/tools/list-slugs.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { resolve } from "node:path";
import { listSlugsTool } from "../../src/tools/list-slugs.js";
import { createRepoPaths } from "../../src/lib/repo-paths.js";

const FIXTURE = resolve(__dirname, "../fixtures/physics-repo");
const ctx = {
  repoPaths: createRepoPaths(FIXTURE),
  terminologyDir: resolve(__dirname, "../../terminology"),
  anthropicApiKey: "test-key",
};

describe("list_slugs", () => {
  it("returns branch slugs", async () => {
    const result = await listSlugsTool.handle({ kind: "branch" }, ctx);
    expect(result).toEqual(["classical-mechanics", "electromagnetism"]);
  });

  it("returns topic slugs in '<branch>/<topic>' form", async () => {
    const result = await listSlugsTool.handle({ kind: "topic" }, ctx);
    expect(result).toContain("classical-mechanics/the-simple-pendulum");
    expect(result).toContain("classical-mechanics/kepler");
  });

  it("returns term slugs", async () => {
    const result = await listSlugsTool.handle({ kind: "term" }, ctx);
    expect(result).toEqual(["pendulum-clock", "isochronism"]);
  });

  it("returns physicist slugs", async () => {
    const result = await listSlugsTool.handle({ kind: "physicist" }, ctx);
    expect(result).toEqual(["galileo-galilei", "isaac-newton"]);
  });

  it("returns locale codes", async () => {
    const result = await listSlugsTool.handle({ kind: "locale" }, ctx);
    expect(result).toEqual(["en", "he"]);
  });

  it("rejects invalid kinds", async () => {
    await expect(listSlugsTool.handle({ kind: "nonsense" }, ctx)).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run tests — expect failure**

```bash
npm run test
```

Expected: FAIL with `not implemented yet`.

- [ ] **Step 3: Implement `src/tools/list-slugs.ts`**

```ts
import { z } from "zod";
import type { Tool } from "./tool.js";
import {
  loadBranches,
  loadGlossary,
  loadPhysicists,
  loadLocales,
} from "../lib/data-loaders.js";

const Input = z.object({
  kind: z.enum(["term", "physicist", "topic", "branch", "locale"]),
});
type InputT = z.infer<typeof Input>;

export const listSlugsTool: Tool<InputT> = {
  name: "list_slugs",
  description:
    "Returns string[] of slugs/codes for the given kind. kind ∈ {term, physicist, topic, branch, locale}. Topic slugs are '<branch>/<topic>'.",
  inputSchema: Input,
  inputJsonSchema: {
    type: "object",
    properties: { kind: { type: "string", enum: ["term", "physicist", "topic", "branch", "locale"] } },
    required: ["kind"],
  },
  async handle(args, ctx) {
    const { kind } = Input.parse(args);
    const p = ctx.repoPaths;
    switch (kind) {
      case "branch":
        return loadBranches(p.branchesFile).map((b) => b.slug);
      case "topic": {
        const out: string[] = [];
        for (const b of loadBranches(p.branchesFile)) {
          for (const t of b.topics) out.push(`${b.slug}/${t.slug}`);
        }
        return out;
      }
      case "term":
        return loadGlossary(p.glossaryFile).map((t) => t.slug);
      case "physicist":
        return loadPhysicists(p.physicistsFile).map((p2) => p2.slug);
      case "locale":
        return loadLocales(p.i18nConfigFile).locales;
    }
  },
};
```

- [ ] **Step 4: Run tests and confirm pass**

```bash
npm run test
```

Expected: 6 passing for list_slugs.

- [ ] **Step 5: Commit**

```bash
git add src/tools/list-slugs.ts tests/tools/list-slugs.test.ts
git commit -m "feat(tools): implement list_slugs for branch/topic/term/physicist/locale"
```

---

## Task 11: Tool — `get_terminology`

**Purpose:** look up a house-style translation for an English physics term. Backed by `terminology/<locale>.json`.

**Files:**
- Modify: `src/tools/get-terminology.ts`
- Test: `tests/tools/get-terminology.test.ts`

- [ ] **Step 1: Write the failing test**

`tests/tools/get-terminology.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { resolve } from "node:path";
import { getTerminologyTool } from "../../src/tools/get-terminology.js";
import { createRepoPaths } from "../../src/lib/repo-paths.js";

const FIXTURE = resolve(__dirname, "../fixtures/physics-repo");
const TERM_DIR = resolve(__dirname, "../../terminology");
const ctx = { repoPaths: createRepoPaths(FIXTURE), terminologyDir: TERM_DIR, anthropicApiKey: "test-key" };

describe("get_terminology", () => {
  it("returns every locale mapping for an English term when no locale is given", async () => {
    const result = await getTerminologyTool.handle({ en: "isochronism" }, ctx);
    expect(result).toHaveProperty("he", "איזוכרוניזם");
  });

  it("returns a single string when locale is given", async () => {
    const result = await getTerminologyTool.handle({ en: "isochronism", locale: "he" }, ctx);
    expect(result).toBe("איזוכרוניזם");
  });

  it("returns null fields for locales that don't yet have the term", async () => {
    const result = (await getTerminologyTool.handle({ en: "bogus-term" }, ctx)) as Record<string, string | null>;
    expect(result.he).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests — expect failure**

```bash
npm run test
```

Expected: FAIL.

- [ ] **Step 3: Implement `src/tools/get-terminology.ts`**

```ts
import { readdirSync } from "node:fs";
import { z } from "zod";
import type { Tool } from "./tool.js";
import { loadTerminology } from "../lib/translation-prompt.js";

const Input = z.object({
  en: z.string().min(1),
  locale: z.string().optional(),
});
type InputT = z.infer<typeof Input>;

function listTerminologyLocales(dir: string): string[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""));
}

export const getTerminologyTool: Tool<InputT> = {
  name: "get_terminology",
  description:
    "Look up the house-style translation of an English physics term. Returns a { [locale]: string | null } map, or a single string if locale is specified.",
  inputSchema: Input,
  inputJsonSchema: {
    type: "object",
    properties: {
      en: { type: "string", description: "English term (lowercase form, e.g. 'isochronism')" },
      locale: { type: "string", description: "Optional — if set, returns a single string" },
    },
    required: ["en"],
  },
  async handle(args, ctx) {
    const { en, locale } = Input.parse(args);
    if (locale) {
      const t = loadTerminology(ctx.terminologyDir, locale);
      return t.terms[en] ?? null;
    }
    const out: Record<string, string | null> = {};
    for (const loc of listTerminologyLocales(ctx.terminologyDir)) {
      const t = loadTerminology(ctx.terminologyDir, loc);
      out[loc] = t.terms[en] ?? null;
    }
    return out;
  },
};
```

- [ ] **Step 4: Run tests and confirm pass**

```bash
npm run test
```

Expected: 3 passing for get_terminology.

- [ ] **Step 5: Commit**

```bash
git add src/tools/get-terminology.ts tests/tools/get-terminology.test.ts
git commit -m "feat(tools): implement get_terminology backed by terminology/<locale>.json"
```

---

## Task 12: Tool — `translate_article` (needed by `add_topic`)

**Purpose:** read `content.<from>.mdx`, call Anthropic, validate structural invariants, write `content.<to>.mdx`. This is built before `add_topic` because `add_topic` recursively invokes it for every non-source locale.

**Files:**
- Modify: `src/tools/translate-article.ts`
- Test: `tests/tools/translate-article.test.ts`

- [ ] **Step 1: Extend the fixture with a tiny MDX file**

`tests/fixtures/physics-repo/app/[locale]/(topics)/classical-mechanics/the-simple-pendulum/content.en.mdx`:

```mdx
import { Section } from "@/components/layout/section";

<Section index={1} title="A test">
Hello <Term slug="isochronism">isochronism</Term>.
</Section>
```

- [ ] **Step 2: Write the failing test**

`tests/tools/translate-article.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolve } from "node:path";
import { readFile, mkdtemp, cp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRepoPaths } from "../../src/lib/repo-paths.js";

vi.mock("../../src/lib/anthropic-client.js", () => ({
  callTranslate: vi.fn(async ({ user }) => ({
    // Echo imports + tags identically; swap visible text for Hebrew.
    text: `import { Section } from "@/components/layout/section";

<Section index={1} title="A test">
שלום <Term slug="isochronism">איזוכרוניזם</Term>.
</Section>`,
    inputTokens: 100,
    outputTokens: 80,
  })),
}));

import { translateArticleTool } from "../../src/tools/translate-article.js";

async function makeRepo(): Promise<string> {
  const src = resolve(__dirname, "../fixtures/physics-repo");
  const tmp = await mkdtemp(join(tmpdir(), "translate-article-"));
  await cp(src, tmp, { recursive: true });
  return tmp;
}

describe("translate_article", () => {
  let repoRoot: string;
  beforeEach(async () => {
    repoRoot = await makeRepo();
  });

  it("writes content.he.mdx with validated structure and returns metadata", async () => {
    const ctx = {
      repoPaths: createRepoPaths(repoRoot),
      terminologyDir: resolve(__dirname, "../../terminology"),
      anthropicApiKey: "test-key",
    };
    const result = (await translateArticleTool.handle(
      { slug: "classical-mechanics/the-simple-pendulum", fromLocale: "en", toLocale: "he" },
      ctx,
    )) as { ok: boolean; path: string; inputTokens: number; outputTokens: number };

    expect(result.ok).toBe(true);
    expect(result.path).toMatch(/content\.he\.mdx$/);
    const written = await readFile(result.path, "utf8");
    expect(written).toContain("איזוכרוניזם");
    expect(written).toContain('slug="isochronism"');
    expect(result.outputTokens).toBe(80);
  });
});
```

- [ ] **Step 3: Run tests — expect failure**

```bash
npm run test
```

Expected: FAIL.

- [ ] **Step 4: Implement `src/tools/translate-article.ts`**

```ts
import { readFileSync } from "node:fs";
import { z } from "zod";
import type { Tool } from "./tool.js";
import { buildTranslationPrompt } from "../lib/translation-prompt.js";
import { validateTranslationStructure } from "../lib/jsx-validator.js";
import { callTranslate } from "../lib/anthropic-client.js";
import { commitFiles } from "../lib/commit-files.js";

const Input = z.object({
  slug: z.string().min(1).describe("Topic slug in '<branch>/<topic>' form."),
  fromLocale: z.string().min(1),
  toLocale: z.string().min(1),
  model: z.string().optional(),
});
type InputT = z.infer<typeof Input>;

export const translateArticleTool: Tool<InputT> = {
  name: "translate_article",
  description:
    "Translate one article's MDX from fromLocale to toLocale. Validates JSX structural invariants and retries once on validation failure.",
  inputSchema: Input,
  inputJsonSchema: {
    type: "object",
    properties: {
      slug: { type: "string", description: "'<branch>/<topic>' form" },
      fromLocale: { type: "string" },
      toLocale: { type: "string" },
      model: { type: "string", description: "Override Anthropic model id" },
    },
    required: ["slug", "fromLocale", "toLocale"],
  },
  async handle(args, ctx) {
    const input = Input.parse(args);
    const [branchSlug, topicSlug] = input.slug.split("/");
    if (!branchSlug || !topicSlug) {
      throw new Error(`slug must be '<branch>/<topic>' form, got '${input.slug}'`);
    }
    const srcPath = ctx.repoPaths.topicContentMdx(branchSlug, topicSlug, input.fromLocale);
    const dstPath = ctx.repoPaths.topicContentMdx(branchSlug, topicSlug, input.toLocale);
    const source = readFileSync(srcPath, "utf8");
    const started = Date.now();

    const run = async (extraInstruction?: string): Promise<{ text: string; input: number; output: number }> => {
      const { system, user } = buildTranslationPrompt({
        terminologyDir: ctx.terminologyDir,
        targetLocale: input.toLocale,
        kind: "article",
        source,
      });
      const sys = extraInstruction ? `${system}\n\nADDITIONAL CONSTRAINT:\n${extraInstruction}` : system;
      const r = await callTranslate({
        apiKey: ctx.anthropicApiKey,
        model: input.model,
        system: sys,
        user,
      });
      return { text: r.text, input: r.inputTokens, output: r.outputTokens };
    };

    let result = await run();
    let validation = validateTranslationStructure(source, result.text);
    if (!validation.ok) {
      const retry = await run(
        `Your previous attempt failed structural validation with errors: ${validation.errors.join("; ")}. Preserve every import, every JSX tag count, and every slug=, href=, type= prop value identically.`,
      );
      result = retry;
      validation = validateTranslationStructure(source, result.text);
      if (!validation.ok) {
        return {
          ok: false,
          path: dstPath,
          errors: validation.errors,
          durationMs: Date.now() - started,
        };
      }
    }

    await commitFiles([{ path: dstPath, content: result.text }]);
    return {
      ok: true,
      path: dstPath,
      inputTokens: result.input,
      outputTokens: result.output,
      durationMs: Date.now() - started,
    };
  },
};
```

- [ ] **Step 5: Run tests and confirm pass**

```bash
npm run test
```

Expected: 1 passing for translate_article.

- [ ] **Step 6: Commit**

```bash
git add src/tools/translate-article.ts tests/tools/translate-article.test.ts tests/fixtures/physics-repo/app
git commit -m "feat(tools): implement translate_article with structural validation and one retry"
```

---

## Task 13: Tool — `add_topic`

**Purpose:** atomically (a) create `app/[locale]/(topics)/<branch>/<slug>/` containing `page.tsx` + `content.en.mdx` skeleton; (b) insert the new `Topic` record into `CLASSICAL_MECHANICS_TOPICS` (or equivalent per-branch constant); (c) append a new entry under `topics.items.<slug>` in `messages/<locale>/home.json` for every existing locale, translating via inline Anthropic calls for non-English locales.

**Files:**
- Create: `src/lib/mdx-skeleton.ts`
- Modify: `src/tools/add-topic.ts`
- Test: `tests/tools/add-topic.test.ts`

- [ ] **Step 1: Implement `src/lib/mdx-skeleton.ts`**

```ts
export interface AsideLink {
  type: "term" | "physicist";
  label: string;
  href: string;
}

export interface MdxSkeletonInput {
  branchTitle: string;
  branchEyebrow: string;
  title: string;
  subtitle: string;
  eyebrow: string;
  asideLinks: readonly AsideLink[];
}

export function buildPageTsx(): string {
  return `import { setRequestLocale } from "next-intl/server";
import { locales } from "@/i18n/config";
import EnContent from "./content.en.mdx";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  // TODO: add locale→content mapping as translations are added.
  return <EnContent />;
}
`;
}

export function buildMdxSkeleton(input: MdxSkeletonInput): string {
  const asideJson = JSON.stringify(
    input.asideLinks.map((l) => ({ type: l.type, label: l.label, href: l.href })),
    null,
    2,
  );
  const asideBlock = asideJson === "[]" ? "[]" : asideJson;
  return `import { TopicHeader } from "@/components/layout/topic-header";
import { Section } from "@/components/layout/section";
import { TopicPageLayout } from "@/components/layout/topic-page-layout";

<TopicPageLayout aside={${asideBlock}}>

<TopicHeader
  eyebrow=${JSON.stringify(input.eyebrow)}
  title=${JSON.stringify(input.title)}
  subtitle=${JSON.stringify(input.subtitle)}
/>

<Section index={1} title="TODO: first section">

TODO: write the opening.

</Section>

</TopicPageLayout>
`;
}
```

- [ ] **Step 2: Write the failing test**

`tests/tools/add-topic.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolve, join } from "node:path";
import { mkdtemp, cp, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { createRepoPaths } from "../../src/lib/repo-paths.js";

vi.mock("../../src/lib/anthropic-client.js", () => ({
  // For add_topic we only translate chrome strings into he. Return Hebrew-ish echo.
  callTranslate: vi.fn(async ({ user }) => ({
    text: user.replace(/Rocket/g, "רקטה").replace(/Fast intro/g, "הקדמה מהירה").replace(/FIG.08 · NEW MODULE/g, "FIG.08 · NEW MODULE"),
    inputTokens: 20,
    outputTokens: 15,
  })),
}));

import { addTopicTool } from "../../src/tools/add-topic.js";

async function makeRepo(): Promise<string> {
  const src = resolve(__dirname, "../fixtures/physics-repo");
  const tmp = await mkdtemp(join(tmpdir(), "add-topic-"));
  await cp(src, tmp, { recursive: true });
  return tmp;
}

describe("add_topic", () => {
  let repoRoot: string;
  beforeEach(async () => {
    repoRoot = await makeRepo();
  });

  it("creates page.tsx + content.en.mdx and updates branches.ts and home.json", async () => {
    // Seed minimal messages/{en,he}/home.json so the tool has something to append to.
    const { writeFile, mkdir } = await import("node:fs/promises");
    const homeEn = { topics: { items: {} } };
    const homeHe = { topics: { items: {} } };
    await mkdir(join(repoRoot, "messages", "en"), { recursive: true });
    await mkdir(join(repoRoot, "messages", "he"), { recursive: true });
    await writeFile(join(repoRoot, "messages", "en", "home.json"), JSON.stringify(homeEn));
    await writeFile(join(repoRoot, "messages", "he", "home.json"), JSON.stringify(homeHe));

    const ctx = {
      repoPaths: createRepoPaths(repoRoot),
      terminologyDir: resolve(__dirname, "../../terminology"),
      anthropicApiKey: "test-key",
    };

    const result = (await addTopicTool.handle(
      {
        branchSlug: "classical-mechanics",
        slug: "rocket-motion",
        module: "orbital-mechanics",
        title: "Rocket",
        subtitle: "Fast intro",
        eyebrow: "FIG.08 · NEW MODULE",
        readingMinutes: 6,
        asideLinks: [],
      },
      ctx,
    )) as { ok: true; written: string[] };

    expect(result.ok).toBe(true);

    // page.tsx exists
    await stat(join(repoRoot, "app", "[locale]", "(topics)", "classical-mechanics", "rocket-motion", "page.tsx"));
    // content.en.mdx exists and includes the title
    const mdx = await readFile(
      join(repoRoot, "app", "[locale]", "(topics)", "classical-mechanics", "rocket-motion", "content.en.mdx"),
      "utf8",
    );
    expect(mdx).toContain('title="Rocket"');

    // branches.ts was mutated to include the new slug
    const branchesSrc = await readFile(join(repoRoot, "lib", "content", "branches.ts"), "utf8");
    expect(branchesSrc).toContain('slug: "rocket-motion"');
    expect(branchesSrc).toContain('module: "orbital-mechanics"');

    // home.json files gained the new topic entry
    const en = JSON.parse(await readFile(join(repoRoot, "messages", "en", "home.json"), "utf8"));
    expect(en.topics.items["rocket-motion"].title).toBe("Rocket");

    const he = JSON.parse(await readFile(join(repoRoot, "messages", "he", "home.json"), "utf8"));
    expect(he.topics.items["rocket-motion"].title).toBe("רקטה");
  });

  it("rejects a duplicate slug", async () => {
    const ctx = {
      repoPaths: createRepoPaths(repoRoot),
      terminologyDir: resolve(__dirname, "../../terminology"),
      anthropicApiKey: "test-key",
    };
    await expect(
      addTopicTool.handle(
        {
          branchSlug: "classical-mechanics",
          slug: "the-simple-pendulum",
          module: "oscillations",
          title: "X",
          subtitle: "Y",
          eyebrow: "Z",
          readingMinutes: 1,
          asideLinks: [],
        },
        ctx,
      ),
    ).rejects.toThrow(/exists/);
  });
});
```

- [ ] **Step 3: Run tests — expect failure**

```bash
npm run test
```

Expected: FAIL.

- [ ] **Step 4: Implement `src/tools/add-topic.ts`**

```ts
import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { z } from "zod";
import { Project, SyntaxKind } from "ts-morph";
import type { Tool } from "./tool.js";
import { buildPageTsx, buildMdxSkeleton } from "../lib/mdx-skeleton.js";
import { loadBranches, loadLocales } from "../lib/data-loaders.js";
import { commitFiles, type FileOp } from "../lib/commit-files.js";
import { callTranslate } from "../lib/anthropic-client.js";
import { buildTranslationPrompt } from "../lib/translation-prompt.js";

const Input = z.object({
  branchSlug: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "slug must be kebab-case"),
  module: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().min(1),
  eyebrow: z.string().min(1),
  readingMinutes: z.number().int().positive(),
  status: z.enum(["live", "draft", "coming-soon"]).default("live"),
  asideLinks: z
    .array(z.object({ type: z.enum(["term", "physicist"]), label: z.string(), href: z.string() }))
    .default([]),
});
type InputT = z.infer<typeof Input>;

async function translateChrome(
  ctx: { terminologyDir: string; anthropicApiKey: string },
  toLocale: string,
  fields: { title: string; subtitle: string; eyebrow: string },
): Promise<{ title: string; subtitle: string; eyebrow: string }> {
  const translate = async (text: string): Promise<string> => {
    const { system, user } = buildTranslationPrompt({
      terminologyDir: ctx.terminologyDir,
      targetLocale: toLocale,
      kind: "chrome",
      source: text,
    });
    const r = await callTranslate({ apiKey: ctx.anthropicApiKey, system, user });
    return r.text.trim();
  };
  return {
    title: await translate(fields.title),
    subtitle: await translate(fields.subtitle),
    eyebrow: await translate(fields.eyebrow),
  };
}

export const addTopicTool: Tool<InputT> = {
  name: "add_topic",
  description:
    "Create a new topic atomically: folder with page.tsx + content.en.mdx skeleton, update branches.ts with Topic entry, and append topics.items.<slug> to messages/<locale>/home.json for every existing locale (auto-translating chrome strings for non-English locales).",
  inputSchema: Input,
  inputJsonSchema: {
    type: "object",
    properties: {
      branchSlug: { type: "string" },
      slug: { type: "string" },
      module: { type: "string" },
      title: { type: "string" },
      subtitle: { type: "string" },
      eyebrow: { type: "string" },
      readingMinutes: { type: "integer" },
      status: { type: "string", enum: ["live", "draft", "coming-soon"] },
      asideLinks: {
        type: "array",
        items: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["term", "physicist"] },
            label: { type: "string" },
            href: { type: "string" },
          },
          required: ["type", "label", "href"],
        },
      },
    },
    required: ["branchSlug", "slug", "module", "title", "subtitle", "eyebrow", "readingMinutes"],
  },
  async handle(args, ctx) {
    const input = Input.parse(args);
    const paths = ctx.repoPaths;

    // Guard: slug must not already exist in this branch.
    const branches = loadBranches(paths.branchesFile);
    const branch = branches.find((b) => b.slug === input.branchSlug);
    if (!branch) throw new Error(`branch '${input.branchSlug}' not found`);
    if (branch.topics.some((t) => t.slug === input.slug)) {
      throw new Error(`topic '${input.slug}' already exists in branch '${input.branchSlug}'`);
    }

    // 1. Build page.tsx + content.en.mdx.
    const pageTsx = buildPageTsx();
    const mdx = buildMdxSkeleton({
      branchTitle: branch.title ?? input.branchSlug,
      branchEyebrow: "",
      title: input.title,
      subtitle: input.subtitle,
      eyebrow: input.eyebrow,
      asideLinks: input.asideLinks,
    });

    // 2. Mutate branches.ts via ts-morph: find the branch's topics array and append.
    const project = new Project({ skipAddingFilesFromTsConfig: true });
    const file = project.addSourceFileAtPath(paths.branchesFile);
    const branchesDecl = file
      .getVariableStatements()
      .flatMap((s) => s.getDeclarations())
      .find((d) => d.getName() === "BRANCHES");
    if (!branchesDecl) throw new Error("BRANCHES declaration not found");
    const init = branchesDecl.getInitializerOrThrow();
    const arr = (init.isKind(SyntaxKind.AsExpression) ? init.getExpression() : init).asKindOrThrow(
      SyntaxKind.ArrayLiteralExpression,
    );
    const branchObj = arr
      .getElements()
      .map((e) => e.asKindOrThrow(SyntaxKind.ObjectLiteralExpression))
      .find((o) => {
        const slugProp = o.getProperty("slug")?.asKindOrThrow(SyntaxKind.PropertyAssignment).getInitializer();
        return slugProp?.isKind(SyntaxKind.StringLiteral) &&
          slugProp.asKindOrThrow(SyntaxKind.StringLiteral).getLiteralText() === input.branchSlug;
      });
    if (!branchObj) throw new Error("branch object-literal not found in BRANCHES");
    const topicsProp = branchObj.getProperty("topics")?.asKindOrThrow(SyntaxKind.PropertyAssignment);
    if (!topicsProp) throw new Error("topics property not found on branch");
    const topicsInit = topicsProp.getInitializerOrThrow();
    const topicsArr = topicsInit.asKindOrThrow(SyntaxKind.ArrayLiteralExpression);

    const newTopicLiteral = `{
      slug: ${JSON.stringify(input.slug)},
      title: ${JSON.stringify(input.title)},
      eyebrow: ${JSON.stringify(input.eyebrow)},
      subtitle: ${JSON.stringify(input.subtitle)},
      readingMinutes: ${input.readingMinutes},
      status: ${JSON.stringify(input.status)},
      module: ${JSON.stringify(input.module)},
    }`;
    topicsArr.addElement(newTopicLiteral);
    const updatedBranchesSrc = file.getFullText();

    // 3. Append to messages/<locale>/home.json for every existing locale.
    const locales = loadLocales(paths.i18nConfigFile).locales;
    const ops: FileOp[] = [
      { path: paths.topicPageTsx(input.branchSlug, input.slug), content: pageTsx },
      { path: paths.topicContentMdx(input.branchSlug, input.slug, "en"), content: mdx },
      { path: paths.branchesFile, content: updatedBranchesSrc },
    ];
    for (const loc of locales) {
      const file = paths.messageFile(loc, "home.json");
      const raw = await readFile(file, "utf8");
      const doc = JSON.parse(raw) as { topics?: { items?: Record<string, unknown> } };
      doc.topics ??= { items: {} };
      doc.topics.items ??= {};
      const chrome =
        loc === "en"
          ? { title: input.title, subtitle: input.subtitle, eyebrow: input.eyebrow }
          : await translateChrome(ctx, loc, {
              title: input.title,
              subtitle: input.subtitle,
              eyebrow: input.eyebrow,
            });
      (doc.topics.items as Record<string, unknown>)[input.slug] = chrome;
      ops.push({ path: file, content: `${JSON.stringify(doc, null, 2)}\n` });
    }

    const written = await commitFiles(ops);
    return { ok: true, written };
  },
};
```

- [ ] **Step 5: Run tests and confirm pass**

```bash
npm run test
```

Expected: 2 passing for add_topic.

- [ ] **Step 6: Commit**

```bash
git add src/lib/mdx-skeleton.ts src/tools/add-topic.ts tests/tools/add-topic.test.ts
git commit -m "feat(tools): implement atomic add_topic (folder + branches.ts + per-locale home.json)"
```

---

## Task 14: Tool — `add_dictionary_term`

**Purpose:** append a new term to `lib/content/glossary.ts` AND to every `messages/<locale>/glossary.json`. English + Hebrew come from caller; other locales auto-translate.

**Files:**
- Modify: `src/tools/add-dictionary-term.ts`
- Test: `tests/tools/add-dictionary-term.test.ts`

- [ ] **Step 1: Write the failing test**

`tests/tools/add-dictionary-term.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolve, join } from "node:path";
import { mkdtemp, cp, readFile, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { createRepoPaths } from "../../src/lib/repo-paths.js";

vi.mock("../../src/lib/anthropic-client.js", () => ({
  callTranslate: vi.fn(async ({ user }) => ({ text: `HE:${user}`, inputTokens: 1, outputTokens: 1 })),
}));

import { addDictionaryTermTool } from "../../src/tools/add-dictionary-term.js";

async function makeRepo(): Promise<string> {
  const src = resolve(__dirname, "../fixtures/physics-repo");
  const tmp = await mkdtemp(join(tmpdir(), "add-dict-"));
  await cp(src, tmp, { recursive: true });
  await mkdir(join(tmp, "messages", "en"), { recursive: true });
  await mkdir(join(tmp, "messages", "he"), { recursive: true });
  await writeFile(join(tmp, "messages", "en", "glossary.json"), "{}");
  await writeFile(join(tmp, "messages", "he", "glossary.json"), "{}");
  return tmp;
}

describe("add_dictionary_term", () => {
  let repoRoot: string;
  beforeEach(async () => {
    repoRoot = await makeRepo();
  });

  it("appends to glossary.ts and writes every locale's glossary.json atomically", async () => {
    const ctx = {
      repoPaths: createRepoPaths(repoRoot),
      terminologyDir: resolve(__dirname, "../../terminology"),
      anthropicApiKey: "test-key",
    };
    const result = (await addDictionaryTermTool.handle(
      {
        slug: "entropy",
        category: "concept",
        en: {
          term: "entropy",
          shortDefinition: "Measure of disorder.",
          description: "A long paragraph about entropy.",
          history: "Clausius, 1865.",
        },
        he: {
          term: "אנטרופיה",
          shortDefinition: "מידת אי-סדר.",
          description: "פסקה ארוכה על אנטרופיה.",
          history: "קלאוזיוס, 1865.",
        },
      },
      ctx,
    )) as { ok: true; written: string[] };

    expect(result.ok).toBe(true);
    const glossary = await readFile(join(repoRoot, "lib", "content", "glossary.ts"), "utf8");
    expect(glossary).toContain('slug: "entropy"');
    const en = JSON.parse(await readFile(join(repoRoot, "messages", "en", "glossary.json"), "utf8"));
    expect(en.entropy.term).toBe("entropy");
    const he = JSON.parse(await readFile(join(repoRoot, "messages", "he", "glossary.json"), "utf8"));
    expect(he.entropy.term).toBe("אנטרופיה");
  });

  it("rejects duplicate slugs", async () => {
    const ctx = {
      repoPaths: createRepoPaths(repoRoot),
      terminologyDir: resolve(__dirname, "../../terminology"),
      anthropicApiKey: "test-key",
    };
    await expect(
      addDictionaryTermTool.handle(
        {
          slug: "isochronism",
          category: "concept",
          en: { term: "isochronism", shortDefinition: "x", description: "y" },
          he: { term: "x", shortDefinition: "y", description: "z" },
        },
        ctx,
      ),
    ).rejects.toThrow(/exists/);
  });
});
```

- [ ] **Step 2: Run tests — expect failure**

```bash
npm run test
```

Expected: FAIL.

- [ ] **Step 3: Implement `src/tools/add-dictionary-term.ts`**

```ts
import { readFile } from "node:fs/promises";
import { z } from "zod";
import { Project, SyntaxKind } from "ts-morph";
import type { Tool } from "./tool.js";
import { loadGlossary, loadLocales } from "../lib/data-loaders.js";
import { commitFiles, type FileOp } from "../lib/commit-files.js";
import { callTranslate } from "../lib/anthropic-client.js";
import { buildTranslationPrompt } from "../lib/translation-prompt.js";

const TermPayload = z.object({
  term: z.string().min(1),
  shortDefinition: z.string().min(1),
  description: z.string().min(1),
  history: z.string().optional(),
});
type TermPayloadT = z.infer<typeof TermPayload>;

const Input = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  category: z.enum(["instrument", "concept", "unit", "phenomenon"]),
  en: TermPayload,
  he: TermPayload,
  relatedPhysicists: z.array(z.string()).optional(),
  relatedTopics: z.array(z.object({ branchSlug: z.string(), topicSlug: z.string() })).optional(),
});
type InputT = z.infer<typeof Input>;

async function translatePayload(
  ctx: { terminologyDir: string; anthropicApiKey: string },
  toLocale: string,
  en: TermPayloadT,
): Promise<TermPayloadT> {
  const translate = async (text: string): Promise<string> => {
    const { system, user } = buildTranslationPrompt({
      terminologyDir: ctx.terminologyDir,
      targetLocale: toLocale,
      kind: "glossary-entry",
      source: text,
    });
    const r = await callTranslate({ apiKey: ctx.anthropicApiKey, system, user });
    return r.text.trim();
  };
  return {
    term: await translate(en.term),
    shortDefinition: await translate(en.shortDefinition),
    description: await translate(en.description),
    history: en.history ? await translate(en.history) : undefined,
  };
}

function buildGlossaryLiteral(input: InputT): string {
  const related = input.relatedPhysicists?.length
    ? `\n      relatedPhysicists: [${input.relatedPhysicists.map((p) => JSON.stringify(p)).join(", ")}],`
    : "";
  const topics = input.relatedTopics?.length
    ? `\n      relatedTopics: [${input.relatedTopics
        .map((t) => `{ branchSlug: ${JSON.stringify(t.branchSlug)}, topicSlug: ${JSON.stringify(t.topicSlug)} }`)
        .join(", ")}],`
    : "";
  return `{
      slug: ${JSON.stringify(input.slug)},
      term: ${JSON.stringify(input.en.term)},
      category: ${JSON.stringify(input.category)},
      shortDefinition: ${JSON.stringify(input.en.shortDefinition)},
      description: ${JSON.stringify(input.en.description)},${
        input.en.history ? `\n      history: ${JSON.stringify(input.en.history)},` : ""
      }${related}${topics}
    }`;
}

export const addDictionaryTermTool: Tool<InputT> = {
  name: "add_dictionary_term",
  description:
    "Append a glossary term atomically to lib/content/glossary.ts and every messages/<locale>/glossary.json. English and Hebrew come from the caller; other locales auto-translate.",
  inputSchema: Input,
  inputJsonSchema: { type: "object" /* matches Input */ },
  async handle(args, ctx) {
    const input = Input.parse(args);
    const paths = ctx.repoPaths;

    if (loadGlossary(paths.glossaryFile).some((t) => t.slug === input.slug)) {
      throw new Error(`glossary term '${input.slug}' already exists`);
    }

    const project = new Project({ skipAddingFilesFromTsConfig: true });
    const file = project.addSourceFileAtPath(paths.glossaryFile);
    const decl = file
      .getVariableStatements()
      .flatMap((s) => s.getDeclarations())
      .find((d) => d.getName() === "GLOSSARY");
    if (!decl) throw new Error("GLOSSARY declaration not found");
    const init = decl.getInitializerOrThrow();
    const arr = (init.isKind(SyntaxKind.AsExpression) ? init.getExpression() : init).asKindOrThrow(
      SyntaxKind.ArrayLiteralExpression,
    );
    arr.addElement(buildGlossaryLiteral(input));
    const updatedGlossarySrc = file.getFullText();

    const locales = loadLocales(paths.i18nConfigFile).locales;
    const ops: FileOp[] = [{ path: paths.glossaryFile, content: updatedGlossarySrc }];
    for (const loc of locales) {
      const msgPath = paths.messageFile(loc, "glossary.json");
      const raw = await readFile(msgPath, "utf8");
      const doc = JSON.parse(raw) as Record<string, TermPayloadT>;
      const payload =
        loc === "en" ? input.en : loc === "he" ? input.he : await translatePayload(ctx, loc, input.en);
      doc[input.slug] = payload;
      ops.push({ path: msgPath, content: `${JSON.stringify(doc, null, 2)}\n` });
    }

    const written = await commitFiles(ops);
    return { ok: true, written };
  },
};
```

- [ ] **Step 4: Run tests and confirm pass**

```bash
npm run test
```

Expected: 2 passing for add_dictionary_term.

- [ ] **Step 5: Commit**

```bash
git add src/tools/add-dictionary-term.ts tests/tools/add-dictionary-term.test.ts
git commit -m "feat(tools): implement atomic add_dictionary_term across glossary.ts + messages/*/glossary.json"
```

---

## Task 15: Tool — `translate_glossary`

**Purpose:** translate every glossary entry from English into one target locale's `messages/<toLocale>/glossary.json`. Optional `slugs` restricts to a subset. Streams progress via MCP notifications.

**Files:**
- Modify: `src/tools/translate-glossary.ts`
- Test: `tests/tools/translate-glossary.test.ts`

- [ ] **Step 1: Write the failing test**

`tests/tools/translate-glossary.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolve, join } from "node:path";
import { mkdtemp, cp, readFile, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { createRepoPaths } from "../../src/lib/repo-paths.js";

vi.mock("../../src/lib/anthropic-client.js", () => ({
  callTranslate: vi.fn(async ({ user }) => ({ text: `RU:${user}`, inputTokens: 1, outputTokens: 1 })),
}));

import { translateGlossaryTool } from "../../src/tools/translate-glossary.js";

async function makeRepo(): Promise<string> {
  const src = resolve(__dirname, "../fixtures/physics-repo");
  const tmp = await mkdtemp(join(tmpdir(), "translate-gloss-"));
  await cp(src, tmp, { recursive: true });
  await mkdir(join(tmp, "messages", "en"), { recursive: true });
  await mkdir(join(tmp, "messages", "ru"), { recursive: true });
  await writeFile(
    join(tmp, "messages", "en", "glossary.json"),
    JSON.stringify({
      "pendulum-clock": { term: "pendulum clock", shortDefinition: "x", description: "y", history: "z" },
      isochronism: { term: "isochronism", shortDefinition: "a", description: "b" },
    }),
  );
  await writeFile(join(tmp, "messages", "ru", "glossary.json"), "{}");
  return tmp;
}

describe("translate_glossary", () => {
  let repoRoot: string;
  beforeEach(async () => {
    repoRoot = await makeRepo();
  });

  it("translates every entry in messages/en/glossary.json into messages/<toLocale>/glossary.json", async () => {
    // Seed a minimal terminology file for ru so buildTranslationPrompt succeeds.
    await writeFile(
      resolve(__dirname, "../../terminology/ru.json"),
      JSON.stringify({ direction: "ltr", label: "Русский", terms: {} }),
    );

    const ctx = {
      repoPaths: createRepoPaths(repoRoot),
      terminologyDir: resolve(__dirname, "../../terminology"),
      anthropicApiKey: "test-key",
    };
    const result = (await translateGlossaryTool.handle({ toLocale: "ru" }, ctx)) as {
      ok: true;
      translatedCount: number;
    };
    expect(result.translatedCount).toBe(2);
    const ru = JSON.parse(await readFile(join(repoRoot, "messages", "ru", "glossary.json"), "utf8"));
    expect(ru["pendulum-clock"].term).toContain("RU:");
  });
});
```

- [ ] **Step 2: Run tests — expect failure**

```bash
npm run test
```

Expected: FAIL.

- [ ] **Step 3: Implement `src/tools/translate-glossary.ts`**

```ts
import { readFile } from "node:fs/promises";
import { z } from "zod";
import type { Tool } from "./tool.js";
import { commitFiles } from "../lib/commit-files.js";
import { callTranslate } from "../lib/anthropic-client.js";
import { buildTranslationPrompt } from "../lib/translation-prompt.js";

const EntrySchema = z.object({
  term: z.string(),
  shortDefinition: z.string(),
  description: z.string(),
  history: z.string().optional(),
});
type Entry = z.infer<typeof EntrySchema>;

const Input = z.object({
  toLocale: z.string().min(1),
  slugs: z.array(z.string()).optional(),
  model: z.string().optional(),
});
type InputT = z.infer<typeof Input>;

export const translateGlossaryTool: Tool<InputT> = {
  name: "translate_glossary",
  description:
    "Translate all (or specified) dictionary entries from English into messages/<toLocale>/glossary.json.",
  inputSchema: Input,
  inputJsonSchema: {
    type: "object",
    properties: {
      toLocale: { type: "string" },
      slugs: { type: "array", items: { type: "string" } },
      model: { type: "string" },
    },
    required: ["toLocale"],
  },
  async handle(args, ctx, extra) {
    const input = Input.parse(args);
    const paths = ctx.repoPaths;
    const enRaw = await readFile(paths.messageFile("en", "glossary.json"), "utf8");
    const en = JSON.parse(enRaw) as Record<string, Entry>;
    const targetPath = paths.messageFile(input.toLocale, "glossary.json");
    const existingRaw = await readFile(targetPath, "utf8").catch(() => "{}");
    const target = JSON.parse(existingRaw) as Record<string, Entry>;

    const slugs = input.slugs ?? Object.keys(en);
    let done = 0;

    const translateOne = async (text: string): Promise<string> => {
      const { system, user } = buildTranslationPrompt({
        terminologyDir: ctx.terminologyDir,
        targetLocale: input.toLocale,
        kind: "glossary-entry",
        source: text,
      });
      const r = await callTranslate({ apiKey: ctx.anthropicApiKey, model: input.model, system, user });
      return r.text.trim();
    };

    const sendProgress = (e: unknown, progress: number, total: number): void => {
      const sender = (e as { sendNotification?: (n: unknown) => Promise<void> } | undefined)?.sendNotification;
      if (!sender) return;
      const token = (e as { params?: { _meta?: { progressToken?: string | number } } } | undefined)?.params?._meta
        ?.progressToken;
      if (token === undefined) return;
      void sender({
        method: "notifications/progress",
        params: { progressToken: token, progress, total },
      });
    };

    for (const slug of slugs) {
      const entry = en[slug];
      if (!entry) continue;
      target[slug] = {
        term: await translateOne(entry.term),
        shortDefinition: await translateOne(entry.shortDefinition),
        description: await translateOne(entry.description),
        history: entry.history ? await translateOne(entry.history) : undefined,
      };
      done++;
      sendProgress(extra, done, slugs.length);
    }

    await commitFiles([{ path: targetPath, content: `${JSON.stringify(target, null, 2)}\n` }]);
    return { ok: true, translatedCount: done, path: targetPath };
  },
};
```

- [ ] **Step 4: Run tests and confirm pass**

```bash
npm run test
```

Expected: 1 passing for translate_glossary.

- [ ] **Step 5: Commit**

```bash
git add src/tools/translate-glossary.ts tests/tools/translate-glossary.test.ts
git commit -m "feat(tools): implement translate_glossary with per-entry progress streaming"
```

---

## Task 16: Tool — `add_locale`

**Purpose:** scaffold a new locale end-to-end. (a) add code to `locales` (and optionally `rtlLocales`) in `i18n/config.ts`; (b) copy `messages/en/*.json` verbatim into `messages/<code>/`; (c) fan out `translate_article` for every live article + `translate_glossary` for the full dictionary in parallel; (d) stream progress notifications.

**Files:**
- Modify: `src/tools/add-locale.ts`
- Test: `tests/tools/add-locale.test.ts`

- [ ] **Step 1: Write the failing test**

`tests/tools/add-locale.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolve, join } from "node:path";
import { mkdtemp, cp, readFile, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { createRepoPaths } from "../../src/lib/repo-paths.js";

vi.mock("../../src/lib/anthropic-client.js", () => ({
  callTranslate: vi.fn(async ({ user }) => ({ text: `DE:${user}`, inputTokens: 5, outputTokens: 5 })),
}));

import { addLocaleTool } from "../../src/tools/add-locale.js";

async function makeRepo(): Promise<string> {
  const src = resolve(__dirname, "../fixtures/physics-repo");
  const tmp = await mkdtemp(join(tmpdir(), "add-locale-"));
  await cp(src, tmp, { recursive: true });
  await mkdir(join(tmp, "messages", "en"), { recursive: true });
  await writeFile(join(tmp, "messages", "en", "home.json"), "{}");
  await writeFile(
    join(tmp, "messages", "en", "glossary.json"),
    JSON.stringify({ isochronism: { term: "isochronism", shortDefinition: "x", description: "y" } }),
  );
  return tmp;
}

describe("add_locale", () => {
  let repoRoot: string;
  beforeEach(async () => {
    repoRoot = await makeRepo();
  });

  it("mutates i18n config, seeds messages/<code>/, and triggers glossary translation", async () => {
    await writeFile(
      resolve(__dirname, "../../terminology/de.json"),
      JSON.stringify({ direction: "ltr", label: "Deutsch", terms: {} }),
    );

    const ctx = {
      repoPaths: createRepoPaths(repoRoot),
      terminologyDir: resolve(__dirname, "../../terminology"),
      anthropicApiKey: "test-key",
    };
    const result = (await addLocaleTool.handle(
      { code: "de", dir: "ltr", label: "Deutsch" },
      ctx,
    )) as { ok: true };
    expect(result.ok).toBe(true);

    const cfg = await readFile(join(repoRoot, "i18n", "config.ts"), "utf8");
    expect(cfg).toMatch(/"de"/);

    const deHome = await readFile(join(repoRoot, "messages", "de", "home.json"), "utf8");
    expect(JSON.parse(deHome)).toEqual({});

    const deGloss = JSON.parse(await readFile(join(repoRoot, "messages", "de", "glossary.json"), "utf8"));
    expect(deGloss.isochronism.term).toContain("DE:");
  });
});
```

- [ ] **Step 2: Run tests — expect failure**

```bash
npm run test
```

Expected: FAIL.

- [ ] **Step 3: Implement `src/tools/add-locale.ts`**

```ts
import { readFile, readdir } from "node:fs/promises";
import { z } from "zod";
import { Project, SyntaxKind } from "ts-morph";
import type { Tool } from "./tool.js";
import { commitFiles, type FileOp } from "../lib/commit-files.js";
import { loadBranches, loadLocales } from "../lib/data-loaders.js";
import { translateArticleTool } from "./translate-article.js";
import { translateGlossaryTool } from "./translate-glossary.js";

const Input = z.object({
  code: z.string().min(2).regex(/^[a-z]{2}(-[A-Z]{2})?$/),
  dir: z.enum(["ltr", "rtl"]),
  label: z.string().min(1),
});
type InputT = z.infer<typeof Input>;

function addLocaleToConfig(filePath: string, code: string, isRtl: boolean): string {
  const project = new Project({ skipAddingFilesFromTsConfig: true });
  const file = project.addSourceFileAtPath(filePath);
  const addStringToArray = (declName: string): void => {
    const decl = file.getVariableStatements().flatMap((s) => s.getDeclarations()).find((d) => d.getName() === declName);
    if (!decl) return;
    const init = decl.getInitializerOrThrow();
    const arr = (init.isKind(SyntaxKind.AsExpression) ? init.getExpression() : init).asKindOrThrow(
      SyntaxKind.ArrayLiteralExpression,
    );
    const already = arr.getElements().some(
      (e) => e.isKind(SyntaxKind.StringLiteral) && e.asKindOrThrow(SyntaxKind.StringLiteral).getLiteralText() === code,
    );
    if (!already) arr.addElement(JSON.stringify(code));
  };
  addStringToArray("locales");
  if (isRtl) addStringToArray("rtlLocales");
  return file.getFullText();
}

export const addLocaleTool: Tool<InputT> = {
  name: "add_locale",
  description:
    "Add a new locale end-to-end: update i18n/config.ts, seed messages/<code>/* from messages/en/*, translate every article + glossary in parallel. messages/*.json chrome translation is deferred to v2.",
  inputSchema: Input,
  inputJsonSchema: {
    type: "object",
    properties: {
      code: { type: "string", description: "ISO locale code, e.g. 'ru', 'de', 'he-IL'" },
      dir: { type: "string", enum: ["ltr", "rtl"] },
      label: { type: "string", description: "Display label, e.g. 'Русский'" },
    },
    required: ["code", "dir", "label"],
  },
  async handle(args, ctx, extra) {
    const input = Input.parse(args);
    const paths = ctx.repoPaths;

    const existing = loadLocales(paths.i18nConfigFile).locales;
    if (existing.includes(input.code)) {
      throw new Error(`locale '${input.code}' already exists`);
    }

    // 1. Stage i18n/config.ts mutation and seed messages dir.
    const updatedConfig = addLocaleToConfig(paths.i18nConfigFile, input.code, input.dir === "rtl");
    const enDir = paths.messagesDir("en");
    const enFiles = await readdir(enDir);
    const ops: FileOp[] = [{ path: paths.i18nConfigFile, content: updatedConfig }];
    for (const f of enFiles) {
      const content = await readFile(paths.messageFile("en", f), "utf8");
      ops.push({ path: paths.messageFile(input.code, f), content });
    }
    await commitFiles(ops);

    // 2. Translate articles + glossary in parallel.
    const branches = loadBranches(paths.branchesFile);
    const articleJobs: Promise<unknown>[] = [];
    for (const b of branches) {
      for (const t of b.topics) {
        articleJobs.push(
          translateArticleTool.handle(
            { slug: `${b.slug}/${t.slug}`, fromLocale: "en", toLocale: input.code },
            ctx,
            extra,
          ),
        );
      }
    }
    const glossaryJob = translateGlossaryTool.handle({ toLocale: input.code }, ctx, extra);
    const settled = await Promise.allSettled([...articleJobs, glossaryJob]);
    const failures = settled
      .map((s, i) => ({ i, s }))
      .filter(({ s }) => s.status === "rejected");

    return {
      ok: failures.length === 0,
      totalJobs: settled.length,
      failures: failures.map((f) => String((f.s as PromiseRejectedResult).reason)),
    };
  },
};
```

- [ ] **Step 4: Run tests and confirm pass**

```bash
npm run test
```

Expected: 1 passing for add_locale (plus all previous tests still green).

- [ ] **Step 5: Commit**

```bash
git add src/tools/add-locale.ts tests/tools/add-locale.test.ts
git commit -m "feat(tools): implement add_locale fanning out translate_article + translate_glossary"
```

---

## Task 17: Seed the Hebrew terminology table

**Purpose:** replace the starter `terminology/he.json` with a real seed derived from the existing Hebrew MDX + glossary.

**Files:**
- Create: `scripts/seed-terminology.mjs`
- Modify: `terminology/he.json`

- [ ] **Step 1: Write `scripts/seed-terminology.mjs`**

This reads the live physics repo (from `PHYSICS_REPO_PATH`) and pairs:
- every entry in `messages/he/glossary.json[slug].term` with `messages/en/glossary.json[slug].term`
- every `<Term slug="X">Y</Term>` in `content.he.mdx` with the same in `content.en.mdx`

```js
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const repo = process.env.PHYSICS_REPO_PATH;
if (!repo) {
  console.error("Set PHYSICS_REPO_PATH to the absolute path of the physics repo.");
  process.exit(1);
}

const out = {};

// Glossary-sourced pairs.
const enGloss = JSON.parse(readFileSync(join(repo, "messages/en/glossary.json"), "utf8"));
const heGloss = JSON.parse(readFileSync(join(repo, "messages/he/glossary.json"), "utf8"));
for (const slug of Object.keys(enGloss)) {
  const en = enGloss[slug]?.term;
  const he = heGloss[slug]?.term;
  if (en && he && en.toLowerCase() !== he.toLowerCase()) {
    out[en.toLowerCase()] = he;
  }
}

// MDX-sourced pairs via <Term slug="x">y</Term>.
const topicsRoot = join(repo, "app/[locale]/(topics)");
const walk = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (entry.name === "content.en.mdx") {
      const enPath = p;
      const hePath = join(dir, "content.he.mdx");
      const en = readFileSync(enPath, "utf8");
      let he = "";
      try {
        he = readFileSync(hePath, "utf8");
      } catch {
        continue;
      }
      const termRe = /<Term\s+slug="([^"]+)">([^<]+)<\/Term>/g;
      const enMatches = [...en.matchAll(termRe)];
      const heMatches = [...he.matchAll(termRe)];
      for (const [, slug, enText] of enMatches) {
        const heMatch = heMatches.find((m) => m[1] === slug);
        if (!heMatch) continue;
        const key = enText.trim().toLowerCase();
        if (key) out[key] = heMatch[2].trim();
      }
    }
  }
};
walk(topicsRoot);

const final = {
  direction: "rtl",
  label: "עברית",
  terms: Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b))),
};
writeFileSync(resolve("terminology/he.json"), JSON.stringify(final, null, 2) + "\n");
console.error(`wrote ${Object.keys(final.terms).length} terms to terminology/he.json`);
```

- [ ] **Step 2: Run it against the live physics repo**

```bash
PHYSICS_REPO_PATH=/Users/romanpochtman/Developer/physics node scripts/seed-terminology.mjs
```

Expected: stderr reports N terms written (target: 25+). `terminology/he.json` now contains the seeded table.

- [ ] **Step 3: Spot-review `terminology/he.json`**

Open the file. Verify common physics terms are present: isochronism, restoring force, pendulum, amplitude, period, frequency, oscillator, equilibrium, angular velocity, Kepler's laws (if `<Term>`ed in source), etc. Delete any garbage entries that slipped through (e.g. full sentences).

- [ ] **Step 4: Re-run the full test suite**

```bash
npm run test
```

Expected: all tests still pass (translation-prompt tests accept richer terminology).

- [ ] **Step 5: Commit**

```bash
git add scripts/seed-terminology.mjs terminology/he.json
git commit -m "chore(terminology): seed hebrew terminology table from existing translations"
```

---

## Task 18: Link to Claude Code and verify end-to-end

**Purpose:** run the MCP from a real Claude Code session, spot-check that `list_slugs` works, and confirm the token-savings claim.

**Files:**
- Modify: `~/.claude/mcp.json`

- [ ] **Step 1: Build and link**

```bash
cd /Users/romanpochtman/Developer/physics-mcp
npm run build
npm link
```

Expected: `physics-mcp` binary is now on `PATH` (`which physics-mcp` resolves).

- [ ] **Step 2: Read existing `~/.claude/mcp.json`**

Open it and confirm current shape. Add a new entry alongside existing MCP servers.

- [ ] **Step 3: Add `physics-mcp` to `~/.claude/mcp.json`**

Merge the following (with the correct `ANTHROPIC_API_KEY` value from `~/.mempalace` or Roman's password manager — do NOT check it in):

```json
{
  "mcpServers": {
    "physics-mcp": {
      "command": "physics-mcp",
      "env": {
        "PHYSICS_REPO_PATH": "/Users/romanpochtman/Developer/physics",
        "ANTHROPIC_API_KEY": "<paste-here>"
      }
    }
  }
}
```

- [ ] **Step 4: Restart Claude Code and invoke a cheap tool**

In a new Claude Code session, call `physics-mcp.list_slugs({ kind: "term" })`. Expected: array of all current glossary slugs.

Call `physics-mcp.list_slugs({ kind: "topic" })`. Expected: 7 entries like `classical-mechanics/the-simple-pendulum`.

Call `physics-mcp.get_terminology({ en: "isochronism" })`. Expected: `{ he: "איזוכרוניזם" }`.

- [ ] **Step 5: Leave commit behind recording the link**

```bash
cd /Users/romanpochtman/Developer/physics-mcp
git tag v0.1.0-rc1
```

No source change is committed at this step; the tag marks the MVP link point.

---

## Task 19: README and handover

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace the stub `README.md`**

```markdown
# @physics-explained/mcp-server

Stdio MCP server that exposes authoring and translation tools for the Physics.explained content repo.

## Tools (Phase 1)

| Tool | Purpose |
|---|---|
| `list_slugs(kind)` | Cheap lookup for branch / topic / term / physicist / locale. |
| `get_terminology(en, locale?)` | House-style translation of a physics term. |
| `add_topic(input)` | Atomically create a topic folder + update branches.ts + messages. |
| `add_dictionary_term(input)` | Atomically append a glossary term across glossary.ts + every messages/<locale>/glossary.json. |
| `translate_article({ slug, fromLocale, toLocale })` | Translate one MDX article with structural validation. |
| `translate_glossary({ toLocale, slugs? })` | Bulk-translate glossary entries into a locale. Streams progress. |
| `add_locale({ code, dir, label })` | Scaffold a locale and fan out translation in parallel. Streams progress. |

## Environment

- `PHYSICS_REPO_PATH` — absolute path to the physics repo (required)
- `ANTHROPIC_API_KEY` — Anthropic API key for translation calls (required)

## Install (local)

```bash
cd /Users/romanpochtman/Developer/physics-mcp
npm install
npm run build
npm link
```

Register in `~/.claude/mcp.json` under `mcpServers.physics-mcp` with `command: "physics-mcp"` and the two env vars above.

## Known limitations (Phase 1)

- `add_locale` copies `messages/<locale>/*.json` from `messages/en/*.json` verbatim — chrome strings stay English until a `translate_messages` tool ships in Phase 2.
- Atomicity is best-effort across files: tmp files are staged next to targets, then renamed in a loop. Failure window is sub-ms.
- Translation uses `claude-sonnet-4-6` by default; override via the `model` parameter on translation tools.
- No npm publish yet. Use `npm link`.

## Terminology tables

`terminology/<locale>.json` ships with the package. Each file is `{ direction, label, terms: { [en]: local } }`. Hebrew seeded from the 2026-04-14 translations via `scripts/seed-terminology.mjs`. New locales start empty.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: document phase-1 tools, env, known limitations"
```

---

## Self-review checklist

After completing Tasks 1–19, verify:

- [ ] All 7 MVP tools from the spec are present and have a passing test.
- [ ] `PHYSICS_REPO_PATH` and `ANTHROPIC_API_KEY` are read from env and nowhere hardcoded.
- [ ] `commitFiles` stages before renaming; no tool bypasses it.
- [ ] Every translation tool invokes `buildTranslationPrompt` and includes the house terminology in its system prompt.
- [ ] `translate_article` validates JSX structure and retries once before failing with a diff.
- [ ] No live Anthropic API calls run in CI (every test mocks `anthropic-client`).
- [ ] `add_topic` rejects duplicate slugs; `add_dictionary_term` rejects duplicate slugs; `add_locale` rejects duplicate codes.
- [ ] `README.md` documents the Phase 1 scope limitations (no chrome translation, `npm link`, atomicity window).
- [ ] `~/.claude/mcp.json` has been edited by Roman to point at the linked binary (done in Task 18).
- [ ] `terminology/he.json` is seeded and has ≥25 real physics terms.
