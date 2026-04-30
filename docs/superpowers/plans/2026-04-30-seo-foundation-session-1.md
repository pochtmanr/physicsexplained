# SEO Foundation — Session 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship unique titles, descriptions, OG images, and JSON-LD schema for all 130 topic pages, 36 glossary entries, 17 physicist profiles, and 3 branch indexes — so Google can distinguish every URL and start indexing the corpus.

**Architecture:** Zero new prose. Read existing `entry.subtitle` from Supabase per page; expose as metadata + JSON-LD. Locale-agnostic from day 1 — untranslated locales auto-flip to `noindex,follow` + canonical-back-to-EN. Two-line page.tsx contract: `export const generateMetadata = makeTopicMetadata("topic", SLUG)` plus `<TopicPageSeo kind="topic" slug={SLUG} />`.

**Tech Stack:** Next.js 15 App Router, TypeScript, Supabase (existing `content_entries` table), Vitest, Vercel Edge runtime for OG images.

**Spec:** `docs/superpowers/specs/2026-04-30-seo-foundation-design.md`

---

## File structure

```
lib/seo/
├── config.ts                      # SITE constants
├── title.ts                       # buildTitle(entry, branch) + auto-trim chain
├── description.ts                 # extractDescription(entry)
├── locale-alternates.ts           # getRealLocaleSet(kind, slug) — which locales have real rows
├── topic-metadata.ts              # makeTopicMetadata(kind, slug)
├── jsonld.ts                      # build* JSON-LD functions
└── og-templates/
    ├── shared.tsx                 # ImageResponse helpers — fonts, brand bg, layout shell
    ├── topic-card.tsx             # topicOgImage({ slug, locale })
    ├── glossary-card.tsx          # glossaryOgImage({ slug, locale })
    └── physicist-card.tsx         # physicistOgImage({ slug, locale })

components/seo/
├── jsonld.tsx                     # <JsonLd data={...}>
└── topic-page-seo.tsx             # <TopicPageSeo kind slug>

scripts/seo/
├── apply-codemod.ts               # adds metadata + SEO + OG delegate to all 130 topic pages
├── check-uniqueness.ts            # build-time validator
└── indexnow.ts                    # POST sitemap URLs to IndexNow

tests/seo/
├── title.test.ts
├── description.test.ts
├── locale-alternates.test.ts
├── topic-metadata.test.ts
├── jsonld.test.ts
└── codemod.test.ts

# Edits
app/sitemap.ts                     # rewrite — filter localeFallback rows
app/robots.ts                      # rewrite — explicit disallow list
app/layout.tsx                     # upgrade root metadata
app/[locale]/page.tsx              # add WebSite JSON-LD
app/[locale]/[branch]/page.tsx     # use makeBranchMetadata helper
app/[locale]/dictionary/[slug]/page.tsx  # use makeTopicMetadata
app/[locale]/physicists/[slug]/page.tsx  # use makeTopicMetadata
app/[locale]/dictionary/[slug]/opengraph-image.tsx  # NEW — single dynamic file
app/[locale]/physicists/[slug]/opengraph-image.tsx  # NEW — single dynamic file

# Codemod-generated (130 files)
app/[locale]/(topics)/{branch}/{topic}/page.tsx          # +2 lines each
app/[locale]/(topics)/{branch}/{topic}/opengraph-image.tsx  # NEW per-topic delegate
```

---

## Task 1: Site config module

**Files:**
- Create: `lib/seo/config.ts`
- Test: `tests/seo/config.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/seo/config.test.ts
import { describe, it, expect } from "vitest";
import { SITE } from "@/lib/seo/config";

describe("SITE config", () => {
  it("exposes the production base URL", () => {
    expect(SITE.baseUrl).toBe("https://physics.it.com");
  });

  it("exposes site name and tagline", () => {
    expect(SITE.name).toBe("physics");
    expect(SITE.tagline).toBeTruthy();
  });

  it("buildUrl returns absolute URL for any path", () => {
    expect(SITE.buildUrl("/foo")).toBe("https://physics.it.com/foo");
    expect(SITE.buildUrl("/")).toBe("https://physics.it.com/");
  });

  it("buildUrl handles locale-prefixed paths for non-default locales", () => {
    expect(SITE.localizedUrl("/foo", "en")).toBe("https://physics.it.com/foo");
    expect(SITE.localizedUrl("/foo", "he")).toBe("https://physics.it.com/he/foo");
  });
});
```

- [ ] **Step 2: Run test and verify it fails**

Run: `pnpm vitest run tests/seo/config.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement minimal config**

```ts
// lib/seo/config.ts
import { defaultLocale } from "@/i18n/config";

export const SITE = {
  baseUrl: "https://physics.it.com",
  name: "physics",
  tagline: "Visual-first physics explainers with live, accurate simulations.",
  defaultOgImage: "/og-image.png",

  buildUrl(path: string): string {
    const clean = path.startsWith("/") ? path : `/${path}`;
    return `${this.baseUrl}${clean}`;
  },

  localizedUrl(path: string, locale: string): string {
    const clean = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
    if (locale === defaultLocale) return `${this.baseUrl}${clean || "/"}`;
    return `${this.baseUrl}/${locale}${clean}`;
  },
} as const;
```

- [ ] **Step 4: Run test and verify it passes**

Run: `pnpm vitest run tests/seo/config.test.ts`
Expected: PASS — 4 tests

- [ ] **Step 5: Commit**

```bash
git add lib/seo/config.ts tests/seo/config.test.ts
git commit -m "feat(seo): add site config — base URL, name, URL builders"
```

---

## Task 2: Title builder with auto-trim chain

**Files:**
- Create: `lib/seo/title.ts`
- Test: `tests/seo/title.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/seo/title.test.ts
import { describe, it, expect } from "vitest";
import { buildTitle, MAX_TITLE_LENGTH } from "@/lib/seo/title";

describe("buildTitle", () => {
  it("uses meta.seoTitle when set, no transformation", () => {
    const t = buildTitle({
      title: "Whatever",
      meta: { seoTitle: "Hand-tuned title" },
    }, { title: "Branch" });
    expect(t).toBe("Hand-tuned title");
  });

  it("formats title — branch — physics when under 60 chars", () => {
    const t = buildTitle(
      { title: "The Simple Pendulum", meta: {} },
      { title: "Classical Mechanics" },
    );
    expect(t).toBe("The Simple Pendulum — Classical Mechanics — physics");
    expect(t.length).toBeLessThanOrEqual(MAX_TITLE_LENGTH);
  });

  it("drops branch when full pattern exceeds 60 chars", () => {
    const t = buildTitle(
      { title: "Tides and the Three-Body Problem", meta: {} },
      { title: "Classical Mechanics" },
    );
    expect(t).not.toContain("Classical Mechanics");
    expect(t).toContain("Tides and the Three-Body Problem");
    expect(t).toContain("physics");
  });

  it("uses bare title when even title — physics exceeds 60 chars", () => {
    const t = buildTitle(
      { title: "An Extraordinarily Long Topic Title That Exceeds Sixty Chars On Its Own", meta: {} },
      { title: "Branch" },
    );
    expect(t).toBe("An Extraordinarily Long Topic Title That Exceeds Sixty Chars On Its Own");
  });

  it("renders branch as null gracefully (glossary, physicists, etc.)", () => {
    const t = buildTitle({ title: "Angular Momentum", meta: {} }, null);
    expect(t).toBe("Angular Momentum — physics");
  });

  it("normalizes ALL CAPS source titles to title-case-ish", () => {
    const t = buildTitle({ title: "THE SIMPLE PENDULUM", meta: {} }, { title: "CLASSICAL MECHANICS" });
    // Source uses CAPS; output should be human-friendly
    expect(t).toContain("The Simple Pendulum");
  });
});
```

- [ ] **Step 2: Run test and verify it fails**

Run: `pnpm vitest run tests/seo/title.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement**

```ts
// lib/seo/title.ts
export const MAX_TITLE_LENGTH = 60;
const SUFFIX = "physics";

interface TitleEntry {
  title: string;
  meta?: { seoTitle?: unknown };
}

interface BranchLike {
  title: string;
}

function toTitleCase(s: string): string {
  // Source titles like "THE SIMPLE PENDULUM" → "The Simple Pendulum"
  if (s !== s.toUpperCase()) return s;
  return s
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\b(A|An|The|Of|And|To|In|On|For|At|By|With)\b/g, (m, _, idx) =>
      idx === 0 ? m : m.toLowerCase(),
    );
}

export function buildTitle(entry: TitleEntry, branch: BranchLike | null): string {
  const override = entry.meta?.seoTitle;
  if (typeof override === "string" && override.trim().length > 0) {
    return override;
  }
  const topic = toTitleCase(entry.title);
  const branchTitle = branch ? toTitleCase(branch.title) : null;

  if (branchTitle) {
    const full = `${topic} — ${branchTitle} — ${SUFFIX}`;
    if (full.length <= MAX_TITLE_LENGTH) return full;
  }

  const noBranch = `${topic} — ${SUFFIX}`;
  if (noBranch.length <= MAX_TITLE_LENGTH) return noBranch;

  return topic;
}
```

