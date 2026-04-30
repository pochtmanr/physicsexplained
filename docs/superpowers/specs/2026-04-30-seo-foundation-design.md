# SEO Foundation — Get All 130 Topics Indexed

**Status:** Design approved 2026-04-30 — ready for plan
**Owner:** Roman
**Scope:** Foundation-only SEO (zero new prose). English indexing only; multi-locale architecture from day 1.

---

## Why this exists

`physics.it.com` has a sitemap of ~271 URLs but only 1 page indexed by Google. The smoking gun: **none of the 130 topic `page.tsx` files define `generateMetadata`.** Every topic renders with the root `<title>physics</title>` and the same fallback description, so Google sees 130 URLs with identical metadata, consolidates to one canonical, and drops the rest. The Hebrew duplicate-content layer compounds the problem but isn't the root cause.

This spec ships the technical-SEO foundation so Google can see every page as a distinct, high-quality result. Zero new prose required — the existing hand-written `entry.subtitle` field on every topic is already a unique, SERP-ready description. We just expose it.

---

## Decisions locked during brainstorming

1. **Locale strategy: English-only indexing for now.** `/he/*` pages with `localeFallback=true` get `noindex,follow` + canonical-back-to-EN. They do not appear in `sitemap.xml`. They do not appear in any other page's `hreflang` alternates. When a real HE row exists per slug, that page auto-flips to indexable.
2. **Architecture is locale-agnostic from day 1.** Adding Arabic in 6 months = add `"ar"` to `i18n/config.ts`, populate Supabase rows with `locale='ar'`, everything indexes automatically. Zero SEO refactor. RTL plumbing already works.
3. **Foundation-only this round.** No new prose, no FAQ writing, no "X vs Y" pages, no dictionary expansion. We measure indexing 2-4 weeks after launch and decide content-gap work from real data.
4. **One big PR for Session 1.** The codemod across 130 files is mechanical; splitting into parallel agents is theatre that costs more tokens than it saves.

---

## Architecture

### New modules

```
lib/seo/
├── config.ts                # SITE constants — base URL, name, defaults
├── topic-metadata.ts        # makeTopicMetadata(kind, slug) → generateMetadata
├── description.ts           # extractDescription(entry) — subtitle | meta.seoDescription | first ¶ truncated
├── title.ts                 # buildTitle(entry, branch) — auto-trim chain
└── jsonld.ts                # buildArticleJsonLd, buildBreadcrumbJsonLd, buildPersonJsonLd, buildDefinedTermJsonLd, buildWebSiteJsonLd

components/seo/
├── jsonld.tsx               # <JsonLd data={...}> — server component renders <script type="application/ld+json">
└── topic-page-seo.tsx       # composes Article + Breadcrumb JSON-LD per entry kind

lib/seo/og-templates/
├── topic-card.tsx           # shared OG template — reads (branch, topic) entry → JSX → ImageResponse
├── glossary-card.tsx        # shared OG template for glossary
└── physicist-card.tsx       # shared OG template for physicist

# Per-route OG image files — one-line delegates to the shared templates above.
# Codemod creates these alongside each existing page.tsx. Required because each
# topic is a static route (not a dynamic [branch]/[topic] segment).
app/[locale]/(topics)/{branch}/{topic}/opengraph-image.tsx  # 130 files, each ~3 lines
app/[locale]/dictionary/[slug]/opengraph-image.tsx          # 1 file (uses [slug] dynamic segment)
app/[locale]/physicists/[slug]/opengraph-image.tsx          # 1 file

scripts/seo/
├── check-uniqueness.ts      # build-time validator — fails if two pages share title/description
└── indexnow.ts              # POST sitemap URLs to IndexNow API (Bing, Yandex, Naver)
```

### Public API — what page.tsx files consume

```ts
import { makeTopicMetadata } from "@/lib/seo/topic-metadata";
import { TopicPageSeo } from "@/components/seo/topic-page-seo";

const SLUG = "classical-mechanics/the-simple-pendulum";
export const generateMetadata = makeTopicMetadata("topic", SLUG);

// inside the JSX:
<TopicPageSeo kind="topic" slug={SLUG} />
```

Two lines per page.tsx. Same shape works for `dictionary/[slug]` and `physicists/[slug]` — pass `kind="glossary"` or `kind="physicist"`. The helper handles all locale logic, fallback indexing, OG, alternates, and JSON-LD.

### `makeTopicMetadata` internal contract

