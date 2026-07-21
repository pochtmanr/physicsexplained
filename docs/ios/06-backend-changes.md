# 06 — Backend Changes (P0, web repo)

Changes to the Next.js/Supabase backend that the iOS app depends on. All are ADDITIVE — no existing web behavior may change. Implemented in phase P0 (see `07-implementation-phases.md`); the client-side contracts they create are documented in `02-api-contracts.md` §4 (taxonomy) and §7 (bearer auth).

Repo root: `/Users/roman/Developer/physics`. Migration style follows the house conventions visible in `supabase/migrations/0010_problems_and_equations.sql` and `0012_scene_catalog_v2.sql` (`create table if not exists`, enable RLS, `drop policy if exists` + `create policy`, section banners).

---

## 1. Migration `supabase/migrations/0013_ios_taxonomy_and_snapshots.sql`

Mirrors the compile-time registry `lib/content/branches.ts` into Postgres so a native client can build navigation without shipping the registry, and adds the scene snapshot column. **The registry stays the source of truth** — these tables are a published projection, rewritten by the publish script (§2).

```sql
-- Physics.explained — iOS support: taxonomy projection + scene snapshots
-- The branch → module → topic registry (lib/content/branches.ts) is the source
-- of truth; scripts/content/publish-taxonomy.ts projects it here. RLS exposes
-- only live rows to clients, so draft essays in content_entries stay unlisted.

--------------------------------------------------------------------------------
-- 1. taxonomy_branches
--------------------------------------------------------------------------------
create table if not exists public.taxonomy_branches (
  slug        text primary key,
  index       int  not null,
  title       text not null,
  eyebrow     text not null,
  subtitle    text not null,
  description text not null,
  status      text not null check (status in ('live','coming-soon')),
  updated_at  timestamptz not null default now()
);

alter table public.taxonomy_branches enable row level security;
drop policy if exists "public reads live branches" on public.taxonomy_branches;
create policy "public reads live branches" on public.taxonomy_branches
  for select to anon, authenticated using (status = 'live');

--------------------------------------------------------------------------------
-- 2. taxonomy_modules
--------------------------------------------------------------------------------
create table if not exists public.taxonomy_modules (
  branch_slug text not null references public.taxonomy_branches(slug) on delete cascade,
  slug        text not null,
  title       text not null,
  index       int  not null,
  updated_at  timestamptz not null default now(),
  primary key (branch_slug, slug)
);

alter table public.taxonomy_modules enable row level security;
drop policy if exists "public reads modules of live branches" on public.taxonomy_modules;
create policy "public reads modules of live branches" on public.taxonomy_modules
  for select to anon, authenticated using (
    exists (select 1 from public.taxonomy_branches b
            where b.slug = branch_slug and b.status = 'live')
  );

--------------------------------------------------------------------------------
-- 3. taxonomy_topics — slug is the BARE topic slug; content_entries.slug for a
--    topic is branch_slug || '/' || slug.
--------------------------------------------------------------------------------
create table if not exists public.taxonomy_topics (
  branch_slug     text not null references public.taxonomy_branches(slug) on delete cascade,
  module_slug     text not null,
  slug            text not null,
  title           text not null,
  eyebrow         text not null,
  subtitle        text not null,
  reading_minutes int  not null,
  index           int  not null,
  status          text not null check (status in ('live','draft','coming-soon')),
  updated_at      timestamptz not null default now(),
  primary key (branch_slug, slug)
);
create index if not exists taxonomy_topics_module_idx
  on public.taxonomy_topics (branch_slug, module_slug, index);

alter table public.taxonomy_topics enable row level security;
drop policy if exists "public reads live topics" on public.taxonomy_topics;
create policy "public reads live topics" on public.taxonomy_topics
  for select to anon, authenticated using (
    status = 'live'
    and exists (select 1 from public.taxonomy_branches b
                where b.slug = branch_slug and b.status = 'live')
  );

--------------------------------------------------------------------------------
-- 4. scene_catalog.snapshot_url — filled by scripts/ios/snapshot-scenes.ts
--------------------------------------------------------------------------------
alter table public.scene_catalog
  add column if not exists snapshot_url text;
```

Notes:
- `index` is a reserved-ish word but valid as a quoted/plain column in Postgres; the existing registry uses it — keep the name for 1:1 mapping. If PostgREST ordering is awkward, `order=index.asc` works fine.
- Writes are service-role only (RLS has no insert/update policies) — same pattern as `content_entries`.
- Topic `index`: the registry has no explicit topic index; derive it in the publish script from the FIG number in `eyebrow` (`FIG.16 · OSCILLATIONS` → 16; suffixed figures like `03c` → parse leading int, tiebreak by suffix) with array position as fallback. Keep the derivation IN THE SCRIPT so the DB stays a dumb projection.

Apply with the Supabase MCP `apply_migration` tool or `supabase db push`, then verify (§5).

