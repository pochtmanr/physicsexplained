# 04 — Block Rendering Spec (PXBlocks)

How `content_entries.blocks` / `aside_blocks` (the `Block[]` JSON) render as SwiftUI. Implemented in the `PXBlocks` SPM target (models in `PXModel`). Verified against production source on 2026-07-02:

- Contract: `/Users/roman/Developer/physics/lib/content/blocks.ts` (transcribed verbatim below)
- Reference renderer: `components/content/content-blocks.tsx`, `content-inline.tsx`, `figure-inner.tsx`
- Chrome: `components/layout/section.tsx`, `callout.tsx`, `scene-card.tsx`, `components/math/equation-block.tsx`
- Styling context: `docs/ios/03-design-system.md` (PXColors/PXTypography/frames)

---

## 1. The contract (verbatim from `lib/content/blocks.ts`)

```ts
export type CalloutVariant = "intuition" | "math" | "warning" | "info" | "note";

export type Inline =
  | string
  | { kind: "em"; inlines: Inline[] }        // ⚠ recursive container, not {text}
  | { kind: "strong"; inlines: Inline[] }    // ⚠ recursive container
  | { kind: "code"; text: string }
  | { kind: "formula"; tex: string }
  | { kind: "link"; href: string; text: string }
  | { kind: "term"; slug: string; text?: string }
  | { kind: "physicist"; slug: string; text?: string };

export type FigureContent =
  | { kind: "image"; src: string; alt: string }
  | { kind: "simulation"; component: string; props?: Record<string, unknown> };

export type Block =
  | { type: "section"; index: number; title: string; children: Block[] }
  | { type: "heading"; level: 3 | 4; text: string }
  | { type: "paragraph"; inlines: Inline[] }
  | { type: "equation"; id?: string; tex: string; prose?: string }
  | { type: "figure"; caption?: string; content: FigureContent }
  | { type: "callout"; variant: CalloutVariant; children: Block[] }
  | { type: "list"; ordered: boolean; items: Inline[][] }
  | { type: "table"; header?: Inline[][]; rows: Inline[][][] };
```

### Swift decoding (PXModel)

- `Block` and `Inline` are enums with associated values; decode by discriminator (`type` for blocks, `kind` for objects in inline position; a bare JSON string decodes to `Inline.text(String)`).
- **Forward compatibility: unknown `type`/`kind` must decode to `.unsupported(raw:)` — never throw.** The web pipeline can add block types before the app updates; an article must degrade (skip/placeholder), not fail to open.
- `equation.tex` can be an empty string with `prose` set (web checks `if (block.tex)` truthiness, i.e. empty string falls through to prose). Model both as optional-ish: render tex when non-empty, else prose when non-empty, else nothing.
- Fixture tests: decode real rows (see `02-api-contracts.md` §fixtures) covering every block type, nested em/strong, and an unknown-kind sample.

---

## 2. Block → SwiftUI mapping

Article body = `LazyVStack(alignment: .leading)` inside a `ScrollView`, reading column max ~680pt (03 §5).

| Block | SwiftUI rendering (match web renderer noted per row) |
|---|---|
| `section` | Header row: `§ 01` in cyan (Inter 600, 24–30pt, `tabular-nums`, index zero-padded to 2 digits — `String(format: "%02d", index)`) + title in fg0 same size, baseline-aligned, wrapping; 16pt below header, 48pt after section (web `mb-12`). Children render recursively. Sections are the ToC anchors (scroll targets). (`section.tsx`) |
| `heading` | level 3 → `.h3` style (uppercase, 03 §2.2); level 4 → `.h4`. Plain text, no numbering. |
| `paragraph` | One `Text` built by inline-run concatenation (§3). Body style fg1; paragraph spacing 9pt (0.5em, web `.prose p + p`). |
| `equation` | If `tex` non-empty: display-mode SwiftMath render inside **EquationBlock chrome** (03 §3: corner frame, cyan left rail, mono uppercase `id` label e.g. "EQ.01" — omit the label row when `id` is nil/empty). Wide equations scroll horizontally inside the frame. Else if `prose` non-empty: same chrome, prose in JetBrains Mono 18pt fg0. Else render nothing. (`content-blocks.tsx` case "equation") |
| `figure` | **SceneCard chrome** (03 §3) with `caption` as the FIG eyebrow. Content per §4 below. |
| `callout` | **Callout chrome** (03 §3): variant → rail color + label (intuition/amber/INTUITION, math/cyan/MATH, warning/magenta/CAUTION, info/cyanDim/INFO, note/fg3/NOTE). Unknown variant falls back to intuition styling (web does). Children render recursively (callouts can contain paragraphs, lists, equations, tables). |
| `list` | VStack of rows: marker + inline-run text. Unordered marker `–` (en dash) fg3; ordered `1.` mono tabular fg3. Indent 20pt, row gap 6pt. Items are `Inline[][]` — each item is one inline run. |
| `table` | Mono table per 03 §5: optional header row (11.7pt uppercase +0.1em fg3), body cells 14.4pt fg1, 1px fg4 separator under every row except the last, cell padding 7×13.5pt, no vertical rules. Wrap in horizontal `ScrollView` when natural width exceeds the column. Cells are inline runs (§3) — formulas inside cells must work. |
| unknown | Nothing (log once per type). |