1. Fetch `getContentEntry(kind, slug, locale)` — already `cache()`-wrapped, no duplicate DB hit
2. Compute title via `entry.meta.seoTitle ?? buildTitle(entry, branch)`
3. Compute description via `extractDescription(entry)` — `meta.seoDescription` → `entry.subtitle` → first paragraph truncated to 155 chars
4. Set `metadataBase: new URL(SITE.baseUrl)` so all OG/canonical URLs become absolute
5. Set `alternates.canonical` — locale-specific URL when real, EN URL when `localeFallback=true`
6. Set `alternates.languages` only for sibling locales where a real (non-fallback) row exists
7. Set `robots: entry.localeFallback ? { index: false, follow: true } : undefined`
8. Set `openGraph` and `twitter` with title, description, locale, type, image=auto-generated OG

### Edits to existing files

- `app/sitemap.ts` — filter rows where `localeFallback === true`; only emit hreflang for real rows. Today: EN-only output. The day Hebrew lands per-row, that slug auto-gains a `/he/...` URL with `en ↔ he` cross-references.
- `app/robots.ts` — add explicit `disallow` for `/api/`, `/auth/`, `/sign-in`, `/account`, `/sandbox`, `/billing`. Keep everything else.
- `app/layout.tsx` — upgrade root `metadata` (proper `metadataBase`, `applicationName`, default OG)
- `app/[locale]/page.tsx` — add `<JsonLd data={buildWebSiteJsonLd()} />` (homepage gets `WebSite` + `SearchAction`)

`lib/content/fetch.ts` is unchanged — it already exposes `localeFallback`. The metadata helper does one extra `fetchOne` per non-default locale to detect sibling translations; for 2 locales today this is fine. If we ever support 5+ locales, add a helper `getRealLocaleSlugs(slug)` that does a single grouped query.

---

## Per-page metadata contract

### Topic pages (`/{branch}/{topic}`)

**Example: `/classical-mechanics/the-simple-pendulum` (locale=en, no localeFallback)**

```ts
{
  metadataBase: new URL("https://physics.it.com"),
  title: "The Simple Pendulum — Classical Mechanics — physics",
  description: "Why every clock that ever ticked ticked the same way.",
  alternates: {
    canonical: "https://physics.it.com/classical-mechanics/the-simple-pendulum",
    languages: {
      // Hebrew omitted — no real he-locale row yet.
    },
  },
  openGraph: {
    type: "article",
    url: "https://physics.it.com/classical-mechanics/the-simple-pendulum",
    siteName: "physics",
    locale: "en_US",
    title: "The Simple Pendulum — Classical Mechanics",
    description: "Why every clock that ever ticked ticked the same way.",
    images: [{ url: "/classical-mechanics/the-simple-pendulum/opengraph-image", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Simple Pendulum",
    description: "Why every clock that ever ticked ticked the same way.",
    images: ["/classical-mechanics/the-simple-pendulum/opengraph-image"],
  },
}
```

**Same topic but locale=he, localeFallback=true (HE row missing):**

```ts
{
  title: "The Simple Pendulum — Classical Mechanics — physics",
  description: "Why every clock that ever ticked ticked the same way.",
  alternates: {
    canonical: "https://physics.it.com/classical-mechanics/the-simple-pendulum",  // canonical → EN
  },
  robots: { index: false, follow: true },
  openGraph: { /* … */ locale: "he_IL" },
}
```

### Glossary entries (`/dictionary/{slug}`)

```ts
{
  title: "Angular momentum — Dictionary — physics",
  description: entry.subtitle,
  alternates: { canonical: "https://physics.it.com/dictionary/angular-momentum" },
  openGraph: { type: "article", url: ..., images: [{ url: "/dictionary/angular-momentum/opengraph-image" }] },
}
```

### Physicist profiles (`/physicists/{slug}`)

```ts
{
  title: "Isaac Newton (1643–1727) — physics",
  description: entry.subtitle ?? `${name}, ${nationality} ${role}.`,
  alternates: { canonical: "https://physics.it.com/physicists/isaac-newton" },
  openGraph: {
    type: "profile",
    profile: { firstName, lastName },
    images: [{ url: "/physicists/isaac-newton/opengraph-image" }],
  },
}
```

### Title length & auto-trim chain

Google truncates titles around 60 chars desktop, ~50 mobile. Some topic titles are long.

