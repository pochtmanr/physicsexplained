# P5-6 — Ask resilience + polish

Phase P5, prompt 6 of 6. Executor: Opus 4.8. Prerequisites: P5-1..5. This closes the P5 acceptance gate in `07-implementation-phases.md`.

## Read first
- `/Users/roman/Developer/physics/docs/ios/02-api-contracts.md` §5.2–5.5 (watchdog, truncation, dedup, `UPSTREAM_STALL`)
- `/Users/roman/Developer/physics/docs/ios/08-risk-register.md` rows on SSE lifecycle + streaming perf
- `/Users/roman/Developer/physics/docs/ios/07-implementation-phases.md` §P5 acceptance list

## Task
1. Truncation UX: any stream ending without `done` (network drop, watchdog `CLIENT_STALL`, server `UPSTREAM_STALL`, user stop, app suspension) → keep partial text, append a subtle "answer interrupted" row with a Retry button. Retry re-sends the SAME user message with the SAME `conversationId` — server-side 10 s dedup makes an accidental double-send safe (02 §5.1); still disable the button while in flight.
2. Lifecycle: on `scenePhase == .background` mid-stream, keep the task running (short grace) but mark the message truncated if the app suspends before `done`; on foreground, reconcile by refetching the conversation's stored messages (the server persisted the full answer in its `finally` block — the stored copy wins over the truncated local one).
3. Connectivity: offline at send time → immediate "You're offline" state (NWPathMonitor), don't burn the request; `waitsForConnectivity` covers transient drops mid-request.
4. Streaming perf pass: Instruments (Time Profiler + SwiftUI) on a long formula-heavy answer; fix any main-thread fence-parse or FormulaView churn (completed parts must be cached — P5-4 rule); target no hangs > 100 ms.
5. VoiceOver pass over the chat screen (bubbles readable, tool tree summarized, walls announced) and Dynamic Type up to XL without clipping.
6. Gallery: add a "Chat states" section (streaming, truncated+retry, each error wall, flag note) driven by canned `AskEvent` fixtures so all states are screenshotable without the network.
7. Run the full P5 acceptance list from `07-implementation-phases.md` §P5 and fix whatever fails.

## Do NOT
- Do not implement background URLSession/reconnect-resume of a live SSE stream — out of scope; truncate-and-reconcile is the design.
- Do not add retry loops with backoff beyond the single retry affordance.

## Acceptance criteria (P5 gate)
- `swift test` green (SSE replay + fence parity + plot goldens).
- Kill network (Network Link Conditioner / airplane mode) mid-stream → truncation notice; retry after reconnect succeeds; foreground reconciliation replaces truncated text with the stored full answer.
- Sign out and back in preserves conversations.
- Gallery chat-states section renders all states dark + light.

## Verify
```bash
swift test --package-path ios/PhysicsPackages
xcodebuild -project ios/PhysicsExplained.xcodeproj -scheme PhysicsExplained \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' build
xcrun simctl io booted screenshot /tmp/p5-6-truncated.png
```
Report: the acceptance checklist with pass/fail per item and Instruments findings.
