// test-webhooks.js - Test script for both Stripe webhook formats
import crypto from "crypto";

// Mock webhook secret (replace with your actual secret for testing)
const WEBHOOK_SECRET =
  "whsec_33cd92d28c76f02aca381a90ad13f820f2b7e50d212fb762c76f4c8651646598";

// Sample Snapshot (v1) webhook event
const snapshotEvent = {
  id: "evt_1234567890",
  object: "event",
  api_version: "2025-05-28.basil",
  created: 1686089970,
  data: {
    object: {
      id: "sub_1234567890",
      object: "subscription",
      customer: "cus_1234567890",
      status: "active",
      current_period_end: 1688681970,
      items: {
        data: [
          {
            price: {
              id: "price_1234567890",
            },
          },
        ],
      },
    },
  },
  livemode: false,
  pending_webhooks: 1,
  request: {
    id: null,
    idempotency_key: null,
  },
  type: "customer.subscription.created",
};

// Sample Thin (v2) webhook event
const thinEvent = {
  id: "evt_abc123xyz",
  object: "v2.core.event",
  type: "v1.billing.subscription.created",
  livemode: false,
  created: "2024-09-17T06:20:52.246Z",
  related_object: {
    id: "sub_1234567890",
    type: "billing.subscription",
    url: "/v1/subscriptions/sub_1234567890",
  },
};

// Function to generate Stripe signature
function generateStripeSignature(payload, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const payloadString = JSON.stringify(payload);
  const signedPayload = `${timestamp}.${payloadString}`;
  const signature = crypto
    .createHmac("sha256", secret)
    .update(signedPayload, "utf8")
    .digest("hex");

  return `t=${timestamp},v1=${signature}`;
}

// Test function
async function testWebhook(event, description) {
  console.log(`\n🧪 Testing ${description}`);
  console.log("📋 Event:", JSON.stringify(event, null, 2));

  const signature = generateStripeSignature(event, WEBHOOK_SECRET);
  console.log("🔐 Generated signature:", signature);

  try {
    const response = await fetch("http://localhost:3000/api/billing/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Stripe-Signature": signature,
      },
      body: JSON.stringify(event),
    });

    const result = await response.json();
    console.log(`✅ Response (${response.status}):`, result);
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

// Main test function
async function runTests() {
  console.log("🚀 Starting Stripe Webhook Format Tests");
  console.log("📚 Testing both Snapshot (v1) and Thin (v2) webhook formats");

  // Test 1: Snapshot event
  await testWebhook(
    snapshotEvent,
    "Snapshot (v1) Event - customer.subscription.created"
  );

  // Test 2: Thin event
  await testWebhook(
    thinEvent,
    "Thin (v2) Event - v1.billing.subscription.created"
  );

  console.log("\n🎉 Webhook format tests completed!");
  console.log("\n💡 Next steps:");
  console.log("   1. Start your backend server: bun run dev");
  console.log("   2. Run this test: node test-webhooks.js");
  console.log("   3. Check your server logs for webhook processing");
  console.log("   4. Set up actual webhooks in Stripe Dashboard");
}

// Run tests if script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export { testWebhook, generateStripeSignature };