**`buildTitle(entry, branch)` logic:**
1. Try `\`${entry.title} — ${branch.title} — physics\`` (preferred)
2. If > 60 chars: try `\`${entry.title} — physics\``
3. If still > 60: just `entry.title`
4. `meta.seoTitle` override always wins if set

### Description waterfall

`extractDescription(entry)`:
1. `entry.meta.seoDescription` if set
2. `entry.subtitle` (already unique, ~80-130 chars — primary path for nearly every topic)
3. First paragraph from `entry.blocks`, strip markdown/inline math, truncate at last word boundary before 155 chars

---

## Schema markup (JSON-LD)

Server-side rendered via `<JsonLd data={…} />` inside each page tree.

### Topic pages → `Article`

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "The Simple Pendulum",
  "description": "Why every clock that ever ticked ticked the same way.",
  "url": "https://physics.it.com/classical-mechanics/the-simple-pendulum",
  "datePublished": "<entry.created_at>",
  "dateModified": "<entry.updated_at>",
  "inLanguage": "en",
  "image": "https://physics.it.com/classical-mechanics/the-simple-pendulum/opengraph-image",
  "mainEntityOfPage": "https://physics.it.com/classical-mechanics/the-simple-pendulum",
  "isPartOf": { "@type": "WebSite", "name": "physics", "url": "https://physics.it.com" },
  "author": { "@type": "Organization", "name": "physics", "url": "https://physics.it.com" },
  "publisher": {
    "@type": "Organization",
    "name": "physics",
    "url": "https://physics.it.com",
    "logo": { "@type": "ImageObject", "url": "https://physics.it.com/icon-512.png" }
  },
  "about": [
    { "@type": "Thing", "name": "Classical mechanics" },
    { "@type": "Thing", "name": "Pendulum" }
  ]
}
```

`about[]` is keyed off `relatedTopics` + `relatedGlossary` from `entry.meta` — gives Google explicit topical entities.

### Glossary entries → `DefinedTerm`

```json
{
  "@context": "https://schema.org",
  "@type": "DefinedTerm",
  "name": "Angular momentum",
  "description": "<entry.subtitle>",
  "url": "https://physics.it.com/dictionary/angular-momentum",
  "inDefinedTermSet": {
    "@type": "DefinedTermSet",
    "name": "physics dictionary",
    "url": "https://physics.it.com/dictionary"
  },
  "termCode": "angular-momentum"
}
```

### Physicist profiles → `Person`

```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Isaac Newton",
  "birthDate": "1643-01-04",
  "deathDate": "1727-03-31",
  "nationality": "English",
  "description": "<entry.subtitle>",
  "url": "https://physics.it.com/physicists/isaac-newton",
  "image": "https://physics.it.com/physicists/isaac-newton/opengraph-image",
  "knowsAbout": ["Calculus", "Optics", "Classical mechanics"],
  "sameAs": ["https://en.wikipedia.org/wiki/Isaac_Newton"]
}
```

`sameAs` reads from new optional `meta.sameAs: string[]` per physicist. Filled in over time.

### Breadcrumbs (every deep page)

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "physics", "item": "https://physics.it.com" },
    { "@type": "ListItem", "position": 2, "name": "Classical Mechanics", "item": "https://physics.it.com/classical-mechanics" },
    { "@type": "ListItem", "position": 3, "name": "The Simple Pendulum" }
  ]
}
```

### Homepage only → `WebSite` + `SearchAction`

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "physics",
  "url": "https://physics.it.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://physics.it.com/dictionary?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```

### Skipped for v1

- `FAQPage` — schema-ready (TopicPageSeo accepts optional `faqs` prop) but no FAQ writing in this round
- `HowTo`, `Course`, `LearningResource` — overlap with Article, low marginal value
- `MathSolver` — interesting longshot, no structured I/O schema

---

## OG images (template-generated)

Next 15 `opengraph-image.tsx` runs on Edge runtime, rasterizes JSX → 1200×630 PNG at request time.

**Two-layer pattern (because topics are static routes, not dynamic `[branch]/[topic]`):**

1. **Shared templates in `lib/seo/og-templates/`** hold the actual JSX + styling. One per content kind (topic, glossary, physicist).
2. **Per-route `opengraph-image.tsx` delegates** — for static topic routes, the codemod creates a 3-line `opengraph-image.tsx` file in each topic directory:

```ts
// app/[locale]/(topics)/classical-mechanics/the-simple-pendulum/opengraph-image.tsx
import { topicOgImage } from "@/lib/seo/og-templates/topic-card";
export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image({ params }: { params: { locale: string } }) {
  return topicOgImage({ slug: "classical-mechanics/the-simple-pendulum", locale: params.locale });
}
```

