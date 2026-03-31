import { vi } from "vitest";

process.env.JWT_SECRET = "test_jwt_secret_must_be_long_enough_32_chars";
process.env.STRIPE_SECRET_KEY = "test_stripe_key";
process.env.STRIPE_WEBHOOK_SECRET = "test_stripe_webhook_secret";
process.env.STRIPE_PRICE_ID_MONTHLY = "price_monthly";
process.env.STRIPE_PRICE_ID_YEARLY = "price_yearly";
process.env.RESEND_API_KEY = "test_resend_api_key_placeholder";
process.env.CLERK_PUBLISHABLE_KEY = "pk_test_123";
process.env.CLERK_SECRET_KEY = "sk_test_123";
process.env.NODE_ENV = "test";
