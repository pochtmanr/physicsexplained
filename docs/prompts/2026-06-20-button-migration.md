# Next session — migrate the rest of the app's buttons to the shared keycap system

## Context

We just introduced a shared button system and applied it to the **navbar** and the
**landing-page sections**. This session finishes the job: migrate every remaining
button / button-like control across the rest of the app to that same system, so the
whole product shares one "panel keycap" look instead of ~80 copy-pasted inline strings.

**The design language (already decided — match it, don't reinvent):** controls read as
raised panel keycaps on an oscilloscope-style UI — 6px radius, a resting bevel (top
highlight + soft drop shadow), lift + cyan glow on hover, 1px press-on-click, monospace
uppercase labels, and the `.btn-tracer` scope-line sweep. Primary keeps a cyan phosphor glow.

## What already exists — DO NOT recreate, reuse it

- **`components/ui/button.tsx`** — the source of truth. Exports:
  - `buttonVariants({ variant, size, className })` → a className **string**, for
    `<Link>` / `<a>` styled as buttons.
  - `Button` → a `<button>` wrapper (forwards ref + props), for real buttons.
  - Variants: `primary` | `secondary` | `ghost` | `icon`. Sizes: `sm` | `icon` |
    `icon-lg` | `cta` | `mobile`.
  - `.btn-tracer`, the focus ring, `active:translate-y-px`, and `disabled:` handling are
    already in the BASE — so when migrating, **delete** the old `btn-tracer`, transition,
    shadow, radius, focus, and disabled classes from each call site; the component owns them.
- **`app/globals.css`** — tokens: `--radius-control: 6px`, and per-theme keycap shadows
  `--shadow-control`, `--shadow-control-hover`, `--shadow-control-primary[-hover]`
  (defined for both dark and light). The `.btn-tracer::before` is already inset to tuck
  inside the radius.

### Conventions to follow
- For `<Link>` / `<a>` buttons, pass `className: "nav-link"` so the global
  `a:not(.nav-link)` rule doesn't override the variant's text color. Preserve any layout
  className the call site needs (e.g. `mt-8`, `w-full`) by appending it to `className`.
- Keep all `href`, `onClick`, `aria-*`, `disabled`, icons, and i18n exactly as-is — only
  styling changes.
- Don't force **pure text links** (back/next/edit/cancel that are just colored text, no
  border/bg) into keycaps — those should stay text links. Only migrate real buttons/keycaps.
- **Collapsed-border grids stay flat** (negative-margin grids where borders merge into one
  hairline — the mobile-nav drawer rows, branch mega-menu, card grids). Keycap radius +
  shadow break that seamless grid, so leave those as-is unless the user explicitly asks to
  redesign the grid surface itself.

## STEP 1 — Extend the component first (two gaps the current system can't express)

Several remaining buttons need styling the four variants don't cover. Add these to
`components/ui/button.tsx` before migrating, so nothing gets hand-rolled inline:

1. **`danger` variant** — a magenta keycap (fill for destructive primary actions, outline
   for secondary). Needed by: sign-out, delete-all-chats, delete-confirm, cancel-subscription.
   Mirror the `primary`/`secondary` recipes but with `--color-magenta`.
2. **Active / toggle state** — a pressed-in look for segmented toggles (cyan fill when
   active, ghost when not). Add an `active?: boolean` prop on `Button` (and an option in
   `buttonVariants`) that renders the active treatment + sets `aria-pressed`. Needed by:
   account profile/billing tabs, playground mass/speed selectors, chandler-wobble mode tabs.

Keep the API minimal and consistent with the existing variant/size shape.

## STEP 2 — Migrate by area (exact files from the inventory)

### A. Topic prev/next nav — the user called this out specifically (`/classical-mechanics`)
- `components/layout/topic-nav.tsx` (prev ~L43, next ~L61) — large bordered `<Link>` panels.
  Give them the 6px radius + a subtle keycap bevel (scale the bevel down for the big
  surface) or map to `secondary`; judgment call — they're panel-sized, not pill buttons.

### B. Auth / forms
- `components/auth/sign-in-form.tsx` (Google OAuth submit) → `primary` `cta`.
- `components/auth/sign-out-button.tsx` → `danger` (secondary/outline).
- `components/auth/mobile-account-button.tsx` → `icon`/`icon-lg`; note it uses
  `rounded-full` — decide keep round vs adopt 6px (probably keep round for an avatar button).
- `components/forms/email-signup.tsx`, `components/forms/contact-form.tsx`,
  `components/layout/newsletter-form.tsx` → `secondary` `sm`.

### C. Ask page (`/ask`)
- `components/ask/composer.tsx` — send (~L147) → `primary` `icon`; attach (~L117) →
  `ghost`/`icon`; remove-attachment (~L84) → `icon` (tiny, override size).
- `components/ask/conversation-rail.tsx` — new-chat (~L62, ~L83) → `primary`; collapse
  toggle (~L70) → `ghost` `icon`.
- `components/ask/mobile-chat-rail.tsx` — trigger (~L34), close (~L117) → `ghost` `icon`;
  new-chat (~L109) → `primary`.