- [ ] **Step 4: Run test and verify it passes**

Run: `pnpm vitest run tests/seo/title.test.ts`
Expected: PASS — 6 tests

- [ ] **Step 5: Commit**

```bash
git add lib/seo/title.ts tests/seo/title.test.ts
git commit -m "feat(seo): add title builder with auto-trim chain + meta.seoTitle override"
```

---

## Task 3: Description extractor

**Files:**
- Create: `lib/seo/description.ts`
- Test: `tests/seo/description.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/seo/description.test.ts
import { describe, it, expect } from "vitest";
import { extractDescription, MAX_DESCRIPTION_LENGTH } from "@/lib/seo/description";

describe("extractDescription", () => {
  it("returns meta.seoDescription when set", () => {
    expect(
      extractDescription({
        subtitle: "fallback",
        blocks: [],
        meta: { seoDescription: "hand-tuned" },
      }),
    ).toBe("hand-tuned");
  });

  it("returns subtitle when present and no override", () => {
    expect(
      extractDescription({
        subtitle: "Why every clock that ever ticked ticked the same way.",
        blocks: [],
        meta: {},
      }),
    ).toBe("Why every clock that ever ticked ticked the same way.");
  });

  it("falls back to first paragraph from blocks when no subtitle", () => {
    expect(
      extractDescription({
        subtitle: null,
        blocks: [
          { type: "paragraph", inlines: ["First paragraph text here."] } as never,
          { type: "paragraph", inlines: ["Second paragraph."] } as never,
        ],
        meta: {},
      }),
    ).toBe("First paragraph text here.");
  });

  it("truncates first-paragraph fallback to 155 chars at word boundary", () => {
    const long = "x ".repeat(200).trim();
    const out = extractDescription({
      subtitle: null,
      blocks: [{ type: "paragraph", inlines: [long] } as never],
      meta: {},
    });
    expect(out.length).toBeLessThanOrEqual(MAX_DESCRIPTION_LENGTH);
    expect(out.endsWith("…")).toBe(true);
  });

  it("strips inline markdown from extracted paragraph", () => {
    expect(
      extractDescription({
        subtitle: null,
        blocks: [{ type: "paragraph", inlines: ["Here is **bold** and *italic* text."] } as never],
        meta: {},
      }),
    ).toBe("Here is bold and italic text.");
  });

  it("returns empty string when no source available", () => {
    expect(extractDescription({ subtitle: null, blocks: [], meta: {} })).toBe("");
  });
});
```

- [ ] **Step 2: Run test and verify it fails**

Run: `pnpm vitest run tests/seo/description.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement**

```ts
// lib/seo/description.ts
export const MAX_DESCRIPTION_LENGTH = 155;

interface DescriptionEntry {
  subtitle: string | null;
  blocks: Array<{ type: string; inlines?: unknown[] }>;
  meta?: { seoDescription?: unknown };
}

function stripMarkdown(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\$\$(.+?)\$\$/g, "")
    .replace(/\$(.+?)\$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  const sliced = s.slice(0, max - 1);
  const lastSpace = sliced.lastIndexOf(" ");
  const cutAt = lastSpace > max * 0.6 ? lastSpace : max - 1;
  return `${sliced.slice(0, cutAt).trimEnd()}…`;
}

export function extractDescription(entry: DescriptionEntry): string {
  const override = entry.meta?.seoDescription;
  if (typeof override === "string" && override.trim().length > 0) {
    return override.trim();
  }
  if (entry.subtitle && entry.subtitle.trim().length > 0) {
    return entry.subtitle.trim();
  }
  for (const block of entry.blocks) {
    if (block.type !== "paragraph") continue;
    const first = block.inlines?.[0];
    if (typeof first !== "string") continue;
    const cleaned = stripMarkdown(first);
    if (cleaned.length === 0) continue;
    return truncate(cleaned, MAX_DESCRIPTION_LENGTH);
  }
  return "";
}
```

- [ ] **Step 4: Run test and verify it passes**

Run: `pnpm vitest run tests/seo/description.test.ts`
Expected: PASS — 6 tests

- [ ] **Step 5: Commit**

```bash
git add lib/seo/description.ts tests/seo/description.test.ts
git commit -m "feat(seo): add description extractor — seoDescription | subtitle | first paragraph"
```

---

## Task 4: Locale alternates helper

**Files:**
- Create: `lib/seo/locale-alternates.ts`
- Test: `tests/seo/locale-alternates.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/seo/locale-alternates.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { getRealLocaleSet } from "@/lib/seo/locale-alternates";
import { supabase } from "@/lib/supabase";

describe("getRealLocaleSet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns set of locales where a real row exists for (kind, slug)", async () => {
    const fromMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ locale: "en" }, { locale: "he" }],
            error: null,
          }),
        }),
      }),
    });
    (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(fromMock);

    const result = await getRealLocaleSet("topic", "the-simple-pendulum");
    expect(result.has("en")).toBe(true);
    expect(result.has("he")).toBe(true);
  });

  it("returns only en when no other locales have real rows", async () => {
    const fromMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ locale: "en" }],
            error: null,
          }),
        }),
      }),
    });
    (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(fromMock);

    const result = await getRealLocaleSet("topic", "kepler");
    expect(Array.from(result)).toEqual(["en"]);
  });
});
```

- [ ] **Step 2: Run test and verify it fails**

Run: `pnpm vitest run tests/seo/locale-alternates.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement**

```ts
// lib/seo/locale-alternates.ts
import "server-only";
import { cache } from "react";
import { supabase } from "@/lib/supabase";
import type { ContentKind } from "@/lib/content/fetch";

export const getRealLocaleSet = cache(
  async (kind: ContentKind, slug: string): Promise<Set<string>> => {
    const { data, error } = await supabase
      .from("content_entries")
      .select("locale")
      .eq("kind", kind)
      .eq("slug", slug);
    if (error) throw error;
    return new Set((data ?? []).map((row) => row.locale as string));
  },
);
```

- [ ] **Step 4: Run test and verify it passes**

Run: `pnpm vitest run tests/seo/locale-alternates.test.ts`
Expected: PASS — 2 tests

- [ ] **Step 5: Commit**

```bash
git add lib/seo/locale-alternates.ts tests/seo/locale-alternates.test.ts
git commit -m "feat(seo): add locale alternates helper — list real-row locales per slug"
```

---

## Task 5: JSON-LD builder library

