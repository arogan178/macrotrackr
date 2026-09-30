# Billing

## Sub-features

- Pro paywall impression
- Pricing plan choice
- Checkout-session request

## How to get to it (user POV)

As a free user, open Analytics, select a locked 30-day range, choose `Upgrade
to Pro`, and then choose a plan on `/pricing`.

## Driving it with Playwright

The managed canary asserts the upgrade modal, waits for the real
`/api/billing/checkout` response, and verifies both `paywall_viewed` and
`checkout_started` in PostHog.

## Gotchas

- Enabling this against production creates a live Stripe checkout session but
  does not submit payment.
- Prefer a managed staging URL backed by a Stripe sandbox when one exists.