---

## 2. Publish script `scripts/content/publish-taxonomy.ts`

New CLI script, modeled on `scripts/content/publish.ts` (dotenv, `getServiceClient()` from `@/lib/supabase-server`, `--dry-run` flag).

Behavior:
1. `import { BRANCHES } from "@/lib/content/branches"` (verify the export name in that file first; it aggregates per-branch consts).
2. Flatten to three row arrays matching §1 exactly (topics get `index` derived from `eyebrow` FIG number, fallback array position).
3. Upsert each table (`onConflict` on the PK), then DELETE rows whose keys are no longer in the registry (full projection semantics — renames/removals propagate). Log inserted/updated/deleted counts per table.
4. `--dry-run` prints the diff without writing.

Wire into `package.json` scripts:
```json
"content:publish-taxonomy": "tsx --conditions=react-server scripts/content/publish-taxonomy.ts"
```

Drift guard: taxonomy changes only take effect for iOS after this script runs. Add a vitest under `tests/` that fails when registry branch/topic counts differ from a committed snapshot (cheap reminder), and note in the script header that `content:publish-taxonomy` belongs in the same checklist as `content:publish`.

---

## 3. Bearer-token auth for `/api/ask/*`

Currently native clients cannot authenticate: `middleware.ts:12-15` requires an `sb-<ref>-auth-token` cookie, and routes resolve the user via `getSsrClient()` (cookies). Add an additive bearer path. **The cookie path must remain byte-for-byte untouched.**

### 3.1 `middleware.ts`

In the API branch (`middleware.ts:22-27`), treat a Bearer header as satisfying the presence check:

```ts
function hasAuthHint(req: NextRequest): boolean {
  return hasSupabaseCookie(req) ||
    (req.headers.get("authorization")?.startsWith("Bearer ") ?? false);
}
```
Use `hasAuthHint` only in the `/api/` branch (line 23). The page-redirect branch (line 31) keeps `hasSupabaseCookie` — browsers don't send bearer headers. This stays a lightweight hint; real validation is in the routes.

### 3.2 `lib/supabase-server.ts` — new helper

```ts
// Resolves the caller in API routes: native clients send
// `Authorization: Bearer <supabase access_token>`, browsers use SSR cookies.
// Returns an RLS-scoped client (queries run AS the user) plus the user.
export async function getRequestClient(req: Request): Promise<{
  db: SupabaseClient; user: User | null;
}> {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const jwt = authHeader.slice("Bearer ".length);
    const db = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${jwt}` } },  // RLS runs as the user
    });
    const { data: { user } } = await db.auth.getUser(jwt);       // validates signature + expiry
    return { db, user };
  }
  const db = await getSsrClient();
  const { data: { user } } = await db.auth.getUser();
  return { db, user };
}
```

### 3.3 Route updates (mechanical)

In `app/api/ask/stream/route.ts:47-49`, `app/api/ask/conversations/route.ts`, `app/api/ask/conversations/[id]/route.ts`: replace the `getSsrClient()` + `auth.getUser()` pair with `const { db, user } = await getRequestClient(req)`; keep every subsequent use identical (`db` replaces the ssr client for the RLS-scoped conversation queries; the stream route continues using `getServiceClient()` for its service-role writes). `glossary-batch` needs no change (unauthenticated).

### 3.4 Acceptance (curl regression — BOTH paths)

```bash
# 1. Bearer path streams (get a token via supabase-js signInWithPassword/OTP for a test user)
curl -sN https://<origin>/api/ask/stream -H 'content-type: application/json' \
  -H "authorization: Bearer $TOKEN" \
  -d '{"message":"What is a pendulum?"}' | head -20        # → event: meta …

# 2. No credentials → 401 from middleware
curl -s -o /dev/null -w '%{http_code}' https://<origin>/api/ask/stream -X POST -d '{}'   # → 401

# 3. Cookie path unchanged: sign in via the web UI, ask a question — streams as before.

# 4. Bearer on conversations
curl -s https://<origin>/api/ask/conversations -H "authorization: Bearer $TOKEN"          # → {"conversations":[…]}

# 5. Garbage bearer → 401
curl -s -o /dev/null -w '%{http_code}' https://<origin>/api/ask/conversations \
  -H 'authorization: Bearer nonsense'                                                     # → 401
```

---

## 4. Scene snapshot pipeline

Gives every one of the ~503 registry scenes a static PNG so unported figures render as designed images in the iOS reader (`05-scene-porting-playbook.md` explains the native-first lookup).

### 4.1 Render surface: `app/dev/scene/[id]/page.tsx` (new)

No standalone-scene route exists today (`/sandbox` is a primitives showcase; `dictionary/[slug]` renders via `Visualization` but is slug-, not scene-id-, keyed). Add a minimal page OUTSIDE `app/[locale]` (no intl middleware concerns — path starts with `/dev`, excluded from `PROTECTED`):

- Guarded: return `notFound()` unless `process.env.SCENE_SNAPSHOT_MODE === "1"` (never available in prod).
- Renders: `<html data-theme="dark">`, black `#07090E` background, a single 720 px-wide container with `SIMULATION_REGISTRY[id]` mounted with `GENERATED_SCENE_META[id].defaultProps ?? {}`, no SceneCard chrome (iOS supplies its own chrome), and a `<div id="scene-ready">` marker rendered after mount.

