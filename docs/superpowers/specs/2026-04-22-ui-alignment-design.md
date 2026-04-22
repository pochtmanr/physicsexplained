# UI Alignment — Auth, Account, Ask Chat

**Date:** 2026-04-22
**Scope:** Visual alignment of sign-in, account panel, and the Ask chat (composer, bubbles, rail, plots, empty state) with the established design system used on the homepage hero and topic/dictionary pages.
**Out of scope:** New auth providers, password flow, Revolut/billing integration, editable profile fields, mobile rail, in-chat search.

---

## 1. Context

The article surfaces (hero, branch hero, topic cards, scene cards, callouts) share a tight visual vocabulary:

- Single near-black background, `--color-bg-1` for inset surfaces.
- **Eyebrow**: `font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-cyan-dim)]`.
- **Display titles**: large, `font-display`, often italic-cyan accent on the highlighted token.
- **Buttons**: bordered mono uppercase — `border border-[var(--color-cyan-dim)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--color-cyan-dim)] hover:bg-[var(--color-cyan-dim)]/10`.
- **Cards**: `corner-frame.module.css` adds 4 corner ticks on `bg-[var(--color-bg-1)]`.
- **Body / muted hierarchy**: fg-0 (titles) · fg-1 (body) · fg-3 (captions, meta) · fg-4 (borders).
- **Magenta** signals destructive / coming-soon; **cyan** is primary action.

Three feature areas drift from this language and need alignment:

1. **Auth (`sign-in`)** — generic shadcn classes (`border rounded`, `text-muted-foreground`, `hover:bg-muted`).
2. **Account panel** — placeholder layout, no subscription surface.
3. **Ask chat** — partial token use; plots render bare in a `border rounded jxgbox` div with no caption or theme awareness; bubbles, composer, empty-state, rail all use generic classes.

---

## 2. Shared visual rules (apply across all three surfaces)

| Element | Token / class |
|---|---|
| Page wrapper | `WIDE_CONTAINER` (already exported from `lib/layout.ts`) |
| Eyebrow | `font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-cyan-dim)]` |
| Display title | `text-3xl md:text-5xl tracking-tight text-[var(--color-fg-0)]` (font-display optional) |
| Subtitle / body | `text-[var(--color-fg-1)]` |
| Caption / meta | `text-xs text-[var(--color-fg-3)]` (mono uppercase when label-like) |
| Card surface | `bg-[var(--color-bg-1)]` + `corner-frame.module.css` |
| Hairline | `border border-[var(--color-fg-4)]` |
| Primary action | cyan-framed mono uppercase button |
| Destructive action | magenta-framed mono uppercase button (`border-[var(--color-magenta)] text-[var(--color-magenta)] hover:bg-[var(--color-magenta)]/10`) |
| Input | `bg-[var(--color-bg-0)] border border-[var(--color-fg-4)] focus:border-[var(--color-cyan-dim)] focus:outline-none` |
| Link (default) | inherits cyan from `globals.css` `a:not(.nav-link)` rule — leave as-is |

Forbidden in scope of this spec: `border` (bare), `rounded`, `bg-muted`, `text-muted-foreground`, `text-red-500`, `divide-y` without explicit color. Replace with project tokens.

---

## 3. Sign-in (`/[locale]/sign-in`)

### Files
- `app/[locale]/sign-in/page.tsx`
- `components/auth/sign-in-form.tsx`
- `messages/{en,ru}.json` — new `auth.signIn.*` keys (eyebrow, title, subtitle, googleCta, divider, emailPlaceholder, magicLinkCta, sentTitle, sentBody)

### Layout

```
WIDE_CONTAINER · centered vertically (min-h-[calc(100vh-4rem)])
  └─ max-w-md
       ├─ Eyebrow: "SIGN IN · physics.explained"
       ├─ Title:    "Welcome back"           (display, fg-0)
       ├─ Subtitle: "Continue with email or Google."  (fg-1)
       └─ Card (corner-frame, bg-1, p-6 md:p-8, mt-8)
            ├─ Google button — full-width, cyan-framed mono
            ├─ Hairline divider with mono "OR" centered
            └─ Email form
                 ├─ Email input (fg-4 border, cyan-dim focus)
                 └─ "Send magic link" — full-width, cyan-framed mono
            └─ Error: small magenta mono line at bottom of card
```