**Files:**
- Create: `lib/seo/jsonld.ts`
- Test: `tests/seo/jsonld.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/seo/jsonld.test.ts
import { describe, it, expect } from "vitest";
import {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildPersonJsonLd,
  buildDefinedTermJsonLd,
  buildWebSiteJsonLd,
} from "@/lib/seo/jsonld";

describe("buildArticleJsonLd", () => {
  it("emits an Article with required Schema.org fields", () => {
    const out = buildArticleJsonLd({
      url: "https://physics.it.com/classical-mechanics/the-simple-pendulum",
      headline: "The Simple Pendulum",
      description: "Why every clock ticked.",
      datePublished: "2026-04-11T00:00:00Z",
      dateModified: "2026-04-12T00:00:00Z",
      locale: "en",
      image: "https://physics.it.com/.../opengraph-image",
      about: ["Pendulum", "Classical mechanics"],
    });
    expect(out["@context"]).toBe("https://schema.org");
    expect(out["@type"]).toBe("Article");
    expect(out.headline).toBe("The Simple Pendulum");
    expect(out.description).toBe("Why every clock ticked.");
    expect(out.inLanguage).toBe("en");
    expect(out.datePublished).toBe("2026-04-11T00:00:00Z");
    expect(out.dateModified).toBe("2026-04-12T00:00:00Z");
    expect(out.publisher["@type"]).toBe("Organization");
    expect(Array.isArray(out.about)).toBe(true);
    expect((out.about as { name: string }[])[0].name).toBe("Pendulum");
  });
});

describe("buildBreadcrumbJsonLd", () => {
  it("emits a BreadcrumbList with positioned items", () => {
    const out = buildBreadcrumbJsonLd([
      { name: "physics", url: "https://physics.it.com" },
      { name: "Classical Mechanics", url: "https://physics.it.com/classical-mechanics" },
      { name: "The Simple Pendulum" },
    ]);
    expect(out["@type"]).toBe("BreadcrumbList");
    expect(out.itemListElement).toHaveLength(3);
    expect(out.itemListElement[0]).toMatchObject({
      "@type": "ListItem",
      position: 1,
      name: "physics",
      item: "https://physics.it.com",
    });
    expect(out.itemListElement[2]).toMatchObject({ position: 3, name: "The Simple Pendulum" });
    expect((out.itemListElement[2] as Record<string, unknown>).item).toBeUndefined();
  });
});

describe("buildPersonJsonLd", () => {
  it("emits a Person with biographical fields", () => {
    const out = buildPersonJsonLd({
      url: "https://physics.it.com/physicists/isaac-newton",
      name: "Isaac Newton",
      birthDate: "1643-01-04",
      deathDate: "1727-03-31",
      nationality: "English",
      description: "Calculus, optics, gravity.",
      image: "https://physics.it.com/.../og.png",
      sameAs: ["https://en.wikipedia.org/wiki/Isaac_Newton"],
      knowsAbout: ["Calculus", "Optics"],
    });
    expect(out["@type"]).toBe("Person");
    expect(out.name).toBe("Isaac Newton");
    expect(out.birthDate).toBe("1643-01-04");
    expect(out.sameAs).toEqual(["https://en.wikipedia.org/wiki/Isaac_Newton"]);
  });
});

describe("buildDefinedTermJsonLd", () => {
  it("emits a DefinedTerm wired to the dictionary set", () => {
    const out = buildDefinedTermJsonLd({
      url: "https://physics.it.com/dictionary/angular-momentum",
      name: "Angular momentum",
      description: "L = r × p.",
      slug: "angular-momentum",
    });
    expect(out["@type"]).toBe("DefinedTerm");
    expect(out.termCode).toBe("angular-momentum");
    expect((out.inDefinedTermSet as { url: string }).url).toBe(
      "https://physics.it.com/dictionary",
    );
  });
});

describe("buildWebSiteJsonLd", () => {
  it("emits a WebSite with SearchAction", () => {
    const out = buildWebSiteJsonLd();
    expect(out["@type"]).toBe("WebSite");
    expect(out.url).toBe("https://physics.it.com");
    expect((out.potentialAction as { "@type": string })["@type"]).toBe("SearchAction");
  });
});
```

- [ ] **Step 2: Run test and verify it fails**

Run: `pnpm vitest run tests/seo/jsonld.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement**

```ts
// lib/seo/jsonld.ts
import { SITE } from "./config";

const PUBLISHER = {
  "@type": "Organization" as const,
  name: SITE.name,
  url: SITE.baseUrl,
  logo: {
    "@type": "ImageObject" as const,
    url: `${SITE.baseUrl}/icon-512.png`,
  },
};

export interface ArticleParams {
  url: string;
  headline: string;
  description: string;
  datePublished?: string;
  dateModified?: string;
  locale: string;
  image: string;
  about?: string[];
}

export function buildArticleJsonLd(p: ArticleParams) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: p.headline,
    description: p.description,
    url: p.url,
    image: p.image,
    inLanguage: p.locale,
    datePublished: p.datePublished,
    dateModified: p.dateModified,
    mainEntityOfPage: p.url,
    isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE.baseUrl },
    author: { "@type": "Organization", name: SITE.name, url: SITE.baseUrl },
    publisher: PUBLISHER,
    about: p.about?.map((name) => ({ "@type": "Thing", name })),
  };
}

export interface BreadcrumbItem {
  name: string;
  url?: string;
}

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      ...(item.url ? { item: item.url } : {}),
    })),
  };
}

export interface PersonParams {
  url: string;
  name: string;
  birthDate?: string;
  deathDate?: string;
  nationality?: string;
  description?: string;
  image?: string;
  sameAs?: string[];
  knowsAbout?: string[];
}

export function buildPersonJsonLd(p: PersonParams) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    url: p.url,
    name: p.name,
    birthDate: p.birthDate,
    deathDate: p.deathDate,
    nationality: p.nationality,
    description: p.description,
    image: p.image,
    sameAs: p.sameAs,
    knowsAbout: p.knowsAbout,
  };
}

export interface DefinedTermParams {
  url: string;
  name: string;
  description: string;
  slug: string;
}

export function buildDefinedTermJsonLd(p: DefinedTermParams) {
  return {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: p.name,
    description: p.description,
    url: p.url,
    termCode: p.slug,
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: "physics dictionary",
      url: `${SITE.baseUrl}/dictionary`,
    },
  };
}

export function buildWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.baseUrl,
    description: SITE.tagline,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE.baseUrl}/dictionary?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}
```

- [ ] **Step 4: Run test and verify it passes**

Run: `pnpm vitest run tests/seo/jsonld.test.ts`
Expected: PASS — 5 tests

- [ ] **Step 5: Commit**

```bash
git add lib/seo/jsonld.ts tests/seo/jsonld.test.ts
git commit -m "feat(seo): add JSON-LD builders — Article, Breadcrumb, Person, DefinedTerm, WebSite"
```

---

## Task 6: JsonLd component

**Files:**
- Create: `components/seo/jsonld.tsx`

- [ ] **Step 1: Implement**

```tsx
// components/seo/jsonld.tsx
import "server-only";

export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/seo/jsonld.tsx
git commit -m "feat(seo): add <JsonLd> server component"
```

---

## Task 7: TopicPageSeo component (composes Article + Breadcrumb)

**Files:**
- Create: `components/seo/topic-page-seo.tsx`

- [ ] **Step 1: Implement**

```tsx
// components/seo/topic-page-seo.tsx
import "server-only";
import { getLocale } from "next-intl/server";
import { getContentEntry, type ContentKind } from "@/lib/content/fetch";
import { getBranch } from "@/lib/content/branches";
import { SITE } from "@/lib/seo/config";
import { extractDescription } from "@/lib/seo/description";
import {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildPersonJsonLd,
  buildDefinedTermJsonLd,
} from "@/lib/seo/jsonld";
import { JsonLd } from "@/components/seo/jsonld";

interface Props {
  kind: ContentKind;
  slug: string;
}

function pathFor(kind: ContentKind, slug: string): string {
  if (kind === "topic") return `/${slug}`;
  if (kind === "glossary") return `/dictionary/${slug}`;
  return `/physicists/${slug}`;
}

export async function TopicPageSeo({ kind, slug }: Props) {
  const locale = await getLocale();
  const entry = await getContentEntry(kind, slug, locale);
  if (!entry) return null;
  if (entry.localeFallback) return null; // do not emit JSON-LD for noindex pages

  const url = SITE.localizedUrl(pathFor(kind, slug), locale);
  const ogImage = `${url}/opengraph-image`;
  const description = extractDescription({
    subtitle: entry.subtitle,
    blocks: entry.blocks as never,
    meta: entry.meta,
  });

  const breadcrumb: { name: string; url?: string }[] = [
    { name: "physics", url: SITE.baseUrl },
  ];

  let primary: unknown;

  if (kind === "topic") {
    const [branchSlug] = slug.split("/");
    const branch = getBranch(branchSlug);
    if (branch) {
      breadcrumb.push({ name: branch.title, url: SITE.localizedUrl(`/${branch.slug}`, locale) });
    }
    breadcrumb.push({ name: entry.title });

    const meta = entry.meta as { relatedTopics?: { topicSlug: string }[]; relatedGlossary?: { slug: string }[] };
    const about = [
      ...(branch ? [branch.title] : []),
      ...(meta.relatedGlossary?.map((g) => g.slug.replace(/-/g, " ")) ?? []),
    ];

    primary = buildArticleJsonLd({
      url,
      headline: entry.title,
      description,
      datePublished: typeof entry.meta.createdAt === "string" ? entry.meta.createdAt : undefined,
      dateModified: typeof entry.meta.updatedAt === "string" ? entry.meta.updatedAt : undefined,
      locale,
      image: ogImage,
      about: about.length > 0 ? about : undefined,
    });
  } else if (kind === "glossary") {
    breadcrumb.push({ name: "Dictionary", url: SITE.localizedUrl("/dictionary", locale) });
    breadcrumb.push({ name: entry.title });
    primary = buildDefinedTermJsonLd({
      url,
      name: entry.title,
      description,
      slug,
    });
  } else {
    breadcrumb.push({ name: "Physicists", url: SITE.localizedUrl("/physicists", locale) });
    breadcrumb.push({ name: entry.title });
    const meta = entry.meta as {
      born?: string;
      died?: string;
      nationality?: string;
      sameAs?: string[];
      contributions?: string[];
    };
    primary = buildPersonJsonLd({
      url,
      name: entry.title,
      birthDate: meta.born,
      deathDate: meta.died,
      nationality: meta.nationality,
      description,
      image: ogImage,
      sameAs: meta.sameAs,
      knowsAbout: meta.contributions,
    });
  }

  return (
    <>
      <JsonLd data={primary} />
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumb)} />
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/seo/topic-page-seo.tsx
git commit -m "feat(seo): add <TopicPageSeo> — composes Article/DefinedTerm/Person + Breadcrumb"
```

---

## Task 8: makeTopicMetadata factory

**Files:**
- Create: `lib/seo/topic-metadata.ts`
- Test: `tests/seo/topic-metadata.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/seo/topic-metadata.test.ts
import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/content/fetch", () => ({
  getContentEntry: vi.fn(),
}));
vi.mock("@/lib/seo/locale-alternates", () => ({
  getRealLocaleSet: vi.fn(),
}));

