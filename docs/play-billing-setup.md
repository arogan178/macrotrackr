# Google Play Billing Setup

Everything in this file is console and dashboard work that cannot be done from
the repo. The code is already in place: this is the configuration it needs to
come alive.

The shape of the system: **Play sells Pro in the Android app, Stripe sells Pro
on the web, and one entitlement covers both.** Whichever provider took the
money, `resolveEntitlements()` in `shared/entitlements.ts` sees only a
subscription status, so buying in the app unlocks the web and the other way
round.

---

## What talks to what

| Piece | Where it lives | Job |
| :--- | :--- | :--- |
| `PlayBillingPlugin.java` | `frontend/android/app/src/main/java/com/macrotrackr/app/` | Opens Play's purchase sheet, returns a purchase token |
| `playBilling.ts` | `frontend/src/services/native/` | Bridge to the plugin, normalises outcomes |
| `POST /api/billing/play/verify` | `backend/src/modules/billing/routes.ts` | Client hands over the token, server grants Pro |
| `play-service.ts` | `backend/src/modules/billing/` | Asks Google what the token is worth, acknowledges it |
| `POST /api/billing/play/rtdn/:secret` | `backend/src/modules/billing/play-webhook-handler.ts` | Renewals, cancellations, expiries |
| `GET /api/billing/capabilities` | `backend/src/modules/billing/routes.ts` | Tells the client what it may sell |
| `GET /api/billing/play/account-token` | `backend/src/modules/billing/routes.ts` | Opaque account token passed to Play at purchase time |
| `useCanPurchaseHere` | `frontend/src/features/billing/hooks/` | Draws an upgrade button only when a purchase can succeed |

The client is never trusted. It only ever sends a purchase token, and the server
decides entitlement from Google's answer.

---

## 1. Create the subscription products

In **Play Console → Monetise → Subscriptions**, create two subscriptions. The
product IDs must match what you put in the environment variables later.

| Product ID | Base plan | Price |
| :--- | :--- | :--- |
| `pro_monthly` | monthly, auto-renewing | €3.99 |
| `pro_yearly` | yearly, auto-renewing | €29.99 |

Prices come from `shared/pricing.ts`. Keep them in step with Stripe, or the same
Pro plan costs different amounts depending on where someone taps Upgrade.

Each subscription needs at least one **active base plan**. A product with no
active base plan returns no offers, and the plugin will reject with
`Subscription pro_monthly has no purchasable offer`.

> The code passes an optional `basePlanId`. Leave it unset and the first offer
> Play returns is used, which is what you want with one base plan per product.

## 2. Service account for the Play Developer API

The server needs to read purchases. That means a Google Cloud service account
with access to your Play account.

1. **Google Cloud Console → IAM & Admin → Service Accounts → Create.**
   No project roles are needed. It only needs the Play grant in step 3.
2. **Keys → Add key → JSON.** Download it. This is the only copy.
3. **Play Console → Users and permissions → Invite new user**, using the service
   account's email. Grant, at the account level:
   - **View app information and download bulk reports**
   - **View financial data, orders, and cancellation survey responses**

   Financial data is the one people miss. Without it every purchase lookup
   returns 401 and nothing can be verified.
4. **Play Console → Monetise → Monetisation setup**, confirm the linked Google
   Cloud project is the one holding the service account.

Permission changes can take a few hours to propagate. A fresh service account
returning 401 is usually patience rather than misconfiguration.

## 3. Real-time Developer Notifications

Without this, a cancellation or expiry never reaches the server and someone
keeps Pro after they stop paying.

1. **Google Cloud → Pub/Sub → Create topic**, for example
   `play-billing-notifications`.
2. Grant `google-play-developer-notifications@system.gserviceaccount.com` the
   **Pub/Sub Publisher** role on that topic. Play cannot publish without it.
3. **Create a push subscription** on the topic:
   - Delivery type: **Push**
   - Endpoint URL:
     `https://<your-api-host>/api/billing/play/rtdn/<GOOGLE_PLAY_RTDN_SECRET>`
   - Leave authentication off. The secret in the path is what authenticates the
     request.
4. **Play Console → Monetise → Monetisation setup → Real-time developer
   notifications**, paste the topic name, then **Send test notification**.

A successful test logs `Play test notification received, configuration works`
and returns `{ received: true, test: true }`.

> The secret in the URL is the whole of the authentication, so treat it like a
> password. Pub/Sub cannot sign its payloads the way Stripe signs webhooks,
> which is why the endpoint also re-reads every purchase from Google instead of
> believing the message body.

## 4. Environment variables

Backend, wherever the API runs:

```bash
PLAY_BILLING_MODE=enabled
GOOGLE_PLAY_PACKAGE_NAME=com.macrotrackr.app
# The service account JSON from step 2, as one line.
GOOGLE_PLAY_SERVICE_ACCOUNT_JSON='{"type":"service_account", ... }'
# Long random string. Must match the path in the Pub/Sub push URL.
GOOGLE_PLAY_RTDN_SECRET=<random>
GOOGLE_PLAY_PRODUCT_ID_MONTHLY=pro_monthly
GOOGLE_PLAY_PRODUCT_ID_YEARLY=pro_yearly
```

Frontend, at Android build time:

```bash
VITE_GOOGLE_PLAY_PRODUCT_ID_MONTHLY=pro_monthly
VITE_GOOGLE_PLAY_PRODUCT_ID_YEARLY=pro_yearly
```

`PLAY_BILLING_MODE=enabled` makes the five `GOOGLE_PLAY_*` values mandatory.
Startup fails with a list of what is missing rather than booting into a state
where purchases silently fail.

Leave `PLAY_BILLING_MODE` unset and nothing changes: `/play/verify` refuses,
the RTDN endpoint is not mounted, and the web keeps selling through Stripe.

### The interlock

Three things have to agree before the app offers Pro for sale, and they are
checked in that order by `useCanPurchaseHere`:

1. **the platform** — Play Billing only exists in the Android build
2. **the build** — the two `VITE_GOOGLE_PLAY_PRODUCT_ID_*` values must be
   compiled in
3. **the server** — `GET /api/billing/capabilities` must report `play: true`

If any of them says no, the Pro card renders with **no button at all**. This is
deliberate. Play Console products are configured independently of this server,
so a build with `PLAY_BILLING_MODE=disabled` could otherwise complete a real
purchase and then have `/play/verify` refuse it, which is money taken for
nothing. The check fails closed: while the capabilities request is in flight or
if it errors, nothing is offered for sale.

This also gives you the Netflix-style shape for free. Ship the Android app with
`PLAY_BILLING_MODE=disabled` and it sells nothing, honours any Pro the account
already has from the web, and shows no dead buttons.

## 5. Build and upload

Play Billing does not work in a debug build installed over a cable. The app must
be **signed with the same key as the uploaded build** and installed **from Play**,
even for testing.

```bash
cd frontend
bun run build
bunx cap sync android
cd android && ./gradlew bundleRelease
```

Upload the `.aab` to an **internal testing** track, add your account as a
tester, and install through the Play link. Then add the account under
**Monetise → Licence testing** so purchases are free and renew on a fast
schedule.

> `bunx cap sync android` regenerates `capacitor.config.json` inside
> `android/` and `ios/`. Those files are gitignored build artifacts. Edit
> `frontend/capacitor.config.ts` instead, never the generated copies.

---

## Verifying it end to end

1. Install from the internal testing track with a licence-test account.
2. Tap Upgrade in the app. Play's purchase sheet opens.
3. Complete the purchase. The app calls `/play/verify`.
4. Server logs `Verified Google Play purchase` with `isTestPurchase: true`.
5. Pro unlocks. Sign in **on the web** with the same account: Pro is there too.
   That is the cross-platform entitlement working.
6. Cancel in the Play Store. An RTDN arrives and logs
   `Applied Play notification`.
7. Access continues until the period ends, which is correct. Play's `CANCELED`
   means auto-renew is off, not that access stopped.

## Things that are meant to happen

**Someone who pays on the web taps Upgrade in the app.** `/play/verify` refuses
with a message telling them billing is already on the web. They are not charged
twice.

**Someone who pays through Play opens billing settings on the web.** They get
"Manage in Google Play" instead of the Stripe portal, because Google owns that
billing relationship and our cancel endpoint cannot touch it.

**A purchase token is offered by a second account.** Refused. One purchase, one
account.

**Payment succeeds but `/play/verify` fails.** The user is told their payment
went through and Pro will follow, rather than "try again". Three things recover
it, in the order they fire:

1. The purchase carries an **obfuscated account token**, fetched from
   `/api/billing/play/account-token` before the sheet opens. Play echoes it
   back on every notification, so the RTDN handler resolves the account
   directly and Pro appears without the app doing anything.
2. On a resubscribe, `linkedPurchaseToken` points at the previous purchase,
   which is already attached to the account.
3. `getUnverifiedPurchases()` on next app start asks Play what it is holding
   and claims it.

The token is random per account, stored in `users.play_obfuscated_account_id`
under a unique index, and never rotated. Rotating it would orphan purchases
made under the old value. It carries nothing about the account, so it is safe
to hand to Google, which is the point of the name.

**A purchase is never acknowledged.** Google refunds it after three days. The
server acknowledges inside `/play/verify`, right after recording the
subscription, which is why verification failing is worth alerting on.

---

## Troubleshooting

| Symptom | Cause |
| :--- | :--- |
| `Subscription pro_monthly is not available` | Product inactive, ID mismatch, or the build is not from a track that can see it |
| `has no purchasable offer` | The subscription has no active base plan |
| 401 from the Play Developer API | Service account missing **View financial data**, or permissions have not propagated yet |
| Purchase sheet will not open | Build not installed from Play, or signed with a different key |
| RTDN endpoint returns 403 | `GOOGLE_PLAY_RTDN_SECRET` does not match the URL path in the push subscription |
| RTDN endpoint returns 404 | `PLAY_BILLING_MODE` is not `enabled` |
| `No account matches this Play purchase token yet` | Notification arrived before the app claimed the purchase. Harmless: the app's verify call attaches it |
| Play retries the same notification | The handler returned 500. Check the log line above it for the real failure |

## Not covered here

**iOS.** There is no StoreKit path. The iOS build has no purchase flow, and
Apple's rules differ from Google's. Selling Pro on iOS is a separate piece of
work.