For `dictionary/[slug]` and `physicists/[slug]` (already dynamic segments), one `opengraph-image.tsx` covers all entries — Next reads `[slug]` from `params`.

**Card design:**
- Wordmark `physics` top-left + branch badge top-right (e.g. `§ 16 OSCILLATIONS`)
- Massive topic title centered
- Subtitle one-liner below
- Subtle dot-grid background in brand colors (`--color-bg-1` / `--color-fg-3`)
- Locale-aware: RTL flips alignment automatically

Cost: ~50ms cold render on Vercel Edge, then CDN-cached. Effectively free.

---

## Sitemap & robots

### `app/sitemap.ts` — rewrite

1. Fetch all `(kind, locale, slug, updated_at)` rows from `content_entries`
2. For each `(kind, slug)`, emit one entry per locale that has a real row (no fallback)
3. Each entry's `alternates.languages` lists *only* the locales where that slug has a real row

**Today's expected output:** ~130 topics + 36 glossary + 17 physicist + 3 branches + 7 static = ~193 EN URLs. No phantom HE entries.

### `app/robots.ts`

```ts
{
  rules: [{
    userAgent: "*",
    allow: "/",
    disallow: ["/api/", "/auth/", "/sign-in", "/account", "/sandbox", "/billing"],
  }],
  sitemap: "https://physics.it.com/sitemap.xml",
  host: "https://physics.it.com",
}
```

---

## Indexing acceleration (human action in Search Console)

Sessions 2-3 below cover this. Code can't trigger Google indexing — only the Search Console UI can.

**Priority list for manual URL Inspection requests** (highest expected search volume first):

1. `/classical-mechanics/newtons-three-laws`
2. `/classical-mechanics/the-simple-pendulum`
3. `/classical-mechanics/universal-gravitation`
4. `/classical-mechanics/kepler`
5. `/classical-mechanics/momentum-and-collisions`
6. `/classical-mechanics/energy-and-work`
7. `/classical-mechanics/angular-momentum`
8. `/classical-mechanics/circular-motion`
9. `/classical-mechanics/the-lagrangian`
10. `/classical-mechanics/the-hamiltonian`
11. `/electromagnetism/coulombs-law`
12. `/electromagnetism/the-four-equations`
13. `/electromagnetism/faradays-law`
14. `/electromagnetism/gauss-law`
15. `/electromagnetism/amperes-law`
16. `/electromagnetism/the-electric-field`
17. `/electromagnetism/the-lorentz-force`
18. `/electromagnetism/maxwell-stress-tensor`
19. `/electromagnetism/the-electromagnetic-spectrum`
20. `/electromagnetism/electric-potential`
21. `/relativity/special-relativity` (or top live RT slug)
22. `/relativity/time-dilation`
23. `/relativity/length-contraction`
24. `/relativity/four-vectors`
25. `/relativity/equivalence-principle`
26. `/dictionary` (index page)
27. `/physicists` (index page)
28. `/physicists/isaac-newton`
29. `/physicists/albert-einstein`
30. `/physicists/galileo-galilei`

Batch ~10/day for 3 days in Search Console + Bing Webmaster Tools.

---

## Build-time validation

`scripts/seo/check-uniqueness.ts`:
1. Pulls all `(kind, slug, locale='en', title, subtitle, meta.seoTitle, meta.seoDescription)` rows from Supabase
2. Computes the *final* title and description for each via the same helpers used at runtime
3. Asserts no duplicates across all kinds
4. Wired as `pnpm seo:check` — optional CI gate

`scripts/seo/indexnow.ts`:
1. Reads sitemap URLs from prod
2. POSTs to IndexNow API (Bing, Yandex, Naver)
3. Wired as `pnpm seo:indexnow` — manual trigger after each major content push

---

## Session breakdown

### Session 1 — Foundation (this spec → plan → implementation)

**Goal:** all 130 topics, 36 glossary entries, 17 physicists shipping unique titles, descriptions, OG images, JSON-LD.