import { makeTopicMetadata } from "@/lib/seo/topic-metadata";
import { getContentEntry } from "@/lib/content/fetch";
import { getRealLocaleSet } from "@/lib/seo/locale-alternates";

describe("makeTopicMetadata", () => {
  it("returns full metadata for a real EN topic", async () => {
    (getContentEntry as ReturnType<typeof vi.fn>).mockResolvedValue({
      title: "The Simple Pendulum",
      subtitle: "Why every clock ticked.",
      blocks: [],
      meta: {},
      localeFallback: false,
    });
    (getRealLocaleSet as ReturnType<typeof vi.fn>).mockResolvedValue(new Set(["en"]));

    const fn = makeTopicMetadata("topic", "classical-mechanics/the-simple-pendulum");
    const meta = await fn({ params: Promise.resolve({ locale: "en" }) });

    expect(meta.title).toContain("The Simple Pendulum");
    expect(meta.description).toBe("Why every clock ticked.");
    expect(meta.alternates?.canonical).toBe(
      "https://physics.it.com/classical-mechanics/the-simple-pendulum",
    );
    expect(meta.openGraph?.url).toBe(
      "https://physics.it.com/classical-mechanics/the-simple-pendulum",
    );
    expect(meta.robots).toBeUndefined();
  });

  it("noindex + canonical-back-to-EN when localeFallback=true", async () => {
    (getContentEntry as ReturnType<typeof vi.fn>).mockResolvedValue({
      title: "The Simple Pendulum",
      subtitle: "Why every clock ticked.",
      blocks: [],
      meta: {},
      localeFallback: true,
    });
    (getRealLocaleSet as ReturnType<typeof vi.fn>).mockResolvedValue(new Set(["en"]));

    const fn = makeTopicMetadata("topic", "classical-mechanics/the-simple-pendulum");
    const meta = await fn({ params: Promise.resolve({ locale: "he" }) });

    expect(meta.robots).toEqual({ index: false, follow: true });
    expect(meta.alternates?.canonical).toBe(
      "https://physics.it.com/classical-mechanics/the-simple-pendulum",
    );
  });

  it("includes hreflang alternates only for sibling locales with real rows", async () => {
    (getContentEntry as ReturnType<typeof vi.fn>).mockResolvedValue({
      title: "Foo",
      subtitle: "Bar",
      blocks: [],
      meta: {},
      localeFallback: false,
    });
    (getRealLocaleSet as ReturnType<typeof vi.fn>).mockResolvedValue(new Set(["en", "he"]));

    const fn = makeTopicMetadata("topic", "classical-mechanics/foo");
    const meta = await fn({ params: Promise.resolve({ locale: "en" }) });

    expect(meta.alternates?.languages).toMatchObject({
      he: "https://physics.it.com/he/classical-mechanics/foo",
    });
  });

  it("returns empty metadata when entry not found", async () => {
    (getContentEntry as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const fn = makeTopicMetadata("topic", "missing");
    const meta = await fn({ params: Promise.resolve({ locale: "en" }) });
    expect(meta).toEqual({});
  });
});
```

- [ ] **Step 2: Run test and verify it fails**

Run: `pnpm vitest run tests/seo/topic-metadata.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement**

```ts
// lib/seo/topic-metadata.ts
import "server-only";
import type { Metadata } from "next";
import { getContentEntry, type ContentKind } from "@/lib/content/fetch";
import { getBranch } from "@/lib/content/branches";
import { locales, defaultLocale, isRtlLocale } from "@/i18n/config";
import { SITE } from "./config";
import { buildTitle } from "./title";
import { extractDescription } from "./description";
import { getRealLocaleSet } from "./locale-alternates";

function pathFor(kind: ContentKind, slug: string): string {
  if (kind === "topic") return `/${slug}`;
  if (kind === "glossary") return `/dictionary/${slug}`;
  return `/physicists/${slug}`;
}

function ogLocale(locale: string): string {
  // Map next-intl locales to OG locale codes
  if (locale === "en") return "en_US";
  if (locale === "he") return "he_IL";
  if (locale === "ar") return "ar_SA";
  return locale;
}

export function makeTopicMetadata(kind: ContentKind, slug: string) {
  return async function generateMetadata({
    params,
  }: {
    params: Promise<{ locale: string }>;
  }): Promise<Metadata> {
    const { locale } = await params;
    const entry = await getContentEntry(kind, slug, locale);
    if (!entry) return {};

    const path = pathFor(kind, slug);
    const enUrl = SITE.localizedUrl(path, defaultLocale);
    const localeUrl = SITE.localizedUrl(path, locale);
    const canonicalUrl = entry.localeFallback ? enUrl : localeUrl;

    const branchTitle =
      kind === "topic"
        ? (() => {
            const branchSlug = slug.split("/")[0];
            return getBranch(branchSlug)?.title ?? null;
          })()
        : null;

    const title = buildTitle(
      { title: entry.title, meta: entry.meta },
      branchTitle ? { title: branchTitle } : null,
    );

    const description = extractDescription({
      subtitle: entry.subtitle,
      blocks: entry.blocks as never,
      meta: entry.meta,
    });

    const realLocales = await getRealLocaleSet(kind, slug);
    const languages: Record<string, string> = {};
    for (const l of locales) {
      if (l === locale) continue;
      if (realLocales.has(l)) {
        languages[l] = SITE.localizedUrl(path, l);
      }
    }

    const ogImageUrl = `${localeUrl}/opengraph-image`;
    const isProfile = kind === "physicist";

    const meta: Metadata = {
      metadataBase: new URL(SITE.baseUrl),
      title,
      description,
      alternates: {
        canonical: canonicalUrl,
        ...(Object.keys(languages).length > 0 ? { languages } : {}),
      },
      openGraph: {
        type: isProfile ? "profile" : "article",
        url: localeUrl,
        siteName: SITE.name,
        locale: ogLocale(locale),
        title,
        description,
        images: [{ url: ogImageUrl, width: 1200, height: 630 }],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [ogImageUrl],
      },
    };

    if (entry.localeFallback) {
      meta.robots = { index: false, follow: true };
    }

    return meta;
  };
}

// Convenience for branch index pages — they don't have a content_entries row.
export function makeBranchMetadata(branchSlug: string) {
  return async function generateMetadata({
    params,
  }: {
    params: Promise<{ locale: string }>;
  }): Promise<Metadata> {
    const { locale } = await params;
    const branch = getBranch(branchSlug);
    if (!branch) return {};

    const path = `/${branchSlug}`;
    const localeUrl = SITE.localizedUrl(path, locale);
    const enUrl = SITE.localizedUrl(path, defaultLocale);
    const title = buildTitle({ title: branch.title, meta: {} }, null);
    const description = branch.subtitle;
    const ogImageUrl = `${localeUrl}/opengraph-image`;

    return {
      metadataBase: new URL(SITE.baseUrl),
      title,
      description,
      alternates: { canonical: locale === defaultLocale ? localeUrl : enUrl },
      openGraph: {
        type: "website",
        url: localeUrl,
        siteName: SITE.name,
        locale: ogLocale(locale),
        title,
        description,
        images: [{ url: ogImageUrl, width: 1200, height: 630 }],
      },
      twitter: { card: "summary_large_image", title, description, images: [ogImageUrl] },
    };
  };
}

export { ogLocale, isRtlLocale };
```

- [ ] **Step 4: Run test and verify it passes**

Run: `pnpm vitest run tests/seo/topic-metadata.test.ts`
Expected: PASS — 4 tests

- [ ] **Step 5: Commit**

```bash
git add lib/seo/topic-metadata.ts tests/seo/topic-metadata.test.ts
git commit -m "feat(seo): add makeTopicMetadata + makeBranchMetadata factories"
```

---

## Task 9: Sitemap rewrite — drop fallback locales

**Files:**
- Modify: `app/sitemap.ts`

- [ ] **Step 1: Replace sitemap implementation**

```ts
// app/sitemap.ts
import type { MetadataRoute } from "next";
import { BRANCHES } from "@/lib/content/branches";
import { supabase } from "@/lib/supabase";
import { locales, defaultLocale } from "@/i18n/config";
import { SITE } from "@/lib/seo/config";

type ChangeFreq = NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;

interface RealEntry {
  kind: "topic" | "glossary" | "physicist";
  slug: string;
  locale: string;
  updated_at: string | null;
}

function pathFor(kind: RealEntry["kind"], slug: string): string {
  if (kind === "topic") return `/${slug}`;
  if (kind === "glossary") return `/dictionary/${slug}`;
  return `/physicists/${slug}`;
}

function entry(
  path: string,
  locale: string,
  realLocaleSet: Set<string>,
  lastModified: string,
  changeFrequency: ChangeFreq,
  priority: number,
): MetadataRoute.Sitemap[number] {
  const languages: Record<string, string> = {};
  for (const l of locales) {
    if (l === locale) continue;
    if (realLocaleSet.has(l)) {
      languages[l] = SITE.localizedUrl(path, l);
    }
  }
  return {
    url: SITE.localizedUrl(path, locale),
    lastModified,
    changeFrequency,
    priority,
    ...(Object.keys(languages).length > 0 ? { alternates: { languages } } : {}),
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date().toISOString();

  // Static pages — only emit default locale URLs for now.
  const staticPaths: Array<[string, ChangeFreq, number]> = [
    ["/", "weekly", 1.0],
    ["/about", "monthly", 0.6],
    ["/physicists", "monthly", 0.7],
    ["/dictionary", "monthly", 0.7],
    ["/privacy", "yearly", 0.3],
    ["/terms", "yearly", 0.3],
    ["/cookies", "yearly", 0.3],
  ];
  const staticPages: MetadataRoute.Sitemap = staticPaths.map(([p, freq, prio]) => ({
    url: SITE.localizedUrl(p, defaultLocale),
    lastModified: now,
    changeFrequency: freq,
    priority: prio,
  }));

  const branchPages: MetadataRoute.Sitemap = BRANCHES.filter(
    (b) => b.status === "live",
  ).map((b) => ({
    url: SITE.localizedUrl(`/${b.slug}`, defaultLocale),
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  // Pull all real rows for all locales.
  const { data, error } = await supabase
    .from("content_entries")
    .select("kind, slug, locale, updated_at")
    .in("kind", ["topic", "glossary", "physicist"]);
  if (error) throw error;

  // Group locales per (kind, slug) so we can emit hreflang alternates correctly.
  const realLocalesBySlug = new Map<string, Set<string>>();
  const rows: RealEntry[] = (data ?? []) as RealEntry[];
  for (const r of rows) {
    const key = `${r.kind}::${r.slug}`;
    if (!realLocalesBySlug.has(key)) realLocalesBySlug.set(key, new Set());
    realLocalesBySlug.get(key)!.add(r.locale);
  }

  const dynamicPages: MetadataRoute.Sitemap = rows.map((r) => {
    const key = `${r.kind}::${r.slug}`;
    const realSet = realLocalesBySlug.get(key) ?? new Set([r.locale]);
    const path = pathFor(r.kind, r.slug);
    const priority = r.kind === "topic" ? 0.9 : r.kind === "physicist" ? 0.6 : 0.5;
    return entry(path, r.locale, realSet, r.updated_at ?? now, "monthly", priority);
  });

  return [...staticPages, ...branchPages, ...dynamicPages];
}
```

- [ ] **Step 2: Verify build still passes**

Run: `pnpm build` (or at minimum `pnpm tsc --noEmit`)
Expected: no TypeScript errors

- [ ] **Step 3: Verify sitemap renders**

Run: `pnpm dev` (in another terminal)
Visit: `http://localhost:3000/sitemap.xml`
Expected: XML with EN URLs only, no `/he/` URLs unless a HE row exists in `content_entries`

- [ ] **Step 4: Commit**

```bash
git add app/sitemap.ts
git commit -m "feat(seo): rewrite sitemap — only emit URLs with real content_entries rows"
```

---

## Task 10: Robots rewrite

**Files:**
- Modify: `app/robots.ts`

- [ ] **Step 1: Replace implementation**

```ts
// app/robots.ts
import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/auth/", "/sign-in", "/account", "/sandbox", "/billing"],
      },
    ],
    sitemap: `${SITE.baseUrl}/sitemap.xml`,
    host: SITE.baseUrl,
  };
}
```

- [ ] **Step 2: Verify**

Run: `pnpm dev`
Visit: `http://localhost:3000/robots.txt`
Expected: contains `Disallow: /api/`, `Disallow: /sign-in`, `Sitemap: https://physics.it.com/sitemap.xml`

- [ ] **Step 3: Commit**

```bash
git add app/robots.ts
git commit -m "feat(seo): tighten robots.txt — explicit disallow for auth/api/account/sandbox"
```

---

## Task 11: Root layout metadata upgrade

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Update root metadata block**

Replace the existing `export const metadata = { ... }` (lines 27-38) with:

```tsx
// app/layout.tsx
import { SITE } from "@/lib/seo/config";

// ...existing imports...

export const metadata = {
  metadataBase: new URL(SITE.baseUrl),
  title: {
    default: `${SITE.name} — visual physics explainers`,
    template: `%s — ${SITE.name}`,
  },
  applicationName: SITE.name,
  description: SITE.tagline,
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-icon.png",
  },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: `${SITE.name} — visual physics explainers`,
    description: SITE.tagline,
    images: [{ url: SITE.defaultOgImage, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.name,
    description: SITE.tagline,
    images: [SITE.defaultOgImage],
  },
};
```

- [ ] **Step 2: Verify build**

Run: `pnpm tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat(seo): upgrade root metadata — metadataBase, OG, twitter, title template"
```

---

## Task 12: Homepage WebSite JSON-LD

**Files:**
- Modify: `app/[locale]/page.tsx`

- [ ] **Step 1: Add JsonLd to homepage**

Insert at the top of the JSX returned by `HomePage`, just inside `<main>`:

```tsx
// app/[locale]/page.tsx
import { JsonLd } from "@/components/seo/jsonld";
import { buildWebSiteJsonLd } from "@/lib/seo/jsonld";

// ...inside the return:
<main className="pb-16 md:pb-32">
  <JsonLd data={buildWebSiteJsonLd()} />
  <HeroSection />
  {/* ... */}
</main>
```

- [ ] **Step 2: Verify**

Run: `pnpm dev`
Visit: `http://localhost:3000/`
View source → confirm `<script type="application/ld+json">` containing `"@type":"WebSite"` and `"SearchAction"`.

- [ ] **Step 3: Commit**

```bash
git add app/[locale]/page.tsx
git commit -m "feat(seo): add WebSite + SearchAction JSON-LD to homepage"
```

---

## Task 13: OG template — shared shell

**Files:**
- Create: `lib/seo/og-templates/shared.tsx`

- [ ] **Step 1: Implement shared OG layout**

```tsx
// lib/seo/og-templates/shared.tsx
import { ImageResponse } from "next/og";
import { isRtlLocale } from "@/i18n/config";

export const OG_SIZE = { width: 1200, height: 630 } as const;

interface CardArgs {
  locale: string;
  eyebrow: string;          // top-right tag, e.g. "§ 16 OSCILLATIONS"
  title: string;            // big centered text
  subtitle?: string;        // small line below
}

const BG = "#0F1115";
const FG_PRIMARY = "#F5F7FA";
const FG_SECONDARY = "#9AA3B2";
const ACCENT = "#7DD3FC";

export function renderCard({ locale, eyebrow, title, subtitle }: CardArgs): ImageResponse {
  const dir: "ltr" | "rtl" = isRtlLocale(locale) ? "rtl" : "ltr";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: BG,
          padding: "60px 80px",
          fontFamily: "Inter, system-ui",
          direction: dir,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: FG_SECONDARY,
            fontSize: 22,
            letterSpacing: 4,
            textTransform: "uppercase",
          }}
        >
          <span style={{ color: FG_PRIMARY, fontWeight: 700 }}>physics</span>
          <span>{eyebrow}</span>
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: dir === "rtl" ? "flex-end" : "flex-start",
          }}
        >
          <div
            style={{
              fontSize: 88,
              lineHeight: 1.05,
              color: FG_PRIMARY,
              fontWeight: 700,
              letterSpacing: -1.5,
              maxWidth: "100%",
              wordBreak: "break-word",
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div
              style={{
                marginTop: 24,
                fontSize: 32,
                color: FG_SECONDARY,
                lineHeight: 1.3,
                maxWidth: 1000,
              }}
            >
              {subtitle}
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: dir === "rtl" ? "flex-start" : "flex-end",
            color: ACCENT,
            fontSize: 18,
            letterSpacing: 3,
            textTransform: "uppercase",
          }}
        >
          physics.it.com
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/seo/og-templates/shared.tsx
git commit -m "feat(seo): add shared OG card template — RTL-aware layout"
```

---

## Task 14: OG topic-card template

**Files:**
- Create: `lib/seo/og-templates/topic-card.tsx`

- [ ] **Step 1: Implement**

```tsx
// lib/seo/og-templates/topic-card.tsx
import { getContentEntry } from "@/lib/content/fetch";
import { getBranch } from "@/lib/content/branches";
import { renderCard } from "./shared";

export async function topicOgImage({
  slug,
  locale,
}: {
  slug: string;
  locale: string;
}) {
  const entry = await getContentEntry("topic", slug, locale);
  if (!entry) return renderCard({ locale, eyebrow: "physics", title: "physics" });

  const branchSlug = slug.split("/")[0];
  const branch = getBranch(branchSlug);
  const eyebrow = branch ? `§ ${branch.title}` : "physics";

  return renderCard({
    locale,
    eyebrow,
    title: entry.title,
    subtitle: entry.subtitle ?? undefined,
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/seo/og-templates/topic-card.tsx
git commit -m "feat(seo): add OG card template for topic pages"
```

---

## Task 15: OG glossary-card template

**Files:**
- Create: `lib/seo/og-templates/glossary-card.tsx`

- [ ] **Step 1: Implement**

```tsx
// lib/seo/og-templates/glossary-card.tsx
import { getContentEntry } from "@/lib/content/fetch";
import { renderCard } from "./shared";

export async function glossaryOgImage({
  slug,
  locale,
}: {
  slug: string;
  locale: string;
}) {
  const entry = await getContentEntry("glossary", slug, locale);
  if (!entry) return renderCard({ locale, eyebrow: "physics", title: "physics" });

  return renderCard({
    locale,
    eyebrow: "§ Dictionary",
    title: entry.title,
    subtitle: entry.subtitle ?? undefined,
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/seo/og-templates/glossary-card.tsx
git commit -m "feat(seo): add OG card template for dictionary entries"
```

---

## Task 16: OG physicist-card template

**Files:**
- Create: `lib/seo/og-templates/physicist-card.tsx`

- [ ] **Step 1: Implement**

```tsx
// lib/seo/og-templates/physicist-card.tsx
import { getContentEntry } from "@/lib/content/fetch";
import { renderCard } from "./shared";

export async function physicistOgImage({
  slug,
  locale,
}: {
  slug: string;
  locale: string;
}) {
  const entry = await getContentEntry("physicist", slug, locale);
  if (!entry) return renderCard({ locale, eyebrow: "physics", title: "physics" });

  const meta = entry.meta as { born?: string; died?: string; nationality?: string };
  const dates = meta.born && meta.died ? `${meta.born}–${meta.died}` : "";
  const eyebrow = `§ Physicist${dates ? ` · ${dates}` : ""}`;

  return renderCard({
    locale,
    eyebrow,
    title: entry.title,
    subtitle: entry.subtitle ?? meta.nationality ?? undefined,
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/seo/og-templates/physicist-card.tsx
git commit -m "feat(seo): add OG card template for physicist profiles"
```

---

## Task 17: Glossary slug page — wire metadata, SEO, OG

**Files:**
- Modify: `app/[locale]/dictionary/[slug]/page.tsx`
- Create: `app/[locale]/dictionary/[slug]/opengraph-image.tsx`

- [ ] **Step 1: Replace the existing `generateMetadata` in `dictionary/[slug]/page.tsx`**

Find the existing `generateMetadata` (around line 156) and replace with:

```tsx
// app/[locale]/dictionary/[slug]/page.tsx
import { makeTopicMetadata } from "@/lib/seo/topic-metadata";
import { TopicPageSeo } from "@/components/seo/topic-page-seo";

// ...existing imports + generateStaticParams stay...

// generateMetadata is now per-slug — pass through to the dynamic helper
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  return makeTopicMetadata("glossary", slug)({ params });
}
```

Then add `<TopicPageSeo kind="glossary" slug={slug} />` as the first child of the returned `<ArticleLayout>` JSX. Specifically, modify the `return` block (around line 262) to:

```tsx
  return (
    <ArticleLayout aside={asideLinks.length > 0 ? <AsideLinks links={asideLinks} /> : undefined}>
      <TopicPageSeo kind="glossary" slug={slug} />
      <TopicHeader
        eyebrow={...}
        title={displayTerm}
        subtitle={displayShort}
      />
      {/* ...rest unchanged */}
```

- [ ] **Step 2: Create the dynamic OG image**

```tsx
// app/[locale]/dictionary/[slug]/opengraph-image.tsx
import { glossaryOgImage } from "@/lib/seo/og-templates/glossary-card";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  return glossaryOgImage({ slug: params.slug, locale: params.locale });
}
```

- [ ] **Step 3: Verify**

Run: `pnpm dev`
Visit: `http://localhost:3000/dictionary/angular-momentum`
View source → confirm:
  - `<title>` is `Angular momentum — Dictionary — physics` (or similar)
  - `<meta name="description">` is the entry's subtitle
  - `<script type="application/ld+json">` contains `"@type":"DefinedTerm"`
  - `<meta property="og:image">` points to `/dictionary/angular-momentum/opengraph-image`

Visit: `http://localhost:3000/dictionary/angular-momentum/opengraph-image`
Expected: 1200×630 PNG with the term name as title

- [ ] **Step 4: Commit**

```bash
git add app/[locale]/dictionary/[slug]/page.tsx app/[locale]/dictionary/[slug]/opengraph-image.tsx
git commit -m "feat(seo): wire glossary pages — unique metadata, JSON-LD, dynamic OG"
```

---

## Task 18: Physicist slug page — wire metadata, SEO, OG

**Files:**
- Modify: `app/[locale]/physicists/[slug]/page.tsx`
- Create: `app/[locale]/physicists/[slug]/opengraph-image.tsx`

- [ ] **Step 1: Replace the existing `generateMetadata`**

```tsx
// app/[locale]/physicists/[slug]/page.tsx
import { makeTopicMetadata } from "@/lib/seo/topic-metadata";
import { TopicPageSeo } from "@/components/seo/topic-page-seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  return makeTopicMetadata("physicist", slug)({ params });
}
```

Add `<TopicPageSeo kind="physicist" slug={slug} />` as the first child of the page's main returned JSX (inside the article layout, before the header).

- [ ] **Step 2: Create dynamic OG image**

```tsx
// app/[locale]/physicists/[slug]/opengraph-image.tsx
import { physicistOgImage } from "@/lib/seo/og-templates/physicist-card";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  return physicistOgImage({ slug: params.slug, locale: params.locale });
}
```

- [ ] **Step 3: Verify**

Visit `http://localhost:3000/physicists/isaac-newton` and check source for `"@type":"Person"` and `og:type` = `profile`.

- [ ] **Step 4: Commit**

```bash
git add app/[locale]/physicists/[slug]/page.tsx app/[locale]/physicists/[slug]/opengraph-image.tsx
git commit -m "feat(seo): wire physicist pages — Person JSON-LD, profile OG, dynamic image"
```

---

## Task 19: Branch index pages — upgrade metadata

**Files:**
- Modify: `app/[locale]/[branch]/page.tsx`

- [ ] **Step 1: Replace the `generateMetadata` block (lines 17-37) with:**

```tsx
// app/[locale]/[branch]/page.tsx
import { makeBranchMetadata } from "@/lib/seo/topic-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; branch: string }>;
}) {
  const { branch } = await params;
  return makeBranchMetadata(branch)({ params: Promise.resolve({ locale: (await params).locale }) });
}
```

- [ ] **Step 2: Verify**

Visit `http://localhost:3000/classical-mechanics` and check `<title>` and `og:image` exist.

- [ ] **Step 3: Commit**

```bash
git add app/[locale]/[branch]/page.tsx
git commit -m "feat(seo): upgrade branch index metadata — canonical, OG, twitter"
```

---

## Task 20: Codemod — add SEO to all 130 topic pages

**Files:**
- Create: `scripts/seo/apply-codemod.ts`
- Modifies: 130 topic `page.tsx` files
- Creates: 130 `opengraph-image.tsx` delegate files

- [ ] **Step 1: Implement codemod script**

```ts
// scripts/seo/apply-codemod.ts
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import fg from "fast-glob";

const ROOT = process.cwd();
const TOPICS_GLOB = "app/[locale]/(topics)/*/*/page.tsx";

interface PageInfo {
  pagePath: string;       // absolute
  dir: string;            // absolute dir of the page.tsx
  slug: string;           // e.g. "classical-mechanics/the-simple-pendulum"
  ogPath: string;         // sibling opengraph-image.tsx path
}

const SLUG_REGEX = /const SLUG\s*=\s*"([^"]+)"/;

function discover(): PageInfo[] {
  const files = fg.sync(TOPICS_GLOB, { cwd: ROOT, absolute: true });
  const out: PageInfo[] = [];
  for (const file of files) {
    const content = readFileSync(file, "utf-8");
    const m = content.match(SLUG_REGEX);
    if (!m) {
      console.warn(`SKIP — no SLUG constant: ${file}`);
      continue;
    }
    const dir = file.replace(/\/page\.tsx$/, "");
    out.push({
      pagePath: file,
      dir,
      slug: m[1],
      ogPath: join(dir, "opengraph-image.tsx"),
    });
  }
  return out;
}

const HELPER_IMPORT = `import { makeTopicMetadata } from "@/lib/seo/topic-metadata";\nimport { TopicPageSeo } from "@/components/seo/topic-page-seo";`;

function patchPage(content: string, slug: string): string {
  if (content.includes("makeTopicMetadata")) return content; // idempotent

  // Insert imports after the last existing top-level import.
  const importMatches = [...content.matchAll(/^import .+ from .+;$/gm)];
  const lastImport = importMatches[importMatches.length - 1];
  if (!lastImport) throw new Error("no imports found");
  const insertAt = lastImport.index! + lastImport[0].length;
  let next =
    content.slice(0, insertAt) +
    `\n${HELPER_IMPORT}` +
    content.slice(insertAt);

  // Add export const generateMetadata after the SLUG line.
  next = next.replace(
    /(const SLUG\s*=\s*"[^"]+";)/,
    `$1\n\nexport const generateMetadata = makeTopicMetadata("topic", SLUG);`,
  );

  // Insert <TopicPageSeo /> as the first child of TopicPageLayout.
  next = next.replace(
    /<TopicPageLayout([^>]*)>/,
    `<TopicPageLayout$1>\n      <TopicPageSeo kind="topic" slug={SLUG} />`,
  );

  return next;
}

const OG_DELEGATE = (slug: string) => `import { topicOgImage } from "@/lib/seo/og-templates/topic-card";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: { locale: string };
}) {
  return topicOgImage({ slug: "${slug}", locale: params.locale });
}
`;

function main() {
  const pages = discover();
  console.log(`Discovered ${pages.length} topic pages`);

  let modified = 0;
  let ogCreated = 0;

  for (const p of pages) {
    const original = readFileSync(p.pagePath, "utf-8");
    const patched = patchPage(original, p.slug);
    if (patched !== original) {
      writeFileSync(p.pagePath, patched);
      modified++;
    }
    if (!existsSync(p.ogPath)) {
      writeFileSync(p.ogPath, OG_DELEGATE(p.slug));
      ogCreated++;
    }
  }

  console.log(`Modified ${modified} page.tsx files`);
  console.log(`Created ${ogCreated} opengraph-image.tsx delegates`);
}

main();
```