### Success state (replaces card contents in place)

```
Card (corner-frame, bg-1)
  ├─ Cyan check icon (Lucide CheckCircle, 32px, color cyan)
  ├─ Eyebrow: "MAGIC LINK SENT"
  ├─ Body: "Check {email} for the sign-in link." (fg-1)
  └─ Helper: "It can take a minute. Check spam if you don't see it." (fg-3, mono xs)
```

### Notes
- Google button stays full-width to match magic link button width.
- Loading state: button text becomes "Sending…" with reduced opacity (existing `disabled:opacity-60` works once we keep the cyan-frame class).
- No social-icon assets needed — text-only "Continue with Google" matches the rest of the site.

---

## 4. Account panel (`/[locale]/account`)

### Files
- `app/[locale]/account/page.tsx`
- `components/auth/sign-out-button.tsx` — restyle to magenta-framed mono
- `messages/{en,ru}.json` — new `account.*` keys

### Layout

```
WIDE_CONTAINER · max-w-3xl · py-12
  ├─ Eyebrow: "ACCOUNT"
  ├─ Title: user.email (or "Account" fallback) — fg-0, text-2xl md:text-3xl
  └─ Stack of two cards (gap-6 mt-8)
       ├─ Card A — Profile (corner-frame, bg-1, p-6 md:p-8)
       │    ├─ Eyebrow: "PROFILE"
       │    └─ Rows (4): Email · User ID (mono xs, truncate) · Provider · Joined
       │       Each row: label fg-3 mono uppercase tracking-wider | value fg-1
       │       Divider: hairline border-fg-4
       └─ Card B — Subscription (corner-frame, bg-1, p-6 md:p-8)
            ├─ Eyebrow: "SUBSCRIPTION"
            ├─ Plan: "Free · Unlimited" — fg-0, text-xl, mt-2
            ├─ Body:  "All features available during open beta." — fg-1, text-sm
            └─ Footer row: pill "PLAN: BETA" (cyan-dim border) + disabled
              "Manage subscription" button (fg-3 border, fg-3 text, opacity-60)
  └─ Footer (mt-12): Sign out — magenta-framed mono uppercase button
```

### Notes
- No payment integration in this spec. When billing comes (via **Revolut**, like Doppler — not Stripe), the "Manage subscription" button becomes active and links to a Revolut customer portal or in-app upgrade flow.
- "User ID" row: long UUID — render in `font-mono text-xs` and apply `truncate` with `title={id}` for full value on hover.

---

## 5. Ask chat (`/[locale]/ask`)

### Files (in modify order)
- `app/[locale]/ask/layout.tsx` — adjust container, hairline border tokens
- `app/[locale]/ask/page.tsx` — empty-state placement
- `components/ask/conversation-rail.tsx`
- `components/ask/empty-state.tsx`
- `components/ask/composer.tsx`
- `components/ask/message-bubble.tsx`
- `components/ask/streaming-message.tsx` — "Thinking…" + tool badges container
- `components/ask/tool-badge.tsx` — verify token use, restyle if needed
- `components/ask/kill-switch-banner.tsx`
- `components/ask/math-plot.tsx` — the largest change (SceneCard wrap + theme-aware JSXGraph)
- `messages/{en,ru}.json` — new `ask.*` keys for empty-state title/subtitle, "New chat", "no chats yet", role labels, plot caption prefix

### 5.1 Conversation rail

```
aside w-60 border-r border-[var(--color-fg-4)] hidden md:flex flex-col shrink-0
  ├─ Top: "+ NEW CHAT" — cyan-framed mono uppercase, m-3
  └─ ul (overflow-y-auto)
       └─ Each item:
            <Link>
              eyebrow row: mono xs fg-3 uppercase — relative date ("2 days ago")
              title row:   text-sm fg-1 truncate
            </Link>
            Active item: left border accent `border-l-2 border-[var(--color-cyan)]`
            Hover: bg-fg-4/20
```

Empty list copy: mono xs uppercase fg-3, "No chats yet."

### 5.2 Empty state