- `components/ask/empty-state.tsx` — example-prompt chips (~L48) → `ghost` (keep flex layout).
- `components/ask/further-reading.tsx` — cards (~L119, ~L143): these are card-like — likely
  leave as-is (card pattern) unless unifying.
- `components/ask/conversation-row.tsx` — menu trigger (~L139) → `ghost` `icon`; the
  `role="menuitem"` rows (~L156–184) are **menu items, not buttons — leave them**; delete-
  confirm cancel (~L197) → `secondary` `sm`.
- `components/ask/model-picker.tsx` — a `<select>`, not a button; optionally give it matching
  secondary chrome but it's out of the button scope. Flag to the user.

### D. Play
- `app/[locale]/play/page.tsx` — index cards (~L50): card pattern, likely leave.
- `app/[locale]/play/_components/share-buttons.tsx` — copy/tweet (~L63, ~L71) → `ghost`
  `icon`; ask (~L80) → `primary`.
- `components/playgrounds/orbital-mechanics/controls.tsx` — play/pause/reset (~L43, ~L51) →
  `ghost` `icon`; mass/speed selectors (~L63, ~L82) → toggle (`active` from STEP 1).
- `components/physics/ramp-race-scene.tsx` — start (~L316) → `primary` `sm`; reset (~L324) →
  `secondary` `sm`.
- `components/physics/chandler-wobble-scene.tsx` — mode tabs (~L226) → toggle (`active`).
  (Other `components/physics/*-scene.tsx` may have similar inline control buttons — grep.)

### E. Content / problems / chrome
- `app/[locale]/(topics)/classical-mechanics/[topic]/problems/[problemId]/page.tsx` —
  "Open in Physics.Ask" (~L113) → `secondary`; back/next (~L125, ~L135) are text links — keep.
- `components/problems/step-row.tsx` — check-answer (~L98) → `secondary` `sm`; show-answer
  (~L105) → `secondary` `sm`; edit-step (~L57) is a text link — keep.
- `components/layout/footer.tsx` — the shared `navLinkClass` (~L8) → replace its definition
  with `buttonVariants({ variant: "secondary", size: "sm", className: "nav-link" })` so all
  footer link-buttons update at once.
- `app/not-found.tsx` (~L15) → `secondary`.

### F. Account / billing
- `components/account/account-drawer.tsx` — profile/billing tabs (~L54) → toggle (`active`).
- `components/account/profile-tab.tsx` — upgrade (~L45) → `primary` `cta`; manage-sub (~L54)
  → `secondary` `sm`; delete-all-chats (~L73) → `danger`.
- `components/account/plan-cards.tsx` — upgrade/downgrade (~L36) → `secondary` `sm`.
- `components/account/billing-tab.tsx` — cancel-subscription (~L94) is a text link — keep
  (or `danger` text treatment).
- `components/account/delete-confirm.tsx` — cancel (~L43) → `secondary` `sm`; delete (~L50)
  → `danger` (primary fill).
- `app/[locale]/billing/thank-you/thank-you-client.tsx` — start-asking (~L73), back (~L87),
  reload (~L102) → `secondary` `sm`.

### G. Mobile-nav drawer (decision needed)
`components/layout/mobile-nav.tsx` drawer rows (branches ~L160, Ask ~L202, Physicists/
Dictionary/Play ~L212–239, search ~L242) were **intentionally left flat in pass 1** because
they're a collapsed-border grid. Ask the user whether to (a) leave them, or (b) redesign the
whole drawer to keycaps (requires un-collapsing the grid / spacing the rows). Don't silently
restyle and break the grid.

## Edge cases to confirm with the user (ask before assuming)
- Topic prev/next panels and the Ask "further reading" / Play index **cards** — keycap them,
  or treat as cards (leave flat)?
- `<select>` model-picker — restyle to match, or leave?
- Mobile drawer — restyle (un-collapse grid) or leave?

## Verification
1. Dev server runs at `http://localhost:3000` (or 3001 if 3000 is taken). Walk the pages the
   user named: `/classical-mechanics` (+ a sub-topic for prev/next), `/sign-in`, `/ask`,
   `/play`, `/account`, a problem page, 404.
2. Check both themes (toggle top-right), hover lift + glow, 1px press, keyboard focus ring,
   and `prefers-reduced-motion`.
3. `npx tsc --noEmit` clean. (`next lint` isn't configured in this repo — skip it.)
4. Grep the migrated files to confirm the old inline strings are gone — no stray
   `btn-tracer`, `border border-[var(--color-fg-4)] px-`, or `bg-[var(--color-cyan)] px-`
   left outside `components/ui/button.tsx` and the intentionally-flat collapsed grids.
5. Any new translation copy must be done **by hand** across `messages/{en,he,ru}/*.json`
   (no translation scripts/APIs).

## Scope discipline
Buttons/keycaps only. Don't restyle cards, collapsed grids, or pure text links unless the
user opts in. Extend `components/ui/button.tsx` for new needs (danger, toggle) rather than
hand-rolling inline — the whole point is one shared system.
