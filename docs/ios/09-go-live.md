# 09 — Go-live: OAuth providers → App Store

The end-to-end path from "nothing is configured" to "the app is on the App Store".
Written against the code as it actually exists on `feat/ios-p8-ipad` (2026-07-20), not
against the plan docs — where the two disagree, this file says so and the code wins.

Everything here is either a **`[YOU]`** step (a console/dashboard action only you can
perform, because it needs your Apple/Google credentials) or a **`[CODE]`** step (a repo
change that can be done here).

---

## 0. Where you actually stand

Facts verified in the repo, not assumptions:

| Thing | State |
|---|---|
| Bundle ID | `com.physicsexplained.app` (`ios/project.yml`) |
| Display name | `Physics.explained` |
| Version / build | `0.1.0` / `1` |
| Deployment target | **iOS 26.0** — see §1.1, this is a decision you should re-open |
| Devices | iPhone + iPad (`TARGETED_DEVICE_FAMILY: "1,2"`) |
| Apple Dev team | `SIMNETIQ LTD (F7YY9U667A)` — organization, paid membership present |
| Signing certs on this Mac | Apple Development ✅ · **Apple Distribution ❌ (missing)** |
| Provisioning profiles for this app | none |
| Sign in with Apple entitlement | ✅ `ios/Support/PhysicsExplained.entitlements` |
| Apple sign-in code | ✅ native, `PXAPI/AuthService.swift:132` |
| Google sign-in code | ✅ browser flow, `PXAPI/AuthService.swift:175` |
| Email OTP code | ✅ `PXAPI/AuthService.swift:199` |
| Supabase project | `cpcgkkedcfbnlfpzutrc` → `https://cpcgkkedcfbnlfpzutrc.supabase.co` |
| API base URL | `https://physics.it.com` (`ios/App/PhysicsConfig.plist`, gitignored, already filled in) |
| OAuth redirect | `physicsexplained://auth-callback` — scheme already in `CFBundleURLTypes` ✅ |
| Account deletion endpoint | ✅ `app/api/account/delete/route.ts` (**untracked — not committed yet**) |
| Account deletion UI | ✅ `ios/App/Settings/DeleteAccountSection.swift` |
| `PrivacyInfo.xcprivacy` | ❌ missing — blocks a clean archive |
| `docs/ios/store/` | ❌ does not exist (review notes, checklist, privacy labels all unwritten) |
| App icon | ✅ `appicon-1024.png` present |
| Fastlane / CI / ExportOptions | ❌ none |

So: **the code is largely there; the configuration and the store paperwork are not.**

### 0.1 The one contradiction you must not follow

`docs/ios/06-backend-changes.md` §6.3 tells you to create an **iOS-type** OAuth client in
Google Cloud and register it as an authorized client ID, because native Google sign-in
uses `signInWithIdToken`.

**That is not what shipped.** `AuthService.swift:175` uses `signInWithOAuth(provider: .google)`
through `ASWebAuthenticationSession`, with an explicit comment at line 172 rejecting the
GoogleSignIn SDK as an unwanted dependency. There is no `GoogleSignIn` package, no
`GIDClientID`, no `GoogleService-Info.plist` anywhere in the repo.

