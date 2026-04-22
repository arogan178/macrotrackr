# Stripe Webhook Setup (Managed Profile)

Stripe webhooks are only active when:

- `APP_MODE=managed`
- `AUTH_MODE=clerk`
- `BILLING_MODE=managed`

In `self-hosted` profile (`BILLING_MODE=disabled`), billing routes are unmounted and return `404` by absence.

## Required backend env vars (managed only)

```env
STRIPE_SECRET_KEY=sk_test_replace_me
STRIPE_WEBHOOK_SECRET=whsec_replace_me
STRIPE_PRICE_ID_MONTHLY=price_replace_me
STRIPE_PRICE_ID_YEARLY=price_replace_me
```

## Endpoint

Configure Stripe to send events to:

`POST /api/billing/webhook`

## Suggested events

- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `checkout.session.completed`

## Local testing

```bash
stripe login
stripe listen --forward-to localhost:3000/api/billing/webhook
```

Use Stripe test events after starting backend in managed profile.