```
Wrapper: max-w-2xl mx-auto text-center
  ├─ Eyebrow: "ASK PHYSICS"
  ├─ Title:   "What do you want to understand?"  — display, fg-0
  ├─ Subtitle: "Grounded in this site's topics, physicists, and glossary." — fg-1
  └─ Grid 1-col / md:2-col, gap-3, mt-10
       └─ 6 prompt cards (clickable):
            border border-fg-4 hover:border-cyan-dim
            p-4 text-left bg-bg-1
              ├─ Eyebrow: "EXAMPLE 0N" (mono xs, cyan-dim)
              └─ Body:    prompt text  (fg-0, text-sm leading-relaxed)
```

### 5.3 Composer

```
Outer: corner-frame strip, bg-bg-1, p-3 md:p-4, mt-auto
  ├─ Top row (eyebrow line):
  │    ├─ ModelPicker — restyled as mono xs cyan-dim pill (border cyan-dim, px-2 py-1)
  │    └─ Right: "ENTER TO SEND · SHIFT+ENTER NEWLINE" mono xs fg-3 uppercase
  └─ Bottom row:
       ├─ <textarea> bg-bg-0 border-fg-4 focus:border-cyan-dim
       │   placeholder fg-3, rows=2, maxLength=4000
       └─ Send button — cyan-framed mono uppercase, vertically aligned
```

When the user submits, the textarea collapses to render the user bubble + streaming response (existing behaviour). On settle the composer reappears with empty value.

### 5.4 Message bubbles

**User**
```
right-aligned, ml-auto max-w-xl
  Card: corner-frame, bg-bg-1, border-fg-4, px-4 py-3
    ├─ Eyebrow: "YOU" (mono xs cyan-dim)
    └─ prose text  fg-0  leading-relaxed
```

**Assistant**
```
left-aligned, mr-auto max-w-2xl
  No card frame (full surface)
    ├─ Eyebrow: "PHYSICS.AI" (mono xs cyan-dim)
    └─ prose content  fg-0  leading-relaxed
       (renders parts: Prose, InlineScene, MathPlot, Cite)
```

KaTeX + cite component already inherit color tokens — no change needed.

### 5.5 Streaming + tool badges

- "Thinking…" placeholder: replaced with a mono cyan-dim row `STREAMING…` + 3 dots (CSS animation, no extra deps). Keep current behaviour of swapping to bubble once first token arrives.
- Tool badges row sits above the assistant bubble. Each badge:
  - Mono xs uppercase, padding `px-2 py-0.5`
  - Running: `border-fg-4 text-fg-3` with pulsing opacity
  - Ok: `border-cyan-dim text-cyan-dim`
  - Error: `border-magenta text-magenta`

### 5.6 Kill-switch banner

Restyle to a `Callout`-style strip: magenta left border, mono uppercase eyebrow `KILL SWITCH`, body in fg-1.

### 5.7 Plots — biggest change

Wrap the JSXGraph board in `SceneCard` so plots get the same corner-frame treatment as topic figures.

```tsx
// math-plot.tsx (sketch)
import { SceneCard } from "@/components/layout/scene-card";
import { useThemeColors } from "@/lib/hooks/use-theme-colors";

export function MathPlot({ args }: { args: Args }) {
  const ref = useRef<HTMLDivElement>(null);
  const colors = useThemeColors();
  // build caption from args
  const caption = buildCaption(args);   // e.g. "PLOT — y = sin(x)/x · x ∈ [-10, 10]"

  useEffect(() => {
    // initBoard with theme-aware options:
    //   axis colours = colors.fg2 (was --color-fg-3)
    //   gridColor    = colors.fg3 (was --color-fg-4)
    //   strokeColor  = '--color-cyan' (read once)
    //   strokeWidth  = 2
    //   board.containerObj.style.background = 'transparent'
  }, [args, colors]);

  return (
    <SceneCard caption={caption}>
      <div ref={ref} className="w-full h-72 jxgbox" />
    </SceneCard>
  );
}
```

**Caption format**
- `function`: `PLOT — y = {expr} · {variable} ∈ [{lo}, {hi}]`
- `parametric`: `PLOT — x = {x}, y = {y} · t ∈ [{lo}, {hi}]`

**Theme integration**
- Read `--color-cyan` once on mount + on theme change (re-init board on `colors` change).
- Curve stroke = cyan; overlay curves cycle through cyan, magenta, mint, amber.
- Axis ink = `colors.fg2`, grid = `colors.fg3`, board background transparent so the SceneCard `bg-bg-1` shows through.
- Disable navigation, default `keepAspectRatio: false` (matches current behaviour).

