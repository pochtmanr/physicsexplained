# SEO Session 1 — Local verification log

Run on `seo/foundation-session-1` branch, against `pnpm build && pnpm start` (production build).

## Tests

- `pnpm vitest run`: **1775 passed** across 149 test files
  - `tests/seo/`: **29 passed** (config, title, description, locale-alternates, jsonld, topic-metadata, codemod)
- `pnpm tsc --noEmit`: clean
- `pnpm build`: succeeds, all 130 topic OG routes registered as `ƒ` dynamic edge functions

## Five representative pages

| Page | Title | Canonical | og:image | JSON-LD types |
|---|---|---|---|---|
| `/` | `Physics, explained visually — physics` | (root) | `/og-image.png` | `WebSite`, `SearchAction` |
| `/classical-mechanics` | `Classical Mechanics — physics` | self | `/og-image.png` | (none — branch index) |
| `/classical-mechanics/the-simple-pendulum` | `The Simple Pendulum — Classical Mechanics — physics` | self | `/en/.../opengraph-image-{hash}` | `Article`, `BreadcrumbList`, `Organization`, `ImageObject`, `Thing`, `WebSite` |
| `/dictionary/angular-momentum` | `angular momentum — physics` | self | `/en/dictionary/angular-momentum/opengraph-image` | `DefinedTerm`, `DefinedTermSet`, `BreadcrumbList`, `ListItem` |
| `/physicists/isaac-newton` | `Isaac Newton — physics` | self | `/en/physicists/isaac-newton/opengraph-image` | `Person`, `BreadcrumbList`, `ListItem` |

All five render the expected `<title>`, `<meta name="description">`, `<link rel="canonical">`, `<meta property="og:image">`, plus the right JSON-LD `@type` for the kind.

## OG image runtime renders

Three sample OG image URLs fetched directly:

```
/classical-mechanics/the-simple-pendulum/opengraph-image-d97mma?297d58e282247eb5
  → 200 image/png, 1200×630, 34868 bytes
/dictionary/angular-momentum/opengraph-image?a36e5f874a658689
  → 200 image/png, 1200×630, 40925 bytes
/physicists/isaac-newton/opengraph-image?926b01fe47f7c379
  → 200 image/png, 1200×630, 34667 bytes
```

## Sitemap & robots

- `/sitemap.xml` returns 775 `<loc>` entries: 629 EN + 146 HE (Hebrew rows already exist in `content_entries` for those slugs, so per spec they're real-row indexable). No phantom HE entries for slugs without a real HE row.
- `/robots.txt` emits the explicit disallow list (`/api/`, `/auth/`, `/sign-in`, `/account`, `/sandbox`, `/billing`) and points to `https://physics.it.com/sitemap.xml`.

## Issues caught and fixed during verification

Two real bugs only the rendered HTML could show — both fixed in commit `ab4b057`:

1. **Double-suffix titles.** Root layout's `title.template = "%s — physics"` was being applied to child pages whose titles already ended in `— physics`, producing `"... — physics — physics"`. Fixed by returning `title: { absolute: title }` from both factories — bypasses the template.

2. **404 on topic OG URLs.** Next 15 appends a hash (`opengraph-image-{hash}`) to static-route OG file URLs but not to dynamic `[slug]` ones. Our `makeTopicMetadata` was emitting the unhashed URL, which 404'd for all 130 topic pages. Fixed by removing `openGraph.images` / `twitter.images` for topic + glossary + physicist — Next auto-emits the correctly hashed URL from the colocated `opengraph-image.tsx`. Branch index pages get an explicit fallback to `/og-image.png` (no colocated OG file).

   Side effect: JSON-LD `Article.image` is now omitted for topics (we can't predict Next's hash). Glossary and physicist keep `image` since their dynamic-route OGs serve at the unhashed path. The og:image meta tag still drives all social previews.

## Open issues for Session 2

See `docs/seo/uniqueness-issues.md`.
