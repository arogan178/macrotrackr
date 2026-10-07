import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { Database } from "bun:sqlite";
import { Elysia } from "elysia";
import Stripe from "stripe";

import { resetConfigCache, setConfigOverrides } from "../../../src/config";
import { initializeSchema } from "../../../src/db/schema";
import { configureSubscriptionService } from "../../../src/modules/billing/subscription-service";
import { webhookHandler } from "../../../src/modules/billing/webhook-handler";
import { createCacheService } from "../../../src/services/cache-service";

const WEBHOOK_SECRET = "whsec_test_fixture_secret";

const PERIOD_END = 1_790_000_000;
const RENEWED_PERIOD_END = 1_792_592_000;

// Shaped like a 2026-09-30.endive payload: the billing period lives on the
// item, and the subscription itself carries no current_period_end.
function subscriptionEvent(
  id: string,
  type: string,
  status: string,
  periodEnd: number,
) {
  return {
    id,
    object: "event",
    api_version: "2026-09-30.endive",
    created: 1_789_000_000,
    livemode: false,
    type,
    data: {
      object: {
        id: "sub_fixture",
        object: "subscription",
        customer: "cus_fixture",
        status,
        cancel_at_period_end: false,
        metadata: { plan: "monthly" },
        items: {
          object: "list",
          data: [
            {
              id: "si_fixture",
              object: "subscription_item",
              current_period_start: periodEnd - 2_592_000,
              current_period_end: periodEnd,
              price: {
                id: "price_monthly",
                object: "price",
                currency: "usd",
                unit_amount: 499,
                recurring: { interval: "month", interval_count: 1 },
              },
            },
          ],
        },
      },
    },
  };
}

describe("Stripe webhook replay", () => {
  let db: Database;
  let app: { handle: (request: Request) => Promise<Response> };
  const signer = new Stripe("sk_test_fixture");

  const deliver = async (event: object, secret = WEBHOOK_SECRET) => {
    const payload = JSON.stringify(event);
    const signature = await signer.webhooks.generateTestHeaderStringAsync({
      payload,
      secret,
    });
    const response = await app.handle(
      new Request("http://localhost/api/billing/webhook", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "stripe-signature": signature,
        },
        body: payload,
      }),
    );
    return { status: response.status, body: await response.json() };
  };

  const subscriptionRow = () =>
    db
      .query(
        "SELECT s.status, s.current_period_end, u.subscription_status FROM subscriptions s JOIN users u ON u.id = s.user_id",
      )
      .get();

  beforeAll(() => {
    setConfigOverrides({
      STRIPE_SECRET_KEY: "sk_test_fixture",
      STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET,
    });
    db = new Database(":memory:");
    initializeSchema(db);
    db.exec(
      "INSERT INTO users (first_name, last_name, email, password, stripe_customer_id) VALUES ('Ada', 'L', 'ada@local.invalid', 'x', 'cus_fixture')",
    );
    configureSubscriptionService({ db, cacheService: createCacheService() });
    app = new Elysia().decorate("db", db).use(webhookHandler);
  });

  afterAll(() => resetConfigCache());

  it("rejects a payload signed with another secret", async () => {
    const result = await deliver(
      subscriptionEvent("evt_forged", "customer.subscription.created", "active", PERIOD_END),
      "whsec_someone_else",
    );

    expect(result).toEqual({
      status: 400,
      body: { received: false, error: "Signature verification failed" },
    });
  });

  it("starts Pro from customer.subscription.created with the item's period end", async () => {
    const result = await deliver(
      subscriptionEvent("evt_created", "customer.subscription.created", "active", PERIOD_END),
    );

    expect(result.status).toBe(200);
    expect(subscriptionRow()).toEqual({
      status: "active",
      current_period_end: "2026-09-21T14:13:20.000Z",
      subscription_status: "pro",
    });
  });

  it("skips a redelivered event id", async () => {
    const result = await deliver(
      subscriptionEvent("evt_created", "customer.subscription.created", "past_due", PERIOD_END),
    );

    expect(result.body).toEqual({
      received: true,
      duplicate: true,
      eventId: "evt_created",
    });
    expect(subscriptionRow()).toEqual({
      status: "active",
      current_period_end: "2026-09-21T14:13:20.000Z",
      subscription_status: "pro",
    });
  });

  it("moves the period end on renewal", async () => {
    await deliver(
      subscriptionEvent("evt_renewed", "customer.subscription.updated", "active", RENEWED_PERIOD_END),
    );

    expect(subscriptionRow()).toEqual({
      status: "active",
      current_period_end: "2026-10-21T14:13:20.000Z",
      subscription_status: "pro",
    });
  });

  it("drops Pro when a renewal payment fails", async () => {
    await deliver(
      subscriptionEvent("evt_past_due", "customer.subscription.updated", "past_due", RENEWED_PERIOD_END),
    );

    expect(subscriptionRow()).toEqual({
      status: "past_due",
      current_period_end: "2026-10-21T14:13:20.000Z",
      subscription_status: "free",
    });
  });

  it("cancels on customer.subscription.deleted", async () => {
    await deliver(
      subscriptionEvent("evt_deleted", "customer.subscription.deleted", "canceled", RENEWED_PERIOD_END),
    );

    expect(subscriptionRow()).toEqual({
      status: "canceled",
      current_period_end: "2026-10-21T14:13:20.000Z",
      subscription_status: "canceled",
    });
  });

  it("acknowledges events it does not act on", async () => {
    const result = await deliver({
      id: "evt_invoice_paid",
      object: "event",
      api_version: "2026-09-30.endive",
      created: 1_789_000_000,
      livemode: false,
      type: "invoice.paid",
      data: { object: { id: "in_fixture", object: "invoice" } },
    });

    expect(result).toEqual({
      status: 200,
      body: {
        received: true,
        format: "snapshot",
        eventType: "invoice.paid",
        eventId: "evt_invoice_paid",
      },
    });
  });

  it("verifies thin event notifications", async () => {
    const result = await deliver({
      id: "evt_thin",
      object: "v2.core.event",
      type: "v1.invoice.paid",
      livemode: false,
      created: "2026-09-30T00:00:00.000Z",
      related_object: {
        id: "in_fixture",
        type: "invoice",
        url: "/v1/invoices/in_fixture",
      },
    });

    expect(result).toEqual({
      status: 200,
      body: {
        received: true,
        format: "thin",
        eventType: "v1.invoice.paid",
        eventId: "evt_thin",
      },
    });
  });
});