- [ ] **Step 2: Add a test before running on real files**

```ts
// tests/seo/codemod.test.ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

// Trick: run codemod against a single test fixture in-memory by importing the patch fn.
// (Refactor patchPage to be exported from the script for testing.)
import { patchPage } from "@/scripts/seo/apply-codemod";

const FIXTURE = `import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { locales } from "@/i18n/config";
import { getContentEntry } from "@/lib/content/fetch";
import { ContentBlocks } from "@/components/content/content-blocks";
import { TopicHeader } from "@/components/layout/topic-header";
import { TopicPageLayout } from "@/components/layout/topic-page-layout";
import type { AsideLink } from "@/components/layout/aside-links";

const SLUG = "classical-mechanics/the-simple-pendulum";

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

  const entry = await getContentEntry("topic", SLUG, locale);
  if (!entry) notFound();

  const aside = Array.isArray(entry.meta.aside)
    ? (entry.meta.aside as AsideLink[])
    : [];
  const eyebrow =
    typeof entry.meta.eyebrow === "string" ? entry.meta.eyebrow : "";

  return (
    <TopicPageLayout aside={aside}>
      <TopicHeader
        eyebrow={eyebrow}
        title={entry.title}
        subtitle={entry.subtitle ?? ""}
      />
      <ContentBlocks blocks={entry.blocks} />
    </TopicPageLayout>
  );
}
`;

describe("apply-codemod patchPage", () => {
  it("adds imports, generateMetadata export, and TopicPageSeo child", () => {
    const out = patchPage(FIXTURE, "classical-mechanics/the-simple-pendulum");
    expect(out).toContain('import { makeTopicMetadata } from "@/lib/seo/topic-metadata";');
    expect(out).toContain('export const generateMetadata = makeTopicMetadata("topic", SLUG);');
    expect(out).toContain('<TopicPageSeo kind="topic" slug={SLUG} />');
  });

  it("is idempotent — running twice produces the same output", () => {
    const once = patchPage(FIXTURE, "x/y");
    const twice = patchPage(once, "x/y");
    expect(twice).toBe(once);
  });
});
```

