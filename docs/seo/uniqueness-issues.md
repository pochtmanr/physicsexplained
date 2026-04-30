# SEO uniqueness issues — for Session 2 follow-up

`pnpm seo:check` flagged the following on the `seo/foundation-session-1` branch (2026-04-30). These do not block Session 1 but should be resolved before the URL Inspector ramp.

## Duplicate titles

### Christiaan Huygens

- `physicist::christiaan-huygens` — `/physicists/christiaan-huygens`
- `glossary::christiaan-huygens` — `/dictionary/christiaan-huygens`

Both produce `"Christiaan Huygens — physics"`. The auto-trim chain has no kind-aware tiebreaker.

**Fix:** add `meta.seoTitle` overrides to one or both Supabase rows. Suggested:

- physicist row: `"Christiaan Huygens — Physicist (1629–1695) — physics"`
- glossary row: `"Christiaan Huygens — Dictionary — physics"`

(Alternatively, add a kind-suffix branch to `buildTitle` so glossary/physicist always disambiguate. Punt unless this pattern keeps recurring.)

## Locale-strategy nuance

The spec assumed Hebrew rows would be missing for most slugs and so HE pages would auto-flip to `noindex,follow + canonical-back-to-EN`. In practice, `content_entries` already has 146 HE rows (real translations, not fallbacks), so:

- The sitemap emits both EN and HE URLs for those slugs.
- HE pages render with locale-specific `<title>` and no `noindex` meta.

This is correct architectural behavior. If Roman wants HE held back from indexing pending a quality review of the translations, the cleanest gate is a `meta.translation_status` enum on the row (e.g. `"draft" | "human-reviewed"`). The metadata helper would treat anything other than `human-reviewed` as a fallback for indexing purposes. Not implemented in Session 1.
