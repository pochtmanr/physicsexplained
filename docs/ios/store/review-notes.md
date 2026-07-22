# App Review notes — Physics.explained (iOS)

Paste the relevant parts of this file into **App Store Connect → your app →
Version → App Review Information → Notes**. Items tagged `[USER supplies]` are
handed over by the account owner (demo credentials, screenshots); the rest is
copy-ready.

---

## Demo / sandbox account `[USER supplies]`

**Sign-in is required to evaluate the app** — the AI tutor (Ask) is gated behind
auth, so a reviewer without an account cannot get past it. Provide a working
account in the review form:

- **Email + password (or pre-seeded) account** the reviewer can use directly — do
  **not** rely on email OTP (the reviewer cannot receive the code) unless a code
  is supplied out of band.
- Verify it signs in **right now**, is not rate-limited, and has quota left so Ask
  answers on the first try.
- For the subscription/paywall check, provide a **Sandbox Apple ID**
  (App Store Connect → Users and Access → Sandbox → Testers) so the reviewer can
  exercise a purchase + **Restore Purchases** without a real charge.

> Where things live: **Ask** is the tutor chat tab (sign-in prompted on first
> send). **Account/subscription** controls are under **Settings → Account**.
> **Delete account** is under **Settings → Delete Account**.

---

## 1. AI-generated content (Guidelines 1.2 / 4.7 — Risk R15)

- Answers in **Ask** are **AI-generated** by a physics tutor model. This is
  disclosed in-app (a persistent "Answers are AI-generated" note in Ask) and in
  the App Store description.
- Every assistant message has a **"Report this answer"** action (⋯ / long-press).
- Scope is constrained to physics tutoring; the server refuses off-topic and
  injection prompts. Ask is **auth-gated** (no anonymous generation).

## 2. In-app purchases & subscriptions (Guidelines 2.1 / 3.1.1 — Risk R7, reframed in P10)

The app offers **two auto-renewable subscriptions** via **Apple In-App Purchase**,
brokered by **RevenueCat**:

| Plan | Product ID | Duration | Price* |
|---|---|---|---|
| **Starter** | `com.physicsexplained.app.starter.monthly` | 1 month | $5.99 |
| **Pro** | `com.physicsexplained.app.pro.monthly` | 1 month | $19.99 |

\* Prices are whatever is set in App Store Connect; the paywall reads price + period
live from StoreKit and never hardcodes them.

- Both products are in **one subscription group** (`Physics Explained`), so a user
  holds at most one and upgrades/downgrades between them.
- The **paywall** (opened from the quota wall's "See plans" CTA and from
  **Settings → Account → Upgrade**) shows the required auto-renewable metadata —
  title, duration, price, an **auto-renew disclosure**, and functional **Terms
  (EULA)** and **Privacy** links — and a **Restore Purchases** button.
- **Restore Purchases is implemented** (paywall + it re-reads the account after).
- Entitlements are **brokered by RevenueCat** and reconciled server-side into the
  same `user_billing` account the web uses. **A subscription bought on the web
  (Revolut) and one bought on iOS (Apple) resolve to one account** — so a
  reviewer's account may already show a plan "Managed on the web" (read-only, no
  external link) if it was purchased there.
- **No external or web payment link appears anywhere in the app.** The only
  "manage" affordance is the **Apple system manage-subscriptions sheet**
  (`Settings → Account → Manage subscription` for Apple subscribers).

## 3. Sign in with Apple (Guideline 4.8)

Sign in with Apple ships **alongside** Google and email OTP. Apple is offered as
the equivalent private sign-in option required whenever a third-party login exists.

## 4. Account deletion (Guideline 5.1.1(v))

In-app at **Settings → Delete Account** → destructive confirm → server calls
`auth.admin.deleteUser` and purges the user's rows. If the account holds an active
paid plan, the flow warns that the subscription must be managed with the payment
provider first (no external link). Deletion is real, not a soft-flag.

## 5. Age rating

**4+.** Educational physics content only — no objectionable material. Rationale:
the app is a reference/education product (knowledge base + AI physics tutor).

## 6. Privacy

Data collected: **email** and **User ID** (app functionality, linked to identity),
**AI chat content** (user content, linked to identity), and **purchase history**
(linked to identity, via the subscription). **No tracking, no ads, no analytics
SDK.** See `docs/ios/store/privacy-labels.md`; the nutrition labels,
`PrivacyInfo.xcprivacy`, and the website privacy policy are kept consistent.

## 7. Export compliance

`ITSAppUsesNonExemptEncryption: false` (standard HTTPS only) — exempt.