To make this work, ensure `scripts/seo/apply-codemod.ts` exports `patchPage`:

```ts
// at the top of scripts/seo/apply-codemod.ts, change:
function patchPage(...)
// to:
export function patchPage(...)
```

- [ ] **Step 3: Run codemod test**

Run: `pnpm vitest run tests/seo/codemod.test.ts`
Expected: PASS — 2 tests

- [ ] **Step 4: Wire script to package.json**

Add to `package.json` scripts:

```json
"seo:codemod": "tsx scripts/seo/apply-codemod.ts"
```

- [ ] **Step 5: Run on real files**

Run: `pnpm seo:codemod`
Expected output: `Discovered 130 topic pages`, `Modified 130 page.tsx files`, `Created 130 opengraph-image.tsx delegates`

- [ ] **Step 6: Spot-check a modified page**

Run: `head -25 app/[locale]/\(topics\)/classical-mechanics/the-simple-pendulum/page.tsx`
Expected: includes the new imports + `export const generateMetadata` line

Run: `cat app/[locale]/\(topics\)/classical-mechanics/the-simple-pendulum/opengraph-image.tsx`
Expected: 3-line delegate file present

- [ ] **Step 7: Verify build**

Run: `pnpm tsc --noEmit`
Expected: no TypeScript errors