**Deliverables:**
1. `lib/seo/{config,topic-metadata,description,title,jsonld}.ts`
2. `components/seo/{jsonld,topic-page-seo}.tsx`
3. Shared OG templates in `lib/seo/og-templates/{topic,glossary,physicist}-card.tsx`
4. Codemod: `generateMetadata` export + `<TopicPageSeo>` added to all 130 topic page.tsx files; matching 3-line `opengraph-image.tsx` created alongside each topic; one shared `opengraph-image.tsx` for `dictionary/[slug]` and `physicists/[slug]`
5. Updated `dictionary/[slug]` and `physicists/[slug]` page.tsx using new helpers
6. Updated `app/[locale]/[branch]/page.tsx` using new helpers
7. Rewritten `app/sitemap.ts`
8. Rewritten `app/robots.ts`
9. Upgraded root `app/layout.tsx` metadata
10. `<JsonLd data={buildWebSiteJsonLd()} />` on homepage
11. `scripts/seo/check-uniqueness.ts` + `scripts/seo/indexnow.ts` + `package.json` wiring
12. Local verification — view-source 5 representative pages, test 3 OG image URLs
13. PR titled `feat(seo): foundation — unique metadata, schema, OG images for all content`

### Session 2 — Search Console activation (Roman + light scripting)

**Roman, in Search Console UI** (~2-3 hours over a week):
1. Verify domain ownership via DNS TXT (Hostinger DNS)
2. Submit `sitemap.xml`
3. URL Inspect + Request Indexing on the 30-page priority list (~10/day for 3 days)
4. Same in Bing Webmaster Tools

**Code work** (~30 min):
1. Run `pnpm seo:check`
2. Run `pnpm seo:indexnow`
3. Spot-check 10 random URLs in Schema.org Validator + Google Rich Results Test
4. Capture results in `docs/seo/session-2-validation.md`

### Session 3 — Measurement & polish (2-4 weeks after Session 1 ships)

**Goal:** read what happened, fix what didn't work.

1. Pull Search Console Coverage report → CSV → categorize all URLs (`Indexed | Crawled-not-indexed | Discovered-not-indexed | Excluded`)
2. For Discovered-not-indexed: add internal links from already-indexed pages
3. For Crawled-not-indexed: audit for thin content / missing schema
4. Pull top-100 search queries → identify clusters where pages rank #15-30 (close-to-page-1)
5. Decide whether to write FAQ blocks for top-10 queries' topics (gateway to content-gap work)
6. Fix any schema validation issues from Session 2
7. Deliverable: `docs/seo/session-3-report.md`

---

## What's deliberately NOT in scope

- "What is X" pages for every dictionary term — Google's quality bar for thin definitional content is now extreme. Wait for measurement data.
- "X formula" / "X example problem" / "X vs Y" comparison pages — same reasoning. Build only the ones matching real Search Console queries we're already close to ranking for.
- Backlink outreach (Wikipedia, teacher blogs, HARO) — slow burn, separate workstream.
- Hebrew indexing — until translations are real per-row.
- FAQ blocks per topic — schema-ready, no writing this round.
- Performance optimization (KaTeX/JSXGraph deferral) — only if Search Console flags Core Web Vitals after Session 2.

---

## Risks & mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Codemod breaks an existing topic page | Low | Pages are uniform (verified by spot-check). Codemod adds, never replaces. Vercel preview deploy catches breakage before prod. |
| OG image template renders broken on edge cases (long titles, missing subtitle) | Medium | Defensive fallbacks in template (subtitle? title? "physics"). Manually preview 5 OG images during Session 1. |
| Google de-indexes existing 1 indexed page during transition | Very low | Canonical and robots changes are non-conflicting; metadata additions don't trigger re-evaluation negatively. |
| Translation_status field needed earlier than expected | Low | Today only `localeFallback` is needed. Can layer `translation_status` enum onto `meta` JSONB without migration when machine-translation enters the mix. |
| Sitemap drops below current 271 → looks like a regression in Search Console | Medium | Document in Session 2 notes that current 271 includes ~100+ phantom HE entries that were always going to fail indexing. Real EN URLs were ~140; new sitemap shows ~193 (more, not fewer). |

---

## Success criteria

After Session 1 ships:
- All 130+ topic URLs have unique `<title>` and `<meta name="description">` in HTML
- All have `Article` JSON-LD validating in Schema.org Validator
- All have unique OG images visible at `/{path}/opengraph-image`
- Sitemap.xml contains only real (non-fallback) URLs
- `pnpm seo:check` passes (no duplicate titles/descriptions)

After Session 3 (measurement):
- Indexed page count in Search Console > 50 (from baseline of 1)
- At least 5 topics ranking in top-50 for relevant physics queries
- Zero pages stuck in "Discovered – not indexed" status
