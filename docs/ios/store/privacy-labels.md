# App Privacy (nutrition labels) — Physics.explained (iOS)

The exact answers to give in **App Store Connect → App Privacy**. These must stay
consistent with **`ios/App/PrivacyInfo.xcprivacy`** (the binary's manifest) and the
**website privacy policy** (`physics.it.com/en/privacy`) — App Review cross-checks
all three. Updated in P10 to add **Purchases** (the subscription).

**Tracking: No.** No data is used to track you across apps/websites owned by other
companies. No analytics or ad SDK ships in the app.

## Data types collected

| Data type (ASC category) | Collected | Linked to identity | Used for tracking | Purpose |
|---|---|---|---|---|
| **Contact Info → Email Address** | Yes | **Yes** | No | App Functionality (account/auth) |
| **Identifiers → User ID** | Yes | **Yes** | No | App Functionality (account, entitlement join key) |
| **User Content → Other User Content** (AI chat messages) | Yes | **Yes** | No | App Functionality (the Ask tutor) |
| **Purchases → Purchase History** | Yes | **Yes** | No | App Functionality (subscription entitlement) |

Notes:
- **Purchase History** is new in P10. It is tied to the account (the RevenueCat
  app-user-id **is** the Supabase user id), so it is declared **linked to
  identity** — even though RevenueCat's own SDK manifest marks its collection
  `Linked = false` (the SDK reports at the anonymous-SDK level; our app links it to
  the signed-in account). App Functionality only, no tracking.
- No location, contacts, browsing history, health, financial info (card data is
  handled entirely by Apple — the app never sees it), diagnostics, or advertising
  data is collected.

## Required-reason APIs (declared in `PrivacyInfo.xcprivacy`)

| API category | Reason code | Declared by |
|---|---|---|
| `NSPrivacyAccessedAPICategoryUserDefaults` | `CA92.1` | app + RevenueCat, GRDB, supabase-swift (read/write only the app's own defaults) |

## Manifest ↔ label mapping

The `NSPrivacyCollectedDataTypes` array in `ios/App/PrivacyInfo.xcprivacy` mirrors
the table above:
`NSPrivacyCollectedDataTypeEmailAddress`, `…UserID`,
`…OtherUserContent`, `…PurchaseHistory` — each `Linked = true`, `Tracking = false`,
purpose `AppFunctionality`. `NSPrivacyTracking = false`, and
`NSPrivacyTrackingDomains` is empty/absent.
