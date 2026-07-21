# Prompt Pack — how to use

One prompt = one focused session. Run them **in order**; every prompt assumes the acceptance criteria of all previous prompts have passed. Paste the prompt file's content as the session's task (the executor also Reads the files listed in its "Read first" section).

## Executor per phase

| Phase | Prompts | Executor |
|---|---|---|
| P0 backend prep | `P0-1` … `P0-4` | **Fable** (ground-laying) |
| P1 scaffold + design | `P1-1`, `P1-2` | **Fable** |
| P2 content + browse | `P2-1` … `P2-3` | Opus 4.8 |
| P3 reader | `P3-1` … `P3-5` | Opus 4.8 |
| P4 scene toolkit + curated | `P4-1` … `P4-4` | Opus 4.8 |
| P5 auth + Ask | `P5-1` … `P5-6` | Opus 4.8 |
| P6 scene waves | `scene-waves/wave-*.md` | Opus 4.8 |
| P7 playground | `P7-1` … `P7-3` | Opus 4.8 |
| P8 polish + store | `P8-1` … `P8-4` | Opus 4.8 (+ user for signing) |
| P10 monetization (dual-provider subs) | `P10-1` … `P10-4` | Opus 4.8 (+ user for ASC/RevenueCat) |

> P10 adds Apple IAP on iOS via RevenueCat, reconciled into the same `user_billing` row the web (Revolut) billing writes — see `../10-revenuecat-setup.md`. It reverses the R7 "no commerce" stance for iOS IAP (external payment links stay banned). Run P10 only once the app is otherwise store-ready.

## Standing rules (apply to every session; full list in `../01-architecture.md` §8)

1. **Never edit `ios/PhysicsExplained.xcodeproj`.** All code goes in `ios/PhysicsPackages/Sources/<Target>/` or the synchronized `ios/App/` folder.
2. **Build after every 2–3 files**: `swift build --package-path ios/PhysicsPackages` (package work) or the xcodebuild command in `../01-architecture.md` §6 (app work). Never batch 15 files then debug.
3. **No new dependencies** beyond the pinned table in `../01-architecture.md` §3.
4. Contract questions are answered by `../02-api-contracts.md` or the referenced web source file — never from memory.
5. Do not touch web-app files outside `ios/` + `docs/ios/` unless the prompt says so (P0 prompts do).
6. Scenes never draw their own frame/caption — SceneCard owns chrome.
7. Web-repo verification: `npx tsc --noEmit` (there is NO `pnpm lint` — it prompts interactively) and `pnpm test` (vitest; test files must live under `tests/**`).

## When a session fails or is cut short

- Re-run the same prompt in a fresh session. Start by reading the prompt's acceptance criteria and checking which already pass (`git status`, `swift test`, build) — then finish only what's missing.
- If an acceptance criterion is impossible as written (contract drift, missing API), STOP and report; do not improvise around a spec. Fix the doc first, then the code.

## Document map

`../00-prd.md` product scope · `../01-architecture.md` engineering constitution · `../02-api-contracts.md` wire contracts · `../03-design-system.md` visual identity · `../04-block-rendering-spec.md` reader spec · `../05-scene-porting-playbook.md` scene cookbook · `../06-backend-changes.md` P0 backend specs · `../07-implementation-phases.md` phase plan · `../08-risk-register.md` risks · `../10-revenuecat-setup.md` RevenueCat + App Store subscriptions runbook (P10).
