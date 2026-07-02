# P5-4 — Streaming chat UI

Phase P5, prompt 4 of 6. Executor: Opus 4.8. Prerequisites: P5-1..3 (auth, AskClient, fence parser/PlotView), P3 (FormulaView), P4 (FigureView/SceneRegistry).

## Read first
- `/Users/roman/Developer/physics/docs/ios/02-api-contracts.md` §5.3 (event → UI actions), §8 (LaTeX + fence rendering rules, scene id validation/merge order)
- `/Users/roman/Developer/physics/docs/ios/00-prd.md` §3.4 (Ask feature acceptance)
- `/Users/roman/Developer/physics/docs/ios/03-design-system.md` (chat bubbles use the flat canvas identity; glass on the composer bar)
- Web references (behavior, not markup): `/Users/roman/Developer/physics/components/ask/message-bubble.tsx`, `components/ask/progress-tree.tsx`, `components/ask/inline-scene.tsx`

## Task
1. PXAsk: `AskViewModel` (`@MainActor @Observable`): send message → consume `AskClient.stream` → reduce events into `MessageState` (user + assistant messages, streaming flag, tool steps, flag notes, error state). Persist `conversationId` from `meta`. Re-parse fences on the ACCUMULATED assistant text each update (fences split across deltas — 02 §5.4 note); debounce parsing to ≤ every 100 ms.
2. Message rendering: assistant message = `[FencePart]` → vertical stack:
   - text parts: pre-wrapped plain text (preserve newlines, NO markdown) with `$...$`/`$$...$$` extracted → inline/display `FormulaView`. While streaming, only the LAST text part re-renders; completed parts are cached views (streaming perf, risk R4).
   - scene parts: `InlineSceneView` — validate id against the scene catalog (via ContentRepository); merge props `default_props ← fence params`; render native via SceneRegistry, else `snapshot_url` image, else nothing; SceneCard chrome with `fig_label`/`label` caption; unknown id → render nothing (never a broken canvas).
   - plot parts: `PlotView` in SceneCard chrome; invalid args → "plot unavailable" card.
   - cite parts: collect; render nothing inline (sources cards come in P5-5 — leave a `sources: [Cite]` output on the message state).
3. Tool progress tree: `tool-start`/`tool-args`/`tool-end` → collapsible "thinking" tree above the answer (step name, running spinner, ok/error tick, `preview` text) mirroring the web progress tree; collapse automatically when first text delta arrives.
4. `flag` events: reason containing `"max"` → subtle "model hit its output budget" note appended (or error bubble if no text); otherwise `Model flagged: <reason>` note (02 §5.3).
5. Composer: multiline field (1..4000 chars, counter past 3500), send/stop button (stop = cancel task → truncated state), disabled while streaming; model picker menu (`claude-sonnet-4-6` default, `claude-haiku-4-5`, `gpt-5`, `gpt-5-mini`) persisted in UserDefaults key `ask.modelId`.
6. Ask tab screen: empty state with 3–4 suggested prompts, message list with bottom-anchored scroll (pin to bottom while streaming unless user scrolled up), sign-in gate (P5-1) when unauthenticated.

## Do NOT
- No conversation list / history / rename / delete yet (P5-5). New chat per app launch is fine for now.
- No sources cards fetch yet (P5-5).
- Do not run a markdown renderer over chat text.
- Do not block the main thread parsing fences (measure with a 10k-char message).

## Acceptance criteria
- Live chat (real backend, signed in): a question like "explain the simple pendulum with a scene and a plot of T vs L" streams text progressively, renders ≥1 native-or-snapshot scene and ≥1 plot inline, shows the tool tree, ends cleanly on `done`.
- Stop button mid-stream keeps partial text and shows a truncated notice.
- No dropped frames while streaming a long formula-heavy answer (visually smooth on simulator).

## Verify
```bash
swift test --package-path ios/PhysicsPackages
xcodebuild -project ios/PhysicsExplained.xcodeproj -scheme PhysicsExplained \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' build
xcrun simctl io booted screenshot /tmp/p5-4-chat.png   # mid-stream + finished states
```
Report includes both screenshots and the question used.