- [ ] **Step 8: Commit**

```bash
git add scripts/seo/apply-codemod.ts tests/seo/codemod.test.ts package.json
git add 'app/[locale]/(topics)'
git commit -m "feat(seo): apply codemod — add metadata + JSON-LD + OG to all 130 topic pages"
```

---

## Task 21: Uniqueness checker

**Files:**
- Create: `scripts/seo/check-uniqueness.ts`

- [ ] **Step 1: Implement**

```ts
// scripts/seo/check-uniqueness.ts
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { createClient } from "@supabase/supabase-js";
import { getBranch } from "../../lib/content/branches";
import { buildTitle } from "../../lib/seo/title";
import { extractDescription } from "../../lib/seo/description";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error("missing supabase env vars");
  process.exit(1);
}
const supabase = createClient(url, key);

async function main() {
  const { data, error } = await supabase
    .from("content_entries")
    .select("kind, slug, title, subtitle, blocks, meta")
    .eq("locale", "en");
  if (error) throw error;

  const titleMap = new Map<string, string[]>();
  const descMap = new Map<string, string[]>();

  for (const row of data ?? []) {
    const branchTitle =
      row.kind === "topic" ? getBranch(row.slug.split("/")[0])?.title ?? null : null;
    const title = buildTitle(
      { title: row.title, meta: row.meta as Record<string, unknown> },
      branchTitle ? { title: branchTitle } : null,
    );
    const desc = extractDescription({
      subtitle: row.subtitle,
      blocks: (row.blocks ?? []) as never,
      meta: row.meta as Record<string, unknown>,
    });

    const tBucket = titleMap.get(title) ?? [];
    tBucket.push(`${row.kind}::${row.slug}`);
    titleMap.set(title, tBucket);

    const dBucket = descMap.get(desc) ?? [];
    dBucket.push(`${row.kind}::${row.slug}`);
    descMap.set(desc, dBucket);
  }

  let issues = 0;
  for (const [title, slugs] of titleMap) {
    if (slugs.length > 1) {
      console.error(`DUPLICATE TITLE — "${title}" used by:`);
      for (const s of slugs) console.error(`  - ${s}`);
      issues++;
    }
  }
  for (const [desc, slugs] of descMap) {
    if (slugs.length > 1 && desc.length > 0) {
      console.error(`DUPLICATE DESCRIPTION — "${desc.slice(0, 60)}…" used by:`);
      for (const s of slugs) console.error(`  - ${s}`);
      issues++;
    }
  }

  if (issues > 0) {
    console.error(`\n${issues} uniqueness issue(s) found.`);
    process.exit(1);
  }
  console.log(`OK — ${data?.length ?? 0} rows checked, all titles + descriptions unique.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 2: Wire to package.json**

