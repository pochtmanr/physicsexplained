# SEO Session 1 — Resume Prompt

Paste this verbatim into the next Claude Code conversation to pick up where we left off.

---

## Prompt to paste

```
We're executing Session 1 of the SEO foundation work for physics.it.com.

Context: physics.it.com (Next.js 15 + Supabase) had only 1 page indexed by
Google despite a sitemap of 271 URLs. Root cause: none of the 130 topic
page.tsx files defined generateMetadata, so every topic rendered with
the root <title>physics</title>. Google consolidated all 130 to one
canonical and dropped the rest.

Locked decisions from brainstorming:
- Locale strategy A: English-only indexing for now. Untranslated /he/*
  pages get robots noindex,follow + canonical back to EN. Sitemap emits
  only EN URLs until real per-row Hebrew translations land.
- Architecture is locale-agnostic from day 1. Adding Arabic later =
  add "ar" to i18n/config.ts + populate Supabase rows. Zero refactor.
- Foundation-only this round. Zero new prose — entry.subtitle field on
  every topic is already unique and SERP-ready, we just expose it.
- One big PR for Session 1. Codemod is mechanical.

Spec: docs/superpowers/specs/2026-04-30-seo-foundation-design.md
Plan: docs/superpowers/plans/2026-04-30-seo-foundation-session-1.md

Please use the superpowers:subagent-driven-development skill to execute
the Session 1 plan task-by-task. Each task in the plan has step-by-step
instructions including exact file paths, code, test commands, and
expected output. Do not skip steps. Commit after each task.

Start with Task 1 (site config module).
```

---

## What's already done (do NOT redo)

- Brainstorming complete — design approved by Roman
- Spec written + committed: `docs/superpowers/specs/2026-04-30-seo-foundation-design.md` (commit `393432e`)
- Plan written: `docs/superpowers/plans/2026-04-30-seo-foundation-session-1.md`

## After Session 1 ships

Don't go straight to writing more code. Session 2 is mostly Roman's work in
the Search Console UI:
1. Verify `physics.it.com` ownership via DNS TXT (Hostinger DNS)
2. Submit `https://physics.it.com/sitemap.xml`
3. URL Inspect + Request Indexing for the top-30 priority list (in spec §
   Indexing acceleration). Batch ~10/day for 3 days. Same in Bing Webmaster.
4. Run `pnpm seo:check` and `pnpm seo:indexnow` from terminal.

Session 3 fires 2-4 weeks after Session 1 ships. Pull Search Console Coverage
report, categorize URLs (Indexed vs Crawled-not-indexed vs Discovered-not-
indexed), and fix what didn't work — usually with internal links, not new
prose.

## Reference — spec at a glance

- 130 topics + 36 glossary + 17 physicists + 3 branch indexes get unique
  metadata + JSON-LD + dynamic OG images
- Two-line page contract: `export const generateMetadata = makeTopicMetadata("topic", SLUG)`
  plus `<TopicPageSeo kind="topic" slug={SLUG} />`
- New modules: `lib/seo/{config,title,description,locale-alternates,topic-metadata,jsonld}.ts`
  + `lib/seo/og-templates/{shared,topic-card,glossary-card,physicist-card}.tsx`
- New components: `components/seo/{jsonld,topic-page-seo}.tsx`
- New scripts: `scripts/seo/{apply-codemod,check-uniqueness,indexnow}.ts`
- Codemod creates 130 `opengraph-image.tsx` delegate files alongside each topic
  `page.tsx` (because topic routes are static, not `[branch]/[topic]` dynamic)
- Edits: `app/sitemap.ts` (drop fallback locales), `app/robots.ts` (explicit disallow),
  `app/layout.tsx` (root metadata upgrade), `app/[locale]/page.tsx` (WebSite JSON-LD),
  `app/[locale]/[branch]/page.tsx`, `app/[locale]/dictionary/[slug]/page.tsx`,
  `app/[locale]/physicists/[slug]/page.tsx`