Consequence: you need a **Web**-type Google OAuth client, not an iOS one, and the
"authorized client IDs" field in Supabase stays empty for Google. Follow §3 below, not
06 §6.3. (Fix or annotate 06 §6.3 so this doesn't bite you again.)

---

## 1. Prerequisites

### 1.1 `[YOU]` — Reconsider the iOS 26.0 deployment target

`project.yml` targets **iOS 26.0**. That is the current major release, so you are shipping to
devices updated within roughly the last year and excluding everyone else. For a first launch
this is usually the wrong trade — dropping to iOS 18.0 typically multiplies the addressable
install base several times over.

This is a product call, not a blocker. But make it *before* you build a store listing around
the app, because lowering it later may require code changes (any iOS 26-only API in use has to
be `@available`-gated). Decide now:

- Keep 26.0 → skip ahead, nothing to do.
- Lower it → change `deploymentTarget` in `ios/project.yml` **and** `platforms:` in
  `ios/PhysicsPackages/Package.swift`, then build and fix what breaks. Budget real time for this.

### 1.2 `[YOU]` — Confirm the Apple Developer Program membership is active

Your Mac has a `Developer ID Application: SIMNETIQ LTD (F7YY9U667A)` certificate, which only
exists for paid memberships — so you're enrolled. Confirm it hasn't lapsed:

1. Go to <https://developer.apple.com/account>.
2. Check **Membership details** — status Active, and note the expiry date.
3. Confirm your role is **Account Holder** or **Admin**. App Store Connect app creation and
   agreement acceptance require it; a Developer-role account cannot do §6.

If the membership has lapsed, renew before anything else — the Sign in with Apple entitlement
will not sign without it.

### 1.3 `[YOU]` — Accept the agreements

App Store Connect → **Business** → **Agreements, Tax, and Banking**. The *Paid Applications*
agreement is not needed (the app is free and, per risk R7, sells nothing), but the **free
apps agreement must show Active** or your build can never be submitted. Accept any pending
agreement now; a stale agreement is the single most common reason a finished build sits
un-submittable.

---

## 2. Sign in with Apple

Two halves that must agree: the Apple side declares the app may use Apple sign-in; the
Supabase side declares it will accept identity tokens minted for that bundle ID.

Because the app uses the **native** flow (`ASAuthorizationController` →
`signInWithIdToken`), this is much less work than the web flow. You do **not** need a
Services ID, a `.p8` key, a Key ID, or a client secret — those are only required if you
later add Apple sign-in to the *website*.

### 2.1 `[YOU]` — Register the App ID and enable the capability

1. <https://developer.apple.com/account/resources/identifiers/list>
2. If `com.physicsexplained.app` is not listed: **+** → **App IDs** → **App** → Continue.
   - Description: `Physics Explained`
   - Bundle ID: **Explicit** → `com.physicsexplained.app`
3. In the Capabilities list, tick **Sign In with Apple**. Leave it as **Enable as a primary
   App ID** (the default) — you are not grouping this with other apps.
4. Save / Continue → Register.

> Xcode's automatic signing can create the App ID for you on first archive, but it is less
> reliable about enabling capabilities. Creating it by hand first avoids a confusing
> "provisioning profile doesn't include the com.apple.developer.applesignin entitlement"
> failure later.

### 2.2 `[YOU]` — Enable the Apple provider in Supabase

1. <https://supabase.com/dashboard/project/cpcgkkedcfbnlfpzutrc/auth/providers>
2. Expand **Apple** → toggle **Enable Sign in with Apple**.
3. **Client IDs**: enter `com.physicsexplained.app`.
   This field is a comma-separated allow-list of audiences Supabase will accept in the `aud`
   claim of an Apple identity token. The bundle ID goes here. This is the field that makes
   native sign-in work — get it wrong and every attempt fails with an audience mismatch.
4. **Secret Key (for OAuth)** / Services ID: leave blank. Only the web flow needs them.
   If the dashboard refuses to save without them, that means it wants the OAuth flow
   configured too — in that case either generate a Services ID + `.p8` key (Apple portal →
   Identifiers → Services IDs, and Keys → new key with Sign in with Apple enabled), or
   confirm you can save with Client IDs alone. Client IDs alone is sufficient for this app.
5. Save.

### 2.3 Verify

Build to a **real device or a simulator signed into iCloud**, tap "Continue with Apple".
Expect: system sheet → Face ID / password → app lands signed in.

Failure decoding table:

| Symptom | Cause |
|---|---|
| Build fails to sign, entitlement not in profile | §2.1 capability not enabled, or membership lapsed |
| Sheet appears, then "Unacceptable audience in id_token" | §2.2 step 3 — bundle ID missing from Client IDs |
| Sheet appears, then invalid nonce | Nonce mismatch; `AppleSignIn.prepare` hashes the raw nonce, Supabase gets the raw one — don't "fix" this |
| No sheet at all | Device not signed into iCloud |

> **The name-only-once trap.** Apple returns the user's full name on the *very first*
> authorization for a given Apple ID and never again — it is not in the identity token.
> `AuthService.swift:152-162` already persists it. If you delete a test user in Supabase and
> sign in again, the name will be blank forever unless you also revoke the app under
> **Settings → Apple Account → Sign in with Apple** on the test device. Expect this while
> testing; it is not a bug.

---

## 3. Google Sign-In

### 3.1 What the app actually does

`signInWithOAuth(provider: .google)` opens `ASWebAuthenticationSession`, which sends the
user to Supabase's `/auth/v1/authorize`, which redirects to Google, which redirects back to
Supabase's `/auth/v1/callback`, which finally redirects to `physicsexplained://auth-callback`
where the session-bearing URL is caught by the auth session (PKCE). `RootView.swift:186-193`
deliberately ignores that URL in `onOpenURL` because the auth session consumes it first.

So Google never talks to your app directly. **Google only ever needs to know about Supabase's
callback URL** — hence a Web-type client.

### 3.2 The good news

The website already signs in with Google (`app/actions/auth.ts:27-36`, live on
`https://physics.it.com`). That means the Google Cloud OAuth client and the Supabase Google
provider are **already configured and working**. In the common case your only iOS-specific
task is §3.5 — adding the custom-scheme redirect to the allow-list.

Verify before doing more work: open <https://physics.it.com>, sign in with Google. If it
works, skip to §3.5.

### 3.3 `[YOU]` — Google Cloud: OAuth consent screen (only if not already done)

1. <https://console.cloud.google.com> → select (or create) the project.
2. **APIs & Services** → **OAuth consent screen**.
3. User type **External**. Fill:
   - App name: `Physics.explained`
   - User support email: `hello@simnetiq.store`
   - App logo (optional, triggers brand verification if set — skip for launch)
   - Application home page: `https://physics.it.com`
   - Privacy policy: `https://physics.it.com/en/privacy`
   - Terms of service: `https://physics.it.com/en/terms`
   - Authorized domain: `physics.it.com`
   - Developer contact: your email
4. Scopes: **only** `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile`. These are
   non-sensitive, so Google will not require a security review. Do not add anything else —
   a sensitive or restricted scope turns this into a weeks-long verification process.
5. **Publish the app** (Publishing status → In production). While it is in *Testing*, only
   explicitly listed test users can sign in, capped at 100, and everyone else hits an
   "unverified app" warning. With only non-sensitive scopes, publishing is instant.

### 3.4 `[YOU]` — Google Cloud: the OAuth client (only if not already done)

1. **APIs & Services** → **Credentials** → **Create credentials** → **OAuth client ID**.
2. Application type: **Web application**. ← *not* iOS. See §0.1.
3. Name: `Supabase — Physics.explained`
4. **Authorized redirect URIs** → Add:
   ```
   https://cpcgkkedcfbnlfpzutrc.supabase.co/auth/v1/callback
   ```
   This is the only entry needed. Not the app scheme, not `physics.it.com` — Google talks
   to Supabase, and Supabase talks to everyone else.
5. Create → copy the **Client ID** and **Client secret**.
6. Supabase dashboard → **Authentication → Providers → Google** → enable → paste Client ID
   and Client secret → Save. Leave *Authorized Client IDs* empty (that field is for the
   native `signInWithIdToken` flow this app does not use).

### 3.5 `[YOU]` — Add the app's redirect URL to the Supabase allow-list ← **the actual iOS step**

1. <https://supabase.com/dashboard/project/cpcgkkedcfbnlfpzutrc/auth/url-configuration>
2. Under **Redirect URLs**, click **Add URL** and add:
   ```
   physicsexplained://auth-callback
   ```
3. Save.

Without this, Supabase refuses the redirect *before the app ever sees a browser*, and the
sign-in fails with a redirect-not-allowed error that looks like a Google problem but isn't.

While you are on this screen, confirm the existing web entries (`https://physics.it.com/**`
or similar) are intact — do not replace them.

### 3.6 Verify

Run on device, tap the Google button. Expect: in-app browser → Google account chooser →
brief Supabase redirect → browser dismisses → signed in.

| Symptom | Cause |
|---|---|
| "requested path is invalid" / redirect not allowed | §3.5 not done |
| Google shows "Access blocked: app not verified" | §3.3 step 5 — consent screen still in Testing |
| `redirect_uri_mismatch` from Google | §3.4 step 4 — Supabase callback URI missing/typo'd |
| Browser opens and immediately closes, no session | Scheme mismatch between `CFBundleURLTypes` and `defaultAuthRedirectURL` — both are `physicsexplained`, so check you didn't override `AuthRedirectURL` in `PhysicsConfig.plist` |

---

## 4. Email OTP — one decision to make

`AuthService.sendOTP` calls `signInWithOTP(shouldCreateUser: true)`. Two dashboard settings
govern whether it works:

1. **CAPTCHA.** `app/actions/auth.ts:9-11` notes Turnstile is wired on the web "harmless
   (ignored) until enabled in the dashboard". **If you ever enable CAPTCHA protection in
   Supabase Auth settings, native email OTP breaks permanently** — a native iOS app cannot
   produce a Turnstile token, and there is no workaround in app code. Check
   Authentication → Settings → Bot and Abuse Protection. Decide: either leave CAPTCHA off,
   or accept that iOS ships with Apple + Google only.
2. **Email template.** Authentication → Emails → *Magic Link* template must contain
   `{{ .Token }}` (the 6-digit code), not only `{{ .ConfirmationURL }}`. The app asks the
   user to type a code; if the template only sends a link, there is no code to type.

---

## 5. `[CODE]` — Blockers to clear before the first archive

These are repo changes, not console work. Each one will either fail the archive or fail
review.

1. **`PrivacyInfo.xcprivacy` is missing.** Required for App Store submission. It goes in
   `ios/App/` (which is a synchronized folder, so no project edit needed). Must declare:
   collected data types (email + user ID for app functionality; chat content as user content
   linked to identity; no tracking, no ads) and required-reason API declarations, after
   auditing what supabase-swift / GRDB / Nuke / SwiftMath already declare. Spec: `P8-3` §3.

2. **Commit `app/api/account/delete/route.ts`.** It is currently untracked (`?? app/api/account/`).
   Account deletion is a hard review requirement (guideline 5.1.1(v)) and the endpoint must be
   deployed to `physics.it.com` before review, not just present locally.

3. **The privacy policy text is wrong.** `messages/en/legal.json` (`privacy.whatWeCollect`)
   enumerates theme preference, Vercel Analytics, contact form, and newsletter. It says
   nothing about **user accounts, email addresses, user IDs, or AI chat content** — all of
   which the app collects. App Review compares your privacy policy against your nutrition
   labels; a mismatch is a straightforward rejection. Update the policy copy (all locales)
   and bump `lastUpdated`. **This is hand-translation work across locales — do it by hand.**

4. **Pin signing in `project.yml`.** The `.xcodeproj` currently carries
   `DEVELOPMENT_TEAM = F7YY9U667A` and `CODE_SIGN_IDENTITY = "iPhone Developer"`, but
   `project.yml` has no signing block at all. `project.yml` is the source of truth and the
   `.xcodeproj` is a generated artifact — **the next `xcodegen generate` silently wipes your
   team and you get an unsigned archive.** Add under `targets.PhysicsExplained.settings.base`:
   ```yaml
   DEVELOPMENT_TEAM: F7YY9U667A
   CODE_SIGN_STYLE: Automatic
   ```
   Then `xcodegen generate --spec ios/project.yml` and confirm the values survived.

5. **Write `docs/ios/store/`.** `review-notes.md`, `checklist.md`, `privacy-labels.md` — all
   specified by P8-3/P8-4, none written. §6.4 and §9 depend on them.

6. **Bump the version.** `MARKETING_VERSION: "0.1.0"` reads as pre-release. Ship `1.0.0`.
   `CURRENT_PROJECT_VERSION` must increase on *every* upload — App Store Connect permanently
   rejects a build number it has seen before, even from a deleted build.

7. **Run the P8-3 / P8-4 / P8-5 prompts** if they haven't been executed — they own the AI
   disclosure line, the report-a-message action, and the Settings tab. Check
   `docs/ios/prompts/README.md` for what's done.

8. **`PhysicsConfig.plist` is gitignored.** It exists on this Mac with correct production
   values. Any other machine (or CI) archives a non-launching app without it — `AppEnvironment.load()`
   throws at startup. If you ever add CI, materialize this file from secrets.

---

## 6. `[YOU]` — Create the App Store Connect record

Do this before archiving; the upload needs somewhere to land.

1. <https://appstoreconnect.apple.com> → **Apps** → **+** → **New App**.
2. Fill:
   - Platforms: **iOS**
   - **Name**: `Physics.explained` — max 30 chars and **globally unique across the entire
     App Store**. If taken, you must pick another; have a fallback ready
     (e.g. `Physics.explained — Learn`).
   - Primary language: English (U.S.)
   - **Bundle ID**: pick `com.physicsexplained.app` from the dropdown. If it isn't there,
     §2.1 wasn't done.
   - **SKU**: any internal string, e.g. `PHYSICSEXPLAINED-IOS-001`. Never shown publicly.
   - User Access: Full Access.
3. Create.

### 6.1 App information

- **Category**: Primary *Education*. Secondary *Reference* (optional).
- **Age rating**: answer all questions "None" → yields **4+**. Justify in review notes:
  educational physics content.
- **Content rights**: you own / are licensed for the content.
- **Privacy Policy URL**: `https://physics.it.com/en/privacy` — mandatory, and it must
  resolve publicly (verify in a private window).

### 6.2 Pricing and availability

- Price: **Free**.
- Availability: all territories (or restrict as you like).
- **Do not** configure in-app purchases. Per risk R7 this app sells nothing in-app, and the
  quota wall must not link to web payment. Adding an IAP product here contradicts the review
  notes and invites scrutiny.

### 6.3 App Privacy (nutrition labels)

**App Privacy** section → **Get Started**. Answer from `docs/ios/store/privacy-labels.md`
(§5 item 5), and keep it consistent with both `PrivacyInfo.xcprivacy` and the privacy policy
copy — reviewers do cross-check all three. Expect roughly:

- **Contact Info → Email Address** — App Functionality, *linked to identity*, not used for tracking.
- **User Content → Other User Content** (chat messages) — App Functionality, *linked to identity*, not tracking.
- **Identifiers → User ID** — App Functionality, *linked to identity*, not tracking.
- **Tracking**: No. (No analytics SDK ships in the app — do not add one now, per P8-4.)

### 6.4 Version metadata

- **Description**, **Keywords**, **Promotional text**, **What's New** (`1.0.0` → "Initial release").
- **Support URL**: `https://physics.it.com/en/about` (has a `mailto:hello@simnetiq.store`).
- **Marketing URL**: `https://physics.it.com` (optional).
- Include a plain sentence in the description that answers are AI-generated. The in-app
  disclosure is required by risk R15; saying it in the listing too costs nothing and
  pre-empts a reviewer question.

### 6.5 Screenshots

Because `TARGETED_DEVICE_FAMILY` is `"1,2"`, **iPad screenshots are required**, not optional.
Current requirements — Apple scales these down for smaller devices automatically:

| Class | Size (portrait) | Count |
|---|---|---|
| iPhone 6.9" | 1290 × 2796 or 1320 × 2868 | 3–10 (min 1, but ship 5+) |
| iPad 13" | 2064 × 2752 or 2048 × 2732 | 3–10 |

Capture from the simulator on a **Release** build:

```bash
# iPhone 6.9"
xcrun simctl boot "iPhone 17 Pro Max"
# ... drive the app to each screen, then per shot:
xcrun simctl io booted screenshot ~/Desktop/shots/iphone-01.png

# iPad 13"
xcrun simctl boot "iPad Pro 13-inch (M4)"
xcrun simctl io booted screenshot ~/Desktop/shots/ipad-01.png
```

Verify the pixel dimensions match the table exactly (`sips -g pixelWidth -g pixelHeight file.png`)
— App Store Connect rejects off-by-one sizes. Suggested five: Browse, a topic/reader screen,
a scene or the playground, Ask mid-answer, and the formula rendering.

---

## 7. Signing and the first archive

### 7.1 `[YOU]` — Get Xcode ready to sign for distribution

You currently have **no Apple Distribution certificate**. Xcode will create one:

1. Xcode → **Settings** → **Accounts** → **+** → Apple ID → sign in.
2. Select the account → select team **SIMNETIQ LTD** → **Manage Certificates…** → **+** →
   **Apple Distribution**. (Or let step 7.3 create it on demand.)
3. Note: a team can hold a limited number of distribution certificates. If you're at the cap,
   reuse the existing one rather than revoking — revoking invalidates anything already signed with it.

### 7.2 `[CODE]` — Regenerate and confirm

```bash
cd /Users/roman/Developer/physics
xcodegen generate --spec ios/project.yml
grep -n "DEVELOPMENT_TEAM\|CODE_SIGN_STYLE" ios/PhysicsExplained.xcodeproj/project.pbxproj
```

Expect `F7YY9U667A` and `Automatic` to appear. If they don't, §5 item 4 wasn't applied and
the archive will be unsigned.

### 7.3 `[YOU]` — Archive via Xcode (recommended for the first time)

1. Open `ios/PhysicsExplained.xcodeproj`.
2. Destination selector → **Any iOS Device (arm64)**. *(Archive is greyed out while a
   simulator is selected — this trips up everyone once.)*
3. Target → **Signing & Capabilities**: **Automatically manage signing** ticked, Team =
   SIMNETIQ LTD. Confirm **Sign in with Apple** appears in the capability list. If Xcode shows
   a provisioning error, hit **Try Again** — it registers the App ID and mints the profile.
4. **Product → Archive**. Takes a while (Swift 6 strict concurrency, Release optimization).
5. Organizer opens with the archive.
6. **Validate App** first — this catches missing privacy manifests, icon problems, and
   entitlement mismatches *before* burning a build number. Fix anything it reports and
   re-archive with a bumped `CURRENT_PROJECT_VERSION`.
7. **Distribute App** → **App Store Connect** → **Upload** → automatic signing → Upload.

### 7.4 The CLI path (for later / CI)

```bash
cd /Users/roman/Developer/physics

xcodebuild -project ios/PhysicsExplained.xcodeproj \
  -scheme PhysicsExplained \
  -destination 'generic/platform=iOS' \
  -configuration Release \
  -archivePath /tmp/pe.xcarchive \
  archive
```

Create `ios/ExportOptions.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>method</key>            <string>app-store-connect</string>
	<key>teamID</key>            <string>F7YY9U667A</string>
	<key>signingStyle</key>      <string>automatic</string>
	<key>uploadSymbols</key>     <true/>
	<key>destination</key>       <string>upload</string>
</dict>
</plist>
```

Then:

```bash
xcodebuild -exportArchive \
  -archivePath /tmp/pe.xcarchive \
  -exportOptionsPlist ios/ExportOptions.plist \
  -exportPath /tmp/pe-export
```

With `destination: upload` this uploads directly. For a separate upload step, set
`destination` to `export` and use an App Store Connect API key (App Store Connect → Users and
Access → Integrations → keys; store the `.p8` outside the repo):

```bash
xcrun altool --upload-app -f /tmp/pe-export/*.ipa -t ios \
  --apiKey <KEY_ID> --apiIssuer <ISSUER_ID>
```

> `altool` is deprecated in favour of `xcrun notarytool` for notarization, but app *upload*
> still goes through `altool` or Xcode/Transporter. Notarization does not apply to App Store
> iOS builds — it's a Developer ID/macOS concern. Ignore the `notarytool` reference in P8-4 §6.

---

## 8. TestFlight

1. The build appears in App Store Connect → **TestFlight** after processing (5–30 min).
   You get an email if processing fails.
2. **Export compliance**: `ITSAppUsesNonExemptEncryption: false` is already in the Info.plist,
   so you should not be prompted. If asked, the answer is that the app uses only standard
   HTTPS — exempt.
3. **Internal Testing** → create a group → add yourself → the build auto-distributes. Internal
   testing needs **no** Beta App Review.
4. Install via the TestFlight app on a real device and smoke-test, at minimum:
   - Sign in with Apple, end to end, on a *fresh* Apple ID.
   - Sign in with Google, end to end.
   - Email OTP (if you kept CAPTCHA off).
   - Ask: send a message, confirm streaming, confirm the AI-generated disclosure is visible.
   - Settings → **Delete account** → confirm it succeeds and the app lands signed out, then
     confirm the same account can no longer sign in.
   - iPad: rotate, check the split view.
5. Only add **External Testing** if you want outside testers — that *does* require Beta App
   Review (typically ~24h) and is a reasonable dress rehearsal for the real thing.

---

## 9. Submit for review

1. App Store Connect → your app → **1.0 Prepare for Submission**.
2. **Build** section → **+** → select the TestFlight build.
3. **App Review Information**:
   - **Sign-in required: YES.** Provide working demo credentials. The app gates Ask behind
     auth, so **a reviewer without an account cannot evaluate the app and will reject it.**
     Create a real demo account, verify it signs in *right now*, and make sure it isn't
     rate-limited or quota-exhausted. Prefer an email/OTP account only if OTP works — a
     reviewer cannot receive your OTP email, so **create an email+password or pre-seeded
     account they can actually use**, or supply an Apple/Google test account with credentials.
     This is the highest-risk item on the page; get it right.
   - **Notes**: paste from `docs/ios/store/review-notes.md`. Cover:
     - Answers in Ask are AI-generated; each message has a report action (risk R15).
     - The app contains **no purchases**; quota limits sell nothing and link nowhere (R7).
     - Account deletion lives in Settings → Delete Account (guideline 5.1.1(v)).
     - Sign in with Apple is offered alongside Google (guideline 4.8).
     - Age rating 4+ rationale: educational physics.
   - Contact: your name, phone, email.
4. **Version Release**: "Automatically release" or "Manually release" — manual is the safer
   default for a first launch.
5. **Add for Review** → **Submit**.

Expect *Waiting for Review* → *In Review* → *Pending Developer Release* / *Ready for Sale*.
Typically 24–48 hours.

---

## 10. Rejection risks specific to this app

| Guideline | Risk | Mitigation |
|---|---|---|
| **4.8** Login Services | Offering Google without an equivalent private option | Sign in with Apple ships alongside it ✅ |
| **5.1.1(v)** Account deletion | Deletion must be *in-app* and actually delete | `DeleteAccountSection.swift` + `/api/account/delete` calling `auth.admin.deleteUser` ✅ — **but the endpoint must be committed and deployed** (§5 item 2) |
| **5.1.2** Data use | Privacy policy contradicts nutrition labels | §5 item 3 — the policy currently omits accounts and chat content ⚠️ |
| **2.1** App completeness | Reviewer cannot get past the sign-in wall | §9 step 3 demo account ⚠️ |
| **3.1.1** In-app purchase | Any link to external payment from a quota wall | Never link out from the 402 wall (R7) |
| **1.2 / 4.7** AI content | Generated content with no reporting mechanism | In-app AI disclosure + per-message report action (R15) |
| **2.3.x** Accurate metadata | Screenshots not from the shipping build | Capture from the Release build (§6.5) |
| **5.1.1** Data minimisation | — | No analytics SDK ships; don't add one |

---

## 11. Ordered checklist

**Configuration (can be done today, ~1 hour)**
- [ ] §1.1 Decide on the iOS 26.0 deployment target
- [ ] §1.2 Confirm membership active, role is Admin/Account Holder
- [ ] §1.3 Accept App Store Connect agreements
- [ ] §2.1 Register App ID + enable Sign In with Apple
- [ ] §2.2 Supabase Apple provider: Client IDs = `com.physicsexplained.app`
- [ ] §3.2 Verify web Google sign-in still works
- [ ] §3.3–3.4 Google consent screen published + Web OAuth client (likely already done)
- [ ] §3.5 **Add `physicsexplained://auth-callback` to Supabase Redirect URLs**
- [ ] §4 Decide CAPTCHA; verify OTP template has `{{ .Token }}`
- [ ] §2.3 / §3.6 Test both sign-ins on device

**Code (the real work)**
- [ ] §5.1 Add `PrivacyInfo.xcprivacy`
- [ ] §5.2 Commit + deploy `app/api/account/delete/route.ts`
- [ ] §5.3 Rewrite privacy policy copy to cover accounts + chat content (by hand, all locales)
- [ ] §5.4 Pin `DEVELOPMENT_TEAM` / `CODE_SIGN_STYLE` in `project.yml`
- [ ] §5.5 Write `docs/ios/store/{review-notes,checklist,privacy-labels}.md`
- [ ] §5.6 Bump to `1.0.0` / build `1`
- [ ] §5.7 Run outstanding P8-3 / P8-4 / P8-5 prompts
- [ ] P2–P7 regression sweep on the release candidate

**Store**
- [ ] §6 Create the App Store Connect record (check name availability first)
- [ ] §6.3 App Privacy nutrition labels
- [ ] §6.4 Description, keywords, support URL
- [ ] §6.5 Screenshots — iPhone 6.9" **and** iPad 13"
- [ ] §7.1 Create the Apple Distribution certificate
- [ ] §7.3 Archive → **Validate** → Upload
- [ ] §8 TestFlight internal test, full smoke test on device
- [ ] §9 Demo account (verified working) + review notes → Submit

---

## Appendix — quick reference

```bash
# Regenerate the Xcode project (ALWAYS after editing project.yml)
xcodegen generate --spec ios/project.yml

# Build the packages
swift build --package-path ios/PhysicsPackages

# Simulator build
xcodebuild -project ios/PhysicsExplained.xcodeproj -scheme PhysicsExplained \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' build

# Release archive
xcodebuild -project ios/PhysicsExplained.xcodeproj -scheme PhysicsExplained \
  -destination 'generic/platform=iOS' -configuration Release \
  -archivePath /tmp/pe.xcarchive archive

# Web typecheck (repo has no ESLint config — use tsc)
pnpm tsc --noEmit

# What signing identities exist
security find-identity -v -p codesigning
```

| Value | |
|---|---|
| Bundle ID | `com.physicsexplained.app` |
| Team ID | `F7YY9U667A` (SIMNETIQ LTD) |
| Supabase ref | `cpcgkkedcfbnlfpzutrc` |
| Supabase callback (→ Google) | `https://cpcgkkedcfbnlfpzutrc.supabase.co/auth/v1/callback` |
| App redirect (→ Supabase allow-list) | `physicsexplained://auth-callback` |
| Site | `https://physics.it.com` |

> **Unrelated but worth acting on:** `.env.example:14-19` contains what look like real
> Supabase anon *and* service-role keys, and it is committed. The service-role key bypasses
> RLS entirely. Rotate it in the Supabase dashboard and replace both with placeholders.