Add to `scripts`:

```json
"seo:check": "tsx scripts/seo/check-uniqueness.ts"
```

- [ ] **Step 3: Run it**

Run: `pnpm seo:check`
Expected: prints OK with row count, OR prints duplicates which indicate hand-edited content needing `meta.seoTitle`/`meta.seoDescription` overrides. (Do NOT mass-fix here — record any duplicates for follow-up.)

- [ ] **Step 4: Commit**

```bash
git add scripts/seo/check-uniqueness.ts package.json
git commit -m "feat(seo): add uniqueness checker — fail-fast on duplicate titles/descriptions"
```

---

## Task 22: IndexNow script

**Files:**
- Create: `scripts/seo/indexnow.ts`

- [ ] **Step 1: Implement**

```ts
// scripts/seo/indexnow.ts
import { createHash } from "node:crypto";
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

const SITE_URL = "https://physics.it.com";
const KEY = process.env.INDEXNOW_KEY;
if (!KEY) {
  console.error("Missing INDEXNOW_KEY in .env — generate at https://www.bing.com/indexnow + add to env");
  process.exit(1);
}

async function fetchSitemapUrls(): Promise<string[]> {
  const res = await fetch(`${SITE_URL}/sitemap.xml`);
  const xml = await res.text();
  return Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1]);
}

async function main() {
  const urls = await fetchSitemapUrls();
  console.log(`Submitting ${urls.length} URLs to IndexNow…`);

  const body = {
    host: new URL(SITE_URL).host,
    key: KEY,
    keyLocation: `${SITE_URL}/${KEY}.txt`,
    urlList: urls,
  };

  const res = await fetch("https://api.indexnow.org/IndexNow", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  console.log(`Status: ${res.status}`);
  const text = await res.text();
  if (text) console.log(text);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 2: Wire to package.json**

Add:

```json
"seo:indexnow": "tsx scripts/seo/indexnow.ts"
```

- [ ] **Step 3: Document** — add to `.env.example`:

```
# IndexNow — generate at https://www.bing.com/indexnow, then create public/{KEY}.txt containing the key
INDEXNOW_KEY=
```

- [ ] **Step 4: Commit**

```bash
git add scripts/seo/indexnow.ts package.json .env.example
git commit -m "feat(seo): add IndexNow submission script"
```

---

## Task 23: Local end-to-end verification

This task does not modify code. It verifies the whole stack works on `pnpm dev`.

- [ ] **Step 1: Start dev server**

Run: `pnpm dev`
Wait for `ready on http://localhost:3000`

- [ ] **Step 2: Verify five representative pages**

For each URL below, view-source and confirm:
- Unique `<title>` matching the topic
- Unique `<meta name="description">`
- `<meta property="og:image">` pointing to `/{path}/opengraph-image`
- `<link rel="canonical">` matches the URL
- One `<script type="application/ld+json">` with `Article`/`DefinedTerm`/`Person` (depending on type)
- One more `<script type="application/ld+json">` with `BreadcrumbList`

URLs to check:
1. `http://localhost:3000/` — homepage (WebSite JSON-LD)
2. `http://localhost:3000/classical-mechanics` — branch (canonical + OG)
3. `http://localhost:3000/classical-mechanics/the-simple-pendulum` — topic (Article + Breadcrumb JSON-LD)
4. `http://localhost:3000/dictionary/angular-momentum` — glossary (DefinedTerm + Breadcrumb)
5. `http://localhost:3000/physicists/isaac-newton` — physicist (Person + Breadcrumb, og:type=profile)

- [ ] **Step 3: Verify three OG images render**

Visit:
1. `http://localhost:3000/classical-mechanics/the-simple-pendulum/opengraph-image`
2. `http://localhost:3000/dictionary/angular-momentum/opengraph-image`
3. `http://localhost:3000/physicists/isaac-newton/opengraph-image`

Each should return a 1200×630 PNG with the expected title text.

- [ ] **Step 4: Verify Hebrew page is noindex**

Visit `http://localhost:3000/he/classical-mechanics/the-simple-pendulum` (assuming no HE row exists).
View source → confirm `<meta name="robots" content="noindex,follow">` and canonical pointing to the EN URL.

- [ ] **Step 5: Verify sitemap and robots**

Visit:
- `http://localhost:3000/sitemap.xml` — confirm only EN URLs (no `/he/` unless real HE rows exist)
- `http://localhost:3000/robots.txt` — confirm `Disallow: /api/`, `Sitemap: https://physics.it.com/sitemap.xml`

- [ ] **Step 6: Run full test suite**

Run: `pnpm test`
Expected: PASS — all SEO tests + existing tests green

- [ ] **Step 7: Run uniqueness check**

Run: `pnpm seo:check`
Expected: OK — N rows checked, no duplicates. (If duplicates appear, capture in `docs/seo/uniqueness-issues.md` for Session 2 follow-up — do NOT block this PR.)

- [ ] **Step 8: Run TypeScript check**

Run: `pnpm tsc --noEmit`
Expected: no errors

- [ ] **Step 9: Commit verification log**

```bash
mkdir -p docs/seo
# (optional) write notes to docs/seo/session-1-verification.md if anything notable
git add docs/seo/ 2>/dev/null || true
git commit -m "docs(seo): session 1 verification log" --allow-empty
```

---

## Task 24: Push and open PR

- [ ] **Step 1: Confirm clean state**

Run: `git status`
Expected: clean working tree on the SEO branch

- [ ] **Step 2: Push to remote**

```bash
git push -u origin HEAD
```

- [ ] **Step 3: Open PR**

```bash
gh pr create --title "feat(seo): foundation — unique metadata, schema, OG images for all content" --body "$(cat <<'EOF'
## Summary
- Adds unique `<title>`, `<meta description>`, OG, twitter, canonical, hreflang to all 130 topic pages, 36 glossary entries, 17 physicist profiles, 3 branch indexes
- Adds JSON-LD schema: Article (topics), DefinedTerm (glossary), Person (physicists), BreadcrumbList (everywhere), WebSite + SearchAction (homepage)
- Auto-generates per-topic OG images via Edge runtime
- Rewrites sitemap to only emit URLs with real `content_entries` rows (no phantom HE entries)
- Tightens robots.txt — explicit disallow for /api/, /auth/, /sign-in, /account, /sandbox, /billing
- Locale strategy A: untranslated locales auto-flip to noindex,follow + canonical-back-to-EN

## Test plan
- [ ] `pnpm test` — all green (unit tests for title, description, jsonld, topic-metadata, locale-alternates, codemod)
- [ ] `pnpm seo:check` — no duplicate titles or descriptions
- [ ] `pnpm tsc --noEmit` — clean
- [ ] Vercel preview deploy — view-source on 5 representative pages, confirm unique metadata + JSON-LD
- [ ] Vercel preview deploy — visit 3 `/path/opengraph-image` URLs, confirm 1200×630 PNGs render
- [ ] Vercel preview deploy — visit `/sitemap.xml`, confirm EN-only output

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-review notes

Cross-checked against `docs/superpowers/specs/2026-04-30-seo-foundation-design.md`:

- ✅ Per-page metadata contract — Tasks 8, 17, 18, 19, 20
- ✅ JSON-LD schema (Article, DefinedTerm, Person, BreadcrumbList, WebSite) — Tasks 5, 6, 7, 12
- ✅ OG images (3 templates + 130 delegates + 2 dynamic-route files) — Tasks 13, 14, 15, 16, 17, 18, 20
- ✅ Sitemap rewrite — Task 9
- ✅ Robots rewrite — Task 10
- ✅ Root metadata upgrade — Task 11
- ✅ Build-time uniqueness validator — Task 21
- ✅ IndexNow script — Task 22
- ✅ Codemod across 130 topic pages — Task 20
- ✅ Locale-aware architecture (noindex fallback, hreflang only for real rows) — Tasks 4, 8, 9
- ✅ End-to-end verification — Task 23

No spec sections without a corresponding task. No placeholders or TBDs. Type names consistent across tasks (`makeTopicMetadata`, `TopicPageSeo`, `topicOgImage`, `glossaryOgImage`, `physicistOgImage`, `buildTitle`, `extractDescription`, `getRealLocaleSet`).