**Out of scope for plots**
- Per-conversation FIG numbering — caption is descriptive (`PLOT — …`), no fake FIG.NN.
- Hover tooltips, zoom controls, export-to-PNG — defer.

---

## 6. Translation strings (new)

Add to `messages/en.json` (and mirror in `ru.json` with TODO markers — translation is a follow-up commit, not blocking).

```jsonc
{
  "auth": {
    "signIn": {
      "eyebrow": "SIGN IN",
      "title": "Welcome back",
      "subtitle": "Continue with email or Google.",
      "googleCta": "Continue with Google",
      "divider": "OR",
      "emailPlaceholder": "you@example.com",
      "magicLinkCta": "Send magic link",
      "magicLinkSending": "Sending…",
      "sentEyebrow": "MAGIC LINK SENT",
      "sentBody": "Check {email} for the sign-in link.",
      "sentHelper": "It can take a minute. Check spam if you don't see it."
    }
  },
  "account": {
    "eyebrow": "ACCOUNT",
    "title": "Account",
    "profile": {
      "eyebrow": "PROFILE",
      "email": "Email",
      "userId": "User ID",
      "provider": "Provider",
      "joined": "Joined"
    },
    "subscription": {
      "eyebrow": "SUBSCRIPTION",
      "plan": "Free · Unlimited",
      "body": "All features available during open beta.",
      "pill": "PLAN: BETA",
      "manage": "Manage subscription"
    },
    "signOut": "Sign out"
  },
  "ask": {
    "empty": {
      "eyebrow": "ASK PHYSICS",
      "title": "What do you want to understand?",
      "subtitle": "Grounded in this site's topics, physicists, and glossary.",
      "examplePrefix": "EXAMPLE"
    },
    "rail": {
      "newChat": "+ NEW CHAT",
      "noChats": "No chats yet."
    },
    "composer": {
      "placeholder": "Ask a physics question…",
      "hint": "ENTER TO SEND · SHIFT+ENTER NEWLINE",
      "send": "Send"
    },
    "roles": {
      "user": "YOU",
      "assistant": "PHYSICS.AI"
    },
    "stream": {
      "loading": "STREAMING…"
    },
    "plot": {
      "captionPrefix": "PLOT"
    },
    "killSwitch": {
      "eyebrow": "KILL SWITCH",
      "body": "Ask is temporarily disabled."
    }
  }
}
```

Existing prompt copy in `EmptyState` moves to `messages/en.json` under `ask.empty.prompts` (array of 6 strings).

---

## 7. Build order (suggested)

1. Translation strings — `messages/en.json` (full), `messages/ru.json` (placeholders).
2. Sign-in form + page (auth surface, smallest blast radius).
3. Sign-out button.
4. Account page — Profile card.
5. Account page — Subscription card.
6. Ask `MathPlot` — SceneCard wrap + theme-aware JSXGraph.
7. Ask `MessageBubble` — eyebrow + corner-frame on user side.
8. Ask `EmptyState` — prompt grid restyle.
9. Ask `Composer` — corner-frame strip, model-pill, hint row.
10. Ask `ConversationRail` — accent border, mono eyebrow date.
11. Ask `StreamingMessage` + `ToolBadge` — streaming dots + token-correct badges.
12. Ask `KillSwitchBanner` — Callout-style strip.
13. Smoke pass: `pnpm dev`, walk through sign-in → account → ask → submit "Plot y = sin(x)/x from -10 to 10" → check theme toggle redraws the plot in light theme.

---

## 8. Risks / open questions

- **JSXGraph theme re-init**: re-mounting the board on every theme change is fine for ask plots (rare, low cost). If perf degrades, cache board and update `strokeColor` / `axis.ticks.strokeColor` in place. Defer optimisation until measured.
- **Locale `ru`** translations are placeholder-only in this round; that's intentional. A follow-up commit can run them through the existing translation script if used.
- **`text-muted-foreground` removal**: grep across `app/` and `components/` for any other strays in the auth/account/ask paths and fold them into this work — out-of-scope cleanups elsewhere stay out of scope.
- **Mobile**: rail stays hidden on mobile (existing behaviour). All other surfaces are tested on small widths via the existing responsive rules.