### 4.2 Script `scripts/ios/snapshot-scenes.ts`

Playwright (devDependency) against `SCENE_SNAPSHOT_MODE=1 pnpm dev`:

1. Enumerate ids from `lib/content/simulation-registry.ts` (export the id list or parse the keys — prefer adding `export const SIMULATION_IDS`).
2. For each id: `page.goto('http://localhost:3000/dev/scene/'+id)`, viewport 760×900, `deviceScaleFactor: 2`, wait for `#scene-ready` + one `requestAnimationFrame` settle (~800 ms for animated scenes so they show a mid-motion frame), screenshot the scene container element.
3. Upload via service-role client to a NEW **public** storage bucket `scene-snapshots` as `<id>.png` (`upsert: true`). Create the bucket idempotently in the script.
4. `update scene_catalog set snapshot_url = <public url> where id = <id>`. Ids missing from scene_catalog: log and skip the update (snapshot still uploaded).
5. Failure handling: try/catch per scene; at the end print `ok=<n> failed=[ids...]` and exit 0 if ≥95% succeeded (a handful of DOM-only scenes may not render standalone — they land in the failure list for manual follow-up). `--only <id>` flag for retries.

Wire: `"ios:snapshot-scenes": "tsx scripts/ios/snapshot-scenes.ts"`.

### 4.3 Acceptance

- `select count(*) from scene_catalog where snapshot_url is not null` ≈ registry count (± reported failures).
- `curl -I` two random snapshot URLs → 200, `image/png`.
- Spot-check 5 PNGs visually (dark bg, correct DPR crispness).

---

## 5. P0 verification checklist (run after §1–§4)

```bash
# Taxonomy: anon sees live only
curl -s "$SUPA/rest/v1/taxonomy_branches?select=slug,status&order=index" -H "apikey: $ANON" -H "authorization: Bearer $ANON"
#   → live branches only (no quantum/modern-physics while coming-soon)
curl -s "$SUPA/rest/v1/taxonomy_topics?branch_slug=eq.classical-mechanics&select=slug,status&limit=200" -H "apikey: $ANON" -H "authorization: Bearer $ANON" | grep -c draft   # → 0
# Known-draft probe: pick any registry topic with status:'draft' and confirm absence.
```
Plus the §3.4 curls and §4.3 checks. Also confirm `pnpm test` and `pnpm build` still pass (middleware change touches every route).

---

## 6. Auth configuration checklist (Supabase dashboard — P0 verify, P5 consume)

1. **CAPTCHA**: Dashboard → Auth → Settings → Bot and Abuse Protection. If Turnstile/CAPTCHA is ENABLED, native email OTP will fail without a `captchaToken` (web sign-in passes one from `components/forms/turnstile-widget.tsx` via `app/actions/auth.ts`). For MVP either disable it or accept web-only OTP; decide and record before P5. The `/api/ask/*` routes themselves need no Turnstile.
2. **Sign in with Apple**: enable Apple provider; Services ID + key from the Apple Developer account; add the iOS bundle id; authorized redirect `https://cpcgkkedcfbnlfpzutrc.supabase.co/auth/v1/callback`. In Xcode: "Sign in with Apple" capability.
3. **Google**: existing web OAuth client stays (its client id + secret configure the Supabase Google provider). The app uses the **browser-redirect** flow (`AuthService.signInWithGoogle` → `signInWithOAuth(provider: .google)` via `ASWebAuthenticationSession`), **not** `signInWithIdToken` — so **no iOS-type OAuth client is needed** in Google Cloud. The one required native step is on the Supabase side: add the app's deep link `physicsexplained://auth-callback` to **Auth → URL Configuration → Redirect URLs**. If it is missing, GoTrue rejects the requested redirect and falls back to the **Site URL**, so the browser lands on the website instead of returning to the app (the classic "Google login redirects to the web site" symptom).
4. **Email OTP**: confirm the magic-link/OTP template includes the 6-digit code (`{{ .Token }}`) — native flows type the code rather than click a link.
5. **Account deletion** (App Review 5.1.1(v), built in P8): a small authenticated endpoint (`app/api/account/delete/route.ts`, service-role cascade + `auth.admin.deleteUser`) that deletes the `auth.users` row (cascades wipe `ask_*`, `user_billing`, attempts). Not part of P0; the full spec lives in `prompts/P8-3-account-deletion-privacy.md`.
