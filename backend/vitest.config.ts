import { fileURLToPath } from "node:url";
import { defineConfig } from 'vitest/config'

process.env.STRIPE_SECRET_KEY = "test_stripe_key";
process.env.STRIPE_WEBHOOK_SECRET = "test_stripe_webhook_secret";
process.env.STRIPE_PRICE_ID_MONTHLY = "price_monthly";
process.env.STRIPE_PRICE_ID_YEARLY = "price_yearly";
process.env.RESEND_API_KEY = "test_resend_api_key_placeholder";
process.env.CLERK_PUBLISHABLE_KEY = "pk_test_123";
process.env.CLERK_SECRET_KEY = "sk_test_123";
process.env.APP_MODE = "managed";
process.env.AUTH_MODE = "clerk";
process.env.BILLING_MODE = "managed";
process.env.ANALYTICS_MODE = "disabled";
process.env.EMAIL_MODE = "disabled";
process.env.APP_URL = "http://localhost:5173";
process.env.PUBLIC_APP_NAME = "Macro Trackr";
process.env.SUPPORT_EMAIL = "support@local.invalid";
process.env.ENABLE_METRICS = "false";
process.env.NODE_ENV = "test";

export default defineConfig({
  resolve: {
    alias: {
      "@shared": fileURLToPath(new URL("../shared", import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    env: {
      STRIPE_SECRET_KEY: "test_stripe_key",
      STRIPE_WEBHOOK_SECRET: "test_stripe_webhook_secret",
      STRIPE_PRICE_ID_MONTHLY: "price_monthly",
      STRIPE_PRICE_ID_YEARLY: "price_yearly",
      RESEND_API_KEY: "test_resend_api_key_placeholder",
      CLERK_PUBLISHABLE_KEY: "pk_test_123",
      CLERK_SECRET_KEY: "sk_test_123",
      APP_MODE: "managed",
      AUTH_MODE: "clerk",
      BILLING_MODE: "managed",
      ANALYTICS_MODE: "disabled",
      EMAIL_MODE: "disabled",
      APP_URL: "http://localhost:5173",
      PUBLIC_APP_NAME: "Macro Trackr",
      SUPPORT_EMAIL: "support@local.invalid",
      ENABLE_METRICS: "false",
      NODE_ENV: "test"
    },
    setupFiles: ['./vitest.setup.ts'],
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
    exclude: ['node_modules', 'dist', 'tests/contracts/*.integration.test.ts', 'tests/contracts/elysia-integration.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        'tests/**',
        'src/**/*.test.ts',
        '*.config.ts',
      ],
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
})
