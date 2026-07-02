# P5-2 — AskClient: SSE actor + replay tests

Phase P5, prompt 2 of 6. Executor: Opus 4.8. Prerequisites: P5-1 (`TokenProviding` exists).

## Read first
- `/Users/roman/Developer/physics/docs/ios/02-api-contracts.md` §5 (ENTIRE section — request, framing, event table, transcript, error matrix). This prompt implements §5 verbatim.
- `/Users/roman/Developer/physics/docs/ios/01-architecture.md` §4 (actor/stream conventions), §5 (typed errors), §6 (fast test loop)
- Web reference parser (behavior source of truth): `/Users/roman/Developer/physics/components/ask/streaming-message.tsx` lines 54–105

## Task
1. PXModel: `AskEvent` enum with associated payloads for the 8 events (`meta`, `text`, `toolStart`, `toolArgs`, `toolEnd`, `flag`, `error`, `done`) exactly per 02 §5.3, plus `AskRequest` (conversationId/message/locale/modelId) and `AskAPIError` covering the full §5.5 matrix (`.quotaExhausted(reason:)`, `.rateLimited(reason:retryAfter:)`, `.unauthenticated`, `.askDisabled`, `.badRequest(message:)`, `.server(message:)`, `.stream(code:message:)`).
2. PXAPI: `AskClient` actor. `func stream(_ request: AskRequest) -> AsyncThrowingStream<AskEvent, Error>`:
   - `POST <web-origin>/api/ask/stream`, JSON body, `Authorization: Bearer <await tokenProvider.accessToken()>`; web-origin from PXFoundation config.
   - Non-200 → read body JSON, throw the typed error (parse `retry-after` header seconds for 429).
   - 200 → `URLSession.bytes(for:)`; buffer bytes; split frames on `\n\n`; skip frames starting with `:` (heartbeat `: ping`); match `^event: (\w[\w-]*)\ndata: (.*)$` (`.anchorsMatchLines`); JSON-decode `data`; yield.
   - `URLSessionConfiguration` with `waitsForConnectivity = true`, no request timeout shorter than the watchdog.
   - **Watchdog**: if no bytes arrive for 30 s (server pings every 15 s), finish the stream with `AskAPIError.stream(code: "CLIENT_STALL", ...)`.
   - EOF without a prior `done` event → finish with `.stream(code: "TRUNCATED", ...)` AFTER yielding everything received (partial text must survive).
   - 401 → one `refreshSession` + single retry (P5-1 convention), then throw `.unauthenticated`.
   - Task cancellation terminates the URLSession task and the stream cleanly.
3. Tests (`Tests/PXAPITests`): a replay harness feeding canned byte streams into the frame parser (factor parsing so it's testable without networking). Fixtures to check in:
   - the full annotated transcript from 02 §5.4 (verbatim) → assert exact event sequence + payloads, ping skipped;
   - a fence split across two `text` deltas → deltas concatenate;
   - stream ending without `done` → TRUNCATED after partial events;
   - each §5.5 error body (403-style JSON for 503/401/429/402/400/500) → correct typed error, incl. `retryAfter` seconds;
   - `event: error` with `code:"UPSTREAM_STALL"` mid-stream.

## Do NOT
- No UI in this prompt. No fence parsing (P5-3) — `text` deltas pass through raw.
- Do not use `EventSource`/third-party SSE libs.
- Never mock the event names differently from 02 §5.3 — copy strings exactly.

## Acceptance criteria
- `swift test` green including all replay fixtures above.
- A DEBUG-only integration path (behind an env flag, not run in CI) can hit the real endpoint with a signed-in session and print the event sequence `meta → text… → done`.

## Verify
```bash
swift test --package-path ios/PhysicsPackages --filter PXAPITests
swift build --package-path ios/PhysicsPackages
```
Report: paste the replay test names + pass counts, and (if you ran it) the live event-sequence log with text payloads elided.
