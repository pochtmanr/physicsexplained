# P8-4 — TestFlight + App Review prep

Phase P8, prompt 4 of 4 — the MVP closeout. Executor: Opus 4.8 (+ the user for signing/App Store Connect actions, which are flagged `[USER]`).

## Read first
- `/Users/roman/Developer/physics/docs/ios/00-prd.md` §5 (success criteria), §3.7 (no-commerce rules)
- `/Users/roman/Developer/physics/docs/ios/08-risk-register.md` (every App-Review row)
- `/Users/roman/Developer/physics/docs/ios/07-implementation-phases.md` §P8 acceptance

## Task
1. App metadata pass (in-app): display name, version/build, Settings "About" (privacy policy + terms links to the website's existing legal pages — legal-page links are allowed; payment links are not), model disclosure line in Ask ("Answers are AI-generated" footer or empty-state note).
2. Assets: app icon (from `logofisicsfinal.svg` — generate the icon set; dark/tinted variants), launch screen matching the dark canvas.
3. `docs/ios/store/review-notes.md`: reviewer instructions — demo account credentials `[USER supplies]`, where Ask lives, that answers are AI-generated with a per-message report action (R15), that NO purchases exist in-app and quota walls sell nothing (R7), account deletion location (Settings), age rating rationale (4+, education).
4. `docs/ios/store/checklist.md`: the full submission checklist — Sign in with Apple present alongside Google (4.8) ✓; account deletion (5.1.1(v)) ✓; privacy labels = P8-3 doc; export compliance (standard encryption exemption); content rights (own content); screenshots list per device class `[USER captures via simulator after final build]`.
5. Final regression sweep: run EVERY phase gate acceptance list (P2–P7) once on the release candidate; fix or file what fails; record results in the checklist.
6. Archive: `[USER]` performs signing setup (team, bundle id, capabilities: Sign in with Apple, ASWebAuthenticationSession needs none) — then:
   ```bash
   xcodebuild -project ios/PhysicsExplained.xcodeproj -scheme PhysicsExplained \
     -destination 'generic/platform=iOS' -configuration Release archive -archivePath /tmp/pe.xcarchive
   ```
   Export + upload via Xcode Organizer or `xcrun altool`/`notarytool` per current tooling `[USER runs the upload]`.

## Do NOT
- Do not add analytics/tracking SDKs to "measure launch" — nothing new ships in this prompt.
- Do not weaken the no-commerce rules to "just add a website link" — that is the named review risk.

## Acceptance criteria (MVP gate)
- Archive builds and validates clean (no manifest/entitlement warnings).
- Regression sweep table: every P2–P7 gate green or explicitly waived by the user.
- `review-notes.md` + `checklist.md` complete except `[USER]` items, which are listed as a handoff.

## Verify
```bash
xcodebuild -project ios/PhysicsExplained.xcodeproj -scheme PhysicsExplained \
  -destination 'generic/platform=iOS' -configuration Release archive -archivePath /tmp/pe.xcarchive 2>&1 | tail -5
```
Report: the handoff list for the user (signing, demo account, screenshots, upload) + regression table.