---

## 3. Inline runs

A paragraph/list-item/cell is `Inline[]` — build ONE `Text` by concatenation (so wrapping is natural). Recursive styles compose (em inside strong etc.).

| Inline | Rendering |
|---|---|
| `string` | Plain run, inherits context style (body fg1 by default). |
| `em` | Italic applied to nested run. |
| `strong` | Weight 600 + fg0 applied to nested run. |
| `code` | JetBrains Mono at 0.9× context size, fg0. (Web adds a fg4-tinted background chip; `Text` concatenation can't do backgrounds — accept mono+fg0 only. Do NOT break paragraphs into HStacks for this.) |
| `formula` | Inline (non-display) SwiftMath image via `Text(Image(uiImage:))`, baseline-aligned with `.baselineOffset` from SwiftMath's descent metrics. Cache per §5. |
| `link` | Cyan run. Internal hrefs (`/topics/...`, `/dictionary/...`, `/physicists/...`, `/{locale}/...`) navigate in-app; absolute external URLs open `SFSafariViewController`. Use `AttributedString.link` + `.environment(\.openURL)` interception so runs stay concatenable. |
| `term` | Text = `text ?? slug-derived title`. Dotted underline fg4 → tap opens **glossary sheet**: fetch `content_entries` kind=`glossary`, slug, locale; sheet shows title, subtitle, full blocks (recursive PXBlocks render), "OPEN IN DICTIONARY" link. Web falls back to the equations registry when the slug isn't glossary — iOS: if glossary fetch misses, try `equations`/`equation_strings` and show the equation sheet; if both miss, render as plain text (do NOT crash — web throws at build time, a client cannot). |
| `physicist` | Same pattern, kind=`physicist`; sheet shows portrait (meta.image via image resolution §4), lifespan (`meta.born`–`meta.died`), blocks. |
| unknown kind | Its `text`/`inlines` content as plain run if present, else skipped. |

Implementation: `func inlineRun(_ inlines: [Inline], base: PXTextStyle) -> Text` recursing with a style-context struct. Term/physicist taps: use `AttributedString` link attributes with custom `px://term/<slug>` / `px://physicist/<slug>` URLs intercepted by `.environment(\.openURL, ...)`.

---

## 4. Figures

```
figure.content.kind == "image":
    url = ImageURLResolver.resolve(src)        // see rule below
    → LazyImage (Nuke), alt as accessibilityLabel, max-width fit
figure.content.kind == "simulation":
    SceneRegistry.view(for: content.component, props: content.props)
      → native SwiftUI scene            (if ported — PXScenes)
      → else snapshot image             (scene_catalog.snapshot_url, "STATIC FIGURE" HUD tag per 03)
      → else designed placeholder       (frame + component name in mono + "FIGURE PENDING")
```

All three paths render inside the same SceneCard chrome; **the card, not the scene, owns caption/border/expand**.

**Image URL resolution rule** (web behavior, `figure-inner.tsx` + `lib/supabase.ts`): figure `src` values are passed through `storageUrl(path)` = `https://cpcgkkedcfbnlfpzutrc.supabase.co/storage/v1/object/public/images/<path>`. Some legacy srcs start with `/images/...` (web-app public assets). Resolver:

```
absolute http(s) URL      → use as-is
starts with "/images/"    → https://physicsexplained.example (web origin from config) + path
otherwise                 → supabase storage public URL: .../object/public/images/<src>
```

(Exact web origin constant comes from `02-api-contracts.md` §config.) Lazy-load figures as they approach the viewport (web gates on `LazyMount`); Nuke + `LazyVStack` gives this for images; native scenes should also mount lazily (P4 toolkit provides `LazySceneMount` with skeleton shimmer placeholder).

---

## 5. TeX policy (SwiftMath)

- Renderer: **SwiftMath** (native KaTeX-subset). Display mode for `equation.tex`; text mode for inline `formula.tex`.
- **Fallback**: if SwiftMath fails to parse, render the raw TeX string in `.code` style and `Logger.pxTeX.error(...)` once per string. Never crash, never show empty.
- **Cache**: rendered `UIImage` keyed `(tex, pointSize, colorSchemeIsDark)`, LRU in-memory (~200 entries) + disk optional. Equations use fg0; the color is baked at render, hence the scheme key.
- Math is **always LTR** even in future RTL locales (web forces `direction: ltr` on KaTeX — `globals.css` line 161).
- Mobile: at compact widths render display equations at 0.9× (web `@media (max-width: 480px) .katex { font-size: 0.9em }`), plus horizontal scroll in the chrome.
- **P3 TeX audit** (acceptance gate): a `swift test` target that pulls every `equation.tex` + inline `formula.tex` from the bundled fixtures AND (when `PX_AUDIT_LIVE=1`) from all live `content_entries` rows, runs each through SwiftMath, and prints a failure report `(slug, tex, error)`. Target: 0 failures, or each failure listed with its fallback accepted.

---

## 6. Aside blocks

`content_entries.aside_blocks` is a second `Block[]` (sidebar notes; typically short paragraphs/lists/links).

- **iPad regular width**: right rail column, ~280pt, top-aligned with the first section; `.bodySmall` fg2 text; sticky feel via `ScrollView` + `scrollTargetLayout` is NOT required for MVP — a plain trailing column is fine.
- **iPhone / compact**: collapsed `DisclosureGroup` titled "NOTES" (mono eyebrow style) rendered after the article body, before prev/next navigation.
- Empty/missing `aside_blocks` (empty array) → omit the rail/group entirely.

---

## 7. Acceptance targets (P3 gate)

Render these five **live** topics (verified `status: "live"` in `lib/content/branches.ts` on 2026-07-02) and compare side-by-side against their web pages:

| # | `content_entries` slug (kind=`topic`, locale=`en`) | Why chosen |
|---|---|---|
| 1 | `classical-mechanics/the-simple-pendulum` | Flagship; sections, equations, figures, callouts |
| 2 | `classical-mechanics/energy-and-work` | Lists + tables + inline formulas |
| 3 | `electromagnetism/coulombs-law` | EM branch; equation-heavy |
| 4 | `relativity/einsteins-two-postulates` | SR; callout variety |
| 5 | `thermodynamics/brownian-motion` | Newest pipeline output; simulation figures |

Checklist per topic: every block type present renders; no decode failures; figures show snapshot or native scene inside SceneCard chrome; term/physicist taps open sheets; TeX audit clean; dark & light both correct; iPhone (compact, aside collapsed) and iPad (regular, aside rail) both correct.

---

## Discrepancies vs prior exploration notes

1. `em`/`strong` inlines are **recursive containers** (`{ kind, inlines: Inline[] }`), not flat text — earlier summaries implied flat. Decoder and inline-run builder must recurse.
2. Figure image `src` is passed through `storageUrl()` (Supabase `images` bucket) by the web renderer — the "mixed /images/ vs storage" split is handled by prefix, per §4.
3. Web `Term` throws on unknown slug at build time and falls back to the **equations registry** before failing — iOS must fall back the same way but degrade to plain text instead of throwing.
4. `section` headers are NOT uppercase-transformed in the web renderer (title arrives already-cased from MDX); don't force uppercase on section titles (unlike h2/h3 chrome styles).
