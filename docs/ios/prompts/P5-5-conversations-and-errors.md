# P5-5 — Conversations, sources cards, error walls

Phase P5, prompt 5 of 6. Executor: Opus 4.8. Prerequisites: P5-4.

## Read first
- `/Users/roman/Developer/physics/docs/ios/02-api-contracts.md` §6 (conversations + glossary-batch, incl. the "NO web API for history" note), §5.5 (error matrix + required behaviors)
- `/Users/roman/Developer/physics/docs/ios/00-prd.md` §3.4 (conversation management acceptance), §3.7 (quota wall — read twice; compliance-critical)
- `/Users/roman/Developer/physics/docs/ios/01-architecture.md` §5 (error → UI state mapping)

## Task
1. PXAPI `ConversationsAPI`: `list()` (GET, latest 20), `rename(id,title)` / `star(id,starred)` (PATCH), `delete(id)` (DELETE) — bearer auth, typed errors. PXAPI `GlossaryBatchAPI`: POST per 02 §6 (no auth; handle its 429 + retry-after).
2. History: `func messages(conversationId:) async throws -> [StoredMessage]` reading `ask_messages` DIRECTLY via supabase-swift session (RLS): `role, content, created_at, meta` ordered by `created_at`. `content.text` runs through the same fence-part rendering as live messages; `meta.tools` (id/name/status/args/preview) renders the same progress tree in its final state; `meta.flagged` shows the flag note.
3. Conversation UI: sidebar/sheet list (title fallback "New conversation", relative date, star toggle, swipe-to-delete with confirm, rename via text field alert); selecting one loads history and continues it (send passes its `conversationId`); "New chat" action; refresh list after each `done` event (02 §5.3).
4. Sources cards: after a message completes, if it has cites → one glossary-batch call (topics/physicists/glossary slug arrays, request-order preserved) → "Sources" card group at the message end: topics/physicists as navigation rows into the native reader (topic slug = `branch/topic`), glossary as expandable definition cards with related links. Missing slugs silently absent. Cache per conversation.
5. Error walls (mapping per 01 §5, copy per 02 §5.5):
   - 402 `QUOTA_EXHAUSTED` → full-width neutral quota card: reason-specific copy (`free_quota_exhausted`: "You've used your free questions." / `tokens_exhausted`: monthly allowance / `past_due`: "There's a billing issue on your account — manage it on the web."), composer disabled. **NO purchase button, NO price, NO link, NO "upgrade" wording** (App Review risk R7).
   - 429 with `retry-after` → cooldown banner with live mm:ss countdown, composer disabled until elapsed; without retry-after (daily bucket) → show the server `reason`, suggest tomorrow.
   - 503 `ASK_DISABLED` → "Ask is temporarily offline" state, hide composer.
   - 401 after refresh-retry → sign-in gate.
   - 400/500 → generic retry bubble; log via `os.Logger`.
6. Quota display: read own `user_billing` row (`plan, free_questions_used, tokens_used, tokens_allowance, cycle_end`) via RLS; small plan line in Settings and on the quota wall (informational only).

## Do NOT
- No purchase/upgrade UI or external links of any kind on any wall.
- Do not build a web API for history — direct table read is the documented contract.
- Do not trust client-side quota math to gate sends — the server is the authority; the client only renders its errors.

## Acceptance criteria
- Conversation list round-trip: create (send), rename, star, delete — all reflected after re-launch.
- Opening an old conversation reproduces scenes/plots/tool-trees from stored text + meta.
- A message with topic+physicist+glossary cites shows a correctly ordered Sources group; tapping a topic source opens the native reader.
- Forced 402 (test account with exhausted free quota) and forced 429 (>30 requests/h from one IP or the daily bucket) render the specified walls. Screenshot both.

## Verify
```bash
swift test --package-path ios/PhysicsPackages
xcodebuild -project ios/PhysicsExplained.xcodeproj -scheme PhysicsExplained \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' build
xcrun simctl io booted screenshot /tmp/p5-5-quota-wall.png
```
